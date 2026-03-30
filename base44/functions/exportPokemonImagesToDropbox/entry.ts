import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get all successful pokemon images
    const records = await base44.asServiceRole.entities.PokemonImage.filter({ import_status: 'success' });
    
    if (records.length === 0) {
      return Response.json({ error: 'No successful image imports found' }, { status: 400 });
    }

    // Get Dropbox connection
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('dropbox');

    let uploaded = 0;
    let failed = 0;

    // Process in batches
    for (const record of records) {
      try {
        const imageUrl = record.source_image_url || record.hosted_image_url;
        if (!imageUrl) {
          failed++;
          continue;
        }

        // Download image
        const imgRes = await fetch(imageUrl);
        const arrayBuffer = await imgRes.arrayBuffer();
        const blob = new Blob([arrayBuffer]);

        // Get file extension
        const ext = imageUrl.includes('.png') ? '.png' : imageUrl.includes('.gif') ? '.gif' : '.jpg';
        const filename = `${record.slug}${ext}`;

        // Upload to Dropbox
        const uploadRes = await fetch('https://content.dropboxapi.com/2/files/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Dropbox-API-Arg': JSON.stringify({
              path: `/pokemon-images/${filename}`,
              mode: 'add',
              autorename: true,
            }),
            'Content-Type': 'application/octet-stream',
          },
          body: blob,
        });

        if (uploadRes.ok) {
          uploaded++;
        } else {
          failed++;
        }
      } catch (err) {
        console.error(`Failed to upload ${record.name}: ${err.message}`);
        failed++;
      }
    }

    return Response.json({ 
      success: true, 
      uploaded, 
      failed, 
      total: records.length,
      message: `Uploaded ${uploaded} images to Dropbox /pokemon-images/ folder`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});