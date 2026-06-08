'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';

const TRT1_STREAM = 'https://trt.daioncdn.net/trt-1/master.m3u8?app=web';
const WC_LOGO = 'https://upload.wikimedia.org/wikipedia/tr/thumb/1/19/2026_FIFA_D%C3%BCnya_Kupas%C4%B1.svg/960px-2026_FIFA_D%C3%BCnya_Kupas%C4%B1.svg.png';

// Turkey's known group stage matches (Group D) — hard-coded as backup
const TURKEY_SCHEDULE = [
  {
    id: 'tur1',
    date: '2026-06-13T22:00:00Z', // June 13, local 01:00 (June 14 TR)
    homeTeam: 'Avustralya',
    homeLogo: 'https://a.espncdn.com/i/teamlogos/countries/500/aus.png',
    awayTeam: 'Türkiye',
    awayLogo: 'https://a.espncdn.com/i/teamlogos/countries/500/tur.png',
    venue: 'BC Place – Vancouver',
    homeScore: null,
    awayScore: null,
  },
  {
    id: 'tur2',
    date: '2026-06-19T23:00:00Z',
    homeTeam: 'Türkiye',
    homeLogo: 'https://a.espncdn.com/i/teamlogos/countries/500/tur.png',
    awayTeam: 'Paraguay',
    awayLogo: 'https://a.espncdn.com/i/teamlogos/countries/500/par.png',
    venue: "Levi's Stadium – San Francisco",
    homeScore: null,
    awayScore: null,
  },
  {
    id: 'tur3',
    date: '2026-06-25T00:00:00Z',
    homeTeam: 'Türkiye',
    homeLogo: 'https://a.espncdn.com/i/teamlogos/countries/500/tur.png',
    awayTeam: 'Amerika Birleşik Devletleri',
    awayLogo: 'https://a.espncdn.com/i/teamlogos/countries/500/usa.png',
    venue: 'SoFi Stadium – Los Angeles',
    homeScore: null,
    awayScore: null,
  },
];

interface Match {
  id: string;
  date: string;
  status?: string;
  statusDetail?: string;
  homeTeam: string;
  homeLogo: string;
  homeScore?: string | null;
  awayTeam: string;
  awayLogo: string;
  awayScore?: string | null;
  venue?: string;
  hasTurkey?: boolean;
  name?: string;
}

function isMatchLive(dateStr: string): boolean {
  const matchDate = new Date(dateStr);
  const now = new Date();
  const diff = (now.getTime() - matchDate.getTime()) / 60000; // minutes
  return diff >= 0 && diff <= 120;
}

function isMatchDay(dateStr: string): boolean {
  const matchDate = new Date(dateStr);
  const now = new Date();
  return (
    matchDate.getFullYear() === now.getFullYear() &&
    matchDate.getMonth() === now.getMonth() &&
    matchDate.getDate() === now.getDate()
  );
}

function formatMatchDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    weekday: 'short',
  });
}

function formatMatchTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) + ' (TR)';
}

function MatchCard({ match, showLive = false }: { match: Match; showLive?: boolean }) {
  const live = isMatchLive(match.date) || match.status === 'in' || match.status === 'STATUS_IN_PROGRESS';
  const finished = match.status === 'post' || match.status === 'STATUS_FINAL';
  const hasScore = match.homeScore != null && match.awayScore != null && (match.homeScore !== '' || match.awayScore !== '');
  const today = isMatchDay(match.date);
  const canWatch = live && showLive;

  return (
    <div className={`relative flex flex-col gap-3 rounded-2xl p-4 border transition-all duration-300 ${
      live
        ? 'bg-gradient-to-br from-red-950/60 to-zinc-900 border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
        : match.hasTurkey
        ? 'bg-gradient-to-br from-blue-950/50 to-zinc-900 border-blue-600/30'
        : 'bg-zinc-900/60 border-zinc-800'
    }`}>
      {/* Live badge */}
      {live && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
          <span className="w-1.5 h-1.5 bg-white rounded-full" />
          CANLI
        </div>
      )}

      {/* Date/time */}
      <div className="text-[11px] text-zinc-500 font-medium">
        {formatMatchDate(match.date)} · {formatMatchTime(match.date)}
        {match.venue && <span className="ml-1">· {match.venue}</span>}
      </div>

      {/* Teams */}
      <div className="flex items-center justify-between gap-2">
        {/* Home */}
        <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
          <img
            src={match.homeLogo}
            alt={match.homeTeam}
            className="w-10 h-10 object-contain"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <span className="text-xs font-semibold text-zinc-200 text-center leading-tight line-clamp-2">
            {match.homeTeam}
          </span>
        </div>

        {/* Score / VS */}
        <div className="flex flex-col items-center px-2">
          {(hasScore || finished) ? (
            <div className="text-2xl font-extrabold text-white tabular-nums">
              {match.homeScore ?? '–'} : {match.awayScore ?? '–'}
            </div>
          ) : live ? (
            <div className="text-2xl font-extrabold text-red-400 tabular-nums">
              {match.homeScore ?? '0'} : {match.awayScore ?? '0'}
            </div>
          ) : (
            <div className="text-base font-bold text-zinc-400">
              {formatMatchTime(match.date).replace(' (TR)', '')}
            </div>
          )}
          {finished && <span className="text-[10px] text-zinc-500 mt-0.5">Tamamlandı</span>}
          {live && <span className="text-[10px] text-red-400 mt-0.5 font-bold">⏱ Canlı</span>}
        </div>

        {/* Away */}
        <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
          <img
            src={match.awayLogo}
            alt={match.awayTeam}
            className="w-10 h-10 object-contain"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <span className="text-xs font-semibold text-zinc-200 text-center leading-tight line-clamp-2">
            {match.awayTeam}
          </span>
        </div>
      </div>

      {/* Watch button — ONLY on match day + match hours */}
      {showLive && today && (
        live ? (
          <a
            href={`/watch/live?url=${encodeURIComponent(TRT1_STREAM)}&title=${encodeURIComponent('TRT 1 - Dünya Kupası Canlı')}`}
            className="mt-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white text-sm font-bold py-2.5 rounded-xl transition-all shadow-[0_0_14px_rgba(239,68,68,0.5)] hover:shadow-[0_0_20px_rgba(239,68,68,0.7)]"
          >
            <span className="w-2 h-2 bg-white rounded-full animate-ping absolute" />
            <span className="w-2 h-2 bg-white rounded-full" />
            Canlı İzle (TRT 1)
          </a>
        ) : (
          <div className="mt-1 flex items-center justify-center gap-2 bg-zinc-800 text-zinc-500 text-sm font-bold py-2.5 rounded-xl cursor-not-allowed border border-zinc-700">
            🔒 Maç Saatinde Açılır
          </div>
        )
      )}
    </div>
  );
}

