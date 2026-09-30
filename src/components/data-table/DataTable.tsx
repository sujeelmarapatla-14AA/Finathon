import React, { useState } from 'react';
import { Search, Download, ArrowUpRight, ArrowRight, X } from 'lucide-react';
import { MOCK_TRANSACTIONS } from '../../data/mockData';
import { Transaction } from '../../types';

interface DataTableProps {
  onInvestigateTransaction?: (poNumber: string) => void;
}

export const DataTable: React.FC<DataTableProps> = ({
  onInvestigateTransaction,
}) => {
  const [filterType, setFilterType] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const filterTabs = [
    'All',
    'High Risk',
    'Price Anomaly',
    'Duplicate',
    'Discount',
    'Office Supplies',
    'IT Hardware',
  ];

  const filteredData = MOCK_TRANSACTIONS.filter((tx) => {
    if (filterType === 'High Risk' && tx.status !== 'HIGH' && tx.status !== 'CRITICAL') return false;
    if (filterType === 'Price Anomaly' && tx.type !== 'Price Anomalies') return false;
    if (filterType === 'Duplicate' && tx.type !== 'Duplicate Purchases') return false;
    if (filterType === 'Discount' && tx.type !== 'Missed Discounts') return false;
    if (filterType === 'Office Supplies' && tx.category !== 'Office Supplies') return false;
    if (filterType === 'IT Hardware' && tx.category !== 'IT Hardware') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        tx.id.toLowerCase().includes(q) ||
        tx.supplier.toLowerCase().includes(q) ||
        tx.product.toLowerCase().includes(q) ||
        tx.poNumber.toLowerCase().includes(q)
      );
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-border-default pb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-sans font-semibold tracking-micro text-brand-forest-bright block mb-2">
            TRANSACTION AUDIT REPOSITORY
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-text-primary font-normal tracking-tight">
            Transactions
          </h1>
          <p className="mt-3 text-sm sm:text-base text-text-secondary font-sans max-w-2xl leading-relaxed">
            Granular line-item reconciliation showing unit price variance against contractual rate cards and historical peer purchases.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              const csvContent = "data:text/csv;charset=utf-8," + 
                "Transaction,Date,Supplier,Product,Quantity,UnitPrice,Benchmark,Variance,Leakage,Status\n" +
                MOCK_TRANSACTIONS.map(e => `${e.id},${e.date},${e.supplier},"${e.product}",${e.quantity},${e.unitPrice},${e.benchmarkPrice},${e.variancePct}%,${e.leakageAmount},${e.status}`).join("\n");
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement("a");
              link.setAttribute("href", encodedUri);
              link.setAttribute("download", "leakguard_procurement_transactions.csv");
              document.body.appendChild(link);
              link.click();
            }}
            className="h-9 px-4 rounded-[8px] text-xs font-sans font-medium text-text-primary bg-dark-secondary hover:bg-dark-elevated border border-border-default transition-colors flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="p-4 rounded-[12px] bg-dark-bg border border-border-default flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {filterTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterType(tab)}
              className={`px-3 py-1.5 rounded-[6px] text-xs font-sans whitespace-nowrap transition-colors ${
                filterType === tab
                  ? 'bg-brand-forest/20 text-brand-forest-bright font-medium border border-brand-forest/40'
                  : 'text-text-muted hover:text-text-primary hover:bg-dark-elevated'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative shrink-0 w-full md:w-64">
          <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search TX, supplier, PO..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-xs rounded-[8px] bg-dark-secondary border border-border-default text-text-primary focus:outline-none focus:border-brand-forest font-sans"
          />
        </div>
      </div>

      {/* Table */}
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
                <th className="py-3 px-6 font-medium text-right">Unit Price</th>
                <th className="py-3 px-6 font-medium text-right">Benchmark</th>
                <th className="py-3 px-6 font-medium text-right">Variance</th>
                <th className="py-3 px-6 font-medium text-right">Leakage</th>
                <th className="py-3 px-6 font-medium text-center">Status</th>
                <th className="py-3 px-6 font-medium text-center">Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-xs font-sans text-text-primary">
              {filteredData.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => setSelectedTx(row)}
                  className="hover:bg-dark-elevated cursor-pointer transition-colors group"
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
                  <td className="py-3.5 px-6 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTx(row);
                      }}
                      className="p-1 rounded text-text-muted hover:text-brand-forest-bright transition-colors"
                      title="Inspect"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-3.5 bg-dark-secondary/40 border-t border-border-subtle flex items-center justify-between text-xs text-text-muted">
          <span>Showing {filteredData.length} of {MOCK_TRANSACTIONS.length} audited transactions</span>
          <span className="font-mono text-[11px]">Ledger hash verified</span>
        </div>
      </div>

      {/* Slide-over Transaction Detail Drawer */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedTx(null)}
          />
          <div className="relative z-10 w-full max-w-md bg-dark-elevated h-full border-l border-border-default shadow-modal p-6 overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
              <div>
                <span className="text-[10px] uppercase font-sans font-semibold tracking-micro text-text-muted block mb-1">
                  TRANSACTION DOSSIER
                </span>
                <h3 className="font-serif text-2xl text-text-primary font-normal">
                  {selectedTx.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                className="p-1.5 rounded text-text-muted hover:text-text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-[10px] uppercase tracking-wide text-text-muted font-sans block mb-1">
                  Product / Service
                </span>
                <p className="font-serif text-lg text-text-primary">{selectedTx.product}</p>
                <p className="text-xs text-text-muted mt-0.5">{selectedTx.category} · {selectedTx.department}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 rounded-[8px] bg-dark-secondary border border-border-subtle">
                <div>
                  <span className="text-[10px] uppercase font-sans text-text-muted block">Invoiced Price</span>
                  <span className="font-serif text-xl font-normal text-text-primary tnum">₹{selectedTx.unitPrice.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-sans text-text-muted block">Contract Benchmark</span>
                  <span className="font-serif text-xl font-normal text-brand-forest-bright tnum">₹{selectedTx.benchmarkPrice.toLocaleString()}</span>
                </div>
                <div className="pt-2 border-t border-border-subtle">
                  <span className="text-[10px] uppercase font-sans text-text-muted block">Volume</span>
                  <span className="font-mono text-sm text-text-primary tnum">{selectedTx.quantity} Units</span>
                </div>
                <div className="pt-2 border-t border-border-subtle">
                  <span className="text-[10px] uppercase font-sans text-text-muted block">Variance</span>
                  <span className="font-mono text-sm text-brand-terracotta tnum font-semibold">+{selectedTx.variancePct}%</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase tracking-wide text-text-muted font-sans block mb-1">
                  Supplier & Agreement
                </span>
                <p className="text-sm font-medium text-text-primary">{selectedTx.supplier}</p>
                <p className="text-xs text-text-muted">Purchase Order: {selectedTx.poNumber}</p>
                <p className="text-xs text-text-muted">Invoice Status: {selectedTx.invoiceStatus}</p>
              </div>

              <div>
                <span className="text-[10px] uppercase tracking-wide text-text-muted font-sans block mb-1">
                  Calculated Leakage
                </span>
                <div className="p-3.5 rounded-[8px] bg-brand-terracotta/10 border border-brand-terracotta/30 flex justify-between items-center">
                  <span className="text-xs font-sans text-brand-terracotta">Potential Avoidable Exposure</span>
                  <span className="font-serif text-2xl text-brand-terracotta font-normal tnum">
                    ₹{selectedTx.leakageAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-border-subtle">
              <button
                onClick={() => {
                  setSelectedTx(null);
                  if (onInvestigateTransaction) onInvestigateTransaction(selectedTx.poNumber);
                }}
                className="w-full h-10 rounded-[8px] flex items-center justify-center gap-2 text-xs font-sans font-semibold uppercase tracking-wider bg-brand-forest hover:bg-brand-forest-bright text-brand-cream transition-colors shadow-fine"
              >
                <span>Launch AI Investigation</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
