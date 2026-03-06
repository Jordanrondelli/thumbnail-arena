const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');

const router = express.Router();

const fs = require('fs');

// Use persistent disk on Render
const uploadsDir = process.env.RENDER
  ? '/opt/render/project/src/data/uploads'
  : path.join(__dirname, 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

// Multer config
const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

// --- Auth middleware ---
function requireAdmin(req, res, next) {
  const password = req.headers['x-admin-password'];
  const config = db.prepare('SELECT admin_password FROM test_config WHERE id = 1').get();
  if (!config || password !== config.admin_password) {
    return res.status(401).json({ error: 'Mot de passe incorrect' });
  }
  next();
}

// --- Auth ---
router.post('/auth', (req, res) => {
  const { password } = req.body;
  const config = db.prepare('SELECT admin_password FROM test_config WHERE id = 1').get();
  if (password === config.admin_password) {
    return res.json({ ok: true });
  }
  res.status(401).json({ error: 'Mot de passe incorrect' });
});

// --- Thumbnails ---
router.get('/thumbnails', requireAdmin, (req, res) => {
  const thumbs = db.prepare('SELECT * FROM thumbnails ORDER BY created_at DESC').all();
  res.json(thumbs);
});

router.post('/thumbnails', requireAdmin, upload.array('files', 50), (req, res) => {
  const insert = db.prepare('INSERT INTO thumbnails (id, filename, original_name) VALUES (?, ?, ?)');
  const thumbs = [];
  const insertMany = db.transaction((files) => {
    for (const file of files) {
      const id = uuidv4();
      insert.run(id, file.filename, file.originalname);
      thumbs.push({ id, filename: file.filename, original_name: file.originalname });
    }
  });
  insertMany(req.files);
  res.json(thumbs);
});

router.delete('/thumbnails/:id', requireAdmin, (req, res) => {
  const thumb = db.prepare('SELECT filename FROM thumbnails WHERE id = ?').get(req.params.id);
  if (thumb) {
    const filepath = path.join(uploadsDir, thumb.filename);
    try { fs.unlinkSync(filepath); } catch {}
    db.prepare('DELETE FROM click_heatmap WHERE thumbnail_id = ?').run(req.params.id);
    db.prepare('DELETE FROM memory_tests WHERE thumbnail_id = ?').run(req.params.id);
    db.prepare('DELETE FROM mouse_tracking WHERE duel_id IN (SELECT id FROM duels WHERE thumb_left_id = ? OR thumb_right_id = ?)').run(req.params.id, req.params.id);
    db.prepare('DELETE FROM duels WHERE thumb_left_id = ? OR thumb_right_id = ?').run(req.params.id, req.params.id);
    db.prepare('DELETE FROM thumbnails WHERE id = ?').run(req.params.id);
  }
  res.json({ ok: true });
});

// --- Test config ---
router.get('/config', (req, res) => {
  const config = db.prepare('SELECT is_active FROM test_config WHERE id = 1').get();
  res.json(config);
});

router.post('/config/activate', requireAdmin, (req, res) => {
  const count = db.prepare('SELECT COUNT(*) as c FROM thumbnails').get().c;
  if (count < 2) {
    return res.status(400).json({ error: 'Il faut au moins 2 miniatures pour activer le test' });
  }
  db.prepare("UPDATE test_config SET is_active = 1, updated_at = datetime('now') WHERE id = 1").run();
  res.json({ ok: true });
});

router.post('/config/deactivate', requireAdmin, (req, res) => {
  db.prepare("UPDATE test_config SET is_active = 0, updated_at = datetime('now') WHERE id = 1").run();
  res.json({ ok: true });
});

router.post('/config/reset', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM click_heatmap').run();
  db.prepare('DELETE FROM mouse_tracking').run();
  db.prepare('DELETE FROM memory_tests').run();
  db.prepare('DELETE FROM duels').run();
  db.prepare('DELETE FROM sessions').run();
  res.json({ ok: true });
});

router.post('/config/password', requireAdmin, (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 4) {
    return res.status(400).json({ error: 'Le mot de passe doit faire au moins 4 caractères' });
  }
  db.prepare("UPDATE test_config SET admin_password = ?, updated_at = datetime('now') WHERE id = 1").run(newPassword);
  res.json({ ok: true });
});

