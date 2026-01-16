import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, Users } from 'lucide-react';

export const BottomNav: React.FC = () => {
    const navItems = [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/orders', icon: ShoppingCart, label: 'Orders' },
        { path: '/products', icon: Package, label: 'Products' },
        { path: '/users', icon: Users, label: 'Users' },
    ];

    return (
        <nav className="bottom-nav">
            {navItems.map((item) => (
                <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
                >
                    <item.icon size={20} />
                    <span>{item.label}</span>
                </NavLink>
            ))}
        </nav>
    );
};
