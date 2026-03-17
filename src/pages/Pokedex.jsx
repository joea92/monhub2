import React, { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { POKEMON_DATA, ALL_TYPES, ALL_SPECIALTIES, ALL_HABITATS, ALL_LOCATIONS } from '@/lib/pokemonData';
import PokemonCard from '@/components/pokemon/PokemonCard';

export default function Pokedex() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [specialtyFilter, setSpecialtyFilter] = useState('all');
  const [habitatFilter, setHabitatFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [sortBy, setSortBy] = useState('number');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    let result = POKEMON_DATA;
    if (search) result = result.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    if (typeFilter !== 'all') result = result.filter(p => p.type.includes(typeFilter));
    if (specialtyFilter !== 'all') result = result.filter(p => p.specialty.includes(specialtyFilter));
    if (habitatFilter !== 'all') result = result.filter(p => p.idealHabitat === habitatFilter);
    if (locationFilter !== 'all') result = result.filter(p => p.location === locationFilter);

    if (sortBy === 'name') result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === 'habitat') result = [...result].sort((a, b) => a.idealHabitat.localeCompare(b.idealHabitat));
    else if (sortBy === 'type') result = [...result].sort((a, b) => a.type.localeCompare(b.type));
    else result = [...result].sort((a, b) => a.id - b.id);

    return result;
  }, [search, typeFilter, specialtyFilter, habitatFilter, locationFilter, sortBy]);

  const hasActiveFilters = typeFilter !== 'all' || specialtyFilter !== 'all' || habitatFilter !== 'all' || locationFilter !== 'all';

  const clearFilters = () => {
    setTypeFilter('all');
    setSpecialtyFilter('all');
    setHabitatFilter('all');
    setLocationFilter('all');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Pokédex</h1>
        <p className="text-sm text-muted-foreground">{POKEMON_DATA.length} Pokémon available</p>
      </div>

      {/* Search & filters */}
      <div className="space-y-3 mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search Pokémon..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            variant={showFilters ? "secondary" : "outline"}
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            className="relative"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {hasActiveFilters && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-primary" />}
          </Button>
        </div>

        {showFilters && (
          <div className="bg-card rounded-xl border border-border/50 p-4 space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Type</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {['Grass','Fire','Water','Normal','Bug','Poison','Electric','Ground','Fighting','Psychic','Rock','Ghost','Ice','Dragon','Dark','Steel','Fairy','Flying'].map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Specialty</label>
                <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Specialties</SelectItem>
                    {ALL_SPECIALTIES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Habitat</label>
                <Select value={habitatFilter} onValueChange={setHabitatFilter}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Habitats</SelectItem>
                    {ALL_HABITATS.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Location</label>
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {ALL_LOCATIONS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-muted-foreground">Sort by:</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-8 text-xs w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="number">Pokédex #</SelectItem>
                    <SelectItem value="name">Name A-Z</SelectItem>
                    <SelectItem value="habitat">Habitat</SelectItem>
                    <SelectItem value="type">Type</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs gap-1">
                  <X className="w-3 h-3" /> Clear filters
                </Button>
              )}
            </div>
          </div>
        )}

        {hasActiveFilters && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Showing {filtered.length} results</span>
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {filtered.map(p => (
          <PokemonCard key={p.id} pokemon={p} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-muted-foreground">No Pokémon found matching your filters.</p>
          <Button variant="ghost" className="mt-2" onClick={clearFilters}>Clear filters</Button>
        </div>
      )}
    </div>
  );
}