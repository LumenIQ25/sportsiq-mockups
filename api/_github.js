/**
 * Shared GitHub API helpers for Vercel serverless functions.
 * Reads/writes the mark-ideas JSON block in index.html via GitHub API.
 * All credentials stay in Vercel env vars — never exposed to the browser.
 *
 * NOTE: index.html exceeds GitHub's 1MB Content API limit.
 * We use the Git Blobs API (by blob SHA) to fetch content — this bypasses
 * BOTH the 1MB limit AND raw.githubusercontent.com CDN caching, which was
 * causing stale reads that would overwrite recent commits on write-back.
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

/**
 * Fetch a git blob by its SHA using the Git Data API.
 * Returns the decoded UTF-8 string content.
 * This bypasses the 1MB Contents API limit AND the raw CDN cache.
 */
async function fetchBlob(blobSha) {
  const res = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/git/blobs/${blobSha}`,
    { headers: { Authorization: `token ${TOKEN}`, Accept: 'application/vnd.github.v3+json' } }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `Blob fetch error ${res.status}`);
  // GitHub returns base64 with newlines — strip them before decoding
  return Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf8');
}

/**
 * Read index.html from GitHub.
 * Uses Git Blobs API (by SHA) — no CDN cache, no size limit.
 * Returns { content: string, sha: string }
 */
async function readFile() {
  const meta = await ghFetch(FILE);   // gets current SHA; content field empty for >1MB files
  const content = await fetchBlob(meta.sha);
  return { content, sha: meta.sha };
}

/** Extract ideas array from HTML content */
function parseIdeas(html) {
  const m = html.match(/<script id="mark-ideas"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) throw new Error('mark-ideas block not found');
  return JSON.parse(m[1].trim());
}

/**
 * Write ideas array back into HTML and commit to GitHub.
 * Reads fresh content via Git Blobs API to avoid CDN stale-read bug.
 */
async function writeIdeas(ideas, _sha, message) {
  // Always re-read via blob SHA — guaranteed fresh, no CDN involved
  const freshMeta = await ghFetch(FILE);
  const html = await fetchBlob(freshMeta.sha);

  const json = JSON.stringify(ideas, null, 2);
  const updated = html.replace(
    /(<script id="mark-ideas"[^>]*>)([\s\S]*?)(<\/script>)/,
    (_, open, _body, close) => open + '\n' + json + '\n' + close
  );
  await ghFetch(FILE, {
    method: 'PUT',
    body: JSON.stringify({
      message: message || 'design: update idea inbox',
      content: Buffer.from(updated, 'utf8').toString('base64'),
      sha: freshMeta.sha
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
  let sha = null;
  let threads = {};
  try {
    const data = await ghFetch(THREADS_FILE);
    threads = JSON.parse(Buffer.from(data.content, 'base64').toString('utf8'));
    sha = data.sha;
  } catch(e) { /* create fresh */ }

  threads[screenId] = thread;

  const body = {
    message: `threads: ${screenId} updated`,
    content: Buffer.from(JSON.stringify(threads, null, 2), 'utf8').toString('base64')
  };
  if (sha) body.sha = sha;

  await ghFetch(THREADS_FILE, { method: 'PUT', body: JSON.stringify(body) });
}

module.exports = { readFile, parseIdeas, writeIdeas, readThreads, writeThread };
