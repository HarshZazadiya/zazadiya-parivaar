import React, { useState } from 'react';
import { Shield, Users, FolderTree, Search, LogIn, LogOut, Menu, X, PlusCircle, LayoutDashboard, MapPin } from 'lucide-react';
import { getAuthToken, getCurrentUser, removeAuthToken } from '../utils/api';

export default function Navbar({ activeTab, setActiveTab, onOpenAuth }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const user = getCurrentUser();
  const token = getAuthToken();

  const handleLogout = () => {
    removeAuthToken();
    setActiveTab('home');
    window.location.reload();
  };

  const navItems = [
    { id: 'home', label: 'Home', icon: Shield },
    { id: 'villages', label: '22 Villages', icon: MapPin },
    { id: 'directory', label: 'Family Directory', icon: Search },
    { id: 'builder', label: 'Add Family Tree', icon: PlusCircle },
  ];

  if (user && user.role === 'admin') {
    navItems.push({ id: 'admin', label: 'Admin Dashboard', icon: LayoutDashboard });
  }

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-saffron-100 shadow-sm">
      {/* Top Divine Mantra Header */}
      <div className="bg-gradient-to-r from-saffron-600 via-saffron-500 to-saffron-700 text-white text-xs py-1.5 px-4 text-center font-medium tracking-wide flex items-center justify-center gap-3">
        <span className="text-yellow-300 font-serif font-bold text-sm">🚩 || શ્રી હનુમાનજી પ્રસન્ન ||</span>
        <span className="hidden sm:inline text-saffron-100">|</span>
        <span className="hidden sm:inline">ઝાઝડીયા પરિવાર - ૨૨ ગામ સંગઠન પોર્ટલ</span>
        <span className="hidden md:inline text-saffron-100">|</span>
        <span className="hidden md:inline text-yellow-200">Jai Shree Ram • Lord Hanumanji Blessings</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo */}
          <div 
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-saffron-600 to-saffron-400 flex items-center justify-center text-white text-2xl shadow-saffron-glow group-hover:scale-105 transition-transform duration-300">
              🚩
            </div>
            <div>
              <h1 className="font-serif text-2xl font-bold text-slate-900 tracking-tight leading-none group-hover:text-saffron-600 transition-colors">
                Zazadiya <span className="text-saffron-600">Parivaar</span>
              </h1>
              <p className="text-xs text-saffron-700 font-medium tracking-wider uppercase mt-1">
                ઝાઝડીયા પરિવાર પોર્ટલ
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-saffron-50/70 p-1.5 rounded-2xl border border-saffron-100/80">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-saffron-500 text-white shadow-md shadow-saffron-500/20'
                      : 'text-slate-700 hover:text-saffron-600 hover:bg-white/80'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User Auth Controls */}
          <div className="hidden md:flex items-center gap-3">
            {token && user ? (
              <div className="flex items-center gap-3 bg-saffron-50 px-3.5 py-1.5 rounded-xl border border-saffron-200">
                <div className="text-right">
                  <p className="text-xs text-slate-500 font-medium">Jai Jinendra / Ram Ram</p>
                  <p className="text-sm font-bold text-slate-900 leading-tight">{user.full_name}</p>
                </div>
                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="p-2 text-slate-500 hover:text-saffron-600 hover:bg-white rounded-lg transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-2 bg-gradient-to-r from-saffron-500 to-saffron-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-saffron-glow hover:brightness-110 active:scale-95 transition-all"
              >
                <LogIn className="w-4 h-4" />
                <span>Member Login</span>
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 hover:text-saffron-600 hover:bg-saffron-50 rounded-xl"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-saffron-100 px-4 pt-2 pb-6 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                  isActive
                    ? 'bg-saffron-500 text-white'
                    : 'text-slate-700 hover:bg-saffron-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="pt-4 border-t border-slate-100">
            {token && user ? (
              <div className="flex items-center justify-between px-4 py-3 bg-saffron-50 rounded-xl">
                <div>
                  <p className="text-xs text-slate-500">Logged in as</p>
                  <p className="text-sm font-bold text-slate-900">{user.full_name}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 text-xs text-red-600 font-bold px-3 py-1.5 bg-white rounded-lg border border-red-200"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  onOpenAuth();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 bg-saffron-500 text-white py-3 rounded-xl font-bold text-sm shadow-md"
              >
                <LogIn className="w-4 h-4" />
                <span>Member Login / Register</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
