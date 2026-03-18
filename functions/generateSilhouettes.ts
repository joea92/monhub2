import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

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

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    // ids: array of PokemonImage record IDs to process
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return Response.json({ error: 'ids array is required' }, { status: 400 });
    }

    const results = { processed: 0, succeeded: 0, failed: 0 };

    // Mark all as generating first
    await Promise.all(ids.map(id => 
      base44.asServiceRole.entities.PokemonImage.update(id, {
        silhouette_status: 'generating',
      }).catch(() => {})
    ));

    // Fetch all records
    const records = await base44.asServiceRole.entities.PokemonImage.filter({ id: { $in: ids } });
    const recordMap = Object.fromEntries(records.map(r => [r.id, r]));

    // Process in parallel batches for speed
    const BATCH_SIZE = 5;
    for (let i = 0; i < ids.length; i += BATCH_SIZE) {
      const batch = ids.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(async (id) => {
        results.processed++;
        try {
          const record = recordMap[id];
          if (!record) {
            results.failed++;
            return;
          }

          const referenceUrl = record.source_image_url;
          if (!referenceUrl) {
            await base44.asServiceRole.entities.PokemonImage.update(id, {
              silhouette_status: 'failed',
            }).catch(() => {});
            results.failed++;
            return;
          }

          const typeColor = TYPE_COLORS[record.type?.toLowerCase()] || TYPE_COLORS.normal;
          const prompt = `Generate a flat, solid silhouette icon of a ${record.type}-type Pokémon called ${record.name}.
          
REQUIREMENTS:
- Flat solid color silhouette: ${typeColor}
- Completely transparent background (PNG with alpha channel, NO white, NO other colors)
- Simple, iconic, recognizable shape
- Centered with padding around edges
- Soft rounded edges, clean design
- No internal details or gradients
- Icon style suitable for UI use

Reference: The creature should resemble the provided image but rendered as a simple colored silhouette.`;

          const generated = await base44.asServiceRole.integrations.Core.GenerateImage({
            prompt,
            existing_image_urls: [referenceUrl],
          });

          if (!generated?.url) {
            await base44.asServiceRole.entities.PokemonImage.update(id, {
              silhouette_status: 'failed',
            }).catch(() => {});
            results.failed++;
            return;
          }

          const imgRes = await fetch(generated.url);
          const arrayBuffer = await imgRes.arrayBuffer();
          const file = new File([arrayBuffer], `${record.slug}-silhouette.png`, { type: 'image/png' });

          const uploadRes = await base44.asServiceRole.integrations.Core.UploadPrivateFile({ file });
          const file_uri = uploadRes.file_uri || uploadRes.data?.file_uri;

          await base44.asServiceRole.entities.PokemonImage.update(id, {
            silhouette_image_url: file_uri,
            silhouette_status: 'ready',
          });

          results.succeeded++;
        } catch (err) {
          console.error(`Silhouette generation failed for ${id}: ${err.message}`);
          await base44.asServiceRole.entities.PokemonImage.update(id, {
            silhouette_status: 'failed',
          }).catch(() => {});
          results.failed++;
        }
      }));
    }

    return Response.json({ success: true, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});