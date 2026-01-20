import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import Modal from '../components/Modal';
import DocumentsManager from '../components/DocumentsManager';
import { Edit2, Check, Plus, Trash2, Home, FileText } from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';

const UnitCard = ({ unit, onSave, onOpenDocs }) => {
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
                        onClick={() => onOpenDocs(unit)}
                        className="p-2 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 rounded-full transition-colors"
                        title="Manage Documents"
                    >
                        <FileText size={18} />
                    </button>
                    <button
                        onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                        className={cn(
                            "p-2 rounded-full transition-colors",
                            isEditing ? "bg-emerald-500 text-white hover:bg-emerald-600" : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        )}
                    >
                        {isEditing ? <Check size={18} /> : <Edit2 size={18} />}
                    </button>
                </div>
            </div>

            <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tenant</label>
                        {isEditing ? (
                            <input name="tenant" value={formData.tenant} onChange={handleChange} className="w-full text-sm border rounded px-2 py-1" />
                        ) : (
                            <p className="text-sm font-medium text-slate-700">{unit.tenant || 'Vacant'}</p>
                        )}
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Rent / Mo</label>
                        {isEditing ? (
                            <input name="rent" type="number" value={formData.rent} onChange={handleChange} className="w-full text-sm border rounded px-2 py-1" />
                        ) : (
                            <p className="text-sm font-bold text-slate-900">{formatCurrency(unit.rent)}</p>
                        )}
                    </div>
                    <div className="space-y-1">
                        <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg border border-blue-100 h-full">
                            <div>
                                <label className="text-xs font-semibold text-blue-400 uppercase tracking-wider block">Security Deposit</label>
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
                                <label className="text-xs font-semibold text-emerald-500 uppercase tracking-wider block">Increment %</label>
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
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Lease Start</label>
                        {isEditing ? (
                            <input name="leaseStart" type="date" value={formData.leaseStart} onChange={handleChange} className="w-full text-xs border rounded px-1 py-1" />
                        ) : (
                            <p className="text-sm text-slate-600">{unit.leaseStart}</p>
                        )}
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Lease End</label>
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
    const { units, addUnit, updateUnit } = useData();
    const [selectedUnit, setSelectedUnit] = useState(null);

    const handleAddUnit = () => {
        const newUnit = {
            name: `Unit ${units.length + 101}`,
            tenant: '',
            leaseStart: new Date().toISOString().split('T')[0],
            leaseEnd: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
            rent: 1000,
            securityDeposit: 1000,
            incrementPercentage: 5,
        };
        addUnit(newUnit);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Property Units</h1>
                    <p className="text-slate-500 mt-2">Manage your units, lease details, and tenants.</p>
                </div>
                <button
                    onClick={handleAddUnit}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-sm transition-all active:scale-95"
                >
                    <Plus size={20} />
                    Add Unit
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {units.map(unit => (
                    <UnitCard
                        key={unit.id}
                        unit={unit}
                        onSave={updateUnit}
                        onOpenDocs={setSelectedUnit}
                    />
                ))}
            </div>

            <Modal
                isOpen={!!selectedUnit}
                onClose={() => setSelectedUnit(null)}
                title={`Documents: ${selectedUnit?.name}`}
            >
                {selectedUnit && <DocumentsManager unitId={selectedUnit.id} />}
            </Modal>
        </div>
    );
}
