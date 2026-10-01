import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProductComparisonItem, TabType } from '../../types';
import { formatINR } from '../../utils/formatters';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import {
  X,
  Layers,
  Scale,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Check,
  AlertTriangle,
  HelpCircle,
  Cpu,
  HardDrive,
  Zap,
  Package,
  Award,
  Star,
  Building2,
  Tag,
  Sliders,
} from 'lucide-react';

interface ProductComparisonDrawerProps {
  comparison: ProductComparisonItem | null;
  isOpen: boolean;
  onClose: () => void;
  onInvestigate?: (findingRef: string) => void;
  onSimulate?: (productA: string, priceA: number, productB: string, priceB: number) => void;
  onNavigate?: (tab: TabType) => void;
}

export const ProductComparisonDrawer: React.FC<ProductComparisonDrawerProps> = ({
  comparison,
  isOpen,
  onClose,
  onInvestigate,
  onSimulate,
  onNavigate,
}) => {
  if (!comparison) return null;

  const a = comparison.product_a || (typeof (comparison as any).productA === 'object' ? (comparison as any).productA : { product_name: (comparison as any).productA || 'Product A' });
  const b = comparison.product_b || (typeof (comparison as any).productB === 'object' ? (comparison as any).productB : { product_name: (comparison as any).productB || 'Product B' });
  const similarity_score = comparison.similarity_score ?? (comparison as any).similarityScore ?? 0;
  const classification = comparison.classification || (comparison as any).comparability || 'COMPARABLE';
  const comparability_tier = comparison.comparability_tier || 'Medium';
  const matching_attributes = comparison.matching_attributes || (comparison as any).matchingAttributes || [];
  const different_attributes = comparison.different_attributes || (comparison as any).differentAttributes || [];
  const unavailable_attributes = comparison.unavailable_attributes || (comparison as any).unavailableAttributes || [];
  const procurement_case = comparison.procurement_case || 'CASE_B_CONTEXTUAL_SPEC_DELTA';
  const explanation = comparison.explanation || '';
  const price_a = comparison.price_a ?? (comparison as any).priceA ?? 0;
  const price_b = comparison.price_b ?? (comparison as any).priceB ?? 0;
  const normalized_price_a = comparison.normalized_price_a ?? price_a;
  const normalized_price_b = comparison.normalized_price_b ?? price_b;
  const scores_breakdown = comparison.scores_breakdown || { category: 0, description: 0, specifications: 0, unit_pack_size: 0, brand_model: 0, quality: 0, reviews: 0 };
  const is_equal_price_different_spec = comparison.is_equal_price_different_spec ?? (comparison as any).equalPriceDifferentSpec ?? false;

  const scoreBadgeVariant =
    similarity_score >= 90
      ? 'HIGH'
      : similarity_score >= 75
      ? 'HIGH'
      : similarity_score >= 60
      ? 'MEDIUM'
      : 'LOW';

  // Helper to determine match status for an attribute
  const getAttrStatus = (
    valA: any,
    valB: any,
    isKnownMissing: boolean = false
  ): 'MATCH' | 'DIFFERENCE' | 'UNAVAILABLE' => {
    if (isKnownMissing || (valA == null && valB == null) || (valA === '' && valB === '')) {
      return 'UNAVAILABLE';
    }
    if (valA == null || valB == null || valA === '' || valB === '') {
      return 'DIFFERENCE';
    }
    const cleanA = String(valA).trim().toLowerCase();
    const cleanB = String(valB).trim().toLowerCase();
    return cleanA === cleanB ? 'MATCH' : 'DIFFERENCE';
  };

  const rows = [
    {
      label: 'Category',
      valA: a.category,
      valB: b.category,
      status: getAttrStatus(a.category, b.category),
    },
    {
      label: 'Description',
      valA: a.description || a.product_name,
      valB: b.description || b.product_name,
      status: getAttrStatus(a.description, b.description),
    },
    {
      label: 'Brand',
      valA: a.brand || 'Not specified in invoice',
      valB: b.brand || 'Not specified in invoice',
      status: getAttrStatus(a.brand, b.brand, !a.brand && !b.brand),
    },
    {
      label: 'Model / Part #',
      valA: a.model || 'Standard SKU',
      valB: b.model || 'Standard SKU',
      status: getAttrStatus(a.model, b.model, !a.model && !b.model),
    },
    {
      label: 'Technical Specifications',
      valA:
        Object.keys(a.specifications || {}).length > 0
          ? Object.entries(a.specifications)
              .map(([k, v]) => `${k.replace('_', ' ').toUpperCase()}: ${v}`)
              .join(' · ')
          : 'Standard configuration',
      valB:
        Object.keys(b.specifications || {}).length > 0
          ? Object.entries(b.specifications)
              .map(([k, v]) => `${k.replace('_', ' ').toUpperCase()}: ${v}`)
              .join(' · ')
          : 'Standard configuration',
      status:
        different_attributes.some(
          (d) =>
            d.includes('RAM') ||
            d.includes('Storage') ||
            d.includes('Wattage') ||
            d.includes('Processor') ||
            d.includes('Length') ||
            d.includes('Gsm')
        )
          ? 'DIFFERENCE'
          : matching_attributes.length > 0
          ? 'MATCH'
          : 'UNAVAILABLE',
    },
    {
      label: 'Pack Size / Structure',
      valA: a.pack_size || `${a.pack_quantity || 1} ${a.unit_of_measure}`,
      valB: b.pack_size || `${b.pack_quantity || 1} ${b.unit_of_measure}`,
      status: getAttrStatus(a.pack_size || a.pack_quantity, b.pack_size || b.pack_quantity),
    },
    {
      label: 'Quality Grade',
      valA: a.quality_grade || 'Not available in source data',
      valB: b.quality_grade || 'Not available in source data',
      status: getAttrStatus(a.quality_grade, b.quality_grade, !a.quality_grade && !b.quality_grade),
    },
    {
      label: 'Warranty Terms',
      valA: a.warranty || 'Standard commercial warranty',
      valB: b.warranty || 'Standard commercial warranty',
      status: getAttrStatus(a.warranty, b.warranty, !a.warranty && !b.warranty),
    },
    {
      label: 'Peer Rating & Reviews',
      valA:
        a.rating != null
          ? `${a.rating}★ (${a.review_count || 0} reviews)`
          : 'Review data unavailable in source dataset',
      valB:
        b.rating != null
          ? `${b.rating}★ (${b.review_count || 0} reviews)`
          : 'Review data unavailable in source dataset',
      status: getAttrStatus(a.rating, b.rating, a.rating == null && b.rating == null),
    },
    {
      label: 'Supplier Entity',
      valA: a.supplier,
      valB: b.supplier,
      status: getAttrStatus(a.supplier, b.supplier),
    },
    {
      label: 'Invoiced Unit Price',
      valA: formatINR(price_a),
      valB: formatINR(price_b),
      status: Math.abs(price_a - price_b) <= 0.01 ? 'MATCH' : 'DIFFERENCE',
      isPrice: true,
    },
    {
      label: 'Normalized Unit Rate (per base unit/L/kg)',
      valA: `${formatINR(normalized_price_a)} / ${a.unit_of_measure}`,
      valB: `${formatINR(normalized_price_b)} / ${b.unit_of_measure}`,
      status: Math.abs(normalized_price_a - normalized_price_b) <= 0.01 ? 'MATCH' : 'DIFFERENCE',
      isPrice: true,
    },
  ];

  const weightsList = [
    { label: 'Category', pct: '15%', score: scores_breakdown.category },
    { label: 'Description', pct: '20%', score: scores_breakdown.description },
    { label: 'Specifications', pct: '25%', score: scores_breakdown.specifications },
    { label: 'Pack Size', pct: '15%', score: scores_breakdown.unit_pack_size },
    { label: 'Brand / Model', pct: '10%', score: scores_breakdown.brand_model },
    { label: 'Quality', pct: '10%', score: scores_breakdown.quality },
    { label: 'Reviews', pct: '5%', score: scores_breakdown.reviews },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#151515]/60 backdrop-blur-xs transition-opacity"
          />

          {/* Slide-over Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="relative w-full max-w-4xl bg-[#F3F3F1] h-full shadow-2xl border-l border-[#151515]/10 flex flex-col z-10 overflow-hidden"
          >
            {/* 1. Header */}
            <div className="px-6 py-5 bg-[#151515] text-[#F3F3F1] flex items-center justify-between border-b border-[#151515]/10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#B8A47A]/20 border border-[#B8A47A]/40 flex items-center justify-center text-[#B8A47A]">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#B8A47A] font-semibold">
                      Product Differentiation Matrix
                    </span>
                    <span className="text-white/30">·</span>
                    <span className="text-[10px] font-mono text-white/60">
                      ID: {comparison.id}
                    </span>
                  </div>
                  <h2 className="text-lg font-sans font-semibold text-white tracking-tight">
                    Product Similarity Intelligence
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
                  aria-label="Close comparison panel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 2. Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Score Hero Card */}
              <div className="p-5 rounded-2xl bg-white border border-[#151515]/10 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-[#151515]/50 font-semibold block">
                      Multi-Factor Similarity Score
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-sans font-bold text-[#151515] tracking-tight">
                        {similarity_score.toFixed(1)}%
                      </span>
                      <span className="text-sm font-sans font-semibold text-[#B8A47A]">
                        {classification}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {is_equal_price_different_spec && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#B8A47A]/20 text-[#151515] border border-[#B8A47A]/40 shadow-xs">
                        <AlertTriangle className="w-3.5 h-3.5 text-[#B8A47A]" />
                        Equal Price / Different Spec
                      </span>
                    )}
                    <Badge variant={scoreBadgeVariant}>{comparability_tier} Comparability</Badge>
                  </div>
                </div>

                {/* Human-Readable Explanation Banner */}
                <div className="p-4 rounded-xl bg-[#151515]/5 border border-[#151515]/10 flex items-start gap-3">
                  <Sparkles className="w-4 h-4 text-[#B8A47A] shrink-0 mt-0.5" />
                  <div className="space-y-1 text-xs sm:text-sm text-[#151515]/80 font-sans leading-relaxed">
                    <p className="font-semibold text-[#151515]">Forensic Insight:</p>
                    <p>{explanation}</p>
                  </div>
                </div>

                {/* Score Breakdown Bars */}
                <div className="pt-2 border-t border-[#151515]/10">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-[#151515]/50 font-semibold block mb-2.5">
                    Transparent Attribute Weight Breakdown (100% Total)
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                    {weightsList.map((w, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-xl bg-[#F3F3F1] border border-[#151515]/5 text-center space-y-1"
                      >
                        <span className="text-[10px] font-sans text-[#151515]/60 font-medium block truncate">
                          {w.label} ({w.pct})
                        </span>
                        <span className="text-xs font-mono font-bold text-[#151515] block">
                          {w.score.toFixed(0)}%
                        </span>
                        <div className="w-full bg-[#151515]/10 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-[#B8A47A] h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.max(0, w.score))}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Side-by-Side Comparison Header Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Product A */}
                <div className="p-4 rounded-2xl bg-white border border-[#151515]/10 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded-md bg-[#151515] text-white">
                      Product A (Baseline Item)
                    </span>
                    <span className="text-xs font-mono text-[#151515]/50">{a.product_id}</span>
                  </div>
                  <h3 className="text-base font-sans font-semibold text-[#151515]">
                    {a.product_name}
                  </h3>
                  <div className="flex items-center justify-between pt-2 border-t border-[#151515]/10 text-xs">
                    <span className="text-[#151515]/60">Invoiced Unit Price:</span>
                    <span className="font-mono font-bold text-[#151515] text-sm">
                      {formatINR(price_a)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#151515]/60">Vendor:</span>
                    <span className="font-sans font-medium text-[#151515] truncate max-w-[180px]">
                      {a.supplier}
                    </span>
                  </div>
                </div>

                {/* Product B */}
                <div className="p-4 rounded-2xl bg-white border border-[#151515]/10 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded-md bg-[#B8A47A] text-[#151515]">
                      Product B (Compared Item)
                    </span>
                    <span className="text-xs font-mono text-[#151515]/50">{b.product_id}</span>
                  </div>
                  <h3 className="text-base font-sans font-semibold text-[#151515]">
                    {b.product_name}
                  </h3>
                  <div className="flex items-center justify-between pt-2 border-t border-[#151515]/10 text-xs">
                    <span className="text-[#151515]/60">Invoiced Unit Price:</span>
                    <span className="font-mono font-bold text-[#151515] text-sm">
                      {formatINR(price_b)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#151515]/60">Vendor:</span>
                    <span className="font-sans font-medium text-[#151515] truncate max-w-[180px]">
                      {b.supplier}
                    </span>
                  </div>
                </div>
              </div>

              {/* Side-by-Side Detailed Specification Matrix */}
              <div className="rounded-2xl bg-white border border-[#151515]/10 shadow-xs overflow-hidden">
                <div className="p-4 bg-[#151515]/5 border-b border-[#151515]/10 flex items-center justify-between">
                  <span className="text-xs font-sans font-semibold text-[#151515] uppercase tracking-wider">
                    Comprehensive Attribute Comparison Grid
                  </span>
                  <div className="flex items-center gap-3 text-[10px] font-mono">
                    <span className="flex items-center gap-1 text-[#151515]">
                      <span className="w-2 h-2 rounded-full bg-[#B8A47A]" /> MATCH
                    </span>
                    <span className="flex items-center gap-1 text-[#151515]/70">
                      <span className="w-2 h-2 rounded-full bg-amber-500" /> DIFFERENCE
                    </span>
                    <span className="flex items-center gap-1 text-[#151515]/40">
                      <span className="w-2 h-2 rounded-full bg-gray-400" /> UNAVAILABLE
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-[#151515]/5">
                  {rows.map((row, idx) => (
                    <div
                      key={idx}
                      className={`p-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-center hover:bg-[#151515]/[0.02] transition-colors ${
                        row.isPrice ? 'bg-[#B8A47A]/5 font-medium' : ''
                      }`}
                    >
                      <div className="md:col-span-3 flex items-center justify-between md:justify-start gap-2">
                        <span className="text-xs font-sans font-semibold text-[#151515]/70">
                          {row.label}
                        </span>
                        {/* Status badge */}
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold uppercase tracking-wider ${
                            row.status === 'MATCH'
                              ? 'bg-[#B8A47A]/20 text-[#151515] border border-[#B8A47A]/40'
                              : row.status === 'DIFFERENCE'
                              ? 'bg-amber-500/15 text-amber-900 border border-amber-500/30'
                              : 'bg-gray-200 text-gray-600 border border-gray-300'
                          }`}
                        >
                          {row.status}
                        </span>
                      </div>

                      {/* Product A value */}
                      <div className="md:col-span-4 text-xs font-sans text-[#151515] leading-relaxed break-words">
                        {row.valA}
                      </div>

                      {/* Divider / vs icon */}
                      <div className="hidden md:flex md:col-span-1 justify-center text-xs text-[#151515]/30 font-mono">
                        vs
                      </div>

                      {/* Product B value */}
                      <div className="md:col-span-4 text-xs font-sans text-[#151515] leading-relaxed break-words">
                        {row.valB}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detected Attributes Summary Lists */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Matching Attributes List */}
                <div className="p-4 rounded-2xl bg-white border border-[#151515]/10 shadow-xs space-y-3">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#B8A47A]" />
                    <h4 className="text-xs font-sans font-semibold uppercase tracking-wider text-[#151515]">
                      Matching Attributes ({matching_attributes.length})
                    </h4>
                  </div>
                  {matching_attributes.length > 0 ? (
                    <ul className="space-y-1.5">
                      {matching_attributes.map((attr, idx) => (
                        <li
                          key={idx}
                          className="text-xs font-sans text-[#151515]/80 flex items-start gap-2"
                        >
                          <span className="text-[#B8A47A] font-bold">✓</span>
                          <span>{attr}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-[#151515]/50 font-sans italic">
                      No exact matching attributes found.
                    </p>
                  )}
                </div>

                {/* Different Attributes List */}
                <div className="p-4 rounded-2xl bg-white border border-[#151515]/10 shadow-xs space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <h4 className="text-xs font-sans font-semibold uppercase tracking-wider text-[#151515]">
                      Divergent Attributes ({different_attributes.length})
                    </h4>
                  </div>
                  {different_attributes.length > 0 ? (
                    <ul className="space-y-1.5">
                      {different_attributes.map((attr, idx) => (
                        <li
                          key={idx}
                          className="text-xs font-sans text-[#151515]/80 flex items-start gap-2"
                        >
                          <span className="text-amber-600 font-bold">•</span>
                          <span>{attr}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-[#151515]/50 font-sans italic">
                      No divergent specifications identified.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* 3. Footer Controls */}
            <div className="p-4 bg-white border-t border-[#151515]/10 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 text-xs font-mono text-[#151515]/60">
                <span>Classification:</span>
                <span className="font-semibold text-[#151515]">{classification}</span>
              </div>

              <div className="flex items-center gap-3">
                {onSimulate && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onSimulate(a.product_name, price_a, b.product_name, price_b)}
                    icon={<Sliders className="w-3.5 h-3.5 text-[#151515]/70" />}
                  >
                    Simulate Rates
                  </Button>
                )}

                {onInvestigate && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      onInvestigate(a.product_id || a.product_name);
                      onClose();
                    }}
                    icon={<ArrowRight className="w-3.5 h-3.5 text-[#B8A47A]" />}
                    iconPosition="right"
                  >
                    Investigate Item
                  </Button>
                )}

                <Button variant="secondary" size="sm" onClick={onClose}>
                  Close
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
