import React from 'react';
import { TabType, DataSource } from '../../types';

interface FooterProps {
  currentTab: TabType;
  dataSource: DataSource;
  backendSourceLabel: string;
  isBackendOperational: boolean;
  onSelectTab: (tab: TabType) => void;
  onSwitchSource?: (source: DataSource) => void;
}

export const Footer: React.FC<FooterProps> = ({
  currentTab,
  dataSource,
  backendSourceLabel,
  isBackendOperational,
  onSelectTab,
  onSwitchSource,
}) => {
  const handleSourceClick = (src: DataSource) => {
    if (src === 'upload') {
      onSelectTab('upload');
    } else if (onSwitchSource) {
      onSwitchSource(src);
    }
  };

  return (
    <footer
      className="mt-auto w-full border-t border-[rgba(243,243,241,0.12)] bg-[#151515] text-[#F3F3F1] selection:bg-[#B8A47A]/30 selection:text-[#F3F3F1]"
      role="contentinfo"
      aria-label="SpendIntel Enterprise Footer"
    >
      {/* Main Multi-Section Grid */}
      <div className="mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-12 pt-14 pb-10">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-12 lg:gap-12">
          {/* Brand & Descriptor (Left) */}
          <div className="sm:col-span-2 md:col-span-4 lg:col-span-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-sm tracking-[0.2em] font-semibold text-[#F3F3F1] uppercase">
                SPENDINTEL
              </span>
              <span className="h-3.5 w-px bg-[rgba(243,243,241,0.2)]" aria-hidden="true" />
              <span className="text-[11px] font-mono tracking-wider text-[#B8A47A] uppercase">
                Enterprise
              </span>
            </div>

            <p className="text-sm text-[#F3F3F1] font-medium leading-relaxed max-w-md">
              Procurement intelligence for smarter spending.
            </p>

            <p className="text-xs text-[rgba(243,243,241,0.65)] leading-relaxed max-w-sm">
              Turn procurement data into measurable savings, supplier intelligence, and actionable forensic insights.
            </p>

            <div className="pt-2 flex items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(243,243,241,0.12)] bg-[#151515] px-3 py-1 text-[11px] font-mono text-[rgba(243,243,241,0.75)]">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isBackendOperational ? 'bg-[#B8A47A] shadow-[0_0_6px_rgba(184,164,122,0.8)]' : 'bg-red-500'
                  }`}
                  aria-hidden="true"
                />
                <span>Active: {backendSourceLabel}</span>
              </div>
            </div>
          </div>

          {/* Product Links */}
          <div className="md:col-span-3 lg:col-span-3 space-y-3">
            <h3 className="text-[11px] font-mono font-semibold uppercase tracking-[0.14em] text-[rgba(243,243,241,0.9)]">
              PRODUCT
            </h3>
            <nav className="flex flex-col space-y-2.5 text-xs" aria-label="Product navigation">
              <button
                type="button"
                onClick={() => onSelectTab('overview')}
                className={`text-left transition-colors duration-200 cursor-pointer ${
                  currentTab === 'overview'
                    ? 'text-[#B8A47A] font-medium'
                    : 'text-[rgba(243,243,241,0.65)] hover:text-[#B8A47A]'
                }`}
              >
                Dashboard
              </button>
              <button
                type="button"
                onClick={() => onSelectTab('leakage')}
                className={`text-left transition-colors duration-200 cursor-pointer ${
                  currentTab === 'leakage'
                    ? 'text-[#B8A47A] font-medium'
                    : 'text-[rgba(243,243,241,0.65)] hover:text-[#B8A47A]'
                }`}
              >
                Analyze Spend
              </button>
              <button
                type="button"
                onClick={() => onSelectTab('product-intelligence')}
                className={`text-left transition-colors duration-200 cursor-pointer ${
                  currentTab === 'product-intelligence'
                    ? 'text-[#B8A47A] font-medium'
                    : 'text-[rgba(243,243,241,0.65)] hover:text-[#B8A47A]'
                }`}
              >
                Product Intelligence
              </button>
              <button
                type="button"
                onClick={() => onSelectTab('table')}
                className={`text-left transition-colors duration-200 cursor-pointer ${
                  currentTab === 'table'
                    ? 'text-[#B8A47A] font-medium'
                    : 'text-[rgba(243,243,241,0.65)] hover:text-[#B8A47A]'
                }`}
              >
                Findings
              </button>
              <button
                type="button"
                onClick={() => onSelectTab('suppliers')}
                className={`text-left transition-colors duration-200 cursor-pointer ${
                  currentTab === 'suppliers'
                    ? 'text-[#B8A47A] font-medium'
                    : 'text-[rgba(243,243,241,0.65)] hover:text-[#B8A47A]'
                }`}
              >
                Suppliers
              </button>
              <button
                type="button"
                onClick={() => onSelectTab('investigation')}
                className={`text-left transition-colors duration-200 cursor-pointer ${
                  currentTab === 'investigation'
                    ? 'text-[#B8A47A] font-medium'
                    : 'text-[rgba(243,243,241,0.65)] hover:text-[#B8A47A]'
                }`}
              >
                Investigation
              </button>
            </nav>
          </div>

          {/* Data Sources */}
          <div className="md:col-span-3 lg:col-span-2 space-y-3">
            <h3 className="text-[11px] font-mono font-semibold uppercase tracking-[0.14em] text-[rgba(243,243,241,0.9)]">
              DATA SOURCES
            </h3>
            <div className="flex flex-col space-y-2.5 text-xs">
              <button
                type="button"
                onClick={() => handleSourceClick('demo')}
                className={`text-left flex items-center justify-between transition-colors duration-200 cursor-pointer ${
                  dataSource === 'demo'
                    ? 'text-[#B8A47A] font-medium'
                    : 'text-[rgba(243,243,241,0.65)] hover:text-[#B8A47A]'
                }`}
              >
                <span>Demo Data</span>
                {dataSource === 'demo' && (
                  <span className="h-1.5 w-1.5 rounded-full bg-[#B8A47A]" aria-hidden="true" />
                )}
              </button>
              <button
                type="button"
                onClick={() => handleSourceClick('upload')}
                className={`text-left flex items-center justify-between transition-colors duration-200 cursor-pointer ${
                  dataSource === 'upload'
                    ? 'text-[#B8A47A] font-medium'
                    : 'text-[rgba(243,243,241,0.65)] hover:text-[#B8A47A]'
                }`}
              >
                <span>Upload Data</span>
                {dataSource === 'upload' && (
                  <span className="h-1.5 w-1.5 rounded-full bg-[#B8A47A]" aria-hidden="true" />
                )}
              </button>
              <button
                type="button"
                onClick={() => handleSourceClick('manual')}
                className={`text-left flex items-center justify-between transition-colors duration-200 cursor-pointer ${
                  dataSource === 'manual'
                    ? 'text-[#B8A47A] font-medium'
                    : 'text-[rgba(243,243,241,0.65)] hover:text-[#B8A47A]'
                }`}
              >
                <span>Manual Entry</span>
                {dataSource === 'manual' && (
                  <span className="h-1.5 w-1.5 rounded-full bg-[#B8A47A]" aria-hidden="true" />
                )}
              </button>
              <button
                type="button"
                onClick={() => handleSourceClick('nova')}
                className={`text-left flex items-center justify-between transition-colors duration-200 cursor-pointer ${
                  dataSource === 'nova'
                    ? 'text-[#B8A47A] font-medium'
                    : 'text-[rgba(243,243,241,0.65)] hover:text-[#B8A47A]'
                }`}
              >
                <span>Live Nova</span>
                {dataSource === 'nova' && (
                  <span className="h-1.5 w-1.5 rounded-full bg-[#B8A47A]" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          {/* Platform & Workspace */}
          <div className="md:col-span-2 lg:col-span-2 space-y-3">
            <h3 className="text-[11px] font-mono font-semibold uppercase tracking-[0.14em] text-[rgba(243,243,241,0.9)]">
              PLATFORM
            </h3>
            <nav className="flex flex-col space-y-2.5 text-xs" aria-label="Platform navigation">
              <button
                type="button"
                onClick={() => onSelectTab('simulator')}
                className={`text-left transition-colors duration-200 cursor-pointer ${
                  currentTab === 'simulator'
                    ? 'text-[#B8A47A] font-medium'
                    : 'text-[rgba(243,243,241,0.65)] hover:text-[#B8A47A]'
                }`}
              >
                Recovery Simulator
              </button>
              <button
                type="button"
                onClick={() => onSelectTab('reports')}
                className={`text-left transition-colors duration-200 cursor-pointer ${
                  currentTab === 'reports'
                    ? 'text-[#B8A47A] font-medium'
                    : 'text-[rgba(243,243,241,0.65)] hover:text-[#B8A47A]'
                }`}
              >
                Audit Reports
              </button>
              <button
                type="button"
                onClick={() => onSelectTab('upload')}
                className={`text-left transition-colors duration-200 cursor-pointer ${
                  currentTab === 'upload'
                    ? 'text-[#B8A47A] font-medium'
                    : 'text-[rgba(243,243,241,0.65)] hover:text-[#B8A47A]'
                }`}
              >
                Data Ingestion
              </button>
              <button
                type="button"
                onClick={() => onSelectTab('settings')}
                className={`text-left transition-colors duration-200 cursor-pointer ${
                  currentTab === 'settings'
                    ? 'text-[#B8A47A] font-medium'
                    : 'text-[rgba(243,243,241,0.65)] hover:text-[#B8A47A]'
                }`}
              >
                Preferences
              </button>
            </nav>
          </div>
        </div>

        {/* Bottom Bar Divider */}
        <div className="mt-12 pt-6 border-t border-[rgba(243,243,241,0.12)] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[rgba(243,243,241,0.65)]">
          <div className="flex flex-wrap items-center gap-2 text-center sm:text-left">
            <span>&copy; 2026 SpendIntel</span>
            <span className="text-[rgba(243,243,241,0.3)]">&middot;</span>
            <span>Procurement Intelligence Platform</span>
          </div>

          <div className="flex items-center gap-4 font-mono text-[11px]">
            <div className="inline-flex items-center gap-1.5">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isBackendOperational ? 'bg-[#B8A47A] shadow-[0_0_6px_rgba(184,164,122,0.8)]' : 'bg-red-500'
                }`}
                aria-hidden="true"
              />
              <span className="text-[rgba(243,243,241,0.85)]">
                Status: {isBackendOperational ? 'Operational' : 'Degraded'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
