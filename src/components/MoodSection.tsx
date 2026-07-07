/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Smile, Frown, Flame, Heart, Lightbulb, Play, Sparkles, ThumbsUp } from 'lucide-react';
import { Movie, MoodType, MoodOption } from '../types.js';

interface MoodSectionProps {
  onWatchTrailer: (movie: Movie) => void;
}

interface MoodRecommendation {
  movie: Movie;
  explanation: string;
}

export default function MoodSection({ onWatchTrailer }: MoodSectionProps) {
  const [activeMood, setActiveMood] = useState<MoodType | null>(null);
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<MoodRecommendation[]>([]);

  const moodOptions: MoodOption[] = [
    {
      type: 'happy',
      label: 'Happy & Joyful',
      emoji: '☀️',
      color: 'from-amber-500 to-yellow-600 shadow-yellow-500/10 hover:border-yellow-400',
      description: 'Uplifting, high-energy, feel-good, or lighthearted stories to keep the vibes high.'
    },
    {
      type: 'sad',
      label: 'Deep & Emotional',
      emoji: '🌧️',
      color: 'from-blue-500 to-indigo-600 shadow-blue-500/10 hover:border-blue-400',
      description: 'Cathartic tear-jerkers, melancholy masterpieces, and profound character studies.'
    },
    {
      type: 'romantic',
      label: 'Romantic & Cozy',
      emoji: '💖',
      color: 'from-pink-500 to-rose-600 shadow-pink-500/10 hover:border-pink-400',
      description: 'Captivating stories of connection, magnetic chemistry, and tender intimacy.'
    },
    {
      type: 'excited',
      label: 'Adrenaline Rush',
      emoji: '⚡',
      color: 'from-red-500 to-orange-600 shadow-red-500/10 hover:border-red-400',
      description: 'Mind-bending psychological thrillers, intense blockbusters, and relentless action.'
    },
    {
      type: 'motivated',
      label: 'Inspiring & Driven',
      emoji: '🌱',
      color: 'from-emerald-500 to-teal-600 shadow-emerald-500/10 hover:border-emerald-400',
      description: 'Stories of triumph over adversity, visionary creators, and breathtaking determination.'
    }
  ];

  const handleMoodSelect = async (mood: MoodType) => {
    setActiveMood(mood);
    setLoading(true);
    try {
      const res = await fetch('/api/mood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood })
      });
      if (res.ok) {
        const data = await res.json();
        setRecommendations(data.recommendations || []);
      } else {
        console.error('Failed to fetch mood movies');
      }
    } catch (err) {
      console.error('Error fetching mood recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  const getMoodIcon = (type: MoodType) => {
    switch (type) {
      case 'happy': return <Smile className="h-5 w-5" />;
      case 'sad': return <Frown className="h-5 w-5" />;
      case 'excited': return <Flame className="h-5 w-5" />;
      case 'romantic': return <Heart className="h-5 w-5" />;
      case 'motivated': return <Lightbulb className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-10 animate-fade-in" id="mood-section-container">
      {/* Intro */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white">
          Mood-Based Matcher
        </h2>
        <p className="text-gray-400 text-sm md:text-base">
          How is your energy level right now? Select a mood below, and the Llama-3.3 LLM will craft a bespoke selection of real films, backed by official posters and trailer analysis.
        </p>
      </div>

      {/* Mood Buttons Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4" id="mood-buttons-grid">
        {moodOptions.map((opt) => {
          const isActive = activeMood === opt.type;
          return (
            <button
              key={opt.type}
              onClick={() => handleMoodSelect(opt.type)}
              className={`text-left p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-44 cursor-pointer hover:-translate-y-1 ${
                isActive
                  ? `bg-gradient-to-br ${opt.color} text-white border-transparent scale-102 shadow-2xl`
                  : 'bg-[#1a1a1a] border-white/5 text-gray-300 hover:bg-[#222222] hover:text-white'
              }`}
            >
              {/* Decorative Emoji background */}
              <span className="absolute right-3 top-3 text-4xl opacity-10 select-none font-sans">
                {opt.emoji}
              </span>

              <div className="space-y-1 relative z-10">
                <div className={`p-2 rounded-xl inline-flex items-center justify-center ${
                  isActive ? 'bg-white/20' : 'bg-white/5'
                }`}>
                  {getMoodIcon(opt.type)}
                </div>
                <h3 className="font-extrabold text-sm md:text-base mt-3">{opt.label}</h3>
              </div>

              <p className={`text-[11px] leading-relaxed relative z-10 ${
                isActive ? 'text-white/80' : 'text-gray-400'
              }`}>
                {opt.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-6">
          <div className="h-6 bg-neutral-800 rounded-md w-1/4 animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-[#1c1c1c] border border-white/5 rounded-2xl overflow-hidden h-96 flex flex-col space-y-4 p-4 animate-pulse">
                <div className="aspect-video w-full bg-neutral-800 rounded-xl" />
                <div className="h-6 bg-neutral-800 rounded w-2/3" />
                <div className="h-4 bg-neutral-800 rounded w-1/2" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-neutral-800 rounded" />
                  <div className="h-4 bg-neutral-800 rounded" />
                </div>
                <div className="h-10 bg-neutral-800 rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results Section */}
      {!loading && activeMood && recommendations.length > 0 && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center gap-2 pb-2 border-b border-white/5">
            <span className="text-2xl font-sans">
              {moodOptions.find(m => m.type === activeMood)?.emoji}
            </span>
            <h3 className="text-xl md:text-2xl font-extrabold text-white">
              Curation for: <span className="capitalize text-red-500">{activeMood}</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" id="mood-results-grid">
            {recommendations.map((rec, index) => {
              const { movie, explanation } = rec;
              if (!movie) return null;

              return (
                <div
                  key={movie.id}
                  className="group bg-[#1c1c1c] border border-white/5 hover:border-red-600/30 rounded-2xl overflow-hidden shadow-xl transition-all duration-300 flex flex-col h-full hover:shadow-2xl"
                >
                  {/* Card media */}
                  <div className="relative aspect-video w-full overflow-hidden bg-neutral-800 shrink-0">
                    <img
                      src={movie.backdrop_path || movie.poster_path}
                      alt={movie.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1c1c1c] via-[#1c1c1c]/20 to-transparent" />
                    <span className="absolute top-3 left-4 font-mono font-black text-white/30 text-lg">
                      #{index + 1}
                    </span>
                  </div>

                  {/* Card contents */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-extrabold text-white text-base md:text-lg line-clamp-1">
                          {movie.title}
                        </h4>
                        <span className="text-xs font-mono font-bold text-gray-500 shrink-0 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                          {movie.release_date ? movie.release_date.split('-')[0] : 'N/A'}
                        </span>
                      </div>

                      <p className="text-xs text-gray-400 font-mono truncate">
                        {movie.genres.join(', ')}
                      </p>

                      <div className="py-2.5 px-3 bg-red-950/20 border border-red-500/10 rounded-xl text-xs text-amber-100/90 leading-relaxed font-sans">
                        <Sparkles className="h-3 w-3 text-red-400 inline mr-1 mb-0.5" />
                        "{explanation}"
                      </div>

                      <p className="text-xs text-gray-400 leading-relaxed line-clamp-3 pt-1">
                        {movie.overview}
                      </p>
                    </div>

                    <div className="pt-2 flex items-center gap-2 border-t border-white/5">
                      <button
                        onClick={() => onWatchTrailer(movie)}
                        className="flex-1 py-2 bg-red-600 hover:bg-red-500 active:scale-95 text-white font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Play className="h-3 w-3 fill-current" />
                        Preview Insights
                      </button>
                      <button className="p-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition-colors active:scale-95">
                        <ThumbsUp className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
