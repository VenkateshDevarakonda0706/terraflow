'use client';

import React from 'react';
import { Sparkles, Trees, Utensils, Plane, Hourglass, Building, Bird, Moon, Compass } from 'lucide-react';

interface ExploreOverlayProps {
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

const CATEGORIES = [
  { id: 'nature', label: 'Nature', icon: Trees },
  { id: 'food', label: 'Food', icon: Utensils },
  { id: 'travel', label: 'Travel', icon: Plane },
  { id: 'history', label: 'History', icon: Hourglass },
  { id: 'architecture', label: 'Architecture', icon: Building },
  { id: 'festivals', label: 'Festivals', icon: Sparkles },
  { id: 'wildlife', label: 'Wildlife', icon: Bird },
  { id: 'nightlife', label: 'Nightlife', icon: Moon }
];

export default function ExploreOverlay({ selectedCategory, onSelectCategory }: ExploreOverlayProps) {
  return (
    <div className="flex gap-2.5 px-6 py-4 overflow-x-auto w-full scrollbar-none items-center justify-start md:justify-center">
      {/* Universal Discover All Toggle */}
      <button
        onClick={() => onSelectCategory(null)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[10px] font-bold tracking-widest border uppercase whitespace-nowrap transition-all duration-300 active:scale-95 ${
          selectedCategory === null
            ? 'bg-white text-black border-white shadow-xl shadow-white/5'
            : 'glass-panel text-white/70 border-white/5 hover:text-white hover:border-white/15'
        }`}
      >
        <Compass className="w-3.5 h-3.5" />
        All Memories
      </button>

      <div className="h-4 w-px bg-white/10 shrink-0" />

      {/* Category List */}
      {CATEGORIES.map((cat) => {
        const IconComponent = cat.icon;
        const isSelected = selectedCategory === cat.id;

        return (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[10px] font-bold tracking-widest border uppercase whitespace-nowrap transition-all duration-300 active:scale-95 ${
              isSelected
                ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/20'
                : 'glass-panel text-white/70 border-white/5 hover:text-white hover:border-white/15'
            }`}
          >
            <IconComponent className="w-3.5 h-3.5 shrink-0" />
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}
