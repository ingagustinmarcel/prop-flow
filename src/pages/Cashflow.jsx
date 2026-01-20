import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { formatCurrency, cn } from '../lib/utils';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

export default function Cashflow() {
    const { units, expenses } = useData();

    // Calculations for financial cards per unit
    const financials = useMemo(() => {
        return units.map(unit => {
            const annualIncome = Number(unit.rent) * 12;

            // Filter expenses for this unit
            // Note: In a real app we'd filter by year. 
            // For simplicity, we'll sum ALL expenses assigned to this unit for now, or just assume the 'expenses' list is current year.
            const unitExpenses = expenses.filter(e => e.unitId === unit.id);
            const totalExpenses = unitExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

            const netProfit = annualIncome - totalExpenses;
            const profitMargin = annualIncome ? Math.round((netProfit / annualIncome) * 100) : 0;

            return {
                ...unit,
                annualIncome,
                unitExpenses,
                totalExpenses,
                netProfit,
                profitMargin
            };
        });
    }, [units, expenses]);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Financial Performance</h1>
                <p className="text-slate-500 mt-2">Cashflow breakdown per unit.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {financials.map(item => (
                    <div key={item.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="text-lg font-bold text-slate-900">{item.name}</h3>
                            <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">Annual Projection</p>
                        </div>

                        <div className="p-6 flex-1 space-y-6">
                            {/* Summary Stats */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-slate-400 mb-1">Annual Revenue</p>
                                    <p className="text-lg font-bold text-emerald-600">{formatCurrency(item.annualIncome)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 mb-1">Net Profit</p>
                                    <p className={cn("text-lg font-bold", item.netProfit >= 0 ? "text-slate-900" : "text-rose-600")}>
                                        {formatCurrency(item.netProfit)}
                                    </p>
                                </div>
                            </div>

                            {/* Margin Bar */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-medium text-slate-600">
                                    <span>Profit Margin</span>
                                    <span>{item.profitMargin}%</span>
                                </div>
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className={cn("h-full rounded-full transition-all duration-1000", item.profitMargin > 50 ? "bg-emerald-500" : item.profitMargin > 0 ? "bg-yellow-500" : "bg-rose-500")}
                                        style={{ width: `${Math.max(0, Math.min(100, item.profitMargin))}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Itemized Expenses */}
                            <div className="space-y-3">
                                <p className="text-xs font-semibold text-slate-400 uppercase border-b border-slate-100 pb-2">Top Expenses</p>
                                {item.unitExpenses.length > 0 ? (
                                    <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
                                        {item.unitExpenses.map(exp => (
                                            <div key={exp.id} className="flex justify-between items-center text-sm">
                                                <span className="text-slate-600 truncate max-w-[120px]">{exp.category}</span>
                                                <span className="font-medium text-slate-900">-{formatCurrency(exp.amount)}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-400 italic">No expenses recorded.</p>
                                )}
                            </div>
                        </div>

                        <div className="bg-slate-50 p-4 border-t border-slate-100 text-center">
                            <button className="text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:underline">
                                View Full Report
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
