import Link from 'next/link';

const isConfigured = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co'
);

async function getListings() {
  if (!isConfigured) return { events: [], restaurants: [], theaters: [] };
  try {
    const { supabase } = await import('@/lib/supabase');
    const [eventsRes, restsRes, theatersRes] = await Promise.all([
      supabase.from('events').select('*').eq('status', 'approved')
        .gte('event_date', new Date().toISOString().split('T')[0])
        .order('event_date', { ascending: true }).limit(20),
      supabase.from('restaurants').select('*').eq('status', 'approved')
        .order('created_at', { ascending: false }).limit(20),
      supabase.from('theaters').select('*').eq('status', 'approved')
        .order('last_updated', { ascending: false }).limit(20),
    ]);
    return {
      events:      eventsRes.data      ?? [],
      restaurants: restsRes.data       ?? [],
      theaters:    theatersRes.data    ?? [],
    };
  } catch {
    return { events: [], restaurants: [], theaters: [] };
  }
}

export const revalidate = 3600;

export default async function HomePage() {
  const { events, restaurants, theaters } = await getListings();

  if (!isConfigured) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center">
        <div className="text-5xl mb-4">🪔</div>
        <h1 className="text-2xl font-semibold text-stone-900 mb-3">Rangbhoomi is running!</h1>
        <p className="text-stone-500 mb-6 leading-relaxed">
          The app is working. Now you need to connect it to a database.<br />
          Follow the next steps to set up Supabase and create your <code className="text-sm bg-stone-100 px-1.5 py-0.5 rounded">.env.local</code> file.
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-left text-sm text-stone-600 space-y-2">
          <p className="font-medium text-stone-800">Next steps:</p>
          <p>1. Create a free account at <a href="https://supabase.com" target="_blank" className="text-amber-700 underline">supabase.com</a></p>
          <p>2. Run the SQL migration to create your tables</p>
          <p>3. Create a <code className="bg-stone-100 px-1 rounded">.env.local</code> file with your keys</p>
          <p>4. Restart the server with <code className="bg-stone-100 px-1 rounded">npm run dev</code></p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-3xl font-semibold text-stone-900 mb-2">Indian cultural life in America</h1>
        <p className="text-stone-500 text-lg max-w-2xl">
          Events, restaurants, and movie theaters — curated by the community, updated by AI. Free forever. No ads.
        </p>
      </div>

      <Section title="Upcoming events" icon="🎵" count={events.length} emptyMsg="No events yet — be the first to submit one.">
        <div className="grid gap-4 sm:grid-cols-2">
          {events.map((e: Record<string, unknown>) => (
            <div key={e.id as string} className="bg-white rounded-xl border border-stone-200 p-4">
              <div className="font-semibold text-stone-900 mb-1">{e.title as string}</div>
              <div className="text-sm text-stone-500">{e.event_date as string} · {e.venue_name as string}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Indian restaurants" icon="🍛" count={restaurants.length} emptyMsg="No restaurants yet — submit the first one.">
        <div className="grid gap-4 sm:grid-cols-2">
          {restaurants.map((r: Record<string, unknown>) => (
            <div key={r.id as string} className="bg-white rounded-xl border border-stone-200 p-4">
              <div className="font-semibold text-stone-900 mb-1">{r.name as string}</div>
              <div className="text-sm text-stone-500">{r.cuisine_type as string} · {r.city as string}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Movie theaters" icon="🎬" count={theaters.length} emptyMsg="No theaters listed yet.">
        <div className="grid gap-4 sm:grid-cols-2">
          {theaters.map((t: Record<string, unknown>) => (
            <div key={t.id as string} className="bg-white rounded-xl border border-stone-200 p-4">
              <div className="font-semibold text-stone-900 mb-1">{t.venue_name as string}</div>
              <div className="text-sm text-stone-500">{t.city as string}, {t.state as string}</div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function Section({ title, icon, count, children, emptyMsg }: {
  title: string; icon: string; count: number; children: React.ReactNode; emptyMsg: string;
}) {
  return (
    <section className="mb-12">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">{icon}</span>
        <h2 className="text-xl font-semibold text-stone-800">{title}</h2>
        <span className="ml-1 text-sm text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">{count}</span>
      </div>
      {count === 0
        ? <p className="text-stone-400 italic text-sm">{emptyMsg}</p>
        : children}
    </section>
  );
}
