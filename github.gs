/**
 * Fetches pull requests from GitHub API based on version and pagination.
 * @param {string} version - The version or milestone of the pull requests.
 * @param {number} page - The page number for pagination.
 * @param {Object[]} pullRequests - Array to store fetched pull requests.
 * @returns {Object[]} Array of fetched pull requests.
 */
function fetchPullRequests(version, page = 1, pullRequests = []) {
  // Construct filters for authors, version, and excluded repositories
  const authorsFilter = Object.keys(GH_USERNAME_2_SLACK_IDS).map(author => `author:${author}`).join(' ');
  const versionFilter = version ? `milestone:${version}` : '';
  const excludedReposFilter = EXCLUDED_REPOS.map(repo => `-repo:weaspire/${repo}`).join(' ');

  // Construct API URL with filters
  const apiUrl = `https://api.github.com/search/issues?per_page=50&page=${page}&q=${encodeURIComponent(`is:open is:pr archived:false user:weaspire ${authorsFilter}`).replace(/%2B/g, '+')} ${versionFilter} ${excludedReposFilter}`;

  // Fetch data from GitHub API
  const response = UrlFetchApp.fetch(apiUrl, {
    method: 'get',
    headers: {
      Authorization: GH_AUTHORIZATION,
    },
  });

  // Parse response data
  const { total_count, items } = JSON.parse(response.getContentText());

  // Add fetched pull requests to the array
  pullRequests.push(...(items || []).filter(pullRequest => !EXCLUDED_TITLE_PREFIXES_REGEXP.test(pullRequest.title)));

  // If there are more pull requests to fetch, recursively call the function
  if (pullRequests.length < total_count) {
    return fetchPullRequests(version, page + 1, pullRequests);
  }

  // Return the array of fetched pull requests
  return pullRequests;
}
