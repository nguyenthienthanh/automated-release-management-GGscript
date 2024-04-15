# Automated Release Management Script 

## Introduction
The Automated Release Management Script is a Google Apps Script-based solution designed to assist individuals and managers in efficiently tracking and managing their Pull Requests (PRs) for monthly or weekly releases. It operates based on the Release Calendar, sending reminders via Slack, notifying team members about upcoming release deadlines, and ensuring that all PRs are addressed and merged before the code freeze or release date.

## Features
- Automatic reminders for weekly and monthly releases.
- Customizable messages based on release type and status.
- Integration with Slack for seamless communication.

## Prerequisites
Before setting up the Release Reminder Tool, ensure you have the following:
- Google Account: You need a Google account to use Google Apps Script.
- Slack Workspace: You must be a member of a Slack workspace to send reminders.
- GitHub Account: You'll need access to generate a Personal Access Token.
- Google AppScript: Checkout script from GitHub.

## Obtain a GitHub Personal Access Token
To generate a GitHub Personal Access Token:
1. Log in to your GitHub account.
2. Go to Settings > Developer settings > Personal access tokens.
3. Click on Generate new token.
4. Enter a meaningful name for the token.
5. Select the following scopes to grant the necessary permissions:
   - repo: Full control of private repositories
   - read:user: Read all user profile data
   - user:email: Access user email addresses (read-only)
6. Click Generate token.
7. Copy the generated token. This token will be used to authenticate GitHub API requests in the Release Reminder Tool.

## Set Up a Slack Webhook URL
To create a Slack webhook URL:
1. Log in to your Slack workspace.
2. Go to Settings & administration > Manage apps.
3. Click on Custom Integrations.
4. Select Incoming Webhooks.
5. Click on Add to Slack.
6. Choose a channel where you want to receive reminders and click Add Incoming Webhooks integration.
7. Copy the generated webhook URL. This URL will be used in the Release Reminder Tool to send messages to Slack.

## Map GitHub Usernames to Slack User IDs
To map GitHub usernames to Slack user IDs:
- Create a mapping between each developer's GitHub username and their respective Slack user ID.
- Obtain Slack user IDs by following these steps:
  1. Open Slack and navigate to the user's profile you want to get the ID for.
  2. Click on the three dots (ellipsis) icon located at the top right corner of the profile window.
  3. In the dropdown menu, click on Copy member ID.
- Update the `GH_USERNAME_2_SLACK_IDS` constant in the `constants.gs` file with the mapping information. This ensures that the script can mention team members in Slack messages.

## Usage
After completing the prerequisites and setup steps:
1. Open the Google Apps Script editor.
2. Copy and paste the provided scripts (`constants.gs`, `datetime.gs`, `messages.gs`, `reminder.gs`, `slack.gs`, `github.gs`) into separate files.
3. Save each file with the corresponding name.
4. Set up triggers for the `setWeeklyReleaseReminder` and `setMonthlyReleaseReminder` functions to run at desired intervals (e.g., weekly, monthly).
5. Once triggers are set, the Release Reminder Tool will automatically send reminders via Slack for weekly and monthly releases based on your release calendar.

## Customizing Monthly Release Reminders
### Step 1: Open the Script Editor
Open Google Apps Script and navigate to your project.

### Step 2: Locate the `setMonthlyReleaseReminder` Function
In the script editor, open the `reminder.gs` file.
Locate the `setMonthlyReleaseReminder` function.

### Step 3: Customize Reminder Dates
Modify the `calculateDatesBefore` function parameters within `setMonthlyReleaseReminder` to adjust the reminder dates.

### Step 4: Customize Trigger Setting
Adjust the trigger settings within the loop to set the reminders at your preferred time.

### Step 5: Save Your Changes
Save your changes in the script editor.

## Customizing Weekly Release Reminders
### Step 1: Open the Script Editor
Open Google Apps Script and navigate to your project.

### Step 2: Locate the `setWeeklyReleaseReminder` Function
In the script editor, open the `reminder.gs` file.
Locate the `setWeeklyReleaseReminder` function.

### Step 3: Customize Reminder Dates
Modify the `calculateDatesBefore` function parameters within `setWeeklyReleaseReminder` to adjust the reminder dates.

### Step 4: Customize Trigger Setting
Adjust the trigger settings within the loop to set the reminders at your preferred time.

### Step 5: Save Your Changes
Save your changes in the script editor.

## Conclusion
Follow these steps to set up the Release Reminder Tool for Slack, ensuring smooth communication and efficient release management within your team. If you encounter any issues or require further assistance, refer to the respective platform documentation or seek support from @Nguyen Thien Thanh or your team members.
