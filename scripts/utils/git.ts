/**
 * should return the current repository owner and name
 * ie:marcostomatti/open-tomato
 */

function getRepoPath(): string {
  const repoUrl = process.env.GITHUB_REPOSITORY;
  if (!repoUrl) {
    // if it's not set we can try to get it from the git config
    const { execSync } = require('child_process');
    try {
      const gitUrl = execSync('git config --get remote.origin.url').toString().trim().split(':').pop().replace('.git', '');
      
      return gitUrl
    } catch (error) {
      throw new Error('GITHUB_REPOSITORY environment variable is not set and git command failed to retrieve repository information.');
    }
  }

  const [owner, repo] = repoUrl.split('/');
  if (!owner || !repo) {
    throw new Error('Invalid GITHUB_REPOSITORY format. Expected "owner/repo".');
  }

  return repoUrl;
}

export { getRepoPath };