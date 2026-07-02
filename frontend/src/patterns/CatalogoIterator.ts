// Espejo de CatalogoIterator en interfaz.cpp (patrón Iterator).
import type { Movie } from '../types';

export class CatalogoIterator {
  private peliculasOrdenadas: Movie[];
  private indice = 0;

  constructor(catalogo: Movie[]) {
    this.peliculasOrdenadas = [...catalogo].sort((a, b) => a.title.localeCompare(b.title));
  }

  hasNext(): boolean {
    return this.indice < this.peliculasOrdenadas.length;
  }

  next(): Movie {
    return this.peliculasOrdenadas[this.indice++];
  }

  reset(): void {
    this.indice = 0;
  }

  posicion(): number {
    return this.indice;
  }

  total(): number {
    return this.peliculasOrdenadas.length;
  }

  siguientes(cantidad: number): Movie[] {
    const lote: Movie[] = [];
    while (lote.length < cantidad && this.hasNext()) lote.push(this.next());
    return lote;
  }
}
