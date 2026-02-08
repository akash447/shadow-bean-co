import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn, signInWithGoogle } from '../lib/admin-api';
import { Mail, Eye, EyeOff } from 'lucide-react';

interface LoginProps {
    onLogin: (user: any) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { data, error: signInError } = await signIn(email, password);

            if (signInError) {
                setError(signInError.message);
                setLoading(false);
                return;
            }

            if (data?.user) {
                // Check if user is admin (from Cognito groups)
                if (!data.user.isAdmin) {
                    setError('Access denied. You need Admin privileges to access this panel. Please contact your administrator to be added to the Admin group in AWS Cognito.');
                    setLoading(false);
                    return;
                }

                onLogin(data.user);
                navigate('/dashboard');
            }
        } catch (err: any) {
            setError(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-logo">
                    {/* Brand Logo */}
                    <img
                        src="/logo.png"
                        alt="Shadow Bean Co."
                        style={{ width: '80px', height: '80px', objectFit: 'contain', marginBottom: '12px' }}
                        onError={(e) => {
                            // Fallback to text if logo not found
                            (e.target as HTMLImageElement).style.display = 'none';
                        }}
                    />
                    <h1>SHADOW BEAN CO.</h1>
                    <p>Admin Panel</p>
                </div>

                <div style={{ marginBottom: '24px', textAlign: 'center', padding: '12px', background: '#f5f0eb', borderRadius: '8px' }}>
                    <Mail size={20} style={{ marginBottom: '4px', color: '#8b7355' }} />
                    <div style={{ fontSize: '14px', color: '#666' }}>
                        Sign in with your AWS Cognito credentials
                    </div>
                </div>

                {/* Google Login Button */}
                <button
                    type="button"
                    onClick={async () => {
                        try {
                            await signInWithGoogle();
                        } catch (err: any) {
                            setError('Google sign-in failed. Please try again.');
                        }
                    }}
                    style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        padding: '12px',
                        border: '1px solid #E5E5E5',
                        borderRadius: '8px',
                        background: 'white',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#333',
                        cursor: 'pointer',
                        marginBottom: '16px',
                        fontFamily: 'inherit',
                    }}
                >
                    <svg viewBox="0 0 24 24" width="20" height="20">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continue with Google
                </button>

                <div style={{ display: 'flex', alignItems: 'center', margin: '16px 0' }}>
                    <div style={{ flex: 1, height: '1px', background: '#E5E5E5' }} />
                    <span style={{ padding: '0 12px', color: '#888', fontSize: '13px' }}>or</span>
                    <div style={{ flex: 1, height: '1px', background: '#E5E5E5' }} />
                </div>

                {error && <div className="login-error">{error}</div>}

                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            className="form-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@example.com"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                className="form-input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                style={{ paddingRight: '48px' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    color: '#8b7355',
                                }}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', justifyContent: 'center' }}
                        disabled={loading}
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div style={{ marginTop: '20px', fontSize: '12px', color: '#999', textAlign: 'center' }}>
                    Admin access requires membership in the "Admin" Cognito User Group
                </div>
            </div>
        </div>
    );
};
