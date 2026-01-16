import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { signOut } from '../lib/supabase';
import {
    LayoutDashboard,
    Users,
    ShoppingCart,
    Star,
    DollarSign,
    FileText,
    Image,
    LogOut,
    Coffee,
    Package,
    Shield
} from 'lucide-react';

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
    const navigate = useNavigate();

    const handleLogout = async () => {
        await signOut();
        navigate('/');
    };

    const handleNavClick = () => {
        // Close sidebar on mobile when navigating
        if (onClose) onClose();
    };

    const navItems = [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/users', icon: Users, label: 'Users' },
        { path: '/orders', icon: ShoppingCart, label: 'Orders' },
        { path: '/products', icon: Package, label: 'Products' },
        { path: '/reviews', icon: Star, label: 'Reviews' },
        { path: '/pricing', icon: DollarSign, label: 'Pricing' },
        { path: '/terms', icon: FileText, label: 'Terms & Conditions' },
        { path: '/media', icon: Image, label: 'Media' },
        { path: '/access', icon: Shield, label: 'Admin Access' },
    ];

    return (
        <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
            <div className="sidebar-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Coffee size={28} />
                    <div>
                        <div className="sidebar-logo">SHADOW BEAN CO.</div>
                        <div className="sidebar-subtitle">Admin Panel</div>
                    </div>
                </div>
            </div>

            <nav className="sidebar-nav">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        onClick={handleNavClick}
                    >
                        <item.icon size={20} />
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-footer">
                <button onClick={handleLogout} className="nav-item" style={{ width: '100%', border: 'none', background: 'none' }}>
                    <LogOut size={20} />
                    Sign Out
                </button>
            </div>
        </aside>
    );
};
