import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Layers, Activity, Clock,
  Cpu, HardDrive, Flag, ShieldAlert, LogOut
} from 'lucide-react';

const adminNav = [
  { name: 'Admin Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Creator Users', path: '/users', icon: Users },
  { name: 'Workspaces', path: '/workspaces', icon: Layers },
  { name: 'Platform Health', path: '/health', icon: Activity },
  { name: 'Job Monitor', path: '/jobs', icon: Clock },
  { name: 'AI Usage & Tokens', path: '/ai-usage', icon: Cpu },
  { name: 'Cloud Storage', path: '/storage', icon: HardDrive },
  { name: 'Feature Flags', path: '/feature-flags', icon: Flag },
  { name: 'Security Audit Log', path: '/audit-logs', icon: ShieldAlert }
];

export default function AdminLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('creatoros_admin_token');
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-[#090D16] text-slate-100 font-sans antialiased">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0F172A] border-r border-slate-800 flex flex-col justify-between fixed inset-y-0 left-0 z-30">
        <div>
          <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white text-base">
              A
            </div>
            <div>
              <div className="font-bold text-white tracking-tight text-sm">
                CREATOR<span className="text-blue-400">OS</span> ADMIN
              </div>
              <p className="text-[10px] text-slate-400 font-mono">SUPER_ADMIN v1.0</p>
            </div>
          </div>

          <nav className="p-4 space-y-1">
            {adminNav.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-xl transition-all ${
                    isActive ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-red-950/40 text-slate-300 hover:text-red-400 text-xs font-bold rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Exit Admin Console</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 pl-64 min-w-0">
        <header className="h-16 border-b border-slate-800 bg-[#0F172A]/70 backdrop-blur sticky top-0 z-20 flex items-center justify-between px-8">
          <span className="text-xs font-mono text-emerald-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Production Engine Status: OPERATIONAL
          </span>
          <span className="text-xs font-medium text-slate-400">admin@creatoros.ai</span>
        </header>

        <main className="p-8 max-w-7xl mx-auto">{children}</main>
      </div>
    </div>
  );
}

