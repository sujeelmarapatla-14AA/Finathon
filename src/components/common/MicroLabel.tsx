import React from 'react';

interface MicroLabelProps {
  children: React.ReactNode;
  variant?: 'forest' | 'terracotta' | 'gold' | 'muted' | 'ink' | 'cream';
  className?: string;
  hasDot?: boolean;
}

export const MicroLabel: React.FC<MicroLabelProps> = ({
  children,
  variant = 'muted',
  className = '',
  hasDot = false,
}) => {
  const variantStyles = {
    forest: 'text-forest-600',
    terracotta: 'text-terracotta-600',
    gold: 'text-gold-600',
    muted: 'text-muted',
    ink: 'text-ink-950',
    cream: 'text-cream-200',
  };

  const dotStyles = {
    forest: 'bg-forest-500',
    terracotta: 'bg-terracotta-500',
    gold: 'bg-gold-500',
    muted: 'bg-muted',
    ink: 'bg-ink-950',
    cream: 'bg-cream-200',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-sans text-[12px] uppercase font-semibold tracking-wider ${variantStyles[variant]} ${className}`}
    >
      {hasDot && (
        <span className={`w-2 h-2 rounded-full ${dotStyles[variant]} animate-pulse`} />
      )}
      {children}
    </span>
  );
};
