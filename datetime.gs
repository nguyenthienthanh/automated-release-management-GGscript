/**
 * Calculates the number of days left until the given date.
 * @param {Date} targetDate - The target date.
 * @returns {number} The number of days left.
 */
function calculateDaysLeft(targetDate) {
  const currentDate = new Date();
  const differenceInMilliseconds = targetDate - currentDate;
  const differenceInDays = Math.ceil(differenceInMilliseconds / (24 * 60 * 60 * 1000));
  return differenceInDays;
}

/**
 * Parses a date string and sets the time to the end of the day (23:59:59.999).
 * @param {string} dateStr - The date string to parse.
 * @returns {Date|null} The Date object with time set to the end of the day, or null if dateStr is falsy.
 */
function endOfDate(dateStr) {
  return dateStr ? new Date(dateStr).setHours(23, 59, 59, 999) : null;
}

/**
 * Checks if the current day is a weekend (Saturday or Sunday).
 * @returns {boolean} True if the current day is a weekend, otherwise false.
 */
function isCurrentDayWeekend() {
  return [0, 6].includes(new Date().getDay());
}

/**
 * Checks if today's date falls within any of the reminder date ranges.
 * @param {Date} codeFreezeDate - The code freeze date.
 * @param {number[]} daysArray - An array of days before the code freeze date to check for reminders.
 * @returns {boolean} True if today's date falls within any of the reminder date ranges, otherwise false.
 */
function isReminderDate(codeFreezeDate, daysArray) {
  const today = new Date();
  
  // Iterate through each day in the daysArray
  for (const days of daysArray) {
    // Calculate the date 'days' days before the code freeze date
    let nextDay = new Date(codeFreezeDate.getTime());
    nextDay.setDate(nextDay.getDate() - days);

    // Adjust the date to avoid weekends
    while (isCurrentDayWeekend(nextDay)) {
      nextDay.setDate(nextDay.getDate() - 1);
    }

    // Check if today's date matches the calculated date
    if (nextDay.getTime() === today.getTime()) {
      return true;
    }
  }

  return false;
}

/**
 * Formats a date with its ordinal suffix (e.g., 1st, 2nd, 3rd, 4th).
 * @param {Date} date - The date to format.
 * @returns {string} The formatted date with the ordinal suffix and abbreviated month.
 */
function formatDateWithOrdinalSuffix(date) {
  // Get the day of the month
  const day = date.getDate();
  
  // Determine the ordinal suffix based on the day
  let suffix;
  if (day % 10 === 1 && day !== 11) {
    suffix = 'st';
  } else if (day % 10 === 2 && day !== 12) {
    suffix = 'nd';
  } else if (day % 10 === 3 && day !== 13) {
    suffix = 'rd';
  } else {
    suffix = 'th';
  }
  
  // Format the date with the ordinal suffix and abbreviated month
  return `${day}${suffix} ${date.toLocaleString('default', { month: 'short' })}`;
}
