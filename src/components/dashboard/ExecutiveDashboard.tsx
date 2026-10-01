import React, { useState } from 'react';
import { motion, useReducedMotion, Variants } from 'framer-motion';
import { TabType, DashboardData, DataSource, ProductComparisonItem } from '../../types';
import { LeakageChart } from './LeakageChart';
import { PriorityFindings, FindingItem } from './PriorityFindings';
import {
  ArrowRight,
  Database,
  Sliders,
  Layers,
  Cloud,
  FileSpreadsheet,
  RefreshCw,
  PenLine,
  Scale,
  AlertTriangle,
  Eye,
  Sparkles,
} from 'lucide-react';
import { formatCompactINR, formatINR } from '../../utils/formatters';
import { CUBIC_EASE } from '../layout/PageTransition';
import { PageHeader } from '../common/PageHeader';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { ProductComparisonDrawer } from '../product-intelligence/ProductComparisonDrawer';

interface ExecutiveDashboardProps {
  dashboardData?: DashboardData | null;
  findingsData?: FindingItem[] | null;
  dataSource?: DataSource;
  onSwitchSource?: (source: DataSource) => void;
  onInvestigate: (findingRef: string) => void;
  onNavigate: (tab: TabType) => void;
  onAnalyzeData?: () => void;
  onLoadDemo?: () => void;
  isDemoActive?: boolean;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  dashboardData,
  findingsData,
  dataSource = 'demo',
  onSwitchSource,
  onInvestigate,
  onNavigate,
  onAnalyzeData,
  onLoadDemo,
  isDemoActive = true,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [selectedComparison, setSelectedComparison] = useState<ProductComparisonItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  const totalSpend = dashboardData?.kpis?.total_spend ?? dashboardData?.total_spend ?? 0;
  const potentialLeakage = dashboardData?.kpis?.potential_leakage ?? dashboardData?.potential_leakage ?? 0;
  const leakageRate = dashboardData?.kpis?.leakage_rate ?? dashboardData?.leakage_rate ?? 0;
  const suppliersCount = dashboardData?.kpis?.suppliers ?? dashboardData?.suppliers ?? 0;
  const transactionsCount = dashboardData?.kpis?.transactions ?? dashboardData?.transactions ?? 0;

  const productIntel = dashboardData?.product_intelligence;
  const productKpis = productIntel?.summary_kpis || {
    total_products: dashboardData?.products || 0,
    total_comparisons: productIntel?.comparisons?.length || 0,
    highly_comparable_count: productIntel?.comparisons?.filter(c => (c.similarity_score ?? (c as any).similarityScore ?? 0) >= 75 || c.classification === 'HIGHLY_COMPARABLE' || (c as any).comparability === 'HIGHLY_COMPARABLE').length || 0,
    partially_comparable_count: productIntel?.comparisons?.filter(c => {
      const s = c.similarity_score ?? (c as any).similarityScore ?? 0;
      return (s >= 60 && s < 75) || c.classification === 'PARTIALLY_COMPARABLE' || (c as any).comparability === 'PARTIALLY_COMPARABLE';
    }).length || 0,
    different_specifications_count: productIntel?.comparisons?.filter(c => (c.similarity_score ?? (c as any).similarityScore ?? 100) < 60 || c.classification === 'DIFFERENT_SPECS' || (c as any).comparability === 'DIFFERENT_SPECS').length || 0,
    equal_price_different_value_count: productIntel?.comparisons?.filter(c => c.is_equal_price_different_spec || (c as any).equalPriceDifferentSpec).length || 0,
    insufficient_data_count: productIntel?.comparisons?.filter(c => c.classification === 'INSUFFICIENT_DATA' || (c as any).comparability === 'INSUFFICIENT_DATA').length || 0,
  };

  const sourceLabels: Record<DataSource, { name: string; desc: string; icon: any }> = {
    demo: { name: 'Demo Dataset', desc: '40-transaction multi-vendor benchmark dataset', icon: Database },
    nova: { name: 'Live Nova Cloud', desc: 'Real-time REST procurement API (POs, bills, contracts & vendors)', icon: Cloud },
    upload: { name: 'Uploaded File', desc: 'Custom procurement dataset ingested via SpendIntel', icon: FileSpreadsheet },
    manual: { name: 'Manual Data', desc: 'Direct transaction entries ingested via SpendIntel', icon: PenLine },
  };

  const backendSourceState = (dashboardData?.source as DataSource) || dataSource;
  const backendSourceLabel = dashboardData?.source_label || (
    backendSourceState === 'nova' ? 'LIVE NOVA' :
    backendSourceState === 'upload' ? 'UPLOADED FILE' :
    backendSourceState === 'manual' ? 'MANUAL DATA' :
    'DEMO DATASET'
  );

