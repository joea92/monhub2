// Compatibility scoring engine for Pokopia House Matcher
import { POKEMON_DATA, getPokemonById } from './pokemonData';

// Scoring weights
const FAVOURITE_MATCH_POINTS = 3;
const HABITAT_MATCH_POINTS = 4;
const SPECIALTY_MATCH_POINTS = 2;
const OVERLAP_BONUS = 1; // small bonus for 4+ shared favourites

// Calculate pair compatibility between two Pokémon
export function calculatePairScore(pokemon1, pokemon2) {
  if (!pokemon1 || !pokemon2 || pokemon1.id === pokemon2.id) return null;

  let score = 0;
  const breakdown = { sharedFavourites: [], habitatMatch: false, specialtyMatch: false, overlapBonus: false };

  // Shared favourites
  const shared = pokemon1.favourites.filter(f => 
    pokemon2.favourites.some(f2 => f.toLowerCase() === f2.toLowerCase())
  );
  breakdown.sharedFavourites = shared;
  score += shared.length * FAVOURITE_MATCH_POINTS;

  // Habitat match
  if (pokemon1.idealHabitat && pokemon2.idealHabitat && 
      pokemon1.idealHabitat.toLowerCase() === pokemon2.idealHabitat.toLowerCase()) {
    breakdown.habitatMatch = true;
    score += HABITAT_MATCH_POINTS;
  }

  // Specialty match
  const sharedSpec = pokemon1.specialty.filter(s => 
    pokemon2.specialty.some(s2 => s.toLowerCase() === s2.toLowerCase())
  );
  if (sharedSpec.length > 0) {
    breakdown.specialtyMatch = true;
    breakdown.sharedSpecialty = sharedSpec;
    score += SPECIALTY_MATCH_POINTS;
  }

  // Overlap bonus for strong alignment
  if (shared.length >= 4) {
    breakdown.overlapBonus = true;
    score += OVERLAP_BONUS;
  }

  const maxPossible = (5 * FAVOURITE_MATCH_POINTS) + HABITAT_MATCH_POINTS + SPECIALTY_MATCH_POINTS + OVERLAP_BONUS;
  const percentage = Math.round((score / maxPossible) * 100);

  return {
    score,
    maxPossible,
    percentage,
    label: getCompatLabel(percentage),
    breakdown,
  };
}

function getCompatLabel(percentage) {
  if (percentage >= 70) return "Excellent match";
  if (percentage >= 50) return "Good match";
  if (percentage >= 30) return "Decent match";
  return "Low synergy";
}

export function getCompatLabelColor(label) {
  switch (label) {
    case "Excellent match": return "bg-green-100 text-green-800 border-green-200";
    case "Good match":      return "bg-cyan-100 text-cyan-800 border-cyan-200";
    case "Decent match":    return "bg-violet-100 text-violet-800 border-violet-200";
    case "Low synergy":     return "bg-orange-100 text-orange-800 border-orange-200";
    default: return "bg-gray-100 text-gray-700";
  }
}

// Generate explanation text
export function generateExplanation(pokemon1, pokemon2, result) {
  if (!result) return "";
  const parts = [];
  if (result.breakdown.habitatMatch) {
    parts.push(`both prefer ${pokemon1.idealHabitat} habitats`);
  }
  if (result.breakdown.specialtyMatch) {
    parts.push(`share ${result.breakdown.sharedSpecialty.join(', ')} specialty`);
  }
  if (result.breakdown.sharedFavourites.length > 0) {
    parts.push(`share ${result.breakdown.sharedFavourites.join(', ')}`);
  }
  if (parts.length === 0) return "These Pokémon have little in common.";
  const label = result.label === "Excellent match" ? "Great" : 
                result.label === "Good match" ? "Good" :
                result.label === "Decent match" ? "Okay" : "Weak";
  return `${label} match because ${parts.join(' and ')}.`;
}

