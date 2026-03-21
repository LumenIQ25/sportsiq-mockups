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

/* ── Thread storage (threads.json) ─────────────────────────────────── */

const THREADS_FILE = 'threads.json';

/** Read all threads from threads.json. Returns plain object { screenId: [...] } */
async function readThreads() {
  try {
    const data = await ghFetch(THREADS_FILE);
    return JSON.parse(Buffer.from(data.content, 'base64').toString('utf8'));
  } catch(e) {
    return {}; // file doesn't exist yet — treat as empty
  }
}

/** Save/merge a single screen's thread into threads.json */
async function writeThread(screenId, thread) {
  // Read latest version first to avoid overwriting other screens' threads
  let sha = null;
  let threads = {};
  try {
    const data = await ghFetch(THREADS_FILE);
    threads = JSON.parse(Buffer.from(data.content, 'base64').toString('utf8'));
    sha = data.sha;
  } catch(e) { /* file doesn't exist yet — create it */ }

  threads[screenId] = thread;

  const body = {
    message: `threads: ${screenId} updated`,
    content: Buffer.from(JSON.stringify(threads, null, 2), 'utf8').toString('base64')
  };
  if (sha) body.sha = sha;

  await ghFetch(THREADS_FILE, { method: 'PUT', body: JSON.stringify(body) });
}

module.exports = { readFile, parseIdeas, writeIdeas, readThreads, writeThread };
