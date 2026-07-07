/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Common English stopwords to filter out for higher-quality TF-IDF representation
const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'arent', 'as', 'at',
  'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'cant', 'cannot', 'could',
  'couldnt', 'did', 'didnt', 'do', 'does', 'doesnt', 'doing', 'dont', 'down', 'during', 'each', 'few', 'for', 'from',
  'further', 'had', 'hadnt', 'has', 'hasnt', 'have', 'havent', 'having', 'he', 'hed', 'hell', 'hes', 'her', 'here',
  'heres', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'hows', 'i', 'id', 'ill', 'im', 'ive', 'if', 'in',
  'into', 'is', 'isnt', 'it', 'its', 'itself', 'lets', 'me', 'more', 'most', 'mustnt', 'my', 'myself', 'no', 'nor',
  'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own',
  'same', 'shant', 'she', 'shed', 'shell', 'shes', 'should', 'shouldnt', 'so', 'some', 'such', 'than', 'that', 'thats',
  'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'theres', 'these', 'they', 'theyd', 'theyll',
  'theyre', 'theyve', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'wasnt', 'we',
  'wed', 'well', 'were', 'weve', 'werent', 'what', 'whats', 'when', 'whens', 'where', 'wheres', 'which', 'while',
  'who', 'whos', 'whom', 'why', 'whys', 'with', 'wont', 'would', 'wouldnt', 'you', 'youd', 'youll', 'youre', 'youve',
  'your', 'yours', 'yourself', 'yourselves'
]);

export interface MovieContent {
  id: string;
  title: string;
  overview: string;
  genres: string[];
}

/**
 * Tokenizes text by lowercasing, removing punctuation, and filtering out English stopwords.
 */
export function tokenize(text: string): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ') // Replace punctuation with space
    .split(/\s+/)              // Split on whitespace
    .filter(token => token.length > 1 && !STOP_WORDS.has(token));
}

/**
 * Computes Jaccard Similarity between two sets of genres
 */
export function computeGenreJaccard(genresA: string[], genresB: string[]): number {
  if (genresA.length === 0 && genresB.length === 0) return 1.0;
  if (genresA.length === 0 || genresB.length === 0) return 0.0;
  
  const setA = new Set(genresA.map(g => g.toLowerCase()));
  const setB = new Set(genresB.map(g => g.toLowerCase()));
  
  let intersectionSize = 0;
  for (const item of setA) {
    if (setB.has(item)) {
      intersectionSize++;
    }
  }
  
  const unionSize = setA.size + setB.size - intersectionSize;
  return unionSize > 0 ? intersectionSize / unionSize : 0;
}

/**
 * Custom machine learning pipeline using TF-IDF & Cosine Similarity.
 * Calculates similarity based on movie overviews and genres.
 */
export function rankRecommendations(
  baseMovie: MovieContent,
  candidates: MovieContent[]
): Array<{
  movie: MovieContent;
  score: number;
  descriptionCosineSim: number;
  genreSimilarity: number;
}> {
  // 1. Build Document Corpus
  // First document is the base movie, followed by candidates
  const docs = [baseMovie, ...candidates];
  const tokenizedDocs = docs.map(doc => {
    // Over-index titles and genres slightly to give them extra weight in descriptions
    const weightedText = `${doc.title} ${doc.title} ${doc.overview} ${doc.genres.join(' ')}`;
    return tokenize(weightedText);
  });

  // 2. Compute Document Frequencies (DF) for IDF calculation
  const totalDocs = docs.length;
  const dfMap = new Map<string, number>();

  tokenizedDocs.forEach(tokens => {
    const uniqueTokens = new Set(tokens);
    uniqueTokens.forEach(token => {
      dfMap.set(token, (dfMap.get(token) || 0) + 1);
    });
  });

  // 3. Compute IDF for all terms
  const idfMap = new Map<string, number>();
  dfMap.forEach((df, term) => {
    // IDF calculation with smoothing to avoid division by zero
    idfMap.set(term, Math.log(1 + totalDocs / df));
  });

  // 4. Compute TF-IDF vectors for all documents
  const tfIdfVectors = tokenizedDocs.map(tokens => {
    const vector = new Map<string, number>();
    const totalTerms = tokens.length;
    if (totalTerms === 0) return vector;

    // Term Frequency (TF)
    const tfMap = new Map<string, number>();
    tokens.forEach(token => {
      tfMap.set(token, (tfMap.get(token) || 0) + 1);
    });

    // TF-IDF = (term count / total terms) * IDF
    tfMap.forEach((count, term) => {
      const tf = count / totalTerms;
      const idf = idfMap.get(term) || 0;
      vector.set(term, tf * idf);
    });

    return vector;
  });

  const baseVector = tfIdfVectors[0];

  // Helper function to calculate Cosine Similarity between two maps representing sparse vectors
  const getCosineSimilarity = (vecA: Map<string, number>, vecB: Map<string, number>): number => {
    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    // Accumulate elements of Vector A
    vecA.forEach((val, term) => {
      magnitudeA += val * val;
      if (vecB.has(term)) {
        dotProduct += val * (vecB.get(term) || 0);
      }
    });

    // Accumulate elements of Vector B
    vecB.forEach((val) => {
      magnitudeB += val * val;
    });

    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    return dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
  };

  // 5. Rank and Score each candidate
  const scoredCandidates = candidates.map((candidate, idx) => {
    const candidateVector = tfIdfVectors[idx + 1]; // +1 because index 0 is base movie
    
    // Description Cosine Similarity
    const cosineSim = getCosineSimilarity(baseVector, candidateVector);

    // Genre Similarity using Jaccard Similarity
    const genreSim = computeGenreJaccard(baseMovie.genres, candidate.genres);

    // Combined Score (60% description similarity, 40% genre overlap)
    // Scale slightly to make scores more intuitive for the UI (0 to 100 range)
    const compositeScore = Math.min(
      Math.max(Math.round(((cosineSim * 0.6) + (genreSim * 0.4)) * 100), 0),
      100
    );

    return {
      movie: candidate,
      score: compositeScore,
      descriptionCosineSim: parseFloat(cosineSim.toFixed(4)),
      genreSimilarity: parseFloat(genreSim.toFixed(4))
    };
  });

  // Sort descending by similarity score
  return scoredCandidates.sort((a, b) => b.score - a.score);
}
