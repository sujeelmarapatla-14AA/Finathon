import React from 'react';

export interface BrandList {
  image: string;
  lightimg?: string;
  name: string;
}

interface BrandSliderProps {
  brandList?: BrandList[];
}

export default function BrandSlider({ brandList = [] }: BrandSliderProps) {
  if (brandList.length === 0) return null;
  return (
    <section className="py-12 border-t border-neutral-100 bg-neutral-50/50">
      <div className="max-w-6xl mx-auto px-6">
        <p className="text-xs uppercase tracking-wider text-neutral-400 font-semibold text-center mb-8">
          Powering modern enterprise teams
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-70 grayscale hover:grayscale-0 transition-all">
          {brandList.map((brand, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="text-sm font-semibold text-neutral-700 font-mono tracking-tight">
                {brand.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
