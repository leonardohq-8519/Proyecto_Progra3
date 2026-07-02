import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

const LIKES_KEY = 'streaming.likes';
const WATCH_LATER_KEY = 'streaming.watchLater';

function readIds(key: string): number[] {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function toggleId(ids: number[], id: number): number[] {
  return ids.includes(id) ? ids.filter((existing) => existing !== id) : [...ids, id];
}

interface UserLibraryContextValue {
  likedIds: number[];
  watchLaterIds: number[];
  isLiked: (id: number) => boolean;
  isWatchLater: (id: number) => boolean;
  toggleLike: (id: number) => void;
  toggleWatchLater: (id: number) => void;
}

const UserLibraryContext = createContext<UserLibraryContextValue | null>(null);

export function UserLibraryProvider({ children }: { children: ReactNode }) {
  const [likedIds, setLikedIds] = useState<number[]>(() => readIds(LIKES_KEY));
  const [watchLaterIds, setWatchLaterIds] = useState<number[]>(() => readIds(WATCH_LATER_KEY));

  useEffect(() => {
    localStorage.setItem(LIKES_KEY, JSON.stringify(likedIds));
  }, [likedIds]);

  useEffect(() => {
    localStorage.setItem(WATCH_LATER_KEY, JSON.stringify(watchLaterIds));
  }, [watchLaterIds]);

  const value = useMemo<UserLibraryContextValue>(
    () => ({
      likedIds,
      watchLaterIds,
      isLiked: (id) => likedIds.includes(id),
      isWatchLater: (id) => watchLaterIds.includes(id),
      toggleLike: (id) => setLikedIds((prev) => toggleId(prev, id)),
      toggleWatchLater: (id) => setWatchLaterIds((prev) => toggleId(prev, id)),
    }),
    [likedIds, watchLaterIds],
  );

  return <UserLibraryContext.Provider value={value}>{children}</UserLibraryContext.Provider>;
}

export function useUserLibrary() {
  const ctx = useContext(UserLibraryContext);
  if (!ctx) throw new Error('useUserLibrary must be used within a UserLibraryProvider');
  return ctx;
}
