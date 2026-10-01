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
    <div className="bg-[#F3F3F1] rounded-[24px] border border-[#151515]/10 p-6 sm:p-8 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#151515]/10">
        <div>
          <span className="text-[10px] uppercase font-semibold text-[#151515]/50 tracking-wider block">
            Graph 6 · Price Premium Spread
          </span>
          <h3 className="text-base sm:text-lg font-medium text-[#151515]">
            Price Variance Distribution
          </h3>
          <p className="text-xs text-[#151515]/60">
            Histogram of unit rate differentials grouped into 5-percentage-point tiers.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono text-[#151515]/50">
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
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(21,21,21,0.08)" vertical={false} />
            <XAxis
              dataKey="range"
              stroke="rgba(21,21,21,0.4)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#151515' }}
            />
            <YAxis
              stroke="rgba(21,21,21,0.4)"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}`}
              tick={{ fill: 'rgba(21,21,21,0.5)' }}
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
                      { label: 'Potential Leakage', value: item.potentialLeakage, isCurrency: true, color: '#B8A47A' },
                    ]}
                  />
                );
              }}
            />
            <Bar
              dataKey="count"
              name="Transactions"
              fill="#151515"
              radius={[6, 6, 0, 0]}
              onClick={(entry: any) => onSelectBucket?.(entry?.range || entry?.payload?.range)}
              className="cursor-pointer"
            >
              {buckets.map((entry, index) => {
                const isSelected = selectedBucket === entry.range;
                const barColor =
                  entry.min >= 20 ? '#B8A47A' :
                  entry.min >= 15 ? 'rgba(184,164,122,0.8)' :
                  entry.min >= 10 ? '#151515' :
                  entry.min >= 5 ? 'rgba(21,21,21,0.6)' :
                  'rgba(21,21,21,0.3)';

                return (
                  <Cell
                    key={`bucket-${index}`}
                    fill={isSelected ? '#B8A47A' : barColor}
                    opacity={selectedBucket && !isSelected ? 0.35 : 1}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 border-t border-[#151515]/10">
        {buckets.map((b) => (
          <div
            key={b.range}
            onClick={() => onSelectBucket?.(b.range)}
            className="p-2.5 rounded-xl bg-[#151515]/5 border border-[#151515]/10 hover:bg-[#151515]/10 cursor-pointer transition-colors"
          >
            <div className="text-[10px] font-mono font-medium text-[#151515]/50">{b.range}</div>
            <div className="text-sm font-sans font-medium text-[#151515] mt-0.5 tnum">
              {b.count} <span className="text-[10px] text-[#151515]/50 font-normal">({b.percentage}%)</span>
            </div>
            <div className="text-[10px] text-[#B8A47A] font-mono mt-0.5 truncate">
              {formatCompactINR(b.potentialLeakage)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