// --- Session / Duels ---
router.get('/session/pairs', (req, res) => {
  const config = db.prepare('SELECT is_active FROM test_config WHERE id = 1').get();
  if (!config || !config.is_active) {
    return res.status(403).json({ error: 'Le test n\'est pas actif' });
  }

  const thumbnails = db.prepare('SELECT id, filename FROM thumbnails ORDER BY id').all();
  if (thumbnails.length < 2) {
    return res.status(400).json({ error: 'Pas assez de miniatures' });
  }

  // Generate all possible pairs
  const allPairs = [];
  for (let i = 0; i < thumbnails.length; i++) {
    for (let j = i + 1; j < thumbnails.length; j++) {
      allPairs.push([thumbnails[i], thumbnails[j]]);
    }
  }

  // Get duel counts per pair for BIBD balancing
  const pairCounts = {};
  const countRows = db.prepare(`
    SELECT thumb_left_id, thumb_right_id, COUNT(*) as cnt FROM duels
    GROUP BY MIN(thumb_left_id, thumb_right_id), MAX(thumb_left_id, thumb_right_id)
  `).all();
  for (const row of countRows) {
    const key = [row.thumb_left_id, row.thumb_right_id].sort().join('|');
    pairCounts[key] = row.cnt;
  }

  // Sort pairs by count ascending (least seen first) for balance
  allPairs.sort((a, b) => {
    const keyA = [a[0].id, a[1].id].sort().join('|');
    const keyB = [b[0].id, b[1].id].sort().join('|');
    return (pairCounts[keyA] || 0) - (pairCounts[keyB] || 0);
  });

  // Take up to 10 pairs
  const selected = allPairs.slice(0, 10);

  // Shuffle selected pairs order
  for (let i = selected.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [selected[i], selected[j]] = [selected[j], selected[i]];
  }

  // Randomize left/right position for each pair
  const pairs = selected.map((pair) => {
    if (Math.random() < 0.5) {
      return { left: pair[0], right: pair[1] };
    }
    return { left: pair[1], right: pair[0] };
  });

  // Create session
  const sessionId = uuidv4();
  db.prepare('INSERT INTO sessions (id) VALUES (?)').run(sessionId);

  res.json({ sessionId, pairs, thumbnails: thumbnails.map(t => ({ id: t.id, filename: t.filename })) });
});

