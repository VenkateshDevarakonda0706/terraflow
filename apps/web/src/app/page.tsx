'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  Bell,
  Camera,
  Compass,
  LocateFixed,
  MapPin,
  Search,
  Sparkles,
  Upload,
  User,
  X,
} from 'lucide-react';
import type { CesiumGlobeHandle, GlobePin } from '@/components/globe/CesiumGlobe';
import PostModal from '@/components/PostModal';
import MemoryCard from '@/components/MemoryCard';
import ProfilePanel from '@/components/ProfilePanel';

const CesiumGlobe = dynamic(() => import('@/components/globe/CesiumGlobe'), { ssr: false });

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('tf_token') : null);
const authH = (): Record<string, string> => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

type AuthState = 'loading' | 'guest' | 'authenticated';
type NavAction = 'explore' | 'search' | 'upload' | 'notifications' | 'profile';

const FEATURED_MEMORIES = [
  {
    id: 'demo-yosemite',
    title: 'Morning light over the valley',
    location: 'Yosemite, California',
    latitude: 37.8651,
    longitude: -119.5383,
    description: 'A quiet sunrise walk before the trail filled with people.',
    user: { username: 'maya' },
    createdAt: '2026-04-12T08:00:00.000Z',
    visibility: 'PUBLIC',
    media: [{ url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80' }],
    tags: ['nature', 'sunrise'],
  },
  {
    id: 'demo-kyoto',
    title: 'Rain on the old stone path',
    location: 'Kyoto, Japan',
    latitude: 35.0116,
    longitude: 135.7681,
    description: 'Temple bells, wet stone, and a tiny tea shop at the corner.',
    user: { username: 'ren' },
    createdAt: '2026-03-02T10:30:00.000Z',
    visibility: 'PUBLIC',
    media: [{ url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80' }],
    tags: ['city', 'rain'],
  },
  {
    id: 'demo-cappadocia',
    title: 'Balloons before breakfast',
    location: 'Cappadocia, Turkey',
    latitude: 38.6431,
    longitude: 34.8289,
    description: 'The whole horizon lifted slowly while the town was still asleep.',
    user: { username: 'amina' },
    createdAt: '2026-02-18T05:45:00.000Z',
    visibility: 'PUBLIC',
    media: [{ url: 'https://images.unsplash.com/photo-1527838832700-5059252407fa?auto=format&fit=crop&w=1200&q=80' }],
    tags: ['travel', 'dawn'],
  },
];

export default function HomePage() {
  const [authState, setAuthState] = useState<AuthState>('guest');
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showAuth, setShowAuth] = useState(false);

  const globeRef = useRef<CesiumGlobeHandle>(null);
  const autoFocusedMemoryRef = useRef(false);
  const [pins, setPins] = useState<GlobePin[]>([]);
  const [clickCoords, setClickCoords] = useState<{ lat: number; lng: number } | null>(null);

  const [activeAction, setActiveAction] = useState<NavAction>('explore');
  const [searchQuery, setSearchQuery] = useState('');
  const [locationResults, setLocationResults] = useState<any[]>([]);
  const [memoryResults, setMemoryResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [activePost, setActivePost] = useState<any>(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const featuredPins = useMemo<GlobePin[]>(() => (
    FEATURED_MEMORIES.map(memory => ({
      id: memory.id,
      lat: memory.latitude,
      lng: memory.longitude,
      title: memory.title,
      imageUrl: memory.media[0]?.url,
      count: 1,
    }))
  ), []);

  const visiblePins = pins.length > 0 ? pins : featuredPins;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const userId = params.get('userId');
    const errCode = params.get('error');

    if (errCode) {
      window.history.replaceState({}, '', '/');
      setAuthError(`Sign-in failed: ${errCode.replace(/_/g, ' ')}`);
      setAuthState('guest');
      setShowAuth(true);
      return;
    }

    if (token && userId) {
      localStorage.setItem('tf_token', token);
      localStorage.setItem('tf_uid', userId);
      window.history.replaceState({}, '', '/');
      hydrateSession(token);
      return;
    }

    const stored = getToken();
    if (stored) hydrateSession(stored);
    else setAuthState('guest');
  }, []);

  async function hydrateSession(token: string) {
    try {
      const response = await fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error('Session expired');
      const user = await response.json();
      setCurrentUser(user);
      setAuthState('authenticated');
      loadGlobePins();
    } catch {
      localStorage.removeItem('tf_token');
      localStorage.removeItem('tf_uid');
      setAuthState('guest');
    }
  }

  const loadGlobePins = useCallback(async () => {
    try {
      const response = await fetch(
        `${API}/posts/explore?minLat=-85&maxLat=85&minLng=-180&maxLng=180&zoom=2`,
        { headers: authH() },
      );
      if (!response.ok) return;
      const data = await response.json();

      const nextPins: GlobePin[] = [];
      if (data.type === 'CLUSTERS') {
        data.clusters.forEach((cluster: any) => {
          nextPins.push({
            id: cluster.postSample?.id || cluster.h3Index,
            lat: cluster.latitude,
            lng: cluster.longitude,
            title: cluster.postSample?.title || `${cluster.count} memories`,
            imageUrl: cluster.postSample?.media?.[0]?.url,
            count: cluster.count,
          });
        });
      } else if (data.type === 'POSTS') {
        data.posts.forEach((post: any) => {
          nextPins.push({
            id: post.id,
            lat: post.latitude,
            lng: post.longitude,
            title: post.title,
            imageUrl: post.media?.[0]?.url,
            count: 1,
          });
        });
      }
      setPins(nextPins);
      const firstMediaPin = nextPins.find(pin => pin.imageUrl);
      if (!autoFocusedMemoryRef.current && firstMediaPin) {
        autoFocusedMemoryRef.current = true;
        window.setTimeout(() => {
          globeRef.current?.flyTo(firstMediaPin.lat, firstMediaPin.lng, 5200000);
        }, 1600);
      }
    } catch {
      setPins([]);
    }
  }, []);

  useEffect(() => {
    if (authState !== 'loading') loadGlobePins();
  }, [authState, loadGlobePins]);

  useEffect(() => {
    if (activeAction !== 'search' || !searchQuery.trim()) {
      setLocationResults([]);
      setMemoryResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    const timeout = setTimeout(async () => {
      try {
        const [locRes, memRes] = await Promise.all([
          fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=5`,
            { headers: { 'Accept-Language': 'en' } },
          ).then(r => (r.ok ? r.json() : [])).catch(() => []),
          fetch(
            `${API}/posts/search?q=${encodeURIComponent(searchQuery)}`,
            { headers: authH() },
          ).then(r => (r.ok ? r.json() : { posts: [] })).catch(() => ({ posts: [] })),
        ]);
        setLocationResults(locRes);
        setMemoryResults(memRes?.posts || []);
      } catch {
        setLocationResults([]);
        setMemoryResults([]);
      } finally {
        setSearching(false);
      }
    }, 360);

    return () => clearTimeout(timeout);
  }, [activeAction, searchQuery]);

  async function handleAuthSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAuthError('');
    setAuthBusy(true);

    try {
      if (isRegister) {
        const response = await fetch(`${API}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password,
            username: `${email.split('@')[0]}_${Math.floor(Math.random() * 9999)}`,
            name: email.split('@')[0],
          }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(Array.isArray(data.message) ? data.message[0] : data.message);
      }

      const response = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(Array.isArray(data.message) ? data.message[0] : data.message);

      localStorage.setItem('tf_token', data.accessToken);
      localStorage.setItem('tf_uid', data.user.id);
      setCurrentUser(data.user);
      setAuthState('authenticated');
      setShowAuth(false);
      setEmail('');
      setPassword('');
      loadGlobePins();
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed');
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleLogout() {
    await fetch(`${API}/auth/logout`, { method: 'POST' }).catch(() => {});
    localStorage.removeItem('tf_token');
    localStorage.removeItem('tf_uid');
    setCurrentUser(null);
    setPins([]);
    setActivePost(null);
    setAuthState('guest');
    setShowProfile(false);
    setShowAuth(false);
  }

  function navigate(action: NavAction) {
    setActiveAction(action);
    if (action === 'explore') {
      setShowNotifications(false);
      setShowProfile(false);
      globeRef.current?.flyTo(20, 10, 10500000);
    }
    if (action === 'upload') {
      if (authState !== 'authenticated') {
        setShowAuth(true);
        return;
      }
      setShowPostModal(true);
    }
    if (action === 'notifications') {
      if (authState !== 'authenticated') {
        setShowAuth(true);
        return;
      }
      setShowNotifications(true);
    }
    if (action === 'profile') {
      if (authState !== 'authenticated') {
        setShowAuth(true);
        return;
      }
      setShowProfile(true);
    }
  }

  function handlePinClick(id: string) {
    const demo = FEATURED_MEMORIES.find(memory => memory.id === id);
    if (demo && pins.length === 0) {
      setActivePost(demo);
      globeRef.current?.flyTo(demo.latitude, demo.longitude, 140000);
      return;
    }

    fetch(`${API}/posts/${id}`, { headers: authH() })
      .then(response => (response.ok ? response.json() : null))
      .then(post => {
        if (post) {
          setActivePost(post);
          globeRef.current?.flyTo(post.latitude, post.longitude, 140000);
        }
      })
      .catch(() => {});
  }

  function handleGlobeClick(lat: number, lng: number) {
    setClickCoords({ lat, lng });
    if (authState === 'authenticated') setActiveAction('upload');
  }

  function handleLocationSelect(result: any) {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    globeRef.current?.flyTo(lat, lng, 90000);
    setSearchQuery(result.display_name.split(',')[0]);
    setLocationResults([]);
    setMemoryResults([]);
    setActiveAction('explore');
  }

  function handleMemorySelect(post: any) {
    setActivePost(post);
    globeRef.current?.flyTo(post.latitude, post.longitude, 140000);
    setSearchQuery('');
    setLocationResults([]);
    setMemoryResults([]);
    setActiveAction('explore');
  }

  function handleFeatured(memory: (typeof FEATURED_MEMORIES)[number]) {
    setActivePost(memory);
    globeRef.current?.flyTo(memory.latitude, memory.longitude, 140000);
  }

  function handlePostCreated(post: any) {
    const nextPin: GlobePin = {
      id: post.id,
      lat: post.latitude,
      lng: post.longitude,
      title: post.title,
      imageUrl: post.media?.[0]?.url,
      count: 1,
    };
    setPins(prev => [...prev, nextPin]);
    globeRef.current?.flyTo(post.latitude, post.longitude, 170000);
    setActivePost(post);
    setShowPostModal(false);
  }

  function handleDeletePost(postId: string) {
    setPins(prev => prev.filter(pin => pin.id !== postId));
    setActivePost(null);
  }

  const navItems: Array<{ id: NavAction; label: string; icon: React.ElementType }> = [
    { id: 'explore', label: 'Explore', icon: Compass },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'upload', label: 'Upload', icon: Upload },
    { id: 'notifications', label: 'Alerts', icon: Bell },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <main className="tf-app">
      <div className="tf-globe">
        {authState !== 'loading' && (
          <CesiumGlobe
            ref={globeRef}
            pins={visiblePins}
            isGuest={authState !== 'authenticated'}
            onPinClick={handlePinClick}
            onGlobeClick={handleGlobeClick}
          />
        )}
      </div>
      <div className="tf-space" />

      <div className="tf-brand" aria-label="TerraFlow">
        <span className="tf-brand-mark" />
        TerraFlow
      </div>

      <nav className="tf-nav" aria-label="Primary">
        {navItems.map(item => {
          const Icon = item.icon;
          return (
            <button key={item.id} data-active={activeAction === item.id} onClick={() => navigate(item.id)}>
              <Icon size={15} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="tf-top-actions">
        {authState === 'authenticated' && (
          <button className="tf-pill" onClick={() => setShowProfile(true)}>
            <User size={15} />
            {currentUser?.name || currentUser?.username || 'Profile'}
          </button>
        )}
        <button className="tf-pill" onClick={authState === 'authenticated' ? handleLogout : () => setShowAuth(true)}>
          {authState === 'authenticated' ? 'Sign out' : 'Sign in'}
        </button>
      </div>

      {activeAction === 'search' && (
        <section className="tf-search-panel" aria-label="Search locations">
          <div className="tf-search-box">
            <Search size={18} />
            <input
              autoFocus
              placeholder="Search a city, landmark, or memory..."
              value={searchQuery}
              onChange={event => setSearchQuery(event.target.value)}
            />
            <button className="tf-ghost" onClick={() => setActiveAction('explore')}>Close</button>
          </div>
          {(searching || locationResults.length > 0 || memoryResults.length > 0) && (
            <div className="tf-search-results" style={{ maxHeight: '380px', overflowY: 'auto' }}>
              {searching && [0, 1, 2].map(item => <div key={item} className="tf-skeleton" style={{ height: 44, borderRadius: 16 }} />)}
              {!searching && (
                <>
                  {locationResults.length > 0 && (
                    <div style={{ display: 'grid', gap: 6 }}>
                      <div className="tf-eyebrow" style={{ padding: '6px 14px 2px', fontSize: 10 }}>Locations</div>
                      {locationResults.map((result: any, index) => (
                        <button key={`loc-${result.place_id || result.display_name}-${index}`} onMouseDown={() => handleLocationSelect(result)}>
                          <MapPin size={14} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
                          {result.display_name}
                        </button>
                      ))}
                    </div>
                  )}
                  {memoryResults.length > 0 && (
                    <div style={{ display: 'grid', gap: 6, marginTop: locationResults.length > 0 ? 12 : 0 }}>
                      <div className="tf-eyebrow" style={{ padding: '6px 14px 2px', fontSize: 10 }}>Memories</div>
                      {memoryResults.map((post: any, index) => (
                        <button key={`mem-${post.id}-${index}`} onMouseDown={() => handleMemorySelect(post)}>
                          <Camera size={14} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
                          {post.title} {post.user?.name ? `— by ${post.user.name}` : ''}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          {!searching && searchQuery.trim() && locationResults.length === 0 && memoryResults.length === 0 && (
            <div className="tf-search-results">
              <div className="tf-orbit-card" style={{ width: '100%', padding: '14px 16px', borderRadius: 18 }}>
                <p style={{ margin: 0, color: 'var(--tf-muted)' }}>No locations or memories found.</p>
              </div>
            </div>
          )}
        </section>
      )}

      {authState === 'guest' && !showAuth && (
        <section className="tf-hero">
          <div className="tf-eyebrow">The memory layer of Earth</div>
          <h1>Explore human stories.</h1>
          <p>
            Move across a living globe, discover public memories, and revisit places through moments people left behind.
          </p>
          <div className="tf-hero-actions">
            <button className="tf-primary" onClick={() => navigate('explore')}>
              <Sparkles size={16} />
              Start exploring
            </button>
            <button className="tf-secondary" onClick={() => navigate('search')}>
              <Search size={16} />
              Search Earth
            </button>
          </div>
        </section>
      )}

      <div className="tf-featured" aria-label="Featured memories">
        {FEATURED_MEMORIES.map(memory => (
          <button key={memory.id} onClick={() => handleFeatured(memory)}>
            <span>{memory.location}</span>
            <strong>{memory.title}</strong>
          </button>
        ))}
      </div>

      <aside className="tf-control-stack" aria-label="Globe controls">
        <div className="tf-orbit-card">
          <strong>Explore by orbit</strong>
          <p>Drag the planet, search a place, or select a memory. TerraFlow stays out of the way until a story matters.</p>
        </div>
        <button className="tf-icon-button" title="Return to global view" onClick={() => globeRef.current?.flyTo(20, 10, 10500000)}>
          <LocateFixed size={18} />
        </button>
      </aside>

      {clickCoords && authState === 'authenticated' && (
        <div className="tf-toast">
          Location selected: {clickCoords.lat.toFixed(3)}, {clickCoords.lng.toFixed(3)}
        </div>
      )}

      {activePost && (
        <MemoryCard
          post={activePost}
          currentUserId={currentUser?.id}
          token={getToken() || ''}
          onClose={() => setActivePost(null)}
          onDelete={handleDeletePost}
          onFlyTo={(lat, lng) => globeRef.current?.flyTo(lat, lng, 90000)}
        />
      )}

      {showPostModal && (
        <PostModal
          lat={clickCoords?.lat ?? 37.8651}
          lng={clickCoords?.lng ?? -119.5383}
          token={getToken() || ''}
          onClose={() => setShowPostModal(false)}
          onCreated={handlePostCreated}
        />
      )}

      {showProfile && currentUser && (
        <ProfilePanel
          user={currentUser}
          token={getToken() || ''}
          onClose={() => setShowProfile(false)}
          onPinClick={(lat, lng) => {
            globeRef.current?.flyTo(lat, lng, 90000);
            setShowProfile(false);
          }}
          onProfileUpdated={updated => setCurrentUser((user: any) => ({ ...user, ...updated }))}
        />
      )}

      {showNotifications && (
        <div className="tf-panel-overlay" onClick={event => event.target === event.currentTarget && setShowNotifications(false)}>
          <aside className="tf-panel">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
              <div>
                <div className="tf-eyebrow">Notifications</div>
                <h2 style={{ margin: '8px 0 0', fontSize: 28, letterSpacing: '-0.05em' }}>Activity near your world</h2>
              </div>
              <button className="tf-icon-button" onClick={() => setShowNotifications(false)}><X size={17} /></button>
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              {['No new memory replies yet.', 'Saved places and friend activity will appear here.', 'Upload a memory to start building your map.'].map(text => (
                <div key={text} className="tf-orbit-card" style={{ width: '100%' }}>
                  <p>{text}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      )}

      {showAuth && (
        <div className="tf-auth-overlay">
          <section className="tf-auth-card">
            <button className="tf-close" onClick={() => setShowAuth(false)} aria-label="Close sign in"><X size={17} /></button>
            <div className="tf-eyebrow">Join TerraFlow</div>
            <h2>
              {isRegister ? 'Create your memory map.' : 'Sign in when you are ready to share.'}
            </h2>
            <p>
              Exploration is open. An account is only needed to upload, save, and follow memories.
            </p>

            {authError && (
              <div className="tf-auth-error">
                {authError}
              </div>
            )}

            <button className="tf-primary tf-auth-social" onClick={() => { window.location.href = `${API}/auth/google`; }}>
              Continue with Google
            </button>

            <form onSubmit={handleAuthSubmit} className="tf-auth-form">
              <div className="tf-field">
                <label>Email</label>
                <input type="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" />
              </div>
              <div className="tf-field">
                <label>Password</label>
                <input type="password" required minLength={6} value={password} onChange={event => setPassword(event.target.value)} placeholder="Minimum 6 characters" />
              </div>
              <button className="tf-primary" type="submit" disabled={authBusy} style={{ opacity: authBusy ? 0.62 : 1 }}>
                {authBusy ? 'Working...' : isRegister ? 'Create account' : 'Sign in'}
              </button>
            </form>

            <button className="tf-ghost tf-auth-toggle" onClick={() => { setIsRegister(value => !value); setAuthError(''); }}>
              {isRegister ? 'I already have an account' : 'Create a new account'}
            </button>
          </section>
        </div>
      )}

      <nav className="tf-mobile-nav" aria-label="Mobile primary">
        {navItems.map(item => {
          const Icon = item.icon;
          return (
            <button key={item.id} data-active={activeAction === item.id} onClick={() => navigate(item.id)}>
              <Icon size={17} />
              <div>{item.label}</div>
            </button>
          );
        })}
      </nav>

      {authState === 'loading' && (
        <div className="tf-auth-overlay">
          <div className="tf-auth-card tf-auth-card--loading">
            <Camera size={28} />
            <div className="tf-eyebrow">Loading TerraFlow</div>
          </div>
        </div>
      )}
    </main>
  );
}
