'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Play, Pause, Volume2, VolumeX, Maximize, Settings, Subtitles, Check, MessageSquare, X } from 'lucide-react';
import Hls from 'hls.js';
import SmartImage from './SmartImage';
import CommentsSectionClient from '@/components/CommentsSectionClient';

const INTRO_URL = "/uploads/intro.mp4";

interface PlayerProps {
  videoUrl: string;
  videoUrlEN?: string;
  subtitleTR?: string;
  subtitleEN?: string;
  title: string;
  initialTime?: number;
  mediaId?: string;
  mediaType?: 'movie' | 'series';
  initialFavorite?: boolean;
  nextEpisodeUrl?: string;
  similarItems?: any[];
  syncSocket?: any;
  isHost?: boolean;
  initialPrefs?: any;
  /** 'dublaj' = primary is dubbed, secondary is subbed. 'altyazi' = opposite. undefined = generic */
  dubType?: 'dublaj' | 'altyazi';
}

declare global {
  interface Window {
    lastProgressSaved?: number;
    savedTimeForSwitch?: number;
  }
}

function formatTime(seconds: number) {
  if (isNaN(seconds)) return "00:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

interface Cue {
  start: number;
  end: number;
  text: string;
}

function parseTimeStr(timeStr: string) {
  const parts = timeStr.split(':');
  let seconds = 0;
  if (parts.length === 3) {
    seconds += parseInt(parts[0]) * 3600;
    seconds += parseInt(parts[1]) * 60;
    seconds += parseFloat(parts[2].replace(',', '.'));
  } else if (parts.length === 2) {
    seconds += parseInt(parts[0]) * 60;
    seconds += parseFloat(parts[1].replace(',', '.'));
  }
  return seconds;
}

function parseVTT(vtt: string): Cue[] {
  const lines = vtt.split(/\r?\n/);
  const cues: Cue[] = [];
  let currentCue: Partial<Cue> | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.includes('-->')) {
      const parts = line.split('-->');
      const start = parseTimeStr(parts[0].trim());
      const end = parseTimeStr(parts[1].trim());
      currentCue = { start, end, text: '' };
      cues.push(currentCue as Cue);
    } else if (line === '' && currentCue) {
      currentCue = null;
    } else if (currentCue && !line.match(/^\d+$/)) {
      currentCue.text += (currentCue.text ? '\n' : '') + line;
    }
  }
  return cues;
}

import FavoriteButtonClient from '@/components/FavoriteButtonClient';
import Link from 'next/link';

