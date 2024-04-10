# Automated Release Management Google AppScript

## Introduction: 

The Automated Release Management Script is a tool that assists individuals and managers in tracking and managing their Pull Requests (PRs) for monthly or weekly releases efficiently. It operates based on the Release Calendar, sending automated notifications via Slack channels regarding upcoming release deadlines based on a specified timeframe before the code freeze date. The default notification intervals are set to one week, three days, two days, and one day before the code freeze.

## Usage:

To utilize the Automated Release Management Script, follow these steps:

### Prerequisites:

- Obtain a [GitHub Personal Access Token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens) for authentication.

- Set up your [Slack webhook URL](https://api.slack.com/messaging/webhooks) for sending notifications.

- Map each developer's GitHub username with their respective [Slack user ID](https://www.youtube.com/watch?v=u1IhnRV2TwI). This mapping enables the script to send personalized notifications to team members.

### Script Setup:

- Replace the placeholders for `username`, `token`, and `webhookUrl` variables with your GitHub username, Personal Access Token, and Slack webhook URL, respectively.

- Update `releaseSheetName` and `releaseSheetId` variables with the appropriate name and ID of respective Google Sheets document.

### GitHub and Slack Integration:

The script integrates with GitHub to fetch open PRs associated with specific milestones or releases.

Map GitHub usernames to Slack user IDs using the ghAuthor2Slacks object.

Configure Slack message formatting and content according to your team's preferences within the sendSlackReminder function.

### Functionality:

The script fetches data from the Google Sheets document to determine release schedules.

It checks for upcoming release deadlines and sends Slack notifications based on specified intervals before the code freeze date.

Notifications include details such as release version, code freeze date, release date, and a list of associated PRs for review.

### Customization:

Adjust the shouldSendReminder function to customize the notification intervals according to your team's release cycle.

Modify message templates and formatting within the sendSlackReminder function to tailor notifications to your team's preferences.

### Execution:

Schedule the sendReminderByReleaseCalendar function to run periodically using Google Apps Script triggers.

Ensure the script runs at a suitable frequency to provide timely notifications before release deadlines.

## Conclusion:

The Automated Release Management Script streamlines the process of managing PRs for monthly or weekly releases by integrating GitHub, Slack, and Google Sheets. By automating release notifications and PR tracking, this tool enhances team collaboration and ensures smoother release cycles. Customize the script according to your team's requirements to optimize its effectiveness in managing release workflows.
