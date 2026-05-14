import { NextRequest, NextResponse } from 'next/server';
import { discoverAllForCity } from '@/lib/anthropic';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/cron/discover
// Called weekly by Vercel Cron (see vercel.json)
// Discovers new listings for all tracked cities and enqueues as pending submissions
export async function GET(req: NextRequest) {
  // Verify cron secret to prevent unauthorized calls
  const cronSecret = req.headers.get('x-cron-secret');
  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = supabaseAdmin();

  // Fetch active tracked cities
  const { data: cities, error: citiesError } = await db
    .from('tracked_cities')
    .select('*')
    .eq('active', true);

  if (citiesError || !cities?.length) {
    return NextResponse.json({ error: 'No active cities found' }, { status: 400 });
  }

  const results: Record<string, { events: number; restaurants: number; theaters: number }> = {};

  for (const city of cities) {
    console.log(`Discovering listings for ${city.city}, ${city.state}...`);
    const cityStr = `${city.city}, ${city.state}`;

    try {
      const { events, restaurants, theaters } = await discoverAllForCity(cityStr);

      // Bulk-insert all discovered items as pending submissions
      const submissions = [
        ...events.map(e => ({
          entity_type: 'event' as const,
          data: { ...e, venue_city: city.city, venue_state: city.state },
          submitter_email: 'ai-discovery@rangbhoomi.internal',
          ip_address: '0.0.0.0',
          status: 'pending' as const,
          ai_sourced: true,
        })),
        ...restaurants.map(r => ({
          entity_type: 'restaurant' as const,
          data: { ...r, city: city.city, state: city.state },
          submitter_email: 'ai-discovery@rangbhoomi.internal',
          ip_address: '0.0.0.0',
          status: 'pending' as const,
          ai_sourced: true,
        })),
        ...theaters.map(t => ({
          entity_type: 'theater' as const,
          data: { ...t, city: city.city, state: city.state },
          submitter_email: 'ai-discovery@rangbhoomi.internal',
          ip_address: '0.0.0.0',
          status: 'pending' as const,
          ai_sourced: true,
        })),
      ];

      if (submissions.length > 0) {
        await db.from('submissions').insert(submissions);
      }

      // Update last_run timestamp
      await db
        .from('tracked_cities')
        .update({ last_run: new Date().toISOString() })
        .eq('id', city.id);

      results[cityStr] = {
        events: events.length,
        restaurants: restaurants.length,
        theaters: theaters.length,
      };

      // Pause between cities to avoid rate limits
      await new Promise(r => setTimeout(r, 3000));
    } catch (e) {
      console.error(`Failed to discover for ${cityStr}:`, e);
      results[cityStr] = { events: -1, restaurants: -1, theaters: -1 };
    }
  }

  const total = Object.values(results).reduce(
    (acc, r) => ({ events: acc.events + Math.max(0, r.events), restaurants: acc.restaurants + Math.max(0, r.restaurants), theaters: acc.theaters + Math.max(0, r.theaters) }),
    { events: 0, restaurants: 0, theaters: 0 }
  );

  console.log('Cron discovery complete:', total);
  return NextResponse.json({ success: true, cities_processed: cities.length, total, results });
}
