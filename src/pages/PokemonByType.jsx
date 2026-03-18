import React, { useEffect, useState, useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { POKEMON_DATA } from '@/lib/pokemonData';
import PokemonCard from '@/components/pokemon/PokemonCard';

export default function PokemonByType() {
  const location = useLocation();
  const [type, setType] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const typeParam = params.get('type');
    setType(typeParam || '');
  }, [location.search]);

  const filtered = useMemo(() => {
    if (!type) return [];
    return POKEMON_DATA.filter(p => p.type.includes(type));
  }, [type]);

  if (!type) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground">Type not specified.</p>
        <Link to="/Pokedex"><Button className="mt-4">Back to Pokédex</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <Link to="/Pokedex" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Pokédex
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">{type} Type Pokémon</h1>
        <p className="text-sm text-muted-foreground">{filtered.length} Pokémon with this type</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {filtered.map(p => (
          <PokemonCard key={p.id} pokemon={p} />
        ))}
      </div>
    </div>
  );
}