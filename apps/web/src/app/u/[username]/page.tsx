'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { CesiumGlobeHandle, GlobePin } from '@/components/globe/CesiumGlobe';
import PublicProfile from '@/components/PublicProfile';

const CesiumGlobe = dynamic(() => import('@/components/globe/CesiumGlobe'), { ssr: false });

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

type LoadState = 'loading' | 'loaded' | 'not-found' | 'error';

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const username = typeof params.username === 'string' ? params.username : '';

  const globeRef = useRef<CesiumGlobeHandle>(null);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [user, setUser] = useState<any>(null);
  const [pins, setPins] = useState<GlobePin[]>([]);

  useEffect(() => {
    if (!username) {
      setLoadState('not-found');
      return;
    }

    let cancelled = false;

    async function fetchProfile() {
      try {
        const response = await fetch(`${API}/auth/users/${encodeURIComponent(username)}`);
        if (!response.ok) {
          if (!cancelled) setLoadState('not-found');
          return;
        }
        const data = await response.json();
        if (cancelled) return;

        setUser(data);
        setLoadState('loaded');

        // Build globe pins from public posts
        const memoryPins: GlobePin[] = (data.posts || []).map((post: any) => ({
          id: post.id,
          lat: post.latitude,
          lng: post.longitude,
          title: post.title || 'Memory',
          imageUrl: post.media?.[0]?.url,
          count: 1,
        }));
        setPins(memoryPins);

        // Fly to first memory after globe loads
        if (memoryPins.length > 0) {
          setTimeout(() => {
            globeRef.current?.flyTo(memoryPins[0].lat, memoryPins[0].lng, 5200000);
          }, 1800);
        }
      } catch {
        if (!cancelled) setLoadState('error');
      }
    }

    fetchProfile();
    return () => { cancelled = true; };
  }, [username]);

  function handleFlyTo(lat: number, lng: number) {
    globeRef.current?.flyTo(lat, lng, 90000);
  }

  function handlePinClick(id: string) {
    const post = user?.posts?.find((p: any) => p.id === id);
    if (post) {
      globeRef.current?.flyTo(post.latitude, post.longitude, 90000);
    }
  }

  return (
    <main className="tf-app">
      {/* Globe background */}
      <div className="tf-globe">
        <CesiumGlobe
          ref={globeRef}
          pins={pins}
          isGuest={true}
          onPinClick={handlePinClick}
        />
      </div>
      <div className="tf-space" />

      {/* Brand */}
      <div className="tf-brand" aria-label="TerraFlow">
        <span className="tf-brand-mark" />
        <a href="/" style={{ color: 'inherit', textDecoration: 'none' }}>TerraFlow</a>
      </div>

      {/* Top action — back to home */}
      <div className="tf-top-actions">
        <button className="tf-pill" onClick={() => router.push('/')}>
          ← Explore
        </button>
      </div>

      {/* Loading state */}
      {loadState === 'loading' && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 40,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            padding: '28px 36px', borderRadius: 32,
            background: 'rgba(6,9,18,0.92)',
            border: '1px solid rgba(255,255,255,0.075)',
            backdropFilter: 'blur(28px) saturate(170%)',
            boxShadow: '0 28px 90px rgba(0,0,0,0.48)',
            textAlign: 'center',
            animation: 'tf-rise 480ms cubic-bezier(0.16,1,0.3,1) both',
          }}>
            <div style={{
              fontSize: 11, fontWeight: 900, textTransform: 'uppercase',
              letterSpacing: '0.28em', color: '#c8b7ff', marginBottom: 8,
            }}>
              Loading profile
            </div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
              @{username}
            </div>
          </div>
        </div>
      )}

      {/* Not found / error state */}
      {(loadState === 'not-found' || loadState === 'error') && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 40,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            padding: '36px 42px', borderRadius: 32,
            background: 'rgba(6,9,18,0.92)',
            border: '1px solid rgba(255,255,255,0.075)',
            backdropFilter: 'blur(28px) saturate(170%)',
            boxShadow: '0 28px 90px rgba(0,0,0,0.48)',
            textAlign: 'center', maxWidth: 420,
            animation: 'tf-rise 480ms cubic-bezier(0.16,1,0.3,1) both',
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🌍</div>
            <div style={{
              fontSize: 11, fontWeight: 900, textTransform: 'uppercase',
              letterSpacing: '0.28em', color: '#c8b7ff', marginBottom: 12,
            }}>
              {loadState === 'not-found' ? 'Explorer not found' : 'Something went wrong'}
            </div>
            <h2 style={{
              margin: '0 0 12px', fontSize: 28, fontWeight: 900,
              letterSpacing: '-0.04em', color: '#fff',
            }}>
              {loadState === 'not-found'
                ? `No traveler named @${username}`
                : 'Unable to load profile'
              }
            </h2>
            <p style={{
              margin: '0 0 22px', color: 'rgba(255,255,255,0.55)',
              fontSize: 14, lineHeight: 1.6,
            }}>
              {loadState === 'not-found'
                ? 'This explorer hasn\'t arrived yet. The globe keeps spinning — why not explore on your own?'
                : 'We couldn\'t reach the server. Please try again in a moment.'
              }
            </p>
            <button
              className="tf-primary"
              onClick={() => router.push('/')}
              style={{ width: '100%' }}
            >
              ← Back to the globe
            </button>
          </div>
        </div>
      )}

      {/* Profile panel overlay */}
      {loadState === 'loaded' && user && (
        <PublicProfile
          user={user}
          onFlyTo={handleFlyTo}
        />
      )}
    </main>
  );
}
