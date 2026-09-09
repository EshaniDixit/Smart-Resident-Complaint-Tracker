'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import './admin.css';

export default function AdminDashboard() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    const res = await fetch('/api/complaints');
    if (res.status === 401) {
      router.push('/login');
      return;
    }
    const data = await res.json();
    setComplaints(data.complaints || []);
    setLoading(false);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const updateStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/complaints/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    
    if (res.ok) {
      fetchComplaints();
    }
  };

  if (loading) {
    return <div className="loading-state">Loading dashboard...</div>;
  }

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1>Admin Dashboard - Society Tracker</h1>
        <button onClick={handleLogout} className="logout-button">Logout</button>
      </header>

      <main className="admin-content">
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Complaints</h3>
            <p className="stat-value">{complaints.length}</p>
          </div>
          <div className="stat-card">
            <h3>Open Issues</h3>
            <p className="stat-value">{complaints.filter(c => c.status === 'OPEN').length}</p>
          </div>
          <div className="stat-card">
            <h3>High Urgency</h3>
            <p className="stat-value text-red">{complaints.filter(c => c.urgency === 'High' && c.status !== 'RESOLVED').length}</p>
          </div>
        </div>

        <section className="complaints-section">
          <h2>All Complaints</h2>
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Resident</th>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Urgency</th>
                  <th>Description / AI Summary</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map(c => (
                  <tr key={c.id}>
                    <td><strong>{c.resident.username}</strong></td>
                    <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td><span className="badge category-badge">{c.category}</span></td>
                    <td><span className={`badge urgency-${c.urgency?.toLowerCase()}`}>{c.urgency}</span></td>
                    <td className="description-cell">
                      {c.summary && (
                        <div className="ai-summary-pill">
                          <span className="summary-label">📝 AI Summary</span>
                          <span className="summary-text">{c.summary}</span>
                        </div>
                      )}
                      <p className="original-desc">{c.description}</p>
                    </td>
                    <td>
                      <span className={`status-badge status-${c.status.toLowerCase()}`}>
                        {c.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <select 
                        value={c.status}
                        onChange={(e) => updateStatus(c.id, e.target.value)}
                        className="status-select"
                      >
                        <option value="OPEN">Open</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="RESOLVED">Resolved</option>
                      </select>
                    </td>
                  </tr>
                ))}
                {complaints.length === 0 && (
                  <tr>
                    <td colSpan={7} className="empty-state">No complaints found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
