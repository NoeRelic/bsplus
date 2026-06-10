'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState, Suspense } from 'react';
import Hls from 'hls.js';
import Link from 'next/link';

function LivePlayer() {
  const params = useSearchParams();
  const streamUrl = params.get('url') || 'https://trt.daioncdn.net/trt-1/master.m3u8?app=web';
  const title = params.get('title') || 'Canlı Yayın';
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!streamUrl || !videoRef.current) return;

    const urlLower = streamUrl.toLowerCase();
    const isNative = !urlLower.includes('.m3u8') && (urlLower.includes('.mp4') || urlLower.includes('.mkv') || urlLower.includes('.webm') || urlLower.includes('.ogg'));

    if (isNative) {
      videoRef.current.src = streamUrl;
      videoRef.current.addEventListener('loadedmetadata', () => {
        setLoading(false);
        videoRef.current?.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      });
      return;
    }

    if (Hls.isSupported()) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }

      const hls = new Hls({
        maxBufferLength: 30,
        enableWorker: true,
        lowLatencyMode: true,
      });
      hlsRef.current = hls;

      hls.loadSource(streamUrl);
      hls.attachMedia(videoRef.current);

      let networkErrorCount = 0;
      let mediaErrorCount = 0;
      let isUsingProxy = false;

      hls.on(Hls.Events.ERROR, function (event, eventData) {
        if (eventData.fatal) {
          switch (eventData.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              if (networkErrorCount < 3) {
                hls.startLoad();
                networkErrorCount++;
              } else if (!isUsingProxy) {
                isUsingProxy = true;
                networkErrorCount = 0;
                const proxyUrl = '/api/proxy-m3u8?url=' + encodeURIComponent(streamUrl);
                hls.loadSource(proxyUrl);
              } else {
                setError('Yayın bağlantısı kurulamıyor. Yayın kapalı olabilir veya CORS engeli aşılamıyor.');
                hls.destroy();
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              if (mediaErrorCount < 3) {
                hls.recoverMediaError();
                mediaErrorCount++;
              } else {
                setError('Medya hatası: Video oynatılamıyor.');
                hls.destroy();
              }
              break;
            default:
              hls.destroy();
              break;
          }
        }
      });

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLoading(false);
        setError('');
        videoRef.current?.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      });
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      videoRef.current.src = streamUrl;
      videoRef.current.addEventListener('loadedmetadata', () => {
        setLoading(false);
        videoRef.current?.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      });
    } else {
      setError('Tarayıcınız bu formatı desteklemiyor.');
    }
  }, [streamUrl]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Back nav */}
      <div className="flex items-center gap-4 p-4 absolute top-0 left-0 z-20">
        <Link href="/" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Ana Sayfa
        </Link>
      </div>

      {/* Player */}
      <div className="relative flex-1 flex flex-col bg-black">
        {loading && !error && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-black">
            <div className="flex flex-col items-center gap-4">
              <svg className="animate-spin w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              <p className="text-zinc-400 text-sm">Canlı yayın yükleniyor...</p>
            </div>
          </div>
        )}
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-black">
            <div className="text-center">
              <p className="text-red-400 font-bold text-lg mb-2">⚠️ {error}</p>
              <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm">Ana sayfaya dön</Link>
            </div>
          </div>
        ) : (
          <video
            ref={videoRef}
            className="w-full h-screen object-contain bg-black"
            controls
            playsInline
          />
        )}
      </div>

      {/* Title bar */}
      <div className="absolute bottom-16 left-0 right-0 flex items-center justify-between px-6 py-3 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
            CANLI
          </span>
          <span className="text-white font-semibold text-sm">{title}</span>
        </div>
        <div className="font-extrabold text-base">
          <span className="text-blue-400">BS</span><span className="text-white">+</span>
        </div>
      </div>
    </div>
  );
}

export default function LiveWatchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white">Yükleniyor...</div>}>
      <LivePlayer />
    </Suspense>
  );
}
