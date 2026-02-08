import React, { useEffect, useState } from 'react';
import { getUsers } from '../lib/admin-api';
import { Search, Mail, Phone, Calendar } from 'lucide-react';

export const UsersPage: React.FC = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        const { data, error } = await getUsers();
        if (!error && data) {
            setUsers(data);
        }
        setLoading(false);
    };

    const filteredUsers = users.filter(user =>
        user.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        user.email?.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return <div>Loading users...</div>;
    }

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Users</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#8b7355' }} />
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Search users..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ paddingLeft: '40px', width: '300px' }}
                        />
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Joined</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((user) => (
                                <tr key={user.id}>
                                    <td>
                                        <div style={{ fontWeight: '500' }}>{user.full_name || 'Unknown'}</div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8b7355' }}>
                                            <Mail size={14} />
                                            {user.email || '-'}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8b7355' }}>
                                            <Phone size={14} />
                                            {user.phone || '-'}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8b7355' }}>
                                            <Calendar size={14} />
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td>
                                        <span className="badge badge-success">Active</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredUsers.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#8b7355' }}>
                        No users found
                    </div>
                )}
            </div>
        </div>
    );
};
