import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

// Normalize name to slug for matching
function toSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/♀/g, '-f')
    .replace(/♂/g, '-m')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Singleton cache so we only fetch once per session
let _cache = null;
let _promise = null;

async function loadImageMap() {
  if (_cache) return _cache;
  if (_promise) return _promise;

  _promise = base44.entities.PokemonImage
    .filter({ import_status: 'success' }, '-updated_date', 500)
    .then(records => {
      const map = {};
      for (const r of records) {
        if (!r.slug) continue;
        // If silhouette is enabled and ready, prefer it
        if (r.use_silhouette && r.silhouette_image_url) {
          map[r.slug] = r.silhouette_image_url;
        } else if (r.hosted_image_url) {
          map[r.slug] = r.hosted_image_url;
        }
      }
      _cache = map;
      return map;
    });

  return _promise;
}

// Returns a function: getImageUrl(pokemonName, fallbackUrl) => url
export function usePokemonImages() {
  const [imageMap, setImageMap] = useState(_cache || {});

  useEffect(() => {
    if (_cache) {
      setImageMap(_cache);
    } else {
      loadImageMap().then(map => setImageMap({ ...map }));
    }

    // Subscribe to PokemonImage updates to refresh cache when silhouettes are ready
    const unsubscribe = base44.entities.PokemonImage.subscribe((event) => {
      if (event.data?.silhouette_status === 'ready' && event.data?.silhouette_image_url) {
        // Invalidate cache and reload
        _cache = null;
        _promise = null;
        loadImageMap().then(map => {
          _cache = map;
          setImageMap({ ...map });
        });
      }
    });

    return unsubscribe;
  }, []);

  function getImageUrl(name, fallback) {
    const slug = toSlug(name || '');
    return imageMap[slug] || fallback;
  }

  return { getImageUrl, imageMap };
}