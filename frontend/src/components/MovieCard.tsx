import type { Movie } from '../types';
import { usePosterUrl } from '../hooks/usePosterUrl';

interface MovieCardProps {
  movie: Movie;
  onSelect: (movie: Movie) => void;
}

export function MovieCard({ movie, onSelect }: MovieCardProps) {
  const posterUrl = usePosterUrl(movie, { width: 300, height: 450 });

  return (
    <button className="movie-card" onClick={() => onSelect(movie)}>
      <img className="movie-card-poster" src={posterUrl} alt={movie.title} loading="lazy" />
      <div className="movie-card-overlay">
        <span className="movie-card-title">{movie.title}</span>
        <div className="movie-card-meta">
          {movie.badge && <span className="movie-card-badge">{movie.badge}</span>}
          {movie.releaseInfo && <span className="movie-card-info">{movie.releaseInfo}</span>}
        </div>
      </div>
    </button>
  );
}
