import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { images } = await req.json();
    
    if (!Array.isArray(images) || images.length === 0) {
      return Response.json({ error: 'Invalid images array' }, { status: 400 });
    }

    const allRecords = await base44.asServiceRole.entities.PokemonImage.list();
    
    let updated = 0;
    let failed = 0;

    for (const imageUrl of images) {
      try {
        // Extract filename without extension from URL
        const urlParts = imageUrl.split('/');
        const filenameWithHash = urlParts[urlParts.length - 1];
        const filename = filenameWithHash.split('_').slice(1).join('_').replace('.png', '');
        
        const normalized = filename.toLowerCase().trim();
        
        // Find matching Pokemon record
        const record = allRecords.find(r => r.name.toLowerCase().trim() === normalized);

        if (!record) {
          console.log(`No match found for: ${filename}`);
          failed++;
          continue;
        }

        // Update with the provided image URL
        await base44.asServiceRole.entities.PokemonImage.update(record.id, {
          hosted_image_url: imageUrl,
          source_image_url: imageUrl,
        });
        updated++;
      } catch (err) {
        console.error(`Failed to process image: ${err.message}`);
        failed++;
      }
    }

    return Response.json({
      success: true,
      updated,
      failed,
      total: images.length,
      message: `Updated ${updated} Pokémon images`,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});