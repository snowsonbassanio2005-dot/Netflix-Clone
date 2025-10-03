// netlify/functions/tmdb.js
// A lightweight Netlify Function that proxies requests to TMDb and keeps the API key private.
// Make sure you set TMDB_API_KEY in your Netlify site environment variables.

exports.handler = async function(event, context) {
    try {
      const TMDB_KEY = process.env.TMDB_API_KEY;
      if (!TMDB_KEY) {
        return {
          statusCode: 500,
          body: JSON.stringify({ message: 'TMDB_API_KEY is not configured in environment variables.' }),
        };
      }
  
      const urlParams = new URLSearchParams(event.queryStringParameters || {});
      const type = urlParams.get('type') || 'discover';
  
      // Build TMDb URL based on 'type' param
      let tmdbUrl = 'https://api.themoviedb.org/3/';
      const fetchParams = new URLSearchParams({ api_key: TMDB_KEY, language: 'en-US' });
  
      if (type === 'discover') {
        // expects 'genre' and optional 'page'
        const genre = urlParams.get('genre');
        const page = urlParams.get('page') || '1';
        fetchParams.set('with_genres', genre || '');
        fetchParams.set('page', page);
        // sort by popularity by default
        fetchParams.set('sort_by', 'popularity.desc');
        tmdbUrl += `discover/movie?${fetchParams.toString()}`;
      } else if (type === 'videos') {
        // expects movie_id
        const movieId = urlParams.get('movie_id');
        if (!movieId) return { statusCode: 400, body: JSON.stringify({ message: 'movie_id required' }) };
        tmdbUrl += `movie/${encodeURIComponent(movieId)}/videos?${fetchParams.toString()}`;
      } else if (type === 'movie') {
        // expects movie_id, returns movie details
        const movieId = urlParams.get('movie_id');
        if (!movieId) return { statusCode: 400, body: JSON.stringify({ message: 'movie_id required' }) };
        tmdbUrl += `movie/${encodeURIComponent(movieId)}?${fetchParams.toString()}`;
      } else {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: 'invalid type' }),
        };
      }
  
      const res = await fetch(tmdbUrl);
      if (!res.ok) {
        const text = await res.text();
        return { statusCode: res.status, body: text };
      }
      const data = await res.json();
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      };
    } catch (err) {
      return {
        statusCode: 500,
        body: JSON.stringify({ message: err.message || 'Server error' }),
      };
    }
  };
  