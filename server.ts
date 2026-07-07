/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { rankRecommendations, MovieContent } from './src/lib/ml.js';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

/**
 * Helper to fetch from OMDb
 */
async function fetchFromOmdb(params: Record<string, string> = {}) {
  const apiKey = process.env.OMDB_API_KEY;
  if (!apiKey || apiKey === 'YOUR_OMDB_API_KEY') {
    throw new Error('OMDB_API_KEY is missing. Please configure it in your Secrets.');
  }

  const queryParams = new URLSearchParams({
    apikey: apiKey,
    ...params
  });

  const url = `https://www.omdbapi.com/?${queryParams}`;
  const response = await fetch(url);
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('OMDb API key is invalid. Please check your Secrets panel.');
    }
    const errorText = await response.text();
    throw new Error(`OMDb API error: ${response.status} ${errorText}`);
  }
  
  const data = await response.json();
  if (data.Response === 'False' && data.Error !== 'Movie not found!') {
    throw new Error(`OMDb error: ${data.Error}`);
  }
  return data;
}

/**
 * Helper to make a Groq chat request
 */
async function fetchFromGroq(messages: Array<{ role: string; content: string }>, responseFormatJson = false) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'YOUR_GROQ_API_KEY') {
    throw new Error('GROQ_API_KEY is missing. Please configure it in your Secrets.');
  }

  const body: Record<string, any> = {
    model: 'llama-3.3-70b-versatile',
    messages,
    temperature: 0.7,
    max_tokens: 1500,
  };

  if (responseFormatJson) {
    body.response_format = { type: 'json_object' };
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API error: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  return result.choices[0].message.content;
}

/**
 * Format raw OMDb movie to our internal clean structure
 */
function formatMovie(omdbMovie: any): MovieContent & {
  poster_path: string;
  backdrop_path: string;
  vote_average: number;
  release_date: string;
} {
  return {
    id: omdbMovie.imdbID || Math.random().toString(),
    title: omdbMovie.Title,
    overview: omdbMovie.Plot && omdbMovie.Plot !== 'N/A' ? omdbMovie.Plot : 'No description available.',
    genres: omdbMovie.Genre && omdbMovie.Genre !== 'N/A' ? omdbMovie.Genre.split(', ') : [],
    poster_path: omdbMovie.Poster && omdbMovie.Poster !== 'N/A' ? omdbMovie.Poster : '',
    backdrop_path: '', // OMDb lacks backdrops
    vote_average: parseFloat(omdbMovie.imdbRating) || 0,
    release_date: omdbMovie.Year || 'Unknown'
  };
}

// ================= API ENDPOINTS =================

// 1. Config Check Endpoint
app.get('/api/config', async (req, res) => {
  let hasGroqKey = !!process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'YOUR_GROQ_API_KEY';
  let hasOmdbKey = !!process.env.OMDB_API_KEY && process.env.OMDB_API_KEY !== 'YOUR_OMDB_API_KEY';

  if (hasOmdbKey) {
    try {
      const url = `https://www.omdbapi.com/?apikey=${process.env.OMDB_API_KEY}&s=inception`;
      const response = await fetch(url);
      if (response.status === 401) {
        hasOmdbKey = false;
      } else {
        const data = await response.json();
        if (data.Response === 'False' && data.Error === 'Invalid API key!') {
          hasOmdbKey = false;
        }
      }
    } catch (e) {
      // Ignore validation errors, assume key might be valid but network failed
    }
  }

  res.json({
    hasGroqKey,
    hasOmdbKey
  });
});

// 2. Movie Search Autocomplete
app.get('/api/search', async (req, res) => {
  try {
    const query = req.query.query as string;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const data = await fetchFromOmdb({ s: query });
    if (data.Response === 'False' || !data.Search) {
      return res.json([]);
    }
    
    const formattedMovies = data.Search.slice(0, 10).map((m: any) => ({
      id: m.imdbID,
      title: m.Title,
      overview: '', // Search endpoint doesn't return plot
      genres: [],
      poster_path: m.Poster !== 'N/A' ? m.Poster : '',
      backdrop_path: '',
      vote_average: 0,
      release_date: m.Year
    }));
    
    res.json(formattedMovies);
  } catch (err: any) {
    if (!err.message.includes('API key is invalid') && !err.message.includes('API_KEY is missing')) {
      console.error('Search error:', err.message);
    }
    res.status(500).json({ error: err.message });
  }
});

