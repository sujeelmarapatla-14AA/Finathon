import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, ArrowUpRight, Calculator, Sparkles } from 'lucide-react';
import { CUBIC_EASE } from '../layout/PageTransition';
import { TabType, DashboardData, DataSource } from '../../types';
import { formatCompactINR, formatINR } from '../../utils/formatters';
import TechText from '../ui/TechText';

interface EditorialHeroProps {
  dashboardData?: DashboardData | null;
  dataSource?: DataSource;
  onAnalyzeData: () => void;
  onExploreDemo: () => void;
  onNavigate?: (tab: TabType) => void;
  onInvestigateFinding?: (findingRef: string) => void;
}

export const EditorialHero: React.FC<EditorialHeroProps> = ({
  dashboardData,
  dataSource = 'demo',
  onAnalyzeData,
  onExploreDemo,
  onNavigate,
  onInvestigateFinding,
}) => {
  const shouldReduceMotion = useReducedMotion();

  // 1. Core KPIs derived directly from the active backend dashboard model
  const potentialLeakageValue = dashboardData?.kpis?.potential_leakage ?? dashboardData?.potential_leakage ?? 0;
  const potentialLeakageFormatted = potentialLeakageValue > 0 ? formatCompactINR(potentialLeakageValue) : '₹0';
  const leakageRateValue = dashboardData?.kpis?.leakage_rate ?? dashboardData?.leakage_rate ?? 0;
  const totalTransactions = dashboardData?.kpis?.transactions ?? dashboardData?.transactions ?? 0;

  // 2. Active Source Indicator Label
  const backendSourceState = (dashboardData?.source as DataSource) || dataSource;
  const backendSourceLabel = dashboardData?.source_label || (
    backendSourceState === 'nova' ? 'LIVE NOVA' :
    backendSourceState === 'upload' ? 'UPLOADED DATA' :
    backendSourceState === 'manual' ? 'MANUAL DATA' :
    'DEMO DATASET'
  );

  // 3. Dynamic Category Breakdown Resolver
  const getCategoryMetrics = (categories: string[]) => {
    if (!dashboardData?.leakage_breakdown || dashboardData.leakage_breakdown.length === 0) {
      return { amount: 0, count: 0 };
    }
    const targetUpper = categories.map((c) => c.toUpperCase());
    const match = dashboardData.leakage_breakdown.find((b) =>
      targetUpper.includes(String(b.type || (b as any).category || '').toUpperCase())
    );
    return match ? { amount: Number(match.amount || 0), count: Number(match.count || 0) } : { amount: 0, count: 0 };
  };

  const priceAnomaly = getCategoryMetrics(['PRICE_ANOMALY', 'PRICE_ANOMALIES']);
  const supplierFrag = getCategoryMetrics(['SUPPLIER_FRAGMENTATION', 'FRAGMENTATION']);
  const duplicates = getCategoryMetrics(['POSSIBLE_DUPLICATE', 'DUPLICATES', 'DUPLICATE_PURCHASES']);
  const missedDiscounts = getCategoryMetrics(['MISSED_DISCOUNT', 'MISSED_DISCOUNTS']);
  const contractFindings = getCategoryMetrics(['CONTRACT_NON_COMPLIANCE', 'OFF_CONTRACT_PURCHASE']);

  // 4. Recovery Opportunity derived from active priority findings or scenario
  const topPriorityFinding = dashboardData?.priority_findings && dashboardData.priority_findings.length > 0
    ? dashboardData.priority_findings[0]
    : null;

  const recoveryAmount = topPriorityFinding
    ? Number(topPriorityFinding.potential_leakage || topPriorityFinding.amount || 0)
    : 0;

  const recoveryVariancePct = topPriorityFinding
    ? Number(topPriorityFinding.variance_percent ?? topPriorityFinding.variance ?? leakageRateValue)
    : leakageRateValue;

  const topFindingRef = topPriorityFinding
    ? String(topPriorityFinding.transaction_id || topPriorityFinding.id || '')
    : '';

  const hasRecoveryOpportunity = recoveryAmount > 0;

  return (
    <section className="relative w-full pb-8">
      {/* Moneliq-Inspired Large Black Rounded Hero Container */}
      <div className="relative rounded-[32px] sm:rounded-[40px] bg-[#0A0A0A] text-white overflow-hidden border border-[#1F1F1F] shadow-2xl">
        {/* Subtle Fine Grid Background with gentle parallax feel */}
        <motion.div
          animate={shouldReduceMotion ? {} : { y: [-6, 6, -6] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 bg-dark-grid opacity-30 pointer-events-none will-change-transform"
        />

        {/* Subtle Radial Glow / Aurora in Top Left */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#73C69A]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#73C69A]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative px-6 sm:px-12 lg:px-16 pt-12 sm:pt-16 pb-12 lg:pb-16">
          {/* Top Label Pill & Interactive TechText */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: CUBIC_EASE }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-sans font-medium text-white tracking-wider uppercase"
            >
              <span className="w-2 h-2 rounded-full bg-[#73C69A] animate-pulse" />
              <span>Procurement Intelligence Engine</span>
            </motion.div>

            <div className="w-full sm:w-64 h-12 relative opacity-90 hidden sm:block">
              <TechText
                text="SpendIntel"
                fontSize={32}
                fontWeight={700}
                dashLength={3}
                dashGap={2}
                specks={8}
                color="#ffffff"
                accentColor="#73C69A"
                draggable
                sweep
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left 6 Columns: Oversized Typography & Copy (with subtle 60ms lag) */}
            <div className="lg:col-span-6 space-y-6">
              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.8,
                  delay: shouldReduceMotion ? 0 : 0.06, // 60ms lag for cinematic presentation feel
                  ease: CUBIC_EASE,
                }}
                className="text-4xl sm:text-6xl lg:text-[72px] font-sans font-medium tracking-tight text-white leading-[1.05]"
              >
                Know where <br className="hidden sm:inline" />
                your money <br className="hidden sm:inline" />
                goes.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.7,
                  delay: shouldReduceMotion ? 0 : 0.12,
                  ease: CUBIC_EASE,
                }}
                className="text-base sm:text-lg text-[#8A8A84] max-w-xl font-normal leading-relaxed"
              >
                Discover hidden spend leakage, understand why it happened, and identify recoverable value across your purchase orders and vendor agreements.
              </motion.p>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.6,
                  delay: shouldReduceMotion ? 0 : 0.18,
                  ease: CUBIC_EASE,
                }}
                className="pt-2 flex flex-wrap items-center gap-3"
              >
                <button
                  onClick={onAnalyzeData}
                  className="h-12 px-6 rounded-full text-xs font-semibold uppercase tracking-wider bg-white hover:bg-[#FAFAF8] text-[#0A0A0A] transition-all shadow-lg flex items-center gap-2"
                >
                  <span>Analyze procurement</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={onExploreDemo}
                  className="h-12 px-6 rounded-full text-xs font-semibold uppercase tracking-wider text-white bg-white/5 hover:bg-white/10 border border-white/20 transition-all flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-[#73C69A]" />
                  <span>Open demo dataset</span>
                </button>
              </motion.div>

              {/* Sub-label metrics */}
              <div className="pt-6 border-t border-white/10 grid grid-cols-3 gap-4 text-left">
                <div>
                  <div className="text-xs uppercase font-semibold text-[#8A8A84] tracking-wider">Detection</div>
                  <div className="text-sm font-medium text-white mt-0.5">Deterministic</div>
                </div>
                <div>
                  <div className="text-xs uppercase font-semibold text-[#8A8A84] tracking-wider">Engine</div>
                  <div className="text-sm font-medium text-[#73C69A] mt-0.5">Evidence-First</div>
                </div>
                <div>
                  <div className="text-xs uppercase font-semibold text-[#8A8A84] tracking-wider">Actionability</div>
                  <div className="text-sm font-medium text-white mt-0.5">Audit-Ready</div>
                </div>
              </div>
            </div>

            {/* Right 6 Columns: Floating Moneliq-Style Procurement Intelligence Interface */}
            <div className="lg:col-span-6 relative">
              {/* Floating Terminal Card with subtle micro-float parallax */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 1, y: [-4, 4, -4] }}
                transition={{
                  opacity: { duration: 0.8, ease: CUBIC_EASE },
                  y: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
                }}
                className="relative rounded-[28px] bg-[#111111]/90 backdrop-blur-xl border border-white/15 p-6 sm:p-8 shadow-2xl space-y-6 card-lift will-change-transform"
              >
                {/* Header of Interface with Dynamic Source State */}
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#73C69A]" />
                    <span className="text-xs font-mono font-medium uppercase tracking-wider text-white">
                      SpendIntel Audit Engine
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold px-3 py-1 rounded-full bg-white/10 border border-white/15 text-white shadow-xs">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        backendSourceLabel.includes('NOVA')
                          ? 'bg-[#5E81AC] animate-pulse shadow-[0_0_6px_rgba(94,129,172,0.8)]'
                          : backendSourceLabel.includes('UPLOAD')
                          ? 'bg-[#E5A93C] shadow-[0_0_6px_rgba(229,169,60,0.8)]'
                          : 'bg-[#73C69A] shadow-[0_0_6px_rgba(115,198,154,0.8)]'
                      }`}
                    />
                    <span>{backendSourceLabel}</span>
                  </span>
                </div>

                {/* Big Core Metric - Dynamic Potential Leakage & Leakage Rate */}
                <div>
                  <div className="text-xs uppercase font-sans tracking-wider text-[#8A8A84]">
                    Potential Leakage
                  </div>
                  <div className="flex items-baseline gap-3 mt-1">
                    <span className="text-4xl sm:text-5xl font-sans font-medium text-white tracking-tight tnum">
                      {potentialLeakageFormatted}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#D96B4A]/20 text-[#D96B4A] border border-[#D96B4A]/30">
                      {leakageRateValue.toFixed(2)}% Leakage Rate
                    </span>
                  </div>
                  <div className="text-xs text-[#8A8A84] mt-1.5">
                    Identified across{' '}
                    <span className="text-white font-medium">
                      {totalTransactions} procurement {totalTransactions === 1 ? 'transaction' : 'transactions'}
                    </span>
                  </div>
                </div>

                {/* Floating Mini-Panels Grid - Fully Dynamic from leakage_breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  {/* Mini-Panel 1: Price Anomaly */}
                  <div
                    onClick={() => onNavigate && onNavigate('leakage')}
                    className="rounded-2xl bg-white/5 border border-white/10 p-3.5 hover:bg-white/10 transition-colors card-lift cursor-pointer space-y-1"
                  >
                    <div className="text-xs uppercase font-semibold text-[#8A8A84] tracking-wider">
                      Price Anomaly
                    </div>
                    <div className="text-lg font-medium text-white mt-1 tnum">
                      {priceAnomaly.amount > 0 ? formatCompactINR(priceAnomaly.amount) : '₹0'}
                    </div>
                    <div className="text-xs text-[#73C69A] mt-0.5 font-mono">
                      {priceAnomaly.count} {priceAnomaly.count === 1 ? 'transaction' : 'transactions'}
                    </div>
                  </div>

                  {/* Mini-Panel 2: Supplier Frag. / Missed Discounts */}
                  <div
                    onClick={() => onNavigate && onNavigate('suppliers')}
                    className="rounded-2xl bg-white/5 border border-white/10 p-3.5 hover:bg-white/10 transition-colors card-lift cursor-pointer space-y-1"
                  >
                    <div className="text-xs uppercase font-semibold text-[#8A8A84] tracking-wider">
                      Supplier Frag.
                    </div>
                    <div className="text-lg font-medium text-white mt-1 tnum">
                      {supplierFrag.amount > 0
                        ? formatCompactINR(supplierFrag.amount)
                        : missedDiscounts.amount > 0
                        ? formatCompactINR(missedDiscounts.amount)
                        : supplierFrag.count > 0
                        ? `${supplierFrag.count} SKUs`
                        : '₹0'}
                    </div>
                    <div className="text-xs text-[#8A8A84] mt-0.5 font-mono">
                      {supplierFrag.count > 0
                        ? `${supplierFrag.count} fragmented lines`
                        : missedDiscounts.count > 0
                        ? `${missedDiscounts.count} missed discounts`
                        : '0 split vendors'}
                    </div>
                  </div>

                  {/* Mini-Panel 3: Duplicates */}
                  <div
                    onClick={() => onNavigate && onNavigate('leakage')}
                    className="rounded-2xl bg-white/5 border border-white/10 p-3.5 hover:bg-white/10 transition-colors card-lift cursor-pointer space-y-1"
                  >
                    <div className="text-xs uppercase font-semibold text-[#8A8A84] tracking-wider">
                      Duplicates
                    </div>
                    <div className="text-lg font-medium text-white mt-1 tnum">
                      {duplicates.amount > 0 ? formatCompactINR(duplicates.amount) : '₹0'}
                    </div>
                    <div className="text-xs text-[#D96B4A] mt-0.5 font-mono">
                      {duplicates.count} {duplicates.count === 1 ? 'flag' : 'flags'}
                    </div>
                  </div>
                </div>

                {/* Floating Recovery Opportunity Panel - Dynamic from Active Dataset */}
                <div className="rounded-2xl bg-gradient-to-r from-white/[0.08] to-white/[0.03] border border-[#73C69A]/30 p-4 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="text-xs font-sans text-[#8A8A84] flex items-center gap-1.5">
                      <span>Potential Recovery Opportunity</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#73C69A]" />
                    </div>
                    {hasRecoveryOpportunity ? (
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-medium text-white tnum">
                          {formatCompactINR(recoveryAmount)}
                        </span>
                        <span className="text-xs font-semibold text-[#73C69A] tnum">
                          +{recoveryVariancePct.toFixed(2)}% savings
                        </span>
                      </div>
                    ) : (
                      <div className="text-xs text-[#8A8A84] pt-0.5">
                        Simulate alternative supplier rates & volume discounts
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      if (hasRecoveryOpportunity && topFindingRef && onInvestigateFinding) {
                        onInvestigateFinding(topFindingRef);
                      } else if (onNavigate) {
                        onNavigate('simulator');
                      }
                    }}
                    className="h-9 px-4 rounded-xl bg-[#73C69A] hover:bg-[#85d3aa] text-[#0A0A0A] text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm shrink-0"
                  >
                    <span>{hasRecoveryOpportunity ? 'Inspect' : 'Calculate'}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
