import React, { useState, useMemo, useEffect } from 'react';
import { Plus, X, Search, Save, Sparkles, ArrowLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { POKEMON_DATA, TOWNS, getPokemonById } from '@/lib/pokemonData';
import { calculateHouseScore, getHouseLabelColor, autoDistributeHouses } from '@/lib/compatibility';
import { getTownPlans, saveTownPlans } from '@/lib/storage';
import HouseOccupancy from '@/components/pokemon/HouseOccupancy';
import PokemonSilhouette from '@/components/pokemon/PokemonSilhouette';
import CompatibilityBadge from '@/components/pokemon/CompatibilityBadge';
import { calculatePairScore } from '@/lib/compatibility';

export default function TownPlanner() {
  const params = new URLSearchParams(window.location.search);
  const selectedTownId = params.get('town');
  const [plans, setPlans] = useState(getTownPlans());
  const [search, setSearch] = useState('');
  const [activeTown, setActiveTown] = useState(selectedTownId || null);
  const [selectedHouseId, setSelectedHouseId] = useState(null);
  const [unassignedTab, setUnassignedTab] = useState('native');
  const [unassignedSearch, setUnassignedSearch] = useState('');

  const activeTownData = TOWNS.find(t => t.id === activeTown);
  const townPlan = activeTown ? (plans[activeTown] || { houses: [] }) : null;

  // Auto-select house if only one exists
  useEffect(() => {
    if (townPlan?.houses?.length === 1) {
      setSelectedHouseId(townPlan.houses[0].id);
    } else if (townPlan?.houses?.length === 0) {
      setSelectedHouseId(null);
    }
  }, [townPlan?.houses?.length]);

  // Pokémon in this town by location
  const townPokemon = useMemo(() => {
    if (!activeTownData) return [];
    return POKEMON_DATA.filter(p => p.location === activeTownData.name);
  }, [activeTownData]);

  // Pokémon already assigned to houses in this town
  const assignedIds = useMemo(() => {
    if (!townPlan) return new Set();
    return new Set(townPlan.houses.flatMap(h => h.memberIds || []));
  }, [townPlan]);

  const unassigned = townPokemon.filter(p => !assignedIds.has(p.id));
  const allUnassigned = POKEMON_DATA.filter(p => !assignedIds.has(p.id));

  const filteredNative = unassigned.filter(p => p.name.toLowerCase().includes(unassignedSearch.toLowerCase()));
  const filteredAll = allUnassigned.filter(p => p.name.toLowerCase().includes(unassignedSearch.toLowerCase()));

  const searchResults = useMemo(() => {
    if (!search) return [];
    return POKEMON_DATA
      .filter(p => p.name.toLowerCase().includes(search.toLowerCase()) && !assignedIds.has(p.id))
      .slice(0, 8);
  }, [search, assignedIds]);

  const updatePlans = (newPlans) => {
    setPlans(newPlans);
    saveTownPlans(newPlans);
  };

  const addHouse = () => {
    if (!activeTown) return;
    const newPlans = { ...plans };
    if (!newPlans[activeTown]) newPlans[activeTown] = { houses: [] };
    newPlans[activeTown].houses.push({
      id: Date.now().toString(),
      name: `House ${newPlans[activeTown].houses.length + 1}`,
      memberIds: [],
    });
    updatePlans(newPlans);
  };

  const removeHouse = (houseId) => {
    const newPlans = { ...plans };
    newPlans[activeTown].houses = newPlans[activeTown].houses.filter(h => h.id !== houseId);
    updatePlans(newPlans);
  };

  const addToHouse = (houseId, pokemonId) => {
    const newPlans = { ...plans };
    const house = newPlans[activeTown].houses.find(h => h.id === houseId);
    if (!house || house.memberIds.length >= 4 || house.memberIds.includes(pokemonId)) return;
    house.memberIds.push(pokemonId);
    updatePlans(newPlans);
    setSearch('');
  };

  const removeFromHouse = (houseId, pokemonId) => {
    const newPlans = { ...plans };
    const house = newPlans[activeTown].houses.find(h => h.id === houseId);
    if (!house) return;
    house.memberIds = house.memberIds.filter(id => id !== pokemonId);
    updatePlans(newPlans);
  };

  const autoFillTown = () => {
    if (!activeTown) return;
    const unassignedIds = unassigned.map(p => p.id);
    if (unassignedIds.length === 0) return;
    const autoHouses = autoDistributeHouses(unassignedIds);
    const newPlans = { ...plans };
    if (!newPlans[activeTown]) newPlans[activeTown] = { houses: [] };
    autoHouses.forEach((h, i) => {
      newPlans[activeTown].houses.push({
        id: Date.now().toString() + i,
        name: h.name,
        memberIds: h.ids,
      });
    });
    updatePlans(newPlans);
  };

  const getCompatibilityWithHouse = (pokemonId) => {
    if (!selectedHouseId) return null;
    const house = townPlan?.houses.find(h => h.id === selectedHouseId);
    if (!house || !house.memberIds?.length) return null;
    const pokemon = getPokemonById(pokemonId);
    if (!pokemon) return null;
    const scores = house.memberIds.map(memberId => {
      const member = getPokemonById(memberId);
      return member ? calculatePairScore(pokemon, member) : null;
    }).filter(s => s && s.percentage !== undefined);
    if (!scores.length) return null;
    const avgPercentage = Math.round(scores.reduce((sum, s) => sum + s.percentage, 0) / scores.length);
    return { percentage: avgPercentage, label: scores[0].label };
  };

  // Town overview
  if (!activeTown) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-1">Town Planner</h1>
        <p className="text-sm text-muted-foreground mb-6">Organize houses across different towns</p>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {TOWNS.map(town => {
            const tp = plans[town.id] || { houses: [] };
            const totalPokemon = tp.houses.reduce((s, h) => s + (h.memberIds || []).length, 0);
            const nativePokemon = POKEMON_DATA.filter(p => p.location === town.name).length;
            return (
              <button
                key={town.id}
                onClick={() => setActiveTown(town.id)}
                className="bg-card rounded-2xl border border-border/50 p-6 text-left hover:shadow-lg hover:border-primary/20 transition-all"
              >
                <span className="text-3xl mb-3 block">{town.icon}</span>
                <h2 className="font-bold text-lg mb-1">{town.name}</h2>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>{nativePokemon} native Pokémon</p>
                  <p>{tp.houses.length} houses planned</p>
                  <p>{totalPokemon} Pokémon assigned</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground mt-3" />
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Town detail view
  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <button onClick={() => setActiveTown(null)} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> All Towns
      </button>

      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">{activeTownData?.icon}</span>
        <div>
          <h1 className="text-2xl font-bold">{activeTownData?.name}</h1>
          <p className="text-sm text-muted-foreground">
            {townPokemon.length} native Pokémon · {townPlan?.houses.length || 0} houses
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <Button size="sm" className="text-xs gap-1" onClick={addHouse}>
          <Plus className="w-3 h-3" /> Add House
        </Button>
        {unassigned.length > 0 && (
          <Button size="sm" variant="outline" className="text-xs gap-1" onClick={autoFillTown}>
            <Sparkles className="w-3 h-3" /> Auto-Fill ({unassigned.length} unassigned)
          </Button>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Houses */}
        <div className="md:col-span-2 space-y-4">
          {(townPlan?.houses || []).map(house => {
            const score = calculateHouseScore(house.memberIds || []);
            return (
              <div key={house.id} className={`bg-card rounded-2xl border p-4 transition-colors cursor-pointer ${selectedHouseId === house.id ? 'border-4 border-primary' : 'border border-border/50'}`} onClick={() => setSelectedHouseId(house.id)}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">{house.name}</h3>
                  <div className="flex items-center gap-2">
                    <HouseOccupancy count={(house.memberIds || []).length} />
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeHouse(house.id)}>
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {(house.memberIds || []).length > 0 ? (
                  <div className="space-y-2">
                    {(house.memberIds || []).map(mid => {
                      const p = getPokemonById(mid);
                      if (!p) return null;
                      return (
                        <div key={mid} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                           <div className="w-8 h-8 flex-shrink-0 bg-muted/30 rounded">
                             <PokemonSilhouette src={p.imageUrl} alt={p.name} primaryType={p.type?.split('/')[0]} className="w-8 h-8" />
                           </div>
                          <span className="text-sm font-medium flex-1">{p.name}</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFromHouse(house.id, mid)}>
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      );
                    })}
                    {score.label && (
                      <Badge className={`${getHouseLabelColor(score.label)} border text-[10px] mt-2`}>
                        {score.avgPercentage}% — {score.label}
                      </Badge>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-4">Empty house</p>
                )}

                {/* Quick add */}
                {(house.memberIds || []).length < 4 && (
                  <div className="mt-3">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                      <Input
                        placeholder="Add Pokémon..."
                        className="h-8 text-xs pl-7"
                        onChange={e => {
                          const q = e.target.value.toLowerCase();
                          if (q.length < 2) return;
                          const match = POKEMON_DATA.find(p => p.name.toLowerCase().startsWith(q) && !assignedIds.has(p.id));
                          if (match) {
                            addToHouse(house.id, match.id);
                            e.target.value = '';
                          }
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {(townPlan?.houses || []).length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-sm">No houses yet. Add a house or auto-fill to get started.</p>
            </div>
          )}
        </div>

        {/* Unassigned sidebar */}
        <div>
          <div className="bg-card rounded-2xl border border-border/50 p-4">
            <h3 className="font-semibold text-sm mb-3">Unassigned Pokémon</h3>
            <Tabs value={unassignedTab} onValueChange={setUnassignedTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-3">
                <TabsTrigger value="native" className="text-xs">Native ({unassigned.length})</TabsTrigger>
                <TabsTrigger value="all" className="text-xs">All ({allUnassigned.length})</TabsTrigger>
              </TabsList>

              <div className="mb-3 relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={unassignedSearch}
                  onChange={e => setUnassignedSearch(e.target.value)}
                  className="h-8 text-xs pl-7"
                />
              </div>

              <TabsContent value="native">
                <div className="space-y-1 max-h-96 overflow-y-auto">
                  {POKEMON_DATA.filter(p => p.location === activeTownData?.name).filter(p => p.name.toLowerCase().includes(unassignedSearch.toLowerCase())).map(p => {
                    const isAssigned = assignedIds.has(p.id);
                    const compat = getCompatibilityWithHouse(p.id);
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          if (selectedHouseId && !isAssigned) {
                            addToHouse(selectedHouseId, p.id);
                          }
                        }}
                        disabled={!selectedHouseId || isAssigned}
                        className={`flex items-center gap-2 p-1.5 rounded-lg transition-colors w-full text-left ${isAssigned ? 'opacity-40 cursor-not-allowed' : 'hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed'}`}
                      >
                        <div className="w-7 h-7 flex-shrink-0 bg-muted/30 rounded">
                          <PokemonSilhouette src={p.imageUrl} alt={p.name} primaryType={p.type?.split('/')[0]} className="w-7 h-7" />
                        </div>
                        <span className="text-xs font-medium flex-1 truncate">{p.name} {compat && <span className="text-muted-foreground">· {compat.percentage}%</span>}</span>
                        <Badge variant="secondary" className="text-[10px]">{p.idealHabitat}</Badge>
                      </button>
                    );
                  })}
                </div>
              </TabsContent>

              <TabsContent value="all">
                <div className="space-y-1 max-h-96 overflow-y-auto">
                  {POKEMON_DATA.filter(p => p.name.toLowerCase().includes(unassignedSearch.toLowerCase())).map(p => {
                    const isAssigned = assignedIds.has(p.id);
                    const compat = getCompatibilityWithHouse(p.id);
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          if (selectedHouseId && !isAssigned) {
                            addToHouse(selectedHouseId, p.id);
                          }
                        }}
                        disabled={!selectedHouseId || isAssigned}
                        className={`flex items-center gap-2 p-1.5 rounded-lg transition-colors w-full text-left ${isAssigned ? 'opacity-40 cursor-not-allowed' : 'hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed'}`}
                      >
                        <div className="w-7 h-7 flex-shrink-0 bg-muted/30 rounded">
                          <PokemonSilhouette src={p.imageUrl} alt={p.name} primaryType={p.type?.split('/')[0]} className="w-7 h-7" />
                        </div>
                        <span className="text-xs font-medium flex-1 truncate">{p.name} {compat && <span className="text-muted-foreground">· {compat.percentage}%</span>}</span>
                      </button>
                    );
                  })}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}