export default function PlayerClient({ videoUrl, videoUrlEN, subtitleTR, subtitleEN, title, initialTime = 0, mediaId, mediaType, initialFavorite = false, nextEpisodeUrl, similarItems, syncSocket, isHost = false, initialPrefs = {}, dubType }: PlayerProps) {
  const router = useRouter();
  const [introPlaying, setIntroPlaying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [limitMessage, setLimitMessage] = useState<string | null>(null);
  
  // Custom Controls State
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(initialTime);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  
  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [activeAudio, setActiveAudio] = useState<'tr' | 'en'>(initialPrefs.audio || 'tr');
  const [hlsAudioTracks, setHlsAudioTracks] = useState<any[]>([]);
  const [currentHlsAudioIndex, setCurrentHlsAudioIndex] = useState<number>(-1);
  const [activeSubtitle, setActiveSubtitle] = useState<'off' | 'tr' | 'en'>(initialPrefs.subtitle || 'off');
  const [activeDoubleSub, setActiveDoubleSub] = useState<boolean>(initialPrefs.doubleSubtitle === 'true');
  const [subColor, setSubColor] = useState(initialPrefs.subColor || 'white');
  const [subSize, setSubSize] = useState(initialPrefs.subSize || '1.5rem');
  
  // Comments Panel State
  const [showComments, setShowComments] = useState(false);

  const [cuesTR, setCuesTR] = useState<Cue[]>([]);
  const [cuesEN, setCuesEN] = useState<Cue[]>([]);
  const [currentSubtitleText, setCurrentSubtitleText] = useState<string>('');
  const [currentSubTR, setCurrentSubTR] = useState<string>('');
  const [currentSubEN, setCurrentSubEN] = useState<string>('');

  // Auto-play next episode state
  const [upNext, setUpNext] = useState(false);
  const [countdown, setCountdown] = useState(5);
  
  // Seek Indicator State
  const [seekIndicator, setSeekIndicator] = useState<{ show: boolean, text: string }>({ show: false, text: '' });
  const seekTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const actualVideoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    if (!syncSocket) return;
    const handleSync = (data: any) => {
      if (isHost) return;
      if (actualVideoRef.current) {
        if (Math.abs(actualVideoRef.current.currentTime - data.time) > 1.5) {
          actualVideoRef.current.currentTime = data.time;
          setCurrentTime(data.time);
          setProgress(data.time);
        }
        if (data.playing && !isPlaying) {
          actualVideoRef.current.play().catch(e => console.log('sync play err', e));
          setIsPlaying(true);
        } else if (!data.playing && isPlaying) {
          actualVideoRef.current.pause();
          setIsPlaying(false);
        }
      }
    };
    syncSocket.on('sync_video', handleSync);
    return () => { syncSocket.off('sync_video', handleSync); };
  }, [syncSocket, isHost, isPlaying]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (upNext && countdown > 0) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    } else if (upNext && countdown === 0 && nextEpisodeUrl) {
      router.push(nextEpisodeUrl);
    }
    return () => clearTimeout(timer);
  }, [upNext, countdown, router, nextEpisodeUrl]);

  const savePreference = (key: string, value: string) => {
    fetch('/api/profiles/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key]: value })
    }).catch(e => console.log('Pref save err', e));
  };

  const handleAudioSwitch = (audio: 'tr' | 'en') => {
    if (audio === activeAudio) return;
    savePreference('audio', audio);
    const newSource = audio === 'tr' ? videoUrl : (videoUrlEN || videoUrl);
    
    if (hlsRef.current && actualVideoRef.current) {
      const time = actualVideoRef.current.currentTime;
      hlsRef.current.loadSource(newSource);
      hlsRef.current.once(Hls.Events.MANIFEST_PARSED, () => {
        if (actualVideoRef.current) {
          actualVideoRef.current.currentTime = time;
          actualVideoRef.current.play().catch(e => console.log('Auto-play blocked:', e));
        }
      });
    } else if (actualVideoRef.current) {
      const time = actualVideoRef.current.currentTime;
      actualVideoRef.current.src = newSource;
      actualVideoRef.current.currentTime = time;
      actualVideoRef.current.play();
    }
    setActiveAudio(audio);
  };

  useEffect(() => {
    // Check IP Limits
    const checkLimits = async () => {
      try {
        const res = await fetch('/api/sessions/heartbeat', { method: 'POST' });
        const data = await res.json();
        if (!res.ok) {
          if (data.error === 'LIMIT_REACHED') {
            setLimitMessage(data.message);
          } else if (data.error === 'EXPIRED') {
            setError(data.message);
          } else {
            setError(data.error || 'Oturum başlatılamadı.');
          }
        }
      } catch (err) {
        setError('Bağlantı hatası.');
      }
    };
    checkLimits();

    const interval = setInterval(checkLimits, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // HLS Loader
  useEffect(() => {
    if (!actualVideoRef.current || error || limitMessage) return;

    const video = actualVideoRef.current;
    const initialSource = activeAudio === 'tr' ? videoUrl : (videoUrlEN || videoUrl);
    const urlLower = initialSource.toLowerCase();

    // Destroy previous instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    
    // Resume from initialTime OR savedTimeForSwitch when switching
    let savedTime = window.savedTimeForSwitch || currentTime;
    const isHls = urlLower.includes('.m3u8');
    // mp4 veya webm uzantısı içeriyorsa ve m3u8 değilse direkt native oynat
    const isMp4 = !isHls && (urlLower.includes('.mp4') || urlLower.includes('.webm') || urlLower.includes('.ogg') || urlLower.includes('.mkv'));

    if (!isMp4) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          debug: false,
          startPosition: savedTime > 0 ? savedTime : -1,
          maxBufferLength: 30,
          maxMaxBufferLength: 600,
          enableWorker: true,
          lowLatencyMode: true,
        });
        hlsRef.current = hls;
        
        hls.loadSource(initialSource);
        hls.attachMedia(video);
        
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (savedTime > 0) {
            video.currentTime = savedTime;
          }
          if (hls.audioTracks && hls.audioTracks.length > 1) {
            setHlsAudioTracks(hls.audioTracks);
            setCurrentHlsAudioIndex(hls.audioTrack);
          }
          
          // Auto-play if intro is not playing
          const checkIntroAndPlay = setInterval(() => {
            if (actualVideoRef.current && actualVideoRef.current.paused) {
              const currentIntroState = document.getElementById('intro-video-element') !== null;
              if (!currentIntroState) {
                actualVideoRef.current.play().then(() => setIsPlaying(true)).catch(e => console.log('Auto-play blocked:', e));
                clearInterval(checkIntroAndPlay);
              }
            } else {
              clearInterval(checkIntroAndPlay);
            }
          }, 1000);
          
          // Also set a timeout to clear the interval after 30s
          setTimeout(() => clearInterval(checkIntroAndPlay), 30000);
        });

        hls.on(Hls.Events.AUDIO_TRACK_LOADED, () => {
          if (hls.audioTracks && hls.audioTracks.length > 1) {
            setHlsAudioTracks(hls.audioTracks);
            setCurrentHlsAudioIndex(hls.audioTrack);
          }
        });
        
        let networkErrorCount = 0;
        let mediaErrorCount = 0;
        let isUsingProxy = false;

        hls.on(Hls.Events.ERROR, function (event, data) {
          if (data.fatal && hlsRef.current) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.error('fatal network error encountered, try to recover', data);
                if (networkErrorCount < 2) {
                  hlsRef.current.startLoad();
                  networkErrorCount++;
                } else if (!isUsingProxy) {
                  console.warn('Network limits reached or CORS blocked. Switching to internal CORS proxy.');
                  isUsingProxy = true;
                  networkErrorCount = 0;
                  const proxyUrl = '/api/proxy-m3u8?url=' + encodeURIComponent(initialSource);
                  hlsRef.current.loadSource(proxyUrl);
                } else {
                  console.warn('Network limits reached or not an HLS stream. Falling back to native video tag.');
                  hlsRef.current.destroy();
                  video.src = initialSource;
                  video.currentTime = savedTime;
                  video.play().catch(e => console.log('Fallback play blocked', e));
                }
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.error('fatal media error encountered, try to recover', data);
                if (mediaErrorCount < 2) {
                  hlsRef.current.recoverMediaError();
                  mediaErrorCount++;
                } else {
                  console.warn('Media error limit reached or not an HLS stream. Falling back to native video tag.');
                  hlsRef.current.destroy();
                  video.src = initialSource;
                  video.currentTime = savedTime;
                  video.play().catch(e => console.log('Fallback play blocked', e));
                }
                break;
              default:
                console.error('Unrecoverable HLS error', data);
                hlsRef.current.destroy();
                video.src = initialSource;
                video.currentTime = savedTime;
                video.play().catch(e => console.log('Fallback play blocked', e));
                break;
            }
          }
        });
        
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari)
        video.src = initialSource;
        video.currentTime = savedTime;
        video.addEventListener('loadedmetadata', () => {
          video.play().catch(e => console.log('Auto-play blocked:', e));
          setIsPlaying(true);
        });
      } else {
        // Fallback for browsers that don't support HLS (very rare since Hls.js is used)
        video.src = initialSource;
      }
    } else {
      video.src = initialSource;
      video.currentTime = savedTime;
      
      video.onerror = () => {
        setError('Video kaynağı yüklenemedi. (Bağlantı Hatası veya Kırık Link). Lütfen başka bir kaynak deneyin.');
      };

      video.addEventListener('loadedmetadata', () => {
        // time is already set before play
      });
      video.play().catch(e => console.log('Auto-play blocked:', e));
      setIsPlaying(true);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.detachMedia();
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (video) {
        video.removeAttribute('src');
      }
    };
  }, [activeAudio, error, limitMessage]);

  // Play main video when intro finishes
  useEffect(() => {
    if (!introPlaying && actualVideoRef.current) {
      actualVideoRef.current.play().catch(e => console.log('Auto-play blocked:', e));
      setIsPlaying(true);
    }
  }, [introPlaying]);

  // Fetch Custom Subtitles
  useEffect(() => {
    if (subtitleTR) {
      fetch(subtitleTR)
        .then(res => res.text())
        .then(text => setCuesTR(parseVTT(text)))
        .catch(err => console.error("Error loading TR subtitles", err));
    }
    if (subtitleEN) {
      fetch(subtitleEN)
        .then(res => res.text())
        .then(text => setCuesEN(parseVTT(text)))
        .catch(err => console.error("Error loading EN subtitles", err));
    }
  }, [subtitleTR, subtitleEN]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input (though there are none here, good practice)
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (!actualVideoRef.current || introPlaying) return;

      switch(e.key) {
        case ' ':
          e.preventDefault();
          if (actualVideoRef.current.paused) {
            actualVideoRef.current.play();
            setIsPlaying(true);
          } else {
            actualVideoRef.current.pause();
            setIsPlaying(false);
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          actualVideoRef.current.currentTime = Math.max(0, actualVideoRef.current.currentTime - 10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          actualVideoRef.current.currentTime = Math.min(actualVideoRef.current.duration || 0, actualVideoRef.current.currentTime + 10);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [introPlaying]);

  // Video Events
  const handleTimeUpdate = () => {
    if (!actualVideoRef.current) return;
    const v = actualVideoRef.current;
    setCurrentTime(v.currentTime);
    setProgress((v.currentTime / v.duration) * 100);

    // Sync Custom Subtitles
    if (activeDoubleSub && (subtitleTR || cuesTR.length > 0) && (subtitleEN || cuesEN.length > 0)) {
      const cueTR = cuesTR.find(c => v.currentTime >= c.start && v.currentTime <= c.end);
      const cueEN = cuesEN.find(c => v.currentTime >= c.start && v.currentTime <= c.end);
      setCurrentSubTR(cueTR ? cueTR.text : '');
      setCurrentSubEN(cueEN ? cueEN.text : '');
      setCurrentSubtitleText(''); // disable single subtitle text
    } else if (activeSubtitle !== 'off') {
      const activeCues = activeSubtitle === 'tr' ? cuesTR : cuesEN;
      const currentCue = activeCues.find(c => v.currentTime >= c.start && v.currentTime <= c.end);
      setCurrentSubtitleText(currentCue ? currentCue.text : '');
      setCurrentSubTR('');
      setCurrentSubEN('');
    } else {
      setCurrentSubtitleText('');
      setCurrentSubTR('');
      setCurrentSubEN('');
    }

    // Save progress periodically (every ~5 seconds)
    if (Math.floor(v.currentTime) % 5 === 0 && v.currentTime > 0) {
      // Avoid firing multiple times per second
      if (!window.lastProgressSaved || Math.abs(window.lastProgressSaved - v.currentTime) > 1) {
        window.lastProgressSaved = v.currentTime;
        const urlParams = window.location.pathname.split('/');
        const type = urlParams[urlParams.length - 2]; // 'movie' or 'episode'
        const videoId = urlParams[urlParams.length - 1];
        
        fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoId, type, time: v.currentTime, duration: v.duration })
        }).catch(err => console.log('Progress save error', err));
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (actualVideoRef.current) {
      setDuration(actualVideoRef.current.duration);
    }
  };

  const togglePlay = () => {
    if (introPlaying) return;
    if (actualVideoRef.current) {
      if (isPlaying) {
        actualVideoRef.current.pause();
        if (syncSocket && isHost) syncSocket.emit('video_update', { time: actualVideoRef.current.currentTime, playing: false });
      } else {
        actualVideoRef.current.play().catch(e => console.log('play error', e));
        if (syncSocket && isHost) syncSocket.emit('video_update', { time: actualVideoRef.current.currentTime, playing: true });
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!actualVideoRef.current) return;
    const newTime = (Number(e.target.value) / 100) * duration;
    actualVideoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    setProgress(Number(e.target.value));
    if (syncSocket && isHost) syncSocket.emit('video_update', { time: newTime, playing: isPlaying });
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!actualVideoRef.current) return;
    const vol = Number(e.target.value);
    setVolume(vol);
    actualVideoRef.current.volume = vol;
    if (vol === 0) setIsMuted(true);
    else setIsMuted(false);
  };

  const toggleMute = () => {
    if (!actualVideoRef.current) return;
    actualVideoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
    if (isMuted) {
      actualVideoRef.current.volume = volume > 0 ? volume : 1;
    } else {
      actualVideoRef.current.volume = 0;
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => console.log(err));
    } else {
      document.exitFullscreen();
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !showComments) setShowControls(false);
      setShowSettings(false);
    }, 3000);
  };

  const skipTime = (amount: number) => {
    if (!actualVideoRef.current) return;
    const newTime = Math.max(0, Math.min(actualVideoRef.current.currentTime + amount, duration));
    actualVideoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    
    setSeekIndicator({ show: true, text: amount > 0 ? `+${amount} Saniye` : `${amount} Saniye` });
    if (seekTimeoutRef.current) clearTimeout(seekTimeoutRef.current);
    seekTimeoutRef.current = setTimeout(() => {
      setSeekIndicator(prev => ({ ...prev, show: false }));
    }, 800);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!actualVideoRef.current || introPlaying) return;
      
      switch(e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'arrowright':
          e.preventDefault();
          skipTime(10);
          break;
        case 'arrowleft':
          e.preventDefault();
          skipTime(-10);
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [introPlaying, togglePlay, toggleFullscreen, toggleMute, duration]);



  if (limitMessage) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-center px-8 relative">
        <button onClick={() => router.back()} className="absolute top-8 left-8 text-white"><ArrowLeft className="w-8 h-8" /></button>
        <h1 className="text-3xl text-red-500 font-bold mb-4">Erişim Limiti Aşıldı</h1>
        <p className="text-zinc-300 text-lg mb-8 max-w-xl">{limitMessage}</p>
        <button onClick={() => router.push('/packages')} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-md font-bold transition-colors">
          Paketleri İncele
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <p className="text-red-500">{error}</p>
        <button onClick={() => router.back()} className="mt-4 text-white">Geri Dön</button>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-[100vh] bg-black z-40 flex items-center justify-center group"
      onMouseMove={handleMouseMove}
      onClick={() => { if (!introPlaying) togglePlay(); }}
    >
      <style>{`
        ::cue {
          color: ${subColor};
          font-size: ${subSize};
          background-color: rgba(0, 0, 0, 0.7);
          text-shadow: 1px 1px 2px black;
          font-family: sans-serif;
        }
      `}</style>
      <button 
        onClick={(e) => { e.stopPropagation(); router.back(); }} 
        className={`absolute top-8 left-8 z-50 glass-heavy px-4 py-3 rounded-2xl text-white/80 hover:text-white transition-all duration-300 border border-white/10 hover:border-white/30 flex items-center gap-3 shadow-lg hover:scale-105 group ${showControls || introPlaying ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}
      >
        <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
        <span className="font-semibold hidden sm:inline">Geri Dön</span>
      </button>

      {introPlaying && (
        <div className="absolute inset-0 z-[60] bg-black">
          <video 
            id="intro-video-element"
            src={INTRO_URL}
            autoPlay
            playsInline
            muted={false}
            onEnded={() => setIntroPlaying(false)}
            className="w-full h-full object-cover"
          />
          <button 
            onClick={() => setIntroPlaying(false)}
            className="absolute bottom-12 right-12 glass-heavy text-white px-8 py-4 rounded-2xl font-bold transition-all border border-white/20 hover:border-[#9155fd] shadow-[0_0_30px_rgba(145,85,253,0.3)] hover:shadow-[0_0_50px_rgba(145,85,253,0.6)] hover:scale-105 z-50 flex items-center gap-3 group"
          >
            İntroyu Geç 
            <Play className="w-5 h-5 fill-current group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      )}

      {/* Main Video Always Mounted (Hidden while intro plays) */}
      <div className={`absolute inset-0 w-full h-full ${introPlaying ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <video
          ref={actualVideoRef}
          className="w-full h-full"
          playsInline
          muted={isMuted}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => {
            setIsPlaying(false);
            if (nextEpisodeUrl || (similarItems && similarItems.length > 0)) {
              setUpNext(true);
            }
          }}
          onClick={(e) => e.stopPropagation()} // Let container handle play/pause
        />

          {/* Custom Subtitle Overlay */}
          <div 
            className="absolute left-0 w-full text-center pointer-events-none flex flex-col items-center gap-1 transition-all duration-300 z-30"
            style={{ bottom: showControls ? '130px' : '60px' }}
          >
            {activeDoubleSub && !introPlaying ? (
              <>
                {currentSubTR && (
                  <div 
                    className="px-6 py-2 rounded-lg text-glow transition-all duration-300 max-w-[80%] whitespace-pre-wrap mb-1 shadow-lg"
                    style={{
                      color: subColor,
                      fontSize: subSize,
                      backgroundColor: 'rgba(0, 0, 0, 0.75)',
                      textShadow: '2px 2px 4px rgba(0,0,0,0.9)',
                      fontWeight: '600',
                      lineHeight: '1.4'
                    }}
                  >
                    {currentSubTR}
                  </div>
                )}
                {currentSubEN && (
                  <div 
                    className="px-6 py-2 rounded-lg text-glow transition-all duration-300 max-w-[80%] whitespace-pre-wrap shadow-lg"
                    style={{
                      color: subColor,
                      fontSize: `calc(${subSize} * 0.85)`, // slightly smaller
                      backgroundColor: 'rgba(50, 50, 50, 0.85)', // solid gray background
                      textShadow: '1px 1px 3px rgba(0,0,0,0.9)',
                      fontWeight: '500',
                      lineHeight: '1.4'
                    }}
                  >
                    {currentSubEN}
                  </div>
                )}
              </>
            ) : currentSubtitleText && !introPlaying ? (
              <div 
                className="px-6 py-2 rounded-lg text-glow transition-all duration-300 max-w-[80%] whitespace-pre-wrap shadow-lg"
                style={{
                  color: subColor,
                  fontSize: subSize,
                  backgroundColor: 'rgba(0, 0, 0, 0.75)',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.9)',
                  fontWeight: '600',
                  lineHeight: '1.4'
                }}
              >
                {currentSubtitleText}
              </div>
            ) : null}
          </div>

          {/* Seek Indicator Overlay */}
          {seekIndicator.show && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
              <div className="bg-black/60 backdrop-blur-md text-white px-8 py-6 rounded-3xl font-display font-bold text-3xl md:text-5xl shadow-[0_0_30px_rgba(145,85,253,0.4)] animate-scale-fade border border-white/10 flex items-center gap-4">
                {seekIndicator.text.includes('+') ? <ArrowLeft className="w-10 h-10 transform rotate-180" /> : <ArrowLeft className="w-10 h-10" />}
                {seekIndicator.text}
              </div>
            </div>
          )}

          {/* Up Next Overlay (Episodes) - Netflix Style Bottom Right Popup */}
          {upNext && nextEpisodeUrl && (
            <div className="absolute bottom-28 right-8 z-[70] bg-black/80 backdrop-blur-xl border border-zinc-700/50 rounded-2xl p-6 flex flex-col items-start justify-center shadow-[0_10px_40px_rgba(0,0,0,0.8)] animate-fade-in-up transform hover:scale-105 transition-all">
              <div className="flex items-center gap-4 mb-4">
                <div className="relative flex items-center justify-center w-12 h-12">
                  <svg className="w-12 h-12 transform -rotate-90">
                    <circle cx="24" cy="24" r="20" stroke="rgba(255,255,255,0.2)" strokeWidth="4" fill="none" />
                    <circle cx="24" cy="24" r="20" stroke="#3b82f6" strokeWidth="4" fill="none" strokeDasharray="125" strokeDashoffset={125 - (countdown / 5) * 125} className="transition-all duration-1000 linear" />
                  </svg>
                  <span className="absolute text-white font-bold">{countdown}</span>
                </div>
                <div>
                  <h2 className="text-white text-lg font-bold leading-tight">Sıradaki Bölüm</h2>
                  <p className="text-zinc-400 text-sm">Hemen başlıyor</p>
                </div>
              </div>
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => router.push(nextEpisodeUrl)}
                  className="flex-1 bg-white text-black py-2 rounded-lg font-bold hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <Play className="w-4 h-4 fill-current" /> Oynat
                </button>
                <button 
                  onClick={() => setUpNext(false)}
                  className="bg-zinc-800 text-white px-4 py-2 rounded-lg font-bold hover:bg-zinc-700 transition-colors text-sm"
                >
                  İptal
                </button>
              </div>
            </div>
          )}

          {/* Similar Items Overlay (Movies End Screen) */}
          {upNext && !nextEpisodeUrl && similarItems && similarItems.length > 0 && (
            <div className="absolute inset-0 bg-black/80 z-40 flex flex-col items-center justify-center p-8 animate-fade-in-up">
              <div className="absolute top-8 right-8">
                <button onClick={() => setUpNext(false)} className="text-white bg-zinc-800 px-4 py-2 rounded-md hover:bg-zinc-700">Kapat</button>
              </div>
              <h2 className="text-white text-3xl font-bold mb-8 flex items-center gap-2">Bunlar da Hoşunuza Gidebilir</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl w-full">
                {similarItems.map(item => (
                  <Link 
                    key={item.id} 
                    href={`/watch/${item.mediaType}/${item.id}`}
                    className="aspect-[2/3] md:aspect-video lg:aspect-[2/3] relative overflow-hidden rounded-xl border border-white/5 bg-zinc-900 group-hover:border-white/20 transition-colors flex flex-col justify-end"
                  >
                    <SmartImage src={item.bannerUrl} title={item.title} categories={item.categories} type={item.mediaType} className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play className="w-12 h-12 text-white" />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black to-transparent">
                      <div className="text-white font-bold text-sm truncate">{item.title}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Custom Controls Overlay - Floating Glassmorphic Design */}
          <div 
            onClick={(e) => e.stopPropagation()} 
            className={`absolute bottom-6 left-1/2 transform -translate-x-1/2 w-[96%] max-w-7xl p-6 glass-heavy rounded-3xl border border-white/10 transition-all duration-500 flex flex-col gap-5 ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12 pointer-events-none'} z-50 shadow-[0_20px_50px_rgba(0,0,0,0.5)]`}
          >
            <div className="flex items-center gap-4 text-white">
              <span className="text-2xl font-display font-bold drop-shadow-md text-white/90">{title}</span>
              {mediaId && mediaType && (
                <div className="ml-4">
                  <FavoriteButtonClient id={mediaId} type={mediaType} initialFavorite={initialFavorite || false} />
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              <span className="text-white text-sm font-medium w-12 text-center opacity-80">{formatTime(currentTime)}</span>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={progress || 0} 
                onChange={handleSeek}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#9155fd] shadow-[0_0_10px_rgba(145,85,253,0.5)]"
              />
              <span className="text-white text-sm font-medium w-12 text-center opacity-80">{formatTime(duration)}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <button onClick={togglePlay} className="text-white hover:text-[#9155fd] transition-colors hover:scale-110 transform">
                  {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current" />}
                </button>

                <button onClick={(e) => { e.stopPropagation(); skipTime(-10); }} className="text-white hover:text-[#5579fd] text-sm font-bold opacity-80 hover:opacity-100 transition-all flex gap-1 items-center bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 hover:border-white/20">
                  <span>-10s</span>
                </button>
                <button onClick={(e) => { e.stopPropagation(); skipTime(10); }} className="text-white hover:text-[#5579fd] text-sm font-bold opacity-80 hover:opacity-100 transition-all flex gap-1 items-center bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 hover:border-white/20">
                  <span>+10s</span>
                </button>

                <div className="flex items-center gap-2 group/vol">
                  <button onClick={toggleMute} className="text-white hover:text-[#9155fd] transition-colors">
                    {isMuted || volume === 0 ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                  </button>
                  <input 
                    type="range" 
                    min="0" max="1" step="0.01" 
                    value={isMuted ? 0 : volume} 
                    onChange={handleVolume}
                    className="w-0 opacity-0 group-hover/vol:w-24 group-hover/vol:opacity-100 transition-all duration-300 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#9155fd]"
                  />
                </div>
              </div>

                <div className="flex items-center gap-6 relative">
                {mediaId && (
                  <button 
                    onClick={() => {
                      setShowComments(!showComments);
                      setShowSettings(false);
                      if (!showComments) actualVideoRef.current?.pause();
                      else actualVideoRef.current?.play();
                    }}
                    className="text-white hover:text-[#9155fd] transition-colors flex items-center gap-2"
                  >
                    <MessageSquare className="w-6 h-6" />
                    <span className="text-sm font-bold uppercase hidden md:inline">Yorumlar</span>
                  </button>
                )}

                <button 
                  onClick={() => { setShowSettings(!showSettings); setShowComments(false); }}
                  className="text-white hover:text-[#9155fd] transition-colors flex items-center gap-2"
                >
                  <Subtitles className="w-6 h-6" />
                  <span className="text-sm font-bold uppercase hidden md:inline">Dil & Altyazı</span>
                </button>

                <button onClick={toggleFullscreen} className="text-white hover:text-[#9155fd] transition-colors">
                  <Maximize className="w-6 h-6" />
                </button>

                {/* Settings Popup */}
                {showSettings && (
                  <div className="absolute bottom-12 right-10 bg-zinc-900/95 border border-zinc-700 rounded-lg p-6 flex flex-col md:flex-row gap-8 shadow-2xl backdrop-blur-sm min-w-[300px]">
                    <div className="flex-1">
                      <h3 className="text-zinc-400 text-sm font-bold mb-4 uppercase tracking-wider border-b border-zinc-700 pb-2">Ses / Kaynak</h3>
                      <div className="flex flex-col gap-3 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                        {hlsAudioTracks.length > 1 ? (
                          hlsAudioTracks.map((track, idx) => (
                            <button 
                              key={idx}
                              onClick={() => {
                                if (hlsRef.current) {
                                  hlsRef.current.audioTrack = idx;
                                  setCurrentHlsAudioIndex(idx);
                                }
                              }}
                              className={`flex items-center gap-2 text-left hover:text-white transition-colors ${currentHlsAudioIndex === idx ? 'text-white font-bold' : 'text-zinc-400'}`}
                            >
                              <Check className={`w-4 h-4 ${currentHlsAudioIndex === idx ? 'opacity-100' : 'opacity-0'}`} />
                              {track.name || `Ses Kanalı ${idx + 1}`}
                            </button>
                          ))
                        ) : (
                          <>
                            <button 
                              onClick={() => handleAudioSwitch('tr')}
                              className={`flex items-center gap-2 text-left hover:text-white transition-colors ${activeAudio === 'tr' ? 'text-white font-bold' : 'text-zinc-400'}`}
                            >
                              <Check className={`w-4 h-4 ${activeAudio === 'tr' ? 'opacity-100' : 'opacity-0'}`} />
                              🎙️ {dubType === 'altyazi' ? 'Altyazılı' : 'Dublaj'}
                            </button>
                            {videoUrlEN && (
                              <button 
                                onClick={() => handleAudioSwitch('en')}
                                className={`flex items-center gap-2 text-left hover:text-white transition-colors ${activeAudio === 'en' ? 'text-white font-bold' : 'text-zinc-400'}`}
                              >
                                <Check className={`w-4 h-4 ${activeAudio === 'en' ? 'opacity-100' : 'opacity-0'}`} />
                                💬 {dubType === 'altyazi' ? 'Dublaj' : 'Altyazılı'}
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-zinc-400 text-sm font-bold mb-4 uppercase tracking-wider border-b border-zinc-700 pb-2">Altyazı</h3>
                      <div className="flex flex-col gap-3">
                        <button 
                          onClick={() => { setActiveSubtitle('off'); setActiveDoubleSub(false); savePreference('subtitle', 'off'); savePreference('doubleSubtitle', 'false'); }}
                          className={`flex items-center gap-2 text-left hover:text-white transition-colors ${activeSubtitle === 'off' && !activeDoubleSub ? 'text-white font-bold' : 'text-zinc-400'}`}
                        >
                          <Check className={`w-4 h-4 ${activeSubtitle === 'off' && !activeDoubleSub ? 'opacity-100' : 'opacity-0'}`} />
                          Kapalı
                        </button>
                        {subtitleTR && (
                          <button 
                            onClick={() => { setActiveSubtitle('tr'); setActiveDoubleSub(false); savePreference('subtitle', 'tr'); savePreference('doubleSubtitle', 'false'); }}
                            className={`flex items-center gap-2 text-left hover:text-white transition-colors ${activeSubtitle === 'tr' && !activeDoubleSub ? 'text-white font-bold' : 'text-zinc-400'}`}
                          >
                            <Check className={`w-4 h-4 ${activeSubtitle === 'tr' && !activeDoubleSub ? 'opacity-100' : 'opacity-0'}`} />
                            Türkçe
                          </button>
                        )}
                        {subtitleEN && (
                          <button 
                            onClick={() => { setActiveSubtitle('en'); setActiveDoubleSub(false); savePreference('subtitle', 'en'); savePreference('doubleSubtitle', 'false'); }}
                            className={`flex items-center gap-2 text-left hover:text-white transition-colors ${activeSubtitle === 'en' && !activeDoubleSub ? 'text-white font-bold' : 'text-zinc-400'}`}
                          >
                            <Check className={`w-4 h-4 ${activeSubtitle === 'en' && !activeDoubleSub ? 'opacity-100' : 'opacity-0'}`} />
                            İngilizce
                          </button>
                        )}
                        {subtitleTR && subtitleEN && (
                          <button 
                            onClick={() => {
                              const nextState = !activeDoubleSub;
                              setActiveDoubleSub(nextState);
                              savePreference('doubleSubtitle', String(nextState));
                            }}
                            className={`flex items-center gap-2 text-left hover:text-white transition-colors ${activeDoubleSub ? 'text-white font-bold' : 'text-zinc-400'}`}
                          >
                            <Check className={`w-4 h-4 ${activeDoubleSub ? 'opacity-100' : 'opacity-0'}`} />
                            🔀 Çift Altyazı (TR + EN)
                          </button>
                        )}
                      </div>

                      <h3 className="text-zinc-400 text-sm font-bold mb-4 mt-6 uppercase tracking-wider border-b border-zinc-700 pb-2">Görünüm & Oynatma</h3>
                      <div className="flex items-center justify-between mb-3 text-sm text-zinc-400">
                        <span>Hız:</span>
                        <select className="bg-zinc-800 text-white p-1 rounded-md outline-none" value={playbackRate} onChange={(e) => {
                          const rate = parseFloat(e.target.value);
                          setPlaybackRate(rate);
                          if (actualVideoRef.current) actualVideoRef.current.playbackRate = rate;
                        }}>
                          <option value="0.5">0.5x</option>
                          <option value="1">1x</option>
                          <option value="1.25">1.25x</option>
                          <option value="1.5">1.5x</option>
                          <option value="2">2x</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between mb-3 text-sm text-zinc-400">
                        <span>Renk:</span>
                        <select className="bg-zinc-800 text-white p-1 rounded-md outline-none" value={subColor} onChange={(e) => setSubColor(e.target.value)}>
                          <option value="white">Beyaz</option>
                          <option value="yellow">Sarı</option>
                          <option value="cyan">Mavi</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between text-sm text-zinc-400">
                        <span>Boyut:</span>
                        <select className="bg-zinc-800 text-white p-1 rounded-md outline-none" value={subSize} onChange={(e) => setSubSize(e.target.value)}>
                          <option value="1rem">Küçük</option>
                          <option value="1.5rem">Normal</option>
                          <option value="2rem">Büyük</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Comments Side Panel */}
          {showComments && mediaId && (
            <div 
              className="absolute top-0 right-0 h-full w-full md:w-[500px] bg-black/95 border-l border-zinc-800 z-[70] flex flex-col shadow-2xl animate-fade-in-up"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-zinc-800">
                <h2 className="text-2xl font-bold text-white">Yorumlar</h2>
                <button 
                  onClick={() => {
                    setShowComments(false);
                    actualVideoRef.current?.play();
                    setIsPlaying(true);
                  }} 
                  className="text-zinc-400 hover:text-white"
                >
                  <X className="w-8 h-8" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                <CommentsSectionClient mediaId={mediaId} />
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
