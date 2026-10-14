import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// In-memory sync state
let sharedSyncData = null;

app.get('/api/sync', (req, res) => {
  res.json({ success: true, data: sharedSyncData });
});

app.post('/api/sync', (req, res) => {
  if (req.body) {
    sharedSyncData = req.body;
    return res.json({ success: true, syncedAt: new Date().toISOString() });
  }
  res.status(400).json({ success: false, error: 'Empty payload' });
});

// Serve static assets from public or root
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Bütçem server running at http://0.0.0.0:${PORT}`);
});
