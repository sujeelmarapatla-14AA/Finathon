import React, { useState } from 'react';
import { Sliders, ShieldCheck, Database, Bell, Lock, Cpu, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '../common/PageHeader';
import { Button } from '../common/Button';

interface SettingsScreenProps {
  currentSystemState: 'normal' | 'empty' | 'error';
  onSetSystemState: (state: 'normal' | 'empty' | 'error') => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  currentSystemState,
  onSetSystemState,
}) => {
  const [activeSection, setActiveSection] = useState<'rules' | 'workspace' | 'sources' | 'ai' | 'notifications' | 'security'>('rules');

  const [priceVarianceThreshold, setPriceVarianceThreshold] = useState<number>(5.0);
  const [duplicateSimilarity, setDuplicateSimilarity] = useState<number>(85);
  const [discountValidation, setDiscountValidation] = useState<boolean>(true);
  const [supplierConcentration, setSupplierConcentration] = useState<number>(30);
  const [savedToast, setSavedToast] = useState(false);

  const sections = [
    { id: 'rules' as const, label: 'Detection Rules', icon: Sliders },
    { id: 'workspace' as const, label: 'Workspace', icon: ShieldCheck },
    { id: 'sources' as const, label: 'Data Sources', icon: Database },
    { id: 'ai' as const, label: 'AI Configuration', icon: Cpu },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'security' as const, label: 'Security & Certs', icon: Lock },
  ];

  const handleSave = () => {
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-2">
      {savedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#151515] text-[#F3F3F1] px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-[#B8A47A]/30 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-[#B8A47A]" />
          <div className="text-xs">
            <p className="font-semibold text-[#F3F3F1]">Parameters Saved</p>
            <p className="text-[#F3F3F1]/70">Detection thresholds successfully applied.</p>
          </div>
        </div>
      )}

      {/* Header */}
      <PageHeader
        label="Platform Configuration"
        title="Settings"
        subtitle="Calibrate deterministic detection rules, ERP connector endpoints, and system sensitivity thresholds."
      />

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left Nav */}
        <div className="md:col-span-4 space-y-4">
          <div className="bg-white rounded-[24px] border border-[#151515]/10 p-3 shadow-sm space-y-1">
            {sections.map((sec) => {
              const Icon = sec.icon;
              const isActive = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id)}
                  className={`w-full h-10 px-4 rounded-xl flex items-center gap-3 text-xs font-sans transition-all ${
                    isActive
                      ? 'bg-[#151515] text-[#F3F3F1] font-semibold shadow-sm'
                      : 'text-[#151515]/70 hover:text-[#151515] hover:bg-[#151515]/5'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#B8A47A]' : 'text-[#151515]/50'}`} />
                  <span>{sec.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Lifecycle State Preview */}
          <div className="bg-[#F3F3F1] rounded-[24px] border border-[#151515]/10 p-5 space-y-2">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-[#151515]/60 block mb-1">
              System State Controls
            </span>
            <div className="space-y-1">
              <button
                onClick={() => onSetSystemState('normal')}
                className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-sans transition-colors ${
                  currentSystemState === 'normal'
                    ? 'bg-white font-semibold text-[#151515] border border-[#151515]/10 shadow-sm'
                    : 'text-[#151515]/70 hover:text-[#151515]'
                }`}
              >
                ● Normal Operational State
              </button>
              <button
                onClick={() => onSetSystemState('empty')}
                className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-sans transition-colors ${
                  currentSystemState === 'empty'
                    ? 'bg-white font-semibold text-[#151515] border border-[#151515]/10 shadow-sm'
                    : 'text-[#151515]/70 hover:text-[#151515]'
                }`}
              >
                ● Empty State
              </button>
              <button
                onClick={() => onSetSystemState('error')}
                className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-sans transition-colors ${
                  currentSystemState === 'error'
                    ? 'bg-white font-semibold text-[#151515] border border-[#151515]/10 shadow-sm'
                    : 'text-[#151515]/70 hover:text-[#151515]'
                }`}
              >
                ● Error State
              </button>
            </div>
          </div>
        </div>

        {/* Right Content */}
        <div className="md:col-span-8 bg-white rounded-[24px] border border-[#151515]/10 p-6 lg:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#151515]/10">
            <div>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-[#B8A47A] block mb-1">
                Detection Rules
              </span>
              <h3 className="text-xl font-sans font-medium text-[#151515]">
                Tolerance & Audit Thresholds
              </h3>
            </div>
            <span className="text-xs font-mono text-[#151515]/60 bg-[#151515]/5 px-3 py-1 rounded-full border border-[#151515]/10">
              SpendIntel Core Engine
            </span>
          </div>

          {/* Rule 1: Price variance threshold */}
          <div className="space-y-2 pb-5 border-b border-[#151515]/10">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-semibold text-[#151515]">
                  Price Variance Threshold (%)
                </h4>
                <p className="text-xs text-[#151515]/70 mt-0.5">
                  Trigger leakage alerts when purchase order exceeds benchmark index.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <input
                  type="number"
                  step="0.5"
                  value={priceVarianceThreshold}
                  onChange={(e) => setPriceVarianceThreshold(Number(e.target.value))}
                  className="w-20 h-10 px-3 rounded-xl bg-[#F3F3F1] border border-[#151515]/15 text-[#151515] text-xs font-mono text-right tnum focus:outline-none focus:border-[#B8A47A]"
                />
                <span className="text-xs text-[#151515]/50 font-mono">%</span>
              </div>
            </div>
          </div>

          {/* Rule 2: Duplicate similarity */}
          <div className="space-y-2 pb-5 border-b border-[#151515]/10">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-semibold text-[#151515]">
                  Duplicate Similarity Threshold (%)
                </h4>
                <p className="text-xs text-[#151515]/70 mt-0.5">
                  Fuzzy line-item similarity match threshold across overlapping POs.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <input
                  type="number"
                  step="1"
                  value={duplicateSimilarity}
                  onChange={(e) => setDuplicateSimilarity(Number(e.target.value))}
                  className="w-20 h-10 px-3 rounded-xl bg-[#F3F3F1] border border-[#151515]/15 text-[#151515] text-xs font-mono text-right tnum focus:outline-none focus:border-[#B8A47A]"
                />
                <span className="text-xs text-[#151515]/50 font-mono">%</span>
              </div>
            </div>
          </div>

          {/* Rule 3: Discount validation */}
          <div className="space-y-2 pb-5 border-b border-[#151515]/10">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-semibold text-[#151515]">
                  Automated Discount Tier Validation
                </h4>
                <p className="text-xs text-[#151515]/70 mt-0.5">
                  Audit unapplied tiered volume rebates and early settlement terms.
                </p>
              </div>
              <button
                onClick={() => setDiscountValidation(!discountValidation)}
                className={`w-12 h-7 rounded-full transition-colors relative p-1 ${
                  discountValidation ? 'bg-[#151515]' : 'bg-[#151515]/20'
                }`}
              >
                <span
                  className={`block w-5 h-5 rounded-full bg-[#F3F3F1] transition-transform shadow-sm ${
                    discountValidation ? 'translate-x-5 bg-[#B8A47A]' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Rule 4: Supplier concentration */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-semibold text-[#151515]">
                  Supplier Concentration Limit (%)
                </h4>
                <p className="text-xs text-[#151515]/70 mt-0.5">
                  Flag spend concentration exceeding tolerance within a single commodity tier.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <input
                  type="number"
                  step="5"
                  value={supplierConcentration}
                  onChange={(e) => setSupplierConcentration(Number(e.target.value))}
                  className="w-20 h-10 px-3 rounded-xl bg-[#F3F3F1] border border-[#151515]/15 text-[#151515] text-xs font-mono text-right tnum focus:outline-none focus:border-[#B8A47A]"
                />
                <span className="text-xs text-[#151515]/50 font-mono">%</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#151515]/10 flex justify-end">
            <Button
              variant="primary"
              size="md"
              onClick={handleSave}
            >
              Save Parameters
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
