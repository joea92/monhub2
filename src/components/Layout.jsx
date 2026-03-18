import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Search, Wrench, MapPin, GitCompare } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DITTO_URL = 'https://media.base44.com/images/public/69b976fdec8fc338dd963cb9/53940ff47_ditto-logo.png';

const NAV_ITEMS = [
  { path: '/Dashboard', label: 'Home', icon: Home, color: 'text-primary' },
  { path: '/Pokedex', label: 'Pokédex', icon: Search, color: 'text-cyan-600' },
  { path: '/HousePlanner', label: 'House', icon: Wrench, color: 'text-green-600' },
  { path: '/TownPlanner', label: 'Towns', icon: MapPin, color: 'text-amber-700' },
  { path: '/Compare', label: 'Compare', icon: GitCompare, color: 'text-violet-600' },
];

export default function Layout() {
  const location = useLocation();

  const isActive = (item) =>
    location.pathname === item.path ||
    (item.path !== '/Dashboard' && location.pathname.startsWith(item.path));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/Dashboard" className="flex items-center gap-2">
            <img src={DITTO_URL} alt="Ditto" className="w-8 h-8 object-contain" />
            <span className="font-bold text-lg tracking-tight">Pokopia Matcher</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map(item => {
              const Icon = item.icon;
              const active = isActive(item);
              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant={active ? "secondary" : "ghost"}
                    size="sm"
                    className={`gap-1.5 text-xs font-medium ${active ? 'bg-white/60 shadow-sm' : 'hover:bg-white/40'}`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${active ? item.color : ''}`} />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Content — extra bottom padding on mobile for tab bar */}
      <main className="flex-1 pb-20 md:pb-0">
        <Outlet />
      </main>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl border-t border-border/40 flex" style={{ backgroundColor: 'hsl(20, 96%, 62%)' }}>
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors ${
                active ? 'text-white' : 'text-white/70'
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? item.color : ''}`} />
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
              {active && <span className="w-1 h-1 rounded-full bg-primary mt-0.5" />}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}