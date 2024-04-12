/**
 * Deletes all triggers associated with a specified function.
 * @param {string} functionName - The name of the function for which triggers should be deleted.
 */
function deleteTriggers(functionName) {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.isDisabled() || (trigger.getHandlerFunction() === functionName &&
      JSON.stringify(trigger.getHandlerFunction()) === JSON.stringify(functionName))) {
      ScriptApp.deleteTrigger(trigger);
    }
  });
}

/**
 * Creates a new time-based trigger for a specified function at the given date and time.
 * @param {string} functionName - The name of the function to be triggered.
 * @param {Date} dateTime - The date and time when the trigger should fire.
 * @returns {Trigger|null} The created trigger if successful, or null if unsuccessful.
 */
function setTrigger(functionName, dateTime) {
  const newTrigger = ScriptApp.newTrigger(functionName)
    .timeBased()
    .at(dateTime);

  return newTrigger.create();
}

/**
 * Retrieves release calendar data from Google Sheets for the specified release type.
 * 
 * @param {string} releaseType - The type of release calendar to retrieve ("Weekly" or "Monthly").
 * @returns {Object|null} Release calendar data object for the specified release type, or null if not found.
 */
function getReleaseCalendar(releaseType) {
  // Open the spreadsheet and get the sheet by name
  const spreadsheet = SpreadsheetApp.openById(RELEASE_SHEET_ID);
  const sheet = spreadsheet.getSheetByName(RELEASE_SHEET_NAME);

  // Get current date
  const currentDate = new Date();

  // Get headers and data from the sheet
  const [headers, ...data] = sheet.getRange(3, 1, sheet.getLastRow() - 2, sheet.getLastColumn()).getValues();

  // Retrieve indices of relevant columns
  const releaseTypeIndex = headers.indexOf("Release Type");
  const versionIndex = headers.indexOf("Version");
  const codeFreezeIndex = headers.indexOf("Code Freeze");
  const releaseDateIndex = headers.indexOf("Prod Deploy & Sanity");
  const actualReleaseDateIndex = headers.indexOf("Actual Release Date");

  // Map data rows to release calendar objects, reverse the array and filter based on current date
  const releaseCalendars = data.reverse().map(row => ({
    releaseType: row[releaseTypeIndex] || "",
    version: (row[versionIndex] || "").toLowerCase(),
    codeFreezeDate: endOfDate(row[codeFreezeIndex]),
    releaseDate: endOfDate(row[releaseDateIndex]),
    actualReleaseDate: endOfDate(row[actualReleaseDateIndex]),
  })).filter(({ releaseDate, actualReleaseDate }) => releaseDate >= currentDate || !actualReleaseDate);

  if (releaseType === 'Weekly' && releaseCalendars[0].releaseType === 'Monthly') {
    return null;
  }

  return releaseCalendars.find(releaseCalendar => releaseCalendar.releaseType === releaseType);
}

/**
 * Sets reminders for the weekly release code freeze date.
 * Retrieves the release calendar for the weekly release, calculates reminder dates
 * based on the code freeze date, deletes existing triggers for
 * sending weekly release reminders, and sets new triggers for the calculated reminder dates.
 * If no weekly release calendar is found, the function logs a message
 * indicating that the reminder setting process is skipped.
 */
function setWeeklyReleaseReminder() {
  // Retrieve the release calendar for the weekly release
  const calendar = getReleaseCalendar('Weekly');

  // Check if a weekly release calendar is found
  if (!calendar) {
    Logger.log("Skipping reminder setting: No weekly release calendar found.");
    return;
  }

  // Extract code freeze date from the calendar
  const { codeFreezeDate } = calendar;

  // Calculate reminder dates for weekly release reminders
  const reminderDates = calculateDatesBefore(codeFreezeDate, [1, 2, 3]);

  // Delete existing triggers for sending weekly release reminders
  deleteTriggers('sendWeeklyReleaseReminder');

  // Set new triggers for the calculated reminder dates
  const currentDate = new Date();
  reminderDates.forEach(reminderDate => {
    if (reminderDate < currentDate) {
      Logger.log(`Skipping trigger setting for the date ${reminderDate.toDateString()}`);
      return;
    }

    // Set the trigger time to 11:11 AM
    reminderDate.setHours(11);
    reminderDate.setMinutes(11);

    // Set the trigger for sending weekly release reminders
    setTrigger('sendWeeklyReleaseReminder', reminderDate);
  });
}

