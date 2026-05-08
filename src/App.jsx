// App.jsx (updated with Sidebar component)
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, Outlet, useLocation } from 'react-router-dom';
import { Provider, useDispatch, useSelector } from 'react-redux';
import {
  LayoutDashboard, Package, Users as UsersIcon, ShoppingCart, FileText, Satellite, Settings, LogOut, UserCog,
  Receipt
} from 'lucide-react';

// Import store
import { store, fetchMe, logout as logoutAction, clearAuthError } from './Store/store';

// Import pages
import Login from './Login';
import Dashboard from './Dashboard';
import Products from './Products';
import Clients from './Clients';
import Sales from './Sales';
import Invoices from './Invoices';
import Activation from './Activation';
import SettingsPage from './Settings';
import Users from './Users';
import Check from './Check';
import NotFound from './NotFound';
import Profile from './Profile';

// Import Sidebar component
import Sidebar from './Sidebar';

// =============================================================================
// TOAST SYSTEM
// =============================================================================
const Toaster = () => {
  React.useEffect(() => {
    window.toast = (message, variant = 'default') => {
      const container = document.getElementById('toaster-container');
      if (!container) return;
      const colors = {
        default: 'bg-gray-900 text-white',
        success: 'bg-green-600 text-white',
        error: 'bg-red-600 text-white',
        warning: 'bg-yellow-500 text-black',
      };
      const el = document.createElement('div');
      el.className = `${colors[variant] || colors.default} px-4 py-3 rounded-lg shadow-lg text-sm mb-2 transition-all`;
      el.textContent = message;
      container.appendChild(el);
      setTimeout(() => {
        el.classList.add('opacity-0', 'transition-opacity', 'duration-300');
        setTimeout(() => el.remove(), 300);
      }, 3000);
    };
  }, []);
  return <div id="toaster-container" className="fixed bottom-4 right-4 z-[100] flex flex-col items-end" />;
};

const Sonner = () => {
  React.useEffect(() => {
    window.sonner = (message, variant = 'default') => {
      const container = document.getElementById('sonner-container');
      if (!container) return;
      const colors = {
        default: 'bg-gray-900 text-white',
        success: 'bg-green-600 text-white',
        error: 'bg-red-600 text-white',
      };
      const el = document.createElement('div');
      el.className = `${colors[variant] || colors.default} px-4 py-2 rounded-lg shadow-lg text-sm mb-2 transition-all`;
      el.textContent = message;
      container.appendChild(el);
      setTimeout(() => {
        el.classList.add('opacity-0', 'transition-opacity', 'duration-300');
        setTimeout(() => el.remove(), 300);
      }, 3000);
    };
  }, []);
  return <div id="sonner-container" className="fixed top-4 right-4 z-[100] flex flex-col items-end" />;
};

const TooltipProvider = ({ children }) => <>{children}</>;

// =============================================================================
// AUTH GUARD COMPONENT (using Redux)
// =============================================================================
const AuthGuard = ({ children }) => {
  const { isAuthenticated, loading } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    // Check if we have a token but no user loaded yet
    const token = localStorage.getItem('token');
    if (token && !isAuthenticated && !loading) {
      dispatch(fetchMe());
    }
  }, [dispatch, isAuthenticated, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// =============================================================================
// APP LAYOUT
// =============================================================================
const AppLayout = () => {
  const { user } = useSelector((state) => state.auth);

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen flex w-full bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6 md:p-8 max-w-[1600px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

// =============================================================================
// APP COMPONENT WITH REDUX PROVIDER
// =============================================================================
const App = () => (
  <Provider store={store}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Login />} />
          <Route element={
            <AuthGuard>
              <AppLayout />
            </AuthGuard>
          }>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/produits" element={<Products />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/ventes" element={<Sales />} />
            <Route path="/factures" element={<Invoices />} />
            <Route path="/remises" element={<Check />} />
            <Route path="/activation" element={<Activation />} />
            <Route path="/utilisateurs" element={<Users />} />
            <Route path="/parametres" element={<SettingsPage />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </Provider>
);

export default App;