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
    let notInApp = 0;
    let errors = 0;

    // Process each file in Dropbox
    for (const entry of listData.entries) {
      if (entry['.tag'] !== 'file') continue;

      try {
        // Extract filename without extension
        const filename = entry.name.split('.').slice(0, -1).join('.');
        
        // Find matching Pokemon record by name
        const record = allRecords.find(r => r.name.toLowerCase() === filename.toLowerCase());

        if (!record) {
          failed++;
          continue;
        }

        // Create shareable link for this file
        const linkRes = await fetch('https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            path: entry.path_lower,
            settings: {
              requested_visibility: 'public',
              allow_download: true,
            },
          }),
        }).catch(() => null);

        let shareUrl = null;
        if (linkRes && linkRes.ok) {
          const linkData = await linkRes.json();
          // Convert to direct download URL
          shareUrl = linkData.url.replace('?dl=0', '?dl=1');
        } else {
          // Fallback: try to get existing shared link
          const existingRes = await fetch('https://api.dropboxapi.com/2/sharing/list_shared_links', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ path: entry.path_lower }),
          }).catch(() => null);

          if (existingRes && existingRes.ok) {
            const existingData = await existingRes.json();
            if (existingData.links && existingData.links.length > 0) {
              shareUrl = existingData.links[0].url.replace('?dl=0', '?dl=1');
            }
          }
        }

        if (shareUrl) {
          await base44.asServiceRole.entities.PokemonImage.update(record.id, {
            hosted_image_url: shareUrl,
            source_image_url: shareUrl,
          });
          updated++;
        } else {
          failed++;
        }
      } catch (err) {
        console.error(`Failed to process ${entry.name}: ${err.message}`);
        failed++;
      }
    }

    return Response.json({
      success: true,
      updated,
      failed,
      total: listData.entries.filter(e => e['.tag'] === 'file').length,
      message: `Updated ${updated} Pokémon images from Dropbox`,
      debug: debugInfo.slice(0, 10),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});