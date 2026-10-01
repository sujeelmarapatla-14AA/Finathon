import React from 'react';
import { ArrowUpRight, ShieldAlert, BarChart3 } from 'lucide-react';
import { formatCompactINR, formatINR } from '../../utils/formatters';

interface LeakageCategoryItem {
  type: string;
  count: number;
  amount: number;
}

interface LeakageChartProps {
  leakageBreakdown?: LeakageCategoryItem[];
  totalLeakage?: number;
  onSelectCategory?: (category: string) => void;
}

export const LeakageChart: React.FC<LeakageChartProps> = ({
  leakageBreakdown,
  totalLeakage = 465750,
  onSelectCategory,
}) => {
  const getAmount = (type: string, fallback: number) => {
    if (!leakageBreakdown) return fallback;
    const found = leakageBreakdown.find((b) => b.type === type);
    return found ? Number(found.amount || 0) : 0;
  };

  const getCount = (type: string, fallback: number) => {
    if (!leakageBreakdown) return fallback;
    const found = leakageBreakdown.find((b) => b.type === type);
    return found ? Number(found.count || 0) : 0;
  };

  const allCategories = [
    {
      name: 'PRICE ANOMALIES',
      type: 'PRICE_ANOMALY',
      amount: getAmount('PRICE_ANOMALY', 465750),
      count: getCount('PRICE_ANOMALY', 14),
      color: '#B8A47A',
      description: 'Purchases billed above established benchmarks or contract baselines',
    },
    {
      name: 'MISSED DISCOUNTS',
      type: 'MISSED_DISCOUNT',
      amount: getAmount('MISSED_DISCOUNT', 155800),
      count: getCount('MISSED_DISCOUNT', 2),
      color: 'rgba(184,164,122,0.75)',
      description: 'Volume discount tiers and cash rebate terms uncaptured at settlement',
    },
    {
      name: 'CONTRACT NON-COMPLIANCE',
      type: 'CONTRACT_NON_COMPLIANCE',
      amount: getAmount('CONTRACT_NON_COMPLIANCE', 0),
      count: getCount('CONTRACT_NON_COMPLIANCE', 0),
      color: 'rgba(243,243,241,0.85)',
      description: 'Transactions deviating from active contracted master rate cards',
    },
    {
      name: 'DUPLICATE PURCHASES',
      type: 'POSSIBLE_DUPLICATE',
      amount: getAmount('POSSIBLE_DUPLICATE', 3396000),
      count: getCount('POSSIBLE_DUPLICATE', 8),
      color: '#B8A47A',
      description: 'Identical product, supplier, and quantity invoiced within short windows',
    },
    {
      name: 'SUPPLIER FRAGMENTATION',
      type: 'SUPPLIER_FRAGMENTATION',
      amount: getAmount('SUPPLIER_FRAGMENTATION', 0),
      count: getCount('SUPPLIER_FRAGMENTATION', 5),
      color: 'rgba(184,164,122,0.5)',
      description: 'Product volume fractured across multiple vendors without consolidation',
    },
    {
      name: 'UNUSUAL PATTERNS',
      type: 'UNUSUAL_PATTERN',
      amount: getAmount('UNUSUAL_PATTERN', 0),
      count: getCount('UNUSUAL_PATTERN', 14),
      color: 'rgba(243,243,241,0.6)',
      description: 'Statistical price spikes, sudden supplier changes, and order volume outliers',
    },
  ];

  // Adapt gracefully for small data: filter out irrelevant empty categories
  const categories = leakageBreakdown
    ? (allCategories.some((c) => c.amount > 0 || c.count > 0)
        ? allCategories.filter((c) => c.amount > 0 || c.count > 0)
        : allCategories)
    : allCategories;

  // Calculate sum for relative bar widths
  const maxAmount = Math.max(...categories.map(c => c.amount), 1);
  const totalCategorySpend = categories.reduce((acc, c) => acc + c.amount, 0);

  return (
    <div className="rounded-[32px] bg-[#151515] text-[#F3F3F1] p-6 sm:p-10 border border-[#B8A47A]/20 shadow-xl relative overflow-hidden">
      {/* Background fine grid */}
      <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(rgba(184,164,122,0.15)_1px,transparent_1px)] [background-size:24px_24px]" />

      <div className="relative">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-8 border-b border-[#F3F3F1]/10 gap-4">
          <div>
            <span className="text-[11px] uppercase font-semibold tracking-wider text-[#B8A47A] block mb-2">
              Spend Intelligence
            </span>
            <h2 className="text-2xl sm:text-3xl font-sans font-medium text-[#F3F3F1] tracking-tight">
              Where spend is leaking.
            </h2>
            <p className="text-xs sm:text-sm text-[#F3F3F1]/60 mt-1 font-sans">
              Every flagged transaction is backed by deterministic evidence.
            </p>
          </div>

          <div className="text-left sm:text-right shrink-0">
            <span className="text-[11px] uppercase tracking-wider text-[#F3F3F1]/50 block">
              Flagged Exposure
            </span>
            <span className="text-3xl font-sans font-medium text-[#F3F3F1] tracking-tight tnum">
              {formatINR(totalLeakage)}
            </span>
          </div>
        </div>

        {/* 2-Column Layout: Left Leakage Visualization, Right Ranked Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 pt-8 items-center">
          {/* Left Column (5 Cols): Proportional Distribution Meter & Summary */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-2xl bg-[#F3F3F1]/5 border border-[#F3F3F1]/10 p-6 space-y-4">
              <div className="text-xs uppercase font-sans text-[#F3F3F1]/60 tracking-wider">
                Leakage Distribution Strip
              </div>

              {/* Proportional Segment Bar */}
              <div className="h-3 w-full rounded-full overflow-hidden flex bg-[#F3F3F1]/10">
                {categories.map((cat) => {
                  const pct = totalCategorySpend > 0 ? (cat.amount / totalCategorySpend) * 100 : 25;
                  return (
                    <div
                      key={cat.name}
                      style={{ width: `${pct}%`, backgroundColor: cat.color }}
                      className="h-full transition-opacity hover:opacity-80 cursor-pointer"
                      title={`${cat.name}: ${formatINR(cat.amount)}`}
                    />
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                {categories.map((cat) => (
                  <div key={cat.name} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    <span className="text-[11px] text-[#F3F3F1]/70 truncate">{cat.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#F3F3F1]/5 border border-[#F3F3F1]/10 text-xs text-[#F3F3F1]/70 leading-relaxed">
              <span className="text-[#F3F3F1] font-medium">Audit Note:</span> Price anomalies form the highest confidence direct-recovery category, directly recoverable through contract rebate renegotiation.
            </div>
          </div>

          {/* Right Column (7 Cols): Ranked Proportional Bar Rows */}
          <div className="lg:col-span-7 space-y-5">
            {categories.map((cat) => {
              const barWidth = maxAmount > 0 ? (cat.amount / maxAmount) * 100 : 0;
              const formattedAmt = formatINR(cat.amount);

              return (
                <div
                  key={cat.name}
                  onClick={() => onSelectCategory?.(cat.type)}
                  className="p-4 rounded-2xl bg-[#F3F3F1]/5 hover:bg-[#F3F3F1]/10 border border-[#F3F3F1]/10 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-xs mb-2">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="font-semibold text-[#F3F3F1] tracking-wide">
                        {cat.name}
                      </span>
                      <span className="text-[11px] text-[#F3F3F1]/60 font-mono">
                        ({cat.count} flags)
                      </span>
                    </div>

                    <div className="text-sm font-medium text-[#F3F3F1] tnum">
                      {formattedAmt}
                    </div>
                  </div>

                  {/* Clean Proportional Bar */}
                  <div className="w-full bg-[#F3F3F1]/10 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${Math.max(barWidth, 4)}%`,
                        backgroundColor: cat.color,
                      }}
                    />
                  </div>

                  <p className="text-[11px] text-[#F3F3F1]/60 mt-2 font-sans line-clamp-1">
                    {cat.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
