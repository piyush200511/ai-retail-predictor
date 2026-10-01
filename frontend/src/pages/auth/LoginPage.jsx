import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import {
  Mail, Lock, Eye, EyeOff, ArrowRight, Loader2,
  TrendingUp, Boxes, Brain, Shield,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import IntroSplash from '../../components/IntroSplash';

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [showIntro, setShowIntro] = useState(
    () => !sessionStorage.getItem('intro_seen')
  );

  const handleIntroFinish = () => {
    sessionStorage.setItem('intro_seen', 'true');
    setShowIntro(false);
  };

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.non_field_errors?.[0] ||
        'Login failed. Check your credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setEmail('admin@example.com');
    setPassword('Admin@123');
    setError('');
  };

  return (
    <>
      {showIntro && <IntroSplash onFinish={handleIntroFinish} />}

      <div
        className={`min-h-screen flex transition-opacity duration-500 ${
          showIntro ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {/* LEFT PANEL — Brand / Features */}
        <div className="hidden lg:flex lg:w-3/5 relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white">
          <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-indigo-600/25 blur-3xl animate-pulse" />
          <div
            className="absolute -bottom-32 -right-24 h-[28rem] w-[28rem] rounded-full bg-violet-600/25 blur-3xl animate-pulse"
            style={{ animationDelay: '1s' }}
          />
          <div className="absolute top-1/3 right-1/4 h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl" />

          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />

          <div className="relative z-10 flex flex-col justify-between p-12 w-full">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center border border-white/20">
                <Brain size={24} />
              </div>
              <div>
                <div className="text-xl font-bold tracking-tight">AI Retail</div>
                <div className="text-xs text-white/70">Demand & Inventory Predictor</div>
              </div>
            </div>

            <div className="max-w-lg">
              <h1 className="text-4xl xl:text-5xl font-bold leading-tight tracking-tight">
                Forecast demand.
                <br />
                <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-cyan-200 bg-clip-text text-transparent">
                  Optimize inventory.
                </span>
              </h1>
              <p className="mt-4 text-white/70 leading-relaxed">
                ML-powered retail intelligence — from purchase to sale to reorder,
                all in one place.
              </p>

              <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Feature icon={<TrendingUp size={18} />} title="ML Forecasting" subtitle="Random Forest · MAPE 14%" />
                <Feature icon={<Boxes size={18} />} title="Live Inventory" subtitle="Atomic · Audited" />
                <Feature icon={<Shield size={18} />} title="Role-Based Access" subtitle="5 roles · JWT" />
                <Feature icon={<Brain size={18} />} title="Smart Reorders" subtitle="ROP + SOQ + urgency" />
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-white/60 flex-wrap">
              <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10">Django</span>
              <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10">React</span>
              <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10">MySQL</span>
              <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10">scikit-learn</span>
              <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10">Tailwind</span>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL — Login form (DARK THEME) */}
        <div className="flex-1 relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-black text-white">
          {/* Subtle orbs */}
          <div className="absolute top-0 right-0 h-80 w-80 rounded-full bg-teal-500/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />

          {/* Subtle grid */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />

          {/* Mobile brand */}
          <div className="absolute top-6 left-6 flex items-center gap-2 lg:hidden z-20">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white">
              <Brain size={18} />
            </div>
            <span className="font-bold text-white">AI Retail</span>
          </div>

          <div className="relative z-10 flex items-center justify-center min-h-screen p-6 sm:p-10">
            <div className="w-full max-w-md">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-white tracking-tight">
                  Welcome back
                </h2>
                <p className="text-slate-400 mt-1">Sign in to your workspace</p>
              </div>

              {error && (
                <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-300 animate-fade-in backdrop-blur">
                  <span className="mt-0.5">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Email
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full rounded-lg border border-white/10 bg-white/5 backdrop-blur px-3 pl-10 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-teal-500/60 focus:bg-white/10 focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-slate-300">
                      Password
                    </label>
                    <button
                      type="button"
                      className="text-xs text-teal-400 hover:text-teal-300 font-medium"
                      onClick={() => alert('Password reset not implemented in demo.')}
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full rounded-lg border border-white/10 bg-white/5 backdrop-blur px-3 pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-teal-500/60 focus:bg-white/10 focus:ring-2 focus:ring-teal-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Remember me */}
                <label className="flex items-center gap-2 text-sm text-slate-300 select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="rounded border-white/20 bg-white/5 text-teal-500 focus:ring-teal-500 focus:ring-offset-0"
                  />
                  Keep me signed in
                </label>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-medium py-2.5 text-sm shadow-lg shadow-teal-500/20 transition hover:from-teal-400 hover:to-cyan-400 hover:shadow-xl hover:shadow-teal-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in
                      <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </form>

              {/* Demo credentials chip */}
              <div className="mt-6">
                <button
                  type="button"
                  onClick={fillDemo}
                  className="w-full text-left rounded-lg border border-dashed border-white/15 bg-white/5 backdrop-blur hover:bg-white/10 hover:border-teal-500/40 px-4 py-3 transition"
                >
                  <div className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                    Demo credentials
                  </div>
                  <div className="mt-1 flex items-center justify-between text-sm">
                    <span className="font-mono text-slate-200">
                      admin@example.com · Admin@123
                    </span>
                    <span className="text-xs text-teal-400 font-medium">Click to autofill</span>
                  </div>
                </button>
              </div>

              <p className="mt-8 text-center text-xs text-slate-500">
                © {new Date().getFullYear()} AI Retail Predictor · Internship Project
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Feature({ icon, title, subtitle }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 h-9 w-9 rounded-lg bg-white/10 backdrop-blur flex items-center justify-center border border-white/15">
        {icon}
      </div>
      <div>
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-xs text-white/60">{subtitle}</div>
      </div>
    </div>
  );
}