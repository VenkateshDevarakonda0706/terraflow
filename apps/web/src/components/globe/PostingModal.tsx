'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, MapPin, Tag, Sparkles, Navigation, Loader2, CheckCircle2, RotateCcw, AlertCircle } from 'lucide-react';

type UploadStatus = 'idle' | 'uploading' | 'uploaded' | 'failed' | 'retrying';

const API = 'http://localhost:4000/api/v1';

interface PostingModalProps {
  latitude: number;
  longitude: number;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description: string;
    latitude: number;
    longitude: number;
    tags: string[];
    visibility: 'PUBLIC' | 'FRIENDS' | 'PRIVATE';
    mediaUrls: string[];
  }) => void;
}

export default function PostingModal({ latitude, longitude, onClose, onSubmit }: PostingModalProps) {
  const [title, setTitle]             = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput]     = useState('');
  const [visibility, setVisibility]   = useState<'PUBLIC' | 'FRIENDS' | 'PRIVATE'>('PUBLIC');
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  // Abort in-flight upload on unmount
  useEffect(() => {
    return () => {
      xhrRef.current?.abort();
    };
  }, []);

  // Reset form state after successful post
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setTagsInput('');
    setVisibility('PUBLIC');
    setError(null);
    setUploadedUrl(null);
    setUploadStatus('idle');
    setUploadProgress(0);
    setSelectedFile(null);
    xhrRef.current?.abort();
    if (fileRef.current) {
      fileRef.current.value = '';
    }
  };

  // ── Upload file to API via XHR (supports progress) ─────────────────────────
  const uploadFile = useCallback((file: File, isRetry = false) => {
    xhrRef.current?.abort();
    setUploadStatus(isRetry ? 'retrying' : 'uploading');
    setUploadProgress(0);
    setError(null);
    setUploadedUrl(null);

    const token = localStorage.getItem('accessToken');
    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        setUploadProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          setUploadedUrl(data.url);
          setUploadStatus('uploaded');
          setUploadProgress(100);
        } catch {
          setError('Invalid server response.');
          setUploadStatus('failed');
        }
      } else {
        let message = 'Upload failed.';
        try { message = JSON.parse(xhr.responseText).message || message; } catch {}
        setError(message);
        setUploadStatus('failed');
      }
    });

    xhr.addEventListener('error', () => {
      setError('Network error — check your connection.');
      setUploadStatus('failed');
    });

    xhr.addEventListener('abort', () => {
      // intentional abort (cleanup / retry) — no error
    });

    xhr.open('POST', `${API}/posts/upload`);
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.withCredentials = true;
    xhr.send(formData);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    uploadFile(file);
  };

  const handleRetry = () => {
    if (selectedFile) uploadFile(selectedFile, true);
  };

  // ── AI Auto-tag (simulated) ────────────────────────────────────────────────
  const handleAiAutoTag = () => {
    setIsAiLoading(true);
    setTimeout(() => {
      const suggestions = latitude > 20 ? 'asia, travel, landmark' : 'europe, travel, scenic';
      setTagsInput(prev => {
        const clean = prev.trim();
        return clean ? `${clean}, ${suggestions}` : suggestions;
      });
      setIsAiLoading(false);
    }, 900);
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setError(null);
    setIsSubmitting(true);

    const tags = tagsInput
      .split(',')
      .map(t => t.trim().toLowerCase())
      .filter(t => t.length > 0);

    const mediaUrls = uploadedUrl
      ? [uploadedUrl]
      : ['https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80'];

    try {
      await onSubmit({ title: title.trim(), description: description.trim(), latitude, longitude, tags, visibility, mediaUrls });
      resetForm();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to pin memory.');
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 28 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 28 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-lg glass-panel-heavy p-7 text-white flex flex-col gap-5 border border-white/10 relative shadow-2xl overflow-hidden"
        >
          {/* Ambient glow */}
          <div className="absolute -top-16 -right-16 w-36 h-36 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 bg-white/3 hover:bg-white/10 border border-white/5 text-white/40 hover:text-white rounded-xl transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-purple-400 uppercase font-bold tracking-widest flex items-center gap-1">
              <Navigation className="w-3.5 h-3.5" />
              New Memory
            </span>
            <h2 className="text-xl font-extrabold tracking-tight uppercase font-heading">Pin a Memory</h2>
            <p className="text-xs text-white/40">Log your real-world experience onto the 3D globe.</p>
          </div>

          {/* Error + Retry */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-300 flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5 shrink-0" />{error}</span>
              {uploadStatus === 'failed' && selectedFile && (
                <button
                  type="button"
                  onClick={handleRetry}
                  aria-label="Retry upload"
                  className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 bg-red-500/15 hover:bg-red-500/25 border border-red-500/25 rounded-lg text-[9px] font-bold uppercase tracking-wider text-red-200 hover:text-white transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />Retry
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Media upload */}
            <div
              onClick={() => uploadStatus !== 'uploading' && uploadStatus !== 'retrying' && fileRef.current?.click()}
              className="h-32 rounded-2xl border border-dashed border-white/10 bg-white/2 flex flex-col items-center justify-center cursor-pointer hover:border-purple-500/50 hover:bg-white/4 transition-all group overflow-hidden relative"
            >
              {uploadStatus === 'uploaded' && uploadedUrl ? (
                <>
                  <img src={uploadedUrl} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Change Photo</span>
                  </div>
                  <div className="absolute top-2 right-2 p-1.5 bg-green-500/20 border border-green-500/30 rounded-lg">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 text-white/40 group-hover:text-white/70 transition-all">
                  {(uploadStatus === 'uploading' || uploadStatus === 'retrying')
                    ? <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                    : uploadStatus === 'failed'
                      ? <AlertCircle className="w-6 h-6 text-red-400" />
                      : <Upload className="w-6 h-6 text-purple-400" />
                  }
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {(uploadStatus === 'uploading' || uploadStatus === 'retrying')
                      ? `Uploading ${uploadProgress}%`
                      : uploadStatus === 'failed'
                        ? 'Upload failed'
                        : 'Click to Upload Photo'
                    }
                  </span>
                  {(uploadStatus === 'uploading' || uploadStatus === 'retrying') && (
                    <div className="w-3/4 h-1 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-purple-400 transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  )}
                  {uploadStatus === 'idle' && (
                    <span className="text-[9px] text-white/20 uppercase tracking-widest">JPG, PNG, WEBP</span>
                  )}
                </div>
              )}
            </div>
            {/* Accessible upload status */}
            <div role="status" aria-live="polite" className="sr-only">
              {uploadStatus === 'uploading' && `Uploading ${uploadProgress} percent`}
              {uploadStatus === 'retrying' && `Retrying upload ${uploadProgress} percent`}
              {uploadStatus === 'uploaded' && 'Upload complete'}
              {uploadStatus === 'failed' && 'Upload failed'}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Coordinates */}
            <div className="flex items-center gap-2 px-3 py-2 bg-white/3 border border-white/5 rounded-xl text-[9px] text-purple-300 font-extrabold uppercase tracking-widest w-fit">
              <MapPin className="w-3.5 h-3.5 text-purple-400" />
              {latitude.toFixed(4)}°, {longitude.toFixed(4)}°
            </div>

            {/* Title */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] text-white/40 uppercase font-bold tracking-widest">Memory Title *</label>
              <input
                type="text"
                required
                placeholder="Golden Hour over Eiffel Tower..."
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="px-4 py-3 glass-input text-xs"
              />
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] text-white/40 uppercase font-bold tracking-widest">Description</label>
              <textarea
                rows={2}
                placeholder="Share the sights, sounds, and flavors of this memory..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="px-4 py-3 glass-input text-xs resize-none"
              />
            </div>

            {/* Tags */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[9px] text-white/40 uppercase font-bold tracking-widest">Tags</label>
                <button
                  type="button"
                  onClick={handleAiAutoTag}
                  className="text-[9px] text-purple-400 hover:text-purple-300 font-bold uppercase flex items-center gap-1 transition-all cursor-pointer"
                >
                  {isAiLoading
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : <Sparkles className="w-3 h-3" />
                  }
                  {isAiLoading ? 'Tagging...' : 'AI Auto-Tag'}
                </button>
              </div>
              <div className="relative flex items-center">
                <Tag className="w-4 h-4 absolute left-3.5 text-white/30" />
                <input
                  type="text"
                  placeholder="landmark, travel, sunset..."
                  value={tagsInput}
                  onChange={e => setTagsInput(e.target.value)}
                  className="pl-10 pr-4 py-3 w-full glass-input text-xs"
                />
              </div>
            </div>

            {/* Visibility */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] text-white/40 uppercase font-bold tracking-widest">Visibility</label>
              <div className="grid grid-cols-3 gap-2">
                {(['PUBLIC', 'FRIENDS', 'PRIVATE'] as const).map(opt => (
                  <button
                    type="button"
                    key={opt}
                    onClick={() => setVisibility(opt)}
                    className={`py-2.5 rounded-xl text-[9px] font-bold uppercase border transition-all cursor-pointer ${
                      visibility === opt
                        ? 'bg-purple-600 border-purple-500 text-white shadow-lg'
                        : 'bg-white/3 border-white/5 text-white/50 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || uploadStatus === 'uploading' || uploadStatus === 'retrying' || uploadStatus === 'failed'}
              className="w-full mt-1 py-3.5 bg-white text-black hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-xl active:scale-[0.98] cursor-pointer"
            >
              {isSubmitting
                ? <><Loader2 className="w-4 h-4 animate-spin text-black" /> Pinning to Globe...</>
                : 'Pin Memory onto Globe'
              }
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
