import React, { useState } from 'react';
import { UploadCloud, CheckCircle2, ArrowRight, RefreshCw, FileSpreadsheet } from 'lucide-react';

interface UploadZoneProps {
  onCompleteAnalysis: () => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onCompleteAnalysis }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadState, setUploadState] = useState<'idle' | 'analyzing' | 'completed'>('idle');
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    'Parsing transactions',
    'Normalizing suppliers',
    'Benchmarking prices',
    'Detecting anomalies',
    'Preparing investigation',
  ];

  const handleStart = () => {
    setUploadState('analyzing');
    setCurrentStep(0);

    let s = 0;
    const interval = setInterval(() => {
      s += 1;
      if (s < steps.length) {
        setCurrentStep(s);
      } else {
        clearInterval(interval);
        setUploadState('completed');
      }
    }, 600);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Page Header (Section 20) */}
      <div className="border-b border-border-default pb-8 text-center">
        <span className="text-[10px] uppercase font-sans font-semibold tracking-micro text-brand-forest-bright block mb-2">
          DATA INGESTION PIPELINE
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-text-primary font-normal tracking-tight">
          Bring your procurement data.
        </h1>
        <p className="mt-3 text-sm sm:text-base text-text-secondary font-sans max-w-xl mx-auto leading-relaxed">
          Upload CSV or Excel files and let LeakGuard investigate the patterns hidden inside.
        </p>
      </div>

      {/* Upload Area */}
      <div className="border border-border-default rounded-[12px] bg-dark-bg p-8 sm:p-14">
        {uploadState === 'idle' && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleStart();
            }}
            className={`border border-dashed rounded-[12px] p-12 sm:p-16 text-center transition-all ${
              isDragging
                ? 'border-brand-forest bg-brand-forest/10'
                : 'border-border-default hover:border-border hover:bg-dark-secondary/50'
            }`}
          >
            <div className="w-12 h-12 rounded-full bg-dark-secondary border border-border-default flex items-center justify-center mx-auto mb-4 text-text-secondary">
              <UploadCloud className="w-5 h-5 stroke-[1.5]" />
            </div>

            <h3 className="font-serif text-2xl text-text-primary font-normal mb-2">
              DROP FILE HERE
            </h3>
            <p className="text-xs text-text-muted font-sans mb-6">or</p>

            <button
              onClick={handleStart}
              className="h-10 px-6 rounded-[8px] text-xs font-sans font-semibold uppercase tracking-wider bg-brand-forest hover:bg-brand-forest-bright text-brand-cream transition-colors shadow-fine"
            >
              Browse files
            </button>

            <div className="mt-8 pt-6 border-t border-border-subtle flex items-center justify-center gap-6 text-xs text-text-muted font-mono">
              <span>CSV · XLSX</span>
              <span>•</span>
              <span>Maximum 25MB</span>
            </div>
          </div>
        )}

        {uploadState === 'analyzing' && (
          <div className="py-12 px-6 text-center space-y-8 max-w-md mx-auto">
            <div className="w-12 h-12 rounded-full bg-dark-secondary border border-brand-forest/50 flex items-center justify-center mx-auto text-brand-forest-bright">
              <RefreshCw className="w-5 h-5 animate-spin stroke-[1.75]" />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] uppercase font-sans font-semibold tracking-micro text-brand-forest-bright block">
                ANALYZING PROCUREMENT DATA
              </span>
              <h3 className="font-serif text-2xl text-text-primary font-normal">
                {steps[currentStep]}
              </h3>
            </div>

            {/* Step list (Section 31: Loading States) */}
            <div className="space-y-2.5 text-xs font-sans text-left max-w-xs mx-auto border border-border-subtle p-4 rounded-[8px] bg-dark-secondary">
              {steps.map((step, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className={idx === currentStep ? 'text-text-primary font-medium' : idx < currentStep ? 'text-text-secondary' : 'text-text-muted'}>
                    {idx + 1}. {step}
                  </span>
                  <span className="font-mono text-xs">
                    {idx < currentStep ? (
                      <span className="text-brand-forest-bright">✓</span>
                    ) : idx === currentStep ? (
                      <span className="text-brand-terracotta">●</span>
                    ) : (
                      <span className="text-text-muted">○</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {uploadState === 'completed' && (
          <div className="py-10 px-6 text-center space-y-6 max-w-lg mx-auto animate-in fade-in duration-200">
            <div className="w-12 h-12 rounded-full bg-dark-secondary border border-brand-forest text-brand-forest-bright flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6 stroke-[1.75]" />
            </div>

            <div>
              <span className="text-[10px] uppercase font-sans font-semibold tracking-micro text-brand-forest-bright block mb-1">
                ANALYSIS COMPLETE
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-text-primary font-normal">
                50,284 transactions analyzed.
              </h2>
              <p className="text-xs sm:text-sm text-text-secondary font-sans mt-2">
                143 high-risk findings and ₹31.6L in potential leakage identified.
              </p>
            </div>

            <div className="pt-4 flex items-center justify-center gap-3">
              <button
                onClick={onCompleteAnalysis}
                className="h-10 px-6 rounded-[8px] text-xs font-sans font-semibold uppercase tracking-wider bg-brand-forest hover:bg-brand-forest-bright text-brand-cream transition-colors shadow-fine flex items-center gap-2"
              >
                <span>View Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setUploadState('idle')}
                className="h-10 px-4 rounded-[8px] text-xs font-sans text-text-secondary hover:text-text-primary bg-dark-secondary border border-border-default hover:bg-dark-elevated"
              >
                Upload Another
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
