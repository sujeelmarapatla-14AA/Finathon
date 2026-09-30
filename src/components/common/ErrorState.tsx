import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "SpendIntel couldn't connect to the intelligence engine.",
  description = "Something interrupted the analysis or the API service is currently unavailable. Your original data is safe.",
  onRetry,
}) => {
  return (
    <div className="py-20 px-8 text-center bg-white rounded-[32px] border border-[#D96B4A]/30 max-w-xl mx-auto my-12 shadow-sm space-y-4">
      <div className="w-14 h-14 rounded-full bg-[#D96B4A]/10 border border-[#D96B4A]/30 flex items-center justify-center mx-auto text-[#D96B4A]">
        <AlertCircle className="w-6 h-6 stroke-[1.5]" />
      </div>
      <span className="text-[10px] uppercase font-sans font-semibold tracking-wider text-[#D96B4A] block">
        ENGINE ADVISORY
      </span>
      <h3 className="text-2xl sm:text-3xl font-sans font-medium text-[#111111] tracking-tight">
        {title}
      </h3>
      <p className="text-[#5E5E5A] text-xs sm:text-sm max-w-md mx-auto leading-relaxed font-sans">
        {description}
      </p>
      {onRetry && (
        <div className="pt-2">
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 h-11 px-6 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#0A0A0A] hover:bg-black text-white transition-all shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>
        </div>
      )}
    </div>
  );
};
