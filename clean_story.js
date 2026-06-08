const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'database.json');
const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

let updated = 0;

if (data.movies) {
  for (const m of data.movies) {
    if (m.story === 'M3U Dosyasından içe aktarıldı.') {
      m.story = '';
      m.isM3U = true;
      updated++;
    }
  }
}

if (data.series) {
  for (const s of data.series) {
    if (s.story === 'M3U Dosyasından içe aktarıldı.') {
      s.story = '';
      s.isM3U = true;
      updated++;
    }
  }
}

if (updated > 0) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Successfully cleaned ${updated} items.`);
} else {
  console.log('No items needed cleaning.');
}
