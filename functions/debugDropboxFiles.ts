import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('dropbox');

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
    const files = listData.entries
      .filter(e => e['.tag'] === 'file')
      .slice(0, 10)
      .map(e => ({ name: e.name, path: e.path_lower }));

    return Response.json({ files });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});