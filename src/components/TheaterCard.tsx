import type { Theater } from '@/lib/types';

export default function TheaterCard({ theater: t }: { theater: Theater }) {
  return (
    <div className="bg-white rounded-xl border border-stone-200 p-4 hover:border-amber-300 transition-colors">
      <h3 className="font-semibold text-stone-900">{t.venue_name}</h3>
      <p className="text-sm text-stone-500 mb-3">{t.city}, {t.state}</p>

      {t.current_screenings?.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-1.5">Now showing</p>
          <div className="flex flex-wrap gap-1">
            {t.current_screenings.map(s => (
              <span key={s.title} className="text-xs bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-full">
                {s.title} ({s.language})
              </span>
            ))}
          </div>
        </div>
      )}

      {t.upcoming_screenings?.length > 0 && (
        <div>
          <p className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-1.5">Coming soon</p>
          <div className="flex flex-wrap gap-1">
            {t.upcoming_screenings.map(s => (
              <span key={s.title} className="text-xs bg-stone-50 text-stone-600 border border-stone-200 px-2 py-0.5 rounded-full">
                {s.title}
              </span>
            ))}
          </div>
        </div>
      )}

      {t.booking_url && (
        <a href={t.booking_url} target="_blank" rel="noopener noreferrer"
          className="mt-3 text-xs text-amber-700 hover:text-amber-900 font-medium block">
          Book tickets →
        </a>
      )}
    </div>
  );
}
