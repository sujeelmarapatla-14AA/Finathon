import React from 'react';
import { ArrowRight, AlertTriangle } from 'lucide-react';
import { LeakageAlert } from '../../types';
import { Badge } from '../common/Badge';

interface AlertRowProps {
  alert: LeakageAlert;
  onInvestigate: (findingRef: string) => void;
}

export const AlertRow: React.FC<AlertRowProps> = ({ alert, onInvestigate }) => {
  return (
    <div className="group flex flex-col md:flex-row md:items-center justify-between p-4 sm:p-5 border-b border-border/70 hover:bg-cream-200/40 transition-colors gap-4">
      {/* Product & Supplier Context */}
      <div className="flex items-start gap-3.5 min-w-[240px]">
        {/* Small restrained priority indicator */}
        <div className="pt-0.5">
          <Badge variant={alert.priority} size="xs">
            {alert.priority} PRIORITY
          </Badge>
        </div>

        <div>
          <h4 className="text-sm font-sans font-medium text-ink-950 group-hover:text-forest-700 transition-colors">
            {alert.product}
          </h4>
          <p className="text-xs text-muted font-sans mt-0.5 flex items-center gap-2">
            <span>{alert.supplier}</span>
            <span className="text-border">•</span>
            <span className="font-mono text-[11px]">{alert.findingRef}</span>
          </p>
        </div>
      </div>

      {/* Metrics Row: Leakage, Variance, Benchmark */}
      <div className="grid grid-cols-3 gap-4 sm:gap-6 text-left md:text-right shrink-0">
        <div>
          <span className="text-[10.5px] uppercase font-sans tracking-wide text-muted block">
            Potential Leakage
          </span>
          <span className="font-serif text-base sm:text-lg font-medium text-terracotta-600">
            {alert.potentialLeakage}
          </span>
        </div>

        <div>
          <span className="text-[10.5px] uppercase font-sans tracking-wide text-muted block">
            Price Variance
          </span>
          <span className="font-sans text-xs sm:text-sm font-semibold text-terracotta-700">
            {alert.priceVariance}
          </span>
        </div>

        <div>
          <span className="text-[10.5px] uppercase font-sans tracking-wide text-muted block">
            Historical Benchmark
          </span>
          <span className="font-sans text-xs sm:text-sm text-ink-950/80">
            {alert.historicalBenchmark}
          </span>
        </div>
      </div>

      {/* Action CTA */}
      <div className="md:pl-4 self-end md:self-center">
        <button
          onClick={() => onInvestigate(alert.findingRef)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-sans font-semibold uppercase tracking-wider text-forest-700 group-hover:text-forest-800 bg-cream-200/80 hover:bg-forest-100/80 border border-border/80 transition-all shadow-fine"
        >
          <span>Investigate</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
};
