import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { formatCompactINR, formatINR } from '../../../utils/formatters';
import { CUBIC_EASE } from '../../layout/PageTransition';

interface AnalyticsKpiBarProps {
  kpis: {
    totalSpend: number;
    potentialLeakage: number;
    leakageRate: number;
    transactions: number;
    suppliers: number;
    products: number;
    trendBaseline: {
      hasComparison: boolean;
      spendTrendPct?: number;
      leakageTrendPct?: number;
      label: string;
    };
  };
}

export const AnalyticsKpiBar: React.FC<AnalyticsKpiBarProps> = ({ kpis }) => {
  const shouldReduceMotion = useReducedMotion();

  const metrics = [
    {
      label: 'TOTAL SPEND',
      value: formatCompactINR(kpis.totalSpend),
      fullValue: formatINR(kpis.totalSpend),
      subtext: `Across ${kpis.transactions} transactions`,
      accentColor: 'text-[#111111]',
    },
    {
      label: 'POTENTIAL LEAKAGE',
      value: formatCompactINR(kpis.potentialLeakage),
      fullValue: formatINR(kpis.potentialLeakage),
      subtext: `${kpis.leakageRate.toFixed(2)}% of total value`,
      accentColor: 'text-[#D96B4A]',
    },
    {
      label: 'LEAKAGE RATE',
      value: `${kpis.leakageRate.toFixed(2)}%`,
      subtext: 'Deterministic price variance',
      accentColor: 'text-[#111111]',
    },
    {
      label: 'TRANSACTIONS',
      value: kpis.transactions.toLocaleString('en-IN'),
      subtext: 'Audited procurement orders',
      accentColor: 'text-[#111111]',
    },
    {
      label: 'SUPPLIERS',
      value: kpis.suppliers.toLocaleString('en-IN'),
      subtext: 'Active vendor entities',
      accentColor: 'text-[#111111]',
    },
    {
      label: 'PRODUCTS',
      value: kpis.products.toLocaleString('en-IN'),
      subtext: 'Benchmarked SKU lines',
      accentColor: 'text-[#111111]',
    },
  ];

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: CUBIC_EASE }}
      className="bg-white rounded-[24px] border border-[#E8E8E3] p-6 sm:p-8 shadow-sm"
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-[#E8E8E3]">
        {metrics.map((m, idx) => (
          <div
            key={m.label}
            className={`space-y-1 ${idx > 0 ? 'sm:pl-6 pt-4 sm:pt-0' : ''}`}
          >
            <span className="text-[10px] uppercase tracking-wider font-semibold text-[#8A8A84] block">
              {m.label}
            </span>
            <div
              className={`text-2xl sm:text-3xl font-sans font-medium tracking-tight tnum ${m.accentColor}`}
              title={m.fullValue || m.value}
            >
              {m.value}
            </div>
            <p className="text-[11px] text-[#5E5E5A] font-sans truncate">
              {m.subtext}
            </p>
          </div>
        ))}
      </div>

      {/* Baseline Footnote (Section 7 - Never fabricate trend arrows) */}
      <div className="mt-4 pt-4 border-t border-[#F0F0EB] flex items-center justify-between text-[11px] text-[#8A8A84] font-mono">
        <span>● Active dataset normalization</span>
        <span>{kpis.trendBaseline.label}</span>
      </div>
    </motion.div>
  );
};
