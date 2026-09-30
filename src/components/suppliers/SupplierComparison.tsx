import React, { useState } from 'react';
import { Search, Filter, ArrowRight, ShieldCheck, ChevronRight, X } from 'lucide-react';
import { MOCK_SUPPLIERS } from '../../data/mockData';
import { SupplierMetric } from '../../types';

export const SupplierComparison: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [riskFilter, setRiskFilter] = useState('All');
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierMetric | null>(MOCK_SUPPLIERS[0]);

  const categories = ['All', 'Office & Admin Consumables', 'Enterprise Hardware & Peripherals', 'IT Hardware & Workstations', 'Corporate Facilities & Furnishings', 'Domestic & Regional Freight'];
  const risks = ['All', 'HIGH', 'MEDIUM', 'LOW'];

  const filteredSuppliers = MOCK_SUPPLIERS.filter((s) => {
    if (categoryFilter !== 'All' && s.category !== categoryFilter) return false;
    if (riskFilter !== 'All' && s.risk !== riskFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Page Header (Section 18) */}
      <div className="border-b border-border-default pb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-sans font-semibold tracking-micro text-brand-forest-bright block mb-2">
            06 / SUPPLIER BENCHMARKING
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-text-primary font-normal tracking-tight">
            Supplier Intelligence
          </h1>
          <p className="mt-3 text-sm sm:text-base text-text-secondary font-sans max-w-2xl leading-relaxed">
            Reconcile vendor pricing integrity, delivery reliability SLAs, and leakage exposure.
          </p>
        </div>

        <span className="text-xs font-mono text-text-muted">
          428 Master Accounts Audited
        </span>
      </div>

      {/* Top Filter Bar (Section 18: Supplier search, Category filter, Risk filter) */}
      <div className="p-4 rounded-[12px] bg-dark-bg border border-border-default flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search supplier name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-xs rounded-[8px] bg-dark-secondary border border-border-default text-text-primary focus:outline-none focus:border-brand-forest font-sans"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-sans text-text-muted">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-9 px-2.5 text-xs rounded-[8px] bg-dark-secondary border border-border-default text-text-primary focus:outline-none focus:border-brand-forest font-sans"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-sans text-text-muted">Risk:</span>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="h-9 px-2.5 text-xs rounded-[8px] bg-dark-secondary border border-border-default text-text-primary focus:outline-none focus:border-brand-forest font-sans"
            >
              {risks.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Supplier Comparison Table (Section 18: SUPPLIER | PRICE | DELIVERY | QUALITY | SPEND | RISK) */}
      <div className="border border-border-default rounded-[12px] bg-dark-bg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-subtle text-[11px] font-sans uppercase tracking-wider text-text-muted bg-dark-secondary/60">
                <th className="py-3 px-6 font-medium">SUPPLIER</th>
                <th className="py-3 px-6 font-medium text-right">PRICE</th>
                <th className="py-3 px-6 font-medium text-right">DELIVERY</th>
                <th className="py-3 px-6 font-medium text-right">QUALITY</th>
                <th className="py-3 px-6 font-medium text-right">SPEND</th>
                <th className="py-3 px-6 font-medium text-center">RISK</th>
                <th className="py-3 px-6 font-medium text-center">INSPECT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-xs font-sans text-text-primary">
              {filteredSuppliers.map((sup) => (
                <tr
                  key={sup.id}
                  onClick={() => setSelectedSupplier(sup)}
                  className={`hover:bg-dark-elevated cursor-pointer transition-colors ${
                    selectedSupplier?.id === sup.id ? 'bg-dark-elevated/70' : ''
                  }`}
                >
                  <td className="py-3.5 px-6">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-text-primary">
                        {sup.name}
                      </span>
                      {sup.preferredStatus && (
                        <span className="text-[9px] font-sans font-semibold uppercase tracking-wider px-1.5 py-0.2 rounded bg-brand-forest/20 text-brand-forest-bright border border-brand-forest/30">
                          Preferred
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-text-muted">{sup.code} · {sup.category}</span>
                  </td>

                  <td className="py-3.5 px-6 text-right font-serif text-text-primary tnum">
                    ₹{sup.avgUnitPrice.toLocaleString()}
                  </td>

                  <td className="py-3.5 px-6 text-right font-mono tnum text-text-secondary">
                    {sup.deliveryReliability}%
                  </td>

                  <td className="py-3.5 px-6 text-right font-mono tnum text-text-secondary">
                    {sup.qualityScore}%
                  </td>

                  <td className="py-3.5 px-6 text-right font-serif text-text-primary tnum">
                    ₹{(sup.totalSpend / 10000000).toFixed(2)} Cr
                  </td>

                  <td className="py-3.5 px-6 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-[4px] text-[10px] font-sans font-semibold uppercase tracking-wider ${
                      sup.risk === 'HIGH'
                        ? 'bg-brand-terracotta/20 text-brand-terracotta border border-brand-terracotta/30'
                        : sup.risk === 'MEDIUM'
                        ? 'bg-brand-gold/20 text-brand-gold border border-brand-gold/30'
                        : 'bg-brand-forest/20 text-brand-forest-bright border border-brand-forest/30'
                    }`}>
                      {sup.risk}
                    </span>
                  </td>

                  <td className="py-3.5 px-6 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSupplier(sup);
                      }}
                      className="text-xs text-brand-forest-bright hover:underline font-medium"
                    >
                      Detail →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Supplier Detail View (Section 19: Hero, Stats, Charts) */}
      {selectedSupplier && (
        <div className="border border-border-default rounded-[12px] p-6 sm:p-8 bg-transparent space-y-6 animate-in fade-in duration-200">
          {/* Hero */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-border-subtle gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h3 className="font-serif text-3xl text-text-primary font-normal">
                  {selectedSupplier.name}
                </h3>
                <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-sans font-semibold uppercase tracking-wider ${
                  selectedSupplier.risk === 'HIGH'
                    ? 'bg-brand-terracotta/20 text-brand-terracotta border border-brand-terracotta/30'
                    : selectedSupplier.risk === 'MEDIUM'
                    ? 'bg-brand-gold/20 text-brand-gold border border-brand-gold/30'
                    : 'bg-brand-forest/20 text-brand-forest-bright border border-brand-forest/30'
                }`}>
                  {selectedSupplier.risk} RISK
                </span>
              </div>
              <p className="text-xs text-text-muted font-sans">
                Supplier ID: <span className="font-mono text-text-secondary">{selectedSupplier.code}</span> · Contract: {selectedSupplier.contractExpiry}
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[10px] uppercase tracking-micro text-text-muted block">Leakage Exposure</span>
              <span className="font-serif text-2xl text-brand-terracotta tnum">
                {selectedSupplier.leakageExposure > 0 ? `₹${(selectedSupplier.leakageExposure / 100000).toFixed(2)}L` : '₹0 (Clean)'}
              </span>
            </div>
          </div>

          {/* Stats: Total Spend, Transactions, Average Delivery, Quality (Section 19) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-border-subtle">
            <div className="pt-2 sm:pt-0 sm:px-3 first:pl-0">
              <span className="text-[10px] uppercase font-sans font-semibold tracking-micro text-text-muted block mb-1">
                Total Spend
              </span>
              <span className="font-serif text-2xl text-text-primary tnum">
                ₹{(selectedSupplier.totalSpend / 10000000).toFixed(1)} Cr
              </span>
            </div>

            <div className="pt-2 sm:pt-0 sm:px-3">
              <span className="text-[10px] uppercase font-sans font-semibold tracking-micro text-text-muted block mb-1">
                Transactions
              </span>
              <span className="font-serif text-2xl text-text-primary tnum">
                {selectedSupplier.historicalPurchases * 8 + 68}
              </span>
            </div>

            <div className="pt-2 sm:pt-0 sm:px-3">
              <span className="text-[10px] uppercase font-sans font-semibold tracking-micro text-text-muted block mb-1">
                Average Delivery
              </span>
              <span className="font-serif text-2xl text-brand-forest-bright tnum">
                {selectedSupplier.deliveryReliability}%
              </span>
            </div>

            <div className="pt-2 sm:pt-0 sm:px-3">
              <span className="text-[10px] uppercase font-sans font-semibold tracking-micro text-text-muted block mb-1">
                Quality Performance
              </span>
              <span className="font-serif text-2xl text-brand-forest-bright tnum">
                {selectedSupplier.qualityScore}%
              </span>
            </div>
          </div>

          {/* Section 19: PRICE HISTORY, DELIVERY PERFORMANCE, QUALITY TREND, CONTRACT COMPLIANCE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-border-subtle">
            {/* PRICE HISTORY */}
            <div className="p-4 rounded-[8px] bg-dark-secondary border border-border-subtle space-y-2">
              <span className="text-[10px] uppercase font-sans font-semibold tracking-micro text-text-muted block">
                PRICE HISTORY
              </span>
              <p className="font-serif text-lg text-text-primary tnum">₹{selectedSupplier.avgUnitPrice.toLocaleString()}</p>
              <p className="text-[11px] text-text-muted">
                {selectedSupplier.benchmarkDelta > 0 ? `+${selectedSupplier.benchmarkDelta}% drift vs baseline` : `${selectedSupplier.benchmarkDelta}% under baseline`}
              </p>
            </div>

            {/* DELIVERY PERFORMANCE */}
            <div className="p-4 rounded-[8px] bg-dark-secondary border border-border-subtle space-y-2">
              <span className="text-[10px] uppercase font-sans font-semibold tracking-micro text-text-muted block">
                DELIVERY PERFORMANCE
              </span>
              <p className="font-serif text-lg text-brand-forest-bright tnum">{selectedSupplier.deliveryReliability}% on-time</p>
              <p className="text-[11px] text-text-muted">Average fulfillment window: 4.2 days</p>
            </div>

            {/* QUALITY TREND */}
            <div className="p-4 rounded-[8px] bg-dark-secondary border border-border-subtle space-y-2">
              <span className="text-[10px] uppercase font-sans font-semibold tracking-micro text-text-muted block">
                QUALITY TREND
              </span>
              <p className="font-serif text-lg text-brand-forest-bright tnum">{selectedSupplier.qualityScore}% acceptance</p>
              <p className="text-[11px] text-text-muted">Defect rate: &lt; 0.4% across PO line-items</p>
            </div>

            {/* CONTRACT COMPLIANCE */}
            <div className="p-4 rounded-[8px] bg-dark-secondary border border-border-subtle space-y-2">
              <span className="text-[10px] uppercase font-sans font-semibold tracking-micro text-text-muted block">
                CONTRACT COMPLIANCE
              </span>
              <p className="font-serif text-lg text-text-primary">{selectedSupplier.preferredStatus ? 'Master SLA Active' : 'Off-Contract Spot'}</p>
              <p className="text-[11px] text-text-muted">Expiry: {selectedSupplier.contractExpiry}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
