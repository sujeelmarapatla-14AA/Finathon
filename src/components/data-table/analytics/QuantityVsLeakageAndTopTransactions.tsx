import React from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import { QuantityLeakagePoint, TopTransactionItem, RISK_COLORS } from './analyticsUtils';
import { ProcurementChartTooltip } from './ProcurementChartTooltip';
import { formatCompactINR, formatINR } from '../../../utils/formatters';
import { ChevronRight } from 'lucide-react';

interface QuantityVsLeakageAndTopTransactionsProps {
  scatterData: QuantityLeakagePoint[];
  topTransactions: TopTransactionItem[];
  onInvestigateTransaction?: (transactionId: string) => void;
}

export const QuantityVsLeakageAndTopTransactions: React.FC<QuantityVsLeakageAndTopTransactionsProps> = ({
  scatterData,
  topTransactions,
  onInvestigateTransaction,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* GRAPH 7: Quantity vs Potential Leakage (Scatter Chart) */}
      <div className="lg:col-span-7 bg-white rounded-[24px] border border-[#E8E8E3] p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#F0F0EB]">
          <div>
            <span className="text-[10px] uppercase font-semibold text-[#8A8A84] tracking-wider block">
              Graph 7 · Exposure Sensitivity
            </span>
            <h3 className="text-base sm:text-lg font-medium text-[#111111]">
              Quantity vs Potential Leakage
            </h3>
            <p className="text-xs text-[#5E5E5A]">
              Volume concentration plot mapping purchase quantities to financial exposure.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono">
            <span className="flex items-center gap-1 text-[#D96B4A]">
              <span className="w-2 h-2 rounded-full bg-[#D96B4A]" /> High
            </span>
            <span className="flex items-center gap-1 text-[#E5A93C]">
              <span className="w-2 h-2 rounded-full bg-[#E5A93C]" /> Medium
            </span>
            <span className="flex items-center gap-1 text-[#73C69A]">
              <span className="w-2 h-2 rounded-full bg-[#73C69A]" /> Low
            </span>
          </div>
        </div>

        {scatterData.length === 0 ? (
          <div className="py-20 text-center text-xs text-[#8A8A84]">
            No transaction data available for current filter.
          </div>
        ) : (
          <div className="h-72 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 12, right: 20, left: 16, bottom: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0EB" />
                <XAxis
                  type="number"
                  dataKey="quantity"
                  name="Quantity"
                  stroke="#8A8A84"
                  fontSize={10}
                  tickLine={false}
                  label={{ value: 'Procured Units', position: 'insideBottom', offset: -8, fill: '#8A8A84', fontSize: 10 }}
                />
                <YAxis
                  type="number"
                  dataKey="potentialLeakage"
                  name="Potential Leakage"
                  stroke="#8A8A84"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => formatCompactINR(v)}
                />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3', stroke: '#8A8A84' }}
                  content={({ active, payload }) => {
                    if (!active || !payload || payload.length === 0) return null;
                    const item = payload[0].payload as QuantityLeakagePoint;
                    return (
                      <ProcurementChartTooltip
                        active={active}
                        title={`Transaction ${item.transactionId}`}
                        items={[
                          { label: 'Supplier', value: item.supplier },
                          { label: 'Product', value: item.product },
                          { label: 'Quantity', value: `${item.quantity.toLocaleString('en-IN')} units` },
                          { label: 'Actual Price', value: item.actualPrice, isCurrency: true },
                          { label: 'Benchmark', value: item.benchmarkPrice, isCurrency: true },
                          { label: 'Potential Leakage', value: item.potentialLeakage, isCurrency: true, color: '#D96B4A' },
                          { label: 'Risk Rating', value: item.risk, color: RISK_COLORS[item.risk] },
                        ]}
                      />
                    );
                  }}
                />
                <Scatter
                  data={scatterData}
                  onClick={(entry: any) => {
                    const txId = entry?.transactionId || entry?.payload?.transactionId;
                    if (txId) onInvestigateTransaction?.(txId);
                  }}
                  className="cursor-pointer"
                >
                  {scatterData.map((entry, index) => (
                    <Cell
                      key={`scatter-cell-${index}`}
                      fill={RISK_COLORS[entry.risk] || '#D96B4A'}
                      fillOpacity={0.8}
                      stroke="#FFFFFF"
                      strokeWidth={1}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-[#8A8A84] font-mono pt-1">
          <span>Click any point to open comprehensive line-item investigation</span>
          <span>{scatterData.length} plotted transactions</span>
        </div>
      </div>

      {/* GRAPH 9: Top Transactions by Potential Leakage */}
      <div className="lg:col-span-5 bg-white rounded-[24px] border border-[#E8E8E3] p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#F0F0EB]">
          <div>
            <span className="text-[10px] uppercase font-semibold text-[#8A8A84] tracking-wider block">
              Graph 9 · Priority Triage
            </span>
            <h3 className="text-base sm:text-lg font-medium text-[#111111]">
              Top Transactions by Leakage
            </h3>
            <p className="text-xs text-[#5E5E5A]">
              Highest single-transaction financial leakage ready for recovery.
            </p>
          </div>
          <span className="text-[11px] font-mono text-[#D96B4A] bg-[#D96B4A]/10 px-2.5 py-1 rounded-full border border-[#D96B4A]/20">
            Top {topTransactions.length}
          </span>
        </div>

        {topTransactions.length === 0 ? (
          <div className="py-20 text-center text-xs text-[#8A8A84]">
            No leakage-generating transactions found.
          </div>
        ) : (
          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {topTransactions.map((tx) => (
              <div
                key={tx.transactionId}
                onClick={() => onInvestigateTransaction?.(tx.transactionId)}
                className="p-3 rounded-xl bg-[#FAFAF8] border border-[#F0F0EB] hover:bg-[#F5F5F2] hover:border-[#E8E8E3] transition-all cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-[#111111]">
                      {tx.transactionId}
                    </span>
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: RISK_COLORS[tx.risk] || '#D96B4A' }}
                    />
                    <span className="text-[10px] font-mono text-[#D96B4A]">
                      +{tx.variancePercent.toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-[11px] text-[#5E5E5A] truncate mt-0.5" title={`${tx.product} · ${tx.supplier}`}>
                    {tx.product} <span className="text-[#8A8A84]">·</span> {tx.supplier}
                  </div>
                </div>

                <div className="text-right shrink-0 flex items-center gap-2">
                  <div>
                    <div className="text-xs font-mono font-medium text-[#111111] tnum">
                      {formatINR(tx.potentialLeakage)}
                    </div>
                    <div className="text-[10px] text-[#8A8A84]">
                      {tx.quantity} units
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#8A8A84] group-hover:text-[#111111] group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-[#8A8A84] font-mono pt-1">
          <span>Click item to launch AI Investigation</span>
          <span>Ranked by canonical exposure</span>
        </div>
      </div>
    </div>
  );
};
