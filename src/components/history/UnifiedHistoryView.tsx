import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database,
  FileSpreadsheet,
  Cloud,
  PenLine,
  Search,
  RefreshCw,
  Trash2,
  ExternalLink,
  Code,
  Calendar,
  Layers,
  TrendingDown,
  Building2,
  Scale,
  CheckCircle2,
  Clock,
  ArrowRight,
  Filter,
  Eye,
  X,
  ChevronRight,
  AlertCircle,
  FileText,
  PlusCircle,
} from 'lucide-react';
import { UnifiedDatasetItem, DatasetRowItem, DatasetSourceType, TabType, DataSource } from '../../types';
import {
  fetchDatasets,
  fetchDatasetRows,
  deleteHistoricalDataset,
  syncNovaDataset,
} from '../../services/api';
import { formatCompactINR, formatINR, formatPercent } from '../../utils/formatters';

interface UnifiedHistoryViewProps {
  onSelectDataset: (datasetId: string, source: DataSource) => void;
  onNavigate: (tab: TabType) => void;
  currentDatasetId?: string;
}

export const UnifiedHistoryView: React.FC<UnifiedHistoryViewProps> = ({
  onSelectDataset,
  onNavigate,
  currentDatasetId,
}) => {
  const [datasets, setDatasets] = useState<UnifiedDatasetItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedSourceFilter, setSelectedSourceFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSyncingNova, setIsSyncingNova] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Inspector Modal State
  const [inspectingDataset, setInspectingDataset] = useState<UnifiedDatasetItem | null>(null);
  const [inspectingRows, setInspectingRows] = useState<DatasetRowItem[]>([]);
  const [isLoadingRows, setIsLoadingRows] = useState<boolean>(false);
  const [rowSearchQuery, setRowSearchQuery] = useState<string>('');
  const [selectedRowDetail, setSelectedRowDetail] = useState<DatasetRowItem | null>(null);

  // Load datasets on mount
  const loadDatasetsList = async () => {
    setIsLoading(true);
    setActionError(null);
    try {
      const res = await fetchDatasets('ALL');
      setDatasets(res.datasets || []);
    } catch (err: any) {
      setActionError(err.message || 'Failed to load historical datasets.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDatasetsList();
  }, []);

  // Sync Nova Live API
  const handleSyncNova = async () => {
    setIsSyncingNova(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await syncNovaDataset();
      setActionSuccess(res.message || 'Live Nova procurement synced successfully.');
      await loadDatasetsList();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      setActionError(err.message || 'Failed to sync live Nova API.');
    } finally {
      setIsSyncingNova(false);
    }
  };

  // Delete Dataset
  const handleDeleteDataset = async (datasetId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete dataset "${name}" and all associated audit rows?`)) {
      return;
    }
    setActionError(null);
    try {
      await deleteHistoricalDataset(datasetId);
      setActionSuccess(`Dataset "${name}" deleted.`);
      setDatasets((prev) => prev.filter((d) => d.id !== datasetId));
      if (inspectingDataset?.id === datasetId) {
        setInspectingDataset(null);
      }
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      setActionError(err.message || 'Failed to delete dataset.');
    }
  };

  // Inspect Raw Rows
  const handleOpenInspector = async (dataset: UnifiedDatasetItem) => {
    setInspectingDataset(dataset);
    setIsLoadingRows(true);
    setSelectedRowDetail(null);
    setRowSearchQuery('');
    try {
      const res = await fetchDatasetRows(dataset.id, 300);
      setInspectingRows(res.rows || []);
      if (res.rows && res.rows.length > 0) {
        setSelectedRowDetail(res.rows[0]);
      }
    } catch (err: any) {
      setActionError(`Could not load raw rows: ${err.message}`);
    } finally {
      setIsLoadingRows(false);
    }
  };

  // Filter datasets
  const filteredDatasets = useMemo(() => {
    return datasets.filter((d) => {
      // Source filter
      if (selectedSourceFilter === 'CSV_EXCEL') {
        if (d.source_type !== 'CSV' && d.source_type !== 'EXCEL') return false;
      } else if (selectedSourceFilter !== 'ALL' && d.source_type !== selectedSourceFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (d.name || '').toLowerCase().includes(q);
        const matchId = (d.id || '').toLowerCase().includes(q);
        const matchFilename = (d.original_filename || '').toLowerCase().includes(q);
        const matchSource = (d.source_type || '').toLowerCase().includes(q);
        return matchName || matchId || matchFilename || matchSource;
      }

      return true;
    });
  }, [datasets, selectedSourceFilter, searchQuery]);

  // Aggregate Metrics
  const summaryMetrics = useMemo(() => {
    const totalCount = datasets.length;
    const totalSpend = datasets.reduce((acc, d) => acc + (d.total_spend || 0), 0);
    const totalLeakage = datasets.reduce((acc, d) => acc + (d.potential_leakage || 0), 0);
    const totalRows = datasets.reduce((acc, d) => acc + (d.total_rows || 0), 0);
    return { totalCount, totalSpend, totalLeakage, totalRows };
  }, [datasets]);

  // Source Badge Component
  const renderSourceBadge = (sourceType: DatasetSourceType) => {
    switch (sourceType) {
      case 'NOVA_API':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-sky-500/10 text-sky-700 border border-sky-500/20">
            <Cloud className="w-3 h-3 text-sky-600" />
            NOVA API
          </span>
        );
      case 'MANUAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-amber-500/10 text-amber-800 border border-amber-500/20">
            <PenLine className="w-3 h-3 text-amber-600" />
            MANUAL DATA
          </span>
        );
      case 'EXCEL':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-emerald-500/10 text-emerald-800 border border-emerald-500/20">
            <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
            EXCEL
          </span>
        );
      case 'CSV':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-[#B8A47A]/15 text-[#151515] border border-[#B8A47A]/30">
            <FileSpreadsheet className="w-3 h-3 text-[#B8A47A]" />
            CSV
          </span>
        );
    }
  };

  // Convert source_type to application DataSource
  const resolveAppSource = (sourceType: DatasetSourceType, datasetId: string): DataSource => {
    if (sourceType === 'NOVA_API') return 'nova';
    if (sourceType === 'MANUAL') return 'manual';
    if (datasetId === 'cb8b20d5-2516-47a9-8646-317e9beee50b') return 'demo';
    return 'upload';
  };

  // Filtered raw rows inside inspector
  const filteredRows = useMemo(() => {
    if (!rowSearchQuery.trim()) return inspectingRows;
    const q = rowSearchQuery.toLowerCase();
    return inspectingRows.filter((r) => {
      return (
        (r.product_name || '').toLowerCase().includes(q) ||
        (r.supplier || '').toLowerCase().includes(q) ||
        (r.category || '').toLowerCase().includes(q) ||
        (r.sku || '').toLowerCase().includes(q)
      );
    });
  }, [inspectingRows, rowSearchQuery]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Header & Navigation Context */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[#151515]/10">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase bg-[#151515] text-[#F3F3F1]">
              DATABASE + AUDIT REPOSITORY
            </span>
            <span className="text-xs font-mono text-[#151515]/50">• UNIFIED STORAGE MODEL</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-[#151515] tracking-tight">
            Procurement Dataset History
          </h1>
          <p className="text-sm text-[#151515]/70 max-w-2xl mt-1">
            Every analysis from CSV / Excel uploads, Nova Live Cloud API, and Manual Entry is persisted in the unified SQLite database with complete raw record audit trails.
          </p>
        </div>

        {/* Global Ingestion Actions */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <button
            onClick={handleSyncNova}
            disabled={isSyncingNova}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold bg-[#151515]/5 hover:bg-[#151515]/10 text-[#151515] border border-[#151515]/15 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#B8A47A] ${isSyncingNova ? 'animate-spin' : ''}`} />
            <span>{isSyncingNova ? 'Syncing Nova...' : 'Sync Nova Live API'}</span>
          </button>

          <button
            onClick={() => onNavigate('upload')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold bg-[#151515] hover:bg-[#151515]/90 text-[#F3F3F1] border border-[#151515] transition-all shadow-sm cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5 text-[#B8A47A]" />
            <span>Ingest New Dataset</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 text-xs font-medium flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-900 text-xs font-medium flex items-center gap-2.5 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* 2. Executive Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-[20px] bg-[#151515]/[0.03] border border-[#151515]/10 shadow-xs">
          <div className="flex items-center justify-between text-xs font-mono text-[#151515]/60 mb-2">
            <span>PERSISTED DATASETS</span>
            <Database className="w-4 h-4 text-[#B8A47A]" />
          </div>
          <div className="text-2xl font-serif font-bold text-[#151515]">
            {summaryMetrics.totalCount}
          </div>
          <div className="text-[11px] text-[#151515]/60 mt-1">Across 3 Ingestion Channels</div>
        </div>

        <div className="p-5 rounded-[20px] bg-[#151515]/[0.03] border border-[#151515]/10 shadow-xs">
          <div className="flex items-center justify-between text-xs font-mono text-[#151515]/60 mb-2">
            <span>TOTAL ANALYZED SPEND</span>
            <FileSpreadsheet className="w-4 h-4 text-[#B8A47A]" />
          </div>
          <div className="text-2xl font-serif font-bold text-[#151515]">
            {formatCompactINR(summaryMetrics.totalSpend)}
          </div>
          <div className="text-[11px] text-[#151515]/60 mt-1">Cumulative Procurement Volume</div>
        </div>

        <div className="p-5 rounded-[20px] bg-[#151515]/[0.03] border border-[#151515]/10 shadow-xs">
          <div className="flex items-center justify-between text-xs font-mono text-[#151515]/60 mb-2">
            <span>TOTAL LEAKAGE FOUND</span>
            <TrendingDown className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-serif font-bold text-rose-700">
            {formatCompactINR(summaryMetrics.totalLeakage)}
          </div>
          <div className="text-[11px] text-[#151515]/60 mt-1">
            {summaryMetrics.totalSpend > 0
              ? `${formatPercent((summaryMetrics.totalLeakage / summaryMetrics.totalSpend) * 100)} Avg Exposure`
              : '0.00% Avg Exposure'}
          </div>
        </div>

        <div className="p-5 rounded-[20px] bg-[#151515]/[0.03] border border-[#151515]/10 shadow-xs">
          <div className="flex items-center justify-between text-xs font-mono text-[#151515]/60 mb-2">
            <span>PRESERVED RAW ROWS</span>
            <Layers className="w-4 h-4 text-[#B8A47A]" />
          </div>
          <div className="text-2xl font-serif font-bold text-[#151515]">
            {summaryMetrics.totalRows.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#151515]/60 mt-1">Complete JSON Audit Logs</div>
        </div>
      </div>

      {/* 3. Filter Bar & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-2 bg-[#151515]/[0.02] rounded-2xl border border-[#151515]/10">
        {/* Source Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedSourceFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              selectedSourceFilter === 'ALL'
                ? 'bg-[#151515] text-[#F3F3F1] shadow-xs'
                : 'text-[#151515]/70 hover:text-[#151515] hover:bg-[#151515]/5'
            }`}
          >
            All Sources ({datasets.length})
          </button>

          <button
            onClick={() => setSelectedSourceFilter('CSV_EXCEL')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              selectedSourceFilter === 'CSV_EXCEL'
                ? 'bg-[#151515] text-[#F3F3F1] shadow-xs'
                : 'text-[#151515]/70 hover:text-[#151515] hover:bg-[#151515]/5'
            }`}
          >
            <FileSpreadsheet className="w-3 h-3 text-[#B8A47A]" />
            CSV / Excel (
            {datasets.filter((d) => d.source_type === 'CSV' || d.source_type === 'EXCEL').length})
          </button>

          <button
            onClick={() => setSelectedSourceFilter('NOVA_API')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              selectedSourceFilter === 'NOVA_API'
                ? 'bg-[#151515] text-[#F3F3F1] shadow-xs'
                : 'text-[#151515]/70 hover:text-[#151515] hover:bg-[#151515]/5'
            }`}
          >
            <Cloud className="w-3 h-3 text-sky-600" />
            Nova API ({datasets.filter((d) => d.source_type === 'NOVA_API').length})
          </button>

          <button
            onClick={() => setSelectedSourceFilter('MANUAL')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              selectedSourceFilter === 'MANUAL'
                ? 'bg-[#151515] text-[#F3F3F1] shadow-xs'
                : 'text-[#151515]/70 hover:text-[#151515] hover:bg-[#151515]/5'
            }`}
          >
            <PenLine className="w-3 h-3 text-amber-600" />
            Manual Data ({datasets.filter((d) => d.source_type === 'MANUAL').length})
          </button>
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-[#151515]/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search datasets, files, or IDs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#F3F3F1] border border-[#151515]/15 text-xs text-[#151515] placeholder:text-[#151515]/40 focus:outline-none focus:border-[#B8A47A] transition-colors"
          />
        </div>
      </div>

      {/* 4. Dataset Repository List */}
      {isLoading ? (
        <div className="p-16 text-center">
          <div className="w-8 h-8 border-2 border-[#151515] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-mono uppercase tracking-widest text-[#151515]/60">
            Querying Unified Datasets Repository...
          </p>
        </div>
      ) : filteredDatasets.length === 0 ? (
        <div className="p-12 text-center rounded-[24px] bg-[#151515]/[0.02] border border-[#151515]/10">
          <Database className="w-10 h-10 text-[#151515]/30 mx-auto mb-3" />
          <h3 className="text-base font-serif font-bold text-[#151515]">No Datasets Found</h3>
          <p className="text-xs text-[#151515]/60 max-w-sm mx-auto mt-1 mb-4">
            No historical records match the active criteria. Ingest a dataset or trigger a Nova API sync to persist records.
          </p>
          <button
            onClick={() => onNavigate('upload')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-[#151515] text-[#F3F3F1]"
          >
            <PlusCircle className="w-3.5 h-3.5 text-[#B8A47A]" />
            <span>Ingest Procurement Data</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDatasets.map((dataset) => {
            const isCurrentlyActive = currentDatasetId === dataset.id;
            const appSource = resolveAppSource(dataset.source_type, dataset.id);
            const formattedDate = new Date(dataset.uploaded_at).toLocaleString('en-IN', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={dataset.id}
                className={`p-6 rounded-[24px] border transition-all duration-200 bg-[#F3F3F1] ${
                  isCurrentlyActive
                    ? 'border-[#B8A47A] shadow-md ring-1 ring-[#B8A47A]/30'
                    : 'border-[#151515]/10 hover:border-[#151515]/20 shadow-xs'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Metadata & Identity */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      {renderSourceBadge(dataset.source_type)}
                      <span className="text-xs font-mono text-[#151515]/40">•</span>
                      <span className="text-xs font-mono text-[#151515]/60">ID: {dataset.id}</span>
                      {isCurrentlyActive && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#151515] text-[#F3F3F1]">
                          ACTIVE DASHBOARD
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-lg font-serif font-bold text-[#151515]">{dataset.name}</h3>
                      <div className="flex items-center gap-3 text-xs text-[#151515]/60 mt-1 flex-wrap">
                        {dataset.original_filename && (
                          <span className="inline-flex items-center gap-1 font-mono">
                            <FileText className="w-3 h-3 text-[#B8A47A]" />
                            {dataset.original_filename}
                          </span>
                        )}
                        <span>•</span>
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-[#151515]/40" />
                          {formattedDate}
                        </span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-[#151515]/40" />
                          {dataset.suppliers_count || 0} Vendors
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Metrics Pills */}
                  <div className="grid grid-cols-3 gap-3 bg-[#151515]/[0.03] p-3 rounded-2xl border border-[#151515]/10 shrink-0">
                    <div className="text-center px-2">
                      <span className="text-[10px] font-mono text-[#151515]/50 block">ROWS</span>
                      <span className="text-sm font-bold font-mono text-[#151515]">
                        {dataset.total_rows}
                      </span>
                    </div>
                    <div className="text-center px-2 border-x border-[#151515]/10">
                      <span className="text-[10px] font-mono text-[#151515]/50 block">SPEND</span>
                      <span className="text-sm font-bold text-[#151515]">
                        {formatCompactINR(dataset.total_spend || 0)}
                      </span>
                    </div>
                    <div className="text-center px-2">
                      <span className="text-[10px] font-mono text-rose-600 block">LEAKAGE</span>
                      <span className="text-sm font-bold text-rose-700">
                        {formatCompactINR(dataset.potential_leakage || 0)}
                      </span>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <button
                      onClick={() => handleOpenInspector(dataset)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#151515]/5 hover:bg-[#151515]/10 text-[#151515] border border-[#151515]/15 transition-all cursor-pointer"
                      title="Inspect preserved raw input rows"
                    >
                      <Code className="w-3.5 h-3.5 text-[#B8A47A]" />
                      <span>Inspect Raw Data</span>
                    </button>

                    <button
                      onClick={() => onSelectDataset(dataset.id, appSource)}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        isCurrentlyActive
                          ? 'bg-[#B8A47A] text-[#151515] shadow-xs'
                          : 'bg-[#151515] hover:bg-[#151515]/90 text-[#F3F3F1] shadow-sm'
                      }`}
                    >
                      <span>{isCurrentlyActive ? 'Viewing Dashboard' : 'Load Dashboard'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    {dataset.id !== 'cb8b20d5-2516-47a9-8646-317e9beee50b' && (
                      <button
                        onClick={() => handleDeleteDataset(dataset.id, dataset.name)}
                        className="p-2 rounded-xl text-[#151515]/40 hover:text-rose-600 hover:bg-rose-500/10 transition-all cursor-pointer"
                        title="Delete dataset"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Raw Records Inspector Drawer / Modal */}
      <AnimatePresence>
        {inspectingDataset && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#151515]/60 backdrop-blur-sm animate-in fade-in duration-200">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#F3F3F1] w-full max-w-5xl max-h-[90vh] rounded-[28px] border border-[#151515]/20 shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-[#151515]/10 flex items-center justify-between gap-4 bg-[#F3F3F1]">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {renderSourceBadge(inspectingDataset.source_type)}
                    <span className="text-xs font-mono text-[#151515]/50">
                      • {inspectingDataset.total_rows} Preserved Records
                    </span>
                  </div>
                  <h2 className="text-xl font-serif font-bold text-[#151515]">
                    Raw Input Audit: {inspectingDataset.name}
                  </h2>
                  <p className="text-xs text-[#151515]/60 font-mono mt-0.5">
                    Dataset Reference: {inspectingDataset.source_reference || 'uploaded_file'}
                  </p>
                </div>

                <button
                  onClick={() => setInspectingDataset(null)}
                  className="p-2 rounded-full hover:bg-[#151515]/5 text-[#151515]/60 hover:text-[#151515] transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[#151515]/10">
                {/* Left: Row Selector Table */}
                <div className="flex flex-col h-full overflow-hidden p-4">
                  <div className="relative mb-3">
                    <Search className="w-3.5 h-3.5 text-[#151515]/40 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Filter rows by product, supplier, SKU..."
                      value={rowSearchQuery}
                      onChange={(e) => setRowSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#151515]/5 border border-[#151515]/10 text-xs text-[#151515] placeholder:text-[#151515]/40 focus:outline-none"
                    />
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                    {isLoadingRows ? (
                      <div className="p-8 text-center text-xs font-mono text-[#151515]/50">
                        Loading preserved records...
                      </div>
                    ) : filteredRows.length === 0 ? (
                      <div className="p-8 text-center text-xs text-[#151515]/50">
                        No rows matching filter.
                      </div>
                    ) : (
                      filteredRows.map((row) => {
                        const isSelected = selectedRowDetail?.id === row.id;
                        return (
                          <div
                            key={row.id}
                            onClick={() => setSelectedRowDetail(row)}
                            className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-[#151515] text-[#F3F3F1] border-[#151515] shadow-xs'
                                : 'bg-[#151515]/[0.02] border-[#151515]/10 hover:bg-[#151515]/5 text-[#151515]'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span
                                className={`font-mono text-[10px] font-bold ${
                                  isSelected ? 'text-[#B8A47A]' : 'text-[#151515]/50'
                                }`}
                              >
                                ROW #{row.row_number}
                              </span>
                              <span className="font-mono font-semibold">
                                {formatINR(row.price || 0)}
                              </span>
                            </div>
                            <p className="font-bold truncate">{row.product_name || 'Item'}</p>
                            <div className="flex items-center justify-between text-[11px] opacity-70 mt-1">
                              <span className="truncate">{row.supplier || 'Vendor'}</span>
                              <span>Qty: {row.quantity}</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Right: Raw JSON & Structured Data Inspector */}
                <div className="flex flex-col h-full overflow-hidden p-4 bg-[#151515]/[0.02]">
                  {selectedRowDetail ? (
                    <div className="flex flex-col h-full overflow-hidden">
                      <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#151515]/10">
                        <div>
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#151515]/50">
                            Preserved Raw Record #{selectedRowDetail.row_number}
                          </span>
                          <h4 className="text-sm font-bold text-[#151515] truncate">
                            {selectedRowDetail.product_name || 'Selected Transaction'}
                          </h4>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#B8A47A]/20 text-[#151515] font-bold">
                          ORIGINAL INPUT
                        </span>
                      </div>

                      {/* Structured Summary Grid */}
                      <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                        <div className="p-2 rounded-lg bg-[#F3F3F1] border border-[#151515]/10">
                          <span className="text-[10px] font-mono text-[#151515]/50 block">SUPPLIER</span>
                          <span className="font-semibold text-[#151515] truncate block">
                            {selectedRowDetail.supplier || 'N/A'}
                          </span>
                        </div>
                        <div className="p-2 rounded-lg bg-[#F3F3F1] border border-[#151515]/10">
                          <span className="text-[10px] font-mono text-[#151515]/50 block">PRICE / QTY</span>
                          <span className="font-semibold text-[#151515] block">
                            {formatINR(selectedRowDetail.price || 0)} × {selectedRowDetail.quantity || 1}
                          </span>
                        </div>
                      </div>

                      {/* Raw JSON Code Block */}
                      <div className="flex-1 flex flex-col overflow-hidden">
                        <span className="text-[10px] font-mono text-[#151515]/60 mb-1">
                          COMPLETE AUDIT PAYLOAD (`raw_data` JSON):
                        </span>
                        <pre className="flex-1 p-4 rounded-xl bg-[#151515] text-[#F3F3F1] font-mono text-xs overflow-auto border border-[#151515]/20 shadow-inner">
                          {JSON.stringify(selectedRowDetail.raw_data || {}, null, 2)}
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-[#151515]/50 font-mono">
                      Select a row to inspect its exact preserved JSON input.
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-[#F3F3F1] border-t border-[#151515]/10 flex items-center justify-between">
                <span className="text-xs font-mono text-[#151515]/60">
                  Total Preserved Rows: {inspectingRows.length}
                </span>
                <button
                  onClick={() => {
                    const src = resolveAppSource(inspectingDataset.source_type, inspectingDataset.id);
                    onSelectDataset(inspectingDataset.id, src);
                    setInspectingDataset(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#151515] text-[#F3F3F1] hover:bg-[#151515]/90 transition-all cursor-pointer"
                >
                  <span>Load This Dataset into Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#B8A47A]" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
