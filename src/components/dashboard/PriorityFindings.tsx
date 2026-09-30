import React from 'react';
import { ArrowRight, ChevronRight, AlertCircle, ShieldAlert } from 'lucide-react';
import { formatINR } from '../../utils/formatters';
import { Badge } from '../common/Badge';

export interface FindingItem {
  transaction_id?: string;
  id?: string;
  findingRef?: string;
  product?: string;
  supplier?: string;
  variance_percent?: number;
  priceVariance?: string;
  potential_leakage?: number;
  potentialLeakage?: string;
  risk?: string;
  priority?: string;
  type?: string;
}

interface PriorityFindingsProps {
  findings?: FindingItem[];
  onInvestigate: (findingIdOrRef: string) => void;
  onViewAll?: () => void;
}

export const PriorityFindings: React.FC<PriorityFindingsProps> = ({
  findings,
  onInvestigate,
  onViewAll,
}) => {
  // Default fallback if live findings not yet loaded
  const displayItems: FindingItem[] = (findings && findings.length > 0)
    ? findings.slice(0, 6)
    : [
        {
          transaction_id: 'TX10013',
          product: 'Industrial Laptop',
          supplier: 'TechWorld Solutions',
          variance_percent: 10.53,
          potential_leakage: 100000,
          risk: 'HIGH',
        },
        {
          transaction_id: 'TX10028',
          product: 'Cloud Compute Instance',
          supplier: 'CloudScale Networks',
          variance_percent: 14.2,
          potential_leakage: 85000,
          risk: 'HIGH',
        },
        {
          transaction_id: 'TX10005',
          product: 'High-Yield Toner Cartridge',
          supplier: 'ABC Traders',
          variance_percent: 8.53,
          potential_leakage: 45000,
          risk: 'MEDIUM',
        },
        {
          transaction_id: 'TX10034',
          product: 'Ergonomic Standing Desk',
          supplier: 'Apex Office Supplies',
          variance_percent: 12.1,
          potential_leakage: 62000,
          risk: 'HIGH',
        },
      ];

  return (
    <div className="bg-white rounded-[28px] border border-[#E8E8E3] p-6 sm:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#F0F0EB] gap-4">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8A8A84] block mb-1">
            Deterministic Flags
          </span>
          <h2 className="text-2xl font-sans font-medium text-[#111111]">
            Findings worth investigating.
          </h2>
          <p className="text-xs text-[#5E5E5A] mt-1 font-sans">
            Ranked by financial leakage exposure and contract benchmark variance.
          </p>
        </div>

        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-xs font-semibold text-[#111111] hover:text-black flex items-center gap-1.5 group shrink-0"
          >
            <span>View all transactions</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        )}
      </div>

      {/* Clean fintech transaction list (Section 10) */}
      <div className="divide-y divide-[#F0F0EB]">
        {displayItems.map((item, idx) => {
          const key = item.transaction_id || item.id || item.findingRef || `item-${idx}`;
          const idToPass = item.transaction_id || item.findingRef || 'TX10013';
          const variance = item.variance_percent
            ? `+${item.variance_percent.toFixed(2)}%`
            : item.priceVariance || '+10.53%';
          const leakageFormatted = item.potential_leakage !== undefined
            ? formatINR(item.potential_leakage)
            : (item.potentialLeakage || '₹1,00,000');

          return (
            <div
              key={key}
              onClick={() => onInvestigate(idToPass)}
              className="py-4 px-3 -mx-3 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FAFAF8] transition-all cursor-pointer group"
            >
              {/* Left: Risk pill, Product & Supplier */}
              <div className="flex items-center gap-4">
                <div className="shrink-0">
                  <Badge size="md">{item.risk || item.priority || 'MEDIUM'}</Badge>
                </div>
                <div>
                  <h4 className="text-base font-semibold text-[#111111] group-hover:text-black transition-colors">
                    {item.product || 'Industrial Laptop'}
                  </h4>
                  <div className="flex items-center gap-2 text-sm text-[#5E5E5A] mt-0.5">
                    <span>{item.supplier || 'TechWorld Solutions'}</span>
                    <span className="text-[#DCDCD7]">·</span>
                    <span className="font-mono text-xs text-[#8A8A84]">{idToPass}</span>
                  </div>
                </div>
              </div>

              {/* Right: Variance, Leakage, Investigate CTA */}
              <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                <div className="text-right">
                  <span className="text-sm font-mono font-semibold text-[#D96B4A] tnum">
                    {variance}
                  </span>
                  <div className="text-xs text-[#8A8A84]">variance</div>
                </div>

                <div className="text-right min-w-[100px]">
                  <span className="text-base font-semibold text-[#111111] tnum">
                    {leakageFormatted}
                  </span>
                  <div className="text-xs text-[#8A8A84]">potential leakage</div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onInvestigate(idToPass);
                  }}
                  className="h-9 px-4 rounded-full text-xs font-semibold bg-[#FAFAF8] group-hover:bg-[#0A0A0A] border border-[#E8E8E3] group-hover:border-[#0A0A0A] text-[#111111] group-hover:text-white transition-all flex items-center gap-1.5 shrink-0"
                >
                  <span>Investigate</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
