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

  const { user, loading: authLoading, login, loginWithGoogle, register, needsConfirmation, confirmSignUp } = useAuth();
  const { state: yetiState, lookAt, setYetiState, trackInputCursor } = useYeti();

  const [tab, setTab] = useState<Tab>((searchParams.get('tab') === 'register' ? 'register' : 'signin'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
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
      const { error, needsConfirmation } = await register(email, password, name, phone || undefined);
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

  // Field interactions
  const onEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    trackInputCursor(e, emailRef.current);
  };

  // Shared styles
  const inputGroupClass = "relative flex items-center border-b border-gray-300 py-2 focus-within:border-blue-500 transition-colors";
  const iconClass = "text-gray-400 mr-3 w-5 h-5";
  const inputClass = "w-full bg-transparent border-none outline-none text-gray-700 placeholder-gray-400 text-sm";

  if (needsConfirmation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          <Yeti state="watching" size="small" />
          <h2 className="text-2xl font-bold text-gray-800 mt-4 mb-2">Verify Code</h2>
          <p className="text-sm text-gray-500 mb-6">Sent to {needsConfirmation.email}</p>
          {error && <div className="text-red-500 text-sm mb-4 bg-red-50 p-2 rounded">{error}</div>}
          <form onSubmit={handleConfirmation} className="space-y-4">
            <input
              value={confirmationCode}
              onChange={(e) => setConfirmationCode(e.target.value)}
              className="w-full text-center text-2xl tracking-[0.5em] border-b-2 border-gray-200 focus:border-blue-500 outline-none py-2"
              placeholder="000000" autoFocus
            />
            <button disabled={loading} className="w-full bg-[#4285F4] text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition disabled:opacity-50">
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col md:flex-row overflow-hidden"
      >
        {/* LEFT: Illustration */}
        <div className="w-full md:w-1/2 bg-white flex flex-col items-center justify-center p-8 md:p-12 border-r border-gray-100">
          <motion.div whileHover={{ scale: 1.05 }} className="cursor-pointer mb-6">
            <Yeti state={yetiState} lookAt={lookAt} size="large" />
          </motion.div>

          <button
            onClick={() => { setTab(tab === 'signin' ? 'register' : 'signin'); setError(''); }}
            className="text-sm text-gray-500 hover:text-gray-800 underline decoration-gray-300 hover:decoration-gray-800 transition-all offset-4"
          >
            {tab === 'signin' ? 'Create an account' : 'Already have an account?'}
          </button>
        </div>

        {/* RIGHT: Form */}
        <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-10">
            {tab === 'signin' ? 'Sign In' : 'Sign Up'}
          </h1>

          <form onSubmit={handleAuth} className="space-y-6">
            {tab === 'register' && (
              <>
                <div className={inputGroupClass}>
                  <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  <input type="text" placeholder="Your Name" className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className={inputGroupClass}>
                  <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  <input type="tel" placeholder="Phone (Optional)" className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </>
            )}

            <div className={inputGroupClass}>
              <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              <input
                ref={emailRef} type="email" placeholder="Your Email" className={inputClass}
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

            {/* Remember Me & Forgot Password */}
            {tab === 'signin' && (
              <div className="flex items-center justify-between mt-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500" />
                  <span className="text-xs text-gray-500">Remember me</span>
                </label>
                <a href="#" className="text-xs text-gray-500 hover:text-gray-800">Forgot password?</a>
              </div>
            )}

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-red-500 text-xs bg-red-50 p-2 rounded">
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button disabled={loading} className="w-full bg-[#4A90E2] hover:bg-[#357ABD] text-white font-medium py-3 rounded-lg shadow-md hover:shadow-lg transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Thinking...' : (tab === 'signin' ? 'Log in' : 'Sign up')}
            </button>
          </form>

          {/* Social Login */}
          <div className="mt-10">
            <p className="text-center text-xs text-gray-400 mb-4">Or login with</p>
            <div className="flex justify-center gap-4">
              <button className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm w-12 h-12 flex items-center justify-center">
                <span className="font-bold text-lg">f</span>
              </button>
              <button className="p-3 bg-[#1DA1F2] text-white rounded-lg hover:bg-[#0c85d0] transition shadow-sm w-12 h-12 flex items-center justify-center">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" /></svg>
              </button>
              <button onClick={handleGoogle} className="p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition shadow-sm w-12 h-12 flex items-center justify-center group">
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
