import type { Event } from '@/lib/types';

export default function EventCard({ event: e }: { event: Event }) {
  const catColors: Record<string, string> = {
    music: 'bg-purple-100 text-purple-800',
    dance: 'bg-pink-100 text-pink-800',
    festival: 'bg-amber-100 text-amber-800',
    film: 'bg-blue-100 text-blue-800',
    spiritual: 'bg-orange-100 text-orange-800',
    art: 'bg-teal-100 text-teal-800',
    food: 'bg-green-100 text-green-800',
  };
  const color = catColors[e.category] ?? 'bg-stone-100 text-stone-700';

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-4 hover:border-amber-300 transition-colors">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${color} mb-1.5 inline-block`}>
            {e.subcategory ?? e.category}
          </span>
          <h3 className="font-semibold text-stone-900 leading-tight">{e.title}</h3>
        </div>
        {e.is_free && (
          <span className="text-xs bg-green-100 text-green-700 font-medium px-2 py-0.5 rounded-full whitespace-nowrap">Free</span>
        )}
      </div>

      <div className="space-y-1 text-sm text-stone-500 mb-3">
        <div className="flex items-center gap-1.5">
          <span>📅</span>
          <span>{formatDate(e.event_date)}{e.event_time ? ` · ${e.event_time}` : ''}</span>
        </div>
        {e.venue_name && (
          <div className="flex items-center gap-1.5">
            <span>📍</span>
            <span>{e.venue_name}, {e.venue_city}</span>
          </div>
        )}
        {e.price && !e.is_free && (
          <div className="flex items-center gap-1.5">
            <span>🎟</span>
            <span>{e.price}</span>
          </div>
        )}
      </div>

      {e.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {e.tags.map(t => (
            <span key={t} className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full">{t}</span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-stone-100">
        {e.ticket_url ? (
          <a href={e.ticket_url} target="_blank" rel="noopener noreferrer"
            className="text-xs text-amber-700 hover:text-amber-900 font-medium">
            Get tickets →
          </a>
        ) : <span />}
        <FlagButton entityType="event" entityId={e.id} />
      </div>
    </div>
  );
}

function FlagButton({ entityType, entityId }: { entityType: string; entityId: string }) {
  return (
    <button
      className="text-xs text-stone-300 hover:text-red-400 transition-colors"
      title="Flag as outdated"
      onClick={async () => {
        await fetch('/api/flag', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entity_type: entityType, entity_id: entityId }),
        });
      }}
    >
      ⚑ stale?
    </button>
  );
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
