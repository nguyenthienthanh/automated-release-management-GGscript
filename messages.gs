/**
 * Generates a message regarding the code freeze status based on the number of days until code freeze.
 * 
 * @param {number} daysUntilCodeFreeze - The number of days until the code freeze date.
 * @returns {string} The message regarding the code freeze status.
 */
function generateCodeFreezeMessage(codeFreezeDate) {
  const daysUntilCodeFreeze = calculateDaysLeft(codeFreezeDate);

  let daysMessage = '';
  if (daysUntilCodeFreeze >= 0) {
    if (daysUntilCodeFreeze === 1) {
      daysMessage = 'just 1 day away';
    } else {
      daysMessage = `${daysUntilCodeFreeze} days away`;
    }
  } else {
    daysMessage = `behind by ${-daysUntilCodeFreeze} days`;
  }
  return daysMessage;
}

/**
 * Generates a reminder message for a weekly release.
 * @param {string} version - The version of the release.
 * @param {Date} codeFreezeDate - The code freeze date.
 * @returns {string} The reminder message.
 */
function generateWeeklyReleaseMessage(version, codeFreezeDate, releaseDate) {
  const formattedReleaseDate = formatDateWithOrdinalSuffix(releaseDate);
  const formattedCodeFreeze = formatDateWithOrdinalSuffix(codeFreezeDate);
  const daysMessage = generateCodeFreezeMessage(codeFreezeDate);

  return `:warning: Hello everyone, Just a friendly reminder that we are ${daysMessage} from the code freeze for the *weekly* release (${version}). So, please make sure to take care of your PRs and ensure they are merged in time.

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
  const daysMessage = generateCodeFreezeMessage(spendCodeFreeze);

  return `:exclamation: Attention all team members <!here>! We are ${daysMessage} from the spend's code freeze for the upcoming monthly release (${version}). It's crucial that all PRs are addressed and merged before the code freeze date.
  
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
  const daysMessage = generateCodeFreezeMessage(releaseDate);

  return `:fire: Urgent message for all team members! The release date for the FCT release (${version}) is ${daysMessage}. It's imperative that all PRs are finalized and merged before the release deadline.
  
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
 * Generate release message based on version and options.
 * 
 * @param {string} version - The version of the release.
 * @param {Object} options - Additional options for generating the message.
 * @param {boolean} options.isWeeklyRelease - Whether it's a weekly release.
 * @param {boolean} options.isFCTPeriod - Whether it's an FCT (Final Code Testing) period.
 * @param {Date} options.releaseDate - The release date.
 * @param {Date} options.codeFreezeDate - The code freeze date.
 * @returns {string} The generated release message.
 */
function generateReleaseMessage(version, options) {
  const { isWeeklyRelease, isFCTPeriod, releaseDate, codeFreezeDate } = options;

  let message = '';

  if (isFCTPeriod) {
    message = generateFCTReleaseMessage(version, releaseDate);
  } else if (isWeeklyRelease) {
    message = generateWeeklyReleaseMessage(version, codeFreezeDate, releaseDate);
  } else {
    message = generateMonthlyReleaseMessage(version, codeFreezeDate, releaseDate);
  }

  const pullRequests = fetchPullRequests(version);
  const total = pullRequests?.length;
  if (!total) {
    Logger.log(`Skip since there are no PRs for the milestone ${version}...`);
    return '';
  }

  const groupedPullRequestsByUsers = groupPullRequestsByUser(pullRequests);
  return message + Object.entries(groupedPullRequestsByUsers)
    .map(([userId, pullRequests]) => `<@${userId}>: <https://github.com/search?q=org%3Aweaspire+is%3Aopen+is%3Apr+author%3A${pullRequests[0].user}+milestone%3A${version}&type=pullrequests | ${total} PR${total > 1 ? 's' : ''}>`)
    .join('\n\n');
}

function postSlackMessage(message) {
  const response = UrlFetchApp.fetch(WEBHOOK_URL, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ 'text': message })
  });

  Logger.log(response);
}
