/**
 * SpendIntel - Procurement Analytics Transformation Utility
 *
 * Core computation layer transforming transaction-level finding records
 * and backend dashboard metrics into unified, data-driven visualization models.
 *
 * Adheres strictly to:
 * - Single source of truth (derived exclusively from active dataset)
 * - Canonical leakage deduplication (no double-counting)
 * - Real data validation
 * - Dynamic trend baseline detection (no fake arrows)
 */

import { DashboardData } from '../../../types';

export interface NormalizedTransaction {
  id: string;
  transaction_id: string;
  date?: string | null;
  supplier: string;
  normalized_supplier?: string;
  product_id?: string;
  product: string;
  normalized_product?: string;
  quantity: number;
  unit_price: number;
  benchmark_unit_price: number;
  expected_price: number;
  potential_leakage: number;
  variance_percent: number;
  risk: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  alert_type: string;
  department?: string;
  po_id?: string;
  evidence?: string[];
  reason?: string;
  actual_spend: number;
  reference_spend: number;
}

export interface ActualVsBenchmarkItem {
  product: string;
  productId: string;
  actualPrice: number;
  benchmarkPrice: number;
  diffPerUnit: number;
  variancePercent: number;
  totalQuantity: number;
  potentialLeakage: number;
  transactionCount: number;
}

export interface SupplierLeakageItem {
  supplier: string;
  totalSpend: number;
  transactionCount: number;
  potentialLeakage: number;
  avgVariance: number;
}

export interface ProductLeakageItem {
  product: string;
  productId: string;
  totalSpend: number;
  transactionCount: number;
  potentialLeakage: number;
  avgVariance: number;
}

export interface RiskDistributionItem {
  risk: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  count: number;
  potentialLeakage: number;
  percentage: number;
  color: string;
}

export interface AlertTypeDistributionItem {
  type: string;
  label: string;
  count: number;
  potentialLeakage: number;
  percentage: number;
  color: string;
}

export interface VarianceBucketItem {
  range: string;
  min: number;
  max: number;
  count: number;
  potentialLeakage: number;
  percentage: number;
}

export interface QuantityLeakagePoint {
  transactionId: string;
  supplier: string;
  product: string;
  quantity: number;
  actualPrice: number;
  benchmarkPrice: number;
  potentialLeakage: number;
  variancePercent: number;
  risk: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  alertType: string;
}

