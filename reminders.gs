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

function setWeeklyReleaseReminder() {
  const calendar = getReleaseCalendar('Weekly');

  if (!calendar) {
    Logger.log('Skip since there\'s no calendar...');
    return;
  }

  const { codeFreezeDate } = calendar;

  const reminderDates = calculateDatesBefore(codeFreezeDate, [1, 2, 3]);
  deleteTriggers('sendWeeklyReleaseReminder');

  const currentDate = new Date();
  reminderDates.forEach(reminderDate => {
    if (reminderDate < currentDate) {
      Logger.log(`Skip the date ${reminderDate.toDateString()}`);
      return;
    }

    reminderDate.setHours(11);
    reminderDate.setMinutes(11);

    setTrigger('sendWeeklyReleaseReminder', reminderDate);
  });
}

function setMonthlyReleaseReminder() {
  const calendar = getReleaseCalendar('Monthly');

  if (!calendar) {
    Logger.log('Skip since there\'s no calendar...');
    return;
  }

  const { releaseDate, codeFreezeDate } = calendar;
  const releaseReminderDates = calculateDatesBefore(releaseDate, [2, 3, 4]);
  const codeFreezeReminderDates = calculateDatesBefore(codeFreezeDate, [1, 2, 4, 6, 8]);
  deleteTriggers('sendMonthlyReleaseReminder');

  const currentDate = new Date();
  [...codeFreezeReminderDates, ...releaseReminderDates].forEach(reminderDate => {
    if (reminderDate < currentDate) {
      Logger.log(`Skip the date ${reminderDate.toDateString()}`);
      return;
    }

    reminderDate.setHours(11);
    reminderDate.setMinutes(11);

    setTrigger('sendMonthlyReleaseReminder', reminderDate);
  });
}

function sendWeeklyReleaseReminder() {
  const calendar = getReleaseCalendar('Weekly');
  if (!calendar) {
    Logger.log('Skip since there\'s no calendar...');
    return;
  }
  const { version, codeFreezeDate, releaseDate } = calendar;
  const message = generateReleaseMessage(version, {
    isWeeklyRelease: true,
    isFCTPeriod: false,
    releaseDate,
    codeFreezeDate,
  });

  postSlackMessage(message);
}

function sendMonthlyReleaseReminder() {
  const calendar = getReleaseCalendar('Monthly');
  if (!calendar) {
    Logger.log('Skip since there\'s no calendar...');
    return;
  }
  const { version, codeFreezeDate, releaseDate } = calendar;
  const isFCTPeriod = codeFreezeDate < today;

  const message = generateReleaseMessage(version, {
    isWeeklyRelease: false,
    isFCTPeriod,
    releaseDate,
    codeFreezeDate,
  });

  postSlackMessage(message);
}
