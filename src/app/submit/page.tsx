'use client';
import { useState } from 'react';

type EntityType = 'event' | 'restaurant' | 'theater' | 'person';

export default function SubmitPage() {
  const [type, setType] = useState<EntityType>('event');
  const [email, setEmail] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string, v: string) => setFields(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!email || !email.includes('@')) { setError('Valid email required'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity_type: type, data: { ...fields, opt_in: type === 'person' ? true : undefined }, submitter_email: email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDone(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Submission failed');
    }
    setLoading(false);
  };

  if (done) return (
    <div className="max-w-xl mx-auto text-center py-16">
      <div className="text-5xl mb-4">✅</div>
      <h2 className="text-xl font-semibold text-stone-900 mb-2">Submission received</h2>
      <p className="text-stone-500 mb-6">A confirmation was sent to your email. Our volunteer team reviews submissions within 48 hours.</p>
      <button onClick={() => { setDone(false); setFields({}); }} className="px-5 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors">Submit another</button>
    </div>
  );

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-stone-900 mb-1">Submit a listing</h1>
        <p className="text-stone-500">All submissions are reviewed by a volunteer before appearing publicly. Your email is used only for verification.</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 mb-6">
        🛡 Submissions require email verification · Auto-hidden at 3 stale flags · People directory is opt-in only
      </div>

      {/* Type selector */}
      <div className="mb-6">
        <p className="text-sm font-medium text-stone-600 mb-3">What are you submitting?</p>
        <div className="grid grid-cols-4 gap-2">
          {([['event', '🎵', 'Event'], ['restaurant', '🍛', 'Restaurant'], ['theater', '🎬', 'Theater'], ['person', '👤', 'Person']] as [EntityType, string, string][]).map(([t, icon, label]) => (
            <button key={t} onClick={() => setType(t)}
              className={`py-3 rounded-xl border text-sm font-medium transition-colors ${type === t ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-stone-600 border-stone-200 hover:border-amber-300'}`}>
              <span className="block text-xl mb-1">{icon}</span>{label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-4">
        {type === 'event' && <>
          <Field label="Event title *" value={fields.title ?? ''} onChange={v => set('title', v)} placeholder="e.g. Carnatic Vocal Concert — Bombay Jayashri" />
          <Field label="Date & time" value={fields.date ?? ''} onChange={v => set('date', v)} placeholder="e.g. Jun 14, 2026 · 7:00 PM" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category" value={fields.category ?? ''} onChange={v => set('category', v)} placeholder="music / dance / festival / film" />
            <Field label="Sub-category" value={fields.subcategory ?? ''} onChange={v => set('subcategory', v)} placeholder="e.g. Carnatic, Garba, Bollywood" />
          </div>
          <Field label="Venue name" value={fields.venue_name ?? ''} onChange={v => set('venue_name', v)} placeholder="e.g. Flint Center" />
          <Field label="City, State" value={fields.venue_city ?? ''} onChange={v => set('venue_city', v)} placeholder="e.g. Cupertino, CA" />
          <Field label="Price" value={fields.price ?? ''} onChange={v => set('price', v)} placeholder="Free or $25–$85" />
          <Field label="Ticket / Event URL" value={fields.ticket_url ?? ''} onChange={v => set('ticket_url', v)} placeholder="https://..." />
        </>}

        {type === 'restaurant' && <>
          <Field label="Restaurant name *" value={fields.name ?? ''} onChange={v => set('name', v)} placeholder="e.g. Udupi Palace" />
          <Field label="Cuisine type" value={fields.cuisine_type ?? ''} onChange={v => set('cuisine_type', v)} placeholder="e.g. South Indian, North Indian, Gujarati" />
          <Field label="Full address" value={fields.address ?? ''} onChange={v => set('address', v)} placeholder="Street address" />
          <Field label="City, State" value={fields.city ?? ''} onChange={v => set('city', v)} placeholder="e.g. Sunnyvale, CA" />
          <Field label="Price range" value={fields.price_range ?? ''} onChange={v => set('price_range', v)} placeholder="$ / $$ / $$$ / $$$$" />
          <Field label="Known for (comma-separated)" value={fields.known_for ?? ''} onChange={v => set('known_for', v)} placeholder="e.g. Masala dosa, Filter coffee, Weekend thali" />
          <Field label="What makes it special" value={fields.highlight ?? ''} onChange={v => set('highlight', v)} placeholder="One sentence in community voice" />
        </>}

        {type === 'theater' && <>
          <Field label="Theater name *" value={fields.venue_name ?? ''} onChange={v => set('venue_name', v)} placeholder="e.g. AMC Cupertino Square 16" />
          <Field label="Full address" value={fields.address ?? ''} onChange={v => set('address', v)} placeholder="Street address" />
          <Field label="City, State" value={fields.city ?? ''} onChange={v => set('city', v)} placeholder="e.g. Cupertino, CA" />
          <Field label="Films now showing (comma-separated)" value={fields.now_showing ?? ''} onChange={v => set('now_showing', v)} placeholder="Stree 3 (Hindi), GOAT (Tamil)" />
          <Field label="Booking URL" value={fields.booking_url ?? ''} onChange={v => set('booking_url', v)} placeholder="https://..." />
        </>}

        {type === 'person' && <>
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-sm text-blue-800">
            🔒 People directory is opt-in only. You must be submitting your own information. You can remove yourself at any time.
          </div>
          <Field label="Your name *" value={fields.name ?? ''} onChange={v => set('name', v)} placeholder="Full name" />
          <Field label="Field / profession" value={fields.field ?? ''} onChange={v => set('field', v)} placeholder="e.g. Software engineer, Classical musician, Cardiologist" />
          <Field label="City, State" value={fields.city ?? ''} onChange={v => set('city', v)} placeholder="e.g. San Jose, CA" />
          <Field label="LinkedIn or website URL" value={fields.linkedin ?? ''} onChange={v => set('linkedin', v)} placeholder="https://..." />
          <Field label="Brief bio (optional)" value={fields.bio ?? ''} onChange={v => set('bio', v)} placeholder="2–3 sentences" />
        </>}

        <hr className="border-stone-100" />

        <Field label="Your email (for verification) *" value={email} onChange={setEmail} placeholder="you@email.com" type="email" />
        <Field label="Source URL (optional)" value={fields.source_url ?? ''} onChange={v => set('source_url', v)} placeholder="Event website, Google Maps, etc." />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          onClick={submit}
          disabled={loading}
          className="w-full py-2.5 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Submitting…' : 'Submit for review →'}
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-stone-500 mb-1.5">{label}</label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder-stone-300"
      />
    </div>
  );
}
