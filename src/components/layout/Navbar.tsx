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
    <header className="fixed top-0 inset-x-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E8E8E3] transition-colors shadow-xs">
      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 h-[72px] flex items-center justify-between" ref={navRef}>
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-10 xl:gap-12">
          <div onClick={() => handleNavClick('overview')} className="shrink-0">
            <Logo size="md" theme="light" />
          </div>

          {/* Desktop Mega-Menu Navigation */}
          <nav className="hidden lg:flex items-center gap-1.5 xl:gap-2 text-[13px] font-sans font-medium text-[#111111]">
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
                    ? 'text-[#111111] font-semibold'
                    : 'text-[#5E5E5A] hover:text-[#111111]'
                }`}
              >
                {isOverviewActive && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute inset-0 bg-[#FAFAF8] rounded-full border border-[#E8E8E3] shadow-xs -z-10"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  />
                )}
                <span>Overview</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    activeMenu === 'overview' ? 'rotate-180 text-[#111111]' : 'text-[#8A8A84]'
                  }`}
                />
              </button>

              {activeMenu === 'overview' && (
                <div className="absolute left-0 top-full pt-2 w-[480px] animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="bg-white rounded-[24px] border border-[#E8E8E3] shadow-megamenu p-6">
                    <div
                      onClick={() => handleNavClick('overview')}
                      className="group flex items-center justify-between pb-4 mb-4 border-b border-[#F0F0EB] cursor-pointer"
                    >
                      <span className="font-semibold text-sm text-[#111111] group-hover:text-black">
                        Discover SpendIntel Platform
                      </span>
                      <ArrowRight className="w-4 h-4 text-[#8A8A84] group-hover:translate-x-1 group-hover:text-black transition-all" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] tracking-wider uppercase font-semibold text-[#8A8A84] block mb-2">
                          Core Dashboard
                        </span>
                        <div className="space-y-1">
                          <button
                            onClick={() => handleNavClick('overview')}
                            className="w-full text-left p-2 rounded-xl hover:bg-[#FAFAF8] transition-colors flex items-start gap-2.5"
                          >
                            <PieChart className="w-4 h-4 text-[#73C69A] mt-0.5" />
                            <div>
                              <p className="text-xs font-semibold text-[#111111]">Executive Overview</p>
                              <p className="text-[11px] text-[#5E5E5A]">Key metrics, leakage rate & high-level health</p>
                            </div>
                          </button>
                          <button
                            onClick={() => handleNavClick('reports')}
                            className="w-full text-left p-2 rounded-xl hover:bg-[#FAFAF8] transition-colors flex items-start gap-2.5"
                          >
                            <FileText className="w-4 h-4 text-[#73C69A] mt-0.5" />
                            <div>
                              <p className="text-xs font-semibold text-[#111111]">Audit Reports</p>
                              <p className="text-[11px] text-[#5E5E5A]">Exportable spend audit summaries</p>
                            </div>
                          </button>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] tracking-wider uppercase font-semibold text-[#8A8A84] block mb-2">
                          Data & Benchmarks
                        </span>
                        <div className="space-y-1">
                          <button
                            onClick={() => handleNavClick('upload')}
                            className="w-full text-left p-2 rounded-xl hover:bg-[#FAFAF8] transition-colors flex items-start gap-2.5"
                          >
                            <FileSpreadsheet className="w-4 h-4 text-[#73C69A] mt-0.5" />
                            <div>
                              <p className="text-xs font-semibold text-[#111111]">Ingest Dataset</p>
                              <p className="text-[11px] text-[#5E5E5A]">Upload CSV or Excel transactions</p>
                            </div>
                          </button>
                          <button
                            onClick={onLoadDemo}
                            className="w-full text-left p-2 rounded-xl hover:bg-[#FAFAF8] transition-colors flex items-start gap-2.5"
                          >
                            <Database className="w-4 h-4 text-[#73C69A] mt-0.5" />
                            <div>
                              <p className="text-xs font-semibold text-[#111111]">40-Transaction Demo</p>
                              <p className="text-[11px] text-[#5E5E5A]">Verified multi-vendor benchmark</p>
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
                    ? 'text-[#111111] font-semibold'
                    : 'text-[#5E5E5A] hover:text-[#111111]'
                }`}
              >
                {isSpendActive && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute inset-0 bg-[#FAFAF8] rounded-full border border-[#E8E8E3] shadow-xs -z-10"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  />
                )}
                <span>Spend</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    activeMenu === 'spend' ? 'rotate-180 text-[#111111]' : 'text-[#8A8A84]'
                  }`}
                />
              </button>

              {activeMenu === 'spend' && (
                <div className="absolute left-0 top-full pt-2 w-[460px] animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="bg-white rounded-[24px] border border-[#E8E8E3] shadow-megamenu p-6">
                    <div
                      onClick={() => handleNavClick('table')}
                      className="group flex items-center justify-between pb-4 mb-4 border-b border-[#F0F0EB] cursor-pointer"
                    >
                      <span className="font-semibold text-sm text-[#111111] group-hover:text-black">
                        Trace Procurement Spend →
                      </span>
                      <ArrowRight className="w-4 h-4 text-[#8A8A84] group-hover:translate-x-1 group-hover:text-black transition-all" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] tracking-wider uppercase font-semibold text-[#8A8A84] block mb-2">
                          Exploration
                        </span>
                        <div className="space-y-1">
                          <button
                            onClick={() => handleNavClick('table')}
                            className="w-full text-left p-2 rounded-xl hover:bg-[#FAFAF8] transition-colors flex items-start gap-2.5"
                          >
                            <Layers className="w-4 h-4 text-[#73C69A] mt-0.5" />
                            <div>
                              <p className="text-xs font-semibold text-[#111111]">Transactions Explorer</p>
                              <p className="text-[11px] text-[#5E5E5A]">Filter by anomaly, category & SKU</p>
                            </div>
                          </button>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] tracking-wider uppercase font-semibold text-[#8A8A84] block mb-2">
                          Leakage Breakdown
                        </span>
                        <div className="space-y-1">
                          <button
                            onClick={() => handleNavClick('leakage')}
                            className="w-full text-left p-2 rounded-xl hover:bg-[#FAFAF8] transition-colors flex items-start gap-2.5"
                          >
                            <TrendingDown className="w-4 h-4 text-[#D96B4A] mt-0.5" />
                            <div>
                              <p className="text-xs font-semibold text-[#111111]">Leakage Explorer</p>
                              <p className="text-[11px] text-[#5E5E5A]">Price deltas, duplicates & fragmentation</p>
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Suppliers Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setActiveMenu('suppliers')}
              onMouseLeave={() => setActiveMenu(null)}
            >
              <button
                onClick={() => handleNavClick('suppliers')}
                className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-full transition-all ${
                  isSuppliersActive
                    ? 'text-[#111111] font-semibold'
                    : 'text-[#5E5E5A] hover:text-[#111111]'
                }`}
              >
                {isSuppliersActive && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute inset-0 bg-[#FAFAF8] rounded-full border border-[#E8E8E3] shadow-xs -z-10"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  />
                )}
                <span>Suppliers</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    activeMenu === 'suppliers' ? 'rotate-180 text-[#111111]' : 'text-[#8A8A84]'
                  }`}
                />
              </button>

              {activeMenu === 'suppliers' && (
                <div className="absolute left-0 top-full pt-2 w-[420px] animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="bg-white rounded-[24px] border border-[#E8E8E3] shadow-megamenu p-6">
                    <div
                      onClick={() => handleNavClick('suppliers')}
                      className="group flex items-center justify-between pb-4 mb-4 border-b border-[#F0F0EB] cursor-pointer"
                    >
                      <span className="font-semibold text-sm text-[#111111] group-hover:text-black">
                        Supplier Intelligence & Comparison →
                      </span>
                      <ArrowRight className="w-4 h-4 text-[#8A8A84] group-hover:translate-x-1 group-hover:text-black transition-all" />
                    </div>

                    <div className="space-y-1">
                      <button
                        onClick={() => handleNavClick('suppliers')}
                        className="w-full text-left p-2.5 rounded-xl hover:bg-[#FAFAF8] transition-colors flex items-start gap-3"
                      >
                        <Building2 className="w-4 h-4 text-[#73C69A] mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-[#111111]">Supplier Intelligence Hub</p>
                          <p className="text-[11px] text-[#5E5E5A]">
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
                    ? 'text-[#111111] font-semibold'
                    : 'text-[#5E5E5A] hover:text-[#111111]'
                }`}
              >
                {isIntelligenceActive && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute inset-0 bg-[#FAFAF8] rounded-full border border-[#E8E8E3] shadow-xs -z-10"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  />
                )}
                <span>Intelligence</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    activeMenu === 'intelligence' ? 'rotate-180 text-[#111111]' : 'text-[#8A8A84]'
                  }`}
                />
              </button>

              {activeMenu === 'intelligence' && (
                <div className="absolute left-0 top-full pt-2 w-[460px] animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="bg-white rounded-[24px] border border-[#E8E8E3] shadow-megamenu p-6">
                    <div
                      onClick={() => handleNavClick('investigation')}
                      className="group flex items-center justify-between pb-4 mb-4 border-b border-[#F0F0EB] cursor-pointer"
                    >
                      <span className="font-semibold text-sm text-[#111111] group-hover:text-black">
                        Decision & Recovery Engine →
                      </span>
                      <ArrowRight className="w-4 h-4 text-[#8A8A84] group-hover:translate-x-1 group-hover:text-black transition-all" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] tracking-wider uppercase font-semibold text-[#8A8A84] block mb-2">
                          Evidence Layer
                        </span>
                        <button
                          onClick={() => handleNavClick('investigation')}
                          className="w-full text-left p-2 rounded-xl hover:bg-[#FAFAF8] transition-colors flex items-start gap-2.5"
                        >
                          <Sparkles className="w-4 h-4 text-[#73C69A] mt-0.5" />
                          <div>
                            <p className="text-xs font-semibold text-[#111111]">AI Investigation</p>
                            <p className="text-[11px] text-[#5E5E5A]">Every alert explained with verifiable evidence</p>
                          </div>
                        </button>
                      </div>

                      <div>
                        <span className="text-[10px] tracking-wider uppercase font-semibold text-[#8A8A84] block mb-2">
                          Financial Modeling
                        </span>
                        <button
                          onClick={() => handleNavClick('simulator')}
                          className="w-full text-left p-2 rounded-xl hover:bg-[#FAFAF8] transition-colors flex items-start gap-2.5"
                        >
                          <Sliders className="w-4 h-4 text-[#73C69A] mt-0.5" />
                          <div>
                            <p className="text-xs font-semibold text-[#111111]">Recovery Simulator</p>
                            <p className="text-[11px] text-[#5E5E5A]">Simulate alternative vendor and volume impact</p>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* Right: Source Switcher, Primary CTA & System Status */}
        <div className="hidden sm:flex items-center gap-3.5 xl:gap-4 shrink-0">
          {/* Multi-Source Selector Pill */}
          <div className="flex items-center bg-[#FAFAF8] p-1 rounded-full border border-[#E8E8E3] text-xs font-sans font-medium">
            <button
              onClick={() => onSwitchSource ? onSwitchSource('demo') : onLoadDemo()}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all ${
                dataSource === 'demo'
                  ? 'bg-white text-[#111111] font-semibold shadow-xs border border-[#E8E8E3]'
                  : 'text-[#5E5E5A] hover:text-[#111111]'
              }`}
              title="Load 40-transaction demo benchmark"
            >
              <Database className="w-3 h-3 text-[#73C69A]" />
              <span>Demo</span>
            </button>

            <button
              onClick={() => onSwitchSource && onSwitchSource('nova')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all ${
                dataSource === 'nova'
                  ? 'bg-white text-[#111111] font-semibold shadow-xs border border-[#E8E8E3]'
                  : 'text-[#5E5E5A] hover:text-[#111111]'
              }`}
              title="Connect to live Nova Cloud Procurement API"
            >
              <Cloud className="w-3 h-3 text-[#5E81AC]" />
              <span>Live Nova</span>
            </button>

            <button
              onClick={() => handleNavClick('upload')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all ${
                dataSource === 'upload'
                  ? 'bg-white text-[#111111] font-semibold shadow-xs border border-[#E8E8E3]'
                  : 'text-[#5E5E5A] hover:text-[#111111]'
              }`}
              title="Upload CSV/Excel procurement file"
            >
              <FileSpreadsheet className="w-3 h-3 text-[#73C69A]" />
              <span>Upload</span>
            </button>

            {dataSource === 'manual' && (
              <button
                onClick={() => onSwitchSource && onSwitchSource('manual')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all bg-white text-[#111111] font-semibold shadow-xs border border-[#E8E8E3]"
                title="Active manually entered transactions"
              >
                <PenLine className="w-3 h-3 text-[#73C69A]" />
                <span>Manual</span>
              </button>
            )}
          </div>

          {/* Live Data-Source Indicator (derived from backend response) */}
          <div
            className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FAFAF8] border border-[#E8E8E3] text-[10px] font-mono tracking-wider text-[#111111] shadow-xs"
            title={`Active Backend Procurement Source: ${displaySourceLabel}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                displaySourceLabel.includes('NOVA')
                  ? 'bg-[#5E81AC] animate-pulse shadow-[0_0_6px_rgba(94,129,172,0.6)]'
                  : displaySourceLabel.includes('UPLOAD')
                  ? 'bg-[#E5A93C] shadow-[0_0_6px_rgba(229,169,60,0.6)]'
                  : 'bg-[#73C69A] shadow-[0_0_6px_rgba(115,198,154,0.6)]'
              }`}
            />
            <span className="font-semibold">{displaySourceLabel}</span>
          </div>

          {/* Primary CTA */}
          <button
            onClick={() => handleNavClick('upload')}
            className="inline-flex items-center gap-2 h-10 px-4 xl:px-5 rounded-full text-xs font-sans font-semibold bg-[#0A0A0A] text-white hover:bg-black transition-all hover:-translate-y-0.5 active:scale-[0.98] shadow-sm"
          >
            <span>Analyze Spend</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {/* User Profile & Health Dropdown */}
          <div className="relative pl-3 border-l border-[#E8E8E3]" ref={profileRef}>
            <button
              type="button"
              onClick={() => setProfileDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2.5 p-1 rounded-full hover:bg-[#FAFAF8] border border-transparent hover:border-[#E8E8E3] transition-all text-left"
              aria-label="User Profile Menu"
              aria-expanded={profileDropdownOpen}
            >
              <div className="w-8 h-8 rounded-full bg-[#111111] text-white flex items-center justify-center text-xs font-mono font-bold shadow-xs">
                {initials}
              </div>
              <div className="hidden xl:block text-left pr-1">
                <p className="text-xs font-semibold text-[#111111] leading-tight max-w-[130px] truncate">
                  {user?.name || 'SpendIntel User'}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${isBackendOperational ? 'bg-[#73C69A] animate-pulse' : 'bg-[#D96B4A]'}`} />
                  <span className="text-[10px] text-[#5E5E5A] font-mono leading-none capitalize">
                    {roleLabel}
                  </span>
                </div>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-[#8A8A84] transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Profile Floating Dropdown */}
            {profileDropdownOpen && (
              <div className="absolute right-0 top-[calc(100%+8px)] w-64 bg-white rounded-2xl border border-[#E8E8E3] shadow-megamenu p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                {/* User Info Header */}
                <div className="p-2.5 bg-[#FAFAF8] rounded-xl border border-[#E8E8E3] mb-2">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <div className="w-7 h-7 rounded-full bg-[#111111] text-white flex items-center justify-center text-xs font-mono font-bold">
                      {initials}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-[#111111] truncate">{user?.name || 'Procurement User'}</p>
                      <p className="text-[11px] text-[#5E5E5A] truncate">{user?.email || 'user@company.com'}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-[#E8E8E3] text-[10px] font-mono">
                    <span className="text-[#8A8A84]">ROLE</span>
                    <span className="font-semibold text-[#111111] bg-white px-2 py-0.5 rounded border border-[#E8E8E3]">
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
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#111111] hover:bg-[#FAFAF8] transition-colors"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-[#5E5E5A]" />
                    <span>Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      handleNavClick('settings');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#111111] hover:bg-[#FAFAF8] transition-colors"
                  >
                    <SettingsIcon className="w-3.5 h-3.5 text-[#5E5E5A]" />
                    <span>Settings</span>
                  </button>

                  <div className="my-1 border-t border-[#E8E8E3]" />

                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#D96B4A] hover:bg-[#FDF2F0] transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="lg:hidden flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-[#111111] hover:bg-[#F5F5F2] transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-[72px] bg-white border-b border-[#E8E8E3] shadow-megamenu max-h-[85vh] overflow-y-auto p-6 animate-in slide-in-from-top-2 duration-200">
          <div className="space-y-4">
            <div>
              <span className="text-[10px] tracking-wider uppercase font-semibold text-[#8A8A84] block mb-2">
                Navigation
              </span>
              <div className="space-y-1">
                <button
                  onClick={() => handleNavClick('overview')}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium ${
                    currentTab === 'overview' ? 'bg-[#FAFAF8] text-[#111111] font-semibold' : 'text-[#5E5E5A]'
                  }`}
                >
                  Overview & Dashboard
                </button>
                <button
                  onClick={() => handleNavClick('table')}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium ${
                    currentTab === 'table' ? 'bg-[#FAFAF8] text-[#111111] font-semibold' : 'text-[#5E5E5A]'
                  }`}
                >
                  Transactions Explorer
                </button>
                <button
                  onClick={() => handleNavClick('leakage')}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium ${
                    currentTab === 'leakage' ? 'bg-[#FAFAF8] text-[#111111] font-semibold' : 'text-[#5E5E5A]'
                  }`}
                >
                  Leakage Categories
                </button>
                <button
                  onClick={() => handleNavClick('suppliers')}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium ${
                    currentTab === 'suppliers' ? 'bg-[#FAFAF8] text-[#111111] font-semibold' : 'text-[#5E5E5A]'
                  }`}
                >
                  Supplier Intelligence
                </button>
                <button
                  onClick={() => handleNavClick('investigation')}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium ${
                    currentTab === 'investigation' ? 'bg-[#FAFAF8] text-[#111111] font-semibold' : 'text-[#5E5E5A]'
                  }`}
                >
                  AI Investigation
                </button>
                <button
                  onClick={() => handleNavClick('simulator')}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium ${
                    currentTab === 'simulator' ? 'bg-[#FAFAF8] text-[#111111] font-semibold' : 'text-[#5E5E5A]'
                  }`}
                >
                  Recovery Simulator
                </button>
                <button
                  onClick={() => handleNavClick('reports')}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium ${
                    currentTab === 'reports' ? 'bg-[#FAFAF8] text-[#111111] font-semibold' : 'text-[#5E5E5A]'
                  }`}
                >
                  Audit Reports
                </button>
              </div>
            </div>

            {/* Active Data-Source Indicator (Mobile) */}
            <div className="pt-2">
              <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-[#FAFAF8] border border-[#E8E8E3] text-xs font-mono">
                <span className="text-[#5E5E5A] text-[11px]">ACTIVE SOURCE</span>
                <div className="inline-flex items-center gap-1.5 font-semibold text-[#111111]">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      displaySourceLabel.includes('NOVA') ? 'bg-[#5E81AC] animate-pulse' :
                      displaySourceLabel.includes('UPLOAD') ? 'bg-[#E5A93C]' : 'bg-[#73C69A]'
                    }`}
                  />
                  <span>{displaySourceLabel}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#F0F0EB] flex flex-col gap-2">
              <button
                onClick={() => {
                  onLoadDemo();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-[#FAFAF8] border border-[#E8E8E3] text-[#111111] flex items-center justify-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-[#73C69A]" />
                Load 40-Transaction Demo
              </button>
              <button
                onClick={() => handleNavClick('upload')}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-[#0A0A0A] text-white flex items-center justify-center gap-2"
              >
                <span>Upload Procurement Data</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile User Profile & Logout */}
            {user && (
              <div className="pt-4 border-t border-[#E8E8E3]">
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAFAF8] border border-[#E8E8E3] mb-3">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="w-8 h-8 rounded-full bg-[#111111] text-white flex items-center justify-center text-xs font-mono font-bold shrink-0">
                      {initials}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-[#111111] truncate">{user.name}</p>
                      <p className="text-[11px] text-[#5E5E5A] truncate">{user.email}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-[#E8E8E3] shrink-0 capitalize">
                    {roleLabel}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-[#FDF2F0] text-[#D96B4A] hover:bg-[#FDE8E4] flex items-center justify-center gap-2 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
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
