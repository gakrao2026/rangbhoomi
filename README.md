# 🪔 Rangbhoomi · रंगभूमि

**Indian cultural life in America** — community-curated, AI-assisted, free forever.

Events · Restaurants · Movie theaters · People directory

---

## What this is

A living directory of Indian cultural life across US cities: concerts, Carnatic performances, Diwali melas, Bollywood shows, regional restaurants, and theaters screening Hindi/Tamil/Telugu films. Built for the diaspora, sustained by the diaspora.

No ads. No paid listings. Volunteer-reviewed. AI keeps it fresh.

---

## Architecture

```
Browser                Next.js (Vercel)              Supabase (Postgres)
───────────────────────────────────────────────────────────────────────
/ (explore)    →  Server Component  →  SELECT approved rows
/discover      →  Client + /api/discover  →  Claude API (web_search)
/submit        →  Client + /api/submit    →  INSERT into submissions
/admin         →  Client + /api/admin/*   →  Review queue, approve/reject

Weekly cron    →  /api/cron/discover      →  Batch AI discovery → submissions
```

### Key tables
| Table | Purpose |
|-------|---------|
| `events` | Approved cultural events |
| `restaurants` | Approved restaurant listings |
| `theaters` | Approved movie theater listings |
| `venues` | Shared venue records (FK from events) |
| `people` | Opt-in directory |
| `submissions` | Moderation queue — everything lands here first |
| `stale_flags` | IP-deduplicated stale reports |
| `tracked_cities` | Which cities the weekly cron discovers |

### Self-updating loop
1. **Weekly cron** (Monday 9 AM UTC) → calls Claude with web_search for each tracked city → drops results into `submissions` as `ai_sourced: true`
2. **Volunteer reviews** → `/admin` page → approve pushes record to main table
3. **Community flags** → 3 flags → DB trigger sets `status = 'pending'` → back to review queue

---

## Setup

### 1. Clone and install
```bash
git clone https://github.com/yourhandle/rangbhoomi
cd rangbhoomi
npm install
```

### 2. Supabase
1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/migrations/001_initial_schema.sql` in the SQL editor
3. Copy your Project URL, Anon Key, and Service Role Key

### 3. Environment variables
```bash
cp .env.local.example .env.local
# Fill in your keys
```

### 4. Run locally
```bash
npm run dev
# Open http://localhost:3000
```

### 5. Deploy to Vercel
```bash
npx vercel
# Add all env vars in Vercel dashboard
# The weekly cron is configured in vercel.json
```

---

## Adding a city

In Supabase SQL editor:
```sql
insert into public.tracked_cities (city, state) values ('Phoenix', 'AZ');
```

The next Monday cron run will pick it up automatically.

---

## Volunteer onboarding

The `/admin` page is protected by `ADMIN_SECRET`. Share this with trusted volunteers. They see the moderation queue and can approve or reject in one click.

For now: one shared secret. Next step would be individual volunteer accounts via Supabase Auth.

---

## Roadmap

- [ ] Email verification on submissions (Resend)
- [ ] City pages with filtering (`/cities/chicago`)
- [ ] Individual volunteer accounts (Supabase Auth)
- [ ] Dish upvote UI on restaurant pages
- [ ] Push notifications for events in your city
- [ ] Mobile app (React Native / Expo)
- [ ] Tamil, Telugu, Hindi interface translations
- [ ] Embed widget for temple/organization websites

---

## Contributing

PRs welcome. Issues welcome. If you're Indian-origin and want to volunteer as a city moderator, open an issue.

Built with Next.js · Supabase · Claude API · Tailwind · Vercel
