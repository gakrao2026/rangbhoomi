import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const adminSecret = req.headers.get('x-admin-secret');
  if (adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { submission_id, action, reviewer_notes } = await req.json();
  if (!submission_id || !action) {
    return NextResponse.json({ error: 'submission_id and action required' }, { status: 400 });
  }

  const db = supabaseAdmin();
  const { data: sub, error: fetchError } = await db
    .from('submissions')
    .select('*')
    .eq('id', submission_id)
    .single();

  if (fetchError || !sub) {
    return NextResponse.json({ error: 'Submission not found: ' + fetchError?.message }, { status: 404 });
  }

  if (action === 'reject') {
    await db.from('submissions')
      .update({ status: 'rejected', reviewer_notes, reviewed_at: new Date().toISOString() })
      .eq('id', submission_id);
    return NextResponse.json({ success: true, action: 'rejected' });
  }

  if (action === 'approve') {
    const d = sub.data as Record<string, unknown>;
    let insertError = null;

    if (sub.entity_type === 'event') {
      const { error } = await db.from('events').insert({
        title:        d.title       ?? d.name ?? 'Untitled Event',
        description:  d.description ?? null,
        category:     d.category    ?? 'other',
        subcategory:  d.subcategory ?? null,
        event_date:   d.date        ?? d.event_date ?? new Date().toISOString().split('T')[0],
        event_time:   d.time        ?? d.event_time ?? null,
        venue_name:   d.venue_name  ?? null,
        venue_city:   d.venue_city  ?? d.city ?? null,
        venue_state:  d.venue_state ?? d.state ?? null,
        ticket_url:   d.ticket_url  ?? null,
        price:        d.price       ?? null,
        is_free:      d.is_free     ?? false,
        source_url:   d.source_url  ?? null,
        tags:         d.tags        ?? [],
        status:       'approved',
        ai_sourced:   sub.ai_sourced,
        submitted_by: sub.submitter_email,
      });
      insertError = error;

    } else if (sub.entity_type === 'restaurant') {
      const rawDishes = (d.top_dishes ?? []) as (string | { name: string; upvotes: number })[];
      const dishes = rawDishes.map(item =>
        typeof item === 'string' ? { name: item, upvotes: 0 } : item
      );
      const { error } = await db.from('restaurants').insert({
        name:         d.name         ?? 'Unnamed Restaurant',
        cuisine_type: d.cuisine_type ?? 'Indian',
        address:      d.address      ?? '',
        city:         d.city         ?? d.venue_city ?? '',
        state:        d.state        ?? d.venue_state ?? '',
        known_for:    d.known_for    ?? [],
        top_dishes:   dishes,
        price_range:  d.price_range  ?? null,
        highlight:    d.highlight    ?? d.description ?? null,
        source_url:   d.source_url   ?? null,
        status:       'approved',
        ai_sourced:   sub.ai_sourced,
        submitted_by: sub.submitter_email,
      });
      insertError = error;

    } else if (sub.entity_type === 'theater') {
      const nowShowing = ((d.now_showing ?? d.current_screenings ?? []) as string[])
        .map((t: string) => ({ title: t, language: 'Hindi', showtimes: [] }));
      const { error } = await db.from('theaters').insert({
        venue_name:          d.venue_name ?? 'Unknown Theater',
        address:             d.address    ?? '',
        city:                d.city       ?? d.venue_city  ?? '',
        state:               d.state      ?? d.venue_state ?? '',
        current_screenings:  nowShowing,
        upcoming_screenings: [],
        booking_url:         d.booking_url ?? null,
        source_url:          d.source_url  ?? null,
        status:              'approved',
        ai_sourced:          sub.ai_sourced,
        submitted_by:        sub.submitter_email,
      });
      insertError = error;
    }

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to insert into main table: ' + insertError.message },
        { status: 500 }
      );
    }

    // Only mark approved after successful insert
    await db.from('submissions')
      .update({ status: 'approved', reviewer_notes, reviewed_at: new Date().toISOString() })
      .eq('id', submission_id);

    return NextResponse.json({ success: true, action: 'approved' });
  }

  return NextResponse.json({ error: 'action must be approve or reject' }, { status: 400 });
}
