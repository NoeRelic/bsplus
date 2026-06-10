'use client';

import { Check, Info, Ticket, X, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PackagesPage() {
  const router = useRouter();
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const packages = [
    {
      name: 'Iron Pack',
      price: '₺49.90',
      description: 'Sadece film izlemek isteyenler için.',
      features: [
        '1 Cihaz Limiti',
        'Sadece Filmler',
        'Dizilere Erişim Yok',
        'Sonsuz / Sınırsız Erişim (Tek Seferlik Ödeme)',
      ],
      link: 'https://www.itemsatis.com/diger-urun-satislari/bs-plus-iron-uyeligi-5378038.html',
      color: 'border-zinc-400',
      btnColor: 'bg-zinc-600 hover:bg-zinc-500',
    },
    {
      name: 'Gold Pack',
      price: '₺89.90',
      description: 'Film ve sürpriz diziler sevenler için.',
      features: [
        '2 Cihaz Limiti',
        'Tüm Filmler',
        'Her Gün Yenilenen Rastgele 15 Dizi',
        'Sonsuz / Sınırsız Erişim (Tek Seferlik Ödeme)',
      ],
      link: 'https://www.itemsatis.com/diger-urun-satislari/bs-plus-gold-uyeligi-5378042.html',
      color: 'border-yellow-500',
      btnColor: 'bg-yellow-600 hover:bg-yellow-500',
      popular: true,
    },
    {
      name: 'Diamond Pack',
      price: '₺149.90',
      description: 'Sınır tanımayan dizi ve film tutkunlarına özel.',
      features: [
        '10 Cihaz Limiti',
        'Tüm Filmler',
        'Tüm Diziler',
        'Sonsuz / Sınırsız Erişim (Tek Seferlik Ödeme)',
      ],
      link: 'https://www.itemsatis.com/diger-urun-satislari/bs-plus-diamond-uyeligi-5378052.html',
      color: 'border-blue-500',
      btnColor: 'bg-blue-600 hover:bg-blue-500',
    },
  ];

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/coupons/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode, username, password })
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Bir hata oluştu.');
      } else {
        alert('Kupon başarıyla uygulandı ve deneme hesabınız oluşturuldu!');
        router.push('/profiles');
      }
    } catch (err) {
      setError('Sunucu bağlantı hatası.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white relative flex flex-col pt-12 pb-24 px-6 items-center">
      <div className="absolute top-0 left-0 w-full h-[50vh] bg-gradient-to-b from-blue-900/20 to-black z-0 pointer-events-none" />
      
      <div className="relative z-10 w-full max-w-6xl">
        <header className="flex justify-between items-center mb-16">
          <img src="https://r.resimlink.com/7tyeHIkaXUV.png" alt="BS+ Logo" className="h-10 object-contain" />
          <Link href="/login" className="text-zinc-300 hover:text-white transition-colors">
            Giriş Yap
          </Link>
        </header>

        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Sonsuz Eğlenceye Katılın</h1>
          <p className="text-xl text-zinc-400">Tek seferlik ödeme ile sınırsız BS+ deneyimi.</p>
          
          <button 
            onClick={() => setShowCouponModal(true)}
            className="mt-8 mx-auto flex items-center justify-center gap-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.1)] text-white px-6 py-3 rounded-full transition-all text-sm font-medium shadow-lg hover:-translate-y-1"
          >
            <Ticket className="w-5 h-5 text-purple-400" />
            Kupon Kodun Var Mı?
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {packages.map((pkg) => (
            <div 
              key={pkg.name} 
              className={`relative bg-zinc-900/50 rounded-2xl border ${pkg.color} p-8 flex flex-col transition-transform hover:-translate-y-2`}
            >
              {pkg.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-500 text-black px-4 py-1 rounded-full text-sm font-bold shadow-[0_0_15px_rgba(234,179,8,0.5)]">
                  En Popüler
                </div>
              )}
              <h2 className="text-2xl font-bold mb-2">{pkg.name}</h2>
              <p className="text-zinc-400 mb-6">{pkg.description}</p>
              
              <div className="text-4xl font-bold mb-8">
                {pkg.price}
              </div>

              <ul className="flex-1 space-y-4 mb-8">
                {pkg.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-blue-500 shrink-0" />
                    <span className="text-zinc-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <a 
                href={pkg.link}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full py-4 rounded-xl font-bold text-center transition-all ${pkg.btnColor} text-white`}
              >
                Paketi Satın Al
              </a>
            </div>
          ))}
        </div>

        <div className="bg-blue-900/20 border border-blue-500/30 rounded-2xl p-6 flex items-start gap-4 mx-auto max-w-3xl">
          <Info className="w-6 h-6 text-blue-400 shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-lg text-blue-100 mb-2">Önemli Bilgilendirme</h3>
            <p className="text-blue-200/80">
              Satın aldıktan sonra hesap <strong>itemsatış.com</strong> sitesinden teslim edilecektir. İşlemleriniz %100 <strong>İtemsatış Güvencesi</strong> altındadır. Hesabınız oluşturulduktan sonra panel üzerinden şifrenizi değiştirebilirsiniz.
            </p>
          </div>
        </div>
      </div>

      {showCouponModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#1e1e2d] border border-[rgba(255,255,255,0.1)] rounded-2xl w-full max-w-md p-8 relative shadow-2xl">
            <button 
              onClick={() => setShowCouponModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="flex flex-col items-center mb-6">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mb-4 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                <Ticket className="w-8 h-8 text-purple-400" />
              </div>
              <h2 className="text-2xl font-bold text-center">Kupon Kodu Kullan</h2>
              <p className="text-zinc-400 text-center text-sm mt-2">
                Kupon kodunuzla ücretsiz deneme hesabınızı oluşturun.
              </p>
            </div>
            
            <form onSubmit={handleApplyCoupon} className="space-y-4">
              {error && (
                <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-lg text-sm text-center">
                  {error}
                </div>
              )}
              
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Kupon Kodu</label>
                <input 
                  type="text"
                  required
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value)}
                  className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 uppercase transition-colors"
                  placeholder="KODU GİRİN"
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-1">Kullanıcı Adı Belirle</label>
                <input 
                  type="text"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="Kullanıcı Adı"
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-1">Şifre Belirle</label>
                <input 
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="••••••••"
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white rounded-xl py-3.5 font-bold transition-all shadow-[0_0_15px_rgba(147,51,234,0.3)] hover:shadow-[0_0_25px_rgba(147,51,234,0.5)] flex items-center justify-center mt-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Kodu Uygula ve Kayıt Ol'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
