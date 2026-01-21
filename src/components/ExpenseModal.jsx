import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import { DollarSign, Calendar, FileText, Tag } from 'lucide-react';

export default function ExpenseModal({ isOpen, onClose, unitId, unitName, onSave }) {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        category: 'maintenance',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.amount || !formData.date) {
            alert('Please fill in all required fields');
            return;
        }

        onSave({
            ...formData,
            unitId,
            amount: parseFloat(formData.amount)
        });

        // Reset form
        setFormData({
            category: 'maintenance',
            amount: '',
            date: new Date().toISOString().split('T')[0],
            description: ''
        });
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`${t('expenses.addExpense')} - ${unitName}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Category */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        <Tag size={16} className="inline mr-1" />
                        {t('expenses.category')}
                    </label>
                    <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        required
                    >
                        <option value="maintenance">{t('expenses.categories.maintenance')}</option>
                        <option value="utilities">{t('expenses.categories.utilities')}</option>
                        <option value="taxes">{t('expenses.categories.taxes')}</option>
                        <option value="insurance">{t('expenses.categories.insurance')}</option>
                        <option value="other">{t('expenses.categories.other')}</option>
                    </select>
                </div>

                {/* Amount */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        <DollarSign size={16} className="inline mr-1" />
                        {t('expenses.amount')}
                    </label>
                    <input
                        type="number"
                        name="amount"
                        value={formData.amount}
                        onChange={handleChange}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        required
                    />
                </div>

                {/* Date */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        <Calendar size={16} className="inline mr-1" />
                        {t('expenses.date')}
                    </label>
                    <input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        required
                    />
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        <FileText size={16} className="inline mr-1" />
                        {t('expenses.description')}
                    </label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="3"
                        placeholder="Optional notes..."
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                    />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        {t('expenses.cancel')}
                    </button>
                    <button
                        type="submit"
                        className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                    >
                        {t('expenses.save')}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
