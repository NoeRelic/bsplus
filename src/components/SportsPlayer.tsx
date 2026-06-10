'use client';

import { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react';

interface SportsPlayerProps {
  channel: {
    name: string;
    logoUrl: string;
    streamUrl: string;
  }
}

export default function SportsPlayer({ channel }: SportsPlayerProps) {
  const [error, setError] = useState('');
  
  // Player state
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!channel?.streamUrl || !videoRef.current) return;

    const urlLower = channel.streamUrl.toLowerCase();
    const isNative = !urlLower.includes('.m3u8') && (urlLower.includes('.mp4') || urlLower.includes('.mkv') || urlLower.includes('.webm') || urlLower.includes('.ogg'));

    if (isNative) {
      videoRef.current.src = channel.streamUrl;
      videoRef.current.addEventListener('loadedmetadata', () => {
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

      hls.loadSource(channel.streamUrl);
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
                const proxyUrl = '/api/proxy-m3u8?url=' + encodeURIComponent(channel.streamUrl);
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
                if (String(eventData.details) === 'EXPIRED') {
                  setError('Yayın süresi dolmuştur.');
                } else {
                  setError('Medya hatası: Video oynatılamıyor.');
                }
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
        videoRef.current?.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      });
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      videoRef.current.src = channel.streamUrl;
      videoRef.current.addEventListener('loadedmetadata', () => {
        videoRef.current?.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [channel?.streamUrl]);

  // Handle Controls Visibility
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
    }
  };

  const handleMouseLeave = () => {
    if (isPlaying) setShowControls(false);
  };

  // Player Actions
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
        setShowControls(true);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !isMuted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
      if (newMuted) setVolume(0);
      else setVolume(videoRef.current.volume || 1);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => console.error(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div className="flex h-[calc(100vh-80px)] bg-black w-full pt-20">
      <div 
        ref={containerRef}
        className="relative w-full h-full flex items-center justify-center group overflow-hidden bg-black"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* LOGO WATERMARK (Always visible top right) */}
        <img 
          src={channel.logoUrl} 
          alt={channel.name} 
          className="absolute top-6 right-6 z-[60] w-24 h-auto object-contain pointer-events-none opacity-90 drop-shadow-2xl"
        />

        {/* Top Left Info (Visible with controls) */}
        <div className={`absolute top-6 left-6 z-50 transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          <div className="bg-black/60 backdrop-blur-md px-6 py-3 rounded-xl border border-white/10 shadow-2xl flex items-center gap-4">
            <div className="flex flex-col">
              <h1 className="text-white font-bold text-xl flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600 shadow-[0_0_8px_rgba(59,130,246,1)]"></span>
                </span>
                {channel.name}
              </h1>
              <span className="text-zinc-300 text-sm mt-1">Canlı Spor Yayını</span>
            </div>
          </div>
        </div>
        
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-40 backdrop-blur-sm">
            <div className="text-center">
              <p className="text-red-500 text-xl font-bold bg-zinc-900/80 px-8 py-6 rounded-xl border border-red-900 shadow-2xl">
                {error}
              </p>
              {!channel.streamUrl && (
                <p className="text-zinc-400 mt-4 text-sm">Yayın adresi geçerli değil.</p>
              )}
            </div>
          </div>
        )}

        {channel.streamUrl && (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-contain cursor-pointer"
              autoPlay
              playsInline
              crossOrigin="anonymous"
              onClick={togglePlay}
            />
            
            {/* Custom Controls Bottom Bar */}
            <div className={`absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-50 transition-opacity duration-500 flex flex-col gap-4 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              
              {/* Progress bar placeholder for Live TV */}
              <div className="w-full h-1 bg-blue-600/30 rounded-full overflow-hidden relative">
                <div className="absolute top-0 left-0 h-full bg-blue-600 w-full animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <button onClick={togglePlay} className="text-white hover:text-blue-500 hover:scale-110 transition-all drop-shadow-md">
                    {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current" />}
                  </button>

                  <div className="flex items-center gap-3 group/volume">
                    <button onClick={toggleMute} className="text-white hover:text-blue-500 transition-colors">
                      {isMuted || volume === 0 ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                    </button>
                    <input 
                      type="range" 
                      min="0" max="1" step="0.05"
                      value={volume}
                      onChange={handleVolumeChange}
                      className="w-0 opacity-0 group-hover/volume:w-24 group-hover/volume:opacity-100 transition-all duration-300 accent-blue-500 cursor-pointer"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                      <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-[0_0_5px_rgba(59,130,246,0.8)]">CANLI SPOR</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <button onClick={toggleFullscreen} className="text-white hover:text-blue-500 hover:scale-110 transition-all drop-shadow-md">
                    {isFullscreen ? <Minimize className="w-6 h-6" /> : <Maximize className="w-6 h-6" />}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
