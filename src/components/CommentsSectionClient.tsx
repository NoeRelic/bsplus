'use client';

import { useState, useEffect } from 'react';
import { Star, Send } from 'lucide-react';

interface Comment {
  id: string;
  profileName: string;
  profileAvatar: string;
  content: string;
  rating: number;
  createdAt: string;
}

export default function CommentsSectionClient({ mediaId }: { mediaId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [mediaId]);

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/comments?mediaId=${mediaId}`);
      const data = await res.json();
      if (data.comments) {
        setComments(data.comments);
      }
    } catch (err) {
      console.error("Failed to fetch comments", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaId, content, rating })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setContent('');
        setRating(5);
      } else {
        alert(data.error || 'Yorum gönderilirken hata oluştu.');
      }
    } catch (err) {
      alert('Bağlantı hatası.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-16 bg-zinc-900/50 rounded-xl p-8 border border-zinc-800">
      <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
        <span className="w-2 h-8 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)]"></span>
        Yorumlar ve Değerlendirmeler ({comments.length})
      </h2>

      {/* Review Form */}
      <form onSubmit={handleSubmit} className="mb-12 bg-black/40 p-6 rounded-lg border border-zinc-800/50">
        <h3 className="text-lg font-bold mb-4 text-zinc-300">Puan Ver ve İnceleme Yaz</h3>
        <div className="flex gap-2 mb-4">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              type="button"
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
              className="focus:outline-none transition-transform hover:scale-110"
            >
              <Star 
                className={`w-8 h-8 ${star <= (hoverRating || rating) ? 'fill-yellow-500 text-yellow-500' : 'text-zinc-600'}`} 
              />
            </button>
          ))}
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Bu içerik hakkında ne düşünüyorsunuz? (Spoiler vermemeye özen gösterin)"
          className="w-full bg-zinc-900 text-white p-4 rounded-md border border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none mb-4 min-h-[120px]"
          required
        />
        <button
          type="submit"
          disabled={submitting}
          className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-md font-bold transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" /> {submitting ? 'Gönderiliyor...' : 'Yorumu Gönder'}
        </button>
      </form>

      {/* Comments List */}
      {loading ? (
        <div className="text-zinc-500">Yorumlar yükleniyor...</div>
      ) : comments.length === 0 ? (
        <div className="text-zinc-500 text-center py-8 bg-black/20 rounded-lg">Henüz hiç yorum yapılmamış. İlk yorum yapan siz olun!</div>
      ) : (
        <div className="flex flex-col gap-6">
          {comments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(comment => (
            <div key={comment.id} className="flex gap-4 p-6 bg-black/40 rounded-lg border border-zinc-800/50 hover:border-zinc-700 transition-colors">
              <img src={comment.profileAvatar} alt={comment.profileName} className="w-12 h-12 rounded-full border border-zinc-700 bg-zinc-800 object-cover" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-bold text-lg">{comment.profileName}</div>
                  <div className="text-sm text-zinc-500">{new Date(comment.createdAt).toLocaleDateString('tr-TR')}</div>
                </div>
                <div className="flex gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star key={star} className={`w-4 h-4 ${star <= comment.rating ? 'fill-yellow-500 text-yellow-500' : 'text-zinc-700'}`} />
                  ))}
                </div>
                <p className="text-zinc-300 leading-relaxed">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
