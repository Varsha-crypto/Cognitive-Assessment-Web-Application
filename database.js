// database.js
const path   = require('path');
const fs     = require('fs');
const initSqlJs = require('sql.js');

const DB_PATH = path.join(__dirname, 'sessions.db');

let db;

async function getDb() {
  if (db) return db;

  const SQL = await initSqlJs();

  // Load existing DB file if it exists, else create new
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Create table if not exists
  db.run(`
    CREATE TABLE IF NOT EXISTS sessions (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id       TEXT    DEFAULT 'anonymous',
      played_at       TEXT    DEFAULT (datetime('now')),
      accuracy        INTEGER,
      hits            INTEGER,
      total_targets   INTEGER,
      false_alarms    INTEGER,
      misses          INTEGER,
      avg_reaction_ms INTEGER,
      max_level       INTEGER,
      duration_sec    INTEGER,
      profile         TEXT,
      reaction_times  TEXT    DEFAULT '[]'
    )
  `);

  save();
  return db;
}

// Save DB to file after every write
function save() {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

module.exports = { getDb, save };
