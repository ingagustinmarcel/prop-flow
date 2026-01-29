/**
 * MobileNav - Mobile Navigation Component
 * 
 * Features:
 * - Hamburger menu button (visible only on mobile/tablet < 1024px)
 * - Slide-in navigation drawer from left
 * - Active route highlighting
 * - Smooth transitions
 * - Backdrop overlay
 * - Auto-close on route change
 */

import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Menu, X, Home, Building2, DollarSign, Calendar, TrendingUp, Calculator } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';

export default function MobileNav() {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();

    // Close menu when route changes
    useEffect(() => {
        setIsOpen(false);
    }, [location.pathname]);

    // Prevent body scroll when menu is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const navItems = [
        { path: '/', icon: Home, label: t('nav.overview') || 'Overview' },
        { path: '/units', icon: Building2, label: t('nav.units') || 'Units' },
        { path: '/cashflow', icon: DollarSign, label: t('nav.cashflow') || 'Cashflow' },
        { path: '/calendar', icon: Calendar, label: t('nav.calendar') || 'Calendar' },
        { path: '/increments', icon: TrendingUp, label: t('nav.increments') || 'Rent Increments' },
        { path: '/calculators', icon: Calculator, label: t('nav.calculators') || 'Calculators' },
    ];

    return (
        <>
            {/* Hamburger Button - Visible only on mobile/tablet */}
            <button
                onClick={() => setIsOpen(true)}
                className="lg:hidden fixed top-4 left-4 z-40 p-3 bg-white rounded-lg shadow-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                aria-label="Open menu"
            >
                <Menu size={24} className="text-slate-700" />
            </button>

            {/* Backdrop Overlay */}
            {isOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
                    onClick={() => setIsOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Slide-in Drawer */}
            <nav
                className={cn(
                    "lg:hidden fixed top-0 left-0 h-full w-64 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200">
                    <h2 className="text-lg font-bold text-slate-900">Menu</h2>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        aria-label="Close menu"
                    >
                        <X size={20} className="text-slate-600" />
                    </button>
                </div>

                {/* Navigation Links */}
                <div className="py-4 px-2 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;

                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                                    isActive
                                        ? "bg-emerald-50 text-emerald-700 font-semibold"
                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                )}
                            >
                                <Icon size={20} className={isActive ? "text-emerald-600" : "text-slate-400"} />
                                <span>{item.label}</span>
                            </NavLink>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200">
                    <p className="text-xs text-slate-400 text-center">
                        PropFlow v0.3.0
                    </p>
                </div>
            </nav>
        </>
    );
}
