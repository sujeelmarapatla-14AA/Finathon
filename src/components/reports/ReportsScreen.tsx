import React, { useState } from 'react';
import { Download, FileText, CheckCircle2 } from 'lucide-react';

export const ReportsScreen: React.FC = () => {
  const [downloadToast, setDownloadToast] = useState<string | null>(null);

  const reports = [
    {
      name: 'MONTHLY LEAKAGE REPORT',
      date: '30 Sep 2026',
      records: '50,284 transactions',
      status: 'AUDITED',
      description: 'Comprehensive line-item variance decomposition across all procurement ledgers.',
    },
    {
      name: 'SUPPLIER RISK REPORT',
      date: '28 Sep 2026',
      records: '428 supplier entities',
      status: 'AUDITED',
      description: 'Vendor contract adherence, spot billing deviation, and concentration exposure.',
    },
    {
      name: 'RECOVERY OPPORTUNITY REPORT',
      date: '25 Sep 2026',
      records: '37 critical actions',
      status: 'ACTIONABLE',
      description: 'Immediate reclamation pathways including vendor debit memos and rebate claims.',
    },
    {
      name: 'TRANSACTION ANOMALY REPORT',
      date: '20 Sep 2026',
      records: '143 flagged outliers',
      status: 'VERIFIED',
      description: 'Price spikes, duplicate purchase orders, and unapproved freight surcharges.',
    },
  ];

  const handleExport = (name: string, format: string) => {
    setDownloadToast(`${name} (${format}) generated`);
    setTimeout(() => setDownloadToast(null), 3000);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Toast */}
      {downloadToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-dark-card border border-brand-forest/40 text-brand-cream px-4 py-3 rounded-[8px] shadow-modal flex items-center gap-3 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-brand-forest-bright" />
          <div className="text-xs font-sans">
            <p className="font-medium text-text-primary">Export Complete</p>
            <p className="text-text-muted">{downloadToast}</p>
          </div>
        </div>
      )}

      {/* Page Header (Section 21) */}
      <div className="border-b border-border-default pb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-sans font-semibold tracking-micro text-brand-forest-bright block mb-2">
            07 / AUDIT ARCHIVES
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-text-primary font-normal tracking-tight">
            PROCUREMENT REPORTS
          </h1>
          <p className="mt-3 text-sm sm:text-base text-text-secondary font-sans max-w-2xl leading-relaxed">
            Forensic dossiers prepared for the Chief Financial Officer and Procurement Audit Committee.
          </p>
        </div>

        <span className="text-xs font-mono text-text-muted">
          Q3 Compliance Package
        </span>
      </div>

      {/* Report Rows (Section 21) */}
      <div className="border border-border-default rounded-[12px] bg-dark-bg divide-y divide-border-subtle overflow-hidden">
        {reports.map((rep) => (
          <div
            key={rep.name}
            className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-dark-elevated/40 transition-colors"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h3 className="font-serif text-xl text-text-primary font-normal">
                  {rep.name}
                </h3>
                <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-sans font-semibold uppercase tracking-wider ${
                  rep.status === 'ACTIONABLE'
                    ? 'bg-brand-terracotta/20 text-brand-terracotta border border-brand-terracotta/30'
                    : 'bg-brand-forest/20 text-brand-forest-bright border border-brand-forest/30'
                }`}>
                  {rep.status}
                </span>
              </div>
              <p className="text-xs text-text-muted font-sans max-w-lg">
                {rep.description}
              </p>
              <div className="flex items-center gap-4 text-xs font-mono text-text-secondary pt-1">
                <span>Date: {rep.date}</span>
                <span>•</span>
                <span>Records: {rep.records}</span>
              </div>
            </div>

            {/* Action Buttons: [ Export PDF ] [ Export CSV ] (Section 21) */}
            <div className="flex items-center gap-2.5 shrink-0 self-start md:self-auto">
              <button
                onClick={() => handleExport(rep.name, 'CSV')}
                className="h-9 px-3.5 rounded-[8px] text-xs font-sans text-text-primary bg-dark-secondary hover:bg-dark-elevated border border-border-default transition-colors"
              >
                Export CSV
              </button>
              <button
                onClick={() => handleExport(rep.name, 'PDF')}
                className="h-9 px-4 rounded-[8px] text-xs font-sans font-semibold uppercase tracking-wider bg-brand-forest hover:bg-brand-forest-bright text-brand-cream transition-colors shadow-fine flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export PDF</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
