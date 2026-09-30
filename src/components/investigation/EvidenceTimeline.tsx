import React from 'react';
import { CheckCircle2, AlertTriangle, ShieldCheck, ArrowRight } from 'lucide-react';

export interface TimelineStepItem {
  number?: string;
  step?: number;
  title: string;
  description: string;
  value?: string;
  metricLabel?: string;
  metricValue?: string;
  status?: 'neutral' | 'flag' | 'verified';
}

interface EvidenceTimelineProps {
  steps?: TimelineStepItem[];
}

export const EvidenceTimeline: React.FC<EvidenceTimelineProps> = ({ steps }) => {
  const defaultSteps: TimelineStepItem[] = [
    {
      number: '01',
      title: 'Purchase history',
      description: 'Transaction TX10013 recorded for 20 units of Industrial Laptop at ₹52,500 unit price.',
      metricValue: '20 units @ ₹52,500',
      status: 'neutral',
    },
    {
      number: '02',
      title: 'Supplier benchmark',
      description: 'Contracted rate card and median peer purchases established fair benchmark at ₹47,500.',
      metricValue: 'Benchmark ₹47,500',
      status: 'neutral',
    },
    {
      number: '03',
      title: 'Price variance',
      description: 'Invoiced rate exceeds approved baseline by +10.53%, breaching the 3.0% tolerance band.',
      metricValue: '+10.53% delta',
      status: 'flag',
    },
    {
      number: '04',
      title: 'Financial impact',
      description: 'Deterministic leakage calculation yields ₹1,00,000 avoidable overpayment on this PO.',
      metricValue: '₹1,00,000 leakage',
      status: 'flag',
    },
    {
      number: '05',
      title: 'Recommended action',
      description: 'Issue immediate debit memo to TechWorld Solutions or divert future POs to preferred rate card.',
      metricValue: 'Debit Memo Ready',
      status: 'verified',
    },
  ];

  const displaySteps = (steps && steps.length > 0) ? steps : defaultSteps;

  return (
    <div className="bg-white rounded-[28px] border border-[#E8E8E3] p-6 sm:p-8 shadow-sm">
      <div className="flex items-center justify-between pb-6 border-b border-[#F0F0EB] mb-8">
        <div>
          <span className="text-[10px] uppercase font-semibold tracking-wider text-[#73C69A] block mb-1">
            Forensic Proof Chain
          </span>
          <h3 className="text-xl font-sans font-medium text-[#111111]">
            Evidence Timeline
          </h3>
        </div>
        <span className="text-xs font-mono text-[#8A8A84] bg-[#FAFAF8] px-3 py-1 rounded-full border border-[#E8E8E3]">
          5 Verified Steps
        </span>
      </div>

      <div className="relative space-y-8 pl-2">
        {displaySteps.map((step, idx) => {
          const isLast = idx === displaySteps.length - 1;
          const stepNum = step.number || (step.step ? `0${step.step}` : `0${idx + 1}`);
          const isFlagged = step.status === 'flag' || idx === 2 || idx === 3;
          const isVerified = step.status === 'verified' || idx === 4;

          return (
            <div key={idx} className="relative flex items-start gap-5 group">
              {/* Connector Line */}
              {!isLast && (
                <div className="absolute left-[15px] top-9 bottom-[-32px] w-[1px] bg-[#E8E8E3] group-hover:bg-[#111111] transition-colors" />
              )}

              {/* Number Node */}
              <div
                className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-mono text-xs font-medium transition-all ${
                  isFlagged
                    ? 'bg-[#D96B4A]/10 border border-[#D96B4A]/30 text-[#D96B4A]'
                    : isVerified
                    ? 'bg-[#73C69A]/15 border border-[#73C69A]/40 text-[#111111]'
                    : 'bg-[#FAFAF8] border border-[#E8E8E3] text-[#5E5E5A]'
                }`}
              >
                {stepNum}
              </div>

              {/* Content Block */}
              <div className="flex-1 pb-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                  <h4 className="text-sm font-semibold text-[#111111]">
                    {step.title}
                  </h4>
                  {(step.value || step.metricValue) && (
                    <span
                      className={`text-xs font-mono font-medium px-2.5 py-0.5 rounded-full inline-block w-fit ${
                        isFlagged
                          ? 'bg-[#D96B4A]/10 text-[#D96B4A]'
                          : isVerified
                          ? 'bg-[#73C69A]/15 text-[#111111]'
                          : 'bg-[#FAFAF8] text-[#5E5E5A] border border-[#E8E8E3]'
                      }`}
                    >
                      {step.value || step.metricValue}
                    </span>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-[#5E5E5A] font-sans leading-relaxed">
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
