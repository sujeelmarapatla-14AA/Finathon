import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { SpendComparisonData, TimeSeriesPoint } from './analyticsUtils';
import { ProcurementChartTooltip } from './ProcurementChartTooltip';
import { formatCompactINR, formatINR } from '../../../utils/formatters';
import { Calendar, AlertCircle } from 'lucide-react';

interface SpendComparisonAndTrendProps {
  spendComparison: SpendComparisonData;
  timeSeries: {
    hasValidDates: boolean;
    points: TimeSeriesPoint[];
    unavailabilityReason?: string;
  };
}

export const SpendComparisonAndTrend: React.FC<SpendComparisonAndTrendProps> = ({
  spendComparison,
  timeSeries,
}) => {
  const [metricView, setMetricView] = useState<'spend' | 'leakage'>('spend');

  const overrunPct = spendComparison.referenceSpend > 0
    ? ((spendComparison.difference / spendComparison.referenceSpend) * 100).toFixed(2)
    : '0.00';

  const spendRatio = spendComparison.actualSpend > 0
    ? Math.min(100, Math.round((spendComparison.referenceSpend / spendComparison.actualSpend) * 100))
    : 100;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* GRAPH 8: Actual Spend vs Reference Spend */}
      <div className="lg:col-span-5 bg-[#F3F3F1] rounded-[24px] border border-[#151515]/10 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="pb-3 border-b border-[#151515]/10">
          <span className="text-[10px] uppercase font-semibold text-[#151515]/50 tracking-wider block">
            Graph 8 · Baseline Reconciliation
          </span>
          <h3 className="text-base sm:text-lg font-medium text-[#151515]">
            Actual Spend vs Reference Spend
          </h3>
          <p className="text-xs text-[#151515]/60">
            Cumulative commitment compared with contract benchmark baseline.
          </p>
        </div>

        <div className="space-y-4">
          {/* Actual Spend Block */}
          <div className="p-4 rounded-2xl bg-[#151515]/5 border border-[#151515]/10 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#151515] uppercase tracking-wider text-[10px]">
                Actual Procurement Spend
              </span>
              <span className="font-mono text-[10px] text-[#151515]/60">Invoiced total</span>
            </div>
            <div className="text-2xl sm:text-3xl font-sans font-medium text-[#151515] tnum">
              {formatINR(spendComparison.actualSpend)}
            </div>
            <div className="text-[11px] text-[#151515]/50">
              {formatCompactINR(spendComparison.actualSpend)} total commitment
            </div>
          </div>

          {/* Reference Spend Block */}
          <div className="p-4 rounded-2xl bg-[#151515]/5 border border-[#151515]/10 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#B8A47A] uppercase tracking-wider text-[10px]">
                Reference Target Baseline
              </span>
              <span className="font-mono text-[10px] text-[#B8A47A]">Benchmark rate</span>
            </div>
            <div className="text-2xl sm:text-3xl font-sans font-medium text-[#B8A47A] tnum">
              {formatINR(spendComparison.referenceSpend)}
            </div>
            <div className="text-[11px] text-[#151515]/50">
              {formatCompactINR(spendComparison.referenceSpend)} expected benchmark value
            </div>
          </div>

          {/* Visual Overrun Proportion Bar */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#151515]/50">Baseline Proportion</span>
              <span className="text-[#B8A47A] font-semibold">+{overrunPct}% Overrun</span>
            </div>
            <div className="w-full h-3 rounded-full bg-[#B8A47A]/20 overflow-hidden flex">
              <div
                className="h-full bg-[#151515] rounded-full transition-all duration-700"
                style={{ width: `${spendRatio}%` }}
                title={`Reference spend: ${spendRatio}%`}
              />
              <div
                className="h-full bg-[#B8A47A] transition-all duration-700"
                style={{ width: `${100 - spendRatio}%` }}
                title={`Price leakage overrun: ${100 - spendRatio}%`}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-[#151515]/50 font-mono">
              <span>● Reference ({spendRatio}%)</span>
              <span>● Spend Variance ({100 - spendRatio}%)</span>
            </div>
          </div>

          {/* Variance Net Difference Callout */}
          <div className="p-3.5 rounded-xl bg-[#B8A47A]/15 border border-[#B8A47A]/30 flex items-center justify-between">
            <span className="text-xs font-medium text-[#151515]">Net Difference:</span>
            <span className="text-sm font-mono font-semibold text-[#B8A47A] tnum">
              +{formatINR(spendComparison.difference)}
            </span>
          </div>
        </div>
      </div>

      {/* TIME SERIES: Procurement Spend Trend */}
      <div className="lg:col-span-7 bg-[#F3F3F1] rounded-[24px] border border-[#151515]/10 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#151515]/10">
          <div>
            <span className="text-[10px] uppercase font-semibold text-[#151515]/50 tracking-wider block">
              Time Analysis · Spend Dynamics
            </span>
            <h3 className="text-base sm:text-lg font-medium text-[#151515]">
              Procurement Spend Trend
            </h3>
            <p className="text-xs text-[#151515]/60">
              Historical timeline tracing purchase commitment and variance accumulation.
            </p>
          </div>

          {timeSeries.hasValidDates && (
            <div className="flex items-center bg-[#151515]/5 p-1 rounded-full border border-[#151515]/10 text-xs">
              <button
                onClick={() => setMetricView('spend')}
                className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all ${
                  metricView === 'spend'
                    ? 'bg-[#151515] text-[#F3F3F1] shadow-xs font-semibold'
                    : 'text-[#151515]/70 hover:text-[#151515]'
                }`}
              >
                Spend vs Reference
              </button>
              <button
                onClick={() => setMetricView('leakage')}
                className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all ${
                  metricView === 'leakage'
                    ? 'bg-[#151515] text-[#F3F3F1] shadow-xs font-semibold'
                    : 'text-[#151515]/70 hover:text-[#151515]'
                }`}
              >
                Leakage Trend
              </button>
            </div>
          )}
        </div>

        {timeSeries.hasValidDates ? (
          <div className="h-72 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={timeSeries.points}
                margin={{ top: 12, right: 16, left: 16, bottom: 8 }}
              >
                <defs>
                  <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#151515" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#151515" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="refGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#B8A47A" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#B8A47A" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="leakageGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#B8A47A" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#B8A47A" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(21,21,21,0.08)" vertical={false} />
                <XAxis
                  dataKey="dateStr"
                  stroke="rgba(21,21,21,0.4)"
                  fontSize={10}
                  tickLine={false}
                />
                <YAxis
                  stroke="rgba(21,21,21,0.4)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => formatCompactINR(v)}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || payload.length === 0) return null;
                    const item = payload[0].payload as TimeSeriesPoint;
                    return (
                      <ProcurementChartTooltip
                        active={active}
                        title={`Date: ${item.dateStr}`}
                        items={[
                          { label: 'Actual Spend', value: item.actualSpend, isCurrency: true, color: '#151515' },
                          { label: 'Reference Baseline', value: item.referenceSpend, isCurrency: true, color: 'rgba(21,21,21,0.5)' },
                          { label: 'Potential Leakage', value: item.potentialLeakage, isCurrency: true, color: '#B8A47A' },
                          { label: 'Transactions', value: `${item.transactionCount} POs` },
                        ]}
                      />
                    );
                  }}
                />
                {metricView === 'spend' ? (
                  <>
                    <Area
                      type="monotone"
                      dataKey="actualSpend"
                      name="Actual Spend"
                      stroke="#151515"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#spendGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="referenceSpend"
                      name="Reference Baseline"
                      stroke="rgba(21,21,21,0.5)"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#refGrad)"
                    />
                  </>
                ) : (
                  <Area
                    type="monotone"
                    dataKey="potentialLeakage"
                    name="Potential Leakage"
                    stroke="#B8A47A"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#leakageGrad)"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          /* Graceful Fallback */
          <div className="h-72 rounded-2xl bg-[#151515]/5 border border-dashed border-[#151515]/20 flex flex-col items-center justify-center p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#F3F3F1] border border-[#151515]/10 flex items-center justify-center shadow-xs text-[#151515]/50">
              <Calendar className="w-5 h-5 text-[#151515]/50" />
            </div>
            <div className="space-y-1 max-w-sm">
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#151515]/60">
                TIME ANALYSIS UNAVAILABLE
              </span>
              <p className="text-xs text-[#151515]/60">
                {timeSeries.unavailabilityReason || 'No valid transaction dates were provided in the active dataset.'}
              </p>
            </div>
            <span className="text-[10px] font-mono text-[#151515]/50">
              Timelines activate automatically when date-stamped records are ingested.
            </span>
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-[#151515]/50 font-mono pt-1">
          <span>Active dataset temporal reconciliation</span>
          <span>{timeSeries.hasValidDates ? `${timeSeries.points.length} timestamps` : 'Static audit mode'}</span>
        </div>
      </div>
    </div>
  );
};
