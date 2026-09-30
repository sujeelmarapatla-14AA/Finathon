import React from 'react';
import { KPICard } from '../common/KPICard';
import { LeakageChart } from './LeakageChart';
import { PriorityFindings } from './PriorityFindings';
import { KPI_DATA, MOCK_TRANSACTIONS } from '../../data/mockData';
import { TabType } from '../../types';
import { ArrowUpRight, ArrowRight } from 'lucide-react';

interface ExecutiveDashboardProps {
  onInvestigate: (findingRef: string) => void;
  onNavigate: (tab: TabType) => void;
  onAnalyzeData?: () => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  onInvestigate,
  onNavigate,
  onAnalyzeData,
}) => {
  return (
    <div className="space-y-8">
      {/* 1. Page Header (Section 8) */}
      <div className="border-b border-border-default pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="text-[10px] uppercase font-sans font-semibold tracking-micro text-brand-forest-bright block mb-2">
            01 / OVERVIEW · PROCUREMENT INTELLIGENCE
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-text-primary font-normal tracking-tight">
            Find where your money is leaking.
          </h1>
          <p className="mt-3 text-sm sm:text-base text-text-secondary font-sans max-w-2xl leading-relaxed">
            Analyze procurement activity, uncover hidden spend leakage, and understand exactly why it happened.
          </p>
        </div>

        {/* Action Buttons: [ Analyze Data ] (Primary: forest green) & [ Demo Dataset ] (Secondary: dark surface + border) */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigate('table')}
            className="h-10 px-4 rounded-[8px] text-xs font-sans font-semibold uppercase tracking-wider text-text-primary bg-transparent hover:bg-dark-elevated border border-border-default transition-colors"
          >
            Demo Dataset
          </button>
          <button
            onClick={() => {
              if (onAnalyzeData) onAnalyzeData();
              else onNavigate('upload');
            }}
            className="h-10 px-5 rounded-[8px] text-xs font-sans font-semibold uppercase tracking-wider bg-brand-forest hover:bg-brand-forest-bright text-brand-cream transition-colors shadow-fine flex items-center gap-2"
          >
            <span>Analyze Data</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. KPI Section: 4-column grid with thin vertical separators (Section 9) */}
      <div className="rounded-[12px] border border-border-default bg-dark-bg overflow-hidden divide-y md:divide-y-0 md:divide-x divide-border-default grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label="TOTAL SPEND"
          value={KPI_DATA.totalSpend}
          subtext="Audited across 50,284 commercial line items"
          comparison="FY25-26 Active Ledgers"
          highlight="default"
        />
        <KPICard
          label="POTENTIAL LEAKAGE"
          value={KPI_DATA.potentialLeakage}
          subtext="1.69% of spend identified as avoidable variance"
          comparison="↑ 12.4% from previous period"
          highlight="terracotta"
        />
        <KPICard
          label="HIGH-RISK FINDINGS"
          value={KPI_DATA.highRiskCount}
          subtext="Immediate review required across 14 categories"
          comparison="37 Critical Severity"
          highlight="terracotta"
        />
        <KPICard
          label="SUPPLIERS ANALYZED"
          value={KPI_DATA.suppliersAnalyzed}
          subtext="Benchmarked against contractual master agreements"
          comparison="428 Vendor Entities"
          highlight="forest"
        />
      </div>

      {/* 3. Main Dashboard 12-Column Grid (Section 10) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left 8 Columns: Leakage Overview Chart */}
        <div className="lg:col-span-8">
          <LeakageChart onSelectCategory={() => onNavigate('leakage')} />
        </div>

        {/* Right 4 Columns: Priority Findings */}
        <div className="lg:col-span-4">
          <PriorityFindings
            onInvestigate={onInvestigate}
            onViewAll={() => onNavigate('table')}
          />
        </div>
      </div>

      {/* 4. Recent Findings Transaction Table (Section 42) */}
      <div className="border border-border-default rounded-[12px] bg-dark-bg overflow-hidden">
        <div className="px-6 py-5 border-b border-border-default flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] uppercase font-sans font-semibold tracking-micro text-text-muted block mb-1">
              03 / RECENT ACTIVITY
            </span>
            <h3 className="font-serif text-xl sm:text-2xl text-text-primary font-normal">
              Recent Findings
            </h3>
          </div>

          <button
            onClick={() => onNavigate('table')}
            className="inline-flex items-center gap-1.5 text-xs font-sans text-brand-forest-bright hover:underline font-medium"
          >
            <span>View Full Transaction Ledger</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Table Rows (Aligned with Tabular Numerals) */}
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
                <th className="py-3 px-6 font-medium text-center">Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-xs font-sans text-text-primary">
              {MOCK_TRANSACTIONS.slice(0, 5).map((row) => (
                <tr
                  key={row.id}
                  onClick={() => onInvestigate(row.id === 'TX-10294' ? 'FINDING #027' : 'FINDING #014')}
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
