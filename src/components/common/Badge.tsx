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

  let bgClass = 'bg-[#FAFAF8] text-[#5E5E5A] border-[#E8E8E3]';
  let dotClass = 'bg-[#8A8A84]';

  if (v === 'HIGH' || v === 'CRITICAL' || v === 'WARNING') {
    bgClass = 'bg-[#D96B4A]/10 text-[#D96B4A] border-[#D96B4A]/25';
    dotClass = 'bg-[#D96B4A]';
  } else if (v === 'MEDIUM') {
    bgClass = 'bg-[#B6A35A]/10 text-[#B6A35A] border-[#B6A35A]/25';
    dotClass = 'bg-[#B6A35A]';
  } else if (v === 'LOW' || v === 'SUCCESS' || v === 'AUDITED' || v === 'VERIFIED') {
    bgClass = 'bg-[#73C69A]/10 text-[#111111] border-[#73C69A]/25';
    dotClass = 'bg-[#73C69A]';
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

