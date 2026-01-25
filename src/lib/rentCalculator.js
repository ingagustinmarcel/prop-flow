import { addMonths, isAfter, isBefore, startOfDay, subMonths } from 'date-fns';

/**
 * Calculates the next rent update based on IPC history and projections.
 * @param {Object} unit - The unit object (rent, lastIncrementDate, leaseStart)
 * @param {Array} ipcHistory - List of IPC data [{ date: 'YYYY-MM-DD', value: 0.04 }, ...] sorted Descending
 * @param {Number} frequencyMonths - Default 4
 */
export const calculateNextRent = (unit, ipcHistory, frequencyMonths = 4) => {
    if (!unit || !ipcHistory || ipcHistory.length === 0) return null;

    // Use calculateFullSchedule to get the timeline
    const fullSchedule = calculateFullSchedule(unit, ipcHistory, frequencyMonths);

    const leaseStart = new Date(unit.leaseStart);
    // Be robust: if lastIncrementDate is missing, assume we are at start (leaseStart)
    // However, if we are at start, the "Next" update is leaseStart + 4m.
    const lastInc = unit.lastIncrementDate ? new Date(unit.lastIncrementDate) : leaseStart;

    // Find the first schedule item that is strictly AFTER the last recorded increment
    // AND is in the future (or is the pending one we are looking for)
    // Actually, simply: the first item in the schedule with date > lastInc
    const nextUpdate = fullSchedule.find(u => new Date(u.date) > lastInc);

    if (!nextUpdate) return null; // Contract ended or no more updates

    return {
        nextDate: new Date(nextUpdate.date),
        currentRent: unit.rent,
        newRent: nextUpdate.newRent,
        increaseAmount: nextUpdate.increaseAmount,
        percentChange: nextUpdate.percentChange,
        isProjected: nextUpdate.isProjected,
        projectionDetails: nextUpdate.details
    };
};

/**
 * Generates ALL updates for the duration of the contract (Lease Start -> Lease End)
 * Anchored strictly to leaseStart.
 */
export const calculateFullSchedule = (unit, ipcHistory, frequencyMonths = 4) => {
    if (!unit || !unit.leaseStart || !ipcHistory) return [];

    const schedule = [];
    const leaseStart = new Date(unit.leaseStart);
    // Lease End default to 2 years if not set
    const leaseEnd = unit.leaseEnd ? new Date(unit.leaseEnd) : addMonths(leaseStart, 24);

    const lastInc = unit.lastIncrementDate ? new Date(unit.lastIncrementDate) : leaseStart;
    let runningRent = unit.rent; // This will start as Current Rent and evolve for future items

    let loopDate = leaseStart;
    let iterations = 0;

    while (iterations < 60) {
        iterations++;
        // ANCHOR LOGIC: strict multiples of frequency from leaseStart
        const targetDate = addMonths(loopDate, frequencyMonths);

        // Stop if we go past the lease end
        if (isAfter(targetDate, leaseEnd)) break;

        // Is this update in the future relative to the *Last Recorded Increment*?
        // (Note: we use Last Increment as the "Checkpoint" of what is real/finalized)
        const isFuture = isAfter(targetDate, lastInc);

        // The IPC interval is the N months leading up to targetDate
        // e.g. from targetDate - 4m to targetDate
        const prevDate = addMonths(targetDate, -frequencyMonths); // Should be equal to loopDate essentially

        const calculation = calculateInterval(runningRent, prevDate, targetDate, ipcHistory);

        let itemRent = 0;
        let itemInc = 0;

        if (isFuture) {
            // If valid future update, we apply the calculation to our running rent
            const nextRent = calculation.newRent;
            itemRent = nextRent;
            itemInc = nextRent - runningRent;

            // Update the running rent for subsequent future calculations
            runningRent = nextRent;
        } else {
            // Past/Completed update.
            // We generally don't know the historical rent values unless we reverse calculate 
            // or check a history table. For now, we leave them 0 to indicate "N/A" or "Done".
            // Or we could populate 'runningRent' if we wanted to assume perfect history, 
            // but 'unit.rent' is our only source of truth for "Now".
            itemRent = 0;
        }

        schedule.push({
            date: targetDate.toISOString().split('T')[0],
            newRent: itemRent,
            increaseAmount: itemInc,
            percentChange: calculation.percentChange,
            isProjected: calculation.isProjected,
            details: calculation.details,
            status: isFuture ? 'pending' : 'completed'
        });

        loopDate = targetDate;
    }

    return schedule;
};


// Helper to calculate 1 interval
const calculateInterval = (baseRent, startDate, endDate, ipcHistory) => {
    // Sort History Ascending for easy chronological lookup
    const historyAsc = [...ipcHistory].sort((a, b) => new Date(a.date) - new Date(b.date));

    // Fallback if no history exists at all
    const lastRecorded = historyAsc[historyAsc.length - 1];
    const lastRecordedVal = lastRecorded ? lastRecorded.value : 0.025; // Default 2.5%

    let accumulatedFactor = 1.0;
    let isProjected = false;
    let details = [];

    // We need to iterate month by month from startDate to endDate
    let monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth());

    // Safety for weird dates
    if (monthsDiff <= 0) monthsDiff = 4;

    for (let i = 0; i < monthsDiff; i++) {
        // Evaluate the month starting at 'currentSlice'
        const currentSlice = addMonths(startDate, i);
        // We look for IPC data matching this month. 
        // Example: Interval is Jan -> May. 
        // We need inflation for Jan, Feb, Mar, Apr.
        // IPC data is usually labeled by the month it represents.

        const sliceStr = currentSlice.toISOString().slice(0, 7); // YYYY-MM

        const match = historyAsc.find(h => h.date.startsWith(sliceStr));

        if (match) {
            accumulatedFactor *= (1 + match.value);
            details.push({ date: match.date, value: match.value, type: 'real' });
        } else {
            isProjected = true;
            accumulatedFactor *= (1 + lastRecordedVal);
            details.push({ date: sliceStr + '-01', value: lastRecordedVal, type: 'projected' });
        }
    }

    const newRent = Math.round(baseRent * accumulatedFactor);

    return {
        newRent,
        percentChange: ((accumulatedFactor - 1) * 100).toFixed(2),
        isProjected,
        details
    };
};
