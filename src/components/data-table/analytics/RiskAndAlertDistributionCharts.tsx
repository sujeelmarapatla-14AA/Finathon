import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { RiskDistributionItem, AlertTypeDistributionItem } from './analyticsUtils';
import { ProcurementChartTooltip } from './ProcurementChartTooltip';
import { formatCompactINR, formatINR } from '../../../utils/formatters';

interface RiskAndAlertDistributionProps {
  riskData: RiskDistributionItem[];
  alertData: AlertTypeDistributionItem[];
  totalAlertsCount: number;
  selectedRisk?: string | null;
  selectedAlertType?: string | null;
  onSelectRisk?: (risk: string) => void;
  onSelectAlertType?: (alertType: string) => void;
}

export const RiskAndAlertDistributionCharts: React.FC<RiskAndAlertDistributionProps> = ({
  riskData,
  alertData,
  totalAlertsCount,
  selectedRisk,
  selectedAlertType,
  onSelectRisk,
  onSelectAlertType,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* GRAPH 4: Risk Distribution (Donut Chart with Center Total) */}
      <div className="lg:col-span-5 bg-[#F3F3F1] rounded-[24px] border border-[#151515]/10 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#151515]/10">
          <div>
            <span className="text-[10px] uppercase font-semibold text-[#151515]/50 tracking-wider block">
              Graph 4 · Severity Matrix
            </span>
            <h3 className="text-base sm:text-lg font-medium text-[#151515]">
              Risk Distribution
            </h3>
            <p className="text-xs text-[#151515]/60">
              Classification by operational and financial exposure.
            </p>
          </div>
          <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full bg-[#151515]/5 border border-[#151515]/10 text-[#151515]">
            {totalAlertsCount} Total Alerts
          </span>
        </div>

        {riskData.length === 0 ? (
          <div className="py-20 text-center text-xs text-[#151515]/50">
            No risk distribution data available.
          </div>
        ) : (
          <div className="relative h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || payload.length === 0) return null;
                    const item = payload[0].payload as RiskDistributionItem;
                    return (
                      <ProcurementChartTooltip
                        active={active}
                        title={`${item.risk} Risk Tier`}
                        items={[
                          { label: 'Transactions', value: `${item.count} items (${item.percentage}%)` },
                          { label: 'Potential Leakage', value: item.potentialLeakage, isCurrency: true, color: item.color },
                        ]}
                      />
                    );
                  }}
                />
                <Pie
                  data={riskData}
                  cx="50%"
                  cy="50%"
                  innerRadius={68}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="count"
                  onClick={(entry: any) => onSelectRisk?.(entry?.risk || entry?.payload?.risk)}
                  className="cursor-pointer"
                >
                  {riskData.map((entry, index) => {
                    const isSelected = selectedRisk === entry.risk;
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke="#F3F3F1"
                        strokeWidth={2}
                        opacity={selectedRisk && !isSelected ? 0.35 : 1}
                      />
                    );
                  })}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Donut Center Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] uppercase font-mono font-medium text-[#151515]/50 tracking-wider">
                Total Alerts
              </span>
              <span className="text-2xl font-sans font-medium text-[#151515] tnum mt-0.5">
                {totalAlertsCount}
              </span>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#151515]/10">
          {riskData.map((r) => {
            const isSelected = selectedRisk === r.risk;
            return (
              <button
                key={r.risk}
                onClick={() => onSelectRisk?.(r.risk)}
                className={`p-2 rounded-xl text-left border transition-all ${
                  isSelected
                    ? 'border-[#151515] bg-[#151515] text-[#F3F3F1] shadow-xs'
                    : 'border-[#151515]/10 bg-[#151515]/5 hover:bg-[#151515]/10 text-[#151515]'
                }`}
              >
                <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: r.color }}
                  />
                  <span>{r.risk}</span>
                </div>
                <div className="text-xs font-mono font-medium mt-1 tnum">
                  {r.count} ({r.percentage}%)
                </div>
                <div className={`text-[10px] truncate ${isSelected ? 'text-[#F3F3F1]/80' : 'text-[#151515]/60'}`}>
                  {formatCompactINR(r.potentialLeakage)}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* GRAPH 5: Leakage by Alert Type */}
      <div className="lg:col-span-7 bg-[#F3F3F1] rounded-[24px] border border-[#151515]/10 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#151515]/10">
          <div>
            <span className="text-[10px] uppercase font-semibold text-[#151515]/50 tracking-wider block">
              Graph 5 · Leakage Taxonomy
            </span>
            <h3 className="text-base sm:text-lg font-medium text-[#151515]">
              Where is the leakage coming from?
            </h3>
            <p className="text-xs text-[#151515]/60">
              Deterministic rule taxonomy breakdown across verified finding categories.
            </p>
          </div>
          <span className="text-[11px] font-mono text-[#B8A47A] bg-[#B8A47A]/10 px-2.5 py-1 rounded-full border border-[#B8A47A]/30">
            {alertData.length} Rule Categories
          </span>
        </div>

        {alertData.length === 0 ? (
          <div className="py-20 text-center text-xs text-[#151515]/50">
            No alert taxonomy data available for current selection.
          </div>
        ) : (
          <div className="h-64 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={alertData}
                margin={{ top: 8, right: 30, left: 16, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(21,21,21,0.08)" horizontal={false} />
                <XAxis
                  type="number"
                  stroke="rgba(21,21,21,0.4)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => formatCompactINR(v)}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  stroke="rgba(21,21,21,0.4)"
                  fontSize={10}
                  tickLine={false}
                  width={140}
                  tick={{ fill: '#151515' }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || payload.length === 0) return null;
                    const item = payload[0].payload as AlertTypeDistributionItem;
                    return (
                      <ProcurementChartTooltip
                        active={active}
                        title={item.label}
                        items={[
                          { label: 'Finding Count', value: `${item.count} items` },
                          { label: 'Financial Impact', value: item.potentialLeakage, isCurrency: true, color: item.color },
                          { label: 'Share of Leakage', value: `${item.percentage}%` },
                        ]}
                      />
                    );
                  }}
                />
                <Bar
                  dataKey="potentialLeakage"
                  name="Potential Leakage"
                  fill="#B8A47A"
                  radius={[0, 4, 4, 0]}
                  onClick={(entry: any) => {
                    const alertType = entry?.type || entry?.payload?.type;
                    if (alertType) onSelectAlertType?.(alertType);
                  }}
                  className="cursor-pointer"
                >
                  {alertData.map((entry, index) => {
                    const isSelected = selectedAlertType === entry.type;
                    return (
                      <Cell
                        key={`alert-${index}`}
                        fill={entry.color}
                        opacity={selectedAlertType && !isSelected ? 0.35 : 1}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-[#151515]/50 font-mono pt-1">
          <span>Click any rule to filter the procurement transaction table</span>
          <span>Normalized canonical allocation</span>
        </div>
      </div>
    </div>
  );
};
