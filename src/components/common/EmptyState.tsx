import React from 'react';
import { FileSpreadsheet, ArrowUpRight } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = "NO PROCUREMENT DATA",
  description = "Upload your first dataset and we'll start looking for hidden leakage.",
  actionText = "Upload Dataset",
  onAction,
}) => {
  return (
    <div className="py-24 px-8 text-center border border-border-default rounded-[12px] bg-transparent max-w-xl mx-auto my-12">
      <div className="w-12 h-12 rounded-full bg-dark-secondary border border-border-default flex items-center justify-center mx-auto mb-4 text-brand-forest-bright">
        <FileSpreadsheet className="w-5 h-5 stroke-[1.5]" />
      </div>
      <span className="text-[10px] uppercase font-sans font-semibold tracking-micro text-text-muted block mb-2">
        DATA REPOSITORY
      </span>
      <h3 className="font-serif text-3xl text-text-primary font-normal mb-3">
        {title}
      </h3>
      <p className="text-text-secondary text-sm max-w-sm mx-auto mb-6 leading-relaxed font-sans">
        {description}
      </p>
      {onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 h-10 px-5 rounded-[8px] text-xs uppercase font-sans font-semibold tracking-wider bg-brand-forest hover:bg-brand-forest-bright text-brand-cream transition-colors shadow-fine"
        >
          <span>{actionText}</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
