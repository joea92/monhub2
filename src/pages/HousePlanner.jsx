import React, { useState, useMemo, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, X, Sparkles, AlertTriangle, Search, Save, Trash2, Layers, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { POKEMON_DATA, getPokemonById } from '@/lib/pokemonData';
import { calculateHouseScore, suggestNextMember, optimizeBestHouse, getHouseLabelColor, calculatePairScore } from '@/lib/compatibility';
import { saveHouse, getSavedHouses, deleteHouse } from '@/lib/storage';
import HouseOccupancy from '@/components/pokemon/HouseOccupancy';
import TypeBadge from '@/components/pokemon/TypeBadge';
import CompatibilityBadge from '@/components/pokemon/CompatibilityBadge';
import PokemonSilhouette from '@/components/pokemon/PokemonSilhouette';

// Slot component for empty or filled pokemon spots
function PokemonSlot({ id, index, onRemove, isWeakest, showWeakest }) {
  const p = id ? getPokemonById(id) : null;

  return (
    <Draggable draggableId={id ? String(id) : `empty-${index}`} index={index} isDragDisabled={!id}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
            p
              ? snapshot.isDragging
                ? 'bg-primary/10 border-primary shadow-lg'
                : 'bg-muted/30 border-border/30'
              : 'bg-muted/10 border-dashed border-border/40'
          }`}
        >
          {p ? (
            <>
              <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing text-muted-foreground">
                <GripVertical className="w-4 h-4" />
              </div>
              <div className="w-10 h-10 flex-shrink-0 bg-muted/30 rounded">
                <PokemonSilhouette src={p.imageUrl} alt={p.name} primaryType={p.type?.split('/')[0]} className="w-10 h-10" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{p.name}</p>
                <TypeBadge type={p.type} />
              </div>
              {showWeakest && isWeakest && (
                <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] flex-shrink-0">
                  <AlertTriangle className="w-3 h-3 mr-1" /> Weakest
                </Badge>
              )}
              <Button variant="ghost" size="icon" className="flex-shrink-0 h-7 w-7" onClick={() => onRemove(id)}>
                <X className="w-3 h-3" />
              </Button>
            </>
          ) : (
            <div className="flex-1 text-center py-1 text-xs text-muted-foreground">Empty slot</div>
          )}
        </div>
      )}
    </Draggable>
  );
}

// Floor section with droppable area
function FloorSection({ label, floorIds, allIds, splitMode, onRemove, houseScore }) {
  const filledIds = floorIds.filter(Boolean);
  const floorScore = filledIds.length >= 2 ? calculateHouseScore(filledIds) : null;
  const weakestId = floorScore?.weakestMember?.pokemon?.id;

  return (
    <div className="space-y-2">
      {splitMode && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
          {floorScore && (
            <Badge className={`${getHouseLabelColor(floorScore.label)} border text-[10px]`}>
              {floorScore.avgPercentage}%
            </Badge>
          )}
        </div>
      )}
      <Droppable droppableId={label}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`space-y-2 min-h-[60px] rounded-xl transition-colors ${snapshot.isDraggingOver ? 'bg-primary/5' : ''}`}
          >
            {floorIds.map((id, index) => (
              <PokemonSlot
                key={id || `empty-${label}-${index}`}
                id={id}
                index={index}
                onRemove={onRemove}
                isWeakest={id === weakestId}
                showWeakest={splitMode && filledIds.length >= 2}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}

export default function HousePlanner() {
  // houseMembers: array of 4 slots (null = empty), always 4 when splitMode
  const [houseMembers, setHouseMembers] = useState([]);
  const [splitMode, setSplitMode] = useState(false);
  // overflowFloor: which floor label has >2 pokemon (persistent warning)
  const [overflowFloor, setOverflowFloor] = useState(null);
  const [search, setSearch] = useState('');
  const [savedHouses, setSavedHouses] = useState(getSavedHouses());
  const [showAutoOptimize, setShowAutoOptimize] = useState(false);

  // Normalize: filled ids only
  const filledIds = houseMembers.filter(Boolean);

  // Split: floor1 = first half, floor2 = second half (supports >2 per floor when overflow)
  const midpoint = Math.ceil(houseMembers.length / 2);
  const floor1Ids = splitMode ? houseMembers.slice(0, midpoint) : [];
  const floor2Ids = splitMode ? houseMembers.slice(midpoint) : [];

  const floor1Filled = floor1Ids.filter(Boolean);
  const floor2Filled = floor2Ids.filter(Boolean);

  const floor1Score = useMemo(() => floor1Filled.length >= 2 ? calculateHouseScore(floor1Filled) : null, [floor1Filled.join(',')]);
  const floor2Score = useMemo(() => floor2Filled.length >= 2 ? calculateHouseScore(floor2Filled) : null, [floor2Filled.join(',')]);
  const wholeHouseScore = useMemo(() => filledIds.length >= 2 ? calculateHouseScore(filledIds) : null, [filledIds.join(',')]);

  const suggestions = useMemo(() => {
    if (filledIds.length >= 4) return [];
    if (filledIds.length === 0) {
      const shuffled = [...POKEMON_DATA].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, 6).map(p => ({ pokemon: p, addedValue: '—' }));
    }
    return suggestNextMember(filledIds);
  }, [filledIds.join(',')]);

  const autoResults = useMemo(() => {
    if (!showAutoOptimize || filledIds.length === 0) return [];
    return optimizeBestHouse(filledIds, 5);
  }, [showAutoOptimize, filledIds.join(',')]);

  const searchResults = useMemo(() => {
    if (!search) return [];
    return POKEMON_DATA
      .filter(p => p.name.toLowerCase().includes(search.toLowerCase()) && !filledIds.includes(p.id))
      .slice(0, 8);
  }, [search, filledIds.join(',')]);

  const toggleSplitMode = () => {
    if (!splitMode) {
      // Entering split mode: pad to 4 slots
      const padded = [...houseMembers];
      while (padded.length < 4) padded.push(null);
      setHouseMembers(padded.slice(0, 4));
    }
    setSplitMode(s => !s);
  };

  const addMember = (id) => {
    if (filledIds.length >= 4 || filledIds.includes(id)) return;
    if (splitMode) {
      // Fill first empty slot
      const slots = [...houseMembers];
      while (slots.length < 4) slots.push(null);
      const emptyIdx = slots.indexOf(null);
      if (emptyIdx !== -1) slots[emptyIdx] = id;
      setHouseMembers(slots);
    } else {
      setHouseMembers([...houseMembers, id]);
    }
    setSearch('');
  };

  const removeMember = (id) => {
    if (splitMode) {
      const slots = houseMembers.map(m => m === id ? null : m);
      setHouseMembers(slots);
    } else {
      setHouseMembers(houseMembers.filter(m => m !== id));
    }
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const { source, destination } = result;

    const floorMap = { 'Floor 1': [0, 1], 'Floor 2': [2, 3] };
    const srcFloor = floorMap[source.droppableId];
    const dstFloor = floorMap[destination.droppableId];
    if (!srcFloor || !dstFloor) return;

    // Same floor reorder: swap within floor slots
    if (source.droppableId === destination.droppableId) {
      const srcSlotIdx = srcFloor[source.index];
      const dstSlotIdx = dstFloor[destination.index];
      if (srcSlotIdx === dstSlotIdx) return;
      const newSlots = [...houseMembers];
      [newSlots[srcSlotIdx], newSlots[dstSlotIdx]] = [newSlots[dstSlotIdx], newSlots[srcSlotIdx]];
      setHouseMembers(newSlots);
      return;
    }

    // Cross-floor move: always allow, but if destination ends up with >2, show persistent warning
    const srcSlotIdx = srcFloor[source.index];
    const newSlots = [...houseMembers];
    const movedId = newSlots[srcSlotIdx];
    if (!movedId) return;

    // Find first empty slot in destination floor, or append before the other floor's start
    const dstSlots = dstFloor;
    const emptyDstSlot = dstSlots.find(idx => !newSlots[idx]);
    if (emptyDstSlot !== undefined) {
      // Normal move into empty slot
      newSlots[emptyDstSlot] = movedId;
      newSlots[srcSlotIdx] = null;
      setHouseMembers(newSlots);
      setOverflowFloor(null);
    } else {
      // Destination floor is full — add anyway by expanding the array
      // Remove from source slot, insert into destination floor
      newSlots[srcSlotIdx] = null;
      // Insert movedId after the last slot of dstFloor
      const insertAfter = Math.max(...dstSlots);
      const expanded = [...newSlots.slice(0, insertAfter + 1), movedId, ...newSlots.slice(insertAfter + 1)];
      setHouseMembers(expanded);
      setOverflowFloor(destination.droppableId);
    }
  };

  // Clear overflow warning when floor drops back to ≤2
  const floor1OverflowCount = floor1Ids.filter(Boolean).length;
  const floor2OverflowCount = floor2Ids.filter(Boolean).length;
  React.useEffect(() => {
    if (overflowFloor === 'Floor 1' && floor1OverflowCount <= 2) setOverflowFloor(null);
    if (overflowFloor === 'Floor 2' && floor2OverflowCount <= 2) setOverflowFloor(null);
  }, [floor1OverflowCount, floor2OverflowCount, overflowFloor]);

  const handleSave = () => {
    const house = {
      id: Date.now().toString(),
      name: `House ${savedHouses.length + 1}`,
      memberIds: filledIds,
      splitMode,
      slots: splitMode ? houseMembers : undefined,
      createdAt: new Date().toISOString(),
    };
    const updated = saveHouse(house);
    setSavedHouses(updated);
  };

  const handleDelete = (houseId) => {
    setSavedHouses(deleteHouse(houseId));
  };

  const loadHouse = (house) => {
    if (house.splitMode && house.slots) {
      setHouseMembers(house.slots);
      setSplitMode(true);
    } else {
      setHouseMembers(house.memberIds || []);
      setSplitMode(false);
    }
  };

  const handleClear = () => {
    setHouseMembers(splitMode ? [null, null, null, null] : []);
  };

  const totalCount = filledIds.length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-1">House Planner</h1>
      <p className="text-sm text-muted-foreground mb-6">Build a house of up to 4 compatible Pokémon</p>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left: Current house */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-card rounded-2xl border border-border/50 p-5">
            <div className="flex items-center justify-between mb-4 gap-2">
              <h2 className="font-bold shrink-0">Current House</h2>
              <div className="flex items-center gap-2 ml-auto">
                <Button
                  size="sm"
                  variant={splitMode ? 'default' : 'outline'}
                  className="text-xs gap-1 h-7 shrink-0"
                  onClick={toggleSplitMode}
                >
                  <Layers className="w-3 h-3" />
                  {splitMode ? 'Two Floors' : 'Split Floors'}
                </Button>
                <HouseOccupancy count={totalCount} />
              </div>
            </div>

            {/* House content */}
            {splitMode ? (
              <DragDropContext onDragEnd={onDragEnd}>
                <div className="space-y-3">
                  <FloorSection
                    label="Floor 1"
                    floorIds={floor1Ids}
                    allIds={houseMembers}
                    splitMode={splitMode}
                    onRemove={removeMember}
                    houseScore={floor1Score}
                  />
                  <div className="relative flex items-center gap-2 py-1">
                    <div className="flex-1 border-t-2 border-dashed border-border/60" />
                    {overflowFloor ? (
                      <span className="text-[10px] text-red-500 font-medium px-2 bg-card whitespace-nowrap">
                        Please remove one Pokémon from {overflowFloor}
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground font-medium px-2 bg-card">drag to rearrange floors</span>
                    )}
                    <div className="flex-1 border-t-2 border-dashed border-border/60" />
                  </div>
                  <FloorSection
                    label="Floor 2"
                    floorIds={floor2Ids}
                    allIds={houseMembers}
                    splitMode={splitMode}
                    onRemove={removeMember}
                    houseScore={floor2Score}
                  />
                </div>
              </DragDropContext>
            ) : (
              <>
                {houseMembers.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <p className="text-sm">Add Pokémon to start building a house</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {houseMembers.map(id => {
                      const p = getPokemonById(id);
                      if (!p) return null;
                      return (
                        <div key={id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/30">
                          <div className="w-10 h-10 flex-shrink-0 bg-muted/30 rounded">
                            <PokemonSilhouette src={p.imageUrl} alt={p.name} primaryType={p.type?.split('/')[0]} className="w-10 h-10" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm">{p.name}</p>
                            <TypeBadge type={p.type} />
                          </div>
                          {wholeHouseScore?.weakestMember?.pokemon?.id === id && houseMembers.length >= 3 && (
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
              </>
            )}

            {/* Compatibility stats */}
            {splitMode ? (
              <div className="mt-5 pt-4 border-t border-border/50 space-y-4">
                {[{ label: 'Floor 1', score: floor1Score, ids: floor1Filled }, { label: 'Floor 2', score: floor2Score, ids: floor2Filled }].map(({ label, score, ids }) => (
                  score && (
                    <div key={label}>
                      <p className="text-xs font-semibold mb-2">{label} Compatibility</p>
                      <div className="space-y-1">
                        {score.pairs.map((pair, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            <span className="font-medium truncate">{pair.pokemon1.name}</span>
                            <span className="text-muted-foreground">↔</span>
                            <span className="font-medium truncate">{pair.pokemon2.name}</span>
                            <CompatibilityBadge result={pair} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                ))}
                {!floor1Score && !floor2Score && (
                  <p className="text-xs text-muted-foreground">Add Pokémon to see floor compatibility</p>
                )}
              </div>
            ) : (
              wholeHouseScore && filledIds.length >= 2 && (
                <div className="mt-5 pt-4 border-t border-border/50">
                  <div className="flex flex-wrap gap-3 mb-3">
                    <Badge className={`${getHouseLabelColor(wholeHouseScore.label)} border text-xs`}>
                      {wholeHouseScore.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">Avg: {wholeHouseScore.avgPercentage}%</span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Pair Compatibility</p>
                    {wholeHouseScore.pairs.map((pair, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span className="font-medium min-w-0 truncate">{pair.pokemon1.name}</span>
                        <span className="text-muted-foreground">↔</span>
                        <span className="font-medium min-w-0 truncate">{pair.pokemon2.name}</span>
                        <CompatibilityBadge result={pair} />
                      </div>
                    ))}
                  </div>
                  {wholeHouseScore.strongestPair && (
                    <p className="text-xs text-green-700 mt-3">✦ Strongest: {wholeHouseScore.strongestPair.pokemon1.name} & {wholeHouseScore.strongestPair.pokemon2.name}</p>
                  )}
                  {wholeHouseScore.weakestPair && (
                    <p className="text-xs text-orange-600">✦ Weakest: {wholeHouseScore.weakestPair.pokemon1.name} & {wholeHouseScore.weakestPair.pokemon2.name}</p>
                  )}
                </div>
              )
            )}

            <div className="flex flex-wrap gap-2 mt-4">
              {totalCount > 0 && (
                <>
                  <Button size="sm" variant="outline" className="text-xs gap-1" onClick={handleSave}>
                    <Save className="w-3 h-3" /> Save House
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs gap-1" onClick={handleClear}>
                    <Trash2 className="w-3 h-3" /> Clear
                  </Button>
                </>
              )}
              {!splitMode && totalCount <= 3 && totalCount > 0 && (
                <Button size="sm" className="text-xs gap-1" onClick={() => setShowAutoOptimize(!showAutoOptimize)}>
                  <Sparkles className="w-3 h-3" /> Auto-Optimize
                </Button>
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
                      <button key={p.id} onClick={() => { setHouseMembers(house.ids); setSplitMode(false); }}
                        className="flex items-center gap-2 bg-card rounded-lg border border-border/50 px-3 py-1.5 hover:border-primary/20 transition-colors text-left">
                        <div className="w-7 h-7 flex-shrink-0 bg-muted/30 rounded">
                          <PokemonSilhouette src={p.imageUrl} alt={p.name} primaryType={p.type?.split('/')[0]} className="w-7 h-7" />
                        </div>
                        <span className="text-xs font-medium">{p.name}</span>
                      </button>
                    ))}
                  </div>
                  <Button size="sm" variant="ghost" className="text-xs mt-1 text-primary" onClick={() => { setHouseMembers(house.ids); setSplitMode(false); }}>
                    Use this house
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Add Pokémon & suggestions */}
        <div className="space-y-4">
          {totalCount < 4 && (
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
                    <button key={p.id} onClick={() => addMember(p.id)}
                      className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-muted/50 transition-colors text-left">
                      <div className="w-8 h-8 flex-shrink-0 bg-muted/30 rounded">
                        <PokemonSilhouette src={p.imageUrl} alt={p.name} primaryType={p.type?.split('/')[0]} className="w-8 h-8" />
                      </div>
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

          {suggestions.length > 0 && (
            <div className="bg-card rounded-2xl border border-border/50 p-4">
              <h3 className="font-semibold text-sm mb-3">{filledIds.length === 0 ? 'Random Suggestions' : 'Best Next Additions'}</h3>
              <div className="space-y-1">
                {suggestions.slice(0, 6).map(s => (
                  <button key={s.pokemon.id} onClick={() => addMember(s.pokemon.id)}
                    style={{ userSelect: 'none' }}
                    className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-muted/50 transition-colors text-left">
                    <div className="w-8 h-8 flex-shrink-0 bg-muted/30 rounded">
                      <PokemonSilhouette src={s.pokemon.imageUrl} alt={s.pokemon.name} primaryType={s.pokemon.type?.split('/')[0]} className="w-8 h-8" />
                    </div>
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

          {savedHouses.length > 0 && (
            <div className="bg-card rounded-2xl border border-border/50 p-4">
              <h3 className="font-semibold text-sm mb-3">Saved Houses</h3>
              <div className="space-y-2">
                {savedHouses.map(h => (
                  <div key={h.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border/30">
                    <div className="flex -space-x-2">
                      {(h.memberIds || []).slice(0, 4).map(mid => {
                        const mp = getPokemonById(mid);
                        return mp ? (
                          <div key={mid} className="w-7 h-7 rounded-full border-2 border-card bg-muted overflow-hidden flex-shrink-0">
                            <PokemonSilhouette src={mp.imageUrl} alt="" primaryType={mp.type?.split('/')[0]} className="w-7 h-7" />
                          </div>
                        ) : null;
                      })}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{h.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {(h.memberIds || []).length}/4 {h.splitMode && '· 2 floors'}
                      </p>
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