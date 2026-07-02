import type { Movie } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API error ${response.status} on ${path}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  getWatchLater: () => request<Movie[]>('/watch-later'),
  getRecommendations: () => request<Movie[]>('/recommendations'),
  getLikes: () => request<Movie[]>('/likes'),
  search: (query: string) => request<Movie[]>(`/search?q=${encodeURIComponent(query)}`),
  likeMovie: (id: number) => request<void>(`/movies/${id}/like`, { method: 'POST' }),
  addToWatchLater: (id: number) => request<void>(`/movies/${id}/watch-later`, { method: 'POST' }),
};
