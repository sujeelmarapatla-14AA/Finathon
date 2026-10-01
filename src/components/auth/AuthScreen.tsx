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
    <div className="relative min-h-screen bg-[#151515] text-[#F3F3F1] flex flex-col justify-between selection:bg-[#B8A47A]/30 selection:text-[#F3F3F1] overflow-x-hidden font-sans">
      {/* Top Navbar */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo size="md" theme="dark" />
        </div>

        <div className="flex items-center gap-4">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#F3F3F1]/5 border border-[#F3F3F1]/10 text-[11px] font-mono text-[#F3F3F1]/70">
            <ShieldCheck className="w-3.5 h-3.5 text-[#B8A47A]" />
            <span>ENTERPRISE GATEWAY</span>
          </div>

          <button
            onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
            className="h-9 px-5 rounded-full bg-[#B8A47A] text-[#151515] text-xs font-semibold hover:bg-[#B8A47A]/90 active:scale-95 transition-all shadow-[0_0_15px_rgba(184,164,122,0.15)]"
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
            color="#F3F3F1"
            accentColor="#B8A47A"
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
        <div className="w-full max-w-md bg-[#151515]/95 backdrop-blur-2xl rounded-2xl border border-[#F3F3F1]/10 shadow-2xl p-7 sm:p-9 relative overflow-hidden">
          {/* Subtle Champagne Corner Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#B8A47A]/10 rounded-full blur-2xl pointer-events-none" />

          {/* Heading */}
          <div className="mb-6 text-center">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#B8A47A]/10 border border-[#B8A47A]/20 text-[10px] font-mono tracking-widest uppercase text-[#B8A47A] mb-2">
              <Sparkles className="w-3 h-3" />
              <span>Forensic Procurement Access</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-normal text-[#F3F3F1] tracking-tight">
              {mode === 'login' ? 'Welcome back.' : 'Create your account.'}
            </h1>
            <p className="mt-1.5 text-xs text-[#F3F3F1]/70 leading-relaxed">
              {mode === 'login'
                ? 'Sign in to access your procurement intelligence workspace.'
                : 'Use your approved company email to join SpendIntel.'}
            </p>
          </div>

          {/* Success Banner */}
          {successMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-[#B8A47A]/15 border border-[#B8A47A]/30 flex items-start gap-2.5 text-xs text-[#B8A47A]">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{successMessage}</div>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-[#F3F3F1]/10 border border-[#B8A47A]/30 flex items-start gap-2.5 text-xs text-[#F3F3F1]">
              <AlertCircle className="w-4 h-4 text-[#B8A47A] shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="leading-relaxed">{errorMessage}</p>
                {isBackendOffline && (
                  <button
                    type="button"
                    onClick={() => setErrorMessage(null)}
                    className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[#B8A47A] underline hover:no-underline"
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
            <div className="mb-5 p-3.5 rounded-xl bg-[#F3F3F1]/5 border border-[#F3F3F1]/10 text-xs text-[#F3F3F1]/70 leading-relaxed flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-[#B8A47A] shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-[#F3F3F1]">Password recovery is not configured.</span>
                <p className="mt-0.5">Please contact your corporate procurement administrator.</p>
              </div>
            </div>
          )}

          {/* Form */}
          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-[#F3F3F1]/80 uppercase tracking-wider mb-1.5">
                  Work Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="lead@company.com"
                    required
                    className="w-full h-[46px] px-4 pl-10 rounded-xl border border-[#F3F3F1]/15 bg-[#F3F3F1]/[0.05] text-[#F3F3F1] text-sm placeholder:text-[#F3F3F1]/40 focus:outline-none focus:ring-2 focus:ring-[#B8A47A] focus:bg-[#F3F3F1]/[0.08] transition-all"
                  />
                  <Mail className="w-4 h-4 text-[#F3F3F1]/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-semibold text-[#F3F3F1]/80 uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setForgotPasswordNotice(true)}
                    className="text-[11px] text-[#F3F3F1]/60 hover:text-[#F3F3F1] transition-colors"
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
                    className="w-full h-[46px] px-4 pl-10 pr-10 rounded-xl border border-[#F3F3F1]/15 bg-[#F3F3F1]/[0.05] text-[#F3F3F1] text-sm placeholder:text-[#F3F3F1]/40 focus:outline-none focus:ring-2 focus:ring-[#B8A47A] focus:bg-[#F3F3F1]/[0.08] transition-all font-mono"
                  />
                  <Lock className="w-4 h-4 text-[#F3F3F1]/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#F3F3F1]/40 hover:text-[#F3F3F1] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Primary Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-[46px] mt-2 rounded-xl bg-[#B8A47A] text-[#151515] font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all hover:bg-[#B8A47A]/90 hover:shadow-[0_0_20px_rgba(184,164,122,0.3)] hover:-translate-y-0.5 active:scale-[0.99] disabled:opacity-50 shadow-md"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-[#151515]" />
                    <span>SIGNING IN...</span>
                  </>
                ) : (
                  <>
                    <span>SIGN IN</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-3 border-t border-[#F3F3F1]/10 text-center text-xs text-[#F3F3F1]/70">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className="font-semibold text-[#F3F3F1] hover:underline transition-all"
                >
                  Create account
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSignupSubmit} className="space-y-3.5">
              <div className="p-3 rounded-xl bg-[#F3F3F1]/[0.04] border border-[#F3F3F1]/10 flex items-start gap-2 text-[11px] text-[#F3F3F1]/70">
                <Building className="w-4 h-4 text-[#B8A47A] shrink-0 mt-0.5" />
                <p>SpendIntel access is limited to authorized company email addresses (@company.com).</p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#F3F3F1]/80 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Sarah Jenkins"
                    required
                    className="w-full h-[46px] px-4 pl-10 rounded-xl border border-[#F3F3F1]/15 bg-[#F3F3F1]/[0.05] text-[#F3F3F1] text-sm placeholder:text-[#F3F3F1]/40 focus:outline-none focus:ring-2 focus:ring-[#B8A47A] transition-all"
                  />
                  <UserIcon className="w-4 h-4 text-[#F3F3F1]/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#F3F3F1]/80 uppercase tracking-wider mb-1">
                  Work Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="s.jenkins@company.com"
                    required
                    className="w-full h-[46px] px-4 pl-10 rounded-xl border border-[#F3F3F1]/15 bg-[#F3F3F1]/[0.05] text-[#F3F3F1] text-sm placeholder:text-[#F3F3F1]/40 focus:outline-none focus:ring-2 focus:ring-[#B8A47A] transition-all"
                  />
                  <Mail className="w-4 h-4 text-[#F3F3F1]/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#F3F3F1]/80 uppercase tracking-wider mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 8 chars"
                      required
                      className="w-full h-[46px] px-3.5 pl-9 rounded-xl border border-[#F3F3F1]/15 bg-[#F3F3F1]/[0.05] text-[#F3F3F1] text-sm font-mono placeholder:text-[#F3F3F1]/40 focus:outline-none focus:ring-2 focus:ring-[#B8A47A] transition-all"
                    />
                    <Lock className="w-3.5 h-3.5 text-[#F3F3F1]/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#F3F3F1]/80 uppercase tracking-wider mb-1">
                    Confirm
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter"
                      required
                      className="w-full h-[46px] px-3.5 pl-9 rounded-xl border border-[#F3F3F1]/15 bg-[#F3F3F1]/[0.05] text-[#F3F3F1] text-sm font-mono placeholder:text-[#F3F3F1]/40 focus:outline-none focus:ring-2 focus:ring-[#B8A47A] transition-all"
                    />
                    <Lock className="w-3.5 h-3.5 text-[#F3F3F1]/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-[46px] mt-2 rounded-xl bg-[#B8A47A] text-[#151515] font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all hover:bg-[#B8A47A]/90 hover:shadow-[0_0_20px_rgba(184,164,122,0.3)] hover:-translate-y-0.5 active:scale-[0.99] disabled:opacity-50 shadow-md"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-[#151515]" />
                    <span>CREATING ACCOUNT...</span>
                  </>
                ) : (
                  <>
                    <span>CREATE ACCOUNT</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-2.5 border-t border-[#F3F3F1]/10 text-center text-xs text-[#F3F3F1]/70">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="font-semibold text-[#F3F3F1] hover:underline transition-all"
                >
                  Sign in
                </button>
              </div>
            </form>
          )}

          {/* 1-Click Instant Test Authentication Section */}
          <div className="mt-6 pt-5 border-t border-[#F3F3F1]/10">
            <div className="flex items-center justify-between font-mono text-[10px] text-[#F3F3F1]/70 mb-2.5">
              <span className="flex items-center gap-1.5 text-[#F3F3F1] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#B8A47A] animate-pulse" />
                <span>1-Click Test Sign In:</span>
              </span>
              <span className="text-[#B8A47A] bg-[#B8A47A]/10 px-2 py-0.5 rounded-full border border-[#B8A47A]/20">
                FAST DEV ACCESS
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleQuickLogin('lead@company.com', 'LeadPassword123!')}
                className="p-2 rounded-lg bg-[#F3F3F1]/[0.05] hover:bg-[#F3F3F1]/[0.12] border border-[#F3F3F1]/10 hover:border-[#B8A47A]/50 transition-all text-left group active:scale-95"
              >
                <div className="text-xs font-semibold text-[#F3F3F1] group-hover:text-[#B8A47A] flex items-center justify-between">
                  <span>⚡ Lead</span>
                </div>
                <div className="text-[9px] font-mono text-[#F3F3F1]/50 truncate mt-0.5">lead@company.com</div>
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleQuickLogin('analyst@company.com', 'AnalystPassword123!')}
                className="p-2 rounded-lg bg-[#F3F3F1]/[0.05] hover:bg-[#F3F3F1]/[0.12] border border-[#F3F3F1]/10 hover:border-[#B8A47A]/50 transition-all text-left group active:scale-95"
              >
                <div className="text-xs font-semibold text-[#F3F3F1] group-hover:text-[#B8A47A] flex items-center justify-between">
                  <span>⚡ Analyst</span>
                </div>
                <div className="text-[9px] font-mono text-[#F3F3F1]/50 truncate mt-0.5">analyst@company.com</div>
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleQuickLogin('admin@company.com', 'AdminPassword123!')}
                className="p-2 rounded-lg bg-[#F3F3F1]/[0.05] hover:bg-[#F3F3F1]/[0.12] border border-[#F3F3F1]/10 hover:border-[#B8A47A]/50 transition-all text-left group active:scale-95"
              >
                <div className="text-xs font-semibold text-[#F3F3F1] group-hover:text-[#B8A47A] flex items-center justify-between">
                  <span>⚡ Admin</span>
                </div>
                <div className="text-[9px] font-mono text-[#F3F3F1]/50 truncate mt-0.5">admin@company.com</div>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Ambient Bottom Champagne Glow */}
      <div
        className="pointer-events-none fixed bottom-0 inset-x-0 h-[350px] z-0 opacity-40"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(184, 164, 122, 0.25) 0%, rgba(184, 164, 122, 0.05) 50%, rgba(21, 21, 21, 0) 100%)',
        }}
      />

      {/* Footer */}
      <footer className="relative z-10 h-14 border-t border-[#F3F3F1]/10 px-6 sm:px-12 flex items-center justify-between text-xs text-[#F3F3F1]/60">
        <span>SpendIntel Enterprise Procurement Intelligence</span>
        <span className="font-mono text-[11px] text-[#B8A47A]">v2.4.0 • HS256 JWT AUTH</span>
      </footer>
    </div>
  );
};

export default AuthScreen;
