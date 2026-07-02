import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Movie } from '../types';

interface MovieModalContextValue {
  selectedMovie: Movie | null;
  openMovie: (movie: Movie) => void;
  closeMovie: () => void;
}

const MovieModalContext = createContext<MovieModalContextValue | null>(null);

export function MovieModalProvider({ children }: { children: ReactNode }) {
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

  const value = useMemo(
    () => ({
      selectedMovie,
      openMovie: (movie: Movie) => setSelectedMovie(movie),
      closeMovie: () => setSelectedMovie(null),
    }),
    [selectedMovie],
  );

  return <MovieModalContext.Provider value={value}>{children}</MovieModalContext.Provider>;
}

export function useMovieModal() {
  const ctx = useContext(MovieModalContext);
  if (!ctx) throw new Error('useMovieModal must be used within a MovieModalProvider');
  return ctx;
}
