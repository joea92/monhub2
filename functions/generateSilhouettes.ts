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

    for (const id of ids) {
      results.processed++;
      try {
        // Fetch the record
        const records = await base44.asServiceRole.entities.PokemonImage.filter({ id });
        const record = records[0];
        if (!record) {
          results.failed++;
          continue;
        }

        // Mark as generating
        await base44.asServiceRole.entities.PokemonImage.update(id, {
          silhouette_status: 'generating',
        });

        // Use hosted image as reference, fall back to source
        const referenceUrl = record.hosted_image_url || record.source_image_url;

        if (!referenceUrl) {
          await base44.asServiceRole.entities.PokemonImage.update(id, {
            silhouette_status: 'failed',
          });
          results.failed++;
          continue;
        }

        // Generate silhouette using AI
        const prompt = `Create a stylised icon-style silhouette of a creature inspired by ${record.name}. 
Style rules:
- Solid flat silhouette shape, no internal details, no texture, no outlines
- Soft rounded edges, icon-like and clean
- Simplified shape inspired by the creature's overall body form
- Single unified shape fill in a medium slate-grey color (#6B7280)
- Transparent background
- Centered composition with generous padding
- Consistent icon-system aesthetic — looks like it belongs in a set of app icons
- No text, no labels, no extra elements
- The result should be a minimal, recognisable blob/form that hints at the creature without being a detailed drawing`;

        const generated = await base44.asServiceRole.integrations.Core.GenerateImage({
          prompt,
          existing_image_urls: [referenceUrl],
        });

        if (!generated?.url) {
          await base44.asServiceRole.entities.PokemonImage.update(id, {
            silhouette_status: 'failed',
          });
          results.failed++;
          continue;
        }

        // Download the generated image and upload to private storage
        const imgRes = await fetch(generated.url);
        const arrayBuffer = await imgRes.arrayBuffer();
        const blob = new Blob([arrayBuffer], { type: 'image/png' });

        const { file_uri } = await base44.asServiceRole.integrations.Core.UploadPrivateFile({ file: blob });

        await base44.asServiceRole.entities.PokemonImage.update(id, {
          silhouette_image_url: file_uri,
          silhouette_status: 'ready',
        });

        results.succeeded++;
      } catch (err) {
        await base44.asServiceRole.entities.PokemonImage.update(id, {
          silhouette_status: 'failed',
        }).catch(() => {});
        results.failed++;
      }
    }

    return Response.json({ success: true, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});