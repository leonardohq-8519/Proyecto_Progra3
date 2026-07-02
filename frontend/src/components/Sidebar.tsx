import { NavLink } from 'react-router-dom';
import { useAccount } from '../context/AccountContext';

export function Sidebar() {
  const { tipoCuenta, obtenerPremium, cerrarSesion } = useAccount();

  return (
    <aside className="sidebar">
      <NavLink
        to="/buscar"
        className={({ isActive }) => `sidebar-icon ${isActive ? 'active' : ''}`}
        aria-label="Buscar"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </NavLink>
      <NavLink
        to="/"
        end
        className={({ isActive }) => `sidebar-icon ${isActive ? 'active' : ''}`}
        aria-label="Inicio"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 11.5 12 4l9 7.5" />
          <path d="M5 10v10h14V10" />
        </svg>
      </NavLink>
      <NavLink
        to="/favoritos"
        className={({ isActive }) => `sidebar-icon ${isActive ? 'active' : ''}`}
        aria-label="Me gusta"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 21s-7.5-4.6-10-9.3C.5 8.2 2.3 5 5.6 5 7.8 5 9.7 6.3 12 9c2.3-2.7 4.2-4 6.4-4 3.3 0 5.1 3.2 3.6 6.7C19.5 16.4 12 21 12 21Z" />
        </svg>
      </NavLink>

      <div className="sidebar-account">
        <span className="sidebar-account-tipo">{tipoCuenta === 'basico' ? 'Básico' : 'Premium'}</span>
        {tipoCuenta === 'basico' && (
          <button className="sidebar-account-upgrade" onClick={obtenerPremium}>
            Obtener Premium
          </button>
        )}
        <button className="sidebar-account-logout" onClick={cerrarSesion} title="Cerrar sesión">
          Salir
        </button>
      </div>
    </aside>
  );
}
