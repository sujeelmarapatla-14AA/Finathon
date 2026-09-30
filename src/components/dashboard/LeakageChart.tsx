import React, { useState } from 'react';
import { LEAKAGE_CATEGORIES_DATA } from '../../data/mockData';
import { ArrowUpRight } from 'lucide-react';

interface LeakageChartProps {
  onSelectCategory?: (category: string) => void;
}

export const LeakageChart: React.FC<LeakageChartProps> = ({ onSelectCategory }) => {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  // Categories matching Section 11 exactly
  const categories = LEAKAGE_CATEGORIES_DATA.filter(c => c.amountRaw > 0);

  return (
    <div className="bg-transparent border border-border-default rounded-[12px] p-6 sm:p-8 flex flex-col justify-between h-full">
      {/* Editorial Heading & Subtitle */}
      <div>
        <div className="flex items-start justify-between pb-6 border-b border-border-subtle gap-4">
          <div>
            <span className="text-[10px] uppercase font-sans font-semibold tracking-micro text-brand-terracotta block mb-1">
              02 / DETECTION
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl text-text-primary font-normal">
              LEAKAGE OVERVIEW
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary mt-1 font-sans">
              Potential financial exposure by category
            </p>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[10px] uppercase tracking-micro text-text-muted block">Total Exposure</span>
            <span className="font-serif text-2xl sm:text-3xl text-brand-terracotta font-normal tnum">
              ₹31.6L
            </span>
          </div>
        </div>

        {/* Horizontal Proportional Segment Strip */}
        <div className="my-6">
          <div className="h-2 w-full rounded-[2px] overflow-hidden flex bg-dark-elevated">
            {categories.map((cat) => (
              <div
                key={cat.category}
                style={{
                  width: `${cat.percentage}%`,
                  backgroundColor: cat.color,
                }}
                className="h-full transition-opacity hover:opacity-80 cursor-pointer"
                title={`${cat.category}: ${cat.amount} (${cat.percentage}%)`}
                onClick={() => onSelectCategory?.(cat.category)}
              />
            ))}
          </div>
        </div>

        {/* Horizontal Bar Chart (Section 11) */}
        <div className="space-y-5">
          {categories.map((cat) => {
            const isHovered = hoveredCategory === cat.category;

            return (
              <div
                key={cat.category}
                onMouseEnter={() => setHoveredCategory(cat.category)}
                onMouseLeave={() => setHoveredCategory(null)}
                onClick={() => onSelectCategory?.(cat.category)}
                className="group cursor-pointer select-none"
              >
                <div className="flex items-center justify-between text-xs font-sans mb-1.5">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-2 h-2 rounded-full shrink-0" 
                      style={{ backgroundColor: cat.color }} 
                    />
                    <span className="font-medium text-text-primary group-hover:text-brand-forest-bright transition-colors">
                      {cat.category}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-3">
                    <span className="font-mono text-text-muted text-[11px] tnum">
                      {cat.percentage}%
                    </span>
                    <span className="font-serif text-base sm:text-lg font-normal text-text-primary group-hover:text-brand-terracotta transition-colors tnum">
                      {cat.amount}
                    </span>
                  </div>
                </div>

                {/* Bar */}
                <div className="w-full bg-dark-card h-2 rounded-[2px] overflow-hidden">
                  <div
                    className="h-full rounded-[2px] transition-all duration-500 ease-out"
                    style={{
                      width: `${cat.percentage}%`,
                      backgroundColor: cat.color,
                      opacity: isHovered ? 1 : 0.88,
                    }}
                  />
                </div>

                <p className="text-[11px] text-text-muted mt-1 leading-normal font-sans">
                  {cat.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Clean Bottom Legend: Terracotta = leakage, Forest = recovered/saved, Gold = opportunity */}
      <div className="mt-8 pt-4 border-t border-border-subtle flex flex-wrap items-center justify-between gap-3 text-xs text-text-muted font-sans">
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-brand-terracotta" />
            <span>Terracotta: Leakage</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-brand-forest" />
            <span>Forest: Recovered / Saved</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-brand-gold" />
            <span>Gold: Opportunity</span>
          </span>
        </div>

        <button 
          onClick={() => onSelectCategory?.('Price Anomalies')}
          className="inline-flex items-center gap-1 text-brand-forest-bright hover:underline font-medium text-xs"
        >
          <span>Examine All Vectors</span>
          <ArrowUpRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
