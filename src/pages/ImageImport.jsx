import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { RefreshCw, Play, RotateCcw, Search, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

const STATUS_CONFIG = {
  success: { label: 'Success', icon: CheckCircle, cls: 'bg-green-100 text-green-800 border-green-200' },
  failed:  { label: 'Failed',  icon: XCircle,     cls: 'bg-red-100 text-red-800 border-red-200' },
  pending: { label: 'Pending', icon: Clock,        cls: 'bg-orange-100 text-orange-800 border-orange-200' },
};

export default function ImageImport() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [log, setLog] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchRecords = async () => {
    setLoading(true);
    const data = await base44.entities.PokemonImage.list('-updated_date', 500);
    setRecords(data);
    setLoading(false);
  };

  useEffect(() => { fetchRecords(); }, []);

  const runImport = async (mode) => {
    if (mode === 'all') setImporting(true);
    else setRetrying(true);
    setLog(null);

    try {
      const res = await base44.functions.invoke('importPokemonImages', { mode });
      setLog(res.data);
      await fetchRecords();
    } catch (err) {
      setLog({ error: err.message });
    } finally {
      setImporting(false);
      setRetrying(false);
    }
  };

  const filtered = records.filter(r => {
    const matchSearch = !search || r.name?.toLowerCase().includes(search.toLowerCase()) || r.slug?.includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || r.import_status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: records.length,
    success: records.filter(r => r.import_status === 'success').length,
    failed: records.filter(r => r.import_status === 'failed').length,
    pending: records.filter(r => r.import_status === 'pending').length,
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-1">Pokémon Image Import</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Pull Pokémon images from <code className="bg-muted px-1 rounded text-xs">pokopia.dev/pokedex/</code> and host them in app storage.
      </p>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Button
          onClick={() => runImport('all')}
          disabled={importing || retrying}
          className="gap-2"
        >
          {importing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          {importing ? 'Running Import…' : 'Run Import'}
        </Button>
        <Button
          variant="outline"
          onClick={() => runImport('retry_failed')}
          disabled={importing || retrying || stats.failed === 0}
          className="gap-2"
        >
          {retrying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
          {retrying ? 'Retrying…' : `Retry Failed (${stats.failed})`}
        </Button>
        <Button variant="ghost" onClick={fetchRecords} disabled={loading} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Log output */}
      {log && (
        <div className={`mb-6 p-4 rounded-xl border text-sm ${log.error ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
          {log.error ? (
            <div className="flex items-start gap-2 text-red-800">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span><strong>Error:</strong> {log.error}</span>
            </div>
          ) : (
            <div className="text-green-800 space-y-1">
              <p className="font-semibold">Import complete</p>
              <p>Processed: {log.results?.processed} &nbsp;|&nbsp; Succeeded: {log.results?.succeeded} &nbsp;|&nbsp; Failed: {log.results?.failed}</p>
              {log.results?.skipped && <p className="text-xs text-muted-foreground">{log.results.skipped}</p>}
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total', value: stats.total, color: 'text-foreground' },
          { label: 'Success', value: stats.success, color: 'text-green-700' },
          { label: 'Failed', value: stats.failed, color: 'text-red-700' },
          { label: 'Pending', value: stats.pending, color: 'text-orange-700' },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-xl border border-border/50 p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search name or slug…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <div className="flex gap-1">
          {['all', 'success', 'failed', 'pending'].map(s => (
            <Button
              key={s}
              variant={statusFilter === s ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(s)}
              className="text-xs capitalize"
            >
              {s}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground w-12">Image</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden sm:table-cell">#</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Source URL</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden lg:table-cell">Hosted URL</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Reason</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground text-sm">
                    {records.length === 0
                      ? 'No records yet. Run the import to get started.'
                      : 'No records match your filters.'}
                  </td>
                </tr>
              )}
              {filtered.map(r => {
                const cfg = STATUS_CONFIG[r.import_status] || STATUS_CONFIG.pending;
                const Icon = cfg.icon;
                return (
                  <tr key={r.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-2">
                      {r.hosted_image_url ? (
                        <img
                          src={r.hosted_image_url}
                          alt={r.name}
                          className="w-10 h-10 object-contain rounded bg-muted/30"
                          onError={e => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded bg-muted/30 flex items-center justify-center text-xs text-muted-foreground">?</div>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <p className="font-medium">{r.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{r.slug}</p>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground hidden sm:table-cell">
                      {r.pokedex_number || '—'}
                    </td>
                    <td className="px-4 py-2 hidden md:table-cell max-w-48">
                      {r.source_image_url ? (
                        <a href={r.source_image_url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline truncate block max-w-48">
                          {r.source_image_url}
                        </a>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-2 hidden lg:table-cell max-w-48">
                      {r.hosted_image_url ? (
                        <a href={r.hosted_image_url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-green-700 hover:underline truncate block max-w-48">
                          {r.hosted_image_url}
                        </a>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-2">
                      <Badge className={`${cfg.cls} border gap-1 text-[10px]`}>
                        <Icon className="w-3 h-3" />
                        {cfg.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 hidden md:table-cell text-xs text-red-600 max-w-40 truncate">
                      {r.failed_reason || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="px-4 py-2 border-t border-border/30 text-xs text-muted-foreground">
            Showing {filtered.length} of {records.length} records
          </div>
        )}
      </div>
    </div>
  );
}