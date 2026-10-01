import { Transaction, LeakageAlert, FindingDetail, SupplierMetric } from '../types';

export const KPI_DATA = {
  totalSpend: '₹18.7 Cr',
  totalSpendRaw: 187000000,
  potentialLeakage: '₹31.6 L',
  potentialLeakageRaw: 3160000,
  highRiskCount: 143,
  suppliersAnalyzed: 428,
  transactionsAnalyzed: 50284,
  leakagePct: '1.69%',
  auditConfidence: '99.4%',
  identifiedSavings: '₹19.4 L'
};

export const LEAKAGE_CATEGORIES_DATA = [
  {
    category: 'Price Anomalies',
    amount: '₹18.2 L',
    amountRaw: 1820000,
    percentage: 57.6,
    color: '#B8A47A', // Champagne
    description: 'Unit prices exceeding contract index or historical peer averages across identical SKU purchases.',
    findingsCount: 68,
  },
  {
    category: 'Missed Discounts',
    amount: '₹7.4 L',
    amountRaw: 740000,
    percentage: 23.4,
    color: 'rgba(184, 164, 122, 0.75)', // Champagne tint
    description: 'Tiered volume rebates and prompt payment cash terms uncaptured at invoice settlement.',
    findingsCount: 34,
  },
  {
    category: 'Supplier Fragmentation',
    amount: '₹4.1 L',
    amountRaw: 410000,
    percentage: 13.0,
    color: 'rgba(184, 164, 122, 0.5)', // Champagne soft
    description: 'Identical categories distributed across rogue non-preferred vendors without aggregated pricing.',
    findingsCount: 26,
  },
  {
    category: 'Duplicate Purchases',
    amount: '₹1.9 L',
    amountRaw: 190000,
    percentage: 6.0,
    color: '#151515', // Primary Ink
    description: 'Double PO issuances and overlapping milestone billings detected via fuzzy matching.',
    findingsCount: 15,
  },
  {
    category: 'Contract Variance',
    amount: '₹0.0 L',
    amountRaw: 0,
    percentage: 0.0,
    color: 'rgba(21, 21, 21, 0.3)', // Muted Ink
    description: 'Deviation from contracted SLAs or unapproved freight and ancillary surcharges.',
    findingsCount: 0,
  },
];

export const MOCK_ALERTS: LeakageAlert[] = [
  {
    id: 'ALT-027',
    priority: 'HIGH',
    product: 'Industrial Laptop (ThinkPad P16v)',
    supplier: 'TechWorld Systems',
    potentialLeakage: '₹4,50,000',
    potentialLeakageValue: 450000,
    priceVariance: '+9.47%',
    historicalBenchmark: '₹47,500',
    category: 'Price Anomalies',
    findingRef: 'FINDING #027',
    date: '28 Sep 2026'
  },
  {
    id: 'ALT-014',
    priority: 'HIGH',
    product: 'High-Yield Toner Cartridge (Black)',
    supplier: 'ABC Traders',
    potentialLeakage: '₹5,500',
    potentialLeakageValue: 5500,
    priceVariance: '+8.53%',
    historicalBenchmark: '₹6,450',
    category: 'Price Anomalies',
    findingRef: 'FINDING #014',
    date: '27 Sep 2026'
  },
  {
    id: 'ALT-058',
    priority: 'HIGH',
    product: 'Enterprise Cloud Compute (Tier-3)',
    supplier: 'CloudScale Networks',
    potentialLeakage: '₹3,20,000',
    potentialLeakageValue: 320000,
    priceVariance: '+18.00%',
    historicalBenchmark: '₹14,50,000',
    category: 'Missed Discounts',
    findingRef: 'FINDING #058',
    date: '25 Sep 2026'
  },
  {
    id: 'ALT-089',
    priority: 'MEDIUM',
    product: 'Inter-State Logistics Freight (Zone 4)',
    supplier: 'Apex Freight Logistics',
    potentialLeakage: '₹1,85,000',
    potentialLeakageValue: 185000,
    priceVariance: '+11.20%',
    historicalBenchmark: '₹16,500/ton',
    category: 'Price Anomalies',
    findingRef: 'FINDING #089',
    date: '22 Sep 2026'
  },
  {
    id: 'ALT-102',
    priority: 'MEDIUM',
    product: 'Structural Fasteners & Hardware Kits',
    supplier: 'Vertex Precision Engineering',
    potentialLeakage: '₹95,000',
    potentialLeakageValue: 95000,
    priceVariance: '+14.10%',
    historicalBenchmark: '₹340/kit',
    category: 'Supplier Fragmentation',
    findingRef: 'FINDING #102',
    date: '20 Sep 2026'
  },
  {
    id: 'ALT-116',
    priority: 'MEDIUM',
    product: 'Annual ERP Support Maintenance',
    supplier: 'Kryon Enterprise Solutions',
    potentialLeakage: '₹1,40,000',
    potentialLeakageValue: 140000,
    priceVariance: '+6.25%',
    historicalBenchmark: '₹22,40,000',
    category: 'Missed Discounts',
    findingRef: 'FINDING #116',
    date: '18 Sep 2026'
  }
];

