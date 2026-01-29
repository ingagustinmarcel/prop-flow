import React, { useState, useEffect } from 'react';
import { DollarSign, RefreshCw, AlertCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { useTranslation } from 'react-i18next';
import { fetchIPCData } from '../lib/indec';
import { fetchArquilerData } from '../lib/arquiler';

// Sub-component for Accordion Row
const UpdateRow = ({ update }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <React.Fragment>
            {/* Main Row */}
            <tr
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "cursor-pointer transition-colors border-b border-slate-100",
                    isOpen ? "bg-indigo-50/50" : "hover:bg-slate-50"
                )}
            >
                <td className="py-4 px-4 text-slate-700 font-medium">
                    Cuatr. {update.periodIndex}
                </td>
                <td className="py-4 px-4 text-slate-600">
                    {new Date(update.date).toLocaleDateString(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' })}
                </td>
                <td className="py-4 px-4 text-emerald-600 font-bold">
                    {update.increasePercent}%
                </td>
                <td className="py-4 px-4 font-bold text-slate-900">
                    {formatCurrency(update.newRent)}
                </td>
                <td className="py-4 px-4 text-right text-slate-400">
                    {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </td>
            </tr>

            {/* Expanded Detail Row */}
            {isOpen && (
                <tr>
                    <td colSpan={5} className="p-0 border-b border-slate-100 bg-slate-50/50">
                        <div className="p-4 animate-in slide-in-from-top-1 duration-200">
                            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden text-sm shadow-sm">
                                <div className="grid grid-cols-3 bg-slate-100 border-b border-slate-200 p-2 font-semibold text-slate-600 text-xs uppercase tracking-wide">
                                    <div className="pl-2">Mes</div>
                                    <div className="text-right">Índice Mensual</div>
                                    <div className="text-right pr-2">Acumulado</div>
                                </div>
                                <div className="divide-y divide-slate-100">
                                    {update.details.map((detail, idx) => (
                                        <div key={idx} className="grid grid-cols-3 p-2 hover:bg-slate-50">
                                            <div className="pl-2 text-slate-700 capitalize font-medium">
                                                {new Date(detail.date).toLocaleDateString(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' })}
                                            </div>
                                            <div className="text-right text-slate-600 font-mono">
                                                {(detail.value * 100).toFixed(2)}%
                                            </div>
                                            <div className="text-right pr-2 text-indigo-600 font-mono font-bold">
                                                {(detail.accumulated * 100).toFixed(2)}%
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="bg-slate-50 p-2 text-[10px] text-slate-400 text-center border-t border-slate-100 italic">
                                    * Valores acumulativos usados para este ajuste
                                </div>
                            </div>
                        </div>
                    </td>
                </tr>
            )}
        </React.Fragment>
    );
};

export default function Calculators() {
    const { t } = useTranslation();

    // --- State ---
    const [arquilerData, setArquilerData] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState(''); // Contract Start Date
    const [ipcHistory, setIpcHistory] = useState([]);

    // Inputs
    const [rentBase, setRentBase] = useState(1000);
    const [updateFrequency, setUpdateFrequency] = useState(3); // Default 3 months (Cuatrimestral usually is 4, but common is 3/4/6)

    // Results
    const [updatesList, setUpdatesList] = useState([]);
    const [loadingIndices, setLoadingIndices] = useState(false);
    const [error, setError] = useState(null);

    // Fetch Data on Mount
    useEffect(() => {
        const load = async () => {
            setLoadingIndices(true);
            try {
                const data = await fetchArquilerData();
                setArquilerData(data);

                try {
                    const history = await fetchIPCData();
                    setIpcHistory(history);
                } catch (e) { console.warn("IPC History fetch failed", e); }
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
        setError(null);
        setUpdatesList([]);
        if (!selectedMonth) return;

        // 1. Prepare Data sort Ascending
        const historyAsc = [...ipcHistory].sort((a, b) => new Date(a.date) - new Date(b.date));

        if (historyAsc.length === 0) {
            setError("Cargando datos. Intente nuevamente.");
            return;
        }

        const latestDataDate = new Date(historyAsc[historyAsc.length - 1].date);
        const startDate = new Date(selectedMonth);

        if (startDate > latestDataDate) {
            setError(`La fecha de inicio (${selectedMonth}) es posterior al último dato disponible.`);
            return;
        }

        let currentRent = rentBase;
        let currentDateToCheck = new Date(startDate);
        currentDateToCheck.setMonth(currentDateToCheck.getMonth() + updateFrequency);

        const results = [];
        const today = new Date();
        let loopCount = 0;

        while (currentDateToCheck <= today && loopCount < 50) {
            loopCount++;

            const periodStart = new Date(currentDateToCheck);
            periodStart.setMonth(periodStart.getMonth() - updateFrequency);
            const pStartStr = periodStart.toISOString().slice(0, 7);

            const startIndex = historyAsc.findIndex(h => h.date.startsWith(pStartStr));

            if (startIndex === -1 || startIndex + updateFrequency > historyAsc.length) {
                break; // Break if no data
            }

            const relevantMonths = historyAsc.slice(startIndex, startIndex + updateFrequency);

            // Calculate Accumulation & Details
            let accumulatedFactor = 1.0;
            const details = relevantMonths.map(m => {
                accumulatedFactor *= (1 + m.value);
                return {
                    date: m.date,
                    value: m.value,
                    accumulated: accumulatedFactor - 1
                };
            });

            const newRent = Math.round(currentRent * accumulatedFactor);
            const increasePercent = (accumulatedFactor - 1) * 100;
            const diff = newRent - currentRent;

            results.push({
                periodIndex: loopCount,
                date: currentDateToCheck.toISOString().split('T')[0],
                oldRent: currentRent,
                newRent: newRent,
                increasePercent: increasePercent.toFixed(2),
                diff: diff,
                details: details
            });

            currentRent = newRent;
            currentDateToCheck.setMonth(currentDateToCheck.getMonth() + updateFrequency); // Next period
        }

        if (results.length === 0) {
            setError("No se completó ningún período de actualización con datos disponibles.");
        } else {
            setUpdatesList(results);
        }
    };

    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-12">
            <header>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">{t('calculators.title')}</h1>
                <p className="text-sm md:text-base text-slate-500 mt-1 md:mt-2">{t('calculators.subtitle')}</p>
            </header>

            <div className="max-w-4xl mx-auto">
                {/* AUTO IPC CALCULATOR */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-slate-50 flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                            <RefreshCw size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">{t('calculators.ipcTitle') || "Calculadora de Alquiler"}</h3>
                            <p className="text-xs text-indigo-600 font-bold uppercase tracking-wider">IPC Acumulado</p>
                        </div>
                    </div>

                    <div className="p-8 space-y-8">

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Initial Rent */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Valor Inicial</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                        <DollarSign size={18} />
                                    </div>
                                    <input
                                        type="number"
                                        value={rentBase}
                                        onChange={(e) => setRentBase(Number(e.target.value))}
                                        className="pl-10 w-full rounded-lg border border-slate-300 py-3 text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder-slate-300"
                                        placeholder="Ej: 100.000"
                                    />
                                </div>
                            </div>

                            {/* Start Date */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Inicio Contrato</label>
                                <input
                                    type="date"
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 py-3 px-3 text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none bg-white transition-all cursor-pointer"
                                />
                            </div>

                            {/* Frequency Dropdown */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Frecuencia</label>
                                <div className="relative">
                                    <select
                                        value={updateFrequency}
                                        onChange={(e) => setUpdateFrequency(Number(e.target.value))}
                                        className="w-full rounded-lg border border-slate-300 py-3 px-3 text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none bg-white cursor-pointer appearance-none"
                                    >
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => (
                                            <option key={num} value={num}>
                                                {num} {num === 1 ? 'Mes' : 'Meses'}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-500">
                                        <ChevronDown size={16} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleCalculateIndex}
                            disabled={loadingIndices}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg py-4 rounded-xl shadow-lg shadow-indigo-200 active:scale-[0.99] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <RefreshCw size={20} className={loadingIndices ? "animate-spin" : ""} />
                            Calcular Actualización
                        </button>

                        {error && (
                            <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg flex items-center gap-2 font-medium">
                                <AlertCircle size={18} />
                                {error}
                            </div>
                        )}
                    </div>

                    {updatesList.length > 0 && (
                        <div className="border-t border-slate-200">
                            <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex justify-between items-center">
                                <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                                    Resultados
                                </h4>
                                <span className="text-xs font-semibold text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">
                                    {updatesList.length} Ajustes Encontrados
                                </span>
                            </div>

                            <table className="w-full text-left border-collapse">
                                <thead className="bg-white text-slate-500 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
                                    <tr>
                                        <th className="py-4 px-4 font-bold text-indigo-900/80">Periodo</th>
                                        <th className="py-4 px-4">Fecha Ajuste</th>
                                        <th className="py-4 px-4">Aumento %</th>
                                        <th className="py-4 px-4">Nuevo Valor</th>
                                        <th className="py-4 px-4 text-right">Detalle</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {updatesList.map((update, idx) => (
                                        <UpdateRow key={idx} update={update} />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
                <p className="text-xs text-center text-slate-400 mt-6 max-w-lg mx-auto leading-relaxed">
                    Los cálculos utilizan el Índice de Precios al Consumidor (IPC) publicado por el INDEC.
                    Los valores son orientativos y deben ser verificados antes de su aplicación contractual.
                </p>
            </div>
        </div>
    );
}