/**
 * Sets reminders for the monthly release and feature code freeze dates.
 * Retrieves the release calendar for the monthly release, calculates reminder dates
 * based on the release and code freeze dates, deletes existing triggers for
 * sending monthly release reminders, and sets new triggers for the calculated reminder dates.
 * If no monthly release calendar is found, the function logs a message
 * indicating that the reminder setting process is skipped.
 */
function setMonthlyReleaseReminder() {
  // Retrieve the release calendar for the monthly release
  const calendar = getReleaseCalendar('Monthly');

  // Check if a monthly release calendar is found
  if (!calendar) {
    Logger.log("Skipping reminder setting: No monthly release calendar found.");
    return;
  }

  // Extract release and code freeze dates from the calendar
  const { releaseDate, codeFreezeDate } = calendar;

  // Calculate reminder dates for release and code freeze reminders
  const releaseReminderDates = calculateDatesBefore(releaseDate, [2, 3, 4]);
  const codeFreezeReminderDates = calculateDatesBefore(codeFreezeDate, [1, 2, 4, 6, 8]);

  // Delete existing triggers for sending monthly release reminders
  deleteTriggers('sendMonthlyReleaseReminder');

  // Set new triggers for the calculated reminder dates
  const currentDate = new Date();
  [...codeFreezeReminderDates, ...releaseReminderDates].forEach(reminderDate => {
    if (reminderDate < currentDate) {
      Logger.log(`Skipping trigger setting for the date ${reminderDate.toDateString()}`);
      return;
    }

    // Set the trigger time to 11:11 AM
    reminderDate.setHours(11);
    reminderDate.setMinutes(11);

    // Set the trigger for sending monthly release reminders
    setTrigger('sendMonthlyReleaseReminder', reminderDate);
  });

  const lastReminderDates = [codeFreezeReminderDates[0], releaseReminderDates[0]];
  lastReminderDates.forEach(reminderDate => {
    if (reminderDate < currentDate) {
      Logger.log(`Skipping trigger setting for the date ${reminderDate.toDateString()}`);
      return;
    }

    // Set the trigger time to 11:11 AM
    reminderDate.setHours(17);
    reminderDate.setMinutes(17);

    // Set the trigger for sending monthly release reminders
    setTrigger('sendMonthlyReleaseReminder', reminderDate);
  });
}

/**
 * Sends a reminder message for the weekly release.
 * Retrieves the release calendar for the weekly release, generates a message
 * based on the release information, and posts the message to Slack.
 * If no weekly release calendar is found, the function logs a message
 * indicating that the reminder is skipped.
 */
function sendWeeklyReleaseReminder() {
  // Retrieve the release calendar for the weekly release
  const calendar = getReleaseCalendar('Weekly');

  // Check if a weekly release calendar is found
  if (!calendar) {
    Logger.log("Skipping reminder: No weekly release calendar found.");
    return;
  }

  // Extract release information from the calendar
  const { version, codeFreezeDate, releaseDate } = calendar;

  // Generate release message
  const message = generateReleaseMessage(version, {
    isWeeklyRelease: true,
    isFCTPeriod: false,
    releaseDate,
    codeFreezeDate,
  });

  // Post the release message to Slack
  postSlackMessage(message);
}

/**
 * Sends a reminder message for the monthly release.
 * Retrieves the release calendar for the monthly release, generates a message
 * based on the release information, and posts the message to Slack.
 * If no monthly release calendar is found, the function logs a message
 * indicating that the reminder is skipped.
 */
function sendMonthlyReleaseReminder() {
  // Retrieve the release calendar for the monthly release
  const calendar = getReleaseCalendar('Monthly');

  // Check if a monthly release calendar is found
  if (!calendar) {
    Logger.log("Skipping reminder: No monthly release calendar found.");
    return;
  }

  // Extract release information from the calendar
  const { version, codeFreezeDate, releaseDate } = calendar;

  // Determine if it's a feature code freeze period
  const isFCTPeriod = codeFreezeDate < new Date();

  // Generate release message
  const message = generateReleaseMessage(version, {
    isWeeklyRelease: false,
    isFCTPeriod,
    releaseDate,
    codeFreezeDate,
  });

  // Post the release message to Slack
  postSlackMessage(message);
}
