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

  // Styles (Refined to match reference)
  const inputGroupClass = "relative flex items-center border-b border-gray-300 py-3 transition-colors hover:border-gray-400 focus-within:border-blue-500 mb-6";
  const iconClass = "text-gray-400 mr-4 w-5 h-5";
  const inputClass = "w-full bg-transparent border-none outline-none text-gray-700 placeholder-gray-400 text-sm font-medium";

  // Verification Screen
  if (needsConfirmation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-md text-center">
          <Yeti state="watching" size="small" />
          <h2 className="text-2xl font-bold text-gray-800 mt-6 mb-2">Verify Code</h2>
          <p className="text-sm text-gray-500 mb-8">Sent to {needsConfirmation.email}</p>
          {error && <div className="text-red-500 text-sm mb-4 bg-red-50 p-3 rounded-lg">{error}</div>}
          <form onSubmit={handleConfirmation} className="space-y-6">
            <input
              value={confirmationCode}
              onChange={(e) => setConfirmationCode(e.target.value)}
              className="w-full text-center text-3xl tracking-[0.5em] border-b-2 border-gray-200 focus:border-blue-500 outline-none py-2 font-mono"
              placeholder="000000" autoFocus
            />
            <button disabled={loading} className="w-full bg-[#4A90E2] text-white py-3 rounded-lg font-bold hover:bg-[#357ABD] transition disabled:opacity-50">
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // Main Layout
  return (
    <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center p-4 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[2rem] shadow-2xl w-full max-w-[1000px] min-h-[600px] flex flex-col md:flex-row overflow-hidden relative"
      >

        {/* LEFT: Illustration & Toggle */}
        <div className="w-full md:w-1/2 flex flex-col items-center justify-between p-10 bg-white md:border-r border-gray-100 relative">
          <div className="flex-1 flex flex-col items-center justify-center w-full">
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="cursor-pointer mb-8"
            >
              <Yeti state={yetiState} lookAt={lookAt} size="large" />
            </motion.div>
          </div>

          {/* Toggle Link (Bottom Left) */}
          <div className="w-full text-center pb-4">
            <button
              onClick={() => { setTab(tab === 'signin' ? 'register' : 'signin'); setError(''); }}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 underline decoration-gray-300 hover:decoration-gray-600 underline-offset-4 transition-colors"
            >
              {tab === 'signin' ? 'Create an account' : 'I am already member'}
            </button>
          </div>
        </div>

        {/* RIGHT: Form */}
        <div className="w-full md:w-1/2 p-10 md:p-16 flex flex-col justify-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-12">
            {tab === 'signin' ? 'Sign In' : 'Sign Up'}
          </h1>

          <form onSubmit={handleAuth} className="w-full max-w-[320px]">
            {tab === 'register' && (
              <>
                <div className={inputGroupClass}>
                  <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  <input type="text" placeholder="Your Name" className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
              </>
            )}

            <div className={inputGroupClass}>
              <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              <input
                ref={emailRef} type="email" placeholder="Your name" className={inputClass} // Placeholder says "Your name" based on icon in ref, but logic expects email. Using generic 'Your name/email' style.
                value={email} onChange={onEmailChange} onFocus={() => setYetiState('watching')} onBlur={() => setYetiState('idle')} required
              />
            </div>

            <div className={inputGroupClass}>
              <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              <input
                type="password" placeholder="Password" className={inputClass}
                value={password} onChange={(e) => setPassword(e.target.value)} onFocus={() => setYetiState('shy')} onBlur={() => setYetiState('idle')} required
              />
            </div>

            {tab === 'register' && (
              <div className={inputGroupClass}>
                <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                <input
                  type="password" placeholder="Confirm Password" className={inputClass}
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} onFocus={() => setYetiState('shy')} onBlur={() => setYetiState('idle')} required
                />
              </div>
            )}

            {/* Checkbox */}
            {tab === 'signin' && (
              <div className="flex items-center mt-6 mb-8">
                <input type="checkbox" id="remember" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500 mr-2" />
                <label htmlFor="remember" className="text-sm text-gray-500">Remember me</label>
              </div>
            )}

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-red-500 text-xs bg-red-50 p-2 rounded mb-4">
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Action Button */}
            <button disabled={loading} className="bg-[#5A9BEF] hover:bg-[#4a8bdb] text-white font-bold py-3 px-10 rounded-lg shadow-lg hover:shadow-xl transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mb-10">
              {loading ? 'Thinking...' : 'Log in'}
            </button>

            {/* Socials */}
            <div className="mt-auto">
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <span>Or login with</span>
                <div className="flex gap-3">
                  <button type="button" className="w-9 h-9 rounded bg-[#3b5998] text-white flex items-center justify-center hover:opacity-90 transition shadow-sm font-bold text-lg pb-1">f</button>
                  <button type="button" className="w-9 h-9 rounded bg-[#1DA1F2] text-white flex items-center justify-center hover:opacity-90 transition shadow-sm">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" /></svg>
                  </button>
                  <button type="button" onClick={handleGoogle} className="w-9 h-9 rounded bg-[#DB4437] text-white flex items-center justify-center hover:opacity-90 transition shadow-sm font-bold text-lg">G</button>
                </div>
              </div>
            </div>

          </form>
        </div>
      </motion.div>
    </div>
  );
}
