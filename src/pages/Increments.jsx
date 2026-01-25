import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { TrendingUp, CalendarClock, ArrowRight, Mail, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { addMonths, parseISO, format, differenceInDays } from 'date-fns';
import { formatCurrency, cn } from '../lib/utils';
import { useTranslation } from 'react-i18next';
import EmailPreviewModal from '../components/EmailPreviewModal';
import { fetchIPCData } from '../lib/indec';
import { calculateNextRent, calculateFullSchedule } from '../lib/rentCalculator';

export default function Increments() {
    const { units } = useData();
    const { t, i18n } = useTranslation();
    const [emailModal, setEmailModal] = useState({ isOpen: false, unit: null, data: null });
    const [ipcHistory, setIpcHistory] = useState([]);
    const [loadingIpc, setLoadingIpc] = useState(true);

    // State to toggle schedule visibility per unit
    const [expandedUnits, setExpandedUnits] = useState({});

    const toggleExpand = (unitId) => {
        setExpandedUnits(prev => ({ ...prev, [unitId]: !prev[unitId] }));
    };

    useEffect(() => {
        const loadIpc = async () => {
            try {
                const data = await fetchIPCData();
                setIpcHistory(data);
            } catch (e) {
                console.error("Failed to load IPC for increments", e);
            } finally {
                setLoadingIpc(false);
            }
        };
        loadIpc();
    }, []);

    const getIncrementDetails = (unit) => {
        if (!ipcHistory || ipcHistory.length === 0) return null; // Or fallback logic

        const nextUpdate = calculateNextRent(unit, ipcHistory, 4);
        const schedule = calculateFullSchedule(unit, ipcHistory, 4);

        if (!nextUpdate) return null;

        return {
            ...nextUpdate,
            schedule,
            lastIncDate: parseISO(unit.lastIncrementDate || unit.leaseStart),
            daysRemaining: differenceInDays(nextUpdate.nextDate, new Date())
        };
    };

    const handleNotify = (unit, details) => {
        const increaseAmountFormatted = formatCurrency(details.increaseAmount);
        const newRentFormatted = formatCurrency(details.newRent);
        const currentRentFormatted = formatCurrency(unit.rent);
        const nextDateFormatted = format(details.nextDate, 'MMMM d, yyyy');

        const subject = t('email.templateSubject', { unitName: unit.name });
        const body = t('email.templateBody', {
            tenantName: unit.tenant || 'Tenant',
            unitName: unit.name,
            newDate: nextDateFormatted,
            oldRent: currentRentFormatted,
            newRent: newRentFormatted,
            increaseAmount: increaseAmountFormatted
        });

        setEmailModal({
            isOpen: true,
            unit,
            data: {
                recipient: unit.tenantEmail,
                subject,
                body
            }
        });
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-12">
            <header>
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{t('increments.title')}</h1>
                        <p className="text-slate-500 mt-2">{t('increments.subtitle')}</p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {units.map(unit => {
                    const details = getIncrementDetails(unit);
                    if (!details) return null;

                    const { nextDate, daysRemaining, newRent, increaseAmount, isProjected, schedule } = details;
                    const isExpanded = expandedUnits[unit.id];

                    return (
                        <div key={unit.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
                            {/* Header */}
                            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">{unit.name}</h3>
                                    <p className="text-xs text-slate-500">{unit.tenant || 'Vacant'}</p>
                                </div>
                                <div className={cn("px-2 py-1 rounded text-xs font-bold flex items-center gap-1", isProjected ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700")}>
                                    {isProjected ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
                                    Próximo: {details.percentChange}%
                                </div>
                            </div>

                            <div className="p-6 space-y-6 flex-1">
                                {/* Next Update Highlight */}
                                <div className="flex items-center justify-between text-sm">
                                    <div className="space-y-1">
                                        <p className="text-xs text-slate-400 font-semibold uppercase">{t('increments.currentRent')}</p>
                                        <p className="text-xl font-bold text-slate-700">{formatCurrency(unit.rent)}</p>
                                    </div>
                                    <ArrowRight className="text-slate-300" />
                                    <div className="space-y-1 text-right">
                                        <p className="text-xs text-emerald-600 font-bold uppercase">{t('increments.nextRent')}</p>
                                        <p className="text-xl font-bold text-emerald-600">{formatCurrency(newRent)}</p>
                                        <p className="text-xs text-emerald-500">+{formatCurrency(increaseAmount)}</p>
                                    </div>
                                </div>

                                {/* Countdown */}
                                <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 flex items-center gap-4">
                                    <div className={cn("p-3 rounded-full", daysRemaining <= 30 ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600")}>
                                        <CalendarClock size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 font-medium">{t('increments.nextIncrement')}</p>
                                        <p className="text-sm font-bold text-slate-800 capitalize">
                                            {nextDate.toLocaleDateString(i18n.language, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}
                                        </p>
                                        <p className={cn("text-xs mt-0.5", daysRemaining <= 30 ? "text-amber-600 font-bold" : "text-slate-400")}>
                                            {daysRemaining < 0 ? t('increments.overdue') : t('increments.inDays', { days: daysRemaining })}
                                        </p>
                                    </div>
                                </div>

                                {/* Actions */}
                                {/* Actions */}
                                <div className="mt-auto">
                                    {unit.tenantEmail ? (
                                        <button
                                            onClick={() => handleNotify(unit, details)}
                                            className="w-full flex items-center justify-center gap-2 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-sm font-bold transition-colors"
                                        >
                                            <Mail size={16} />
                                            {t('increments.notifyTenant')}
                                        </button>
                                    ) : (
                                        <button
                                            disabled
                                            className="w-full flex items-center justify-center gap-2 py-2 bg-slate-50 text-slate-400 rounded-lg text-sm font-bold cursor-not-allowed border border-slate-100"
                                            title="Configure tenant email in Units page"
                                        >
                                            <Mail size={16} />
                                            {t('increments.noEmailConfigured') || "Falta Email"}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Schedule List (One below the other) */}
                            <div className="border-t border-slate-100 bg-slate-50/30">
                                <button
                                    onClick={() => toggleExpand(unit.id)}
                                    className="w-full flex items-center justify-between p-4 text-xs font-bold text-slate-500 uppercase tracking-wide hover:bg-slate-50 transition-colors"
                                >
                                    <span>Cronograma del Contrato</span>
                                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>

                                {isExpanded && (
                                    <div className="px-4 pb-4 animate-in slide-in-from-top-1 duration-200">
                                        <div className="space-y-2">
                                            {schedule.map((item, idx) => (
                                                <div key={idx} className="flex justify-between items-center text-sm p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-700 capitalize">
                                                            {new Date(item.date).toLocaleDateString(i18n.language, { month: 'long', year: 'numeric', timeZone: 'UTC' })}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 uppercase font-semibold">
                                                            {item.isProjected ? "Proyectado (Est.)" : "Calculado (IPC Real)"}
                                                        </span>
                                                    </div>
                                                    <div className="text-right">
                                                        {item.status === 'completed' || item.newRent === 0 ? (
                                                            <div className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">
                                                                COMPLETADO
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <div className="font-mono font-bold text-slate-900">{formatCurrency(item.newRent)}</div>
                                                                <div className={cn("text-xs font-semibold", item.isProjected ? "text-amber-600" : "text-emerald-600")}>
                                                                    +{item.percentChange}%
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            {schedule.length === 0 && (
                                                <p className="text-xs text-center text-slate-400 py-2">Fin del contrato alcanzado.</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                        </div>
                    );
                })}
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-700 flex gap-3 items-start">
                <TrendingUp className="shrink-0 mt-0.5" size={18} />
                <p>
                    {t('increments.automationNote') || "Los aumentos se calculan automáticamente basándose en IPC acumulado cada 4 meses. Los valores futuros son proyecciones usando el último índice conocido."}
                </p>
            </div>

            {/* Email Preview Modal */}
            {emailModal.data && (
                <EmailPreviewModal
                    isOpen={emailModal.isOpen}
                    onClose={() => setEmailModal({ ...emailModal, isOpen: false })}
                    recipient={emailModal.data.recipient}
                    subject={emailModal.data.subject}
                    body={emailModal.data.body}
                />
            )}
        </div>
    );
}
