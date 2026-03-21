/**
 * Shared GitHub API helpers for Vercel serverless functions.
 * Reads/writes the mark-ideas JSON block in index.html via GitHub API.
 * All credentials stay in Vercel env vars — never exposed to the browser.
 */

const OWNER = process.env.GITHUB_OWNER || 'LumenIQ25';
const REPO  = process.env.GITHUB_REPO  || 'sportsiq-mockups';
const TOKEN = process.env.GITHUB_TOKEN;
const FILE  = 'index.html';

async function ghFetch(path, opts = {}) {
  const res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`, {
    ...opts,
    headers: {
      Authorization: `token ${TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...(opts.headers || {})
    }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `GitHub API error ${res.status}`);
  return data;
}

/** Read index.html from GitHub. Returns { content: string, sha: string } */
async function readFile() {
  const data = await ghFetch(FILE);
  const content = Buffer.from(data.content, 'base64').toString('utf8');
  return { content, sha: data.sha };
}

/** Extract ideas array from HTML content */
function parseIdeas(html) {
  const m = html.match(/<script id="mark-ideas"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) throw new Error('mark-ideas block not found');
  return JSON.parse(m[1].trim());
}

/** Write ideas array back into HTML and commit to GitHub */
async function writeIdeas(ideas, sha, message) {
  // re-read to get latest sha + content in one call
  const freshData = await ghFetch(FILE);
  const html = Buffer.from(freshData.content, 'base64').toString('utf8');
  const json = JSON.stringify(ideas, null, 2);
  // Use function replacer to avoid $ in json being treated as regex backreferences
  const updated = html.replace(
    /(<script id="mark-ideas"[^>]*>)([\s\S]*?)(<\/script>)/,
    (_, open, _body, close) => open + '\n' + json + '\n' + close
  );
  await ghFetch(FILE, {
    method: 'PUT',
    body: JSON.stringify({
      message: message || 'design: update idea inbox',
      content: Buffer.from(updated, 'utf8').toString('base64'),
      sha: freshData.sha
    })
  });
}

module.exports = { readFile, parseIdeas, writeIdeas };
