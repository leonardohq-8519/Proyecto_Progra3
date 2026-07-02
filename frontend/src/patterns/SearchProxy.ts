// Espejo de BuscadorReal/BuscadorProxy en interfaz.cpp (patrón Proxy con caché).
import type { Movie } from '../types';
import { searchCatalog } from '../data/catalog';

class BuscadorReal {
  async buscar(query: string): Promise<Movie[]> {
    return searchCatalog(query);
  }
}

class BuscadorProxy {
  private cache = new Map<string, Movie[]>();
  private buscadorReal = new BuscadorReal();

  async buscar(query: string): Promise<Movie[]> {
    const cached = this.cache.get(query);
    if (cached) {
      console.log('[PROXY] Resultado obtenido del cache (busqueda repetida)');
      return cached;
    }
    console.log('[PROXY] Buscando en base de datos...');
    const resultado = await this.buscadorReal.buscar(query);
    this.cache.set(query, resultado);
    return resultado;
  }
}

export const buscadorProxy = new BuscadorProxy();
