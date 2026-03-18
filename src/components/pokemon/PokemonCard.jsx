import React from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { isFavourite, toggleFavourite } from '@/lib/storage';
import TypeBadge from './TypeBadge';
import PokemonImage from './PokemonImage';
import PokemonSilhouette from './PokemonSilhouette';
import { usePokemonImages } from '@/hooks/usePokemonImages';

export default function PokemonCard({ pokemon, onFavToggle, compact = false }) {
  const [fav, setFav] = React.useState(isFavourite(pokemon.id));
  const { getImageUrl } = usePokemonImages();

  const handleFav = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavourite(pokemon.id);
    setFav(!fav);
    onFavToggle?.();
  };

  if (compact) {
    return (
      <Link to={`/Pokemon?id=${pokemon.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
        <div className="w-10 h-10 flex-shrink-0 bg-muted/30 rounded">
          <PokemonSilhouette src={getImageUrl(pokemon.name, pokemon.imageUrl)} alt={pokemon.name} primaryType={pokemon.type?.split('/')[0]} className="w-10 h-10" />
        </div>
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{pokemon.name}</p>
          <p className="text-xs text-muted-foreground">{pokemon.type}</p>
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/Pokemon?id=${pokemon.name}`}>
      <div className="group relative bg-card rounded-xl border border-border/50 p-4 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300 cursor-pointer">
        <button
          onClick={handleFav}
          className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Heart className={`w-4 h-4 ${fav ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
        </button>
        
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 mb-3 relative bg-muted/30 rounded-lg">
            <PokemonSilhouette src={getImageUrl(pokemon.name, pokemon.imageUrl)} alt={pokemon.name} primaryType={pokemon.type?.split('/')[0]} className="w-16 h-16" />
          </div>
          <p className="text-xs text-muted-foreground mb-0.5">#{pokemon.number}</p>
          <h3 className="font-semibold text-sm mb-2">{pokemon.name}</h3>
          <TypeBadge type={pokemon.type} clickable={true} />
          <div className="flex flex-wrap gap-1 mt-2 justify-center">
            {pokemon.specialty.map(s => (
              <Badge key={s} className="bg-violet-100 text-violet-800 border border-violet-200 text-[10px] px-1.5 py-0">{s}</Badge>
            ))}
          </div>
          <Badge className="bg-green-100 text-green-800 border border-green-200 mt-2 text-[10px]">{pokemon.idealHabitat}</Badge>
        </div>
      </div>
    </Link>
  );
}