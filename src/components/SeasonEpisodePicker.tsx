'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Episode {
  id: string;
  seriesId: string;
  seasonNumber: number;
  episodeNumber: number;
  title: string;
  videoUrl?: string;
}

interface EpisodeGroup {
  episodeNumber: number;
  /** Primary episode (Dublaj preferred, else first found) */
  primary: Episode;
  hasDublaj: boolean;
  hasAltyazi: boolean;
}

function groupEpisodes(episodes: Episode[]): EpisodeGroup[] {
  const map = new Map<number, EpisodeGroup>();
  const sorted = [...episodes].sort((a, b) => a.episodeNumber - b.episodeNumber);

  for (const ep of sorted) {
    const isDublaj = /dublaj/i.test(ep.title);
    const isAltyazi = /altyaz/i.test(ep.title);

    if (!map.has(ep.episodeNumber)) {
      map.set(ep.episodeNumber, {
        episodeNumber: ep.episodeNumber,
        primary: ep,
        hasDublaj: isDublaj,
        hasAltyazi: isAltyazi,
      });
    } else {
      const group = map.get(ep.episodeNumber)!;
      if (isDublaj) {
        group.hasDublaj = true;
        // Prefer dublaj as primary
        group.primary = ep;
      }
      if (isAltyazi) group.hasAltyazi = true;
    }
  }

  return Array.from(map.values());
}

interface Props {
  seasons: number[];
  episodesBySeason: Record<number, Episode[]>;
  userPackage: string;
}

export default function SeasonEpisodePicker({ seasons, episodesBySeason, userPackage }: Props) {
  const [activeSeason, setActiveSeason] = useState<number>(seasons[0] ?? 1);
  const groups = groupEpisodes(episodesBySeason[activeSeason] ?? []);

  return (
    <div className="flex flex-col gap-6">
      {/* ── Season Tabs ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {seasons.map(s => (
          <button
            key={s}
            onClick={() => setActiveSeason(s)}
            className={`px-5 py-2 rounded-full font-semibold text-sm transition-all duration-200 ${
              activeSeason === s
                ? 'bg-blue-600 text-white shadow-[0_0_14px_rgba(37,99,235,0.55)]'
                : 'bg-zinc-800/70 text-zinc-300 hover:bg-zinc-700 hover:text-white border border-zinc-700'
            }`}
          >
            Sezon {s}
          </button>
        ))}
      </div>

      {/* Info bar */}
      {groups.length > 0 && (
        <p className="text-xs text-zinc-500">
          {groups.length} bölüm
          {groups.some(g => g.hasDublaj && g.hasAltyazi) &&
            ' · Dublaj / Altyazı seçimi için oynatıcıdaki ⚙️ ayarlar menüsünü kullanın'}
        </p>
      )}

      {/* ── Episode Grid ─────────────────────────────────────────────── */}
      {groups.length === 0 ? (
        <p className="text-zinc-500">Bu sezon için bölüm bulunamadı.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {groups.map(group => {
            if (userPackage === 'Iron') {
              return (
                <div
                  key={group.episodeNumber}
                  className="relative flex flex-col gap-2 bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 opacity-50 cursor-not-allowed select-none"
                >
                  <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
                    S{activeSeason} · E{group.episodeNumber}
                  </span>
                  <span className="text-sm font-semibold text-zinc-400">{group.episodeNumber}. Bölüm</span>
                  <span className="absolute top-2 right-2 text-[10px] bg-red-700/80 text-red-200 px-2 py-0.5 rounded-full font-bold">
                    LOCK
                  </span>
                </div>
              );
            }

            return (
              <Link
                key={group.episodeNumber}
                href={`/watch/episode/${group.primary.id}`}
                className="group relative flex flex-col gap-2 bg-zinc-900/60 hover:bg-blue-900/20 border border-zinc-800 hover:border-blue-600/60 rounded-xl p-4 transition-all duration-200 hover:shadow-[0_0_18px_rgba(37,99,235,0.25)]"
              >
                <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
                  S{activeSeason} · E{group.episodeNumber}
                </span>
                <span className="text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors">
                  {group.episodeNumber}. Bölüm
                </span>

                {/* Language badges */}
                {(group.hasDublaj || group.hasAltyazi) && (
                  <div className="flex gap-1 flex-wrap mt-0.5">
                    {group.hasDublaj && (
                      <span className="text-[10px] bg-blue-700/40 text-blue-300 px-1.5 py-0.5 rounded font-medium border border-blue-700/30">
                        🎙️ Dublaj
                      </span>
                    )}
                    {group.hasAltyazi && (
                      <span className="text-[10px] bg-emerald-700/40 text-emerald-300 px-1.5 py-0.5 rounded font-medium border border-emerald-700/30">
                        💬 Altyazı
                      </span>
                    )}
                  </div>
                )}

                {/* Play overlay on hover */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-xl">
                  <span className="bg-blue-600/80 rounded-full w-9 h-9 flex items-center justify-center shadow-lg">
                    <svg className="w-4 h-4 text-white translate-x-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
