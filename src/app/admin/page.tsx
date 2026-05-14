'use client';
import { useState, useEffect } from 'react';

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

  const fetchSubmissions = async () => {
    setLoading(true);
    // In production: fetch from /api/admin/submissions with secret header
    // For now, direct Supabase query via client (anon key can't read submissions — use service key in a proper admin API)
    const res = await fetch(`/api/admin/submissions?status=${filter}`, {
      headers: { 'x-admin-secret': secret },
    });
    if (res.ok) {
      const data = await res.json();
      setSubs(data.submissions ?? []);
    }
    setLoading(false);
  };

  const act = async (id: string, action: 'approve' | 'reject', notes = '') => {
    await fetch('/api/admin/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
      body: JSON.stringify({ submission_id: id, action, reviewer_notes: notes }),
    });
    setSubs(s => s.filter(x => x.id !== id));
  };

  if (!authed) return (
    <div className="max-w-sm mx-auto py-16 text-center">
      <div className="text-4xl mb-4">🔐</div>
      <h1 className="text-xl font-semibold text-stone-900 mb-4">Admin</h1>
      <input
        type="password" placeholder="Admin secret" value={secret} onChange={e => setSecret(e.target.value)}
        className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-amber-400"
      />
      <button onClick={() => { setAuthed(true); setTimeout(fetchSubmissions, 100); }}
        className="w-full py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors">
        Enter
      </button>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-stone-900">Moderation queue</h1>
        <div className="flex gap-2">
          {['pending', 'approved', 'rejected'].map(s => (
            <button key={s} onClick={() => { setFilter(s); setTimeout(fetchSubmissions, 100); }}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${filter === s ? 'bg-amber-600 text-white' : 'bg-white border border-stone-200 text-stone-600 hover:border-amber-300'}`}>
              {s}
            </button>
          ))}
          <button onClick={fetchSubmissions} className="px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-sm text-stone-600 hover:border-amber-300 transition-colors">
            Refresh
          </button>
        </div>
      </div>

      {loading && <p className="text-stone-400 text-sm">Loading…</p>}

      {!loading && subs.length === 0 && (
        <div className="text-center py-16 text-stone-300">
          <div className="text-5xl mb-3">✨</div>
          <p className="text-stone-400">No {filter} submissions</p>
        </div>
      )}

      <div className="space-y-4">
        {subs.map(sub => {
          const d = sub.data;
          const title = (d.title ?? d.name ?? d.venue_name ?? 'Untitled') as string;
          return (
            <div key={sub.id} className="bg-white border border-stone-200 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs bg-stone-100 text-stone-600 font-medium px-2 py-0.5 rounded-full">{sub.entity_type}</span>
                    {sub.ai_sourced && <span className="text-xs bg-blue-50 text-blue-700 font-medium px-2 py-0.5 rounded-full">AI-sourced</span>}
                    <span className="text-xs text-stone-400">{new Date(sub.created_at).toLocaleDateString()}</span>
                  </div>
                  <h3 className="font-semibold text-stone-900">{title}</h3>
                  <p className="text-sm text-stone-500">{sub.submitter_email}</p>
                </div>
                {sub.status === 'pending' && (
                  <div className="flex gap-2">
                    <button onClick={() => act(sub.id, 'approve')}
                      className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors">
                      ✓ Approve
                    </button>
                    <button onClick={() => act(sub.id, 'reject')}
                      className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200 transition-colors">
                      ✗ Reject
                    </button>
                  </div>
                )}
              </div>
              <details className="text-xs text-stone-500 cursor-pointer">
                <summary className="font-medium text-stone-400 hover:text-stone-600">View raw data</summary>
                <pre className="mt-2 bg-stone-50 rounded p-2 overflow-auto text-xs">{JSON.stringify(sub.data, null, 2)}</pre>
              </details>
            </div>
          );
        })}
      </div>
    </div>
  );
}
