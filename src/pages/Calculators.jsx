import React, { useState } from 'react';
import { Calculator, ArrowRight, DollarSign, Percent } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';

export default function Calculators() {
    const [currentRent, setCurrentRent] = useState(1200);
    const [increasePercent, setIncreasePercent] = useState(5);

    const futureRent = Math.round(currentRent * (1 + (increasePercent / 100)));
    const difference = futureRent - currentRent;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Property Calculators</h1>
                <p className="text-slate-500 mt-2">Tools to help you plan and project financial scenarios.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Rent Projection Calculator */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                            <Calculator size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">Rent Projection</h3>
                    </div>

                    <div className="p-6 space-y-8">
                        {/* Inputs */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Current Rent Amount</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                        <DollarSign size={16} />
                                    </div>
                                    <input
                                        type="number"
                                        value={currentRent}
                                        onChange={(e) => setCurrentRent(Number(e.target.value))}
                                        className="pl-9 w-full rounded-lg border border-slate-300 py-2.5 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Increase Percentage</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                        <Percent size={16} />
                                    </div>
                                    <input
                                        type="number"
                                        value={increasePercent}
                                        onChange={(e) => setIncreasePercent(Number(e.target.value))}
                                        className="pl-9 w-full rounded-lg border border-slate-300 py-2.5 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Result Visual */}
                        <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-xs uppercase font-bold text-slate-400">Current</p>
                                <p className="text-2xl font-bold text-slate-700">{formatCurrency(currentRent)}</p>
                            </div>

                            <ArrowRight className="text-slate-300" size={32} />

                            <div className="space-y-1 text-right">
                                <p className="text-xs uppercase font-bold text-emerald-600">Projected Future</p>
                                <p className="text-3xl font-bold text-emerald-600">{formatCurrency(futureRent)}</p>
                                <p className="text-xs font-semibold text-emerald-500">+{formatCurrency(difference)} Increase</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Placeholder for future calc */}
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-center text-slate-400 min-h-[300px]">
                    <Calculator size={48} className="mb-4 opacity-50" />
                    <h3 className="text-lg font-medium text-slate-500">More Calculators Coming Soon</h3>
                    <p className="max-w-xs mt-2 text-sm">ROI Calculator, Expense Ratio, and Net Operating Income tools are in development.</p>
                </div>
            </div>
        </div>
    );
}