export default function WorldCupSection() {
  const [todayMatches, setTodayMatches] = useState<Match[]>([]);
  const [turkeyMatches, setTurkeyMatches] = useState<Match[]>(TURKEY_SCHEDULE as Match[]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'turkey' | 'today'>('turkey');
  const pollingRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/worldcup');
      if (res.ok) {
        const data = await res.json();
        if (data.todayMatches?.length > 0) setTodayMatches(data.todayMatches);
        if (data.turkeyMatches?.length > 0) setTurkeyMatches(data.turkeyMatches);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    // Refresh every 60s for live scores
    pollingRef.current = setInterval(fetchData, 60_000);
    return () => clearInterval(pollingRef.current);
  }, []);

  const hasTodayTurkeyMatch = turkeyMatches.some(m => isMatchDay(m.date));
  const hasTodayAnyMatch = todayMatches.length > 0;

  return (
    <section className="mt-6 relative overflow-hidden rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-950 via-black to-zinc-950">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-950/20 via-transparent to-blue-950/20 pointer-events-none" />

      {/* Header */}
      <div className="relative flex flex-col md:flex-row md:items-center gap-6 p-6 md:p-8 border-b border-zinc-800">
        <div className="flex items-center gap-5">
          <img
            src={WC_LOGO}
            alt="2026 FIFA Dünya Kupası"
            className="w-20 h-20 object-contain drop-shadow-2xl"
          />
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white leading-tight">
              2026 FIFA Dünya Kupası
            </h2>
            <p className="text-zinc-400 text-sm mt-1">
              ABD · Kanada · Meksika &nbsp;|&nbsp; 11 Haziran – 19 Temmuz 2026
            </p>
            {hasTodayTurkeyMatch && (
              <div className="mt-2 inline-flex items-center gap-1.5 bg-red-600/20 text-red-400 text-xs font-bold px-3 py-1 rounded-full border border-red-600/30 animate-pulse">
                🔴 Bugün Türkiye Maçı Var!
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 md:ml-auto">
          <button
            onClick={() => setTab('turkey')}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
              tab === 'turkey'
                ? 'bg-red-600 text-white shadow-[0_0_12px_rgba(220,38,38,0.5)]'
                : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 border border-zinc-700'
            }`}
          >
            🇹🇷 Türkiye
          </button>
          <button
            onClick={() => setTab('today')}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
              tab === 'today'
                ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.5)]'
                : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 border border-zinc-700'
            }`}
          >
            🌍 Bugünkü Maçlar
            {hasTodayAnyMatch && (
              <span className="ml-1.5 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {todayMatches.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="relative p-6 md:p-8">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-zinc-500">
            <svg className="animate-spin w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            Maç verileri yükleniyor...
          </div>
        ) : tab === 'turkey' ? (
          <div>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span>🇹🇷</span> Türkiye Grup Maçları – Grup D
            </h3>
            {turkeyMatches.length === 0 ? (
              <p className="text-zinc-500 text-sm">Türkiye maç bilgisi bulunamadı.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {turkeyMatches.map(m => (
                  <MatchCard key={m.id} match={m} showLive />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span>📅</span> Bugünkü Dünya Kupası Maçları
            </h3>
            {todayMatches.length === 0 ? (
              <div className="text-center py-10 text-zinc-500">
                <p className="text-4xl mb-3">⚽</p>
                <p className="font-semibold text-zinc-400">Bugün Dünya Kupası maçı yok</p>
                <p className="text-sm mt-1">Türkiye maçları için "Türkiye" sekmesine bakın</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {todayMatches.map(m => (
                  <MatchCard key={m.id} match={{ ...m, hasTurkey: m.hasTurkey }} showLive={m.hasTurkey} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer — BS Plus branding */}
      <div className="relative border-t border-zinc-800 px-6 md:px-8 py-4 flex items-center justify-between">
        <p className="text-xs text-zinc-600">Maç verileri ESPN/FIFA'dan otomatik güncellenir · 60sn</p>
        <div className="flex items-center gap-2">
          <div className="text-xs text-zinc-500">by</div>
          <div className="font-extrabold text-lg tracking-tight">
            <span className="text-blue-400">BS</span>
            <span className="text-white">+</span>
          </div>
        </div>
      </div>
    </section>
  );
}
