import React, { useState, useEffect } from 'react';
import { Search, ArrowRight, Layers, FileSpreadsheet, ShieldAlert, Sparkles } from 'lucide-react';
import { TabType, DataSource } from '../../types';
import { fetchFindingsData, DEMO_FILE_ID } from '../../services/api';
import { formatINR, formatCompactINR } from '../../utils/formatters';
import { PageHeader } from '../common/PageHeader';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

interface LeakageExplorerProps {
  onInvestigateFinding: (ref: string) => void;
  onNavigate: (tab: TabType) => void;
  source?: DataSource;
  fileId?: string;
  findings?: any[] | null;
}

export const LeakageExplorer: React.FC<LeakageExplorerProps> = ({
  onInvestigateFinding,
  onNavigate,
  source = 'demo',
  fileId = DEMO_FILE_ID,
  findings: propFindings,
}) => {
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [findingsList, setFindingsList] = useState<any[]>(propFindings || []);
  const [selectedFinding, setSelectedFinding] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    if (propFindings && propFindings.length > 0) {
      setFindingsList(propFindings);
      setSelectedFinding(propFindings[0]);
      return;
    }

    async function loadFindings() {
      setLoading(true);
      try {
        const res = await fetchFindingsData(source, fileId);
        if (!isCancelled && res.findings) {
          setFindingsList(res.findings);
          if (res.findings.length > 0) {
            setSelectedFinding(res.findings[0]);
          }
        }
      } catch (err) {
        console.warn('Findings fetch error:', err);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    loadFindings();
    return () => {
      isCancelled = true;
    };
  }, [source, fileId, propFindings]);

  const filters = [
    'All',
    'Price anomaly',
    'Missed discount',
    'Contract',
    'Duplicate',
    'Supplier fragmentation',
    'Unusual pattern',
  ];

  const filteredData = findingsList.filter((f) => {
    const fType = String(f.type || f.detection_type || '').toUpperCase();

    if (activeFilter === 'Price anomaly' && !fType.includes('PRICE_ANOMALY')) return false;
    if (activeFilter === 'Missed discount' && !fType.includes('DISCOUNT')) return false;
    if (activeFilter === 'Contract' && !fType.includes('CONTRACT')) return false;
    if (activeFilter === 'Duplicate' && !fType.includes('DUPLICATE')) return false;
    if (activeFilter === 'Supplier fragmentation' && !fType.includes('FRAGMENTATION')) return false;
    if (activeFilter === 'Unusual pattern' && !fType.includes('PATTERN') && !fType.includes('SPIKE')) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const tx = String(f.transaction_id || f.id || '').toLowerCase();
      const supp = String(f.supplier || '').toLowerCase();
      const prod = String(f.product || f.product_name || '').toLowerCase();
      return tx.includes(q) || supp.includes(q) || prod.includes(q);
    }
    return true;
  });

  const totalExposure = findingsList.reduce(
    (acc, cur) => acc + (Number(cur.potential_leakage) || Number(cur.amount) || 0),
    0
  );

  return (
    <div className="space-y-8">
      {/* Standardized Header */}
      <PageHeader
        label="Forensic Spend Trace"
        title="Leakage Explorer"
        description="Trace every flagged finding back to its source purchase order and historical rate card baseline."
        actions={
          <div className="flex items-center gap-5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-[#E8E8E3] text-[10px] font-mono font-semibold text-[#111111] shadow-xs">
              <span className={`w-1.5 h-1.5 rounded-full ${
                source === 'nova' ? 'bg-[#5E81AC] animate-pulse shadow-[0_0_6px_rgba(94,129,172,0.6)]' :
                source === 'upload' ? 'bg-[#E5A93C] shadow-[0_0_6px_rgba(229,169,60,0.6)]' :
                'bg-[#73C69A] shadow-[0_0_6px_rgba(115,198,154,0.6)]'
              }`} />
              <span>{source === 'nova' ? 'LIVE NOVA' : source === 'upload' ? 'UPLOADED FILE' : source === 'manual' ? 'MANUAL DATA' : 'DEMO DATASET'}</span>
            </div>
            <div className="text-left sm:text-right shrink-0">
              <span className="text-[10px] uppercase tracking-wider text-[#8A8A84] block font-semibold mb-1">
                Identified Exposure
              </span>
              <span className="text-3xl font-sans font-medium text-[#D96B4A] tracking-tight tnum">
                {formatCompactINR(totalExposure)}
              </span>
            </div>
          </div>
        }
      />

      {/* Filter Tabs & Search Controls */}
      <div className="p-4 sm:p-5 rounded-[24px] bg-white border border-[#E8E8E3] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`h-9 px-4 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                activeFilter === f
                  ? 'bg-[#0A0A0A] text-white shadow-sm font-semibold'
                  : 'bg-[#FAFAF8] text-[#5E5E5A] hover:text-[#111111] hover:bg-[#F5F5F2] border border-[#E8E8E3]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-[#8A8A84] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search supplier, product, PO..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-4 rounded-full bg-[#FAFAF8] border border-[#E8E8E3] text-xs font-sans text-[#111111] placeholder-[#8A8A84] focus:outline-none focus:border-[#111111] transition-colors"
          />
        </div>
      </div>

      {/* Table with strict alignment and clean fallbacks */}
      <div className="bg-white rounded-[24px] border border-[#E8E8E3] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1020px]">
            <thead>
              <tr className="border-b border-[#F0F0EB] bg-[#FAFAF8]/90 text-[11px] font-sans font-semibold uppercase tracking-wider text-[#8A8A84] h-12">
                <th className="px-6 text-left">Transaction</th>
                <th className="px-4 text-left">Type</th>
                <th className="px-5 text-left">Supplier</th>
                <th className="px-5 text-left">Product</th>
                <th className="px-4 text-right">Quantity</th>
                <th className="px-4 text-right">Actual</th>
                <th className="px-4 text-right">Benchmark</th>
                <th className="px-4 text-right">Expected</th>
                <th className="px-4 text-right">Variance</th>
                <th className="px-5 text-right">Leakage</th>
                <th className="px-4 text-center">Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F0EB] text-xs font-sans">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-[#8A8A84]">
                    No procurement findings match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredData.map((row, idx) => {
                  const txId = row.transaction_id || row.id || `TX-${idx + 1}`;
                  const supp = row.supplier || 'Not available';
                  const prod = row.product || row.product_name || 'Not available';
                  const qty = row.quantity !== undefined && row.quantity !== null ? row.quantity : '—';
                  const actual = row.actual_price !== undefined && row.actual_price !== null ? formatINR(row.actual_price) : '—';
                  const bench = row.benchmark_price !== undefined && row.benchmark_price !== null ? formatINR(row.benchmark_price) : '—';
                  const expected = row.expected_price !== undefined && row.expected_price !== null ? formatINR(row.expected_price) : bench;
                  const variance = row.variance_percent !== undefined && row.variance_percent !== null ? `+${row.variance_percent.toFixed(2)}%` : '—';
                  const leakage = Number(row.potential_leakage || row.amount || 0);
                  const isSelected = selectedFinding && (selectedFinding.transaction_id === row.transaction_id || selectedFinding.id === row.id);

                  return (
                    <tr
                      key={row.id || `${txId}-${idx}`}
                      onClick={() => setSelectedFinding(row)}
                      className={`h-14 hover:bg-[#FAFAF8] cursor-pointer transition-colors ${
                        isSelected ? 'bg-[#FAFAF8]' : ''
                      }`}
                    >
                      <td className="px-6 font-mono font-medium text-[#111111]">
                        {txId}
                      </td>
                      <td className="px-4 font-mono text-[11px] text-[#5E5E5A] whitespace-nowrap">
                        {row.type ? row.type.replace(/_/g, ' ') : 'Price Anomaly'}
                      </td>
                      <td className="px-5 font-medium text-[#111111] max-w-[160px] truncate" title={supp}>
                        {supp}
                      </td>
                      <td className="px-5 text-[#5E5E5A] max-w-[180px] truncate" title={prod}>
                        {prod}
                      </td>
                      <td className="px-4 font-mono text-right text-[#5E5E5A] tnum">
                        {qty}
                      </td>
                      <td className="px-4 font-mono text-right font-medium text-[#111111] tnum">
                        {actual}
                      </td>
                      <td className="px-4 font-mono text-right text-[#8A8A84] tnum">
                        {bench}
                      </td>
                      <td className="px-4 font-mono text-right text-[#8A8A84] tnum">
                        {expected}
                      </td>
                      <td className="px-4 font-mono text-right font-medium text-[#D96B4A] tnum">
                        {variance}
                      </td>
                      <td className="px-5 font-mono text-right font-medium text-[#111111] tnum">
                        {leakage > 0 ? formatINR(leakage) : '—'}
                      </td>
                      <td className="px-4 text-center">
                        <Badge variant={String(row.risk || 'MEDIUM').toLowerCase() === 'high' ? 'high' : String(row.risk || '').toLowerCase() === 'medium' ? 'medium' : 'low'}>
                          {row.risk || 'MEDIUM'}
                        </Badge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Transaction Finding Detail & Evidence Ledger (Part 12) */}
      {selectedFinding && (
        <div className="bg-white rounded-[24px] border border-[#E8E8E3] p-6 lg:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#F0F0EB] gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] uppercase font-semibold tracking-wider text-[#73C69A]">
                  Forensic Finding Detail
                </span>
                <span className="text-[#DCDCD7]">·</span>
                <span className="text-xs font-mono text-[#8A8A84]">
                  {selectedFinding.type ? selectedFinding.type.replace(/_/g, ' ') : 'PRICE ANOMALY'}
                </span>
              </div>
              <h3 className="text-2xl font-sans font-medium text-[#111111]">
                {selectedFinding.transaction_id || selectedFinding.id} · {selectedFinding.product || selectedFinding.product_name || 'Item'}
              </h3>
              <p className="text-xs text-[#5E5E5A] mt-1">
                Supplier: <strong className="text-[#111111]">{selectedFinding.supplier || 'Not available'}</strong>
                {selectedFinding.quantity && (
                  <>
                    <span className="mx-2 text-[#DCDCD7]">·</span>
                    <span>{selectedFinding.quantity} units</span>
                  </>
                )}
              </p>
            </div>

            <Button
              variant="dark-primary"
              size="md"
              icon={<Sparkles className="w-3.5 h-3.5 text-[#73C69A]" />}
              onClick={() => {
                onInvestigateFinding(selectedFinding.transaction_id || selectedFinding.id || 'TX10013');
                onNavigate('investigation');
              }}
            >
              Investigate in AI Studio
            </Button>
          </div>

          {/* Key Metric Blocks */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-[#FAFAF8] border border-[#E8E8E3]">
              <span className="text-[10px] uppercase font-semibold text-[#8A8A84] block mb-2">Actual Price</span>
              <span className="text-xl font-sans font-medium text-[#111111] tnum">
                {selectedFinding.actual_price ? formatINR(selectedFinding.actual_price) : '—'}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-[#FAFAF8] border border-[#E8E8E3]">
              <span className="text-[10px] uppercase font-semibold text-[#8A8A84] block mb-2">Benchmark</span>
              <span className="text-xl font-sans font-medium text-[#111111] tnum">
                {selectedFinding.benchmark_price ? formatINR(selectedFinding.benchmark_price) : '—'}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-[#FAFAF8] border border-[#E8E8E3]">
              <span className="text-[10px] uppercase font-semibold text-[#8A8A84] block mb-2">Variance</span>
              <span className="text-xl font-sans font-medium text-[#D96B4A] tnum">
                {selectedFinding.variance_percent !== undefined ? `+${selectedFinding.variance_percent.toFixed(2)}%` : '—'}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-[#FAFAF8] border border-[#E8E8E3]">
              <span className="text-[10px] uppercase font-semibold text-[#8A8A84] block mb-2">Potential Leakage</span>
              <span className="text-xl font-sans font-medium text-[#111111] tnum">
                {selectedFinding.potential_leakage || selectedFinding.amount ? formatINR(selectedFinding.potential_leakage || selectedFinding.amount) : '—'}
              </span>
            </div>
          </div>

          {/* Evidence Ledger Section (Part 12) */}
          <div className="space-y-3 pt-2">
            <span className="text-[11px] uppercase font-semibold tracking-wider text-[#111111] block">
              EVIDENCE LEDGER
            </span>

            {selectedFinding.evidence && selectedFinding.evidence.length > 0 ? (
              <div className="space-y-2">
                {selectedFinding.evidence.map((item: any, i: number) => {
                  const text = typeof item === 'string' ? item : item.description || item.title || JSON.stringify(item);
                  return (
                    <div
                      key={i}
                      className="p-3.5 rounded-xl bg-[#FAFAF8] border border-[#E8E8E3] text-xs text-[#111111] flex items-start gap-3"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-[#73C69A] mt-1.5 shrink-0" />
                      <span className="leading-relaxed">{text}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[#FAFAF8] border border-[#E8E8E3] text-xs text-[#5E5E5A]">
                {selectedFinding.reason || 'Verified price variance against approved master rate card baseline.'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