// 3. Recommendation Pipeline (ML + Groq LLM)
app.post('/api/recommend', async (req, res) => {
  try {
    const { movieTitle } = req.body;
    if (!movieTitle) {
      return res.status(400).json({ error: 'movieTitle is required' });
    }

    let targetTitle = movieTitle;

    const isNaturalLanguage = movieTitle.split(' ').length > 2 &&
      (/(?:recommend|suggest|movies|thriller|action|sci-fi|drama|comedy|best|horror|like|from|year|dark|psychological)/i.test(movieTitle));

    if (isNaturalLanguage && process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'YOUR_GROQ_API_KEY') {
      console.log(`Query looks like natural language: "${movieTitle}". Extracting representative movie anchor...`);
      try {
        const parsePrompt = `You are an expert movie query preprocessor. The user wants recommendations based on this natural language request: "${movieTitle}".
Identify and return ONE single real-world, famous movie title that perfectly matches or serves as the ideal anchor/reference for this query.
Example: "Recommend movies like Interstellar" should return "Interstellar".
Example: "Suggest a dark psychological thriller" should return "Shutter Island".

You MUST respond strictly in a valid JSON format with this exact schema:
{
  "extractedTitle": "Single Movie Title"
}`;
        const groqParse = await fetchFromGroq([
          { role: 'system', content: 'You are a precise JSON response generator.' },
          { role: 'user', content: parsePrompt }
        ], true);
        const parsed = JSON.parse(groqParse);
        if (parsed && parsed.extractedTitle) {
          targetTitle = parsed.extractedTitle;
        }
      } catch (err: any) {
        console.error('Error pre-processing natural language query:', err.message);
      }
    }

    console.log(`Searching OMDb for base movie anchor: "${targetTitle}"`);
    const searchData = await fetchFromOmdb({ t: targetTitle, plot: 'full' });
    if (searchData.Response === 'False') {
      return res.status(404).json({ error: `Movie anchor "${targetTitle}" not found.` });
    }

    const baseMovie = formatMovie(searchData);

    // OMDb doesn't have a recommendations endpoint. Let's use Groq to generate candidates!
    console.log(`Generating candidates via Groq for: "${baseMovie.title}"`);
    let candidateTitles: string[] = [];
    try {
      const candidatePrompt = `You are MovieMind AI. List 15 real-world movies that are highly similar or highly recommended for fans of "${baseMovie.title}".
Respond STRICTLY with a valid JSON object matching this schema:
{ "titles": ["Movie 1", "Movie 2", ...] }`;
      
      const candidatesJson = await fetchFromGroq([{role: 'user', content: candidatePrompt}], true);
      const parsed = JSON.parse(candidatesJson);
      candidateTitles = parsed.titles || [];
    } catch(e) {
      candidateTitles = ["Inception", "The Matrix", "Blade Runner 2049", "Arrival", "Tenet", "Gravity"];
    }

    console.log(`Fetching ${candidateTitles.length} candidates from OMDb...`);
    const candidatePromises = candidateTitles.map(t => fetchFromOmdb({ t, plot: 'short' }).catch(() => null));
    const rawCandidates = await Promise.all(candidatePromises);
    
    const candidates = rawCandidates
      .filter((c: any) => c && c.Response !== 'False' && c.imdbID !== baseMovie.id)
      .map(formatMovie);

    if (candidates.length === 0) {
      return res.status(404).json({ error: 'No candidate movies found to recommend.' });
    }

    console.log(`Running ML recommendation pipeline on ${candidates.length} candidates...`);
    const rankedResults = rankRecommendations(baseMovie, candidates);
    const topRanked = rankedResults.slice(0, 6);

    console.log('Requesting explanations from Groq...');
    const movieDetailsString = topRanked.map((r, i) => 
      `${i + 1}. "${r.movie.title}" (Genres: ${r.movie.genres.join(', ')}). Description: ${r.movie.overview}`
    ).join('\n\n');

    const systemPrompt = `You are MovieMind AI Pro, an expert cinematic recommendations intelligence.
You will be provided a base movie that a user enjoyed, and a list of 6 similar movies ranked by a machine learning model.
Write a highly compelling, personalized explanation (2-3 sentences) for EACH of the 6 recommended movies.

You MUST respond strictly in a valid JSON format with the following schema:
{
  "recommendations": [
    {
      "movieId": "tt1234567",
      "explanation": "Compelling explanation connecting this movie back to the base movie..."
    }
  ]
}`;

    const userPrompt = `Base Movie enjoyed by the user:
"${baseMovie.title}" (Genres: ${baseMovie.genres.join(', ')}). Description: ${baseMovie.overview}

Top 6 Recommended Movies ranked by ML Engine:
${movieDetailsString}`;

    let explanationJson: any = { recommendations: [] };
    try {
      const groqResponse = await fetchFromGroq([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ], true);
      explanationJson = JSON.parse(groqResponse);
    } catch (e: any) {
      console.error('Groq explanation error, falling back to heuristic explanations:', e.message);
      explanationJson = {
        recommendations: topRanked.map(r => ({
          movieId: r.movie.id,
          explanation: `A stellar match for "${baseMovie.title}". Both films share compelling themes in ${r.movie.genres.slice(0, 2).join(' & ')}.`
        }))
      };
    }

    const finalRecommendations = topRanked.map(item => {
      const expMatch = explanationJson.recommendations?.find((e: any) => e.movieId === item.movie.id);
      return {
        ...item,
        explanation: expMatch ? expMatch.explanation : `An exceptional recommendation for fans of ${baseMovie.title}, showcasing deep thematic resonance.`
      };
    });

    res.json({
      baseMovie,
      recommendations: finalRecommendations
    });
  } catch (err: any) {
    if (!err.message.includes('API key is invalid') && !err.message.includes('API_KEY is missing')) {
      console.error('Recommendation route error:', err.message);
    }
    res.status(500).json({ error: err.message });
  }
});

