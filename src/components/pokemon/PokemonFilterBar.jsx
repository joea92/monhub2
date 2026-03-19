import React, { useState } from 'react';
import { Filter, ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ALL_HABITATS, ALL_SPECIALTIES, POKEMON_DATA } from '@/lib/pokemonData';

// Derive unique primary types from the dataset
const ALL_PRIMARY_TYPES = [...new Set(POKEMON_DATA.map(p => p.type.split('/')[0].trim()))].sort();

export default function PokemonFilterBar({ filters, onChange }) {
  const [open, setOpen] = useState(null); // 'type' | 'specialty' | 'habitat' | null

  const toggle = (key, value) => {
    const current = filters[key] || [];
    const next = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
    onChange({ ...filters, [key]: next });
  };

  const clearAll = () => onChange({ type: [], specialty: [], habitat: [] });

  const activeCount = (filters.type?.length || 0) + (filters.specialty?.length || 0) + (filters.habitat?.length || 0);

  const sections = [
    { key: 'type', label: 'Type', options: ALL_PRIMARY_TYPES },
    { key: 'specialty', label: 'Specialty', options: ALL_SPECIALTIES },
    { key: 'habitat', label: 'Habitat', options: ALL_HABITATS },
  ];

  return (
    <div className="mb-3">
      <div className="flex items-center gap-1.5 flex-wrap">
        <Filter className="w-3 h-3 text-muted-foreground shrink-0" />
        {sections.map(({ key, label }) => (
          <div key={key} className="relative">
            <button
              onClick={() => setOpen(open === key ? null : key)}
              className={`flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md border transition-colors ${
                (filters[key]?.length || 0) > 0
                  ? 'bg-primary/10 border-primary/30 text-primary'
                  : 'bg-muted/30 border-border/40 text-muted-foreground hover:bg-muted/60'
              }`}
            >
              {label}
              {(filters[key]?.length || 0) > 0 && (
                <span className="bg-primary text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
                  {filters[key].length}
                </span>
              )}
              <ChevronDown className={`w-3 h-3 transition-transform ${open === key ? 'rotate-180' : ''}`} />
            </button>

            {open === key && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setOpen(null)} />
                <div className="absolute top-full left-0 mt-1 z-20 bg-card border border-border/50 rounded-xl shadow-lg p-2 min-w-[160px] max-h-48 overflow-y-auto">
                  <div className="flex flex-wrap gap-1">
                    {sections.find(s => s.key === key).options.map(opt => (
                      <button
                        key={opt}
                        onClick={() => toggle(key, opt)}
                        className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                          (filters[key] || []).includes(opt)
                            ? 'bg-primary text-white border-primary'
                            : 'bg-muted/30 border-border/40 text-muted-foreground hover:bg-muted/60'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        ))}

        {activeCount > 0 && (
          <button onClick={clearAll} className="flex items-center gap-0.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      {/* Active filter chips */}
      {activeCount > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {sections.flatMap(({ key, label }) =>
            (filters[key] || []).map(val => (
              <Badge
                key={`${key}-${val}`}
                className="text-[10px] bg-primary/10 text-primary border border-primary/20 cursor-pointer hover:bg-primary/20 gap-1"
                onClick={() => toggle(key, val)}
              >
                {val} <X className="w-2.5 h-2.5" />
              </Badge>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// Helper to apply filters to a pokemon list
export function applyPokemonFilters(pokemonList, filters) {
  return pokemonList.filter(p => {
    const primaryType = p.type.split('/')[0].trim();
    if (filters.type?.length && !filters.type.includes(primaryType)) return false;
    if (filters.specialty?.length && !p.specialty.some(s => filters.specialty.includes(s))) return false;
    if (filters.habitat?.length && !filters.habitat.includes(p.idealHabitat)) return false;
    return true;
  });
}