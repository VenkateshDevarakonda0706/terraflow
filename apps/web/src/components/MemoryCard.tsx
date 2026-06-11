'use client';

import React, { useState } from 'react';
import { Calendar, Heart, LocateFixed, MapPin, Trash2, X } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

interface Props {
  post: any;
  currentUserId?: string;
  token: string;
  onClose: () => void;
  onDelete: (postId: string) => void;
  onFlyTo: (lat: number, lng: number) => void;
}

export default function MemoryCard({ post, currentUserId, token, onClose, onDelete, onFlyTo }: Props) {
  const [liked, setLiked] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isOwner = Boolean(currentUserId && (post.userId === currentUserId || post.user?.id === currentUserId));
  const image = post.media?.[0]?.url;
  const location = post.location || `${Number(post.latitude).toFixed(3)}, ${Number(post.longitude).toFixed(3)}`;
  const author = post.user?.name || post.user?.username || 'unknown';
  const createdAt = post.createdAt ? new Date(post.createdAt) : new Date();
  const likeCount = post._count?.likes ?? 0;

  async function toggleLike() {
    setLiked(value => !value);
    if (!token || String(post.id).startsWith('demo-')) return;
    await fetch(`${API}/social/like/${post.id}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
  }

  async function handleDelete() {
    if (!confirm('Delete this memory?')) return;
    setDeleting(true);
    try {
      const response = await fetch(`${API}/posts/${post.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (response.ok) onDelete(post.id);
    } catch {
      setDeleting(false);
    }
  }

  return (
    <article className="tf-memory-card" aria-label="Memory detail">
      <button className="tf-close" onClick={onClose} aria-label="Close memory"><X size={17} /></button>

      <div className="tf-memory-media">
        {image ? (
          <img src={image} alt={`${post.title || 'Memory'} at ${location}`} />
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: 'var(--tf-muted)' }}>
            No photo attached
          </div>
        )}
      </div>

      <div className="tf-memory-body">
        <div className="tf-meta-row">
          <span className="tf-chip"><MapPin size={13} />{location}</span>
          <span className="tf-chip"><Calendar size={13} />{createdAt.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>

        <h2 className="tf-memory-title">{post.title}</h2>

        <div className="tf-meta-row" style={{ marginBottom: 12 }}>
          <span>By @{author}</span>
          <span>{post.visibility || 'PUBLIC'}</span>
        </div>

        {post.description && <p className="tf-memory-desc">{post.description}</p>}

        {post.tags?.length > 0 && (
          <div className="tf-meta-row" style={{ marginTop: 14 }}>
            {post.tags.slice(0, 4).map((tag: string) => <span className="tf-chip" key={tag}>#{tag}</span>)}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: isOwner ? '1fr 1fr 44px' : '1fr 1fr', gap: 10, marginTop: 18 }}>
          <button className="tf-secondary" onClick={toggleLike}>
            <Heart size={15} fill={liked ? 'currentColor' : 'none'} />
            {likeCount + (liked ? 1 : 0)}
          </button>
          <button className="tf-primary" onClick={() => onFlyTo(post.latitude, post.longitude)}>
            <LocateFixed size={15} />
            Fly closer
          </button>
          {isOwner && (
            <button className="tf-icon-button" onClick={handleDelete} disabled={deleting} aria-label={`Delete memory${post.title ? ` "${post.title}"` : ''}`}>
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
