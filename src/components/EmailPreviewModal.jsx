import React from 'react';
import { Mail, X, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function EmailPreviewModal({ isOpen, onClose, recipient, subject, body }) {
    const { t } = useTranslation();

    if (!isOpen) return null;

    const handleSend = () => {
        const mailtoLink = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(mailtoLink, '_blank');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div className="flex items-center gap-2 text-slate-800">
                        <Mail size={20} className="text-blue-600" />
                        <h3 className="font-bold">{t('common.previewEmail')}</h3>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">{t('email.to')}</label>
                        <div className="p-2 bg-slate-50 border border-slate-200 rounded text-sm font-medium text-slate-700">
                            {recipient}
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">{t('email.subject')}</label>
                        <div className="p-2 bg-slate-50 border border-slate-200 rounded text-sm font-medium text-slate-900">
                            {subject}
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">{t('email.message')}</label>
                        <textarea
                            readOnly
                            value={body}
                            className="w-full h-64 p-3 bg-white border border-slate-200 rounded text-sm text-slate-600 leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>
                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        onClick={handleSend}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                    >
                        <Send size={16} />
                        {t('email.openMailClient')}
                    </button>
                </div>
            </div>
        </div>
    );
}
