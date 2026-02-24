import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Overview from './pages/Overview';
import Units from './pages/Units';
import Maintenance from './pages/Maintenance';
import Cashflow from './pages/Cashflow';
import CalendarPage from './pages/Calendar';
import { DataProvider } from './context/DataContext';
import { SettingsProvider } from './context/SettingsContext';
import Increments from './pages/Increments';
import Calculators from './pages/Calculators';
import Settings from './pages/Settings';
import Login from './pages/Login';
import { AuthProvider } from './context/AuthContext';
import AuthenticatedLayout from './components/AuthenticatedLayout';
import { SpeedInsights } from "@vercel/speed-insights/react"

function App() {
    return (
        <Router>
            <AuthProvider>
                <SettingsProvider>
                    <DataProvider>
                        <Routes>
                            <Route path="/login" element={<Login />} />

                            <Route element={<AuthenticatedLayout />}>
                                <Route path="/" element={<Overview />} />
                                <Route path="/units" element={<Units />} />
                                <Route path="/maintenance" element={<Maintenance />} />
                                <Route path="/cashflow" element={<Cashflow />} />
                                <Route path="/calendar" element={<CalendarPage />} />
                                <Route path="/increments" element={<Increments />} />
                                <Route path="/calculators" element={<Calculators />} />
                                <Route path="/settings" element={<Settings />} />
                            </Route>

                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </DataProvider>
                    <SpeedInsights />
                </SettingsProvider>
            </AuthProvider>
        </Router>
    );
}

export default App;