router.post('/session/:id/duels', (req, res) => {
  const { duels } = req.body;
  const sessionId = req.params.id;

  const session = db.prepare('SELECT id FROM sessions WHERE id = ?').get(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session introuvable' });
  }

  const insert = db.prepare(`
    INSERT INTO duels (session_id, thumb_left_id, thumb_right_id, winner_id, reaction_time_ms, position_order, timed_out)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertTracking = db.prepare('INSERT INTO mouse_tracking (duel_id, data) VALUES (?, ?)');

  const insertAll = db.transaction((duelsList) => {
    for (const d of duelsList) {
      const result = insert.run(sessionId, d.thumbLeftId, d.thumbRightId, d.winnerId || null, d.reactionTimeMs || null, d.positionOrder, d.timedOut ? 1 : 0);
      if (d.trackingData && d.trackingData.length > 0) {
        insertTracking.run(result.lastInsertRowid, JSON.stringify(d.trackingData));
      }
    }
  });

  insertAll(duels);

  // Compute median reaction time
  const times = db.prepare(
    'SELECT reaction_time_ms FROM duels WHERE session_id = ? AND reaction_time_ms IS NOT NULL ORDER BY reaction_time_ms'
  ).all(sessionId).map(r => r.reaction_time_ms);

  let median = null;
  if (times.length > 0) {
    const mid = Math.floor(times.length / 2);
    median = times.length % 2 !== 0 ? times[mid] : (times[mid - 1] + times[mid]) / 2;
  }

  const isValid = median !== null && median >= 500 && median <= 2800 ? 1 : 0;
  db.prepare("UPDATE sessions SET median_reaction_time = ?, is_valid = ?, completed_at = datetime('now') WHERE id = ?")
    .run(median, isValid, sessionId);

  res.json({ ok: true, median, isValid });
});

router.post('/session/:id/memory', (req, res) => {
  const { recognized } = req.body; // array of thumbnail ids recognized
  const sessionId = req.params.id;

  // Get all thumbnails that were shown in this session's duels
  const shown = db.prepare(`
    SELECT DISTINCT t.id FROM thumbnails t
    WHERE t.id IN (
      SELECT thumb_left_id FROM duels WHERE session_id = ?
      UNION
      SELECT thumb_right_id FROM duels WHERE session_id = ?
    )
  `).all(sessionId, sessionId);

  const insert = db.prepare('INSERT INTO memory_tests (session_id, thumbnail_id, was_recognized) VALUES (?, ?, ?)');
  const insertAll = db.transaction(() => {
    for (const thumb of shown) {
      const wasRecognized = recognized.includes(thumb.id) ? 1 : 0;
      insert.run(sessionId, thumb.id, wasRecognized);
    }
  });
  insertAll();

  res.json({ ok: true });
});

// --- Click heatmap ---
router.post('/session/:id/clicks', (req, res) => {
  const { clicks } = req.body; // array of { thumbnailId, xPct, yPct, clickTimeMs }
  const sessionId = req.params.id;

  const session = db.prepare('SELECT id FROM sessions WHERE id = ?').get(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session introuvable' });
  }

  const insert = db.prepare(
    'INSERT INTO click_heatmap (session_id, thumbnail_id, x_pct, y_pct, click_time_ms) VALUES (?, ?, ?, ?, ?)'
  );

  const insertAll = db.transaction((clicksList) => {
    for (const c of clicksList) {
      insert.run(sessionId, c.thumbnailId, c.xPct, c.yPct, c.clickTimeMs);
    }
  });

  insertAll(clicks);
  res.json({ ok: true });
});

// --- Results ---
router.get('/results', requireAdmin, (req, res) => {
  const thumbnails = db.prepare('SELECT * FROM thumbnails').all();

  const totalSessions = db.prepare('SELECT COUNT(*) as c FROM sessions WHERE completed_at IS NOT NULL').get().c;
  const validSessions = db.prepare('SELECT COUNT(*) as c FROM sessions WHERE is_valid = 1').get().c;

  const results = [];

  for (const thumb of thumbnails) {
    // Win rate
    const totalDuels = db.prepare(`
      SELECT COUNT(*) as c FROM duels d
      JOIN sessions s ON d.session_id = s.id
      WHERE s.is_valid = 1 AND (d.thumb_left_id = ? OR d.thumb_right_id = ?)
    `).get(thumb.id, thumb.id).c;

    const wins = db.prepare(`
      SELECT COUNT(*) as c FROM duels d
      JOIN sessions s ON d.session_id = s.id
      WHERE s.is_valid = 1 AND d.winner_id = ?
    `).get(thumb.id).c;

    const winRate = totalDuels > 0 ? wins / totalDuels : 0;

    // Average reaction time when this thumb wins
    const avgReaction = db.prepare(`
      SELECT AVG(d.reaction_time_ms) as avg_rt FROM duels d
      JOIN sessions s ON d.session_id = s.id
      WHERE s.is_valid = 1 AND d.winner_id = ? AND d.reaction_time_ms IS NOT NULL
    `).get(thumb.id).avg_rt || 0;

    const speedNorm = Math.max(0, Math.min(1, (2800 - avgReaction) / (2800 - 500)));

    // Memory score
    const memoryTotal = db.prepare(`
      SELECT COUNT(*) as c FROM memory_tests m
      JOIN sessions s ON m.session_id = s.id
      WHERE s.is_valid = 1 AND m.thumbnail_id = ?
    `).get(thumb.id).c;

    const memoryRecognized = db.prepare(`
      SELECT COUNT(*) as c FROM memory_tests m
      JOIN sessions s ON m.session_id = s.id
      WHERE s.is_valid = 1 AND m.thumbnail_id = ? AND m.was_recognized = 1
    `).get(thumb.id).c;

    const memoryScore = memoryTotal > 0 ? memoryRecognized / memoryTotal : 0;

    // Composite score
    const compositeScore = winRate * 0.50 + speedNorm * 0.35 + memoryScore * 0.15;

    results.push({
      id: thumb.id,
      filename: thumb.filename,
      original_name: thumb.original_name,
      totalDuels,
      wins,
      winRate,
      avgReactionMs: Math.round(avgReaction),
      speedNorm,
      memoryScore,
      memoryTotal,
      memoryRecognized,
      compositeScore,
    });
  }

  // Sort by composite score descending
  results.sort((a, b) => b.compositeScore - a.compositeScore);

  res.json({
    results,
    stats: {
      totalSessions,
      validSessions,
      totalVariants: thumbnails.length,
    },
  });
});

// --- Heatmap data ---
router.get('/results/heatmap/:thumbId', requireAdmin, (req, res) => {
  const thumbId = req.params.thumbId;

  // Get tracking data for duels where this thumbnail was shown
  const rows = db.prepare(`
    SELECT mt.data FROM mouse_tracking mt
    JOIN duels d ON mt.duel_id = d.id
    JOIN sessions s ON d.session_id = s.id
    WHERE s.is_valid = 1 AND (d.thumb_left_id = ? OR d.thumb_right_id = ?)
  `).all(thumbId, thumbId);

  const points = [];
  for (const row of rows) {
    try {
      const data = JSON.parse(row.data);
      points.push(...data);
    } catch {}
  }

  res.json({ points });
});

// --- Click heatmap results ---
router.get('/results/clicks/:thumbId', requireAdmin, (req, res) => {
  const thumbId = req.params.thumbId;

  const clicks = db.prepare(`
    SELECT ch.x_pct, ch.y_pct, ch.click_time_ms FROM click_heatmap ch
    JOIN sessions s ON ch.session_id = s.id
    WHERE s.is_valid = 1 AND ch.thumbnail_id = ?
  `).all(thumbId);

  res.json({ clicks });
});

module.exports = router;
