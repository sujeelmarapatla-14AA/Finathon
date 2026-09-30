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

export type DataSource = 'demo' | 'upload' | 'nova' | 'manual';

export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type LeakageCategory = 
  | 'Price Anomalies' 
  | 'Missed Discounts' 
  | 'Supplier Fragmentation' 
  | 'Duplicate Purchases' 
  | 'Contract Variance'
  | 'Unusual Patterns';

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

export interface DashboardData {
  source?: DataSource | string;
  source_label?: string;
  transactions: number;
  total_spend: number;
  potential_leakage: number;
  leakage_rate: number;
  price_anomalies: any[];
  duplicates: any[];
  fragmentation: any[];
  contract_findings?: any[];
  discount_findings?: any[];
  pattern_findings?: any[];
  normalized_supplier_count?: number;
  normalized_product_count?: number;
  suppliers: number;
  products: number;
  kpis?: {
    total_spend: number;
    potential_leakage: number;
    leakage_rate: number;
    transactions: number;
    suppliers: number;
    products: number;
  };
  leakage_breakdown?: {
    type: string;
    count: number;
    amount: number;
  }[];
  priority_findings?: any[];
  summary?: {
    total_findings: number;
    high_risk_findings: number;
    medium_risk_findings: number;
    low_risk_findings: number;
  };
}

export interface ApiSupplierItem {
  supplier: string;
  normalized_supplier?: string;
  transaction_count: number;
  total_spend: number;
  average_unit_price: number;
  total_quantity: number;
  anomaly_count: number;
  potential_leakage: number;
  risk: 'HIGH' | 'MEDIUM' | 'LOW';
  products_supplied?: string[];
  contracted_supplier?: boolean;
  off_contract_count?: number;
  missed_discount_amount?: number;
}

export interface ApiInvestigationData {
  finding: {
    transaction_id: string;
    product_id?: string;
    product_name: string;
    product?: string;
    supplier: string;
    quantity: number;
    actual_price: number;
    benchmark_price: number;
    variance_percent: number;
    potential_leakage: number;
    type: string;
    risk: string;
    department?: string;
    payment_terms?: string;
    contract_discount?: number;
  };
  summary?: string;
  evidence: {
    step: number;
    title: string;
    description: string;
    value: string;
  }[];
  field_evidence?: {
    source: string;
    field: string;
    value: any;
    relationship: string;
  }[];
  analyst_summary: string;
  root_cause?: string;
  financial_impact?: number;
  recommended_actions?: string[];
  ai_analysis?: {
    summary: string;
    root_cause: string;
    evidence_points: string[];
    recommended_actions: string[];
  };
}

export type UserRole = 'admin' | 'procurement_lead' | 'procurement_analyst';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  is_active?: boolean;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface SignupResponse {
  success: boolean;
  message: string;
}


