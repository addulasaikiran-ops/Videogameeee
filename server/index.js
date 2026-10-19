// Optional WakeHimWithLove companion server — the game runs fully without it.
// Start with `npm run server` and point the client at it via VITE_API_URL.
// Stores data as JSON files under server/data/ (no database needed).
import express from 'express';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const dataDir = join(dirname(fileURLToPath(import.meta.url)), 'data');
mkdirSync(dataDir, { recursive: true });
const read = (name, dflt) => { const p = join(dataDir, name); return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : dflt; };
const write = (name, v) => writeFileSync(join(dataDir, name), JSON.stringify(v, null, 2));

const app = express();
app.use(express.json({ limit: '256kb' }));
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOW_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.get('/api/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

// ── cloud saves ── POST {playerId, save} upserts; GET returns latest.
const validId = (s) => typeof s === 'string' && /^[a-zA-Z0-9_-]{3,64}$/.test(s);
app.post('/api/cloud-save', (req, res) => {
  const { playerId, save } = req.body || {};
  if (!validId(playerId)) return res.status(400).json({ error: 'bad playerId' });
  if (!save || typeof save !== 'object' || save.version !== 2) return res.status(400).json({ error: 'bad save' });
  const all = read('saves.json', {});
  all[playerId] = { save, updatedAt: Date.now() };
  write('saves.json', all);
  res.json({ ok: true, updatedAt: all[playerId].updatedAt });
});
app.get('/api/cloud-save/:playerId', (req, res) => {
  const row = read('saves.json', {})[req.params.playerId];
  if (!row) return res.status(404).json({ error: 'not found' });
  res.json(row);
});

// ── leaderboard ── POST {levelId, name, timeSec, hearts} appends; GET top 10/level.
app.post('/api/leaderboard', (req, res) => {
  const { levelId, name, timeSec, hearts } = req.body || {};
  if (typeof levelId !== 'string' || !levelId) return res.status(400).json({ error: 'bad levelId' });
  if (typeof timeSec !== 'number' || !(timeSec > 0) || timeSec > 86400) return res.status(400).json({ error: 'bad timeSec' });
  const entry = {
    id: crypto.randomBytes(6).toString('hex'),
    name: String(name || 'runner').slice(0, 24),
    timeSec: Math.round(timeSec * 100) / 100,
    hearts: Number.isInteger(hearts) ? hearts : 0,
    at: Date.now(),
  };
  const all = read('leaderboard.json', {});
  (all[levelId] ||= []).push(entry);
  all[levelId].sort((a, b) => a.timeSec - b.timeSec);
  all[levelId] = all[levelId].slice(0, 100);
  write('leaderboard.json', all);
  res.json({ ok: true, rank: all[levelId].findIndex((e) => e.id === entry.id) + 1 });
});
app.get('/api/leaderboard', (req, res) => {
  const { levelId } = req.query;
  const all = read('leaderboard.json', {});
  res.json({ levelId: levelId || null, entries: (all[levelId] || []).slice(0, 10) });
});

const port = process.env.PORT || 8787;
app.listen(port, () => console.log(`WakeHimWithLove server on http://localhost:${port} (health: /api/health)`));
