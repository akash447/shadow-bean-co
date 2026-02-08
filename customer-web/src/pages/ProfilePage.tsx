import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAsset } from '../contexts/AssetContext';
import Header from '../components/Header';
import './ProfilePage.css';

export default function ProfilePage() {
    const navigate = useNavigate();
    const { user, profile, loading, logout } = useAuth();
    const logoBird = useAsset('logo_bird.png');

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    if (loading) {
        return (
            <div className="profile-container">
                <Header variant="light" />
                <main className="profile-main">
                    <div className="loading-spinner">Loading...</div>
                </main>
            </div>
        );
    }

    // Not logged in - show login prompt
    if (!user) {
        return (
            <div className="profile-container">
                <Header variant="light" />
                <main className="profile-main">
                    <div className="login-prompt">
                        <img src={logoBird} alt="Shadow Bean Co" className="prompt-logo" />
                        <h1>Welcome to Shadow Bean Co.</h1>
                        <p>Sign in to view your profile, saved blends, and order history.</p>
                        <div className="prompt-buttons">
                            <button className="primary-btn" onClick={() => navigate('/login')}>
                                Sign In
                            </button>
                            <button className="secondary-btn" onClick={() => navigate('/register')}>
                                Create Account
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    // Logged in - show profile
    return (
        <div className="profile-container">
            <Header variant="light" />
            <main className="profile-main">
                <div className="profile-card">
                    <div className="profile-header">
                        <div className="profile-avatar">
                            {profile?.full_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="profile-info">
                            <h1>{profile?.full_name || 'Coffee Lover'}</h1>
                            <p>{user.email}</p>
                        </div>
                    </div>

                    <div className="profile-stats">
                        <div className="stat-item">
                            <span className="stat-value">0</span>
                            <span className="stat-label">Orders</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value">0</span>
                            <span className="stat-label">Saved Blends</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value">0</span>
                            <span className="stat-label">Reviews</span>
                        </div>
                    </div>

                    <div className="profile-sections">
                        <div className="section">
                            <h2>Your Saved Blends</h2>
                            <p className="empty-state">No saved blends yet. Create your first custom blend!</p>
                            <button className="section-btn" onClick={() => navigate('/shop')}>
                                Create Blend
                            </button>
                        </div>

                        <div className="section">
                            <h2>Order History</h2>
                            <p className="empty-state">No orders yet. Start your coffee journey!</p>
                            <button className="section-btn" onClick={() => navigate('/shop')}>
                                Shop Now
                            </button>
                        </div>
                    </div>

                    <button className="logout-btn" onClick={handleLogout}>
                        Sign Out
                    </button>
                </div>
            </main>
        </div>
    );
}
