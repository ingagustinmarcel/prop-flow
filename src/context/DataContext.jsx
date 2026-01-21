import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { addMonths, differenceInDays } from 'date-fns';

const DataContext = createContext();

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
    const { user } = useAuth();
    const [units, setUnits] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- Mappers ---
    const mapUnitFromDB = (u) => ({
        ...u,
        securityDeposit: u.security_deposit,
        incrementPercentage: u.increment_percentage,
        leaseStart: u.lease_start,
        leaseEnd: u.lease_end,
        lastIncrementDate: u.last_increment_date,
        isActive: u.is_active ?? true
    });

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
        user_id: user.id
    });

    const fetchAndNormalize = async () => {
        if (!user) return;
        setLoading(true);

        const { data: u } = await supabase.from('units').select('*');
        if (u) setUnits(u.map(mapUnitFromDB));

        const { data: e } = await supabase.from('expenses').select('*');
        if (e) setExpenses(e.map(x => ({ ...x, unitId: x.unit_id })));

        const { data: p } = await supabase.from('payments').select('*');
        if (p) setPayments(p.map(x => ({ ...x, unitId: x.unit_id, forMonth: x.for_month, datePaid: x.date_paid })));

        setLoading(false);
    }

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

    // --- Units Logic ---
    const addUnit = async (newUnit) => {
        const tempId = crypto.randomUUID();
        const optimisticUnit = { ...newUnit, id: tempId, user_id: user.id };
        setUnits([...units, optimisticUnit]);

        try {
            const dbPayload = mapUnitToDB(newUnit);

            // Remove undefined keys to prevent DB errors
            Object.keys(dbPayload).forEach(key => dbPayload[key] === undefined && delete dbPayload[key]);

            console.log("Adding unit to Supabase:", dbPayload);

            const { data, error } = await supabase.from('units').insert([dbPayload]).select();

            if (error) {
                console.error("Supabase Insert Error:", error);
                throw error;
            }
            // Replace optimistic
            setUnits(prev => prev.map(u => u.id === tempId ? mapUnitFromDB(data[0]) : u));
        } catch (err) {
            console.error("Error adding unit:", err);
            alert(`Failed to save unit: ${err.message}`);
            // Revert
            setUnits(prev => prev.filter(u => u.id !== tempId));
        }
    };

    const updateUnit = async (id, updatedFields) => {
        setUnits(prev => prev.map(u => u.id === id ? { ...u, ...updatedFields } : u));

        try {
            // Convert partial updates to snake_case
            const dbPayload = {};
            if (updatedFields.securityDeposit !== undefined) dbPayload.security_deposit = updatedFields.securityDeposit;
            if (updatedFields.incrementPercentage !== undefined) dbPayload.increment_percentage = updatedFields.incrementPercentage;
            if (updatedFields.leaseStart !== undefined) dbPayload.lease_start = updatedFields.leaseStart;
            if (updatedFields.leaseEnd !== undefined) dbPayload.lease_end = updatedFields.leaseEnd;
            if (updatedFields.rent !== undefined) dbPayload.rent = updatedFields.rent;
            if (updatedFields.name !== undefined) dbPayload.name = updatedFields.name;
            if (updatedFields.tenant !== undefined) dbPayload.tenant = updatedFields.tenant;
            if (updatedFields.lastIncrementDate !== undefined) dbPayload.last_increment_date = updatedFields.lastIncrementDate;
            if (updatedFields.isActive !== undefined) dbPayload.is_active = updatedFields.isActive;

            const { error } = await supabase.from('units').update(dbPayload).eq('id', id);
            if (error) throw error;
        } catch (err) {
            console.error("Error updating unit:", err);
            fetchAndNormalize();
        }
    };

    const deleteUnit = async (id) => {
        try {
            // First check if it has any associated data that might block deletion (though cascades are on)
            // But we want to follow user's logic: if "has info" -> archive instead.
            const hasPayments = payments.some(p => p.unitId === id);
            const hasExpenses = expenses.some(e => e.unitId === id);

            if (hasPayments || hasExpenses) {
                // Archive instead of delete
                await updateUnit(id, { isActive: false });
                alert("Unit has financial history. It has been archived instead of deleted.");
                return;
            }

            // Attempt deletion
            const { error } = await supabase.from('units').delete().eq('id', id);
            if (error) throw error;

            setUnits(prev => prev.filter(u => u.id !== id));
        } catch (err) {
            console.error("Error during unit deletion:", err);
            alert("Failed to delete unit. It might have linked documents or other data.");
        }
    };

    const toggleUnitActive = async (id, status) => {
        await updateUnit(id, { isActive: status });
    };

    // --- Expenses ---
    const addExpense = async (expense) => {
        console.log('📝 Adding expense:', expense);
        const tempId = crypto.randomUUID();
        setExpenses([...expenses, { ...expense, id: tempId, user_id: user.id }]);

        try {
            // Create payload with ONLY database fields (snake_case)
            const payload = {
                category: expense.category,
                amount: expense.amount,
                date: expense.date,
                description: expense.description,
                user_id: user.id,
                unit_id: expense.unitId
            };
            console.log('💾 Saving to database:', payload);

            const { data, error } = await supabase.from('expenses').insert([payload]).select();

            if (error) throw error;
            console.log('✅ Expense saved:', data[0]);
            setExpenses(prev => prev.map(e => e.id === tempId ? { ...data[0], unitId: data[0].unit_id } : e));
        } catch (err) {
            console.error("❌ Error adding expense:", err);
            setExpenses(prev => prev.filter(e => e.id !== tempId));
        }
    };

    // --- Payments ---
    const markPaid = async (unitId, forMonth, customDate = null) => {
        // Prevent dupes locally if we can check
        if (payments.find(p => p.unitId === unitId && p.forMonth === forMonth)) return;

        const unit = units.find(u => u.id === unitId);
        if (!unit) return;

        const paymentData = {
            unit_id: unitId,
            user_id: user.id,
            date_paid: customDate || new Date().toISOString().split('T')[0],
            amount: unit.rent,
            for_month: forMonth
        };

        const tempId = crypto.randomUUID();
        // Optimistic
        setPayments([...payments, { ...paymentData, id: tempId, unitId: unitId, forMonth: forMonth }]);

        try {
            const { data, error } = await supabase.from('payments').insert([paymentData]).select();
            if (error) throw error;

            setPayments(prev => prev.map(p => p.id === tempId ? { ...data[0], unitId: data[0].unit_id, forMonth: data[0].for_month, datePaid: data[0].date_paid } : p));
        } catch (err) {
            console.error("Error paying:", err);
            setPayments(prev => prev.filter(p => p.id !== tempId));
        }
    };

    // --- Migration Tool ---
    const migrateLocalData = async () => {
        try {
            setLoading(true);
            const localUnits = JSON.parse(localStorage.getItem('propflow_units') || '[]');

            if (localUnits.length === 0) {
                alert("No local data found to migrate.");
                setLoading(false);
                return;
            }

            console.log(`Migrating ${localUnits.length} units...`);

            let migratedCount = 0;
            for (const unit of localUnits) {
                // Remove ID to let DB generate new UUID
                const { id, ...unitData } = unit;
                // Ensure data maps correctly
                const dbPayload = mapUnitToDB(unitData);
                // Sanitize
                Object.keys(dbPayload).forEach(key => dbPayload[key] === undefined && delete dbPayload[key]);

                const { error } = await supabase.from('units').insert([dbPayload]);
                if (!error) migratedCount++;
            }

            alert(`Migration Complete! Moved ${migratedCount} units to the cloud.`);
            fetchAndNormalize(); // Refresh data
        } catch (err) {
            console.error("Migration failed:", err);
            alert("Migration failed. Check console.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <DataContext.Provider value={{
            units,
            expenses,
            payments,
            addUnit,
            updateUnit,
            deleteUnit,
            toggleUnitActive,
            addExpense,
            markPaid,
            migrateLocalData,
            loading
        }}>
            {children}
        </DataContext.Provider>
    );
};
