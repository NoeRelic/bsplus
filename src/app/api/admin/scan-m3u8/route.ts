import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ success: false, error: 'URL gereklidir' });
    }

    // Yalnızca m3u8 uzantılı ise tarama yap (mp4 veya mkv gibi düz dosyalarda ses kanalı manifestte olmaz)
    if (!url.toLowerCase().includes('.m3u8')) {
      return NextResponse.json({ success: true, tracks: [] });
    }

    const res = await fetch(url);
    if (!res.ok) {
      return NextResponse.json({ success: false, error: 'M3U8 kaynağına ulaşılamadı (CORS veya 404)' });
    }

    const text = await res.text();
    
    // #EXT-X-MEDIA:TYPE=AUDIO etiketlerini bul
    const lines = text.split('\n');
    const audioTracks = [];

    for (const line of lines) {
      if (line.startsWith('#EXT-X-MEDIA:TYPE=AUDIO')) {
        // Örnek: #EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio",LANGUAGE="tr",NAME="Türkçe",DEFAULT=YES,URI="audio_tr.m3u8"
        const nameMatch = line.match(/NAME="([^"]+)"/);
        const langMatch = line.match(/LANGUAGE="([^"]+)"/);
        const uriMatch = line.match(/URI="([^"]+)"/);

        if (nameMatch) {
          audioTracks.push({
            name: nameMatch[1],
            language: langMatch ? langMatch[1] : 'unknown',
            uri: uriMatch ? uriMatch[1] : null
          });
        }
      }
    }

    return NextResponse.json({ success: true, tracks: audioTracks });

  } catch (error) {
    console.error('M3U8 Scan Error:', error);
    return NextResponse.json({ success: false, error: 'Tarama sırasında bir hata oluştu' });
  }
}

