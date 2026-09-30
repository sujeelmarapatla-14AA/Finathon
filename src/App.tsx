import React, { useState, useEffect, useCallback } from 'react';
import { TabType, DashboardData, DataSource, ApiSupplierItem } from './types';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthScreen } from './components/auth/AuthScreen';
import { Navbar } from './components/layout/Navbar';
import { PageTransition } from './components/layout/PageTransition';
import { EditorialHero } from './components/landing/EditorialHero';
import { ExecutiveDashboard } from './components/dashboard/ExecutiveDashboard';
import { AiInvestigationScreen } from './components/investigation/AiInvestigationScreen';
import { ScenarioSimulator } from './components/simulator/ScenarioSimulator';
import { SupplierComparison } from './components/suppliers/SupplierComparison';
import { DataTable } from './components/data-table/DataTable';
import { UploadZone } from './components/upload/UploadZone';
import { ReportsScreen } from './components/reports/ReportsScreen';
import { SettingsScreen } from './components/settings/SettingsScreen';
import { LeakageExplorer } from './components/leakage/LeakageExplorer';
import { EmptyState } from './components/common/EmptyState';
import { ErrorState } from './components/common/ErrorState';
import {
  DEMO_FILE_ID,
  fetchDashboardData,
  fetchFindingsData,
  fetchSuppliersData,
  checkHealth,
} from './services/api';
import { formatCompactINR, formatINR } from './utils/formatters';

// Tab ordering for intelligent horizontal slide direction
const TAB_ORDER: Record<TabType, number> = {
  overview: 0,
  table: 1,
  leakage: 2,
  suppliers: 3,
  investigation: 4,
  simulator: 5,
  reports: 6,
  upload: 7,
  settings: 8,
};

