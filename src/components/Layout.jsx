import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Search, Wrench, MapPin, GitCompare, Settings, Menu, X, ImageIcon } from 'lucide-react';

const DITTO_URL = 'https://media.base44.com/images/public/69b976fdec8fc338dd963cb9/53940ff47_ditto-logo.png';
import { Button } from '@/components/ui/button';

const NAV_ITEMS = [
  { path: '/Dashboard', label: 'Home', icon: Home, color: '' },
  { path: '/Pokedex', label: 'Pokédex', icon: Search, color: 'text-cyan-600' },
  { path: '/HousePlanner', label: 'House Planner', icon: Wrench, color: 'text-green-600' },
  { path: '/TownPlanner', label: 'Towns', icon: MapPin, color: 'text-amber-700' },
  { path: '/Compare', label: 'Compare', icon: GitCompare, color: 'text-violet-600' },

];

export default function Layout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/Dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 flex items-center justify-center">
              <img src={DITTO_URL} alt="Ditto" className="w-8 h-8 object-contain" />
            </div>
            <span className="font-bold text-lg tracking-tight hidden sm:block">Pokopia Matcher</span>
          </Link>
          
          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map(item => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || 
                (item.path !== '/Dashboard' && location.pathname.startsWith(item.path));
              return (
                <Link key={item.path} to={item.path}>
                  <Button 
                    variant={isActive ? "secondary" : "ghost"} 
                    size="sm"
                    className={`gap-1.5 text-xs font-medium ${isActive ? 'bg-white/60 shadow-sm' : 'hover:bg-white/40'}`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive && item.color ? item.color : ''}`} />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* Mobile hamburger */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
        <nav className="md:hidden border-t border-border/40 bg-background/95 p-3 space-y-1">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}>
                <Button 
                  variant={isActive ? "secondary" : "ghost"} 
                  className={`w-full justify-start gap-2 ${isActive ? 'bg-white/60 shadow-sm' : 'hover:bg-white/40'}`}
                >
                  <Icon className={`w-4 h-4 ${isActive && item.color ? item.color : ''}`} />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>
        )}
      </header>

      {/* Content */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}