export const MOCK_FINDINGS: Record<string, FindingDetail> = {
  'FINDING #027': {
    id: 'F-027',
    refNumber: 'FINDING #027',
    product: 'Industrial Laptop (ThinkPad P16v Gen 2)',
    supplier: 'TechWorld Systems Pvt Ltd',
    category: 'Price Anomalies',
    potentialLeakage: '₹4,50,000',
    potentialLeakageRaw: 450000,
    historicalAverage: '₹47,500',
    actualPrice: '₹52,000',
    variance: '+9.47%',
    quantity: 100,
    exposure: '₹52,00,000',
    poNumber: 'PO-2026-8841',
    date: '16 September 2026',
    contractStatus: 'Spot Order (Master Service Agreement Inactive)',
    whyFlagged: [
      '100 laptops were purchased from TechWorld at ₹52,000 per unit.',
      'Comparable purchases from approved suppliers averaged ₹47,500 for identical specifications over the last 90 days.',
      'The difference represents an estimated ₹4.5L in potentially avoidable expenditure across single purchase order PO-2026-8841.',
      'Approved rate card with Lenovo National Partner was bypassed due to urgent regional requisitions.'
    ],
    evidenceSteps: [
      {
        title: 'PURCHASE HISTORY',
        description: 'PO-2026-8841 issued on 16 Sep 2026 for 100 units. Prior procurement in June 2026 recorded at ₹47,200 per unit.',
        metricLabel: 'Prior Order Baseline',
        metricValue: '₹47,200',
        status: 'neutral'
      },
      {
        title: 'SUPPLIER COMPARISON',
        description: 'TechWorld invoiced at ₹52,000. Approved vendor XYZ Supplies offers contracted rate of ₹47,500 with 5-day SLA.',
        metricLabel: 'Supplier Delta',
        metricValue: '+₹4,500 / unit',
        status: 'flag'
      },
      {
        title: 'CONTRACT TERMS',
        description: 'Supplier contract MSA-7729 expired in March 2026. Order processed under spot procurement without volume tier discount.',
        metricLabel: 'Contract Status',
        metricValue: 'Expired MSA',
        status: 'flag'
      },
      {
        title: 'PRICE BENCHMARK',
        description: 'Internal benchmark of ₹47,500 validated across 4 past purchase cycles in FY25-26. Market index median stands at ₹48,000.',
        metricLabel: 'Benchmark Variance',
        metricValue: '+9.47%',
        status: 'flag'
      },
      {
        title: 'AI ANALYSIS',
        description: 'High confidence finding (99.2%). Reclassification to preferred vendor channel recovers ₹4,50,000 with zero hardware specification compromise.',
        metricLabel: 'Recovery Probability',
        metricValue: '98.5%',
        status: 'verified'
      }
    ],
    comparableSuppliers: [
      {
        name: 'XYZ Supplies Ltd (Preferred)',
        unitPrice: '₹47,500',
        variance: '-8.65%',
        reliability: '98%',
        isApproved: true
      },
      {
        name: 'National IT Direct OEM',
        unitPrice: '₹47,200',
        variance: '-9.23%',
        reliability: '95%',
        isApproved: true
      },
      {
        name: 'TechWorld Systems (Current)',
        unitPrice: '₹52,000',
        variance: 'Baseline',
        reliability: '91%',
        isApproved: false
      }
    ]
  },
  'FINDING #014': {
    id: 'F-014',
    refNumber: 'FINDING #014',
    product: 'High-Yield Toner Cartridge (Black - CF289X)',
    supplier: 'ABC Traders',
    category: 'Price Anomalies',
    potentialLeakage: '₹5,500',
    potentialLeakageRaw: 5500,
    historicalAverage: '₹6,450',
    actualPrice: '₹7,000',
    variance: '+8.53%',
    quantity: 10,
    exposure: '₹70,000',
    poNumber: 'PO-2026-9012',
    date: '14 September 2026',
    contractStatus: 'Local Discretionary Spend',
    whyFlagged: [
      '10 toner cartridges purchased from ABC Traders at ₹7,000 per unit.',
      'Approved national rate agreement with Metro Office Solutions guarantees ₹6,450 delivered.',
      'Price variance of +8.5% resulted in ₹5,500 leakage on an ad-hoc local branch requisition.'
    ],
    evidenceSteps: [
      {
        title: 'PURCHASE HISTORY',
        description: 'Branch 04 requisitioned 10 toner units directly rather than routing via centralized catalog.',
        metricLabel: 'Requisition Mode',
        metricValue: 'Off-Catalog',
        status: 'neutral'
      },
      {
        title: 'SUPPLIER COMPARISON',
        description: 'ABC Traders unit cost of ₹7,000 vs Metro Office contracted price of ₹6,450.',
        metricLabel: 'Unit Variance',
        metricValue: '+₹550 / unit',
        status: 'flag'
      },
      {
        title: 'CONTRACT TERMS',
        description: 'Centralized Master Agreement with Metro Office includes free 48h shipping and recycling credit.',
        metricLabel: 'Active MSA',
        metricValue: 'MSA-OFF-2024',
        status: 'verified'
      },
      {
        title: 'PRICE BENCHMARK',
        description: 'Catalog price of ₹6,450 held firm through December 2026.',
        metricLabel: 'Benchmark Rate',
        metricValue: '₹6,450',
        status: 'neutral'
      },
      {
        title: 'AI ANALYSIS',
        description: 'Pattern indicates recurring branch off-catalog buying. Total annual leakage across 24 branches projected at ₹1.32L.',
        metricLabel: 'Branch Exposure',
        metricValue: '₹1.32L / yr',
        status: 'verified'
      }
    ],
    comparableSuppliers: [
      {
        name: 'Metro Office Solutions',
        unitPrice: '₹6,450',
        variance: '-7.86%',
        reliability: '99%',
        isApproved: true
      },
      {
        name: 'ABC Traders (Current)',
        unitPrice: '₹7,000',
        variance: 'Baseline',
        reliability: '92%',
        isApproved: false
      }
    ]
  },
  'FINDING #058': {
    id: 'F-058',
    refNumber: 'FINDING #058',
    product: 'Enterprise Cloud Compute (Tier-3 C6i Instances)',
    supplier: 'CloudScale Networks',
    category: 'Missed Discounts',
    potentialLeakage: '₹3,20,000',
    potentialLeakageRaw: 320000,
    historicalAverage: '₹14,50,000',
    actualPrice: '₹17,70,000',
    variance: '+18.00%',
    quantity: 1,
    exposure: '₹17,70,000',
    poNumber: 'PO-2026-7731',
    date: '25 August 2026',
    contractStatus: 'Committed Spend Tier Missed',
    whyFlagged: [
      'Cloud compute billing settled at on-demand standard enterprise tier of ₹17,70,000.',
      'Total annual spend crossed ₹1.5 Cr threshold, which contractually triggers an 18% volume rebate of ₹3,20,000.',
      'The vendor invoice failed to apply the retroactive credit memo, and accounts payable approved without deduction.'
    ],
    evidenceSteps: [
      {
        title: 'PURCHASE HISTORY',
        description: 'Monthly cloud infrastructure invoice for August 2026 processed without volume tier credit.',
        metricLabel: 'Invoice Amount',
        metricValue: '₹17,70,000',
        status: 'neutral'
      },
      {
        title: 'SUPPLIER COMPARISON',
        description: 'Supplier contract specifies automatic 18% tier rebate upon reaching Q2 aggregate run-rate.',
        metricLabel: 'Tier Rebate',
        metricValue: '18.0%',
        status: 'flag'
      },
      {
        title: 'CONTRACT TERMS',
        description: 'Section 4.2 of Cloud Master Agreement mandates supplier to self-credit within 30 days.',
        metricLabel: 'Contract Clause',
        metricValue: 'Clause 4.2 Rebates',
        status: 'verified'
      },
      {
        title: 'PRICE BENCHMARK',
        description: 'Net effective billing rate should have been ₹14,50,000.',
        metricLabel: 'Expected Net',
        metricValue: '₹14,50,000',
        status: 'flag'
      },
      {
        title: 'AI ANALYSIS',
        description: 'Full credit recovery feasible via debit note against upcoming September invoice.',
        metricLabel: 'Recovery Likelihood',
        metricValue: '100% (High)',
        status: 'verified'
      }
    ],
    comparableSuppliers: [
      {
        name: 'CloudScale Networks (Contracted Tier 3)',
        unitPrice: '₹14,50,000',
        variance: '-18.0%',
        reliability: '99.5%',
        isApproved: true
      },
      {
        name: 'CloudScale Networks (Invoiced On-Demand)',
        unitPrice: '₹17,70,000',
        variance: 'Baseline',
        reliability: '99.5%',
        isApproved: true
      }
    ]
  }
};

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 'TX-10293',
    date: '14 Mar 2026',
    supplier: 'ABC Traders',
    product: 'Printer Cartridge (CF289X)',
    category: 'Office Supplies',
    quantity: 10,
    unitPrice: 7000,
    benchmarkPrice: 6450,
    variancePct: 8.5,
    leakageAmount: 5500,
    status: 'HIGH',
    type: 'Price Anomalies',
    poNumber: 'PO-2026-9012',
    department: 'Corporate Admin',
    invoiceStatus: 'Flagged'
  },
  {
    id: 'TX-10294',
    date: '16 Mar 2026',
    supplier: 'TechWorld Systems',
    product: 'Industrial Laptop (ThinkPad P16v)',
    category: 'IT Hardware',
    quantity: 100,
    unitPrice: 52000,
    benchmarkPrice: 47500,
    variancePct: 9.47,
    leakageAmount: 450000,
    status: 'CRITICAL',
    type: 'Price Anomalies',
    poNumber: 'PO-2026-8841',
    department: 'Engineering Operations',
    invoiceStatus: 'Flagged'
  },
  {
    id: 'TX-10295',
    date: '18 Mar 2026',
    supplier: 'CloudScale Networks',
    product: 'Cloud Compute Infrastructure',
    category: 'Cloud & SaaS',
    quantity: 1,
    unitPrice: 1770000,
    benchmarkPrice: 1450000,
    variancePct: 18.08,
    leakageAmount: 320000,
    status: 'HIGH',
    type: 'Missed Discounts',
    poNumber: 'PO-2026-7731',
    department: 'Cloud Engineering',
    invoiceStatus: 'Pending Review'
  },
  {
    id: 'TX-10296',
    date: '20 Mar 2026',
    supplier: 'Apex Freight Logistics',
    product: 'Regional Haulage Freight (Zone 4)',
    category: 'Logistics',
    quantity: 15,
    unitPrice: 18400,
    benchmarkPrice: 16500,
    variancePct: 11.51,
    leakageAmount: 28500,
    status: 'MEDIUM',
    type: 'Price Anomalies',
    poNumber: 'PO-2026-6650',
    department: 'Supply Chain',
    invoiceStatus: 'Pending Review'
  },
  {
    id: 'TX-10297',
    date: '22 Mar 2026',
    supplier: 'Vertex Hardware Corp',
    product: 'Structural Fastener Sets M12',
    category: 'MRO & Tools',
    quantity: 250,
    unitPrice: 388,
    benchmarkPrice: 340,
    variancePct: 14.11,
    leakageAmount: 12000,
    status: 'MEDIUM',
    type: 'Supplier Fragmentation',
    poNumber: 'PO-2026-6210',
    department: 'Plant Maintenance',
    invoiceStatus: 'Paid'
  },
  {
    id: 'TX-10298',
    date: '24 Mar 2026',
    supplier: 'Kryon Enterprise Solutions',
    product: 'Quarterly ERP License Support',
    category: 'Software & IT',
    quantity: 1,
    unitPrice: 2380000,
    benchmarkPrice: 2240000,
    variancePct: 6.25,
    leakageAmount: 140000,
    status: 'HIGH',
    type: 'Missed Discounts',
    poNumber: 'PO-2026-5519',
    department: 'Finance & ERP',
    invoiceStatus: 'Pending Review'
  },
  {
    id: 'TX-10299',
    date: '25 Mar 2026',
    supplier: 'Metro Office Solutions',
    product: 'Ergonomic Desk Chairs (Mesh Pro)',
    category: 'Facilities',
    quantity: 40,
    unitPrice: 14200,
    benchmarkPrice: 14200,
    variancePct: 0.0,
    leakageAmount: 0,
    status: 'LOW',
    type: 'Contract Variance',
    poNumber: 'PO-2026-5110',
    department: 'Facilities Management',
    invoiceStatus: 'Paid'
  },
  {
    id: 'TX-10300',
    date: '26 Mar 2026',
    supplier: 'ABC Traders',
    product: 'Industrial A4 Paper Pallets (80 GSM)',
    category: 'Office Supplies',
    quantity: 30,
    unitPrice: 1950,
    benchmarkPrice: 1820,
    variancePct: 7.14,
    leakageAmount: 3900,
    status: 'MEDIUM',
    type: 'Supplier Fragmentation',
    poNumber: 'PO-2026-4992',
    department: 'Corporate Admin',
    invoiceStatus: 'Paid'
  },
  {
    id: 'TX-10301',
    date: '27 Mar 2026',
    supplier: 'Horizon Logistics Global',
    product: 'Expedited Express Air Courier',
    category: 'Logistics',
    quantity: 8,
    unitPrice: 42000,
    benchmarkPrice: 35000,
    variancePct: 20.0,
    leakageAmount: 56000,
    status: 'HIGH',
    type: 'Price Anomalies',
    poNumber: 'PO-2026-4820',
    department: 'R&D Operations',
    invoiceStatus: 'Flagged'
  },
  {
    id: 'TX-10302',
    date: '28 Mar 2026',
    supplier: 'Omega Safety Equipments',
    product: 'Class-3 Chemical Respirators',
    category: 'Safety & EHS',
    quantity: 120,
    unitPrice: 2850,
    benchmarkPrice: 2850,
    variancePct: 0.0,
    leakageAmount: 0,
    status: 'LOW',
    type: 'Contract Variance',
    poNumber: 'PO-2026-4412',
    department: 'Plant Safety',
    invoiceStatus: 'Paid'
  },
  {
    id: 'TX-10303',
    date: '29 Mar 2026',
    supplier: 'TechWorld Systems',
    product: '27-inch 4K Color-Accurate Monitors',
    category: 'IT Hardware',
    quantity: 35,
    unitPrice: 38500,
    benchmarkPrice: 34200,
    variancePct: 12.57,
    leakageAmount: 150500,
    status: 'HIGH',
    type: 'Price Anomalies',
    poNumber: 'PO-2026-4310',
    department: 'Design Studio',
    invoiceStatus: 'Flagged'
  },
  {
    id: 'TX-10304',
    date: '30 Mar 2026',
    supplier: 'Delta Industrial Supplies',
    product: 'Hydraulic Seal Kits (Duplicate PO)',
    category: 'MRO & Tools',
    quantity: 12,
    unitPrice: 15800,
    benchmarkPrice: 15800,
    variancePct: 0.0,
    leakageAmount: 189600,
    status: 'CRITICAL',
    type: 'Duplicate Purchases',
    poNumber: 'PO-2026-4190',
    department: 'Plant Maintenance',
    invoiceStatus: 'Flagged'
  }
];

