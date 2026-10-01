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
  const sizeStyles: Record<ButtonSize, string> = {
    sm: 'h-9 px-3.5 text-xs rounded-full gap-1.5',
    md: 'h-11 px-5 text-xs font-semibold uppercase tracking-wider rounded-full gap-2',
    lg: 'h-12 px-6 text-xs font-semibold uppercase tracking-wider rounded-full gap-2',
    icon: 'w-11 h-11 p-0 rounded-full flex items-center justify-center shrink-0',
    'icon-sm': 'w-9 h-9 p-0 rounded-full flex items-center justify-center shrink-0',
  };

  const variantStyles: Record<ButtonVariant, string> = {
    primary:
      'bg-[#151515] hover:bg-[#151515]/90 text-[#F3F3F1] shadow-sm border border-[#151515] hover:-translate-y-0.5',
    secondary:
      'bg-white hover:bg-[#F3F3F1] border border-[#151515]/15 text-[#151515] hover:-translate-y-0.5',
    'dark-primary':
      'bg-[#B8A47A] hover:bg-[#B8A47A]/90 text-[#151515] shadow-md border border-[#B8A47A] hover:-translate-y-0.5',
    'dark-secondary':
      'bg-[#F3F3F1]/10 hover:bg-[#F3F3F1]/15 border border-[#F3F3F1]/20 text-[#F3F3F1] hover:-translate-y-0.5',
    ghost:
      'bg-transparent hover:bg-[#151515]/5 text-[#151515]/70 hover:text-[#151515]',
    accent:
      'bg-[#B8A47A] hover:bg-[#B8A47A]/90 text-[#151515] font-semibold shadow-sm border border-[#B8A47A] hover:-translate-y-0.5',
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
