import React from 'react';
import TechText from './TechText';

export interface DarkHeroProps {
  title?: string;
  subtitle?: string;
  ctaText?: string;
  showTechText?: boolean;
  techTextString?: string;
  onCtaClick?: () => void;
  onSignInClick?: () => void;
  onSignUpClick?: () => void;
}

export const DarkHero: React.FC<DarkHeroProps> = ({
  title = 'Give your big idea\nthe website it deserves',
  subtitle = 'Landing page kit template with React, Shadcn/ui and Tailwind that you can copy/paste into your project.',
  ctaText = 'Get started',
  showTechText = true,
  techTextString = 'React Bits',
  onCtaClick,
  onSignInClick,
  onSignUpClick,
}) => {
  return (
    <div className="relative min-h-screen bg-[#151515] text-[#F3F3F1] flex flex-col justify-between selection:bg-[#B8A47A]/30 selection:text-[#F3F3F1] overflow-hidden font-sans">
      {/* Top Navbar */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-xl tracking-tight text-[#F3F3F1]">Logo</span>
        </div>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm text-[#F3F3F1]/70">
          <a href="#getting-started" className="hover:text-[#F3F3F1] transition-colors duration-200">
            Getting started
          </a>
          <a href="#components" className="hover:text-[#F3F3F1] transition-colors duration-200">
            Components
          </a>
          <a href="#documentation" className="hover:text-[#F3F3F1] transition-colors duration-200">
            Documentation
          </a>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-5">
          <button
            onClick={onSignInClick}
            className="text-sm font-medium text-[#F3F3F1]/70 hover:text-[#F3F3F1] transition-colors"
          >
            Sign in
          </button>
          <button
            onClick={onSignUpClick}
            className="h-9 px-5 rounded-full bg-[#B8A47A] text-[#151515] text-sm font-semibold hover:bg-[#B8A47A]/90 active:scale-95 transition-all shadow-[0_0_15px_rgba(184,164,122,0.2)]"
          >
            Sign Up
          </button>
        </div>
      </header>

      {/* Main Hero Body */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 pt-12 pb-20 max-w-5xl mx-auto">
        {/* Big Editorial Headline */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[76px] font-semibold tracking-[-0.03em] leading-[1.08] text-[#F3F3F1] max-w-4xl mx-auto whitespace-pre-line">
          {title}
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-lg text-[#F3F3F1]/70 max-w-2xl mx-auto font-normal leading-relaxed">
          {subtitle}
        </p>

        {/* Get started Pill Button */}
        <div className="mt-10">
          <button
            onClick={onCtaClick}
            className="relative group px-8 py-3.5 rounded-xl bg-[#B8A47A] text-[#151515] font-semibold text-sm tracking-tight shadow-[0_10px_30px_rgba(184,164,122,0.25)] hover:shadow-[0_15px_35px_rgba(184,164,122,0.35)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 border border-[#B8A47A]"
          >
            <span>{ctaText}</span>
          </button>
        </div>

        {/* Interactive TechText Canvas Display */}
        {showTechText && (
          <div className="w-full mt-8" style={{ width: '100%', height: '360px', position: 'relative' }}>
            <TechText
              text={techTextString}
              fontWeight={600}
              fontSize={110}
              reveal="letter"
              dashLength={4}
              dashGap={2}
              specks={15}
              fontFamily=""
              color="#F3F3F1"
              accentColor="#B8A47A"
              letterSpacing={-0.05}
              reach={200}
              softness={0.7}
              strokeWidth={1.5}
              speed={1}
              lineStyle="dashed"
              selection
              labels
              draggable
              sweep
            />
          </div>
        )}
      </main>

      {/* Bottom Warm Ambient Champagne Glow */}
      <div
        className="pointer-events-none absolute bottom-0 inset-x-0 h-[380px] z-0 opacity-40"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(184, 164, 122, 0.25) 0%, rgba(184, 164, 122, 0.05) 50%, rgba(21, 21, 21, 0) 100%)',
        }}
      />
    </div>
  );
};

export default DarkHero;
