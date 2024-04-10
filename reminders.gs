/**
 * Retrieves release calendar data from Google Sheets.
 * @returns {Object[]} Array of release calendar data objects.
 */
function getReleaseCalendar() {
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
  return data.reverse().map(row => ({
    releaseType: row[releaseTypeIndex] || "",
    version: (row[versionIndex] || "").toLowerCase(),
    codeFreeze: convertToDate(row[codeFreezeIndex]),
    releaseDate: convertToDate(row[releaseDateIndex]),
    actualReleaseDate: convertToDate(row[actualReleaseDateIndex]),
  })).filter(({ releaseDate, actualReleaseDate }) => releaseDate >= currentDate || !actualReleaseDate);
}

/**
 * Generates a message about the time remaining until code freeze or the delay if the code freeze date has passed.
 * @param {Date} codeFreezeDate - The date of the code freeze.
 * @param {boolean} isWeeklyRelease - Indicates if it's a weekly release.
 * @returns {string} The message about the time remaining until code freeze or the delay if the code freeze date has passed.
 */
const getCodeFreezeMessage = (codeFreezeDate, isWeeklyRelease) => {
  const formattedCodeFreeze = formatDateWithOrdinalSuffix(codeFreezeDate);
  const millisecondsUntilCodeFreeze = codeFreezeDate - new Date();
  const daysUntilCodeFreeze = Math.floor(millisecondsUntilCodeFreeze / (24 * 60 * 60 * 1000));
  const codeFreezeType = isWeeklyRelease ? 'code freeze' : 'spend\'s code freeze';

  let message;

  if (daysUntilCodeFreeze >= 0) {
    if (daysUntilCodeFreeze >= 8) {
      message = `there's ~1 week left until our ${codeFreezeType}, which is scheduled for ${formattedCodeFreeze}`;
    } else if (daysUntilCodeFreeze >= 2) {
      message = `there's only *${daysUntilCodeFreeze} days* left until our ${codeFreezeType}`;
    } else if (daysUntilCodeFreeze === 1) {
      message = `there\'s only *1 day* left until our ${codeFreezeType}`;
    } else if (daysUntilCodeFreeze === 0) {
      message = `*today* is our ${codeFreezeType}`;
    }
  } else {
    message = `we are ${-daysUntilCodeFreeze} days behind the date of our ${codeFreezeType}, which is scheduled for ${formattedCodeFreeze}`;
  }

  return message;
};

/**
 * Generates a reminder message for a weekly release.
 * @param {string} version - The version of the release.
 * @param {Date} codeFreezeDate - The code freeze date.
 * @returns {string} The reminder message.
 */
function generateWeeklyReleaseMessage(version, codeFreezeDate, releaseDate) {
  const formattedReleaseDate = formatDateWithOrdinalSuffix(releaseDate);
  const formattedCodeFreeze = formatDateWithOrdinalSuffix(codeFreezeDate);
  const daysUntilCodeFreeze = calculateDaysLeft(codeFreezeDate);

  return `:warning: Hello everyone, Just a friendly reminder that we are ${daysUntilCodeFreeze} days away from the code freeze for the *weekly* release (${version}). So, please make sure to take care of your PRs and ensure they are merged in time.

Thank you!

*Release type*: Weekly
*Release version*: ${version}
*Code freeze date*: ${formattedCodeFreeze}
*Release date*: ${formattedReleaseDate}\n\n`;
}

/**
 * Generates a message for a monthly release reminder.
 * @param {string} version - The version of the release.
 * @param {Date} codeFreezeDate - The code freeze date.
 * @param {Date} releaseDate - The release date.
 * @returns {string} The reminder message.
 */
function generateMonthlyReleaseMessage(version, codeFreezeDate, releaseDate) {
  // Format release dates
  const formattedReleaseDate = formatDateWithOrdinalSuffix(releaseDate);
  const spendCodeFreeze = new Date(codeFreezeDate.getTime() - 1 * 24 * 60 * 60 * 1000); // before code freeze 1 day
  const formattedCodeFreeze = formatDateWithOrdinalSuffix(spendCodeFreeze);
  const daysUntilCodeFreeze = calculateDaysLeft(codeFreezeDate);

  return `:exclamation: Attention all team members <!here>! We are just ${daysUntilCodeFreeze} days away from the spend's code freeze for the upcoming monthly release (${version}). It's crucial that all PRs are addressed and merged before the code freeze date.
  
Failure to do so may result in delays to the release schedule.
  
Please prioritize your tasks accordingly and ensure all PRs are in order.
  
Thank you!
  
*Release type*: Monthly
*Release version*: ${version}
*Spend's code freeze date*: ${formattedCodeFreeze}
*Code freeze date*: ${formattedCodeFreeze}
*Release date*: ${formattedReleaseDate}\n\n`;
}

