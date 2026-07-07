/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Sparkles, Calendar, Award, Compass, Play, Info, ThumbsUp, Heart, ChevronDown, ChevronUp } from 'lucide-react';
import { Movie, Recommendation } from '../types.js';

interface MovieRecommendationsProps {
  baseMovie: Movie;
  recommendations: Recommendation[];
  onWatchTrailer: (movie: Movie) => void;
}

export default function MovieRecommendations({
  baseMovie,
  recommendations,
  onWatchTrailer
}: MovieRecommendationsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExplanation = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
    }
  };

  return (
    <div className="space-y-12 animate-fade-in" id="recommendations-container">
      {/* Anchor Movie SpotLight */}
      <div className="relative bg-[#1a1a1a] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
        {/* Backdrop image behind glass */}
        {baseMovie.backdrop_path && (
          <div className="absolute inset-0 z-0">
            <img
              src={baseMovie.backdrop_path}
              alt=""
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover opacity-15 blur-sm"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#1a1a1a]/80 to-transparent" />
          </div>
        )}

        <div className="p-6 md:p-10 relative z-10 flex flex-col md:flex-row gap-8 items-center md:items-start">
          {/* Base Movie Poster */}
          {baseMovie.poster_path ? (
            <img
              src={baseMovie.poster_path}
              alt={baseMovie.title}
              referrerPolicy="no-referrer"
              className="w-48 h-72 object-cover rounded-2xl shadow-xl border border-white/10 shrink-0 transform hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-48 h-72 bg-neutral-800 rounded-2xl flex items-center justify-center text-gray-500 border border-white/5 shrink-0">
              <Compass className="h-12 w-12" />
            </div>
          )}

          {/* Base Movie Info */}
          <div className="flex-1 text-center md:text-left space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] font-mono font-medium">
              <Award className="h-3 w-3" />
              <span>REFERENCE MOVIE / SEARCH ANCHOR</span>
            </div>

            <h2 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">
              {baseMovie.title}
            </h2>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs text-gray-400 font-mono">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {baseMovie.release_date ? baseMovie.release_date.split('-')[0] : 'N/A'}
              </span>
              <span>•</span>
              <span className="text-amber-400 font-bold">★ {baseMovie.vote_average.toFixed(1)} Rating</span>
              <span>•</span>
              <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-gray-300">
                {baseMovie.genres.join(', ')}
              </span>
            </div>

            <p className="text-gray-300 text-sm md:text-base leading-relaxed max-w-2xl">
              {baseMovie.overview}
            </p>

            <div className="pt-2 flex items-center justify-center md:justify-start gap-4">
              <button
                onClick={() => onWatchTrailer(baseMovie)}
                className="px-5 py-2.5 bg-white hover:bg-gray-200 active:scale-95 text-[#141414] rounded-xl font-semibold text-xs md:text-sm transition-all flex items-center gap-2 cursor-pointer shadow-lg"
              >
                <Play className="h-4 w-4 fill-current" />
                Preview Insights
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations Carousel & Grid Header */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Sparkles className="h-5.5 w-5.5 text-red-500 animate-spin-slow" />
              ML Engine Top Matches
            </h3>
            <p className="text-gray-400 text-xs md:text-sm mt-1">
              Candidates sorted by TF-IDF vector cosines and genre overlaps. Exclusively explained by Llama-3.3.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-gray-500">Weighting:</span>
            <span className="px-2 py-1 bg-red-600/10 text-red-400 border border-red-500/20 rounded">60% TF-IDF Cosine</span>
            <span className="px-2 py-1 bg-purple-600/10 text-purple-400 border border-purple-500/20 rounded">40% Genre Jaccard</span>
          </div>
        </div>

        {/* Netflix Card Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" id="recommendations-grid">
          {recommendations.map((item, index) => {
            const { movie, score, descriptionCosineSim, genreSimilarity, explanation } = item;
            const isExpanded = expandedId === movie.id;

            return (
              <div
                key={movie.id}
                className="group relative bg-[#1c1c1c] border border-white/5 hover:border-red-600/30 rounded-2xl overflow-hidden shadow-xl transition-all duration-300 hover:shadow-2xl hover:shadow-red-950/20 flex flex-col h-full"
              >
                {/* Score Badge */}
                <div className="absolute top-3 right-3 z-20">
                  <div className="px-2.5 py-1.5 rounded-xl bg-black/80 backdrop-blur-md border border-red-500/30 shadow-lg flex items-center gap-1 font-mono font-black text-xs text-red-400">
                    <Sparkles className="h-3.5 w-3.5 fill-red-500" />
                    <span>{score}% Match</span>
                  </div>
                </div>

                {/* Card Poster and Backdrop Overlap */}
                <div className="relative aspect-video w-full overflow-hidden bg-neutral-800 shrink-0">
                  <img
                    src={movie.backdrop_path || movie.poster_path}
                    alt={movie.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1c1c1c] via-[#1c1c1c]/20 to-transparent" />
                  
                  {/* Subtle index number watermark */}
                  <span className="absolute bottom-2 left-4 text-4xl md:text-5xl font-black text-white/10 font-mono select-none">
                    #{index + 1}
                  </span>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-extrabold text-white text-base md:text-lg tracking-tight group-hover:text-red-500 transition-colors line-clamp-1">
                        {movie.title}
                      </h4>
                      <span className="text-xs font-mono font-bold text-gray-500 shrink-0 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                        {movie.release_date ? movie.release_date.split('-')[0] : 'N/A'}
                      </span>
                    </div>

                    <p className="text-xs text-gray-400 font-mono truncate">
                      {movie.genres.join(', ')}
                    </p>

                    <p className="text-xs text-gray-300 leading-relaxed line-clamp-2">
                      {movie.overview}
                    </p>
                  </div>

                  {/* Math details breakdown */}
                  <div className="py-2 px-3 bg-black/40 rounded-xl border border-white/5 space-y-1">
                    <div className="flex justify-between text-[10px] font-mono text-gray-400">
                      <span>Description Cosine Sim:</span>
                      <span className="text-gray-300">{(descriptionCosineSim * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                      <div
                        className="bg-red-500 h-full rounded-full"
                        style={{ width: `${descriptionCosineSim * 100}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[10px] font-mono text-gray-400 mt-2">
                      <span>Genre Jaccard Overlap:</span>
                      <span className="text-gray-300">{(genreSimilarity * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                      <div
                        className="bg-purple-500 h-full rounded-full"
                        style={{ width: `${genreSimilarity * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* AI Explanation Area */}
                  <div className="space-y-2.5">
                    <button
                      onClick={() => toggleExplanation(movie.id)}
                      className="w-full py-1.5 px-3 bg-white/5 hover:bg-white/10 active:scale-98 rounded-lg text-[11px] font-semibold text-gray-300 flex items-center justify-between transition-all cursor-pointer border border-white/5"
                    >
                      <span className="flex items-center gap-1 text-red-400">
                        <Sparkles className="h-3 w-3 fill-red-400" />
                        AI Analysis & Connection
                      </span>
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>

                    {isExpanded && (
                      <div className="p-3 bg-red-950/25 border border-red-500/10 rounded-xl text-xs text-amber-100/90 leading-relaxed animate-slide-down">
                        "{explanation}"
                      </div>
                    )}
                  </div>

                  {/* Bottom Actions */}
                  <div className="pt-2 flex items-center gap-2 border-t border-white/5">
                    <button
                      onClick={() => onWatchTrailer(movie)}
                      className="flex-1 py-2 bg-red-600 hover:bg-red-500 active:scale-95 text-white font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Play className="h-3 w-3 fill-current" />
                      Watch Insights
                    </button>
                    <button className="p-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition-colors active:scale-95">
                      <ThumbsUp className="h-3.5 w-3.5" />
                    </button>
                    <button className="p-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition-colors active:scale-95">
                      <Heart className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
