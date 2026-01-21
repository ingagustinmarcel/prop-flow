import React, { useState } from 'react';
import { Calculator, ArrowRight, DollarSign, Percent, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { useTranslation } from 'react-i18next';
import { fetchIPCData, calculateAdjustment } from '../lib/indec';

export default function Calculators() {
    const { t } = useTranslation();

    // --- Manual Calculator State ---
    const [currentRent, setCurrentRent] = useState(1200);
    const [increasePercent, setIncreasePercent] = useState(5);
    const futureRent = Math.round(currentRent * (1 + (increasePercent / 100)));
    const difference = futureRent - currentRent;

    // --- Auto IPC Calculator State ---
    const [ipcRent, setIpcRent] = useState(1000);
    const [ipcResult, setIpcResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleCalculateIPC = async () => {
        setLoading(true);
        setError(null);
        setIpcResult(null);

        try {
            const data = await fetchIPCData();
            const result = calculateAdjustment(ipcRent, data);
            setIpcResult(result);
        } catch (err) {
            setError(t('calculators.errorFetch'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{t('calculators.title')}</h1>
                <p className="text-slate-500 mt-2">{t('calculators.subtitle')}</p>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

                {/* 1. AUTO IPC CALCULATOR (New Feature) */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-slate-50 flex items-center gap-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                            <RefreshCw size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">{t('calculators.ipcTitle')}</h3>
                            <p className="text-xs text-blue-600 font-medium">✨ {t('calculators.poweredByIndec')}</p>
                        </div>
                    </div>

                    <div className="p-6 space-y-6 flex-1 flex flex-col">
                        <p className="text-sm text-slate-500">
                            {t('calculators.ipcDescription')}
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('calculators.currentRent')}</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                        <DollarSign size={16} />
                                    </div>
                                    <input
                                        type="number"
                                        value={ipcRent}
                                        onChange={(e) => setIpcRent(Number(e.target.value))}
                                        className="pl-9 w-full rounded-lg border border-slate-300 py-2.5 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleCalculateIPC}
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
                                {loading ? t('calculators.calculating') : t('calculators.calculateAuto')}
                            </button>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        )}

                        {ipcResult && (
                            <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-2 duration-300">
                                <div className="p-4 bg-white border-b border-slate-200 flex justify-between items-center">
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">{t('calculators.newRent')}</p>
                                        <p className="text-2xl font-bold text-slate-900">{formatCurrency(ipcResult.newRent)}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold inline-block mb-1">
                                            +{ipcResult.totalIncrease.toFixed(2)}%
                                        </div>
                                        <p className="text-xs text-slate-400">{t('calculators.totalAdjustment')}</p>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <p className="text-xs font-semibold text-slate-500 mb-3 uppercase">{t('calculators.breakdown')}</p>
                                    <div className="space-y-2">
                                        {ipcResult.breakdown.map((item, idx) => (
                                            <div key={idx} className="flex justify-between text-sm border-b border-slate-100 pb-1 last:border-0 last:pb-0">
                                                <span className="text-slate-600">{new Date(item.date).toLocaleDateString(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' })}</span>
                                                <span className="font-medium font-mono text-slate-800">{item.rate}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. MANUAL CALCULATOR (Existing) */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                            <Calculator size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">{t('calculators.rentProjection')}</h3>
                    </div>

                    <div className="p-6 space-y-8 flex-1 flex flex-col">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('calculators.currentRent')}</label>
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
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('calculators.increasePercent')}</label>
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

                        <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 flex items-center justify-between mt-auto">
                            <div className="space-y-1">
                                <p className="text-xs uppercase font-bold text-slate-400">{t('calculators.current')}</p>
                                <p className="text-2xl font-bold text-slate-700">{formatCurrency(currentRent)}</p>
                            </div>

                            <ArrowRight className="text-slate-300" size={32} />

                            <div className="space-y-1 text-right">
                                <p className="text-xs uppercase font-bold text-emerald-600">{t('calculators.future')}</p>
                                <p className="text-3xl font-bold text-emerald-600">{formatCurrency(futureRent)}</p>
                                <p className="text-xs font-semibold text-emerald-500">+{formatCurrency(difference)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
