/**
 * DataContext - Central data management for the rental property application
 * 
 * This context provides:
 * - Units (rental properties) management
 * - Expenses tracking
 * - Payment records
 * - Optimistic UI updates with Supabase synchronization
 * 
 * All data operations follow the pattern:
 * 1. Optimistic local state update (immediate UI feedback)
 * 2. Supabase database operation
 * 3. Revert on error or sync with server response
 */

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const DataContext = createContext();

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
    const { user } = useAuth();
    const [units, setUnits] = useState([]);
    const [leases, setLeases] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [payments, setPayments] = useState([]);
    const [maintenances, setMaintenances] = useState([]);
    const [loading, setLoading] = useState(false);

    // ==================== DATA MAPPERS ====================
    // Convert between database snake_case and JavaScript camelCase

    /**
     * Maps database unit record to application format
     * @param {Object} u - Unit record from Supabase
     * @returns {Object} Normalized unit object
     */
    const mapUnitFromDB = (u) => ({
        ...u,
        // Legacy fields mapping (for backward compat until migration is 100% complete)
        securityDeposit: u.security_deposit,
        incrementPercentage: u.increment_percentage,
        leaseStart: u.lease_start,
        leaseEnd: u.lease_end,
        lastIncrementDate: u.last_increment_date,
        rentOverride: u.rent_override,
        isActive: u.is_active ?? true
        // tenantEmail is derived from the active lease — not stored on unit
    });

    /**
     * Maps database lease record to application format
     * @param {Object} l - Lease record from Supabase
     * @returns {Object} Normalized lease object
     */
    const mapLeaseFromDB = (l) => ({
        id: l.id,
        unitId: l.unit_id,
        tenantName: l.tenant_name,
        tenantEmail: l.tenant_email || '',
        rentAmount: l.rent_amount,
        securityDeposit: l.security_deposit,
        incrementPercentage: l.increment_percentage,
        startDate: l.start_date,
        endDate: l.end_date,
        lastIncrementDate: l.last_increment_date,
        status: l.status,
        userId: l.user_id
    });

    /**
     * Maps application lease object to database format
     * @param {Object} l - Lease object
     * @returns {Object} DB payload
     */
    const mapLeaseToDB = (l) => ({
        unit_id: l.unitId,
        tenant_name: l.tenantName,
        tenant_email: l.tenantEmail || null,
        rent_amount: l.rentAmount,
        security_deposit: l.securityDeposit,
        increment_percentage: l.incrementPercentage,
        start_date: l.startDate,
        end_date: l.endDate,
        last_increment_date: l.lastIncrementDate,
        status: l.status || 'ACTIVE',
        user_id: user.id
    });

    /**
     * Maps application unit object to database format
     * @param {Object} u - Unit object from application
     * @returns {Object} Database-ready unit record
     */
    const mapUnitToDB = (u) => ({
        name: u.name,
        // Legacy fields - we might stop writing these soon, but keep for now
        tenant: u.tenant,
        rent: u.rent,
        security_deposit: u.securityDeposit,
        increment_percentage: u.incrementPercentage,
        lease_start: u.leaseStart,
        lease_end: u.leaseEnd,
        last_increment_date: u.lastIncrementDate,
        rent_override: u.rentOverride ?? null,
        is_active: u.isActive ?? true,
        user_id: user.id
        // tenant_email intentionally omitted — email lives on the lease
    });

    const mapMaintenanceFromDB = (m) => ({
        id: m.id,
        unitId: m.unit_id,
        title: m.title,
        frequencyMonths: m.frequency_months,
        lastPerformed: m.last_performed,
        nextDue: m.next_due,
        status: m.status,
        notes: m.notes
    });

    const mapMaintenanceToDB = (m) => ({
        unit_id: m.unitId,
        title: m.title,
        frequency_months: m.frequencyMonths,
        last_performed: m.lastPerformed,
        next_due: m.nextDue,
        status: m.status || 'PENDING',
        notes: m.notes,
        user_id: user.id
    });

    // ==================== DATA FETCHING ====================

    /**
     * Fetches all user data from Supabase and normalizes it
     * Called on mount and after certain operations to ensure sync
     */
    const fetchAndNormalize = async () => {
        if (!user) return;
        setLoading(true);

        try {
            const [
                { data: u, error: uErr },
                { data: l, error: lErr },
                { data: e, error: eErr },
                { data: p, error: pErr },
                { data: m, error: mErr }
            ] = await Promise.all([
                supabase.from('units').select('*'),
                supabase.from('leases').select('*'),
                supabase.from('expenses').select('*'),
                supabase.from('payments').select('*'),
                supabase.from('maintenances').select('*'),
            ]);

            if (uErr) console.error('Error fetching units:', uErr);
            else if (u) setUnits(u.map(mapUnitFromDB));

            if (lErr) console.error('Error fetching leases:', lErr);
            else if (l) {
                const normalizedLeases = l.map(mapLeaseFromDB);
                setLeases(normalizedLeases);

                // Derive tenantEmail on units from the active lease (email belongs to the tenant, not the unit)
                if (u && !uErr) {
                    const activeLeaseByUnit = {};
                    normalizedLeases.forEach(lease => {
                        if (lease.status === 'ACTIVE') activeLeaseByUnit[lease.unitId] = lease;
                    });
                    setUnits(u.map(rawUnit => ({
                        ...mapUnitFromDB(rawUnit),
                        tenantEmail: activeLeaseByUnit[rawUnit.id]?.tenantEmail || ''
                    })));
                }
            }

            if (eErr) console.error('Error fetching expenses:', eErr);
            else if (e) setExpenses(e.map(x => ({ ...x, unitId: x.unit_id })));

            if (pErr) console.error('Error fetching payments:', pErr);
            else if (p) setPayments(p.map(x => ({
                ...x,
                unitId: x.unit_id,
                forMonth: x.for_month,
                datePaid: x.date_paid
            })));

            if (mErr) console.error('Error fetching maintenances:', mErr);
            else if (m) setMaintenances(m.map(mapMaintenanceFromDB));
        } catch (error) {
            console.error('Unexpected error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Load data when user logs in, clear when user logs out
    useEffect(() => {
        if (user) {
            fetchAndNormalize();
        } else {
            setUnits([]);
            setLeases([]);
            setExpenses([]);
            setPayments([]);
            setMaintenances([]);
            setLoading(false);
        }
    }, [user]);

    // ==================== UNITS MANAGEMENT ====================

    /**
     * Adds a new rental unit
     * @param {Object} newUnit - Unit data to create
     */
    const addUnit = async (newUnit) => {
        const tempId = crypto.randomUUID();
        const optimisticUnit = { ...newUnit, id: tempId, user_id: user.id };

        // Optimistic update
        setUnits([...units, optimisticUnit]);

        try {
            const dbPayload = mapUnitToDB(newUnit);

            // Remove undefined fields to prevent database errors
            Object.keys(dbPayload).forEach(key =>
                dbPayload[key] === undefined && delete dbPayload[key]
            );

            const { data, error } = await supabase
                .from('units')
                .insert([dbPayload])
                .select();

            if (error) throw error;

            // Replace temp ID with real database ID
            setUnits(prev => prev.map(u =>
                u.id === tempId ? mapUnitFromDB(data[0]) : u
            ));
        } catch (err) {
            console.error("Error adding unit:", err);
            alert(`Failed to save unit: ${err.message}`);
            // Revert optimistic update
            setUnits(prev => prev.filter(u => u.id !== tempId));
        }
    };

    /**
     * Updates an existing unit with partial data
     * @param {string} id - Unit ID
     * @param {Object} updatedFields - Fields to update
     */
    const updateUnit = async (id, updatedFields) => {
        // Optimistic update
        setUnits(prev => prev.map(u =>
            u.id === id ? { ...u, ...updatedFields } : u
        ));

        try {
            // Build database payload with snake_case field names
            const dbPayload = {};
            if (updatedFields.securityDeposit !== undefined)
                dbPayload.security_deposit = updatedFields.securityDeposit;
            if (updatedFields.incrementPercentage !== undefined)
                dbPayload.increment_percentage = updatedFields.incrementPercentage;
            if (updatedFields.leaseStart !== undefined)
                dbPayload.lease_start = updatedFields.leaseStart;
            if (updatedFields.leaseEnd !== undefined)
                dbPayload.lease_end = updatedFields.leaseEnd;
            if (updatedFields.rent !== undefined)
                dbPayload.rent = updatedFields.rent;
            if (updatedFields.name !== undefined)
                dbPayload.name = updatedFields.name;
            if (updatedFields.tenant !== undefined)
                dbPayload.tenant = updatedFields.tenant;
            if (updatedFields.lastIncrementDate !== undefined)
                dbPayload.last_increment_date = updatedFields.lastIncrementDate;
            if (updatedFields.rentOverride !== undefined)
                dbPayload.rent_override = updatedFields.rentOverride;
            if (updatedFields.isActive !== undefined)
                dbPayload.is_active = updatedFields.isActive;
            if (updatedFields.tenantEmail !== undefined)
                dbPayload.tenant_email = updatedFields.tenantEmail;

            // Auto-clear rentOverride when rent or lastIncrementDate is updated (settled)
            if ((updatedFields.rent !== undefined || updatedFields.lastIncrementDate !== undefined) && updatedFields.rentOverride === undefined) {
                dbPayload.rent_override = null;
                // Update local state too if we haven't already
                setUnits(prev => prev.map(u => u.id === id ? { ...u, rentOverride: null } : u));
            }

            const { error } = await supabase
                .from('units')
                .update(dbPayload)
                .eq('id', id);

            if (error) throw error;
        } catch (err) {
            console.error("Error updating unit:", err);
            // Revert by re-fetching from database
            fetchAndNormalize();
        }
    };

    /**
     * Deletes a unit or archives it if it has financial history
     * @param {string} id - Unit ID to delete
     */
    const deleteUnit = async (id) => {
        try {
            // Check for associated financial data
            const hasPayments = payments.some(p => p.unitId === id);
            const hasExpenses = expenses.some(e => e.unitId === id);
            // Only count ACTIVE leases, not terminated ones
            const hasActiveLeases = leases.some(l => l.unitId === id && l.status === 'ACTIVE');

            if (hasPayments || hasExpenses || hasActiveLeases) {
                // Archive instead of delete to preserve data integrity
                await updateUnit(id, { isActive: false });
                alert("Esta unidad tiene historial de pagos, gastos o contratos activos. Se ha archivado en lugar de eliminarse para preservar los datos.");
                return;
            }

            // Safe to delete - no financial history or active leases
            // Note: terminated leases will also be deleted via cascade
            const { error } = await supabase.from('units').delete().eq('id', id);

            if (error) throw error;

            setUnits(prev => prev.filter(u => u.id !== id));
            // Also remove all leases for this unit from local state
            setLeases(prev => prev.filter(l => l.unitId !== id));
            alert("Unidad eliminada exitosamente.");
        } catch (err) {
            console.error("Error deleting unit:", err);
            alert("Error al eliminar la unidad. Por favor intenta nuevamente.");
        }
    };

    /**
     * Toggles unit active/archived status
     * @param {string} id - Unit ID
     * @param {boolean} status - New active status
     */
    const toggleUnitActive = async (id, status) => {
        await updateUnit(id, { isActive: status });
    };


    // ==================== LEASES MANAGEMENT ====================

    /**
     * Adds a new lease to a unit
     * @param {Object} leaseData - Lease details
     */
    const addLease = async (leaseData) => {
        const tempId = crypto.randomUUID();
        const optimisticLease = { ...leaseData, id: tempId, userId: user.id, status: 'ACTIVE' };

        setLeases(prev => [...prev, optimisticLease]);
        // Optimistically update unit's tenantEmail from the new lease
        if (leaseData.unitId && leaseData.tenantEmail !== undefined) {
            setUnits(prev => prev.map(u =>
                u.id === leaseData.unitId ? { ...u, tenantEmail: leaseData.tenantEmail } : u
            ));
        }

        try {
            const dbPayload = mapLeaseToDB(leaseData);
            const { data, error } = await supabase.from('leases').insert([dbPayload]).select();
            if (error) throw error;

            setLeases(prev => prev.map(l => l.id === tempId ? mapLeaseFromDB(data[0]) : l));
            return data[0].id;
        } catch (error) {
            console.error("Error adding lease:", error);
            setLeases(prev => prev.filter(l => l.id !== tempId));
            throw error;
        }
    };

    /**
     * Terminates a lease (sets status to TERMINATED and end date to today)
     * @param {string} leaseId 
     */
    const terminateLease = async (leaseId) => {
        const today = new Date().toISOString().split('T')[0];

        // Optimistic update
        setLeases(prev => prev.map(l =>
            l.id === leaseId ? { ...l, status: 'TERMINATED', endDate: today } : l
        ));

        try {
            const { error } = await supabase
                .from('leases')
                .update({ status: 'TERMINATED', end_date: today })
                .eq('id', leaseId);

            if (error) throw error;
        } catch (error) {
            console.error("Error terminating lease:", error);
            fetchAndNormalize(); // Revert
        }
    };

    /**
     * Updates an existing lease
     * @param {string} leaseId - Lease ID to update
     * @param {Object} updates - Fields to update
     */
    const updateLease = async (leaseId, updates) => {
        // Optimistic update on leases
        setLeases(prev => prev.map(l =>
            l.id === leaseId ? { ...l, ...updates } : l
        ));
        // Optimistically propagate email change to the unit
        const lease = leases.find(l => l.id === leaseId);
        if (lease && updates.tenantEmail !== undefined) {
            setUnits(prev => prev.map(u =>
                u.id === lease.unitId ? { ...u, tenantEmail: updates.tenantEmail } : u
            ));
        }

        try {
            const dbPayload = mapLeaseToDB({ ...updates, id: leaseId });
            // Remove id from payload as it's used in the where clause
            delete dbPayload.id;
            delete dbPayload.user_id; // Don't update user_id

            const { error } = await supabase
                .from('leases')
                .update(dbPayload)
                .eq('id', leaseId);

            if (error) throw error;
        } catch (error) {
            console.error("Error updating lease:", error);
            fetchAndNormalize(); // Revert
        }
    };

    /**
     * Helper to get the active lease for a unit
     * @param {string} unitId 
     * @returns {Object|undefined} Active lease
     */
    const getActiveLease = (unitId) => {
        return leases.find(l => l.unitId === unitId && l.status === 'ACTIVE');
    };


    // ==================== EXPENSES MANAGEMENT ====================

    /**
     * Adds a new expense record
     * @param {Object} expense - Expense data (category, amount, date, description, unitId)
     */
    const addExpense = async (expense) => {
        const tempId = crypto.randomUUID();

        // Optimistic update
        setExpenses([...expenses, { ...expense, id: tempId, user_id: user.id }]);

        try {
            const payload = {
                category: expense.category,
                amount: expense.amount,
                date: expense.date,
                description: expense.description,
                user_id: user.id,
                unit_id: expense.unitId
            };

            const { data, error } = await supabase
                .from('expenses')
                .insert([payload])
                .select();

            if (error) throw error;

            // Replace temp ID with real ID
            setExpenses(prev => prev.map(e =>
                e.id === tempId ? { ...data[0], unitId: data[0].unit_id } : e
            ));
        } catch (err) {
            console.error("Error adding expense:", err);
            // Revert optimistic update
            setExpenses(prev => prev.filter(e => e.id !== tempId));
        }
    };

    /**
     * Deletes an expense record
     * @param {string} expenseId - Expense ID to delete
     */
    const deleteExpense = async (expenseId) => {
        try {
            const { error } = await supabase
                .from('expenses')
                .delete()
                .eq('id', expenseId);

            if (error) throw error;

            setExpenses(prev => prev.filter(e => e.id !== expenseId));
        } catch (err) {
            console.error("Error deleting expense:", err);
            alert("Failed to delete expense.");
        }
    };

    // ==================== PAYMENTS MANAGEMENT ====================

    /**
     * Records a rent payment for a specific month
     * @param {string} unitId - Unit ID
     * @param {string} forMonth - Month in YYYY-MM format
     * @param {string} customDate - Optional custom payment date (YYYY-MM-DD)
     */
    const markPaid = async (unitId, forMonth, customDate = null) => {
        // Prevent duplicate payments for the same month
        if (payments.find(p => p.unitId === unitId && p.forMonth === forMonth)) return;

        const unit = units.find(u => u.id === unitId);
        if (!unit) return;

        // Use lease rent if available (fallback to legacy unit rent)
        const activeLease = getActiveLease(unitId);
        const rentAmount = activeLease ? activeLease.rentAmount : unit.rent;

        const paymentData = {
            unit_id: unitId,
            user_id: user.id,
            date_paid: customDate || new Date().toISOString().split('T')[0],
            amount: rentAmount, // Snapshot current rent at time of payment
            for_month: forMonth
        };

        const tempId = crypto.randomUUID();

        // Optimistic update
        setPayments([...payments, {
            ...paymentData,
            id: tempId,
            unitId: unitId,
            forMonth: forMonth
        }]);

        try {
            const { data, error } = await supabase
                .from('payments')
                .insert([paymentData])
                .select();

            if (error) throw error;

            // Replace temp ID with real ID
            setPayments(prev => prev.map(p =>
                p.id === tempId ? {
                    ...data[0],
                    unitId: data[0].unit_id,
                    forMonth: data[0].for_month,
                    datePaid: data[0].date_paid
                } : p
            ));
        } catch (err) {
            console.error("Error recording payment:", err);
            // Revert optimistic update
            setPayments(prev => prev.filter(p => p.id !== tempId));
        }
    };

    /**
     * Updates an existing payment record
     * @param {string} id - Payment ID
     * @param {Object} updates - Fields to update (datePaid, amount)
     */
    const updatePayment = async (id, updates) => {
        // Optimistic update
        setPayments(prev => prev.map(p =>
            p.id === id ? { ...p, ...updates } : p
        ));

        try {
            const dbPayload = {};
            if (updates.datePaid !== undefined)
                dbPayload.date_paid = updates.datePaid;
            if (updates.amount !== undefined)
                dbPayload.amount = updates.amount;

            const { error } = await supabase
                .from('payments')
                .update(dbPayload)
                .eq('id', id);

            if (error) throw error;
        } catch (err) {
            console.error("Error updating payment:", err);
            // Revert by re-fetching
            fetchAndNormalize();
        }
    };

    /**
     * Deletes a payment record
     * @param {string} id - Payment ID to delete
     */
    const deletePayment = async (id) => {
        try {
            const { error } = await supabase
                .from('payments')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setPayments(prev => prev.filter(p => p.id !== id));
        } catch (err) {
            console.error("Error deleting payment:", err);
            alert("Failed to delete payment.");
        }
    };

    // ==================== MAINTENANCE MANAGEMENT ====================

    /**
     * Adds a new maintenance task
     * @param {Object} taskData 
     */
    const addMaintenance = async (taskData) => {
        const tempId = crypto.randomUUID();

        // Calculate next due date if not provided
        let nextDue = taskData.nextDue;
        if (!nextDue && taskData.lastPerformed) {
            const date = new Date(taskData.lastPerformed);
            date.setMonth(date.getMonth() + parseInt(taskData.frequencyMonths));
            nextDue = date.toISOString().split('T')[0];
        } else if (!nextDue) {
            // If never done (new install), maybe due in X months from now? 
            // Or verify logic. Let's assume start counting from now.
            const date = new Date();
            date.setMonth(date.getMonth() + parseInt(taskData.frequencyMonths));
            nextDue = date.toISOString().split('T')[0];
        }

        const optimisticTask = { ...taskData, id: tempId, nextDue, status: 'PENDING', userId: user.id };
        setMaintenances(prev => [...prev, optimisticTask]);

        try {
            const dbPayload = mapMaintenanceToDB({ ...taskData, nextDue });
            const { data, error } = await supabase.from('maintenances').insert([dbPayload]).select();
            if (error) throw error;

            setMaintenances(prev => prev.map(m => m.id === tempId ? mapMaintenanceFromDB(data[0]) : m));
        } catch (error) {
            console.error("Error adding maintenance:", error);
            setMaintenances(prev => prev.filter(m => m.id !== tempId));
        }
    };

    /**
     * Completes a maintenance task and creates an expense
     * @param {string} id - Maintenance ID
     * @param {Object} completionData - { cost, datePerformed, notes }
     */
    const completeMaintenance = async (id, { cost, datePerformed, notes }) => {
        const task = maintenances.find(m => m.id === id);
        if (!task) return;

        // Calculate next due
        const date = new Date(datePerformed);
        date.setMonth(date.getMonth() + parseInt(task.frequencyMonths));
        const nextDue = date.toISOString().split('T')[0];

        // Optimistic update
        setMaintenances(prev => prev.map(m =>
            m.id === id ? { ...m, lastPerformed: datePerformed, nextDue, status: 'PENDING' } : m
        ));

        // Create Expense automatically
        await addExpense({
            category: 'Maintenance',
            amount: parseFloat(cost),
            date: datePerformed,
            description: `Mantenimiento Preventivo: ${task.title}`,
            unitId: task.unitId
        });

        try {
            const { error } = await supabase
                .from('maintenances')
                .update({
                    last_performed: datePerformed,
                    next_due: nextDue,
                    status: 'PENDING' // Reset status to pending for next cycle
                })
                .eq('id', id);

            if (error) throw error;
        } catch (error) {
            console.error("Error completing maintenance:", error);
            fetchAndNormalize();
        }
    };

    /**
     * Deletes a maintenance task
     * @param {string} id 
     */
    const deleteMaintenance = async (id) => {
        try {
            const { error } = await supabase.from('maintenances').delete().eq('id', id);
            if (error) throw error;
            setMaintenances(prev => prev.filter(m => m.id !== id));
        } catch (error) {
            console.error("Error deleting maintenance:", error);
        }
    };




    // ==================== CONTEXT VALUE ====================
    // Memoize to prevent unnecessary re-renders
    const value = useMemo(() => ({
        units,
        leases,
        expenses,
        payments,
        maintenances,
        addUnit,
        updateUnit,
        deleteUnit,
        toggleUnitActive,
        addLease,
        updateLease,
        terminateLease,
        getActiveLease,
        addExpense,
        deleteExpense,
        markPaid,
        updatePayment,
        deletePayment,
        addMaintenance,
        completeMaintenance,
        deleteMaintenance,
        loading
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }), [units, leases, expenses, payments, maintenances, loading]);

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};
