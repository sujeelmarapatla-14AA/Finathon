import React from 'react';
import { motion, useReducedMotion, Variants } from 'framer-motion';
import { TabType, DashboardData, DataSource } from '../../types';
import { LeakageChart } from './LeakageChart';
import { PriorityFindings, FindingItem } from './PriorityFindings';
import { ArrowRight, Database, Sliders, Layers, Cloud, FileSpreadsheet, RefreshCw, PenLine } from 'lucide-react';
import { formatCompactINR, formatINR } from '../../utils/formatters';
import { CUBIC_EASE } from '../layout/PageTransition';
import { PageHeader } from '../common/PageHeader';
import { Button } from '../common/Button';

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

  const totalSpend = dashboardData?.kpis?.total_spend ?? dashboardData?.total_spend ?? 0;
  const potentialLeakage = dashboardData?.kpis?.potential_leakage ?? dashboardData?.potential_leakage ?? 0;
  const leakageRate = dashboardData?.kpis?.leakage_rate ?? dashboardData?.leakage_rate ?? 0;
  const suppliersCount = dashboardData?.kpis?.suppliers ?? dashboardData?.suppliers ?? 0;
  const transactionsCount = dashboardData?.kpis?.transactions ?? dashboardData?.transactions ?? 0;

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
              <div className="flex items-center bg-white p-1 rounded-full border border-[#E8E8E3] shadow-xs">
                <button
                  onClick={() => onSwitchSource ? onSwitchSource('demo') : (onLoadDemo && onLoadDemo())}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                    dataSource === 'demo'
                      ? 'bg-[#0A0A0A] text-white font-semibold shadow-xs'
                      : 'text-[#5E5E5A] hover:text-[#111111]'
                  }`}
                >
                  <Database className={`w-3.5 h-3.5 ${dataSource === 'demo' ? 'text-[#73C69A]' : 'text-[#8A8A84]'}`} />
                  <span>Demo Dataset</span>
                </button>

                <button
                  onClick={() => onSwitchSource && onSwitchSource('nova')}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                    dataSource === 'nova'
                      ? 'bg-[#0A0A0A] text-white font-semibold shadow-xs'
                      : 'text-[#5E5E5A] hover:text-[#111111]'
                  }`}
                >
                  <Cloud className={`w-3.5 h-3.5 ${dataSource === 'nova' ? 'text-[#5E81AC]' : 'text-[#8A8A84]'}`} />
                  <span>Live Nova</span>
                </button>

                <button
                  onClick={() => {
                    if (onAnalyzeData) onAnalyzeData();
                    else onNavigate('upload');
                  }}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                    dataSource === 'upload'
                      ? 'bg-[#0A0A0A] text-white font-semibold shadow-xs'
                      : 'text-[#5E5E5A] hover:text-[#111111]'
                  }`}
                >
                  <FileSpreadsheet className={`w-3.5 h-3.5 ${dataSource === 'upload' ? 'text-[#73C69A]' : 'text-[#8A8A84]'}`} />
                  <span>Upload Data</span>
                </button>
              </div>

              <Button
                variant="secondary"
                size="md"
                onClick={() => onNavigate('simulator')}
                icon={<Sliders className="w-3.5 h-3.5 text-[#5E5E5A]" />}
                iconPosition="left"
              >
                Simulator
              </Button>
            </>
          }
        />

        {/* Active Source Status Banner */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[#FAFAF8] border border-[#E8E8E3] text-xs font-sans text-[#5E5E5A]">
          <div className="flex items-center gap-2.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white border border-[#E8E8E3] text-[10px] font-mono font-semibold text-[#111111] shadow-xs">
              <span className={`w-1.5 h-1.5 rounded-full ${
                backendSourceLabel.includes('NOVA') ? 'bg-[#5E81AC] animate-pulse shadow-[0_0_6px_rgba(94,129,172,0.6)]' :
                backendSourceLabel.includes('UPLOAD') ? 'bg-[#E5A93C] shadow-[0_0_6px_rgba(229,169,60,0.6)]' :
                'bg-[#73C69A] shadow-[0_0_6px_rgba(115,198,154,0.6)]'
              }`} />
              <span>{backendSourceLabel}</span>
            </div>
            <span className="text-[#DCDCD7]">·</span>
            <span>{activeSourceInfo.desc}</span>
          </div>

          <div className="flex items-center gap-4 font-mono text-[11px] text-[#8A8A84]">
            <span>{transactionsCount} purchase orders</span>
            <span>•</span>
            <span>{suppliersCount} vendors</span>
          </div>
        </div>
      </motion.div>

      {/* 2. Large Editorial Metric Blocks with Stagger (Section 8 & 5) */}
      <motion.div
        variants={metricsContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-20px' }}
        className="bg-white rounded-[28px] border border-[#E8E8E3] p-8 sm:p-10 shadow-sm"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-6 divide-y md:divide-y-0 md:divide-x divide-[#E8E8E3]">
          {/* TOTAL SPEND */}
          <motion.div variants={metricItem} className="space-y-1.5">
            <span className="text-xs uppercase tracking-wider font-semibold text-[#8A8A84] block">
              TOTAL SPEND
            </span>
            <div className="text-3xl sm:text-4xl lg:text-[42px] font-sans font-semibold text-[#111111] tracking-tight tnum">
              {formatCompactINR(totalSpend)}
            </div>
            <p className="text-sm text-[#5E5E5A] mt-1 font-sans">
              Across {transactionsCount} purchase orders
            </p>
          </motion.div>

          {/* POTENTIAL LEAKAGE */}
          <motion.div variants={metricItem} className="space-y-1.5 pt-6 md:pt-0 md:pl-6">
            <span className="text-xs uppercase tracking-wider font-semibold text-[#D96B4A] block">
              POTENTIAL LEAKAGE
            </span>
            <div className="text-3xl sm:text-4xl lg:text-[42px] font-sans font-semibold text-[#D96B4A] tracking-tight tnum">
              {formatCompactINR(potentialLeakage)}
            </div>
            <p className="text-sm text-[#5E5E5A] mt-1 font-sans">
              Deterministic price variance & duplicates
            </p>
          </motion.div>

          {/* LEAKAGE RATE */}
          <motion.div variants={metricItem} className="space-y-1.5 pt-6 md:pt-0 md:pl-6">
            <span className="text-xs uppercase tracking-wider font-semibold text-[#8A8A84] block">
              LEAKAGE RATE
            </span>
            <div className="text-3xl sm:text-4xl lg:text-[42px] font-sans font-semibold text-[#111111] tracking-tight tnum">
              {typeof leakageRate === 'number' ? leakageRate.toFixed(2) : leakageRate}%
            </div>
            <p className="text-sm text-[#5E5E5A] mt-1 font-sans">
              Of total procurement value
            </p>
          </motion.div>

          {/* SUPPLIERS */}
          <motion.div variants={metricItem} className="space-y-1.5 pt-6 md:pt-0 md:pl-6">
            <span className="text-xs uppercase tracking-wider font-semibold text-[#8A8A84] block">
              SUPPLIERS
            </span>
            <div className="text-3xl sm:text-4xl lg:text-[42px] font-sans font-semibold text-[#111111] tracking-tight tnum">
              {suppliersCount}
            </div>
            <p className="text-sm text-[#5E5E5A] mt-1 font-sans">
              Benchmarked vendor entities
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* 3. Spend Intelligence Section: Scroll-Triggered Reveal (Section 9 & 11) */}
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

      {/* 4. Priority Findings Section: Scroll-Triggered Reveal (Section 10 & 11) */}
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

      {/* 5. Editorial Platform Value Banner (Section 11) */}
      <motion.div
        variants={sectionReveal}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-40px' }}
        className="rounded-[28px] bg-[#FAFAF8] border border-[#E8E8E3] p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6"
      >
        <div className="space-y-2 max-w-xl">
          <span className="text-[10px] uppercase font-semibold tracking-wider text-[#73C69A] block">
            Spend Recovery Simulator
          </span>
          <h3 className="text-2xl font-sans font-medium text-[#111111]">
            Simulate supplier price optimization in real-time.
          </h3>
          <p className="text-xs sm:text-sm text-[#5E5E5A] font-sans leading-relaxed">
            Test alternative vendor rate cards, simulate demand volume adjustments, and project net financial recovery with zero guesswork.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => onNavigate('simulator')}
          icon={<ArrowRight className="w-3.5 h-3.5" />}
          iconPosition="right"
          className="shrink-0"
        >
          Open Recovery Simulator
        </Button>
      </motion.div>
    </div>
  );
};
