const mongoose = require('mongoose');
const fs = require('fs');

const MONGODB_URI = 'mongodb://batinsavasdev_db_user:Xe8SqsGBvCW4Raci@ac-u3cem60-shard-00-00.dtiiajm.mongodb.net:27017,ac-u3cem60-shard-00-01.dtiiajm.mongodb.net:27017,ac-u3cem60-shard-00-02.dtiiajm.mongodb.net:27017/bsplus?ssl=true&authSource=admin&retryWrites=true&w=majority';

async function migrate() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  // Read local DB
  const raw = fs.readFileSync('database.json', 'utf8');
  const oldDb = JSON.parse(raw);
  console.log('Read local database.json');

  // We don't have the mongoose models imported here since it's commonjs vs esm.
  // We can just use raw collections.
  const db = mongoose.connection.db;

  await db.collection('users').deleteMany({});
  await db.collection('profiles').deleteMany({});
  await db.collection('activesessions').deleteMany({});
  await db.collection('movies').deleteMany({});
  await db.collection('series').deleteMany({});
  await db.collection('episodes').deleteMany({});
  await db.collection('notifications').deleteMany({});
  await db.collection('comments').deleteMany({});
  await db.collection('configs').deleteMany({});

  if (oldDb.users?.length) await db.collection('users').insertMany(oldDb.users);
  if (oldDb.profiles?.length) await db.collection('profiles').insertMany(oldDb.profiles);
  if (oldDb.activeSessions?.length) await db.collection('activesessions').insertMany(oldDb.activeSessions);
  if (oldDb.movies?.length) await db.collection('movies').insertMany(oldDb.movies);
  if (oldDb.series?.length) await db.collection('series').insertMany(oldDb.series);
  if (oldDb.episodes?.length) await db.collection('episodes').insertMany(oldDb.episodes);
  if (oldDb.notifications?.length) await db.collection('notifications').insertMany(oldDb.notifications);
  if (oldDb.comments?.length) await db.collection('comments').insertMany(oldDb.comments);

  await db.collection('configs').insertOne({
    key: 'mainConfig',
    maintenance: oldDb.maintenance || false,
    dailyGoldSeries: oldDb.dailyGoldSeries || { date: '', seriesIds: [] },
    bsplusTv: oldDb.bsplusTv || { streamUrl: '', currentProgram: 'Şu an yayında içerik bulunmuyor.' }
  });

  console.log('Migration complete!');
  process.exit(0);
}

migrate().catch(console.error);
