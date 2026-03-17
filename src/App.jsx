import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import { SettingsProvider } from './context/SettingsContext';
import { AuthProvider } from './context/AuthContext';
import AuthenticatedLayout from './components/AuthenticatedLayout';
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Loader2 } from 'lucide-react';

// Eagerly loaded - needed immediately on app start
import Login from './pages/Login';

// Lazy loaded pages - each becomes a separate chunk
const Overview     = lazy(() => import('./pages/Overview'));
const Units        = lazy(() => import('./pages/Units'));
const Maintenance  = lazy(() => import('./pages/Maintenance'));
const Cashflow     = lazy(() => import('./pages/Cashflow'));
const CalendarPage = lazy(() => import('./pages/Calendar'));
const Increments   = lazy(() => import('./pages/Increments'));
const Calculators  = lazy(() => import('./pages/Calculators'));
const Settings     = lazy(() => import('./pages/Settings'));

// Shared loading fallback
const PageLoader = () => (
    <div className="h-full flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-emerald-600" size={36} />
    </div>
);

function App() {
    return (
        <Router>
            <AuthProvider>
                <SettingsProvider>
                    <DataProvider>
                        <Suspense fallback={<PageLoader />}>
                            <Routes>
                                <Route path="/login" element={<Login />} />

                                <Route element={<AuthenticatedLayout />}>
                                    <Route path="/"            element={<Overview />} />
                                    <Route path="/units"       element={<Units />} />
                                    <Route path="/maintenance" element={<Maintenance />} />
                                    <Route path="/cashflow"    element={<Cashflow />} />
                                    <Route path="/calendar"    element={<CalendarPage />} />
                                    <Route path="/increments"  element={<Increments />} />
                                    <Route path="/calculators" element={<Calculators />} />
                                    <Route path="/settings"    element={<Settings />} />
                                </Route>

                                <Route path="*" element={<Navigate to="/" replace />} />
                            </Routes>
                        </Suspense>
                    </DataProvider>
                    <SpeedInsights />
                </SettingsProvider>
            </AuthProvider>
        </Router>
    );
}

export default App;

