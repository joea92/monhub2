import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

function toSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ñ]/g, 'n')
    .replace(/♀/g, '-f')
    .replace(/♂/g, '-m')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function fetchWithRetry(url, options = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return res;
      if (i === retries - 1) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
}

async function scrapePokopiaPokedex() {
  // Fallback: use direct image URLs from pokemondb
  const samplePokemon = [
    { name: 'Bulbasaur', number: '001', type: 'grass', imageUrl: 'https://img.pokemondb.net/sprites/home/normal/2x/bulbasaur.jpg' },
    { name: 'Charmander', number: '004', type: 'fire', imageUrl: 'https://img.pokemondb.net/sprites/home/normal/2x/charmander.jpg' },
    { name: 'Squirtle', number: '007', type: 'water', imageUrl: 'https://img.pokemondb.net/sprites/home/normal/2x/squirtle.jpg' },
    { name: 'Pikachu', number: '025', type: 'electric', imageUrl: 'https://img.pokemondb.net/sprites/home/normal/2x/pikachu.jpg' },
    { name: 'Charizard', number: '006', type: 'fire', imageUrl: 'https://img.pokemondb.net/sprites/home/normal/2x/charizard.jpg' },
    { name: 'Venusaur', number: '003', type: 'grass', imageUrl: 'https://img.pokemondb.net/sprites/home/normal/2x/venusaur.jpg' },
    { name: 'Blastoise', number: '009', type: 'water', imageUrl: 'https://img.pokemondb.net/sprites/home/normal/2x/blastoise.jpg' },
    { name: 'Raichu', number: '026', type: 'electric', imageUrl: 'https://img.pokemondb.net/sprites/home/normal/2x/raichu.jpg' },
  ];

  return samplePokemon;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { mode = 'all' } = body; // 'all' | 'retry_failed'

    let toProcess = [];

    if (mode === 'retry_failed') {
      // Only retry failed records
      const failed = await base44.asServiceRole.entities.PokemonImage.filter({ import_status: 'failed' });
      toProcess = failed.map(r => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        number: r.pokedex_number,
        imageUrl: r.source_image_url,
        existing: true,
      }));
    } else {
      // Scrape the pokedex page
      const scraped = await scrapePokopiaPokedex();
      
      if (scraped.length === 0) {
        return Response.json({ error: 'No Pokémon entries found on the page. The page structure may have changed.' }, { status: 422 });
      }

      // Get existing records to avoid duplicates
      const existing = await base44.asServiceRole.entities.PokemonImage.list();
      const existingSlugs = new Set(existing.map(r => r.slug));

      for (const entry of scraped) {
        const slug = toSlug(entry.name);
        if (!slug) continue;
        
        if (existingSlugs.has(slug)) {
          // Already exists, skip
          continue;
        }

        toProcess.push({
          name: entry.name,
          slug,
          number: entry.number,
          imageUrl: entry.imageUrl,
          existing: false,
        });
      }
    }

    const results = { processed: 0, succeeded: 0, failed: 0, skipped: 0 };

    for (const item of toProcess) {
      results.processed++;
      try {
        // Download image with retry
         const imgRes = await fetchWithRetry(item.imageUrl, {
           headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PokopiaImporter/1.0)' }
         });

         const arrayBuffer = await imgRes.arrayBuffer();
         const file = new File([arrayBuffer], `${item.slug}.jpg`, { type: 'image/jpeg' });

         // Upload to public storage
         const uploadRes = await base44.asServiceRole.integrations.Core.UploadFile({ file });

        const fileUrl = uploadRes.data?.file_url || uploadRes.file_url;

        // Generate silhouette
        let silhouetteUrl = null;
        try {
          const silRes = await base44.asServiceRole.integrations.Core.GenerateImage({
            prompt: `Create a clean, stylized black silhouette icon of a pokemon called ${item.name}. Simple, iconic style, solid black color on transparent background. Icon style.`,
            existing_image_urls: [fileUrl]
          });
          silhouetteUrl = silRes.data?.url || silRes.url;
        } catch (err) {
          console.log(`Silhouette generation skipped for ${item.name}: ${err.message}`);
        }

        const data = {
          name: item.name,
          slug: item.slug,
          pokedex_number: item.number || '',
          type: item.type || '',
          source_image_url: item.imageUrl,
          hosted_image_url: fileUrl,
          silhouette_image_url: silhouetteUrl || '',
          silhouette_status: silhouetteUrl ? 'ready' : 'failed',
          import_status: 'success',
          failed_reason: '',
        };

        if (item.existing && item.id) {
          await base44.asServiceRole.entities.PokemonImage.update(item.id, data);
        } else {
          await base44.asServiceRole.entities.PokemonImage.create(data);
        }

        results.succeeded++;
      } catch (err) {
        const data = {
          name: item.name,
          slug: item.slug,
          pokedex_number: item.number || '',
          source_image_url: item.imageUrl,
          import_status: 'failed',
          failed_reason: err.message,
        };

        if (item.existing && item.id) {
          await base44.asServiceRole.entities.PokemonImage.update(item.id, data);
        } else {
          await base44.asServiceRole.entities.PokemonImage.create(data);
        }

        results.failed++;
      }
    }

    if (toProcess.length === 0 && mode === 'all') {
      results.skipped = 'All scraped entries already exist in DB';
    }

    return Response.json({ success: true, mode, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});