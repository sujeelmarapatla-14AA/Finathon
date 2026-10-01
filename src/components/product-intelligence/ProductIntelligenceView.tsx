import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion, Variants } from 'framer-motion';
import {
  TabType,
  DataSource,
  ProductIntelligenceData,
  ProductComparisonItem,
  ProductComparableGroup,
} from '../../types';
import { fetchProductIntelligence, compareProductPair, DEMO_FILE_ID } from '../../services/api';
import { formatCompactINR, formatINR } from '../../utils/formatters';
import { PageHeader } from '../common/PageHeader';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { ProductComparisonDrawer } from './ProductComparisonDrawer';
import { CUBIC_EASE } from '../layout/PageTransition';
import {
  Scale,
  Search,
  Sliders,
  Filter,
  ArrowRight,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Layers,
  Database,
  Cloud,
  FileSpreadsheet,
  PenLine,
  Eye,
  Info,
  HelpCircle,
  TrendingDown,
  Cpu,
  Package,
  Award,
} from 'lucide-react';

interface ProductIntelligenceViewProps {
  dataSource?: DataSource;
  fileId?: string;
  onNavigate: (tab: TabType) => void;
  onInvestigate: (findingRef: string) => void;
  onSimulate?: (productA: string, priceA: number, productB: string, priceB: number) => void;
}