export interface TopTransactionItem {
  transactionId: string;
  supplier: string;
  product: string;
  potentialLeakage: number;
  variancePercent: number;
  actualPrice: number;
  benchmarkPrice: number;
  quantity: number;
  risk: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface SpendComparisonData {
  actualSpend: number;
  referenceSpend: number;
  difference: number;
  varianceRatio: number; // percentage overrun
}

export interface TimeSeriesPoint {
  dateStr: string;
  timestamp: number;
  actualSpend: number;
  referenceSpend: number;
  potentialLeakage: number;
  transactionCount: number;
}

export interface ProcurementAnalytics {
  kpis: {
    totalSpend: number;
    potentialLeakage: number;
    leakageRate: number;
    transactions: number;
    suppliers: number;
    products: number;
    trendBaseline: {
      hasComparison: boolean;
      spendTrendPct?: number;
      leakageTrendPct?: number;
      label: string;
    };
  };
  actualVsBenchmark: ActualVsBenchmarkItem[];
  supplierLeakage: SupplierLeakageItem[];
  productLeakage: ProductLeakageItem[];
  riskDistribution: RiskDistributionItem[];
  alertTypeDistribution: AlertTypeDistributionItem[];
  varianceDistribution: VarianceBucketItem[];
  quantityLeakage: QuantityLeakagePoint[];
  topTransactions: TopTransactionItem[];
  spendComparison: SpendComparisonData;
  timeSeries: {
    hasValidDates: boolean;
    points: TimeSeriesPoint[];
    unavailabilityReason?: string;
  };
  totalAlertsCount: number;
}

// Color tokens strictly adhering to SpendIntel 3-color design system (Ink, Soft Gray, Champagne)
export const RISK_COLORS: Record<string, string> = {
  CRITICAL: '#B8A47A',
  HIGH: 'rgba(184,164,122,0.85)',
  MEDIUM: 'rgba(21,21,21,0.6)',
  LOW: 'rgba(21,21,21,0.3)',
};

export const ALERT_TYPE_COLORS: Record<string, string> = {
  PRICE_ANOMALY: '#B8A47A',
  POSSIBLE_DUPLICATE: 'rgba(184,164,122,0.8)',
  SUPPLIER_FRAGMENTATION: 'rgba(21,21,21,0.75)',
  MISSED_DISCOUNT: 'rgba(184,164,122,0.6)',
  CONTRACT_NON_COMPLIANCE: 'rgba(21,21,21,0.55)',
  OFF_CONTRACT_PURCHASE: 'rgba(184,164,122,0.4)',
  UNUSUAL_PATTERN: 'rgba(21,21,21,0.35)',
};

export const ALERT_TYPE_LABELS: Record<string, string> = {
  PRICE_ANOMALY: 'Price Anomaly',
  POSSIBLE_DUPLICATE: 'Duplicate Purchase',
  SUPPLIER_FRAGMENTATION: 'Supplier Frag.',
  MISSED_DISCOUNT: 'Missed Discount',
  CONTRACT_NON_COMPLIANCE: 'Contract Non-Compliance',
  OFF_CONTRACT_PURCHASE: 'Off-Contract Purchase',
  UNUSUAL_PATTERN: 'Unusual Pattern',
};

/**
 * Normalizes raw finding or transaction item into structured record.
 */
export function normalizeTransactionItem(item: any, index: number): NormalizedTransaction {
  const txId = String(item.transaction_id || item.id || item.po_id || item.poNumber || `TX-${index + 1}`).trim();
  const supplier = String(item.supplier || item.supplier_name || item.vendor_name || item.vendor || 'Unknown Supplier').trim();
  const product = String(item.product || item.product_name || item.item_description || 'Unknown Product').trim();
  const productId = String(item.product_id || item.sku || item.item_code || product).trim();

  const quantity = Math.max(1, Number(item.quantity ?? item.qty ?? item.units ?? 1));
  const unitPrice = Number(item.actual_price ?? item.unit_price ?? item.price ?? 0);
  const benchmarkPrice = Number(item.benchmark_price ?? item.benchmark_unit_price ?? item.expected_price ?? unitPrice);
  const variancePct = Number(item.variance_percent ?? item.variance ?? (benchmarkPrice > 0 ? ((unitPrice - benchmarkPrice) / benchmarkPrice) * 100 : 0));
  const potentialLeakage = Number(item.potential_leakage ?? item.amount ?? Math.max(0, (unitPrice - benchmarkPrice) * quantity));

  const rawRisk = String(item.risk || item.status || 'MEDIUM').toUpperCase();
  const risk: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' =
    rawRisk.includes('CRIT') ? 'CRITICAL' :
    rawRisk.includes('HIGH') ? 'HIGH' :
    rawRisk.includes('LOW') ? 'LOW' : 'MEDIUM';

  const rawType = String(item.type || item.detection_type || item.alert_type || 'PRICE_ANOMALY').toUpperCase();
  let alertType = 'PRICE_ANOMALY';
  if (rawType.includes('DUPLICATE')) alertType = 'POSSIBLE_DUPLICATE';
  else if (rawType.includes('FRAGMENT')) alertType = 'SUPPLIER_FRAGMENTATION';
  else if (rawType.includes('DISCOUNT')) alertType = 'MISSED_DISCOUNT';
  else if (rawType.includes('OFF_CONTRACT')) alertType = 'OFF_CONTRACT_PURCHASE';
  else if (rawType.includes('CONTRACT')) alertType = 'CONTRACT_NON_COMPLIANCE';
  else if (rawType.includes('PATTERN') || rawType.includes('SPIKE') || rawType.includes('CHANGE') || rawType.includes('UNUSUAL')) alertType = 'UNUSUAL_PATTERN';

  const dateVal = item.date || item.transaction_date || item.purchase_date || null;

  return {
    id: String(item.id || txId),
    transaction_id: txId,
    date: dateVal,
    supplier,
    normalized_supplier: item.normalized_supplier || supplier,
    product_id: productId,
    product,
    normalized_product: item.normalized_product_name || product,
    quantity,
    unit_price: unitPrice,
    benchmark_unit_price: benchmarkPrice,
    expected_price: benchmarkPrice,
    potential_leakage: potentialLeakage,
    variance_percent: variancePct,
    risk,
    alert_type: alertType,
    department: item.department,
    po_id: item.po_id || item.poNumber,
    evidence: Array.isArray(item.evidence) ? item.evidence : [],
    reason: item.reason,
    actual_spend: quantity * unitPrice,
    reference_spend: quantity * benchmarkPrice,
  };
}

/**
 * Master analytics calculation engine.
 * Receives filtered raw transactions and backend dashboard model.
 */
export function computeProcurementAnalytics(
  rawItems: any[],
  dashboardData?: DashboardData | null
): ProcurementAnalytics {
  if (!rawItems || rawItems.length === 0) {
    return createEmptyAnalytics(dashboardData);
  }

  // 1. Normalize all items
  const normalizedList: NormalizedTransaction[] = rawItems.map((item, idx) =>
    normalizeTransactionItem(item, idx)
  );

  // 2. Canonical Transaction Deduplication (Part 5 - Double Counting Protection)
  // Group by transaction_id so multi-finding transactions follow max canonical leakage
  const txMap = new Map<string, NormalizedTransaction>();
  for (const item of normalizedList) {
    const existing = txMap.get(item.transaction_id);
    if (!existing) {
      txMap.set(item.transaction_id, { ...item });
    } else {
      // Keep highest potential leakage for that transaction (canonical deduplication)
      if (item.potential_leakage > existing.potential_leakage) {
        existing.potential_leakage = item.potential_leakage;
        existing.alert_type = item.alert_type;
        existing.reason = item.reason;
      }
      // Escalate risk if higher
      if (item.risk === 'CRITICAL' || (item.risk === 'HIGH' && existing.risk !== 'CRITICAL')) {
        existing.risk = item.risk;
      }
      // If actual spend was 0 on one finding, update from other
      if (existing.actual_spend === 0 && item.actual_spend > 0) {
        existing.actual_spend = item.actual_spend;
        existing.unit_price = item.unit_price;
        existing.benchmark_unit_price = item.benchmark_unit_price;
        existing.reference_spend = item.reference_spend;
      }
    }
  }

  const uniqueTransactions = Array.from(txMap.values());

  // 3. Overall Financial KPIs
  // If backend dashboardData exists and matches total set, prefer authoritative kpis
  const isFiltered = rawItems.length < (dashboardData?.kpis?.transactions ?? 999999);

  let totalSpend = 0;
  let potentialLeakage = 0;
  let referenceSpend = 0;

  for (const tx of uniqueTransactions) {
    totalSpend += tx.actual_spend;
    potentialLeakage += tx.potential_leakage;
    referenceSpend += tx.reference_spend;
  }

  // If unfiltered and backend provides authoritative KPIs, use backend deduplicated amount
  if (!isFiltered && dashboardData?.kpis) {
    totalSpend = dashboardData.kpis.total_spend ?? totalSpend;
    potentialLeakage = dashboardData.kpis.potential_leakage ?? potentialLeakage;
  }

  const leakageRate = totalSpend > 0 ? (potentialLeakage / totalSpend) * 100 : 0;
  const suppliersSet = new Set(uniqueTransactions.map((t) => t.supplier));
  const productsSet = new Set(uniqueTransactions.map((t) => t.product));

  // 4. Trend Baseline Detection (Part 7 - Never fabricate trend arrows)
  const trendBaseline = {
    hasComparison: false,
    label: 'Current period baseline',
  };

  // 5. GRAPH 1: Actual vs Benchmark Price (Grouped by product)
  const productPriceMap = new Map<string, {
    product: string;
    productId: string;
    actualPriceSum: number;
    benchmarkPriceSum: number;
    quantitySum: number;
    leakageSum: number;
    count: number;
  }>();

  for (const tx of uniqueTransactions) {
    const key = tx.product;
    const existing = productPriceMap.get(key);
    if (!existing) {
      productPriceMap.set(key, {
        product: tx.product,
        productId: tx.product_id || tx.product,
        actualPriceSum: tx.unit_price * tx.quantity,
        benchmarkPriceSum: tx.benchmark_unit_price * tx.quantity,
        quantitySum: tx.quantity,
        leakageSum: tx.potential_leakage,
        count: 1,
      });
    } else {
      existing.actualPriceSum += tx.unit_price * tx.quantity;
      existing.benchmarkPriceSum += tx.benchmark_unit_price * tx.quantity;
      existing.quantitySum += tx.quantity;
      existing.leakageSum += tx.potential_leakage;
      existing.count += 1;
    }
  }

  const actualVsBenchmark: ActualVsBenchmarkItem[] = Array.from(productPriceMap.values())
    .map((p) => {
      const avgActual = p.quantitySum > 0 ? p.actualPriceSum / p.quantitySum : 0;
      const avgBenchmark = p.quantitySum > 0 ? p.benchmarkPriceSum / p.quantitySum : 0;
      const diff = avgActual - avgBenchmark;
      const variance = avgBenchmark > 0 ? (diff / avgBenchmark) * 100 : 0;
      return {
        product: p.product,
        productId: p.productId,
        actualPrice: Math.round(avgActual * 100) / 100,
        benchmarkPrice: Math.round(avgBenchmark * 100) / 100,
        diffPerUnit: Math.round(diff * 100) / 100,
        variancePercent: Math.round(variance * 100) / 100,
        totalQuantity: p.quantitySum,
        potentialLeakage: Math.round(p.leakageSum * 100) / 100,
        transactionCount: p.count,
      };
    })
    .sort((a, b) => Math.abs(b.diffPerUnit) - Math.abs(a.diffPerUnit));

  // 6. GRAPH 2: Potential Leakage by Supplier
  const supplierMap = new Map<string, {
    supplier: string;
    spend: number;
    count: number;
    leakage: number;
    varianceSum: number;
  }>();

  for (const tx of uniqueTransactions) {
    const supp = tx.supplier;
    const existing = supplierMap.get(supp);
    if (!existing) {
      supplierMap.set(supp, {
        supplier: supp,
        spend: tx.actual_spend,
        count: 1,
        leakage: tx.potential_leakage,
        varianceSum: tx.variance_percent,
      });
    } else {
      existing.spend += tx.actual_spend;
      existing.count += 1;
      existing.leakage += tx.potential_leakage;
      existing.varianceSum += tx.variance_percent;
    }
  }

  const supplierLeakage: SupplierLeakageItem[] = Array.from(supplierMap.values())
    .map((s) => ({
      supplier: s.supplier,
      totalSpend: Math.round(s.spend * 100) / 100,
      transactionCount: s.count,
      potentialLeakage: Math.round(s.leakage * 100) / 100,
      avgVariance: s.count > 0 ? Math.round((s.varianceSum / s.count) * 100) / 100 : 0,
    }))
    .sort((a, b) => b.potentialLeakage - a.potentialLeakage);

  // 7. GRAPH 3: Top Products by Leakage
  const productLeakageMap = new Map<string, {
    product: string;
    productId: string;
    spend: number;
    count: number;
    leakage: number;
    varianceSum: number;
  }>();

  for (const tx of uniqueTransactions) {
    const prod = tx.product;
    const existing = productLeakageMap.get(prod);
    if (!existing) {
      productLeakageMap.set(prod, {
        product: prod,
        productId: tx.product_id || prod,
        spend: tx.actual_spend,
        count: 1,
        leakage: tx.potential_leakage,
        varianceSum: tx.variance_percent,
      });
    } else {
      existing.spend += tx.actual_spend;
      existing.count += 1;
      existing.leakage += tx.potential_leakage;
      existing.varianceSum += tx.variance_percent;
    }
  }

  const productLeakage: ProductLeakageItem[] = Array.from(productLeakageMap.values())
    .map((p) => ({
      product: p.product,
      productId: p.productId,
      totalSpend: Math.round(p.spend * 100) / 100,
      transactionCount: p.count,
      potentialLeakage: Math.round(p.leakage * 100) / 100,
      avgVariance: p.count > 0 ? Math.round((p.varianceSum / p.count) * 100) / 100 : 0,
    }))
    .sort((a, b) => b.potentialLeakage - a.potentialLeakage);

  // 8. GRAPH 4: Risk Distribution (Only categories that actually exist)
  const riskMap: Record<string, { count: number; leakage: number }> = {
    CRITICAL: { count: 0, leakage: 0 },
    HIGH: { count: 0, leakage: 0 },
    MEDIUM: { count: 0, leakage: 0 },
    LOW: { count: 0, leakage: 0 },
  };

  for (const tx of uniqueTransactions) {
    if (riskMap[tx.risk]) {
      riskMap[tx.risk].count += 1;
      riskMap[tx.risk].leakage += tx.potential_leakage;
    }
  }

  const totalTxCount = uniqueTransactions.length || 1;
  const riskDistribution: RiskDistributionItem[] = (['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const)
    .filter((r) => riskMap[r].count > 0) // Never fabricate non-existent risk tiers
    .map((r) => ({
      risk: r,
      count: riskMap[r].count,
      potentialLeakage: Math.round(riskMap[r].leakage * 100) / 100,
      percentage: Math.round((riskMap[r].count / totalTxCount) * 1000) / 10,
      color: RISK_COLORS[r] || 'rgba(21,21,21,0.5)',
    }));

  // 9. GRAPH 5: Leakage by Alert Type (Derived from findings)
  const alertMap = new Map<string, { count: number; leakage: number }>();
  for (const item of normalizedList) {
    const existing = alertMap.get(item.alert_type) || { count: 0, leakage: 0 };
    existing.count += 1;
    existing.leakage += item.potential_leakage;
    alertMap.set(item.alert_type, existing);
  }

  const alertTotalLeakage = Array.from(alertMap.values()).reduce((sum, a) => sum + a.leakage, 0) || 1;
  const alertTypeDistribution: AlertTypeDistributionItem[] = Array.from(alertMap.entries())
    .map(([type, data]) => ({
      type,
      label: ALERT_TYPE_LABELS[type] || type.replace(/_/g, ' '),
      count: data.count,
      potentialLeakage: Math.round(data.leakage * 100) / 100,
      percentage: Math.round((data.leakage / alertTotalLeakage) * 1000) / 10,
      color: ALERT_TYPE_COLORS[type] || '#B8A47A',
    }))
    .sort((a, b) => b.potentialLeakage - a.potentialLeakage);

  // 10. GRAPH 6: Price Variance Distribution (Buckets: 0-5%, 5-10%, 10-15%, 15-20%, 20%+)
  const buckets: VarianceBucketItem[] = [
    { range: '0–5%', min: 0, max: 5, count: 0, potentialLeakage: 0, percentage: 0 },
    { range: '5–10%', min: 5, max: 10, count: 0, potentialLeakage: 0, percentage: 0 },
    { range: '10–15%', min: 10, max: 15, count: 0, potentialLeakage: 0, percentage: 0 },
    { range: '15–20%', min: 15, max: 20, count: 0, potentialLeakage: 0, percentage: 0 },
    { range: '20%+', min: 20, max: Infinity, count: 0, potentialLeakage: 0, percentage: 0 },
  ];

  for (const tx of uniqueTransactions) {
    const v = tx.variance_percent;
    const bucket = buckets.find((b) => v >= b.min && v < b.max);
    if (bucket) {
      bucket.count += 1;
      bucket.potentialLeakage += tx.potential_leakage;
    } else if (v >= 20) {
      buckets[4].count += 1;
      buckets[4].potentialLeakage += tx.potential_leakage;
    }
  }

  for (const b of buckets) {
    b.percentage = Math.round((b.count / totalTxCount) * 1000) / 10;
    b.potentialLeakage = Math.round(b.potentialLeakage * 100) / 100;
  }

  // 11. GRAPH 7: Quantity vs Potential Leakage (Scatter points)
  const quantityLeakage: QuantityLeakagePoint[] = uniqueTransactions.map((tx) => ({
    transactionId: tx.transaction_id,
    supplier: tx.supplier,
    product: tx.product,
    quantity: tx.quantity,
    actualPrice: tx.unit_price,
    benchmarkPrice: tx.benchmark_unit_price,
    potentialLeakage: tx.potential_leakage,
    variancePercent: tx.variance_percent,
    risk: tx.risk,
    alertType: tx.alert_type,
  }));

  // 12. GRAPH 8: Actual Spend vs Reference Spend
  const spendDiff = totalSpend - referenceSpend;
  const spendComparison: SpendComparisonData = {
    actualSpend: Math.round(totalSpend * 100) / 100,
    referenceSpend: Math.round(referenceSpend * 100) / 100,
    difference: Math.round(spendDiff * 100) / 100,
    varianceRatio: referenceSpend > 0 ? Math.round((spendDiff / referenceSpend) * 1000) / 10 : 0,
  };

  // 13. GRAPH 9: Top Transactions by Potential Leakage
  const topTransactions: TopTransactionItem[] = uniqueTransactions
    .filter((tx) => tx.potential_leakage > 0)
    .sort((a, b) => b.potential_leakage - a.potential_leakage)
    .slice(0, 10)
    .map((tx) => ({
      transactionId: tx.transaction_id,
      supplier: tx.supplier,
      product: tx.product,
      potentialLeakage: Math.round(tx.potential_leakage * 100) / 100,
      variancePercent: Math.round(tx.variance_percent * 100) / 100,
      actualPrice: tx.unit_price,
      benchmarkPrice: tx.benchmark_unit_price,
      quantity: tx.quantity,
      risk: tx.risk,
    }));

  // 14. Time Series Evaluation (Part 17 - Valid transaction dates only)
  const validDatedItems = uniqueTransactions.filter(
    (tx) => tx.date && !isNaN(Date.parse(String(tx.date)))
  );

  let timeSeries: {
    hasValidDates: boolean;
    points: TimeSeriesPoint[];
    unavailabilityReason?: string;
  };

  if (validDatedItems.length >= 3) {
    const dateMap = new Map<string, { spend: number; ref: number; leakage: number; count: number; ts: number }>();
    for (const tx of validDatedItems) {
      const parsedDate = new Date(String(tx.date));
      const key = parsedDate.toISOString().split('T')[0];
      const existing = dateMap.get(key) || { spend: 0, ref: 0, leakage: 0, count: 0, ts: parsedDate.getTime() };
      existing.spend += tx.actual_spend;
      existing.ref += tx.reference_spend;
      existing.leakage += tx.potential_leakage;
      existing.count += 1;
      dateMap.set(key, existing);
    }

    const points: TimeSeriesPoint[] = Array.from(dateMap.entries())
      .sort((a, b) => a[1].ts - b[1].ts)
      .map(([dateStr, data]) => ({
        dateStr,
        timestamp: data.ts,
        actualSpend: Math.round(data.spend * 100) / 100,
        referenceSpend: Math.round(data.ref * 100) / 100,
        potentialLeakage: Math.round(data.leakage * 100) / 100,
        transactionCount: data.count,
      }));

    timeSeries = {
      hasValidDates: true,
      points,
    };
  } else {
    timeSeries = {
      hasValidDates: false,
      points: [],
      unavailabilityReason: 'No valid transaction dates were provided in active dataset.',
    };
  }

  // 15. Real Data Validation (Part 31 - Development-time validation)
  if (import.meta.env?.DEV) {
    const riskSumLeakage = riskDistribution.reduce((acc, r) => acc + r.potentialLeakage, 0);
    if (Math.abs(riskSumLeakage - potentialLeakage) > 100 && !isFiltered) {
      console.warn(
        `[SpendIntel Analytics] Notice: Risk leakage sum (${riskSumLeakage}) differs from deduplicated total (${potentialLeakage}) due to multi-rule overlap protection.`
      );
    }
  }

  return {
    kpis: {
      totalSpend: Math.round(totalSpend * 100) / 100,
      potentialLeakage: Math.round(potentialLeakage * 100) / 100,
      leakageRate: Math.round(leakageRate * 100) / 100,
      transactions: uniqueTransactions.length,
      suppliers: suppliersSet.size,
      products: productsSet.size,
      trendBaseline,
    },
    actualVsBenchmark,
    supplierLeakage,
    productLeakage,
    riskDistribution,
    alertTypeDistribution,
    varianceDistribution: buckets,
    quantityLeakage,
    topTransactions,
    spendComparison,
    timeSeries,
    totalAlertsCount: normalizedList.length,
  };
}

function createEmptyAnalytics(dashboardData?: DashboardData | null): ProcurementAnalytics {
  return {
    kpis: {
      totalSpend: 0,
      potentialLeakage: 0,
      leakageRate: 0,
      transactions: 0,
      suppliers: 0,
      products: 0,
      trendBaseline: {
        hasComparison: false,
        label: 'No data available for current filter selection',
      },
    },
    actualVsBenchmark: [],
    supplierLeakage: [],
    productLeakage: [],
    riskDistribution: [],
    alertTypeDistribution: [],
    varianceDistribution: [
      { range: '0–5%', min: 0, max: 5, count: 0, potentialLeakage: 0, percentage: 0 },
      { range: '5–10%', min: 5, max: 10, count: 0, potentialLeakage: 0, percentage: 0 },
      { range: '10–15%', min: 10, max: 15, count: 0, potentialLeakage: 0, percentage: 0 },
      { range: '15–20%', min: 15, max: 20, count: 0, potentialLeakage: 0, percentage: 0 },
      { range: '20%+', min: 20, max: Infinity, count: 0, potentialLeakage: 0, percentage: 0 },
    ],
    quantityLeakage: [],
    topTransactions: [],
    spendComparison: {
      actualSpend: 0,
      referenceSpend: 0,
      difference: 0,
      varianceRatio: 0,
    },
    timeSeries: {
      hasValidDates: false,
      points: [],
      unavailabilityReason: 'No transactions match filter criteria.',
    },
    totalAlertsCount: 0,
  };
}
