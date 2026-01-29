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
    const [expenses, setExpenses] = useState([]);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);

    // ==================== DATA MAPPERS ====================
    // Convert between database snake_case and JavaScript camelCase

    /**
     * Maps database unit record to application format
     * @param {Object} u - Unit record from Supabase
     * @returns {Object} Normalized unit object
     */
    const mapUnitFromDB = (u) => ({
        ...u,
        securityDeposit: u.security_deposit,
        incrementPercentage: u.increment_percentage,
        leaseStart: u.lease_start,
        leaseEnd: u.lease_end,
        lastIncrementDate: u.last_increment_date,
        isActive: u.is_active ?? true,
        tenantEmail: u.tenant_email
    });

    /**
     * Maps application unit object to database format
     * @param {Object} u - Unit object from application
     * @returns {Object} Database-ready unit record
     */
    const mapUnitToDB = (u) => ({
        name: u.name,
        tenant: u.tenant,
        rent: u.rent,
        security_deposit: u.securityDeposit,
        increment_percentage: u.incrementPercentage,
        lease_start: u.leaseStart,
        lease_end: u.leaseEnd,
        last_increment_date: u.lastIncrementDate,
        is_active: u.isActive ?? true,
        tenant_email: u.tenantEmail,
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

        // Fetch units
        const { data: u } = await supabase.from('units').select('*');
        if (u) setUnits(u.map(mapUnitFromDB));

        // Fetch expenses
        const { data: e } = await supabase.from('expenses').select('*');
        if (e) setExpenses(e.map(x => ({ ...x, unitId: x.unit_id })));

        // Fetch payments
        const { data: p } = await supabase.from('payments').select('*');
        if (p) setPayments(p.map(x => ({
            ...x,
            unitId: x.unit_id,
            forMonth: x.for_month,
            datePaid: x.date_paid
        })));

        setLoading(false);
    };

    // Load data when user logs in, clear when user logs out
    useEffect(() => {
        if (user) {
            fetchAndNormalize();
        } else {
            setUnits([]);
            setExpenses([]);
            setPayments([]);
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
            if (updatedFields.isActive !== undefined)
                dbPayload.is_active = updatedFields.isActive;
            if (updatedFields.tenantEmail !== undefined)
                dbPayload.tenant_email = updatedFields.tenantEmail;

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

            if (hasPayments || hasExpenses) {
                // Archive instead of delete to preserve data integrity
                await updateUnit(id, { isActive: false });
                alert("Unit has financial history. It has been archived instead of deleted.");
                return;
            }

            // Safe to delete - no financial history
            const { error } = await supabase.from('units').delete().eq('id', id);
            if (error) throw error;

            setUnits(prev => prev.filter(u => u.id !== id));
        } catch (err) {
            console.error("Error during unit deletion:", err);
            alert("Failed to delete unit. It might have linked documents or other data.");
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

        const paymentData = {
            unit_id: unitId,
            user_id: user.id,
            date_paid: customDate || new Date().toISOString().split('T')[0],
            amount: unit.rent, // Snapshot current rent at time of payment
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

    // ==================== MIGRATION UTILITY ====================

    /**
     * Migrates data from localStorage to Supabase
     * Used for transitioning from client-side to cloud storage
     */
    const migrateLocalData = async () => {
        try {
            setLoading(true);
            const localUnits = JSON.parse(localStorage.getItem('propflow_units') || '[]');

            if (localUnits.length === 0) {
                alert("No local data found to migrate.");
                setLoading(false);
                return;
            }

            let migratedCount = 0;
            for (const unit of localUnits) {
                // Remove local ID to let database generate new UUID
                const { id, ...unitData } = unit;
                const dbPayload = mapUnitToDB(unitData);

                // Remove undefined fields
                Object.keys(dbPayload).forEach(key =>
                    dbPayload[key] === undefined && delete dbPayload[key]
                );

                const { error } = await supabase.from('units').insert([dbPayload]);
                if (!error) migratedCount++;
            }

            alert(`Migration Complete! Moved ${migratedCount} units to the cloud.`);
            fetchAndNormalize();
        } catch (err) {
            console.error("Migration failed:", err);
            alert("Migration failed. Check console.");
        } finally {
            setLoading(false);
        }
    };

    // ==================== CONTEXT VALUE ====================
    // Memoize to prevent unnecessary re-renders
    const value = useMemo(() => ({
        units,
        expenses,
        payments,
        addUnit,
        updateUnit,
        deleteUnit,
        toggleUnitActive,
        addExpense,
        deleteExpense,
        markPaid,
        updatePayment,
        deletePayment,
        migrateLocalData,
        loading
    }), [units, expenses, payments, loading]);

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};
