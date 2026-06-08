'use client';

import { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { Play, Tv } from 'lucide-react';
import { Channel } from '@/lib/types';

export default function LiveTVPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    fetch('/api/channels')
      .then(res => res.json())
      .then(data => {
        if (data.channels) {
          setChannels(data.channels);
          if (data.channels.length > 0) {
            setActiveChannel(data.channels[0]);
          }
        }
      })
      .catch(err => {
        console.error(err);
        setError('Kanallar yüklenemedi.');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!activeChannel || !videoRef.current) return;

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

      hls.loadSource(activeChannel.streamUrl);
      hls.attachMedia(videoRef.current);

      let networkErrorCount = 0;
      let mediaErrorCount = 0;

      hls.on(Hls.Events.ERROR, function (event, data) {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              if (networkErrorCount < 3) {
                hls.startLoad();
                networkErrorCount++;
              } else {
                setError('Yayın bağlantısı kurulamıyor. Yayın kapalı olabilir.');
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
        setError('');
        videoRef.current?.play().catch(() => console.log('Autoplay prevented'));
      });
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      videoRef.current.src = activeChannel.streamUrl;
      videoRef.current.addEventListener('loadedmetadata', () => {
        videoRef.current?.play();
      });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [activeChannel]);

  if (loading) {
    return <div className="pt-32 text-center text-white">Kanallar yükleniyor...</div>;
  }

  return (
    <div className="flex flex-col md:flex-row h-screen pt-20 bg-black">
      {/* Sidebar - Channels List */}
      <div className="w-full md:w-80 bg-zinc-900 border-r border-zinc-800 overflow-y-auto flex flex-col h-[40vh] md:h-full">
        <div className="p-4 border-b border-zinc-800 bg-zinc-900 sticky top-0 z-10 flex items-center gap-2">
          <Tv className="text-red-500 w-6 h-6 animate-pulse" />
          <h2 className="text-xl font-bold text-white">Canlı Kanallar</h2>
        </div>
        <div className="p-2 flex flex-col gap-2">
          {channels.map(channel => (
            <button
              key={channel.id}
              onClick={() => {
                setError('');
                setActiveChannel(channel);
              }}
              className={`flex items-center gap-4 p-3 rounded-md transition-all ${
                activeChannel?.id === channel.id 
                  ? 'bg-zinc-800 border-l-4 border-blue-500 text-white shadow-lg' 
                  : 'bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              {channel.logoUrl ? (
                <img src={channel.logoUrl} alt={channel.name} className="w-12 h-12 object-contain bg-white/5 rounded-md p-1" />
              ) : (
                <div className="w-12 h-12 bg-zinc-800 rounded-md flex items-center justify-center text-xs font-bold text-zinc-500">
                  TV
                </div>
              )}
              <div className="flex flex-col items-start flex-1 text-left overflow-hidden">
                <span className="font-bold truncate w-full">{channel.name}</span>
                {activeChannel?.id === channel.id && (
                  <span className="text-xs text-red-500 font-bold flex items-center gap-1 mt-1">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" /> CANLI
                  </span>
                )}
              </div>
            </button>
          ))}
          {channels.length === 0 && (
            <div className="text-zinc-500 text-center p-4">Kanal bulunamadı.</div>
          )}
        </div>
      </div>

      {/* Main Content - Video Player */}
      <div className="flex-1 flex flex-col relative bg-black h-[60vh] md:h-full">
        {activeChannel ? (
          <>
            <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-md px-4 py-2 rounded-md flex items-center gap-3">
              {activeChannel.logoUrl && <img src={activeChannel.logoUrl} className="h-8 object-contain" alt="" />}
              <div>
                <h1 className="text-white font-bold text-lg">{activeChannel.name}</h1>
                <span className="text-red-500 text-xs font-bold uppercase">Canlı Yayın</span>
              </div>
            </div>
            
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
                <p className="text-red-500 text-lg font-bold bg-zinc-900/80 px-6 py-4 rounded-lg border border-red-900">
                  {error}
                </p>
              </div>
            )}

            <video
              ref={videoRef}
              className="w-full h-full object-contain"
              controls
              autoPlay
              crossOrigin="anonymous"
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-zinc-500">
            İzlemek için sol menüden bir kanal seçin
          </div>
        )}
      </div>
    </div>
  );
}
