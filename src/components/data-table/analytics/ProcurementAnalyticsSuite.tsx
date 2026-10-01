import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ProcurementAnalytics } from './analyticsUtils';
import { AnalyticsKpiBar } from './AnalyticsKpiBar';
import { ActualVsBenchmarkChart } from './ActualVsBenchmarkChart';
import { SupplierAndProductLeakageCharts } from './SupplierAndProductLeakageCharts';
import { RiskAndAlertDistributionCharts } from './RiskAndAlertDistributionCharts';
import { VarianceDistributionChart } from './VarianceDistributionChart';
import { QuantityVsLeakageAndTopTransactions } from './QuantityVsLeakageAndTopTransactions';
import { SpendComparisonAndTrend } from './SpendComparisonAndTrend';
import { DataSource } from '../../../types';
import { CUBIC_EASE } from '../../layout/PageTransition';
import { X, Filter, RefreshCw, BarChart2 } from 'lucide-react';

interface ActiveFilterChip {
  type: 'supplier' | 'product' | 'risk' | 'alert' | 'bucket';
  label: string;
  value: string;
}

interface ProcurementAnalyticsSuiteProps {
  analytics: ProcurementAnalytics;
  source: DataSource;
  selectedSupplier?: string | null;
  selectedProduct?: string | null;
  selectedRisk?: string | null;
  selectedAlertType?: string | null;
  selectedBucket?: string | null;
  onSelectSupplier?: (supplier: string) => void;
  onSelectProduct?: (product: string) => void;
  onSelectRisk?: (risk: string) => void;
  onSelectAlertType?: (alertType: string) => void;
  onSelectBucket?: (bucket: string) => void;
  onClearInteractiveFilter?: (type: 'supplier' | 'product' | 'risk' | 'alert' | 'bucket') => void;
  onClearAllInteractiveFilters?: () => void;
  onInvestigateTransaction?: (transactionId: string) => void;
  isLoading?: boolean;
}

