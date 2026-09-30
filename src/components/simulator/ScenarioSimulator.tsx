import React, { useState } from 'react';
import { RefreshCw, CheckCircle2, Sliders, TrendingUp } from 'lucide-react';

export const ScenarioSimulator: React.FC = () => {
  // Inputs matching Section 17
  const [currentSupplier, setCurrentSupplier] = useState('TechWorld Systems');
  const [altSupplier, setAltSupplier] = useState('XYZ Supplies Ltd');
  const [currentPrice, setCurrentPrice] = useState<number>(52000);
  const [altPrice, setAltPrice] = useState<number>(47500);
  const [quantity, setQuantity] = useState<number>(50);
  const [expectedDemand, setExpectedDemand] = useState<number>(1.0);

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [hasCalculated, setHasCalculated] = useState<boolean>(true);

  // Computations
  const totalUnits = Math.round(quantity * expectedDemand);
  const currentTotal = totalUnits * currentPrice;
  const optimizedTotal = totalUnits * altPrice;
  const potentialRecovery = Math.max(0, currentTotal - optimizedTotal);

  const formatLakhs = (val: number): string => {
    if (val >= 10000000) {
      return `₹${(val / 10000000).toFixed(2)} Cr`;
    }
    return `₹${(val / 100000).toFixed(2)} L`;
  };

  const handleRunScenario = () => {
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
      setHasCalculated(true);
    }, 350);
  };

  return (
    <div className="space-y-8">
      {/* Page Header (Section 17) */}
      <div className="border-b border-border-default pb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-sans font-semibold tracking-micro text-brand-gold block mb-2">
            05 / RECOVERY SIMULATION
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-text-primary font-normal tracking-tight">
            What happens if we change the decision?
          </h1>
          <p className="mt-3 text-sm sm:text-base text-text-secondary font-sans max-w-2xl leading-relaxed">
            Model alternative vendor pricing, volume consolidations, and contractual renegotiations.
          </p>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setCurrentSupplier('TechWorld Systems');
              setAltSupplier('XYZ Supplies Ltd');
              setCurrentPrice(52000);
              setAltPrice(47500);
              setQuantity(50);
              setExpectedDemand(1.0);
              handleRunScenario();
            }}
            className="px-3 py-1.5 rounded-[6px] text-xs font-sans text-text-secondary hover:text-text-primary bg-dark-secondary border border-border-subtle hover:bg-dark-elevated transition-colors"
          >
            Laptops (Default)
          </button>
          <button
            onClick={() => {
              setCurrentSupplier('ABC Traders');
              setAltSupplier('Metro Office Solutions');
              setCurrentPrice(7000);
              setAltPrice(6450);
              setQuantity(200);
              setExpectedDemand(1.2);
              handleRunScenario();
            }}
            className="px-3 py-1.5 rounded-[6px] text-xs font-sans text-text-secondary hover:text-text-primary bg-dark-secondary border border-border-subtle hover:bg-dark-elevated transition-colors"
          >
            Consumables
          </button>
        </div>
      </div>

      {/* Main Two-Column Grid: LEFT Scenario Inputs | RIGHT Outcomes (Section 17) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* LEFT SIDE (6 Columns): Scenario Inputs */}
        <div className="lg:col-span-6 border border-border-default rounded-[12px] p-6 sm:p-8 bg-transparent space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
            <span className="text-[10px] uppercase font-sans font-semibold tracking-micro text-text-muted">
              SCENARIO INPUTS
            </span>
            <span className="text-xs font-mono text-text-muted">
              Deterministic Math Engine
            </span>
          </div>

          {/* Supplier Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] uppercase font-sans tracking-wide text-text-muted mb-1.5 font-medium">
                Current Supplier
              </label>
              <input
                type="text"
                value={currentSupplier}
                onChange={(e) => setCurrentSupplier(e.target.value)}
                className="w-full h-10 px-3 rounded-[8px] bg-dark-secondary border border-border-default text-text-primary text-sm focus:outline-none focus:border-brand-forest font-sans"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase font-sans tracking-wide text-text-muted mb-1.5 font-medium">
                Alternative Supplier
              </label>
              <input
                type="text"
                value={altSupplier}
                onChange={(e) => setAltSupplier(e.target.value)}
                className="w-full h-10 px-3 rounded-[8px] bg-dark-secondary border border-border-default text-text-primary text-sm focus:outline-none focus:border-brand-forest font-sans"
              />
            </div>
          </div>

          {/* Price Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] uppercase font-sans tracking-wide text-text-muted mb-1.5 font-medium">
                Current Price (₹)
              </label>
              <input
                type="number"
                value={currentPrice}
                onChange={(e) => setCurrentPrice(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-[8px] bg-dark-secondary border border-border-default text-text-primary text-sm focus:outline-none focus:border-brand-forest font-mono tnum"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase font-sans tracking-wide text-text-muted mb-1.5 font-medium">
                Alternative Price (₹)
              </label>
              <input
                type="number"
                value={altPrice}
                onChange={(e) => setAltPrice(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-[8px] bg-dark-secondary border border-border-default text-text-primary text-sm focus:outline-none focus:border-brand-forest font-mono tnum"
              />
            </div>
          </div>

          {/* Quantity & Expected Demand */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] uppercase font-sans tracking-wide text-text-muted mb-1.5 font-medium">
                Quantity (Units)
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-[8px] bg-dark-secondary border border-border-default text-text-primary text-sm focus:outline-none focus:border-brand-forest font-mono tnum"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase font-sans tracking-wide text-text-muted mb-1.5 font-medium">
                Expected Demand
              </label>
              <select
                value={expectedDemand}
                onChange={(e) => setExpectedDemand(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-[8px] bg-dark-secondary border border-border-default text-text-primary text-sm focus:outline-none focus:border-brand-forest font-sans"
              >
                <option value={1.0}>1.0x (Current Requisition)</option>
                <option value={1.2}>1.2x (Q4 Ramp)</option>
                <option value={1.5}>1.5x (Annualized)</option>
              </select>
            </div>
          </div>

          {/* Button: RUN SCENARIO (Section 17) */}
          <div className="pt-4 border-t border-border-subtle">
            <button
              onClick={handleRunScenario}
              disabled={isRunning}
              className="w-full h-10 rounded-[8px] flex items-center justify-center gap-2 text-xs font-sans font-semibold uppercase tracking-wider bg-brand-forest hover:bg-brand-forest-bright text-brand-cream transition-colors shadow-fine"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
              <span>{isRunning ? 'Calculating Scenario...' : 'RUN SCENARIO'}</span>
            </button>
          </div>
        </div>

        {/* RIGHT SIDE (6 Columns): CURRENT | OPTIMIZED | POTENTIAL RECOVERY (Section 17) */}
        <div className="lg:col-span-6 border border-border-default rounded-[12px] p-6 sm:p-8 bg-transparent flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-border-subtle mb-6">
              <span className="text-[10px] uppercase font-sans font-semibold tracking-micro text-text-muted">
                FINANCIAL OUTCOMES
              </span>
              <span className="text-xs font-mono text-text-muted">
                {totalUnits} Units Modeled
              </span>
            </div>

            {/* Metric Blocks: CURRENT, OPTIMIZED, POTENTIAL RECOVERY */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-border-subtle">
              <div className="pt-2 sm:pt-0 sm:px-2 first:pl-0">
                <span className="text-[10px] uppercase font-sans font-semibold tracking-micro text-text-muted block mb-1">
                  CURRENT
                </span>
                <span className="font-serif text-3xl font-normal text-brand-terracotta tnum block">
                  {formatLakhs(currentTotal)}
                </span>
                <span className="text-[11px] text-text-muted font-sans mt-0.5 block truncate">
                  {currentSupplier}
                </span>
              </div>

              <div className="pt-2 sm:pt-0 sm:px-2">
                <span className="text-[10px] uppercase font-sans font-semibold tracking-micro text-text-muted block mb-1">
                  OPTIMIZED
                </span>
                <span className="font-serif text-3xl font-normal text-text-primary tnum block">
                  {formatLakhs(optimizedTotal)}
                </span>
                <span className="text-[11px] text-text-muted font-sans mt-0.5 block truncate">
                  {altSupplier}
                </span>
              </div>

              <div className="pt-2 sm:pt-0 sm:px-2">
                <span className="text-[10px] uppercase font-sans font-semibold tracking-micro text-brand-forest-bright block mb-1">
                  POTENTIAL RECOVERY
                </span>
                <span className="font-serif text-3xl font-normal text-brand-forest-bright tnum block">
                  {formatLakhs(potentialRecovery)}
                </span>
                <span className="text-[11px] text-brand-forest-bright font-sans mt-0.5 block">
                  Reclaimable Delta
                </span>
              </div>
            </div>

            {/* Visual Delta Bars */}
            <div className="pt-8 space-y-4">
              <span className="text-[10px] uppercase font-sans font-semibold tracking-micro text-text-muted block">
                Exposure Comparison
              </span>

              {/* Current */}
              <div>
                <div className="flex justify-between text-xs font-sans mb-1 text-text-secondary">
                  <span>{currentSupplier}</span>
                  <span className="font-mono text-brand-terracotta tnum">{formatLakhs(currentTotal)}</span>
                </div>
                <div className="w-full bg-dark-secondary h-2.5 rounded-[2px] overflow-hidden">
                  <div className="h-full bg-brand-terracotta rounded-[2px]" style={{ width: '100%' }} />
                </div>
              </div>

              {/* Optimized */}
              <div>
                <div className="flex justify-between text-xs font-sans mb-1 text-text-secondary">
                  <span>{altSupplier}</span>
                  <span className="font-mono text-brand-forest-bright tnum">{formatLakhs(optimizedTotal)}</span>
                </div>
                <div className="w-full bg-dark-secondary h-2.5 rounded-[2px] overflow-hidden">
                  <div 
                    className="h-full bg-brand-forest rounded-[2px] transition-all duration-500 ease-out"
                    style={{ width: `${Math.max(10, Math.min(100, (optimizedTotal / currentTotal) * 100))}%` }} 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* After Calculation Box (Section 17) */}
          {hasCalculated && (
            <div className="p-4 rounded-[8px] bg-dark-secondary border border-brand-forest/40 flex items-center justify-between transition-all">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-brand-forest-bright shrink-0" />
                <div>
                  <span className="text-xs font-sans font-medium text-text-primary block">
                    Potential recovery identified
                  </span>
                  <span className="text-[11px] text-text-muted">
                    Transferring volume to contracted OEM rate card captures savings.
                  </span>
                </div>
              </div>
              <span className="font-serif text-2xl font-normal text-brand-forest-bright tnum">
                {formatLakhs(potentialRecovery)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
