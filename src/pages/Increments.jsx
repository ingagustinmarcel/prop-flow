import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { TrendingUp, CalendarClock, ArrowRight, Mail } from 'lucide-react';
import { addMonths, parseISO, format, differenceInDays } from 'date-fns';
import { formatCurrency, cn } from '../lib/utils';
import { useTranslation } from 'react-i18next';
import EmailPreviewModal from '../components/EmailPreviewModal';

export default function Increments() {
    const { units } = useData();
    const { t, i18n } = useTranslation();
    const [emailModal, setEmailModal] = useState({ isOpen: false, unit: null, data: null });

    const getIncrementDetails = (unit) => {
        const lastIncDate = parseISO(unit.lastIncrementDate || unit.leaseStart);
        const nextIncDate = addMonths(lastIncDate, 4);
        const daysRemaining = differenceInDays(nextIncDate, new Date());

        const increaseFactor = 1 + (unit.incrementPercentage / 100);
        const projectedRent = Math.round(unit.rent * increaseFactor);
        const increaseAmount = projectedRent - unit.rent;

        return {
            lastIncDate,
            nextIncDate,
            daysRemaining,
            projectedRent,
            increaseAmount
        };
    };

    const handleNotify = (unit, details) => {
        const increaseAmountFormatted = formatCurrency(details.increaseAmount);
        const newRentFormatted = formatCurrency(details.projectedRent);
        const currentRentFormatted = formatCurrency(unit.rent);
        const nextDateFormatted = format(details.nextIncDate, 'MMMM d, yyyy');

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
        <div className="space-y-8 animate-in fade-in duration-500">
            <header>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{t('increments.title')}</h1>
                <p className="text-slate-500 mt-2">{t('increments.subtitle')}</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {units.map(unit => {
                    const details = getIncrementDetails(unit);
                    const { nextIncDate, daysRemaining, projectedRent, increaseAmount } = details;

                    return (
                        <div key={unit.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden relative group hover:shadow-md transition-all">
                            {/* Header */}
                            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">{unit.name}</h3>
                                    <p className="text-xs text-slate-500">{unit.tenant || 'Vacant'}</p>
                                </div>
                                <div className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-bold">
                                    {unit.incrementPercentage}% {t('increments.increase')}
                                </div>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Timeline Visual */}
                                <div className="flex items-center justify-between text-sm">
                                    <div className="space-y-1">
                                        <p className="text-xs text-slate-400 font-semibold uppercase">{t('increments.currentRent')}</p>
                                        <p className="text-xl font-bold text-slate-700">{formatCurrency(unit.rent)}</p>
                                    </div>
                                    <ArrowRight className="text-slate-300" />
                                    <div className="space-y-1 text-right">
                                        <p className="text-xs text-emerald-600 font-bold uppercase">{t('increments.nextRent')}</p>
                                        <p className="text-xl font-bold text-emerald-600">{formatCurrency(projectedRent)}</p>
                                        <p className="text-xs text-emerald-500">+{formatCurrency(increaseAmount)}/{t('increments.mo')}</p>
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
                                            {nextIncDate.toLocaleDateString(i18n.language, { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </p>
                                        <p className={cn("text-xs mt-0.5", daysRemaining <= 30 ? "text-amber-600 font-bold" : "text-slate-400")}>
                                            {daysRemaining < 0 ? t('increments.overdue') : t('increments.inDays', { days: daysRemaining })}
                                        </p>
                                    </div>
                                </div>

                                {/* Notification Button logic */}
                                {daysRemaining <= 60 && (
                                    unit.tenantEmail ? (
                                        <button
                                            onClick={() => handleNotify(unit, details)}
                                            className="w-full flex items-center justify-center gap-2 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-sm font-bold transition-colors"
                                        >
                                            <Mail size={16} />
                                            {t('increments.notifyTenant')}
                                        </button>
                                    ) : (
                                        <div className="w-full py-2 bg-slate-50 text-slate-400 rounded-lg text-xs text-center border border-slate-100 flex flex-col items-center gap-1">
                                            <span className="font-semibold">{t('increments.notifyTenant')}</span>
                                            <span className="italic text-[10px]">{t('increments.missingEmail')}</span>
                                        </div>
                                    )
                                )}
                            </div>

                            {/* Decorative progress bar at bottom */}
                            <div className="h-1 bg-slate-100 w-full">
                                <div
                                    className="h-full bg-emerald-500 transition-all duration-1000"
                                    style={{ width: `${Math.max(0, Math.min(100, ((120 - daysRemaining) / 120) * 100))}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-700 flex gap-3 items-start">
                <TrendingUp className="shrink-0 mt-0.5" size={18} />
                <p>{t('increments.automationNote')}</p>
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
