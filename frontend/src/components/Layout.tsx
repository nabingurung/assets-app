import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Package, LayoutDashboard, FolderTree, MapPin, Shield, Menu, X } from 'lucide-react';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { to: '/assets', label: 'Assets', Icon: Package },
  { to: '/categories', label: 'Categories', Icon: FolderTree },
  { to: '/locations', label: 'Locations', Icon: MapPin },
];

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/assets': 'Assets',
  '/categories': 'Categories',
  '/locations': 'Locations',
  '/admin': 'Admin Settings',
};

const Layout: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const matched = Object.keys(pageTitles).find((p) => pathname.startsWith(p));
  const title = matched ? pageTitles[matched] : 'BTS Asset Management';

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center p-2 rounded-lg transition-colors ${
      isActive ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
    }`;

  const sidebar = (
    <>
      <div className="p-6 border-b border-slate-800">
        <div className="text-2xl font-bold">BTS Assets</div>
        <div className="text-xs text-slate-400 mt-1">Baltimore Tamu Samaj</div>
      </div>
      <nav className="flex-1 p-4 space-y-1" onClick={() => setMenuOpen(false)}>
        {navItems.map(({ to, label, Icon }) => (
          <NavLink key={to} to={to} className={linkClass}>
            <Icon className="mr-3 w-5 h-5" />
            {label}
          </NavLink>
        ))}
        {isAdmin && (
          <NavLink to="/admin" className={linkClass}>
            <Shield className="mr-3 w-5 h-5" />
            Admin Settings
          </NavLink>
        )}
      </nav>
      <div className="p-4 border-t border-slate-800">
        <div className="mb-3 px-2 text-sm text-slate-400">
          Signed in as <span className="text-white font-medium">{user?.username}</span>
          {isAdmin && (
            <span className="ml-2 text-[10px] uppercase tracking-wide bg-slate-700 px-1.5 py-0.5 rounded">Admin</span>
          )}
        </div>
        <button
          onClick={logout}
          className="flex items-center w-full p-2 text-left hover:bg-red-900/30 text-red-400 rounded-lg transition-colors"
        >
          <LogOut className="mr-3 w-5 h-5" />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 bg-slate-900 text-white flex-col shrink-0">{sidebar}</aside>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMenuOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-slate-900 text-white flex flex-col shadow-xl">
            <button
              onClick={() => setMenuOpen(false)}
              className="absolute top-4 right-4 p-1 text-slate-300"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white shadow-sm px-4 py-3 flex items-center gap-3 shrink-0">
          <button onClick={() => setMenuOpen(true)} className="md:hidden p-1 text-gray-600" aria-label="Open menu">
            <Menu className="h-6 w-6" />
          </button>
          <h2 className="text-lg md:text-xl font-semibold text-gray-800 truncate">{title}</h2>
        </header>
        <div className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </div>
        <footer className="bg-white border-t border-gray-200 px-4 py-2 text-xs text-gray-500 flex flex-wrap justify-between gap-2 shrink-0">
          <span>BTS Asset Management · Baltimore Tamu Samaj</span>
          <span>Developed by ngurung</span>
        </footer>
      </main>
    </div>
  );
};

export default Layout;
