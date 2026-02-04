import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn } from '../lib/supabase';
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
