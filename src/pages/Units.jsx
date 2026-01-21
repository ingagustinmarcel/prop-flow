import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useData } from '../context/DataContext';
import Modal from '../components/Modal';
import DocumentsManager from '../components/DocumentsManager';
import ExpenseModal from '../components/ExpenseModal';
import { Edit2, Check, Plus, Trash2, Home, FileText, DollarSign, X } from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';

const UnitCard = ({ unit, onSave, onOpenDocs, onDelete, onAddExpense }) => {
    const { t } = useTranslation();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ ...unit });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        onSave(unit.id, formData);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setFormData({ ...unit });
        setIsEditing(false);
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                        <Home size={20} />
                    </div>
                    {isEditing ? (
                        <input
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="text-lg font-bold text-slate-900 bg-white border border-slate-300 rounded px-2 py-0.5 w-32 focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                    ) : (
                        <h3 className="text-lg font-bold text-slate-900">{unit.name}</h3>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onAddExpense(unit)}
                        className="p-2 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 rounded-full transition-colors"
                        title={t('units.addExpense')}
                    >
                        <DollarSign size={18} />
                    </button>
                    <button
                        onClick={() => onOpenDocs(unit)}
                        className="p-2 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 rounded-full transition-colors"
                        title={t('units.manageDocuments')}
                    >
                        <FileText size={18} />
                    </button>
                    {isEditing ? (
                        <>
                            <button
                                onClick={handleSave}
                                className="p-2 bg-emerald-500 text-white hover:bg-emerald-600 rounded-full transition-colors"
                                title={t('units.save')}
                            >
                                <Check size={18} />
                            </button>
                            <button
                                onClick={handleCancel}
                                className="p-2 bg-slate-200 text-slate-600 hover:bg-slate-300 rounded-full transition-colors"
                                title={t('units.cancelEdit')}
                            >
                                <X size={18} />
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-full transition-colors"
                            >
                                <Edit2 size={18} />
                            </button>
                            <button
                                onClick={() => window.confirm(`Delete ${unit.name}?`) && onDelete(unit.id)}
                                className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-full transition-colors"
                                title={t('units.deleteOrArchive')}
                            >
                                <Trash2 size={18} />
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('units.tenant')}</label>
                        {isEditing ? (
                            <input name="tenant" value={formData.tenant} onChange={handleChange} className="w-full text-sm border rounded px-2 py-1" />
                        ) : (
                            <p className="text-sm font-medium text-slate-700">{unit.tenant || t('units.vacant')}</p>
                        )}
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('units.rentPerMonth')}</label>
                        {isEditing ? (
                            <input name="rent" type="number" value={formData.rent} onChange={handleChange} className="w-full text-sm border rounded px-2 py-1" />
                        ) : (
                            <p className="text-sm font-bold text-slate-900">{formatCurrency(unit.rent)}</p>
                        )}
                    </div>
                    <div className="space-y-1">
                        <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg border border-blue-100 h-full">
                            <div>
                                <label className="text-xs font-semibold text-blue-400 uppercase tracking-wider block">{t('units.securityDeposit')}</label>
                                {isEditing ? (
                                    <input name="securityDeposit" type="number" value={formData.securityDeposit} onChange={handleChange} className="w-24 text-sm border border-blue-200 rounded px-2 py-1 mt-1" />
                                ) : (
                                    <p className="text-sm font-bold text-blue-700 mt-1">{formatCurrency(unit.securityDeposit)}</p>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <div className="flex justify-between items-center bg-emerald-50 p-3 rounded-lg border border-emerald-100 h-full">
                            <div>
                                <label className="text-xs font-semibold text-emerald-500 uppercase tracking-wider block">{t('units.incrementPercent')}</label>
                                {isEditing ? (
                                    <div className="flex items-center gap-1 mt-1">
                                        <input name="incrementPercentage" type="number" value={formData.incrementPercentage} onChange={handleChange} className="w-16 text-sm border border-emerald-200 rounded px-2 py-1" />
                                        <span className="text-sm text-emerald-700">%</span>
                                    </div>
                                ) : (
                                    <p className="text-sm font-bold text-emerald-700 mt-1">{unit.incrementPercentage}%</p>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('units.leaseStart')}</label>
                        {isEditing ? (
                            <input name="leaseStart" type="date" value={formData.leaseStart} onChange={handleChange} className="w-full text-xs border rounded px-1 py-1" />
                        ) : (
                            <p className="text-sm text-slate-600">{unit.leaseStart}</p>
                        )}
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('units.leaseEnd')}</label>
                        {isEditing ? (
                            <input name="leaseEnd" type="date" value={formData.leaseEnd} onChange={handleChange} className="w-full text-xs border rounded px-1 py-1" />
                        ) : (
                            <p className="text-sm text-slate-600">{unit.leaseEnd}</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function Units() {
    const { t } = useTranslation();
    const { units, addUnit, updateUnit, deleteUnit, toggleUnitActive, addExpense } = useData();
    const [selectedUnit, setSelectedUnit] = useState(null);
    const [showArchived, setShowArchived] = useState(false);
    const [expenseModalUnit, setExpenseModalUnit] = useState(null);

    const handleAddUnit = () => {
        const newUnit = {
            name: `Unit ${units.length + 101}`,
            tenant: '',
            leaseStart: new Date().toISOString().split('T')[0],
            leaseEnd: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
            rent: 1000,
            securityDeposit: 1000,
            incrementPercentage: 5,
            isActive: true
        };
        addUnit(newUnit);
    };

    const filteredUnits = units.filter(u => {
        const isActive = u.isActive ?? true;
        return showArchived ? true : isActive;
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{t('units.title')}</h1>
                    <p className="text-slate-500 mt-2">{t('units.subtitle')}</p>
                </div>
                <button
                    onClick={handleAddUnit}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-sm transition-all active:scale-95"
                >
                    <Plus size={20} />
                    {t('units.addUnit')}
                </button>
            </header>

            <div className="flex items-center justify-between">
                <p className="text-slate-500">
                    {t('units.showing')} {filteredUnits.length} {t('units.of')} {units.length} {t('units.unitsLabel')}
                </p>
                <div className="flex items-center gap-2">
                    <label className="text-sm text-slate-600">{t('units.showArchived')}</label>
                    <button
                        onClick={() => setShowArchived(!showArchived)}
                        className={cn(
                            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                            showArchived ? "bg-emerald-600" : "bg-slate-200"
                        )}
                    >
                        <span className={cn(
                            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                            showArchived ? "translate-x-6" : "translate-x-1"
                        )} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredUnits.map(unit => (
                    <div key={unit.id} className={cn(!unit.isActive && "opacity-60 grayscale-[0.5]")}>
                        <UnitCard
                            unit={unit}
                            onSave={updateUnit}
                            onOpenDocs={setSelectedUnit}
                            onDelete={deleteUnit}
                            onAddExpense={setExpenseModalUnit}
                        />
                        {!unit.isActive && (
                            <button
                                onClick={() => toggleUnitActive(unit.id, true)}
                                className="mt-2 text-xs text-emerald-600 font-medium hover:underline w-full text-center"
                            >
                                {t('units.reactivateUnit')}
                            </button>
                        )}
                    </div>
                ))}
            </div>

            <Modal
                isOpen={!!selectedUnit}
                onClose={() => setSelectedUnit(null)}
                title={`${t('units.documents')}: ${selectedUnit?.name}`}
            >
                {selectedUnit && <DocumentsManager unitId={selectedUnit.id} />}
            </Modal>

            <ExpenseModal
                isOpen={!!expenseModalUnit}
                onClose={() => setExpenseModalUnit(null)}
                unitId={expenseModalUnit?.id}
                unitName={expenseModalUnit?.name}
                onSave={addExpense}
            />
        </div>
    );
}
