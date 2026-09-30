import React from 'react';
import { ArrowRight } from 'lucide-react';

interface EditorialHeroProps {
  onAnalyzeData: () => void;
  onExploreDemo: () => void;
}

export const EditorialHero: React.FC<EditorialHeroProps> = ({
  onAnalyzeData,
  onExploreDemo,
}) => {
  return (
    <section className="relative w-full border-b border-border-default bg-dark-bg overflow-hidden bg-hero-glow">
      {/* Subtle 0.03 opacity dark grid */}
      <div className="absolute inset-0 bg-dark-grid pointer-events-none opacity-40" />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column (7 Columns): Editorial Headline & Copy */}
          <div className="lg:col-span-7 space-y-6">
            <span className="text-[10px] uppercase font-sans font-semibold tracking-micro text-brand-forest-bright block">
              00 / MANIFESTO · DARK NEO-MINIMALISM
            </span>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-text-primary font-normal leading-[1.02] tracking-tight">
              Find the money <br />
              <span className="font-serif italic text-brand-terracotta-soft">hidden inside</span> your <br />
              procurement data.
            </h1>

            <p className="font-sans text-base sm:text-lg text-text-secondary max-w-xl leading-relaxed font-normal">
              LeakGuard analyzes procurement transactions, supplier behavior and commercial terms to uncover potential financial leakage and explain exactly where it comes from.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={onAnalyzeData}
                className="h-10 px-5 rounded-[8px] text-xs font-sans uppercase tracking-wider font-semibold bg-brand-forest hover:bg-brand-forest-bright text-brand-cream transition-colors shadow-fine flex items-center gap-2"
              >
                <span>Analyze Procurement Data</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={onExploreDemo}
                className="h-10 px-5 rounded-[8px] text-xs font-sans uppercase tracking-wider font-semibold text-text-primary bg-transparent hover:bg-dark-elevated border border-border-default transition-colors"
              >
                <span>Explore Demo Dataset</span>
              </button>
            </div>

            {/* Neo-Minimalism Formula Row */}
            <div className="pt-6 grid grid-cols-3 gap-6 border-t border-border-subtle max-w-lg">
              <div>
                <span className="text-[10px] uppercase font-sans font-semibold tracking-micro text-text-muted block mb-1">
                  CLARITY
                </span>
                <p className="text-xs text-text-secondary">Instant financial legibility</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-sans font-semibold tracking-micro text-brand-forest-bright block mb-1">
                  WARMTH
                </span>
                <p className="text-xs text-text-secondary">Human-centered restraint</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-sans font-semibold tracking-micro text-brand-terracotta block mb-1">
                  CHARACTER
                </span>
                <p className="text-xs text-text-secondary">Evidence-backed auditing</p>
              </div>
            </div>
          </div>

          {/* Right Column (5 Columns): Dark Editorial Visual */}
          <div className="lg:col-span-5">
            <div className="relative rounded-[12px] bg-dark-secondary border border-border-default p-8 shadow-modal space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
                <span className="text-[10px] uppercase font-sans font-semibold tracking-micro text-text-muted">
                  AUDIT ARTIFACT · FY25-26
                </span>
                <span className="text-[10px] font-mono text-text-secondary">
                  50,284 TX
                </span>
              </div>

              {/* Potential Leakage */}
              <div className="space-y-1">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-sans uppercase tracking-wider text-text-secondary">
                    Potential Leakage
                  </span>
                  <span className="text-[11px] font-sans text-brand-terracotta-soft">
                    +1.69% of spend
                  </span>
                </div>
                <div className="font-serif text-4xl sm:text-5xl text-brand-terracotta font-normal tnum">
                  ₹31.6L
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-border-subtle">
                <div>
                  <span className="text-[11px] font-sans uppercase tracking-wider text-text-muted block mb-1">
                    Transactions Analyzed
                  </span>
                  <div className="font-serif text-2xl text-text-primary font-normal tnum">
                    50,284
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-sans uppercase tracking-wider text-text-muted block mb-1">
                    High-Risk Findings
                  </span>
                  <div className="font-serif text-2xl text-brand-gold font-normal tnum">
                    143
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border-subtle">
                <p className="font-serif text-xs italic text-text-muted leading-relaxed">
                  "Every leakage finding is anchored by contractual cross-referencing, multi-supplier indexing, and defensible audit proof."
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
