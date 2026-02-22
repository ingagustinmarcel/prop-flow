import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export const formatCurrency = (amount) => {
    // Custom formatter for Argentine format:
    // - $ symbol at the beginning
    // - Dot (.) for thousands separator
    // - Comma (,) for decimals (when needed)
    const formatted = new Intl.NumberFormat('de-DE', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);

    return `$ ${formatted}`;
};

export const formatDate = (dateString, dateFormat = 'dd/mm/yyyy') => {
    if (!dateString) return '';
    const locale = dateFormat === 'mm/dd/yyyy' ? 'en-US' : 'es-AR';
    // Parse as UTC to avoid timezone-shift issues
    const parts = String(dateString).split('T')[0].split('-');
    const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return date.toLocaleDateString(locale);
};


export function formatBytes(bytes, decimals = 2) {
    if (!+bytes) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
