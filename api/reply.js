const { readFile, parseIdeas, writeIdeas } = require('./_github');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { id, reply } = req.body || {};
  if (!id || reply === undefined) return res.status(400).json({ error: 'id and reply required' });

  try {
    const { content } = await readFile();
    const ideas = parseIdeas(content);
    const idx = ideas.findIndex(i => i.id === id);
    if (idx === -1) return res.status(404).json({ error: 'idea not found: ' + id });
    ideas[idx].mark_reply = reply.trim();
    await writeIdeas(ideas, null, `design: reply to ${id}`);
    res.json({ ok: true });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
};
