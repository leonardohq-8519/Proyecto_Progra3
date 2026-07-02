// Espejo de IUsuario/UsuarioBase/UsuarioDecorator en interfaz.cpp (patrón Decorator).
import type { Movie } from '../types';

export interface IUsuario {
  getCatalogo(todas: Movie[]): Movie[];
  getTipo(): string;
}

export class UsuarioBase implements IUsuario {
  getCatalogo(todas: Movie[]): Movie[] {
    return todas;
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
  abstract getTipo(): string;
}

export class UsuarioBasico extends UsuarioDecorator {
  getCatalogo(todas: Movie[]): Movie[] {
    return this.usuario.getCatalogo(todas).slice(0, 20);
  }
  getTipo(): string {
    return 'Básico (catálogo reducido - 20 películas)';
  }
}

export class UsuarioPremium extends UsuarioDecorator {
  getCatalogo(todas: Movie[]): Movie[] {
    return this.usuario.getCatalogo(todas);
  }
  getTipo(): string {
    return 'Premium (catálogo completo)';
  }
}
