export type TabType = 
  | 'overview' 
  | 'table' 
  | 'leakage' 
  | 'product-intelligence'
  | 'suppliers' 
  | 'investigation' 
  | 'simulator' 
  | 'reports' 
  | 'history'
  | 'upload'
  | 'settings';

export type DataSource = 'demo' | 'upload' | 'nova' | 'manual';

export type DatasetSourceType = 'CSV' | 'EXCEL' | 'NOVA_API' | 'MANUAL';

export interface UnifiedDatasetItem {
  id: string;
  name: string;
  source_type: DatasetSourceType;
  original_filename?: string | null;
  file_type?: string | null;
  source_reference?: string | null;
  file_size?: number;
  uploaded_at: string;
  updated_at: string;
  status: string;
  total_rows: number;
  unique_products: number;
  total_comparisons: number;
  analysis_version: string;
  total_spend: number;
  potential_leakage: number;
  leakage_rate: number;
  suppliers_count: number;
  summary_kpis?: Record<string, any>;
}

export interface DatasetRowItem {
  id: string;
  dataset_id: string;
  row_number: number;
  raw_data: Record<string, any>;
  product_name?: string;
  sku?: string;
  category?: string;
  brand?: string;
  model?: string;
  supplier?: string;
  price?: number;
  quantity?: number;
  normalized_product?: string;
  created_at: string;
}

export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type LeakageCategory = 
  | 'Price Anomalies' 
  | 'Missed Discounts' 
  | 'Supplier Fragmentation' 
  | 'Duplicate Purchases' 
  | 'Contract Variance'
  | 'Unusual Patterns'
  | 'Product Intelligence';

export interface ProductAttributeData {
  product_id: string;
  product_name: string;
  category: string;
  description: string;
  brand?: string | null;
  model?: string | null;
  specifications: Record<string, any>;
  material?: string | null;
  dimensions?: string | null;
  capacity?: string | null;
  weight?: string | null;
  pack_size?: string | null;
  pack_quantity?: number;
  unit_of_measure: string;
  quality_grade?: string | null;
  warranty?: string | null;
  rating?: number | null;
  review_count?: number | null;
  supplier: string;
  contract_status?: string | null;
  unit_price: number;
  benchmark_unit_price: number;
  normalized_unit_price: number;
}

export interface ProductSimilarityBreakdown {
  category: number;
  description: number;
  specifications: number;
  unit_pack_size: number;
  brand_model: number;
  quality: number;
  reviews: number;
}

export interface ProductComparisonItem {
  id: string;
  product_a: ProductAttributeData;
  product_b: ProductAttributeData;
  productA?: string;
  productB?: string;
  similarity_score: number;
  similarityScore?: number;
  classification: 'NEAR IDENTICAL' | 'HIGHLY COMPARABLE' | 'PARTIALLY COMPARABLE' | 'RELATED BUT DIFFERENT' | 'NOT COMPARABLE' | 'HIGHLY_COMPARABLE' | 'PARTIALLY_COMPARABLE' | 'DIFFERENT_SPECS' | 'INSUFFICIENT_DATA' | string;
  comparability?: string;
  comparability_tier: 'High' | 'Medium' | 'Low' | 'None' | string;
  matching_attributes: string[];
  matchingAttributes?: string[];
  different_attributes: string[];
  differentAttributes?: string[];
  unavailable_attributes: string[];
  unavailableAttributes?: string[];
  procurement_case: string;
  explanation: string;
  price_a: number;
  priceA?: number;
  price_b: number;
  priceB?: number;
  price_difference?: number;
  priceDifference?: number;
  normalized_price_a: number;
  normalized_price_b: number;
  scores_breakdown: ProductSimilarityBreakdown;
  is_equal_price_different_spec: boolean;
  equalPriceDifferentSpec?: boolean;
}

export interface ProductFindingItem {
  finding_id: string;
  type: 'PRODUCT_SIMILARITY' | 'SPECIFICATION_DIFFERENCE' | 'EQUAL_PRICE_DIFFERENT_SPECIFICATION' | 'PACK_SIZE_DIFFERENCE' | 'QUALITY_DIFFERENCE' | 'INSUFFICIENT_COMPARISON_DATA' | string;
  title: string;
  product_a: string;
  product_b: string;
  similarity_score: number;
  classification: string;
  price_a: number;
  price_b: number;
  matching_attributes: string[];
  different_attributes: string[];
  evidence: string[];
  explanation: string;
  confidence: string;
  risk: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface ProductComparableGroup {
  group_name: string;
  category: string;
  products_count: number;
  products: string[];
  avg_normalized_price: number;
}

export interface ProductIntelligenceKPIs {
  total_products: number;
  total_comparisons: number;
  highly_comparable_count: number;
  partially_comparable_count: number;
  different_specifications_count: number;
  equal_price_different_value_count: number;
  insufficient_data_count: number;
}

export interface ProductIntelligenceData {
  source?: DataSource | string;
  source_label?: string;
  file_id?: string;
  summary_kpis: ProductIntelligenceKPIs;
  comparisons: ProductComparisonItem[];
  findings: ProductFindingItem[];
  comparable_groups: ProductComparableGroup[];
}

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
  product_intelligence?: ProductIntelligenceData;
  product_similarity_findings?: ProductFindingItem[];
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


