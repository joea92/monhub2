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
  // Try to fetch from pokopia API or fallback to scraping
  try {
    const res = await fetchWithRetry('https://pokopia.dev/api/pokedex', {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PokopiaImporter/1.0)' }
    });
    const data = await res.json();
    if (Array.isArray(data)) {
      return data.slice(0, 20).map(p => ({
        name: p.name || p.title || '',
        number: p.id?.toString() || p.number?.toString() || null,
        imageUrl: p.image_url || p.imageUrl || p.image || ''
      })).filter(p => p.name && p.imageUrl);
    }
  } catch (err) {
    // API failed, continue to HTML scraping
  }

  // Fallback: scrape the pokedex HTML page
  const res = await fetchWithRetry('https://pokopia.dev/pokedex/', {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PokopiaImporter/1.0)' }
  });
  const html = await res.text();
  const entries = [];

  // Look for image tags with pokemon-like src paths
  const imgRegex = /<img[^>]+src=["']([^"']*(?:pokemon|sprites|images|pokemon-)[^"']*)["'][^>]*/gi;
  let imgMatch;
  
  while ((imgMatch = imgRegex.exec(html)) !== null) {
    let imgSrc = imgMatch[1];
    if (imgSrc.startsWith('/')) {
      imgSrc = 'https://pokopia.dev' + imgSrc;
    } else if (!imgSrc.startsWith('http')) {
      imgSrc = 'https://pokopia.dev/' + imgSrc;
    }
    
    // Skip non-image files and icons
    if (!imgSrc.match(/\.(png|jpg|jpeg|webp|gif)(\?.*)?$/i)) continue;
    if (imgSrc.includes('logo') || imgSrc.includes('icon') || imgSrc.includes('favicon')) continue;
    
    // Try to extract name from URL path
    const urlPath = imgSrc.split('/').pop().replace(/\.\w+$/, '').replace(/[-_]/g, ' ');
    const numMatch = urlPath.match(/^(\d+)/);
    const number = numMatch?.[1] || null;
    const name = urlPath.replace(/^\d+\s*/, '').trim();
    
    if (name.length < 2) continue;
    
    entries.push({ name, number, imageUrl: imgSrc });
  }

  return entries;
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
        
        const contentType = imgRes.headers.get('content-type') || 'image/png';
        const arrayBuffer = await imgRes.arrayBuffer();
        const blob = new Blob([arrayBuffer], { type: contentType });

        // Upload to private storage
        const { file_uri } = await base44.asServiceRole.integrations.Core.UploadPrivateFile({ file: blob });

        const data = {
          name: item.name,
          slug: item.slug,
          pokedex_number: item.number || '',
          source_image_url: item.imageUrl,
          hosted_image_url: file_uri,
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