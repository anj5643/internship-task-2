/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Layers, Play, Sparkles, Loader2, Award, Swords, Film, ArrowRight } from 'lucide-react';
import { Movie, MovieComparison } from '../types.js';

interface CompareSectionProps {
  onWatchTrailer: (movie: Movie) => void;
}

export default function CompareSection({ onWatchTrailer }: CompareSectionProps) {
  const [movie1, setMovie1] = useState('');
  const [movie2, setMovie2] = useState('');
  const [loading, setLoading] = useState(false);
  const [comparison, setComparison] = useState<MovieComparison | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCompare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movie1.trim() || !movie2.trim()) return;

    setLoading(true);
    setError(null);
    setComparison(null);

    try {
      const res = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movie1: movie1.trim(), movie2: movie2.trim() })
      });

      if (res.ok) {
        const data = await res.json();
        setComparison(data);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to compare movies. Please check spelling.');
      }
    } catch (err) {
      console.error('Error during comparison:', err);
      setError('A network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadPreset = (m1: string, m2: string) => {
    setMovie1(m1);
    setMovie2(m2);
    // Auto submit
    setTimeout(() => {
      const form = document.getElementById('compare-form') as HTMLFormElement;
      if (form) form.requestSubmit();
    }, 50);
  };

  return (
    <div className="space-y-10 animate-fade-in" id="compare-section-container">
      {/* Intro Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white flex items-center justify-center gap-3">
          <Swords className="h-7 w-7 text-red-500 animate-pulse" />
          Cinematic Showdowns
        </h2>
        <p className="text-gray-400 text-sm md:text-base">
          Pit two films against each other. Our system pulls real metadata and uses AI to draft a structured, professional comparative review.
        </p>
      </div>

      {/* Comparison Inputs Form */}
      <form onSubmit={handleCompare} id="compare-form" className="max-w-3xl mx-auto bg-[#1a1a1a] p-6 md:p-8 rounded-3xl border border-white/5 shadow-xl space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
          {/* Movie 1 Input */}
          <div className="space-y-2">
            <label className="text-xs font-mono font-bold text-gray-400 block tracking-wider uppercase">MOVIE A (BASE)</label>
            <input
              id="compare-input-a"
              type="text"
              value={movie1}
              onChange={(e) => setMovie1(e.target.value)}
              placeholder="e.g., Interstellar"
              className="w-full px-4 py-3 bg-black/50 hover:bg-black/80 focus:bg-black border border-white/10 focus:border-red-600/50 rounded-xl text-white text-sm outline-none transition-all"
              disabled={loading}
              required
            />
          </div>

          {/* Swords Centerpiece decoration */}
          <div className="hidden md:flex absolute inset-0 items-center justify-center pointer-events-none mt-6">
            <div className="bg-[#111111] border border-white/10 p-2.5 rounded-full text-red-500 shadow-lg">
              <Swords className="h-4 w-4" />
            </div>
          </div>

          {/* Movie 2 Input */}
          <div className="space-y-2">
            <label className="text-xs font-mono font-bold text-gray-400 block tracking-wider uppercase">MOVIE B (CHALLENGER)</label>
            <input
              id="compare-input-b"
              type="text"
              value={movie2}
              onChange={(e) => setMovie2(e.target.value)}
              placeholder="e.g., Arrival"
              className="w-full px-4 py-3 bg-black/50 hover:bg-black/80 focus:bg-black border border-white/10 focus:border-red-600/50 rounded-xl text-white text-sm outline-none transition-all"
              disabled={loading}
              required
            />
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-950/20 border border-red-500/20 rounded-xl text-xs text-red-400 text-center">
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          {/* Presets */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-gray-500 font-mono">Presets:</span>
            <button
              type="button"
              onClick={() => loadPreset('Interstellar', 'Arrival')}
              disabled={loading}
              className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-gray-300 rounded hover:text-white transition-all cursor-pointer text-[11px]"
            >
              Interstellar vs Arrival
            </button>
            <button
              type="button"
              onClick={() => loadPreset('The Dark Knight', 'Joker')}
              disabled={loading}
              className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-gray-300 rounded hover:text-white transition-all cursor-pointer text-[11px]"
            >
              Dark Knight vs Joker
            </button>
          </div>

          <button
            id="compare-submit"
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-8 py-3 bg-red-600 hover:bg-red-500 active:scale-95 disabled:opacity-50 text-white font-bold text-xs md:text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-red-600/10 shrink-0"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Running Critique...</span>
              </>
            ) : (
              <>
                <span>Launch Analysis</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-8 max-w-5xl mx-auto">
          {/* Side by side poster loading */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-[#1a1a1a] p-6 rounded-3xl h-60 animate-pulse border border-white/5" />
            <div className="bg-[#1a1a1a] p-6 rounded-3xl h-60 animate-pulse border border-white/5" />
          </div>
          {/* Bento analysis blocks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-[#1c1c1c] p-6 rounded-2xl h-44 animate-pulse border border-white/5" />
            ))}
          </div>
          {/* Verdict loading */}
          <div className="bg-[#1c1c1c] p-6 rounded-2xl h-56 animate-pulse border border-white/5" />
        </div>
      )}

      {/* Comparison Results */}
      {!loading && comparison && (
        <div className="space-y-8 max-w-5xl mx-auto animate-fade-in" id="comparison-results">
          {/* Side by Side Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* Movie A Card */}
            <div className="bg-gradient-to-b from-[#1c1c1c] to-[#161616] border border-white/5 rounded-3xl p-6 flex flex-col md:flex-row gap-6 items-center shadow-xl">
              {comparison.movieA.poster_path ? (
                <img
                  src={comparison.movieA.poster_path}
                  alt={comparison.movieA.title}
                  referrerPolicy="no-referrer"
                  className="w-32 h-48 object-cover rounded-xl border border-white/10 shadow-lg shrink-0"
                />
              ) : (
                <div className="w-32 h-48 bg-neutral-800 rounded-xl border border-white/5 flex items-center justify-center text-gray-500 shrink-0" />
              )}
              <div className="space-y-2 text-center md:text-left flex-1 min-w-0">
                <span className="text-[10px] font-mono font-bold text-red-500 px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 uppercase tracking-wider">
                  Movie A (Base)
                </span>
                <h3 className="text-xl font-extrabold text-white tracking-tight truncate mt-1">
                  {comparison.movieA.title}
                </h3>
                <p className="text-xs text-amber-400 font-mono font-bold">
                  ★ {comparison.movieA.vote_average.toFixed(1)} Rating • {comparison.movieA.release_date.split('-')[0]}
                </p>
                <p className="text-xs text-gray-400 font-mono truncate">
                  {comparison.movieA.genres.join(', ')}
                </p>
                <p className="text-[11px] text-gray-300 leading-relaxed line-clamp-3">
                  {comparison.movieA.overview}
                </p>
                <button
                  type="button"
                  onClick={() => onWatchTrailer(comparison.movieA)}
                  className="mt-2 text-xs font-semibold text-red-400 hover:text-red-300 transition-colors inline-flex items-center gap-1 cursor-pointer"
                >
                  <Play className="h-3 w-3 fill-current" />
                  Preview Movie A
                </button>
              </div>
            </div>

            {/* Movie B Card */}
            <div className="bg-gradient-to-b from-[#1c1c1c] to-[#161616] border border-white/5 rounded-3xl p-6 flex flex-col md:flex-row gap-6 items-center shadow-xl">
              {comparison.movieB.poster_path ? (
                <img
                  src={comparison.movieB.poster_path}
                  alt={comparison.movieB.title}
                  referrerPolicy="no-referrer"
                  className="w-32 h-48 object-cover rounded-xl border border-white/10 shadow-lg shrink-0"
                />
              ) : (
                <div className="w-32 h-48 bg-neutral-800 rounded-xl border border-white/5 flex items-center justify-center text-gray-500 shrink-0" />
              )}
              <div className="space-y-2 text-center md:text-left flex-1 min-w-0">
                <span className="text-[10px] font-mono font-bold text-purple-500 px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 uppercase tracking-wider">
                  Movie B (Challenger)
                </span>
                <h3 className="text-xl font-extrabold text-white tracking-tight truncate mt-1">
                  {comparison.movieB.title}
                </h3>
                <p className="text-xs text-amber-400 font-mono font-bold">
                  ★ {comparison.movieB.vote_average.toFixed(1)} Rating • {comparison.movieB.release_date.split('-')[0]}
                </p>
                <p className="text-xs text-gray-400 font-mono truncate">
                  {comparison.movieB.genres.join(', ')}
                </p>
                <p className="text-[11px] text-gray-300 leading-relaxed line-clamp-3">
                  {comparison.movieB.overview}
                </p>
                <button
                  type="button"
                  onClick={() => onWatchTrailer(comparison.movieB)}
                  className="mt-2 text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors inline-flex items-center gap-1 cursor-pointer"
                >
                  <Play className="h-3 w-3 fill-current" />
                  Preview Movie B
                </button>
              </div>
            </div>
          </div>

          {/* Bento Grid Analysis Blocks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Narrative & Themes */}
            <div className="bg-[#1c1c1c] border border-white/5 rounded-2xl p-6 space-y-3 shadow-lg">
              <h4 className="text-sm font-mono font-bold text-red-500 tracking-wider uppercase flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                {comparison.comparison.narrative.title}
              </h4>
              <p className="text-xs md:text-sm text-gray-300 leading-relaxed">
                {comparison.comparison.narrative.comparison}
              </p>
            </div>

            {/* Visuals */}
            <div className="bg-[#1c1c1c] border border-white/5 rounded-2xl p-6 space-y-3 shadow-lg">
              <h4 className="text-sm font-mono font-bold text-purple-500 tracking-wider uppercase flex items-center gap-2">
                <Film className="h-4 w-4" />
                {comparison.comparison.visuals.title}
              </h4>
              <p className="text-xs md:text-sm text-gray-300 leading-relaxed">
                {comparison.comparison.visuals.comparison}
              </p>
            </div>

            {/* Scientific Realism */}
            <div className="bg-[#1c1c1c] border border-white/5 rounded-2xl p-6 space-y-3 shadow-lg">
              <h4 className="text-sm font-mono font-bold text-amber-500 tracking-wider uppercase flex items-center gap-2">
                <Award className="h-4 w-4" />
                {comparison.comparison.scientificRealism.title}
              </h4>
              <p className="text-xs md:text-sm text-gray-300 leading-relaxed">
                {comparison.comparison.scientificRealism.comparison}
              </p>
            </div>

            {/* Critical Reception / Directorial Style */}
            <div className="bg-[#1c1c1c] border border-white/5 rounded-2xl p-6 space-y-3 shadow-lg">
              <h4 className="text-sm font-mono font-bold text-emerald-500 tracking-wider uppercase flex items-center gap-2">
                <Layers className="h-4 w-4" />
                {comparison.comparison.reception.title}
              </h4>
              <p className="text-xs md:text-sm text-gray-300 leading-relaxed">
                {comparison.comparison.reception.comparison}
              </p>
            </div>
          </div>

          {/* Ultimate Verdict Golden Card */}
          <div className="bg-gradient-to-r from-red-950/40 via-purple-950/30 to-[#1c1c1c] border border-red-500/20 rounded-2xl p-6 md:p-8 space-y-4 shadow-2xl relative overflow-hidden">
            <div className="absolute right-0 bottom-0 top-0 opacity-5 pointer-events-none select-none flex items-center justify-center pr-8">
              <Award className="h-44 w-44 text-white" />
            </div>
            
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-gradient-to-r from-red-500 to-amber-500 rounded-xl shadow-lg shadow-red-500/10 flex items-center justify-center text-white shrink-0">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-white text-base md:text-lg">
                  {comparison.comparison.verdict.title}
                </h4>
                <p className="text-[10px] text-amber-400 font-mono uppercase tracking-wider">CRITICAL RECONCILIATION SUMMARY</p>
              </div>
            </div>

            <p className="text-xs md:text-sm text-amber-100/90 leading-relaxed font-medium">
              {comparison.comparison.verdict.comparison}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
