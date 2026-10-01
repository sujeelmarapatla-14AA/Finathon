import React, { useState, useEffect, useMemo } from 'react';
import { Search, Download, ChevronRight, X, Filter } from 'lucide-react';
import { DataSource, DashboardData } from '../../types';
import { fetchFindingsData, DEMO_FILE_ID } from '../../services/api';
import { formatINR } from '../../utils/formatters';
import { PageHeader } from '../common/PageHeader';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { ProcurementAnalyticsSuite } from './analytics/ProcurementAnalyticsSuite';
import { computeProcurementAnalytics } from './analytics/analyticsUtils';

interface DataTableProps {
  onInvestigateTransaction?: (transactionId: string) => void;
  transactions?: any[];
  dashboardData?: DashboardData | null;
  source?: DataSource;
  fileId?: string;
}

export const DataTable: React.FC<DataTableProps> = ({
  onInvestigateTransaction,
  transactions: propTransactions,
  dashboardData,
  source = 'demo',
  fileId = DEMO_FILE_ID,
}) => {
  // Existing Filter State
  const [filterType, setFilterType] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dataList, setDataList] = useState<any[]>(propTransactions || []);
  const [loading, setLoading] = useState<boolean>(false);

  // Interactive Chart Filter State
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [selectedRisk, setSelectedRisk] = useState<string | null>(null);
  const [selectedAlertType, setSelectedAlertType] = useState<string | null>(null);
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null);
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);

  // Sync with prop transactions or fetch live from backend
  useEffect(() => {
    let isCancelled = false;

    if (propTransactions && propTransactions.length > 0) {
      setDataList(propTransactions);
      return;
    }

    async function loadData() {
      setLoading(true);
      try {
        const res = await fetchFindingsData(source, fileId);
        if (!isCancelled && res.findings) {
          setDataList(res.findings);
        }
      } catch (err) {
        console.warn('Transactions data fetch notice:', err);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    loadData();
    return () => {
      isCancelled = true;
    };
  }, [source, fileId, propTransactions]);

  // Reset interactive filters when source changes
  useEffect(() => {
    setSelectedSupplier(null);
    setSelectedProduct(null);
    setSelectedRisk(null);
    setSelectedAlertType(null);
    setSelectedBucket(null);
    setSelectedTxId(null);
  }, [source, fileId]);

  const filterTabs = [
    'All',
    'Price anomaly',
    'Duplicate',
    'Supplier fragmentation',
    'Contract',
    'Missed discount',
  ];

  // SINGLE FILTERED DATASET
  const filteredData = useMemo(() => {
    return dataList.filter((tx) => {
      const fType = String(tx.type || tx.detection_type || '').toUpperCase();

      // Category tab filter
      if (filterType === 'Price anomaly' && !fType.includes('PRICE_ANOMALY')) return false;
      if (filterType === 'Duplicate' && !fType.includes('DUPLICATE')) return false;
      if (filterType === 'Supplier fragmentation' && !fType.includes('FRAGMENTATION')) return false;
      if (filterType === 'Contract' && !fType.includes('CONTRACT')) return false;
      if (filterType === 'Missed discount' && !fType.includes('DISCOUNT')) return false;

      // Interactive chart alert type filter
      if (selectedAlertType) {
        const upperAlert = selectedAlertType.toUpperCase();
        if (!fType.includes(upperAlert)) return false;
      }

      // Interactive chart supplier filter
      if (selectedSupplier) {
        const supp = String(tx.supplier || tx.supplier_name || '').toLowerCase();
        if (supp !== selectedSupplier.toLowerCase()) return false;
      }

      // Interactive chart product filter
      if (selectedProduct) {
        const prod = String(tx.product || tx.product_name || '').toLowerCase();
        if (prod !== selectedProduct.toLowerCase()) return false;
      }

      // Interactive chart risk filter
      if (selectedRisk) {
        const r = String(tx.risk || tx.status || '').toUpperCase();
        if (!r.includes(selectedRisk.toUpperCase())) return false;
      }

      // Interactive chart variance bucket filter (0-5%, 5-10%, 10-15%, 15-20%, 20%+)
      if (selectedBucket) {
        const v = Number(tx.variance_percent ?? tx.variance ?? 0);
        if (selectedBucket === '0–5%' && (v < 0 || v >= 5)) return false;
        if (selectedBucket === '5–10%' && (v < 5 || v >= 10)) return false;
        if (selectedBucket === '10–15%' && (v < 10 || v >= 15)) return false;
        if (selectedBucket === '15–20%' && (v < 15 || v >= 20)) return false;
        if (selectedBucket === '20%+' && v < 20) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const id = String(tx.transaction_id || tx.id || '').toLowerCase();
        const supp = String(tx.supplier || '').toLowerCase();
        const prod = String(tx.product || tx.product_name || '').toLowerCase();
        const po = String(tx.po_id || tx.poNumber || '').toLowerCase();
        return id.includes(q) || supp.includes(q) || prod.includes(q) || po.includes(q);
      }

      return true;
    });
  }, [
    dataList,
    filterType,
    searchQuery,
    selectedSupplier,
    selectedProduct,
    selectedRisk,
    selectedAlertType,
    selectedBucket,
  ]);

  // Master analytics computation
  const analytics = useMemo(() => {
    return computeProcurementAnalytics(filteredData, dashboardData);
  }, [filteredData, dashboardData]);

  // Interactive filter toggle helpers
  const handleToggleSupplier = (supplier: string) => {
    setSelectedSupplier((prev) => (prev === supplier ? null : supplier));
  };

  const handleToggleProduct = (product: string) => {
    setSelectedProduct((prev) => (prev === product ? null : product));
  };

  const handleToggleRisk = (risk: string) => {
    setSelectedRisk((prev) => (prev === risk ? null : risk));
  };

  const handleToggleAlertType = (alertType: string) => {
    setSelectedAlertType((prev) => (prev === alertType ? null : alertType));
  };

  const handleToggleBucket = (bucket: string) => {
    setSelectedBucket((prev) => (prev === bucket ? null : bucket));
  };

  const handleClearInteractiveFilter = (type: 'supplier' | 'product' | 'risk' | 'alert' | 'bucket') => {
    if (type === 'supplier') setSelectedSupplier(null);
    if (type === 'product') setSelectedProduct(null);
    if (type === 'risk') setSelectedRisk(null);
    if (type === 'alert') setSelectedAlertType(null);
    if (type === 'bucket') setSelectedBucket(null);
  };

  const handleClearAllInteractiveFilters = () => {
    setSelectedSupplier(null);
    setSelectedProduct(null);
    setSelectedRisk(null);
    setSelectedAlertType(null);
    setSelectedBucket(null);
  };

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Transaction,Supplier,Product,Quantity,ActualPrice,BenchmarkPrice,Variance,Leakage,Risk\n' +
      filteredData
        .map(
          (e) =>
            `${e.transaction_id || e.id},"${e.supplier || ''}","${e.product || e.product_name || ''}",${e.quantity || ''},${e.actual_price || e.unit_price || ''},${e.benchmark_price || e.benchmark_unit_price || ''},${e.variance_percent || e.variance || 0}%,${e.potential_leakage || e.amount || 0},${e.risk || 'MEDIUM'}`
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `spendintel_${source}_procurement_audit.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-12">
      {/* 1. Header */}
      <PageHeader
        label="Procurement Analytics & Audit Center"
        title="Trace the spend."
        description="Comprehensive forensic analytics and line-item reconciliation showing unit price variance against contractual rate cards and historical benchmark purchases."
        actions={
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#151515]/5 border border-[#151515]/10 text-[10px] font-mono font-semibold text-[#151515] shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#B8A47A] shadow-[0_0_6px_rgba(184,164,122,0.8)]" />
              <span>
                {source === 'nova'
                  ? 'LIVE NOVA'
                  : source === 'upload'
                  ? 'UPLOADED DATA'
                  : source === 'manual'
                  ? 'MANUAL DATA'
                  : 'DEMO DATASET'}
              </span>
            </div>
            <Button
              variant="secondary"
              size="md"
              onClick={handleExportCSV}
              icon={<Download className="w-3.5 h-3.5 text-[#151515]/70" />}
              iconPosition="left"
            >
              Export CSV
            </Button>
          </div>
        }
      />

      {/* 2. Top Filter Bar & Search Controls */}
      <div className="p-4 sm:p-5 rounded-[24px] bg-[#F3F3F1] border border-[#151515]/10 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {filterTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterType(tab)}
              className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                filterType === tab
                  ? 'bg-[#151515] text-[#F3F3F1] shadow-sm font-semibold'
                  : 'bg-[#151515]/5 text-[#151515]/70 hover:text-[#151515] hover:bg-[#151515]/10 border border-[#151515]/10'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#151515]/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search transaction, supplier, product..."
            className="w-full h-10 pl-9 pr-4 rounded-full bg-[#151515]/5 border border-[#151515]/10 text-xs font-sans text-[#151515] placeholder-[#151515]/40 focus:outline-none focus:border-[#151515] transition-colors"
          />
        </div>
      </div>

      {/* 3. Master Analytics Visualization Layer */}
      <ProcurementAnalyticsSuite
        analytics={analytics}
        source={source}
        selectedSupplier={selectedSupplier}
        selectedProduct={selectedProduct}
        selectedRisk={selectedRisk}
        selectedAlertType={selectedAlertType}
        selectedBucket={selectedBucket}
        onSelectSupplier={handleToggleSupplier}
        onSelectProduct={handleToggleProduct}
        onSelectRisk={handleToggleRisk}
        onSelectAlertType={handleToggleAlertType}
        onSelectBucket={handleToggleBucket}
        onClearInteractiveFilter={handleClearInteractiveFilter}
        onClearAllInteractiveFilters={handleClearAllInteractiveFilters}
        onInvestigateTransaction={onInvestigateTransaction}
        isLoading={loading}
      />

      {/* 4. Transaction Evidence Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-[#151515]">
              Procurement Audit Line Items
            </h3>
            <p className="text-xs text-[#151515]/60">
              Underlying granular purchase orders matching active analytics filters.
            </p>
          </div>
          <span className="text-xs font-mono text-[#151515]/50">
            Showing {filteredData.length} records
          </span>
        </div>

        <div className="bg-[#F3F3F1] rounded-[28px] border border-[#151515]/10 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1020px]">
              <thead>
                <tr className="border-b border-[#151515]/10 bg-[#151515]/5 text-[11px] font-sans font-semibold uppercase tracking-wider text-[#151515]/60 h-12">
                  <th className="px-6 text-left">Transaction</th>
                  <th className="px-5 text-left">Supplier</th>
                  <th className="px-5 text-left">Product</th>
                  <th className="px-4 text-right">Quantity</th>
                  <th className="px-4 text-right">Actual</th>
                  <th className="px-4 text-right">Benchmark</th>
                  <th className="px-4 text-right">Variance</th>
                  <th className="px-5 text-right">Leakage</th>
                  <th className="px-4 text-center">Risk</th>
                  <th className="px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#151515]/10 text-xs font-sans">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-16 text-center text-[#151515]/50">
                      <div className="space-y-2 max-w-sm mx-auto">
                        <span className="text-xs font-semibold text-[#151515] uppercase tracking-wider block">
                          NO DATA FOR THIS FILTER
                        </span>
                        <p className="text-xs text-[#151515]/60">
                          Try adjusting your search criteria, clearing chart filters, or resetting category tabs.
                        </p>
                        {(selectedSupplier || selectedProduct || selectedRisk || selectedAlertType || selectedBucket) && (
                          <button
                            onClick={handleClearAllInteractiveFilters}
                            className="mt-2 text-xs font-medium text-[#B8A47A] hover:underline"
                          >
                            Clear interactive chart filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredData.map((tx, idx) => {
                    const txId = tx.transaction_id || tx.id || `TX-${idx + 1}`;
                    const supp = tx.supplier || 'Not available';
                    const prod = tx.product || tx.product_name || 'Not available';
                    const qty = tx.quantity !== undefined && tx.quantity !== null ? tx.quantity : '—';
                    const actual =
                      tx.actual_price !== undefined && tx.actual_price !== null
                        ? formatINR(tx.actual_price)
                        : tx.unit_price !== undefined
                        ? formatINR(tx.unit_price)
                        : '—';
                    const bench =
                      tx.benchmark_price !== undefined && tx.benchmark_price !== null
                        ? formatINR(tx.benchmark_price)
                        : tx.benchmark_unit_price !== undefined
                        ? formatINR(tx.benchmark_unit_price)
                        : '—';
                    const variance =
                      tx.variance_percent !== undefined && tx.variance_percent !== null
                        ? `+${tx.variance_percent.toFixed(2)}%`
                        : tx.variance !== undefined
                        ? `+${Number(tx.variance).toFixed(2)}%`
                        : '—';
                    const leakage = Number(tx.potential_leakage || tx.amount || 0);
                    const isRowSelected = selectedTxId === txId;

                    return (
                      <tr
                        key={tx.id || `${txId}-${idx}`}
                        onClick={() => {
                          setSelectedTxId(txId === selectedTxId ? null : txId);
                          onInvestigateTransaction?.(txId);
                        }}
                        className={`h-14 transition-colors cursor-pointer group ${
                          isRowSelected
                            ? 'bg-[#B8A47A]/15'
                            : 'hover:bg-[#151515]/5'
                        }`}
                      >
                        <td className="px-6 font-mono font-medium text-[#151515]">
                          {txId}
                        </td>
                        <td
                          className="px-5 font-medium text-[#151515] max-w-[160px] truncate"
                          title={supp}
                        >
                          {supp}
                        </td>
                        <td
                          className="px-5 text-[#151515]/70 max-w-[200px] truncate"
                          title={prod}
                        >
                          {prod}
                        </td>
                        <td className="px-4 text-right font-mono text-[#151515]/70 tnum">
                          {qty}
                        </td>
                        <td className="px-4 text-right font-mono font-medium text-[#151515] tnum">
                          {actual}
                        </td>
                        <td className="px-4 text-right font-mono text-[#151515]/50 tnum">
                          {bench}
                        </td>
                        <td className="px-4 text-right font-mono font-medium text-[#B8A47A] tnum">
                          {variance}
                        </td>
                        <td className="px-5 text-right font-mono font-medium text-[#151515] tnum">
                          {leakage > 0 ? formatINR(leakage) : '—'}
                        </td>
                        <td className="px-4 text-center">
                          <Badge
                            variant={
                              String(tx.risk || tx.status || 'MEDIUM').toLowerCase() === 'high'
                                ? 'high'
                                : String(tx.risk || '').toLowerCase() === 'medium'
                                ? 'medium'
                                : 'low'
                            }
                          >
                            {tx.risk || tx.status || 'MEDIUM'}
                          </Badge>
                        </td>
                        <td className="px-6 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onInvestigateTransaction?.(txId);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-[#151515]/5 group-hover:bg-[#151515] border border-[#151515]/10 group-hover:border-[#151515] text-[#151515] group-hover:text-[#F3F3F1] transition-all shadow-xs"
                          >
                            <span>Investigate</span>
                            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="p-4 sm:p-5 border-t border-[#151515]/10 bg-[#151515]/5 flex items-center justify-between text-xs text-[#151515]/60">
            <span>Showing {filteredData.length} procurement records</span>
            <span className="font-mono">Evidence-backed deterministic verification</span>
          </div>
        </div>
      </div>
    </div>
  );
};
