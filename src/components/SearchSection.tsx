/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Search, Sparkles, Film, ArrowRight, Loader2, Info } from 'lucide-react';
import { Movie } from '../types.js';

interface SearchSectionProps {
  onSearch: (movieTitle: string) => void;
  loading: boolean;
}

export default function SearchSection({ onSearch, loading }: SearchSectionProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Movie[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Suggested starter queries to inspire the user
  const presetQueries = [
    'Interstellar',
    'Recommend movies like Inception',
    'Suggest a dark psychological thriller',
    'Best cyberpunk sci-fi action movies'
  ];

  // Handle autocomplete suggestion retrieval (debounced)
  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    // Don't autocomplete if it looks like a long natural language statement
    if (query.split(' ').length > 4) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSuggestLoading(true);
        const res = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data);
        }
      } catch (err) {
        console.error('Error fetching suggestions:', err);
      } finally {
        setSuggestLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside suggestions close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setShowSuggestions(false);
    onSearch(query);
  };

  const handleSuggestionClick = (title: string) => {
    setQuery(title);
    setShowSuggestions(false);
    onSearch(title);
  };

  return (
    <div className="relative bg-[#181818] rounded-3xl overflow-hidden border border-white/5 shadow-2xl shadow-black/50 mb-12">
      {/* Background Ambient Glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-red-600/10 via-transparent to-purple-600/5 pointer-events-none" />

      <div className="px-6 py-12 md:p-16 text-center max-w-3xl mx-auto relative z-10">
        {/* Title */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono mb-6 animate-fade-in">
          <Sparkles className="h-3.5 w-3.5 animate-spin-slow" />
          <span>REAL-TIME COUSINE SIMILARITY ENGINE</span>
        </div>

        <h1 className="font-sans font-extrabold tracking-tight text-3xl md:text-5xl text-white mb-4 leading-tight">
          Find Your Next <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 bg-clip-text text-transparent">
            Cinematic Obsession
          </span>
        </h1>

        <p className="text-gray-400 text-sm md:text-base max-w-xl mx-auto mb-8">
          Type any movie name, or describe what you want in natural language. Our hybrid ML engine and AI will handle the rest.
        </p>

        {/* Search Bar Form */}
        <form onSubmit={handleSubmit} className="relative mb-6" id="search-form">
          <div className="relative flex items-center">
            <Search className="absolute left-4.5 h-5 w-5 text-gray-500 pointer-events-none" />
            <input
              id="search-input"
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="e.g., Interstellar, or 'Suggest a dark psychological thriller'..."
              className="w-full pl-13 pr-32 py-4.5 bg-black/60 hover:bg-black/80 focus:bg-black border border-white/10 focus:border-red-600/50 rounded-2xl text-white placeholder-gray-500 text-sm md:text-base outline-none transition-all shadow-inner"
              disabled={loading}
              autoComplete="off"
            />
            <button
              id="search-submit"
              type="submit"
              disabled={loading}
              className="absolute right-2 px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 active:scale-95 disabled:opacity-50 text-white font-medium text-sm rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-red-600/20"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <span>Analyze</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>

          {/* Instant Suggestions Dropdown */}
          {showSuggestions && (suggestions.length > 0 || suggestLoading) && (
            <div
              ref={suggestionsRef}
              className="absolute left-0 right-0 top-full mt-2 bg-[#1f1f1f] border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50 text-left"
              id="search-suggestions"
            >
              {suggestLoading && suggestions.length === 0 && (
                <div className="p-4 text-center text-sm text-gray-400 flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-red-500" />
                  Searching database...
                </div>
              )}

              {suggestions.map((movie) => (
                <button
                  key={movie.id}
                  type="button"
                  onClick={() => handleSuggestionClick(movie.title)}
                  className="w-full px-4 py-3 hover:bg-white/5 active:bg-white/10 text-white flex items-center gap-3 transition-colors border-b border-white/5 last:border-0"
                >
                  {movie.poster_path ? (
                    <img
                      src={movie.poster_path}
                      alt={movie.title}
                      referrerPolicy="no-referrer"
                      className="h-10 w-7 rounded object-cover bg-gray-800"
                    />
                  ) : (
                    <div className="h-10 w-7 rounded bg-gray-800 flex items-center justify-center text-gray-500">
                      <Film className="h-4 w-4" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate text-white">{movie.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {movie.release_date ? movie.release_date.split('-')[0] : 'N/A'} • {movie.genres.slice(0, 2).join(', ')}
                    </p>
                  </div>
                  {movie.vote_average > 0 && (
                    <span className="text-xs font-mono font-bold text-amber-400 shrink-0">
                      ★ {movie.vote_average.toFixed(1)}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </form>

        {/* Preset suggestions */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-xs">
          <span className="text-gray-500 font-medium">Try:</span>
          {presetQueries.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => {
                setQuery(preset);
                onSearch(preset);
              }}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 text-gray-300 hover:text-white transition-all cursor-pointer border border-white/5"
            >
              {preset}
            </button>
          ))}
        </div>

        {/* Natural Language Capabilities Tip */}
        <div className="mt-8 px-4 py-3 bg-[#111111]/80 rounded-xl border border-white/5 text-left text-xs text-gray-400 flex items-start gap-2.5 max-w-lg mx-auto">
          <Info className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-gray-300">Natural Language Powered</p>
            <p className="mt-0.5 leading-relaxed">
              If you type queries like <span className="text-red-400">"Suggest a dark psychological thriller"</span>, the AI will automatically select the perfect reference movie (e.g. <span className="text-gray-300">"Shutter Island"</span>) and use it to execute our machine learning match pipeline.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
