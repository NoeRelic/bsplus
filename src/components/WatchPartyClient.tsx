'use client';

import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import PlayerClient from '@/components/PlayerClient';
import { Send, Users, Shield, Copy, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function WatchPartyClient({ roomId, username, videoUrl, videoUrlEN, subtitleTR, subtitleEN, title }: any) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [users, setUsers] = useState<string[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [copied, setCopied] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    // Determine if user is host based on a query param or just first to join
    const urlParams = new URLSearchParams(window.location.search);
    const hostFlag = urlParams.get('host') === 'true';
    setIsHost(hostFlag);

    const s = io('http://localhost:3001');
    setSocket(s);

    s.emit('join_room', { roomId, username, isHost: hostFlag });

    s.on('chat_message', (msg: any) => {
      setMessages(prev => [...prev, msg]);
    });

    s.on('room_users', (u: string[]) => {
      setUsers(u);
    });

    return () => {
      s.disconnect();
    };
  }, [roomId, username]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !socket) return;
    socket.emit('send_message', { text: chatInput });
    setChatInput('');
  };

  const copyRoomLink = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('host'); // Don't share the host token!
    navigator.clipboard.writeText(url.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* 75% Left: Player */}
      <div className="flex-1 relative bg-black flex flex-col">
        {/* We need to restrict PlayerClient height so it doesn't overlap everything if it's relative 100vh.
            We will wrap it in a container that forces it to take remaining height. */}
        <div className="w-full h-[60vh] md:h-full relative overflow-hidden group">
           <PlayerClient 
            videoUrl={videoUrl} 
            videoUrlEN={videoUrlEN}
            subtitleTR={subtitleTR}
            subtitleEN={subtitleEN}
            title={`${title} (Watch Party)`} 
            syncSocket={socket}
            isHost={isHost}
          />
        </div>
      </div>

      {/* 25% Right: Chat & Users */}
      <div className="w-full md:w-96 bg-[#141414] border-l border-zinc-800 flex flex-col h-[40vh] md:h-[calc(100vh-5rem)]">
        
        {/* Top Info Bar */}
        <div className="p-4 border-b border-zinc-800 bg-zinc-900/50">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              Canlı Oda: {roomId}
            </h2>
            <button 
              onClick={copyRoomLink}
              className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-md transition-colors flex items-center gap-1"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              Davet Linki
            </button>
          </div>
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <Users className="w-4 h-4" /> {users.length} Kişi İzliyor
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {messages.map((m, i) => (
            <div key={i} className={`flex flex-col ${m.system ? 'items-center' : 'items-start'}`}>
              {m.system ? (
                <span className="text-xs text-zinc-500 bg-zinc-800/50 px-3 py-1 rounded-full">{m.text}</span>
              ) : (
                <div className="max-w-[85%] bg-zinc-800 rounded-xl rounded-tl-none px-4 py-2 relative group">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold ${m.isHost ? 'text-[#9155fd]' : 'text-blue-400'}`}>
                      {m.username}
                    </span>
                    {m.isHost && <Shield className="w-3 h-3 text-[#9155fd]" />}
                  </div>
                  <p className="text-sm text-zinc-200 break-words">{m.text}</p>
                  <span className="text-[10px] text-zinc-500 absolute -bottom-4 left-0 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {new Date(m.time).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Chat Input */}
        <form onSubmit={sendMessage} className="p-4 border-t border-zinc-800 bg-zinc-900/50 flex gap-2">
          <input 
            type="text" 
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Mesaj gönder..."
            className="flex-1 bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2 outline-none focus:border-blue-500 transition-colors text-sm"
          />
          <button 
            type="submit"
            disabled={!chatInput.trim()}
            className="bg-[#9155fd] disabled:opacity-50 text-white p-2.5 rounded-lg hover:bg-[#804bdf] transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </>
  );
}
