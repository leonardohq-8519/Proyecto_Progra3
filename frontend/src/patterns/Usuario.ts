// Espejo de IUsuario/UsuarioBase/UsuarioDecorator en interfaz.cpp (patrón Decorator).
import type { Movie } from '../types';

// Cantidad de películas a la que una cuenta Básica ve limitado su catálogo.
export const LIMITE_CATALOGO_BASICO = 20;

export interface IUsuario {
  getCatalogo(todas: Movie[]): Movie[];
  getLimiteCatalogo(): number;
  getLimiteRecomendaciones(): number;
  getTipo(): string;
}

export class UsuarioBase implements IUsuario {
  getCatalogo(todas: Movie[]): Movie[] {
    return todas;
  }
  getLimiteCatalogo(): number {
    return Number.POSITIVE_INFINITY;
  }
  getLimiteRecomendaciones(): number {
    return 12;
  }
  getTipo(): string {
    return 'Invitado';
  }
}

abstract class UsuarioDecorator implements IUsuario {
  protected usuario: IUsuario;
  constructor(usuario: IUsuario) {
    this.usuario = usuario;
  }
  abstract getCatalogo(todas: Movie[]): Movie[];
  abstract getLimiteCatalogo(): number;
  abstract getLimiteRecomendaciones(): number;
  abstract getTipo(): string;
}

export class UsuarioBasico extends UsuarioDecorator {
  getCatalogo(todas: Movie[]): Movie[] {
    return this.usuario.getCatalogo(todas).slice(0, this.getLimiteCatalogo());
  }
  getLimiteCatalogo(): number {
    return LIMITE_CATALOGO_BASICO;
  }
  getLimiteRecomendaciones(): number {
    return 4;
  }
  getTipo(): string {
    return 'Básico (catálogo reducido - 20 películas)';
  }
}

export class UsuarioPremium extends UsuarioDecorator {
  getCatalogo(todas: Movie[]): Movie[] {
    return this.usuario.getCatalogo(todas);
  }
  getLimiteCatalogo(): number {
    return this.usuario.getLimiteCatalogo();
  }
  getLimiteRecomendaciones(): number {
    return 12;
  }
  getTipo(): string {
    return 'Premium (catálogo completo)';
  }
}
