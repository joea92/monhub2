import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// Converts a Pokémon "number" field (e.g. "016") to numeric (16) for pokopia.dev URL
function pokopiaUrl(number) {
  return `https://pokopia.dev/images/pokemon/${parseInt(number, 10)}.png`;
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Forbidden: Admin only' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { mode, pokemon } = body;
  // mode: "test" — just probe image URLs and return status
  // mode: "import" — probe + upload to hosted storage and return hosted URLs

  if (!pokemon || !Array.isArray(pokemon)) {
    return Response.json({ error: 'Expected pokemon array in body' }, { status: 400 });
  }

  const results = [];

  for (const p of pokemon) {
    const sourceUrl = pokopiaUrl(p.number);
    let sourceStatus = 'unknown';
    let hostedUrl = null;
    let importStatus = 'skipped';

    // Always probe the source image
    try {
      const probe = await fetch(sourceUrl, { method: 'HEAD' });
      sourceStatus = probe.ok ? 'ok' : `error_${probe.status}`;
    } catch (e) {
      sourceStatus = `fetch_error: ${e.message}`;
    }

    if (mode === 'import' && sourceStatus === 'ok') {
      try {
        const imgRes = await fetch(sourceUrl);
        if (!imgRes.ok) throw new Error(`Image fetch failed: ${imgRes.status}`);
        const blob = await imgRes.blob();
        const file = new File([blob], `pokemon_${p.id}.png`, { type: 'image/png' });
        const uploadResult = await base44.asServiceRole.integrations.Core.UploadFile({ file });
        hostedUrl = uploadResult.file_url;
        importStatus = 'success';
      } catch (e) {
        importStatus = `failed: ${e.message}`;
      }
    }

    results.push({
      id: p.id,
      name: p.name,
      number: p.number,
      sourceUrl,
      sourceStatus,
      hostedUrl,
      importStatus,
    });
  }

  const successCount = results.filter(r => r.sourceStatus === 'ok').length;
  const importedCount = results.filter(r => r.importStatus === 'success').length;

  return Response.json({
    total: results.length,
    sourceSuccessCount: successCount,
    importedCount,
    results,
  });
});