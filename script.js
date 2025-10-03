const TMDB_FN = '/.netlify/functions/tmdb';

const genres = [
  { id: 878, name: 'AI' },
  { id: 528, name: 'Food' },
  { id: 18, name: 'Drama' },
  { id: 27, name: 'Horror' },
  { id: 35, name: 'Comedy' },
];

const imageBase = 'https://image.tmdb.org/t/p/w500';

async function tmdbFetch(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${TMDB_FN}?${qs}`);
  if (!res.ok) throw new Error('Network response not ok');
  return res.json();
}

const rowsContainer = document.getElementById('rows');
const rowTemplate = document.getElementById('row-template');
const posterTemplate = document.getElementById('poster-template');

function createRow(title) {
  const clone = rowTemplate.content.cloneNode(true);
  clone.querySelector('.row-title').textContent = title;
  return clone;
}

function createPosterCard(movie) {
  const clone = posterTemplate.content.cloneNode(true);
  const card = clone.querySelector('.poster-card');
  const img = clone.querySelector('.poster-img');
  const overlayTitle = clone.querySelector('.poster-title');
  const previewContainer = clone.querySelector('.poster-preview');

  img.src = movie.poster_path ? (imageBase + movie.poster_path) : '';
  img.alt = movie.title || movie.name;
  overlayTitle.textContent = movie.title || movie.name;

  let previewIframe = null;
  let fetchedPreview = false;

  card.addEventListener('mouseenter', async () => {
    if (fetchedPreview) return;
    fetchedPreview = true;
    try {
      const data = await tmdbFetch({ type: 'videos', movie_id: movie.id });
      const vids = data.results || [];
      const trailer = vids.find(v => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')) || vids.find(v => v.site === 'YouTube');
      if (trailer) {
        const key = trailer.key;
        previewIframe = document.createElement('iframe');
        previewIframe.className = 'preview-iframe';
        previewIframe.src = `https://www.youtube.com/embed/${key}?autoplay=1&mute=1&controls=0&playsinline=1&rel=0&showinfo=0`;
        previewIframe.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture');
        previewContainer.appendChild(previewIframe);
      }
    } catch (err) {
      console.warn('preview fetch failed', err);
    }
  });

  card.addEventListener('mouseleave', () => {
    if (previewContainer && previewContainer.firstChild) {
      previewContainer.removeChild(previewContainer.firstChild);
    }
  });

  card.addEventListener('click', () => {
    setHeroByMovie(movie);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  return clone;
}

const heroVideoEl = document.getElementById('hero-video');
const heroTitle = document.getElementById('hero-title');
const heroOverview = document.getElementById('hero-overview');

async function setHeroByMovie(movie) {
  if (!movie) return;
  heroTitle.textContent = movie.title || movie.name;
  heroOverview.textContent = movie.overview || '';

  try {
    const data = await tmdbFetch({ type: 'videos', movie_id: movie.id });
    const vids = data.results || [];
    const trailer = vids.find(v => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')) || vids.find(v => v.site === 'YouTube');

    if (trailer) {
      const key = trailer.key;
      heroVideoEl.innerHTML = `
        <iframe
          src="https://www.youtube.com/embed/${key}?autoplay=1&mute=1&controls=0&loop=1&playlist=${key}&rel=0&showinfo=0&modestbranding=1"
          frameborder="0"
          allow="autoplay; encrypted-media; picture-in-picture"
          allowfullscreen
          style="width:100%;height:100%;position:absolute;top:0;left:0;">
        </iframe>
      `;
      return;
    }
  } catch (err) {
    console.warn('Failed to get hero trailer', err);
  }

  if (movie.backdrop_path) {
    heroVideoEl.innerHTML = `
      <img src="${imageBase.replace('/w500','/original') + movie.backdrop_path}" alt="${movie.title}" style="width:100%;height:100%;object-fit:cover;position:absolute;top:0;left:0;"/>
    `;
  } else {
    heroVideoEl.innerHTML = '';
  }
}

async function init() {
  for (const g of genres) {
    try {
      const data = await tmdbFetch({ type: 'discover', genre: g.id, page: 1 });
      const movies = data.results || [];
      if (!movies.length) continue;
      const rowClone = createRow(g.name);
      const posters = rowClone.querySelector('.row-posters');

      movies.forEach(m => {
        const cardClone = createPosterCard(m);
        posters.appendChild(cardClone);
      });

      rowsContainer.appendChild(rowClone);
    } catch (err) {
      console.error('Failed to fetch genre', g, err);
    }
  }

  try {
    const aiData = await tmdbFetch({ type: 'discover', genre: 878, page: 1 });
    const aiMovies = (aiData.results || []);
    if (aiMovies.length) {
      setHeroByMovie(aiMovies[0]);
    } else {
      const firstPoster = rowsContainer.querySelector('.poster-img');
      if (firstPoster && firstPoster.src) {
        heroTitle.textContent = 'Featured';
      }
    }
  } catch (err) {
    console.warn('hero init failed', err);
  }
}

const loginBtn = document.getElementById('loginBtn');
const loginModal = document.getElementById('loginModal');
const closeModalBtn = document.getElementById('closeModal');
const modalBackdrop = document.getElementById('modalBackdrop');

function showModal() {
  loginModal.setAttribute('aria-hidden', 'false');
}
function hideModal() {
  loginModal.setAttribute('aria-hidden', 'true');
}
loginBtn.addEventListener('click', showModal);
closeModalBtn.addEventListener('click', hideModal);
modalBackdrop.addEventListener('click', hideModal);

window.handleLoginSubmit = function() {
  const email = document.getElementById('email').value;
  hideModal();
  alert(`Signed in (UI-only)\nEmail: ${email}`);
};

document.addEventListener('DOMContentLoaded', init);
