import React from 'react';

interface KPICardProps {
  label: string;
  value: string | number;
  subtext?: string;
  comparison?: string;
  highlight?: 'terracotta' | 'forest' | 'gold' | 'default' | 'champagne';
}

export const KPICard: React.FC<KPICardProps> = ({
  label,
  value,
  subtext,
  comparison,
  highlight = 'default',
}) => {
  const highlightStyles = {
    terracotta: 'text-[#B8A47A]',
    forest: 'text-[#151515]',
    gold: 'text-[#B8A47A]',
    champagne: 'text-[#B8A47A]',
    default: 'text-[#151515]',
  };

  return (
    <div className="flex flex-col justify-between py-6 px-6 transition-colors duration-150 hover:bg-[#151515]/5 rounded-2xl">
      <div>
        <span className="text-[11px] uppercase font-sans font-semibold tracking-wider text-[#151515]/60 block mb-2">
          {label}
        </span>
        <div className="flex items-baseline gap-2">
          <span className={`font-sans text-3xl sm:text-4xl tracking-tight font-semibold tnum ${highlightStyles[highlight]}`}>
            {value}
          </span>
        </div>
      </div>

      <div className="mt-3">
        {comparison && (
          <span className="text-[12px] font-sans font-medium flex items-center gap-1 text-[#B8A47A]">
            {comparison}
          </span>
        )}
        {subtext && (
          <p className="text-xs font-sans text-[#151515]/60 mt-1 leading-relaxed">
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
};
