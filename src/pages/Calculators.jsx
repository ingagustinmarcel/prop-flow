import React, { useState, useEffect } from 'react';
import { DollarSign, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { useTranslation } from 'react-i18next';
import { fetchIPCData } from '../lib/indec';
import { fetchArquilerData, getAvailableIndices } from '../lib/arquiler';

export default function Calculators() {
    const { t } = useTranslation();

    // --- Auto IPC/Index Calculator State ---
    const [indexType, setIndexType] = useState('ipc'); // Forced to IPC
    const [arquilerData, setArquilerData] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState('');
    const [ipcHistory, setIpcHistory] = useState([]); // Store Indec History

    // Auto Calc Inputs
    const [rentBase, setRentBase] = useState(1000);
    const [calculationResult, setCalculationResult] = useState(null);
    const [loadingIndices, setLoadingIndices] = useState(false);
    const [error, setError] = useState(null);

    // Fetch Data on Mount
    useEffect(() => {
        const load = async () => {
            setLoadingIndices(true);
            try {
                // Fetch Calculator Data (Arquiler)
                const data = await fetchArquilerData();
                setArquilerData(data);

                // Fetch Historical List (Indec)
                try {
                    const history = await fetchIPCData();
                    setIpcHistory(history);
                } catch (e) {
                    console.warn("IPC History fetch failed", e);
                }

                // Set default month if available (Prefer 'ipc')
                if (data && data.ipc && data.ipc.length > 0) {
                    setSelectedMonth(data.ipc[0].date);
                }
            } catch (err) {
                console.error("Error loading data", err);
                setError(t('calculators.errorFetch'));
            } finally {
                setLoadingIndices(false);
            }
        };
        load();
    }, []);

    const handleCalculateIndex = () => {
        if (!arquilerData || !selectedMonth) return;

        const rates = arquilerData[indexType];
        const monthData = rates.find(r => r.date === selectedMonth);

        if (!monthData) {
            setError(t('calculators.errorNoData'));
            return;
        }

        const rate = monthData.annual_var;
        const newRent = rentBase * (1 + (rate / 100));

        setCalculationResult({
            newRent,
            increasePercent: rate,
            date: selectedMonth
        });
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{t('calculators.title')}</h1>
                <p className="text-slate-500 mt-2">{t('calculators.subtitle')}</p>
            </header>

            <div className="max-w-3xl mx-auto">
                {/* 1. AUTO IPC CALCULATOR */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-slate-50 flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                            <RefreshCw size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">{t('calculators.ipcTitle') || "IPC Calculator"}</h3>
                            <p className="text-xs text-indigo-600 font-medium">✨ Powered by Arquiler.com</p>
                        </div>
                    </div>

                    <div className="p-6 space-y-6 flex-1 flex flex-col">
                        <p className="text-sm text-slate-500">
                            {t('calculators.ipcDescription') || "Calculate rent adjustments using INDEC's IPC (Consumer Price Index)."}
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
                                        value={rentBase}
                                        onChange={(e) => setRentBase(Number(e.target.value))}
                                        className="pl-9 w-full rounded-lg border border-slate-300 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            {/* Month Selector */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Adjustment Date</label>
                                {loadingIndices ? (
                                    <div className="flex items-center gap-2 text-sm text-slate-500 py-2.5">
                                        <Loader2 className="animate-spin" size={16} /> Loading data...
                                    </div>
                                ) : (
                                    <select
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(e.target.value)}
                                        className="w-full rounded-lg border border-slate-300 py-2.5 px-3 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                    >
                                        {arquilerData && arquilerData[indexType]?.map(item => (
                                            <option key={item.date} value={item.date}>
                                                {new Date(item.date).toLocaleDateString(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' })}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            <button
                                onClick={handleCalculateIndex}
                                disabled={loadingIndices || !arquilerData}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                <RefreshCw size={18} />
                                Calculate new Rent
                            </button>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        )}

                        {calculationResult && (
                            <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-2 duration-300">
                                <div className="p-4 bg-white border-b border-slate-200 flex justify-between items-center">
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">{t('calculators.newRent')}</p>
                                        <p className="text-2xl font-bold text-slate-900">{formatCurrency(calculationResult.newRent)}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs font-bold inline-block mb-1">
                                            +{calculationResult.increasePercent}%
                                        </div>
                                        <p className="text-xs text-slate-400">Annual Increase</p>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <p className="text-xs text-slate-500">
                                        Based on <strong>{getAvailableIndices().find(i => i.id === indexType)?.name}</strong> for
                                        <strong> {new Date(calculationResult.date).toLocaleDateString(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' })}</strong>.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* IPC History List */}
                    <div className="border-t border-slate-100 bg-slate-50 p-5">
                        <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                            Last 12 Months (IPC)
                        </h4>
                        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="py-2 px-3 text-left font-medium text-slate-500">Month</th>
                                        <th className="py-2 px-3 text-right font-medium text-slate-500">Monthly %</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {ipcHistory.slice(0, 12).map((item, i) => (
                                        <tr key={i} className="hover:bg-slate-50/50">
                                            <td className="py-2 px-3 text-slate-700 capitalize">
                                                {new Date(item.date).toLocaleDateString(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' })}
                                            </td>
                                            <td className="py-2 px-3 text-right font-mono font-medium text-slate-900">
                                                {/* item.value is decimal 0.042 -> 4.2% */}
                                                {(item.value * 100).toFixed(1)}%
                                            </td>
                                        </tr>
                                    ))}
                                    {ipcHistory.length === 0 && (
                                        <tr>
                                            <td colSpan={2} className="py-4 text-center text-slate-400 text-xs">
                                                Loading historical data...
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2 text-right">Source: INDEC (Datos.Gob.Ar) / Fallback</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