export const ProcurementAnalyticsSuite: React.FC<ProcurementAnalyticsSuiteProps> = ({
  analytics,
  source,
  selectedSupplier,
  selectedProduct,
  selectedRisk,
  selectedAlertType,
  selectedBucket,
  onSelectSupplier,
  onSelectProduct,
  onSelectRisk,
  onSelectAlertType,
  onSelectBucket,
  onClearInteractiveFilter,
  onClearAllInteractiveFilters,
  onInvestigateTransaction,
  isLoading,
}) => {
  const shouldReduceMotion = useReducedMotion();

  // Active filter chips list
  const activeChips: ActiveFilterChip[] = [];
  if (selectedSupplier) activeChips.push({ type: 'supplier', label: `Vendor: ${selectedSupplier}`, value: selectedSupplier });
  if (selectedProduct) activeChips.push({ type: 'product', label: `Product: ${selectedProduct}`, value: selectedProduct });
  if (selectedRisk) activeChips.push({ type: 'risk', label: `Risk: ${selectedRisk}`, value: selectedRisk });
  if (selectedAlertType) activeChips.push({ type: 'alert', label: `Rule: ${selectedAlertType.replace(/_/g, ' ')}`, value: selectedAlertType });
  if (selectedBucket) activeChips.push({ type: 'bucket', label: `Variance: ${selectedBucket}`, value: selectedBucket });

  const hasInteractiveFilters = activeChips.length > 0;

  const displaySourceLabel =
    source === 'nova' ? 'LIVE NOVA' :
    source === 'upload' ? 'UPLOADED DATA' :
    source === 'manual' ? 'MANUAL DATA' :
    'DEMO DATASET';

  if (isLoading) {
    return (
      <div className="bg-[#F3F3F1] rounded-[28px] border border-[#151515]/10 p-12 text-center shadow-sm space-y-4">
        <RefreshCw className="w-6 h-6 animate-spin text-[#B8A47A] mx-auto" />
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-[#151515]">UPDATING PROCUREMENT ANALYTICS...</h4>
          <p className="text-xs text-[#151515]/60">Synchronizing visualizations with active data source.</p>
        </div>
      </div>
    );
  }

  return (
    <motion.section
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, ease: CUBIC_EASE }}
      className="space-y-10"
    >
      {/* Analytics Suite Section Header & Interactive Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#151515] flex items-center justify-center text-[#F3F3F1] border border-[#B8A47A]/30">
            <BarChart2 className="w-4 h-4 text-[#B8A47A]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-sans font-medium text-[#151515]">
                Procurement Intelligence Analytics
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#151515]/5 border border-[#151515]/10 text-[10px] font-mono font-semibold text-[#151515] shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#B8A47A] shadow-[0_0_6px_rgba(184,164,122,0.8)]" />
                <span>{displaySourceLabel}</span>
              </span>
            </div>
            <p className="text-xs text-[#151515]/60 mt-0.5">
              Interactive deterministic visual discovery linked directly to audit line items below.
            </p>
          </div>
        </div>

        {/* Active Chart Filter Badges */}
        {hasInteractiveFilters && (
          <div className="flex flex-wrap items-center gap-2 bg-[#F3F3F1] px-3 py-1.5 rounded-full border border-[#151515]/10 shadow-xs">
            <span className="text-[10px] font-mono text-[#151515]/50 flex items-center gap-1">
              <Filter className="w-3 h-3 text-[#151515]" /> Filtered:
            </span>
            {activeChips.map((chip) => (
              <span
                key={chip.type}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#151515] text-[#F3F3F1] text-[11px] font-sans font-medium"
              >
                <span>{chip.label}</span>
                <button
                  onClick={() => onClearInteractiveFilter?.(chip.type)}
                  className="hover:text-[#B8A47A] transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <button
              onClick={onClearAllInteractiveFilters}
              className="text-[10px] font-mono text-[#B8A47A] hover:underline px-1"
            >
              Reset
            </button>
          </div>
        )}
      </div>

      {/* 1. TOP KEY METRICS */}
      <AnalyticsKpiBar kpis={analytics.kpis} />

      {/* 2. GRAPH 1: ACTUAL VS BENCHMARK PRICE */}
      <ActualVsBenchmarkChart
        data={analytics.actualVsBenchmark}
        selectedProduct={selectedProduct}
        onSelectProduct={onSelectProduct}
      />

      {/* 3. GRAPHS 2 & 3: SUPPLIER LEAKAGE + PRODUCT LEAKAGE */}
      <SupplierAndProductLeakageCharts
        suppliers={analytics.supplierLeakage}
        products={analytics.productLeakage}
        selectedSupplier={selectedSupplier}
        selectedProduct={selectedProduct}
        onSelectSupplier={onSelectSupplier}
        onSelectProduct={onSelectProduct}
      />

      {/* 4. GRAPHS 4 & 5: RISK DISTRIBUTION + ALERT TYPE */}
      <RiskAndAlertDistributionCharts
        riskData={analytics.riskDistribution}
        alertData={analytics.alertTypeDistribution}
        totalAlertsCount={analytics.totalAlertsCount}
        selectedRisk={selectedRisk}
        selectedAlertType={selectedAlertType}
        onSelectRisk={onSelectRisk}
        onSelectAlertType={onSelectAlertType}
      />

      {/* 5. GRAPH 6: PRICE VARIANCE DISTRIBUTION */}
      <VarianceDistributionChart
        buckets={analytics.varianceDistribution}
        selectedBucket={selectedBucket}
        onSelectBucket={onSelectBucket}
      />

      {/* 6. GRAPHS 7 & 9: QUANTITY VS LEAKAGE + TOP TRANSACTIONS */}
      <QuantityVsLeakageAndTopTransactions
        scatterData={analytics.quantityLeakage}
        topTransactions={analytics.topTransactions}
        onInvestigateTransaction={onInvestigateTransaction}
      />

      {/* 7. GRAPH 8 & TIME SERIES: ACTUAL VS REFERENCE SPEND + PROCUREMENT TREND */}
      <SpendComparisonAndTrend
        spendComparison={analytics.spendComparison}
        timeSeries={analytics.timeSeries}
      />
    </motion.section>
  );
};
