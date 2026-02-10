import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import { User, DollarSign, Calendar } from 'lucide-react';

export default function LeaseModal({ isOpen, onClose, unitId, unitName, onSave, mode = 'add', lease = null }) {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        tenantName: '',
        rentAmount: '',
        securityDeposit: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
    });

    // Pre-populate form when editing
    useEffect(() => {
        if (mode === 'edit' && lease) {
            setFormData({
                tenantName: lease.tenantName || '',
                rentAmount: lease.rentAmount?.toString() || '',
                securityDeposit: lease.securityDeposit?.toString() || '',
                startDate: lease.startDate || new Date().toISOString().split('T')[0],
                endDate: lease.endDate || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
            });
        } else if (mode === 'add') {
            // Reset form for add mode
            setFormData({
                tenantName: '',
                rentAmount: '',
                securityDeposit: '',
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
            });
        }
    }, [mode, lease, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.tenantName || !formData.rentAmount || !formData.startDate) {
            alert('Please fill in all required fields');
            return;
        }

        const payload = {
            ...formData,
            rentAmount: parseFloat(formData.rentAmount),
            securityDeposit: parseFloat(formData.securityDeposit || 0)
        };

        if (mode === 'add') {
            payload.unitId = unitId;
        }

        onSave(payload);

        // Reset form only in add mode
        if (mode === 'add') {
            setFormData({
                tenantName: '',
                rentAmount: '',
                securityDeposit: '',
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
            });
        }
        onClose();
    };

    const modalTitle = mode === 'edit'
        ? `${t('units.editLease')} - ${unitName}`
        : `${t('units.addLease')} - ${unitName}`;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={modalTitle}>
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Tenant Name */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        <User size={16} className="inline mr-1" />
                        {t('units.tenantName')}
                    </label>
                    <input
                        type="text"
                        name="tenantName"
                        value={formData.tenantName}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        required
                    />
                </div>

                {/* Rent Amount */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        <DollarSign size={16} className="inline mr-1" />
                        {t('units.rentPerMonth')}
                    </label>
                    <input
                        type="number"
                        name="rentAmount"
                        value={formData.rentAmount}
                        onChange={handleChange}
                        placeholder="0.00"
                        min="0"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        required
                    />
                </div>

                {/* Security Deposit */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        <DollarSign size={16} className="inline mr-1" />
                        {t('units.securityDeposit')}
                    </label>
                    <input
                        type="number"
                        name="securityDeposit"
                        value={formData.securityDeposit}
                        onChange={handleChange}
                        placeholder="0.00"
                        min="0"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Start Date */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            <Calendar size={16} className="inline mr-1" />
                            {t('units.leaseStart')}
                        </label>
                        <input
                            type="date"
                            name="startDate"
                            value={formData.startDate}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                            required
                        />
                    </div>

                    {/* End Date */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            <Calendar size={16} className="inline mr-1" />
                            {t('units.leaseEnd')}
                        </label>
                        <input
                            type="date"
                            name="endDate"
                            value={formData.endDate}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                            required
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        type="submit"
                        className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                    >
                        {t('common.save')}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
