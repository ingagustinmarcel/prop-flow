/**
 * Rent Calculator - Automated rent adjustment calculations based on IPC inflation data
 * 
 * This module handles:
 * - Calculating future rent increases based on historical IPC (inflation) data
 * - Generating complete rent schedules for the duration of a lease
 * - Projecting future increases when historical data is incomplete
 * 
 * Key Concepts:
 * - Rent increases are anchored to the lease start date
 * - Updates occur at regular intervals (default: every 4 months)
 * - IPC data is compounded month-by-month within each interval
 * - Missing future data uses the last known IPC value as projection
 */

import { addMonths, isAfter } from 'date-fns';

/**
 * Calculates the next scheduled rent update for a unit
 * 
 * @param {Object} unit - Unit object containing:
 *   - rent: current monthly rent amount
 *   - leaseStart: lease start date (YYYY-MM-DD)
 *   - leaseEnd: lease end date (YYYY-MM-DD, optional)
 *   - lastIncrementDate: date of last applied rent increase (YYYY-MM-DD, optional)
 * @param {Array} ipcHistory - Array of IPC data objects:
 *   - date: month of IPC data (YYYY-MM-DD)
 *   - value: inflation rate as decimal (e.g., 0.04 = 4%)
 * @param {number} frequencyMonths - Months between rent updates (default: 4)
 * @returns {Object|null} Next rent update details or null if no updates scheduled
 */
export const calculateNextRent = (unit, ipcHistory, frequencyMonths = 4) => {
    if (!unit || !ipcHistory || ipcHistory.length === 0) return null;

    // Generate full schedule of all rent updates
    const fullSchedule = calculateFullSchedule(unit, ipcHistory, frequencyMonths);

    const leaseStart = new Date(unit.leaseStart);
    const lastInc = unit.lastIncrementDate
        ? new Date(unit.lastIncrementDate)
        : leaseStart;

    // Find the first update that hasn't been applied yet
    const nextUpdate = fullSchedule.find(u => new Date(u.date) > lastInc);

    if (!nextUpdate) return null; // No more updates (lease ended)

    return {
        nextDate: new Date(nextUpdate.date),
        currentRent: unit.rent,
        newRent: nextUpdate.newRent,
        increaseAmount: nextUpdate.increaseAmount,
        percentChange: nextUpdate.percentChange,
        isProjected: nextUpdate.isProjected,
        isManualOverride: nextUpdate.isManualOverride,
        projectionDetails: nextUpdate.details
    };
};

/**
 * Generates a complete schedule of all rent updates for the lease duration
 * 
 * This function:
 * 1. Anchors all updates to strict multiples of frequencyMonths from lease start
 * 2. Calculates actual increases for future updates using IPC data
 * 3. Marks past updates as completed (without recalculating historical values)
 * 4. Compounds inflation month-by-month within each interval
 * 
 * @param {Object} unit - Unit object (see calculateNextRent)
 * @param {Array} ipcHistory - IPC data array (see calculateNextRent)
 * @param {number} frequencyMonths - Months between updates (default: 4)
 * @returns {Array} Array of update objects with date, newRent, increaseAmount, etc.
 */
