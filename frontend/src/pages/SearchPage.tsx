import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MovieCard } from '../components/MovieCard';
import { useMovieModal } from '../context/MovieModalContext';
import { useAccount } from '../context/AccountContext';
import { api } from '../services/api';
import { buscadorProxy } from '../patterns/SearchProxy';
import { CatalogoIterator } from '../patterns/CatalogoIterator';
import { HistorialBusquedas } from '../patterns/HistorialBusquedas';
import { searchByGenre } from '../data/catalog';
import { GENEROS, type Genero } from '../data/genres';
import type { Movie } from '../types';

const LOTE = 10;

export function SearchPage() {
  const { openMovie } = useMovieModal();
  const { aplicarCatalogo, esPremium, obtenerPremium } = useAccount();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get('q') ?? '');
  const [generoActivo, setGeneroActivo] = useState<string | null>(null);
  const [visibleResults, setVisibleResults] = useState<Movie[]>([]);
  const [totalReal, setTotalReal] = useState(0);
  const [totalPermitido, setTotalPermitido] = useState(0);
  const [canUndo, setCanUndo] = useState(false);
  const [searched, setSearched] = useState(false);

  const iteratorRef = useRef<CatalogoIterator | null>(null);
  const historialRef = useRef(new HistorialBusquedas());
  const skipNextSearch = useRef(false);

  const mostrarBusqueda = (resultados: Movie[]) => {
    // Patrón Decorator: la cuenta (Básico/Premium) limita el catálogo visible.
    const permitidos = aplicarCatalogo(resultados);
    setTotalReal(resultados.length);
    setTotalPermitido(permitidos.length);
    // Patrón Iterator: paginamos los resultados permitidos de a LOTE.
    iteratorRef.current = new CatalogoIterator(permitidos);
    setVisibleResults(iteratorRef.current.siguientes(LOTE));
  };

  const seleccionarGenero = (genero: Genero) => {
    // Alternar: si el género ya está activo, lo desactivamos y limpiamos.
    if (generoActivo === genero.label) {
      setGeneroActivo(null);
      skipNextSearch.current = true;
      setQuery('');
      setVisibleResults([]);
      setSearched(false);
      return;
    }
    skipNextSearch.current = true;
    setQuery('');
    setGeneroActivo(genero.label);
    searchByGenre(genero).then((data) => {
      // Patrón Memento: el filtro por género también se guarda en el historial.
      historialRef.current.guardar(`Género: ${genero.label}`, data);
      setCanUndo(historialRef.current.puedeDeshacer());
      setSearched(true);
      mostrarBusqueda(data);
    });
  };

  const onChangeTexto = (valor: string) => {
    if (generoActivo) setGeneroActivo(null);
    setQuery(valor);
  };

  useEffect(() => {
    if (skipNextSearch.current) {
      skipNextSearch.current = false;
      return;
    }

    const trimmed = query.trim();
    if (!trimmed) {
      setVisibleResults([]);
      setSearched(false);
      return;
    }

    let cancelled = false;
    const timeout = setTimeout(() => {
      // Patrón Proxy: cachea resultados por query si el backend HTTP no responde.
      api
        .search(trimmed)
        .catch(() => buscadorProxy.buscar(trimmed))
        .then((data) => {
          if (cancelled) return;
          // Patrón Memento: guardamos cada búsqueda para poder deshacerla.
          historialRef.current.guardar(trimmed, data);
          setCanUndo(historialRef.current.puedeDeshacer());
          setSearched(true);
          mostrarBusqueda(data);
        });
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [query, aplicarCatalogo]);

  const cargarSiguientes = () => {
    if (!iteratorRef.current) return;
    setVisibleResults((prev) => [...prev, ...iteratorRef.current!.siguientes(LOTE)]);
  };

  const deshacerBusqueda = () => {
    const previo = historialRef.current.deshacer();
    setCanUndo(historialRef.current.puedeDeshacer());
    skipNextSearch.current = true;
    setQuery(previo.query);
    mostrarBusqueda(previo.resultados);
  };

  const hayMasResultados = iteratorRef.current?.hasNext() ?? false;
  const estaLimitado = !esPremium && totalReal > totalPermitido;

  return (
    <div className="search-page">
      <input
        className="search-input"
        type="search"
        placeholder="Buscar por título, director, género..."
        value={query}
        onChange={(e) => onChangeTexto(e.target.value)}
        autoFocus
      />

      <div className="genre-chips">
        {GENEROS.map((genero) => (
          <button
            key={genero.label}
            className={`genre-chip ${generoActivo === genero.label ? 'active' : ''}`}
            onClick={() => seleccionarGenero(genero)}
          >
            {genero.label}
          </button>
        ))}
      </div>

      {searched && (
        <div className="search-summary">
          {estaLimitado ? (
            <p className="search-hint">
              Mostrando <strong>{totalPermitido}</strong> de <strong>{totalReal.toLocaleString()}</strong>{' '}
              resultados · límite de cuenta Básica.{' '}
              <button className="link-button" onClick={obtenerPremium}>
                Obtené Premium para verlos todos
              </button>
            </p>
          ) : (
            <p className="search-hint">
              <strong>{totalReal.toLocaleString()}</strong> resultado{totalReal === 1 ? '' : 's'}
              {esPremium ? ' · cuenta Premium (catálogo completo)' : ''}
            </p>
          )}
        </div>
      )}

      {searched && visibleResults.length === 0 && (
        <p className="empty-state">Sin resultados para "{generoActivo ?? query}"</p>
      )}

      <div className="movie-grid">
        {visibleResults.map((movie) => (
          <MovieCard key={movie.id} movie={movie} onSelect={openMovie} />
        ))}
      </div>

      <div className="search-actions">
        {hayMasResultados && <button onClick={cargarSiguientes}>Siguientes {LOTE}</button>}
        {canUndo && <button onClick={deshacerBusqueda}>Deshacer búsqueda anterior</button>}
      </div>
    </div>
  );
}
