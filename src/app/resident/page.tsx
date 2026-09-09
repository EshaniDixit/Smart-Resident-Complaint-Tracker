'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import './resident.css';

// ---- Inline keyword classifier (mirrors server-side classify.ts) ----
const HIGH_KW = [
  'fire','flood','flooding','burst','electrocution','electric shock','sparks','sparking',
  'gas leak','gas smell','sewage overflow','sewage','collapse','collapsed','break-in','breakin',
  'intruder','no water','no electricity','no power','emergency','urgent','immediately',
  'dangerous','danger','injury','injured','bleeding','overflow','overflowing','short circuit',
  'blackout','power cut'
];
const MEDIUM_KW = [
  'broken','not working','stopped working','leak','leaking','dripping','flickering',
  'blocked','clogged','stuck','noisy','noise','smell','pest','rats','cockroach','cockroaches',
  'ants','damage','damaged','cracked','mould','mold','damp','rusty','rust','faulty',
  'no hot water','wobbly','broken lock'
];
const PLUMBING_KW  = ['pipe','water','tap','drain','sink','toilet','flush','shower','bathroom','plumbing','sewage','geyser','boiler'];
const ELECTRICAL_KW = ['electric','electrical','power','light','lights','switch','socket','plug','wiring','circuit','fuse','sparks','blackout','fan','lift','elevator'];
const SECURITY_KW  = ['security','guard','cctv','camera','break-in','intruder','theft','stolen','gate','lock','intercom','stranger','suspicious','vandalism'];
const CLEANLINESS_KW = ['clean','cleaning','dirty','garbage','trash','waste','dust','smell','stink','cockroach','pest','rats','sweeping','litter'];

function classifyLocally(text: string) {
  const t = text.toLowerCase();
  const urgency = HIGH_KW.some(kw => t.includes(kw)) ? 'High'
    : MEDIUM_KW.some(kw => t.includes(kw)) ? 'Medium' : 'Low';

  const scores: Record<string,number> = {
    Plumbing:    PLUMBING_KW.filter(kw => t.includes(kw)).length,
    Electrical:  ELECTRICAL_KW.filter(kw => t.includes(kw)).length,
    Security:    SECURITY_KW.filter(kw => t.includes(kw)).length,
    Cleanliness: CLEANLINESS_KW.filter(kw => t.includes(kw)).length,
    'General Maintenance': 0,
  };
  const topCategory = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  const category = topCategory[1] > 0 ? topCategory[0] : 'General Maintenance';

  let response = `Thank you for your report regarding ${category.toLowerCase()}. `;
  if (urgency === 'High') response += 'We have marked this as HIGH PRIORITY. Our team will attend to it immediately — typically within 2 hours.';
  else if (urgency === 'Medium') response += `We will have our ${category.toLowerCase()} maintenance team address this within 24–48 hours.`;
  else response += 'This has been logged and will be addressed during the next routine maintenance round.';

  return { category, urgency, response };
}
// -----------------------------------------------------------------------

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} minute${mins > 1 ? 's' : ''} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

export default function ResidentDashboard() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [prediction, setPrediction] = useState<{ category: string; urgency: string; response: string } | null>(null);
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [forceSubmit, setForceSubmit] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchComplaints();
  }, []);

  // Instant inline classification — no worker, no loading, no race conditions
  useEffect(() => {
    if (description.trim().length < 10) {
      setPrediction(null);
      setDuplicates([]);
      setForceSubmit(false);
      return;
    }
    setPrediction(classifyLocally(description));

    // Debounced duplicate check (600ms after user stops typing)
    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/complaints/check-duplicate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description }),
        });
        if (res.ok) {
          const data = await res.json();
          setDuplicates(data.duplicates || []);
        }
      } catch {}
    }, 600);

    return () => clearTimeout(timer);
  }, [description]);

  const fetchComplaints = async () => {
    const res = await fetch('/api/complaints');
    if (res.status === 401) {
      router.push('/login');
      return;
    }
    const data = await res.json();
    setComplaints(data.complaints || []);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    
    setIsSubmitting(true);

    try {
      // Only send description — server classifies authoritatively
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description })
      });
      if (res.ok) {
        setDescription('');
        setPrediction(null);
        setDuplicates([]);
        setForceSubmit(false);
        fetchComplaints();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Resident Dashboard</h1>
        <button onClick={handleLogout} className="logout-button">Logout</button>
      </header>

      <main className="dashboard-content">
        <section className="new-complaint-section">
          <h2>Submit a New Complaint</h2>
          <form onSubmit={handleSubmit} className="complaint-form">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your issue (e.g., Water is leaking heavily from the ceiling in 4B)"
              required
              rows={4}
              className="complaint-input"
            />
            
            <div className="ai-feedback">
              <div className="ai-status">
                🤖 {description.trim().length < 10 ? 'Start typing to see AI triage...' : 'Live AI Analysis:'}
              </div>
              {prediction && (
                <div className="ai-prediction">
                  <span className="badge category-badge">{prediction.category}</span>
                  <span className={`badge urgency-${prediction.urgency.toLowerCase()}`}>
                    {prediction.urgency} Urgency
                  </span>
                  <p className="ai-response-preview">"{prediction.response}"</p>
                </div>
              )}
            </div>

            {/* Duplicate Detection Panel — only shown to residents while typing */}
            {duplicates.length > 0 && !forceSubmit && (
              <div className="duplicate-warning">
                <div className="duplicate-header">
                  <span className="duplicate-icon">⚠️</span>
                  <strong>Similar complaint{duplicates.length > 1 ? 's' : ''} already exist{duplicates.length === 1 ? 's' : ''}</strong>
                </div>
                <div className="duplicate-list">
                  {duplicates.map((dup) => (
                    <div key={dup.id} className="duplicate-card">
                      <p className="duplicate-desc">
                        "{dup.summary || dup.description.slice(0, 100)}"
                      </p>
                      <div className="duplicate-meta">
                        <span className={`status-badge status-${dup.status.toLowerCase()}`}>
                          {dup.status.replace('_', ' ')}
                        </span>
                        <span className="duplicate-time">
                          Reported {formatTimeAgo(dup.createdAt)}
                        </span>
                        {dup.category && <span className="badge category-badge">{dup.category}</span>}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="duplicate-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setForceSubmit(true)}
                  >
                    Submit Anyway
                  </button>
                </div>
              </div>
            )}
            {forceSubmit && duplicates.length > 0 && (
              <div className="force-submit-notice">
                ✅ Submitting as a new complaint. Your report may add useful context.
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || (duplicates.length > 0 && !forceSubmit)}
              className="submit-button"
            >
              {isSubmitting ? 'Submitting...' : duplicates.length > 0 && !forceSubmit ? 'See Similar Complaints Above ↑' : 'Submit Complaint'}
            </button>
          </form>
        </section>

        <section className="history-section">
          <h2>Your Complaints</h2>
          <div className="complaints-list">
            {complaints.length === 0 ? (
              <p className="empty-state">You have no complaints submitted.</p>
            ) : (
              complaints.map(c => (
                <div key={c.id} className="complaint-card">
                  <div className="card-header">
                    <span className={`status-badge status-${c.status.toLowerCase()}`}>{c.status.replace('_', ' ')}</span>
                    <span className="date">{new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="description">{c.description}</p>
                  <div className="meta">
                    <span className="badge category-badge">{c.category}</span>
                    <span className={`badge urgency-${c.urgency?.toLowerCase()}`}>{c.urgency}</span>
                  </div>
                  {c.aiResponse && (
                    <div className="ai-auto-response">
                      <strong>Auto-Response:</strong> {c.aiResponse}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
