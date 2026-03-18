import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

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

    // Process in parallel batches of 2 to avoid overwhelming the API
    const BATCH_SIZE = 2;
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

          const referenceUrl = record.hosted_image_url || record.source_image_url;
          if (!referenceUrl) {
            await base44.asServiceRole.entities.PokemonImage.update(id, {
              silhouette_status: 'failed',
            }).catch(() => {});
            results.failed++;
            return;
          }

          const prompt = `Create a stylised icon-style silhouette of a creature inspired by ${record.name}. Solid flat silhouette shape, soft rounded edges, medium slate-grey color (#6B7280), transparent background, minimal and recognisable.`;

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