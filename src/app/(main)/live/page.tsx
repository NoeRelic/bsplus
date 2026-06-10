'use client';

import { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Calendar } from 'lucide-react';

interface BsPlusTvData {
  streamUrl: string;
  currentProgram: string;
  todaySchedules?: any[];
}

export default function LiveTVPage() {
  const [data, setData] = useState<BsPlusTvData | null>(null);
  const [loading, setLoading] = useState(true);
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

  const fetchLiveData = () => {
    fetch('/api/bsplus-tv')
      .then(res => res.json())
      .then(resData => {
        if (resData.bsplusTv) {
          setData({ ...resData.bsplusTv, todaySchedules: resData.todaySchedules || [] });
        } else {
          setError('Yayın bilgisi alınamadı.');
        }
      })
      .catch(err => {
        console.error(err);
        setError('Yayın bağlantısı kurulamadı.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLiveData();
    const interval = setInterval(() => {
      fetchLiveData();
    }, 60000); // Check every 60 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!data?.streamUrl || !videoRef.current) return;

    const urlLower = data.streamUrl.toLowerCase();
    const isNative = !urlLower.includes('.m3u8') && (urlLower.includes('.mp4') || urlLower.includes('.mkv') || urlLower.includes('.webm') || urlLower.includes('.ogg'));

    if (isNative) {
      videoRef.current.src = data.streamUrl;
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

      hls.loadSource(data.streamUrl);
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
                const proxyUrl = '/api/proxy-m3u8?url=' + encodeURIComponent(data.streamUrl);
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
        setError('');
        videoRef.current?.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      });
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      videoRef.current.src = data.streamUrl;
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
  }, [data?.streamUrl]);

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

  if (loading) {
    return <div className="pt-32 text-center text-white">Yayın yükleniyor...</div>;
  }

  // Prevent displaying M3U link if user accidentally pasted it in the program name input
  const displayProgram = (data?.currentProgram?.startsWith('http') || data?.currentProgram?.includes('.m3u')) 
    ? 'Şu an Yayında' 
    : data?.currentProgram;

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-black w-full">
      <div 
        ref={containerRef}
        className="relative w-full flex-1 flex items-center justify-center group overflow-hidden bg-black"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* BS+ TV LOGO WATERMARK (Always visible top right) */}
        <img 
          src="https://r.resimlink.com/ACgs8mXzbRD0.png" 
          alt="BS+ TV" 
          className="absolute top-6 right-6 z-[60] w-24 h-auto object-contain pointer-events-none opacity-90 drop-shadow-2xl"
        />

        {data && (
          <>
            {/* Top Left Info (Visible with controls) */}
            <div className={`absolute top-6 left-6 z-50 transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
              <div className="bg-black/60 backdrop-blur-md px-6 py-3 rounded-xl border border-white/10 shadow-2xl flex items-center gap-4">
                <div className="flex flex-col">
                  <h1 className="text-white font-bold text-xl flex items-center gap-3">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600 shadow-[0_0_8px_rgba(239,68,68,1)]"></span>
                    </span>
                    BS+ TV CANLI
                  </h1>
                  <span className="text-zinc-300 text-sm mt-1">{displayProgram}</span>
                </div>
              </div>
            </div>
            
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-40 backdrop-blur-sm">
                <div className="text-center">
                  <p className="text-red-500 text-xl font-bold bg-zinc-900/80 px-8 py-6 rounded-xl border border-red-900 shadow-2xl">
                    {error}
                  </p>
                  {!data.streamUrl && (
                    <p className="text-zinc-400 mt-4 text-sm">Yayın bulunamadı veya şu an planlanmış bir akış yok.</p>
                  )}
                </div>
              </div>
            )}

            {data.streamUrl && (
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
                  <div className="w-full h-1 bg-red-600/30 rounded-full overflow-hidden relative">
                    <div className="absolute top-0 left-0 h-full bg-red-600 w-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
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
                         <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-[0_0_5px_rgba(239,68,68,0.8)]">CANLI</span>
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
          </>
        )}
      </div>

      {/* TODAY'S SCHEDULE TIMELINE */}
      {data?.todaySchedules && data.todaySchedules.length > 0 && (
        <div className="bg-[#06060a] border-t border-white/10 p-4 h-auto flex-shrink-0 overflow-x-auto whitespace-nowrap scrollbar-hide">
          <h3 className="text-white font-bold mb-4 px-2 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#9155fd]" />
            Bugünün Yayın Akışı
          </h3>
          <div className="flex gap-4 px-2 pb-2">
            {data.todaySchedules.map((s, i) => {
              const now = new Date();
              const trTime = new Date(now.toLocaleString("en-US", {timeZone: "Europe/Istanbul"}));
              const currentHour = trTime.getHours().toString().padStart(2, '0');
              const currentMin = trTime.getMinutes().toString().padStart(2, '0');
              const currentTimeStr = `${currentHour}:${currentMin}`;
              const isPlaying = currentTimeStr >= s.startTime && currentTimeStr < s.endTime;

              return (
                <div key={i} className={`inline-flex flex-col min-w-[200px] p-3 rounded-xl border ${isPlaying ? 'bg-[#9155fd]/20 border-[#9155fd] shadow-[0_0_15px_rgba(145,85,253,0.3)]' : 'bg-white/5 border-white/10'} transition-all`}>
                  <div className={`text-sm font-bold ${isPlaying ? 'text-[#9155fd]' : 'text-[#ffb400]'}`}>{s.startTime} - {s.endTime}</div>
                  <div className={`text-white font-medium truncate mt-1 ${isPlaying ? 'animate-pulse' : ''}`}>{s.title}</div>
                  {isPlaying && <div className="text-xs text-[#9155fd] mt-1 font-bold tracking-widest uppercase">Şu an Yayında</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
