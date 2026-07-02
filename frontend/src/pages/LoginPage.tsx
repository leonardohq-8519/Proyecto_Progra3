import { useState, type FormEvent } from 'react';
import { useAccount } from '../context/AccountContext';

export function LoginPage() {
  const { iniciarSesion } = useAccount();
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const ok = iniciarSesion(usuario.trim(), contrasena);
    setError(!ok);
  };

  return (
    <div className="login-page">
      <form className="login-form" onSubmit={handleSubmit}>
        <h1>Plataforma Streaming</h1>
        <input
          className="search-input"
          placeholder="Usuario"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          autoFocus
        />
        <input
          className="search-input"
          type="password"
          placeholder="Contraseña"
          value={contrasena}
          onChange={(e) => setContrasena(e.target.value)}
        />
        {error && <p className="login-error">Usuario o contraseña incorrectos.</p>}
        <button type="submit" className="login-submit">
          Ingresar
        </button>
        <p className="login-hint">
          Cuentas de prueba: <code>basico / basico123</code> (Básico) ·{' '}
          <code>premium / premium123</code> (Premium)
        </p>
      </form>
    </div>
  );
}
