import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return new NextResponse('Missing URL', { status: 400 });
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Referer': new URL(targetUrl).origin + '/'
      }
    });

    if (!response.ok) {
      return new NextResponse('Failed to fetch M3U8', { status: response.status });
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('mpegurl') && !contentType.includes('application/x-mpegURL') && !targetUrl.includes('.m3u8')) {
      // Might not be an m3u8, but let's try anyway
    }

    const m3u8Text = await response.text();
    const targetUrlObj = new URL(targetUrl);
    const basePath = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);

    const lines = m3u8Text.split('\n');
    const rewrittenLines = lines.map((line: any) => {
      let trimmed = line.trim();
      if (!trimmed) return '';
      
      // Handle EXT-X-KEY URIs
      if (trimmed.startsWith('#EXT-X-KEY:')) {
        // e.g. #EXT-X-KEY:METHOD=AES-128,URI="key.bin"
        const uriMatch = trimmed.match(/URI="([^"]+)"/);
        if (uriMatch) {
          let keyUri = uriMatch[1];
          let absKeyUri = keyUri;
          if (!keyUri.startsWith('http')) {
            absKeyUri = keyUri.startsWith('/') ? targetUrlObj.origin + keyUri : basePath + keyUri;
          }
          // We can proxy the key through corsproxy
          const proxiedKey = `https://corsproxy.io/?${encodeURIComponent(absKeyUri)}`;
          return trimmed.replace(`URI="${keyUri}"`, `URI="${proxiedKey}"`);
        }
        return trimmed;
      }

      if (trimmed.startsWith('#')) return trimmed; // other tags

      // It's a segment or sub-playlist URI
      let absoluteUri = trimmed;
      if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
        if (trimmed.startsWith('/')) {
           absoluteUri = targetUrlObj.origin + trimmed;
        } else {
           absoluteUri = basePath + trimmed;
        }
      }

      // If it's a playlist, point back to our proxy
      if (absoluteUri.includes('.m3u8')) {
        const reqUrl = new URL(request.url);
        return `${reqUrl.origin}/api/proxy-m3u8?url=${encodeURIComponent(absoluteUri)}`;
      } else {
        // For TS segments, use corsproxy.io
        return `https://corsproxy.io/?${encodeURIComponent(absoluteUri)}`;
      }
    });

    return new NextResponse(rewrittenLines.join('\n'), {
      headers: {
        'Content-Type': 'application/vnd.apple.mpegurl',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error(error);
    return new NextResponse('Proxy error', { status: 500 });
  }
}
