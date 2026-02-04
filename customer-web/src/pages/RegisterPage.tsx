import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import './LoginPage.css'; // Reuse auth styles

export default function RegisterPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const redirectTo = searchParams.get('redirect') || '/profile';

    const { register } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        const { error: registerError } = await register(email, password, name);

        if (registerError) {
            setError(registerError.message);
            setLoading(false);
        } else {
            navigate(redirectTo);
        }
    };

    // Note: Google OAuth requires Cognito Hosted UI configuration

    return (
        <div className="auth-container">
            {/* Minimal header - only logo */}
            <Header variant="light" minimal={true} />

            <main className="auth-main">
                <div className="auth-card">
                    <h1>Create Account</h1>
                    <p className="auth-subtitle">Join Shadow Bean Co. today</p>

                    {error && <div className="error-message">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Full Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="John Doe"
                                required
                            />
                        </div>

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

                        <div className="form-group">
                            <label>Confirm Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <button type="submit" className="auth-button auth-button-black" disabled={loading}>
                            {loading ? 'Creating account...' : 'Create Account'}
                        </button>
                    </form>

                    {/* Google OAuth requires Cognito Hosted UI - coming soon */}

                    <div className="auth-links">
                        <span>Already have an account?</span>
                        <Link to={`/login${redirectTo !== '/profile' ? `?redirect=${redirectTo}` : ''}`}>Sign in</Link>
                    </div>
                </div>
            </main>
        </div>
    );
}

