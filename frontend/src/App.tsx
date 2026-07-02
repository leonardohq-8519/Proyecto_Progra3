import { Route, Routes } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { MovieModal } from './components/MovieModal';
import { MovieModalProvider } from './context/MovieModalContext';
import { UserLibraryProvider } from './context/UserLibraryContext';
import { AccountProvider, useAccount } from './context/AccountContext';
import { HomePage } from './pages/HomePage';
import { SearchPage } from './pages/SearchPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { LoginPage } from './pages/LoginPage';
import './App.css';

function AppShell() {
  const { estaAutenticado } = useAccount();

  if (!estaAutenticado) return <LoginPage />;

  return (
    <UserLibraryProvider>
      <MovieModalProvider>
        <div className="app">
          <Sidebar />
          <main className="content">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/buscar" element={<SearchPage />} />
              <Route path="/favoritos" element={<FavoritesPage />} />
            </Routes>
          </main>
          <MovieModal />
        </div>
      </MovieModalProvider>
    </UserLibraryProvider>
  );
}

function App() {
  return (
    <AccountProvider>
      <AppShell />
    </AccountProvider>
  );
}

export default App;