// Rank all Pokémon against a target
export function rankAllMatches(targetId) {
  const target = getPokemonById(targetId);
  if (!target) return [];
  
  return POKEMON_DATA
    .filter(p => p.id !== targetId)
    .map(p => ({
      pokemon: p,
      compatibility: calculatePairScore(target, p),
    }))
    .sort((a, b) => (b.compatibility?.score || 0) - (a.compatibility?.score || 0));
}

// Calculate house group score (all pairs averaged)
export function calculateHouseScore(pokemonIds) {
  const pokemon = pokemonIds.map(getPokemonById).filter(Boolean);
  if (pokemon.length < 2) return { totalScore: 0, avgScore: 0, pairs: [], weakestPair: null, strongestPair: null, weakestMember: null };

  const pairs = [];
  for (let i = 0; i < pokemon.length; i++) {
    for (let j = i + 1; j < pokemon.length; j++) {
      const result = calculatePairScore(pokemon[i], pokemon[j]);
      pairs.push({
        pokemon1: pokemon[i],
        pokemon2: pokemon[j],
        ...result,
      });
    }
  }

  const totalScore = pairs.reduce((sum, p) => sum + p.score, 0);
  const avgScore = pairs.length > 0 ? totalScore / pairs.length : 0;
  const avgPercentage = pairs.length > 0 ? Math.round(pairs.reduce((s, p) => s + p.percentage, 0) / pairs.length) : 0;

  const sortedPairs = [...pairs].sort((a, b) => a.score - b.score);
  const weakestPair = sortedPairs[0] || null;
  const strongestPair = sortedPairs[sortedPairs.length - 1] || null;

  // Find weakest member (lowest avg score with all others)
  let weakestMember = null;
  if (pokemon.length >= 3) {
    let worstAvg = Infinity;
    pokemon.forEach(p => {
      const memberPairs = pairs.filter(pair => pair.pokemon1.id === p.id || pair.pokemon2.id === p.id);
      const memberAvg = memberPairs.reduce((s, mp) => s + mp.score, 0) / memberPairs.length;
      if (memberAvg < worstAvg) {
        worstAvg = memberAvg;
        weakestMember = { pokemon: p, avgScore: memberAvg };
      }
    });
  }

  return {
    totalScore,
    avgScore: Math.round(avgScore * 10) / 10,
    avgPercentage,
    pairs,
    weakestPair,
    strongestPair,
    weakestMember,
    label: getHouseLabel(avgPercentage),
  };
}

function getHouseLabel(avgPercentage) {
  if (avgPercentage >= 65) return "Strong synergy";
  if (avgPercentage >= 45) return "Mostly compatible";
  if (avgPercentage >= 25) return "Mixed compatibility";
  return "Difficult house";
}

export function getHouseLabelColor(label) {
  switch (label) {
    case "Strong synergy":      return "bg-green-100 text-green-800 border-green-200";
    case "Mostly compatible":   return "bg-cyan-100 text-cyan-800 border-cyan-200";
    case "Mixed compatibility": return "bg-violet-100 text-violet-800 border-violet-200";
    case "Difficult house":     return "bg-orange-100 text-orange-800 border-orange-200";
    default: return "bg-gray-100 text-gray-700";
  }
}

// Suggest best next Pokémon to add to a house
export function suggestNextMember(currentIds, excludeIds = []) {
  if (currentIds.length >= 4) return [];
  const excluded = new Set([...currentIds, ...excludeIds]);

  return POKEMON_DATA
    .filter(p => !excluded.has(p.id))
    .map(p => {
      const testIds = [...currentIds, p.id];
      const houseScore = calculateHouseScore(testIds);
      return {
        pokemon: p,
        houseScore,
        addedValue: houseScore.avgPercentage,
      };
    })
    .sort((a, b) => b.addedValue - a.addedValue)
    .slice(0, 10);
}

