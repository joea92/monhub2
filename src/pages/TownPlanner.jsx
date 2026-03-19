import React, { useState, useMemo, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, X, Search, Sparkles, ArrowLeft, ChevronRight, Layers, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { POKEMON_DATA, TOWNS, getPokemonById } from '@/lib/pokemonData';
import { calculateHouseScore, getHouseLabelColor, autoDistributeHouses, calculatePairScore } from '@/lib/compatibility';
import { getTownPlans, saveTownPlans } from '@/lib/storage';
import HouseOccupancy from '@/components/pokemon/HouseOccupancy';
import PokemonSilhouette from '@/components/pokemon/PokemonSilhouette';
import CompatibilityBadge from '@/components/pokemon/CompatibilityBadge';

// Draggable pokemon row inside a house floor
function HouseMemberRow({ id, index, onRemove, houseId }) {
  const p = getPokemonById(id);
  if (!p) return null;
  return (
    <Draggable draggableId={`${houseId}-${String(id)}`} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`flex items-center gap-2 p-2 rounded-lg transition-all ${snapshot.isDragging ? 'bg-primary/10 shadow-md' : 'bg-muted/30'}`}
        >
          <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing text-muted-foreground">
            <GripVertical className="w-3.5 h-3.5" />
          </div>
          <div className="w-8 h-8 flex-shrink-0 bg-muted/30 rounded">
            <PokemonSilhouette src={p.imageUrl} alt={p.name} primaryType={p.type?.split('/')[0]} className="w-8 h-8" />
          </div>
          <span className="text-sm font-medium flex-1">{p.name}</span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={e => { e.stopPropagation(); onRemove(id); }}>
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}
    </Draggable>
  );
}

