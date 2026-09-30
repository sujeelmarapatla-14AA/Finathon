import React from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  Building2, 
  TrendingDown, 
  Sparkles, 
  Sliders, 
  FileText, 
  Settings, 
  X,
  UploadCloud
} from 'lucide-react';
import { Logo } from './Logo';
import { TabType } from '../../types';

interface SidebarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onOpenUpload: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  onOpenUpload,
}) => {
  const navSections = [
    {
      group: 'OVERVIEW',
      items: [
        { id: 'overview' as TabType, label: 'Dashboard', icon: LayoutDashboard },
      ],
    },
    {
      group: 'PROCUREMENT',
      items: [
        { id: 'table' as TabType, label: 'Transactions', icon: Receipt },
        { id: 'suppliers' as TabType, label: 'Suppliers', icon: Building2 },
        { id: 'leakage' as TabType, label: 'Leakage Explorer', icon: TrendingDown, badge: '₹31.6L' },
      ],
    },
    {
      group: 'INTELLIGENCE',
      items: [
        { id: 'investigation' as TabType, label: 'AI Investigation', icon: Sparkles, badge: 'Hero' },
        { id: 'simulator' as TabType, label: 'Recovery Simulator', icon: Sliders },
      ],
    },
    {
      group: 'REPORTING',
      items: [
        { id: 'reports' as TabType, label: 'Reports', icon: FileText },
      ],
    },
    {
      group: 'SYSTEM',
      items: [
        { id: 'settings' as TabType, label: 'Settings', icon: Settings },
      ],
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-dark-bg border-r border-border-subtle select-none">
      {/* Top Header: Logo */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-border-subtle">
        <Logo size="md" />
        <button 
          onClick={onCloseMobile} 
          className="p-1.5 rounded-lg text-text-muted hover:text-text-primary lg:hidden"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
        {navSections.map((sec) => (
          <div key={sec.group} className="space-y-1">
            <span className="px-3 text-[10px] uppercase font-sans font-semibold tracking-micro text-text-muted block">
              {sec.group}
            </span>
            {sec.items.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    onCloseMobile();
                  }}
                  className={`w-full h-10 px-3 rounded-[8px] flex items-center justify-between text-[13px] font-sans transition-all duration-150 ${
                    isActive
                      ? 'bg-brand-forest/15 text-text-primary font-medium border border-brand-forest/30'
                      : 'text-text-secondary hover:text-text-primary hover:bg-dark-elevated'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 stroke-[1.75] transition-colors ${
                        isActive ? 'text-brand-forest-bright' : 'text-text-muted'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[9.5px] px-1.5 py-0.5 rounded font-mono font-medium ${
                        item.badge === 'Hero'
                          ? 'bg-brand-forest/30 text-brand-forest-bright border border-brand-forest/40'
                          : 'bg-brand-terracotta/20 text-brand-terracotta-soft border border-brand-terracotta/30'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom Area: Ingestion CTA + System Status + Profile */}
      <div className="p-3 border-t border-border-subtle bg-dark-secondary/60 space-y-3">
        <button
          onClick={() => {
            onOpenUpload();
            onCloseMobile();
          }}
          className="w-full h-9 rounded-[8px] flex items-center justify-center gap-2 text-xs font-sans font-semibold uppercase tracking-wider bg-brand-forest hover:bg-brand-forest-bright text-brand-cream transition-colors shadow-fine"
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span>Upload Dataset</span>
        </button>

        {/* System Status: ● SYSTEM OPERATIONAL */}
        <div className="px-2 pt-2 border-t border-border-subtle flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-forest-bright opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-forest" />
            </span>
            <span className="font-sans text-[10px] uppercase tracking-micro text-text-secondary font-medium">
              SYSTEM OPERATIONAL
            </span>
          </div>
          <span className="text-[10px] font-mono text-text-muted">v3.2</span>
        </div>

        {/* User Profile: Sujeel M */}
        <div className="px-2 py-1.5 rounded-[8px] bg-dark-elevated flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-dark-card border border-border-default flex items-center justify-center text-[11px] font-serif text-brand-cream">
              SM
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-text-primary leading-tight">
                Sujeel M
              </span>
              <span className="text-[10px] text-text-muted">
                Procurement Lead
              </span>
            </div>
          </div>
          <span className="w-1.5 h-1.5 rounded-full bg-brand-forest" />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Fixed Desktop Sidebar: exactly 240px width */}
      <aside className="hidden lg:block w-[240px] shrink-0 h-screen sticky top-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity" 
            onClick={onCloseMobile} 
          />
          <div className="fixed inset-y-0 left-0 w-[240px] z-50 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
