/**
 * /api/threads — server-side per-screen conversation thread storage
 * GET  ?screen=screenId  → returns { thread: [...] }
 * POST { screenId, thread } → saves thread, returns { ok: true }
 *
 * Threads are stored in threads.json in the same GitHub repo.
 * This makes replies visible on any device/browser instantly.
 */
const { readThreads, writeThread } = require('./_github');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method === 'GET') {
    const screenId = req.query && req.query.screen;
    if (!screenId) return res.status(400).json({ error: 'screen param required' });
    try {
      const threads = await readThreads();
      res.json({ thread: threads[screenId] || [] });
    } catch(e) {
      res.status(500).json({ error: e.message });
    }
    return;
  }

  if (req.method === 'POST') {
    const { screenId, thread } = req.body || {};
    if (!screenId || !Array.isArray(thread)) {
      return res.status(400).json({ error: 'screenId and thread[] required' });
    }
    try {
      await writeThread(screenId, thread);
      res.json({ ok: true });
    } catch(e) {
      res.status(500).json({ error: e.message });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
