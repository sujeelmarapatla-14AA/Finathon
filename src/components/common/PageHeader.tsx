import React from 'react';

export interface PageHeaderProps {
  label?: string;
  title: string;
  description?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  label,
  title,
  description,
  subtitle,
  actions,
  badge,
  className = '',
}) => {
  const desc = description || subtitle;

  return (
    <div
      className={`flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 ${className}`}
    >
      <div className="space-y-2 max-w-2xl">
        {label && (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAFAF8] border border-[#E8E8E3] text-[11px] font-sans font-medium text-[#5E5E5A] mb-1">
            <span className="w-2 h-2 rounded-full bg-[#73C69A]" />
            <span>{label}</span>
          </div>
        )}

        <div className="flex items-center gap-3">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-sans font-medium text-[#111111] tracking-tight">
            {title}
          </h1>
          {badge && <div className="shrink-0">{badge}</div>}
        </div>

        {desc && (
          <p className="text-sm sm:text-base text-[#5E5E5A] font-sans leading-relaxed">
            {desc}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
};

