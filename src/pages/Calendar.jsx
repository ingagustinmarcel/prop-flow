import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useData } from '../context/DataContext';
import { cn } from '../lib/utils';
import { ChevronRight, ChevronLeft, Download } from 'lucide-react';
import { generateReceipt } from '../lib/receiptService';

const MONTHS = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export default function CalendarPage() {
    const { t } = useTranslation();
    const { units, payments, markPaid } = useData();
    const [year, setYear] = useState(new Date().getFullYear());

    const getPaymentStatus = (payment, unit) => {
        if (!payment) return 'bg-slate-50 border-dashed border-slate-300';

        const day = new Date(payment.datePaid).getDate();
        if (day <= 10) return 'bg-green-100 text-green-700 border-green-200';
        if (day <= 20) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
        return 'bg-red-100 text-red-700 border-red-200';
    };

    const handleCellClick = (unitId, monthIndex) => {
        const monthStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
        const existing = payments.find(p => p.unitId === unitId && p.forMonth === monthStr);

        if (!existing) {
            const date = window.prompt(`Enter payment date for ${monthStr} (YYYY-MM-DD):`, new Date().toISOString().split('T')[0]);
            if (date) {
                markPaid(unitId, monthStr, date);
            }
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 overflow-x-auto">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{t('calendar.title')}</h1>
                    <p className="text-slate-500 mt-2">{t('calendar.subtitle')}</p>
                </div>
                <div className="flex items-center gap-4 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                    <button onClick={() => setYear(y => y - 1)} className="p-2 hover:bg-slate-50 rounded-full"><ChevronLeft size={20} /></button>
                    <span className="font-bold text-xl w-20 text-center">{year}</span>
                    <button onClick={() => setYear(y => y + 1)} className="p-2 hover:bg-slate-50 rounded-full"><ChevronRight size={20} /></button>
                </div>
            </header>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-w-[1000px]">
                {/* Header Row */}
                <div className="grid grid-cols-[200px_repeat(12,1fr)] bg-slate-50 border-b border-slate-200">
                    <div className="p-4 font-bold text-slate-700">{t('calendar.unit')}</div>
                    {MONTHS.map(m => (
                        <div key={m} className="p-4 font-semibold text-slate-500 text-center text-sm border-l border-slate-200">{m}</div>
                    ))}
                </div>

                {/* Rows */}
                <div className="divide-y divide-slate-100">
                    {units.map(unit => (
                        <div key={unit.id} className="grid grid-cols-[200px_repeat(12,1fr)] hover:bg-slate-50/50 transition-colors">
                            <div className="p-4 font-medium text-slate-900 flex flex-col justify-center">
                                <span>{unit.name}</span>
                                <span className="text-xs text-slate-400">{unit.tenant}</span>
                            </div>
                            {MONTHS.map((_, idx) => {
                                const monthStr = `${year}-${String(idx + 1).padStart(2, '0')}`;
                                const payment = payments.find(p => p.unitId === unit.id && p.forMonth === monthStr);
                                const statusClass = getPaymentStatus(payment, unit);
                                const dayPaid = payment ? new Date(payment.datePaid).getDate() : null;

                                return (
                                    <div
                                        key={idx}
                                        className="p-2 border-l border-slate-100 relative group cursor-pointer"
                                        onClick={() => handleCellClick(unit.id, idx)}
                                    >
                                        <div className={cn("w-full h-full rounded-md flex items-center justify-center text-xs font-bold transition-all border relative", statusClass)}>
                                            {dayPaid ? (
                                                <>
                                                    <span className="flex flex-col items-center">
                                                        <span>{dayPaid}</span>
                                                        <span className="text-[10px] font-normal opacity-75">{t('overview.paid')}</span>
                                                    </span>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            generateReceipt(payment, unit);
                                                        }}
                                                        className="absolute -top-1 -right-1 bg-white text-emerald-600 rounded-full p-0.5 border border-emerald-200 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                                                        title={t('calendar.downloadReceipt')}
                                                    >
                                                        <Download size={10} />
                                                    </button>
                                                </>
                                            ) : (
                                                <span className="opacity-0 group-hover:opacity-100 text-slate-400">-</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {/* Legend */}
            <div className="flex gap-6 justify-end text-sm text-slate-600">
                <div className="flex items-center gap-2"><div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div> {t('calendar.onTime')}</div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 bg-yellow-100 border border-yellow-200 rounded"></div> {t('calendar.late')}</div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div> {t('calendar.severe')}</div>
            </div>
        </div>
    );
}
