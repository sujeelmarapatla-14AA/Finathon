import React from 'react';
import { RiskLevel } from '../../types';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'HIGH' | 'CRITICAL' | 'MEDIUM' | 'LOW' | 'high' | 'critical' | 'medium' | 'low' | 'neutral' | 'success' | 'warning' | RiskLevel | string;
  size?: 'sm' | 'md' | string;
  showDot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  showDot = true,
  className = '',
}) => {
  const rawVariant = typeof variant === 'string' ? variant.toUpperCase() : '';
  const childStr = typeof children === 'string' ? children.toUpperCase() : '';
  const v = ['HIGH', 'CRITICAL', 'MEDIUM', 'LOW'].includes(childStr) ? childStr : rawVariant;

  let bgClass = 'bg-[#151515]/5 text-[#151515]/70 border-[#151515]/10';
  let dotClass = 'bg-[#151515]/40';

  if (v === 'HIGH' || v === 'CRITICAL' || v === 'WARNING' || v === 'ACTIONABLE') {
    bgClass = 'bg-[#B8A47A]/20 text-[#151515] border-[#B8A47A]/40 font-semibold';
    dotClass = 'bg-[#B8A47A]';
  } else if (v === 'MEDIUM') {
    bgClass = 'bg-[#B8A47A]/10 text-[#151515] border-[#B8A47A]/25';
    dotClass = 'bg-[#B8A47A]';
  } else if (v === 'LOW' || v === 'SUCCESS' || v === 'AUDITED' || v === 'VERIFIED') {
    bgClass = 'bg-[#151515]/5 text-[#151515] border-[#151515]/15';
    dotClass = 'bg-[#151515]/60';
  }

  const heightClass = size === 'sm' ? 'min-h-[22px] py-0.5 px-2.5 text-[11.5px]' : 'min-h-[26px] py-1 px-3 text-[12.5px]';

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${heightClass} rounded-full font-sans font-semibold uppercase tracking-wider border select-none whitespace-nowrap ${bgClass} ${className}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClass}`} />}
      <span>{children}</span>
    </span>
  );
};
