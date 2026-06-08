/**
 * Parses a raw M3U title into structured series info.
 *
 * Handles formats like:
 *   - "Teen Wolf - 2.S Dublaj - Bölüm 5"
 *   - "Mahkum - Sezon 1 - Bölüm 3"
 *   - "The Walking Dead S04E05"
 *   - "Yargı 2SE3"
 *   - "Lost 4.S 12.Bolum"
 *   - "Bandi 1.S Altyazı - Bölüm 3"
 *   - "Teen Wolf - 1.S Dublaj"   ← season-only header, no episode marker
 *   - "Yargı 52. Bölüm"
 */
export interface ParsedSeries {
  seriesTitle: string;
  seasonNumber: number;
  episodeNumber: number;
  /** true if an episode marker was found (Bölüm, S01E01, etc.) */
  hasEpisodeMarker: boolean;
}

const LANG_SUFFIX = /\s*[-–]?\s*(?:Dublaj|Altyaz[ıi]|Altyazi|Sub(?:title)?|Dub(?:bed)?)\s*$/i;

export function parseSeriesTitle(raw: string): ParsedSeries {
  let title = raw.trim();

  // ── 1. S01E01 / s1e2 / S01 E01
  let m = title.match(/^(.*?)\s*[Ss](\d+)\s*[Ee](\d+)/);
  if (m) return result(m[1], +m[2], +m[3], true);

  // ── 2. 2SE3 / 2se3
  m = title.match(/^(.*?)\s*(\d+)\s*[Ss][Ee](\d+)/);
  if (m) return result(m[1], +m[2], +m[3], true);

  // ── 3. "1.S ... Bölüm 5"  or  "1.S ... 5.Bölüm"
  m = title.match(/^(.*?)\s*(\d+)\s*\.?\s*[Ss](?:ezon)?\b.*?\bBölüm\s*(\d+)/i)
   || title.match(/^(.*?)\s*(\d+)\s*\.?\s*[Ss](?:ezon)?\b.*?(\d+)\s*\.?\s*(?:Bölüm|Bolum)\b/i);
  if (m) return result(m[1], +m[2], +m[3], true);

  // ── 4. "Sezon 2 Bölüm 3" / "Sezon 2 - Bölüm 3"
  m = title.match(/^(.*?)\s*Sezon\s*(\d+)\b.*?\bBölüm\s*(\d+)/i)
   || title.match(/^(.*?)\s*Sezon\s*(\d+)\b.*?(\d+)\s*\.?\s*(?:Bölüm|Bolum)\b/i);
  if (m) return result(m[1], +m[2], +m[3], true);

  // ── 5. "4.S 12.Bolum" / "1.S Altyazı - Bölüm 3" — season present, episode present elsewhere
  m = title.match(/^(.*?)\s*(\d+)\s*\.?\s*[Ss](?:ezon)?\b/i);
  const epM = title.match(/\bBölüm\s*(\d+)/i)
           || title.match(/\bBolum\s*(\d+)/i)
           || title.match(/(\d+)\s*\.?\s*(?:Bölüm|Bolum|B)\b/i)
           || title.match(/\bEp(?:isode)?\s*(\d+)/i);
  if (m && epM) {
    return result(m[1], +m[2], +(epM[1]), true);
  }

  // ── 6. "Title - 1.S Dublaj" — season header with no episode marker
  m = title.match(/^(.*?)\s*[-–]?\s*(\d+)\s*\.?\s*[Ss](?:ezon)?\b/i);
  if (m) {
    // Strip language suffix from base
    const base = m[1].replace(LANG_SUFFIX, '').replace(/[\s-–]+$/, '').trim();
    if (base.length >= 2) return result(base, +m[2], 1, false);
  }

  // ── 7. "Yargı Bölüm 52" / "Yargı 52. Bölüm" / "Yargı - Ep 52"
  const epOnlyM = title.match(/^(.*?)\s*[-–]?\s*Bölüm\s*(\d+)/i)
               || title.match(/^(.*?)\s*[-–]?\s*Bolum\s*(\d+)/i)
               || title.match(/^(.*?)\s*[-–]?\s*Ep(?:isode)?\s*(\d+)/i)
               || title.match(/^(.*?)\s*(\d+)\s*\.?\s*(?:Bölüm|Bolum)\b/i);
  if (epOnlyM) return result(epOnlyM[1], 1, +epOnlyM[2], true);

  // ── 8. Trailing number only: "Yargı 52"
  const numM = title.match(/^(.*?)\s+(\d+)$/);
  if (numM && numM[1].length >= 2) return result(numM[1], 1, +numM[2], true);

  // ── Fallback: no info found
  return { seriesTitle: title.replace(LANG_SUFFIX, '').replace(/[\s-–]+$/, '').trim() || title, seasonNumber: 1, episodeNumber: 1, hasEpisodeMarker: false };
}

function result(rawTitle: string, season: number, episode: number, hasEp: boolean): ParsedSeries {
  const seriesTitle = rawTitle
    .replace(/\s*[-–]\s*(Dublaj|Altyaz[ıi]|Altyazi|Sub(?:title)?|Dub(?:bed)?)\s*$/i, '')
    .replace(/[\s-–]+$/, '')
    .trim();
  return {
    seriesTitle: seriesTitle || rawTitle.trim(),
    seasonNumber: isNaN(season) ? 1 : season,
    episodeNumber: isNaN(episode) ? 1 : episode,
    hasEpisodeMarker: hasEp,
  };
}
