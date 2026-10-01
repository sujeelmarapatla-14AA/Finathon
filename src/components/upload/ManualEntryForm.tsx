import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  ArrowRight,
  Download,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { Button } from '../common/Button';
import { submitManualAnalysis, ManualTransactionPayload } from '../../services/api';
import { formatINR } from '../../utils/formatters';

interface ManualEntryFormProps {
  onCompleteAnalysis: (fileId: string) => void;
}

interface FormState {
  transaction_id: string;
  transaction_date: string;
  product: string;
  product_id: string;
  supplier: string;
  quantity: string;
  actual_unit_price: string;
  benchmark_unit_price: string;
  contract_price: string;
  contract_discount: string;
  department: string;
  procurement_channel: string;
  po_number: string;
  status: string;
}

const INITIAL_FORM: FormState = {
  transaction_id: 'TX-10025',
  transaction_date: '',
  product: '',
  product_id: '',
  supplier: '',
  quantity: '',
  actual_unit_price: '',
  benchmark_unit_price: '',
  contract_price: '',
  contract_discount: '',
  department: '',
  procurement_channel: '',
  po_number: '',
  status: '',
};

const EXAMPLE_TRANSACTION: FormState = {
  transaction_id: 'TX-10025',
  transaction_date: '2026-03-15',
  product: 'Industrial Laptop',
  product_id: 'LAPTOP-IND-01',
  supplier: 'TechWorld Solutions',
  quantity: '20',
  actual_unit_price: '52500',
  benchmark_unit_price: '47500',
  contract_price: '48000',
  contract_discount: '5',
  department: 'IT & Infrastructure',
  procurement_channel: 'Off-Contract',
  po_number: 'PO-8821',
  status: 'Flagged',
};

