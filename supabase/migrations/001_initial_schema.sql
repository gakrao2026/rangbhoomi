-- ─────────────────────────────────────────────────────────────────────────────
-- Rangbhoomi — Initial Schema
-- Run this in your Supabase SQL editor or via `supabase db push`
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ── 1. VENUES ────────────────────────────────────────────────────────────────
-- Shared venue records referenced by events
create table public.venues (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  address     text not null,
  city        text not null,
  state       text not null,
  zip         text,
  phone       text,
  website     text,
  venue_type  text not null check (venue_type in (
                'auditorium','temple','theater','outdoor','community_center','restaurant','other')),
  capacity    integer,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── 2. EVENTS ────────────────────────────────────────────────────────────────
create table public.events (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  description   text,
  category      text not null check (category in (
                  'music','dance','film','festival','spiritual','art','food','sports','other')),
  subcategory   text,
  event_date    date not null,
  event_time    text,
  venue_id      uuid references public.venues(id) on delete set null,
  -- Denormalized for quick display without join
  venue_name    text,
  venue_city    text,
  venue_state   text,
  organizer     text,
  ticket_url    text,
  price         text,
  is_free       boolean not null default false,
  tags          text[] default '{}',
  source_url    text,
  status        text not null default 'pending' check (status in ('pending','approved','rejected')),
  stale_flags   integer not null default 0,
  submitted_by  text,           -- email, nullable for AI-sourced
  ai_sourced    boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ── 3. RESTAURANTS ───────────────────────────────────────────────────────────
create table public.restaurants (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  cuisine_type  text not null,
  specialties   text[] default '{}',
  top_dishes    jsonb default '[]',   -- [{name, upvotes}]
  known_for     text[] default '{}',
  address       text not null,
  city          text not null,
  state         text not null,
  zip           text,
  phone         text,
  website       text,
  hours         jsonb,               -- {mon: "11am-10pm", ...}
  price_range   text check (price_range in ('$','$$','$$$','$$$$')),
  highlight     text,               -- community one-liner
  source_url    text,
  status        text not null default 'pending' check (status in ('pending','approved','rejected')),
  stale_flags   integer not null default 0,
  submitted_by  text,
  ai_sourced    boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ── 4. THEATERS ──────────────────────────────────────────────────────────────
create table public.theaters (
  id                  uuid primary key default gen_random_uuid(),
  venue_name          text not null,
  address             text not null,
  city                text not null,
  state               text not null,
  zip                 text,
  phone               text,
  website             text,
  booking_url         text,
  current_screenings  jsonb default '[]',   -- [{title, language, showtimes[], end_date}]
  upcoming_screenings jsonb default '[]',
  source_url          text,
  status              text not null default 'pending' check (status in ('pending','approved','rejected')),
  stale_flags         integer not null default 0,
  submitted_by        text,
  ai_sourced          boolean not null default false,
  last_updated        timestamptz not null default now(),
  created_at          timestamptz not null default now()
);

-- ── 5. PEOPLE ────────────────────────────────────────────────────────────────
-- Opt-in only — submitted by the person themselves
create table public.people (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  field              text,
  bio                text,
  city               text,
  state              text,
  professional_links jsonb default '[]',   -- [{type: "linkedin", url: "..."}]
  visible_fields     text[] default '{"name","field","city"}', -- user-controlled
  opt_in             boolean not null default true check (opt_in = true),
  verified           boolean not null default false,
  submitter_email    text not null,        -- kept private, never shown
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- ── 6. SUBMISSIONS (moderation queue) ────────────────────────────────────────
create table public.submissions (
  id              uuid primary key default gen_random_uuid(),
  entity_type     text not null check (entity_type in ('event','restaurant','theater','person')),
  data            jsonb not null,          -- full proposed record
  submitter_email text not null,
  status          text not null default 'pending' check (status in (
                    'pending','approved','rejected','stale')),
  reviewer_notes  text,
  ip_address      text not null default '0.0.0.0',
  flagged_count   integer not null default 0,
  ai_sourced      boolean not null default false,
  reviewed_by     text,
  reviewed_at     timestamptz,
  created_at      timestamptz not null default now()
);

-- ── 7. DISH UPVOTES ──────────────────────────────────────────────────────────
create table public.dish_upvotes (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  dish_name     text not null,
  voter_ip      text not null,
  created_at    timestamptz not null default now(),
  unique (restaurant_id, dish_name, voter_ip)
);

-- ── 8. STALE FLAGS ───────────────────────────────────────────────────────────
create table public.stale_flags (
  id          uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id   uuid not null,
  reporter_ip text not null,
  created_at  timestamptz not null default now(),
  unique (entity_type, entity_id, reporter_ip)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────────────────────────────────────
create index events_city_state_idx   on public.events (venue_city, venue_state);
create index events_date_idx         on public.events (event_date);
create index events_status_idx       on public.events (status);
create index events_category_idx     on public.events (category);
create index restaurants_city_idx    on public.restaurants (city, state);
create index restaurants_status_idx  on public.restaurants (status);
create index theaters_city_idx       on public.theaters (city, state);
create index submissions_status_idx  on public.submissions (status);
create index submissions_type_idx    on public.submissions (entity_type);

-- ─────────────────────────────────────────────────────────────────────────────
-- AUTO-HIDE: trigger to hide items when stale_flags >= 3
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function auto_hide_stale()
returns trigger language plpgsql as $$
begin
  if NEW.stale_flags >= 3 and OLD.stale_flags < 3 then
    NEW.status := 'pending';  -- sends back to queue for review
  end if;
  return NEW;
end;
$$;

create trigger trg_events_stale
  before update on public.events
  for each row execute function auto_hide_stale();

create trigger trg_restaurants_stale
  before update on public.restaurants
  for each row execute function auto_hide_stale();

create trigger trg_theaters_stale
  before update on public.theaters
  for each row execute function auto_hide_stale();

-- ─────────────────────────────────────────────────────────────────────────────
-- UPDATED_AT trigger
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin NEW.updated_at := now(); return NEW; end;
$$;

create trigger trg_events_updated_at     before update on public.events     for each row execute function set_updated_at();
create trigger trg_restaurants_updated_at before update on public.restaurants for each row execute function set_updated_at();
create trigger trg_venues_updated_at     before update on public.venues     for each row execute function set_updated_at();
create trigger trg_people_updated_at     before update on public.people     for each row execute function set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- Public read of approved records; writes only via service role (API routes)
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.events       enable row level security;
alter table public.restaurants  enable row level security;
alter table public.theaters     enable row level security;
alter table public.venues       enable row level security;
alter table public.people       enable row level security;
alter table public.submissions  enable row level security;
alter table public.dish_upvotes enable row level security;
alter table public.stale_flags  enable row level security;

-- Anyone can read approved listings
create policy "public read events"      on public.events      for select using (status = 'approved');
create policy "public read restaurants" on public.restaurants for select using (status = 'approved');
create policy "public read theaters"    on public.theaters    for select using (status = 'approved');
create policy "public read venues"      on public.venues      for select using (true);
create policy "public read people"      on public.people      for select using (verified = true and opt_in = true);

-- Upvotes and flags: anyone can insert (rate-limited by IP in app layer)
create policy "public insert upvotes" on public.dish_upvotes for insert with check (true);
create policy "public insert flags"   on public.stale_flags  for insert with check (true);

-- All writes go through the service role (API routes use SUPABASE_SERVICE_KEY)
-- No anon insert on core tables — submissions table is the intake point
create policy "public insert submissions" on public.submissions for insert with check (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- TRACKED CITIES: which cities the cron job auto-discovers for
-- ─────────────────────────────────────────────────────────────────────────────
create table public.tracked_cities (
  id         uuid primary key default gen_random_uuid(),
  city       text not null,
  state      text not null,
  active     boolean not null default true,
  last_run   timestamptz,
  created_at timestamptz not null default now(),
  unique (city, state)
);

insert into public.tracked_cities (city, state) values
  ('San Jose', 'CA'),
  ('Sunnyvale', 'CA'),
  ('Fremont', 'CA'),
  ('Chicago', 'IL'),
  ('Dallas', 'TX'),
  ('Houston', 'TX'),
  ('Atlanta', 'GA'),
  ('New York', 'NY'),
  ('Edison', 'NJ'),
  ('Seattle', 'WA');
