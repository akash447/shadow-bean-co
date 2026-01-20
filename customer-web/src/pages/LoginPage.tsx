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

    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
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
                            🔐 Please login or create an account to complete your order. Your shipping details have been saved.
                        </div>
                    )}

                    {error && <div className="error-message">{error}</div>}

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
                                placeholder="••••••••"
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
