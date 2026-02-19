import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { Calendar, DollarSign, Clock, FileText } from 'lucide-react';

export const AddMaintenanceModal = ({ isOpen, onClose, onSave, units = [], initialUnitId }) => {
    const [title, setTitle] = useState('');
    const [frequency, setFrequency] = useState(12);
    const [lastPerformed, setLastPerformed] = useState('');
    const [selectedUnitId, setSelectedUnitId] = useState('');

    // Sync state when modal opens
    React.useEffect(() => {
        if (isOpen) {
            setSelectedUnitId(initialUnitId || '');
            setTitle('');
            setFrequency(12);
            setLastPerformed('');
        }
    }, [isOpen, initialUnitId]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            title,
            frequencyMonths: parseInt(frequency),
            lastPerformed: lastPerformed || null,
            unitId: selectedUnitId
        });
        onClose();
    };

    const isUnitFixed = !!initialUnitId;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isUnitFixed ? "Agregar Mantenimiento" : "Programar Nuevo Mantenimiento"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Unit Selection */}
                {!isUnitFixed && (
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Unidad</label>
                        <select
                            required
                            value={selectedUnitId}
                            onChange={(e) => setSelectedUnitId(e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                        >
                            <option value="">Seleccionar Unidad...</option>
                            {units.map(u => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Título de la Tarea</label>
                    <div className="relative">
                        <FileText className="absolute left-3 top-2.5 text-slate-400" size={18} />
                        <input
                            type="text"
                            required
                            placeholder="Ej: Limpieza de Tanque, Mantenimiento Gas"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="pl-10 w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Frecuencia (Meses)</label>
                        <div className="relative">
                            <Clock className="absolute left-3 top-2.5 text-slate-400" size={18} />
                            <input
                                type="number"
                                required
                                min="1"
                                value={frequency}
                                onChange={(e) => setFrequency(e.target.value)}
                                className="pl-10 w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Última vez (Opcional)</label>
                        <input
                            type="date"
                            value={lastPerformed}
                            onChange={(e) => setLastPerformed(e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={!selectedUnitId && !initialUnitId}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg font-medium shadow-sm"
                    >
                        Guardar Tarea
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export const CompleteMaintenanceModal = ({ isOpen, onClose, onConfirm, task }) => {
    const [cost, setCost] = useState('');
    const [datePerformed, setDatePerformed] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');

    // Reset form state whenever the modal is opened
    useEffect(() => {
        if (isOpen) {
            setCost('');
            setNotes('');
            setDatePerformed(new Date().toISOString().split('T')[0]);
        }
    }, [isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onConfirm(task.id, {
            cost: parseFloat(cost) || 0,
            datePerformed,
            notes
        });
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Completar: ${task?.title}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-sm text-blue-800">
                    <p>Al completar esta tarea, se generará el próximo vencimiento automáticamente y se registrará el costo como un gasto.</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Costo del Mantenimiento ($)</label>
                    <div className="relative">
                        <DollarSign className="absolute left-3 top-2.5 text-slate-400" size={18} />
                        <input
                            type="number"
                            required
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            value={cost}
                            onChange={(e) => setCost(e.target.value)}
                            className="pl-10 w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de Realización</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-2.5 text-slate-400" size={18} />
                        <input
                            type="date"
                            required
                            value={datePerformed}
                            onChange={(e) => setDatePerformed(e.target.value)}
                            className="pl-10 w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Notas (Opcional)</label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        placeholder="Detalles del trabajo realizado..."
                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                    />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium shadow-sm"
                    >
                        Registrar y Completar
                    </button>
                </div>
            </form>
        </Modal>
    );
};
