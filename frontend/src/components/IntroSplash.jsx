import { useEffect, useState } from 'react';
import { Brain, Sparkles } from 'lucide-react';

export default function IntroSplash({ onFinish }) {
  const [phase, setPhase] = useState('intro');   // 'intro' | 'exiting'
  const [showHint, setShowHint] = useState(false);
  const [autoDone, setAutoDone] = useState(false);

  // Show "tap anywhere" hint after 1.2s
  useEffect(() => {
    const t = setTimeout(() => setShowHint(true), 1200);
    return () => clearTimeout(t);
  }, []);

  // Auto-proceed after 6 seconds if user never taps
  useEffect(() => {
    const t = setTimeout(() => {
      setAutoDone(true);
      handleDismiss();
    }, 6000);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, []);

  const handleDismiss = () => {
    if (phase === 'exiting') return;
    setPhase('exiting');
    setTimeout(() => onFinish(), 600);
  };

  // Listen for any interaction
  useEffect(() => {
    const events = ['click', 'touchstart', 'keydown'];
    const handler = () => handleDismiss();
    events.forEach((e) =>
      window.addEventListener(e, handler, { once: true })
    );
    return () => {
      events.forEach((e) => window.removeEventListener(e, handler));
    };
    // eslint-disable-next-line
  }, [phase]);

  return (
    <div
      className={`fixed inset-0 z-[200] flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white cursor-pointer transition-all duration-700 ease-in-out ${
        phase === 'exiting' ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
      }`}
    >
      {/* Grid */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Floating orbs */}
      <div className="absolute top-1/4 left-1/4 h-80 w-80 rounded-full bg-indigo-600/30 blur-[100px] animate-float-slow" />
      <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-violet-600/25 blur-[120px] animate-float-slower" />
      <div className="absolute top-1/2 right-1/3 h-72 w-72 rounded-full bg-cyan-500/20 blur-[100px] animate-float-slow" />

      {/* Radial vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.6)_100%)]" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6">
        {/* Logo mark */}
        <div className="relative mb-8 animate-scale-in">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 blur-2xl opacity-60 animate-pulse" />
          <div className="relative h-24 w-24 rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center border border-white/20 shadow-2xl">
            <Brain size={44} />
          </div>
          {/* Sparkle */}
          <Sparkles
            size={18}
            className="absolute -top-1 -right-1 text-amber-300 animate-twinkle"
          />
        </div>

        {/* Brand */}
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight animate-fade-up">
          AI Retail Predictor
        </h1>

        {/* Tagline */}
        <p
          className="mt-3 text-slate-400 text-sm sm:text-base animate-fade-up"
          style={{ animationDelay: '0.15s' }}
        >
          Forecast demand. Optimize inventory. Ship smarter.
        </p>

        {/* Loading shimmer */}
        <div
          className="mt-10 h-0.5 w-32 rounded-full bg-white/10 overflow-hidden animate-fade-up"
          style={{ animationDelay: '0.3s' }}
        >
          <div className="h-full w-1/3 bg-gradient-to-r from-indigo-500 to-violet-500 animate-shimmer" />
        </div>

        {/* Hint */}
        <div
          className={`mt-12 flex flex-col items-center gap-2 transition-opacity duration-700 ${
            showHint ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-widest">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {autoDone ? 'Opening...' : 'Tap anywhere to continue'}
          </div>
        </div>
      </div>

      {/* Bottom watermark */}
      <div className="absolute bottom-6 left-0 right-0 text-center text-[10px] text-slate-600 tracking-widest uppercase">
        Django · React · scikit-learn
      </div>
    </div>
  );
}