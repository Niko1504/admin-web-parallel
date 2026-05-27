import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { LayoutDashboard, ClipboardList, Users, LogOut, Settings, CheckCircle } from 'lucide-react';
import { AnimatedWashioLogo } from './AnimatedWashioLogo';
import { LanguageSelectorCompact } from './LanguageSelector';
import washioTextImg from '/washio-text.png';

export default function Layout() {
  const { username, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: t.dashboard },
    { to: '/orders', icon: ClipboardList, label: t.orders },
    { to: '/completed', icon: CheckCircle, label: t.completedOrders },
    { to: '/couriers', icon: Users, label: t.couriers },
    { to: '/settings', icon: Settings, label: t.settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 fixed h-full">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <AnimatedWashioLogo size={40} />
            <div>
              <img src={washioTextImg} alt="WASHIO" className="h-5" style={{ filter: 'invert(42%) sepia(93%) saturate(1352%) hue-rotate(200deg) brightness(95%) contrast(101%)' }} />
              <p className="text-xs text-gray-500 mt-1">{t.adminPanel}</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Language Selector */}
        <div className="px-4 py-3">
          <LanguageSelectorCompact />
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">{username}</p>
              <p className="text-sm text-gray-500">Admin</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              title={t.logout}
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        <Outlet />
      </main>
    </div>
  );
}