export const calculateFullSchedule = (unit, ipcHistory, frequencyMonths = 4) => {
    if (!unit || !unit.leaseStart || !ipcHistory) return [];

    const schedule = [];
    const leaseStart = new Date(unit.leaseStart);

    // Default to 2-year lease if end date not specified
    const leaseEnd = unit.leaseEnd
        ? new Date(unit.leaseEnd)
        : addMonths(leaseStart, 24);

    const lastInc = unit.lastIncrementDate
        ? new Date(unit.lastIncrementDate)
        : leaseStart;

    // Running rent tracks the evolving rent for future calculations
    let runningRent = unit.rent;
    let iterations = 0;

    // Generate updates at regular intervals from lease start
    let hasAppliedOverride = false;

    while (iterations < 60) { // Safety limit
        iterations++;

        // Calculate next update date (anchored to lease start to avoid drift)
        const targetDate = addMonths(leaseStart, iterations * frequencyMonths);

        // Stop if we've passed the lease end date
        if (isAfter(targetDate, leaseEnd)) break;

        // Determine if this update is in the future (not yet applied)
        const isFuture = isAfter(targetDate, lastInc);

        // Calculate the interval: from previous update to this update
        const prevDate = addMonths(leaseStart, (iterations - 1) * frequencyMonths);
        const calculation = calculateInterval(runningRent, prevDate, targetDate, ipcHistory);

        let itemRent = 0;
        let itemInc = 0;
        let isManualOverride = false;

        if (isFuture) {
            // Future update: check for manual override on the FIRST future update only
            if (unit.rentOverride && !hasAppliedOverride) {
                itemRent = Number(unit.rentOverride);
                itemInc = itemRent - runningRent;
                isManualOverride = true;
                hasAppliedOverride = true;
            } else {
                itemRent = calculation.newRent;
                itemInc = itemRent - runningRent;
            }

            // Update running rent for subsequent calculations
            runningRent = itemRent;
        } else {
            // Past update
            itemRent = 0;
        }

        schedule.push({
            date: targetDate.toISOString().split('T')[0],
            newRent: itemRent,
            increaseAmount: itemInc,
            percentChange: isManualOverride ? ((itemInc / (itemRent - itemInc)) * 100).toFixed(2) : calculation.percentChange,
            isProjected: isManualOverride ? false : calculation.isProjected,
            isManualOverride,
            details: isManualOverride ? [] : calculation.details,
            status: isFuture ? 'pending' : 'completed'
        });
    }

    return schedule;
};

/**
 * Calculates rent increase for a single interval by compounding monthly IPC data
 * 
 * Process:
 * 1. Iterate through each month in the interval
 * 2. Find matching IPC data for that month
 * 3. If no data exists, use last known value (marks as projected)
 * 4. Compound all monthly factors together
 * 5. Apply to base rent
 * 
 * @param {number} baseRent - Starting rent amount
 * @param {Date} startDate - Interval start date
 * @param {Date} endDate - Interval end date
 * @param {Array} ipcHistory - IPC data array
 * @returns {Object} Calculation result with newRent, percentChange, isProjected, details
 */
const calculateInterval = (baseRent, startDate, endDate, ipcHistory) => {
    // Sort IPC data chronologically for easier lookup
    const historyAsc = [...ipcHistory].sort((a, b) =>
        new Date(a.date) - new Date(b.date)
    );

    // Fallback value if no IPC data exists at all
    const lastRecorded = historyAsc[historyAsc.length - 1];
    const lastRecordedVal = lastRecorded ? lastRecorded.value : 0.025; // Default 2.5%

    let accumulatedFactor = 1.0;
    let isProjected = false;
    let details = [];

    // Calculate number of months in the interval
    let monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12
        + (endDate.getMonth() - startDate.getMonth());

    // Safety check for invalid date ranges
    if (monthsDiff <= 0) monthsDiff = 4;

    // Compound inflation month-by-month
    for (let i = 0; i < monthsDiff; i++) {
        const currentSlice = addMonths(startDate, i);
        const sliceStr = currentSlice.toISOString().slice(0, 7); // YYYY-MM

        // Look for IPC data matching this month
        const match = historyAsc.find(h => h.date.startsWith(sliceStr));

        if (match) {
            // Real data available
            accumulatedFactor *= (1 + match.value);
            details.push({
                date: match.date,
                value: match.value,
                type: 'real'
            });
        } else {
            // No data: use last known value as projection
            isProjected = true;
            accumulatedFactor *= (1 + lastRecordedVal);
            details.push({
                date: sliceStr + '-01',
                value: lastRecordedVal,
                type: 'projected'
            });
        }
    }

    // Apply compounded factor to base rent and round to nearest 500
    const rawRent = baseRent * accumulatedFactor;
    const newRent = Math.round(rawRent / 500) * 500;

    return {
        newRent,
        percentChange: ((accumulatedFactor - 1) * 100).toFixed(2),
        isProjected,
        details
    };
};
