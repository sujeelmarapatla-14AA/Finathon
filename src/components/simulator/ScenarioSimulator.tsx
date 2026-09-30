import React, { useState } from 'react';
import { Sliders, ArrowRight, RefreshCw, CheckCircle2 } from 'lucide-react';
import { runRecoverySimulation } from '../../services/api';
import { formatCompactINR, formatINR } from '../../utils/formatters';
import { PageHeader } from '../common/PageHeader';
import { Button } from '../common/Button';

export const ScenarioSimulator: React.FC = () => {
  const [currentSupplier, setCurrentSupplier] = useState<string>('TechWorld Solutions');
  const [currentPrice, setCurrentPrice] = useState<number>(52000);
  const [altSupplier, setAltSupplier] = useState<string>('Apex Strategic Supplies');
  const [altPrice, setAltPrice] = useState<number>(47500);
  const [quantity, setQuantity] = useState<number>(50);
  const [expectedDemand, setExpectedDemand] = useState<number>(200);

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [results, setResults] = useState<{
    current_cost: number;
    optimized_cost: number;
    potential_savings: number;
    savings_percent: number;
    projected_annual_savings?: number | null;
  }>({
    current_cost: 2600000,
    optimized_cost: 2375000,
    potential_savings: 225000,
    savings_percent: 8.65,
    projected_annual_savings: 900000,
  });

  const handleRunScenario = async () => {
    setIsRunning(true);
    try {
      const data = await runRecoverySimulation({
        current_price: Number(currentPrice),
        alternative_price: Number(altPrice),
        quantity: Number(quantity),
        current_supplier: currentSupplier,
        alternative_supplier: altSupplier,
        expected_demand: Number(expectedDemand),
      });
      setResults(data);
    } catch (err) {
      console.warn('Simulation API note:', err);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <PageHeader
        label="Deterministic Scenario Engine"
        title="What changes if we make a different decision?"
        subtitle="Simulate the bottom-line financial impact of alternative supplier pricing, volume commitments, and master agreement rate cards."
        actions={
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setCurrentSupplier('TechWorld Solutions');
                setCurrentPrice(52000);
                setAltSupplier('Apex Strategic Supplies');
                setAltPrice(47500);
                setQuantity(50);
              }}
              className="h-9 px-4 rounded-full text-xs font-medium bg-white hover:bg-[#FAFAF8] border border-[#E8E8E3] text-[#111111] transition-all"
            >
              Laptops (Default)
            </button>
            <button
              onClick={() => {
                setCurrentSupplier('CloudScale Networks');
                setCurrentPrice(145000);
                setAltSupplier('InfraCore Cloud');
                setAltPrice(118000);
                setQuantity(12);
              }}
              className="h-9 px-4 rounded-full text-xs font-medium bg-white hover:bg-[#FAFAF8] border border-[#E8E8E3] text-[#111111] transition-all"
            >
              Cloud Compute
            </button>
          </div>
        }
      />

      {/* Large Black Rounded Scenario Simulator Container */}
      <div className="rounded-[28px] sm:rounded-[36px] bg-[#0A0A0A] text-white p-6 sm:p-10 lg:p-12 border border-[#1F1F1F] shadow-2xl relative overflow-hidden">
        {/* Fine dark grid background */}
        <div className="absolute inset-0 bg-dark-grid opacity-25 pointer-events-none" />

        <div className="relative space-y-8">
          <div className="flex items-center justify-between pb-6 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#73C69A]" />
              <span className="text-xs font-mono uppercase tracking-wider text-white">
                SpendIntel Simulation Engine · Deterministic
              </span>
            </div>
            <span className="text-[11px] font-mono text-[#8A8A84] bg-white/5 px-3 py-1 rounded-full border border-white/10">
              Zero Guesswork
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
            {/* LEFT SIDE (6 Cols): Input Section */}
            <div className="lg:col-span-6 space-y-6">
              <span className="text-[10px] uppercase font-semibold tracking-wider text-[#8A8A84] block">
                Scenario Inputs
              </span>

              {/* Current Supplier & Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[#8A8A84] block font-sans font-medium mb-2">
                    Current supplier
                  </label>
                  <input
                    type="text"
                    value={currentSupplier}
                    onChange={(e) => setCurrentSupplier(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/15 text-white text-xs font-sans focus:outline-none focus:border-[#73C69A] transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs text-[#8A8A84] block font-sans font-medium mb-2">
                    Current price (₹)
                  </label>
                  <input
                    type="number"
                    value={currentPrice}
                    onChange={(e) => setCurrentPrice(Number(e.target.value))}
                    className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/15 text-white text-xs font-mono focus:outline-none focus:border-[#73C69A] transition-colors tnum"
                  />
                </div>
              </div>

              {/* Alternative Supplier & Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[#8A8A84] block font-sans font-medium mb-2">
                    Alternative supplier
                  </label>
                  <input
                    type="text"
                    value={altSupplier}
                    onChange={(e) => setAltSupplier(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/15 text-white text-xs font-sans focus:outline-none focus:border-[#73C69A] transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs text-[#8A8A84] block font-sans font-medium mb-2">
                    Alternative price (₹)
                  </label>
                  <input
                    type="number"
                    value={altPrice}
                    onChange={(e) => setAltPrice(Number(e.target.value))}
                    className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/15 text-white text-xs font-mono focus:outline-none focus:border-[#73C69A] transition-colors tnum"
                  />
                </div>
              </div>

              {/* Quantity */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs text-[#8A8A84] block font-sans font-medium">
                    Quantity (units)
                  </label>
                  <span className="font-mono text-xs text-white tnum">{quantity} units</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="500"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full accent-[#73C69A] h-2 bg-white/10 rounded-lg cursor-pointer"
                />
              </div>

              {/* Main CTA */}
              <div className="pt-2">
                <Button
                  variant="dark-primary"
                  size="lg"
                  disabled={isRunning}
                  onClick={handleRunScenario}
                  className="w-full justify-center"
                  icon={
                    isRunning ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-[#0A0A0A]" />
                    ) : (
                      <ArrowRight className="w-3.5 h-3.5" />
                    )
                  }
                >
                  {isRunning ? 'CALCULATING...' : 'RUN SCENARIO'}
                </Button>
              </div>
            </div>

            {/* RIGHT SIDE (6 Cols): Output Section */}
            <div className="lg:col-span-6 bg-white/5 rounded-[24px] border border-white/10 p-6 sm:p-8 flex flex-col justify-between space-y-6">
              <div>
                <span className="text-[10px] uppercase font-semibold tracking-wider text-[#73C69A] block mb-6">
                  Projected Financial Outcome
                </span>

                <div className="grid grid-cols-2 gap-4 pb-6 border-b border-white/10">
                  {/* CURRENT */}
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase tracking-wider text-[#8A8A84] block font-semibold">
                      CURRENT
                    </span>
                    <div className="text-2xl sm:text-3xl font-sans font-medium text-white tnum">
                      {formatCompactINR(results.current_cost)}
                    </div>
                    <span className="text-xs text-[#8A8A84] font-mono block">
                      {formatINR(results.current_cost)}
                    </span>
                  </div>

                  {/* OPTIMIZED */}
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase tracking-wider text-[#8A8A84] block font-semibold">
                      OPTIMIZED
                    </span>
                    <div className="text-2xl sm:text-3xl font-sans font-medium text-white tnum">
                      {formatCompactINR(results.optimized_cost)}
                    </div>
                    <span className="text-xs text-[#73C69A] font-mono block">
                      {formatINR(results.optimized_cost)}
                    </span>
                  </div>
                </div>

                {/* POTENTIAL RECOVERY & SAVINGS */}
                <div className="pt-6 grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase tracking-wider text-[#73C69A] block font-semibold">
                      POTENTIAL RECOVERY
                    </span>
                    <div className="text-3xl sm:text-4xl font-sans font-medium text-white tnum">
                      {formatCompactINR(results.potential_savings)}
                    </div>
                    <span className="text-xs text-[#8A8A84] block">Net recoverable cash</span>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] uppercase tracking-wider text-[#73C69A] block font-semibold">
                      SAVINGS
                    </span>
                    <div className="text-3xl sm:text-4xl font-sans font-medium text-[#73C69A] tnum">
                      {results.savings_percent.toFixed(2)}%
                    </div>
                    <span className="text-xs text-[#8A8A84] block">Percentage delta</span>
                  </div>
                </div>
              </div>

              {/* Verification Stamp */}
              <div className="pt-6 border-t border-white/10 flex items-center gap-2 text-xs text-[#8A8A84]">
                <CheckCircle2 className="w-4 h-4 text-[#73C69A] shrink-0" />
                <span>Deterministic math calculated via SpendIntel API backend</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

