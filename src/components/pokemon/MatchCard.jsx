import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { getCompatLabelColor, generateExplanation } from '@/lib/compatibility';
import TypeBadge from './TypeBadge';
import PokemonImage from './PokemonImage';

export default function MatchCard({ pokemon, target, compatibility }) {
  if (!compatibility) return null;
  
  return (
    <Link to={`/Pokemon?id=${pokemon.id}`}>
      <div className="flex items-start gap-3 p-3 rounded-xl border border-border/50 bg-card hover:shadow-md hover:border-primary/20 transition-all cursor-pointer">
        <div className="w-12 h-12 flex-shrink-0">
          <PokemonImage src={pokemon.imageUrl} alt={pokemon.name} className="w-12 h-12" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h4 className="font-semibold text-sm truncate">{pokemon.name}</h4>
            <Badge className={`${getCompatLabelColor(compatibility.label)} border text-[10px] flex-shrink-0`}>
              {compatibility.percentage}%
            </Badge>
          </div>
          <TypeBadge type={pokemon.type} />
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            {generateExplanation(target, pokemon, compatibility)}
          </p>
          {compatibility.breakdown.sharedFavourites.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {compatibility.breakdown.sharedFavourites.map(f => (
                <Badge key={f} className="bg-violet-100 text-violet-800 border border-violet-200 text-[10px] px-1.5 py-0">{f}</Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}