import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import './LoginPage.css';

export default function LoginPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const redirectTo = searchParams.get('redirect') || '/profile';
    const message = searchParams.get('message');

    const { login, loginWithGoogle, needsConfirmation, confirmSignUp } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmationCode, setConfirmationCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const { error: loginError } = await login(email, password);

        if (loginError) {
            setError(loginError.message);
            setLoading(false);
        } else {
            navigate(redirectTo);
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
            navigate(redirectTo);
        }
    };

    const handleGoogleLogin = async () => {
        setError('');
        try {
            await loginWithGoogle();
        } catch (err: any) {
            setError('Google login failed. Please try again.');
        }
    };

    // Show confirmation code form if user needs to verify email
    if (needsConfirmation) {
        return (
            <div className="auth-container">
                <Header variant="light" minimal={true} />
                <main className="auth-main">
                    <div className="auth-card">
                        <h1>Verify Your Email</h1>
                        <p className="auth-subtitle">
                            Enter the verification code sent to <strong>{needsConfirmation.email}</strong>
                        </p>

                        {error && <div className="error-message">{error}</div>}

                        <form onSubmit={handleConfirmation}>
                            <div className="form-group">
                                <label>Verification Code</label>
                                <input
                                    type="text"
                                    value={confirmationCode}
                                    onChange={(e) => setConfirmationCode(e.target.value)}
                                    placeholder="Enter 6-digit code"
                                    required
                                    autoFocus
                                    style={{ textAlign: 'center', fontSize: '18px', letterSpacing: '4px' }}
                                />
                            </div>

                            <button type="submit" className="auth-button" disabled={loading}>
                                {loading ? 'Verifying...' : 'Verify & Sign In'}
                            </button>
                        </form>

                        <div className="auth-links">
                            <span>Didn't receive the code? Check your spam folder.</span>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="auth-container">
            {/* Minimal header - only logo */}
            <Header variant="light" minimal={true} />

            <main className="auth-main">
                <div className="auth-card">
                    <h1>Welcome Back</h1>
                    <p className="auth-subtitle">Sign in to your account</p>

                    {message === 'login_required' && (
                        <div className="info-message">
                            Please login or create an account to complete your order. Your shipping details have been saved.
                        </div>
                    )}

                    {error && <div className="error-message">{error}</div>}

                    {/* Google Login Button */}
                    <button type="button" className="google-login-btn" onClick={handleGoogleLogin}>
                        <svg viewBox="0 0 24 24" width="20" height="20" className="google-icon">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Continue with Google
                    </button>

                    <div className="auth-divider">
                        <span>or</span>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Min. 8 characters"
                                required
                            />
                        </div>

                        <button type="submit" className="auth-button" disabled={loading}>
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    <div className="auth-links">
                        <Link to="/forgot-password">Forgot password?</Link>
                        <span>•</span>
                        <Link to={`/register${redirectTo !== '/profile' ? `?redirect=${redirectTo}` : ''}`}>Create account</Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
