import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MovieRow } from '../components/MovieRow';
import { useMovieList } from '../hooks/useMovieList';
import { useMovieModal } from '../context/MovieModalContext';
import { useUserLibrary } from '../context/UserLibraryContext';
import { useAccount } from '../context/AccountContext';
import { api } from '../services/api';
import { getMoviesByIds, getRecommendations } from '../data/catalog';

// Mínimo de recomendaciones a mostrar en la pantalla principal.
const MIN_RECOMENDACIONES = 8;

export function HomePage() {
  const { openMovie } = useMovieModal();
  const { watchLaterIds, likedIds } = useUserLibrary();
  const { limiteRecomendaciones } = useAccount();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const buscar = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) navigate(`/buscar?q=${encodeURIComponent(trimmed)}`);
  };

  const cantidadRecomendaciones = Math.max(MIN_RECOMENDACIONES, limiteRecomendaciones);

  const getWatchLater = useCallback(() => api.getWatchLater(), []);
  const getWatchLaterFallback = useCallback(() => getMoviesByIds(watchLaterIds), [watchLaterIds]);

  const getRecommendationsRemote = useCallback(() => api.getRecommendations(), []);
  const getRecommendationsFallback = useCallback(
    () => getRecommendations(likedIds, cantidadRecomendaciones),
    [likedIds, cantidadRecomendaciones],
  );

  const { movies: watchLater } = useMovieList(getWatchLater, getWatchLaterFallback);
  const { movies: recommendations } = useMovieList(getRecommendationsRemote, getRecommendationsFallback);

  return (
    <>
      <form className="home-search" onSubmit={buscar}>
        <input
          className="search-input"
          type="search"
          placeholder="Buscar por título, director, género..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" className="home-search-button">
          Buscar
        </button>
      </form>

      {watchLater.length > 0 ? (
        <MovieRow title="Ver más tarde" movies={watchLater} onSelectMovie={openMovie} />
      ) : (
        <section className="movie-row">
          <h2 className="movie-row-title">Ver más tarde</h2>
          <p className="empty-state">
            Todavía no agregaste ninguna película. Buscá una y usá "Ver más tarde".
          </p>
        </section>
      )}
      <MovieRow title="Te recomendamos:" movies={recommendations} onSelectMovie={openMovie} />
    </>
  );
}
