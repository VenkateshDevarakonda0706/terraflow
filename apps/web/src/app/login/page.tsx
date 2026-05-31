'use client';

import React, { useEffect } from 'react';
import { Compass } from 'lucide-react';

export default function LoginPage() {
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      window.location.href = '/';
    }, 450);
    return () => window.clearTimeout(timeout);
  }, []);

  return (
    <main className="tf-app" style={{ display: 'grid', placeItems: 'center' }}>
      <div className="tf-space" />
      <section className="tf-auth-card" style={{ textAlign: 'center', zIndex: 2 }}>
        <Compass size={36} style={{ color: 'var(--tf-accent-2)' }} />
        <div className="tf-eyebrow" style={{ marginTop: 16 }}>Redirecting</div>
        <h1 style={{ margin: '10px 0 8px', fontSize: 38, lineHeight: 1, letterSpacing: '-0.06em' }}>
          TerraFlow starts on Earth.
        </h1>
        <p style={{ margin: 0, color: 'var(--tf-muted)', lineHeight: 1.6 }}>
          Sending you back to the spatial homepage.
        </p>
      </section>
    </main>
  );
}
