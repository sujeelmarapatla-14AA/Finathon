import React, { useState } from 'react';
import { Download, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '../common/PageHeader';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

export const ReportsScreen: React.FC = () => {
  const [downloadToast, setDownloadToast] = useState<string | null>(null);

  const reports = [
    {
      name: 'MONTHLY LEAKAGE REPORT',
      date: '30 Sep 2026',
      records: '40 procurement transactions',
      status: 'AUDITED',
      description: 'Comprehensive line-item variance decomposition across all procurement ledgers.',
    },
    {
      name: 'SUPPLIER RISK REPORT',
      date: '28 Sep 2026',
      records: '16 supplier entities',
      status: 'AUDITED',
      description: 'Vendor contract adherence, spot billing deviation, and concentration exposure.',
    },
    {
      name: 'RECOVERY OPPORTUNITY REPORT',
      date: '25 Sep 2026',
      records: '14 priority actions',
      status: 'ACTIONABLE',
      description: 'Immediate reclamation pathways including vendor debit memos and rebate claims.',
    },
    {
      name: 'TRANSACTION ANOMALY REPORT',
      date: '20 Sep 2026',
      records: '22 flagged outliers',
      status: 'VERIFIED',
      description: 'Price anomalies, duplicate purchase orders, and unapproved price markups.',
    },
  ];

  const handleExport = (name: string, format: string) => {
    const content = `data:text/plain;charset=utf-8,SpendIntel Procurement Audit Report - ${name} (${format})\nGenerated: ${new Date().toISOString()}`;
    const encoded = encodeURI(content);
    const a = document.createElement('a');
    a.href = encoded;
    a.download = `SpendIntel_${name.toLowerCase().replace(/\s+/g, '_')}.${format.toLowerCase()}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setDownloadToast(`${name} (${format}) exported successfully`);
    setTimeout(() => setDownloadToast(null), 3000);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-2">
      {/* Toast Notification */}
      {downloadToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#151515] text-[#F3F3F1] px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-[#B8A47A]/30 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-5 h-5 text-[#B8A47A]" />
          <div className="text-xs">
            <p className="font-semibold text-[#F3F3F1]">Dossier Exported</p>
            <p className="text-[#F3F3F1]/70">{downloadToast}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <PageHeader
        label="Audit & Compliance Archives"
        title="Procurement Reports"
        subtitle="Audit-ready forensic spend packages prepared for the Chief Financial Officer and Procurement Audit Committee."
        actions={
          <span className="text-xs font-mono text-[#151515]/70 bg-white px-3.5 py-1.5 rounded-full border border-[#151515]/10 shrink-0">
            SOC2 & ISO 27001 Formatted
          </span>
        }
      />

      {/* Clean Executive Report Rows */}
      <div className="bg-white rounded-[24px] border border-[#151515]/10 divide-y divide-[#151515]/5 overflow-hidden shadow-sm">
        {reports.map((rep) => (
          <div
            key={rep.name}
            className="p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-[#151515]/[0.02] transition-colors group"
          >
            <div className="space-y-1.5 max-w-xl">
              <div className="flex items-center gap-3">
                <h3 className="text-base sm:text-lg font-sans font-semibold text-[#151515] group-hover:text-[#151515]">
                  {rep.name}
                </h3>
                <Badge variant={rep.status === 'ACTIONABLE' ? 'high' : 'low'}>
                  {rep.status}
                </Badge>
              </div>
              <p className="text-xs text-[#151515]/70 font-sans leading-relaxed">
                {rep.description}
              </p>
              <div className="flex items-center gap-4 text-xs font-mono text-[#151515]/50 pt-1">
                <span>Updated: {rep.date}</span>
                <span>•</span>
                <span>{rep.records}</span>
              </div>
            </div>

            {/* Actions: Export PDF / Export CSV */}
            <div className="flex items-center gap-3 shrink-0">
              <Button
                variant="secondary"
                size="sm"
                icon={<Download className="w-3.5 h-3.5 text-[#151515]/60" />}
                onClick={() => handleExport(rep.name, 'PDF')}
              >
                Export PDF
              </Button>

              <Button
                variant="primary"
                size="sm"
                icon={<Download className="w-3.5 h-3.5" />}
                onClick={() => handleExport(rep.name, 'CSV')}
              >
                Export CSV
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
