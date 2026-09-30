import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Logo: React.FC<LogoProps> = ({ 
  className = '', 
  size = 'md'
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-8 h-8',
    lg: 'w-9 h-9',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Abstract shield + magnifying glass + financial arrow */}
      <div className={`relative flex items-center justify-center rounded-[6px] ${iconSizes[size]} bg-dark-secondary border border-border-default shrink-0`}>
        <svg 
          viewBox="0 0 32 32" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5 text-text-primary"
        >
          {/* Subtle shield frame */}
          <path 
            d="M7 6H25C25 18 16 26 16 26C16 26 7 18 7 6Z" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeOpacity="0.85"
          />
          {/* Magnifying lens focus circle */}
          <circle 
            cx="15" 
            cy="14" 
            r="4.5" 
            stroke="#2A6849" 
            strokeWidth="1.75" 
          />
          {/* Financial recovery upward arrow emerging through lens */}
          <path 
            d="M18.5 17.5L22 21" 
            stroke="#C8541E" 
            strokeWidth="2" 
            strokeLinecap="round" 
          />
          <path 
            d="M13 14.5L16 11.5L18 13.5" 
            stroke="#F5F1E8" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
        </svg>
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className={`font-serif tracking-tight font-medium ${textSizes[size]} text-text-primary`}>
          LeakGuard
        </span>
        <span className="font-sans text-[10px] uppercase tracking-micro font-semibold px-1.5 py-0.5 rounded-[4px] bg-brand-forest/20 text-brand-forest-bright border border-brand-forest/40">
          AI
        </span>
      </div>
    </div>
  );
};
