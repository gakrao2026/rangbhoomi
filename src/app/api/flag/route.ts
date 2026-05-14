import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? '0.0.0.0';
  const { entity_type, entity_id } = await req.json();
  if (!entity_type || !entity_id) {
    return NextResponse.json({ error: 'entity_type and entity_id required' }, { status: 400 });
  }
  const db = supabaseAdmin();

  // Deduplicate — one flag per IP per entity
  const { error: flagError } = await db
    .from('stale_flags')
    .insert({ entity_type, entity_id, reporter_ip: ip });
  if (flagError?.code === '23505') {
    return NextResponse.json({ message: 'Already flagged' });
  }

  // Increment stale_flags on the main table
  const tableMap: Record<string, string> = {
    event: 'events',
    restaurant: 'restaurants',
    theater: 'theaters',
  };
  const table = tableMap[entity_type as string];
  if (table) {
    const { data: current } = await db
      .from(table as 'events')
      .select('stale_flags')
      .eq('id', entity_id)
      .single();
    if (current) {
      const newCount = (current.stale_flags as number ?? 0) + 1;
      await db.from(table as 'events').update({ stale_flags: newCount }).eq('id', entity_id);
    }
  }

  return NextResponse.json({ success: true });
}
