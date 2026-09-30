import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { VarianceBucketItem } from './analyticsUtils';
import { ProcurementChartTooltip } from './ProcurementChartTooltip';
import { formatCompactINR, formatINR } from '../../../utils/formatters';

interface VarianceDistributionChartProps {
  buckets: VarianceBucketItem[];
  selectedBucket?: string | null;
  onSelectBucket?: (bucketRange: string) => void;
}

export const VarianceDistributionChart: React.FC<VarianceDistributionChartProps> = ({
  buckets,
  selectedBucket,
  onSelectBucket,
}) => {
  return (
    <div className="bg-white rounded-[24px] border border-[#E8E8E3] p-6 sm:p-8 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F0F0EB]">
        <div>
          <span className="text-[10px] uppercase font-semibold text-[#8A8A84] tracking-wider block">
            Graph 6 · Price Premium Spread
          </span>
          <h3 className="text-base sm:text-lg font-medium text-[#111111]">
            Price Variance Distribution
          </h3>
          <p className="text-xs text-[#5E5E5A]">
            Histogram of unit rate differentials grouped into 5-percentage-point tiers.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono text-[#8A8A84]">
          <span>5 Standard Tiers</span>
          <span>•</span>
          <span>Calculated from active unit rates</span>
        </div>
      </div>

      <div className="h-64 sm:h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={buckets}
            margin={{ top: 12, right: 16, left: 16, bottom: 12 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F0EB" vertical={false} />
            <XAxis
              dataKey="range"
              stroke="#8A8A84"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#111111' }}
            />
            <YAxis
              stroke="#8A8A84"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}`}
              tick={{ fill: '#8A8A84' }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || payload.length === 0) return null;
                const item = payload[0].payload as VarianceBucketItem;
                return (
                  <ProcurementChartTooltip
                    active={active}
                    title={`Variance Band: ${item.range}`}
                    items={[
                      { label: 'Transaction Count', value: `${item.count} items (${item.percentage}%)` },
                      { label: 'Potential Leakage', value: item.potentialLeakage, isCurrency: true, color: '#D96B4A' },
                    ]}
                  />
                );
              }}
            />
            <Bar
              dataKey="count"
              name="Transactions"
              fill="#111111"
              radius={[6, 6, 0, 0]}
              onClick={(entry: any) => onSelectBucket?.(entry?.range || entry?.payload?.range)}
              className="cursor-pointer"
            >
              {buckets.map((entry, index) => {
                const isSelected = selectedBucket === entry.range;
                // Color ramp: low variance is subtle, >20% is warning terracotta
                const barColor =
                  entry.min >= 20 ? '#D96B4A' :
                  entry.min >= 15 ? '#E5A93C' :
                  entry.min >= 10 ? '#5E81AC' :
                  '#111111';

                return (
                  <Cell
                    key={`bucket-${index}`}
                    fill={isSelected ? '#73C69A' : barColor}
                    opacity={selectedBucket && !isSelected ? 0.35 : 1}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 border-t border-[#F0F0EB]">
        {buckets.map((b) => (
          <div
            key={b.range}
            onClick={() => onSelectBucket?.(b.range)}
            className="p-2.5 rounded-xl bg-[#FAFAF8] border border-[#F0F0EB] hover:bg-[#F5F5F2] cursor-pointer transition-colors"
          >
            <div className="text-[10px] font-mono font-medium text-[#8A8A84]">{b.range}</div>
            <div className="text-sm font-sans font-medium text-[#111111] mt-0.5 tnum">
              {b.count} <span className="text-[10px] text-[#8A8A84] font-normal">({b.percentage}%)</span>
            </div>
            <div className="text-[10px] text-[#D96B4A] font-mono mt-0.5 truncate">
              {formatCompactINR(b.potentialLeakage)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