// 4. Mood-Based Recommendations
app.post('/api/mood', async (req, res) => {
  try {
    const { mood } = req.body;
    if (!mood) {
      return res.status(400).json({ error: 'Mood is required' });
    }

    const systemPrompt = `You are MovieMind AI Pro. The user is feeling: "${mood}".
Generate exactly 6 real-world movie recommendations that perfectly match this mood.
For each movie, write a brief explanation (1-2 sentences) of why it fits this mood.

You MUST respond strictly in a valid JSON format with this exact schema:
{
  "recommendations": [
    {
      "title": "Exact Movie Title",
      "moodExplanation": "Why this movie fits the mood..."
    }
  ]
}`;

    const userPrompt = `Recommend 6 movies for mood: "${mood}".`;
    const groqResponse = await fetchFromGroq([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], true);

    const parsedResponse = JSON.parse(groqResponse);
    const recommendedTitlesList = parsedResponse.recommendations || [];

    const movieResults = await Promise.all(
      recommendedTitlesList.map(async (rec: any) => {
        try {
          const search = await fetchFromOmdb({ t: rec.title, plot: 'short' });
          if (search.Response !== 'False') {
            return {
              movie: formatMovie(search),
              explanation: rec.moodExplanation
            };
          }
          return null;
        } catch (err) {
          return null;
        }
      })
    );

    const filteredResults = movieResults.filter(Boolean);
    res.json({ mood, recommendations: filteredResults });
  } catch (err: any) {
    if (!err.message.includes('API key is invalid') && !err.message.includes('API_KEY is missing')) {
      console.error('Mood recommendations error:', err.message);
    }
    res.status(500).json({ error: err.message });
  }
});

// 5. AI Movie Assistant
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const lastUserMessage = messages[messages.length - 1]?.content || '';
    let omdbMovieContext = '';

    const movieMatch = lastUserMessage.match(/(?:about|for|like|review|details on)\s+([a-zA-Z0-9\s:']{3,30})/i);
    if (movieMatch && movieMatch[1]) {
      const extractedTitle = movieMatch[1].trim();
      try {
        const searchData = await fetchFromOmdb({ t: extractedTitle, plot: 'short' });
        if (searchData.Response !== 'False') {
          omdbMovieContext = `\n\n[CONTEXT: Here is real-time OMDb data for "${searchData.Title}" which might be relevant to the user's inquiry:
Title: ${searchData.Title}
Release Date: ${searchData.Year}
Rating: ${searchData.imdbRating}/10
Overview: ${searchData.Plot}
Genres: ${searchData.Genre}]`;
        }
      } catch (e) {}
    }

    const systemPrompt = `You are MovieMind AI Pro Assistant, a world-class cinephile, film historian, and conversational recommendation bot.
You provide intelligent, enthusiastic, and sophisticated answers to movie questions.
Never break character. Keep answers insightful, beautifully structured, and concise.
If movie context is provided in the chat input, use it to ensure absolute factual accuracy.
Use markdown format to structure your response cleanly.`;

    const processedMessages = messages.map((msg, index) => {
      if (index === messages.length - 1 && msg.role === 'user' && omdbMovieContext) {
        return {
          ...msg,
          content: msg.content + omdbMovieContext
        };
      }
      return msg;
    });

    const responseText = await fetchFromGroq([
      { role: 'system', content: systemPrompt },
      ...processedMessages
    ]);

    res.json({ message: responseText });
  } catch (err: any) {
    if (!err.message.includes('API key is invalid') && !err.message.includes('API_KEY is missing')) {
      console.error('Chat error:', err.message);
    }
    res.status(500).json({ error: err.message });
  }
});

