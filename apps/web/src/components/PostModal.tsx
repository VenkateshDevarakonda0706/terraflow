'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ImagePlus, MapPin, Send, X } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

interface Props {
  lat: number;
  lng: number;
  token: string;
  onClose: () => void;
  onCreated: (post: any) => void;
}

type Visibility = 'PUBLIC' | 'FRIENDS' | 'PRIVATE';

export default function PostModal({ lat, lng, token, onClose, onCreated }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('PUBLIC');
  const [placeName, setPlaceName] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!lat && !lng) return;
    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, {
      headers: { 'Accept-Language': 'en' },
    })
      .then(response => response.json())
      .then(data => setPlaceName(data.display_name?.split(',').slice(0, 2).join(', ') || 'Selected location'))
      .catch(() => setPlaceName('Selected location'));
  }, [lat, lng]);

  const completion = useMemo(() => [
    Boolean(previewUrl),
    Boolean(placeName || (lat && lng)),
    Boolean(title.trim()),
    Boolean(visibility),
    Boolean(title.trim() && !uploading),
  ], [previewUrl, placeName, lat, lng, title, visibility, uploading]);

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Allowed MIME types
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4'];
    if (!allowedMimeTypes.includes(file.type)) {
      setError('Unsupported file format. Please upload JPEG, PNG, WEBP images, or MP4 videos only.');
      setPreviewUrl(null);
      setUploadedUrl(null);
      if (fileRef.current) fileRef.current.value = '';
      return;
    }

    // Size limits: Images 10MB, Videos 50MB
    const isVideo = file.type.startsWith('video');
    const limit = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > limit) {
      if (isVideo) {
        setError('Video size exceeds the limit of 50MB.');
      } else {
        setError('Image size exceeds the limit of 10MB.');
      }
      setPreviewUrl(null);
      setUploadedUrl(null);
      if (fileRef.current) fileRef.current.value = '';
      return;
    }

    setPreviewUrl(URL.createObjectURL(file));
    setUploading(true);
    setError('');

    const form = new FormData();
    form.append('file', file);

    try {
      const response = await fetch(`${API}/posts/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await response.json();
      if (!response.ok || !data.url) throw new Error(data.message || 'Upload failed');
      setUploadedUrl(data.url);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
      setPreviewUrl(null);
      setUploadedUrl(null);
      if (fileRef.current) fileRef.current.value = '';
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch(`${API}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          latitude: lat,
          longitude: lng,
          tags: [],
          visibility,
          mediaUrls: uploadedUrl ? [uploadedUrl] : [],
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(Array.isArray(data.message) ? data.message[0] : data.message || 'Failed to publish');
      onCreated(data);
    } catch (err: any) {
      setError(err.message || 'Failed to publish memory');
      setSubmitting(false);
    }
  }

  return (
    <div className="tf-publish-overlay">
      <section className="tf-publish-card" aria-label="Publish memory">
        <button className="tf-close" onClick={onClose} aria-label="Close upload"><X size={17} /></button>

        <div className="tf-publish-grid">
          <div className="tf-publish-media" onClick={() => fileRef.current?.click()}>
            {previewUrl ? (
              <img src={previewUrl} alt="Memory preview" />
            ) : (
              <div className="tf-upload-target">
                <ImagePlus size={34} />
                <strong>Drop in the moment</strong>
                <span>Upload an image first. Everything else stays lightweight.</span>
              </div>
            )}
            {uploading && <div className="tf-toast">Uploading image...</div>}
            {uploadedUrl && !uploading && <div className="tf-toast"><Check size={14} /> Image ready</div>}
            <input ref={fileRef} type="file" accept="image/*,video/mp4" style={{ display: 'none' }} onChange={handleFile} />
          </div>

          <form className="tf-publish-form" onSubmit={handleSubmit}>
            <div>
              <div className="tf-eyebrow">Publish in under 30 seconds</div>
              <h2 style={{ margin: '8px 0 12px', fontSize: 34, lineHeight: 1, letterSpacing: '-0.06em' }}>Pin a memory to Earth.</h2>
              <div className="tf-step-row" aria-label="Upload completion">
                {completion.map((done, index) => <span key={index} data-active={done} />)}
              </div>
            </div>

            {error && (
              <div style={{ padding: 12, borderRadius: 16, color: '#fecdd3', background: 'rgba(251, 113, 133, 0.12)', border: '1px solid rgba(251, 113, 133, 0.22)' }}>
                {error}
              </div>
            )}

            <div className="tf-chip" style={{ width: 'fit-content' }}>
              <MapPin size={13} />
              {placeName || `${lat.toFixed(4)}, ${lng.toFixed(4)}`}
            </div>

            <div className="tf-field">
              <label>Title</label>
              <input required maxLength={100} value={title} onChange={event => setTitle(event.target.value)} placeholder="What happened here?" />
            </div>

            <div className="tf-field">
              <label>Description</label>
              <textarea maxLength={1000} value={description} onChange={event => setDescription(event.target.value)} placeholder="Add the human detail people should feel when they arrive." />
            </div>

            <div className="tf-field">
              <label>Visibility</label>
              <div className="tf-segmented">
                {(['PUBLIC', 'FRIENDS', 'PRIVATE'] as Visibility[]).map(option => (
                  <button type="button" key={option} data-active={visibility === option} onClick={() => setVisibility(option)}>
                    {option.toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            <button className="tf-primary" type="submit" disabled={submitting || uploading || !title.trim()} style={{ opacity: submitting || uploading || !title.trim() ? 0.58 : 1 }}>
              <Send size={15} />
              {submitting ? 'Publishing...' : 'Publish memory'}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
