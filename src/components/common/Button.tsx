import React from 'react';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'dark-primary'
  | 'dark-secondary'
  | 'ghost'
  | 'accent';

export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'right',
  children,
  className = '',
  disabled,
  ...props
}) => {
  // Height & padding system (Section 4 & 5: 44px default, 36px small, 48px large)
  const sizeStyles: Record<ButtonSize, string> = {
    sm: 'h-9 px-3.5 text-xs rounded-full gap-1.5',
    md: 'h-11 px-5 text-xs font-semibold uppercase tracking-wider rounded-full gap-2',
    lg: 'h-12 px-6 text-xs font-semibold uppercase tracking-wider rounded-full gap-2',
    icon: 'w-11 h-11 p-0 rounded-full flex items-center justify-center shrink-0',
    'icon-sm': 'w-9 h-9 p-0 rounded-full flex items-center justify-center shrink-0',
  };

  const variantStyles: Record<ButtonVariant, string> = {
    primary:
      'bg-[#0A0A0A] hover:bg-black text-white shadow-sm border border-transparent hover:-translate-y-0.5',
    secondary:
      'bg-white hover:bg-[#FAFAF8] border border-[#E8E8E3] hover:border-[#DCDCD7] text-[#111111] hover:-translate-y-0.5',
    'dark-primary':
      'bg-white hover:bg-[#FAFAF8] text-[#0A0A0A] shadow-md border border-transparent hover:-translate-y-0.5',
    'dark-secondary':
      'bg-white/10 hover:bg-white/15 border border-white/20 text-white hover:-translate-y-0.5',
    ghost:
      'bg-transparent hover:bg-[#F5F5F2] text-[#5E5E5A] hover:text-[#111111]',
    accent:
      'bg-[#73C69A] hover:bg-[#85d3aa] text-[#0A0A0A] font-semibold shadow-sm border border-transparent hover:-translate-y-0.5',
  };

  return (
    <button
      className={`inline-flex items-center justify-center font-sans font-medium whitespace-nowrap transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:transform-none ${
        sizeStyles[size]
      } ${variantStyles[variant]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && iconPosition === 'left' && (
        <span className="shrink-0 flex items-center justify-center">{icon}</span>
      )}
      {children && <span>{children}</span>}
      {icon && iconPosition === 'right' && (
        <span className="shrink-0 flex items-center justify-center">{icon}</span>
      )}
    </button>
  );
};
