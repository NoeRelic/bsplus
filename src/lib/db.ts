import fs from 'fs/promises';
import path from 'path';
import { Database } from './types';
import crypto from 'crypto';

const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NODE_ENV === 'production';
const originalDbPath = path.join(process.cwd(), 'database.json');
const dbPath = isServerless ? '/tmp/database.json' : originalDbPath;

// Global in-memory lock to prevent concurrent read/writes
let dbLock = Promise.resolve();

function acquireLock(): Promise<() => void> {
  let release: () => void;
  const newLock = new Promise<void>(resolve => {
    release = resolve;
  });
  const oldLock = dbLock;
  dbLock = oldLock.then(() => newLock);
  return oldLock.then(() => release);
}

export async function readDB(retries = 5): Promise<Database> {
  const unlock = await acquireLock();
  try {
    // Ensure file exists in writable path (e.g. /tmp) on serverless runtimes
    if (dbPath !== originalDbPath) {
      try {
        await fs.access(dbPath);
      } catch {
        try {
          await fs.copyFile(originalDbPath, dbPath);
        } catch (copyErr) {
          console.error('Failed to copy database to writable path:', copyErr);
        }
      }
    }

    for (let i = 0; i < retries; i++) {
      try {
        const data = await fs.readFile(dbPath, 'utf8');
        return JSON.parse(data) as Database;
      } catch (error: any) {
        if (error.code === 'ENOENT') {
          // Try original path first before returning empty
          try {
            const originalData = await fs.readFile(originalDbPath, 'utf8');
            return JSON.parse(originalData) as Database;
          } catch {
            return { series: [], dailyGoldSeries: undefined } as unknown as Database;
          }
        }
        if (i === retries - 1) throw error;
        await new Promise(r => setTimeout(r, 100 * (i + 1))); // Exponential backoff
      }
    }
    throw new Error('Database read failed');
  } finally {
    unlock();
  }
}

export async function writeDB(data: Database): Promise<void> {
  const unlock = await acquireLock();
  try {
    const tempPath = `${dbPath}.${crypto.randomUUID()}.tmp`;
    await fs.writeFile(tempPath, JSON.stringify(data, null, 2), 'utf8');
    
    // Retry rename for Windows EPERM
    let renamed = false;
    for (let i = 0; i < 5; i++) {
      try {
        await fs.rename(tempPath, dbPath);
        renamed = true;
        break;
      } catch (err: any) {
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
  } catch (error) {
    console.error('Failed to write database:', error);
    throw error;
  } finally {
    unlock();
  }
}

export async function getDailyGoldSeries(db: Database): Promise<string[]> {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  if (db.dailyGoldSeries?.date === today) {
    return db.dailyGoldSeries.seriesIds;
  }

  // Generate new 15 random series
  const shuffled = [...db.series].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, 15).map(s => s.id);

  db.dailyGoldSeries = {
    date: today,
    seriesIds: selected
  };

  await writeDB(db);
  return selected;
}
