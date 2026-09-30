import React from 'react';
import { MicroLabel } from '../common/MicroLabel';
import { FindingDetail } from '../../types';

interface EvidenceBlockProps {
  finding: FindingDetail;
}

export const EvidenceBlock: React.FC<EvidenceBlockProps> = ({ finding }) => {
  return (
    <div className="bg-cream-50 border border-border rounded-lg p-6 sm:p-8">
      <div className="flex items-center justify-between pb-4 border-b border-border mb-6">
        <MicroLabel variant="terracotta" hasDot>
          AUDIT EVIDENCE SUMMARY
        </MicroLabel>
        <span className="text-xs font-mono text-muted">
          PO Ref: {finding.poNumber}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 divide-y sm:divide-y-0 sm:divide-x divide-border/80">
        {/* Historical average */}
        <div className="pt-2 sm:pt-0 sm:px-3 first:pl-0">
          <span className="text-[11px] uppercase font-sans tracking-wide text-muted block mb-1">
            Historical Average
          </span>
          <span className="font-serif text-xl sm:text-2xl font-medium text-forest-700">
            {finding.historicalAverage}
          </span>
          <span className="text-[10px] text-muted block mt-1">90-day approved baseline</span>
        </div>

        {/* Actual price */}
        <div className="pt-2 sm:pt-0 sm:px-3">
          <span className="text-[11px] uppercase font-sans tracking-wide text-muted block mb-1">
            Actual Invoiced Price
          </span>
          <span className="font-serif text-xl sm:text-2xl font-medium text-ink-950">
            {finding.actualPrice}
          </span>
          <span className="text-[10px] text-muted block mt-1">Per unit spot billing</span>
        </div>

        {/* Variance */}
        <div className="pt-2 sm:pt-0 sm:px-3">
          <span className="text-[11px] uppercase font-sans tracking-wide text-muted block mb-1">
            Price Variance
          </span>
          <span className="font-serif text-xl sm:text-2xl font-medium text-terracotta-600">
            {finding.variance}
          </span>
          <span className="text-[10px] text-terracotta-700 block mt-1">+₹4,500 premium / unit</span>
        </div>

        {/* Quantity */}
        <div className="pt-2 sm:pt-0 sm:px-3">
          <span className="text-[11px] uppercase font-sans tracking-wide text-muted block mb-1">
            Purchased Units
          </span>
          <span className="font-serif text-xl sm:text-2xl font-medium text-ink-950">
            {finding.quantity.toLocaleString()}
          </span>
          <span className="text-[10px] text-muted block mt-1">Requisition volume</span>
        </div>

        {/* Potential exposure */}
        <div className="pt-2 sm:pt-0 sm:px-3">
          <span className="text-[11px] uppercase font-sans tracking-wide text-muted block mb-1">
            Potential Exposure
          </span>
          <span className="font-serif text-xl sm:text-2xl font-medium text-terracotta-600">
            {finding.potentialLeakage}
          </span>
          <span className="text-[10px] text-terracotta-700 block mt-1">Actionable reclaimable</span>
        </div>
      </div>
    </div>
  );
};
