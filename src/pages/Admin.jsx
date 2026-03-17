import React, { useState, useMemo } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { POKEMON_DATA, DATA_STATS, ALL_TYPES, ALL_SPECIALTIES, ALL_HABITATS, ALL_FAVOURITES } from '@/lib/pokemonData';
import { calculatePairScore, generateExplanation } from '@/lib/compatibility';

export default function Admin() {
  const [pokemon1, setPokemon1] = useState('');
  const [pokemon2, setPokemon2] = useState('');

  const pairResult = useMemo(() => {
    const p1 = POKEMON_DATA.find(p => p.name.toLowerCase() === pokemon1.toLowerCase());
    const p2 = POKEMON_DATA.find(p => p.name.toLowerCase() === pokemon2.toLowerCase());
    if (!p1 || !p2) return null;
    const score = calculatePairScore(p1, p2);
    return { p1, p2, score, explanation: generateExplanation(p1, p2, score) };
  }, [pokemon1, pokemon2]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-1">Admin / Debug</h1>
      <p className="text-sm text-muted-foreground mb-6">Data statistics and score debugging</p>

      {/* Data stats */}
      <div className="bg-card rounded-2xl border border-border/50 p-6 mb-6">
        <h2 className="font-bold text-sm mb-4">Import Statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Pokémon', value: DATA_STATS.totalPokemon },
            { label: 'From Serebii', value: DATA_STATS.totalFromSerebii },
            { label: 'From Spreadsheet', value: DATA_STATS.totalFromSheet },
            { label: 'Matched', value: DATA_STATS.matched },
            { label: 'Partial Data', value: DATA_STATS.partial },
            { label: 'Failed Matches', value: DATA_STATS.failed },
            { label: 'Unique Types', value: ALL_TYPES.length },
            { label: 'Unique Specialties', value: ALL_SPECIALTIES.length },
          ].map(stat => (
            <div key={stat.label} className="p-3 rounded-xl bg-muted/30">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="text-xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 text-xs text-muted-foreground flex items-center gap-2">
          <RefreshCw className="w-3 h-3" />
          Last refresh: {new Date(DATA_STATS.lastRefresh).toLocaleString()}
        </div>
      </div>

      {/* Habitat & Favourite breakdown */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="bg-card rounded-2xl border border-border/50 p-5">
          <h3 className="font-bold text-sm mb-3">Habitats</h3>
          <div className="space-y-2">
            {ALL_HABITATS.map(h => {
              const count = POKEMON_DATA.filter(p => p.idealHabitat === h).length;
              return (
                <div key={h} className="flex items-center justify-between text-sm">
                  <span>{h}</span>
                  <Badge variant="secondary" className="text-xs">{count}</Badge>
                </div>
              );
            })}
          </div>
        </div>
        <div className="bg-card rounded-2xl border border-border/50 p-5">
          <h3 className="font-bold text-sm mb-3">Top Favourites</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {ALL_FAVOURITES.map(f => {
              const count = POKEMON_DATA.filter(p => p.favourites.includes(f)).length;
              return (
                <div key={f} className="flex items-center justify-between text-sm">
                  <span className="truncate">{f}</span>
                  <Badge variant="secondary" className="text-xs flex-shrink-0">{count}</Badge>
                </div>
              );
            }).sort((a, b) => b.props.children[1].props.children - a.props.children[1].props.children)}
          </div>
        </div>
      </div>

      {/* Score debugger */}
      <div className="bg-card rounded-2xl border border-border/50 p-6">
        <h2 className="font-bold text-sm mb-4">Score Breakdown Debugger</h2>
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Pokémon 1</label>
            <Input
              placeholder="e.g. Bulbasaur"
              value={pokemon1}
              onChange={e => setPokemon1(e.target.value)}
              className="h-9 text-sm"
              list="pokemon-list"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Pokémon 2</label>
            <Input
              placeholder="e.g. Squirtle"
              value={pokemon2}
              onChange={e => setPokemon2(e.target.value)}
              className="h-9 text-sm"
              list="pokemon-list"
            />
          </div>
        </div>
        <datalist id="pokemon-list">
          {POKEMON_DATA.map(p => <option key={p.id} value={p.name} />)}
        </datalist>

        {pairResult && (
          <div className="bg-muted/30 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <img src={pairResult.p1.imageUrl} alt="" className="w-10 h-10 object-contain" />
              <span className="text-sm font-bold">{pairResult.p1.name}</span>
              <span className="text-muted-foreground">↔</span>
              <img src={pairResult.p2.imageUrl} alt="" className="w-10 h-10 object-contain" />
              <span className="text-sm font-bold">{pairResult.p2.name}</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="p-2 bg-card rounded-lg">
                <p className="text-muted-foreground">Total Score</p>
                <p className="font-bold text-lg">{pairResult.score.score}</p>
              </div>
              <div className="p-2 bg-card rounded-lg">
                <p className="text-muted-foreground">Max Possible</p>
                <p className="font-bold text-lg">{pairResult.score.maxPossible}</p>
              </div>
              <div className="p-2 bg-card rounded-lg">
                <p className="text-muted-foreground">Percentage</p>
                <p className="font-bold text-lg">{pairResult.score.percentage}%</p>
              </div>
              <div className="p-2 bg-card rounded-lg">
                <p className="text-muted-foreground">Label</p>
                <p className="font-bold">{pairResult.score.label}</p>
              </div>
            </div>

            <div className="text-xs space-y-1">
              <p><strong>Shared Favourites ({pairResult.score.breakdown.sharedFavourites.length}):</strong> {pairResult.score.breakdown.sharedFavourites.join(', ') || 'None'}</p>
              <p><strong>Habitat Match:</strong> {pairResult.score.breakdown.habitatMatch ? '✅ Yes' : '❌ No'}</p>
              <p><strong>Specialty Match:</strong> {pairResult.score.breakdown.specialtyMatch ? `✅ ${pairResult.score.breakdown.sharedSpecialty?.join(', ')}` : '❌ No'}</p>
              <p><strong>Overlap Bonus:</strong> {pairResult.score.breakdown.overlapBonus ? '✅ Yes' : '❌ No'}</p>
            </div>

            <p className="text-sm text-muted-foreground italic">{pairResult.explanation}</p>
          </div>
        )}

        {!pairResult && pokemon1 && pokemon2 && (
          <p className="text-sm text-muted-foreground">Type exact Pokémon names to see the breakdown.</p>
        )}
      </div>
    </div>
  );
}