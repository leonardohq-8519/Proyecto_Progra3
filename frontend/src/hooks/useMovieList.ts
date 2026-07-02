import { useEffect, useState } from 'react';
import type { Movie } from '../types';

export function useMovieList(fetcher: () => Promise<Movie[]>, fallbackFetcher: () => Promise<Movie[]>) {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetcher()
      .then((data) => {
        if (!cancelled) {
          setMovies(data);
          setIsLive(true);
        }
      })
      .catch(() => {
        // Backend no disponible todavía: mostramos una muestra del catálogo real.
        fallbackFetcher()
          .then((data) => {
            if (!cancelled) setMovies(data);
          })
          .catch(() => {});
      });

    return () => {
      cancelled = true;
    };
  }, [fetcher, fallbackFetcher]);

  return { movies, isLive };
}
