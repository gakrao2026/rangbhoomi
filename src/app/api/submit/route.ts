import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import type { SubmitRequest } from '@/lib/types';

// Simple IP-based rate limit: max 5 submissions per hour per IP
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();
const LIMIT = 5;
const WINDOW_MS = 60 * 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    return true;
  }
  if (entry.count >= LIMIT) return false;
  entry.count++;
  return true;
}

// POST /api/submit
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? '0.0.0.0';
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Rate limit exceeded. Max 5 submissions per hour.' }, { status: 429 });
  }

  const body = await req.json() as SubmitRequest;
  const { entity_type, data, submitter_email } = body;

  if (!entity_type || !data || !submitter_email) {
    return NextResponse.json({ error: 'entity_type, data, and submitter_email are required' }, { status: 400 });
  }

  if (!submitter_email.includes('@')) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
  }

  // People directory: opt_in must explicitly be true
  if (entity_type === 'person' && !data.opt_in) {
    return NextResponse.json({ error: 'opt_in must be true for people directory submissions' }, { status: 400 });
  }

  const db = supabaseAdmin();
  const { data: submission, error } = await db
    .from('submissions')
    .insert({
      entity_type,
      data,
      submitter_email,
      ip_address: ip,
      status: 'pending',
      ai_sourced: false,
    })
    .select()
    .single();

  if (error) {
    console.error('Submission insert error:', error);
    return NextResponse.json({ error: 'Failed to save submission' }, { status: 500 });
  }

  // TODO: send verification email via Resend/SendGrid
  // await sendVerificationEmail(submitter_email, submission.id);

  return NextResponse.json({ success: true, submission_id: submission.id });
}
