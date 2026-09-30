import React from 'react';
import { MicroLabel } from '../common/MicroLabel';
import { FileText, ArrowRight, GitCompare, Calculator, Download, CheckCircle2 } from 'lucide-react';
import { FindingDetail } from '../../types';

interface AiAnalystReportProps {
  finding: FindingDetail;
  onShowTransactions: () => void;
  onCompareSuppliers: () => void;
  onCalculateRecovery: () => void;
}

export const AiAnalystReport: React.FC<AiAnalystReportProps> = ({
  finding,
  onShowTransactions,
  onCompareSuppliers,
  onCalculateRecovery,
}) => {
  return (
    <div className="bg-cream-50 border border-border rounded-lg p-6 sm:p-8 space-y-6">
      {/* Analyst Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border/80">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-forest-500 animate-pulse" />
          <MicroLabel variant="forest">
            AI ANALYST REPORT
          </MicroLabel>
        </div>
        <span className="text-xs font-mono text-muted">
          Confidence: 99.2% · Forensic Engine
        </span>
      </div>

      {/* WHY THIS WAS FLAGGED (Section 10 Requirement) */}
      <div className="space-y-3">
        <h4 className="font-serif text-lg text-ink-950 font-normal">
          Why this was flagged
        </h4>
        <div className="space-y-2.5 text-sm font-sans text-ink-950/80 leading-relaxed bg-cream-100/70 p-4 rounded border border-border/70">
          {finding.whyFlagged.map((point, idx) => (
            <div key={idx} className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-terracotta-500 mt-2 shrink-0" />
              <p>{point}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Analyst Narrative Opinion */}
      <div className="space-y-2 pt-2">
        <MicroLabel variant="muted">AUDIT OPINION & RECOMMENDATION</MicroLabel>
        <p className="font-editorial text-base italic text-ink-950 leading-relaxed">
          "The variance in PO-{finding.poNumber} is non-systemic but represents substantial unbudgeted margin leakage. Master Agreement MSA-7729 was permitted to lapse without notice to regional procurement controllers. We recommend issuing an immediate vendor rate reconciliation memo and transferring upcoming Q4 purchase requisitions directly to contracted vendor XYZ Supplies."
        </p>
      </div>

      {/* Understated Action Buttons (Section 11 Requirement) */}
      <div className="pt-4 border-t border-border flex flex-wrap items-center gap-3">
        <button
          onClick={onShowTransactions}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded text-xs font-sans font-medium text-ink-950 bg-cream-200 hover:bg-cream-300/70 border border-border transition-colors"
        >
          <FileText className="w-3.5 h-3.5 text-forest-600" />
          <span>Show supporting transactions</span>
        </button>

        <button
          onClick={onCompareSuppliers}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded text-xs font-sans font-medium text-ink-950 bg-cream-200 hover:bg-cream-300/70 border border-border transition-colors"
        >
          <GitCompare className="w-3.5 h-3.5 text-forest-600" />
          <span>Compare suppliers</span>
        </button>

        <button
          onClick={onCalculateRecovery}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded text-xs font-sans font-semibold text-cream-100 bg-forest-600 hover:bg-forest-700 transition-colors shadow-fine"
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>Calculate recovery</span>
        </button>
      </div>
    </div>
  );
};
