import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useData } from '../context/DataContext';
import { formatCurrency, cn } from '../lib/utils';
import { Trash2, AlertTriangle, TrendingUp } from 'lucide-react';
import { fetchIPCData } from '../lib/indec';
import { calculateFullSchedule } from '../lib/rentCalculator';

export default function Cashflow() {
    const { t } = useTranslation();
    const { units, expenses, payments, deleteExpense } = useData();
    const [ipcHistory, setIpcHistory] = useState([]);
    const [loadingIpc, setLoadingIpc] = useState(true);

    useEffect(() => {
        const loadIpc = async () => {
            try {
                const data = await fetchIPCData();
                setIpcHistory(data);
            } catch (e) {
                console.error("Failed to load IPC for cashflow", e);
            } finally {
                setLoadingIpc(false);
            }
        };
        loadIpc();
    }, []);

    const handleDeleteExpense = (expenseId, category) => {
        if (window.confirm(t('cashflow.confirmDelete', { category }))) {
            deleteExpense(expenseId);
        }
    };

    /**
     * Financial calculations for each unit
     * 
     * Calculates two key metrics:
     * 1. YTD Actuals: Real money collected and spent this year
     * 2. Projected Annual: Hybrid forecast combining actuals + future rent schedule
     */
    const financials = useMemo(() => {
        const currentYear = new Date().getFullYear();

        return units.map(unit => {
            // ==================== YTD ACTUALS ====================
            // Calculate actual money collected and spent in the current year

            // Filter payments for this unit in current year
            // Using string split to avoid timezone issues with Date parsing
            const unitPayments = payments.filter(p =>
                p.unitId === unit.id && p.datePaid.split('-')[0] == currentYear
            );
            const ytdIncome = unitPayments.reduce((sum, p) => sum + Number(p.amount), 0);

            // Filter expenses for this unit
            const unitExpenses = expenses.filter(e => e.unitId === unit.id);
            const ytdExpensesList = unitExpenses.filter(e =>
                e.date.split('-')[0] == currentYear
            );
            const ytdExpenses = ytdExpensesList.reduce((sum, e) => sum + Number(e.amount), 0);

            // Calculate profit metrics
            const ytdNetProfit = ytdIncome - ytdExpenses;
            const ytdProfitMargin = ytdIncome
                ? Math.round((ytdNetProfit / ytdIncome) * 100)
                : 0;

            // ==================== PROJECTED ANNUAL ====================
            // Hybrid calculation: Use actual payments where available,
            // forecast future months using rent schedule (with IPC adjustments)

            let projectedAnnual = 0;
            let hasProjectedMonths = false;
            let missingIpcWarning = false;

            if (ipcHistory.length > 0) {
                // Generate full rent schedule with IPC-based increases
                const schedule = calculateFullSchedule(unit, ipcHistory);

                // Iterate through all 12 months of the year
                for (let month = 0; month < 12; month++) {
                    const checkDateStr = `${currentYear}-${String(month + 1).padStart(2, '0')}-01`;
                    const monthStr = `${currentYear}-${String(month + 1).padStart(2, '0')}`;

                    // Priority 1: Use actual payment if it exists (most accurate)
                    const actualPayment = payments.find(p =>
                        p.unitId === unit.id && p.forMonth === monthStr
                    );

                    if (actualPayment) {
                        projectedAnnual += Number(actualPayment.amount);
                    } else {
                        // Priority 2: Forecast using schedule or current rent

                        // Check if month is outside lease period
                        if (unit.leaseEnd && checkDateStr > unit.leaseEnd) {
                            projectedAnnual += 0; // Lease ended
                        } else if (checkDateStr < unit.leaseStart) {
                            projectedAnnual += 0; // Lease hasn't started
                        } else {
                            // Find the applicable rent for this month from schedule
                            // Schedule contains future rent increases based on IPC
                            const applicableUpdate = schedule
                                .filter(s => s.date <= checkDateStr)
                                .pop(); // Get most recent update before this month

                            let monthlyRent = unit.rent; // Default to current rent

                            // If there's a pending (future) update, use its calculated rent
                            if (applicableUpdate && applicableUpdate.status === 'pending') {
                                monthlyRent = applicableUpdate.newRent;
                                if (applicableUpdate.isProjected) {
                                    hasProjectedMonths = true; // Mark if using estimated IPC
                                }
                            }

                            projectedAnnual += monthlyRent;
                        }
                    }
                }
            } else {
                // Fallback: No IPC data available
                // Use actual payments where available, current rent for unpaid months
                for (let month = 0; month < 12; month++) {
                    const monthStr = `${currentYear}-${String(month + 1).padStart(2, '0')}`;
                    const paid = payments.find(p =>
                        p.unitId === unit.id && p.forMonth === monthStr
                    );

                    if (paid) {
                        projectedAnnual += Number(paid.amount);
                    } else {
                        projectedAnnual += Number(unit.rent);
                    }
                }
                missingIpcWarning = true; // Warn user that projections are basic
            }

            return {
                ...unit,
                ytdIncome,
                ytdExpenses,
                ytdExpensesList,
                ytdNetProfit,
                ytdProfitMargin,
                projectedAnnual,
                hasProjectedMonths,
                missingIpcWarning,
                allExpenses: unitExpenses
            };
        });
    }, [units, expenses, payments, ipcHistory]);

    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-12">
            <header>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">{t('cashflow.title')}</h1>
                <p className="text-sm md:text-base text-slate-500 mt-1 md:mt-2">
                    {t('cashflow.yearToDateSummary') || `Year-to-Date Summary (${new Date().getFullYear()})`}
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {financials.map(item => (
                    <div key={item.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="text-lg font-bold text-slate-900">{item.name}</h3>
                            <div className="flex justify-between items-center mt-1">
                                <p className="text-xs text-slate-500 uppercase tracking-wider">YTD Performance</p>
                            </div>
                        </div>

                        <div className="p-6 flex-1 space-y-6">
                            {/* YTD Stats */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-slate-400 mb-1 font-semibold uppercase">{t('cashflow.collectedRevenue') || "Collected (YTD)"}</p>
                                    <p className="text-lg font-bold text-emerald-600">{formatCurrency(item.ytdIncome)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 mb-1 font-semibold uppercase">{t('cashflow.netProfit') || "Net Profit (YTD)"}</p>
                                    <p className={cn("text-lg font-bold", item.ytdNetProfit >= 0 ? "text-slate-900" : "text-rose-600")}>
                                        {formatCurrency(item.ytdNetProfit)}
                                    </p>
                                </div>
                            </div>

                            {/* Margin Bar */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-medium text-slate-600">
                                    <span>Margin</span>
                                    <span>{item.ytdProfitMargin}%</span>
                                </div>
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className={cn("h-full rounded-full transition-all duration-1000", item.ytdProfitMargin > 50 ? "bg-emerald-500" : item.ytdProfitMargin > 0 ? "bg-yellow-500" : "bg-rose-500")}
                                        style={{ width: `${Math.max(0, Math.min(100, item.ytdProfitMargin))}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Projection Box */}
                            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                                <div className="flex justify-between items-start mb-1">
                                    <p className="text-xs text-slate-500 uppercase font-semibold">Projected Annual</p>
                                    {(item.hasProjectedMonths || item.missingIpcWarning) && (
                                        <div className="group relative">
                                            <AlertTriangle size={14} className="text-amber-500 cursor-help" />
                                            <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-slate-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                                                Based on estimated IPC for future months.
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <p className="text-base font-bold text-slate-700">{formatCurrency(item.projectedAnnual)}</p>
                                    <TrendingUp size={14} className="text-slate-400" />
                                </div>
                            </div>

                            {/* Itemized Expenses (YTD) */}
                            <div className="space-y-3">
                                <p className="text-xs font-semibold text-slate-400 uppercase border-b border-slate-100 pb-2">{t('cashflow.topExpenses') || "Expenses (YTD)"}</p>
                                {item.ytdExpensesList.length > 0 ? (
                                    <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
                                        {item.ytdExpensesList.map(exp => (
                                            <div key={exp.id} className="flex justify-between items-center text-sm group">
                                                <span className="text-slate-600 truncate max-w-[100px]">{exp.category}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-slate-900">-{formatCurrency(exp.amount)}</span>
                                                    <button
                                                        onClick={() => handleDeleteExpense(exp.id, exp.category)}
                                                        className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                                                        title={t('cashflow.deleteExpense')}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
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
