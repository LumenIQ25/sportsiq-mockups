const { readFile, parseIdeas, writeIdeas } = require('./_github');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { idea } = req.body || {};
  if (!idea || !idea.trim()) return res.status(400).json({ error: 'idea text required' });

  try {
    const { content } = await readFile();
    const ideas = parseIdeas(content);
    const today = new Date().toISOString().slice(0, 10);
    const newId = 'idea-' + String(ideas.length + 1).padStart(3, '0');
    ideas.push({ id: newId, date: today, source: 'inbox', idea: idea.trim(),
      status: 'new', claude_response: '', mark_reply: '' });
    await writeIdeas(ideas, null, `design: new idea ${newId}`);
    res.json({ ok: true, id: newId });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
};
