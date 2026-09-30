import React, { useState } from 'react';
import { TabType } from './types';
import { Sidebar } from './components/layout/Sidebar';
import { TopNav } from './components/layout/TopNav';
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

export function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('overview');
  const [selectedFindingRef, setSelectedFindingRef] = useState<string>('FINDING #027');
  const [isLandingHeroVisible, setIsLandingHeroVisible] = useState<boolean>(true);
  const [systemState, setSystemState] = useState<'normal' | 'empty' | 'error'>('normal');
  const [isOpenMobile, setIsOpenMobile] = useState<boolean>(false);

  const handleInvestigateFinding = (findingRef: string) => {
    setSelectedFindingRef(findingRef);
    setCurrentTab('investigation');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderActiveScreen = () => {
    // If previewing Empty State or Error State (Sections 30 & 32)
    if (systemState === 'empty') {
      return (
        <EmptyState
          title="NO PROCUREMENT DATA"
          description="Upload your first dataset and we'll start looking for hidden leakage across purchase orders and vendor contracts."
          actionText="Upload Dataset"
          onAction={() => {
            setSystemState('normal');
            setCurrentTab('upload');
          }}
        />
      );
    }

    if (systemState === 'error') {
      return (
        <ErrorState
          title="ANALYSIS INTERRUPTED"
          description="Something interrupted the analysis. Your original data is safe."
          onRetry={() => {
            setSystemState('normal');
          }}
        />
      );
    }

    // Normal active screen views
    switch (currentTab) {
      case 'overview':
        return (
          <ExecutiveDashboard
            onInvestigate={handleInvestigateFinding}
            onNavigate={(tab) => {
              setCurrentTab(tab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onAnalyzeData={() => {
              setCurrentTab('upload');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        );

      case 'table':
        return (
          <DataTable
            onInvestigateTransaction={(poNumber) => {
              setSelectedFindingRef('FINDING #027');
              setCurrentTab('investigation');
            }}
          />
        );

      case 'leakage':
        return (
          <LeakageExplorer
            onInvestigateFinding={handleInvestigateFinding}
            onNavigate={(tab) => setCurrentTab(tab)}
          />
        );

      case 'suppliers':
        return <SupplierComparison />;

      case 'investigation':
        return (
          <AiInvestigationScreen
            selectedFindingRef={selectedFindingRef}
            onSelectFinding={setSelectedFindingRef}
            onNavigate={(tab) => setCurrentTab(tab)}
          />
        );

      case 'simulator':
        return <ScenarioSimulator />;

      case 'reports':
        return <ReportsScreen />;

      case 'upload':
        return (
          <UploadZone
            onCompleteAnalysis={() => {
              setCurrentTab('overview');
            }}
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
            onInvestigate={handleInvestigateFinding}
            onNavigate={(tab) => setCurrentTab(tab)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg text-text-primary font-sans flex antialiased selection:bg-brand-forest/50 selection:text-brand-cream">
      {/* 240px Fixed Sidebar Navigation (Section 4 & 6) */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          if (systemState !== 'normal') setSystemState('normal');
        }}
        isOpenMobile={isOpenMobile}
        onCloseMobile={() => setIsOpenMobile(false)}
        onOpenUpload={() => setCurrentTab('upload')}
      />

      {/* Main Content Shell (Section 4) */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 64px Top Header (Section 4 & 7) */}
        <TopNav
          currentTab={currentTab}
          onSelectTab={(tab) => {
            setCurrentTab(tab);
            if (systemState !== 'normal') setSystemState('normal');
          }}
          onOpenMobileMenu={() => setIsOpenMobile(true)}
          onSelectFinding={handleInvestigateFinding}
          isLandingHeroVisible={isLandingHeroVisible}
          onToggleLandingHero={() => setIsLandingHeroVisible(!isLandingHeroVisible)}
        />

        {/* Optional Editorial Hero Manifesto (Section 8 & 34) */}
        {isLandingHeroVisible && (
          <EditorialHero
            onAnalyzeData={() => {
              setCurrentTab('upload');
              setIsLandingHeroVisible(false);
            }}
            onExploreDemo={() => {
              setCurrentTab('overview');
              setIsLandingHeroVisible(false);
            }}
          />
        )}

        {/* Dynamic Screen View: 32px padding, max-width 1440px (Section 4) */}
        <main className="flex-1 p-6 sm:p-8 max-w-[1440px] w-full mx-auto">
          {renderActiveScreen()}
        </main>

        {/* Footer */}
        <footer className="border-t border-border-subtle py-6 px-8 text-xs text-text-muted flex flex-col sm:flex-row items-center justify-between gap-4 max-w-[1440px] w-full mx-auto">
          <div className="flex items-center gap-2">
            <span className="font-serif font-medium text-text-primary">LeakGuard AI</span>
            <span>·</span>
            <span>Dark Neo-Minimalism Procurement Spend Intelligence</span>
          </div>

          <div className="flex items-center gap-6 text-text-muted">
            <span>₹18.7 Cr Audited Spend</span>
            <span>•</span>
            <span className="text-brand-terracotta font-mono font-medium">₹31.6L Potential Leakage</span>
            <span>•</span>
            <span>SOC2 Type II & ISO 27001 Certified</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
