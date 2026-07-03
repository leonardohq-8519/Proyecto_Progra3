// Espejo de BusquedaMemento/HistorialBusquedas en interfaz.cpp (patrón Memento).
import type { Movie } from '../types';

export interface BusquedaMemento {
  query: string;
  resultados: Movie[];
}

export class HistorialBusquedas {
  private historial: BusquedaMemento[] = [];

  guardar(query: string, resultados: Movie[]): void {
    const ultima = this.historial[this.historial.length - 1];
    if (ultima && ultima.query === query) return; // no duplicar la misma búsqueda seguida
    this.historial.push({ query, resultados });
  }

  puedeDeshacer(): boolean {
    return this.historial.length > 1;
  }

  deshacer(): BusquedaMemento {
    this.historial.pop();
    return this.historial[this.historial.length - 1];
  }

  vacio(): boolean {
    return this.historial.length === 0;
  }
}