// A single house card with optional split-floor view
function HouseCard({ house, isSelected, onSelect, onRemove, onRemoveMember, onAddMember, assignedIds, onToggleSplit, onDragEnd, overflowInfo, onOverflowClear }) {
  const memberIds = house.memberIds || [];
  const splitMode = !!house.splitMode;

  const midpoint = Math.ceil(memberIds.length / 2);
  const floor1Ids = splitMode ? memberIds.slice(0, midpoint) : [];
  const floor2Ids = splitMode ? memberIds.slice(midpoint) : [];

  const floor1Overflow = overflowInfo?.floor === 'floor1';
  const floor2Overflow = overflowInfo?.floor === 'floor2';

  // Auto-clear overflow when floor drops back to ≤2
  useEffect(() => {
    if (floor1Overflow && floor1Ids.length <= 2) onOverflowClear?.();
    if (floor2Overflow && floor2Ids.length <= 2) onOverflowClear?.();
  }, [memberIds.length]);
  const floor1Score = floor1Ids.filter(Boolean).length >= 2 ? calculateHouseScore(floor1Ids.filter(Boolean)) : null;
  const floor2Score = floor2Ids.filter(Boolean).length >= 2 ? calculateHouseScore(floor2Ids.filter(Boolean)) : null;
  const wholeScore = !splitMode && memberIds.length >= 2 ? calculateHouseScore(memberIds) : null;

  return (
    <div
      className={`bg-card rounded-2xl border p-4 transition-colors cursor-pointer ${isSelected ? 'border-4 border-primary' : 'border border-border/50'}`}
      onClick={() => onSelect(house.id)}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">{house.name}</h3>
          <Button
            size="sm"
            variant={splitMode ? 'default' : 'outline'}
            className="text-[10px] gap-1 h-6 px-2"
            onClick={e => { e.stopPropagation(); onToggleSplit(house.id); }}
          >
            <Layers className="w-3 h-3" />
            {splitMode ? '2 Floors' : 'Split'}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <HouseOccupancy count={memberIds.length} />
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); onRemove(house.id); }}>
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {memberIds.length > 0 ? (
        splitMode ? (
          <DragDropContext onDragEnd={(result) => onDragEnd(house.id, result)}>
            <div className="space-y-2">
              {/* Floor 1 */}
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Floor 1</span>
                {floor1Score && (
                  <Badge className={`${getHouseLabelColor(floor1Score.label)} border text-[10px]`}>{floor1Score.avgPercentage}%</Badge>
                )}
                {floor1Overflow && (
                  <span className="text-[10px] text-red-500 font-medium">⚠ Please remove one Pokémon from Floor 1</span>
                )}
              </div>
              <Droppable droppableId={`${house.id}-floor1`}>
                {(provided, snapshot) => (
                  <div ref={provided.innerRef} {...provided.droppableProps}
                    className={`space-y-1 min-h-[40px] rounded-lg transition-colors ${snapshot.isDraggingOver ? 'bg-primary/5' : ''}`}>
                    {floor1Ids.map((id, i) => id && (
                      <HouseMemberRow key={id} id={id} index={i} houseId={`${house.id}-f1`} onRemove={(pid) => onRemoveMember(house.id, pid)} />
                    ))}
                    {floor1Ids.filter(Boolean).length < 2 && (
                      <div className="text-[10px] text-muted-foreground text-center py-1">
                        {floor1Ids.filter(Boolean).length === 0 ? 'Drag a Pokémon here' : '1 more slot'}
                      </div>
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>

              {/* Divider */}
              <div className="relative flex items-center gap-2 py-1">
                <div className="flex-1 border-t-2 border-dashed border-border/60" />
                {isFloorFull ? (
                  <span className="text-[10px] text-red-500 font-medium px-1 whitespace-nowrap">Please remove one Pokémon first</span>
                ) : (
                  <span className="text-[10px] text-muted-foreground px-1">drag between floors</span>
                )}
                <div className="flex-1 border-t-2 border-dashed border-border/60" />
              </div>

              {/* Floor 2 */}
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Floor 2</span>
                {floor2Score && (
                  <Badge className={`${getHouseLabelColor(floor2Score.label)} border text-[10px]`}>{floor2Score.avgPercentage}%</Badge>
                )}
                {floor2Overflow && (
                  <span className="text-[10px] text-red-500 font-medium">⚠ Please remove one Pokémon from Floor 2</span>
                )}
              </div>
              <Droppable droppableId={`${house.id}-floor2`}>
                {(provided, snapshot) => (
                  <div ref={provided.innerRef} {...provided.droppableProps}
                    className={`space-y-1 min-h-[40px] rounded-lg transition-colors ${snapshot.isDraggingOver ? 'bg-primary/5' : ''}`}>
                    {floor2Ids.map((id, i) => id && (
                      <HouseMemberRow key={id} id={id} index={i} houseId={`${house.id}-f2`} onRemove={(pid) => onRemoveMember(house.id, pid)} />
                    ))}
                    {floor2Ids.filter(Boolean).length < 2 && (
                      <div className="text-[10px] text-muted-foreground text-center py-1">
                        {floor2Ids.filter(Boolean).length === 0 ? 'Drag a Pokémon here' : '1 more slot'}
                      </div>
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          </DragDropContext>
        ) : (
          <div className="space-y-2">
            {memberIds.map(mid => {
              const p = getPokemonById(mid);
              if (!p) return null;
              return (
                <div key={mid} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                  <div className="w-8 h-8 flex-shrink-0 bg-muted/30 rounded">
                    <PokemonSilhouette src={p.imageUrl} alt={p.name} primaryType={p.type?.split('/')[0]} className="w-8 h-8" />
                  </div>
                  <span className="text-sm font-medium flex-1">{p.name}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={e => { e.stopPropagation(); onRemoveMember(house.id, mid); }}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              );
            })}
            {wholeScore?.label && (
              <Badge className={`${getHouseLabelColor(wholeScore.label)} border text-[10px] mt-1`}>
                {wholeScore.avgPercentage}% — {wholeScore.label}
              </Badge>
            )}
          </div>
        )
      ) : (
        <p className="text-xs text-muted-foreground text-center py-4">Empty house</p>
      )}

      {/* Quick add */}
      {memberIds.length < 4 && (
        <div className="mt-3">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
            <Input
              placeholder="Add Pokémon..."
              className="h-8 text-xs pl-7"
              onClick={e => e.stopPropagation()}
              onChange={e => {
                const q = e.target.value.toLowerCase();
                if (q.length < 2) return;
                const match = POKEMON_DATA.find(p => p.name.toLowerCase().startsWith(q) && !assignedIds.has(p.id));
                if (match) {
                  onAddMember(house.id, match.id);
                  e.target.value = '';
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function TownPlanner() {
  const params = new URLSearchParams(window.location.search);
  const selectedTownId = params.get('town');
  const [plans, setPlans] = useState(getTownPlans());
  const [activeTown, setActiveTown] = useState(selectedTownId || null);
  const [selectedHouseId, setSelectedHouseId] = useState(null);
  // { houseId, floor: 'floor1'|'floor2' } when a floor has >2 pokemon
  const [floorFullHouseId, setFloorFullHouseId] = useState(null);
  const [unassignedTab, setUnassignedTab] = useState('native');
  const [unassignedSearch, setUnassignedSearch] = useState('');

  const activeTownData = TOWNS.find(t => t.id === activeTown);
  const townPlan = activeTown ? (plans[activeTown] || { houses: [] }) : null;

  useEffect(() => {
    if (townPlan?.houses?.length === 1) setSelectedHouseId(townPlan.houses[0].id);
    else if (townPlan?.houses?.length === 0) setSelectedHouseId(null);
  }, [townPlan?.houses?.length]);

  const townPokemon = useMemo(() => {
    if (!activeTownData) return [];
    return POKEMON_DATA.filter(p => p.location === activeTownData.name);
  }, [activeTownData]);

  const assignedIds = useMemo(() => {
    if (!plans[activeTown]) return new Set();
    return new Set(plans[activeTown].houses.flatMap(h => h.memberIds || []));
  }, [plans, activeTown]);

  const unassigned = townPokemon.filter(p => !assignedIds.has(p.id));
  const allUnassigned = POKEMON_DATA.filter(p => !assignedIds.has(p.id));

  const updatePlans = (newPlans) => {
    setPlans(newPlans);
    saveTownPlans(newPlans);
  };

  const addHouse = () => {
    if (!activeTown) return;
    const newPlans = { ...plans };
    if (!newPlans[activeTown]) newPlans[activeTown] = { houses: [] };
    newPlans[activeTown].houses.push({ id: Date.now().toString(), name: `House ${newPlans[activeTown].houses.length + 1}`, memberIds: [] });
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
  };

  const removeFromHouse = (houseId, pokemonId) => {
    const newPlans = { ...plans };
    const house = newPlans[activeTown].houses.find(h => h.id === houseId);
    if (!house) return;
    house.memberIds = house.memberIds.filter(id => id !== pokemonId);
    updatePlans(newPlans);
  };

  const toggleSplit = (houseId) => {
    const newPlans = { ...plans };
    const house = newPlans[activeTown].houses.find(h => h.id === houseId);
    if (!house) return;
    house.splitMode = !house.splitMode;
    updatePlans(newPlans);
  };

  // Handle drag-and-drop within a house's floors
  const handleHouseDragEnd = (houseId, result) => {
    if (!result.destination) return;
    const newPlans = { ...plans };
    const house = newPlans[activeTown].houses.find(h => h.id === houseId);
    if (!house) return;

    const srcDropId = result.source.droppableId;
    const dstDropId = result.destination.droppableId;
    const isFloor1Src = srcDropId.endsWith('-floor1');
    const isFloor1Dst = dstDropId.endsWith('-floor1');

    // Work with per-floor arrays (floors stored as first/second half of memberIds)
    const members = [...house.memberIds];
    const midpoint = Math.ceil(members.length / 2);
    let f1 = members.slice(0, midpoint);
    let f2 = members.slice(midpoint);

    const movedId = (isFloor1Src ? f1 : f2)[result.source.index];
    if (!movedId) return;

    if (srcDropId === dstDropId) {
      // Reorder within same floor
      const floorArr = [...(isFloor1Src ? f1 : f2)];
      floorArr.splice(result.source.index, 1);
      floorArr.splice(result.destination.index, 0, movedId);
      if (isFloor1Src) f1 = floorArr; else f2 = floorArr;
    } else {
      // Cross-floor: always allow, may result in >2 on destination
      const srcArr = [...(isFloor1Src ? f1 : f2)];
      const dstArr = [...(isFloor1Dst ? f1 : f2)];
      srcArr.splice(result.source.index, 1);
      dstArr.splice(result.destination.index, 0, movedId);
      if (isFloor1Src) { f1 = srcArr; f2 = dstArr; } else { f2 = srcArr; f1 = dstArr; }

      // Show overflow warning if destination now has >2
      if (dstArr.length > 2) {
        setFloorFullHouseId({ houseId, floor: isFloor1Dst ? 'floor1' : 'floor2' });
      }
    }

    house.memberIds = [...f1, ...f2];
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
      newPlans[activeTown].houses.push({ id: Date.now().toString() + i, name: h.name, memberIds: h.ids });
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
              <button key={town.id} onClick={() => setActiveTown(town.id)}
                className="bg-card rounded-2xl border border-border/50 p-6 text-left hover:shadow-lg hover:border-primary/20 transition-all">
                <img src={town.icon} alt={town.name} className="w-16 h-16 mb-3 object-contain" />
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
        <img src={activeTownData?.icon} alt={activeTownData?.name} className="w-12 h-12 object-contain" />
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
        <div className="md:col-span-2 space-y-4">
          {(townPlan?.houses || []).map(house => (
            <HouseCard
              key={house.id}
              house={house}
              isSelected={selectedHouseId === house.id}
              onSelect={setSelectedHouseId}
              onRemove={removeHouse}
              onRemoveMember={removeFromHouse}
              onAddMember={addToHouse}
              assignedIds={assignedIds}
              onToggleSplit={toggleSplit}
              onDragEnd={handleHouseDragEnd}
              isFloorFull={floorFullHouseId === house.id}
            />
          ))}
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
                <Input placeholder="Search..." value={unassignedSearch} onChange={e => setUnassignedSearch(e.target.value)} className="h-8 text-xs pl-7" />
              </div>
              {['native', 'all'].map(tab => (
                <TabsContent key={tab} value={tab}>
                  <div className="space-y-1 max-h-96 overflow-y-auto">
                    {(tab === 'native' ? POKEMON_DATA.filter(p => p.location === activeTownData?.name) : POKEMON_DATA)
                      .filter(p => p.name.toLowerCase().includes(unassignedSearch.toLowerCase()))
                      .map(p => {
                        const isAssigned = assignedIds.has(p.id);
                        const compat = getCompatibilityWithHouse(p.id);
                        return (
                          <button key={p.id}
                            onClick={() => { if (selectedHouseId && !isAssigned) addToHouse(selectedHouseId, p.id); }}
                            disabled={!selectedHouseId || isAssigned}
                            className={`flex items-center gap-2 p-1.5 rounded-lg transition-colors w-full text-left ${isAssigned ? 'opacity-40 cursor-not-allowed' : 'hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed'}`}
                          >
                            <div className="w-7 h-7 flex-shrink-0 bg-muted/30 rounded">
                              <PokemonSilhouette src={p.imageUrl} alt={p.name} primaryType={p.type?.split('/')[0]} className="w-7 h-7" />
                            </div>
                            <span className="text-xs font-medium flex-1 truncate">
                              {p.name} {compat && <span className="text-muted-foreground">· {compat.percentage}%</span>}
                            </span>
                            {tab === 'native' && <Badge variant="secondary" className="text-[10px]">{p.idealHabitat}</Badge>}
                          </button>
                        );
                      })}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}