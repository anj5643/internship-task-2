/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import Header from './components/Header.js';
import SearchSection from './components/SearchSection.js';
import MovieRecommendations from './components/MovieRecommendations.js';
import MoodSection from './components/MoodSection.js';
import CompareSection from './components/CompareSection.js';
import AssistantSection from './components/AssistantSection.js';
import TrailerModal from './components/TrailerModal.js';
import { Movie, Recommendation, ConfigState } from './types.js';
import { Film, Loader2, Sparkles, AlertCircle, Compass, Smile, MessageSquare, Layers } from 'lucide-react';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<string>('recommend');

  // Config State (Check if secrets are populated)
  const [config, setConfig] = useState<ConfigState>({
    hasGroqKey: false,
    hasOmdbKey: false,
    loading: true
  });

  // Recommendations Pipeline State
  const [recLoading, setRecLoading] = useState(false);
  const [recError, setRecError] = useState<string | null>(null);
  const [baseMovie, setBaseMovie] = useState<Movie | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  // Selected trailer modal state
  const [activeTrailerMovie, setActiveTrailerMovie] = useState<Movie | null>(null);

  // Check backend configuration
  const checkConfig = async () => {
    setConfig((prev) => ({ ...prev, loading: true }));
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        setConfig({
          hasGroqKey: data.hasGroqKey,
          hasOmdbKey: data.hasOmdbKey,
          loading: false
        });
      }
    } catch (err) {
      console.error('Failed to query config endpoint:', err);
      setConfig({
        hasGroqKey: false,
        hasOmdbKey: false,
        loading: false
      });
    }
  };

  useEffect(() => {
    checkConfig();
  }, []);

  // Handle recommendation triggering
  const handleSearch = async (movieTitle: string) => {
    setRecLoading(true);
    setRecError(null);
    setBaseMovie(null);
    setRecommendations([]);

    try {
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ movieTitle })
      });

      if (res.ok) {
        const data = await res.json();
        setBaseMovie(data.baseMovie);
        setRecommendations(data.recommendations);
      } else {
        const errorData = await res.json();
        setRecError(errorData.error || 'Failed to retrieve recommendations. Check spelling or try a different movie.');
      }
    } catch (err: any) {
      console.error('Error fetching recommendations:', err);
      setRecError('A network anomaly occurred. Check your API connectivity and try again.');
    } finally {
      setRecLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#141414] text-white flex flex-col selection:bg-red-600 selection:text-white" id="app-root">
      {/* Header component */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        config={config}
        checkConfig={checkConfig}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {activeTab === 'recommend' && (
          <div className="space-y-8 animate-fade-in" id="recommend-tab">
            {/* Centered Search Zone */}
            <SearchSection onSearch={handleSearch} loading={recLoading} />

            {/* Loading skeletons for Pipeline */}
            {recLoading && (
              <div className="space-y-10 max-w-5xl mx-auto" id="pipeline-loading">
                {/* SpotLight Skeleton */}
                <div className="bg-[#1a1a1a] border border-white/5 rounded-3xl p-6 md:p-10 flex flex-col md:flex-row gap-8 items-center md:items-start animate-pulse">
                  <div className="w-48 h-72 bg-neutral-800 rounded-2xl" />
                  <div className="flex-1 space-y-4 py-2 w-full">
                    <div className="h-6 bg-neutral-800 rounded w-1/4" />
                    <div className="h-10 bg-neutral-800 rounded w-1/2" />
                    <div className="h-4 bg-neutral-800 rounded w-1/3" />
                    <div className="space-y-2 pt-2">
                      <div className="h-4 bg-neutral-800 rounded" />
                      <div className="h-4 bg-neutral-800 rounded" />
                      <div className="h-4 bg-neutral-800 rounded w-5/6" />
                    </div>
                  </div>
                </div>

                {/* Cards Header Skeleton */}
                <div className="h-6 bg-neutral-800 rounded w-1/4 animate-pulse" />

                {/* Recommended Cards Skeletons */}
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

            {/* Error messaging */}
            {recError && (
              <div className="max-w-xl mx-auto p-6 bg-red-950/20 border border-red-500/20 rounded-3xl flex flex-col items-center text-center gap-3 animate-fade-in" id="recommend-error">
                <AlertCircle className="h-10 w-10 text-red-500" />
                <div className="space-y-1">
                  <h3 className="font-extrabold text-white text-base md:text-lg">Recommendation Pipeline Failed</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">{recError}</p>
                </div>
                <button
                  onClick={() => setRecError(null)}
                  className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-500 active:scale-95 text-white rounded-xl text-xs font-semibold cursor-pointer transition-all"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Results Grid */}
            {!recLoading && baseMovie && recommendations.length > 0 && (
              <MovieRecommendations
                baseMovie={baseMovie}
                recommendations={recommendations}
                onWatchTrailer={setActiveTrailerMovie}
              />
            )}

            {/* Static Splash / Prompting */}
            {!recLoading && !recError && !baseMovie && (
              <div className="py-12 flex flex-col items-center justify-center text-center text-gray-500 max-w-sm mx-auto space-y-4 animate-fade-in">
                <div className="p-4 bg-[#1a1a1a] rounded-full border border-white/5 text-red-600/60 shadow-lg">
                  <Compass className="h-8 w-8 animate-spin-slow" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-400 text-sm">Awaiting Search Input</h3>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    Enter your favorite reference movie in the analyzer bar above to compile dynamic TF-IDF metrics and personalized summaries.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mood tab */}
        {activeTab === 'mood' && (
          <div id="mood-tab">
            <MoodSection onWatchTrailer={setActiveTrailerMovie} />
          </div>
        )}

        {/* Compare tab */}
        {activeTab === 'compare' && (
          <div id="compare-tab">
            <CompareSection onWatchTrailer={setActiveTrailerMovie} />
          </div>
        )}

        {/* Assistant tab */}
        {activeTab === 'assistant' && (
          <div id="assistant-tab">
            <AssistantSection />
          </div>
        )}
      </main>

      {/* Trailer/Insights Modal Lightbox */}
      {activeTrailerMovie && (
        <TrailerModal
          movie={activeTrailerMovie}
          onClose={() => setActiveTrailerMovie(null)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 bg-[#101010]/50 text-center text-xs text-gray-600 space-y-2 mt-16">
        <div className="flex justify-center items-center gap-2">
          <Film className="h-4 w-4 text-red-500" />
          <span className="font-sans font-bold tracking-wider text-gray-400">MOVIEMIND AI PRO</span>
        </div>
        <p className="max-w-md mx-auto leading-relaxed text-[11px] px-4">
          Engineered for evaluations, utilizing live TF-IDF vector similarity metrics integrated with our movie database and AI models. All rights reserved © 2026.
        </p>
      </footer>
    </div>
  );
}
