import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useData } from '../context/DataContext';
import { cn } from '../lib/utils';
import { ChevronRight, ChevronLeft, Download } from 'lucide-react';
import { generateReceipt } from '../lib/receiptService';

const MONTHS = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

import Modal from '../components/Modal';

export default function CalendarPage() {
    const { t } = useTranslation();
    const { units, payments, markPaid, updatePayment, deletePayment } = useData();
    const [year, setYear] = useState(new Date().getFullYear());

    const getPaymentStatus = (payment, unit) => {
        if (!payment) return 'bg-slate-50 border-dashed border-slate-300';

        const day = parseInt(payment.datePaid.split('-')[2], 10);
        if (day <= 10) return 'bg-green-100 text-green-700 border-green-200';
        if (day <= 20) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
        return 'bg-red-100 text-red-700 border-red-200';
    };

    // State for Payment Edit Modal
    const [editPayment, setEditPayment] = useState(null); // { payment: object, unit: object }
    const [newDate, setNewDate] = useState('');

    const handleCellClick = (unitId, monthIndex) => {
        const monthStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
        const existing = payments.find(p => p.unitId === unitId && p.forMonth === monthStr);
        const unit = units.find(u => u.id === unitId);

        if (existing) {
            // Open Edit Modal
            setEditPayment({ payment: existing, unit });
            setNewDate(existing.datePaid);
        } else {
            // New Payment Flow
            const date = window.prompt(`Enter payment date for ${monthStr} (YYYY-MM-DD):`, new Date().toISOString().split('T')[0]);
            if (date) {
                markPaid(unitId, monthStr, date);
            }
        }
    };

    const handleUpdatePayment = async () => {
        if (!editPayment?.payment || !newDate) return;
        await updatePayment(editPayment.payment.id, { datePaid: newDate, amount: editPayment.unit.rent });
        setEditPayment(null);
    };

    const handleDeletePayment = async () => {
        if (!editPayment?.payment) return;
        if (window.confirm("Are you sure you want to delete this payment record? This action cannot be undone.")) {
            await deletePayment(editPayment.payment.id);
            setEditPayment(null);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 overflow-x-auto pb-12">
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
                                const dayPaid = payment ? parseInt(payment.datePaid.split('-')[2], 10) : null;

                                return (
                                    <div
                                        key={idx}
                                        className="p-2 border-l border-slate-100 relative group cursor-pointer"
                                        onClick={() => handleCellClick(unit.id, idx)}
                                    >
                                        <div className={cn("w-full h-full rounded-md flex items-center justify-center text-xs font-bold transition-all border relative", statusClass)}>
                                            {dayPaid ? (
                                                <span className="flex flex-col items-center">
                                                    <span>{dayPaid}</span>
                                                    <span className="text-[10px] font-normal opacity-75">{t('overview.paid')}</span>
                                                </span>
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

            {/* Edit Payment Modal */}
            <Modal
                isOpen={!!editPayment}
                onClose={() => setEditPayment(null)}
                title={`Manage Payment: ${editPayment?.unit?.name}`}
            >
                <div className="space-y-4">
                    <p className="text-sm text-slate-500">
                        Payment recorded for <strong>{editPayment?.payment?.forMonth}</strong>
                    </p>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Date Paid</label>
                        <input
                            type="date"
                            value={newDate}
                            onChange={(e) => setNewDate(e.target.value)}
                            className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                        />
                    </div>


                    <div className="flex gap-3 justify-end pt-4">
                        <button
                            onClick={() => {
                                generateReceipt(editPayment.payment, editPayment.unit);
                            }}
                            className="flex-1 mr-auto flex items-center gap-2 text-slate-600 hover:text-slate-800 text-sm font-semibold"
                        >
                            <Download size={16} />
                            Receipt
                        </button>

                        <button
                            onClick={handleDeletePayment}
                            className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-bold transition-colors"
                        >
                            Delete
                        </button>
                        <button
                            onClick={handleUpdatePayment}
                            className="px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg text-sm font-bold shadow-sm transition-colors"
                        >
                            Save Changes
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