// 6. Movie Comparison Engine
app.post('/api/compare', async (req, res) => {
  try {
    const { movie1, movie2 } = req.body;
    if (!movie1 || !movie2) {
      return res.status(400).json({ error: 'Both movie1 and movie2 are required' });
    }

    const [search1, search2] = await Promise.all([
      fetchFromOmdb({ t: movie1, plot: 'full' }).catch(() => null),
      fetchFromOmdb({ t: movie2, plot: 'full' }).catch(() => null)
    ]);

    if (!search1 || search1.Response === 'False') {
      return res.status(404).json({ error: `Movie "${movie1}" not found.` });
    }
    if (!search2 || search2.Response === 'False') {
      return res.status(404).json({ error: `Movie "${movie2}" not found.` });
    }

    const m1 = formatMovie(search1);
    const m2 = formatMovie(search2);

    const systemPrompt = `You are MovieMind AI Pro, an elite film critic and narrative theorist.
Produce an extensive, professional, side-by-side comparative analysis of these two films.

You MUST respond strictly in a valid JSON format with this exact schema:
{
  "narrative": {
    "title": "Themes & Narrative",
    "comparison": "Side-by-side analysis of how they handle story and thematic depth..."
  },
  "visuals": {
    "title": "Cinematography & Visual Style",
    "comparison": "Visual comparisons, colors, editing tempos, camera choices..."
  },
  "scientificRealism": {
    "title": "Tone & Thematic Realism",
    "comparison": "Analyzing their tone, factual grounding, and emotional weight..."
  },
  "reception": {
    "title": "Directorial Style & Consensus",
    "comparison": "Comparing directorial signatures and critical perception..."
  },
  "verdict": {
    "title": "The Ultimate Verdict",
    "comparison": "A clear, beautifully written summarizing recommendation..."
  }
}`;

    const userPrompt = `Compare:
Movie A: "${m1.title}" (${m1.release_date}). Overview: ${m1.overview}. Genres: ${m1.genres.join(', ')}
Movie B: "${m2.title}" (${m2.release_date}). Overview: ${m2.overview}. Genres: ${m2.genres.join(', ')}`;

    const groqResponse = await fetchFromGroq([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], true);

    const parsedComparison = JSON.parse(groqResponse);

    res.json({
      movieA: m1,
      movieB: m2,
      comparison: parsedComparison
    });
  } catch (err: any) {
    if (!err.message.includes('API key is invalid') && !err.message.includes('API_KEY is missing')) {
      console.error('Comparison error:', err.message);
    }
    res.status(500).json({ error: err.message });
  }
});

// 7. Trailer Summary Endpoint
app.post('/api/trailer-summary', async (req, res) => {
  try {
    const { movieId, movieTitle } = req.body;
    if (!movieId) {
      return res.status(400).json({ error: 'movieId is required' });
    }

    const systemPrompt = `You are MovieMind AI Pro, a cinematic preview annotator.
Write a fast-paced, high-impact description/summary (3 sentences) of what to expect from the visual style and preview of this movie.
Highlight visual cues, musical score, pacing, and hooks from the movie's genre and themes.

Structure the response strictly as a valid JSON object with the following schema:
{
  "summary": "Hyped, high-impact 3-sentence visual summary of the movie's cinematic vibe...",
  "keyHighlights": ["Highlight 1", "Highlight 2", "Highlight 3"]
}`;

    const userPrompt = `Movie: "${movieTitle}"`;

    const groqResponse = await fetchFromGroq([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], true);

    const parsedSummary = JSON.parse(groqResponse);

    res.json({
      movieId,
      movieTitle,
      trailerUrl: '',
      trailerKey: '', // OMDb does not provide YouTube trailer keys
      summary: parsedSummary.summary || 'Prepare yourself for an unforgettable visual journey filled with breathtaking tension and spectacular direction.',
      keyHighlights: parsedSummary.keyHighlights || ['Sweeping cinematography', 'Stellar cast ensemble', 'Haunting audio soundtrack']
    });
  } catch (err: any) {
    if (!err.message.includes('API key is invalid') && !err.message.includes('API_KEY is missing')) {
      console.error('Trailer summary error:', err.message);
    }
    res.status(500).json({ error: err.message });
  }
});

// ================= VITE OR PRODUCTION MIDDLEWARE =================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MovieMind AI Pro server boot complete. Running on http://localhost:${PORT}`);
  });
}

startServer();
