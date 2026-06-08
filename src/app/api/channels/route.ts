import { NextResponse } from 'next/server';
import { readDB } from '@/lib/db';
import { Channel } from '@/lib/types';
import crypto from 'crypto';

export async function GET(req: Request) {
  try {
    const db = await readDB();
    const customChannels: Channel[] = db.channels || [];
    const livePlaylists = db.livePlaylists || [];

    const allChannels: Channel[] = [...customChannels];

    // Fetch and parse all live playlists
    for (const playlist of livePlaylists) {
      try {
        const res = await fetch(playlist.url, { next: { revalidate: 3600 } }); // Cache for 1 hour
        if (!res.ok) continue;
        const text = await res.text();
        const lines = text.split(/\r?\n/);

        let currentTitle = '';
        let currentBanner = '';

        for (const line of lines) {
          const l = line.trim();
          if (!l) continue;

          if (l.startsWith('#EXTINF:')) {
            const commaIdx = l.lastIndexOf(',');
            if (commaIdx > -1) {
              currentTitle = l.substring(commaIdx + 1).trim();
            } else {
              currentTitle = 'Kanal';
            }

            const logoMatch = l.match(/tvg-logo="([^"]+)"/);
            currentBanner = logoMatch ? logoMatch[1] : '';
          } 
          else if (!l.startsWith('#')) {
            // It's a stream URL
            if (l.includes('.m3u8') || l.includes('http')) {
              allChannels.push({
                id: crypto.randomUUID(),
                name: currentTitle,
                logoUrl: currentBanner,
                streamUrl: l
              });
            }
            currentTitle = '';
            currentBanner = '';
          }
        }
      } catch (e) {
        console.error('Error fetching playlist:', playlist.url, e);
      }
    }

    return NextResponse.json({ channels: allChannels });
  } catch (err: any) {
    console.error('Channels API Error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
