import { NextResponse } from 'next/server';

const ESPN_WC_URL = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard';
const ESPN_FIXTURES_URL = (teamId: string) =>
  `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/teams/${teamId}/schedule`;

// Turkey's ESPN team ID for FIFA World Cup
const TURKEY_ESPN_ID = '211';

export const revalidate = 60; // Cache 60 seconds

export async function GET() {
  try {
    // Fetch today's scoreboard
    const [scoreboardRes, fixturesRes] = await Promise.allSettled([
      fetch(ESPN_WC_URL, { next: { revalidate: 60 } }),
      fetch(ESPN_FIXTURES_URL(TURKEY_ESPN_ID), { next: { revalidate: 300 } }),
    ]);

    let todayMatches: any[] = [];
    let turkeyMatches: any[] = [];

    // Parse today's matches
    if (scoreboardRes.status === 'fulfilled' && scoreboardRes.value.ok) {
      const data = await scoreboardRes.value.json();
      const events = data.events || [];
      todayMatches = events.map((ev: any) => {
        const comp = ev.competitions?.[0];
        const home = comp?.competitors?.find((c: any) => c.homeAway === 'home');
        const away = comp?.competitors?.find((c: any) => c.homeAway === 'away');
        const status = comp?.status;
        return {
          id: ev.id,
          name: ev.name,
          date: ev.date,
          status: status?.type?.name || 'scheduled',
          statusDetail: status?.type?.detail || '',
          homeTeam: home?.team?.displayName || '',
          homeScore: home?.score || '',
          homeLogo: home?.team?.logo || '',
          awayTeam: away?.team?.displayName || '',
          awayScore: away?.score || '',
          awayLogo: away?.team?.logo || '',
          venue: comp?.venue?.fullName || '',
          hasTurkey: [home?.team?.displayName, away?.team?.displayName]
            .some((t: string) => t?.toLowerCase().includes('türkiye') || t?.toLowerCase().includes('turkey') || t?.toLowerCase().includes('turkiye')),
        };
      });
    }

    // Parse Turkey fixtures
    if (fixturesRes.status === 'fulfilled' && fixturesRes.value.ok) {
      const data = await fixturesRes.value.json();
      const events = data.events || [];
      turkeyMatches = events
        .filter((ev: any) => {
          const d = new Date(ev.date);
          return d >= new Date(Date.now() - 24 * 60 * 60 * 1000); // today and future
        })
        .slice(0, 5)
        .map((ev: any) => {
          const comp = ev.competitions?.[0];
          const home = comp?.competitors?.find((c: any) => c.homeAway === 'home');
          const away = comp?.competitors?.find((c: any) => c.homeAway === 'away');
          const status = comp?.status;
          return {
            id: ev.id,
            date: ev.date,
            status: status?.type?.name || 'scheduled',
            homeTeam: home?.team?.displayName || '',
            homeScore: home?.score || '',
            homeLogo: home?.team?.logo || '',
            awayTeam: away?.team?.displayName || '',
            awayScore: away?.score || '',
            awayLogo: away?.team?.logo || '',
          };
        });
    }

    return NextResponse.json({ todayMatches, turkeyMatches });
  } catch (err: any) {
    console.error('WorldCup API error:', err);
    return NextResponse.json({ todayMatches: [], turkeyMatches: [] });
  }
}
