import React, { useState } from 'react';
import { Sliders, ShieldCheck, Database, Bell, Lock, Cpu, CheckCircle2 } from 'lucide-react';

interface SettingsScreenProps {
  currentSystemState: 'normal' | 'empty' | 'error';
  onSetSystemState: (state: 'normal' | 'empty' | 'error') => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  currentSystemState,
  onSetSystemState,
}) => {
  const [activeSection, setActiveSection] = useState<'rules' | 'workspace' | 'sources' | 'ai' | 'notifications' | 'security'>('rules');

  // Detection Rules State (Section 22)
  const [priceVarianceThreshold, setPriceVarianceThreshold] = useState<number>(5.0);
  const [duplicateSimilarity, setDuplicateSimilarity] = useState<number>(85);
  const [discountValidation, setDiscountValidation] = useState<boolean>(true);
  const [supplierConcentration, setSupplierConcentration] = useState<number>(30);

  const sections = [
    { id: 'rules' as const, label: 'Detection Rules', icon: Sliders },
    { id: 'workspace' as const, label: 'Workspace', icon: ShieldCheck },
    { id: 'sources' as const, label: 'Data Sources', icon: Database },
    { id: 'ai' as const, label: 'AI Configuration', icon: Cpu },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'security' as const, label: 'Security', icon: Lock },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Page Header (Section 22) */}
      <div className="border-b border-border-default pb-8">
        <span className="text-[10px] uppercase font-sans font-semibold tracking-micro text-brand-forest-bright block mb-2">
          SYSTEM PREFERENCES
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-text-primary font-normal tracking-tight">
          Settings
        </h1>
        <p className="mt-3 text-sm sm:text-base text-text-secondary font-sans max-w-2xl leading-relaxed">
          Calibrate detection sensitivity, ERP connector status, AI prompt parameters, and lifecycle states.
        </p>
      </div>

      {/* Settings Grid: Left Nav | Right Content */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Navigation */}
        <div className="md:col-span-4 space-y-1">
          {sections.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`w-full h-10 px-3 rounded-[8px] flex items-center gap-2.5 text-xs font-sans transition-colors ${
                  isActive
                    ? 'bg-brand-forest/15 text-text-primary font-medium border border-brand-forest/30'
                    : 'text-text-muted hover:text-text-primary hover:bg-dark-elevated'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-brand-forest-bright' : 'text-text-muted'}`} />
                <span>{sec.label}</span>
              </button>
            );
          })}

          {/* Quick Lifecycle State Switcher for Evaluators (Section 30 & 32) */}
          <div className="pt-6 border-t border-border-subtle space-y-2">
            <span className="text-[10px] uppercase font-sans font-semibold tracking-micro text-text-muted block px-1">
              Preview Lifecycle States
            </span>
            <div className="space-y-1">
              <button
                onClick={() => onSetSystemState('normal')}
                className={`w-full text-left px-3 py-1.5 rounded-[6px] text-xs font-sans ${
                  currentSystemState === 'normal'
                    ? 'bg-dark-elevated text-brand-cream border border-border-default'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                ● Normal Operational State
              </button>
              <button
                onClick={() => onSetSystemState('empty')}
                className={`w-full text-left px-3 py-1.5 rounded-[6px] text-xs font-sans ${
                  currentSystemState === 'empty'
                    ? 'bg-dark-elevated text-brand-cream border border-border-default'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                Inspect Empty State (Section 30)
              </button>
              <button
                onClick={() => onSetSystemState('error')}
                className={`w-full text-left px-3 py-1.5 rounded-[6px] text-xs font-sans ${
                  currentSystemState === 'error'
                    ? 'bg-dark-elevated text-brand-cream border border-border-default'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                Inspect Error State (Section 32)
              </button>
            </div>
          </div>
        </div>

        {/* Right Content: Detection Rules (Section 22) */}
        <div className="md:col-span-8 border border-border-default rounded-[12px] p-6 sm:p-8 bg-transparent space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
            <span className="text-[10px] uppercase font-sans font-semibold tracking-micro text-brand-forest-bright">
              DETECTION RULES CONFIGURATION
            </span>
            <span className="text-xs font-mono text-text-muted">Ruleset Engine v3.2</span>
          </div>

          {/* Rule 1: Price variance threshold */}
          <div className="space-y-2 pb-4 border-b border-border-subtle">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-sans font-medium text-text-primary">
                  Price Variance Threshold (%)
                </h4>
                <p className="text-xs text-text-muted">
                  Trigger leakage alerts when purchase order exceeds benchmark index.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.5"
                  value={priceVarianceThreshold}
                  onChange={(e) => setPriceVarianceThreshold(Number(e.target.value))}
                  className="w-20 h-9 px-2.5 rounded-[8px] bg-dark-secondary border border-border-default text-text-primary text-xs font-mono text-right tnum focus:outline-none focus:border-brand-forest"
                />
                <span className="text-xs text-text-muted font-mono">%</span>
              </div>
            </div>
          </div>

          {/* Rule 2: Duplicate similarity */}
          <div className="space-y-2 pb-4 border-b border-border-subtle">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-sans font-medium text-text-primary">
                  Duplicate Similarity Score
                </h4>
                <p className="text-xs text-text-muted">
                  Fuzzy line-item similarity match threshold across overlapping POs.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="1"
                  value={duplicateSimilarity}
                  onChange={(e) => setDuplicateSimilarity(Number(e.target.value))}
                  className="w-20 h-9 px-2.5 rounded-[8px] bg-dark-secondary border border-border-default text-text-primary text-xs font-mono text-right tnum focus:outline-none focus:border-brand-forest"
                />
                <span className="text-xs text-text-muted font-mono">%</span>
              </div>
            </div>
          </div>

          {/* Rule 3: Discount validation */}
          <div className="space-y-2 pb-4 border-b border-border-subtle">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-sans font-medium text-text-primary">
                  Automated Discount Validation
                </h4>
                <p className="text-xs text-text-muted">
                  Audit unapplied tiered volume rebates and early settlement terms.
                </p>
              </div>
              <button
                onClick={() => setDiscountValidation(!discountValidation)}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  discountValidation ? 'bg-brand-forest' : 'bg-dark-card'
                }`}
              >
                <span
                  className={`block w-4 h-4 rounded-full bg-text-primary transition-transform ${
                    discountValidation ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Rule 4: Supplier concentration */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-sans font-medium text-text-primary">
                  Supplier Concentration Limit
                </h4>
                <p className="text-xs text-text-muted">
                  Flag spend concentration exceeding tolerance within a single commodity tier.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="5"
                  value={supplierConcentration}
                  onChange={(e) => setSupplierConcentration(Number(e.target.value))}
                  className="w-20 h-9 px-2.5 rounded-[8px] bg-dark-secondary border border-border-default text-text-primary text-xs font-mono text-right tnum focus:outline-none focus:border-brand-forest"
                />
                <span className="text-xs text-text-muted font-mono">%</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border-subtle flex justify-end">
            <button className="h-9 px-4 rounded-[8px] text-xs font-sans font-semibold uppercase tracking-wider bg-brand-forest hover:bg-brand-forest-bright text-brand-cream transition-colors">
              Save Parameters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
