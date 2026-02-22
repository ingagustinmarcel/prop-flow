import { describe, it, expect } from 'vitest';
import en from '../en.json';
import es from '../es.json';

/**
 * Recursively collect all keys from a nested object, producing dot-separated paths.
 * e.g. { a: { b: "x" } } → ["a.b"]
 */
function collectKeys(obj, prefix = '') {
    let keys = [];
    for (const key of Object.keys(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof obj[key] === 'object' && obj[key] !== null) {
            keys = keys.concat(collectKeys(obj[key], fullKey));
        } else {
            keys.push(fullKey);
        }
    }
    return keys;
}

/**
 * Get the value at a dot-separated path in a nested object.
 */
function getNestedValue(obj, path) {
    return path.split('.').reduce((acc, key) => acc?.[key], obj);
}

describe('Translation completeness', () => {
    const enKeys = collectKeys(en);
    const esKeys = collectKeys(es);

    it('every key in en.json exists in es.json', () => {
        const missingInEs = enKeys.filter(k => !esKeys.includes(k));
        expect(missingInEs).toEqual([]);
    });

    it('every key in es.json exists in en.json', () => {
        const missingInEn = esKeys.filter(k => !enKeys.includes(k));
        expect(missingInEn).toEqual([]);
    });

    it('no translation value is an empty string in en.json', () => {
        const emptyKeys = enKeys.filter(k => getNestedValue(en, k) === '');
        expect(emptyKeys).toEqual([]);
    });

    it('no translation value is an empty string in es.json', () => {
        const emptyKeys = esKeys.filter(k => getNestedValue(es, k) === '');
        expect(emptyKeys).toEqual([]);
    });

    it('receipt keys are present in both locales', () => {
        const requiredReceiptKeys = [
            'receipt.title', 'receipt.receiptId', 'receipt.dateIssued',
            'receipt.propertyDetails', 'receipt.property', 'receipt.tenant',
            'receipt.paymentInfo', 'receipt.period', 'receipt.amountPaid',
            'receipt.datePaid', 'receipt.paidInFull', 'receipt.footer', 'receipt.na',
        ];

        for (const key of requiredReceiptKeys) {
            expect(getNestedValue(en, key), `Missing in en.json: ${key}`).toBeTruthy();
            expect(getNestedValue(es, key), `Missing in es.json: ${key}`).toBeTruthy();
        }
    });

    it('calendar modal keys are present in both locales', () => {
        const requiredCalendarKeys = [
            'calendar.managePayment', 'calendar.paymentRecorded',
            'calendar.datePaid', 'calendar.receipt',
        ];

        for (const key of requiredCalendarKeys) {
            expect(getNestedValue(en, key), `Missing in en.json: ${key}`).toBeTruthy();
            expect(getNestedValue(es, key), `Missing in es.json: ${key}`).toBeTruthy();
        }
    });
});
