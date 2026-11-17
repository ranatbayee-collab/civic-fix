import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { api } from '../../api/client';
import {
  ShieldAlert,
  Activity,
  MapPin,
  Box,
  Layers,
  Wrench,
  Sparkles,
  Bell,
  UserCheck,
  ChevronDown,
  CheckCircle,
  Clock,
  AlertTriangle,
  Menu,
  X
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, setCopilotOpen }) {
  const { user, switchDemoRole, isWorker, isAdmin, isCitizen } = useAuth();
  const { notifications, unreadCount, markRead } = useNotifications();
  const [healthScore, setHealthScore] = useState(78);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function loadHealth() {
      try {
        const res = await api.getHealthScore();
        if (res && res.overall) setHealthScore(res.overall);
      } catch (e) {}
    }
    loadHealth();
    const interval = setInterval(loadHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'report', label: 'Report Issue', icon: MapPin, role: 'ALL' },
    { id: 'citizen_dashboard', label: 'My Reports', icon: Layers, role: 'ALL' },
    { id: 'map', label: 'Live Map', icon: MapPin, role: 'ALL' },
    { id: 'city3d', label: '3D City Twin', icon: Box, role: 'ALL', highlight: true },
    { id: 'admin', label: 'Admin Command', icon: ShieldAlert, role: 'ADMIN' },
    { id: 'worker', label: 'Worker Portal', icon: Wrench, role: 'WORKER' },
    { id: 'simulator', label: 'What-If Lab', icon: Sparkles, role: 'ALL' },
  ];

  const visibleNav = navItems.filter((item) => {
    if (item.role === 'ALL') return true;
    if (item.role === 'ADMIN' && (isAdmin || user?.role === 'OFFICER')) return true;
    if (item.role === 'WORKER' && (isWorker || isAdmin)) return true;
    return false;
  });

  return (
    <header className="sticky top-0 z-40 bg-[#0c1222]/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('report')}>
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 shadow-lg shadow-cyan-500/25">
              <Activity className="w-5 h-5 text-white animate-pulse" />
              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-900" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-wider text-white">
                  CIVIC<span className="text-cyan-400">FIX</span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  AI 2.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">AI-Powered Civic Resolution & 3D Twin</p>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-1">
            {visibleNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  } ${item.highlight ? 'relative group' : ''}`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  {item.label}
                  {item.highlight && (
                    <span className="ml-1 px-1 py-0.2 text-[9px] font-bold rounded bg-cyan-400/20 text-cyan-300 border border-cyan-400/40 animate-pulse">
                      3D
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3">
            {/* City Health Score Pill */}
            <div
              onClick={() => setActiveTab('admin')}
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/60 cursor-pointer hover:border-cyan-500/40 transition-colors"
              title="City Infrastructure Health Score"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs text-slate-400">City Health:</span>
              <span className="text-xs font-bold text-emerald-300 font-mono">{healthScore}/100</span>
            </div>

            {/* AI Copilot Quick Button */}
            <button
              onClick={() => setCopilotOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-semibold hover:border-cyan-400 transition-all shadow-sm shadow-cyan-500/10"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" />
              <span className="hidden sm:inline">AI Copilot</span>
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                className="relative p-2 rounded-lg bg-slate-800/60 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Menu */}
              {showNotifMenu && (
                <div className="absolute right-0 mt-2 w-80 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-3 z-50 animate-fadeIn">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Notifications</span>
                    <span className="text-[10px] text-slate-400">{notifications.length} total</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-800/60 mt-1">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-500">No new notifications</div>
                    ) : (
                      notifications.slice(0, 6).map((n) => (
                        <div
                          key={n.id}
                          onClick={() => markRead(n.id)}
                          className={`p-2.5 text-xs cursor-pointer transition-colors hover:bg-slate-800/50 rounded-lg ${
                            n.is_read ? 'opacity-60' : 'bg-cyan-950/20'
                          }`}
                        >
                          <div className="font-semibold text-slate-200">{n.title}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{n.message}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Role Switcher Pill */}
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 hover:border-slate-600 transition-colors text-xs text-slate-200"
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    isAdmin ? 'bg-purple-400' : isWorker ? 'bg-amber-400' : 'bg-cyan-400'
                  }`}
                />
                <span className="font-medium hidden sm:inline max-w-[100px] truncate">
                  {user?.name?.split(' ')[0] || 'User'}
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-700/80 text-slate-300">
                  {user?.role || 'CITIZEN'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Role Dropdown */}
              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-2 z-50 animate-fadeIn">
                  <div className="px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    Switch Active Persona (Demo Mode)
                  </div>
                  <div className="space-y-1 mt-1.5">
                    <button
                      onClick={() => {
                        switchDemoRole('CITIZEN');
                        setShowRoleMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-slate-800 flex items-center justify-between text-slate-200"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-cyan-400" />
                        <div>
                          <div className="font-medium">Aarav Sharma</div>
                          <div className="text-[10px] text-slate-400">Citizen Reporter</div>
                        </div>
                      </div>
                      {isCitizen && <CheckCircle className="w-4 h-4 text-cyan-400" />}
                    </button>

                    <button
                      onClick={() => {
                        switchDemoRole('ADMIN');
                        setShowRoleMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-slate-800 flex items-center justify-between text-slate-200"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-purple-400" />
                        <div>
                          <div className="font-medium">Dr. Sarah Mukherjee</div>
                          <div className="text-[10px] text-slate-400">Municipal Administrator</div>
                        </div>
                      </div>
                      {isAdmin && <CheckCircle className="w-4 h-4 text-purple-400" />}
                    </button>

                    <button
                      onClick={() => {
                        switchDemoRole('WORKER');
                        setShowRoleMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-slate-800 flex items-center justify-between text-slate-200"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-amber-400" />
                        <div>
                          <div className="font-medium">Rajesh Verma</div>
                          <div className="text-[10px] text-slate-400">Road Crew Field Lead</div>
                        </div>
                      </div>
                      {isWorker && <CheckCircle className="w-4 h-4 text-amber-400" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg bg-slate-800 text-slate-300"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-4 space-y-1">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}
