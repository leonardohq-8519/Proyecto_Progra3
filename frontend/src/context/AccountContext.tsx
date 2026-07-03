import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Movie } from '../types';
import { type IUsuario, UsuarioBase, UsuarioBasico, UsuarioPremium } from '../patterns/Usuario';

type TipoCuenta = 'basico' | 'premium';

interface Credenciales {
  usuario: string;
  contrasena: string;
  tipo: TipoCuenta;
}

// Cuentas de prueba prehechas (sin backend de autenticación todavía).
export const CUENTAS_DEMO: Credenciales[] = [
  { usuario: 'basico', contrasena: 'basico123', tipo: 'basico' },
  { usuario: 'premium', contrasena: 'premium123', tipo: 'premium' },
];

const SESSION_KEY = 'streaming.sesion';

interface AccountContextValue {
  estaAutenticado: boolean;
  tipoCuenta: TipoCuenta | null;
  esPremium: boolean;
  usuarioActual: IUsuario | null;
  limiteCatalogo: number;
  limiteRecomendaciones: number;
  iniciarSesion: (usuario: string, contrasena: string) => boolean;
  cerrarSesion: () => void;
  obtenerPremium: () => void;
  aplicarCatalogo: (movies: Movie[]) => Movie[];
}

const AccountContext = createContext<AccountContextValue | null>(null);

function crearUsuario(tipo: TipoCuenta): IUsuario {
  return tipo === 'basico' ? new UsuarioBasico(new UsuarioBase()) : new UsuarioPremium(new UsuarioBase());
}

function leerSesionGuardada(): TipoCuenta | null {
  const stored = localStorage.getItem(SESSION_KEY);
  return stored === 'basico' || stored === 'premium' ? stored : null;
}

export function AccountProvider({ children }: { children: ReactNode }) {
  const [tipoCuenta, setTipoCuenta] = useState<TipoCuenta | null>(leerSesionGuardada);

  useEffect(() => {
    if (tipoCuenta) localStorage.setItem(SESSION_KEY, tipoCuenta);
    else localStorage.removeItem(SESSION_KEY);
  }, [tipoCuenta]);

  const value = useMemo<AccountContextValue>(() => {
    const usuario = tipoCuenta ? crearUsuario(tipoCuenta) : null;
    return {
      estaAutenticado: tipoCuenta !== null,
      tipoCuenta,
      esPremium: tipoCuenta === 'premium',
      usuarioActual: usuario,
      limiteCatalogo: usuario ? usuario.getLimiteCatalogo() : Number.POSITIVE_INFINITY,
      limiteRecomendaciones: usuario ? usuario.getLimiteRecomendaciones() : 12,
      iniciarSesion: (usuarioIngresado, contrasenaIngresada) => {
        const cuenta = CUENTAS_DEMO.find(
          (c) => c.usuario === usuarioIngresado && c.contrasena === contrasenaIngresada,
        );
        if (!cuenta) return false;
        setTipoCuenta(cuenta.tipo);
        return true;
      },
      cerrarSesion: () => setTipoCuenta(null),
      obtenerPremium: () => setTipoCuenta('premium'),
      aplicarCatalogo: (movies) => (usuario ? usuario.getCatalogo(movies) : movies),
    };
  }, [tipoCuenta]);

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount() {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error('useAccount must be used within an AccountProvider');
  return ctx;
}
