import Anthropic from '@anthropic-ai/sdk';
import type { DiscoveredListing } from './types';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// ── Prompts ───────────────────────────────────────────────────────────────────

const PROMPTS = {
  events: (city: string) => `
Search the web for upcoming Indian cultural events in ${city} in 2026.
Include: Carnatic/Hindustani concerts, Bharatanatyam and classical dance, Bollywood shows,
garba/dandiya nights, Diwali/Holi/Navratri festivals, Indian film screenings, bhajans,
literary events, comedy shows, and large community gatherings.

Return ONLY a raw JSON array — no markdown fences, no preamble, no explanation.
Up to 8 items. Each item must be:
{
  "title": "...",
  "category": "music|dance|festival|film|spiritual|art|other",
  "subcategory": "e.g. Carnatic, Bharatanatyam, Garba, Bollywood",
  "date": "MMM DD, YYYY or approximate",
  "time": "HH:MM AM/PM or null",
  "venue_name": "...",
  "venue_city": "${city}",
  "price": "Free or $XX or $XX–$XX",
  "is_free": true/false,
  "description": "One sentence description.",
  "source_url": "https://... or null"
}`,

  restaurants: (city: string) => `
Search the web for well-regarded Indian restaurants in ${city}.
Cover a range of regional cuisines: South Indian, North Indian, Punjabi, Gujarati, Bengali,
street food, Indo-Chinese, etc. Include both established spots and newer gems.

Return ONLY a raw JSON array — no markdown fences, no preamble, no explanation.
Up to 8 items. Each item must be:
{
  "name": "...",
  "cuisine_type": "e.g. South Indian, North Indian, Gujarati",
  "address": "full street address",
  "city": "${city}",
  "known_for": ["...", "...", "..."],
  "top_dishes": ["...", "...", "..."],
  "price_range": "$|$$|$$$|$$$$",
  "highlight": "One community-voice sentence about what makes it special.",
  "source_url": "https://... or null"
}`,

  theaters: (city: string) => `
Search the web for movie theaters in ${city} that regularly show Indian films
(Bollywood Hindi, Tamil, Telugu, Malayalam, Kannada, Punjabi).
Look for Cinemark, AMC, Regal, and independent screens with Indian film schedules.

Return ONLY a raw JSON array — no markdown fences, no preamble, no explanation.
Up to 6 items. Each item must be:
{
  "venue_name": "...",
  "address": "full street address",
  "city": "${city}",
  "now_showing": ["Film Title (Language)", "..."],
  "upcoming": ["Film Title (Language)", "..."],
  "booking_url": "https://... or null",
  "source_url": "https://... or null"
}`,
};

// ── Main discovery function ───────────────────────────────────────────────────

export async function discoverListings(
  city: string,
  category: 'events' | 'restaurants' | 'theaters'
): Promise<DiscoveredListing[]> {
  const prompt = PROMPTS[category](city);

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    tools: [{ type: 'web_search_20250305' as const, name: 'web_search' }],
    system:
      'You find Indian diaspora cultural listings in US cities. ' +
      'Search the web thoroughly using multiple queries. ' +
      'Return ONLY a valid JSON array with no text before or after it. ' +
      'Never include markdown fences. Just the raw [ array ].',
    messages: [{ role: 'user', content: prompt }],
  });

  // Collect all text blocks (the model may produce text after tool use)
  const text = response.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('\n');

  // Extract JSON array from the response
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) {
    console.warn(`No JSON array found in AI response for ${city} ${category}`);
    return [];
  }

  try {
    const parsed = JSON.parse(match[0]);
    if (!Array.isArray(parsed)) return [];
    return parsed as DiscoveredListing[];
  } catch (e) {
    console.error('Failed to parse AI response JSON:', e);
    return [];
  }
}

// ── Batch discovery for cron job ─────────────────────────────────────────────

export async function discoverAllForCity(city: string): Promise<{
  events: DiscoveredListing[];
  restaurants: DiscoveredListing[];
  theaters: DiscoveredListing[];
}> {
  // Sequential to avoid rate limits
  const events      = await discoverListings(city, 'events');
  const restaurants = await discoverListings(city, 'restaurants');
  const theaters    = await discoverListings(city, 'theaters');
  return { events, restaurants, theaters };
}
