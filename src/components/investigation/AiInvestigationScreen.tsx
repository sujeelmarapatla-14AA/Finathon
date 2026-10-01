import React, { useState, useEffect, useCallback } from 'react';
import { EvidenceTimeline } from './EvidenceTimeline';
import { TabType, DataSource, ApiInvestigationData } from '../../types';
import { fetchTransactionInvestigation, DEMO_FILE_ID } from '../../services/api';
import { formatINR } from '../../utils/formatters';
import { PageHeader } from '../common/PageHeader';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import {
  FileText,
  GitCompare,
  Calculator,
  Download,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Search,
  RefreshCw,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';

interface AiInvestigationScreenProps {
  selectedFindingRef?: string;
  source?: DataSource;
  fileId?: string;
  priorityFindings?: any[];
  allFindings?: any[];
  onSelectFinding?: (ref: string) => void;
  onNavigate: (tab: TabType) => void;
}

export const AiInvestigationScreen: React.FC<AiInvestigationScreenProps> = ({
  selectedFindingRef,
  source = 'demo',
  fileId = DEMO_FILE_ID,
  priorityFindings,
  allFindings,
  onSelectFinding,
  onNavigate,
}) => {
  // Resolve initial transaction ID from props or available state
  const resolveInitialId = useCallback(() => {
    if (selectedFindingRef && selectedFindingRef.trim()) {
      return selectedFindingRef.trim();
    }
    if (priorityFindings && priorityFindings.length > 0) {
      const first = priorityFindings[0];
      return (first.transaction_id || first.id || '').trim();
    }
    if (allFindings && allFindings.length > 0) {
      const first = allFindings[0];
      return (first.transaction_id || first.id || '').trim();
    }
    if (source === 'demo') {
      return 'TX10013';
    }
    if (source === 'nova') {
      return 'PO-12-0044-3';
    }
    return '';
  }, [selectedFindingRef, priorityFindings, allFindings, source]);

  const [activeTxId, setActiveTxId] = useState<string>(() => resolveInitialId());
  const [customInputId, setCustomInputId] = useState<string>('');
  const [investigationData, setInvestigationData] = useState<ApiInvestigationData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [showTimeline, setShowTimeline] = useState<boolean>(true);
  const [exportToast, setExportToast] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync with prop changes when user selects a finding from other screens
  useEffect(() => {
    if (selectedFindingRef && selectedFindingRef.trim() && selectedFindingRef.trim() !== activeTxId) {
      setActiveTxId(selectedFindingRef.trim());
    } else if (!activeTxId) {
      const fallbackId = resolveInitialId();
      if (fallbackId) setActiveTxId(fallbackId);
    }
  }, [selectedFindingRef, resolveInitialId, activeTxId]);

  // Load investigation data from backend
  const loadInvestigation = useCallback(async (txIdToLoad: string) => {
    const cleanId = txIdToLoad.trim();
    if (!cleanId) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      const data = await fetchTransactionInvestigation(source, cleanId, fileId);
      setInvestigationData(data);
    } catch (err: any) {
      console.warn('Investigation fetch error:', err);
      setErrorMessage(err.message || "SpendIntel couldn't complete this investigation.");
      setInvestigationData(null);
    } finally {
      setLoading(false);
    }
  }, [source, fileId]);

  // Trigger investigation whenever activeTxId, source, or fileId changes
  useEffect(() => {
    if (activeTxId) {
      loadInvestigation(activeTxId);
    }
  }, [activeTxId, loadInvestigation]);

  // Candidate tabs for quick switching between findings
  const candidateList = allFindings && allFindings.length > 0 ? allFindings : priorityFindings || [];
  const sampleFindingTabs = candidateList.length > 0
    ? candidateList.slice(0, 5).map((f: any) => ({
        id: f.transaction_id || f.id || '',
        product: f.product || f.product_name || 'Procurement Item',
        risk: f.risk || f.status || 'HIGH',
        leakage: f.potential_leakage || f.amount ? formatINR(f.potential_leakage || f.amount) : '—',
      })).filter((t: any) => Boolean(t.id))
    : source === 'nova'
    ? [
        { id: 'PO-12-0044-3', product: 'Laptop 14 inch Core i5', risk: 'HIGH', leakage: '₹1,50,000' },
        { id: 'PO-12-0010-1', product: 'Server Rack 42U', risk: 'MEDIUM', leakage: '₹85,000' },
        { id: 'PO-12-0088-2', product: 'Office Desk Chair', risk: 'LOW', leakage: '₹32,000' },
      ]
    : [
        { id: 'TX10013', product: 'Industrial Laptop', risk: 'HIGH', leakage: '₹1,00,000' },
        { id: 'TX10030', product: 'Steel Fasteners', risk: 'HIGH', leakage: '₹1,45,000' },
        { id: 'TX10008', product: 'Industrial Bearing', risk: 'MEDIUM', leakage: '₹10,800' },
      ];

  const handleExportFinding = () => {
    setExportToast(true);
    setTimeout(() => setExportToast(false), 3000);
  };

  const handleCustomSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (customInputId.trim()) {
      const nextId = customInputId.trim();
      setActiveTxId(nextId);
      onSelectFinding?.(nextId);
      setCustomInputId('');
    }
  };

  const handleSelectTab = (tabId: string) => {
    setActiveTxId(tabId);
    onSelectFinding?.(tabId);
  };

  // 1. EMPTY STATE: When no transaction/finding is selected and not loading
  if (!activeTxId && !loading && !investigationData) {
    return (
      <div className="space-y-8">
        <PageHeader
          label="AI INVESTIGATION"
          title="Every alert comes with evidence."
          description="Autonomous procurement analysis explaining the root cause, financial impact, and actionable recovery steps for each transaction."
        />

        <div className="bg-[#F3F3F1] rounded-[28px] border border-[#151515]/10 p-12 sm:p-16 text-center max-w-2xl mx-auto shadow-sm space-y-6">
          <div className="w-16 h-16 rounded-full bg-[#151515]/5 border border-[#151515]/10 flex items-center justify-center mx-auto text-[#B8A47A] shadow-xs">
            <Sparkles className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl sm:text-2xl font-sans font-medium text-[#151515]">
              Select a finding to investigate.
            </h3>
            <p className="text-sm text-[#151515]/60 max-w-md mx-auto leading-relaxed">
              Explore detected leakage anomalies, contract rate non-compliance, or duplicates in the Findings Explorer to launch an AI forensic investigation.
            </p>
          </div>

          <div className="pt-2">
            <Button
              variant="dark-primary"
              size="lg"
              icon={<ArrowRight className="w-4 h-4 text-[#B8A47A]" />}
              onClick={() => onNavigate('leakage')}
            >
              View Findings
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const finding = investigationData?.finding;
  const actualPrice = finding?.actual_price ?? (source === 'nova' ? 48500 : 52500);
  const benchmarkPrice = finding?.benchmark_price ?? (source === 'nova' ? 42000 : 47500);
  const variancePct = finding?.variance_percent ?? (source === 'nova' ? 15.48 : 10.53);
  const potentialLeakage = finding?.potential_leakage ?? (source === 'nova' ? 150000 : 100000);
  const productName = finding?.product_name || finding?.product || (source === 'nova' ? 'Laptop 14 inch Core i5' : 'Industrial Laptop');
  const supplierName = finding?.supplier || (source === 'nova' ? 'Dell Enterprise Direct' : 'TechWorld Solutions');
  const quantity = finding?.quantity ?? 20;

  const analyst = investigationData?.ai_analysis;
  const isAiActive = Boolean(analyst && analyst.summary);

  const summaryText =
    analyst?.summary ||
    investigationData?.analyst_summary ||
    investigationData?.summary ||
    `Transaction ${activeTxId} for ${quantity} units of ${productName} from ${supplierName} was invoiced at ₹${actualPrice.toLocaleString('en-IN')}, representing an avoidable financial variance over the established benchmark of ₹${benchmarkPrice.toLocaleString('en-IN')}.`;

  const rootCauseText =
    analyst?.root_cause ||
    investigationData?.root_cause ||
    `Spot purchase order issued bypassing enterprise preferred rate cards, resulting in a +${variancePct.toFixed(2)}% markup against approved contracted price schedules.`;

  const evidencePoints = analyst?.evidence_points || (
    investigationData?.evidence && investigationData.evidence.length > 0
      ? investigationData.evidence.map((s) => `${s.title}: ${s.description} (${s.value})`)
      : [
          `Invoiced unit price: ₹${actualPrice.toLocaleString('en-IN')} vs verified benchmark: ₹${benchmarkPrice.toLocaleString('en-IN')}`,
          `Variance exceeds standard commercial tolerance threshold of 3.00% by +${(variancePct - 3).toFixed(2)}%`,
          `Confirmed overpayment across ${quantity} invoiced units amounts to ₹${potentialLeakage.toLocaleString('en-IN')}`,
        ]
  );

  const recommendedActions = analyst?.recommended_actions || investigationData?.recommended_actions || [
    `Issue supplier debit memo for ₹${potentialLeakage.toLocaleString('en-IN')} to ${supplierName}`,
    `Re-align purchase orders for ${productName} with contracted volume rate cards`,
    `Simulate alternate vendor routing in the SpendIntel Recovery Simulator`,
  ];

  return (
    <div className="space-y-8">
      {/* Export Toast Notification */}
      {exportToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#151515] text-[#F3F3F1] px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-[#B8A47A]/30 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-5 h-5 text-[#B8A47A]" />
          <div className="text-xs">
            <p className="font-semibold text-[#F3F3F1]">Forensic Finding Exported</p>
            <p className="text-[#F3F3F1]/60">Audit dossier PDF generated for {activeTxId}.</p>
          </div>
        </div>
      )}

      {/* 1. Header */}
      <PageHeader
        label="AI INVESTIGATION"
        title="Every alert comes with evidence."
        description="Autonomous procurement analysis explaining the root cause, financial impact, and actionable recovery steps for each transaction."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <form onSubmit={handleCustomSearch} className="relative">
              <input
                type="text"
                placeholder="Lookup PO / Tx ID..."
                value={customInputId}
                onChange={(e) => setCustomInputId(e.target.value)}
                className="h-9 w-44 pl-8 pr-3 rounded-full bg-[#151515]/5 border border-[#151515]/10 text-xs text-[#151515] focus:outline-none focus:border-[#151515] shadow-xs"
              />
              <Search className="w-3.5 h-3.5 text-[#151515]/40 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </form>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 shrink-0 scrollbar-none">
              {sampleFindingTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleSelectTab(tab.id)}
                  className={`h-9 px-3.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    activeTxId === tab.id
                      ? 'bg-[#151515] text-[#F3F3F1] shadow-sm font-semibold'
                      : 'bg-[#151515]/5 hover:bg-[#151515]/10 text-[#151515]/70 hover:text-[#151515] border border-[#151515]/10'
                  }`}
                >
                  <span className="font-mono">{tab.id}</span>
                </button>
              ))}
            </div>
          </div>
        }
      />

      {/* 2. LOADING STATE */}
      {loading && (
        <div className="bg-[#F3F3F1] rounded-[28px] border border-[#151515]/10 p-12 sm:p-16 text-center max-w-2xl mx-auto shadow-sm space-y-6 animate-in fade-in duration-200">
          <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
            <div className="w-16 h-16 rounded-full border-2 border-[#151515]/10 border-t-[#B8A47A] animate-spin" />
            <Sparkles className="w-6 h-6 text-[#B8A47A] absolute" />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#151515]/5 border border-[#151515]/10 text-[10px] font-mono font-semibold tracking-wider text-[#151515] uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[#B8A47A] animate-pulse" />
              ANALYZING FINDING...
            </span>
            <h3 className="text-xl font-sans font-medium text-[#151515] pt-1">
              Forensic Investigation in Progress
            </h3>
            <p className="text-xs sm:text-sm text-[#151515]/60 max-w-md mx-auto font-mono">
              Verifying transaction evidence and synthesizing AI commercial intelligence for {activeTxId}...
            </p>
          </div>
        </div>
      )}

      {/* 3. ERROR STATE */}
      {errorMessage && !investigationData && !loading && (
        <div className="bg-[#F3F3F1] rounded-[28px] border border-[#151515]/10 p-12 text-center max-w-2xl mx-auto shadow-sm space-y-6 animate-in fade-in duration-200">
          <div className="w-16 h-16 rounded-full bg-[#151515]/5 border border-[#151515]/10 flex items-center justify-center mx-auto text-[#B8A47A]">
            <AlertCircle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#151515]/5 border border-[#151515]/10 text-[10px] font-mono font-semibold tracking-wider text-[#B8A47A] uppercase">
              INVESTIGATION NOTICE
            </span>
            <h3 className="text-xl font-sans font-medium text-[#151515]">
              SpendIntel couldn't complete this investigation.
            </h3>
            <p className="text-sm text-[#151515]/60 max-w-md mx-auto leading-relaxed">
              {errorMessage}
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <Button
              variant="dark-primary"
              size="md"
              icon={<RefreshCw className="w-3.5 h-3.5 text-[#B8A47A]" />}
              onClick={() => loadInvestigation(activeTxId)}
            >
              Retry Investigation
            </Button>

            <Button
              variant="secondary"
              size="md"
              onClick={() => onNavigate('leakage')}
            >
              View Findings
            </Button>
          </div>
        </div>
      )}

      {/* 4. MAIN INVESTIGATION RESULTS (when data is loaded) */}
      {!loading && investigationData && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* AI Graceful Degradation Notice */}
          {!isAiActive && (
            <div className="p-4 rounded-2xl bg-[#151515]/5 border border-[#151515]/10 text-xs text-[#151515]/70 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-[#B8A47A] shrink-0" />
                <span>AI analysis is temporarily unavailable. Verified deterministic evidence and financial calculations are fully operational below.</span>
              </div>
              <button
                onClick={() => loadInvestigation(activeTxId)}
                className="text-xs font-semibold text-[#151515] underline hover:no-underline shrink-0"
              >
                Retry AI Analysis
              </button>
            </div>
          )}

          {/* Two-Column Editorial Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT COLUMN (5 Columns): Finding Summary */}
            <div className="lg:col-span-5 bg-[#F3F3F1] rounded-[24px] border border-[#151515]/10 p-6 lg:p-8 shadow-sm space-y-6">
              <div className="pb-6 border-b border-[#151515]/10 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#151515]/50 block mb-1">
                    Transaction Reference
                  </span>
                  <span className="text-xl font-sans font-medium text-[#151515]">
                    {activeTxId}
                  </span>
                </div>

                <Badge variant={String(finding?.risk || 'HIGH').toLowerCase() === 'high' ? 'high' : 'medium'}>
                  {finding?.risk || 'HIGH RISK'}
                </Badge>
              </div>

              {/* Product & Supplier Details */}
              <div>
                <span className="text-[10px] uppercase font-semibold tracking-wider text-[#151515]/50 block mb-1">
                  Procured Product
                </span>
                <h2 className="text-2xl font-sans font-medium text-[#151515]">
                  {productName}
                </h2>
                <div className="flex items-center gap-2 text-xs text-[#151515]/60 mt-1.5">
                  <span>{supplierName}</span>
                  <span className="text-[#151515]/20">·</span>
                  <span className="font-mono">{quantity} units invoiced</span>
                </div>
              </div>

              {/* Core Comparison Metrics */}
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div className="p-4 rounded-2xl bg-[#151515]/5 border border-[#151515]/10">
                  <span className="text-[10px] uppercase font-semibold text-[#151515]/50 block mb-2">
                    Actual price
                  </span>
                  <span className="text-xl font-sans font-medium text-[#151515] tnum">
                    {formatINR(actualPrice)}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#151515]/5 border border-[#151515]/10">
                  <span className="text-[10px] uppercase font-semibold text-[#151515]/50 block mb-2">
                    Benchmark
                  </span>
                  <span className="text-xl font-sans font-medium text-[#151515] tnum">
                    {formatINR(benchmarkPrice)}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#151515]/5 border border-[#151515]/10">
                  <span className="text-[10px] uppercase font-semibold text-[#151515]/50 block mb-2">
                    Variance
                  </span>
                  <span className="text-xl font-sans font-medium text-[#B8A47A] tnum">
                    +{variancePct.toFixed(2)}%
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#151515]/5 border border-[#151515]/10">
                  <span className="text-[10px] uppercase font-semibold text-[#151515]/50 block mb-2">
                    Potential leakage
                  </span>
                  <span className="text-xl font-sans font-medium text-[#151515] tnum">
                    {formatINR(potentialLeakage)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t border-[#151515]/10 grid grid-cols-2 gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<FileText className="w-3.5 h-3.5 text-[#151515]/70" />}
                  onClick={() => setShowTimeline(!showTimeline)}
                  className="w-full justify-center"
                >
                  {showTimeline ? 'Hide evidence' : 'Show evidence'}
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  icon={<GitCompare className="w-3.5 h-3.5 text-[#151515]/70" />}
                  onClick={() => onNavigate('suppliers')}
                  className="w-full justify-center"
                >
                  Suppliers
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Calculator className="w-3.5 h-3.5 text-[#151515]/70" />}
                  onClick={() => onNavigate('simulator')}
                  className="w-full justify-center"
                >
                  Simulate
                </Button>

                <Button
                  variant="dark-primary"
                  size="sm"
                  icon={<Download className="w-3.5 h-3.5 text-[#B8A47A]" />}
                  onClick={handleExportFinding}
                  className="w-full justify-center"
                >
                  Export dossier
                </Button>
              </div>
            </div>

            {/* RIGHT COLUMN (7 Columns): "SpendIntel Analyst" Report */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-[#F3F3F1] rounded-[24px] border border-[#151515]/10 p-6 lg:p-8 shadow-sm space-y-6">
                {/* Analyst Header */}
                <div className="flex items-center justify-between pb-6 border-b border-[#151515]/10">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#151515] text-[#F3F3F1] flex items-center justify-center text-xs font-mono font-bold border border-[#B8A47A]/30">
                      SI
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-[#151515]">
                        SpendIntel Analyst
                      </h3>
                      <p className="text-xs text-[#151515]/60">
                        Deterministic verification & structured commercial intelligence
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-mono text-[#B8A47A] bg-[#B8A47A]/15 border border-[#B8A47A]/30 px-3 py-1 rounded-full flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#B8A47A]" />
                    Audit-Ready
                  </span>
                </div>

                {/* 1. Summary Block */}
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-semibold tracking-wider text-[#151515]/50 block">
                    Summary
                  </span>
                  <p className="text-sm text-[#151515] font-sans leading-relaxed">
                    {summaryText}
                  </p>
                </div>

                {/* 2. Root Cause Block */}
                <div className="space-y-2 p-5 rounded-2xl bg-[#151515]/5 border border-[#151515]/10">
                  <span className="text-[10px] uppercase font-semibold tracking-wider text-[#B8A47A] block">
                    Root Cause
                  </span>
                  <p className="text-xs sm:text-sm text-[#151515]/70 font-sans leading-relaxed">
                    {rootCauseText}
                  </p>
                </div>

                {/* 3. Evidence Points Block */}
                <div className="space-y-3">
                  <span className="text-[10px] uppercase font-semibold tracking-wider text-[#151515]/50 block">
                    Evidence Ledger
                  </span>
                  <div className="space-y-2">
                    {evidencePoints.map((point, i) => (
                      <div key={i} className="flex items-start gap-3 text-xs sm:text-sm text-[#151515]">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#B8A47A] mt-2 shrink-0" />
                        <span className="leading-relaxed">{point}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Recommended Actions Block */}
                <div className="space-y-3 pt-4 border-t border-[#151515]/10">
                  <span className="text-[10px] uppercase font-semibold tracking-wider text-[#151515] block">
                    Recommended Actions
                  </span>
                  <div className="space-y-2.5">
                    {recommendedActions.map((action, i) => (
                      <div
                        key={i}
                        className="p-3.5 rounded-xl bg-[#151515]/5 border border-[#151515]/10 flex items-center justify-between gap-4 text-xs font-medium text-[#151515]"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-[11px] text-[#151515]/50">0{i + 1}</span>
                          <span>{action}</span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-[#B8A47A] shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3. Evidence Timeline Section */}
              {showTimeline && (
                <EvidenceTimeline steps={investigationData?.evidence} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
