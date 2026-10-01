import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TabType, DataSource } from '../../types';
import { Logo } from './Logo';
import { useAuth } from '../../context/AuthContext';
import {
  ChevronDown,
  ArrowRight,
  TrendingDown,
  Layers,
  FileSpreadsheet,
  Sliders,
  Sparkles,
  PieChart,
  Search,
  Menu,
  X,
  Database,
  Building2,
  FileText,
  Cloud,
  PenLine,
  LogOut,
  User as UserIcon,
  Settings as SettingsIcon,
  Scale,
} from 'lucide-react';

interface NavbarProps {
  currentTab: TabType;
  dataSource?: DataSource;
  backendSourceLabel?: string;
  onSelectTab: (tab: TabType) => void;
  onSwitchSource?: (source: DataSource) => void;
  onLoadDemo: () => void;
  isDemoActive?: boolean;
  isBackendOperational?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  dataSource = 'demo',
  backendSourceLabel,
  onSelectTab,
  onSwitchSource,
  onLoadDemo,
  isDemoActive = true,
  isBackendOperational = true,
}: NavbarProps) => {
  const { user, logout } = useAuth();
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const displaySourceLabel = backendSourceLabel || (
    dataSource === 'nova' ? 'LIVE NOVA' :
    dataSource === 'upload' ? 'UPLOADED FILE' :
    dataSource === 'manual' ? 'MANUAL DATA' :
    'DEMO DATASET'
  );

  const initials = user?.name
    ? user.name
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'SI';

  const roleLabel =
    user?.role === 'admin'
      ? 'Admin'
      : user?.role === 'procurement_lead'
      ? 'Procurement Lead'
      : 'Procurement Analyst';

  // Group active mappings for smooth nav indicator
  const isOverviewActive = currentTab === 'overview' || currentTab === 'reports';
  const isSpendActive = currentTab === 'table' || currentTab === 'leakage';
  const isProductIntelActive = currentTab === 'product-intelligence';
  const isSuppliersActive = currentTab === 'suppliers';
  const isIntelligenceActive = currentTab === 'investigation' || currentTab === 'simulator';

  // Close mega-menu or profile on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavClick = (tab: TabType) => {
    onSelectTab(tab);
    setActiveMenu(null);
    setMobileMenuOpen(false);
    setProfileDropdownOpen(false);
  };

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-[#F3F3F1]/95 backdrop-blur-md border-b border-[#151515]/10 transition-colors shadow-xs">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 h-[72px] flex items-center justify-between gap-3 xl:gap-6 w-full" ref={navRef}>
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-4 xl:gap-8 min-w-0">
          <div onClick={() => handleNavClick('overview')} className="shrink-0 cursor-pointer">
            <Logo size="md" theme="light" />
          </div>

          {/* Desktop Mega-Menu Navigation */}
          <nav className="hidden xl:flex items-center gap-1.5 2xl:gap-2 text-[13px] font-sans font-medium text-[#151515] shrink-0">
            {/* 1. Overview Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setActiveMenu('overview')}
              onMouseLeave={() => setActiveMenu(null)}
            >
              <button
                onClick={() => handleNavClick('overview')}
                className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-full transition-all ${
                  isOverviewActive
                    ? 'text-[#151515] font-semibold'
                    : 'text-[#151515]/70 hover:text-[#151515]'
                }`}
              >
                {isOverviewActive && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute inset-0 bg-[#151515]/5 rounded-full border border-[#151515]/10 shadow-xs -z-10"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  />
                )}
                <span>Overview</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    activeMenu === 'overview' ? 'rotate-180 text-[#151515]' : 'text-[#151515]/40'
                  }`}
                />
              </button>

              {activeMenu === 'overview' && (
                <div className="absolute left-0 top-full pt-2 w-[480px] animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="bg-[#F3F3F1] rounded-[24px] border border-[#151515]/10 shadow-xl p-6">
                    <div
                      onClick={() => handleNavClick('overview')}
                      className="group flex items-center justify-between pb-4 mb-4 border-b border-[#151515]/10 cursor-pointer"
                    >
                      <span className="font-semibold text-sm text-[#151515] group-hover:text-[#B8A47A] transition-colors">
                        Discover SpendIntel Platform
                      </span>
                      <ArrowRight className="w-4 h-4 text-[#151515]/50 group-hover:translate-x-1 group-hover:text-[#B8A47A] transition-all" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] tracking-wider uppercase font-semibold text-[#151515]/50 block mb-2">
                          Core Dashboard
                        </span>
                        <div className="space-y-1">
                          <button
                            onClick={() => handleNavClick('overview')}
                            className="w-full text-left p-2 rounded-xl hover:bg-[#151515]/5 transition-colors flex items-start gap-2.5"
                          >
                            <PieChart className="w-4 h-4 text-[#B8A47A] mt-0.5" />
                            <div>
                              <p className="text-xs font-semibold text-[#151515]">Executive Overview</p>
                              <p className="text-[11px] text-[#151515]/60">Key metrics, leakage rate & high-level health</p>
                            </div>
                          </button>
                          <button
                            onClick={() => handleNavClick('reports')}
                            className="w-full text-left p-2 rounded-xl hover:bg-[#151515]/5 transition-colors flex items-start gap-2.5"
                          >
                            <FileText className="w-4 h-4 text-[#B8A47A] mt-0.5" />
                            <div>
                              <p className="text-xs font-semibold text-[#151515]">Audit Reports</p>
                              <p className="text-[11px] text-[#151515]/60">Exportable spend audit summaries</p>
                            </div>
                          </button>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] tracking-wider uppercase font-semibold text-[#151515]/50 block mb-2">
                          Data & Repository
                        </span>
                        <div className="space-y-1">
                          <button
                            onClick={() => handleNavClick('history')}
                            className="w-full text-left p-2 rounded-xl hover:bg-[#151515]/5 transition-colors flex items-start gap-2.5"
                          >
                            <Database className="w-4 h-4 text-[#B8A47A] mt-0.5" />
                            <div>
                              <p className="text-xs font-semibold text-[#151515]">Dataset History & DB</p>
                              <p className="text-[11px] text-[#151515]/60">All 3 sources & raw record audit</p>
                            </div>
                          </button>
                          <button
                            onClick={() => handleNavClick('upload')}
                            className="w-full text-left p-2 rounded-xl hover:bg-[#151515]/5 transition-colors flex items-start gap-2.5"
                          >
                            <FileSpreadsheet className="w-4 h-4 text-[#B8A47A] mt-0.5" />
                            <div>
                              <p className="text-xs font-semibold text-[#151515]">Ingest Dataset</p>
                              <p className="text-[11px] text-[#151515]/60">Upload CSV/Excel or manual entry</p>
                            </div>
                          </button>
                          <button
                            onClick={onLoadDemo}
                            className="w-full text-left p-2 rounded-xl hover:bg-[#151515]/5 transition-colors flex items-start gap-2.5"
                          >
                            <Layers className="w-4 h-4 text-[#B8A47A] mt-0.5" />
                            <div>
                              <p className="text-xs font-semibold text-[#151515]">40-Transaction Demo</p>
                              <p className="text-[11px] text-[#151515]/60">Verified multi-vendor benchmark</p>
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Spend Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setActiveMenu('spend')}
              onMouseLeave={() => setActiveMenu(null)}
            >
              <button
                onClick={() => handleNavClick('table')}
                className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-full transition-all ${
                  isSpendActive
                    ? 'text-[#151515] font-semibold'
                    : 'text-[#151515]/70 hover:text-[#151515]'
                }`}
              >
                {isSpendActive && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute inset-0 bg-[#151515]/5 rounded-full border border-[#151515]/10 shadow-xs -z-10"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  />
                )}
                <span>Spend</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    activeMenu === 'spend' ? 'rotate-180 text-[#151515]' : 'text-[#151515]/40'
                  }`}
                />
              </button>

              {activeMenu === 'spend' && (
                <div className="absolute left-0 top-full pt-2 w-[460px] animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="bg-[#F3F3F1] rounded-[24px] border border-[#151515]/10 shadow-xl p-6">
                    <div
                      onClick={() => handleNavClick('table')}
                      className="group flex items-center justify-between pb-4 mb-4 border-b border-[#151515]/10 cursor-pointer"
                    >
                      <span className="font-semibold text-sm text-[#151515] group-hover:text-[#B8A47A] transition-colors">
                        Trace Procurement Spend →
                      </span>
                      <ArrowRight className="w-4 h-4 text-[#151515]/50 group-hover:translate-x-1 group-hover:text-[#B8A47A] transition-all" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] tracking-wider uppercase font-semibold text-[#151515]/50 block mb-2">
                          Exploration
                        </span>
                        <div className="space-y-1">
                          <button
                            onClick={() => handleNavClick('table')}
                            className="w-full text-left p-2 rounded-xl hover:bg-[#151515]/5 transition-colors flex items-start gap-2.5"
                          >
                            <Layers className="w-4 h-4 text-[#B8A47A] mt-0.5" />
                            <div>
                              <p className="text-xs font-semibold text-[#151515]">Transactions Explorer</p>
                              <p className="text-[11px] text-[#151515]/60">Filter by anomaly, category & SKU</p>
                            </div>
                          </button>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] tracking-wider uppercase font-semibold text-[#151515]/50 block mb-2">
                          Leakage Breakdown
                        </span>
                        <div className="space-y-1">
                          <button
                            onClick={() => handleNavClick('leakage')}
                            className="w-full text-left p-2 rounded-xl hover:bg-[#151515]/5 transition-colors flex items-start gap-2.5"
                          >
                            <TrendingDown className="w-4 h-4 text-[#B8A47A] mt-0.5" />
                            <div>
                              <p className="text-xs font-semibold text-[#151515]">Leakage Explorer</p>
                              <p className="text-[11px] text-[#151515]/60">Price deltas, duplicates & fragmentation</p>
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Product Intelligence Direct Nav Pill */}
            <button
              onClick={() => handleNavClick('product-intelligence')}
              className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-full transition-all ${
                isProductIntelActive
                  ? 'text-[#151515] font-semibold'
                  : 'text-[#151515]/70 hover:text-[#151515]'
              }`}
            >
              {isProductIntelActive && (
                <motion.div
                  layoutId="activeNavIndicator"
                  className="absolute inset-0 bg-[#151515]/5 rounded-full border border-[#151515]/10 shadow-xs -z-10"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                />
              )}
              <Scale className={`w-3.5 h-3.5 ${isProductIntelActive ? 'text-[#B8A47A]' : 'text-[#151515]/50'}`} />
              <span>Product Intel</span>
            </button>

            {/* 4. Suppliers Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setActiveMenu('suppliers')}
              onMouseLeave={() => setActiveMenu(null)}
            >
              <button
                onClick={() => handleNavClick('suppliers')}
                className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-full transition-all ${
                  isSuppliersActive
                    ? 'text-[#151515] font-semibold'
                    : 'text-[#151515]/70 hover:text-[#151515]'
                }`}
              >
                {isSuppliersActive && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute inset-0 bg-[#151515]/5 rounded-full border border-[#151515]/10 shadow-xs -z-10"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  />
                )}
                <span>Suppliers</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    activeMenu === 'suppliers' ? 'rotate-180 text-[#151515]' : 'text-[#151515]/40'
                  }`}
                />
              </button>

              {activeMenu === 'suppliers' && (
                <div className="absolute left-0 top-full pt-2 w-[420px] animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="bg-[#F3F3F1] rounded-[24px] border border-[#151515]/10 shadow-xl p-6">
                    <div
                      onClick={() => handleNavClick('suppliers')}
                      className="group flex items-center justify-between pb-4 mb-4 border-b border-[#151515]/10 cursor-pointer"
                    >
                      <span className="font-semibold text-sm text-[#151515] group-hover:text-[#B8A47A] transition-colors">
                        Supplier Intelligence & Comparison →
                      </span>
                      <ArrowRight className="w-4 h-4 text-[#151515]/50 group-hover:translate-x-1 group-hover:text-[#B8A47A] transition-all" />
                    </div>

                    <div className="space-y-1">
                      <button
                        onClick={() => handleNavClick('suppliers')}
                        className="w-full text-left p-2.5 rounded-xl hover:bg-[#151515]/5 transition-colors flex items-start gap-3"
                      >
                        <Building2 className="w-4 h-4 text-[#B8A47A] mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-[#151515]">Supplier Intelligence Hub</p>
                          <p className="text-[11px] text-[#151515]/60">
                            Aggregated spend, risk tiers, and anomaly exposure per vendor
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 4. Intelligence Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setActiveMenu('intelligence')}
              onMouseLeave={() => setActiveMenu(null)}
            >
              <button
                onClick={() => handleNavClick('investigation')}
                className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-full transition-all ${
                  isIntelligenceActive
                    ? 'text-[#151515] font-semibold'
                    : 'text-[#151515]/70 hover:text-[#151515]'
                }`}
              >
                {isIntelligenceActive && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute inset-0 bg-[#151515]/5 rounded-full border border-[#151515]/10 shadow-xs -z-10"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  />
                )}
                <span>Intelligence</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    activeMenu === 'intelligence' ? 'rotate-180 text-[#151515]' : 'text-[#151515]/40'
                  }`}
                />
              </button>

              {activeMenu === 'intelligence' && (
                <div className="absolute left-0 top-full pt-2 w-[460px] animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="bg-[#F3F3F1] rounded-[24px] border border-[#151515]/10 shadow-xl p-6">
                    <div
                      onClick={() => handleNavClick('investigation')}
                      className="group flex items-center justify-between pb-4 mb-4 border-b border-[#151515]/10 cursor-pointer"
                    >
                      <span className="font-semibold text-sm text-[#151515] group-hover:text-[#B8A47A] transition-colors">
                        Decision & Recovery Engine →
                      </span>
                      <ArrowRight className="w-4 h-4 text-[#151515]/50 group-hover:translate-x-1 group-hover:text-[#B8A47A] transition-all" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] tracking-wider uppercase font-semibold text-[#151515]/50 block mb-2">
                          Evidence Layer
                        </span>
                        <button
                          onClick={() => handleNavClick('investigation')}
                          className="w-full text-left p-2 rounded-xl hover:bg-[#151515]/5 transition-colors flex items-start gap-2.5"
                        >
                          <Sparkles className="w-4 h-4 text-[#B8A47A] mt-0.5" />
                          <div>
                            <p className="text-xs font-semibold text-[#151515]">AI Investigation</p>
                            <p className="text-[11px] text-[#151515]/60">Every alert explained with verifiable evidence</p>
                          </div>
                        </button>
                      </div>

                      <div>
                        <span className="text-[10px] tracking-wider uppercase font-semibold text-[#151515]/50 block mb-2">
                          Financial Modeling
                        </span>
                        <button
                          onClick={() => handleNavClick('simulator')}
                          className="w-full text-left p-2 rounded-xl hover:bg-[#151515]/5 transition-colors flex items-start gap-2.5"
                        >
                          <Sliders className="w-4 h-4 text-[#B8A47A] mt-0.5" />
                          <div>
                            <p className="text-xs font-semibold text-[#151515]">Recovery Simulator</p>
                            <p className="text-[11px] text-[#151515]/60">Simulate alternative vendor and volume impact</p>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 5. History Direct Nav Pill */}
            <button
              onClick={() => handleNavClick('history')}
              className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-full transition-all ${
                currentTab === 'history'
                  ? 'text-[#151515] font-semibold'
                  : 'text-[#151515]/70 hover:text-[#151515]'
              }`}
            >
              {currentTab === 'history' && (
                <motion.div
                  layoutId="activeNavIndicator"
                  className="absolute inset-0 bg-[#151515]/5 rounded-full border border-[#151515]/10 shadow-xs -z-10"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                />
              )}
              <Database className={`w-3.5 h-3.5 ${currentTab === 'history' ? 'text-[#B8A47A]' : 'text-[#151515]/50'}`} />
              <span>History</span>
            </button>
          </nav>
        </div>

        {/* Right: Source Switcher, System Status & User Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Multi-Source Selector Pill */}
          <div className="hidden sm:flex items-center bg-[#151515]/5 p-0.5 rounded-full border border-[#151515]/10 text-xs font-sans font-medium shrink-0">
            <button
              onClick={() => onSwitchSource ? onSwitchSource('demo') : onLoadDemo()}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full transition-all text-xs whitespace-nowrap ${
                dataSource === 'demo'
                  ? 'bg-[#151515] text-[#F3F3F1] font-semibold shadow-xs'
                  : 'text-[#151515]/70 hover:text-[#151515]'
              }`}
              title="Load 40-transaction demo benchmark"
            >
              <Database className="w-3 h-3 text-[#B8A47A]" />
              <span>Demo</span>
            </button>

            <button
              onClick={() => onSwitchSource && onSwitchSource('nova')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full transition-all text-xs whitespace-nowrap ${
                dataSource === 'nova'
                  ? 'bg-[#151515] text-[#F3F3F1] font-semibold shadow-xs'
                  : 'text-[#151515]/70 hover:text-[#151515]'
              }`}
              title="Connect to live Nova Cloud Procurement API"
            >
              <Cloud className="w-3 h-3 text-[#B8A47A]" />
              <span>Nova</span>
            </button>

            <button
              onClick={() => handleNavClick('upload')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full transition-all text-xs whitespace-nowrap ${
                dataSource === 'upload'
                  ? 'bg-[#151515] text-[#F3F3F1] font-semibold shadow-xs'
                  : 'text-[#151515]/70 hover:text-[#151515]'
              }`}
              title="Upload CSV/Excel procurement file"
            >
              <FileSpreadsheet className="w-3 h-3 text-[#B8A47A]" />
              <span>Upload</span>
            </button>

            {dataSource === 'manual' && (
              <button
                onClick={() => onSwitchSource && onSwitchSource('manual')}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full transition-all bg-[#151515] text-[#F3F3F1] font-semibold shadow-xs text-xs whitespace-nowrap"
                title="Active manually entered transactions"
              >
                <PenLine className="w-3 h-3 text-[#B8A47A]" />
                <span>Manual</span>
              </button>
            )}
          </div>

          {/* User Profile & Health Dropdown */}
          <div className="relative pl-1.5 sm:pl-2 border-l border-[#151515]/10 shrink-0" ref={profileRef}>
            <button
              type="button"
              onClick={() => setProfileDropdownOpen((prev) => !prev)}
              className="flex items-center gap-1.5 p-0.5 rounded-full hover:bg-[#151515]/5 border border-transparent hover:border-[#151515]/10 transition-all text-left shrink-0 cursor-pointer"
              aria-label="User Profile Menu"
              aria-expanded={profileDropdownOpen}
            >
              <div className="w-8 h-8 rounded-full bg-[#151515] text-[#F3F3F1] flex items-center justify-center text-xs font-mono font-bold shadow-xs border border-[#B8A47A]/30 shrink-0">
                {initials}
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-[#151515]/50 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Profile Floating Dropdown */}
            {profileDropdownOpen && (
              <div className="absolute right-0 top-[calc(100%+8px)] w-64 bg-[#F3F3F1] rounded-2xl border border-[#151515]/10 shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                {/* User Info Header */}
                <div className="p-2.5 bg-[#151515]/5 rounded-xl border border-[#151515]/10 mb-2">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <div className="w-7 h-7 rounded-full bg-[#151515] text-[#F3F3F1] flex items-center justify-center text-xs font-mono font-bold border border-[#B8A47A]/30">
                      {initials}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-[#151515] truncate">{user?.name || 'Procurement User'}</p>
                      <p className="text-[11px] text-[#151515]/60 truncate">{user?.email || 'user@company.com'}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-[#151515]/10 text-[10px] font-mono">
                    <span className="text-[#151515]/50">ROLE</span>
                    <span className="font-semibold text-[#151515] bg-[#F3F3F1] px-2 py-0.5 rounded border border-[#151515]/10">
                      {roleLabel}
                    </span>
                  </div>
                </div>

                {/* Dropdown Actions */}
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      handleNavClick('settings');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#151515] hover:bg-[#151515]/5 transition-colors"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-[#151515]/60" />
                    <span>Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      handleNavClick('settings');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#151515] hover:bg-[#151515]/5 transition-colors"
                  >
                    <SettingsIcon className="w-3.5 h-3.5 text-[#151515]/60" />
                    <span>Settings</span>
                  </button>

                  <div className="my-1 border-t border-[#151515]/10" />

                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#151515] hover:bg-[#151515]/5 transition-colors border border-[#151515]/10"
                  >
                    <LogOut className="w-3.5 h-3.5 text-[#B8A47A]" />
                    <span>Log out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="xl:hidden flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-[#151515] hover:bg-[#151515]/5 transition-colors cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="xl:hidden fixed inset-x-0 top-[72px] bg-[#F3F3F1] border-b border-[#151515]/10 shadow-xl max-h-[85vh] overflow-y-auto p-6 animate-in slide-in-from-top-2 duration-200">
          <div className="space-y-4">
            <div>
              <span className="text-[10px] tracking-wider uppercase font-semibold text-[#151515]/50 block mb-2">
                Navigation
              </span>
              <div className="space-y-1">
                <button
                  onClick={() => handleNavClick('overview')}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium ${
                    currentTab === 'overview' ? 'bg-[#151515]/10 text-[#151515] font-semibold' : 'text-[#151515]/70'
                  }`}
                >
                  Overview & Dashboard
                </button>
                <button
                  onClick={() => handleNavClick('table')}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium ${
                    currentTab === 'table' ? 'bg-[#151515]/10 text-[#151515] font-semibold' : 'text-[#151515]/70'
                  }`}
                >
                  Transactions Explorer
                </button>
                <button
                  onClick={() => handleNavClick('leakage')}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium ${
                    currentTab === 'leakage' ? 'bg-[#151515]/10 text-[#151515] font-semibold' : 'text-[#151515]/70'
                  }`}
                >
                  Leakage Categories
                </button>
                <button
                  onClick={() => handleNavClick('product-intelligence')}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium ${
                    currentTab === 'product-intelligence' ? 'bg-[#151515]/10 text-[#151515] font-semibold' : 'text-[#151515]/70'
                  }`}
                >
                  Product Intelligence
                </button>
                <button
                  onClick={() => handleNavClick('suppliers')}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium ${
                    currentTab === 'suppliers' ? 'bg-[#151515]/10 text-[#151515] font-semibold' : 'text-[#151515]/70'
                  }`}
                >
                  Supplier Intelligence
                </button>
                <button
                  onClick={() => handleNavClick('investigation')}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium ${
                    currentTab === 'investigation' ? 'bg-[#151515]/10 text-[#151515] font-semibold' : 'text-[#151515]/70'
                  }`}
                >
                  AI Investigation
                </button>
                <button
                  onClick={() => handleNavClick('simulator')}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium ${
                    currentTab === 'simulator' ? 'bg-[#151515]/10 text-[#151515] font-semibold' : 'text-[#151515]/70'
                  }`}
                >
                  Recovery Simulator
                </button>
                <button
                  onClick={() => handleNavClick('reports')}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium ${
                    currentTab === 'reports' ? 'bg-[#151515]/10 text-[#151515] font-semibold' : 'text-[#151515]/70'
                  }`}
                >
                  Audit Reports
                </button>
                <button
                  onClick={() => handleNavClick('history')}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium ${
                    currentTab === 'history' ? 'bg-[#151515]/10 text-[#151515] font-semibold' : 'text-[#151515]/70'
                  }`}
                >
                  Dataset History & DB
                </button>
              </div>
            </div>

            {/* Active Data-Source Indicator (Mobile) */}
            <div className="pt-2">
              <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-[#151515]/5 border border-[#151515]/10 text-xs font-mono">
                <span className="text-[#151515]/60 text-[11px]">ACTIVE SOURCE</span>
                <div className="inline-flex items-center gap-1.5 font-semibold text-[#151515]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B8A47A]" />
                  <span>{displaySourceLabel}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#151515]/10 flex flex-col gap-2">
              <button
                onClick={() => {
                  onLoadDemo();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-[#151515]/5 border border-[#151515]/10 text-[#151515] flex items-center justify-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-[#B8A47A]" />
                Load 40-Transaction Demo
              </button>
              <button
                onClick={() => handleNavClick('upload')}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-[#151515] text-[#F3F3F1] flex items-center justify-center gap-2"
              >
                <span>Upload Procurement Data</span>
                <ArrowRight className="w-4 h-4 text-[#B8A47A]" />
              </button>
            </div>

            {/* Mobile User Profile & Logout */}
            {user && (
              <div className="pt-4 border-t border-[#151515]/10">
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#151515]/5 border border-[#151515]/10 mb-3">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="w-8 h-8 rounded-full bg-[#151515] text-[#F3F3F1] flex items-center justify-center text-xs font-mono font-bold shrink-0 border border-[#B8A47A]/30">
                      {initials}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-[#151515] truncate">{user.name}</p>
                      <p className="text-[11px] text-[#151515]/60 truncate">{user.email}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F3F3F1] border border-[#151515]/10 shrink-0 capitalize text-[#151515]">
                    {roleLabel}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-[#151515]/5 text-[#151515] hover:bg-[#151515]/10 flex items-center justify-center gap-2 transition-colors border border-[#151515]/10"
                >
                  <LogOut className="w-4 h-4 text-[#B8A47A]" />
                  <span>Log out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
