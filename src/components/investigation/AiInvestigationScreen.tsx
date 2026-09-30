import React, { useState } from 'react';
import { EvidenceTimeline } from './EvidenceTimeline';
import { MOCK_FINDINGS } from '../../data/mockData';
import { FindingDetail, TabType } from '../../types';
import { CheckCircle2, X, Download, FileText, GitCompare, Calculator, ArrowRight } from 'lucide-react';

interface AiInvestigationScreenProps {
  selectedFindingRef: string;
  onSelectFinding: (ref: string) => void;
  onNavigate: (tab: TabType) => void;
}

export const AiInvestigationScreen: React.FC<AiInvestigationScreenProps> = ({
  selectedFindingRef,
  onSelectFinding,
  onNavigate,
}) => {
  const [activeRef, setActiveRef] = useState<string>(selectedFindingRef || 'FINDING #027');
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [exportToast, setExportToast] = useState(false);

  const finding: FindingDetail = MOCK_FINDINGS[activeRef] || MOCK_FINDINGS['FINDING #027'];

  const availableFindings = [
    { ref: 'FINDING #027', name: 'Industrial Laptop', leakage: '₹4,50,000' },
    { ref: 'FINDING #014', name: 'Printer Cartridge', leakage: '₹5,500' },
    { ref: 'FINDING #058', name: 'Cloud Compute Tier', leakage: '₹3,20,000' },
  ];

  const handleExport = () => {
    setExportToast(true);
    setTimeout(() => setExportToast(false), 3000);
  };

  return (
    <div className="space-y-8">
      {/* Export Toast */}
      {exportToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-dark-card border border-brand-forest/40 text-brand-cream px-4 py-3 rounded-[8px] shadow-modal flex items-center gap-3 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-brand-forest-bright" />
          <div className="text-xs font-sans">
            <p className="font-medium text-text-primary">Finding Exported</p>
            <p className="text-text-muted">Forensic dossier PDF prepared for {activeRef}.</p>
          </div>
        </div>
      )}

      {/* Page Header (Section 15) */}
      <div className="border-b border-border-default pb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-sans font-semibold tracking-micro text-brand-forest-bright block mb-2">
            04 / HERO INVESTIGATION
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-text-primary font-normal tracking-tight">
            AI Investigation
          </h1>
          <p className="mt-3 text-sm sm:text-base text-text-secondary font-sans leading-relaxed">
            Every alert comes with evidence.
          </p>
        </div>

        {/* Ref Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {availableFindings.map((f) => (
            <button
              key={f.ref}
              onClick={() => {
                setActiveRef(f.ref);
                onSelectFinding(f.ref);
              }}
              className={`px-3 py-1.5 rounded-[6px] text-xs font-sans transition-all whitespace-nowrap border ${
                activeRef === f.ref
                  ? 'border-brand-forest bg-brand-forest/15 text-text-primary font-medium'
                  : 'border-border-subtle text-text-muted hover:text-text-primary hover:bg-dark-elevated'
              }`}
            >
              <span className="font-mono">{f.ref}</span> · {f.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Two-Column Grid: LEFT Finding Summary | RIGHT AI Analyst (Section 15) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* LEFT COLUMN (5 Columns): Finding Summary */}
        <div className="lg:col-span-5 border border-border-default rounded-[12px] p-6 sm:p-8 bg-transparent flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-border-subtle mb-6">
              <span className="font-mono text-xs text-text-muted uppercase tracking-wider">
                {finding.refNumber}
              </span>
              <span className="text-[10px] font-sans font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-terracotta/20 text-brand-terracotta border border-brand-terracotta/30">
                {finding.category}
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-[10px] uppercase font-sans font-semibold tracking-micro text-text-muted block mb-1">
                  Product Finding
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl text-text-primary font-normal">
                  {finding.product}
                </h2>
                <p className="text-xs text-text-secondary mt-1 font-sans">
                  Supplier: <strong className="text-text-primary font-medium">{finding.supplier}</strong>
                </p>
                <p className="text-xs text-text-muted font-sans mt-0.5">
                  PO: {finding.poNumber} · Contract: {finding.contractStatus}
                </p>
              </div>

              {/* Potential Leakage Display */}
              <div className="pt-4 border-t border-border-subtle">
                <span className="text-[10px] uppercase font-sans font-semibold tracking-micro text-text-muted block mb-1">
                  Potential Leakage
                </span>
                <div className="font-serif text-4xl sm:text-5xl font-normal text-brand-terracotta tnum">
                  {finding.potentialLeakage}
                </div>
                <span className="text-xs text-text-secondary mt-1 block font-sans">
                  {finding.variance} variance on total spend of {finding.exposure}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="pt-6 border-t border-border-subtle grid grid-cols-3 gap-3 text-left">
            <div>
              <span className="text-[10px] uppercase tracking-wide text-text-muted block">Actual Price</span>
              <span className="font-serif text-lg text-text-primary tnum">{finding.actualPrice}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wide text-text-muted block">Benchmark</span>
              <span className="font-serif text-lg text-brand-forest-bright tnum">{finding.historicalAverage}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wide text-text-muted block">Units</span>
              <span className="font-serif text-lg text-text-primary tnum">{finding.quantity}</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (7 Columns): AI Analyst (Section 15) */}
        <div className="lg:col-span-7 border border-border-default rounded-[12px] p-6 sm:p-8 bg-transparent flex flex-col justify-between">
          <div className="space-y-6">
            {/* AI Analyst Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <span className="font-sans text-[10px] uppercase tracking-micro font-semibold text-text-primary">
                  AI ANALYST
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-forest-bright animate-pulse" />
                <span className="text-[10px] font-sans font-semibold uppercase tracking-micro text-brand-forest-bright">
                  ANALYSIS COMPLETE
                </span>
              </div>
            </div>

            {/* AI Explanation (Section 15) */}
            <div className="p-5 rounded-[8px] bg-dark-secondary border border-border-subtle space-y-3">
              <p className="text-sm sm:text-base font-sans text-text-primary leading-relaxed">
                100 laptops were purchased from TechWorld at ₹52,000 per unit.
              </p>
              <p className="text-sm sm:text-base font-sans text-text-secondary leading-relaxed">
                Comparable approved suppliers averaged ₹47,500.
              </p>
              <p className="text-sm sm:text-base font-sans text-brand-terracotta-soft leading-relaxed font-medium">
                The difference represents an estimated ₹4.5L in potentially avoidable expenditure.
              </p>
            </div>

            {/* Key Findings List */}
            <div className="space-y-2 text-xs font-sans text-text-secondary">
              <span className="text-[10px] uppercase font-sans font-semibold tracking-micro text-text-muted block mb-2">
                Diagnostic Findings
              </span>
              <div className="space-y-1.5">
                {finding.whyFlagged.map((point, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full bg-brand-terracotta mt-1.5 shrink-0" />
                    <p className="leading-relaxed">{point}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI Actions (Section 16: Primary: forest green, Secondary: dark surface + border) */}
          <div className="pt-6 border-t border-border-subtle flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowEvidenceModal(true)}
              className="h-9 px-3.5 rounded-[8px] text-xs font-sans font-medium text-text-primary bg-dark-secondary hover:bg-dark-elevated border border-border-default transition-colors flex items-center gap-2"
            >
              <FileText className="w-3.5 h-3.5 text-brand-forest-bright" />
              <span>Show Evidence</span>
            </button>

            <button
              onClick={() => onNavigate('suppliers')}
              className="h-9 px-3.5 rounded-[8px] text-xs font-sans font-medium text-text-primary bg-dark-secondary hover:bg-dark-elevated border border-border-default transition-colors flex items-center gap-2"
            >
              <GitCompare className="w-3.5 h-3.5 text-brand-forest-bright" />
              <span>Compare Suppliers</span>
            </button>

            <button
              onClick={() => onNavigate('simulator')}
              className="h-9 px-4 rounded-[8px] text-xs font-sans font-semibold uppercase tracking-wider bg-brand-forest hover:bg-brand-forest-bright text-brand-cream transition-colors shadow-fine flex items-center gap-2"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Calculate Recovery</span>
            </button>

            <button
              onClick={handleExport}
              className="h-9 px-3.5 rounded-[8px] text-xs font-sans font-medium text-text-primary bg-dark-secondary hover:bg-dark-elevated border border-border-default transition-colors flex items-center gap-2 ml-auto"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Finding</span>
            </button>
          </div>
        </div>
      </div>

      {/* WHY THIS WAS FLAGGED (Section 15: 5-Step Evidence Timeline) */}
      <EvidenceTimeline />

      {/* Supporting Evidence Modal */}
      {showEvidenceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setShowEvidenceModal(false)}
          />
          <div className="relative z-10 w-full max-w-xl bg-dark-elevated border border-border-default rounded-[12px] shadow-modal p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div>
                <span className="text-[10px] uppercase font-sans font-semibold tracking-micro text-brand-forest-bright block mb-1">
                  EVIDENCE REPOSITORY
                </span>
                <h3 className="font-serif text-2xl text-text-primary">
                  Transaction Audit Trace · {finding.refNumber}
                </h3>
              </div>
              <button 
                onClick={() => setShowEvidenceModal(false)}
                className="p-1 rounded text-text-muted hover:text-text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-sans">
              <div className="p-3.5 rounded-[8px] bg-dark-secondary border border-border-subtle flex justify-between items-center">
                <div>
                  <p className="font-medium text-text-primary">PO-2026-8841 (TechWorld Systems)</p>
                  <p className="text-text-muted mt-0.5">Invoiced spot billing @ ₹52,000 / unit</p>
                </div>
                <span className="font-serif text-sm font-medium text-brand-terracotta tnum">₹52,00,000</span>
              </div>

              <div className="p-3.5 rounded-[8px] bg-dark-secondary border border-border-subtle flex justify-between items-center">
                <div>
                  <p className="font-medium text-text-primary">PO-2026-6110 (XYZ Supplies - June)</p>
                  <p className="text-text-muted mt-0.5">Historical peer benchmark @ ₹47,200 / unit</p>
                </div>
                <span className="font-serif text-sm font-medium text-brand-forest-bright tnum">₹23,60,000</span>
              </div>

              <div className="p-3.5 rounded-[8px] bg-dark-secondary border border-border-subtle flex justify-between items-center">
                <div>
                  <p className="font-medium text-text-primary">Contract Rate Card MSA-OEM-2024</p>
                  <p className="text-text-muted mt-0.5">Authorized contracted baseline @ ₹47,500 / unit</p>
                </div>
                <span className="font-serif text-sm font-medium text-text-primary tnum">₹47,500</span>
              </div>
            </div>

            <div className="pt-4 border-t border-border-subtle flex justify-end gap-3">
              <button
                onClick={() => setShowEvidenceModal(false)}
                className="h-9 px-4 rounded-[8px] text-xs font-sans text-text-primary bg-dark-card border border-border-default hover:bg-dark-hover"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowEvidenceModal(false);
                  onNavigate('table');
                }}
                className="h-9 px-4 rounded-[8px] text-xs font-sans font-semibold uppercase tracking-wider bg-brand-forest text-brand-cream hover:bg-brand-forest-bright"
              >
                Open In Transactions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
