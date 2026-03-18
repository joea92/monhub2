import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get Dropbox connection
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('dropbox');

    // List files from Pokopia Silhouettes folder
    const listRes = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: '/Pokopia Silhouettes',
        recursive: false,
      }),
    });

    const listData = await listRes.json();
    if (!listData.entries) {
      return Response.json({ error: 'Failed to list Dropbox folder' }, { status: 400 });
    }

    // Get all Pokemon records
    const allRecords = await base44.asServiceRole.entities.PokemonImage.list();

    let updated = 0;
    let failed = 0;
    const sampleFiles = [];

    // Process each file in Dropbox
    for (const entry of listData.entries) {
      if (entry['.tag'] !== 'file') continue;

      try {
        // Extract filename without extension
        const filename = entry.name.split('.').slice(0, -1).join('.');
        
        // Normalize for matching
        const normalized = filename.toLowerCase().trim();
        
        // Find matching Pokemon record
        const record = allRecords.find(r => r.name.toLowerCase().trim() === normalized);
        
        if (sampleFiles.length < 3) {
          sampleFiles.push({ file: entry.name, normalized, matched: !!record });
        }

        if (!record) continue;

        // Use direct Dropbox content URL
        const shareUrl = `https://dl.dropboxusercontent.com/scl/fi/${entry.id.split('id:')[1] || entry.id}/${encodeURIComponent(entry.name)}?dl=1`;

        await base44.asServiceRole.entities.PokemonImage.update(record.id, {
          hosted_image_url: shareUrl,
          source_image_url: shareUrl,
        });
        updated++;
      } catch (err) {
        console.error(`Failed to process ${entry.name}: ${err.message}`);
        failed++;
      }
    }
    
    console.log('Sample files:', JSON.stringify(sampleFiles));

    return Response.json({
      success: true,
      updated,
      failed,
      total: listData.entries.filter(e => e['.tag'] === 'file').length,
      message: `Updated ${updated} Pokémon images from Dropbox`,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});