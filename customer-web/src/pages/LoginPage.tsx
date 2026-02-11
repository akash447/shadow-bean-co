import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useYeti } from '../components/YetiMascot';
import Yeti from '../components/Yeti';


type Tab = 'signin' | 'register';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/profile';
  const message = searchParams.get('message');
  const initialTab = searchParams.get('tab') === 'register' ? 'register' : 'signin';

  const { user, loading: authLoading, login, loginWithGoogle, register, needsConfirmation, confirmSignUp } = useAuth();
  const { state: yetiState, lookAt, setYetiState, trackInputCursor } = useYeti();

  const [tab, setTab] = useState<Tab>(initialTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && user) {
      navigate(redirectTo, { replace: true });
    }
  }, [user, authLoading, navigate, redirectTo]);

  useEffect(() => {
    return () => setYetiState('idle');
  }, [setYetiState]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: loginError } = await login(email, password);
    if (loginError) {
      setError(loginError.message);
      setYetiState('sad');
      setLoading(false);
      setTimeout(() => setYetiState('idle'), 2000);
    } else {
      setYetiState('happy');
      setTimeout(() => navigate(redirectTo), 600);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true);
    const { error: regError, needsConfirmation: needsCode } = await register(email, password, name, phone || undefined);
    if (regError) {
      setError(regError.message);
      setYetiState('sad');
      setLoading(false);
      setTimeout(() => setYetiState('idle'), 2000);
    } else if (needsCode) {
      setLoading(false);
    } else {
      setYetiState('happy');
      setTimeout(() => navigate(redirectTo), 600);
    }
  };

  const handleConfirmation = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: confirmError } = await confirmSignUp(confirmationCode);
    if (confirmError) {
      setError(confirmError.message);
      setLoading(false);
    } else {
      setYetiState('happy');
      setTimeout(() => navigate(redirectTo), 600);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    try {
      sessionStorage.setItem('shadow_bean_oauth_redirect', redirectTo);
      await loginWithGoogle();
    } catch {
      setError('Google login failed. Please try again.');
      setYetiState('sad');
      setTimeout(() => setYetiState('idle'), 2000);
    }
  };

  const onEmailFocus = () => setYetiState('watching');
  const onEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    trackInputCursor(e, emailRef.current);
  };
  const onPasswordFocus = () => setYetiState('shy');
  const onFieldBlur = () => setYetiState('idle');

  const inputClass = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4E8AAF]/30 focus:border-[#6BA4CC] transition-all bg-white placeholder:text-gray-400";

  // ===== CONFIRMATION CODE SCREEN =====
  if (needsConfirmation) {
    return (
      <div className="min-h-[100dvh] bg-[#FAF8F5] flex items-center justify-center p-4" style={{ fontFamily: "'Montserrat', sans-serif" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6"
        >
          <div className="flex justify-center mb-3">
            <Yeti state="watching" size="small" />
          </div>
          <h1 className="text-2xl font-bold text-[#1c0d02] text-center" style={{ fontFamily: "'Agdasima', sans-serif" }}>
            Verify Your Email
          </h1>
          <p className="text-sm text-gray-500 text-center mt-1 mb-4">
            Enter the code sent to <strong>{needsConfirmation.email}</strong>
          </p>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 mb-3">{error}</div>
          )}
          <form onSubmit={handleConfirmation} className="space-y-3">
            <input
              type="text"
              value={confirmationCode}
              onChange={(e) => setConfirmationCode(e.target.value)}
              placeholder="Enter 6-digit code"
              required
              autoFocus
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-center text-lg tracking-[4px] focus:outline-none focus:ring-2 focus:ring-[#4E8AAF]/30 focus:border-[#6BA4CC]"
            />
            <button type="submit" disabled={loading} className="w-full py-2.5 bg-[#1c0d02] text-white rounded-xl font-semibold hover:bg-[#2a1a0a] transition-colors disabled:opacity-50">
              {loading ? 'Verifying...' : 'Verify & Sign In'}
            </button>
          </form>
          <p className="text-xs text-gray-400 text-center mt-3">Didn't receive the code? Check your spam folder.</p>
        </motion.div>
      </div>
    );
  }

  // ===== MAIN LOGIN LAYOUT =====
  return (
    <div className="h-[100dvh] flex overflow-hidden" style={{ fontFamily: "'Montserrat', sans-serif" }}>

      {/* ===== LEFT HALF: Yeti + Branding ===== */}
      <div className="hidden md:flex w-1/2 bg-gradient-to-b from-[#e8f1f8] to-[#d4e6f3] flex-col items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          <Yeti state={yetiState} lookAt={lookAt} size="large" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center mt-2"
        >
          <h2 className="text-3xl font-bold text-[#1c0d02]" style={{ fontFamily: "'Agdasima', sans-serif" }}>
            Shadow Bean Co.
          </h2>
          <p className="text-[#1c0d02]/50 text-xs mt-1 tracking-wide">Your coffee, your way</p>
        </motion.div>
      </div>

      {/* ===== RIGHT HALF: Login Tile ===== */}
      <div className="w-full md:w-1/2 bg-[#FAF8F5] flex items-center justify-center p-4 md:p-8 relative">

        {/* Mobile only: Yeti + branding in top-left */}
        <div className="md:hidden absolute top-4 left-4 flex items-center gap-2 z-10">
          <Yeti state={yetiState} lookAt={lookAt} size="small" />
          <div>
            <h2 className="text-sm font-bold text-[#1c0d02]" style={{ fontFamily: "'Agdasima', sans-serif" }}>Shadow Bean Co.</h2>
            <p className="text-[#1c0d02]/50 text-[9px] tracking-wide">Your coffee, your way</p>
          </div>
        </div>

        {/* ===== THE TILE ===== */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-[380px] bg-white rounded-2xl shadow-lg border border-gray-100 p-5 md:p-6"
        >
          {/* Back to Home */}
          <button
            onClick={() => navigate('/')}
            className="text-[11px] text-gray-400 hover:text-[#1c0d02] mb-2.5 flex items-center gap-1 transition-colors"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            Back to Home
          </button>

          {/* Tab Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-0.5 mb-3">
            {(['signin', 'register'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(''); }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${tab === t
                  ? 'bg-white text-[#1c0d02] shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
                  }`}
              >
                {t === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-50 border border-red-100 text-red-600 text-xs rounded-lg px-3 py-1.5 mb-2"
              >{error}</motion.div>
            )}
          </AnimatePresence>

          {/* Info message */}
          {message === 'login_required' && (
            <div className="bg-blue-50 border border-blue-100 text-blue-700 text-[11px] rounded-lg px-3 py-1.5 mb-2">
              Please sign in or create an account to continue.
            </div>
          )}

          {/* Google Sign-in */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-all shadow-sm text-sm mb-2"
          >
            <svg viewBox="0 0 24 24" width="15" height="15">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span className="font-medium text-gray-600 text-[13px]">Continue with Google</span>
          </motion.button>

          {/* Divider */}
          <div className="flex items-center mb-2">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="px-3 text-[9px] text-gray-400 uppercase tracking-widest font-medium">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* ===== FORMS ===== */}
          <AnimatePresence mode="wait">
            {tab === 'signin' ? (
              <motion.form
                key="signin"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleSignIn}
                className="space-y-2"
              >
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Email</label>
                  <input ref={emailRef} type="email" value={email} onChange={onEmailChange} onFocus={onEmailFocus} onBlur={onFieldBlur} placeholder="you@example.com" required className={inputClass} />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Password</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onFocus={onPasswordFocus} onBlur={onFieldBlur} placeholder="Min. 8 characters" required className={inputClass} />
                </div>
                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading} className="w-full py-2 bg-[#1c0d02] text-white rounded-lg font-semibold text-sm hover:bg-[#2a1a0a] transition-colors disabled:opacity-50 shadow-md mt-1">
                  {loading ? 'Signing in...' : 'Sign In'}
                </motion.button>
              </motion.form>
            ) : (
              <motion.form
                key="register"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleRegister}
                className="space-y-1.5"
              >
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Full Name</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} onFocus={onFieldBlur} placeholder="John Doe" required className={inputClass} />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Phone <span className="text-gray-300 font-normal normal-case tracking-normal">(opt)</span></label>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} onFocus={onFieldBlur} placeholder="+91 98765..." className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Email</label>
                  <input ref={emailRef} type="email" value={email} onChange={onEmailChange} onFocus={onEmailFocus} onBlur={onFieldBlur} placeholder="you@example.com" required className={inputClass} />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Password</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onFocus={onPasswordFocus} onBlur={onFieldBlur} placeholder="Min. 8 chars" required className={inputClass} />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Confirm</label>
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} onFocus={onPasswordFocus} onBlur={onFieldBlur} placeholder="Re-enter" required className={inputClass} />
                  </div>
                </div>
                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading} className="w-full py-2 bg-[#1c0d02] text-white rounded-lg font-semibold text-sm hover:bg-[#2a1a0a] transition-colors disabled:opacity-50 shadow-md mt-1">
                  {loading ? 'Creating account...' : 'Create Account'}
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
