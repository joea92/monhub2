import React, { useState, useMemo } from 'react';
import { Plus, X, Sparkles, AlertTriangle, Search, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { POKEMON_DATA, getPokemonById } from '@/lib/pokemonData';
import { calculateHouseScore, suggestNextMember, optimizeBestHouse, getHouseLabelColor, calculatePairScore, generateExplanation } from '@/lib/compatibility';
import { saveHouse, getSavedHouses, deleteHouse } from '@/lib/storage';
import HouseOccupancy from '@/components/pokemon/HouseOccupancy';
import TypeBadge from '@/components/pokemon/TypeBadge';
import CompatibilityBadge from '@/components/pokemon/CompatibilityBadge';

export default function HousePlanner() {
  const [houseMembers, setHouseMembers] = useState([]);
  const [search, setSearch] = useState('');
  const [savedHouses, setSavedHouses] = useState(getSavedHouses());
  const [showAutoOptimize, setShowAutoOptimize] = useState(false);

  const houseScore = useMemo(() => calculateHouseScore(houseMembers), [houseMembers]);
  const suggestions = useMemo(() => {
    if (houseMembers.length >= 4) return [];
    return suggestNextMember(houseMembers);
  }, [houseMembers]);

  const autoResults = useMemo(() => {
    if (!showAutoOptimize || houseMembers.length === 0) return [];
    return optimizeBestHouse(houseMembers, 5);
  }, [showAutoOptimize, houseMembers]);

  const searchResults = useMemo(() => {
    if (!search) return [];
    return POKEMON_DATA
      .filter(p => p.name.toLowerCase().includes(search.toLowerCase()) && !houseMembers.includes(p.id))
      .slice(0, 8);
  }, [search, houseMembers]);

  const addMember = (id) => {
    if (houseMembers.length >= 4 || houseMembers.includes(id)) return;
    setHouseMembers([...houseMembers, id]);
    setSearch('');
  };

  const removeMember = (id) => {
    setHouseMembers(houseMembers.filter(m => m !== id));
  };

  const handleSave = () => {
    const house = {
      id: Date.now().toString(),
      name: `House ${savedHouses.length + 1}`,
      memberIds: houseMembers,
      createdAt: new Date().toISOString(),
    };
    const updated = saveHouse(house);
    setSavedHouses(updated);
  };

  const handleDelete = (houseId) => {
    const updated = deleteHouse(houseId);
    setSavedHouses(updated);
  };

  const loadHouse = (house) => {
    setHouseMembers(house.memberIds || []);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-1">House Planner</h1>
      <p className="text-sm text-muted-foreground mb-6">Build a house of up to 4 compatible Pokémon</p>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left: Current house */}
        <div className="md:col-span-2 space-y-4">
          {/* House card */}
          <div className="bg-card rounded-2xl border border-border/50 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold">Current House</h2>
              <HouseOccupancy count={houseMembers.length} />
            </div>

            {houseMembers.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <p className="text-sm">Add Pokémon to start building a house</p>
              </div>
            ) : (
              <div className="space-y-3">
                {houseMembers.map(id => {
                  const p = getPokemonById(id);
                  if (!p) return null;
                  return (
                    <div key={id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/30">
                      <img src={p.imageUrl} alt={p.name} className="w-12 h-12 object-contain" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{p.name}</p>
                        <TypeBadge type={p.type} />
                      </div>
                      {houseScore.weakestMember?.pokemon?.id === id && houseMembers.length >= 3 && (
                        <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] flex-shrink-0">
                          <AlertTriangle className="w-3 h-3 mr-1" /> Weakest fit
                        </Badge>
                      )}
                      <Button variant="ghost" size="icon" className="flex-shrink-0 h-8 w-8" onClick={() => removeMember(id)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* House stats */}
            {houseMembers.length >= 2 && (
              <div className="mt-5 pt-4 border-t border-border/50">
                <div className="flex flex-wrap gap-3 mb-3">
                  <Badge className={`${getHouseLabelColor(houseScore.label)} border text-xs`}>
                    {houseScore.label}
                  </Badge>
                  <span className="text-xs text-muted-foreground">Avg: {houseScore.avgPercentage}%</span>
                </div>

                {/* Pair breakdown */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Pair Compatibility</p>
                  {houseScore.pairs.map((pair, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="font-medium min-w-0 truncate">{pair.pokemon1.name}</span>
                      <span className="text-muted-foreground">↔</span>
                      <span className="font-medium min-w-0 truncate">{pair.pokemon2.name}</span>
                      <CompatibilityBadge result={pair} />
                    </div>
                  ))}
                </div>

                {houseScore.strongestPair && (
                  <p className="text-xs text-green-700 mt-3">
                    ✦ Strongest: {houseScore.strongestPair.pokemon1.name} & {houseScore.strongestPair.pokemon2.name}
                  </p>
                )}
                {houseScore.weakestPair && (
                  <p className="text-xs text-orange-600">
                    ✦ Weakest: {houseScore.weakestPair.pokemon1.name} & {houseScore.weakestPair.pokemon2.name}
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-2 mt-4">
              {houseMembers.length > 0 && (
                <>
                  <Button size="sm" variant="outline" className="text-xs gap-1" onClick={handleSave}>
                    <Save className="w-3 h-3" /> Save House
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => setHouseMembers([])}>
                    <Trash2 className="w-3 h-3" /> Clear
                  </Button>
                  {houseMembers.length <= 3 && (
                    <Button size="sm" className="text-xs gap-1" onClick={() => setShowAutoOptimize(!showAutoOptimize)}>
                      <Sparkles className="w-3 h-3" /> Auto-Optimize
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Auto optimize results */}
          {showAutoOptimize && autoResults.length > 0 && (
            <div className="bg-card rounded-2xl border border-border/40 shadow-sm p-5">
              <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-pokopia-green" /> Best Houses Including Your Selection
              </h3>
              {autoResults.map((house, idx) => (
                <div key={idx} className={`${idx > 0 ? 'mt-3 pt-3 border-t border-border/50' : ''}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-muted-foreground">#{idx + 1}</span>
                    <Badge className={`${getHouseLabelColor(house.houseScore.label)} border text-[10px]`}>
                      {house.houseScore.avgPercentage}% — {house.houseScore.label}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {house.pokemon.map(p => (
                      <button
                        key={p.id}
                        onClick={() => setHouseMembers(house.ids)}
                        className="flex items-center gap-2 bg-card rounded-lg border border-border/50 px-3 py-1.5 hover:border-primary/20 transition-colors text-left"
                      >
                        <img src={p.imageUrl} alt={p.name} className="w-7 h-7 object-contain" />
                        <span className="text-xs font-medium">{p.name}</span>
                      </button>
                    ))}
                  </div>
                  <Button size="sm" variant="ghost" className="text-xs mt-1 text-primary" onClick={() => setHouseMembers(house.ids)}>
                    Use this house
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Add Pokémon & suggestions */}
        <div className="space-y-4">
          {houseMembers.length < 4 && (
            <div className="bg-card rounded-2xl border border-border/50 p-4">
              <h3 className="font-semibold text-sm mb-3">Add Pokémon</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>
              {searchResults.length > 0 && (
                <div className="mt-2 space-y-1">
                  {searchResults.map(p => (
                    <button
                      key={p.id}
                      onClick={() => addMember(p.id)}
                      className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
                    >
                      <img src={p.imageUrl} alt={p.name} className="w-8 h-8 object-contain" />
                      <div>
                        <p className="text-sm font-medium">{p.name}</p>
                        <p className="text-[10px] text-muted-foreground">{p.type}</p>
                      </div>
                      <Plus className="w-4 h-4 text-muted-foreground ml-auto" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="bg-card rounded-2xl border border-border/50 p-4">
              <h3 className="font-semibold text-sm mb-3">Best Next Additions</h3>
              <div className="space-y-1">
                {suggestions.slice(0, 6).map(s => (
                  <button
                    key={s.pokemon.id}
                    onClick={() => addMember(s.pokemon.id)}
                    style={{ userSelect: 'none' }}
                    className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
                  >
                    <img src={s.pokemon.imageUrl} alt={s.pokemon.name} className="w-8 h-8 object-contain" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{s.pokemon.name}</p>
                      <p className="text-[10px] text-muted-foreground">House avg: {s.addedValue}%</p>
                    </div>
                    <Plus className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Saved houses */}
          {savedHouses.length > 0 && (
            <div className="bg-card rounded-2xl border border-border/50 p-4">
              <h3 className="font-semibold text-sm mb-3">Saved Houses</h3>
              <div className="space-y-2">
                {savedHouses.map(h => (
                  <div key={h.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border/30">
                    <div className="flex -space-x-2">
                      {(h.memberIds || []).slice(0, 4).map(mid => {
                        const mp = getPokemonById(mid);
                        return mp ? <img key={mid} src={mp.imageUrl} alt="" className="w-7 h-7 rounded-full border-2 border-card object-contain bg-muted" /> : null;
                      })}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{h.name}</p>
                      <p className="text-[10px] text-muted-foreground">{(h.memberIds || []).length}/4</p>
                    </div>
                    <Button size="sm" variant="ghost" className="text-[10px] h-6 px-2" onClick={() => loadHouse(h)}>Load</Button>
                    <Button size="sm" variant="ghost" className="text-[10px] h-6 px-1" onClick={() => handleDelete(h.id)}>
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}