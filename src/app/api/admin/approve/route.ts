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
  const { data: sub } = await db.from('submissions').select('*').eq('id', submission_id).single();
  if (!sub) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (action === 'reject') {
    await db.from('submissions').update({ status: 'rejected', reviewer_notes, reviewed_at: new Date().toISOString() }).eq('id', submission_id);
    return NextResponse.json({ success: true, action: 'rejected' });
  }

  if (action === 'approve') {
    const d = sub.data as Record<string, unknown>;
    if (sub.entity_type === 'event') {
      await db.from('events').insert({ title: d.title, category: d.category ?? 'other', subcategory: d.subcategory, event_date: d.date, event_time: d.time, venue_name: d.venue_name, venue_city: d.venue_city, venue_state: d.venue_state, price: d.price, is_free: d.is_free ?? false, source_url: d.source_url, status: 'approved', ai_sourced: sub.ai_sourced, submitted_by: sub.submitter_email });
    } else if (sub.entity_type === 'restaurant') {
      await db.from('restaurants').insert({ name: d.name, cuisine_type: d.cuisine_type ?? 'Indian', address: d.address ?? '', city: d.city, state: d.state, known_for: d.known_for ?? [], top_dishes: (d.top_dishes as string[] ?? []).map((n: string) => ({ name: n, upvotes: 0 })), price_range: d.price_range, highlight: d.highlight, source_url: d.source_url, status: 'approved', ai_sourced: sub.ai_sourced, submitted_by: sub.submitter_email });
    } else if (sub.entity_type === 'theater') {
      await db.from('theaters').insert({ venue_name: d.venue_name, address: d.address ?? '', city: d.city, state: d.state, current_screenings: (d.now_showing as string[] ?? []).map((t: string) => ({ title: t, language: 'Hindi', showtimes: [] })), booking_url: d.booking_url, source_url: d.source_url, status: 'approved', ai_sourced: sub.ai_sourced, submitted_by: sub.submitter_email });
    }
    await db.from('submissions').update({ status: 'approved', reviewer_notes, reviewed_at: new Date().toISOString() }).eq('id', submission_id);
    return NextResponse.json({ success: true, action: 'approved' });
  }
  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
