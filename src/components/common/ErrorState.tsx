import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "ANALYSIS INTERRUPTED",
  description = "Something interrupted the analysis. Your original data is safe.",
  onRetry,
}) => {
  return (
    <div className="py-20 px-8 text-center border border-brand-terracotta/40 rounded-[12px] bg-dark-secondary/50 max-w-lg mx-auto my-12">
      <div className="w-12 h-12 rounded-full bg-brand-terracotta/15 border border-brand-terracotta/40 flex items-center justify-center mx-auto mb-4 text-brand-terracotta">
        <AlertCircle className="w-5 h-5 stroke-[1.5]" />
      </div>
      <span className="text-[10px] uppercase font-sans font-semibold tracking-micro text-brand-terracotta block mb-2">
        EXECUTION ADVISORY
      </span>
      <h3 className="font-serif text-3xl text-text-primary font-normal mb-3">
        {title}
      </h3>
      <p className="text-text-secondary text-sm max-w-sm mx-auto mb-6 leading-relaxed font-sans">
        {description}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 h-10 px-5 rounded-[8px] text-xs uppercase font-sans font-semibold tracking-wider bg-dark-card hover:bg-dark-hover border border-border-default text-text-primary transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Analysis</span>
        </button>
      )}
    </div>
  );
};
