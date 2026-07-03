import { useCallback } from 'react';
import { MovieRow } from '../components/MovieRow';
import { useMovieList } from '../hooks/useMovieList';
import { useMovieModal } from '../context/MovieModalContext';
import { useUserLibrary } from '../context/UserLibraryContext';
import { useAccount } from '../context/AccountContext';
import { api } from '../services/api';
import { getMoviesByIds, getRecommendations } from '../data/catalog';

export function HomePage() {
  const { openMovie } = useMovieModal();
  const { watchLaterIds, likedIds } = useUserLibrary();
  const { limiteRecomendaciones } = useAccount();

  const getWatchLater = useCallback(() => api.getWatchLater(), []);
  const getWatchLaterFallback = useCallback(() => getMoviesByIds(watchLaterIds), [watchLaterIds]);

  const getRecommendationsRemote = useCallback(() => api.getRecommendations(), []);
  const getRecommendationsFallback = useCallback(
    () => getRecommendations(likedIds, limiteRecomendaciones),
    [likedIds, limiteRecomendaciones],
  );

  const { movies: watchLater } = useMovieList(getWatchLater, getWatchLaterFallback);
  const { movies: recommendations } = useMovieList(getRecommendationsRemote, getRecommendationsFallback);

  return (
    <>
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
