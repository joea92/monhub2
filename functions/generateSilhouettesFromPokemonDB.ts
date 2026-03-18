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

const TYPE_COLORS = {
  "normal": "#A8A8A8",
  "grass": "#78C850",
  "fire": "#F08030",
  "water": "#6890F0",
  "fighting": "#C03028",
  "flying": "#A890F0",
  "poison": "#A040A0",
  "ground": "#E0C068",
  "rock": "#B8A038",
  "bug": "#A8B820",
  "ghost": "#705898",
  "electric": "#F8D030",
  "psychic": "#F85888",
  "ice": "#98D8D8",
  "dragon": "#7038F8",
  "dark": "#705848",
  "steel": "#B8B8D0",
  "fairy": "#EE99AC"
};

const POKEMON_LIST = [
  { name: 'Bulbasaur', number: '001', type: 'grass', imageUrl: 'https://img.pokemondb.net/sprites/home/normal/2x/bulbasaur.jpg' },
  { name: 'Charmander', number: '004', type: 'fire', imageUrl: 'https://img.pokemondb.net/sprites/home/normal/2x/charmander.jpg' },
  { name: 'Squirtle', number: '007', type: 'water', imageUrl: 'https://img.pokemondb.net/sprites/home/normal/2x/squirtle.jpg' },
  { name: 'Pikachu', number: '025', type: 'electric', imageUrl: 'https://img.pokemondb.net/sprites/home/normal/2x/pikachu.jpg' },
  { name: 'Charizard', number: '006', type: 'fire', imageUrl: 'https://img.pokemondb.net/sprites/home/normal/2x/charizard.jpg' },
  { name: 'Venusaur', number: '003', type: 'grass', imageUrl: 'https://img.pokemondb.net/sprites/home/normal/2x/venusaur.jpg' },
  { name: 'Blastoise', number: '009', type: 'water', imageUrl: 'https://img.pokemondb.net/sprites/home/normal/2x/blastoise.jpg' },
  { name: 'Raichu', number: '026', type: 'electric', imageUrl: 'https://img.pokemondb.net/sprites/home/normal/2x/raichu.jpg' },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const results = { processed: 0, succeeded: 0, failed: 0 };

    // Process all pokemon in parallel
    await Promise.all(POKEMON_LIST.map(async (pokemon) => {
      results.processed++;
      try {
        const slug = toSlug(pokemon.name);
        const typeColor = TYPE_COLORS[pokemon.type?.toLowerCase()] || TYPE_COLORS.normal;
        
        const prompt = `Create a stylised icon-style silhouette of a creature inspired by ${pokemon.name}. 
        CRITICAL: Use a FULLY TRANSPARENT background (alpha channel).
        - Solid flat silhouette shape with NO internal details
        - Soft rounded edges, clean and icon-like
        - Color: ${typeColor} (${pokemon.type} type)
        - The background must be 100% transparent - NO white, NO color, NO gradient
        - Save as PNG with alpha transparency
        - Minimal and recognisable form
        - Centered with padding`;

        const generated = await base44.asServiceRole.integrations.Core.GenerateImage({
          prompt,
          existing_image_urls: [pokemon.imageUrl],
        });

        if (!generated?.url) {
          results.failed++;
          return;
        }

        const imgRes = await fetch(generated.url);
        const arrayBuffer = await imgRes.arrayBuffer();
        const file = new File([arrayBuffer], `${slug}-silhouette.png`, { type: 'image/png' });

        const uploadRes = await base44.asServiceRole.integrations.Core.UploadPrivateFile({ file });
        const file_uri = uploadRes.file_uri || uploadRes.data?.file_uri;

        // Create record with silhouette
        await base44.asServiceRole.entities.PokemonImage.create({
          name: pokemon.name,
          slug,
          pokedex_number: pokemon.number,
          type: pokemon.type,
          source_image_url: pokemon.imageUrl,
          hosted_image_url: pokemon.imageUrl,
          silhouette_image_url: file_uri,
          silhouette_status: 'ready',
          import_status: 'success',
        });

        results.succeeded++;
      } catch (err) {
        console.error(`Silhouette generation failed for ${pokemon.name}: ${err.message}`);
        results.failed++;
      }
    }))

    return Response.json({ success: true, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});