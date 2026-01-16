import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn, isAdminUser, supabase } from '../lib/supabase';
import { Mail, Key, Eye, EyeOff } from 'lucide-react';

// Master Admin Credentials
const MASTER_ADMIN_USER_ID = 'Admin001';
const MASTER_ADMIN_PASSWORD = 'Qwerty9876';

interface LoginProps {
    onLogin: (user: any) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [loginMethod, setLoginMethod] = useState<'email' | 'userid'>('userid');
    const [email, setEmail] = useState('');
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleEmailLogin = async (e: React.FormEvent) => {
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

            if (data.user) {
                // Check if user is admin
                const { isAdmin } = await isAdminUser(data.user.id);

                if (!isAdmin) {
                    setError('Access denied. Admin privileges required.');
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

    const handleUserIdLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // For Master Admin - check against hardcoded credentials
            if (userId === MASTER_ADMIN_USER_ID && password === MASTER_ADMIN_PASSWORD) {
                onLogin({
                    id: MASTER_ADMIN_USER_ID,
                    email: 'admin@shadowbeanco.com',
                    isMasterAdmin: true,
                });
                navigate('/dashboard');
                return;
            }

            // For other admin users, check against admin_users table
            const { data: adminUser, error: adminError } = await supabase
                .from('admin_users')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (adminError || !adminUser) {
                setError('Invalid User ID or access denied');
                setLoading(false);
                return;
            }

            if (!adminUser.is_active) {
                setError('This account has been deactivated');
                setLoading(false);
                return;
            }

            onLogin({
                id: userId,
                email: adminUser.email || '',
                role: adminUser.role || 'admin',
            });
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError('');
        setLoading(true);

        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin + '/dashboard',
                },
            });

            if (error) {
                setError(error.message);
            }
        } catch (err: any) {
            setError(err.message || 'Google login failed');
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

                {/* Login Method Tabs */}
                <div style={{ display: 'flex', marginBottom: '24px', borderBottom: '1px solid #e8ddd4' }}>
                    <button
                        onClick={() => setLoginMethod('userid')}
                        style={{
                            flex: 1,
                            padding: '12px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: loginMethod === 'userid' ? '600' : '400',
                            color: loginMethod === 'userid' ? '#3d2c29' : '#8b7355',
                            borderBottom: loginMethod === 'userid' ? '2px solid #3d2c29' : 'none',
                        }}
                    >
                        <Key size={16} style={{ marginRight: '8px' }} />
                        User ID
                    </button>
                    <button
                        onClick={() => setLoginMethod('email')}
                        style={{
                            flex: 1,
                            padding: '12px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: loginMethod === 'email' ? '600' : '400',
                            color: loginMethod === 'email' ? '#3d2c29' : '#8b7355',
                            borderBottom: loginMethod === 'email' ? '2px solid #3d2c29' : 'none',
                        }}
                    >
                        <Mail size={16} style={{ marginRight: '8px' }} />
                        Email
                    </button>
                </div>

                {error && <div className="login-error">{error}</div>}

                {loginMethod === 'userid' ? (
                    <form onSubmit={handleUserIdLogin}>
                        <div className="form-group">
                            <label className="form-label">Admin User ID</label>
                            <input
                                type="text"
                                className="form-input"
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                                placeholder="Enter your User ID"
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
                            {loading ? 'Signing in...' : 'Sign In with User ID'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleEmailLogin}>
                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input
                                type="email"
                                className="form-input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@shadowbeanco.com"
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
                            style={{ width: '100%', justifyContent: 'center', marginBottom: '12px' }}
                            disabled={loading}
                        >
                            {loading ? 'Signing in...' : 'Sign In with Email'}
                        </button>

                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            className="btn btn-outline"
                            style={{ width: '100%', justifyContent: 'center' }}
                            disabled={loading}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" style={{ marginRight: '8px' }}>
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Continue with Google
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};
