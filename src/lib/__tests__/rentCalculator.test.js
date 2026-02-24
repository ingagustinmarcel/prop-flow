import { describe, it, expect } from 'vitest';
import { calculateNextRent, calculateFullSchedule } from '../rentCalculator';

// Helper: create IPC history for a range of months with a fixed rate
const makeIpcHistory = (startYear, startMonth, count, rate = 0.04) => {
    const history = [];
    for (let i = 0; i < count; i++) {
        const month = ((startMonth - 1 + i) % 12) + 1;
        const year = startYear + Math.floor((startMonth - 1 + i) / 12);
        history.push({
            date: `${year}-${String(month).padStart(2, '0')}-01`,
            value: rate,
        });
    }
    return history;
};

describe('calculateFullSchedule', () => {
    it('returns empty array when unit is null', () => {
        expect(calculateFullSchedule(null, [])).toEqual([]);
    });

    it('returns empty array when ipcHistory is null', () => {
        expect(calculateFullSchedule({ leaseStart: '2025-01-01', rent: 100000 }, null)).toEqual([]);
    });

    it('generates correct number of intervals for a 2-year lease with 4-month frequency', () => {
        const unit = {
            rent: 100000,
            leaseStart: '2025-01-01',
            leaseEnd: '2027-01-01',
        };
        const ipc = makeIpcHistory(2025, 1, 24, 0.04);
        const schedule = calculateFullSchedule(unit, ipc, 4);

        // 24 months / 4 = 6 intervals (at months 4, 8, 12, 16, 20, 24)
        // But month 24 exactly equals leaseEnd, isAfter will be false so it's included
        expect(schedule.length).toBe(6);
    });

    it('marks past updates as completed and future as pending', () => {
        const unit = {
            rent: 100000,
            leaseStart: '2025-01-01',
            leaseEnd: '2026-01-01',
            lastIncrementDate: '2025-05-01', // after the first 4-month mark
        };
        const ipc = makeIpcHistory(2025, 1, 12, 0.04);
        const schedule = calculateFullSchedule(unit, ipc, 4);

        // First update (May 2025) should be completed, second (Sep 2025) should be pending
        expect(schedule[0].status).toBe('completed');
        expect(schedule[1].status).toBe('pending');
    });

    it('rounds new rent to nearest 500', () => {
        const unit = {
            rent: 100000,
            leaseStart: '2025-01-01',
            leaseEnd: '2026-01-01',
        };
        const ipc = makeIpcHistory(2025, 1, 12, 0.04);
        const schedule = calculateFullSchedule(unit, ipc, 4);

        const pendingUpdates = schedule.filter(s => s.status === 'pending');
        for (const update of pendingUpdates) {
            expect(update.newRent % 500).toBe(0);
        }
    });
});

describe('calculateNextRent', () => {
    it('returns null when unit is null', () => {
        expect(calculateNextRent(null, [])).toBeNull();
    });

    it('returns null when ipcHistory is empty', () => {
        expect(calculateNextRent({ rent: 100000, leaseStart: '2025-01-01' }, [])).toBeNull();
    });

    it('returns the next pending update with correct structure', () => {
        const unit = {
            rent: 100000,
            leaseStart: '2025-01-01',
            leaseEnd: '2026-06-01',
        };
        const ipc = makeIpcHistory(2025, 1, 18, 0.04);
        const result = calculateNextRent(unit, ipc, 4);

        expect(result).not.toBeNull();
        expect(result).toHaveProperty('nextDate');
        expect(result).toHaveProperty('currentRent', 100000);
        expect(result).toHaveProperty('newRent');
        expect(result).toHaveProperty('increaseAmount');
        expect(result).toHaveProperty('percentChange');
        expect(result.newRent).toBeGreaterThan(result.currentRent);
        expect(result.newRent % 500).toBe(0);
    });

    it('marks result as projected when IPC data is incomplete', () => {
        const unit = {
            rent: 100000,
            leaseStart: '2025-01-01',
            leaseEnd: '2026-06-01',
        };
        // Only 2 months of IPC data — the rest will be projected
        const ipc = makeIpcHistory(2025, 1, 2, 0.04);
        const result = calculateNextRent(unit, ipc, 4);

        expect(result).not.toBeNull();
        expect(result.isProjected).toBe(true);
    });
});

describe('Manual Rent Overrides', () => {
    it('respects rentOverride for the next pending update', () => {
        const unit = {
            rent: 100000,
            leaseStart: '2025-01-01',
            leaseEnd: '2026-01-01',
            rentOverride: 120000,
        };
        const ipc = makeIpcHistory(2025, 1, 12, 0.04); // standard IPC calculation would be less
        const result = calculateNextRent(unit, ipc, 4);

        expect(result.newRent).toBe(120000);
        expect(result.isManualOverride).toBe(true);
    });

    it('uses the override as baseline for subsequent automatic updates', () => {
        const unit = {
            rent: 100000,
            leaseStart: '2024-01-01',
            leaseEnd: '2025-01-01',
            lastIncrementDate: '2024-01-01',
            rentOverride: 110000, // Override for first update (May 2024)
        };
        const ipc = makeIpcHistory(2024, 1, 12, 0.05); // 5% per month
        const schedule = calculateFullSchedule(unit, ipc, 4);

        // Update 1 (2024-05-01)
        expect(schedule[0].newRent).toBe(110000);
        expect(schedule[0].isManualOverride).toBe(true);

        // Update 2 (2024-09-01) - should build on 110,000 using IPC
        // Interval calculation uses 4 months of 5% gain: 1.05^4 = 1.2155
        // 110000 * 1.2155 = 133,705 -> round to 500 = 133,500
        expect(schedule[1].newRent).toBeGreaterThan(110000);
        expect(schedule[1].isManualOverride).toBe(false);
        expect(schedule[1].newRent % 500).toBe(0);

        // Let's verify exactly (1.05^4 * 110000 = 133705.8)
        expect(schedule[1].newRent).toBe(133500);
    });
});

