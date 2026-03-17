import React, { useState, useMemo } from 'react';
import { Search, X, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { POKEMON_DATA, getPokemonById } from '@/lib/pokemonData';
import { calculatePairScore, calculateHouseScore, getCompatLabelColor, getHouseLabelColor, generateExplanation } from '@/lib/compatibility';
import TypeBadge from '@/components/pokemon/TypeBadge';
import CompatibilityBadge from '@/components/pokemon/CompatibilityBadge';
import HouseOccupancy from '@/components/pokemon/HouseOccupancy';

export default function Compare() {
  const [selectedIds, setSelectedIds] = useState([]);
  const [search, setSearch] = useState('');

  const searchResults = useMemo(() => {
    if (!search) return [];
    return POKEMON_DATA
      .filter(p => p.name.toLowerCase().includes(search.toLowerCase()) && !selectedIds.includes(p.id))
      .slice(0, 8);
  }, [search, selectedIds]);

  const houseScore = useMemo(() => calculateHouseScore(selectedIds), [selectedIds]);

  const addPokemon = (id) => {
    if (selectedIds.length >= 4 || selectedIds.includes(id)) return;
    setSelectedIds([...selectedIds, id]);
    setSearch('');
  };

  const removePokemon = (id) => {
    setSelectedIds(selectedIds.filter(i => i !== id));
  };

  const selected = selectedIds.map(getPokemonById).filter(Boolean);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-1">Compare Pokémon</h1>
      <p className="text-sm text-muted-foreground mb-6">Compare 2–4 Pokémon side by side</p>

      {/* Search to add */}
      {selectedIds.length < 4 && (
        <div className="mb-6 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search to add Pokémon..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {searchResults.length > 0 && (
            <div className="mt-2 bg-card rounded-xl border border-border/50 p-2 space-y-1">
              {searchResults.map(p => (
                <button
                  key={p.id}
                  onClick={() => addPokemon(p.id)}
                  className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
                >
                  <img src={p.imageUrl} alt={p.name} className="w-8 h-8 object-contain" />
                  <span className="text-sm font-medium">{p.name}</span>
                  <Plus className="w-4 h-4 text-muted-foreground ml-auto" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {selected.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <p>Add 2–4 Pokémon to compare them side by side.</p>
        </div>
      )}

      {/* Side by side comparison */}
      {selected.length > 0 && (
        <div className="overflow-x-auto">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${selected.length}, minmax(200px, 1fr))` }}>
            {selected.map(p => (
              <div key={p.id} className="bg-card rounded-2xl border border-border/50 p-4 relative">
                <button
                  onClick={() => removePokemon(p.id)}
                  className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
                <div className="text-center mb-4">
                  <img src={p.imageUrl} alt={p.name} className="w-20 h-20 mx-auto object-contain" />
                  <h3 className="font-bold text-sm mt-2">{p.name}</h3>
                  <p className="text-xs text-muted-foreground">#{p.number}</p>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <p className="text-muted-foreground mb-1 font-medium">Type</p>
                    <TypeBadge type={p.type} />
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1 font-medium">Specialty</p>
                    <div className="flex flex-wrap gap-1">
                      {p.specialty.map(s => <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>)}
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1 font-medium">Habitat</p>
                    <Badge variant="secondary" className="text-[10px]">{p.idealHabitat}</Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1 font-medium">Location</p>
                    <span>{p.location}</span>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1 font-medium">Favourites</p>
                    <div className="flex flex-wrap gap-1">
                      {p.favourites.map(f => (
                        <Badge key={f} className="bg-primary/10 text-primary border-primary/20 border text-[10px]">{f}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1 font-medium">Flavor</p>
                    <span>{p.flavor}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Compatibility matrix */}
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
                    <img src={pair.pokemon1.imageUrl} alt="" className="w-8 h-8 object-contain" />
                    <span className="text-sm font-medium">{pair.pokemon1.name}</span>
                  </div>
                  <span className="text-muted-foreground text-xs">↔</span>
                  <div className="flex items-center gap-2">
                    <img src={pair.pokemon2.imageUrl} alt="" className="w-8 h-8 object-contain" />
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

          {selected.length >= 2 && selected.length <= 4 && (
            <div className="bg-muted/30 rounded-xl p-4 text-sm">
              {selected.length === 4 ? (
                <p>
                  <strong>House verdict:</strong> This group of 4 would make a{' '}
                  <span className="font-semibold">{houseScore.label?.toLowerCase()}</span> house
                  with an average compatibility of {houseScore.avgPercentage}%.
                </p>
              ) : (
                <p>
                  Add {4 - selected.length} more Pokémon to see full house compatibility.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}