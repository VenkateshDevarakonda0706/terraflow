'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, Check } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

interface Props {
  token: string;
  onClose: () => void;
}

export default function ModerationPanel({ token, onClose }: Props) {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API}/moderation/reports`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch reports.');
      }
      const data = await response.json();
      setReports(data);
    } catch (err: any) {
      setError(err.message || 'Error loading reports.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResolve(reportId: string) {
    setResolvingId(reportId);
    try {
      const response = await fetch(`${API}/moderation/reports/${reportId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'RESOLVED' }),
      });
      if (!response.ok) {
        throw new Error('Failed to resolve report.');
      }
      // Update local state
      setReports(prev =>
        prev.map(r => (r.id === reportId ? { ...r, status: 'RESOLVED' } : r))
      );
    } catch (err: any) {
      alert(err.message || 'Error resolving report.');
    } finally {
      setResolvingId(null);
    }
  }

  const s: Record<string, React.CSSProperties> = {
    overlay: { position: 'fixed', inset: 0, zIndex: 40, display: 'flex', justifyContent: 'flex-end', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' },
    panel: { width: '100%', maxWidth: 380, height: '100vh', background: 'rgba(8,6,20,0.99)', borderLeft: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', overflowY: 'auto' },
    header: { padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    reportCard: { margin: '0 16px 12px', padding: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 },
    resolveBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 8, color: '#34d399', fontSize: 11, fontWeight: 700, cursor: 'pointer' },
  };

  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.panel}>
        {/* Header */}
        <div style={s.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldAlert size={16} color="#a78bfa" />
            <span style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 3, color: '#a78bfa' }}>Moderation</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 22, cursor: 'pointer' }}>×</button>
        </div>

        {/* Content list */}
        <div style={{ padding: '16px 0', flex: 1, display: 'flex', flexDirection: 'column' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 20, opacity: 0.3, fontSize: 12 }}>Loading reports...</div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: 20, color: '#fca5a5', fontSize: 12 }}>{error}</div>
          ) : reports.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 20, opacity: 0.3, fontSize: 12 }}>No reports submitted yet.</div>
          ) : (
            reports.map(report => (
              <div key={report.id} style={s.reportCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(255,255,255,0.35)' }}>
                    Report by @{report.reporter?.username || 'unknown'}
                  </span>
                  <span style={{
                    fontSize: 9,
                    padding: '2px 6px',
                    borderRadius: 4,
                    fontWeight: 700,
                    background: report.status === 'PENDING' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)',
                    color: report.status === 'PENDING' ? '#fbbf24' : '#34d399'
                  }}>
                    {report.status}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: '#fff', marginBottom: 6, fontWeight: 600 }}>
                  Reason: &quot;{report.reason}&quot;
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 10 }}>
                  Post Title: {report.post?.title || <span style={{ opacity: 0.3 }}>Deleted post</span>}
                </div>
                {report.status === 'PENDING' && (
                  <button
                    disabled={resolvingId === report.id}
                    onClick={() => handleResolve(report.id)}
                    style={s.resolveBtn}
                  >
                    <Check size={12} />
                    {resolvingId === report.id ? 'Resolving...' : 'Resolve Report'}
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
