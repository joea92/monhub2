import React, { useMemo, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Heart, Sparkles, TrendingUp, TrendingDown, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getPokemonById, POKEMON_DATA } from '@/lib/pokemonData';
import { rankAllMatches, optimizeBestHouse, calculatePairScore, generateExplanation } from '@/lib/compatibility';
import { isFavourite, toggleFavourite } from '@/lib/storage';
import TypeBadge from '@/components/pokemon/TypeBadge';
import MatchCard from '@/components/pokemon/MatchCard';
import CompatibilityBadge from '@/components/pokemon/CompatibilityBadge';
import PokemonImage from '@/components/pokemon/PokemonImage';
import PokemonSilhouette from '@/components/pokemon/PokemonSilhouette';

export default function PokemonDetail() {
  const location = useLocation();
  const [pokemon, setPokemon] = useState(null);
  const [fav, setFav] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const idParam = params.get('id');
    const found = isNaN(idParam) ? POKEMON_DATA.find(p => p.name.toLowerCase() === idParam.toLowerCase()) : getPokemonById(parseInt(idParam));
    setPokemon(found);
    if (found) setFav(isFavourite(found.id));
  }, [location.search]);

  const id = pokemon?.id;
  const rankings = useMemo(() => rankAllMatches(id), [id]);
  const bestHouse = useMemo(() => optimizeBestHouse([id], 3), [id]);

  if (!pokemon) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground">Pokémon not found.</p>
        <Link to="/Pokedex"><Button className="mt-4">Back to Pokédex</Button></Link>
      </div>
    );
  }

  const excellent = rankings.filter(r => r.compatibility?.label === "Excellent match");
  const good = rankings.filter(r => r.compatibility?.label === "Good match");
  const decent = rankings.filter(r => r.compatibility?.label === "Decent match");
  const low = rankings.filter(r => r.compatibility?.label === "Low synergy");

  const handleFav = () => {
    toggleFavourite(id);
    setFav(!fav);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <Link to="/Pokedex" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Pokédex
      </Link>

      {/* Profile header */}
      <div className="bg-card rounded-2xl border border-border/50 p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <div className="w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 rounded-2xl overflow-hidden bg-muted/30">
            <PokemonSilhouette src={pokemon.imageUrl} alt={pokemon.name} primaryType={pokemon.type?.split('/')[0]} className="w-24 h-24 sm:w-32 sm:h-32" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold">{pokemon.name}</h1>
              <span className="text-sm text-muted-foreground">#{pokemon.number}</span>
              <button onClick={handleFav}>
                <Heart className={`w-5 h-5 ${fav ? 'fill-red-500 text-red-500' : 'text-muted-foreground hover:text-red-400'} transition-colors`} />
              </button>
            </div>
            <TypeBadge type={pokemon.type} size="lg" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Specialty</p>
                <div className="flex flex-wrap gap-1">
                  {pokemon.specialty.map(s => (
                    <Link key={s} to={`/PokemonBySpecialty?specialty=${s}`}>
                      <Badge className="bg-violet-100 text-violet-800 border border-violet-200 text-xs cursor-pointer hover:bg-violet-200 transition-colors">{s}</Badge>
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Ideal Habitat</p>
                <Link to={`/PokemonByHabitat?habitat=${pokemon.idealHabitat}`}>
                  <Badge className="bg-green-100 text-green-800 border border-green-200 text-xs cursor-pointer hover:bg-green-200 transition-colors">{pokemon.idealHabitat}</Badge>
                </Link>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Location</p>
                <span className="text-sm font-medium">{pokemon.location}</span>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs text-muted-foreground mb-1.5">Favourite Categories</p>
              <div className="flex flex-wrap gap-1.5">
                {pokemon.favourites.map(f => (
                  <Badge key={f} className="bg-violet-100 text-violet-800 border border-violet-200 text-xs">{f}</Badge>
                ))}
              </div>
            </div>
            {pokemon.flavor && (
              <div className="mt-3">
                <p className="text-xs text-muted-foreground">Flavor: <span className="font-medium text-foreground">{pokemon.flavor}</span></p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Best house of 4 */}
      {bestHouse.length > 0 && (
        <div className="bg-card rounded-2xl border border-border/40 shadow-sm p-5 mb-6">
          <h2 className="font-bold text-sm mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-pokopia-green" /> Best Possible House of 4
          </h2>
          {bestHouse.map((house, idx) => (
            <div key={idx} className={`${idx > 0 ? 'mt-4 pt-4 border-t border-border/50' : ''}`}>
              {idx > 0 && <p className="text-xs text-muted-foreground mb-2">Runner-up #{idx + 1}</p>}
              <div className="flex flex-wrap gap-3 mb-3">
                {house.pokemon.map(p => (
                   <Link key={p.id} to={`/Pokemon?id=${p.name}`} className="flex items-center gap-2 bg-card rounded-lg border border-border/50 px-3 py-2 hover:border-primary/20 transition-colors">
                     <div className="w-8 h-8 bg-muted/30 rounded">
                       <PokemonSilhouette src={p.imageUrl} alt={p.name} primaryType={p.type?.split('/')[0]} className="w-8 h-8" />
                     </div>
                     <span className="text-sm font-medium">{p.name}</span>
                   </Link>
                 ))}
              </div>
              <div className="flex flex-wrap gap-3 text-xs">
                <Badge className="bg-green-100 text-green-800 border border-green-200">
                  Avg: {house.houseScore.avgPercentage}%
                </Badge>
                <span className="text-muted-foreground">{house.houseScore.label}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Match tabs */}
      <Tabs defaultValue="best" className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="best" className="text-xs">
            Best Matches {excellent.length > 0 && `(${excellent.length})`}
          </TabsTrigger>
          <TabsTrigger value="good" className="text-xs">
            Good {good.length > 0 && `(${good.length})`}
          </TabsTrigger>
          <TabsTrigger value="decent" className="text-xs">
            Decent {decent.length > 0 && `(${decent.length})`}
          </TabsTrigger>
          <TabsTrigger value="low" className="text-xs">
            Low Synergy {low.length > 0 && `(${low.length})`}
          </TabsTrigger>
        </TabsList>

        {[
          { value: 'best', data: excellent },
          { value: 'good', data: good },
          { value: 'decent', data: decent },
          { value: 'low', data: low },
        ].map(tab => (
          <TabsContent key={tab.value} value={tab.value}>
            <div className="grid gap-2 sm:grid-cols-2">
              {tab.data.slice(0, 20).map(r => (
                <MatchCard
                  key={r.pokemon.id}
                  pokemon={r.pokemon}
                  target={pokemon}
                  compatibility={r.compatibility}
                />
              ))}
            </div>
            {tab.data.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No matches in this category.</p>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}