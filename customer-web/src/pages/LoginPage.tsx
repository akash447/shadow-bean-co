import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useYeti } from '../components/YetiMascot';

import Jerry from '../components/Jerry';

type Tab = 'signin' | 'register';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/profile';

  // Auth & State
  const { user, loading: authLoading, login, loginWithGoogle, register, needsConfirmation, confirmSignUp } = useAuth();
  const { state: yetiState, lookAt, setYetiState, trackInputCursor } = useYeti();

  const [tab, setTab] = useState<Tab>((searchParams.get('tab') === 'register' ? 'register' : 'signin'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && user) navigate(redirectTo, { replace: true });
    return () => setYetiState('idle');
  }, [user, authLoading, navigate, redirectTo, setYetiState]);

  // Handlers
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (tab === 'signin') {
      const { error } = await login(email, password);
      if (error) {
        setError(error.message);
        setYetiState('sad');
        setLoading(false);
        setTimeout(() => setYetiState('idle'), 2000);
      } else {
        setYetiState('happy');
        setTimeout(() => navigate(redirectTo), 600);
      }
    } else {
      if (password !== confirmPassword) { setError('Passwords do not match'); setLoading(false); return; }
      const { error, needsConfirmation } = await register(email, password, name);
      if (error) {
        setError(error.message);
        setYetiState('sad');
        setLoading(false);
      } else if (!needsConfirmation) {
        setYetiState('happy');
        setTimeout(() => navigate(redirectTo), 600);
      } else {
        setLoading(false);
      }
    }
  };

  const handleConfirmation = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await confirmSignUp(confirmationCode);
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setYetiState('happy');
      setTimeout(() => navigate(redirectTo), 600);
    }
  };

  const handleGoogle = async () => {
    try {
      sessionStorage.setItem('shadow_bean_oauth_redirect', redirectTo);
      await loginWithGoogle();
    } catch {
      setError('Google login failed');
      setYetiState('sad');
      setTimeout(() => setYetiState('idle'), 2000);
    }
  };

  const onEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    trackInputCursor(e, emailRef.current);
  };

  // Styles (Bondroy Match)
  // Inputs: Rounded-md, border gray-200, px-4 py-3
  const inputClass = "w-full bg-white border border-gray-200 rounded-md px-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:ring-0 transition-colors text-sm font-medium";


  // Verification Screen
  if (needsConfirmation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-md text-center">
          <Jerry state="watching" size="small" />
          <h2 className="text-2xl font-bold text-gray-900 mt-6 mb-2">Verify Code</h2>
          <p className="text-gray-500 mb-6">Sent to {needsConfirmation.email}</p>
          {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
          <form onSubmit={handleConfirmation} className="space-y-4">
            <input
              value={confirmationCode}
              onChange={(e) => setConfirmationCode(e.target.value)}
              className="w-full text-center text-3xl tracking-[0.5em] border border-gray-300 rounded-lg focus:border-blue-500 outline-none py-3 font-mono"
              placeholder="000000" autoFocus
            />
            <button disabled={loading} className="w-full bg-black text-white py-3 rounded-lg font-bold hover:bg-gray-800 transition disabled:opacity-50">
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // Main Layout: Centered Split Card (Bondroy Style)
  return (
    <div className="min-h-screen w-full flex font-sans bg-white">

      {/* LEFT PANEL (50%) - Yeti Branding */}
      <div className="hidden md:flex w-1/2 bg-[#F3F4F6] flex-col items-center justify-center p-12 relative">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center justify-center w-full max-w-sm text-center"
        >

          <div className="mb-8 scale-110">
            <Jerry state={yetiState} lookAt={lookAt} size="large" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mt-4">Shadow Bean Co.</h2>
        </motion.div>
      </div>

      {/* RIGHT PANEL (50%) - Bondroy Form */}
      <div className="w-full md:w-1/2 bg-white flex flex-col justify-center p-10 md:p-16 relative">

        <div className="w-full max-w-sm mx-auto">

          {/* Header */}
          <div className="mb-[20pt] text-center md:text-left">
            {/* Title removed per user request */}
            <h1 className="text-2xl font-semibold text-gray-900">
              {tab === 'signin' ? 'Welcome back!' : 'Create an account'}
            </h1>
          </div>

          <form onSubmit={handleAuth} className="space-y-32">

            {tab === 'register' && (
              <div>
                <input type="text" placeholder="Full Name" className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
            )}

            <div>
              <input
                ref={emailRef} type="email" placeholder="Email" className={inputClass}
                value={email} onChange={onEmailChange} onFocus={() => setYetiState('watching')} onBlur={() => setYetiState('idle')} required
              />
            </div>

            <div>
              <input
                type="password" placeholder="Password" className={inputClass}
                value={password} onChange={(e) => setPassword(e.target.value)} onFocus={() => setYetiState('shy')} onBlur={() => setYetiState('idle')} required
              />
            </div>

            {tab === 'register' && (
              <div>
                <input
                  type="password" placeholder="Confirm Password" className={inputClass}
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} onFocus={() => setYetiState('shy')} onBlur={() => setYetiState('idle')} required
                />
              </div>
            )}

            {/* Action Row: Remember Me & Forgot Password */}
            {tab === 'signin' && (
              <div className="flex items-center justify-between text-sm pt-12 pb-32">
                <div className="flex items-center">
                  <input type="checkbox" id="remember" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="w-4 h-4 text-black border-gray-300 rounded focus:ring-0 cursor-pointer" />
                  <label htmlFor="remember" className="ml-2 text-gray-600 cursor-pointer select-none font-medium">Remember me</label>
                </div>
                <a href="#" className="font-medium text-gray-900 hover:underline">Reset password</a>
              </div>
            )}

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-red-500 text-sm bg-red-50 p-2 rounded mb-4">
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Button - Black Full Width */}
            <button disabled={loading} className="w-full bg-[#2D2D2D] hover:bg-black text-white font-semibold py-3 rounded-md shadow-sm transition-colors disabled:opacity-50 text-sm h-12">
              {loading ? 'Processing...' : (tab === 'signin' ? 'Sign in' : 'Sign up')}
            </button>

            {/* Toggle Link */}
            <div className="text-center text-sm text-gray-500 mt-32 mb-24">
              {tab === 'signin' ? "Don't have an account? " : "Already have an account? "}
              <button
                type="button"
                onClick={() => { setTab(tab === 'signin' ? 'register' : 'signin'); setError(''); }}
                className="text-gray-900 font-bold hover:underline transition-colors ml-1"
              >
                {tab === 'signin' ? 'Sign up' : 'Log in'}
              </button>
            </div>

            {/* Socials - Stacked Vertical */}
            <div className="flex flex-col gap-16 mt-40">
              <button type="button" onClick={handleGoogle} className="w-full bg-white border border-gray-200 text-gray-700 font-medium py-3 rounded-md flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors h-12">
                <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#EA4335" d="M24 12.276c0-.816-.073-1.6-.21-2.362H12.247v4.468h6.591a5.632 5.632 0 0 1-2.443 3.693v3.07h3.957c2.316-2.133 3.648-5.27 3.648-8.869z" /><path fill="#34A853" d="M12.247 24c3.305 0 6.075-1.095 8.103-2.97l-3.957-3.07c-1.096.735-2.5.1.17-2.072 1.17 0 2.222-7.23 2.222-2.31 0-.414-.047-.814-.132l-3.996-3.103C9.932 23.336 11.026 24 12.247 24z" /><path fill="#FBBC05" d="M5.022 14.126A7.265 7.265 0 0 1 4.636 12c0-.728.13-1.428.386-2.126l-3.996-3.103A11.906 11.906 0 0 0 .25 12c0 1.944.475 3.778 1.306 5.378l4.772-3.103-1.306-.149z" /><path fill="#4285F4" d="M12.247 4.755c1.797 0 3.414.618 4.685 1.833l3.513-3.514C18.32 1.055 15.548 0 12.247 0 7.697 0 3.826 2.59 1.936 6.425l3.994 3.102c.94-2.822 3.594-4.772 6.317-4.772z" /></svg>
                Continue with Google
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
