import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  theme?: 'dark' | 'light';
  showSubtitle?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  theme = 'light',
  showSubtitle = false,
}) => {
  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  const isDark = theme === 'dark';

  return (
    <div className="flex items-center gap-2.5 select-none group cursor-pointer">
      {/* Geometric SpendIntel Abstract 'S' & Flow Mark */}
      <div
        className={`${iconSizes[size]} rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-105 ${
          isDark ? 'bg-white text-[#151515]' : 'bg-[#151515] text-[#F3F3F1]'
        } p-1.5 shadow-sm`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Top flow node */}
          <path
            d="M5 7C5 5.34315 6.34315 4 8 4H18C18.5523 4 19 4.44772 19 5V8C19 9.65685 17.6569 11 16 11H8C6.34315 11 5 12.3431 5 14V19C5 19.5523 5.44772 20 6 20H16C17.6569 20 19 18.6569 19 17"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Champagne intelligence dot */}
          <circle cx="16.5" cy="17" r="2" fill="#B8A47A" />
        </svg>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center tracking-tight">
          <span
            className={`font-sans font-bold ${textSizes[size]} ${
              isDark ? 'text-white' : 'text-[#151515]'
            }`}
          >
            Spend
          </span>
          <span
            className={`font-sans font-medium ${textSizes[size]} ${
              isDark ? 'text-[#F3F3F1]/60' : 'text-[#151515]/65'
            }`}
          >
            Intel
          </span>
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#B8A47A] ml-1 mb-1 self-center" />
        </div>
        {showSubtitle && (
          <span
            className={`text-xs tracking-wide uppercase font-sans font-medium -mt-0.5 ${
              isDark ? 'text-[#F3F3F1]/50' : 'text-[#151515]/50'
            }`}
          >
            Procurement Intelligence
          </span>
        )}
      </div>
    </div>
  );
};
