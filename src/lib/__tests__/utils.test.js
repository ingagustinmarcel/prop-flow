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

    it('returns a non-empty string for a valid date', () => {
        const result = formatDate('2026-01-15');
        expect(result).toBeTruthy();
        expect(typeof result).toBe('string');
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
