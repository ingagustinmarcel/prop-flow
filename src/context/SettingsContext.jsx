import React, { createContext, useContext, useState, useCallback } from 'react';

const STORAGE_KEY = 'propflow_settings';

const defaultSettings = {
    ownerName: '',
    dateFormat: 'dd/mm/yyyy', // 'dd/mm/yyyy' | 'mm/dd/yyyy'
    signatureDataUrl: null,
    language: 'es',
};

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
    const [settings, setSettings] = useState(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
        } catch {
            return defaultSettings;
        }
    });

    const updateSettings = useCallback((updates) => {
        setSettings(prev => {
            const next = { ...prev, ...updates };
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            } catch {
                // localStorage not available
            }
            return next;
        });
    }, []);

    return (
        <SettingsContext.Provider value={{ settings, updateSettings }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const ctx = useContext(SettingsContext);
    if (!ctx) throw new Error('useSettings must be used inside SettingsProvider');
    return ctx;
}
