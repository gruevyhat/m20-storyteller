import { HashRouter, NavLink, Route, Routes } from 'react-router-dom';
import { ChronicleProvider, useChronicle } from './store/chronicle';
import { chronicleTitle } from './model/types';
import darkPackLogo from './assets/darkpack-logo.png';
import TablePage from './pages/TablePage';
import CharactersPage from './pages/CharactersPage';
import RulesPage from './pages/RulesPage';
import HandoutsPage from './pages/HandoutsPage';
import ChroniclePage from './pages/ChroniclePage';
import PlayerPage from './pages/PlayerPage';
import FortunePage from './pages/FortunePage';
import CreatePage from './pages/CreatePage';
import GrimoirePage from './pages/GrimoirePage';

const NAV = [
  { to: '/', label: 'Table' },
  { to: '/characters', label: 'Characters' },
  { to: '/create', label: 'Create' },
  { to: '/fortune', label: 'Fortune' },
  { to: '/grimoire', label: 'Grimoire' },
  { to: '/handouts', label: 'Handouts' },
  { to: '/rules', label: 'Rules' },
  { to: '/chronicle', label: 'Chronicle' },
];

export function openPlayerWindow() {
  window.open(`${window.location.pathname}#/player`, 'm20-player', 'popup,width=1280,height=800');
}

function Shell() {
  const { chronicle } = useChronicle();
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-line bg-ink/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-x-5 gap-y-1 px-4 py-1.5">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-xl font-bold text-brass">M20 Storyteller</span>
            {chronicleTitle(chronicle) && <span className="truncate text-sm text-muted">{chronicleTitle(chronicle)}</span>}
          </div>
          <nav className="flex flex-wrap gap-1">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === '/'}
                className={({ isActive }) =>
                  `rounded px-2.5 py-0.5 text-sm ${isActive ? 'bg-raised text-brass-bright' : 'text-muted hover:text-parchment'}`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
          <button className="btn ml-auto" onClick={openPlayerWindow} title="Open the player screen in a new window. Drag it to the second monitor.">
            Player screen ↗
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-[1600px] px-4 py-3">
        <Routes>
          <Route path="/" element={<TablePage />} />
          <Route path="/characters" element={<CharactersPage />} />
          <Route path="/characters/:id" element={<CharactersPage />} />
          <Route path="/create" element={<CreatePage />} />
          <Route path="/fortune" element={<FortunePage />} />
          <Route path="/grimoire" element={<GrimoirePage />} />
          <Route path="/handouts" element={<HandoutsPage />} />
          <Route path="/rules" element={<RulesPage />} />
          <Route path="/chronicle" element={<ChroniclePage />} />
        </Routes>
      </main>
      <footer className="mx-auto flex max-w-[1600px] items-center gap-3 px-4 pb-4 pt-2 text-[11px] text-muted">
        <img src={darkPackLogo} alt="Dark Pack" className="h-10 w-10 shrink-0" />
        <p>
          Unofficial, free fan tool; not official World of Darkness material. Portions of the materials are the copyrights and trademarks of Paradox Interactive AB. All rights reserved. For more information please visit worldofdarkness.com.
        </p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/player" element={<PlayerPage />} />
        <Route
          path="/*"
          element={
            <ChronicleProvider>
              <Shell />
            </ChronicleProvider>
          }
        />
      </Routes>
    </HashRouter>
  );
}
