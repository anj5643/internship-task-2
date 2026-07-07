/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Movie {
  id: string;
  title: string;
  overview: string;
  genres: string[];
  poster_path: string;
  backdrop_path: string;
  vote_average: number;
  release_date: string;
}

export interface Recommendation {
  movie: Movie;
  score: number;
  descriptionCosineSim: number;
  genreSimilarity: number;
  explanation: string;
}

export interface ComparisonBlock {
  title: string;
  comparison: string;
}

export interface MovieComparison {
  movieA: Movie;
  movieB: Movie;
  comparison: {
    narrative: ComparisonBlock;
    visuals: ComparisonBlock;
    scientificRealism: ComparisonBlock;
    reception: ComparisonBlock;
    verdict: ComparisonBlock;
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface TrailerSummary {
  movieId: string;
  movieTitle: string;
  trailerUrl: string;
  trailerKey: string;
  summary: string;
  keyHighlights: string[];
}

export type MoodType = 'happy' | 'sad' | 'romantic' | 'excited' | 'motivated';

export interface MoodOption {
  type: MoodType;
  label: string;
  emoji: string;
  color: string;
  description: string;
}

export interface ConfigState {
  hasGroqKey: boolean;
  hasOmdbKey: boolean;
  loading: boolean;
}
