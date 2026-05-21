// server.js
// Main server entry point — run this with: node server.js

const express        = require('express');
const cors           = require('cors');
const path           = require('path');
const sessionsRouter = require('./routes/sessions');
const { getDb }      = require('./database');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── MIDDLEWARE ───────────────────────────────────────────────────────────
app.use(cors());                          // Allow browser requests
app.use(express.json());                  // Parse JSON request bodies
app.use(express.static('public'));        // Serve HTML/CSS/JS files


// ── ROUTES ───────────────────────────────────────────────────────────────
app.use('/api/sessions', sessionsRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Serve dashboard at /dashboard
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Serve game at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


// ── START — init DB first, then listen ───────────────────────────────────
getDb().then(() => {
  app.listen(PORT, () => {
    console.log('');
    console.log('  ╔══════════════════════════════════════╗');
    console.log('  ║       NOISE FILTER  SERVER           ║');
    console.log('  ╠══════════════════════════════════════╣');
    console.log(`  ║  Game:      http://localhost:${PORT}      ║`);
    console.log(`  ║  Dashboard: http://localhost:${PORT}/dashboard ║`);
    console.log(`  ║  API:       http://localhost:${PORT}/api  ║`);
    console.log('  ╚══════════════════════════════════════╝');
    console.log('');
  });
}).catch(err => {
  console.error('Failed to initialise database:', err);
  process.exit(1);
});
