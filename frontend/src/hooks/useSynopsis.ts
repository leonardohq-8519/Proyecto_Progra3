import { useEffect, useState } from 'react';
import { getSynopsis } from '../data/catalog';

// undefined = cargando, null = no hay sinopsis para esta película, string = texto real.
export function useSynopsis(movieId: number): string | null | undefined {
  const [synopsis, setSynopsis] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    setSynopsis(undefined);
    let cancelled = false;

    getSynopsis(movieId).then((text) => {
      if (!cancelled) setSynopsis(text);
    });

    return () => {
      cancelled = true;
    };
  }, [movieId]);

  return synopsis;
}
