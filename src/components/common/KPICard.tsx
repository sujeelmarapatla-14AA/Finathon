import React from 'react';

interface KPICardProps {
  label: string;
  value: string | number;
  subtext?: string;
  comparison?: string;
  highlight?: 'terracotta' | 'forest' | 'gold' | 'default';
}

export const KPICard: React.FC<KPICardProps> = ({
  label,
  value,
  subtext,
  comparison,
  highlight = 'default',
}) => {
  const highlightStyles = {
    terracotta: 'text-brand-terracotta',
    forest: 'text-brand-forest-bright',
    gold: 'text-brand-gold',
    default: 'text-text-primary',
  };

  return (
    <div className="flex flex-col justify-between py-6 px-6 transition-colors duration-150 hover:bg-dark-elevated/40">
      <div>
        <span className="text-[10px] uppercase font-sans font-semibold tracking-micro text-text-muted block mb-2">
          {label}
        </span>
        <div className="flex items-baseline gap-2">
          <span className={`font-serif text-3xl sm:text-4xl tracking-tight font-normal tnum ${highlightStyles[highlight]}`}>
            {value}
          </span>
        </div>
      </div>

      <div className="mt-3">
        {comparison && (
          <span className={`text-[11px] font-sans font-medium flex items-center gap-1 ${
            highlight === 'terracotta' ? 'text-brand-terracotta-soft' : 'text-brand-forest-bright'
          }`}>
            {comparison}
          </span>
        )}
        {subtext && (
          <p className="text-xs font-sans text-text-muted mt-1 leading-relaxed">
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
};
