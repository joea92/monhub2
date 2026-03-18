import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Wrench, MapPin, GitCompare, ArrowRight, Star, Sparkles } from 'lucide-react';

const DITTO_URL = 'https://media.base44.com/images/public/69b976fdec8fc338dd963cb9/53940ff47_ditto-logo.png';
import { Button } from '@/components/ui/button';
import { POKEMON_DATA, TOWNS } from '@/lib/pokemonData';
import PokemonCard from '@/components/pokemon/PokemonCard';

const QUICK_LINKS = [
  { path: '/Pokedex', icon: Search, label: 'Pokédex', desc: 'Browse all Pokémon', color: 'bg-pokopia-cyan' },
  { path: '/HousePlanner', icon: Wrench, label: 'House Planner', desc: 'Build houses of 4', color: 'bg-pokopia-green' },
  { path: '/TownPlanner', icon: MapPin, label: 'Town Planner', desc: 'Organize by town', color: 'bg-pokopia-olive' },
  { path: '/Compare', icon: GitCompare, label: 'Compare', desc: 'Side-by-side view', color: 'bg-pokopia-purple' },
];

export default function Dashboard() {
  // Show a few random featured Pokémon
  const featured = React.useMemo(() => {
    const shuffled = [...POKEMON_DATA].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 8);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-card border border-border/40 shadow-sm p-8 md:p-12 mb-8">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">Pokémon Pokopia</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">House Matcher</h1>
          <p className="text-muted-foreground max-w-lg mb-6">
            Find the best housemates for your Pokémon. Optimize houses, plan towns, and maximize compatibility across {POKEMON_DATA.length} Pokémon.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/Pokedex">
              <Button className="gap-2">
                <Search className="w-4 h-4" />
                Browse Pokédex
              </Button>
            </Link>
            <Link to="/HousePlanner">
              <Button variant="outline" className="gap-2">
                <Wrench className="w-4 h-4" />
                Plan a House
              </Button>
            </Link>
          </div>
        </div>
        <div className="absolute -right-10 -bottom-10 opacity-10">
          <Sparkles className="w-64 h-64 text-primary" />
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        {QUICK_LINKS.map(link => {
          const Icon = link.icon;
          return (
            <Link key={link.path} to={link.path}>
              <div className="group p-4 rounded-xl border border-border/50 bg-card hover:shadow-lg hover:border-primary/20 transition-all">
                <div className={`w-10 h-10 rounded-lg ${link.color} flex items-center justify-center mb-3`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-sm mb-0.5">{link.label}</h3>
                <p className="text-xs text-muted-foreground">{link.desc}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Towns overview */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Towns</h2>
          <Link to="/TownPlanner" className="text-xs text-primary font-medium flex items-center gap-1 hover:underline">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {TOWNS.map(town => {
            const count = POKEMON_DATA.filter(p => p.location === town.name).length;
            return (
              <Link key={town.id} to={`/TownPlanner?town=${town.id}`}>
                <div className="p-4 rounded-xl border border-border/50 bg-card hover:shadow-md transition-all text-center">
                  <span className="text-2xl mb-2 block">{town.icon}</span>
                  <h3 className="font-semibold text-xs mb-1">{town.name}</h3>
                  <p className="text-xs text-muted-foreground">{count} Pokémon</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Featured Pokémon */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500" /> Featured
          </h2>
          <Link to="/Pokedex" className="text-xs text-primary font-medium flex items-center gap-1 hover:underline">
            See all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {featured.map(p => (
            <PokemonCard key={p.id} pokemon={p} />
          ))}
        </div>
      </div>
    </div>
  );
}