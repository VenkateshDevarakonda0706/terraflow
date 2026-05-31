'use client';

import React from 'react';
import { Compass, Globe2, MapPin, Award, Zap, Navigation } from 'lucide-react';

interface StatsDashboardProps {
  stats: {
    countriesCount: number;
    citiesCount: number;
    distanceKm: number;
    streakDays: number;
    badges: string[];
  };
}

export default function StatsDashboard({ stats }: StatsDashboardProps) {
  return (
    <div className="w-80 p-6 glass-panel flex flex-col gap-6 text-white border border-white/10 shadow-2xl relative overflow-hidden group">
      {/* Background soft ambient blur spots */}
      <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-purple-500/10 blur-xl pointer-events-none group-hover:bg-purple-500/20 transition-all duration-700" />
      <div className="absolute -bottom-10 -left-10 w-24 h-24 rounded-full bg-indigo-500/10 blur-xl pointer-events-none group-hover:bg-indigo-500/20 transition-all duration-700" />

      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <div className="flex flex-col">
          <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Traveler Identity</span>
          <h2 className="text-sm font-extrabold tracking-tight uppercase font-heading bg-gradient-to-r from-white via-white to-purple-300 bg-clip-text text-transparent">Travel Stats</h2>
        </div>
        <div className="p-2 bg-white/5 border border-white/5 rounded-xl text-purple-400">
          <Navigation className="w-4 h-4 animate-pulse" />
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3.5 bg-white/3 border border-white/5 rounded-2xl flex flex-col gap-1 transition-all duration-300 hover:bg-white/5">
          <span className="text-[8px] text-white/40 uppercase font-bold tracking-wider">Countries</span>
          <div className="flex items-center gap-2">
            <div className="p-1 bg-emerald-500/10 rounded-lg text-emerald-400">
              <Globe2 className="w-3.5 h-3.5" />
            </div>
            <span className="text-base font-extrabold leading-none">{stats.countriesCount}</span>
          </div>
        </div>

        <div className="p-3.5 bg-white/3 border border-white/5 rounded-2xl flex flex-col gap-1 transition-all duration-300 hover:bg-white/5">
          <span className="text-[8px] text-white/40 uppercase font-bold tracking-wider">Cities</span>
          <div className="flex items-center gap-2">
            <div className="p-1 bg-sky-500/10 rounded-lg text-sky-400">
              <MapPin className="w-3.5 h-3.5" />
            </div>
            <span className="text-base font-extrabold leading-none">{stats.citiesCount}</span>
          </div>
        </div>
      </div>

      {/* Distance & Streak */}
      <div className="flex flex-col gap-2.5">
        <div className="flex justify-between items-center bg-white/3 border border-white/5 p-3 rounded-2xl transition-all duration-300 hover:bg-white/5">
          <div className="flex items-center gap-2">
            <Compass className="w-3.5 h-3.5 text-purple-400 animate-spin-slow" />
            <span className="text-[10px] font-bold text-white/60 uppercase tracking-wide">Distance Covered</span>
          </div>
          <span className="text-xs font-extrabold text-purple-300">{stats.distanceKm.toLocaleString()} km</span>
        </div>

        <div className="flex justify-between items-center bg-white/3 border border-white/5 p-3 rounded-2xl transition-all duration-300 hover:bg-white/5">
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] font-bold text-white/60 uppercase tracking-wide">Travel Streak</span>
          </div>
          <span className="text-xs font-extrabold text-amber-300">{stats.streakDays} Days</span>
        </div>
      </div>

      {/* Badges Achievements */}
      <div className="flex flex-col gap-2.5">
        <span className="text-[9px] text-white/30 uppercase font-bold tracking-widest">Unlocked Achievements</span>
        <div className="flex flex-wrap gap-1.5">
          {stats.badges.map((badge, idx) => (
            <div 
              key={idx} 
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/15 text-[8px] text-purple-300 font-extrabold uppercase tracking-widest transition-all duration-300 hover:border-purple-400/35 hover:scale-102"
              title="Unlocked Badge Achievement"
            >
              <Award className="w-3 h-3 text-purple-400" />
              {badge}
            </div>
          ))}
          {stats.badges.length === 0 && (
            <span className="text-[10px] text-white/30 italic">No achievements unlocked yet.</span>
          )}
        </div>
      </div>
    </div>
  );
}
