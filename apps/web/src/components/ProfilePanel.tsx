'use client';

import React, { useState, useRef } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

interface Props {
  user: any;
  token: string;
  onClose: () => void;
  onPinClick: (lat: number, lng: number) => void;
  onProfileUpdated: (updated: any) => void;
}

export default function ProfilePanel({ user, token, onClose, onPinClick, onProfileUpdated }: Props) {
  const [editing, setEditing]     = useState(false);
  const [name, setName]           = useState(user.name || '');
  const [bio, setBio]             = useState(user.bio || '');
  const [saving, setSaving]       = useState(false);
  const [saveErr, setSaveErr]     = useState('');
  const [posts, setPosts]         = useState<any[]>([]);
  const [postsLoaded, setLoaded]  = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatar]    = useState<string>(user.profilePic || '');
  const [uploading, setUploading] = useState(false);

  // Load user's posts when panel opens
  React.useEffect(() => {
    fetch(`${API}/auth/users/${user.username}`)
      .then(r => r.json())
      .then(d => { setPosts(d.posts || []); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, [user.username]);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append('file', file);
    try {
      const r = await fetch(`${API}/posts/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const d = await r.json();
      if (d.url) setAvatar(d.url);
    } catch (_) {}
    setUploading(false);
  }

  async function handleSave() {
    setSaving(true); setSaveErr('');
    try {
      const r = await fetch(`${API}/auth/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, bio, profilePic: avatarUrl }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || 'Failed to save');
      onProfileUpdated(d);
      setEditing(false);
    } catch (err: any) {
      setSaveErr(err.message);
    } finally {
      setSaving(false);
    }
  }

  const s: Record<string, React.CSSProperties> = {
    overlay: { position: 'fixed', inset: 0, zIndex: 40, display: 'flex', justifyContent: 'flex-end', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' },
    panel: { width: '100%', maxWidth: 380, height: '100vh', background: 'rgba(8,6,20,0.99)', borderLeft: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', overflowY: 'auto' },
    header: { padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    avatarWrap: { position: 'relative' as const, cursor: 'pointer' },
    avatar: { width: 70, height: 70, borderRadius: '50%', objectFit: 'cover' as const, border: '2px solid rgba(124,58,237,0.4)', background: '#1a1030', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 },
    input: { width: '100%', padding: '9px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const },
    statBox: { textAlign: 'center' as const, flex: 1 },
    statNum: { fontSize: 18, fontWeight: 800, color: '#a78bfa' },
    statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' as const, letterSpacing: 1 },
    postGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3, padding: '0 16px 16px' },
    postThumb: { aspectRatio: '1', background: 'rgba(124,58,237,0.08)', borderRadius: 8, overflow: 'hidden', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 },
  };

  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.panel}>
        {/* Header */}
        <div style={s.header}>
          <span style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 3, color: '#a78bfa' }}>Profile</span>
          <button onClick={onClose} aria-label="Close profile" style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 22, cursor: 'pointer' }}>×</button>
        </div>

        {/* Profile info */}
        <div style={{ padding: '20px 20px 16px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          {/* Avatar */}
          <div style={s.avatarWrap} onClick={() => !editing && fileRef.current?.click()}>
            {avatarUrl
              ? <img src={avatarUrl} alt="avatar" style={{ ...s.avatar, background: 'none' }} />
              : <div style={s.avatar}>👤</div>
            }
            {editing && <div style={{ position: 'absolute', bottom: 0, right: 0, background: '#7c3aed', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>📷</div>}
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />

          <div style={{ flex: 1 }}>
            {editing
              ? <input style={{ ...s.input, marginBottom: 8 }} value={name} onChange={e => setName(e.target.value)} placeholder="Display name" />
              : <div style={{ fontSize: 17, fontWeight: 800 }}>{user.name}</div>
            }
            <div style={{ fontSize: 12, color: '#a78bfa', marginBottom: 4 }}>@{user.username}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{user.email}</div>
          </div>
        </div>

        {/* Bio */}
        <div style={{ padding: '0 20px 16px' }}>
          {editing
            ? <textarea style={{ ...s.input, resize: 'none', height: 72 }} value={bio} onChange={e => setBio(e.target.value)} placeholder="Write a short bio..." maxLength={500} />
            : <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>{user.bio || <span style={{ opacity: 0.3 }}>No bio yet.</span>}</div>
          }
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: 16 }}>
          <div style={s.statBox}>
            <div style={s.statNum}>{user._count?.posts ?? 0}</div>
            <div style={s.statLabel}>Memories</div>
          </div>
          <div style={s.statBox}>
            <div style={s.statNum}>{user._count?.followers ?? 0}</div>
            <div style={s.statLabel}>Followers</div>
          </div>
          <div style={s.statBox}>
            <div style={s.statNum}>{user._count?.following ?? 0}</div>
            <div style={s.statLabel}>Following</div>
          </div>
        </div>

        {/* Edit / Save controls */}
        <div style={{ padding: '0 16px 16px', display: 'flex', gap: 8 }}>
          {editing ? (
            <>
              {saveErr && <div style={{ fontSize: 11, color: '#fca5a5', marginBottom: 6 }}>{saveErr}</div>}
              <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: '9px', background: '#7c3aed', border: 'none', borderRadius: 9, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button onClick={() => { setEditing(false); setSaveErr(''); }} style={{ flex: 1, padding: '9px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9, color: '#fff', fontSize: 12, cursor: 'pointer' }}>
                Cancel
              </button>
            </>
          ) : (
            <button onClick={() => setEditing(true)} style={{ flex: 1, padding: '9px', background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 9, color: '#a78bfa', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              ✏️ Edit Profile
            </button>
          )}
        </div>

        {/* Posts grid */}
        <div style={{ padding: '0 16px 8px' }}>
          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, color: 'rgba(255,255,255,0.3)', fontWeight: 700, marginBottom: 10 }}>Your Memories</div>
        </div>
        {!postsLoaded
          ? <div style={{ textAlign: 'center', padding: 20, opacity: 0.3, fontSize: 12 }}>Loading...</div>
          : posts.length === 0
            ? <div style={{ textAlign: 'center', padding: 20, opacity: 0.3, fontSize: 12 }}>No memories yet — explore the globe and pin your first memory.</div>
            : (
              <div style={s.postGrid}>
                {posts.map((p: any) => (
                  <div
                    key={p.id}
                    style={s.postThumb}
                    onClick={() => onPinClick(p.latitude, p.longitude)}
                    title={p.title}
                  >
                    {p.media?.[0]?.url
                      ? <img src={p.media[0].url} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : '🌍'
                    }
                  </div>
                ))}
              </div>
            )
        }

        {/* Travel stats */}
        {user.travelStats && (
          <div style={{ margin: '12px 16px', padding: '14px', background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.15)', borderRadius: 12 }}>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, color: '#a78bfa', fontWeight: 700, marginBottom: 10 }}>Travel Stats</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                ['🌍', 'Countries', user.travelStats.countriesVisited?.length ?? 0],
                ['🏙️', 'Cities', user.travelStats.citiesVisited?.length ?? 0],
                ['✈️', 'km Traveled', Math.round(user.travelStats.totalDistanceKm)],
                ['🔥', 'Day Streak', user.travelStats.travelStreak],
              ].map(([icon, label, val]) => (
                <div key={String(label)} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '8px 10px' }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{icon} {label}</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{val}</div>
                </div>
              ))}
            </div>
            {user.travelStats.unlockedBadges?.length > 0 && (
              <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {user.travelStats.unlockedBadges.map((b: string) => (
                  <span key={b} style={{ fontSize: 10, padding: '3px 8px', background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.25)', borderRadius: 99, color: '#a78bfa' }}>🏅 {b}</span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
