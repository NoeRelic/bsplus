const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'database.json');
const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

if (data.movies) {
  data.movies = data.movies.filter(m => !m.isM3U);
}

let seriesToDelete = [];
if (data.series) {
  seriesToDelete = data.series.filter(s => s.isM3U).map(s => s.id);
  data.series = data.series.filter(s => !s.isM3U);
}

if (data.episodes) {
  data.episodes = data.episodes.filter(e => !seriesToDelete.includes(e.seriesId));
}

fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
console.log('M3U wipe completed.');
