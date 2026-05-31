'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, MapPin, Tag, Compass } from 'lucide-react';

interface MemoryPreviewCardProps {
  activePin: any;
  onClose: () => void;
  onFlyTo: () => void;
}

export default function MemoryPreviewCard({ activePin, onClose, onFlyTo }: MemoryPreviewCardProps) {
  if (!activePin) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.4, cubicBezier: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm glass-panel border border-white/10 p-5 text-white flex flex-col gap-4.5 shadow-2xl relative overflow-hidden group"
      >
        {/* Soft background glow */}
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-purple-500/5 blur-2xl pointer-events-none" />

        {/* Card Header */}
        <div className="flex justify-between items-center border-b border-white/5 pb-3">
          <div className="flex flex-col gap-0.5 max-w-[70%]">
            <span className="text-[9px] text-white/30 uppercase font-bold tracking-widest flex items-center gap-1">
              <Calendar className="w-3 h-3 text-purple-400" />
              Memory Capture
            </span>
            <h3 className="font-extrabold text-sm truncate uppercase font-heading bg-gradient-to-r from-white via-white to-purple-200 bg-clip-text text-transparent">
              {activePin.title}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-white/3 hover:bg-white/10 border border-white/5 hover:border-white/10 text-white/40 hover:text-white rounded-xl transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Media Preview Aspect Frame */}
        <div className="aspect-video w-full rounded-2xl overflow-hidden border border-white/5 bg-black/40 relative">
          <img 
            src={activePin.mediaSample} 
            alt={activePin.title}
            className="w-full h-full object-cover transition-all duration-700 group-hover:scale-103"
          />
        </div>

        {/* Details Narrative */}
        <div className="flex flex-col gap-2">
          <p className="text-[11px] text-white/70 leading-relaxed font-light">
            {activePin.description || 'A timeless moment captured and pinned permanently to the global canvas.'}
          </p>

          {/* Coordinate specs */}
          <div className="flex items-center justify-between text-[8px] text-white/30 uppercase tracking-widest border-t border-white/5 pt-3">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-purple-400" />
              Lat: {activePin.latitude.toFixed(4)}
            </span>
            <span>Lng: {activePin.longitude.toFixed(4)}</span>
          </div>
        </div>

        {/* Actions */}
        <button 
          onClick={onFlyTo}
          className="w-full py-3 bg-white text-black hover:bg-white/90 rounded-2xl text-[10px] font-bold text-center uppercase tracking-widest transition-all shadow-xl active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
        >
          <Compass className="w-4 h-4 animate-spin-slow" />
          Fly Camera Close
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
