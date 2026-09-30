import React, { useState } from 'react';
import { Search, Bell, Menu, X, ChevronRight, CheckCircle2 } from 'lucide-react';
import { TabType } from '../../types';
import { MOCK_ALERTS } from '../../data/mockData';

interface TopNavProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  onOpenMobileMenu?: () => void;
  onSelectFinding?: (refNumber: string) => void;
  isLandingHeroVisible?: boolean;
  onToggleLandingHero?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenMobileMenu,
  onSelectFinding,
  isLandingHeroVisible = false,
  onToggleLandingHero,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const breadcrumbs: Record<TabType, { parent: string; child: string }> = {
    overview: { parent: 'Dashboard', child: 'Procurement Intelligence' },
    table: { parent: 'Procurement', child: 'Transactions' },
    suppliers: { parent: 'Procurement', child: 'Suppliers' },
    leakage: { parent: 'Procurement', child: 'Leakage Explorer' },
    investigation: { parent: 'Intelligence', child: 'AI Investigation' },
    simulator: { parent: 'Intelligence', child: 'Recovery Simulator' },
    reports: { parent: 'Reporting', child: 'Reports' },
    settings: { parent: 'System', child: 'Settings' },
    upload: { parent: 'Procurement', child: 'Import Data' },
  };

  const activeBreadcrumb = breadcrumbs[currentTab] || { parent: 'Dashboard', child: 'Overview' };

  const filteredAlerts = MOCK_ALERTS.filter(
    (a) => a.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
           a.supplier.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <header className="sticky top-0 z-20 h-16 w-full bg-dark-bg/95 backdrop-blur-sm border-b border-border-subtle px-6 lg:px-8 flex items-center justify-between">
      {/* Left: Mobile Toggle & Clean Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="p-1.5 rounded-lg text-text-muted hover:text-text-primary lg:hidden"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5 stroke-[1.5]" />
        </button>

        <div className="flex items-center gap-2 text-xs font-sans">
          <span 
            className="text-text-muted hover:text-text-secondary cursor-pointer transition-colors"
            onClick={() => onSelectTab('overview')}
          >
            {activeBreadcrumb.parent}
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-text-muted/60" />
          <span className="font-medium text-text-primary tracking-wide">
            {activeBreadcrumb.child}
          </span>
        </div>

        {/* Editorial Manifesto Toggle */}
        {onToggleLandingHero && (
          <button
            onClick={onToggleLandingHero}
            className={`hidden xl:inline-flex items-center gap-1.5 ml-4 px-2.5 py-1 rounded-[6px] text-[11px] font-sans transition-all border ${
              isLandingHeroVisible
                ? 'bg-dark-elevated text-brand-cream border-border-default'
                : 'bg-transparent text-text-muted border-border-subtle hover:text-text-secondary'
            }`}
          >
            <span>{isLandingHeroVisible ? 'Dismiss Manifesto' : 'Editorial Manifesto'}</span>
          </button>
        )}
      </div>

      {/* Right: Search, Notifications, Profile */}
      <div className="flex items-center gap-4 sm:gap-6">
        {/* Search Input with ⌘ K trigger */}
        <div className="relative">
          <div 
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2 px-3 h-9 rounded-[8px] border border-border-default bg-dark-secondary hover:bg-dark-elevated cursor-pointer text-text-muted hover:text-text-secondary transition-colors text-xs w-44 sm:w-60"
          >
            <Search className="w-3.5 h-3.5 text-text-muted" />
            <span className="truncate">Search records...</span>
            <kbd className="hidden sm:inline-block ml-auto text-[10px] bg-dark-elevated px-1.5 py-0.5 rounded text-text-muted font-mono border border-border-subtle">
              ⌘ K
            </kbd>
          </div>

          {/* Search Modal */}
          {isSearchOpen && (
            <>
              <div 
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px]"
                onClick={() => setIsSearchOpen(false)}
              />
              <div className="absolute right-0 top-11 z-50 w-80 sm:w-96 rounded-[12px] bg-dark-elevated border border-border-default shadow-modal p-3">
                <div className="flex items-center gap-2 pb-2.5 border-b border-border-subtle">
                  <Search className="w-4 h-4 text-brand-forest-bright" />
                  <input 
                    type="text" 
                    placeholder="Search findings, transactions, suppliers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                    className="w-full bg-transparent text-sm focus:outline-none placeholder:text-text-muted text-text-primary"
                  />
                  <button 
                    onClick={() => setIsSearchOpen(false)}
                    className="p-1 rounded text-text-muted hover:text-text-primary"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-2 max-h-64 overflow-y-auto divide-y divide-border-subtle">
                  <div className="py-1">
                    <span className="px-2 py-1 text-[10px] uppercase tracking-micro text-text-muted font-semibold block">
                      High Priority Flags
                    </span>
                    {filteredAlerts.length > 0 ? (
                      filteredAlerts.map(alert => (
                        <div 
                          key={alert.id}
                          onClick={() => {
                            if (onSelectFinding) onSelectFinding(alert.findingRef);
                            onSelectTab('investigation');
                            setIsSearchOpen(false);
                          }}
                          className="p-2 hover:bg-dark-hover rounded-[6px] cursor-pointer transition-colors group flex items-start justify-between"
                        >
                          <div>
                            <p className="text-xs font-medium text-text-primary group-hover:text-brand-forest-bright">
                              {alert.product}
                            </p>
                            <p className="text-[11px] text-text-muted">{alert.supplier} · {alert.findingRef}</p>
                          </div>
                          <span className="text-xs font-mono font-medium text-brand-terracotta">
                            {alert.potentialLeakage}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="p-3 text-xs text-text-muted text-center">No matching records found.</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-[8px] text-text-secondary hover:text-text-primary hover:bg-dark-elevated transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4 stroke-[1.5]" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-brand-terracotta" />
          </button>

          {showNotifications && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowNotifications(false)} 
              />
              <div className="absolute right-0 top-11 z-50 w-72 sm:w-80 rounded-[12px] bg-dark-elevated border border-border-default shadow-modal p-3">
                <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
                  <span className="text-[10px] uppercase tracking-micro font-semibold text-brand-terracotta">
                    Active Flags (3)
                  </span>
                  <span className="text-[10px] text-text-muted">Live Sync</span>
                </div>
                <div className="mt-2 divide-y divide-border-subtle text-xs">
                  <div 
                    onClick={() => {
                      if (onSelectFinding) onSelectFinding('FINDING #027');
                      onSelectTab('investigation');
                      setShowNotifications(false);
                    }}
                    className="py-2.5 cursor-pointer hover:bg-dark-hover px-1 rounded transition-colors"
                  >
                    <div className="flex justify-between items-baseline">
                      <span className="font-medium text-text-primary">Industrial Laptop PO-8841</span>
                      <span className="text-brand-terracotta font-mono font-medium">₹4.5L</span>
                    </div>
                    <p className="text-text-muted text-[11px] mt-0.5">+9.47% price variance</p>
                  </div>

                  <div 
                    onClick={() => {
                      if (onSelectFinding) onSelectFinding('FINDING #014');
                      onSelectTab('investigation');
                      setShowNotifications(false);
                    }}
                    className="py-2.5 cursor-pointer hover:bg-dark-hover px-1 rounded transition-colors"
                  >
                    <div className="flex justify-between items-baseline">
                      <span className="font-medium text-text-primary">ABC Traders Toner</span>
                      <span className="text-brand-terracotta font-mono font-medium">₹5,500</span>
                    </div>
                    <p className="text-text-muted text-[11px] mt-0.5">Off-catalog discretionary spend</p>
                  </div>

                  <div 
                    onClick={() => {
                      if (onSelectFinding) onSelectFinding('FINDING #058');
                      onSelectTab('investigation');
                      setShowNotifications(false);
                    }}
                    className="py-2.5 cursor-pointer hover:bg-dark-hover px-1 rounded transition-colors"
                  >
                    <div className="flex justify-between items-baseline">
                      <span className="font-medium text-text-primary">CloudScale Tier-3 Rebate</span>
                      <span className="text-brand-gold font-mono font-medium">₹3.2L</span>
                    </div>
                    <p className="text-text-muted text-[11px] mt-0.5">Uncredited volume rebate</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Profile Pill */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-border-subtle">
          <div className="w-7 h-7 rounded-full bg-dark-card border border-border-default flex items-center justify-center font-serif text-xs font-medium text-brand-cream">
            SM
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-xs font-medium text-text-primary leading-tight">
              Sujeel M
            </span>
            <span className="text-[10px] text-text-muted">
              Procurement Lead
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
