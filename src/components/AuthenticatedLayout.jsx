import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';

const AuthenticatedLayout = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-emerald-600 mx-auto" aria-hidden="true" />
                    <p className="mt-4 text-sm font-medium text-slate-500">Loading your workspace...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="flex bg-slate-50 min-h-screen font-sans">
            {/* Desktop Sidebar - Hidden on mobile */}
            <div className="hidden lg:block">
                <Sidebar />
            </div>

            {/* Mobile Navigation - Visible only on mobile/tablet */}
            <MobileNav />

            {/* Main Content - Adjusted padding for mobile */}
            <main className="flex-1 lg:ml-64 p-4 md:p-8 pt-20 lg:pt-8 overflow-y-auto h-screen">
                <div className="max-w-7xl mx-auto space-y-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AuthenticatedLayout;
