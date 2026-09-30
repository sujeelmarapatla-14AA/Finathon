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
      <div className="bg-white rounded-[24px] border border-[#E8E8E3] p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#F0F0EB]">
          <div>
            <span className="text-[10px] uppercase font-semibold text-[#8A8A84] tracking-wider block">
              Graph 2 · Vendor Exposure
            </span>
            <h3 className="text-base sm:text-lg font-medium text-[#111111]">
              Potential Leakage by Supplier
            </h3>
            <p className="text-xs text-[#5E5E5A]">
              Aggregated financial leakage ranked by vendor entity.
            </p>
          </div>
          <span className="text-[11px] font-mono text-[#D96B4A] bg-[#D96B4A]/10 px-2.5 py-1 rounded-full border border-[#D96B4A]/20">
            Top {topSuppliers.length} Vendors
          </span>
        </div>

        {topSuppliers.length === 0 ? (
          <div className="py-16 text-center text-xs text-[#8A8A84]">
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
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0EB" horizontal={false} />
                <XAxis
                  type="number"
                  stroke="#8A8A84"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => formatCompactINR(v)}
                />
                <YAxis
                  type="category"
                  dataKey="supplier"
                  stroke="#8A8A84"
                  fontSize={10}
                  tickLine={false}
                  width={110}
                  tick={{ fill: '#111111' }}
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
                          { label: 'Potential Leakage', value: item.potentialLeakage, isCurrency: true, color: '#D96B4A' },
                          { label: 'Total Spend', value: item.totalSpend, isCurrency: true, color: '#111111' },
                          { label: 'Transactions', value: `${item.transactionCount} POs` },
                          { label: 'Avg Variance', value: `+${item.avgVariance.toFixed(2)}%`, color: '#D96B4A' },
                        ]}
                      />
                    );
                  }}
                />
                <Bar
                  dataKey="potentialLeakage"
                  name="Potential Leakage"
                  fill="#D96B4A"
                  radius={[0, 4, 4, 0]}
                  onClick={(entry: any) => onSelectSupplier?.(entry?.supplier || entry?.payload?.supplier)}
                  className="cursor-pointer"
                >
                  {topSuppliers.map((entry, index) => {
                    const isSelected = selectedSupplier === entry.supplier;
                    return (
                      <Cell
                        key={`supp-${index}`}
                        fill={isSelected ? '#5E81AC' : '#D96B4A'}
                        opacity={selectedSupplier && !isSelected ? 0.35 : 1}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-[#8A8A84] font-mono pt-1">
          <span>Click any supplier to isolate line items</span>
          <span>{suppliers.length} active suppliers</span>
        </div>
      </div>

      {/* GRAPH 3: Products with Highest Potential Leakage */}
      <div className="bg-white rounded-[24px] border border-[#E8E8E3] p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#F0F0EB]">
          <div>
            <span className="text-[10px] uppercase font-semibold text-[#8A8A84] tracking-wider block">
              Graph 3 · SKU Concentration
            </span>
            <h3 className="text-base sm:text-lg font-medium text-[#111111]">
              Products with Highest Leakage
            </h3>
            <p className="text-xs text-[#5E5E5A]">
              Canonical cumulative financial leakage aggregated by product SKU.
            </p>
          </div>
          <span className="text-[11px] font-mono text-[#111111] bg-[#FAFAF8] px-2.5 py-1 rounded-full border border-[#E8E8E3]">
            Top {topProducts.length} Items
          </span>
        </div>

        {topProducts.length === 0 ? (
          <div className="py-16 text-center text-xs text-[#8A8A84]">
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
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0EB" horizontal={false} />
                <XAxis
                  type="number"
                  stroke="#8A8A84"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => formatCompactINR(v)}
                />
                <YAxis
                  type="category"
                  dataKey="product"
                  stroke="#8A8A84"
                  fontSize={10}
                  tickLine={false}
                  width={110}
                  tick={{ fill: '#111111' }}
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
                          { label: 'Potential Leakage', value: item.potentialLeakage, isCurrency: true, color: '#D96B4A' },
                          { label: 'Total Spend', value: item.totalSpend, isCurrency: true, color: '#111111' },
                          { label: 'Transactions', value: `${item.transactionCount} POs` },
                          { label: 'Avg Variance', value: `+${item.avgVariance.toFixed(2)}%`, color: '#D96B4A' },
                        ]}
                      />
                    );
                  }}
                />
                <Bar
                  dataKey="potentialLeakage"
                  name="Potential Leakage"
                  fill="#111111"
                  radius={[0, 4, 4, 0]}
                  onClick={(entry: any) => onSelectProduct?.(entry?.product || entry?.payload?.product)}
                  className="cursor-pointer"
                >
                  {topProducts.map((entry, index) => {
                    const isSelected = selectedProduct === entry.product;
                    return (
                      <Cell
                        key={`prod-${index}`}
                        fill={isSelected ? '#5E81AC' : '#111111'}
                        opacity={selectedProduct && !isSelected ? 0.35 : 1}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-[#8A8A84] font-mono pt-1">
          <span>Click any product bar to filter table records</span>
          <span>{products.length} audited commodities</span>
        </div>
      </div>
    </div>
  );
};
