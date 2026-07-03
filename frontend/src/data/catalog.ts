import type { Movie } from '../types';
import type { Genero } from './genres';

type CatalogRow = [string, string | null, string | null, string | null, string | null] | null;

let catalogPromise: Promise<Movie[]> | null = null;

function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'movie'
  );
}

function rowToMovie(row: CatalogRow, id: number): Movie | null {
  if (!row) return null;
  const [title, year, genre, director, wikiSlug] = row;
  return {
    id,
    title,
    posterSeed: slugify(title),
    badge: year ?? undefined,
    releaseInfo: genre ?? undefined,
    director: director ?? undefined,
    wikiSlug: wikiSlug ?? undefined,
  };
}

export function loadCatalog(): Promise<Movie[]> {
  if (!catalogPromise) {
    catalogPromise = fetch('/movies.json')
      .then((res) => res.json())
      .then((rows: CatalogRow[]) => rows.map((row, id) => rowToMovie(row, id)).filter((m): m is Movie => m !== null));
  }
  return catalogPromise;
}

const SYNOPSIS_SHARD_SIZE = 1000;
const synopsisShardCache = new Map<number, Promise<Record<number, string>>>();

function loadSynopsisShard(shardIndex: number): Promise<Record<number, string>> {
  let cached = synopsisShardCache.get(shardIndex);
  if (!cached) {
    cached = fetch(`/plots/shard-${shardIndex}.json`)
      .then((res) => (res.ok ? res.json() : {}))
      .catch(() => ({}));
    synopsisShardCache.set(shardIndex, cached);
  }
  return cached;
}

export async function getSynopsis(id: number): Promise<string | null> {
  const shard = await loadSynopsisShard(Math.floor(id / SYNOPSIS_SHARD_SIZE));
  return shard[id] ?? null;
}

export async function getCatalogSample(offset: number, count: number): Promise<Movie[]> {
  const catalog = await loadCatalog();
  const stride = Math.max(1, Math.floor(catalog.length / (count * 4)));
  const sample: Movie[] = [];
  for (let i = offset; sample.length < count && i < catalog.length; i += stride) {
    sample.push(catalog[i]);
  }
  return sample;
}

export async function searchCatalog(query: string): Promise<Movie[]> {
  const catalog = await loadCatalog();
  const q = query.toLowerCase();
  return catalog.filter(
    (movie) =>
      movie.title.toLowerCase().includes(q) ||
      movie.director?.toLowerCase().includes(q) ||
      movie.releaseInfo?.toLowerCase().includes(q),
  );
}

// Devuelve las películas cuyo género (releaseInfo) coincide con alguna palabra
// clave del género elegido. Usado por los filtros por género en la búsqueda.
export async function searchByGenre(genero: Genero): Promise<Movie[]> {
  const catalog = await loadCatalog();
  return catalog.filter((movie) => {
    const g = movie.releaseInfo?.toLowerCase();
    if (!g) return false;
    return genero.keywords.some((kw) => g.includes(kw));
  });
}

export async function getMoviesByIds(ids: number[]): Promise<Movie[]> {
  const catalog = await loadCatalog();
  const byId = new Map(catalog.map((movie) => [movie.id, movie]));
  return ids.map((id) => byId.get(id)).filter((movie): movie is Movie => movie !== undefined);
}

// Mismo criterio que "Algoritmo de recomendaciones" en el README: +5 por director
// coincidente con algún like, +2 por género coincidente. Si no hay likes, muestra
// una muestra general del catálogo.
export async function getRecommendations(likedIds: number[], count: number): Promise<Movie[]> {
  const catalog = await loadCatalog();
  if (likedIds.length === 0) return getCatalogSample(20000, count);

  const likedSet = new Set(likedIds);
  const likedMovies = catalog.filter((movie) => likedSet.has(movie.id));

  const directores = new Set(likedMovies.map((movie) => movie.director).filter(Boolean));
  const generos = new Set(likedMovies.map((movie) => movie.releaseInfo).filter(Boolean));

  const puntuadas = catalog
    .filter((movie) => !likedSet.has(movie.id))
    .map((movie) => {
      let score = 0;
      if (movie.director && directores.has(movie.director)) score += 5;
      if (movie.releaseInfo && generos.has(movie.releaseInfo)) score += 2;
      return { movie, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, count);

  if (puntuadas.length === 0) return getCatalogSample(20000, count);
  return puntuadas.map((entry) => entry.movie);
}