export const MOCK_SUPPLIERS: SupplierMetric[] = [
  {
    id: 'SUP-01',
    name: 'ABC Traders Pvt Ltd',
    code: 'ABC-TRD',
    category: 'Office & Admin Consumables',
    avgUnitPrice: 52000,
    benchmarkDelta: 8.5,
    deliveryReliability: 92,
    qualityScore: 96,
    historicalPurchases: 142,
    totalSpend: 4850000,
    leakageExposure: 425000,
    risk: 'MEDIUM',
    contractExpiry: '15 Dec 2026',
    preferredStatus: false
  },
  {
    id: 'SUP-02',
    name: 'XYZ Supplies Ltd',
    code: 'XYZ-SUP',
    category: 'Enterprise Hardware & Peripherals',
    avgUnitPrice: 48500,
    benchmarkDelta: -2.1,
    deliveryReliability: 98,
    qualityScore: 99,
    historicalPurchases: 96,
    totalSpend: 18400000,
    leakageExposure: 0,
    risk: 'LOW',
    contractExpiry: '31 Aug 2027',
    preferredStatus: true
  },
  {
    id: 'SUP-03',
    name: 'TechWorld Systems',
    code: 'TCW-SYS',
    category: 'IT Hardware & Workstations',
    avgUnitPrice: 52000,
    benchmarkDelta: 9.47,
    deliveryReliability: 89,
    qualityScore: 94,
    historicalPurchases: 64,
    totalSpend: 31200000,
    leakageExposure: 840000,
    risk: 'HIGH',
    contractExpiry: 'Expired (Mar 2026)',
    preferredStatus: false
  },
  {
    id: 'SUP-04',
    name: 'Metro Office Solutions',
    code: 'MTR-OFF',
    category: 'Corporate Facilities & Furnishings',
    avgUnitPrice: 6450,
    benchmarkDelta: -1.5,
    deliveryReliability: 99,
    qualityScore: 98,
    historicalPurchases: 215,
    totalSpend: 9200000,
    leakageExposure: 15000,
    risk: 'LOW',
    contractExpiry: '30 Jun 2027',
    preferredStatus: true
  },
  {
    id: 'SUP-05',
    name: 'Apex Freight Logistics',
    code: 'APX-FRT',
    category: 'Domestic & Regional Freight',
    avgUnitPrice: 18400,
    benchmarkDelta: 11.5,
    deliveryReliability: 91,
    qualityScore: 93,
    historicalPurchases: 88,
    totalSpend: 14500000,
    leakageExposure: 320000,
    risk: 'HIGH',
    contractExpiry: '14 Nov 2026',
    preferredStatus: false
  },
  {
    id: 'SUP-06',
    name: 'CloudScale Networks',
    code: 'CSN-NET',
    category: 'Cloud Infrastructure & Hosting',
    avgUnitPrice: 1770000,
    benchmarkDelta: 18.0,
    deliveryReliability: 99.9,
    qualityScore: 99,
    historicalPurchases: 36,
    totalSpend: 42000000,
    leakageExposure: 320000,
    risk: 'MEDIUM',
    contractExpiry: '01 Jan 2028',
    preferredStatus: true
  }
];

export const MONTHLY_TREND_DATA = [
  { month: 'Apr', spend: 1.4, leakage: 0.18, recovered: 0.12 },
  { month: 'May', spend: 1.5, leakage: 0.22, recovered: 0.15 },
  { month: 'Jun', spend: 1.6, leakage: 0.31, recovered: 0.24 },
  { month: 'Jul', spend: 1.7, leakage: 0.29, recovered: 0.21 },
  { month: 'Aug', spend: 1.9, leakage: 0.45, recovered: 0.33 },
  { month: 'Sep', spend: 2.1, leakage: 0.48, recovered: 0.38 },
];
