import { useCallback } from 'react';
import { MovieRow } from '../components/MovieRow';
import { useMovieList } from '../hooks/useMovieList';
import { useMovieModal } from '../context/MovieModalContext';
import { useUserLibrary } from '../context/UserLibraryContext';
import { api } from '../services/api';
import { getMoviesByIds } from '../data/catalog';

export function FavoritesPage() {
  const { openMovie } = useMovieModal();
  const { likedIds } = useUserLibrary();

  const getLikes = useCallback(() => api.getLikes(), []);
  const getLikesFallback = useCallback(() => getMoviesByIds(likedIds), [likedIds]);
  const { movies: likes } = useMovieList(getLikes, getLikesFallback);

  if (likes.length === 0) {
    return <p className="empty-state">Todavía no le diste like a ninguna película.</p>;
  }

  return <MovieRow title="Tus favoritos" movies={likes} onSelectMovie={openMovie} />;
}
