import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { SupplierLeakageItem, ProductLeakageItem } from './analyticsUtils';
import { ProcurementChartTooltip } from './ProcurementChartTooltip';
import { formatCompactINR, formatINR } from '../../../utils/formatters';

interface SupplierAndProductLeakageProps {
  suppliers: SupplierLeakageItem[];
  products: ProductLeakageItem[];
  selectedSupplier?: string | null;
  selectedProduct?: string | null;
  onSelectSupplier?: (supplier: string) => void;
  onSelectProduct?: (product: string) => void;
}

export const SupplierAndProductLeakageCharts: React.FC<SupplierAndProductLeakageProps> = ({
  suppliers,
  products,
  selectedSupplier,
  selectedProduct,
  onSelectSupplier,
  onSelectProduct,
}) => {
  const topSuppliers = suppliers.slice(0, 8);
  const topProducts = products.slice(0, 8);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* GRAPH 2: Potential Leakage by Supplier */}
      <div className="bg-[#F3F3F1] rounded-[24px] border border-[#151515]/10 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#151515]/10">
          <div>
            <span className="text-[10px] uppercase font-semibold text-[#151515]/50 tracking-wider block">
              Graph 2 · Vendor Exposure
            </span>
            <h3 className="text-base sm:text-lg font-medium text-[#151515]">
              Potential Leakage by Supplier
            </h3>
            <p className="text-xs text-[#151515]/60">
              Aggregated financial leakage ranked by vendor entity.
            </p>
          </div>
          <span className="text-[11px] font-mono text-[#B8A47A] bg-[#B8A47A]/10 px-2.5 py-1 rounded-full border border-[#B8A47A]/30">
            Top {topSuppliers.length} Vendors
          </span>
        </div>

        {topSuppliers.length === 0 ? (
          <div className="py-16 text-center text-xs text-[#151515]/50">
            No supplier leakage identified for current filter.
          </div>
        ) : (
          <div className="h-72 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={topSuppliers}
                margin={{ top: 8, right: 24, left: 16, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(21,21,21,0.08)" horizontal={false} />
                <XAxis
                  type="number"
                  stroke="rgba(21,21,21,0.4)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => formatCompactINR(v)}
                />
                <YAxis
                  type="category"
                  dataKey="supplier"
                  stroke="rgba(21,21,21,0.4)"
                  fontSize={10}
                  tickLine={false}
                  width={110}
                  tick={{ fill: '#151515' }}
                  tickFormatter={(val) => (val.length > 14 ? `${val.substring(0, 13)}…` : val)}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || payload.length === 0) return null;
                    const item = payload[0].payload as SupplierLeakageItem;
                    return (
                      <ProcurementChartTooltip
                        active={active}
                        title={item.supplier}
                        items={[
                          { label: 'Potential Leakage', value: item.potentialLeakage, isCurrency: true, color: '#B8A47A' },
                          { label: 'Total Spend', value: item.totalSpend, isCurrency: true, color: '#151515' },
                          { label: 'Transactions', value: `${item.transactionCount} POs` },
                          { label: 'Avg Variance', value: `+${item.avgVariance.toFixed(2)}%`, color: '#B8A47A' },
                        ]}
                      />
                    );
                  }}
                />
                <Bar
                  dataKey="potentialLeakage"
                  name="Potential Leakage"
                  fill="#B8A47A"
                  radius={[0, 4, 4, 0]}
                  onClick={(entry: any) => onSelectSupplier?.(entry?.supplier || entry?.payload?.supplier)}
                  className="cursor-pointer"
                >
                  {topSuppliers.map((entry, index) => {
                    const isSelected = selectedSupplier === entry.supplier;
                    return (
                      <Cell
                        key={`supp-${index}`}
                        fill="#B8A47A"
                        opacity={selectedSupplier && !isSelected ? 0.35 : 1}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-[#151515]/50 font-mono pt-1">
          <span>Click any supplier to isolate line items</span>
          <span>{suppliers.length} active suppliers</span>
        </div>
      </div>

      {/* GRAPH 3: Products with Highest Potential Leakage */}
      <div className="bg-[#F3F3F1] rounded-[24px] border border-[#151515]/10 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#151515]/10">
          <div>
            <span className="text-[10px] uppercase font-semibold text-[#151515]/50 tracking-wider block">
              Graph 3 · SKU Concentration
            </span>
            <h3 className="text-base sm:text-lg font-medium text-[#151515]">
              Products with Highest Leakage
            </h3>
            <p className="text-xs text-[#151515]/60">
              Canonical cumulative financial leakage aggregated by product SKU.
            </p>
          </div>
          <span className="text-[11px] font-mono text-[#151515] bg-[#151515]/5 px-2.5 py-1 rounded-full border border-[#151515]/10">
            Top {topProducts.length} Items
          </span>
        </div>

        {topProducts.length === 0 ? (
          <div className="py-16 text-center text-xs text-[#151515]/50">
            No product leakage identified for current filter.
          </div>
        ) : (
          <div className="h-72 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={topProducts}
                margin={{ top: 8, right: 24, left: 16, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(21,21,21,0.08)" horizontal={false} />
                <XAxis
                  type="number"
                  stroke="rgba(21,21,21,0.4)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => formatCompactINR(v)}
                />
                <YAxis
                  type="category"
                  dataKey="product"
                  stroke="rgba(21,21,21,0.4)"
                  fontSize={10}
                  tickLine={false}
                  width={110}
                  tick={{ fill: '#151515' }}
                  tickFormatter={(val) => (val.length > 14 ? `${val.substring(0, 13)}…` : val)}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || payload.length === 0) return null;
                    const item = payload[0].payload as ProductLeakageItem;
                    return (
                      <ProcurementChartTooltip
                        active={active}
                        title={item.product}
                        items={[
                          { label: 'Potential Leakage', value: item.potentialLeakage, isCurrency: true, color: '#B8A47A' },
                          { label: 'Total Spend', value: item.totalSpend, isCurrency: true, color: '#151515' },
                          { label: 'Transactions', value: `${item.transactionCount} POs` },
                          { label: 'Avg Variance', value: `+${item.avgVariance.toFixed(2)}%`, color: '#B8A47A' },
                        ]}
                      />
                    );
                  }}
                />
                <Bar
                  dataKey="potentialLeakage"
                  name="Potential Leakage"
                  fill="#151515"
                  radius={[0, 4, 4, 0]}
                  onClick={(entry: any) => onSelectProduct?.(entry?.product || entry?.payload?.product)}
                  className="cursor-pointer"
                >
                  {topProducts.map((entry, index) => {
                    const isSelected = selectedProduct === entry.product;
                    return (
                      <Cell
                        key={`prod-${index}`}
                        fill="#151515"
                        opacity={selectedProduct && !isSelected ? 0.35 : 1}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-[#151515]/50 font-mono pt-1">
          <span>Click any product bar to filter table records</span>
          <span>{products.length} audited commodities</span>
        </div>
      </div>
    </div>
  );
};
