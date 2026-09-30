export type TabType = 
  | 'overview' 
  | 'table' 
  | 'leakage' 
  | 'suppliers' 
  | 'investigation' 
  | 'simulator' 
  | 'reports' 
  | 'upload'
  | 'settings';

export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type LeakageCategory = 
  | 'Price Anomalies' 
  | 'Missed Discounts' 
  | 'Supplier Fragmentation' 
  | 'Duplicate Purchases' 
  | 'Contract Variance';

export interface Transaction {
  id: string;
  date: string;
  supplier: string;
  product: string;
  category: string;
  quantity: number;
  unitPrice: number;
  benchmarkPrice: number;
  variancePct: number;
  leakageAmount: number;
  status: RiskLevel;
  type: LeakageCategory;
  poNumber: string;
  department: string;
  invoiceStatus: 'Paid' | 'Pending Review' | 'Flagged' | 'Recovered';
}

export interface LeakageAlert {
  id: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  product: string;
  supplier: string;
  potentialLeakage: string;
  potentialLeakageValue: number;
  priceVariance: string;
  historicalBenchmark: string;
  category: LeakageCategory;
  findingRef: string;
  date: string;
}

export interface FindingDetail {
  id: string;
  refNumber: string;
  product: string;
  supplier: string;
  category: string;
  potentialLeakage: string;
  potentialLeakageRaw: number;
  historicalAverage: string;
  actualPrice: string;
  variance: string;
  quantity: number;
  exposure: string;
  poNumber: string;
  date: string;
  contractStatus: string;
  whyFlagged: string[];
  evidenceSteps: {
    title: string;
    description: string;
    metricLabel: string;
    metricValue: string;
    status: 'neutral' | 'flag' | 'verified';
  }[];
  comparableSuppliers: {
    name: string;
    unitPrice: string;
    variance: string;
    reliability: string;
    isApproved: boolean;
  }[];
}

export interface SupplierMetric {
  id: string;
  name: string;
  code: string;
  category: string;
  avgUnitPrice: number;
  benchmarkDelta: number;
  deliveryReliability: number;
  qualityScore: number;
  historicalPurchases: number;
  totalSpend: number;
  leakageExposure: number;
  risk: RiskLevel;
  contractExpiry: string;
  preferredStatus: boolean;
}

export interface ScenarioParams {
  supplier: string;
  currentUnitPrice: number;
  alternativeSupplier: string;
  alternativePrice: number;
  quantity: number;
  expectedDemandMultiplier: number;
}