  const activeSourceInfo = sourceLabels[backendSourceState] || sourceLabels.demo;

  // Stagger variants for editorial metric blocks
  const metricsContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06,
        delayChildren: 0.1,
      },
    },
  };

  const metricItem: Variants = {
    hidden: { opacity: 0, y: 14 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.55, ease: CUBIC_EASE },
    },
  };

  const sectionReveal: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.65, ease: CUBIC_EASE },
    },
  };

  return (
    <div className="space-y-12">
      {/* 1. Header & Quick Controls (Section 3 & 4) */}
      <motion.div variants={sectionReveal} initial="hidden" animate="visible" className="space-y-6">
        <PageHeader
          label="Procurement Financial Overview"
          title="Executive Summary"
          description="Live deterministic analysis of active procurement commitments, price variances, and recoverable leakage."
          actions={
            <>
              {/* Premium Source Selector Pill */}
              <div className="flex items-center bg-[#151515]/5 p-1 rounded-full border border-[#151515]/10 shadow-xs">
                <button
                  onClick={() => onSwitchSource ? onSwitchSource('demo') : (onLoadDemo && onLoadDemo())}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                    dataSource === 'demo'
                      ? 'bg-[#151515] text-[#F3F3F1] font-semibold shadow-xs'
                      : 'text-[#151515]/70 hover:text-[#151515]'
                  }`}
                >
                  <Database className={`w-3.5 h-3.5 ${dataSource === 'demo' ? 'text-[#B8A47A]' : 'text-[#151515]/40'}`} />
                  <span>Demo Dataset</span>
                </button>

                <button
                  onClick={() => onSwitchSource && onSwitchSource('nova')}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                    dataSource === 'nova'
                      ? 'bg-[#151515] text-[#F3F3F1] font-semibold shadow-xs'
                      : 'text-[#151515]/70 hover:text-[#151515]'
                  }`}
                >
                  <Cloud className={`w-3.5 h-3.5 ${dataSource === 'nova' ? 'text-[#B8A47A]' : 'text-[#151515]/40'}`} />
                  <span>Live Nova</span>
                </button>

                <button
                  onClick={() => {
                    if (onAnalyzeData) onAnalyzeData();
                    else onNavigate('upload');
                  }}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                    dataSource === 'upload'
                      ? 'bg-[#151515] text-[#F3F3F1] font-semibold shadow-xs'
                      : 'text-[#151515]/70 hover:text-[#151515]'
                  }`}
                >
                  <FileSpreadsheet className={`w-3.5 h-3.5 ${dataSource === 'upload' ? 'text-[#B8A47A]' : 'text-[#151515]/40'}`} />
                  <span>Upload Data</span>
                </button>
              </div>

              <Button
                variant="secondary"
                size="md"
                onClick={() => onNavigate('simulator')}
                icon={<Sliders className="w-3.5 h-3.5 text-[#151515]/70" />}
                iconPosition="left"
              >
                Simulator
              </Button>
            </>
          }
        />

        {/* Active Source Status Banner */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[#151515]/5 border border-[#151515]/10 text-xs font-sans text-[#151515]/70">
          <div className="flex items-center gap-2.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F3F3F1] border border-[#151515]/10 text-[10px] font-mono font-semibold text-[#151515] shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#B8A47A] shadow-[0_0_6px_rgba(184,164,122,0.8)]" />
              <span>{backendSourceLabel}</span>
            </div>
            <span className="text-[#151515]/30">·</span>
            <span>{activeSourceInfo.desc}</span>
          </div>

          <div className="flex items-center gap-4 font-mono text-[11px] text-[#151515]/60">
            <span>{transactionsCount} purchase orders</span>
            <span>•</span>
            <span>{suppliersCount} vendors</span>
          </div>
        </div>
      </motion.div>

      {/* 2. Large Editorial Metric Blocks with Stagger */}
      <motion.div
        variants={metricsContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-20px' }}
        className="bg-[#F3F3F1] rounded-[28px] border border-[#151515]/10 p-8 sm:p-10 shadow-sm"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-6 divide-y md:divide-y-0 md:divide-x divide-[#151515]/10">
          {/* TOTAL SPEND */}
          <motion.div variants={metricItem} className="space-y-2">
            <span className="text-xs uppercase tracking-wider font-bold text-[#151515]/70 block">
              TOTAL SPEND
            </span>
            <div className="text-3xl sm:text-4xl lg:text-[44px] font-sans font-bold text-[#151515] tracking-tight tnum leading-tight">
              {formatCompactINR(totalSpend)}
            </div>
            <p className="text-sm text-[#151515]/70 font-sans font-medium">
              Across {transactionsCount} purchase orders
            </p>
          </motion.div>

          {/* POTENTIAL LEAKAGE */}
          <motion.div variants={metricItem} className="space-y-2 pt-6 md:pt-0 md:pl-6">
            <span className="text-xs uppercase tracking-wider font-bold text-[#B8A47A] block">
              POTENTIAL LEAKAGE
            </span>
            <div className="text-3xl sm:text-4xl lg:text-[44px] font-sans font-bold text-[#B8A47A] tracking-tight tnum leading-tight">
              {formatCompactINR(potentialLeakage)}
            </div>
            <p className="text-sm text-[#151515]/70 font-sans font-medium">
              Deterministic price variance & duplicates
            </p>
          </motion.div>

          {/* LEAKAGE RATE */}
          <motion.div variants={metricItem} className="space-y-2 pt-6 md:pt-0 md:pl-6">
            <span className="text-xs uppercase tracking-wider font-bold text-[#151515]/70 block">
              LEAKAGE RATE
            </span>
            <div className="text-3xl sm:text-4xl lg:text-[44px] font-sans font-bold text-[#151515] tracking-tight tnum leading-tight">
              {typeof leakageRate === 'number' ? leakageRate.toFixed(2) : leakageRate}%
            </div>
            <p className="text-sm text-[#151515]/70 font-sans font-medium">
              Of total procurement value
            </p>
          </motion.div>

          {/* SUPPLIERS */}
          <motion.div variants={metricItem} className="space-y-2 pt-6 md:pt-0 md:pl-6">
            <span className="text-xs uppercase tracking-wider font-bold text-[#151515]/70 block">
              SUPPLIERS
            </span>
            <div className="text-3xl sm:text-4xl lg:text-[44px] font-sans font-bold text-[#151515] tracking-tight tnum leading-tight">
              {suppliersCount}
            </div>
            <p className="text-sm text-[#151515]/70 font-sans font-medium">
              Benchmarked vendor entities
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* 3. Spend Intelligence Section: Scroll-Triggered Reveal */}
      <motion.div
        variants={sectionReveal}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-40px' }}
      >
        <LeakageChart
          leakageBreakdown={dashboardData?.leakage_breakdown}
          totalLeakage={potentialLeakage}
          onSelectCategory={(category) => onNavigate('table')}
        />
      </motion.div>

      {/* 4. Product Intelligence & Differentiation Section (Requirement 15) */}
      <motion.div
        variants={sectionReveal}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-40px' }}
        className="rounded-[28px] bg-white border border-[#151515]/10 p-8 sm:p-10 shadow-sm space-y-6"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-[#B8A47A]" />
              <span className="text-[11px] uppercase font-mono tracking-wider text-[#B8A47A] font-semibold">
                Benchmarking Intelligence
              </span>
            </div>
            <h3 className="text-2xl font-sans font-semibold text-[#151515] tracking-tight">
              Product Similarity & Differentiation
            </h3>
            <p className="text-xs sm:text-sm text-[#151515]/70 font-sans">
              Determines whether procurement items are genuinely comparable alternatives before price benchmarking.
            </p>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => onNavigate('product-intelligence')}
            icon={<ArrowRight className="w-3.5 h-3.5 text-[#B8A47A]" />}
            iconPosition="right"
          >
            Full Product Matrix
          </Button>
        </div>

        {/* 6 KPI Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3.5 rounded-xl bg-[#F3F3F1] border border-[#151515]/5 space-y-1">
            <span className="text-[9.5px] font-mono uppercase text-[#151515]/50 font-semibold block">
              Product Groups
            </span>
            <span className="text-xl font-sans font-bold text-[#151515] block">
              {productKpis.total_products}
            </span>
            <span className="text-[10px] text-[#151515]/60 font-sans">Normalized items</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F3F3F1] border border-[#151515]/5 space-y-1">
            <span className="text-[9.5px] font-mono uppercase text-[#B8A47A] font-semibold block">
              Highly Comparable
            </span>
            <span className="text-xl font-sans font-bold text-[#151515] block">
              {productKpis.highly_comparable_count}
            </span>
            <span className="text-[10px] text-[#151515]/60 font-sans">≥75% similarity</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F3F3F1] border border-[#151515]/5 space-y-1">
            <span className="text-[9.5px] font-mono uppercase text-[#151515]/50 font-semibold block">
              Partially Comp.
            </span>
            <span className="text-xl font-sans font-bold text-[#151515] block">
              {productKpis.partially_comparable_count}
            </span>
            <span className="text-[10px] text-[#151515]/60 font-sans">60–74% similarity</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F3F3F1] border border-[#151515]/5 space-y-1">
            <span className="text-[9.5px] font-mono uppercase text-[#151515]/50 font-semibold block">
              Different Specs
            </span>
            <span className="text-xl font-sans font-bold text-[#151515] block">
              {productKpis.different_specifications_count}
            </span>
            <span className="text-[10px] text-[#151515]/60 font-sans">Spec deltas</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#B8A47A]/10 border border-[#B8A47A]/40 space-y-1">
            <span className="text-[9.5px] font-mono uppercase text-[#B8A47A] font-bold block flex items-center gap-1">
              <AlertTriangle className="w-2.5 h-2.5" /> Equal Price / Diff Value
            </span>
            <span className="text-xl font-sans font-bold text-[#151515] block">
              {productKpis.equal_price_different_value_count}
            </span>
            <span className="text-[10px] text-[#151515]/70 font-sans font-medium">Unequal value</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F3F3F1] border border-[#151515]/5 space-y-1">
            <span className="text-[9.5px] font-mono uppercase text-[#151515]/40 font-semibold block">
              Insufficient Data
            </span>
            <span className="text-xl font-sans font-bold text-[#151515]/70 block">
              {productKpis.insufficient_data_count}
            </span>
            <span className="text-[10px] text-[#151515]/50 font-sans">Limited attrs</span>
          </div>
        </div>

        {/* Quick Comparison Table (Top items) */}
        {productIntel?.comparisons && productIntel.comparisons.length > 0 && (
          <div className="rounded-xl border border-[#151515]/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#151515]/5 border-b border-[#151515]/10 text-[10px] font-mono uppercase tracking-wider text-[#151515]/60">
                    <th className="py-2.5 px-3.5">Product A</th>
                    <th className="py-2.5 px-3.5">Product B</th>
                    <th className="py-2.5 px-3.5 text-center">Similarity</th>
                    <th className="py-2.5 px-3.5 text-right">Price A</th>
                    <th className="py-2.5 px-3.5 text-right">Price B</th>
                    <th className="py-2.5 px-3.5 text-center">Comparability</th>
                    <th className="py-2.5 px-3.5">Forensic Insight</th>
                    <th className="py-2.5 px-3.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#151515]/5 text-xs font-sans">
                  {productIntel.comparisons.slice(0, 4).map((c, idx) => (
                    <tr
                      key={c.id || idx}
                      onClick={() => {
                        setSelectedComparison(c);
                        setIsDrawerOpen(true);
                      }}
                      className="cursor-pointer hover:bg-[#151515]/[0.03] transition-colors"
                    >
                      <td className="py-3 px-3.5 font-semibold text-[#151515]">
                        {c.product_a.product_name}
                      </td>
                      <td className="py-3 px-3.5 font-semibold text-[#151515]">
                        {c.product_b.product_name}
                      </td>
                      <td className="py-3 px-3.5 text-center font-mono font-bold">
                        {c.similarity_score.toFixed(0)}%
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono font-medium">
                        {formatINR(c.price_a)}
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono font-medium">
                        {formatINR(c.price_b)}
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <Badge variant={c.similarity_score >= 75 ? 'HIGH' : 'MEDIUM'} size="sm">
                          {c.classification}
                        </Badge>
                      </td>
                      <td className="py-3 px-3.5 text-xs text-[#151515]/70 max-w-[200px] truncate">
                        {c.explanation}
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedComparison(c);
                            setIsDrawerOpen(true);
                          }}
                          icon={<Eye className="w-3 h-3 text-[#151515]/70" />}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </motion.div>

      {/* 5. Priority Findings Section: Scroll-Triggered Reveal */}
      <motion.div
        variants={sectionReveal}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-40px' }}
      >
        <PriorityFindings
          findings={findingsData ?? dashboardData?.priority_findings}
          onInvestigate={onInvestigate}
          onViewAll={() => onNavigate('table')}
        />
      </motion.div>

      {/* 6. Editorial Platform Value Banner */}
      <motion.div
        variants={sectionReveal}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-40px' }}
        className="rounded-[28px] bg-[#151515]/5 border border-[#151515]/10 p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6"
      >
        <div className="space-y-2 max-w-xl">
          <span className="text-[11px] uppercase font-semibold tracking-wider text-[#B8A47A] block">
            Spend Recovery Simulator
          </span>
          <h3 className="text-2xl font-sans font-medium text-[#151515]">
            Simulate supplier price optimization in real-time.
          </h3>
          <p className="text-xs sm:text-sm text-[#151515]/70 font-sans leading-relaxed">
            Test alternative vendor rate cards, simulate demand volume adjustments, and project net financial recovery with zero guesswork.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => onNavigate('simulator')}
          icon={<ArrowRight className="w-3.5 h-3.5 text-[#B8A47A]" />}
          iconPosition="right"
          className="shrink-0"
        >
          Open Recovery Simulator
        </Button>
      </motion.div>

      {/* Product Comparison Drawer Modal */}
      <ProductComparisonDrawer
        comparison={selectedComparison}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onInvestigate={onInvestigate}
        onNavigate={onNavigate}
      />
    </div>
  );
};
