/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { X, Play, Loader2, Sparkles, AlertCircle, Award, Compass } from 'lucide-react';
import { Movie, TrailerSummary } from '../types.js';

interface TrailerModalProps {
  movie: Movie;
  onClose: () => void;
}

export default function TrailerModal({ movie, onClose }: TrailerModalProps) {
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState<TrailerSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTrailerSummary() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/trailer-summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ movieId: movie.id, movieTitle: movie.title })
        });
        if (res.ok) {
          const data = await res.json();
          setSummaryData(data);
        } else {
          throw new Error('Could not retrieve trailer information.');
        }
      } catch (err: any) {
        console.error('Error fetching trailer summary:', err);
        setError(err.message || 'Failed to fetch trailer insights.');
      } finally {
        setLoading(false);
      }
    }

    fetchTrailerSummary();
  }, [movie]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 md:p-10 transition-all duration-300"
      id="trailer-modal"
    >
      {/* Container Card */}
      <div className="bg-[#141414] border border-white/10 rounded-3xl overflow-hidden w-full max-w-5xl shadow-2xl relative flex flex-col lg:flex-row h-auto max-h-[90vh]">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white/70 hover:text-white transition-all cursor-pointer border border-white/10 active:scale-95"
          id="close-modal-btn"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Left Side: Video Player or Loader */}
        <div className="w-full lg:w-3/5 bg-black aspect-video lg:aspect-auto flex items-center justify-center border-b lg:border-b-0 lg:border-r border-white/5 relative">
          {loading ? (
            <div className="flex flex-col items-center gap-2 text-gray-400">
              <Loader2 className="h-8 w-8 animate-spin text-red-600" />
              <span className="text-xs font-mono">Synchronizing video channels...</span>
            </div>
          ) : error || !summaryData?.trailerKey ? (
            <div className="p-6 text-center space-y-4">
              {movie.poster_path ? (
                <img
                  src={movie.poster_path}
                  alt={movie.title}
                  referrerPolicy="no-referrer"
                  className="w-28 h-40 object-cover rounded-xl border border-white/10 mx-auto opacity-40 shadow-lg"
                />
              ) : (
                <Compass className="h-10 w-10 text-gray-600 mx-auto" />
              )}
              <div className="space-y-1">
                <p className="text-sm font-bold text-gray-300">No Video Stream Available</p>
                <p className="text-xs text-gray-500 max-w-xs leading-relaxed">
                  We could not fetch an active official YouTube stream. Enjoy our AI-analyzed highlights on the sidebar instead!
                </p>
              </div>
            </div>
          ) : (
            <iframe
              src={`https://www.youtube.com/embed/${summaryData.trailerKey}?autoplay=1&mute=0`}
              title={`${movie.title} Official Trailer`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0 absolute inset-0"
              referrerPolicy="no-referrer"
            />
          )}
        </div>

        {/* Right Side: AI Insights Sidebar */}
        <div className="w-full lg:w-2/5 p-6 md:p-8 overflow-y-auto space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <span className="text-[10px] font-mono font-bold text-red-500 bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Trailer Summary & Vibe
              </span>
              <h3 className="text-xl font-extrabold text-white mt-1.5 truncate">
                {movie.title}
              </h3>
              <p className="text-xs text-gray-500 font-mono mt-0.5">
                Released: {movie.release_date} • Rating: {movie.vote_average.toFixed(1)}/10
              </p>
            </div>

            {/* Cinematic Summary */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-mono font-black text-amber-400 tracking-wider uppercase flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 fill-amber-400" />
                Llama Trailer Commentary
              </h4>
              
              {loading ? (
                <div className="space-y-2 animate-pulse">
                  <div className="h-3.5 bg-neutral-800 rounded" />
                  <div className="h-3.5 bg-neutral-800 rounded" />
                  <div className="h-3.5 bg-neutral-800 rounded w-5/6" />
                </div>
              ) : error ? (
                <p className="text-xs text-gray-400 italic">
                  Could not compile custom trailer insights due to a server connection failure.
                </p>
              ) : (
                <p className="text-xs text-gray-300 leading-relaxed font-sans">
                  "{summaryData?.summary}"
                </p>
              )}
            </div>

            {/* Highlights bullet points */}
            <div className="space-y-2.5 pt-2">
              <h4 className="text-xs font-mono font-black text-purple-400 tracking-wider uppercase flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5" />
                Key Trailer Cues
              </h4>

              {loading ? (
                <div className="space-y-2 animate-pulse">
                  <div className="h-3 bg-neutral-800 rounded w-11/12" />
                  <div className="h-3 bg-neutral-800 rounded w-4/5" />
                  <div className="h-3 bg-neutral-800 rounded w-3/4" />
                </div>
              ) : error ? (
                <div className="space-y-1 text-xs text-gray-500">
                  <li>Cinematic pacing and visual effects</li>
                  <li>Intriguing narrative structure</li>
                  <li>High emotional resonance</li>
                </div>
              ) : (
                <div className="space-y-2">
                  {summaryData?.keyHighlights.map((hl, i) => (
                    <div key={i} className="flex gap-2 items-start text-xs text-gray-300 leading-relaxed">
                      <span className="h-1.5 w-1.5 rounded-full bg-purple-500 shrink-0 mt-1.5" />
                      <span>{hl}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Disclaimer */}
          <div className="pt-6 border-t border-white/5 flex items-start gap-2 text-[10px] text-gray-500 leading-normal">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-red-500/50" />
            <span>
              Insights are analyzed on-the-fly using trailer titles and film narratives. Enjoy full visual playback in HD.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
