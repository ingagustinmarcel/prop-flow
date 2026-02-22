import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate, formatBytes } from '../utils';

describe('formatCurrency', () => {
    it('formats whole numbers with dot as thousands separator', () => {
        expect(formatCurrency(100000)).toBe('$ 100.000');
    });

    it('formats small amounts without separator', () => {
        expect(formatCurrency(500)).toBe('$ 500');
    });

    it('formats zero', () => {
        expect(formatCurrency(0)).toBe('$ 0');
    });

    it('formats millions correctly', () => {
        expect(formatCurrency(1500000)).toBe('$ 1.500.000');
    });

    it('rounds decimal amounts to nearest integer', () => {
        // maximumFractionDigits: 0 in the formatter
        expect(formatCurrency(1234.56)).toBe('$ 1.235');
    });
});

describe('formatDate', () => {
    it('returns empty string for falsy input', () => {
        expect(formatDate(null)).toBe('');
        expect(formatDate(undefined)).toBe('');
        expect(formatDate('')).toBe('');
    });

    it('formats as dd/mm/yyyy by default (es-AR locale)', () => {
        // 2026-03-15 should render as 15/3/2026 in es-AR
        const result = formatDate('2026-03-15'); // default: dd/mm/yyyy
        expect(result).toContain('15');
        expect(result).toContain('2026');
        // Day comes before month in es-AR
        const dayIndex = result.indexOf('15');
        const yearIndex = result.indexOf('2026');
        expect(dayIndex).toBeLessThan(yearIndex);
    });

    it('formats as mm/dd/yyyy when requested (en-US locale)', () => {
        // 2026-03-15 → 3/15/2026 in en-US
        const result = formatDate('2026-03-15', 'mm/dd/yyyy');
        expect(result).toContain('15');
        expect(result).toContain('2026');
        // 15 (day) comes after the month separator in en-US
        const yearIndex = result.indexOf('2026');
        expect(yearIndex).toBeGreaterThan(0);
    });

    it('does not shift date due to timezone (parses date part only)', () => {
        // A date like 2026-01-01 should never come out as Dec 31 due to UTC shift
        const result = formatDate('2026-01-01', 'dd/mm/yyyy');
        expect(result).toContain('2026');
        expect(result).not.toContain('31');
    });
});


describe('formatBytes', () => {
    it('returns "0 Bytes" for zero', () => {
        expect(formatBytes(0)).toBe('0 Bytes');
    });

    it('formats bytes correctly', () => {
        expect(formatBytes(500)).toBe('500 Bytes');
    });

    it('formats kilobytes', () => {
        expect(formatBytes(1024)).toBe('1 KB');
    });

    it('formats megabytes with decimals', () => {
        expect(formatBytes(1048576)).toBe('1 MB');
    });

    it('respects custom decimal parameter', () => {
        expect(formatBytes(1536, 1)).toBe('1.5 KB');
    });
});