export const ProductIntelligenceView: React.FC<ProductIntelligenceViewProps> = ({
  dataSource = 'demo',
  fileId = DEMO_FILE_ID,
  onNavigate,
  onInvestigate,
  onSimulate,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [data, setData] = useState<ProductIntelligenceData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<
    'all' | 'equal_price' | 'highly_comparable' | 'diff_specs' | 'pack_size' | 'insufficient'
  >('all');

  // Selected comparison for drawer
  const [selectedComparison, setSelectedComparison] = useState<ProductComparisonItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  // Interactive Custom Weight Tuner State
  const [showWeightTuner, setShowWeightTuner] = useState<boolean>(false);
  const [customWeights, setCustomWeights] = useState({
    category: 15,
    description: 20,
    specifications: 25,
    unit_pack_size: 15,
    brand_model: 10,
    quality: 10,
    reviews: 5,
  });

  // Pairwise Interactive Comparator State
  const [selectedProdAIndex, setSelectedProdAIndex] = useState<number>(0);
  const [selectedProdBIndex, setSelectedProdBIndex] = useState<number>(1);
  const [customPairResult, setCustomPairResult] = useState<any | null>(null);
  const [isComparingCustom, setIsComparingCustom] = useState<boolean>(false);

  // Load product intelligence from backend
  const loadData = useCallback(
    async (force: boolean = false) => {
      setLoading(true);
      setErrorMessage(null);
      try {
        const res = await fetchProductIntelligence(dataSource, fileId, force);
        setData(res);
      } catch (err: any) {
        console.warn('Product intelligence load error:', err);
        setErrorMessage(err.message || 'Unable to load product similarity intelligence.');
      } finally {
        setLoading(false);
      }
    },
    [dataSource, fileId]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Unique products for comparator picker
  const uniqueProducts = useMemo(() => {
    if (!data || !data.comparisons) return [];
    const map = new Map<string, any>();
    data.comparisons.forEach((c) => {
      if (c.product_a && !map.has(c.product_a.product_id || c.product_a.product_name)) {
        map.set(c.product_a.product_id || c.product_a.product_name, c.product_a);
      }
      if (c.product_b && !map.has(c.product_b.product_id || c.product_b.product_name)) {
        map.set(c.product_b.product_id || c.product_b.product_name, c.product_b);
      }
    });
    return Array.from(map.values());
  }, [data]);

  // Handle live pairwise comparison
  const handleRecalculatePair = async () => {
    if (uniqueProducts.length < 2) return;
    const prodA = uniqueProducts[selectedProdAIndex] || uniqueProducts[0];
    const prodB = uniqueProducts[selectedProdBIndex] || uniqueProducts[1];
    setIsComparingCustom(true);
    try {
      const normalizedWeights = {
        category: customWeights.category / 100.0,
        description: customWeights.description / 100.0,
        specifications: customWeights.specifications / 100.0,
        unit_pack_size: customWeights.unit_pack_size / 100.0,
        brand_model: customWeights.brand_model / 100.0,
        quality: customWeights.quality / 100.0,
        reviews: customWeights.reviews / 100.0,
      };
      const res = await compareProductPair(prodA, prodB, normalizedWeights);
      setCustomPairResult(res.comparison);
    } catch (e) {
      console.warn('Custom comparison note:', e);
    } finally {
      setIsComparingCustom(false);
    }
  };

  // Filtered comparisons
  const filteredComparisons = useMemo(() => {
    if (!data || !data.comparisons) return [];
    let list = [...data.comparisons];

    // Filter by type
    if (activeFilter === 'equal_price') {
      list = list.filter((c) => c.is_equal_price_different_spec || (c as any).equalPriceDifferentSpec);
    } else if (activeFilter === 'highly_comparable') {
      list = list.filter((c) => (c.similarity_score ?? (c as any).similarityScore ?? 0) >= 75.0 || c.classification === 'HIGHLY_COMPARABLE' || (c as any).comparability === 'HIGHLY_COMPARABLE');
    } else if (activeFilter === 'diff_specs') {
      list = list.filter((c) => ((c.different_attributes?.length ?? 0) > 0 || ((c as any).differentAttributes?.length ?? 0) > 0) || (c.similarity_score ?? (c as any).similarityScore ?? 100) < 60.0 || c.classification === 'DIFFERENT_SPECS' || (c as any).comparability === 'DIFFERENT_SPECS');
    } else if (activeFilter === 'pack_size') {
      list = list.filter((c) => c.procurement_case === 'CASE_F_PACK_SIZE_DIFFERENCE' || (c.different_attributes || (c as any).differentAttributes || []).some((d: string) => String(d).toLowerCase().includes('pack')));
    } else if (activeFilter === 'insufficient') {
      list = list.filter((c) => c.classification === 'INSUFFICIENT_DATA' || (c as any).comparability === 'INSUFFICIENT_DATA' || (c.unavailable_attributes?.length ?? 0) >= 3);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((c) => {
        const nameA = c.product_a?.product_name || (c as any).productA || '';
        const nameB = c.product_b?.product_name || (c as any).productB || '';
        const suppA = c.product_a?.supplier || (c as any).supplier_a || (c as any).supplierA || '';
        const suppB = c.product_b?.supplier || (c as any).supplier_b || (c as any).supplierB || '';
        const catA = c.product_a?.category || '';
        const catB = c.product_b?.category || '';
        const skuA = c.product_a?.product_id || '';
        const skuB = c.product_b?.product_id || '';
        const exp = c.explanation || '';
        const matchAttrs = (c.matching_attributes || (c as any).matchingAttributes || []).join(' ');
        const diffAttrs = (c.different_attributes || (c as any).differentAttributes || []).join(' ');

        return (
          nameA.toLowerCase().includes(q) ||
          nameB.toLowerCase().includes(q) ||
          suppA.toLowerCase().includes(q) ||
          suppB.toLowerCase().includes(q) ||
          catA.toLowerCase().includes(q) ||
          catB.toLowerCase().includes(q) ||
          skuA.toLowerCase().includes(q) ||
          skuB.toLowerCase().includes(q) ||
          exp.toLowerCase().includes(q) ||
          matchAttrs.toLowerCase().includes(q) ||
          diffAttrs.toLowerCase().includes(q)
        );
      });
    }

    return list;
  }, [data, activeFilter, searchQuery]);

  const kpis = useMemo(() => {
    const comps = data?.comparisons || [];
    if (data?.summary_kpis && (data.summary_kpis.highly_comparable_count > 0 || data.summary_kpis.different_specifications_count > 0 || data.summary_kpis.equal_price_different_value_count > 0)) {
      return data.summary_kpis;
    }
    return {
      total_products: uniqueProducts.length || data?.summary_kpis?.total_products || 0,
      total_comparisons: comps.length || data?.summary_kpis?.total_comparisons || 0,
      highly_comparable_count: comps.filter(c => (c.similarity_score ?? (c as any).similarityScore ?? 0) >= 75.0 || c.classification === 'HIGHLY_COMPARABLE' || (c as any).comparability === 'HIGHLY_COMPARABLE').length,
      partially_comparable_count: comps.filter(c => {
        const s = c.similarity_score ?? (c as any).similarityScore ?? 0;
        return (s >= 60.0 && s < 75.0) || c.classification === 'PARTIALLY_COMPARABLE' || (c as any).comparability === 'PARTIALLY_COMPARABLE';
      }).length,
      different_specifications_count: comps.filter(c => (c.similarity_score ?? (c as any).similarityScore ?? 100) < 60.0 || c.classification === 'DIFFERENT_SPECS' || (c as any).comparability === 'DIFFERENT_SPECS').length,
      equal_price_different_value_count: comps.filter(c => c.is_equal_price_different_spec || (c as any).equalPriceDifferentSpec).length,
      insufficient_data_count: comps.filter(c => c.classification === 'INSUFFICIENT_DATA' || (c as any).comparability === 'INSUFFICIENT_DATA').length,
    };
  }, [data, uniqueProducts]);

  const sectionReveal: Variants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.55, ease: CUBIC_EASE },
    },
  };

  return (
    <div className="space-y-10">
      {/* 1. Header */}
      <motion.div variants={sectionReveal} initial="hidden" animate="visible" className="space-y-4">
        <PageHeader
          label="Procurement Benchmarking & Spec Intelligence"
          title="Product Similarity & Differentiation Engine"
          description="Multi-factor comparability analysis evaluating whether procurement items are genuinely equivalent alternatives before benchmarking price."
          actions={
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setShowWeightTuner(!showWeightTuner)}
                icon={<Sliders className="w-3.5 h-3.5 text-[#151515]/70" />}
              >
                {showWeightTuner ? 'Hide Weight Tuner' : 'Configure Weights'}
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={() => loadData(true)}
                icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
              >
                Refresh
              </Button>
            </div>
          }
        />

        {/* Source info pill */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#151515]/5 border border-[#151515]/10 text-xs font-sans text-[#151515]/70">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#B8A47A] shadow-[0_0_6px_rgba(184,164,122,0.8)]" />
            <span className="font-semibold text-[#151515]">
              Active Dataset: {data?.source_label || dataSource.toUpperCase()}
            </span>
            <span className="text-[#151515]/30">·</span>
            <span>Price is evaluated strictly AFTER product comparability is established.</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px] text-[#151515]/60">
            <span>{kpis.total_products} unique items</span>
            <span>•</span>
            <span>{kpis.total_comparisons} evaluated pairs</span>
          </div>
        </div>
      </motion.div>

      {/* 2. Six Required KPI Summary Blocks */}
      <motion.div
        variants={sectionReveal}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4"
      >
        {/* Total Product Groups */}
        <div className="p-4 rounded-2xl bg-white border border-[#151515]/10 shadow-xs space-y-1">
          <span className="text-[10px] uppercase font-mono tracking-wider text-[#151515]/50 font-semibold block">
            Product Groups
          </span>
          <div className="text-2xl sm:text-3xl font-sans font-bold text-[#151515] tracking-tight tnum">
            {kpis.total_products}
          </div>
          <p className="text-[11px] text-[#151515]/60 font-sans truncate">Normalized commodities</p>
        </div>

        {/* Highly Comparable */}
        <div className="p-4 rounded-2xl bg-white border border-[#151515]/10 shadow-xs space-y-1">
          <span className="text-[10px] uppercase font-mono tracking-wider text-[#B8A47A] font-semibold block">
            Highly Comparable
          </span>
          <div className="text-2xl sm:text-3xl font-sans font-bold text-[#151515] tracking-tight tnum">
            {kpis.highly_comparable_count}
          </div>
          <p className="text-[11px] text-[#151515]/60 font-sans truncate">≥75% similarity index</p>
        </div>

        {/* Partially Comparable */}
        <div className="p-4 rounded-2xl bg-white border border-[#151515]/10 shadow-xs space-y-1">
          <span className="text-[10px] uppercase font-mono tracking-wider text-[#151515]/50 font-semibold block">
            Partially Comparable
          </span>
          <div className="text-2xl sm:text-3xl font-sans font-bold text-[#151515] tracking-tight tnum">
            {kpis.partially_comparable_count}
          </div>
          <p className="text-[11px] text-[#151515]/60 font-sans truncate">60–74% similarity index</p>
        </div>

        {/* Different Specifications */}
        <div className="p-4 rounded-2xl bg-white border border-[#151515]/10 shadow-xs space-y-1">
          <span className="text-[10px] uppercase font-mono tracking-wider text-[#151515]/50 font-semibold block">
            Different Specs
          </span>
          <div className="text-2xl sm:text-3xl font-sans font-bold text-[#151515] tracking-tight tnum">
            {kpis.different_specifications_count}
          </div>
          <p className="text-[11px] text-[#151515]/60 font-sans truncate">Hardware / tier deltas</p>
        </div>

        {/* Equal Price / Different Value (Highlighted) */}
        <div className="p-4 rounded-2xl bg-white border-2 border-[#B8A47A] shadow-md space-y-1 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-2 h-2 bg-[#B8A47A] rounded-bl-md" />
          <span className="text-[10px] uppercase font-mono tracking-wider text-[#B8A47A] font-bold block flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-[#B8A47A]" /> Equal Price / Diff Value
          </span>
          <div className="text-2xl sm:text-3xl font-sans font-bold text-[#151515] tracking-tight tnum">
            {kpis.equal_price_different_value_count}
          </div>
          <p className="text-[11px] text-[#151515]/70 font-sans font-medium truncate">
            Equal cost, unequal specs
          </p>
        </div>

        {/* Insufficient Data */}
        <div className="p-4 rounded-2xl bg-white border border-[#151515]/10 shadow-xs space-y-1">
          <span className="text-[10px] uppercase font-mono tracking-wider text-[#151515]/40 font-semibold block">
            Insufficient Data
          </span>
          <div className="text-2xl sm:text-3xl font-sans font-bold text-[#151515]/70 tracking-tight tnum">
            {kpis.insufficient_data_count}
          </div>
          <p className="text-[11px] text-[#151515]/50 font-sans truncate">
            Unverified attributes
          </p>
        </div>
      </motion.div>

      {/* 3. Weight Tuner Drawer (Expandable) */}
      <AnimatePresence>
        {showWeightTuner && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-6 rounded-2xl bg-white border border-[#151515]/10 shadow-xs space-y-4 overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#B8A47A]" />
                <h3 className="text-sm font-sans font-semibold text-[#151515]">
                  Multi-Factor Similarity Weight Configuration
                </h3>
              </div>
              <span className="text-xs font-mono text-[#151515]/60">
                Sum:{' '}
                {Object.values(customWeights).reduce((a, b) => a + b, 0)}%
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
              {Object.entries(customWeights).map(([key, val]) => (
                <div key={key} className="space-y-1.5 p-3 rounded-xl bg-[#F3F3F1] border border-[#151515]/5">
                  <div className="flex justify-between text-xs font-sans">
                    <span className="capitalize font-medium text-[#151515]/70 truncate">
                      {key.replace('_', ' ')}
                    </span>
                    <span className="font-mono font-bold text-[#151515]">{val}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={val}
                    onChange={(e) =>
                      setCustomWeights({
                        ...customWeights,
                        [key]: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    className="w-full accent-[#B8A47A] cursor-pointer"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  setCustomWeights({
                    category: 15,
                    description: 20,
                    specifications: 25,
                    unit_pack_size: 15,
                    brand_model: 10,
                    quality: 10,
                    reviews: 5,
                  })
                }
              >
                Reset Default Weights
              </Button>
              <Button variant="primary" size="sm" onClick={handleRecalculatePair}>
                Apply & Test
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Filter Tabs & Search Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeFilter === 'all'
                ? 'bg-[#151515] text-[#F3F3F1] font-semibold shadow-xs'
                : 'bg-white border border-[#151515]/10 text-[#151515]/70 hover:text-[#151515]'
            }`}
          >
            All Comparisons ({data?.comparisons?.length || 0})
          </button>

          <button
            onClick={() => setActiveFilter('equal_price')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeFilter === 'equal_price'
                ? 'bg-[#151515] text-[#B8A47A] font-semibold shadow-xs'
                : 'bg-white border border-[#B8A47A]/30 text-[#151515] hover:border-[#B8A47A]'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-[#B8A47A]" />
            Equal Price / Diff Spec ({kpis.equal_price_different_value_count})
          </button>

          <button
            onClick={() => setActiveFilter('highly_comparable')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeFilter === 'highly_comparable'
                ? 'bg-[#151515] text-[#F3F3F1] font-semibold shadow-xs'
                : 'bg-white border border-[#151515]/10 text-[#151515]/70 hover:text-[#151515]'
            }`}
          >
            Highly Comparable ({kpis.highly_comparable_count})
          </button>

          <button
            onClick={() => setActiveFilter('diff_specs')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeFilter === 'diff_specs'
                ? 'bg-[#151515] text-[#F3F3F1] font-semibold shadow-xs'
                : 'bg-white border border-[#151515]/10 text-[#151515]/70 hover:text-[#151515]'
            }`}
          >
            Specification Deltas ({kpis.different_specifications_count})
          </button>

          <button
            onClick={() => setActiveFilter('pack_size')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeFilter === 'pack_size'
                ? 'bg-[#151515] text-[#F3F3F1] font-semibold shadow-xs'
                : 'bg-white border border-[#151515]/10 text-[#151515]/70 hover:text-[#151515]'
            }`}
          >
            Pack Normalization
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#151515]/40" />
          <input
            type="text"
            placeholder="Search products, specs, vendor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 rounded-full bg-white border border-[#151515]/10 text-xs font-sans text-[#151515] focus:outline-hidden focus:border-[#B8A47A] shadow-xs"
          />
        </div>
      </div>

      {/* 5. Comparison Table */}
      <div className="rounded-2xl bg-white border border-[#151515]/10 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#151515]/5 border-b border-[#151515]/10 text-[10.5px] font-sans font-semibold uppercase tracking-wider text-[#151515]/60">
                <th className="py-3 px-4">Product A</th>
                <th className="py-3 px-4">Product B</th>
                <th className="py-3 px-4 text-center">Similarity</th>
                <th className="py-3 px-4">Matching Attributes</th>
                <th className="py-3 px-4">Different Attributes</th>
                <th className="py-3 px-4 text-right">Price A</th>
                <th className="py-3 px-4 text-right">Price B</th>
                <th className="py-3 px-4 text-center">Comparability</th>
                <th className="py-3 px-4">Forensic Explanation</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#151515]/5 text-xs font-sans text-[#151515]">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-xs text-[#151515]/60">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#B8A47A]" />
                    Analyzing multi-factor product comparability...
                  </td>
                </tr>
              ) : filteredComparisons.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-xs text-[#151515]/60">
                    No product comparisons matching the active criteria.
                  </td>
                </tr>
              ) : (
                filteredComparisons.map((c, idx) => {
                  const isEq = c.is_equal_price_different_spec || (c as any).equalPriceDifferentSpec;
                  const score = c.similarity_score ?? (c as any).similarityScore ?? 0;
                  const scoreVariant =
                    score >= 90
                      ? 'HIGH'
                      : score >= 75
                      ? 'HIGH'
                      : score >= 60
                      ? 'MEDIUM'
                      : 'LOW';

                  const prodAName = c.product_a?.product_name || (c as any).productA || 'Product A';
                  const prodASupp = c.product_a?.supplier || (c as any).supplier_a || (c as any).supplierA || '';
                  const prodBName = c.product_b?.product_name || (c as any).productB || 'Product B';
                  const prodBSupp = c.product_b?.supplier || (c as any).supplier_b || (c as any).supplierB || '';
                  const matchAttrs = c.matching_attributes || (c as any).matchingAttributes || [];
                  const diffAttrs = c.different_attributes || (c as any).differentAttributes || [];
                  const priceA = c.price_a ?? (c as any).priceA ?? 0;
                  const priceB = c.price_b ?? (c as any).priceB ?? 0;
                  const classificationLabel = c.classification || (c as any).comparability || 'COMPARABLE';

                  return (
                    <tr
                      key={c.id || idx}
                      onClick={() => {
                        setSelectedComparison(c);
                        setIsDrawerOpen(true);
                      }}
                      className={`cursor-pointer hover:bg-[#151515]/[0.03] transition-colors ${
                        isEq ? 'bg-[#B8A47A]/5 font-medium' : ''
                      }`}
                    >
                      {/* Product A */}
                      <td className="py-3.5 px-4 font-semibold text-[#151515]">
                        <div className="flex flex-col">
                          <span>{prodAName}</span>
                          <span className="text-[10px] font-mono text-[#151515]/50 font-normal">
                            {prodASupp}
                          </span>
                        </div>
                      </td>

                      {/* Product B */}
                      <td className="py-3.5 px-4 font-semibold text-[#151515]">
                        <div className="flex flex-col">
                          <span>{prodBName}</span>
                          <span className="text-[10px] font-mono text-[#151515]/50 font-normal">
                            {prodBSupp}
                          </span>
                        </div>
                      </td>

                      {/* Similarity Score */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-[#151515]/5 border border-[#151515]/10 text-[#151515]">
                          {score.toFixed(1)}%
                        </span>
                      </td>

                      {/* Matching Attributes */}
                      <td className="py-3.5 px-4 max-w-[200px]">
                        <div className="flex flex-wrap gap-1">
                          {matchAttrs.slice(0, 2).map((m: string, i: number) => (
                            <span
                              key={i}
                              className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-sans bg-[#B8A47A]/15 text-[#151515] border border-[#B8A47A]/30 truncate max-w-[180px]"
                            >
                              ✓ {m}
                            </span>
                          ))}
                          {matchAttrs.length > 2 && (
                            <span className="text-[10px] text-[#151515]/50 font-mono">
                              +{matchAttrs.length - 2} more
                            </span>
                          )}
                          {matchAttrs.length === 0 && (
                            <span className="text-[10px] text-[#151515]/40 font-mono">—</span>
                          )}
                        </div>
                      </td>

                      {/* Different Attributes */}
                      <td className="py-3.5 px-4 max-w-[200px]">
                        <div className="flex flex-wrap gap-1">
                          {diffAttrs.slice(0, 2).map((d: string, i: number) => (
                            <span
                              key={i}
                              className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-sans bg-amber-500/10 text-amber-900 border border-amber-500/25 truncate max-w-[180px]"
                            >
                              • {d}
                            </span>
                          ))}
                          {diffAttrs.length > 2 && (
                            <span className="text-[10px] text-[#151515]/50 font-mono">
                              +{diffAttrs.length - 2} more
                            </span>
                          )}
                          {diffAttrs.length === 0 && (
                            <span className="text-[10px] text-emerald-700 font-mono">Identical specs</span>
                          )}
                        </div>
                      </td>

                      {/* Price A */}
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-[#151515]">
                        {formatINR(priceA)}
                      </td>

                      {/* Price B */}
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-[#151515]">
                        {formatINR(priceB)}
                      </td>

                      {/* Comparability */}
                      <td className="py-3.5 px-4 text-center">
                        <Badge variant={scoreVariant} size="sm">
                          {classificationLabel}
                        </Badge>
                      </td>

                      {/* Forensic Explanation */}
                      <td className="py-3.5 px-4 text-xs text-[#151515]/70 max-w-[240px] truncate" title={c.explanation}>
                        {c.explanation}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-center">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedComparison(c);
                            setIsDrawerOpen(true);
                          }}
                          icon={<Eye className="w-3.5 h-3.5 text-[#151515]/70" />}
                        >
                          Details
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Comparable Product Groups (Clusters) Section */}
      {data?.comparable_groups && data.comparable_groups.length > 0 && (
        <motion.div
          variants={sectionReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="p-6 rounded-2xl bg-white border border-[#151515]/10 shadow-xs space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#B8A47A] font-semibold block">
                Valid Benchmarking Clusters
              </span>
              <h3 className="text-base font-sans font-semibold text-[#151515]">
                Genuinely Comparable Product Groups ({data.comparable_groups.length})
              </h3>
            </div>
            <span className="text-xs text-[#151515]/60 font-sans">
              Price benchmarking is restricted to valid clusters (≥75% similarity).
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.comparable_groups.map((grp, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-[#F3F3F1] border border-[#151515]/10 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-semibold text-[#151515]">
                    {grp.category}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white border border-[#151515]/10">
                    {grp.products_count} items
                  </span>
                </div>
                <p className="text-xs font-sans font-medium text-[#151515] truncate">
                  {grp.group_name}
                </p>
                <div className="pt-2 border-t border-[#151515]/10 flex items-center justify-between text-xs font-mono">
                  <span className="text-[#151515]/60">Avg Normalized Rate:</span>
                  <span className="font-bold text-[#151515]">
                    {formatINR(grp.avg_normalized_price)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* 7. Product Comparison Side-Over Drawer Modal */}
      <ProductComparisonDrawer
        comparison={selectedComparison}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onInvestigate={onInvestigate}
        onSimulate={onSimulate}
        onNavigate={onNavigate}
      />
    </div>
  );
};
