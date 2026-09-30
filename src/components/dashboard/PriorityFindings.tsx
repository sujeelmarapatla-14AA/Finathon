import React from 'react';
import { ArrowRight } from 'lucide-react';
import { MOCK_ALERTS } from '../../data/mockData';

interface PriorityFindingsProps {
  onInvestigate: (findingRef: string) => void;
  onViewAll?: () => void;
}

export const PriorityFindings: React.FC<PriorityFindingsProps> = ({
  onInvestigate,
  onViewAll,
}) => {
  return (
    <div className="bg-transparent border border-border-default rounded-[12px] p-6 sm:p-8 flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between pb-6 border-b border-border-subtle">
          <div>
            <span className="text-[10px] uppercase font-sans font-semibold tracking-micro text-brand-gold block mb-1">
              ACTION REQUIRED
            </span>
            <h2 className="font-serif text-2xl text-text-primary font-normal">
              PRIORITY FINDINGS
            </h2>
          </div>
          <span className="text-xs font-mono text-text-muted">
            {MOCK_ALERTS.length} Alerts
          </span>
        </div>

        {/* Separated List (NOT individual giant cards) */}
        <div className="divide-y divide-border-subtle">
          {MOCK_ALERTS.slice(0, 4).map((alert) => (
            <div
              key={alert.id}
              className="py-4 first:pt-4 group hover:bg-dark-elevated/30 -mx-2 px-2 rounded-[6px] transition-colors"
            >
              <div className="flex items-center justify-between mb-1.5">
                {/* Status Indicator */}
                <span className="inline-flex items-center gap-1.5 text-[10px] font-sans font-semibold uppercase tracking-wider text-brand-terracotta">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-terracotta" />
                  {alert.priority}
                </span>

                <span className="text-[11px] font-mono text-text-muted">
                  {alert.findingRef}
                </span>
              </div>

              <div className="mb-2">
                <h4 className="text-sm font-sans font-medium text-text-primary group-hover:text-brand-forest-bright transition-colors">
                  {alert.product}
                </h4>
                <p className="text-xs text-text-muted font-sans mt-0.5">
                  {alert.supplier}
                </p>
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <span className="text-sm font-serif font-normal text-brand-terracotta tnum">
                    {alert.potentialLeakage}
                  </span>
                  <span className="text-xs font-sans text-text-muted ml-1.5">leakage</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-medium text-brand-terracotta tnum">
                    {alert.priceVariance}
                  </span>

                  <button
                    onClick={() => onInvestigate(alert.findingRef)}
                    className="inline-flex items-center gap-1 text-xs font-sans font-medium text-brand-cream hover:text-brand-forest-bright transition-colors"
                  >
                    <span>Investigate</span>
                    <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-border-subtle flex items-center justify-between">
        <span className="text-xs text-text-muted">Ranked by risk exposure</span>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-xs font-sans text-brand-forest-bright hover:underline font-medium"
          >
            View All Findings →
          </button>
        )}
      </div>
    </div>
  );
};
