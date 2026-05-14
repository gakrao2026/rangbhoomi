import { NextRequest, NextResponse } from 'next/server';
import { discoverListings } from '@/lib/anthropic';
import { supabaseAdmin } from '@/lib/supabase';
import type { DiscoverRequest } from '@/lib/types';

// POST /api/discover
// Body: { city, category }
// Returns discovered listings (does NOT auto-approve — returns candidates)
export async function POST(req: NextRequest) {
  const body = await req.json() as DiscoverRequest;
  const { city, category } = body;

  if (!city || !category) {
    return NextResponse.json({ error: 'city and category are required' }, { status: 400 });
  }

  try {
    const listings = await discoverListings(city, category);
    return NextResponse.json({ listings, count: listings.length });
  } catch (e) {
    console.error('Discovery error:', e);
    return NextResponse.json({ error: 'Discovery failed' }, { status: 500 });
  }
}
