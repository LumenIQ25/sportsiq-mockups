/**
 * SportsIQ Mockups — Companion Server
 * Pure Node.js, zero dependencies. Run with: node server.js
 * Opens the mockups at http://localhost:3456
 *
 * What it does:
 *  - Serves index.html
 *  - Writes replies + new ideas directly into the mark-ideas JSON block in index.html
 *  - Claude reads the updated file on every hourly scan — zero copy-paste needed
 */

const http = require('http');
const fs   = require('fs');
const path = require('path');

const HTML_FILE = path.join(__dirname, 'index.html');
const PORT = 3456;

/* ── JSON helpers ────────────────────────────────────────── */
function readIdeas() {
  const html = fs.readFileSync(HTML_FILE, 'utf8');
  const m = html.match(/<script id="mark-ideas"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) throw new Error('mark-ideas block not found in index.html');
  return JSON.parse(m[1].trim());
}

function writeIdeas(ideas) {
  let html = fs.readFileSync(HTML_FILE, 'utf8');
  const json = JSON.stringify(ideas, null, 2);
  html = html.replace(
    /(<script id="mark-ideas"[^>]*>)([\s\S]*?)(<\/script>)/,
    '$1\n' + json + '\n$3'
  );
  fs.writeFileSync(HTML_FILE, html, 'utf8');
}

/* ── Request router ──────────────────────────────────────── */
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try { resolve(JSON.parse(body || '{}')); }
      catch(e) { reject(e); }
    });
    req.on('error', reject);
  });
}

function json(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  /* CORS preflight */
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  /* Serve HTML */
  if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(fs.readFileSync(HTML_FILE, 'utf8'));
    return;
  }

  /* Health check — used by HTML to detect server mode */
  if (req.method === 'GET' && req.url === '/api/health') {
    return json(res, 200, { ok: true, port: PORT });
  }

  /* POST endpoints */
  if (req.method === 'POST') {
    try {
      const data = await parseBody(req);

      /* POST /api/reply — set mark_reply on an idea */
      if (req.url === '/api/reply') {
        const { id, reply } = data;
        if (!id || reply === undefined) return json(res, 400, { error: 'id and reply required' });
        const ideas = readIdeas();
        const idx = ideas.findIndex(i => i.id === id);
        if (idx === -1) return json(res, 404, { error: 'idea not found: ' + id });
        ideas[idx].mark_reply = reply.trim();
        writeIdeas(ideas);
        console.log(`[reply] ${id} → "${reply.trim().slice(0, 60)}..."`);
        return json(res, 200, { ok: true });
      }

      /* POST /api/new-idea — add a new idea to the JSON block */
      if (req.url === '/api/new-idea') {
        const { idea } = data;
        if (!idea || !idea.trim()) return json(res, 400, { error: 'idea text required' });
        const ideas = readIdeas();
        const today = new Date().toISOString().slice(0, 10);
        const newId = 'idea-' + (ideas.length + 1).toString().padStart(3, '0') + '-' + Date.now().toString().slice(-4);
        ideas.push({
          id: newId,
          date: today,
          source: 'inbox',
          idea: idea.trim(),
          status: 'new',
          claude_response: '',
          mark_reply: ''
        });
        writeIdeas(ideas);
        console.log(`[new-idea] ${newId}: "${idea.trim().slice(0, 60)}"`);
        return json(res, 200, { ok: true, id: newId });
      }

      return json(res, 404, { error: 'unknown endpoint' });

    } catch(e) {
      console.error('[error]', e.message);
      return json(res, 500, { error: e.message });
    }
  }

  res.writeHead(404); res.end('Not found');
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('');
  console.log('  ✅  SportsIQ Mockups server running');
  console.log('  👉  Open http://localhost:' + PORT + ' in your browser');
  console.log('');
  console.log('  Replies + new ideas write directly to index.html.');
  console.log('  Claude reads the file every hour and acts on them.');
  console.log('  Press Ctrl+C to stop.');
  console.log('');
});
