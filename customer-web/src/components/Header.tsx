import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCartStore } from '../stores/cartStore';
import { useAuth } from '../contexts/AuthContext';
import { useAsset } from '../contexts/AssetContext';
import './Header.css';

// SVG Icons
const CartIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
);

const ProfileIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);

const FacebookIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
);

const InstagramIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
);

const MenuIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
);

const CloseIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

interface HeaderProps {
    variant?: 'light' | 'dark';
    minimal?: boolean;  // For auth pages (login/register)
}

export default function Header({ variant = 'light', minimal = false }: HeaderProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const { items } = useCartStore();
    const { user, profile } = useAuth();
    const logoBird = useAsset('logo_bird.png');
    const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const isActive = (path: string) => location.pathname === path;
    const textColor = variant === 'dark' ? '#fff' : '#1c0d02';

    const handleNavClick = (path: string) => {
        navigate(path);
        setMobileMenuOpen(false);
    };

    // Minimal header for auth pages - only logo
    if (minimal) {
        return (
            <header className={`header ${variant} minimal`}>
                <div className="header-logo" onClick={() => navigate('/')}>
                    <img src={logoBird} alt="Shadow Bean Co" />
                    <span className="logo-text">
                        SHADOW<br />BEAN CO.
                    </span>
                </div>
            </header>
        );
    }

    return (
        <>
            <header className={`header ${variant}`}>
                {/* Left: Logo */}
                <div className="header-logo" onClick={() => navigate('/')}>
                    <img src={logoBird} alt="Shadow Bean Co" />
                    <span className="logo-text">
                        SHADOW<br />BEAN CO.
                    </span>
                </div>

                {/* Center: Navigation - Desktop only */}
                <nav className="header-nav desktop-only">
                    <button
                        onClick={() => navigate('/')}
                        className={isActive('/') ? 'active' : ''}
                        style={{ color: textColor }}
                    >
                        HOME
                    </button>
                    <button
                        onClick={() => navigate('/shop')}
                        className={isActive('/shop') ? 'active' : ''}
                        style={{ color: textColor }}
                    >
                        SHOP
                    </button>
                    <button
                        onClick={() => navigate('/about')}
                        className={isActive('/about') ? 'active' : ''}
                        style={{ color: textColor }}
                    >
                        ABOUT
                    </button>
                </nav>

                {/* Right: Social + Profile + Cart + Mobile Menu */}
                <div className="header-right">
                    <div className="social-icons desktop-only">
                        <a href="https://facebook.com/shadowbeanco" target="_blank" rel="noopener noreferrer" style={{ color: textColor }}>
                            <FacebookIcon />
                        </a>
                        <a href="https://instagram.com/shadowbeanco" target="_blank" rel="noopener noreferrer" style={{ color: textColor }}>
                            <InstagramIcon />
                        </a>
                    </div>
                    <button className="icon-button cart-btn" onClick={() => navigate('/cart')} style={{ color: textColor }}>
                        <CartIcon />
                        {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                    </button>
                    <button className="icon-button desktop-only" onClick={() => navigate('/profile')} style={{ color: textColor }}>
                        <ProfileIcon />
                    </button>
                    {/* Mobile Menu Toggle */}
                    <button className="icon-button mobile-menu-btn" onClick={() => setMobileMenuOpen(true)} style={{ color: textColor }}>
                        <MenuIcon />
                    </button>
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div className="mobile-menu-overlay" onClick={() => setMobileMenuOpen(false)}>
                    <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>
                        <button className="mobile-menu-close" onClick={() => setMobileMenuOpen(false)}>
                            <CloseIcon />
                        </button>

                        {/* Profile Header Section */}
                        <div className="mobile-profile-header" onClick={() => handleNavClick('/profile')}>
                            {profile?.avatar_url ? (
                                <img src={profile.avatar_url} alt="Profile" className="mobile-profile-avatar" />
                            ) : (
                                <div className="mobile-profile-avatar-placeholder">
                                    <ProfileIcon />
                                </div>
                            )}
                            <div className="mobile-profile-info">
                                {profile?.full_name ? (
                                    <>
                                        <span className="mobile-profile-name">{profile.full_name}</span>
                                        <span className="mobile-profile-label">Profile</span>
                                    </>
                                ) : user?.email ? (
                                    <>
                                        <span className="mobile-profile-name">{user.email.split('@')[0]}</span>
                                        <span className="mobile-profile-label">Profile</span>
                                    </>
                                ) : (
                                    <span className="mobile-profile-name">Profile</span>
                                )}
                            </div>
                        </div>

                        <nav className="mobile-nav">
                            <button onClick={() => handleNavClick('/')} className={isActive('/') ? 'active' : ''}>HOME</button>
                            <button onClick={() => handleNavClick('/shop')} className={isActive('/shop') ? 'active' : ''}>SHOP</button>
                            <button onClick={() => handleNavClick('/about')} className={isActive('/about') ? 'active' : ''}>ABOUT</button>
                        </nav>
                        <div className="mobile-social">
                            <a href="https://facebook.com/shadowbeanco" target="_blank" rel="noopener noreferrer">
                                <FacebookIcon />
                            </a>
                            <a href="https://instagram.com/shadowbeanco" target="_blank" rel="noopener noreferrer">
                                <InstagramIcon />
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

