import React from 'react';
import TechText from './TechText';
import { Button } from './button';

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
    <div className="relative min-h-screen bg-[#000000] text-white flex flex-col justify-between selection:bg-white/20 selection:text-white overflow-hidden font-sans">
      {/* Top Navbar */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-xl tracking-tight text-white">Logo</span>
        </div>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm text-[#A1A1AA]">
          <a href="#getting-started" className="hover:text-white transition-colors duration-200">
            Getting started
          </a>
          <a href="#components" className="hover:text-white transition-colors duration-200">
            Components
          </a>
          <a href="#documentation" className="hover:text-white transition-colors duration-200">
            Documentation
          </a>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-5">
          <button
            onClick={onSignInClick}
            className="text-sm font-medium text-[#A1A1AA] hover:text-white transition-colors"
          >
            Sign in
          </button>
          <button
            onClick={onSignUpClick}
            className="h-9 px-5 rounded-full bg-white text-black text-sm font-medium hover:bg-[#EAEAEA] active:scale-95 transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)]"
          >
            Sign Up
          </button>
        </div>
      </header>

      {/* Main Hero Body */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 pt-12 pb-20 max-w-5xl mx-auto">
        {/* Big Editorial Headline */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[76px] font-semibold tracking-[-0.03em] leading-[1.08] text-white max-w-4xl mx-auto whitespace-pre-line">
          {title}
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-lg text-[#8E8E93] max-w-2xl mx-auto font-normal leading-relaxed">
          {subtitle}
        </p>

        {/* Get started Pill Button */}
        <div className="mt-10">
          <button
            onClick={onCtaClick}
            className="relative group px-8 py-3.5 rounded-xl bg-gradient-to-b from-white to-[#E2E2E2] text-black font-semibold text-sm tracking-tight shadow-[0_10px_30px_rgba(255,255,255,0.15)] hover:shadow-[0_15px_35px_rgba(255,255,255,0.25)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 border border-white/80"
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
              color="#ffffff"
              accentColor="#ffffff"
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

      {/* Bottom Warm Ambient Glow (Amber / Golden Glow rising from bottom) */}
      <div
        className="pointer-events-none absolute bottom-0 inset-x-0 h-[380px] z-0 opacity-80"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(215, 130, 40, 0.22) 0%, rgba(160, 80, 20, 0.08) 50%, rgba(0, 0, 0, 0) 100%)',
        }}
      />
    </div>
  );
};

export default DarkHero;
