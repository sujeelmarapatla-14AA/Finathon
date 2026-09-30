import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Radio,
  PenLine,
  Zap,
} from 'lucide-react';
import { uploadProcurementDataset } from '../../services/api';
import { DataSource } from '../../types';
import { Button } from '../common/Button';
import { ManualEntryForm } from './ManualEntryForm';

interface UploadZoneProps {
  onCompleteAnalysis: (newFileId?: string, source?: DataSource) => void;
  onSwitchSource?: (source: DataSource) => void;
  initialOption?: 'upload' | 'nova' | 'manual';
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  onCompleteAnalysis,
  onSwitchSource,
  initialOption = 'upload',
}) => {
  const [selectedOption, setSelectedOption] = useState<'upload' | 'nova' | 'manual'>(initialOption);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadState, setUploadState] = useState<'idle' | 'analyzing' | 'completed'>('idle');
  const [currentStep, setCurrentStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadedFileId, setUploadedFileId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const steps = [
    'Parsing transactions',
    'Normalizing suppliers',
    'Benchmarking prices',
    'Detecting anomalies',
    'Preparing investigation',
  ];

  const handleFileUpload = async (file: File) => {
    setErrorMessage(null);
    setUploadState('analyzing');
    setCurrentStep(0);

    // Start 5-stage visual pipeline animation
    let s = 0;
    const interval = setInterval(() => {
      s += 1;
      if (s < steps.length) {
        setCurrentStep(s);
      }
    }, 450);

    try {
      const res = await uploadProcurementDataset(file);
      clearInterval(interval);
      setCurrentStep(steps.length - 1);
      setUploadedFileId(res.file_id);
      setUploadState('completed');
    } catch (err: any) {
      clearInterval(interval);
      setErrorMessage(err.message || 'Failed to parse and ingest procurement file.');
      setUploadState('idle');
      setCurrentStep(0);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleConnectNova = () => {
    if (onSwitchSource) {
      onSwitchSource('nova');
    } else {
      onCompleteAnalysis('nova', 'nova');
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-6">
      {/* Header */}
      <div className="text-center space-y-3 pb-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAFAF8] border border-[#E8E8E3] text-[11px] font-sans font-medium text-[#5E5E5A]">
          <span className="w-2 h-2 rounded-full bg-[#73C69A]" />
          <span>Procurement Ingestion Engine</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-sans font-medium text-[#111111] tracking-tight">
          Bring your procurement data.
        </h1>
        <p className="text-sm sm:text-base text-[#5E5E5A] font-sans max-w-xl mx-auto leading-relaxed">
          Upload transaction data, stream live feeds, or enter transactions manually to let SpendIntel uncover the patterns hidden inside.
        </p>
      </div>

      {/* 3 Source Selection Cards (Section 1) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* 1. UPLOAD DATA */}
        <button
          type="button"
          onClick={() => setSelectedOption('upload')}
          className={`p-4 rounded-2xl border text-left transition-all relative ${
            selectedOption === 'upload'
              ? 'border-[#111111] bg-white shadow-sm ring-1 ring-[#111111]/10'
              : 'border-[#E8E8E3] bg-[#FAFAF8] hover:border-[#8A8A84] hover:bg-white'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                selectedOption === 'upload'
                  ? 'bg-[#111111] text-white'
                  : 'bg-white border border-[#E8E8E3] text-[#5E5E5A]'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
            </div>
            {selectedOption === 'upload' && (
              <span className="w-2 h-2 rounded-full bg-[#73C69A]" />
            )}
          </div>
          <div className="font-semibold text-xs text-[#111111] tracking-wide">UPLOAD DATA</div>
          <div className="text-[11px] text-[#8A8A84] font-mono mt-0.5">CSV / XLSX</div>
        </button>

        {/* 2. LIVE NOVA */}
        <button
          type="button"
          onClick={() => setSelectedOption('nova')}
          className={`p-4 rounded-2xl border text-left transition-all relative ${
            selectedOption === 'nova'
              ? 'border-[#111111] bg-white shadow-sm ring-1 ring-[#111111]/10'
              : 'border-[#E8E8E3] bg-[#FAFAF8] hover:border-[#8A8A84] hover:bg-white'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                selectedOption === 'nova'
                  ? 'bg-[#111111] text-white'
                  : 'bg-white border border-[#E8E8E3] text-[#5E5E5A]'
              }`}
            >
              <Radio className="w-4 h-4 text-[#73C69A]" />
            </div>
            {selectedOption === 'nova' && (
              <span className="w-2 h-2 rounded-full bg-[#73C69A]" />
            )}
          </div>
          <div className="font-semibold text-xs text-[#111111] tracking-wide">LIVE NOVA</div>
          <div className="text-[11px] text-[#8A8A84] font-sans mt-0.5">Connect procurement data</div>
        </button>

        {/* 3. ENTER DATA MANUALLY */}
        <button
          type="button"
          onClick={() => setSelectedOption('manual')}
          className={`p-4 rounded-2xl border text-left transition-all relative ${
            selectedOption === 'manual'
              ? 'border-[#111111] bg-white shadow-sm ring-1 ring-[#111111]/10'
              : 'border-[#E8E8E3] bg-[#FAFAF8] hover:border-[#8A8A84] hover:bg-white'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                selectedOption === 'manual'
                  ? 'bg-[#111111] text-white'
                  : 'bg-white border border-[#E8E8E3] text-[#5E5E5A]'
              }`}
            >
              <PenLine className="w-4 h-4" />
            </div>
            {selectedOption === 'manual' && (
              <span className="w-2 h-2 rounded-full bg-[#73C69A]" />
            )}
          </div>
          <div className="font-semibold text-xs text-[#111111] tracking-wide">ENTER DATA MANUALLY</div>
          <div className="text-[11px] text-[#8A8A84] font-sans mt-0.5">Quickly enter one or more transactions</div>
        </button>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-[#D96B4A]/10 border border-[#D96B4A]/20 text-[#D96B4A] text-xs flex items-center gap-2 max-w-md mx-auto">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Ingestion Container */}
      <div className="bg-white rounded-[28px] sm:rounded-[36px] border border-[#E8E8E3] p-8 sm:p-12 shadow-sm">
        {/* OPTION 1: UPLOAD FILE */}
        {selectedOption === 'upload' && (
          <>
            {uploadState === 'idle' && (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileUpload(e.dataTransfer.files[0]);
                  }
                }}
                className={`border-2 border-dashed rounded-[24px] p-10 sm:p-14 text-center transition-all ${
                  isDragging
                    ? 'border-[#73C69A] bg-[#73C69A]/5'
                    : 'border-[#E8E8E3] hover:border-[#111111] hover:bg-[#FAFAF8]'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                />

                <div className="w-14 h-14 rounded-full bg-[#FAFAF8] border border-[#E8E8E3] flex items-center justify-center mx-auto mb-5 text-[#111111]">
                  <UploadCloud className="w-6 h-6 stroke-[1.5]" />
                </div>

                <h3 className="text-xl sm:text-2xl font-sans font-medium text-[#111111] tracking-tight mb-2">
                  DROP FILE HERE
                </h3>
                <p className="text-xs text-[#8A8A84] font-sans mb-6">or</p>

                <Button
                  variant="primary"
                  size="md"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Browse files
                </Button>

                <div className="mt-8 pt-6 border-t border-[#F0F0EB] flex items-center justify-center gap-4 text-xs text-[#8A8A84] font-mono">
                  <span>CSV · XLSX</span>
                  <span>•</span>
                  <span>Maximum 25MB</span>
                </div>
              </div>
            )}

            {/* Five-Stage Pipeline Animation */}
            {uploadState === 'analyzing' && (
              <div className="py-8 px-4 text-center space-y-6 max-w-md mx-auto">
                <div className="w-14 h-14 rounded-full bg-[#FAFAF8] border border-[#73C69A]/40 flex items-center justify-center mx-auto text-[#73C69A]">
                  <RefreshCw className="w-6 h-6 animate-spin stroke-[2]" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-sans font-medium text-[#111111]">
                    {steps[currentStep]}
                  </h3>
                  <p className="text-xs text-[#8A8A84] font-mono">
                    Executing Stage 0{currentStep + 1} of 05
                  </p>
                </div>

                {/* 5-Step Visual Chain */}
                <div className="space-y-3 text-left pt-2">
                  {steps.map((st, i) => {
                    const isPast = i < currentStep;
                    const isCurrent = i === currentStep;

                    return (
                      <div
                        key={st}
                        className={`flex items-center justify-between p-3.5 rounded-xl border transition-all text-xs ${
                          isPast
                            ? 'border-[#73C69A]/30 bg-[#73C69A]/5 text-[#111111]'
                            : isCurrent
                            ? 'border-[#111111] bg-white font-medium text-[#111111] shadow-sm'
                            : 'border-[#F0F0EB] bg-[#FAFAF8] text-[#8A8A84]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-[11px] text-[#8A8A84]">0{i + 1}</span>
                          <span>{st}</span>
                        </div>

                        {isPast ? (
                          <CheckCircle2 className="w-4 h-4 text-[#73C69A]" />
                        ) : isCurrent ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#111111]" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-[#E8E8E3]" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Completed State */}
            {uploadState === 'completed' && (
              <div className="py-10 px-6 text-center space-y-6 max-w-md mx-auto animate-in fade-in duration-300">
                <div className="w-14 h-14 rounded-full bg-[#73C69A]/15 border border-[#73C69A]/40 flex items-center justify-center mx-auto text-[#73C69A]">
                  <CheckCircle2 className="w-7 h-7" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-sans font-medium text-[#111111]">
                    Intelligence Pipeline Ready
                  </h3>
                  <p className="text-xs text-[#5E5E5A] font-sans">
                    Transactions parsed, normalized, and benchmarked against commercial rate cards.
                  </p>
                </div>

                <Button
                  variant="primary"
                  size="md"
                  icon={<ArrowRight className="w-3.5 h-3.5" />}
                  onClick={() => onCompleteAnalysis(uploadedFileId || undefined, 'upload')}
                >
                  Open Executive Dashboard
                </Button>
              </div>
            )}
          </>
        )}

        {/* OPTION 2: LIVE NOVA */}
        {selectedOption === 'nova' && (
          <div className="py-8 px-4 text-center space-y-6 max-w-lg mx-auto animate-in fade-in duration-300">
            <div className="w-14 h-14 rounded-full bg-[#73C69A]/10 border border-[#73C69A]/30 flex items-center justify-center mx-auto text-[#73C69A]">
              <Radio className="w-6 h-6 stroke-[1.8]" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-sans font-medium text-[#111111] tracking-tight">
                Connect Live Nova Stream
              </h3>
              <p className="text-xs sm:text-sm text-[#5E5E5A] font-sans leading-relaxed">
                Stream real-time enterprise ERP transactions directly into SpendIntel for forensic anomaly detection and automated audit triggers.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAFAF8] border border-[#E8E8E3] text-left space-y-2 text-xs">
              <div className="flex items-center justify-between text-[#111111] font-medium">
                <span>Enterprise Nova Connector</span>
                <span className="inline-flex items-center gap-1 text-[#73C69A] font-mono text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#73C69A]" />
                  READY
                </span>
              </div>
              <p className="text-[#8A8A84] text-[11px]">
                Syncs purchase orders, item rates, and vendor terms continuously.
              </p>
            </div>

            <Button
              variant="primary"
              size="md"
              icon={<Zap className="w-3.5 h-3.5" />}
              onClick={handleConnectNova}
            >
              Connect Live Nova Engine →
            </Button>
          </div>
        )}

        {/* OPTION 3: ENTER DATA MANUALLY */}
        {selectedOption === 'manual' && (
          <ManualEntryForm
            onCompleteAnalysis={(fileId) => onCompleteAnalysis(fileId, 'manual')}
          />
        )}
      </div>
    </div>
  );
};
