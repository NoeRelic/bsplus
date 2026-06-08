import { Check, Info } from 'lucide-react';
import Link from 'next/link';

export default function PackagesPage() {
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
    </div>
  );
}
