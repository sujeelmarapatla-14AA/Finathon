import React from 'react';

interface TimelineStep {
  number: string;
  title: string;
  description: string;
  metricLabel: string;
  metricValue: string;
  status: 'neutral' | 'flag' | 'verified';
}

interface EvidenceTimelineProps {
  steps?: TimelineStep[];
}

export const EvidenceTimeline: React.FC<EvidenceTimelineProps> = ({ steps }) => {
  const defaultSteps: TimelineStep[] = [
    {
      number: '01',
      title: 'Purchase History',
      description: 'Requisition PO-2026-8841 issued on 16 Sep 2026 for 100 units. Trailing purchase in Q1 recorded at ₹47,200 per unit.',
      metricLabel: 'Prior Order Baseline',
      metricValue: '₹47,200',
      status: 'neutral',
    },
    {
      number: '02',
      title: 'Supplier Benchmark',
      description: 'TechWorld invoiced unit price of ₹52,000. Active approved vendor XYZ Supplies offers contracted rate of ₹47,500 with 5-day SLA.',
      metricLabel: 'Supplier Delta',
      metricValue: '+₹4,500 / unit',
      status: 'flag',
    },
    {
      number: '03',
      title: 'Contract Terms',
      description: 'Master Service Agreement MSA-7729 expired in March 2026. Order was routed through discretionary spot procurement without tier discount.',
      metricLabel: 'Contract Status',
      metricValue: 'Expired MSA',
      status: 'flag',
    },
    {
      number: '04',
      title: 'Price Variance',
      description: 'Actual invoiced price ₹52,000 exceeds internal benchmark of ₹47,500 by +9.47%, exceeding the 5.0% enterprise tolerance threshold.',
      metricLabel: 'Variance Delta',
      metricValue: '+9.47%',
      status: 'flag',
    },
    {
      number: '05',
      title: 'Financial Impact',
      description: 'High-confidence exposure of ₹4,50,000 across 100 units. Direct supplier debit memo or alternative vendor routing recovers 100% of variance.',
      metricLabel: 'Potential Leakage',
      metricValue: '₹4,50,000',
      status: 'verified',
    },
  ];

  const displaySteps = steps && steps.length > 0 ? steps : defaultSteps;

  return (
    <div className="border border-border-default rounded-[12px] p-6 sm:p-8 bg-transparent">
      <div className="flex items-center justify-between pb-6 border-b border-border-subtle mb-6">
        <div>
          <span className="text-[10px] uppercase font-sans font-semibold tracking-micro text-brand-forest-bright block mb-1">
            04 / EVIDENCE TRACE
          </span>
          <h3 className="font-serif text-2xl text-text-primary font-normal">
            WHY THIS WAS FLAGGED
          </h3>
        </div>
        <span className="text-xs font-mono text-text-muted">
          5-Stage Proof Chain
        </span>
      </div>

      <div className="relative space-y-6">
        {displaySteps.map((step, idx) => {
          const isLast = idx === displaySteps.length - 1;

          return (
            <div key={idx} className="relative flex items-start gap-5 group">
              {/* Vertical connector line */}
              {!isLast && (
                <div className="absolute left-[15px] top-8 bottom-[-24px] w-[1px] bg-border-subtle group-hover:bg-border-default transition-colors" />
              )}

              {/* Step number circle */}
              <div className={`relative z-10 w-8 h-8 rounded-full border flex items-center justify-center shrink-0 font-mono text-xs transition-colors ${
                step.status === 'flag'
                  ? 'border-brand-terracotta/50 bg-dark-secondary text-brand-terracotta'
                  : step.status === 'verified'
                  ? 'border-brand-forest/60 bg-dark-secondary text-brand-forest-bright'
                  : 'border-border-default bg-dark-secondary text-text-muted'
              }`}>
                {step.number || `0${idx + 1}`}
              </div>

              {/* Step Details */}
              <div className="flex-1 pb-1">
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 mb-1.5">
                  <h4 className="font-sans text-sm font-medium text-text-primary">
                    {step.title}
                  </h4>
                  <div className="inline-flex items-center gap-1.5 text-xs font-mono px-2 py-0.5 rounded bg-dark-elevated border border-border-subtle">
                    <span className="text-text-muted">{step.metricLabel}:</span>
                    <span className={`font-semibold tnum ${
                      step.status === 'flag' ? 'text-brand-terracotta' : 'text-brand-forest-bright'
                    }`}>
                      {step.metricValue}
                    </span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-text-secondary font-sans leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
