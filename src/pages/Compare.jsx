import React, { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { POKEMON_DATA, getPokemonById } from '@/lib/pokemonData';
import { calculateHouseScore, getHouseLabelColor, generateExplanation } from '@/lib/compatibility';
import TypeBadge from '@/components/pokemon/TypeBadge';
import CompatibilityBadge from '@/components/pokemon/CompatibilityBadge';
import HouseOccupancy from '@/components/pokemon/HouseOccupancy';
import PokemonSilhouette from '@/components/pokemon/PokemonSilhouette';

export default function Compare() {
  const [selectedIds, setSelectedIds] = useState([null, null, null, null]);
  const [search, setSearch] = useState('');
  const [focusedSlot, setFocusedSlot] = useState(null);

  const searchResults = useMemo(() => {
    if (!search || focusedSlot === null) return [];
    const usedIds = new Set(selectedIds.filter(id => id !== null));
    return POKEMON_DATA
      .filter(p => p.name.toLowerCase().includes(search.toLowerCase()) && !usedIds.has(p.id))
      .slice(0, 8);
  }, [search, selectedIds, focusedSlot]);

  const addPokemon = (id) => {
    if (focusedSlot === null) return;
    const newIds = [...selectedIds];
    newIds[focusedSlot] = id;
    setSelectedIds(newIds);
    setSearch('');
    setFocusedSlot(null);
  };

  const removePokemon = (index) => {
    const newIds = [...selectedIds];
    newIds[index] = null;
    setSelectedIds(newIds);
  };

  const selected = selectedIds.map(getPokemonById).filter(Boolean);
  const houseScore = useMemo(() => calculateHouseScore(selected.map(p => p.id)), [selected]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-1">Compare Pokémon</h1>
      <p className="text-sm text-muted-foreground mb-6">Select up to 4 Pokémon to compare</p>

      {/* 4 Fixed Slots */}
      <div className="grid grid-cols-4 gap-3 mb-8">
        {selectedIds.map((pokemonId, index) => {
          const pokemon = pokemonId ? getPokemonById(pokemonId) : null;
          return (
            <div
              key={index}
              onClick={() => !pokemon && setFocusedSlot(index)}
              className={`relative rounded-2xl border-2 transition-all cursor-pointer ${
                pokemon
                  ? 'bg-card border-border/50'
                  : focusedSlot === index
                  ? 'bg-white/20 border-white/40'
                  : 'bg-white/10 border-white/20'
              }`}
              style={{ aspectRatio: '1 / 1.3' }}
            >
              {pokemon ? (
                <div className="p-3 h-full flex flex-col">
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      removePokemon(index);
                    }}
                    className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="text-center mb-2 flex-1 flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-muted/30 rounded-lg flex items-center justify-center mb-1">
                      <PokemonSilhouette src={pokemon.imageUrl} alt={pokemon.name} primaryType={pokemon.type?.split('/')[0]} className="w-16 h-16" />
                    </div>
                    <h3 className="font-bold text-xs mt-1">{pokemon.name}</h3>
                    <p className="text-[10px] text-muted-foreground">#{pokemon.number}</p>
                  </div>

                  <div className="space-y-2 text-[10px]">
                    <div>
                      <p className="text-muted-foreground mb-0.5 font-medium">Type</p>
                      <TypeBadge type={pokemon.type} />
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-0.5 font-medium">Specialty</p>
                      <div className="flex flex-wrap gap-1">
                        {pokemon.specialty.map(s => <Badge key={s} variant="outline" className="text-[9px]">{s}</Badge>)}
                      </div>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-0.5 font-medium">Habitat</p>
                      <Badge variant="secondary" className="text-[9px]">{pokemon.idealHabitat}</Badge>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-white/40 text-xs text-center px-2">Click to add</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Search */}
      {focusedSlot !== null && (
        <div className="mb-6 max-w-sm relative z-10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search Pokémon..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-xl border border-border/50 p-2 space-y-1 w-full">
              {searchResults.map(p => (
                <button
                  key={p.id}
                  onClick={() => addPokemon(p.id)}
                  className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="w-8 h-8 flex-shrink-0 bg-muted/30 rounded">
                    <PokemonSilhouette src={p.imageUrl} alt={p.name} primaryType={p.type?.split('/')[0]} className="w-8 h-8" />
                  </div>
                  <span className="text-sm font-medium">{p.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Compatibility matrix - only show if 2+ selected */}
      {selected.length >= 2 && (
        <div className="mt-8 space-y-4">
          <h2 className="font-bold text-lg">Compatibility</h2>
          
          <div className="flex flex-wrap gap-3 mb-4">
            <HouseOccupancy count={selected.length} />
            {houseScore.label && (
              <Badge className={`${getHouseLabelColor(houseScore.label)} border text-xs`}>
                {houseScore.avgPercentage}% — {houseScore.label}
              </Badge>
            )}
          </div>

          <div className="space-y-3">
            {houseScore.pairs.map((pair, i) => (
              <div key={i} className="bg-card rounded-xl border border-border/50 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center gap-2">
                     <div className="w-8 h-8 flex-shrink-0 bg-muted/30 rounded">
                       <PokemonSilhouette src={pair.pokemon1.imageUrl} alt="" primaryType={pair.pokemon1.type?.split('/')[0]} className="w-8 h-8" />
                     </div>
                    <span className="text-sm font-medium">{pair.pokemon1.name}</span>
                  </div>
                  <span className="text-muted-foreground text-xs">↔</span>
                  <div className="flex items-center gap-2">
                     <div className="w-8 h-8 flex-shrink-0 bg-muted/30 rounded">
                       <PokemonSilhouette src={pair.pokemon2.imageUrl} alt="" primaryType={pair.pokemon2.type?.split('/')[0]} className="w-8 h-8" />
                     </div>
                    <span className="text-sm font-medium">{pair.pokemon2.name}</span>
                  </div>
                  <div className="ml-auto">
                    <CompatibilityBadge result={pair} />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {generateExplanation(pair.pokemon1, pair.pokemon2, pair)}
                </p>
              </div>
            ))}
          </div>

          {selected.length === 4 && (
            <div className="bg-muted/30 rounded-xl p-4 text-sm">
              <p>
                <strong>House verdict:</strong> This group of 4 would make a{' '}
                <span className="font-semibold">{houseScore.label?.toLowerCase()}</span> house
                with an average compatibility of {houseScore.avgPercentage}%.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}