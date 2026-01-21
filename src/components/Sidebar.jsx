import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Building2,
    Calculator,
    TrendingUp,
    Wallet,
    CalendarCheck,
    Globe
} from 'lucide-react';
import { cn } from '../lib/utils';

const SidebarItem = ({ to, icon: Icon, label }) => (
    <NavLink
        to={to}
        className={({ isActive }) => cn(
            "flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-200 group font-medium",
            isActive
                ? "bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100/50"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        )}
    >
        <Icon size={20} className="group-hover:scale-110 transition-transform duration-200" />
        <span>{label}</span>
    </NavLink>
);

export default function Sidebar() {
    const { t, i18n } = useTranslation();
    const [currentLang, setCurrentLang] = useState(i18n.language);

    const toggleLanguage = () => {
        const newLang = currentLang === 'en' ? 'es' : 'en';
        i18n.changeLanguage(newLang);
        setCurrentLang(newLang);
    };

    return (
        <div className="w-64 h-screen bg-white border-r border-slate-200 flex flex-col shadow-sm fixed left-0 top-0 hidden md:flex z-50">
            <div className="p-6 border-b border-slate-100">
                <div className="flex items-center gap-2 text-emerald-600">
                    <Building2 size={28} />
                    <span className="text-xl font-bold tracking-tight text-slate-800">PropFlow</span>
                </div>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                <SidebarItem to="/" icon={LayoutDashboard} label={t('nav.overview')} />
                <SidebarItem to="/units" icon={Building2} label={t('nav.units')} />
                <SidebarItem to="/cashflow" icon={Wallet} label={t('nav.cashflow')} />
                <SidebarItem to="/calendar" icon={CalendarCheck} label={t('nav.calendar')} />
                <SidebarItem to="/increments" icon={TrendingUp} label={t('nav.increments')} />
                <SidebarItem to="/calculators" icon={Calculator} label={t('nav.calculators')} />
            </nav>

            <div className="p-4 border-t border-slate-100">
                <button
                    onClick={toggleLanguage}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-sm font-medium text-slate-700"
                >
                    <Globe size={16} />
                    <span>{currentLang === 'en' ? 'Español' : 'English'}</span>
                </button>
            </div>

            <div className="p-4 border-t border-slate-100 text-xs text-slate-400 text-center">
                v1.0.0
            </div>
        </div>
    );
}
