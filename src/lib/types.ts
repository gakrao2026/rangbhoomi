// ─────────────────────────────────────────────────────────────────────────────
// Rangbhoomi — Shared TypeScript Types
// ─────────────────────────────────────────────────────────────────────────────

export type Status = 'pending' | 'approved' | 'rejected';
export type EntityType = 'event' | 'restaurant' | 'theater' | 'person';

export type EventCategory =
  | 'music' | 'dance' | 'film' | 'festival'
  | 'spiritual' | 'art' | 'food' | 'sports' | 'other';

export type PriceRange = '$' | '$$' | '$$$' | '$$$$';

export interface Venue {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip?: string;
  phone?: string;
  website?: string;
  venue_type: 'auditorium' | 'temple' | 'theater' | 'outdoor' | 'community_center' | 'restaurant' | 'other';
  capacity?: number;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  category: EventCategory;
  subcategory?: string;
  event_date: string;        // ISO date string
  event_time?: string;
  venue_id?: string;
  venue_name?: string;
  venue_city?: string;
  venue_state?: string;
  organizer?: string;
  ticket_url?: string;
  price?: string;
  is_free: boolean;
  tags: string[];
  source_url?: string;
  status: Status;
  stale_flags: number;
  submitted_by?: string;
  ai_sourced: boolean;
  created_at: string;
  updated_at: string;
}

export interface Dish {
  name: string;
  upvotes: number;
}

export interface Restaurant {
  id: string;
  name: string;
  cuisine_type: string;
  specialties: string[];
  top_dishes: Dish[];
  known_for: string[];
  address: string;
  city: string;
  state: string;
  zip?: string;
  phone?: string;
  website?: string;
  hours?: Record<string, string>;
  price_range?: PriceRange;
  highlight?: string;
  source_url?: string;
  status: Status;
  stale_flags: number;
  submitted_by?: string;
  ai_sourced: boolean;
  created_at: string;
  updated_at: string;
}

export interface Screening {
  title: string;
  language: string;
  showtimes: string[];
  end_date?: string;
}

export interface Theater {
  id: string;
  venue_name: string;
  address: string;
  city: string;
  state: string;
  zip?: string;
  phone?: string;
  website?: string;
  booking_url?: string;
  current_screenings: Screening[];
  upcoming_screenings: Screening[];
  source_url?: string;
  status: Status;
  stale_flags: number;
  submitted_by?: string;
  ai_sourced: boolean;
  last_updated: string;
  created_at: string;
}

export interface Person {
  id: string;
  name: string;
  field?: string;
  bio?: string;
  city?: string;
  state?: string;
  professional_links: { type: string; url: string }[];
  visible_fields: string[];
  opt_in: true;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Submission {
  id: string;
  entity_type: EntityType;
  data: Record<string, unknown>;
  submitter_email: string;
  status: 'pending' | 'approved' | 'rejected' | 'stale';
  reviewer_notes?: string;
  ip_address: string;
  flagged_count: number;
  ai_sourced: boolean;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
}

export interface TrackedCity {
  id: string;
  city: string;
  state: string;
  active: boolean;
  last_run?: string;
  created_at: string;
}

// ── API request/response types ────────────────────────────────────────────────

export interface DiscoverRequest {
  city: string;
  state?: string;
  category: 'events' | 'restaurants' | 'theaters';
}

export interface DiscoveredListing {
  // Events
  title?: string;
  category?: string;
  subcategory?: string;
  date?: string;
  time?: string;
  venue_name?: string;
  price?: string;
  description?: string;
  source_url?: string;
  // Restaurants
  name?: string;
  cuisine_type?: string;
  address?: string;
  known_for?: string[];
  top_dishes?: string[];
  price_range?: string;
  // Theaters
  now_showing?: string[];
  booking_url?: string;
  // Meta
  is_free?: boolean;
}

export interface SubmitRequest {
  entity_type: EntityType;
  data: Record<string, unknown>;
  submitter_email: string;
}