function SpendIntelWorkspace() {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<TabType>('overview');
  const [direction, setDirection] = useState<number>(1);
  const [selectedFindingRef, setSelectedFindingRef] = useState<string>('TX10013');

  // Application-level source state (Part 3 & Part 9)
  const [dataSource, setDataSource] = useState<DataSource>(() => {
    return (sessionStorage.getItem('spendintel_source') as DataSource) || 'demo';
  });

  const [fileId, setFileId] = useState<string>(() => {
    return sessionStorage.getItem('spendintel_file_id') || DEMO_FILE_ID;
  });

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [findingsData, setFindingsData] = useState<any[] | null>(null);
  const [suppliersData, setSuppliersData] = useState<ApiSupplierItem[] | null>(null);

  const [isBackendOperational, setIsBackendOperational] = useState<boolean>(true);
  const [systemState, setSystemState] = useState<'normal' | 'empty' | 'error'>('normal');
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Health check on initial startup
  useEffect(() => {
    if (!isAuthenticated) return;
    let isCancelled = false;
    async function verifyHealth() {
      try {
        const res = await checkHealth();
        if (!isCancelled && res.status === 'healthy') {
          setIsBackendOperational(true);
        }
      } catch (err) {
        if (!isCancelled) {
          setIsBackendOperational(false);
        }
      }
    }
    verifyHealth();
    return () => {
      isCancelled = true;
    };
  }, [isAuthenticated]);

  // Centralized data loading for active source
  const loadSourceData = useCallback(async (source: DataSource, activeFileId: string, force: boolean = false) => {
    setIsLoadingData(true);
    setErrorMessage(null);

    try {
      const [dashRes, findingsRes, suppRes] = await Promise.all([
        fetchDashboardData(source, activeFileId, force),
        fetchFindingsData(source, activeFileId, force),
        fetchSuppliersData(source, activeFileId, force),
      ]);

      setDashboardData(dashRes);
      setFindingsData(findingsRes.findings || []);
      setSuppliersData(suppRes.suppliers || []);
      setIsBackendOperational(true);

      // Auto-select first priority finding for investigation
      if (dashRes.priority_findings && dashRes.priority_findings.length > 0) {
        const firstId = dashRes.priority_findings[0].transaction_id || dashRes.priority_findings[0].id;
        if (firstId) setSelectedFindingRef(firstId);
      }
    } catch (err: any) {
      console.warn('Source data load note:', err);
      setErrorMessage(err.message || 'Unable to retrieve live data.');
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  // Reload data whenever source or fileId changes
  useEffect(() => {
    if (!isAuthenticated) return;
    loadSourceData(dataSource, fileId);
    sessionStorage.setItem('spendintel_source', dataSource);
    sessionStorage.setItem('spendintel_file_id', fileId);
  }, [isAuthenticated, dataSource, fileId, loadSourceData]);

  // Handle switching source (Part 9)
  const handleSwitchSource = (newSource: DataSource) => {
    if (newSource === dataSource && newSource !== 'upload') return;

    if (newSource === 'upload') {
      handleNavigate('upload');
      return;
    }

    // Clear stale data to prevent mixing numbers (Part 9)
    setDashboardData(null);
    setFindingsData(null);
    setSuppliersData(null);

    if (newSource === 'demo') {
      setDataSource('demo');
      setFileId(DEMO_FILE_ID);
      setSelectedFindingRef('TX10013');
    } else if (newSource === 'nova') {
      setDataSource('nova');
      setFileId('nova');
      setSelectedFindingRef('PO-12-0044-3');
    } else if (newSource === 'manual') {
      const savedManualId = sessionStorage.getItem('spendintel_manual_file_id');
      if (savedManualId) {
        setDataSource('manual');
        setFileId(savedManualId);
      } else {
        handleNavigate('upload');
        return;
      }
    }

    if (currentTab !== 'overview' && currentTab !== 'table' && currentTab !== 'leakage' && currentTab !== 'suppliers' && currentTab !== 'investigation' && currentTab !== 'simulator') {
      handleNavigate('overview');
    }
  };

  // Intelligent directional navigation handler
  const handleNavigate = (newTab: TabType) => {
    if (newTab === currentTab) return;
    const newDir = TAB_ORDER[newTab] >= TAB_ORDER[currentTab] ? 1 : -1;
    setDirection(newDir);
    setCurrentTab(newTab);
    if (systemState !== 'normal') setSystemState('normal');

    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };

  const handleInvestigateFinding = (findingRef: string) => {
    setSelectedFindingRef(findingRef);
    handleNavigate('investigation');
  };

  const handleLoadDemo = () => {
    handleSwitchSource('demo');
    handleNavigate('overview');
    setSystemState('normal');
  };

  const handleUploadComplete = (newFileId?: string, source: DataSource = 'upload') => {
    if (newFileId) {
      setDataSource(source);
      setFileId(newFileId);
      sessionStorage.setItem('spendintel_source', source);
      sessionStorage.setItem('spendintel_file_id', newFileId);
      if (source === 'manual') {
        sessionStorage.setItem('spendintel_manual_file_id', newFileId);
      }
    }
    handleNavigate('overview');
    setSystemState('normal');
  };

  const renderActiveScreen = () => {
    if (systemState === 'empty') {
      return (
        <EmptyState
          title="No procurement data yet."
          description="Upload your first dataset or connect Live Nova to let SpendIntel uncover hidden leakage."
          actionText="Ingest Dataset"
          onAction={() => handleNavigate('upload')}
        />
      );
    }

    if (systemState === 'error') {
      return (
        <ErrorState
          title="SpendIntel couldn't connect to the intelligence engine."
          description={errorMessage || "Something interrupted the analysis. Your original data is safe."}
          onRetry={() => {
            setSystemState('normal');
            handleSwitchSource('demo');
          }}
        />
      );
    }

    switch (currentTab) {
      case 'overview':
        return (
          <div className="space-y-12">
            <EditorialHero
              dashboardData={dashboardData}
              dataSource={dataSource}
              onAnalyzeData={() => handleNavigate('upload')}
              onExploreDemo={handleLoadDemo}
              onNavigate={handleNavigate}
              onInvestigateFinding={handleInvestigateFinding}
            />

            <ExecutiveDashboard
              dashboardData={dashboardData}
              findingsData={findingsData}
              dataSource={dataSource}
              onSwitchSource={handleSwitchSource}
              onInvestigate={handleInvestigateFinding}
              onNavigate={handleNavigate}
              onAnalyzeData={() => handleNavigate('upload')}
              onLoadDemo={handleLoadDemo}
              isDemoActive={dataSource === 'demo'}
            />
          </div>
        );

      case 'table':
        return (
          <DataTable
            transactions={findingsData || undefined}
            dashboardData={dashboardData}
            source={dataSource}
            fileId={fileId}
            onInvestigateTransaction={handleInvestigateFinding}
          />
        );

      case 'leakage':
        return (
          <LeakageExplorer
            findings={findingsData || undefined}
            source={dataSource}
            fileId={fileId}
            onInvestigateFinding={handleInvestigateFinding}
            onNavigate={handleNavigate}
          />
        );

      case 'suppliers':
        return (
          <SupplierComparison
            suppliers={suppliersData || undefined}
            source={dataSource}
            fileId={fileId}
          />
        );

      case 'investigation':
        return (
          <AiInvestigationScreen
            selectedFindingRef={selectedFindingRef}
            source={dataSource}
            fileId={fileId}
            priorityFindings={dashboardData?.priority_findings}
            allFindings={findingsData || dashboardData?.priority_findings || undefined}
            onSelectFinding={setSelectedFindingRef}
            onNavigate={handleNavigate}
          />
        );

      case 'simulator':
        return <ScenarioSimulator />;

      case 'reports':
        return <ReportsScreen />;

      case 'upload':
        return (
          <UploadZone
            onCompleteAnalysis={handleUploadComplete}
            onSwitchSource={handleSwitchSource}
          />
        );

      case 'settings':
        return (
          <SettingsScreen
            currentSystemState={systemState}
            onSetSystemState={setSystemState}
          />
        );

      default:
        return (
          <ExecutiveDashboard
            dashboardData={dashboardData}
            findingsData={findingsData}
            dataSource={dataSource}
            onSwitchSource={handleSwitchSource}
            onInvestigate={handleInvestigateFinding}
            onNavigate={handleNavigate}
          />
        );
    }
  };

  const backendSource = dashboardData?.source || dataSource;
  const backendSourceLabel = dashboardData?.source_label || (
    backendSource === 'nova' ? 'LIVE NOVA' :
    backendSource === 'upload' ? 'UPLOADED FILE' :
    backendSource === 'manual' ? 'MANUAL DATA' :
    'DEMO DATASET'
  );

  const totalSpendFormatted = dashboardData?.kpis?.total_spend
    ? formatCompactINR(dashboardData.kpis.total_spend)
    : '₹1.61 Cr';

  const potentialLeakageFormatted = dashboardData?.kpis?.potential_leakage
    ? formatCompactINR(dashboardData.kpis.potential_leakage)
    : '₹39.60L';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex flex-col items-center justify-center p-6 text-center selection:bg-[#73C69A]/30">
        <div className="w-10 h-10 border-2 border-[#111111] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-mono tracking-widest uppercase text-[#5E5E5A]">
          Verifying SpendIntel Authentication...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#111111] font-sans flex flex-col antialiased selection:bg-[#73C69A]/30 selection:text-[#0A0A0A] overflow-x-clip">
      {/* Global Fixed Navigation Bar with Mega-Menus (permanently pinned to top) */}
      <Navbar
        currentTab={currentTab}
        dataSource={dataSource}
        backendSourceLabel={backendSourceLabel}
        onSelectTab={handleNavigate}
        onSwitchSource={handleSwitchSource}
        onLoadDemo={handleLoadDemo}
        isDemoActive={dataSource === 'demo'}
        isBackendOperational={isBackendOperational}
      />

      {/* Reserved header spacer so page content is never obscured by the fixed navbar */}
      <div className="h-[72px] shrink-0 w-full" aria-hidden="true" />

      {/* Main Content Area with Horizontal Slide Page Transition */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 py-8 sm:py-10">
        <PageTransition currentKey={currentTab} direction={direction}>
          {renderActiveScreen()}
        </PageTransition>
      </main>

      {/* Editorial Premium Fintech Footer */}
      <footer className="border-t border-[#E8E8E3] bg-white py-8 px-5 sm:px-8 lg:px-12 mt-16 transition-colors">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-[#5E5E5A]">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-semibold text-[#111111] tracking-tight">SpendIntel</span>
            <span className="text-[#DCDCD7]">·</span>
            <span>Procurement intelligence for every rupee you spend.</span>
            <span className="text-[#DCDCD7]">·</span>
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-[#111111] bg-[#FAFAF8] border border-[#E8E8E3] px-2.5 py-0.5 rounded-full shadow-xs">
              <span className={`w-1.5 h-1.5 rounded-full ${
                backendSourceLabel.includes('NOVA') ? 'bg-[#5E81AC] animate-pulse' :
                backendSourceLabel.includes('UPLOAD') ? 'bg-[#E5A93C]' : 'bg-[#73C69A]'
              }`} />
              <span>{backendSourceLabel}</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-6 font-mono text-[11px] text-[#8A8A84]">
            <span className="text-[#111111] font-medium">{totalSpendFormatted} Audited Spend</span>
            <span>•</span>
            <span className="text-[#D96B4A] font-medium">{potentialLeakageFormatted} Potential Leakage</span>
            <span>•</span>
            <span>SOC2 Type II & ISO 27001 Certified</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <SpendIntelWorkspace />
    </AuthProvider>
  );
}

export default App;