export const ManualEntryForm: React.FC<ManualEntryFormProps> = ({ onCompleteAnalysis }) => {
  const [formData, setFormData] = useState<FormState>(INITIAL_FORM);
  const [stagedTransactions, setStagedTransactions] = useState<ManualTransactionPayload[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Form field change handler
  const handleChange = (field: keyof FormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // Populate helper example
  const handleUseExample = () => {
    setFormData(EXAMPLE_TRANSACTION);
    setErrors({});
    setSubmitError(null);
  };

  // Validate single transaction
  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};

    if (!formData.transaction_id.trim()) {
      errs.transaction_id = 'Transaction ID is required';
    }
    if (!formData.product.trim()) {
      errs.product = 'Product name is required';
    }
    if (!formData.supplier.trim()) {
      errs.supplier = 'Supplier is required';
    }

    const qty = parseFloat(formData.quantity);
    if (!formData.quantity.trim() || isNaN(qty) || qty <= 0) {
      errs.quantity = 'Quantity must be > 0';
    }

    const actualPrice = parseFloat(formData.actual_unit_price);
    if (!formData.actual_unit_price.trim() || isNaN(actualPrice) || actualPrice < 0) {
      errs.actual_unit_price = 'Actual Unit Price must be >= 0';
    }

    const benchPrice = parseFloat(formData.benchmark_unit_price);
    if (!formData.benchmark_unit_price.trim() || isNaN(benchPrice) || benchPrice <= 0) {
      errs.benchmark_unit_price = 'Benchmark Unit Price must be > 0';
    }

    if (formData.contract_price.trim()) {
      const cp = parseFloat(formData.contract_price);
      if (isNaN(cp) || cp < 0) {
        errs.contract_price = 'Contract Price must be >= 0';
      }
    }

    if (formData.contract_discount.trim()) {
      const cd = parseFloat(formData.contract_discount);
      if (isNaN(cd) || cd < 0 || cd > 100) {
        errs.contract_discount = 'Discount must be between 0% and 100%';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Add or update transaction in staged list
  const handleAddTransaction = () => {
    if (!validateForm()) return;

    const payloadItem: ManualTransactionPayload = {
      transaction_id: formData.transaction_id.trim(),
      product_name: formData.product.trim(),
      supplier: formData.supplier.trim(),
      quantity: parseFloat(formData.quantity),
      unit_price: parseFloat(formData.actual_unit_price),
      benchmark_unit_price: parseFloat(formData.benchmark_unit_price),
      product_id: formData.product_id.trim() || undefined,
      transaction_date: formData.transaction_date.trim() || undefined,
      po_number: formData.po_number.trim() || undefined,
      department: formData.department.trim() || undefined,
      contract_price: formData.contract_price.trim() ? parseFloat(formData.contract_price) : undefined,
      contract_discount: formData.contract_discount.trim() ? parseFloat(formData.contract_discount) : undefined,
      procurement_channel: formData.procurement_channel.trim() || undefined,
      status: formData.status.trim() || undefined,
    };

    if (editingIndex !== null) {
      const updated = [...stagedTransactions];
      updated[editingIndex] = payloadItem;
      setStagedTransactions(updated);
      setEditingIndex(null);
    } else {
      if (stagedTransactions.length >= 20) {
        setSubmitError('Quick manual entry supports up to 20 transactions per batch.');
        return;
      }
      setStagedTransactions((prev) => [...prev, payloadItem]);
    }

    // Prepare next ID sequence
    const nextSeq = stagedTransactions.length + 2;
    const nextTxId = `TX-${10025 + nextSeq - 1}`;

    setFormData({
      ...INITIAL_FORM,
      transaction_id: nextTxId,
    });
    setErrors({});
    setSubmitError(null);
  };

  // Edit staged transaction
  const handleEdit = (index: number) => {
    const item = stagedTransactions[index];
    setFormData({
      transaction_id: item.transaction_id,
      transaction_date: item.transaction_date || '',
      product: item.product_name,
      product_id: item.product_id || '',
      supplier: item.supplier,
      quantity: item.quantity.toString(),
      actual_unit_price: item.unit_price.toString(),
      benchmark_unit_price: item.benchmark_unit_price.toString(),
      contract_price: item.contract_price !== undefined && item.contract_price !== null ? item.contract_price.toString() : '',
      contract_discount: item.contract_discount !== undefined && item.contract_discount !== null ? (item.contract_discount > 1 ? item.contract_discount.toString() : (item.contract_discount * 100).toString()) : '',
      department: item.department || '',
      procurement_channel: item.procurement_channel || '',
      po_number: item.po_number || '',
      status: item.status || '',
    });
    setEditingIndex(index);
    setErrors({});
  };

  // Remove staged transaction
  const handleRemove = (index: number) => {
    setStagedTransactions((prev) => prev.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
      setFormData(INITIAL_FORM);
    }
  };

  // Export CSV of staged transactions
  const handleExportCSV = () => {
    if (stagedTransactions.length === 0) return;
    const headers = [
      'transaction_id',
      'product_id',
      'product_name',
      'supplier',
      'quantity',
      'unit_price',
      'benchmark_unit_price',
      'transaction_date',
      'po_number',
      'department',
      'contract_price',
      'contract_discount',
      'procurement_channel',
    ];

    const rows = stagedTransactions.map((t) => [
      `"${t.transaction_id}"`,
      `"${t.product_id || t.product_name}"`,
      `"${t.product_name}"`,
      `"${t.supplier}"`,
      t.quantity,
      t.unit_price,
      t.benchmark_unit_price,
      `"${t.transaction_date || ''}"`,
      `"${t.po_number || ''}"`,
      `"${t.department || ''}"`,
      t.contract_price ?? '',
      t.contract_discount ?? '',
      `"${t.procurement_channel || ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `spendintel_manual_entries_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Submit manual transactions to backend
  const handleSubmit = async () => {
    setSubmitError(null);

    // If staged list is empty but form is filled, validate & stage it first
    let transactionsToSubmit = [...stagedTransactions];
    if (transactionsToSubmit.length === 0) {
      if (!validateForm()) {
        return;
      }
      transactionsToSubmit = [
        {
          transaction_id: formData.transaction_id.trim(),
          product_name: formData.product.trim(),
          supplier: formData.supplier.trim(),
          quantity: parseFloat(formData.quantity),
          unit_price: parseFloat(formData.actual_unit_price),
          benchmark_unit_price: parseFloat(formData.benchmark_unit_price),
          product_id: formData.product_id.trim() || undefined,
          transaction_date: formData.transaction_date.trim() || undefined,
          po_number: formData.po_number.trim() || undefined,
          department: formData.department.trim() || undefined,
          contract_price: formData.contract_price.trim() ? parseFloat(formData.contract_price) : undefined,
          contract_discount: formData.contract_discount.trim() ? parseFloat(formData.contract_discount) : undefined,
          procurement_channel: formData.procurement_channel.trim() || undefined,
          status: formData.status.trim() || undefined,
        },
      ];
    }

    setIsSubmitting(true);
    try {
      const res = await submitManualAnalysis(transactionsToSubmit);
      if (res && res.file_id) {
        onCompleteAnalysis(res.file_id);
      } else {
        throw new Error('Analysis succeeded but no session ID was returned.');
      }
    } catch (err: any) {
      setSubmitError(err.message || 'SpendIntel couldn\'t analyze these transactions.');
      setIsSubmitting(false);
    }
  };

  // Live preview calculations for currently entered item
  const currentQty = parseFloat(formData.quantity) || 0;
  const currentActual = parseFloat(formData.actual_unit_price) || 0;
  const currentBenchmark = parseFloat(formData.benchmark_unit_price) || 0;
  const currentActualSpend = currentQty * currentActual;
  const currentRefSpend = currentQty * currentBenchmark;
  const currentVariancePct = currentBenchmark > 0 ? ((currentActual - currentBenchmark) / currentBenchmark) * 100 : 0;
  const currentLeakage = Math.max(0, currentActual - currentBenchmark) * currentQty;

  const showLivePreview = currentQty > 0 && currentActual > 0 && currentBenchmark > 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Mode Sub-Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#151515]/10 gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-[#B8A47A] font-semibold mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#B8A47A]" />
            Quick Procurement Entry
          </div>
          <h2 className="text-xl sm:text-2xl font-sans font-medium text-[#151515] tracking-tight">
            Direct Transaction Audit
          </h2>
          <p className="text-xs sm:text-sm text-[#151515]/70 font-sans mt-0.5">
            Enter a few transactions and immediately see potential spend leakage.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleUseExample}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#151515]/10 bg-[#F3F3F1] hover:bg-[#151515]/5 text-xs font-sans font-medium text-[#151515] transition-all"
            title="Populate a realistic example transaction for quick demo"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#B8A47A]" />
            <span>USE EXAMPLE</span>
          </button>

          {stagedTransactions.length > 0 && (
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#151515]/10 bg-white hover:bg-[#F3F3F1] text-xs font-sans font-medium text-[#151515]/70 hover:text-[#151515] transition-all"
              title="Export entered transactions as CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>EXPORT CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {submitError && (
        <div className="p-4 rounded-2xl bg-[#151515]/5 border border-[#151515]/20 text-[#151515] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-[#B8A47A] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-[#151515]">SpendIntel couldn't analyze these transactions.</p>
              <p className="text-[#151515]/70 mt-0.5">{submitError}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-3 py-1.5 rounded-xl bg-[#151515] text-[#F3F3F1] font-medium text-xs hover:bg-[#151515]/80 transition-colors self-start sm:self-auto shrink-0"
          >
            TRY AGAIN
          </button>
        </div>
      )}

      {/* 2-Column Desktop Form */}
      <div className="bg-[#F3F3F1] rounded-[24px] border border-[#151515]/10 p-6 sm:p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Row 1: Transaction ID & Date */}
          <div>
            <label className="block text-xs font-medium text-[#151515] mb-1.5">
              Transaction ID <span className="text-[#B8A47A]">*</span>
            </label>
            <input
              type="text"
              value={formData.transaction_id}
              onChange={(e) => handleChange('transaction_id', e.target.value)}
              placeholder="e.g. TX-10025"
              className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-xs font-sans text-[#151515] placeholder-[#151515]/40 focus:outline-none transition-all ${
                errors.transaction_id
                  ? 'border-[#B8A47A] focus:ring-1 focus:ring-[#B8A47A]'
                  : 'border-[#151515]/15 focus:border-[#151515]'
              }`}
            />
            {errors.transaction_id && (
              <span className="text-[11px] text-[#B8A47A] mt-1 block font-medium">{errors.transaction_id}</span>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-[#151515] mb-1.5 flex items-center justify-between">
              <span>Transaction Date</span>
              <span className="text-[10px] text-[#151515]/50 font-normal">(Optional)</span>
            </label>
            <input
              type="date"
              value={formData.transaction_date}
              onChange={(e) => handleChange('transaction_date', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#151515]/15 bg-white text-xs font-sans text-[#151515] focus:outline-none focus:border-[#151515] transition-all"
            />
          </div>

          {/* Row 2: Product & Product ID */}
          <div>
            <label className="block text-xs font-medium text-[#151515] mb-1.5">
              Product <span className="text-[#B8A47A]">*</span>
            </label>
            <input
              type="text"
              value={formData.product}
              onChange={(e) => handleChange('product', e.target.value)}
              placeholder="e.g. Industrial Laptop"
              className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-xs font-sans text-[#151515] placeholder-[#151515]/40 focus:outline-none transition-all ${
                errors.product
                  ? 'border-[#B8A47A] focus:ring-1 focus:ring-[#B8A47A]'
                  : 'border-[#151515]/15 focus:border-[#151515]'
              }`}
            />
            {errors.product && (
              <span className="text-[11px] text-[#B8A47A] mt-1 block font-medium">{errors.product}</span>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-[#151515] mb-1.5 flex items-center justify-between">
              <span>Product ID / SKU</span>
              <span className="text-[10px] text-[#151515]/50 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={formData.product_id}
              onChange={(e) => handleChange('product_id', e.target.value)}
              placeholder="e.g. LAPTOP-IND-01"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#151515]/15 bg-white text-xs font-sans text-[#151515] placeholder-[#151515]/40 focus:outline-none focus:border-[#151515] transition-all"
            />
          </div>

          {/* Row 3: Supplier & Quantity */}
          <div>
            <label className="block text-xs font-medium text-[#151515] mb-1.5">
              Supplier <span className="text-[#B8A47A]">*</span>
            </label>
            <input
              type="text"
              value={formData.supplier}
              onChange={(e) => handleChange('supplier', e.target.value)}
              placeholder="e.g. TechWorld Solutions"
              className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-xs font-sans text-[#151515] placeholder-[#151515]/40 focus:outline-none transition-all ${
                errors.supplier
                  ? 'border-[#B8A47A] focus:ring-1 focus:ring-[#B8A47A]'
                  : 'border-[#151515]/15 focus:border-[#151515]'
              }`}
            />
            {errors.supplier && (
              <span className="text-[11px] text-[#B8A47A] mt-1 block font-medium">{errors.supplier}</span>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-[#151515] mb-1.5">
              Quantity <span className="text-[#B8A47A]">*</span>
            </label>
            <input
              type="number"
              min="1"
              step="any"
              value={formData.quantity}
              onChange={(e) => handleChange('quantity', e.target.value)}
              placeholder="e.g. 20"
              className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-xs font-sans text-[#151515] placeholder-[#151515]/40 focus:outline-none transition-all ${
                errors.quantity
                  ? 'border-[#B8A47A] focus:ring-1 focus:ring-[#B8A47A]'
                  : 'border-[#151515]/15 focus:border-[#151515]'
              }`}
            />
            {errors.quantity && (
              <span className="text-[11px] text-[#B8A47A] mt-1 block font-medium">{errors.quantity}</span>
            )}
          </div>

          {/* Row 4: Actual Unit Price & Benchmark Unit Price */}
          <div>
            <label className="block text-xs font-medium text-[#151515] mb-1.5">
              Actual Unit Price (₹) <span className="text-[#B8A47A]">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={formData.actual_unit_price}
              onChange={(e) => handleChange('actual_unit_price', e.target.value)}
              placeholder="e.g. 52500"
              className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-xs font-sans text-[#151515] placeholder-[#151515]/40 focus:outline-none transition-all ${
                errors.actual_unit_price
                  ? 'border-[#B8A47A] focus:ring-1 focus:ring-[#B8A47A]'
                  : 'border-[#151515]/15 focus:border-[#151515]'
              }`}
            />
            {errors.actual_unit_price && (
              <span className="text-[11px] text-[#B8A47A] mt-1 block font-medium">{errors.actual_unit_price}</span>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-[#151515] mb-1.5">
              Benchmark Unit Price (₹) <span className="text-[#B8A47A]">*</span>
            </label>
            <input
              type="number"
              min="0.01"
              step="any"
              value={formData.benchmark_unit_price}
              onChange={(e) => handleChange('benchmark_unit_price', e.target.value)}
              placeholder="e.g. 47500"
              className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-xs font-sans text-[#151515] placeholder-[#151515]/40 focus:outline-none transition-all ${
                errors.benchmark_unit_price
                  ? 'border-[#B8A47A] focus:ring-1 focus:ring-[#B8A47A]'
                  : 'border-[#151515]/15 focus:border-[#151515]'
              }`}
            />
            {errors.benchmark_unit_price && (
              <span className="text-[11px] text-[#B8A47A] mt-1 block font-medium">{errors.benchmark_unit_price}</span>
            )}
          </div>

          {/* Row 5: Contract Price & Contract Discount */}
          <div>
            <label className="block text-xs font-medium text-[#151515] mb-1.5 flex items-center justify-between">
              <span>Contract Price (₹)</span>
              <span className="text-[10px] text-[#151515]/50 font-normal">(Optional)</span>
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={formData.contract_price}
              onChange={(e) => handleChange('contract_price', e.target.value)}
              placeholder="e.g. 48000"
              className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-xs font-sans text-[#151515] placeholder-[#151515]/40 focus:outline-none transition-all ${
                errors.contract_price
                  ? 'border-[#B8A47A] focus:ring-1 focus:ring-[#B8A47A]'
                  : 'border-[#151515]/15 focus:border-[#151515]'
              }`}
            />
            {errors.contract_price && (
              <span className="text-[11px] text-[#B8A47A] mt-1 block font-medium">{errors.contract_price}</span>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-[#151515] mb-1.5 flex items-center justify-between">
              <span>Contract Discount (%)</span>
              <span className="text-[10px] text-[#151515]/50 font-normal">(Optional, 0–100%)</span>
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="any"
              value={formData.contract_discount}
              onChange={(e) => handleChange('contract_discount', e.target.value)}
              placeholder="e.g. 5"
              className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-xs font-sans text-[#151515] placeholder-[#151515]/40 focus:outline-none transition-all ${
                errors.contract_discount
                  ? 'border-[#B8A47A] focus:ring-1 focus:ring-[#B8A47A]'
                  : 'border-[#151515]/15 focus:border-[#151515]'
              }`}
            />
            {errors.contract_discount && (
              <span className="text-[11px] text-[#B8A47A] mt-1 block font-medium">{errors.contract_discount}</span>
            )}
          </div>

          {/* Row 6: Department & Procurement Channel */}
          <div>
            <label className="block text-xs font-medium text-[#151515] mb-1.5 flex items-center justify-between">
              <span>Department</span>
              <span className="text-[10px] text-[#151515]/50 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={formData.department}
              onChange={(e) => handleChange('department', e.target.value)}
              placeholder="e.g. IT & Infrastructure"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#151515]/15 bg-white text-xs font-sans text-[#151515] placeholder-[#151515]/40 focus:outline-none focus:border-[#151515] transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#151515] mb-1.5 flex items-center justify-between">
              <span>Procurement Channel</span>
              <span className="text-[10px] text-[#151515]/50 font-normal">(Optional)</span>
            </label>
            <select
              value={formData.procurement_channel}
              onChange={(e) => handleChange('procurement_channel', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#151515]/15 bg-white text-xs font-sans text-[#151515] focus:outline-none focus:border-[#151515] transition-all"
            >
              <option value="">Select channel...</option>
              <option value="Catalog">Catalog</option>
              <option value="Contract">Contract</option>
              <option value="Off-Contract">Off-Contract</option>
            </select>
          </div>

          {/* Row 7: PO Number & Status (Optional) */}
          <div>
            <label className="block text-xs font-medium text-[#151515] mb-1.5 flex items-center justify-between">
              <span>PO Number</span>
              <span className="text-[10px] text-[#151515]/50 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={formData.po_number}
              onChange={(e) => handleChange('po_number', e.target.value)}
              placeholder="e.g. PO-8821"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#151515]/15 bg-white text-xs font-sans text-[#151515] placeholder-[#151515]/40 focus:outline-none focus:border-[#151515] transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#151515] mb-1.5 flex items-center justify-between">
              <span>Status</span>
              <span className="text-[10px] text-[#151515]/50 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              placeholder="e.g. Flagged / Paid / Review"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#151515]/15 bg-white text-xs font-sans text-[#151515] placeholder-[#151515]/40 focus:outline-none focus:border-[#151515] transition-all"
            />
          </div>
        </div>

        {/* Live Preview Card */}
        {showLivePreview && (
          <div className="p-4 rounded-2xl bg-white border border-[#151515]/10 shadow-sm animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#151515]/50 uppercase tracking-wider mb-2">
              <span className="flex items-center gap-1.5 text-[#151515] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#B8A47A]" />
                Live Ingestion Estimate
              </span>
              <span>Informational Preview</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-left pt-1">
              <div>
                <span className="text-[10px] uppercase text-[#151515]/60 block">Actual Spend</span>
                <span className="text-sm font-semibold text-[#151515] tnum">
                  {formatINR(currentActualSpend)}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-[#151515]/60 block">Reference Spend</span>
                <span className="text-sm font-semibold text-[#151515]/70 tnum">
                  {formatINR(currentRefSpend)}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-[#151515]/60 block">Variance</span>
                <span className="text-sm font-semibold tnum text-[#B8A47A]">
                  {currentVariancePct > 0 ? `+${currentVariancePct.toFixed(1)}%` : `${currentVariancePct.toFixed(1)}%`}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-[#151515]/60 block">Potential Leakage</span>
                <span className="text-sm font-semibold tnum text-[#B8A47A]">
                  {formatINR(currentLeakage)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Form Controls: + ADD TRANSACTION / CANCEL EDIT */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-[11px] text-[#151515]/60 font-sans">
            {editingIndex !== null ? (
              <span className="text-[#151515] font-semibold">
                Editing Transaction #{editingIndex + 1}
              </span>
            ) : (
              <span>Recommended batch size: 1–20 transactions</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {editingIndex !== null && (
              <button
                type="button"
                onClick={() => {
                  setEditingIndex(null);
                  setFormData(INITIAL_FORM);
                }}
                className="px-3 py-1.5 rounded-xl border border-[#151515]/10 bg-white text-xs font-sans text-[#151515]/70 hover:text-[#151515] transition-all"
              >
                Cancel Edit
              </button>
            )}

            <button
              type="button"
              onClick={handleAddTransaction}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#151515] hover:bg-[#151515]/90 text-[#F3F3F1] text-xs font-sans font-medium transition-all shadow-sm"
            >
              {editingIndex !== null ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#B8A47A]" />
                  <span>Update Transaction</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ ADD TRANSACTION</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Demo Example Hint */}
      <div className="px-4 py-3 rounded-2xl bg-[#F3F3F1] border border-[#151515]/10 text-xs text-[#151515]/70 font-sans flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-3.5 h-3.5 text-[#151515]/50 shrink-0" />
          <span>
            <strong className="text-[#151515]">Example:</strong> Industrial Laptop • TechWorld Solutions • 20 units • ₹52,500 actual • ₹47,500 benchmark
          </span>
        </div>
        <button
          type="button"
          onClick={handleUseExample}
          className="text-[#B8A47A] hover:underline font-semibold text-[11px] shrink-0"
        >
          Load example
        </button>
      </div>

      {/* Manual Data Table */}
      {stagedTransactions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-sans font-semibold text-[#151515]">
              Review Staged Transactions ({stagedTransactions.length})
            </h3>
            <span className="text-xs text-[#151515]/60 font-mono">
              Total Invoiced: {formatINR(stagedTransactions.reduce((acc, t) => acc + (t.quantity * t.unit_price), 0))}
            </span>
          </div>

          <div className="rounded-2xl border border-[#151515]/10 overflow-hidden bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#151515]/10 bg-[#F3F3F1] text-[#151515]/70 font-mono text-[11px]">
                    <th className="py-2.5 px-3 font-medium">ID</th>
                    <th className="py-2.5 px-3 font-medium">PRODUCT</th>
                    <th className="py-2.5 px-3 font-medium">SUPPLIER</th>
                    <th className="py-2.5 px-3 font-medium text-right">QTY</th>
                    <th className="py-2.5 px-3 font-medium text-right">ACTUAL</th>
                    <th className="py-2.5 px-3 font-medium text-right">BENCHMARK</th>
                    <th className="py-2.5 px-3 font-medium text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#151515]/5 text-[#151515]">
                  {stagedTransactions.map((tx, idx) => (
                    <tr
                      key={`${tx.transaction_id}-${idx}`}
                      className="hover:bg-[#151515]/[0.02] transition-colors"
                    >
                      <td className="py-2.5 px-3 font-mono font-medium">{tx.transaction_id}</td>
                      <td className="py-2.5 px-3">{tx.product_name}</td>
                      <td className="py-2.5 px-3 text-[#151515]/70">{tx.supplier}</td>
                      <td className="py-2.5 px-3 text-right font-mono">{tx.quantity}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-medium">
                        {formatINR(tx.unit_price)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-[#151515]/70">
                        {formatINR(tx.benchmark_unit_price)}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleEdit(idx)}
                            className="p-1.5 rounded-lg hover:bg-[#151515]/5 text-[#151515]/70 hover:text-[#151515] transition-colors"
                            title="Edit transaction"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemove(idx)}
                            className="p-1.5 rounded-lg hover:bg-[#151515]/10 text-[#151515]/50 hover:text-[#B8A47A] transition-colors"
                            title="Remove transaction"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Primary Action Button */}
      <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#151515]/10">
        <div className="text-xs text-[#151515]/60 font-sans">
          {stagedTransactions.length > 0
            ? `${stagedTransactions.length} transaction${stagedTransactions.length > 1 ? 's' : ''} ready to analyze.`
            : 'Fill the form above and click Analyze Spend.'}
        </div>

        <Button
          variant="primary"
          size="lg"
          onClick={handleSubmit}
          disabled={isSubmitting}
          icon={
            isSubmitting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )
          }
        >
          {isSubmitting ? 'Analyzing Ingested Spend...' : 'ANALYZE SPEND →'}
        </Button>
      </div>
    </div>
  );
};
