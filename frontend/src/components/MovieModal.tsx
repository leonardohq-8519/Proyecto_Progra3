import { useMovieModal } from '../context/MovieModalContext';
import { useUserLibrary } from '../context/UserLibraryContext';
import { usePosterUrl } from '../hooks/usePosterUrl';
import { useSynopsis } from '../hooks/useSynopsis';
import { api } from '../services/api';
import type { Movie } from '../types';

function MovieModalContent({ movie, onClose }: { movie: Movie; onClose: () => void }) {
  const posterUrl = usePosterUrl(movie, { width: 400, height: 600 }, 'original');
  const synopsis = useSynopsis(movie.id);
  const { isLiked, isWatchLater, toggleLike, toggleWatchLater } = useUserLibrary();

  const liked = isLiked(movie.id);
  const inWatchLater = isWatchLater(movie.id);

  const handleLike = () => {
    toggleLike(movie.id);
    api.likeMovie(movie.id).catch(() => {});
  };

  const handleWatchLater = () => {
    toggleWatchLater(movie.id);
    api.addToWatchLater(movie.id).catch(() => {});
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <img className="modal-poster" src={posterUrl} alt={movie.title} />
        <div className="modal-body">
          <h2>{movie.title}</h2>
          <div className="modal-meta">
            {movie.badge && <span>Año: {movie.badge}</span>}
            {movie.releaseInfo && <span>Género: {movie.releaseInfo}</span>}
            {movie.director && <span>Director: {movie.director}</span>}
          </div>
          <p className="modal-synopsis">
            {synopsis === undefined
              ? 'Cargando sinopsis...'
              : (synopsis ?? 'Sinopsis no disponible para esta película.')}
          </p>
          <div className="modal-actions">
            <button className={liked ? 'active' : ''} onClick={handleLike}>
              {liked ? '❤ Te gusta' : 'Like'}
            </button>
            <button className={inWatchLater ? 'active' : ''} onClick={handleWatchLater}>
              {inWatchLater ? '✓ En ver más tarde' : 'Ver más tarde'}
            </button>
            <button onClick={onClose}>Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MovieModal() {
  const { selectedMovie, closeMovie } = useMovieModal();

  if (!selectedMovie) return null;

  return <MovieModalContent movie={selectedMovie} onClose={closeMovie} />;
}
