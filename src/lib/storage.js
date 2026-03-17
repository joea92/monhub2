// Local persistence for Pokopia House Matcher

const STORAGE_KEYS = {
  FAVOURITE_POKEMON: 'pokopia_favourites',
  SAVED_HOUSES: 'pokopia_houses',
  TOWN_PLANS: 'pokopia_town_plans',
  LAST_FILTERS: 'pokopia_filters',
};

function getItem(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}
function setItem(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

// Favourites
export function getFavourites() { return getItem(STORAGE_KEYS.FAVOURITE_POKEMON) || []; }
export function toggleFavourite(pokemonId) {
  const favs = getFavourites();
  const idx = favs.indexOf(pokemonId);
  if (idx === -1) favs.push(pokemonId);
  else favs.splice(idx, 1);
  setItem(STORAGE_KEYS.FAVOURITE_POKEMON, favs);
  return favs;
}
export function isFavourite(pokemonId) { return getFavourites().includes(pokemonId); }

// Saved houses
export function getSavedHouses() { return getItem(STORAGE_KEYS.SAVED_HOUSES) || []; }
export function saveHouse(house) {
  const houses = getSavedHouses();
  const existing = houses.findIndex(h => h.id === house.id);
  if (existing !== -1) houses[existing] = house;
  else houses.push({ ...house, id: Date.now().toString() });
  setItem(STORAGE_KEYS.SAVED_HOUSES, houses);
  return houses;
}
export function deleteHouse(houseId) {
  const houses = getSavedHouses().filter(h => h.id !== houseId);
  setItem(STORAGE_KEYS.SAVED_HOUSES, houses);
  return houses;
}

// Town plans
export function getTownPlans() {
  return getItem(STORAGE_KEYS.TOWN_PLANS) || {
    "withered-wasteland": { houses: [] },
    "bleak-beach": { houses: [] },
    "rocky-ridges": { houses: [] },
    "sparkling-skylands": { houses: [] },
    "palette-town": { houses: [] },
  };
}
export function saveTownPlans(plans) { setItem(STORAGE_KEYS.TOWN_PLANS, plans); }

// Filters
export function getLastFilters() { return getItem(STORAGE_KEYS.LAST_FILTERS) || {}; }
export function saveLastFilters(filters) { setItem(STORAGE_KEYS.LAST_FILTERS, filters); }