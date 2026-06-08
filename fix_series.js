/**
 * fix_series.js
 * Consolidates all the badly imported series/episode data.
 * Run once with:  node fix_series.js
 */

const fs   = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'database.json');

// ─── Parser (JS version of src/lib/series-parser.ts) ──────────────────────
const LANG_SUFFIX = /\s*[-–]?\s*(Dublaj|Altyaz[ıi]|Altyazi|Sub(?:title)?|Dub(?:bed)?)$/i;

function cleanBase(raw) {
  return raw
    .replace(/\s*[-–]\s*(Dublaj|Altyaz[ıi]|Altyazi|Sub(?:title)?|Dub(?:bed)?)$/i, '')
    .replace(/[\s\-–]+$/, '')
    .trim();
}

function parseSeriesTitle(raw) {
  const title = raw.trim();

  // 1. S01E01
  let m = title.match(/^(.*?)\s*[Ss](\d+)\s*[Ee](\d+)/);
  if (m) return mk(m[1], +m[2], +m[3], true);

  // 2. 2SE3
  m = title.match(/^(.*?)\s*(\d+)\s*[Ss][Ee](\d+)/);
  if (m) return mk(m[1], +m[2], +m[3], true);

  // 3. "1.S ... Bölüm 5" or "1.S ... 5.Bölüm"
  m = title.match(/^(.*?)\s*(\d+)\s*\.?\s*[Ss](?:ezon)?\b.*?\bBölüm\s*(\d+)/i)
   || title.match(/^(.*?)\s*(\d+)\s*\.?\s*[Ss](?:ezon)?\b.*?(\d+)\s*\.?\s*(?:Bölüm|Bolum)\b/i);
  if (m) return mk(m[1], +m[2], +m[3], true);

  // 4. "Sezon 2 Bölüm 3"
  m = title.match(/^(.*?)\s*Sezon\s*(\d+)\b.*?\bBölüm\s*(\d+)/i)
   || title.match(/^(.*?)\s*Sezon\s*(\d+)\b.*?(\d+)\s*\.?\s*(?:Bölüm|Bolum)\b/i);
  if (m) return mk(m[1], +m[2], +m[3], true);

  // 5. Season present + episode elsewhere
  const sm = title.match(/^(.*?)\s*(\d+)\s*\.?\s*[Ss](?:ezon)?\b/i);
  const em = title.match(/\bBölüm\s*(\d+)/i)
          || title.match(/\bBolum\s*(\d+)/i)
          || title.match(/(\d+)\s*\.?\s*(?:Bölüm|Bolum|B)\b/i)
          || title.match(/\bEp(?:isode)?\s*(\d+)/i);
  if (sm && em) return mk(sm[1], +sm[2], +(em[1]), true);

  // 6. "Title - 1.S Dublaj" — season header, no episode
  m = title.match(/^(.*?)\s*[-–]?\s*(\d+)\s*\.?\s*[Ss](?:ezon)?\b/i);
  if (m) {
    const base = cleanBase(m[1]);
    if (base.length >= 2) return mk(base, +m[2], 1, false);
  }

  // 7. Episode-only: "Yargı Bölüm 52"
  const eoM = title.match(/^(.*?)\s*[-–]?\s*Bölüm\s*(\d+)/i)
           || title.match(/^(.*?)\s*[-–]?\s*Bolum\s*(\d+)/i)
           || title.match(/^(.*?)\s*[-–]?\s*Ep(?:isode)?\s*(\d+)/i)
           || title.match(/^(.*?)\s*(\d+)\s*\.?\s*(?:Bölüm|Bolum)\b/i);
  if (eoM) return mk(eoM[1], 1, +eoM[2], true);

  // 8. Trailing number
  const numM = title.match(/^(.*?)\s+(\d+)$/);
  if (numM && numM[1].length >= 2) return mk(numM[1], 1, +numM[2], true);

  return { seriesTitle: cleanBase(title) || title, seasonNumber: 1, episodeNumber: 1, hasEpisodeMarker: false };
}

function mk(rawTitle, season, episode, hasEp) {
  return {
    seriesTitle: cleanBase(rawTitle) || rawTitle.trim(),
    seasonNumber: isNaN(season) ? 1 : season,
    episodeNumber: isNaN(episode) ? 1 : episode,
    hasEpisodeMarker: hasEp,
  };
}

// ─── Migration ─────────────────────────────────────────────────────────────
const raw = fs.readFileSync(DB_PATH, 'utf8');
const db  = JSON.parse(raw);

const oldSeriesCount  = db.series.length;
const oldEpCount      = db.episodes.length;

// Build a map: cleanTitle(lowercase) → existing or new series object
const seriesMap = new Map(); // cleanTitle.lower → { id, title, bannerUrl, categories, story, isM3U }
const newEpisodes = [];

// Seed map with M3U series that can already be re-parsed to a clean title
// We intentionally SKIP non-M3U (manually added) series — keep them as-is.
const manualSeries = db.series.filter(s => !s.isM3U);
manualSeries.forEach(s => seriesMap.set(s.title.toLowerCase(), s));

// Re-process all M3U episodes
const m3uEpisodes = db.episodes.filter(e => {
  const parentSeries = db.series.find(s => s.id === e.seriesId);
  return parentSeries?.isM3U;
});

m3uEpisodes.forEach(ep => {
  const parsed = parseSeriesTitle(ep.title);
  // Fall back to category of the parent series if we couldn't extract anything
  const parentSeries = db.series.find(s => s.id === ep.seriesId);
  const cleanTitle = (parsed.seriesTitle?.length >= 2)
    ? parsed.seriesTitle
    : (parentSeries?.title ?? ep.title);

  const key = cleanTitle.toLowerCase();
  if (!seriesMap.has(key)) {
    seriesMap.set(key, {
      id: parentSeries?.id ?? require('crypto').randomUUID(),
      title: cleanTitle,
      story: parentSeries?.story ?? '',
      isM3U: true,
      bannerUrl: ep.bannerUrl ?? parentSeries?.bannerUrl ?? '',
      categories: parentSeries?.categories ?? [],
    });
  }

  const targetSeries = seriesMap.get(key);
  newEpisodes.push({
    id: ep.id,
    seriesId: targetSeries.id,
    seasonNumber: parsed.seasonNumber,
    episodeNumber: parsed.episodeNumber,
    title: ep.title,
    videoUrl: ep.videoUrl,
  });
});

// Also keep non-M3U episodes unchanged
const manualEpisodes = db.episodes.filter(e => {
  const parentSeries = db.series.find(s => s.id === e.seriesId);
  return !parentSeries?.isM3U;
});

db.series   = Array.from(seriesMap.values());
db.episodes = [...manualEpisodes, ...newEpisodes];

// Backup original
fs.writeFileSync(DB_PATH + '.bak', raw, 'utf8');
fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');

console.log(`Done.`);
console.log(`  Series:  ${oldSeriesCount}  →  ${db.series.length}  (cleaned ${oldSeriesCount - db.series.length} duplicates)`);
console.log(`  Episodes: ${oldEpCount}  →  ${db.episodes.length}`);
