const express = require('express');
const cors = require('cors');
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3005;
const API_KEY = process.env.DB_API_KEY || 'bsplus_secure_vds_db_key_2026';
const dbPath = path.join(__dirname, 'database.json');

app.use(cors());
app.use(express.json({ limit: '100mb' }));

// Auth Middleware
const authenticate = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized: Invalid API Key' });
  }
  next();
};

// Global in-memory lock
let dbLock = Promise.resolve();
function acquireLock() {
  let release;
  const newLock = new Promise(resolve => {
    release = resolve;
  });
  const oldLock = dbLock;
  dbLock = oldLock.then(() => newLock);
  return oldLock.then(() => release);
}

// GET DB
app.get('/api/db', authenticate, async (req, res) => {
  const unlock = await acquireLock();
  try {
    try {
      const data = await fs.readFile(dbPath, 'utf8');
      res.json(JSON.parse(data));
    } catch (err) {
      if (err.code === 'ENOENT') {
        res.json({ series: [], movies: [], users: [], profiles: [] });
      } else {
        res.status(500).json({ error: 'Failed to read database' });
      }
    }
  } finally {
    unlock();
  }
});

// POST DB
app.post('/api/db', authenticate, async (req, res) => {
  const unlock = await acquireLock();
  try {
    const data = req.body;
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ error: 'Invalid data payload' });
    }

    const tempPath = `${dbPath}.${crypto.randomUUID()}.tmp`;
    await fs.writeFile(tempPath, JSON.stringify(data, null, 2), 'utf8');
    
    // Windows and Linux safe atomic rename with retries
    let renamed = false;
    for (let i = 0; i < 5; i++) {
      try {
        await fs.rename(tempPath, dbPath);
        renamed = true;
        break;
      } catch (err) {
        if (err.code === 'EPERM' || err.code === 'EBUSY') {
          await new Promise(r => setTimeout(r, 100 * (i + 1)));
        } else {
          throw err;
        }
      }
    }

    if (!renamed) {
      throw new Error('Database write failed after retries');
    }

    // Optional: Keep a sliding backup history
    try {
      const backupDir = path.join(__dirname, 'backups');
      await fs.mkdir(backupDir, { recursive: true });
      const backupPath = path.join(backupDir, `database-${new Date().toISOString().slice(0, 13).replace(/:/g, '-')}.json`);
      await fs.copyFile(dbPath, backupPath);
      
      // Keep only last 10 backups
      const files = await fs.readdir(backupDir);
      if (files.length > 10) {
        const sorted = files.sort();
        for (let i = 0; i < files.length - 10; i++) {
          await fs.unlink(path.join(backupDir, sorted[i]));
        }
      }
    } catch (backupErr) {
      console.warn('Backup failed:', backupErr.message);
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Failed to write database:', err);
    res.status(500).json({ error: 'Failed to write database' });
  } finally {
    unlock();
  }
});

app.listen(PORT, () => {
  console.log(`BS+ DB API Server running on port ${PORT}`);
  console.log(`API Key: ${API_KEY}`);
});
