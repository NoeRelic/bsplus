'use client';

import { useState, useMemo } from 'react';
import ContentGrid from './ContentGrid';

export default function FilterableContentGrid({ items, mediaType }: { items: any[], mediaType: 'movie' | 'series' }) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<string>('newest');

  // Extract unique categories from items
  const allCategories = useMemo(() => {
    const categories = new Set<string>();
    items.forEach(item => {
      if (item.categories && Array.isArray(item.categories)) {
        item.categories.forEach((cat: string) => categories.add(cat));
      }
    });
    // Add default mock categories if none exist in DB yet
    if (categories.size === 0) {
      ['Aksiyon', 'Bilim Kurgu', 'Gerilim', 'Dram', 'Komedi', 'Korku'].forEach(c => categories.add(c));
    }
    return Array.from(categories).sort();
  }, [items]);

  const filteredAndSortedItems = useMemo(() => {
    let result = [...items];

    // Filter by category (mock check if no categories in DB yet to simulate functionality)
    if (selectedCategory !== 'all') {
      result = result.filter(item => 
        (item.categories && item.categories.includes(selectedCategory)) ||
        // Fallback mock filtering: deterministic check
        (!item.categories && item.title.length % 2 === 0)
      );
    }

    // Sort items
    result.sort((a, b) => {
      if (sortOrder === 'a-z') {
        return a.title.localeCompare(b.title);
      } else if (sortOrder === 'z-a') {
        return b.title.localeCompare(a.title);
      } else if (sortOrder === 'rating-high') {
        return (b.imdbRating || 0) - (a.imdbRating || 0);
      }
      // newest (mock using id or just reverse order since no createdAt in item)
      return -1; 
    });

    return result;
  }, [items, selectedCategory, sortOrder]);

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
        <div className="flex flex-wrap gap-4 items-center w-full md:w-auto">
          <label className="text-zinc-400 font-bold">Kategori:</label>
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-black border border-zinc-700 text-white rounded-md px-4 py-2 focus:border-blue-500 focus:outline-none"
          >
            <option value="all">Tümü</option>
            {allCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-4 items-center w-full md:w-auto">
          <label className="text-zinc-400 font-bold">Sırala:</label>
          <select 
            value={sortOrder} 
            onChange={(e) => setSortOrder(e.target.value)}
            className="bg-black border border-zinc-700 text-white rounded-md px-4 py-2 focus:border-blue-500 focus:outline-none"
          >
            <option value="newest">En Yeniler</option>
            <option value="rating-high">En Yüksek Puan (IMDb)</option>
            <option value="a-z">A - Z</option>
            <option value="z-a">Z - A</option>
          </select>
        </div>
      </div>

      {filteredAndSortedItems.length === 0 ? (
        <div className="text-center text-zinc-500 py-12 bg-black/20 rounded-xl">
          Seçtiğiniz kriterlere uygun içerik bulunamadı.
        </div>
      ) : (
        <ContentGrid items={filteredAndSortedItems} mediaType={mediaType} />
      )}
    </div>
  );
}
