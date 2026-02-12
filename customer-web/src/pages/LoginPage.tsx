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
  // const [phone, setPhone] = useState(''); // Removed per refined layout
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

  // Styles (Refined Minimalist)
  const inputGroupClass = "relative flex items-center border-b border-gray-300 py-4 transition-colors hover:border-gray-500 focus-within:border-blue-600 mb-8";
  const iconClass = "text-gray-400 mr-5 w-6 h-6";
  const inputClass = "w-full bg-transparent border-none outline-none text-gray-800 placeholder-gray-400 text-base font-medium";

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

  // Main Layout: Full Screen Split
  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row font-sans overflow-hidden">

      {/* LEFT PANEL (50%) - Branding & Yeti */}
      <div className="w-full md:w-1/2 bg-[#F0F4F8] flex flex-col items-center justify-center p-12 relative order-1 md:order-none min-h-[40vh] md:min-h-screen">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, type: "spring" }}
          className="flex-1 flex flex-col items-center justify-center w-full max-w-md"
        >
          <Yeti state={yetiState} lookAt={lookAt} size="large" />
          <h2 className="text-2xl font-bold text-gray-700 mt-8 tracking-tight">Welcome Back!</h2>
          <p className="text-gray-500 mt-2 text-center max-w-xs">Access your account to manage your orders and preferences.</p>
        </motion.div>
      </div>

      {/* RIGHT PANEL (50%) - Login Form */}
      <div className="w-full md:w-1/2 bg-white flex flex-col justify-center items-center p-10 md:p-20 order-2 md:order-none flex-1 min-h-[60vh] md:min-h-screen">
        <div className="w-full max-w-md">

          <div className="mb-12">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
              {tab === 'signin' ? 'Sign In' : 'Sign Up'}
            </h1>
            <p className="text-gray-500 text-lg">
              Please enter your details to continue.
            </p>
          </div>

          <form onSubmit={handleAuth} className="w-full">
            {tab === 'register' && (
              <div className={inputGroupClass}>
                <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                <input type="text" placeholder="Full Name" className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
            )}

            <div className={inputGroupClass}>
              <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              <input
                ref={emailRef} type="email" placeholder="Email Address" className={inputClass}
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

            {/* Checkbox & Forgot Password */}
            {tab === 'signin' && (
              <div className="flex items-center justify-between mt-6 mb-10">
                <div className="flex items-center">
                  <input type="checkbox" id="remember" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2 cursor-pointer" />
                  <label htmlFor="remember" className="text-sm font-medium text-gray-600 cursor-pointer select-none">Remember me</label>
                </div>
                <a href="#" className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors">Forgot Password?</a>
              </div>
            )}

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-red-500 text-sm bg-red-50 p-3 rounded-lg mb-6 font-medium">
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Action Button */}
            <button disabled={loading} className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mb-8 text-lg">
              {loading ? 'Processing...' : (tab === 'signin' ? 'Sign In' : 'Sign Up')}
            </button>

            {/* Bottom Actions: Socials & Toggle */}
            <div className="flex flex-col items-center space-y-8">

              {/* Divider */}
              <div className="w-full flex items-center justify-between">
                <div className="h-px bg-gray-200 flex-1"></div>
                <span className="text-gray-400 text-sm font-medium px-4">Or continue with</span>
                <div className="h-px bg-gray-200 flex-1"></div>
              </div>

              {/* Social Icons */}
              <div className="flex gap-4">
                <button type="button" className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 hover:border-blue-500 transition-all group">
                  <span className="font-bold text-xl text-[#3b5998] group-hover:scale-110 transition-transform">f</span>
                </button>
                <button type="button" className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 hover:border-blue-400 transition-all group">
                  <svg className="w-5 h-5 text-[#1DA1F2] group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" /></svg>
                </button>
                <button type="button" onClick={handleGoogle} className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 hover:border-red-500 transition-all group">
                  <span className="font-bold text-xl text-[#DB4437] group-hover:scale-110 transition-transform">G</span>
                </button>
              </div>

              {/* Toggle Link */}
              <div className="text-gray-600 font-medium">
                {tab === 'signin' ? "Don't have an account? " : "Already have an account? "}
                <button
                  onClick={() => { setTab(tab === 'signin' ? 'register' : 'signin'); setError(''); }}
                  className="text-blue-600 font-bold hover:underline transition-colors ml-1"
                >
                  {tab === 'signin' ? 'Register Now' : 'Sign In'}
                </button>
              </div>

            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
