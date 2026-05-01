
import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Outlet, Navigate, useLocation } from 'react-router-dom';
import { AppProvider, useStore } from './store';
import Sidebar from './components/Sidebar';
import POS from './pages/POS';
import Kitchen from './pages/Kitchen';
import Admin from './pages/Admin';
import Users from './pages/Users';
import History from './pages/History';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Setup from './pages/Setup';
import Inventory from './pages/Inventory'; 
import DailyShift from './pages/DailyShift'; 
import ShiftHistory from './pages/ShiftHistory'; 
import Products from './pages/Products';
import Customers from './pages/Customers';
import { Menu, UtensilsCrossed } from 'lucide-react';

// Main Protected Layout
const Layout = () => {
  const { currentUser, isSidebarCollapsed, toggleMobileMenu, settings, isSystemInitialized } = useStore();
  const location = useLocation();

  // Determine Direction
  const isRTL = settings.language === 'ar';

  // Calculate Margin dynamically based on sidebar state and language
  const contentMarginClass = isRTL 
      ? (isSidebarCollapsed ? 'lg:mr-24' : 'lg:mr-72') // Arabic: Margin Right
      : (isSidebarCollapsed ? 'lg:ml-24' : 'lg:ml-72'); // English: Margin Left

  // 1. If System is NOT initialized, redirect to /setup
  if (!isSystemInitialized) {
      return <Navigate to="/setup" replace />;
  }

  // 2. If System IS initialized but no user logged in, redirect to /login
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="h-screen w-screen bg-slate-100 flex overflow-hidden">
      
      {/* 
          SIDEBAR: Fixed width (or collapsed), handles its own internal scrolling 
          Z-Index ensures it's above content if needed
      */}
      <Sidebar />
      
      {/* 
          MAIN CONTENT WRAPPER:
          1. flex-1: Takes remaining space
          2. flex-col: Stack header and content
          3. min-w-0: Prevents flex child overflow issues
          4. transition-all: Smooth resize when sidebar toggles
          5. Margin applied dynamically based on language direction
      */}
      <div className={`flex-1 flex flex-col h-full min-w-0 transition-all duration-300 ${contentMarginClass} relative`}>
          
          {/* Mobile Header (Visible only on small screens) */}
          <div className="lg:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between shadow-sm shrink-0 z-20">
              <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">
                      <UtensilsCrossed size={16} />
                  </div>
                  <span className="font-bold text-slate-800">نظام المبيعات</span>
              </div>
              <button onClick={toggleMobileMenu} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
                  <Menu size={24} />
              </button>
          </div>

          {/* 
              SCROLLABLE CONTENT AREA:
              1. overflow-y-auto: Enables vertical scrolling for THIS area only
              2. h-full: Fills the remaining height
          */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-100 relative">
             <Outlet />
          </main>
      </div>
    </div>
  );
};

// Setup Route Guard: Only allow access if system is NOT initialized
const SetupRoute = ({ children }: React.PropsWithChildren) => {
    const { isSystemInitialized } = useStore();
    return !isSystemInitialized ? <>{children}</> : <Navigate to="/login" replace />;
};

// Login Route Guard: If logged in, go to home. If not init, go to setup.
const LoginRoute = ({ children }: React.PropsWithChildren) => {
    const { currentUser, isSystemInitialized } = useStore();
    
    if (!isSystemInitialized) return <Navigate to="/setup" replace />;
    if (currentUser) return <Navigate to="/" replace />;
    
    return <>{children}</>;
};

// Admin Guard (Strict)
const AdminRoute = ({ children }: React.PropsWithChildren) => {
    const { currentUser } = useStore();
    return currentUser?.role === 'ADMIN' ? <>{children}</> : <Navigate to="/" replace />;
};

// Cashier & Admin Guard (Flexible)
const CashierRoute = ({ children }: React.PropsWithChildren) => {
    const { currentUser } = useStore();
    const allowed = currentUser?.role === 'ADMIN' || currentUser?.role === 'CASHIER';
    return allowed ? <>{children}</> : <Navigate to="/" replace />;
};

const App = () => {
  return (
    <AppProvider>
      <HashRouter>
        <Routes>
          {/* Setup Route */}
          <Route path="/setup" element={<SetupRoute><Setup /></SetupRoute>} />
          
          {/* Login Route */}
          <Route path="/login" element={<LoginRoute><Login /></LoginRoute>} />

          {/* Protected Routes */}
          <Route path="/" element={<Layout />}>
            {/* Common Routes */}
            <Route index element={<POS />} />
            <Route path="kitchen" element={<Kitchen />} />
            
            {/* Cashier & Admin Routes */}
            <Route path="daily-shift" element={<CashierRoute><DailyShift /></CashierRoute>} />
            <Route path="history" element={<CashierRoute><History /></CashierRoute>} />
            <Route path="customers" element={<CashierRoute><Customers /></CashierRoute>} />
            
            {/* Strictly Admin Routes */}
            <Route path="admin" element={<AdminRoute><Admin /></AdminRoute>} />
            <Route path="users" element={<AdminRoute><Users /></AdminRoute>} />
            <Route path="settings" element={<AdminRoute><Settings /></AdminRoute>} />
            <Route path="inventory" element={<AdminRoute><Inventory /></AdminRoute>} />
            <Route path="shift-history" element={<AdminRoute><ShiftHistory /></AdminRoute>} />
            <Route path="products" element={<AdminRoute><Products /></AdminRoute>} />
          </Route>

          {/* Catch-all 404 Route */}
          <Route path="*" element={
             <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
                 <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 max-w-md w-full">
                     <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                         <Menu size={32} />
                     </div>
                     <h1 className="text-2xl font-black text-slate-900 mb-2">الصفحة غير موجودة</h1>
                     <a href="/" className="block w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all mt-6">
                         العودة للرئيسية
                     </a>
                 </div>
             </div>
          } />
        </Routes>
      </HashRouter>
    </AppProvider>
  );
};

export default App;