// Auto-optimize: find best house of 4 including required members
export function optimizeBestHouse(requiredIds, maxResults = 5) {
  const required = requiredIds.map(getPokemonById).filter(Boolean);
  if (required.length > 4) return [];
  
  const slotsToFill = 4 - required.length;
  const candidates = POKEMON_DATA.filter(p => !requiredIds.includes(p.id));

  if (slotsToFill === 0) {
    const score = calculateHouseScore(requiredIds);
    return [{ ids: requiredIds, pokemon: required, houseScore: score }];
  }

  // For efficiency, pre-filter candidates by ranking them against required members
  const rankedCandidates = candidates
    .map(c => {
      let totalScore = 0;
      required.forEach(r => {
        const pair = calculatePairScore(r, c);
        totalScore += pair ? pair.score : 0;
      });
      return { pokemon: c, avgWithRequired: totalScore / Math.max(required.length, 1) };
    })
    .sort((a, b) => b.avgWithRequired - a.avgWithRequired)
    .slice(0, Math.min(candidates.length, slotsToFill <= 1 ? 50 : 30));

  // Generate combinations
  const combos = generateCombinations(rankedCandidates.map(c => c.pokemon.id), slotsToFill);
  
  const results = combos
    .map(combo => {
      const ids = [...requiredIds, ...combo];
      const houseScore = calculateHouseScore(ids);
      return {
        ids,
        pokemon: ids.map(getPokemonById),
        houseScore,
      };
    })
    .sort((a, b) => b.houseScore.avgPercentage - a.houseScore.avgPercentage)
    .slice(0, maxResults);

  return results;
}

function generateCombinations(arr, size) {
  if (size === 0) return [[]];
  if (size === 1) return arr.map(x => [x]);
  const result = [];
  for (let i = 0; i <= arr.length - size; i++) {
    const rest = generateCombinations(arr.slice(i + 1), size - 1);
    rest.forEach(combo => result.push([arr[i], ...combo]));
  }
  return result;
}

// Multi-house auto-planner: distribute pokémon into houses of max 4
export function autoDistributeHouses(pokemonIds) {
  if (pokemonIds.length === 0) return [];
  
  const pokemon = pokemonIds.map(getPokemonById).filter(Boolean);
  const numHouses = Math.ceil(pokemon.length / 4);
  
  // Greedy approach: repeatedly form the best available house
  const remaining = [...pokemonIds];
  const houses = [];
  
  for (let h = 0; h < numHouses; h++) {
    if (remaining.length === 0) break;
    
    if (remaining.length <= 4) {
      houses.push({ ids: [...remaining], name: `House ${h + 1}` });
      remaining.length = 0;
      break;
    }

    // Pick the first remaining Pokémon and find best house of 4
    const seed = remaining[0];
    const bestHouse = optimizeBestHouse([seed], 1, remaining);
    
    // Filter to only use remaining Pokémon
    let bestIds;
    if (bestHouse.length > 0) {
      bestIds = bestHouse[0].ids.filter(id => remaining.includes(id)).slice(0, 4);
    }
    
    // Fallback: greedily build the house
    if (!bestIds || bestIds.length < Math.min(4, remaining.length)) {
      bestIds = [seed];
      while (bestIds.length < 4 && bestIds.length < remaining.length) {
        const suggestions = suggestNextMember(bestIds, pokemonIds.filter(id => !remaining.includes(id) || bestIds.includes(id)));
        const validSuggestion = suggestions.find(s => remaining.includes(s.pokemon.id) && !bestIds.includes(s.pokemon.id));
        if (validSuggestion) {
          bestIds.push(validSuggestion.pokemon.id);
        } else {
          // Just pick next available
          const next = remaining.find(id => !bestIds.includes(id));
          if (next) bestIds.push(next);
          else break;
        }
      }
    }

    houses.push({ ids: bestIds.slice(0, 4), name: `House ${h + 1}` });
    bestIds.forEach(id => {
      const idx = remaining.indexOf(id);
      if (idx !== -1) remaining.splice(idx, 1);
    });
  }

  return houses.map(h => ({
    ...h,
    pokemon: h.ids.map(getPokemonById),
    houseScore: calculateHouseScore(h.ids),
  }));
}