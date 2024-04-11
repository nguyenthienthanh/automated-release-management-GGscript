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
  if (dateStr) {
    const date = new Date(dateStr)
    date.setHours(23, 59, 59, 999)
    return date
  }

  return null
}

/**
 * Checks if the a day is a weekend (Saturday or Sunday).
 * @returns {boolean} True if the day is a weekend, otherwise false.
 */
function isWeekend(date) {
  return [0, 6].includes(date.getDay());
}

/**
 * Formats a date with its ordinal suffix (e.g., 1st, 2nd, 3rd, 4th).
 * @param {Date} date - The date to format.
 * @returns {string} The formatted date with the ordinal suffix and abbreviated month.
 */
function formatDateWithOrdinalSuffix(date) {
  // Get the day of the month
  const day = (new Date(date)).getDate();

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

/**
 * Calculates the dates before based on an array of numbers from a given date, skipping weekends.
 * @param {Date} startDate - The starting date.
 * @param {number[]} numbers - An array of numbers representing the number of days to add to the starting date.
 * @returns {Date[]} An array of dates calculated based on the input numbers, skipping weekends.
 */
function calculateDatesBefore(startDate, numbers) {
  const dates = [];
  for (let i = 0; i < numbers.length; i++) {
    let daysToAdd = numbers[i];
    const newDate = endOfDate(new Date(startDate));
    newDate.setDate(startDate.getDate() - daysToAdd);

    // Move to the next day if the date exists in the dates array or falls on a weekend
    while (isWeekend(newDate) || dates.some(date => date.getTime() === newDate.getTime())) {
      newDate.setDate(newDate.getDate() - 1); // Move to the next day
    }

    dates.push(newDate);
  }
  return dates;
}
