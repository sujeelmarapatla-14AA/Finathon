import React from 'react';
import { RiskLevel } from '../../types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'forest' | 'terracotta' | 'gold' | 'ink' | 'neutral' | RiskLevel;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'sm',
  className = '',
}) => {
  const sizeStyles = {
    xs: 'text-[9px] px-1.5 py-0.5 tracking-wider',
    sm: 'text-[10px] px-2 py-0.5 tracking-wide',
    md: 'text-xs px-2.5 py-1 tracking-normal',
  };

  const variantStyles: Record<string, string> = {
    CRITICAL: 'bg-terracotta-50 text-terracotta-700 border border-terracotta-200/80',
    HIGH: 'bg-terracotta-50/70 text-terracotta-600 border border-terracotta-200/60',
    MEDIUM: 'bg-gold-50 text-gold-700 border border-gold-200',
    LOW: 'bg-forest-50 text-forest-700 border border-forest-200',
    forest: 'bg-forest-50 text-forest-700 border border-forest-200',
    terracotta: 'bg-terracotta-50 text-terracotta-600 border border-terracotta-200',
    gold: 'bg-gold-50 text-gold-700 border border-gold-200',
    ink: 'bg-ink-950 text-cream-100 border border-ink-800',
    neutral: 'bg-cream-200/60 text-ink-950 border border-border',
  };

  return (
    <span
      className={`inline-flex items-center justify-center font-sans font-medium uppercase rounded-[3px] select-none transition-colors ${sizeStyles[size]} ${
        variantStyles[variant] || variantStyles.neutral
      } ${className}`}
    >
      {children}
    </span>
  );
};
