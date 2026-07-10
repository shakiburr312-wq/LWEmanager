// Replacement of /src/components/Sidebar.tsx - Added navigation item for Daily Stats Entry
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  Users, 
  Trophy, 
  DollarSign, 
  AlertTriangle, 
  UserCheck, 
  Settings, 
  LogOut, 
  MessageSquare,
  ShieldAlert,
  BarChart2
} from 'lucide-react';
import toast from 'react-hot-toast';

export const Sidebar: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Signed out successfully');
      navigate('/login');
    } catch (err: any) {
      toast.error('Failed to log out: ' + err.message);
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navItems = [
    {
      name: 'Players List',
      path: '/players',
      icon: Users,
      show: true,
    },
    {
      name: 'Performance & MVP',
      path: '/stats',
      icon: Trophy,
      show: true,
    },
    {
      name: 'Complaints',
      path: '/complaints',
      icon: MessageSquare,
      show: true,
    },
    {
      name: 'Finance & Overview',
      path: '/finance',
      icon: DollarSign,
      show: isAdmin, // Admin only
    },
    {
      name: 'Daily Stats Entry',
      path: '/daily-stats',
      icon: BarChart2,
      show: isAdmin, // Admin only
    },
    {
      name: 'Pending Approvals',
      path: '/approvals',
      icon: UserCheck,
      show: isAdmin, // Admin only
    },
    {
      name: 'MVP Settings',
      path: '/settings',
      icon: Settings,
      show: isAdmin, // Admin only
    }
  ];

  return (
    <aside className="w-64 bg-[#0a0a0f] border-r border-purple-500/20 flex flex-col min-h-screen text-gray-300 flex-shrink-0">
      {/* Brand Header */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(147,51,234,0.5)]">
          <Trophy className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tighter text-white">LWE <span className="text-purple-500">MANAGER</span></h1>
          <span className="text-[9px] font-mono text-purple-400 uppercase tracking-widest block">Command Center</span>
        </div>
      </div>

      {/* Nav Menu Links */}
      <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
        <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest px-4 block mb-3">Navigation Modules</span>
        {navItems.filter(item => item.show).map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs uppercase tracking-widest font-medium transition-all ${
                active
                  ? 'text-purple-400 bg-purple-500/10 border border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.1)]'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? 'text-purple-400' : 'text-gray-400'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Profile and Secure Signout Card */}
      <div className="p-4 mt-auto">
        <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 border border-white/20 flex items-center justify-center text-white text-xs font-bold uppercase">
                {user?.name ? user.name[0] : 'U'}
              </div>
              <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-[#0a0a0f] ${isAdmin ? 'bg-amber-400' : 'bg-purple-500'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white uppercase truncate">{user?.name || 'Loading...'}</p>
              <p className="text-[9px] text-purple-400 font-medium uppercase">{user?.role || 'PLAYER'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] uppercase tracking-widest font-bold rounded-lg transition-colors cursor-pointer"
          >
            Secure Signout
          </button>
        </div>
      </div>
    </aside>
  );
};
