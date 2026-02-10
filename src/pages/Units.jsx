import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useData } from '../context/DataContext';
import Modal from '../components/Modal';
import LeaseModal from '../components/LeaseModal';
import ExpenseModal from '../components/ExpenseModal';
import { Edit2, Check, Plus, Trash2, Home, DollarSign, X, UserMinus, FilePlus, AlertTriangle, ChevronDown } from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';

const UnitCard = ({ unit, activeLease, allLeases = [], onSave, onDelete, onAddExpense, onAddLease, onEditLease, onTerminateLease }) => {
    const { t } = useTranslation();
    const [isEditing, setIsEditing] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    // We only edit Unit Name here. Tenant details are immutable or via new lease.
    const [formData, setFormData] = useState({ name: unit.name });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        onSave(unit.id, formData);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setFormData({ name: unit.name });
        setIsEditing(false);
    };

    // Fallback for legacy data (if no lease record but unit has tenant)
    const effectiveTenant = activeLease?.tenantName || unit.tenant;
    const effectiveRent = activeLease?.rentAmount || unit.rent;
    const effectiveDeposit = activeLease?.securityDeposit || unit.securityDeposit;
    const effectiveStart = activeLease?.startDate || unit.leaseStart;
    const effectiveEnd = activeLease?.endDate || unit.leaseEnd;
    const isOccupied = !!effectiveTenant;

    // Filter terminated leases for this unit
    const terminatedLeases = allLeases.filter(l => l.status === 'TERMINATED').sort((a, b) => {
        // Sort by end date descending (most recent first)
        return new Date(b.endDate) - new Date(a.endDate);
    });

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg", isOccupied ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500")}>
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
                        <div className="flex flex-col">
                            <h3 className="text-lg font-bold text-slate-900 leading-tight">{unit.name}</h3>
                            <span className={cn("text-xs font-medium uppercase tracking-wider", isOccupied ? "text-emerald-600" : "text-slate-400")}>
                                {isOccupied ? t('units.occupied') : t('units.vacant')}
                            </span>
                        </div>
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
                                onClick={() => onDelete(unit)}
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
                {isOccupied ? (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('units.tenant')}</label>
                            <p className="text-sm font-medium text-slate-700 truncate" title={effectiveTenant}>{effectiveTenant}</p>
                            {/* Email removed from view for simplicity, can add back if needed */}
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('units.rentPerMonth')}</label>
                            <p className="text-sm font-bold text-slate-900">{formatCurrency(effectiveRent)}</p>
                        </div>
                        <div className="col-span-2">
                            <div className="flex justify-between items-center bg-blue-50/50 p-2 px-3 rounded-lg border border-blue-100">
                                <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">{t('units.securityDeposit')}</span>
                                <span className="text-sm font-bold text-blue-700">{formatCurrency(effectiveDeposit)}</span>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('units.leaseStart')}</label>
                            <p className="text-sm text-slate-600">{effectiveStart}</p>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('units.leaseEnd')}</label>
                            <p className="text-sm text-slate-600">{effectiveEnd}</p>
                        </div>

                        {/* Lease Actions */}
                        <div className="col-span-2 pt-2 border-t border-slate-100 mt-1">
                            {activeLease && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => onEditLease(unit, activeLease)}
                                        className="flex-1 py-2 flex items-center justify-center gap-2 text-xs font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-100"
                                    >
                                        <Edit2 size={14} />
                                        {t('units.editLease')}
                                    </button>
                                    <button
                                        onClick={() => onTerminateLease(activeLease)}
                                        className="flex-1 py-2 flex items-center justify-center gap-2 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-100"
                                    >
                                        <UserMinus size={14} />
                                        {t('units.terminateLease')}
                                    </button>
                                </div>
                            )}
                            {!activeLease && unit.tenant && (
                                <p className="text-xs text-center text-amber-600 italic flex items-center justify-center gap-1">
                                    <AlertTriangle size={12} />
                                    Legacy Data - Migrate to enable Lease actions
                                </p>
                            )}
                        </div>

                        {/* Lease History Section - Dropdown */}
                        {terminatedLeases.length > 0 && (
                            <div className="col-span-2 pt-3 border-t border-slate-100 mt-2">
                                <button
                                    onClick={() => setShowHistory(!showHistory)}
                                    className="w-full py-2 flex items-center justify-between text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors uppercase tracking-wider"
                                >
                                    <span>{t('units.leaseHistory')} ({terminatedLeases.length})</span>
                                    <ChevronDown
                                        size={16}
                                        className={cn("transition-transform duration-200", showHistory && "rotate-180")}
                                    />
                                </button>

                                {showHistory && (
                                    <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                                        {terminatedLeases.map((lease) => (
                                            <div
                                                key={lease.id}
                                                className="p-2 bg-slate-50 rounded border border-slate-200 text-xs"
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="font-medium text-slate-700">{lease.tenantName}</span>
                                                    <span className="text-emerald-600 font-semibold">{formatCurrency(lease.rentAmount)}</span>
                                                </div>
                                                <div className="text-slate-500 space-y-0.5">
                                                    <div>{lease.startDate} → {lease.endDate}</div>
                                                    <div className="text-red-600">
                                                        {t('units.terminatedOn')}: {lease.endDate}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-center space-y-3">
                        <div className="p-3 bg-slate-50 rounded-full">
                            <Home size={24} className="text-slate-300" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">{t('units.unitVacant')}</p>
                            <p className="text-xs text-slate-400 mt-1">{t('units.readyForTenant')}</p>
                        </div>
                        <button
                            onClick={() => onAddLease(unit)}
                            className="mt-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
                        >
                            <FilePlus size={16} />
                            {t('units.addLease')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default function Units() {
    const { t } = useTranslation();
    const { units, leases, getActiveLease, addUnit, updateUnit, deleteUnit, toggleUnitActive, addExpense, terminateLease, addLease, updateLease } = useData();
    const [showArchived, setShowArchived] = useState(false);
    const [expenseModalUnit, setExpenseModalUnit] = useState(null);
    const [leaseModalUnit, setLeaseModalUnit] = useState(null);
    const [leaseModalMode, setLeaseModalMode] = useState('add'); // 'add' or 'edit'
    const [editingLease, setEditingLease] = useState(null);

    // Termination Modal State
    const [terminationLease, setTerminationLease] = useState(null);

    // Delete Confirmation Modal State
    const [deleteConfirmUnit, setDeleteConfirmUnit] = useState(null);

    const handleAddUnit = () => {
        const newUnit = {
            name: `Unit ${units.length + 101}`,
            // Legacy fields no longer used for new units
            isActive: true
        };
        addUnit(newUnit);
    };

    const handleTerminateConfirm = async () => {
        if (terminationLease) {
            await terminateLease(terminationLease.id);
            setTerminationLease(null);
        }
    };

    const handleDeleteConfirm = async () => {
        if (deleteConfirmUnit) {
            console.log('🗑️ Confirming delete for unit:', deleteConfirmUnit.id);
            await deleteUnit(deleteConfirmUnit.id);
            setDeleteConfirmUnit(null);
        }
    };

    const handleAddLeaseClick = (unit) => {
        setLeaseModalUnit(unit);
        setLeaseModalMode('add');
        setEditingLease(null);
    };

    const handleEditLeaseClick = (unit, lease) => {
        setLeaseModalUnit(unit);
        setLeaseModalMode('edit');
        setEditingLease(lease);
    };

    const handleLeaseSave = async (leaseData) => {
        if (leaseModalMode === 'add') {
            await addLease(leaseData);
        } else if (leaseModalMode === 'edit' && editingLease) {
            await updateLease(editingLease.id, leaseData);
        }
        setLeaseModalUnit(null);
        setEditingLease(null);
    };

    const filteredUnits = units.filter(u => {
        const isActive = u.isActive ?? true;
        return showArchived ? true : isActive;
    });

    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">{t('units.title')}</h1>
                    <p className="text-sm md:text-base text-slate-500 mt-1 md:mt-2">{t('units.subtitle')}</p>
                </div>
                <button
                    onClick={handleAddUnit}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 md:py-2 rounded-lg font-medium flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 w-full md:w-auto"
                >
                    <Plus size={20} />
                    {t('units.addUnit')}
                </button>
            </header>

            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                <p className="text-slate-500 flex-grow">
                    {t('units.showing')} {filteredUnits.length} {t('units.of')} {units.length} {t('units.unitsLabel')}
                </p>
                <button
                    onClick={() => setShowArchived(!showArchived)}
                    className={cn(
                        "px-4 py-3 sm:py-2 rounded-lg font-medium transition-all text-center",
                        showArchived ? "bg-slate-200 text-slate-700" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                >
                    {t(showArchived ? 'units.hideArchived' : 'units.showArchived')}
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {filteredUnits.map(unit => (
                    <div key={unit.id} className={cn(!unit.isActive && "opacity-60 grayscale-[0.5]")}>
                        <UnitCard
                            unit={unit}
                            activeLease={getActiveLease(unit.id)}
                            allLeases={leases.filter(l => l.unitId === unit.id)}
                            onSave={updateUnit}
                            onDelete={setDeleteConfirmUnit}
                            onAddExpense={setExpenseModalUnit}
                            onAddLease={handleAddLeaseClick}
                            onEditLease={handleEditLeaseClick}
                            onTerminateLease={setTerminationLease}
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

            <ExpenseModal
                isOpen={!!expenseModalUnit}
                onClose={() => setExpenseModalUnit(null)}
                unitId={expenseModalUnit?.id}
                unitName={expenseModalUnit?.name}
                onSave={addExpense}
            />

            <LeaseModal
                isOpen={!!leaseModalUnit}
                onClose={() => { setLeaseModalUnit(null); setEditingLease(null); }}
                unitId={leaseModalUnit?.id}
                unitName={leaseModalUnit?.name}
                mode={leaseModalMode}
                lease={editingLease}
                onSave={handleLeaseSave}
            />

            {/* Termination Confirmation Modal */}
            <Modal
                isOpen={!!terminationLease}
                onClose={() => setTerminationLease(null)}
                title={t('units.confirmTermination')}
            >
                <div className="space-y-4">
                    <div className="p-4 bg-red-50 border border-red-100 rounded-lg flex gap-3">
                        <AlertTriangle className="text-red-600 shrink-0" size={24} />
                        <div>
                            <h4 className="font-bold text-red-900">{t('units.warning')}</h4>
                            <p className="text-sm text-red-700 mt-1">
                                {t('units.terminationWarningMessage')}
                            </p>
                        </div>
                    </div>
                    <p className="text-slate-600">
                        {t('units.terminationConfirmText', { tenant: terminationLease?.tenantName })}
                    </p>
                    <div className="flex gap-3 justify-end pt-2">
                        <button
                            onClick={() => setTerminationLease(null)}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            onClick={handleTerminateConfirm}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium shadow-sm"
                        >
                            {t('units.confirmTermination')}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={!!deleteConfirmUnit}
                onClose={() => setDeleteConfirmUnit(null)}
                title={t('units.deleteOrArchive')}
            >
                <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
                        <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                        <div>
                            <p className="font-medium text-red-900">
                                ¿Eliminar {deleteConfirmUnit?.name}?
                            </p>
                            <p className="text-sm text-red-700 mt-1">
                                Esta acción no se puede deshacer. Si la unidad tiene historial, será archivada en su lugar.
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3 justify-end pt-2">
                        <button
                            onClick={() => setDeleteConfirmUnit(null)}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            onClick={handleDeleteConfirm}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium shadow-sm"
                        >
                            Eliminar
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
