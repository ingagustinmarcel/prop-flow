import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings2, User, FileText, Globe, Check, Upload, X } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

function SettingsCard({ title, icon: Icon, children }) {
    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <Icon size={18} className="text-emerald-600" />
                <h2 className="font-semibold text-slate-800">{title}</h2>
            </div>
            <div className="p-6">{children}</div>
        </div>
    );
}

export default function Settings() {
    const { t, i18n } = useTranslation();
    const { settings, updateSettings } = useSettings();

    const [ownerName, setOwnerName] = useState(settings.ownerName || '');
    const [dateFormat, setDateFormat] = useState(settings.dateFormat || 'dd/mm/yyyy');
    const [signatureDataUrl, setSignatureDataUrl] = useState(settings.signatureDataUrl || null);
    const [saved, setSaved] = useState(false);
    const [currentLang, setCurrentLang] = useState(i18n.language?.startsWith('es') ? 'es' : 'en');

    const fileInputRef = useRef(null);

    const handleSignatureUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (ev) => setSignatureDataUrl(ev.target.result);
        reader.readAsDataURL(file);
    };

    const handleRemoveSignature = () => {
        setSignatureDataUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleLanguageToggle = () => {
        const newLang = currentLang === 'en' ? 'es' : 'en';
        i18n.changeLanguage(newLang);
        setCurrentLang(newLang);
    };

    const handleSave = () => {
        updateSettings({ ownerName, dateFormat, signatureDataUrl });
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Page Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-5">
                <div className="max-w-3xl mx-auto flex items-center gap-3">
                    <Settings2 size={24} className="text-emerald-600" />
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">{t('settings.title')}</h1>
                        <p className="text-sm text-slate-500 mt-0.5">
                            {currentLang === 'es' ? 'Personalizá tu cuenta y los recibos' : 'Customize your account and receipts'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
                {/* Account Card */}
                <SettingsCard title={t('settings.account')} icon={User}>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        {t('settings.ownerName')}
                    </label>
                    <input
                        type="text"
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                        placeholder={t('settings.ownerNamePlaceholder')}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
                    />
                    <p className="text-xs text-slate-400 mt-2">
                        {currentLang === 'es'
                            ? 'Aparecerá debajo de la firma en los recibos PDF.'
                            : 'Will appear below the signature on PDF receipts.'}
                    </p>
                </SettingsCard>

                {/* Receipts / Signature Card */}
                <SettingsCard title={t('settings.receipts')} icon={FileText}>
                    <p className="text-sm text-slate-500 mb-4">{t('settings.signatureHint')}</p>

                    {signatureDataUrl ? (
                        <div className="space-y-3">
                            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 inline-flex">
                                <img
                                    src={signatureDataUrl}
                                    alt={t('settings.signaturePreview')}
                                    className="max-h-24 max-w-[280px] object-contain"
                                />
                            </div>
                            <div>
                                <button
                                    onClick={handleRemoveSignature}
                                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                >
                                    <X size={14} />
                                    {t('settings.removeSignature')}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-slate-300 hover:border-emerald-400 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 rounded-lg transition-all text-sm font-medium"
                        >
                            <Upload size={16} />
                            {t('settings.uploadSignature')}
                        </button>
                    )}

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg"
                        onChange={handleSignatureUpload}
                        className="hidden"
                    />
                </SettingsCard>

                {/* Preferences Card */}
                <SettingsCard title={t('settings.preferences')} icon={Globe}>
                    {/* Language */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-700 mb-3">
                            {t('settings.language')}
                        </label>
                        <div className="flex gap-3">
                            {['es', 'en'].map((lang) => (
                                <button
                                    key={lang}
                                    onClick={() => {
                                        if (currentLang !== lang) handleLanguageToggle();
                                    }}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${currentLang === lang
                                            ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
                                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                        }`}
                                >
                                    <span>{lang === 'es' ? '🇦🇷' : '🇺🇸'}</span>
                                    <span>{lang === 'es' ? 'Español' : 'English'}</span>
                                    {currentLang === lang && <Check size={14} />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Date Format */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-3">
                            {t('settings.dateFormat')}
                        </label>
                        <div className="space-y-2">
                            {[
                                { value: 'dd/mm/yyyy', label: t('settings.dateFormatDMY') },
                                { value: 'mm/dd/yyyy', label: t('settings.dateFormatMDY') },
                            ].map((opt) => (
                                <label
                                    key={opt.value}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-all ${dateFormat === opt.value
                                            ? 'bg-emerald-50 border-emerald-400'
                                            : 'bg-white border-slate-200 hover:border-slate-300'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="dateFormat"
                                        value={opt.value}
                                        checked={dateFormat === opt.value}
                                        onChange={() => setDateFormat(opt.value)}
                                        className="accent-emerald-600"
                                    />
                                    <span className="text-sm text-slate-700">{opt.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </SettingsCard>

                {/* Save Button */}
                <div className="flex justify-end">
                    <button
                        onClick={handleSave}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${saved
                                ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                            }`}
                    >
                        {saved ? (
                            <>
                                <Check size={16} />
                                {t('settings.saved')}
                            </>
                        ) : (
                            t('settings.save')
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
