// routes/sessions.js
const express    = require('express');
const router     = express.Router();
const { getDb, save } = require('../database');


// POST /api/sessions — save a game session
router.post('/', async (req, res) => {
  const {
    player_id, accuracy, hits, total_targets,
    false_alarms, misses, avg_reaction_ms,
    max_level, duration_sec, profile, reaction_times
  } = req.body;

  if (accuracy === undefined || hits === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const db = await getDb();

  db.run(`
    INSERT INTO sessions (
      player_id, accuracy, hits, total_targets,
      false_alarms, misses, avg_reaction_ms,
      max_level, duration_sec, profile, reaction_times
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [
      player_id      || 'anonymous',
      accuracy, hits, total_targets,
      false_alarms   || 0,
      misses         || 0,
      avg_reaction_ms|| 0,
      max_level      || 1,
      duration_sec   || 60,
      profile        || 'Unknown',
      JSON.stringify(reaction_times || [])
    ]
  );

  save();

  // Get last inserted id
  const result = db.exec('SELECT last_insert_rowid() as id');
  const session_id = result[0].values[0][0];

  res.status(201).json({ success: true, session_id });
});


// GET /api/sessions — get all sessions
router.get('/', async (req, res) => {
  const db = await getDb();

  const result = db.exec(
    'SELECT * FROM sessions ORDER BY played_at DESC LIMIT 100'
  );

  if (!result.length) return res.json({ count: 0, sessions: [] });

  const cols     = result[0].columns;
  const sessions = result[0].values.map(row => {
    const obj = {};
    cols.forEach((col, i) => obj[col] = row[i]);
    obj.reaction_times = JSON.parse(obj.reaction_times || '[]');
    return obj;
  });

  res.json({ count: sessions.length, sessions });
});


// GET /api/sessions/stats — summary stats for dashboard
router.get('/stats', async (req, res) => {
  const db = await getDb();

  const ov = db.exec(`
    SELECT
      COUNT(*)                    AS total_sessions,
      ROUND(AVG(accuracy))        AS avg_accuracy,
      ROUND(AVG(false_alarms),1)  AS avg_false_alarms,
      ROUND(AVG(avg_reaction_ms)) AS avg_reaction_ms,
      MIN(accuracy)               AS lowest_accuracy,
      MAX(accuracy)               AS highest_accuracy,
      ROUND(AVG(max_level),1)     AS avg_max_level
    FROM sessions
  `);

  const overview = ov.length ? (() => {
    const obj = {};
    ov[0].columns.forEach((c,i) => obj[c] = ov[0].values[0][i]);
    return obj;
  })() : {};

  const pr = db.exec(`
    SELECT profile, COUNT(*) AS count
    FROM sessions GROUP BY profile ORDER BY count DESC
  `);

  const profiles = pr.length ? pr[0].values.map(r => ({
    profile: r[0], count: r[1]
  })) : [];

  res.json({ overview, profiles });
});


// GET /api/sessions/:id — single session
router.get('/:id', async (req, res) => {
  const db     = await getDb();
  const result = db.exec(
    'SELECT * FROM sessions WHERE id = ?', [req.params.id]
  );

  if (!result.length || !result[0].values.length) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const cols = result[0].columns;
  const obj  = {};
  cols.forEach((c,i) => obj[c] = result[0].values[0][i]);
  obj.reaction_times = JSON.parse(obj.reaction_times || '[]');
  res.json(obj);
});


// DELETE /api/sessions/:id
router.delete('/:id', async (req, res) => {
  const db = await getDb();
  db.run('DELETE FROM sessions WHERE id = ?', [req.params.id]);
  save();
  res.json({ success: true });
});


module.exports = router;
