import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import Overview from './pages/Overview';
import Units from './pages/Units';
import Cashflow from './pages/Cashflow';
import CalendarPage from './pages/Calendar';
import { DataProvider } from './context/DataContext';

import Increments from './pages/Increments';
import Calculators from './pages/Calculators';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = () => {
    const { user, loading } = useAuth();

    if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-emerald-600" size={48} /></div>;
    if (!user) return <Navigate to="/login" replace />;

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

function App() {
    return (
        <Router>
            <AuthProvider>
                <DataProvider>
                    <Routes>
                        <Route path="/login" element={<Login />} />

                        <Route element={<ProtectedRoute />}>
                            <Route path="/" element={<Overview />} />
                            <Route path="/units" element={<Units />} />
                            <Route path="/cashflow" element={<Cashflow />} />
                            <Route path="/calendar" element={<CalendarPage />} />
                            <Route path="/increments" element={<Increments />} />
                            <Route path="/calculators" element={<Calculators />} />
                        </Route>

                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </DataProvider>
            </AuthProvider>
        </Router>
    );
}

export default App;
