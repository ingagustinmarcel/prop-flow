import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useData } from '../context/DataContext';
import { formatCurrency, cn } from '../lib/utils';

export default function Cashflow() {
    const { t } = useTranslation();
    const { units, expenses } = useData();

    const financials = useMemo(() => {
        return units.map(unit => {
            const annualIncome = Number(unit.rent) * 12;
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
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{t('cashflow.title')}</h1>
                <p className="text-slate-500 mt-2">{t('cashflow.subtitle')}</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {financials.map(item => (
                    <div key={item.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="text-lg font-bold text-slate-900">{item.name}</h3>
                            <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">{t('cashflow.annualProjection')}</p>
                        </div>

                        <div className="p-6 flex-1 space-y-6">
                            {/* Summary Stats */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-slate-400 mb-1">{t('cashflow.annualRevenue')}</p>
                                    <p className="text-lg font-bold text-emerald-600">{formatCurrency(item.annualIncome)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 mb-1">{t('cashflow.netProfit')}</p>
                                    <p className={cn("text-lg font-bold", item.netProfit >= 0 ? "text-slate-900" : "text-rose-600")}>
                                        {formatCurrency(item.netProfit)}
                                    </p>
                                </div>
                            </div>

                            {/* Margin Bar */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-medium text-slate-600">
                                    <span>{t('cashflow.profitMargin')}</span>
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
                                <p className="text-xs font-semibold text-slate-400 uppercase border-b border-slate-100 pb-2">{t('cashflow.topExpenses')}</p>
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
                                    <p className="text-sm text-slate-400 italic">{t('cashflow.noExpenses')}</p>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
