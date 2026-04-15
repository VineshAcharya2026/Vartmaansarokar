import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BadgeCheck, LogOut } from 'lucide-react';
import api from '../lib/api';
import { isLoggedIn, clearAuth } from '../utils/auth';
import { useApp } from '../AppContext';

const Profile: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { logout } = useApp();

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate('/staff-login', { replace: true });
      return;
    }
    api.get('/api/auth/me')
      .then(res => setUser(res.data.user))
      .catch(err => {
        if (err.response?.status === 401) {
          clearAuth();
          navigate('/staff-login', { replace: true });
        } else {
          setError(err.response?.data?.error || 'Failed to load profile');
        }
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm font-bold tracking-widest text-[#800000] uppercase">Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg mx-auto text-center">
        <p className="text-red-600 font-semibold mb-4">{error}</p>
        <Link to="/" className="inline-flex bg-[#800000] text-white px-5 py-2 rounded-lg font-bold">Return Home</Link>
      </div>
    );
  }

  if (!user) return null;

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'bg-purple-100 text-purple-700';
      case 'ADMIN': return 'bg-red-100 text-[#800000]';
      case 'EDITOR': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-5 mb-6">
          <div className="w-16 h-16 rounded-full bg-[#001f3f] flex items-center justify-center text-white text-2xl font-black">
            {(user.name || user.email || '?')[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#001f3f] serif">{user.name || 'User'}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{user.email}</p>
            <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${getRoleBadgeColor(user.role)}`}>
              {user.role?.replace('_', ' ')}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Subscription Plan', value: user.subscription_plan || 'FREE' },
            { label: 'Subscription Status', value: user.subscription_status || 'INACTIVE' },
            { label: 'Payment Status', value: user.subscription_plan === 'PRINT' ? (user.subscription_status === 'ACTIVE' ? 'Verified' : 'Pending Verification') : 'N/A' },
            { label: 'Member Since', value: user.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' }) : '—' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-gray-50 rounded-xl px-4 py-3">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
              <p className="text-sm font-semibold text-[#001f3f]">{value}</p>
            </div>
          ))}
        </div>

        {user.subscription_status === 'ACTIVE' && (
          <div className="mt-5 bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-full"><BadgeCheck size={20} className="text-green-600" /></div>
            <div>
              <p className="font-bold text-sm">Access Granted</p>
              <p className="text-xs text-green-700">Your subscription is active. You have full access to premium content.</p>
            </div>
          </div>
        )}
        
        {user.subscription_status === 'PENDING' && (
          <div className="mt-5 bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-xl flex items-center gap-3">
            <div>
              <p className="font-bold text-sm">Approval Pending</p>
              <p className="text-xs text-yellow-700">Your subscription request has been received and is waiting for admin approval. You will be notified shortly.</p>
            </div>
          </div>
        )}

        {['EDITOR', 'ADMIN', 'SUPER_ADMIN'].includes(user.role) && (
          <div className="mt-5 pt-5 border-t border-gray-100 flex gap-3">
            <Link to="/admin" className="flex-1 text-center bg-[#001f3f] text-white py-2.5 rounded-xl font-bold text-sm">
              Go to Dashboard
            </Link>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-gray-100">
          <button 
            onClick={() => {
              logout();
              navigate('/', { replace: true });
            }}
            className="w-full flex items-center justify-center gap-2 bg-gray-50 hover:bg-red-50 text-gray-600 hover:text-red-700 py-3 rounded-xl font-black text-sm transition-all duration-200"
          >
            <LogOut size={18} />
            Logout from Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
