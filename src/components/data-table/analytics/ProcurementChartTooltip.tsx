import React from 'react';
import { formatINR, formatCompactINR } from '../../../utils/formatters';

interface TooltipItem {
  label: string;
  value: string | number;
  color?: string;
  isCurrency?: boolean;
}

interface ProcurementChartTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  title?: string;
  items?: TooltipItem[];
  customContent?: React.ReactNode;
}

export const ProcurementChartTooltip: React.FC<ProcurementChartTooltipProps> = ({
  active,
  payload,
  label,
  title,
  items,
  customContent,
}) => {
  if (!active) return null;

  const headerTitle = title || label || (payload && payload.length > 0 ? payload[0]?.payload?.name || payload[0]?.name : '');

  return (
    <div className="rounded-xl bg-[#0A0A0A]/95 backdrop-blur-md border border-white/15 p-3.5 shadow-2xl text-xs font-sans text-white min-w-[200px] max-w-[280px] pointer-events-none z-50">
      {headerTitle && (
        <div className="font-semibold text-white border-b border-white/10 pb-2 mb-2 truncate">
          {headerTitle}
        </div>
      )}

      {customContent}

      {items && items.length > 0 && (
        <div className="space-y-1.5">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between gap-3 text-[11px]">
              <span className="text-[#8A8A84] flex items-center gap-1.5">
                {item.color && (
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                )}
                {item.label}
              </span>
              <span className="font-mono font-medium text-white tnum">
                {typeof item.value === 'number'
                  ? item.isCurrency
                    ? formatINR(item.value)
                    : item.value.toLocaleString('en-IN')
                  : item.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Fallback to default Recharts payload if no custom items supplied */}
      {!items && !customContent && payload && payload.length > 0 && (
        <div className="space-y-1.5">
          {payload.map((entry: any, idx: number) => {
            const val = entry.value;
            const isCurr = typeof val === 'number' && (val > 100 || entry.name.toLowerCase().includes('leakage') || entry.name.toLowerCase().includes('spend') || entry.name.toLowerCase().includes('price'));
            return (
              <div key={idx} className="flex items-center justify-between gap-3 text-[11px]">
                <span className="text-[#8A8A84] flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: entry.color || entry.fill || '#73C69A' }}
                  />
                  {entry.name || entry.dataKey}
                </span>
                <span className="font-mono font-medium text-white tnum">
                  {typeof val === 'number'
                    ? isCurr
                      ? formatINR(val)
                      : val.toLocaleString('en-IN')
                    : val}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
