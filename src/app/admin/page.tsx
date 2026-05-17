'use client';
import { useState, useEffect, useCallback } from 'react';

interface Submission {
  id: string;
  entity_type: string;
  data: Record<string, unknown>;
  submitter_email: string;
  status: string;
  ai_sourced: boolean;
  created_at: string;
}

export default function AdminPage() {
  const [secret, setSecret] = useState('');
  const [authed, setAuthed] = useState(false);
  const [subs, setSubs] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('pending');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const fetchSubmissions = useCallback(async (currentSecret: string, currentFilter: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/submissions?status=${currentFilter}`, {
        headers: { 'x-admin-secret': currentSecret },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to load');
      } else {
        setSubs(data.submissions ?? []);
      }
    } catch {
      setError('Could not connect to server');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authed) fetchSubmissions(secret, filter);
  }, [authed, filter, fetchSubmissions, secret]);

  const act = async (id: string, action: 'approve' | 'reject') => {
    setMsg('');
    const res = await fetch('/api/admin/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
      body: JSON.stringify({ submission_id: id, action }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg('Error: ' + (data.error ?? 'Unknown error'));
    } else {
      setMsg(`✓ ${action === 'approve' ? 'Approved' : 'Rejected'} successfully`);
      setSubs(s => s.filter(x => x.id !== id));
    }
  };

  if (!authed) return (
    <div className="max-w-sm mx-auto py-16 text-center">
      <div className="text-4xl mb-4">🔐</div>
      <h1 className="text-xl font-semibold text-stone-900 mb-4">Admin</h1>
      <input
        type="password"
        placeholder="Admin password"
        value={secret}
        onChange={e => setSecret(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && secret && setAuthed(true)}
        className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-amber-400"
      />
      <button
        onClick={() => secret && setAuthed(true)}
        className="w-full py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors"
      >
        Enter
      </button>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-semibold text-stone-900">Moderation queue</h1>
        <div className="flex gap-2 flex-wrap">
          {['pending', 'approved', 'rejected'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${filter === s ? 'bg-amber-600 text-white' : 'bg-white border border-stone-200 text-stone-600 hover:border-amber-300'}`}>
              {s}
            </button>
          ))}
          <button onClick={() => fetchSubmissions(secret, filter)}
            className="px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-sm text-stone-600 hover:border-amber-300 transition-colors">
            ↻ Refresh
          </button>
        </div>
      </div>

      {msg && (
        <div className={`mb-4 px-4 py-2 rounded-lg text-sm ${msg.startsWith('Error') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
          {msg}
        </div>
      )}

      {error && (
        <div className="mb-4 px-4 py-2 rounded-lg text-sm bg-red-50 text-red-700 border border-red-200">{error}</div>
      )}

      {loading && <p className="text-stone-400 text-sm">Loading…</p>}

      {!loading && subs.length === 0 && !error && (
        <div className="text-center py-16 text-stone-300">
          <div className="text-5xl mb-3">✨</div>
          <p className="text-stone-400">No {filter} submissions</p>
          {filter === 'pending' && (
            <p className="text-stone-400 text-sm mt-2">
              Go to <a href="/discover" className="text-amber-600 underline">AI Discover</a> to find new listings
            </p>
          )}
        </div>
      )}

      <div className="space-y-4">
        {subs.map(sub => {
          const d = sub.data;
          const title = String(d.title ?? d.name ?? d.venue_name ?? 'Untitled');
          const meta = [d.date ?? d.event_date, d.city ?? d.venue_city, d.cuisine_type].filter(Boolean).join(' · ');
          return (
            <div key={sub.id} className="bg-white border border-stone-200 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs bg-stone-100 text-stone-600 font-medium px-2 py-0.5 rounded-full">{sub.entity_type}</span>
                    {sub.ai_sourced && <span className="text-xs bg-blue-50 text-blue-700 font-medium px-2 py-0.5 rounded-full">AI-sourced</span>}
                    <span className="text-xs text-stone-400">{new Date(sub.created_at).toLocaleDateString()}</span>
                  </div>
                  <h3 className="font-semibold text-stone-900">{title}</h3>
                  {meta && <p className="text-sm text-stone-500 mt-0.5">{meta}</p>}
                  <p className="text-xs text-stone-400 mt-0.5">{sub.submitter_email}</p>
                </div>
                {sub.status === 'pending' && (
                  <div className="flex gap-2">
                    <button onClick={() => act(sub.id, 'approve')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
                      ✓ Approve
                    </button>
                    <button onClick={() => act(sub.id, 'reject')}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors">
                      ✗ Reject
                    </button>
                  </div>
                )}
              </div>
              <details className="cursor-pointer">
                <summary className="text-xs font-medium text-stone-400 hover:text-stone-600">View raw data</summary>
                <pre className="mt-2 bg-stone-50 rounded p-2 overflow-auto text-xs">{JSON.stringify(sub.data, null, 2)}</pre>
              </details>
            </div>
          );
        })}
      </div>
    </div>
  );
}
