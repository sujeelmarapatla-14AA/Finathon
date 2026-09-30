import React from 'react';
import { Button } from '@/components/ui/button';

export interface NavigationSection {
  title: string;
  href: string;
  isActive?: boolean;
}

interface HeaderProps {
  navigationData?: NavigationSection[];
}

export default function Header({ navigationData = [] }: HeaderProps) {
  return (
    <header className="w-full border-b border-neutral-200 bg-white/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="font-bold text-lg text-neutral-900 tracking-tight">Agency</div>
        <nav className="hidden md:flex items-center gap-6">
          {navigationData.map((item, idx) => (
            <a
              key={idx}
              href={item.href}
              className={`text-sm transition-colors ${
                item.isActive
                  ? 'text-neutral-900 font-semibold'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              {item.title}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm">
            Sign In
          </Button>
          <Button size="sm">Contact</Button>
        </div>
      </div>
    </header>
  );
}
