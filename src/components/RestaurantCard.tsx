import type { Restaurant } from '@/lib/types';

export default function RestaurantCard({ restaurant: r }: { restaurant: Restaurant }) {
  return (
    <div className="bg-white rounded-xl border border-stone-200 p-4 hover:border-amber-300 transition-colors">
      <div className="flex items-start justify-between gap-2 mb-1">
        <div>
          <span className="text-xs text-stone-400 font-medium uppercase tracking-wide">
            {r.cuisine_type} · {r.price_range ?? '—'}
          </span>
          <h3 className="font-semibold text-stone-900 mt-0.5">{r.name}</h3>
          <p className="text-sm text-stone-500">{r.city}, {r.state}</p>
        </div>
      </div>

      {r.highlight && (
        <p className="text-sm text-stone-600 italic mt-2 mb-3 border-l-2 border-amber-300 pl-3">
          "{r.highlight}"
        </p>
      )}

      {r.known_for?.length > 0 && (
        <div className="mb-2">
          <p className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-1.5">Known for</p>
          <div className="flex flex-wrap gap-1">
            {r.known_for.map(t => (
              <span key={t} className="text-xs bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">{t}</span>
            ))}
          </div>
        </div>
      )}

      {r.top_dishes?.length > 0 && (
        <div>
          <p className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-1.5">Top dishes</p>
          <div className="flex flex-wrap gap-1">
            {r.top_dishes.map(d => (
              <span key={d.name} className="text-xs bg-stone-50 text-stone-700 border border-stone-200 px-2 py-0.5 rounded-full">
                {d.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
