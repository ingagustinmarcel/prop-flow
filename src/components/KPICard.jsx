import React from 'react';
import { cn } from '../lib/utils';

export default function KPICard({ title, value, icon: Icon, trend, trendUp, color = "emerald" }) {
    const colorStyles = {
        emerald: "bg-emerald-50 text-emerald-600",
        blue: "bg-blue-50 text-blue-600",
        rose: "bg-rose-50 text-rose-600",
        amber: "bg-amber-50 text-amber-600",
    };

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
                    <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
                </div>
                <div className={cn("p-3 rounded-lg", colorStyles[color])}>
                    <Icon size={24} />
                </div>
            </div>
            {trend && (
                <div className={cn("mt-4 text-xs font-medium flex items-center gap-1", trendUp ? "text-emerald-600" : "text-rose-600")}>
                    {trend}
                </div>
            )}
        </div>
    );
}
