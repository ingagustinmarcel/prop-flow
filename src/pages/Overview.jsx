/**
 * Overview Page - Dashboard with KPIs and Cash Flow Analytics
 * Fully responsive for mobile, tablet, and desktop
 * 
 * Features:
 * - Real-time KPI cards (units, occupancy, revenue, balance due)
 * - Cash flow chart with configurable date ranges
 * - Unit payment status tracking
 * - Quick payment marking
 */

import React, { useMemo, useCallback, useState } from 'react';
import { useData } from '../context/DataContext';
import KPICard from '../components/KPICard';
import { Users, Home, DollarSign, AlertCircle, CheckCircle, Menu, X } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';

export default function Overview() {
    const { t, i18n } = useTranslation();
    const { units, payments, expenses, markPaid } = useData();

    // Date range filter: 'last12' | 'currentYear' | 'previousYear'
    const [dateRange, setDateRange] = useState('last12');

    // Track which unit is being marked as paid for animation
    const [payingUnitId, setPayingUnitId] = useState(null);

    // Mobile hamburger menu state for unit status list
    const [isUnitListOpen, setIsUnitListOpen] = useState(false);

    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    const activeUnits = useMemo(() => units.filter(u => u.isActive), [units]);

    const stats = useMemo(() => {
        const totalUnits = activeUnits.length;
        const occupiedUnits = activeUnits.filter(u => u.tenant).length;
        const occupancyRate = totalUnits ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

        // Projected Monthly Revenue
        const monthlyRevenue = activeUnits.reduce((sum, unit) => sum + (unit.tenant ? Number(unit.rent) : 0), 0);

        // Balance Due (Current Month)
        const paidUnitIds = new Set(payments
            .filter(p => p.forMonth === currentMonth)
            .map(p => p.unitId));

        const balanceDue = activeUnits.reduce((sum, unit) => {
            if (!unit.tenant) return sum;
            if (!paidUnitIds.has(unit.id)) return sum + Number(unit.rent);
            return sum;
        }, 0);

        return { totalUnits, occupancyRate, monthlyRevenue, balanceDue };
    }, [activeUnits, payments, currentMonth]);

    /**
     * Chart Data Preparation
     * Generates monthly income and expense data based on selected date range
     * Income = ACTUAL payments received (not projected)
     * Expenses = ACTUAL expenses recorded
     */
    const chartData = useMemo(() => {
        const data = [];
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();

        let startDate, monthsToShow;

        // Determine date range based on filter
        if (dateRange === 'last12') {
            // Last 12 months from today
            monthsToShow = 12;
            startDate = new Date(currentDate);
            startDate.setMonth(startDate.getMonth() - 11);
            startDate.setDate(1);
        } else if (dateRange === 'currentYear') {
            // January to December of current year
            startDate = new Date(currentYear, 0, 1);
            monthsToShow = 12;
        } else if (dateRange === 'previousYear') {
            // January to December of previous year
            startDate = new Date(currentYear - 1, 0, 1);
            monthsToShow = 12;
        }

        // Generate data for each month
        for (let i = 0; i < monthsToShow; i++) {
            const monthDate = new Date(startDate);
            monthDate.setMonth(startDate.getMonth() + i);

            const monthStr = monthDate.toISOString().slice(0, 7); // YYYY-MM

            // Get localized month name with first letter capitalized
            const monthLabel = monthDate.toLocaleString(i18n.language, { month: 'short' });
            const capitalizedMonth = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

            // Calculate REAL income for this month (actual payments received)
            const monthIncome = payments
                .filter(p => p.forMonth === monthStr)
                .reduce((sum, p) => sum + Number(p.amount), 0);

            // Calculate REAL expenses for this month
            const monthExpenses = expenses
                .filter(e => e.date && e.date.startsWith(monthStr))
                .reduce((sum, e) => sum + Number(e.amount), 0);

            data.push({
                name: capitalizedMonth,
                Income: Math.round(monthIncome),
                Expenses: Math.round(monthExpenses)
            });
        }

        return data;
    }, [payments, expenses, i18n.language, dateRange]);

    const currentMonthName = useMemo(() =>
        new Date().toLocaleString(i18n.language, { month: 'long' }),
        [i18n.language]
    );

    const handleMarkPaid = useCallback(async (unitId) => {
        // Set paying state for animation
        setPayingUnitId(unitId);

        // Mark as paid
        await markPaid(unitId, currentMonth);

        // Keep animation visible for a moment before clearing
        setTimeout(() => {
            setPayingUnitId(null);
        }, 600);
    }, [markPaid, currentMonth]);

    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-6 md:pb-0">
            {/* Header - Stacked on mobile, side-by-side on desktop */}
            <header className="flex flex-col gap-3 md:flex-row md:justify-between md:items-start">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">{t('overview.title')}</h1>
                    <p className="text-sm md:text-base text-slate-500 mt-1 md:mt-2">{t('overview.subtitle')}</p>
                </div>
                {units.length === 0 && (
                    <button
                        onClick={() => {
                            if (confirm("Do you want to import your previous local data to the cloud?")) {
                                useData().migrateLocalData();
                            }
                        }}
                        className="text-xs font-semibold text-slate-500 underline hover:text-emerald-600 self-start md:self-auto"
                    >
                        {t('overview.recoverData')}
                    </button>
                )}
            </header>

            {/* KPI Grid - 1 column on mobile, 2 on tablet, 4 on desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <KPICard
                    title={t('overview.totalUnits')}
                    value={stats.totalUnits}
                    icon={Home}
                    color="blue"
                />
                <KPICard
                    title={t('overview.occupancy')}
                    value={`${stats.occupancyRate}%`}
                    icon={Users}
                    color="emerald"
                    trend={stats.occupancyRate === 100 ? t('overview.fullyOccupied') : `${100 - stats.occupancyRate}% ${t('overview.vacancy')}`}
                    trendUp={stats.occupancyRate > 90}
                />
                <KPICard
                    title={t('overview.monthlyRevenue')}
                    value={formatCurrency(stats.monthlyRevenue)}
                    icon={DollarSign}
                    color="emerald"
                    trend="+2.5% vs last month"
                    trendUp={true}
                />
                <KPICard
                    title={t('overview.balanceDue')}
                    value={formatCurrency(stats.balanceDue)}
                    icon={AlertCircle}
                    color={stats.balanceDue > 0 ? "rose" : "emerald"}
                    trend={stats.balanceDue > 0 ? t('overview.actionRequired') : t('overview.allClear')}
                    trendUp={stats.balanceDue === 0}
                />
            </div>

            {/* Chart and Unit Status - Stacked on mobile/tablet, side-by-side on desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                {/* Chart Section */}
                <div className="lg:col-span-2 bg-white p-4 md:p-6 rounded-xl border border-slate-200 shadow-sm">
                    {/* Chart Header - Stacked on mobile */}
                    <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center mb-4 md:mb-6">
                        <h3 className="text-base md:text-lg font-bold text-slate-800">{t('overview.cashFlowAnalytics')}</h3>

                        {/* Date Range Dropdown - Full width on mobile */}
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="w-full md:w-auto text-sm border border-slate-200 rounded-lg px-3 py-2 md:py-1.5 bg-white text-slate-700 font-medium hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        >
                            <option value="last12">Últimos 12 meses</option>
                            <option value="currentYear">Año actual ({new Date().getFullYear()})</option>
                            <option value="previousYear">Año anterior ({new Date().getFullYear() - 1})</option>
                        </select>
                    </div>

                    {/* Chart Summary Stats - Responsive layout */}
                    <div className="flex flex-wrap gap-3 md:gap-4 text-sm mb-4">
                        <div className="flex-1 min-w-[100px] text-center md:text-right">
                            <p className="text-xs text-slate-400">{t('overview.income')}</p>
                            <p className="font-bold text-emerald-600 text-sm md:text-base">
                                +{formatCurrency(chartData.reduce((sum, month) => sum + month.Income, 0))}
                            </p>
                        </div>
                        <div className="flex-1 min-w-[100px] text-center md:text-right">
                            <p className="text-xs text-slate-400">{t('overview.outgoing')}</p>
                            <p className="font-bold text-rose-500 text-sm md:text-base">
                                -{formatCurrency(chartData.reduce((sum, month) => sum + month.Expenses, 0))}
                            </p>
                        </div>
                        <div className="flex-1 min-w-[100px] text-center md:text-right md:pl-4 md:border-l border-slate-100">
                            <p className="text-xs text-slate-400">{t('overview.netPosition')}</p>
                            <p className={cn("font-bold text-sm md:text-base",
                                (chartData.reduce((sum, month) => sum + month.Income, 0) - chartData.reduce((sum, month) => sum + month.Expenses, 0)) >= 0
                                    ? "text-slate-900"
                                    : "text-rose-600"
                            )}>
                                {formatCurrency(
                                    chartData.reduce((sum, month) => sum + month.Income, 0) -
                                    chartData.reduce((sum, month) => sum + month.Expenses, 0)
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Chart - Reduced height on mobile */}
                    <div className="h-64 md:h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                {/* Show fewer ticks on mobile */}
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 11 }}
                                    dy={10}
                                    interval="preserveStartEnd"
                                    className="text-xs md:text-sm"
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 11 }}
                                    tickFormatter={(val) => `$${val}`}
                                    width={50}
                                />
                                <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="4 4" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Area type="monotone" dataKey="Income" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" />
                                <Area type="monotone" dataKey="Expenses" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorExp)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Unit Status Summary - Hamburger menu on mobile, always visible on desktop */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    {/* Header with hamburger toggle (mobile only) */}
                    <div className="flex items-center justify-between p-4 md:p-6 md:pb-3">
                        <h3 className="text-base md:text-lg font-bold text-slate-800">
                            {t('overview.unitStatus')} (<span className="capitalize">{currentMonthName}</span>)
                        </h3>

                        {/* Hamburger button - visible only on mobile */}
                        <button
                            onClick={() => setIsUnitListOpen(!isUnitListOpen)}
                            className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
                            aria-label="Toggle unit list"
                        >
                            {isUnitListOpen ? (
                                <X size={20} className="text-slate-600" />
                            ) : (
                                <Menu size={20} className="text-slate-600" />
                            )}
                        </button>
                    </div>

                    {/* Unit list - collapsible on mobile, always visible on desktop */}
                    <div className={cn(
                        "transition-all duration-300 ease-in-out",
                        "lg:block", // Always visible on desktop
                        isUnitListOpen ? "block" : "hidden" // Toggle on mobile
                    )}>
                        <div className="px-4 pb-4 md:px-6 md:pb-6 space-y-3 md:space-y-4 max-h-[400px] md:max-h-[340px] overflow-y-auto custom-scrollbar">
                            {activeUnits.map(unit => {
                                // Check payment status
                                const isPaid = payments.some(p => p.unitId === unit.id && p.forMonth === currentMonth);

                                return (
                                    <div key={unit.id} className="flex items-center justify-between p-3 md:p-3 bg-slate-50 rounded-lg border border-slate-100">
                                        <div className="flex-1 min-w-0 mr-3">
                                            <p className="font-semibold text-slate-800 text-sm md:text-base truncate">{unit.name}</p>
                                            <p className="text-xs text-slate-500 truncate">{unit.tenant || 'Vacant'}</p>
                                        </div>

                                        <div className="flex flex-col items-end gap-1">
                                            {isPaid || payingUnitId === unit.id ? (
                                                <span className={cn(
                                                    "flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full whitespace-nowrap",
                                                    payingUnitId === unit.id && "animate-in zoom-in duration-300"
                                                )}>
                                                    <CheckCircle size={12} className={payingUnitId === unit.id ? "animate-in spin-in duration-500" : ""} />
                                                    {t('overview.paid')}
                                                </span>
                                            ) : unit.tenant ? (
                                                <button
                                                    onClick={() => handleMarkPaid(unit.id)}
                                                    disabled={payingUnitId !== null}
                                                    className={cn(
                                                        "text-xs md:text-xs font-medium bg-slate-900 text-white px-4 py-2 md:px-3 md:py-1.5 rounded-full transition-all whitespace-nowrap min-h-[36px] md:min-h-0",
                                                        "active:scale-95 active:bg-emerald-600",
                                                        "hover:bg-slate-700 hover:shadow-lg",
                                                        "disabled:opacity-50 disabled:cursor-not-allowed"
                                                    )}
                                                >
                                                    {t('overview.markPaid')}
                                                </button>
                                            ) : (
                                                <span className="text-xs text-slate-400 italic">{t('overview.vacant')}</span>
                                            )}
                                            {unit.tenant && !isPaid && payingUnitId !== unit.id && (
                                                <p className="text-[10px] text-slate-400">{formatCurrency(unit.rent)}</p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
