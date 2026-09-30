import React, { useState } from 'react';
import { Search, Download, ArrowUpRight, X, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { MOCK_TRANSACTIONS } from '../../data/mockData';
import { Transaction, TabType } from '../../types';

interface LeakageExplorerProps {
  onInvestigateFinding: (ref: string) => void;
  onNavigate: (tab: TabType) => void;
}

export const LeakageExplorer: React.FC<LeakageExplorerProps> = ({
  onInvestigateFinding,
  onNavigate,
}) => {
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(MOCK_TRANSACTIONS[0]); // defaults to TX-10293

  const filters = [
    'All',
    'Price Anomaly',
    'Missed Discount',
    'Duplicate',
    'Fragmentation',
    'Contract',
  ];

  const filteredData = MOCK_TRANSACTIONS.filter((tx) => {
    if (activeFilter === 'Price Anomaly' && tx.type !== 'Price Anomalies') return false;
    if (activeFilter === 'Missed Discount' && tx.type !== 'Missed Discounts') return false;
    if (activeFilter === 'Duplicate' && tx.type !== 'Duplicate Purchases') return false;
    if (activeFilter === 'Fragmentation' && tx.type !== 'Supplier Fragmentation') return false;
    if (activeFilter === 'Contract' && tx.type !== 'Contract Variance') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        tx.id.toLowerCase().includes(q) ||
        tx.supplier.toLowerCase().includes(q) ||
        tx.product.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Page Header (Section 13) */}
      <div className="border-b border-border-default pb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-sans font-semibold tracking-micro text-brand-forest-bright block mb-2">
            02 / FORENSIC TRACE
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-text-primary font-normal tracking-tight">
            LEAKAGE EXPLORER
          </h1>
          <p className="mt-3 text-sm sm:text-base text-text-secondary font-sans max-w-2xl leading-relaxed">
            Trace every finding back to the transaction.
          </p>
        </div>

        <div className="text-right">
          <span className="text-[10px] uppercase tracking-micro text-text-muted block">Identified Exposure</span>
          <span className="font-serif text-3xl text-brand-terracotta font-normal tnum">
            ₹31.6L
          </span>
        </div>
      </div>

      {/* Top Filter Bar (Section 13: Filters + Search) */}
      <div className="p-4 rounded-[12px] bg-dark-bg border border-border-default flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-3 py-1.5 rounded-[6px] text-xs font-sans whitespace-nowrap transition-colors ${
                activeFilter === f
                  ? 'bg-brand-forest/20 text-brand-forest-bright font-medium border border-brand-forest/40'
                  : 'text-text-muted hover:text-text-primary hover:bg-dark-elevated'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative shrink-0 w-full md:w-64">
          <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search supplier, product, transaction..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-xs rounded-[8px] bg-dark-secondary border border-border-default text-text-primary focus:outline-none focus:border-brand-forest font-sans"
          />
        </div>
      </div>

      {/* Section 13 Table: Transaction | Date | Supplier | Product | Qty | Actual | Benchmark | Variance | Leakage | Risk */}
      <div className="border border-border-default rounded-[12px] bg-dark-bg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-subtle text-[11px] font-sans uppercase tracking-wider text-text-muted bg-dark-secondary/60">
                <th className="py-3 px-6 font-medium">Transaction</th>
                <th className="py-3 px-6 font-medium">Date</th>
                <th className="py-3 px-6 font-medium">Supplier</th>
                <th className="py-3 px-6 font-medium">Product</th>
                <th className="py-3 px-6 font-medium text-right">Qty</th>
                <th className="py-3 px-6 font-medium text-right">Actual</th>
                <th className="py-3 px-6 font-medium text-right">Benchmark</th>
                <th className="py-3 px-6 font-medium text-right">Variance</th>
                <th className="py-3 px-6 font-medium text-right">Leakage</th>
                <th className="py-3 px-6 font-medium text-center">Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-xs font-sans text-text-primary">
              {filteredData.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => setSelectedTx(row)}
                  className={`hover:bg-dark-elevated cursor-pointer transition-colors ${
                    selectedTx?.id === row.id ? 'bg-dark-elevated/70' : ''
                  }`}
                >
                  <td className="py-3.5 px-6 font-mono font-medium text-text-primary group-hover:text-brand-forest-bright">
                    {row.id}
                  </td>
                  <td className="py-3.5 px-6 text-text-muted whitespace-nowrap">
                    {row.date}
                  </td>
                  <td className="py-3.5 px-6 font-medium whitespace-nowrap">
                    {row.supplier}
                  </td>
                  <td className="py-3.5 px-6 max-w-[200px] truncate text-text-secondary">
                    {row.product}
                  </td>
                  <td className="py-3.5 px-6 font-mono text-right tnum">
                    {row.quantity}
                  </td>
                  <td className="py-3.5 px-6 font-serif text-right text-text-primary tnum">
                    ₹{row.unitPrice.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-6 font-serif text-right text-text-muted tnum">
                    ₹{row.benchmarkPrice.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-6 font-mono text-right tnum">
                    <span className={row.variancePct > 0 ? 'text-brand-terracotta' : 'text-brand-forest-bright'}>
                      {row.variancePct > 0 ? `+${row.variancePct}%` : '0.0%'}
                    </span>
                  </td>
                  <td className="py-3.5 px-6 font-serif text-right font-normal text-brand-terracotta tnum">
                    {row.leakageAmount > 0 ? `₹${row.leakageAmount.toLocaleString()}` : '—'}
                  </td>
                  <td className="py-3.5 px-6 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-[4px] text-[10px] font-sans font-semibold uppercase tracking-wider ${
                      row.status === 'CRITICAL' || row.status === 'HIGH'
                        ? 'bg-brand-terracotta/20 text-brand-terracotta border border-brand-terracotta/30'
                        : row.status === 'MEDIUM'
                        ? 'bg-brand-gold/20 text-brand-gold border border-brand-gold/30'
                        : 'bg-brand-forest/20 text-brand-forest-bright border border-brand-forest/30'
                    }`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 14: TRANSACTION DETAIL (Two-Column Layout: LEFT Details | RIGHT Leakage Analysis & Evidence) */}
      {selectedTx && (
        <div className="border border-border-default rounded-[12px] p-6 sm:p-8 bg-transparent space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
            <div>
              <span className="text-[10px] uppercase font-sans font-semibold tracking-micro text-brand-forest-bright block mb-1">
                INSPECTING TRANSACTION
              </span>
              <h3 className="font-serif text-3xl text-text-primary font-normal">
                TRANSACTION {selectedTx.id}
              </h3>
              <p className="text-xs text-text-secondary mt-0.5">
                {selectedTx.product} · <strong className="text-text-primary">{selectedTx.supplier}</strong>
              </p>
            </div>

            <button
              onClick={() => {
                onInvestigateFinding(selectedTx.id === 'TX-10294' ? 'FINDING #027' : 'FINDING #014');
                onNavigate('investigation');
              }}
              className="h-9 px-4 rounded-[8px] text-xs font-sans font-semibold uppercase tracking-wider bg-brand-forest hover:bg-brand-forest-bright text-brand-cream transition-colors flex items-center gap-2"
            >
              <span>Launch AI Investigation</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* LEFT (5 Columns): Financial Summary (Section 14) */}
            <div className="lg:col-span-5 p-5 rounded-[8px] bg-dark-secondary border border-border-subtle space-y-4">
              <span className="text-[10px] uppercase font-sans font-semibold tracking-micro text-text-muted block">
                FINANCIAL SUMMARY
              </span>

              <div className="space-y-3 text-xs font-sans">
                <div className="flex justify-between items-center py-1 border-b border-border-subtle">
                  <span className="text-text-muted">Actual Unit Price:</span>
                  <span className="font-serif text-base text-text-primary tnum">₹{selectedTx.unitPrice.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-border-subtle">
                  <span className="text-text-muted">Benchmark Price:</span>
                  <span className="font-serif text-base text-brand-forest-bright tnum">₹{selectedTx.benchmarkPrice.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-border-subtle">
                  <span className="text-text-muted">Variance:</span>
                  <span className="font-mono text-sm text-brand-terracotta tnum font-semibold">+{selectedTx.variancePct}%</span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-border-subtle">
                  <span className="text-text-muted">Quantity:</span>
                  <span className="font-mono text-sm text-text-primary tnum">{selectedTx.quantity} Units</span>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-text-muted font-medium">Potential Leakage:</span>
                  <span className="font-serif text-2xl text-brand-terracotta tnum">
                    {selectedTx.leakageAmount > 0 ? `₹${selectedTx.leakageAmount.toLocaleString()}` : '₹0'}
                  </span>
                </div>
              </div>
            </div>

            {/* RIGHT (7 Columns): Evidence (Section 14: Historical purchase, Supplier comparison, Contract price, Comparable transactions) */}
            <div className="lg:col-span-7 p-5 rounded-[8px] bg-dark-secondary border border-border-subtle space-y-4">
              <span className="text-[10px] uppercase font-sans font-semibold tracking-micro text-brand-forest-bright block">
                EVIDENCE LEDGER
              </span>

              <div className="space-y-2.5 text-xs font-sans">
                {/* Historical purchase */}
                <div className="p-3 rounded bg-dark-elevated border border-border-subtle flex justify-between items-center">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-text-muted block">Historical Purchase</span>
                    <p className="font-medium text-text-primary mt-0.5">PO-2026-6110 · 24 May 2026</p>
                    <p className="text-[11px] text-text-muted">Source: Enterprise ERP Ledger · Peer Relationship</p>
                  </div>
                  <span className="font-serif text-sm font-medium text-brand-forest-bright tnum">₹{selectedTx.benchmarkPrice.toLocaleString()}</span>
                </div>

                {/* Supplier comparison */}
                <div className="p-3 rounded bg-dark-elevated border border-border-subtle flex justify-between items-center">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-text-muted block">Supplier Comparison</span>
                    <p className="font-medium text-text-primary mt-0.5">Metro Office / National OEM</p>
                    <p className="text-[11px] text-text-muted">Source: Contract Catalog · Active Preferred Tier</p>
                  </div>
                  <span className="font-serif text-sm font-medium text-brand-forest-bright tnum">-8.5% Delta</span>
                </div>

                {/* Contract price */}
                <div className="p-3 rounded bg-dark-elevated border border-border-subtle flex justify-between items-center">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-text-muted block">Contract Price</span>
                    <p className="font-medium text-text-primary mt-0.5">MSA-CAT-2024 (Clause 4.1)</p>
                    <p className="text-[11px] text-text-muted">Source: Master Service Agreement · Contract Index</p>
                  </div>
                  <span className="font-serif text-sm font-medium text-text-primary tnum">₹{selectedTx.benchmarkPrice.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
