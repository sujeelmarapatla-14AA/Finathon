import React, { useState } from "react";
import HeroOne from "@/components/ui/hero-01";
import DarkHero from "@/components/ui/hero-dark";
import TechText from "@/components/ui/TechText";

export default function Demo() {
  const [view, setView] = useState<"dark" | "agency">("dark");

  return (
    <div className="relative w-full">
      {/* View Switcher Floating Bar */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 p-1.5 rounded-full bg-black/80 border border-white/20 backdrop-blur-md shadow-2xl text-xs font-mono">
        <button
          onClick={() => setView("dark")}
          className={`px-3 py-1.5 rounded-full transition-all ${
            view === "dark" ? "bg-white text-black font-bold" : "text-white/70 hover:text-white"
          }`}
        >
          Dark Tech Hero
        </button>
        <button
          onClick={() => setView("agency")}
          className={`px-3 py-1.5 rounded-full transition-all ${
            view === "agency" ? "bg-white text-black font-bold" : "text-white/70 hover:text-white"
          }`}
        >
          Agency Hero-01
        </button>
      </div>

      {view === "dark" ? <DarkHero /> : <HeroOne />}
    </div>
  );
}

export { TechText, DarkHero, HeroOne };
