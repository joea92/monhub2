import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Reset all silhouettes
    const records = await base44.asServiceRole.entities.PokemonImage.filter({ import_status: 'success' });
    
    await Promise.all(records.map(r =>
      base44.asServiceRole.entities.PokemonImage.update(r.id, {
        silhouette_image_url: '',
        silhouette_status: 'none',
      })
    ));

    return Response.json({ success: true, reset: records.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});