'use client';

import React from 'react';

interface PublicProfileProps {
  user: {
    id: string;
    username: string;
    name?: string;
    bio?: string;
    profilePic?: string;
    createdAt?: string;
    _count?: { posts?: number; followers?: number; following?: number };
    posts?: Array<{
      id: string;
      title?: string;
      latitude: number;
      longitude: number;
      media?: Array<{ url: string }>;
    }>;
    travelStats?: {
      countriesVisited?: string[];
      citiesVisited?: string[];
      totalDistanceKm?: number;
      travelStreak?: number;
      unlockedBadges?: string[];
    };
  };
  onFlyTo: (lat: number, lng: number) => void;
  onClose?: () => void;
}

export default function PublicProfile({ user, onFlyTo, onClose }: PublicProfileProps) {
  const posts = user.posts || [];
  const joinDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="tf-panel-overlay" onClick={e => e.target === e.currentTarget && onClose?.()}>
      <aside className="tf-panel" style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 20, paddingBottom: 16,
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}>
          <span style={{
            fontSize: 11, fontWeight: 900, textTransform: 'uppercase',
            letterSpacing: '0.28em', color: '#c8b7ff',
          }}>
            Public Profile
          </span>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                width: 34, height: 34, border: '1px solid rgba(255,255,255,0.14)',
                borderRadius: 999, background: 'rgba(0,0,0,0.46)',
                color: '#fff', cursor: 'pointer', fontSize: 18,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              ×
            </button>
          )}
        </div>

        {/* Avatar + identity */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 16 }}>
          <div style={{
            width: 70, height: 70, borderRadius: '50%',
            border: '2px solid rgba(139,92,246,0.4)',
            background: '#1a1030', overflow: 'hidden', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28,
          }}>
            {user.profilePic
              ? <img src={user.profilePic} alt={user.name || user.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : '👤'
            }
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', marginBottom: 2 }}>
              {user.name || user.username}
            </div>
            <div style={{ fontSize: 12, color: '#a78bfa', marginBottom: 4 }}>
              @{user.username}
            </div>
            {joinDate && (
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                Joined {joinDate}
              </div>
            )}
          </div>
        </div>

        {/* Bio */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
            {user.bio || <span style={{ opacity: 0.3 }}>No bio yet.</span>}
          </div>
        </div>

        {/* Stats */}
        <div style={{
          display: 'flex', padding: '12px 0',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          marginBottom: 16,
        }}>
          {[
            { label: 'Memories', value: user._count?.posts ?? 0 },
            { label: 'Followers', value: user._count?.followers ?? 0 },
            { label: 'Following', value: user._count?.following ?? 0 },
          ].map(stat => (
            <div key={stat.label} style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#a78bfa' }}>
                {stat.value}
              </div>
              <div style={{
                fontSize: 10, color: 'rgba(255,255,255,0.35)',
                textTransform: 'uppercase', letterSpacing: 1,
              }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Memories grid */}
        <div style={{ marginBottom: 10 }}>
          <div style={{
            fontSize: 10, textTransform: 'uppercase', letterSpacing: 2,
            color: 'rgba(255,255,255,0.3)', fontWeight: 700, marginBottom: 10,
          }}>
            Public Memories
          </div>
        </div>

        {posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20, opacity: 0.3, fontSize: 12 }}>
            No public memories yet.
          </div>
        ) : (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 3, marginBottom: 16,
          }}>
            {posts.map(p => (
              <div
                key={p.id}
                onClick={() => onFlyTo(p.latitude, p.longitude)}
                title={p.title || 'Memory'}
                style={{
                  aspectRatio: '1', background: 'rgba(124,58,237,0.08)',
                  borderRadius: 8, overflow: 'hidden', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, transition: 'transform 160ms cubic-bezier(0.16,1,0.3,1)',
                }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
              >
                {p.media?.[0]?.url
                  ? <img src={p.media[0].url} alt={p.title || 'Memory'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : '🌍'
                }
              </div>
            ))}
          </div>
        )}

        {/* Travel stats */}
        {user.travelStats && (
          <div style={{
            padding: 14, background: 'rgba(124,58,237,0.07)',
            border: '1px solid rgba(124,58,237,0.15)', borderRadius: 12,
            marginTop: 4,
          }}>
            <div style={{
              fontSize: 10, textTransform: 'uppercase', letterSpacing: 2,
              color: '#a78bfa', fontWeight: 700, marginBottom: 10,
            }}>
              Travel Stats
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                ['🌍', 'Countries', user.travelStats.countriesVisited?.length ?? 0],
                ['🏙️', 'Cities', user.travelStats.citiesVisited?.length ?? 0],
                ['✈️', 'km Traveled', Math.round(user.travelStats.totalDistanceKm || 0)],
                ['🔥', 'Day Streak', user.travelStats.travelStreak ?? 0],
              ].map(([icon, label, val]) => (
                <div key={String(label)} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '8px 10px' }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{icon} {label}</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{val}</div>
                </div>
              ))}
            </div>
            {user.travelStats.unlockedBadges && user.travelStats.unlockedBadges.length > 0 && (
              <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {user.travelStats.unlockedBadges.map((b: string) => (
                  <span key={b} style={{
                    fontSize: 10, padding: '3px 8px',
                    background: 'rgba(167,139,250,0.15)',
                    border: '1px solid rgba(167,139,250,0.25)',
                    borderRadius: 99, color: '#a78bfa',
                  }}>
                    🏅 {b}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}
