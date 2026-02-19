import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useData } from '../context/DataContext';
import {
    Wrench,
    Plus,
    Search,
    Filter,
    Calendar,
    CheckCircle2,
    Clock,
    AlertTriangle,
    Check,
    Trash2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { AddMaintenanceModal, CompleteMaintenanceModal } from '../components/MaintenanceModals';
import Modal from '../components/Modal';

export default function Maintenance() {
    const { t } = useTranslation();
    const { maintenances, units, addMaintenance, completeMaintenance, deleteMaintenance } = useData();

    // UI State
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // all, overdue, due_soon, pending
    const [filterUnit, setFilterUnit] = useState('all');

    // Modals
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [completionTask, setCompletionTask] = useState(null);
    const [deleteConfirmTask, setDeleteConfirmTask] = useState(null);

    // Helpers
    const getUnitName = (id) => units.find(u => u.id === id)?.name || '...';

    const getStatus = (task) => {
        const today = new Date().toISOString().split('T')[0];
        if (task.nextDue < today) return 'overdue';
        const daysUntil = (new Date(task.nextDue) - new Date()) / (1000 * 60 * 60 * 24);
        if (daysUntil <= 30) return 'due_soon';
        return 'ok';
    };

    const filteredTasks = maintenances.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesUnit = filterUnit === 'all' || task.unitId === filterUnit;

        let matchesStatus = true;
        const status = getStatus(task);
        if (filterStatus === 'overdue') matchesStatus = status === 'overdue';
        if (filterStatus === 'due_soon') matchesStatus = status === 'due_soon' || status === 'overdue';

        return matchesSearch && matchesUnit && matchesStatus;
    }).sort((a, b) => new Date(a.nextDue) - new Date(b.nextDue));

    const handleDelete = async () => {
        if (deleteConfirmTask) {
            await deleteMaintenance(deleteConfirmTask.id);
            setDeleteConfirmTask(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Wrench className="text-emerald-600" />
                        {t('nav.maintenance')}
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Gestione todas las tareas de mantenimiento preventivo y correctivo.
                    </p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium shadow-sm transition-colors w-full sm:w-auto justify-center"
                >
                    <Plus size={20} />
                    <span>Programar Mantenimiento</span>
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar tareas..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                </div>
                <div className="flex gap-2">
                    <div className="relative min-w-[150px]">
                        <Filter className="absolute left-3 top-2.5 text-slate-400" size={18} />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="pl-10 w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none appearance-none bg-white"
                        >
                            <option value="all">Todos los Estados</option>
                            <option value="overdue">Vencidos</option>
                            <option value="due_soon">Vencen Pronto</option>
                        </select>
                    </div>
                    <div className="relative min-w-[150px]">
                        <select
                            value={filterUnit}
                            onChange={(e) => setFilterUnit(e.target.value)}
                            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none appearance-none bg-white"
                        >
                            <option value="all">Todas las Unidades</option>
                            {units.map(u => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Content */}
            {filteredTasks.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Wrench className="text-slate-400" size={32} />
                    </div>
                    <h3 className="text-lg font-medium text-slate-800">Sin tareas encontradas</h3>
                    <p className="text-slate-500 mt-1">Ajuste los filtros o programe una nueva tarea.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTasks.map(task => {
                        const status = getStatus(task);
                        const isOverdue = status === 'overdue';
                        const isDueSoon = status === 'due_soon';

                        return (
                            <div key={task.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative group">
                                <div className="flex justify-between items-start mb-3">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                                        {getUnitName(task.unitId)}
                                    </span>
                                    <div className={cn(
                                        "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded",
                                        isOverdue ? "bg-red-50 text-red-600" :
                                            isDueSoon ? "bg-amber-50 text-amber-600" :
                                                "bg-emerald-50 text-emerald-600"
                                    )}>
                                        {isOverdue && <AlertTriangle size={12} />}
                                        {isOverdue ? 'VENCIDO' : isDueSoon ? 'VENCE PRONTO' : 'AL DÍA'}
                                    </div>
                                </div>

                                <h3 className="font-semibold text-slate-800 mb-1">{task.title}</h3>
                                <p className="text-sm text-slate-500 flex items-center gap-1 mb-4">
                                    <Clock size={14} />
                                    Frecuencia: Cada {task.frequencyMonths} meses
                                </p>

                                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-slate-400">Próximo Vencimiento</span>
                                        <span className={cn(
                                            "text-sm font-medium flex items-center gap-1",
                                            isOverdue ? "text-red-700" : "text-slate-700"
                                        )}>
                                            <Calendar size={14} />
                                            {task.nextDue}
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setDeleteConfirmTask(task)}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Eliminar Tarea"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => setCompletionTask(task)}
                                            className="px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors"
                                        >
                                            <Check size={16} />
                                            Completar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modals */}
            <AddMaintenanceModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSave={addMaintenance}
                units={units}
            />

            <CompleteMaintenanceModal
                isOpen={!!completionTask}
                onClose={() => setCompletionTask(null)}
                onConfirm={completeMaintenance}
                task={completionTask}
            />

            <Modal
                isOpen={!!deleteConfirmTask}
                onClose={() => setDeleteConfirmTask(null)}
                title="¿Eliminar Tarea?"
            >
                <div className="space-y-4">
                    <p className="text-slate-600">
                        Estás a punto de eliminar <strong>{deleteConfirmTask?.title}</strong>. Esta acción no se puede deshacer.
                    </p>
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => setDeleteConfirmTask(null)}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleDelete}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
                        >
                            Eliminar
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
