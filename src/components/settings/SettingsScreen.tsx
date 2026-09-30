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
        <div className="fixed bottom-6 right-6 z-50 bg-[#0A0A0A] text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-[#73C69A]" />
          <div className="text-xs">
            <p className="font-semibold text-white">Parameters Saved</p>
            <p className="text-[#8A8A84]">Detection thresholds successfully applied.</p>
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
          <div className="bg-white rounded-[24px] border border-[#E8E8E3] p-3 shadow-sm space-y-1">
            {sections.map((sec) => {
              const Icon = sec.icon;
              const isActive = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id)}
                  className={`w-full h-10 px-4 rounded-xl flex items-center gap-3 text-xs font-sans transition-all ${
                    isActive
                      ? 'bg-[#0A0A0A] text-white font-medium shadow-sm'
                      : 'text-[#5E5E5A] hover:text-[#111111] hover:bg-[#FAFAF8]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#73C69A]' : 'text-[#8A8A84]'}`} />
                  <span>{sec.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Lifecycle State Preview */}
          <div className="bg-[#FAFAF8] rounded-[24px] border border-[#E8E8E3] p-5 space-y-2">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-[#8A8A84] block mb-1">
              System State Controls
            </span>
            <div className="space-y-1">
              <button
                onClick={() => onSetSystemState('normal')}
                className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-sans transition-colors ${
                  currentSystemState === 'normal'
                    ? 'bg-white font-semibold text-[#111111] border border-[#E8E8E3] shadow-sm'
                    : 'text-[#5E5E5A] hover:text-[#111111]'
                }`}
              >
                ● Normal Operational State
              </button>
              <button
                onClick={() => onSetSystemState('empty')}
                className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-sans transition-colors ${
                  currentSystemState === 'empty'
                    ? 'bg-white font-semibold text-[#111111] border border-[#E8E8E3] shadow-sm'
                    : 'text-[#5E5E5A] hover:text-[#111111]'
                }`}
              >
                ● Empty State
              </button>
              <button
                onClick={() => onSetSystemState('error')}
                className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-sans transition-colors ${
                  currentSystemState === 'error'
                    ? 'bg-white font-semibold text-[#111111] border border-[#E8E8E3] shadow-sm'
                    : 'text-[#5E5E5A] hover:text-[#111111]'
                }`}
              >
                ● Error State
              </button>
            </div>
          </div>
        </div>

        {/* Right Content */}
        <div className="md:col-span-8 bg-white rounded-[24px] border border-[#E8E8E3] p-6 lg:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#F0F0EB]">
            <div>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-[#73C69A] block mb-1">
                Detection Rules
              </span>
              <h3 className="text-xl font-sans font-medium text-[#111111]">
                Tolerance & Audit Thresholds
              </h3>
            </div>
            <span className="text-xs font-mono text-[#8A8A84] bg-[#FAFAF8] px-3 py-1 rounded-full border border-[#E8E8E3]">
              SpendIntel Core Engine
            </span>
          </div>

          {/* Rule 1: Price variance threshold */}
          <div className="space-y-2 pb-5 border-b border-[#F0F0EB]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-semibold text-[#111111]">
                  Price Variance Threshold (%)
                </h4>
                <p className="text-xs text-[#5E5E5A] mt-0.5">
                  Trigger leakage alerts when purchase order exceeds benchmark index.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <input
                  type="number"
                  step="0.5"
                  value={priceVarianceThreshold}
                  onChange={(e) => setPriceVarianceThreshold(Number(e.target.value))}
                  className="w-20 h-10 px-3 rounded-xl bg-[#FAFAF8] border border-[#E8E8E3] text-[#111111] text-xs font-mono text-right tnum focus:outline-none focus:border-[#111111]"
                />
                <span className="text-xs text-[#8A8A84] font-mono">%</span>
              </div>
            </div>
          </div>

          {/* Rule 2: Duplicate similarity */}
          <div className="space-y-2 pb-5 border-b border-[#F0F0EB]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-semibold text-[#111111]">
                  Duplicate Similarity Threshold (%)
                </h4>
                <p className="text-xs text-[#5E5E5A] mt-0.5">
                  Fuzzy line-item similarity match threshold across overlapping POs.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <input
                  type="number"
                  step="1"
                  value={duplicateSimilarity}
                  onChange={(e) => setDuplicateSimilarity(Number(e.target.value))}
                  className="w-20 h-10 px-3 rounded-xl bg-[#FAFAF8] border border-[#E8E8E3] text-[#111111] text-xs font-mono text-right tnum focus:outline-none focus:border-[#111111]"
                />
                <span className="text-xs text-[#8A8A84] font-mono">%</span>
              </div>
            </div>
          </div>

          {/* Rule 3: Discount validation */}
          <div className="space-y-2 pb-5 border-b border-[#F0F0EB]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-semibold text-[#111111]">
                  Automated Discount Tier Validation
                </h4>
                <p className="text-xs text-[#5E5E5A] mt-0.5">
                  Audit unapplied tiered volume rebates and early settlement terms.
                </p>
              </div>
              <button
                onClick={() => setDiscountValidation(!discountValidation)}
                className={`w-12 h-7 rounded-full transition-colors relative p-1 ${
                  discountValidation ? 'bg-[#0A0A0A]' : 'bg-[#E8E8E3]'
                }`}
              >
                <span
                  className={`block w-5 h-5 rounded-full bg-white transition-transform shadow-sm ${
                    discountValidation ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Rule 4: Supplier concentration */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-semibold text-[#111111]">
                  Supplier Concentration Limit (%)
                </h4>
                <p className="text-xs text-[#5E5E5A] mt-0.5">
                  Flag spend concentration exceeding tolerance within a single commodity tier.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <input
                  type="number"
                  step="5"
                  value={supplierConcentration}
                  onChange={(e) => setSupplierConcentration(Number(e.target.value))}
                  className="w-20 h-10 px-3 rounded-xl bg-[#FAFAF8] border border-[#E8E8E3] text-[#111111] text-xs font-mono text-right tnum focus:outline-none focus:border-[#111111]"
                />
                <span className="text-xs text-[#8A8A84] font-mono">%</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#F0F0EB] flex justify-end">
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

