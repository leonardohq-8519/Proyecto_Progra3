interface WikiSummary {
  thumbnail?: { source: string };
  originalimage?: { source: string };
}

interface WikiPoster {
  thumbnail: string | null;
  original: string | null;
}

const cache = new Map<string, Promise<WikiPoster>>();

async function fetchSummary(wikiSlug: string): Promise<WikiPoster> {
  try {
    const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${wikiSlug}`);
    if (!response.ok) return { thumbnail: null, original: null };
    const data: WikiSummary = await response.json();
    return {
      thumbnail: data.thumbnail?.source ?? null,
      original: data.originalimage?.source ?? null,
    };
  } catch {
    return { thumbnail: null, original: null };
  }
}

export function getWikipediaPoster(wikiSlug: string): Promise<WikiPoster> {
  let cached = cache.get(wikiSlug);
  if (!cached) {
    cached = fetchSummary(wikiSlug);
    cache.set(wikiSlug, cached);
  }
  return cached;
}
