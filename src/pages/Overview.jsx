import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import KPICard from '../components/KPICard';
import { Users, Home, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';

export default function Overview() {
    const { t, i18n } = useTranslation();
    const { units, payments, expenses, markPaid } = useData();

    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const today = new Date();

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

    // Chart Data Preparation - Using REAL expense data
    const chartData = useMemo(() => {
        const data = [];
        for (let i = 11; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const monthStr = d.toISOString().slice(0, 7); // YYYY-MM format
            const monthLabel = d.toLocaleString(i18n.language, { month: 'short' });

            // Calculate REAL income for this month
            const monthIncome = activeUnits.reduce((sum, unit) => {
                return sum + (unit.tenant ? Number(unit.rent) : 0);
            }, 0);

            // Calculate REAL expenses for this month
            const monthExpenses = expenses
                .filter(e => e.date && e.date.startsWith(monthStr))
                .reduce((sum, e) => sum + Number(e.amount), 0);

            data.push({
                name: monthLabel,
                Income: Math.round(monthIncome),
                Expenses: Math.round(monthExpenses)
            });
        }
        return data;
    }, [activeUnits, expenses, i18n.language]);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{t('overview.title')}</h1>
                    <p className="text-slate-500 mt-2">{t('overview.subtitle')}</p>
                </div>
                {units.length === 0 && (
                    <button
                        onClick={() => {
                            if (confirm("Do you want to import your previous local data to the cloud?")) {
                                useData().migrateLocalData();
                            }
                        }}
                        className="text-xs font-semibold text-slate-500 underline hover:text-emerald-600"
                    >
                        {t('overview.recoverData')}
                    </button>
                )}
            </header>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Chart Section */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-slate-800">{t('overview.cashFlowAnalytics')}</h3>

                        {/* Chart Summary Stats */}
                        <div className="flex gap-4 text-sm">
                            <div className="text-right">
                                <p className="text-xs text-slate-400">{t('overview.income')}</p>
                                <p className="font-bold text-emerald-600">+{formatCurrency(chartData[chartData.length - 1].Income)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-slate-400">{t('overview.outgoing')}</p>
                                <p className="font-bold text-rose-500">-{formatCurrency(chartData[chartData.length - 1].Expenses)}</p>
                            </div>
                            <div className="text-right pl-4 border-l border-slate-100">
                                <p className="text-xs text-slate-400">{t('overview.netPosition')}</p>
                                <p className={cn("font-bold", (chartData[chartData.length - 1].Income - chartData[chartData.length - 1].Expenses) >= 0 ? "text-slate-900" : "text-rose-600")}>
                                    {formatCurrency(chartData[chartData.length - 1].Income - chartData[chartData.length - 1].Expenses)}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="h-80 w-full">
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
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(val) => `$${val}`} />
                                <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="4 4" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Area type="monotone" dataKey="Income" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                                <Area type="monotone" dataKey="Expenses" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorExp)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Unit Status Summary */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">
                        {t('overview.unitStatus')} (<span className="capitalize">{new Date().toLocaleString(i18n.language, { month: 'long' })}</span>)
                    </h3>
                    <div className="space-y-4 max-h-[340px] overflow-y-auto pr-2 custom-scrollbar">
                        {activeUnits.map(unit => {
                            // Check payment status
                            const isPaid = payments.some(p => p.unitId === unit.id && p.forMonth === currentMonth);

                            return (
                                <div key={unit.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <div>
                                        <p className="font-semibold text-slate-800">{unit.name}</p>
                                        <p className="text-xs text-slate-500">{unit.tenant || 'Vacant'}</p>
                                    </div>

                                    {isPaid ? (
                                        <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
                                            <CheckCircle size={12} /> {t('overview.paid')}
                                        </span>
                                    ) : unit.tenant ? (
                                        <button
                                            onClick={() => markPaid(unit.id, currentMonth)}
                                            className="text-xs font-medium bg-slate-900 text-white px-3 py-1.5 rounded-full hover:bg-slate-700 transition"
                                        >
                                            {t('overview.markPaid')}
                                        </button>
                                    ) : (
                                        <span className="text-xs text-slate-400 italic">{t('overview.vacant')}</span>
                                    )}
                                    {unit.tenant && !isPaid && (
                                        <p className="text-[10px] text-slate-400 text-center mt-1">{formatCurrency(unit.rent)}</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