/**
 * Generates a message for an FCT (Final Code Testing) release reminder.
 * @param {string} version - The version of the release.
 * @param {Date} releaseDate - The release date.
 * @returns {string} The reminder message.
 */
function generateFCTReleaseMessage(version, releaseDate) {
  // Format release date
  const formattedReleaseDate = formatDateWithOrdinalSuffix(releaseDate);
  const daysUntilCodeFreeze = calculateDaysLeft(releaseDate);

  return `:fire: Urgent message for all team members! The release date for the FCT release (${version}) is only ${daysUntilCodeFreeze} days away. It's imperative that all PRs are finalized and merged before the release deadline.
  
This is a critical phase of our release cycle, and your immediate attention is required to ensure the timely completion of our release tasks.
  
Please act promptly to address any outstanding PRs and collaborate closely with your team members to resolve any blockers.
  
*Release version*: ${version}
*Release date*: ${formattedReleaseDate}\n\n`;
}

/**
 * Group pull requests by Slack user ID.
 * @param {Array} pullRequests - Array of pull request objects.
 * @param {Array} skipRepos - Array of repository URLs to skip.
 * @returns {Object} Object containing pull requests grouped by Slack user ID.
 */
function groupPullRequestsByUser(pullRequests) {
  const groupedByUsers = {};

  pullRequests.forEach(pullRequest => {
    const slackUserId = GH_USERNAME_2_SLACK_IDS[pullRequest.user.login];
    const repo = pullRequest.repository_url.replace('https://api.github.com/repos/weaspire/', '');

    if (slackUserId) {
      groupedByUsers[slackUserId] = groupedByUsers[slackUserId] || [];
      groupedByUsers[slackUserId].push({
        user: pullRequest.user.login,
        url: pullRequest.html_url,
        title: pullRequest.title,
        repo,
      });
    }
  });

  return groupedByUsers;
}

/**
 * Sends a Slack reminder message about upcoming releases and associated pull requests.
 * @param {string} version - The version of the release.
 * @param {boolean} isWeeklyRelease - Indicates if it's a weekly release.
 * @param {boolean} isFCTPeriod - Indicates if it's an FCT Period.
 * @param {Date} releaseDate - The date of the release.
 * @param {Date} codeFreezeDate - The code freeze date.
 */
function sendSlackReminderWithPullRequests(version, options) {
  const { isWeeklyRelease, isFCTPeriod, releaseDate, codeFreezeDate } = options;

  const pullRequests = fetchPullRequests(version);

  if (!pullRequests?.length) {
    Logger.log(`Skip since there are no PRs for the milestone ${version}...`);
    return;
  }

  let message = '';
  if (isFCTPeriod) {
    message = generateFCTReleaseMessage(version, releaseDate);
  } else if (isWeeklyRelease) {
    message = generateWeeklyReleaseMessage(version, codeFreezeDate, releaseDate);
  } else {
    message = generateMonthlyReleaseMessage(version, codeFreezeDate, releaseDate);
  }

  const groupedPullRequestsByUsers = groupPullRequestsByUser(pullRequests);

  message += Object.entries(groupedPullRequestsByUsers).map(([userId, pullRequests]) => {
    const filteredPullRequests = pullRequests.filter(pullRequest => !EXCLUDED_TITLE_PREFIXES_REGEXP.test(pullRequest.title));
    if (filteredPullRequests.length === 0) return '';
    const total = filteredPullRequests.length;
    return `<@${userId}>: <https://github.com/search?q=org%3Aweaspire+is%3Aopen+is%3Apr+author%3A${pullRequests[0].user}+milestone%3A${version}&type=pullrequests | ${total} PR${total > 1 ? 's' : ''}>`;
  }).join('\n\n');

  const response = UrlFetchApp.fetch(WEBHOOK_URL, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ 'text': message })
  });

  Logger.log(response);
}
