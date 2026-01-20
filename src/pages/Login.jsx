import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Building2, Loader2, AlertCircle } from 'lucide-react';

export default function Login() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { signIn, signUp } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                await signIn(email, password);
                navigate('/');
            } else {
                await signUp(email, password);
                // For Supabase, usually confirmation email is sent, but if disable email confirm is on, it logs in right away.
                // We'll assume successful signup leads to dashboard or "check email" message.
                // For simplicity in this mvp, let's assume auto-login or redirect.
                alert("Account created! You can now log in.");
                setIsLogin(true);
            }
        } catch (err) {
            console.error(err);
            setError(err.message || 'Failed to authenticate');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="p-8 pb-6 text-center border-b border-slate-100">
                    <div className="inline-flex justify-center items-center p-3 bg-emerald-100 text-emerald-600 rounded-full mb-4">
                        <Building2 size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">PropFlow</h1>
                    <p className="text-slate-500 mt-2 text-sm">Property Management Workspace</p>
                </div>

                <div className="p-8">
                    <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">
                        {isLogin ? 'Welcome Back' : 'Create Account'}
                    </h2>

                    {error && (
                        <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-lg mb-6 flex items-start gap-2 text-sm">
                            <AlertCircle size={16} className="mt-0.5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                        >
                            {loading && <Loader2 size={18} className="animate-spin" />}
                            {isLogin ? 'Sign In' : 'Sign Up'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-sm text-emerald-600 hover:underline font-medium"
                        >
                            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                        </button>
                    </div>
                </div>
            </div>

            <p className="mt-8 text-xs text-slate-400">
                &copy; {new Date().getFullYear()} PropFlow Inc. Secure Cloud System.
            </p>
        </div>
    );
}
