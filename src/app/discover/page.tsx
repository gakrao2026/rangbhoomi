'use client';
import { useState } from 'react';

interface DiscoveredItem {
  title?: string; name?: string; venue_name?: string;
  category?: string; date?: string; time?: string;
  description?: string; highlight?: string;
  cuisine_type?: string; address?: string; price?: string;
  known_for?: string[]; top_dishes?: string[]; now_showing?: string[];
  source_url?: string; is_free?: boolean;
  _id?: number;
}

export default function DiscoverPage() {
  const [city, setCity] = useState('');
  const [category, setCategory] = useState<'events' | 'restaurants' | 'theaters'>('events');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<DiscoveredItem[]>([]);
  const [queue, setQueue] = useState<DiscoveredItem[]>([]);
  const [error, setError] = useState('');
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());

  const discover = async () => {
    if (!city.trim()) return;
    setLoading(true); setError(''); setResults([]);
    try {
      const res = await fetch('/api/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city: city.trim(), category }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResults((data.listings as DiscoveredItem[]).map((r, i) => ({ ...r, _id: i })));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Discovery failed');
    }
    setLoading(false);
  };

  const addToQueue = async (item: DiscoveredItem) => {
    setAddedIds(s => new Set([...s, item._id!]));
    setQueue(q => [...q, item]);
    // Submit to moderation queue
    await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entity_type: category === 'events' ? 'event' : category === 'restaurants' ? 'restaurant' : 'theater',
        data: item,
        submitter_email: 'ai-discovery@rangbhoomi.internal',
      }),
    });
  };

  const displayName = (item: DiscoveredItem) => item.title ?? item.name ?? item.venue_name ?? 'Untitled';
  const displayMeta = (item: DiscoveredItem) => [item.description ?? item.highlight ?? item.cuisine_type, item.date, item.address].filter(Boolean).join(' · ');

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-stone-900 mb-1">AI Discovery</h1>
        <p className="text-stone-500">Search the public web for Indian cultural listings in any US city. Reviewed items join the moderation queue before going live.</p>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl p-5 mb-6">
        <div className="flex flex-wrap gap-3 mb-4">
          <input
            type="text"
            placeholder="City (e.g. Chicago, Houston, Atlanta)"
            value={city}
            onChange={e => setCity(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && discover()}
            className="flex-1 min-w-48 px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <select
            value={category}
            onChange={e => setCategory(e.target.value as typeof category)}
            className="px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none"
          >
            <option value="events">Cultural events</option>
            <option value="restaurants">Restaurants</option>
            <option value="theaters">Movie theaters</option>
          </select>
          <button
            onClick={discover}
            disabled={loading || !city.trim()}
            className="px-5 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Searching…' : 'Discover →'}
          </button>
        </div>
        <div className="text-xs text-stone-400 bg-stone-50 rounded-lg px-3 py-2">
          ⚡ Claude searches the public web in real time and returns structured candidates for your review. Nothing goes live without moderation.
        </div>
      </div>

      {loading && (
        <div className="text-center py-12 text-stone-400">
          <div className="text-4xl mb-3 animate-pulse">🔍</div>
          <p>Searching the web for Indian {category} in {city}…</p>
          <p className="text-xs mt-1">This takes 10–20 seconds</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">{error}</div>
      )}

      {results.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-medium text-stone-500 mb-3">
            Found {results.length} candidates — review and add to queue
          </h2>
          <div className="space-y-3">
            {results.map(item => {
              const added = addedIds.has(item._id!);
              return (
                <div key={item._id} className={`bg-white border rounded-xl p-4 transition-colors ${added ? 'border-green-200 opacity-60' : 'border-stone-200'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="font-medium text-stone-900 mb-1">{displayName(item)}</div>
                      <div className="text-sm text-stone-500 mb-2">{displayMeta(item)}</div>
                      {item.known_for && (
                        <div className="flex flex-wrap gap-1">
                          {item.known_for.slice(0, 3).map((t, i) => (
                            <span key={i} className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">{t}</span>
                          ))}
                        </div>
                      )}
                      {item.now_showing && (
                        <div className="flex flex-wrap gap-1">
                          {item.now_showing.slice(0, 3).map((t, i) => (
                            <span key={i} className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">{t}</span>
                          ))}
                        </div>
                      )}
                      {item.source_url && (
                        <a href={item.source_url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-stone-400 hover:text-amber-600 mt-1 block">
                          Source →
                        </a>
                      )}
                    </div>
                    <button
                      onClick={() => !added && addToQueue(item)}
                      disabled={added}
                      className="text-xs px-3 py-1.5 rounded-lg border border-stone-300 hover:bg-amber-50 hover:border-amber-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                    >
                      {added ? '✓ Queued' : '+ Add to queue'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {queue.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h3 className="text-sm font-medium text-amber-800 mb-3">
            Pending moderation queue ({queue.length})
          </h3>
          <div className="space-y-2">
            {queue.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-stone-700 font-medium">{displayName(item)}</span>
                <span className="text-stone-400 text-xs">pending review</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-amber-700 mt-3">
            A volunteer will review these within 48 hours before they appear publicly.
          </p>
        </div>
      )}

      {!loading && results.length === 0 && queue.length === 0 && !error && (
        <div className="text-center py-16 text-stone-300">
          <div className="text-5xl mb-4">🔭</div>
          <p className="text-stone-400">Enter a city above to discover Indian cultural listings</p>
        </div>
      )}
    </div>
  );
}
