import React, { useState, useEffect } from 'react';
import { Search, ChevronRight, X, Building2, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { DataSource, ApiSupplierItem } from '../../types';
import { fetchSuppliersData, DEMO_FILE_ID } from '../../services/api';
import { formatCompactINR, formatINR } from '../../utils/formatters';
import { PageHeader } from '../common/PageHeader';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

interface SupplierComparisonProps {
  source?: DataSource;
  fileId?: string;
  suppliers?: ApiSupplierItem[] | null;
}

export const SupplierComparison: React.FC<SupplierComparisonProps> = ({
  source = 'demo',
  fileId = DEMO_FILE_ID,
  suppliers: propSuppliers,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('All');
  const [suppliersList, setSuppliersList] = useState<ApiSupplierItem[]>(propSuppliers || []);
  const [selectedSupplier, setSelectedSupplier] = useState<ApiSupplierItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    if (propSuppliers && propSuppliers.length > 0) {
      setSuppliersList(propSuppliers);
      setSelectedSupplier(propSuppliers[0]);
      return;
    }

    async function loadSuppliers() {
      setLoading(true);
      try {
        const res = await fetchSuppliersData(source, fileId);
        if (!isCancelled && res.suppliers) {
          setSuppliersList(res.suppliers);
          if (res.suppliers.length > 0) {
            setSelectedSupplier(res.suppliers[0]);
          }
        }
      } catch (err) {
        console.warn('Suppliers fetch notice:', err);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    loadSuppliers();
    return () => {
      isCancelled = true;
    };
  }, [source, fileId, propSuppliers]);

  const filtered = suppliersList.filter((s) => {
    if (riskFilter !== 'All' && String(s.risk).toUpperCase() !== riskFilter.toUpperCase()) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = String(s.supplier || s.normalized_supplier || '').toLowerCase();
      return name.includes(q);
    }
    return true;
  });

  const activeDetail = selectedSupplier || suppliersList[0];

  return (
    <div className="space-y-8">
      {/* 1. Header */}
      <PageHeader
        label="Supplier Benchmarking"
        title="Know your suppliers."
        description="Evaluate vendor pricing discipline, delivery reliability SLAs, and leakage concentration across active contracts."
        actions={
          <span className="text-xs font-mono text-[#8A8A84] bg-white px-3.5 py-1.5 rounded-full border border-[#E8E8E3] shrink-0">
            {suppliersList.length} Active Vendors
          </span>
        }
      />

      {/* 2. Search & Filters Bar */}
      <div className="p-4 sm:p-5 rounded-[24px] bg-white border border-[#E8E8E3] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#8A8A84] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search supplier name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-full bg-[#FAFAF8] border border-[#E8E8E3] text-xs font-sans text-[#111111] placeholder-[#8A8A84] focus:outline-none focus:border-[#111111] transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#8A8A84] font-medium">Risk:</span>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="h-10 px-4 text-xs rounded-full bg-[#FAFAF8] border border-[#E8E8E3] text-[#111111] focus:outline-none focus:border-[#111111] transition-colors"
            >
              <option value="All">All Risks</option>
              <option value="HIGH">High Risk</option>
              <option value="MEDIUM">Medium Risk</option>
              <option value="LOW">Low Risk</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Supplier Comparison Table */}
      <div className="bg-white rounded-[24px] border border-[#E8E8E3] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[960px]">
            <thead>
              <tr className="border-b border-[#F0F0EB] bg-[#FAFAF8]/90 text-[11px] font-sans font-semibold uppercase tracking-wider text-[#8A8A84] h-12">
                <th className="px-6 text-left">Supplier</th>
                <th className="px-5 text-right">Average Price</th>
                <th className="px-5 text-right">Quantity</th>
                <th className="px-5 text-right">Spend</th>
                <th className="px-5 text-right">Potential Leakage</th>
                <th className="px-4 text-center">Risk</th>
                <th className="px-6 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F0EB] text-xs font-sans">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#8A8A84]">
                    No supplier records match the selected filter.
                  </td>
                </tr>
              ) : (
                filtered.map((s, idx) => (
                  <tr
                    key={s.supplier || idx}
                    onClick={() => {
                      setSelectedSupplier(s);
                      setIsDetailOpen(true);
                    }}
                    className="h-14 hover:bg-[#FAFAF8] transition-colors cursor-pointer group"
                  >
                    <td className="px-6">
                      <div className="font-medium text-[#111111] text-sm">
                        {s.supplier}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#8A8A84] mt-0.5">
                        <span className="font-mono">
                          {s.normalized_supplier && s.normalized_supplier !== s.supplier ? `Normalized: ${s.normalized_supplier}` : 'Verified Entity'}
                        </span>
                        <span>·</span>
                        <span>{s.transaction_count} orders</span>
                      </div>
                    </td>

                    <td className="px-5 text-right font-mono font-medium text-[#111111] tnum">
                      {s.average_unit_price ? formatINR(s.average_unit_price) : '—'}
                    </td>

                    <td className="px-5 text-right font-mono text-[#5E5E5A] tnum">
                      {s.total_quantity?.toLocaleString('en-IN') || '—'}
                    </td>

                    <td className="px-5 text-right font-mono font-medium text-[#111111] tnum">
                      {formatCompactINR(s.total_spend || 0)}
                    </td>

                    <td className="px-5 text-right font-mono font-medium text-[#D96B4A] tnum">
                      {s.potential_leakage > 0 ? formatINR(s.potential_leakage) : '—'}
                    </td>

                    <td className="px-4 text-center">
                      <Badge variant={String(s.risk).toLowerCase() === 'high' ? 'high' : String(s.risk).toLowerCase() === 'medium' ? 'medium' : 'low'}>
                        {s.risk || 'LOW'}
                      </Badge>
                    </td>

                    <td className="px-6 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSupplier(s);
                          setIsDetailOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-medium bg-[#FAFAF8] group-hover:bg-[#0A0A0A] border border-[#E8E8E3] group-hover:border-[#0A0A0A] text-[#111111] group-hover:text-white transition-all"
                      >
                        <span>Inspect</span>
                        <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. SUPPLIER DETAIL MODAL */}
      {isDetailOpen && activeDetail && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] border border-[#E8E8E3] max-w-2xl w-full p-6 lg:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              onClick={() => setIsDetailOpen(false)}
              className="absolute right-6 top-6 w-9 h-9 rounded-full bg-[#FAFAF8] border border-[#E8E8E3] flex items-center justify-center text-[#5E5E5A] hover:text-[#111111] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Supplier Hero */}
            <div className="space-y-2 pb-6 border-b border-[#F0F0EB]">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-[#8A8A84] uppercase">
                  {activeDetail.normalized_supplier ? `Normalized: ${activeDetail.normalized_supplier}` : 'VENDOR DOSSIER'}
                </span>
                <Badge variant={String(activeDetail.risk).toLowerCase() === 'high' ? 'high' : String(activeDetail.risk).toLowerCase() === 'medium' ? 'medium' : 'low'}>
                  {activeDetail.risk || 'MEDIUM'}
                </Badge>
              </div>
              <h2 className="text-3xl font-sans font-medium text-[#111111] tracking-tight">
                {activeDetail.supplier}
              </h2>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-[#FAFAF8] border border-[#E8E8E3]">
                <span className="text-[10px] uppercase font-semibold text-[#8A8A84] block mb-2">
                  TOTAL SPEND
                </span>
                <span className="text-xl font-sans font-medium text-[#111111] tnum">
                  {formatCompactINR(activeDetail.total_spend || 0)}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAFAF8] border border-[#E8E8E3]">
                <span className="text-[10px] uppercase font-semibold text-[#8A8A84] block mb-2">
                  TRANSACTIONS
                </span>
                <span className="text-xl font-sans font-medium text-[#111111] tnum">
                  {(activeDetail.transaction_count || 0).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAFAF8] border border-[#E8E8E3]">
                <span className="text-[10px] uppercase font-semibold text-[#8A8A84] block mb-2">
                  AVG UNIT PRICE
                </span>
                <span className="text-xl font-sans font-medium text-[#111111] tnum">
                  {activeDetail.average_unit_price ? formatINR(activeDetail.average_unit_price) : '—'}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAFAF8] border border-[#E8E8E3]">
                <span className="text-[10px] uppercase font-semibold text-[#D96B4A] block mb-2">
                  LEAKAGE
                </span>
                <span className="text-xl font-sans font-medium text-[#D96B4A] tnum">
                  {activeDetail.potential_leakage ? formatINR(activeDetail.potential_leakage) : '₹0'}
                </span>
              </div>
            </div>

            {/* Products Supplied */}
            {activeDetail.products_supplied && activeDetail.products_supplied.length > 0 && (
              <div className="space-y-3 pt-2">
                <span className="text-xs uppercase font-semibold tracking-wider text-[#8A8A84] block">
                  Commodities Procured
                </span>
                <div className="flex flex-wrap gap-2">
                  {activeDetail.products_supplied.map((prod, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 rounded-full bg-[#FAFAF8] border border-[#E8E8E3] text-xs font-medium text-[#111111]"
                    >
                      {prod}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Analytical Dimensions */}
            <div className="space-y-3 pt-2">
              <span className="text-xs uppercase font-semibold tracking-wider text-[#8A8A84] block">
                Commercial Audit Dimensions
              </span>

              <div className="divide-y divide-[#F0F0EB] border border-[#E8E8E3] rounded-2xl overflow-hidden">
                <div className="p-4 flex items-center justify-between text-xs bg-white">
                  <div>
                    <span className="font-semibold text-[#111111] block mb-0.5">PRICE ANOMALY EXPOSURE</span>
                    <span className="text-[#5E5E5A]">Transactions flagged with price deviations exceeding baseline tolerance</span>
                  </div>
                  <span className="font-mono text-[#D96B4A] font-medium tnum">
                    {activeDetail.anomaly_count || 0} flagged
                  </span>
                </div>

                <div className="p-4 flex items-center justify-between text-xs bg-white">
                  <div>
                    <span className="font-semibold text-[#111111] block mb-0.5">MISSED DISCOUNT VALUE</span>
                    <span className="text-[#5E5E5A]">Unclaimed early-payment or contractual volume discounts</span>
                  </div>
                  <span className="font-mono text-[#111111] font-medium tnum">
                    {activeDetail.missed_discount_amount ? formatINR(activeDetail.missed_discount_amount) : '₹0'}
                  </span>
                </div>

                <div className="p-4 flex items-center justify-between text-xs bg-white">
                  <div>
                    <span className="font-semibold text-[#111111] block mb-0.5">OFF-CONTRACT ORDERS</span>
                    <span className="text-[#5E5E5A]">Purchase orders issued without an active negotiated rate card</span>
                  </div>
                  <span className="font-mono text-[#111111] font-medium tnum">
                    {activeDetail.off_contract_count || 0} orders
                  </span>
                </div>

                <div className="p-4 flex items-center justify-between text-xs bg-white">
                  <div>
                    <span className="font-semibold text-[#111111] block mb-0.5">CONTRACT STATUS</span>
                    <span className="text-[#5E5E5A]">Master agreement or contracted vendor standing</span>
                  </div>
                  <span className={`font-mono font-medium ${activeDetail.contracted_supplier ? 'text-[#73C69A]' : 'text-[#8A8A84]'}`}>
                    {activeDetail.contracted_supplier ? 'Contracted Partner' : 'Spot Supplier'}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <Button
                variant="dark-primary"
                size="md"
                onClick={() => setIsDetailOpen(false)}
              >
                Close Inspector
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
