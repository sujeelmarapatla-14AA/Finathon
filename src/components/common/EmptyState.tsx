import React from 'react';
import { FileSpreadsheet, ArrowRight } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = "No procurement data yet.",
  description = "Upload transaction data or load the demo dataset to let SpendIntel uncover the patterns hidden inside.",
  actionText = "Upload Dataset",
  onAction,
}) => {
  return (
    <div className="py-20 px-8 text-center bg-white rounded-[32px] border border-[#151515]/10 max-w-xl mx-auto my-12 shadow-sm space-y-4">
      <div className="w-14 h-14 rounded-full bg-[#151515]/5 border border-[#151515]/10 flex items-center justify-center mx-auto text-[#151515]">
        <FileSpreadsheet className="w-6 h-6 stroke-[1.5]" />
      </div>
      <span className="text-[10px] uppercase font-sans font-semibold tracking-wider text-[#B8A47A] block">
        DATA REPOSITORY
      </span>
      <h3 className="text-2xl sm:text-3xl font-sans font-medium text-[#151515] tracking-tight">
        {title}
      </h3>
      <p className="text-[#151515]/70 text-xs sm:text-sm max-w-md mx-auto leading-relaxed font-sans">
        {description}
      </p>
      {onAction && (
        <div className="pt-2">
          <button
            onClick={onAction}
            className="inline-flex items-center gap-2 h-11 px-6 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#151515] hover:bg-[#151515]/90 text-[#F3F3F1] transition-all shadow-sm"
          >
            <span>{actionText}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
