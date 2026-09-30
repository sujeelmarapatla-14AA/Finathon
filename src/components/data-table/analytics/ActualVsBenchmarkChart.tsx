import React, { useState } from 'react';
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
import { ActualVsBenchmarkItem } from './analyticsUtils';
import { ProcurementChartTooltip } from './ProcurementChartTooltip';
import { formatCompactINR, formatINR } from '../../../utils/formatters';

interface ActualVsBenchmarkChartProps {
  data: ActualVsBenchmarkItem[];
  selectedProduct?: string | null;
  onSelectProduct?: (product: string) => void;
}

export const ActualVsBenchmarkChart: React.FC<ActualVsBenchmarkChartProps> = ({
  data,
  selectedProduct,
  onSelectProduct,
}) => {
  const [viewAll, setViewAll] = useState<boolean>(false);

  const displayData = viewAll ? data : data.slice(0, 10);

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-[24px] border border-[#E8E8E3] p-8 text-center text-[#8A8A84] text-xs">
        No product price variance data available for current selection.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[24px] border border-[#E8E8E3] p-6 sm:p-8 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F0F0EB]">
        <div>
          <span className="text-[10px] uppercase font-semibold text-[#8A8A84] tracking-wider block">
            Graph 1 · Price Variance Analysis
          </span>
          <h3 className="text-base sm:text-lg font-medium text-[#111111]">
            Actual vs Benchmark Unit Price
          </h3>
          <p className="text-xs text-[#5E5E5A]">
            Comparing invoiced purchase rates against established contract rate card baselines.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {data.length > 10 && (
            <button
              onClick={() => setViewAll(!viewAll)}
              className="text-xs px-3 py-1 rounded-full border border-[#E8E8E3] text-[#5E5E5A] hover:text-[#111111] hover:bg-[#FAFAF8] transition-colors"
            >
              {viewAll ? 'Show Top 10' : `View All (${data.length})`}
            </button>
          )}

          <div className="flex items-center gap-3 text-[11px] font-mono pl-2">
            <span className="flex items-center gap-1.5 text-[#111111]">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#111111]" />
              Actual Price
            </span>
            <span className="flex items-center gap-1.5 text-[#73C69A]">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#73C69A]" />
              Benchmark Rate
            </span>
          </div>
        </div>
      </div>

      <div className="h-80 sm:h-96 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={displayData}
            margin={{ top: 12, right: 12, left: 16, bottom: 48 }}
            barGap={4}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F0EB" vertical={false} />
            <XAxis
              dataKey="product"
              stroke="#8A8A84"
              fontSize={10}
              tickLine={false}
              interval={0}
              angle={-25}
              textAnchor="end"
              height={50}
              tick={{ fill: '#5E5E5A' }}
            />
            <YAxis
              stroke="#8A8A84"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => formatCompactINR(v)}
              tick={{ fill: '#8A8A84' }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || payload.length === 0) return null;
                const item = payload[0].payload as ActualVsBenchmarkItem;
                return (
                  <ProcurementChartTooltip
                    active={active}
                    title={item.product}
                    items={[
                      { label: 'Actual Unit Price', value: item.actualPrice, isCurrency: true, color: '#111111' },
                      { label: 'Benchmark Price', value: item.benchmarkPrice, isCurrency: true, color: '#73C69A' },
                      { label: 'Difference / Unit', value: `${item.diffPerUnit >= 0 ? '+' : ''}${formatINR(item.diffPerUnit)}`, color: item.diffPerUnit > 0 ? '#D96B4A' : '#73C69A' },
                      { label: 'Variance %', value: `${item.variancePercent >= 0 ? '+' : ''}${item.variancePercent.toFixed(2)}%` },
                      { label: 'Total Quantity', value: `${item.totalQuantity.toLocaleString('en-IN')} units` },
                      { label: 'Potential Leakage', value: item.potentialLeakage, isCurrency: true, color: '#D96B4A' },
                    ]}
                  />
                );
              }}
            />
            <Bar
              dataKey="actualPrice"
              name="Actual Unit Price"
              fill="#111111"
              radius={[4, 4, 0, 0]}
              onClick={(entry: any) => onSelectProduct?.(entry?.product || entry?.payload?.product)}
              className="cursor-pointer"
            >
              {displayData.map((entry, index) => {
                const isSelected = selectedProduct === entry.product;
                return (
                  <Cell
                    key={`actual-${index}`}
                    fill={isSelected ? '#5E81AC' : '#111111'}
                    opacity={selectedProduct && !isSelected ? 0.4 : 1}
                  />
                );
              })}
            </Bar>
            <Bar
              dataKey="benchmarkPrice"
              name="Benchmark Unit Price"
              fill="#73C69A"
              radius={[4, 4, 0, 0]}
              onClick={(entry: any) => onSelectProduct?.(entry?.product || entry?.payload?.product)}
              className="cursor-pointer"
            >
              {displayData.map((entry, index) => {
                const isSelected = selectedProduct === entry.product;
                return (
                  <Cell
                    key={`bench-${index}`}
                    fill={isSelected ? '#5E81AC' : '#73C69A'}
                    opacity={selectedProduct && !isSelected ? 0.4 : 1}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between text-[11px] text-[#8A8A84] font-mono pt-2">
        <span>Click any product bar to filter the procurement transaction table.</span>
        <span>Showing {displayData.length} of {data.length} products</span>
      </div>
    </div>
  );
};
