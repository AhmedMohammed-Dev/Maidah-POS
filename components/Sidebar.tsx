
import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, ChefHat, Settings, History, LogOut, Users, ChevronRight, ChevronLeft, X, Package, ClipboardList, BookOpen, LayoutGrid, Contact, Download, RefreshCw, Zap } from 'lucide-react';
import { useStore } from '../store';
import Logo from './Logo';

const Sidebar = () => {
  const { 
    currentUser, 
    logout, 
    isSidebarCollapsed, 
    toggleSidebar, 
    isMobileMenuOpen, 
    closeMobileMenu,
    t,
    settings
  } = useStore();
  const navigate = useNavigate();

  // Determine Direction
  const isRTL = settings.language === 'ar';

  // Update State
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateDownloaded, setUpdateDownloaded] = useState(false);

  useEffect(() => {
    // Listen for Electron update events
    // @ts-ignore
    if (window.require) {
        try {
            // @ts-ignore
            const { ipcRenderer } = window.require('electron');
            
            ipcRenderer.on('update_available', () => {
                setUpdateAvailable(true);
            });

            ipcRenderer.on('update_downloaded', () => {
                setUpdateAvailable(false);
                setUpdateDownloaded(true);
            });

            // Cleanup listeners
            return () => {
                ipcRenderer.removeAllListeners('update_available');
                ipcRenderer.removeAllListeners('update_downloaded');
            };
        } catch (e) {
            console.warn("Not running in Electron or IPC failed");
        }
    }
  }, []);

  const restartApp = () => {
      // @ts-ignore
      if (window.require) {
          // @ts-ignore
          const { ipcRenderer } = window.require('electron');
          ipcRenderer.send('restart_app');
      }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    if (isMobileMenuOpen) closeMobileMenu();
  };

  const navClass = ({ isActive }: { isActive: boolean }) => 
    `flex items-center gap-3 px-3 py-3 my-1 rounded-xl transition-all duration-200 group relative overflow-hidden ${
      isActive 
        ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' 
        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
    }`;

  // Common content for nav items
  const NavItem = ({ to, icon: Icon, label, target }: { to: string, icon: any, label: string, target?: string }) => (
    <NavLink to={to} target={target} className={navClass} onClick={() => isMobileMenuOpen && closeMobileMenu()}>
      <Icon size={22} className={`shrink-0 transition-transform duration-300 ${!isSidebarCollapsed ? '' : 'mx-auto'}`} strokeWidth={2} />
      
      <span className={`font-bold whitespace-nowrap transition-all duration-300 ${
          isSidebarCollapsed && !isMobileMenuOpen ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100 block'
      }`}>
        {label}
      </span>

      {/* Tooltip for collapsed mode */}
      {isSidebarCollapsed && !isMobileMenuOpen && (
          <div className={`absolute top-1/2 -translate-y-1/2 mx-2 px-3 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap shadow-xl ${isRTL ? 'right-full' : 'left-full'}`}>
              {label}
          </div>
      )}
    </NavLink>
  );

  // --- PERMISSION LOGIC ---
  const role = currentUser?.role;
  const isAdmin = role === 'ADMIN';
  const isCashier = role === 'CASHIER' || isAdmin; 
  const isStaff = role === 'WAITER' || isCashier; 

  // --- TRANSLATED ROLE ---
  const getRoleName = () => {
      switch(role) {
          case 'ADMIN': return t('role_admin');
          case 'CASHIER': return t('role_cashier');
          case 'WAITER': return t('role_waiter');
          case 'DRIVER': return t('role_driver');
          default: return '';
      }
  };

  // --- DYNAMIC STYLES ---
  // Position based on language
  const sidebarPositionClass = isRTL ? 'right-0 border-l' : 'left-0 border-r';
  
  // Transform logic for mobile: 
  // RTL: Hidden moves Right (positive X). Visible is 0.
  // LTR: Hidden moves Left (negative X). Visible is 0.
  const hiddenTransform = isRTL ? 'translate-x-full' : '-translate-x-full';
  
  // Toggle Button Position
  const toggleBtnPos = isRTL ? '-left-3' : '-right-3';

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div 
            className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
            onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed top-0 h-screen bg-white border-slate-200 z-50 transition-all duration-300 ease-in-out flex flex-col shadow-2xl lg:shadow-none
            ${sidebarPositionClass}
            ${isMobileMenuOpen ? 'translate-x-0 w-72' : `${hiddenTransform} lg:translate-x-0`}
            ${isSidebarCollapsed ? 'lg:w-24' : 'lg:w-72'}
        `}
      >
        {/* Header */}
        <div className={`h-24 flex items-center px-6 border-b border-slate-100 relative shrink-0 ${isSidebarCollapsed && !isMobileMenuOpen ? 'justify-center' : 'justify-between'}`}>
            <div className="flex items-center gap-3 overflow-hidden">
                <div className="shrink-0">
                    <Logo size={isSidebarCollapsed && !isMobileMenuOpen ? 40 : 42} />
                </div>
                
                <div className={`transition-all duration-300 ${isSidebarCollapsed && !isMobileMenuOpen ? 'hidden' : 'block'}`}>
                    <h1 className="font-black text-xl text-slate-900 leading-tight whitespace-nowrap">{t('systemTitle')}</h1>
                    <p className="text-[10px] text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded-full mt-1 w-fit">
                        {getRoleName()}
                    </p>
                </div>
            </div>

            <button onClick={closeMobileMenu} className="lg:hidden text-slate-400 hover:text-red-500 bg-slate-50 hover:bg-red-50 p-2 rounded-xl transition-colors">
                <X size={20} />
            </button>
        </div>

        {/* Toggle Button (Desktop Only) */}
        <button 
            onClick={toggleSidebar}
            className={`hidden lg:flex absolute top-28 bg-white border border-slate-200 rounded-full p-1.5 text-slate-500 hover:text-slate-900 shadow-md z-50 transition-transform hover:scale-110 ${toggleBtnPos}`}
        >
            {isSidebarCollapsed ? (isRTL ? <ChevronLeft size={16} /> : <ChevronRight size={16} />) : (isRTL ? <ChevronRight size={16} /> : <ChevronLeft size={16} />)}
        </button>

        {/* UPDATE NOTIFICATIONS */}
        <div className="px-3 pt-2">
            {updateAvailable && !isSidebarCollapsed && (
                <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl flex items-center gap-3 mb-2 animate-in fade-in slide-in-from-right">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                        <Download size={16} className="text-blue-600 animate-bounce" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-blue-800">جاري تحميل تحديث...</p>
                        <p className="text-[10px] text-blue-600">سيتم التثبيت تلقائياً</p>
                    </div>
                </div>
            )}
            
            {updateDownloaded && (
                <div className="bg-green-50 border border-green-100 p-3 rounded-xl mb-2 animate-in fade-in slide-in-from-right">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                            <RefreshCw size={16} className="text-green-600" />
                        </div>
                        {!isSidebarCollapsed && (
                            <div>
                                <p className="text-xs font-bold text-green-800">التحديث جاهز!</p>
                                <p className="text-[10px] text-green-600">اضغط لإعادة التشغيل</p>
                            </div>
                        )}
                    </div>
                    <button 
                        onClick={restartApp}
                        className="w-full bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2 rounded-lg transition-colors shadow-sm"
                    >
                        {isSidebarCollapsed ? <RefreshCw size={14} className="mx-auto" /> : 'تحديث الآن'}
                    </button>
                </div>
            )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar overflow-x-hidden">
            
            {/* Section 1: Operations */}
            <NavItem to="/" icon={ShoppingCart} label={t('pos')} />
            <NavItem to="/kitchen" icon={ChefHat} label={t('kitchen')} />
            
            {/* Section 2: Management */}
            {isCashier && (
                <>
                    <div className={`px-4 mt-6 mb-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-t border-slate-100 pt-4 ${isSidebarCollapsed ? 'hidden' : 'block'}`}>
                        ----
                    </div>
                    <NavItem to="/daily-shift" icon={ClipboardList} label={t('dailyShift')} />
                    <NavItem to="/history" icon={History} label={t('history')} />
                    <NavItem to="/customers" icon={Contact} label={t('customers')} />
                </>
            )}

            {/* Section 3: Inventory & Menu */}
            {isAdmin && (
                <>
                    <div className={`px-4 mt-6 mb-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-t border-slate-100 pt-4 ${isSidebarCollapsed ? 'hidden' : 'block'}`}>
                        ----
                    </div>
                    <NavItem to="/products" icon={LayoutGrid} label={t('products')} />
                    <NavItem to="/inventory" icon={Package} label={t('inventory')} />
                </>
            )}

            {/* Section 4: Analytics & System */}
            {isAdmin && (
            <>
                <div className={`px-4 mt-6 mb-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-t border-slate-100 pt-4 ${isSidebarCollapsed ? 'hidden' : 'block'}`}>
                    ----
                </div>
                <NavItem to="/admin" icon={LayoutDashboard} label={t('reports')} />
                <NavItem to="/shift-history" icon={BookOpen} label={t('shiftHistory')} />
                <NavItem to="/users" icon={Users} label={t('users')} />
            </>
            )}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
            {isAdmin && (
                <NavItem to="/settings" icon={Settings} label={t('settings')} />
            )}
            
            <button 
                onClick={handleLogout}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 text-red-500 hover:bg-red-50 hover:text-red-600 group relative mt-1 ${isSidebarCollapsed && !isMobileMenuOpen ? 'justify-center' : ''}`}
            >
                <LogOut size={22} className={`shrink-0 ${isSidebarCollapsed ? '' : ''}`} />
                <span className={`font-bold whitespace-nowrap ${isSidebarCollapsed && !isMobileMenuOpen ? 'hidden' : 'block'}`}>
                    {t('logout')}
                </span>
                
                {isSidebarCollapsed && !isMobileMenuOpen && (
                    <div className={`absolute top-1/2 -translate-y-1/2 mx-2 px-3 py-2 bg-red-600 text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap shadow-xl ${isRTL ? 'right-full' : 'left-full'}`}>
                        {t('logout')}
                    </div>
                )}
            </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
