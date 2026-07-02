import { useEffect, useState } from 'react';
import type { Movie } from '../types';
import { getWikipediaPoster } from '../services/wikipedia';

interface PosterSize {
  width: number;
  height: number;
}

export function usePosterUrl(
  movie: Movie,
  size: PosterSize,
  variant: 'thumbnail' | 'original' = 'thumbnail',
): string {
  const placeholder = `https://picsum.photos/seed/${movie.posterSeed}/${size.width}/${size.height}`;
  const [url, setUrl] = useState(placeholder);

  useEffect(() => {
    setUrl(placeholder);
    if (!movie.wikiSlug) return;

    let cancelled = false;
    getWikipediaPoster(movie.wikiSlug).then((poster) => {
      const resolved = variant === 'original' ? poster.original : poster.thumbnail;
      if (!cancelled && resolved) setUrl(resolved);
    });

    return () => {
      cancelled = true;
    };
  }, [movie.wikiSlug, placeholder, variant]);

  return url;
}
