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
      <div className="lg:col-span-7 bg-[#F3F3F1] rounded-[24px] border border-[#151515]/10 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#151515]/10">
          <div>
            <span className="text-[10px] uppercase font-semibold text-[#151515]/50 tracking-wider block">
              Graph 7 · Exposure Sensitivity
            </span>
            <h3 className="text-base sm:text-lg font-medium text-[#151515]">
              Quantity vs Potential Leakage
            </h3>
            <p className="text-xs text-[#151515]/60">
              Volume concentration plot mapping purchase quantities to financial exposure.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono">
            <span className="flex items-center gap-1 text-[#B8A47A]">
              <span className="w-2 h-2 rounded-full bg-[#B8A47A]" /> Critical / High
            </span>
            <span className="flex items-center gap-1 text-[#151515]/70">
              <span className="w-2 h-2 rounded-full bg-[#151515]/60" /> Medium
            </span>
            <span className="flex items-center gap-1 text-[#151515]/40">
              <span className="w-2 h-2 rounded-full bg-[#151515]/30" /> Low
            </span>
          </div>
        </div>

        {scatterData.length === 0 ? (
          <div className="py-20 text-center text-xs text-[#151515]/50">
            No transaction data available for current filter.
          </div>
        ) : (
          <div className="h-72 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 12, right: 20, left: 16, bottom: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(21,21,21,0.08)" />
                <XAxis
                  type="number"
                  dataKey="quantity"
                  name="Quantity"
                  stroke="rgba(21,21,21,0.4)"
                  fontSize={10}
                  tickLine={false}
                  label={{ value: 'Procured Units', position: 'insideBottom', offset: -8, fill: 'rgba(21,21,21,0.5)', fontSize: 10 }}
                />
                <YAxis
                  type="number"
                  dataKey="potentialLeakage"
                  name="Potential Leakage"
                  stroke="rgba(21,21,21,0.4)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => formatCompactINR(v)}
                />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3', stroke: 'rgba(21,21,21,0.3)' }}
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
                          { label: 'Potential Leakage', value: item.potentialLeakage, isCurrency: true, color: '#B8A47A' },
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
                      fill={RISK_COLORS[entry.risk] || '#B8A47A'}
                      fillOpacity={0.85}
                      stroke="#F3F3F1"
                      strokeWidth={1}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-[#151515]/50 font-mono pt-1">
          <span>Click any point to open comprehensive line-item investigation</span>
          <span>{scatterData.length} plotted transactions</span>
        </div>
      </div>

      {/* GRAPH 9: Top Transactions by Potential Leakage */}
      <div className="lg:col-span-5 bg-[#F3F3F1] rounded-[24px] border border-[#151515]/10 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#151515]/10">
          <div>
            <span className="text-[10px] uppercase font-semibold text-[#151515]/50 tracking-wider block">
              Graph 9 · Priority Triage
            </span>
            <h3 className="text-base sm:text-lg font-medium text-[#151515]">
              Top Transactions by Leakage
            </h3>
            <p className="text-xs text-[#151515]/60">
              Highest single-transaction financial leakage ready for recovery.
            </p>
          </div>
          <span className="text-[11px] font-mono text-[#B8A47A] bg-[#B8A47A]/10 px-2.5 py-1 rounded-full border border-[#B8A47A]/30">
            Top {topTransactions.length}
          </span>
        </div>

        {topTransactions.length === 0 ? (
          <div className="py-20 text-center text-xs text-[#151515]/50">
            No leakage-generating transactions found.
          </div>
        ) : (
          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {topTransactions.map((tx) => (
              <div
                key={tx.transactionId}
                onClick={() => onInvestigateTransaction?.(tx.transactionId)}
                className="p-3 rounded-xl bg-[#151515]/5 border border-[#151515]/10 hover:bg-[#151515]/10 transition-all cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-[#151515]">
                      {tx.transactionId}
                    </span>
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: RISK_COLORS[tx.risk] || '#B8A47A' }}
                    />
                    <span className="text-[10px] font-mono text-[#B8A47A]">
                      +{tx.variancePercent.toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-[11px] text-[#151515]/70 truncate mt-0.5" title={`${tx.product} · ${tx.supplier}`}>
                    {tx.product} <span className="text-[#151515]/30">·</span> {tx.supplier}
                  </div>
                </div>

                <div className="text-right shrink-0 flex items-center gap-2">
                  <div>
                    <div className="text-xs font-mono font-medium text-[#151515] tnum">
                      {formatINR(tx.potentialLeakage)}
                    </div>
                    <div className="text-[10px] text-[#151515]/50">
                      {tx.quantity} units
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#151515]/40 group-hover:text-[#151515] group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-[#151515]/50 font-mono pt-1">
          <span>Click item to launch AI Investigation</span>
          <span>Ranked by canonical exposure</span>
        </div>
      </div>
    </div>
  );
};
