import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../layout/Logo';
import TechText from '../ui/TechText';
import {
  Lock,
  Mail,
  User as UserIcon,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Eye,
  EyeOff,
  RefreshCw,
  Building,
  Sparkles,
} from 'lucide-react';

interface AuthScreenProps {
  initialMode?: 'login' | 'signup';
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ initialMode = 'login' }) => {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // UX & Error states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [forgotPasswordNotice, setForgotPasswordNotice] = useState(false);
  const [isBackendOffline, setIsBackendOffline] = useState(false);

  const switchMode = (newMode: 'login' | 'signup') => {
    setMode(newMode);
    setErrorMessage(null);
    setSuccessMessage(null);
    setForgotPasswordNotice(false);
  };

  const validateEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setForgotPasswordNotice(false);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage('Enter a valid email address.');
      return;
    }
    if (!validateEmail(trimmedEmail)) {
      setErrorMessage('Enter a valid email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Email or password is incorrect.');
      return;
    }

    setIsLoading(true);
    setIsBackendOffline(false);
    try {
      await signIn(trimmedEmail, password);
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('500') || msg.includes('502')) {
        setIsBackendOffline(true);
        setErrorMessage('SpendIntel authentication service is unavailable.');
      } else if (msg.includes('not authorized') || msg.includes('domain')) {
        setErrorMessage('Your email is not authorized for SpendIntel access.');
      } else {
        setErrorMessage('Email or password is incorrect.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setErrorMessage('Full name is required.');
      return;
    }
    if (!trimmedEmail || !validateEmail(trimmedEmail)) {
      setErrorMessage('Enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setErrorMessage('Password does not meet the security requirements.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setIsBackendOffline(false);
    try {
      const res = await signUp(trimmedName, trimmedEmail, password);
      setSuccessMessage(res.message || 'Account created successfully. Please sign in with your corporate credentials.');
      setMode('login');
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('500') || msg.includes('502')) {
        setIsBackendOffline(true);
        setErrorMessage('SpendIntel authentication service is unavailable.');
      } else if (msg.includes('already exists') || msg.includes('409')) {
        setErrorMessage('An account with this email already exists.');
      } else if (msg.includes('not authorized') || msg.includes('corporate') || msg.includes('403')) {
        setErrorMessage('Your email is not authorized for SpendIntel access.');
      } else if (msg.includes('Password') || msg.includes('characters')) {
        setErrorMessage('Password does not meet the security requirements.');
      } else {
        setErrorMessage(msg || 'Account registration could not be completed.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (targetEmail: string, targetPass: string) => {
    setEmail(targetEmail);
    setPassword(targetPass);
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await signIn(targetEmail, targetPass);
    } catch (err: any) {
      setErrorMessage(err.message || 'Quick login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#000000] text-white flex flex-col justify-between selection:bg-[#73C69A]/30 selection:text-white overflow-x-hidden font-sans">
      {/* Top Navbar */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo size="md" theme="dark" />
        </div>

        <div className="flex items-center gap-4">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono text-[#A1A1AA]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#73C69A]" />
            <span>ENTERPRISE GATEWAY</span>
          </div>

          <button
            onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
            className="h-9 px-5 rounded-full bg-white text-black text-xs font-semibold hover:bg-[#EAEAEA] active:scale-95 transition-all shadow-[0_0_15px_rgba(255,255,255,0.15)]"
          >
            {mode === 'login' ? 'Sign Up' : 'Sign In'}
          </button>
        </div>
      </header>

      {/* Main Container with TechText & Dark Card */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-6 max-w-4xl mx-auto w-full">
        {/* Interactive TechText Brand Header */}
        <div className="w-full h-[180px] sm:h-[220px] relative mb-2 flex items-center justify-center">
          <TechText
            text="SpendIntel"
            fontWeight={600}
            fontSize={90}
            reveal="letter"
            dashLength={4}
            dashGap={2}
            specks={15}
            fontFamily=""
            color="#ffffff"
            accentColor="#73C69A"
            letterSpacing={-0.04}
            reach={180}
            softness={0.7}
            strokeWidth={1.5}
            speed={1}
            lineStyle="dashed"
            selection
            labels
            draggable
            sweep
          />
        </div>

        {/* Dark Frosted Glass Auth Card */}
        <div className="w-full max-w-md bg-[#0A0E0C]/90 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl p-7 sm:p-9 relative overflow-hidden">
          {/* Subtle Corner Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#73C69A]/10 rounded-full blur-2xl pointer-events-none" />

          {/* Heading */}
          <div className="mb-6 text-center">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono tracking-widest uppercase text-[#73C69A] mb-2">
              <Sparkles className="w-3 h-3" />
              <span>Forensic Procurement Access</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-normal text-white tracking-tight">
              {mode === 'login' ? 'Welcome back.' : 'Create your account.'}
            </h1>
            <p className="mt-1.5 text-xs text-[#A1A1AA] leading-relaxed">
              {mode === 'login'
                ? 'Sign in to access your procurement intelligence workspace.'
                : 'Use your approved company email to join SpendIntel.'}
            </p>
          </div>

          {/* Success Banner */}
          {successMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-[#73C69A]/15 border border-[#73C69A]/30 flex items-start gap-2.5 text-xs text-[#73C69A]">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{successMessage}</div>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-[#EF4444]/15 border border-[#EF4444]/30 flex items-start gap-2.5 text-xs text-[#FCA5A5]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="leading-relaxed">{errorMessage}</p>
                {isBackendOffline && (
                  <button
                    type="button"
                    onClick={() => setErrorMessage(null)}
                    className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-white underline hover:no-underline"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Retry connection</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Forgot Password Notice */}
          {forgotPasswordNotice && (
            <div className="mb-5 p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs text-[#A1A1AA] leading-relaxed flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-[#73C69A] shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white">Password recovery is not configured.</span>
                <p className="mt-0.5">Please contact your corporate procurement administrator.</p>
              </div>
            </div>
          )}

          {/* Form */}
          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-[#D4D4D8] uppercase tracking-wider mb-1.5">
                  Work Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="lead@company.com"
                    required
                    className="w-full h-[46px] px-4 pl-10 rounded-xl border border-white/15 bg-white/[0.05] text-white text-sm placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#73C69A] focus:bg-white/[0.08] transition-all"
                  />
                  <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-semibold text-[#D4D4D8] uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setForgotPasswordNotice(true)}
                    className="text-[11px] text-[#A1A1AA] hover:text-white transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full h-[46px] px-4 pl-10 pr-10 rounded-xl border border-white/15 bg-white/[0.05] text-white text-sm placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#73C69A] focus:bg-white/[0.08] transition-all font-mono"
                  />
                  <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Primary Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-[46px] mt-2 rounded-xl bg-gradient-to-b from-white to-[#E2E2E2] hover:to-white text-black font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:-translate-y-0.5 active:scale-[0.99] disabled:opacity-50 shadow-md"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-black" />
                    <span>SIGNING IN...</span>
                  </>
                ) : (
                  <>
                    <span>SIGN IN</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-3 border-t border-white/10 text-center text-xs text-[#A1A1AA]">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className="font-semibold text-white hover:underline transition-all"
                >
                  Create account
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSignupSubmit} className="space-y-3.5">
              <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 flex items-start gap-2 text-[11px] text-[#A1A1AA]">
                <Building className="w-4 h-4 text-[#73C69A] shrink-0 mt-0.5" />
                <p>SpendIntel access is limited to authorized company email addresses (@company.com).</p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#D4D4D8] uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Sarah Jenkins"
                    required
                    className="w-full h-[46px] px-4 pl-10 rounded-xl border border-white/15 bg-white/[0.05] text-white text-sm placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#73C69A] transition-all"
                  />
                  <UserIcon className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#D4D4D8] uppercase tracking-wider mb-1">
                  Work Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="s.jenkins@company.com"
                    required
                    className="w-full h-[46px] px-4 pl-10 rounded-xl border border-white/15 bg-white/[0.05] text-white text-sm placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#73C69A] transition-all"
                  />
                  <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#D4D4D8] uppercase tracking-wider mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 8 chars"
                      required
                      className="w-full h-[46px] px-3.5 pl-9 rounded-xl border border-white/15 bg-white/[0.05] text-white text-sm font-mono placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#73C69A] transition-all"
                    />
                    <Lock className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#D4D4D8] uppercase tracking-wider mb-1">
                    Confirm
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter"
                      required
                      className="w-full h-[46px] px-3.5 pl-9 rounded-xl border border-white/15 bg-white/[0.05] text-white text-sm font-mono placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#73C69A] transition-all"
                    />
                    <Lock className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-[46px] mt-2 rounded-xl bg-gradient-to-b from-white to-[#E2E2E2] hover:to-white text-black font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:-translate-y-0.5 active:scale-[0.99] disabled:opacity-50 shadow-md"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-black" />
                    <span>CREATING ACCOUNT...</span>
                  </>
                ) : (
                  <>
                    <span>CREATE ACCOUNT</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-2.5 border-t border-white/10 text-center text-xs text-[#A1A1AA]">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="font-semibold text-white hover:underline transition-all"
                >
                  Sign in
                </button>
              </div>
            </form>
          )}

          {/* 1-Click Instant Test Authentication Section */}
          <div className="mt-6 pt-5 border-t border-white/10">
            <div className="flex items-center justify-between font-mono text-[10px] text-[#A1A1AA] mb-2.5">
              <span className="flex items-center gap-1.5 text-white font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#73C69A] animate-pulse" />
                <span>1-Click Test Sign In:</span>
              </span>
              <span className="text-[#73C69A] bg-[#73C69A]/10 px-2 py-0.5 rounded-full border border-[#73C69A]/20">
                FAST DEV ACCESS
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleQuickLogin('lead@company.com', 'LeadPassword123!')}
                className="p-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.12] border border-white/10 hover:border-[#73C69A]/50 transition-all text-left group active:scale-95"
              >
                <div className="text-xs font-semibold text-white group-hover:text-[#73C69A] flex items-center justify-between">
                  <span>⚡ Lead</span>
                </div>
                <div className="text-[9px] font-mono text-[#71717A] truncate mt-0.5">lead@company.com</div>
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleQuickLogin('analyst@company.com', 'AnalystPassword123!')}
                className="p-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.12] border border-white/10 hover:border-[#73C69A]/50 transition-all text-left group active:scale-95"
              >
                <div className="text-xs font-semibold text-white group-hover:text-[#73C69A] flex items-center justify-between">
                  <span>⚡ Analyst</span>
                </div>
                <div className="text-[9px] font-mono text-[#71717A] truncate mt-0.5">analyst@company.com</div>
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleQuickLogin('admin@company.com', 'AdminPassword123!')}
                className="p-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.12] border border-white/10 hover:border-[#73C69A]/50 transition-all text-left group active:scale-95"
              >
                <div className="text-xs font-semibold text-white group-hover:text-[#73C69A] flex items-center justify-between">
                  <span>⚡ Admin</span>
                </div>
                <div className="text-[9px] font-mono text-[#71717A] truncate mt-0.5">admin@company.com</div>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Ambient Bottom Glow (Amber/Golden radial glow from bottom) */}
      <div
        className="pointer-events-none fixed bottom-0 inset-x-0 h-[400px] z-0 opacity-70"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(215, 130, 40, 0.22) 0%, rgba(160, 80, 20, 0.08) 50%, rgba(0, 0, 0, 0) 100%)',
        }}
      />

      {/* Footer */}
      <footer className="relative z-10 h-14 border-t border-white/10 px-6 sm:px-12 flex items-center justify-between text-xs text-[#71717A]">
        <span>SpendIntel Enterprise Procurement Intelligence</span>
        <span className="font-mono text-[11px] text-[#A1A1AA]">v2.4.0 • HS256 JWT AUTH</span>
      </footer>
    </div>
  );
};

export default AuthScreen;
