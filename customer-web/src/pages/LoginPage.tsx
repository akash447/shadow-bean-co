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

  // Styles (Senior Designer Minimalist Polish)
  const inputGroupClass = "relative flex items-center border-b-2 border-gray-100 py-4 transition-colors hover:border-gray-300 focus-within:border-black mb-12"; // Extreme spacing (mb-12), very subtle border initially
  const iconClass = "text-gray-300 mr-6 w-6 h-6 transition-colors group-hover:text-gray-500 peer-focus:text-black";
  const inputClass = "w-full bg-transparent border-none outline-none text-gray-900 placeholder-gray-300 text-xl font-medium h-12 tracking-wide peer"; // Large text (text-xl), tracking-wide

  // Verification Screen
  if (needsConfirmation) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4 font-sans">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center w-full max-w-md">
          <div className="mb-10"><Yeti state="watching" size="small" /></div>
          <h2 className="text-3xl font-bold text-black mb-4 tracking-tight">Verify Code</h2>
          <p className="text-gray-400 mb-12 text-lg">Sent to {needsConfirmation.email}</p>
          {error && <div className="text-red-500 mb-6 font-medium">{error}</div>}
          <form onSubmit={handleConfirmation} className="space-y-8">
            <input
              value={confirmationCode}
              onChange={(e) => setConfirmationCode(e.target.value)}
              className="w-full text-center text-4xl tracking-[0.8em] border-b-2 border-gray-200 focus:border-black outline-none py-4 font-mono transition-colors"
              placeholder="000000" autoFocus
            />
            <button disabled={loading} className="w-full bg-black text-white py-5 rounded-full font-bold text-lg hover:bg-gray-800 transition-all disabled:opacity-50">
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // Main Layout: Minimalist Full Screen Split
  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row font-sans overflow-hidden bg-white">

      {/* CSS to override autofill background - aiming for pure white/transparent */}
      <style>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus, 
        input:-webkit-autofill:active{
            -webkit-box-shadow: 0 0 0 30px white inset !important;
            -webkit-text-fill-color: #000 !important;
            transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>

      {/* LEFT PANEL (50%) - Pure Branding */}
      <div className="w-full md:w-1/2 bg-[#F5F7FA] flex flex-col items-center justify-center p-20 relative order-1 md:order-none min-h-[400px]">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }} // Elegant easing
          className="flex flex-col items-center justify-center w-full max-w-lg text-center"
        >
          <div className="mb-16 scale-125 transform-gpu">
            <Yeti state={yetiState} lookAt={lookAt} size="large" />
          </div>
          <h2 className="text-5xl font-black text-black tracking-tighter leading-none">
            Shadow <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Bean Co.</span>
          </h2>
          {/* Subtitle REMOVED per user request */}
        </motion.div>
      </div>

      {/* RIGHT PANEL (50%) - Minimalist Form */}
      <div className="w-full md:w-1/2 bg-white flex flex-col justify-center items-center p-12 md:p-32 order-2 md:order-none">
        <div className="w-full max-w-lg"> {/* Slightly narrower for elegance */}

          <div className="mb-20 text-center md:text-left">
            <h1 className="text-6xl font-black text-black tracking-tighter mb-2">
              {tab === 'signin' ? 'Sign In.' : 'Join Us.'}
            </h1>
            {/* Descriptive p-tag REMOVED per user request */}
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

            {/* Checkbox & Forgot Password - Minimal style */}
            {tab === 'signin' && (
              <div className="flex items-center justify-between mt-10 mb-16">
                <div className="flex items-center group cursor-pointer">
                  <div className="relative flex items-center">
                    <input type="checkbox" id="remember" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="peer appearance-none w-6 h-6 border-2 border-gray-200 rounded-md bg-white checked:bg-black checked:border-black cursor-pointer transition-all" />
                    <svg className="absolute w-4 h-4 text-white left-[4px] top-[4px] opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <label htmlFor="remember" className="ml-4 text-lg text-gray-400 font-medium cursor-pointer group-hover:text-black transition-colors select-none">Remember me</label>
                </div>
                <a href="#" className="text-lg font-bold text-gray-400 hover:text-black transition-colors">Forgot?</a>
              </div>
            )}

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="text-red-600 text-lg mb-8 font-medium">
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Action Button - Oversized & Bold */}
            <button disabled={loading} className="w-full bg-black hover:bg-gray-900 text-white font-black py-6 rounded-full shadow-2xl hover:shadow-black/20 transition-all transform hover:-translate-y-1 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mb-16 text-2xl tracking-wide">
              {loading ? 'Processing...' : (tab === 'signin' ? 'Sign In →' : 'Create Account →')}
            </button>

            {/* Bottom Actions are now just Socials (Toggle moved to top implicitly or minimalistic bottom) */}
            <div className="flex flex-col items-center space-y-8">

              <div className="text-gray-400 text-lg font-medium">Or continue with</div>

              <div className="flex gap-8">
                <button type="button" className="w-16 h-16 rounded-full border-2 border-gray-100 flex items-center justify-center hover:border-black transition-colors group">
                  <span className="font-bold text-2xl text-gray-400 group-hover:text-black transition-colors">f</span>
                </button>
                <button type="button" className="w-16 h-16 rounded-full border-2 border-gray-100 flex items-center justify-center hover:border-black transition-colors group">
                  <svg className="w-7 h-7 text-gray-400 group-hover:text-black transition-colors" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" /></svg>
                </button>
                <button type="button" onClick={handleGoogle} className="w-16 h-16 rounded-full border-2 border-gray-100 flex items-center justify-center hover:border-black transition-colors group">
                  <span className="font-bold text-2xl text-gray-400 group-hover:text-black transition-colors">G</span>
                </button>
              </div>

              {/* Minimal Toggle */}
              <div className="pt-8">
                <button
                  onClick={() => { setTab(tab === 'signin' ? 'register' : 'signin'); setError(''); }}
                  className="text-gray-400 hover:text-black transition-colors text-lg font-bold border-b-2 border-transparent hover:border-black pb-1"
                >
                  {tab === 'signin' ? "Don't have an account? Join" : "Already a member? Sign In"}
                </button>
              </div>

            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
