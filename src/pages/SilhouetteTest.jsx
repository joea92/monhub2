import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Sparkles, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';

const BATCH_SIZE = 8;

const STATUS_COLORS = {
  none:       'bg-gray-100 text-gray-700 border-gray-200',
  generating: 'bg-blue-100 text-blue-800 border-blue-200',
  ready:      'bg-green-100 text-green-800 border-green-200',
  failed:     'bg-red-100 text-red-800 border-red-200',
};

const STATUS_ICONS = {
  none:       Clock,
  generating: Loader2,
  ready:      CheckCircle,
  failed:     XCircle,
};

// Resolve file_uri to a signed URL for display
const urlCache = {};
async function resolveUrl(uri) {
  if (!uri) return null;
  if (uri.startsWith('http')) return uri;
  if (urlCache[uri]) return urlCache[uri];
  const res = await base44.functions.invoke('getSignedImageUrl', { file_uri: uri });
  const url = res.data?.signed_url;
  if (url) urlCache[uri] = url;
  return url || null;
}

function SilhouetteRow({ record, onToggle, onRefresh }) {
  const [origUrl, setOrigUrl] = useState(null);
  const [silUrl, setSilUrl] = useState(null);

  useEffect(() => {
    resolveUrl(record.hosted_image_url || record.source_image_url).then(setOrigUrl);
    resolveUrl(record.silhouette_image_url).then(setSilUrl);
  }, [record.hosted_image_url, record.source_image_url, record.silhouette_image_url]);

  const status = record.silhouette_status || 'none';
  const StatusIcon = STATUS_ICONS[status] || Clock;

  return (
    <tr className="border-b border-border/30 hover:bg-muted/20 transition-colors">
      {/* Name */}
      <td className="px-4 py-3">
        <p className="font-medium text-sm">{record.name}</p>
        <p className="text-xs text-muted-foreground font-mono">#{record.pokedex_number}</p>
      </td>

      {/* Original image */}
      <td className="px-4 py-3">
        {origUrl ? (
          <img src={origUrl} alt={record.name} className="w-12 h-12 object-contain rounded bg-muted/30" />
        ) : (
          <div className="w-12 h-12 rounded bg-muted/30 flex items-center justify-center text-xs text-muted-foreground">—</div>
        )}
      </td>

      {/* Silhouette */}
      <td className="px-4 py-3">
        {silUrl ? (
          <img src={silUrl} alt={`${record.name} silhouette`} className="w-12 h-12 object-contain rounded bg-muted/30" />
        ) : (
          <div className="w-12 h-12 rounded bg-muted/20 flex items-center justify-center text-xs text-muted-foreground">
            {status === 'generating' ? <Loader2 className="w-4 h-4 animate-spin text-blue-500" /> : '—'}
          </div>
        )}
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <Badge className={`${STATUS_COLORS[status]} border gap-1 text-[10px]`}>
          <StatusIcon className={`w-3 h-3 ${status === 'generating' ? 'animate-spin' : ''}`} />
          {status}
        </Badge>
      </td>

      {/* Toggle */}
      <td className="px-4 py-3">
        <button
          onClick={() => onToggle(record)}
          disabled={status !== 'ready'}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed ${
            record.use_silhouette ? 'bg-primary' : 'bg-muted'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              record.use_silhouette ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {record.use_silhouette ? 'Silhouette' : 'Original'}
        </p>
      </td>
    </tr>
  );
}

export default function SilhouetteTest() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [log, setLog] = useState(null);

  const fetchRecords = async () => {
    setLoading(true);
    // Only load the batch we care about (success imports, limited to BATCH_SIZE for initial test)
    const data = await base44.entities.PokemonImage.filter({ import_status: 'success' }, '-updated_date', 200);
    // Sort by pokedex number and take first BATCH_SIZE
    data.sort((a, b) => parseFloat(a.pokedex_number || 999) - parseFloat(b.pokedex_number || 999));
    setRecords(data.slice(0, BATCH_SIZE));
    setLoading(false);
  };

  useEffect(() => { fetchRecords(); }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    setLog(null);

    // Only generate for records that haven't been done yet
    const toGenerate = records.filter(r => r.silhouette_status !== 'ready');
    if (toGenerate.length === 0) {
      setLog({ message: 'All records already have silhouettes.' });
      setGenerating(false);
      return;
    }

    // Optimistically mark as generating in UI
    setRecords(prev => prev.map(r =>
      toGenerate.find(t => t.id === r.id) ? { ...r, silhouette_status: 'generating' } : r
    ));

    try {
      const res = await base44.functions.invoke('generateSilhouettes', {
        ids: toGenerate.map(r => r.id),
      });
      setLog(res.data);
      await fetchRecords();
    } catch (err) {
      setLog({ error: err.message });
    } finally {
      setGenerating(false);
    }
  };

  const handleToggle = async (record) => {
    const newVal = !record.use_silhouette;
    // Optimistic update
    setRecords(prev => prev.map(r => r.id === record.id ? { ...r, use_silhouette: newVal } : r));
    await base44.entities.PokemonImage.update(record.id, { use_silhouette: newVal });
  };

  const readyCount = records.filter(r => r.silhouette_status === 'ready').length;
  const generatingCount = records.filter(r => r.silhouette_status === 'generating').length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-1">Silhouette Test</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Generate and preview stylised silhouette icons for a test batch of {BATCH_SIZE} Pokémon.
      </p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Batch size', value: records.length },
          { label: 'Ready', value: readyCount, color: 'text-green-700' },
          { label: 'Generating', value: generatingCount, color: 'text-blue-700' },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-xl border border-border/50 p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color || ''}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Button onClick={handleGenerate} disabled={generating || loading} className="gap-2">
          {generating
            ? <><RefreshCw className="w-4 h-4 animate-spin" /> Generating…</>
            : <><Sparkles className="w-4 h-4" /> Generate Test Silhouettes</>
          }
        </Button>
        <Button variant="outline" onClick={async () => {
          await base44.functions.invoke('resetSilhouettes', {});
          await fetchRecords();
        }} disabled={loading} className="gap-2">
          Reset All
        </Button>
        <Button variant="ghost" onClick={fetchRecords} disabled={loading} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Log */}
      {log && (
        <div className={`mb-6 p-4 rounded-xl border text-sm ${log.error ? 'bg-red-50 border-red-200 text-red-800' : 'bg-green-50 border-green-200 text-green-800'}`}>
          {log.error
            ? <><strong>Error:</strong> {log.error}</>
            : <><strong>Done.</strong> Processed: {log.results?.processed} | Succeeded: {log.results?.succeeded} | Failed: {log.results?.failed}{log.message && ` — ${log.message}`}</>
          }
        </div>
      )}

      {/* Table */}
      <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Pokémon</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Original</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Silhouette</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Use in UI</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-muted-foreground">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && records.map(r => (
                <SilhouetteRow key={r.id} record={r} onToggle={handleToggle} onRefresh={fetchRecords} />
              ))}
              {!loading && records.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-muted-foreground text-sm">
                    No imported images found. Run the image import first.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}