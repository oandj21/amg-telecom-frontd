// Sidebar.jsx - Fully Responsive with Bright Alert Colors
import React, { useState, useEffect } from 'react';
import { NavLink as RouterNavLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Users as UsersIcon,
  ShoppingCart,
  Receipt,
  Satellite,
  UserCog,
  Settings,
  LogOut,
  Menu,
  X,
  AlertCircle,
  Bell,
  User
} from 'lucide-react';
import { logout as logoutAction, fetchChecks, fetchActivations } from './Store/store';

// =============================================================================
// HELPER FUNCTIONS FOR DATE CHECKING
// =============================================================================
const isDateApproachingWithin7Days = (dateString) => {
  if (!dateString) return false;
  const targetDate = new Date(dateString);
  const today = new Date();
  
  today.setHours(0, 0, 0, 0);
  targetDate.setHours(0, 0, 0, 0);
  
  const diffTime = targetDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays > 0 && diffDays <= 7;
};

const getDaysUntilDate = (dateString) => {
  if (!dateString) return null;
  const targetDate = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  targetDate.setHours(0, 0, 0, 0);
  
  const diffTime = targetDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// =============================================================================
// NAVLINK COMPONENT
// =============================================================================
const NavLink = React.forwardRef(({ className, activeClassName, to, children, onClick, ...props }, ref) => {
  return (
    <RouterNavLink
      ref={ref}
      to={to}
      onClick={onClick}
      className={({ isActive }) => {
        let finalClass = 'sidebar-nav-link';
        if (className) finalClass += ` ${className}`;
        if (isActive && activeClassName) finalClass += ` ${activeClassName}`;
        if (isActive) finalClass += ' active';
        return finalClass;
      }}
      {...props}
    >
      {children}
    </RouterNavLink>
  );
});
NavLink.displayName = 'NavLink';

// =============================================================================
// SIDEBAR COMPONENT
// =============================================================================
const Sidebar = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const { list: checks, loading } = useSelector((state) => state.checks);
  const { list: activations } = useSelector((state) => state.activations || { list: [] });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Remises alert states
  const [approachingCount, setApproachingCount] = useState(0);
  const [urgentCount, setUrgentCount] = useState(0);
  const [veryUrgentCount, setVeryUrgentCount] = useState(0);
  
  // Activations alert states (expiring within 7 days)
  const [expiringActivationsCount, setExpiringActivationsCount] = useState(0);
  const [urgentActivationsCount, setUrgentActivationsCount] = useState(0);
  const [veryUrgentActivationsCount, setVeryUrgentActivationsCount] = useState(0);

  // Fetch checks periodically to update the alert count
  useEffect(() => {
    // Initial fetch
    dispatch(fetchChecks({ page: 1, per_page: 100 }));
    dispatch(fetchActivations({ page: 1, per_page: 100 }));
    
    // Set up interval to refresh every 5 minutes
    const interval = setInterval(() => {
      dispatch(fetchChecks({ page: 1, per_page: 100 }));
      dispatch(fetchActivations({ page: 1, per_page: 100 }));
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [dispatch]);

  // Calculate approaching dates count when checks change
  useEffect(() => {
    if (checks && checks.length > 0) {
      const approaching = checks.filter(check => 
        isDateApproachingWithin7Days(check.date_et_heure)
      );
      setApproachingCount(approaching.length);
      
      const urgent = approaching.filter(check => {
        const days = getDaysUntilDate(check.date_et_heure);
        return days <= 3 && days > 1;
      });
      setUrgentCount(urgent.length);
      
      const veryUrgent = approaching.filter(check => {
        const days = getDaysUntilDate(check.date_et_heure);
        return days === 1;
      });
      setVeryUrgentCount(veryUrgent.length);
    } else {
      setApproachingCount(0);
      setUrgentCount(0);
      setVeryUrgentCount(0);
    }
  }, [checks]);

  // Calculate expiring activations (within 7 days)
  useEffect(() => {
    if (activations && activations.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const expiring = activations.filter(act => {
        if (!act.expires_at) return false;
        if (act.status === 'expired' || act.status === 'suspended') return false;
        
        const expiryDate = new Date(act.expires_at);
        expiryDate.setHours(0, 0, 0, 0);
        const daysRemaining = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
        
        return daysRemaining > 0 && daysRemaining <= 7;
      });
      
      setExpiringActivationsCount(expiring.length);
      
      const urgent = expiring.filter(act => {
        const expiryDate = new Date(act.expires_at);
        expiryDate.setHours(0, 0, 0, 0);
        const daysRemaining = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
        return daysRemaining <= 3 && daysRemaining > 1;
      });
      setUrgentActivationsCount(urgent.length);
      
      const veryUrgent = expiring.filter(act => {
        const expiryDate = new Date(act.expires_at);
        expiryDate.setHours(0, 0, 0, 0);
        const daysRemaining = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
        return daysRemaining === 1;
      });
      setVeryUrgentActivationsCount(veryUrgent.length);
    } else {
      setExpiringActivationsCount(0);
      setUrgentActivationsCount(0);
      setVeryUrgentActivationsCount(0);
    }
  }, [activations]);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const handleLogout = async () => {
    await dispatch(logoutAction());
    setIsMobileMenuOpen(false);
    if (window.toast) {
      window.toast('Déconnexion réussie', 'success');
    }
  };

  if (!user) return null;

  const items = [
    { to: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { to: '/produits', label: 'Produits', icon: Package },
    { to: '/clients', label: 'Clients', icon: UsersIcon },
    { to: '/ventes', label: 'Ventes', icon: ShoppingCart },
    { to: '/remises', label: 'Remises', icon: Receipt, alert: approachingCount > 0 },
    { to: '/activation', label: 'Activation GPS', icon: Satellite, alert: expiringActivationsCount > 0 },
    { to: '/utilisateurs', label: 'Utilisateurs', icon: UserCog, adminOnly: true },
    { to: '/parametres', label: 'Paramètres', icon: Settings, adminOnly: true },
    { to: '/profile', label: 'Mon Profil', icon: User }, 
  ];

  const visible = items.filter(i => !i.adminOnly || user?.role === 'admin' || user?.role === 'superadmin');

  // Get alert severity and appropriate color for Remises
  const getAlertColor = () => {
    if (veryUrgentCount > 0) return 'critical';
    if (urgentCount > 0) return 'danger';
    if (approachingCount > 0) return 'warning';
    return null;
  };

  // Get alert severity for Activations
  const getActivationAlertColor = () => {
    if (veryUrgentActivationsCount > 0) return 'critical';
    if (urgentActivationsCount > 0) return 'danger';
    if (expiringActivationsCount > 0) return 'warning';
    return null;
  };

  // Get badge text for Remises
  const getBadgeText = () => {
    if (veryUrgentCount > 0) return veryUrgentCount;
    if (urgentCount > 0) return urgentCount;
    return approachingCount;
  };

  // Get badge text for Activations
  const getActivationBadgeText = () => {
    if (veryUrgentActivationsCount > 0) return veryUrgentActivationsCount;
    if (urgentActivationsCount > 0) return urgentActivationsCount;
    return expiringActivationsCount;
  };

  const alertColor = getAlertColor();
  const activationAlertColor = getActivationAlertColor();
  const totalExpiring = expiringActivationsCount;

  // Get activation alert banner text
  const getActivationAlertText = () => {
    if (veryUrgentActivationsCount > 0) {
      return `🔴 ${veryUrgentActivationsCount} activation${veryUrgentActivationsCount > 1 ? 's' : ''} expire${veryUrgentActivationsCount > 1 ? 'nt' : ''} DEMAIN!`;
    }
    if (urgentActivationsCount > 0) {
      return `⚠️ ${urgentActivationsCount} activation${urgentActivationsCount > 1 ? 's' : ''} expire${urgentActivationsCount > 1 ? 'nt' : ''} dans ≤3 jours`;
    }
    if (expiringActivationsCount > 0) {
      return `📅 ${expiringActivationsCount} activation${expiringActivationsCount > 1 ? 's' : ''} expire${expiringActivationsCount > 1 ? 'nt' : ''} dans les 7 jours`;
    }
    return '';
  };

  // Sidebar content component (reused for both desktop and mobile)
  const SidebarContent = ({ onItemClick }) => (
    <>
      <div className="sidebar-logo-section">
        <div className="sidebar-logo-icon">
          <img src="/logo.png" alt="Logo" className="sidebar-logo-img" />
        </div>
        <div>
          <div className="sidebar-logo-title">AMG TELECOM</div>
          <div className="sidebar-logo-subtitle">Admin Console</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {visible.map((item) => {
          const isActive = location.pathname === item.to;
          const showRemiseAlert = item.to === '/remises' && approachingCount > 0;
          const showActivationAlert = item.to === '/activation' && expiringActivationsCount > 0;
          
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onItemClick}
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
            >
              <item.icon className="sidebar-nav-icon" />
              <span style={{ flex: 1 }}>{item.label}</span>
              {showRemiseAlert && (
                <div className={`sidebar-alert-badge alert-${alertColor}`}>
                  <Bell size={12} className="alert-icon" />
                  {getBadgeText()}
                </div>
              )}
              {showActivationAlert && (
                <div className={`sidebar-alert-badge alert-${activationAlertColor}`}>
                  <Bell size={12} className="alert-icon" />
                  {getActivationBadgeText()}
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Alert Banner for Remises Approaching Dates */}
      {approachingCount > 0 && (
        <div className={`sidebar-alert-banner banner-${alertColor}`}>
          <AlertCircle size={18} />
          <div className="sidebar-alert-text">
            {veryUrgentCount > 0 && (
              <span className="very-urgent-text">
                🔴 {veryUrgentCount} remise{veryUrgentCount > 1 ? 's' : ''} À DEMAIN!
              </span>
            )}
            {urgentCount > 0 && veryUrgentCount === 0 && (
              <span className="urgent-text">
                ⚠️ {urgentCount} remise{urgentCount > 1 ? 's' : ''} dans ≤3 jours
              </span>
            )}
            {approachingCount > 0 && urgentCount === 0 && veryUrgentCount === 0 && (
              <span className="warning-text">
                📅 {approachingCount} remise{approachingCount > 1 ? 's' : ''} dans les 7 jours
              </span>
            )}
          </div>
        </div>
      )}

      {/* Alert Banner for Activations Expiring Soon */}
      {expiringActivationsCount > 0 && (
        <div className={`sidebar-alert-banner banner-${activationAlertColor}`}>
          <AlertCircle size={18} />
          <div className="sidebar-alert-text">
            {veryUrgentActivationsCount > 0 && (
              <span className="very-urgent-text">
                🔴 {veryUrgentActivationsCount} activation{veryUrgentActivationsCount > 1 ? 's' : ''} À DEMAIN!
              </span>
            )}
            {urgentActivationsCount > 0 && veryUrgentActivationsCount === 0 && (
              <span className="urgent-text">
                ⚠️ {urgentActivationsCount} activation{urgentActivationsCount > 1 ? 's' : ''} expire{urgentActivationsCount > 1 ? 'nt' : ''} dans ≤3 jours
              </span>
            )}
            {expiringActivationsCount > 0 && urgentActivationsCount === 0 && veryUrgentActivationsCount === 0 && (
              <span className="warning-text">
                📅 {expiringActivationsCount} activation{expiringActivationsCount > 1 ? 's' : ''} expire{expiringActivationsCount > 1 ? 'nt' : ''} dans les 7 jours
              </span>
            )}
          </div>
        </div>
      )}

      <div className="sidebar-user-section">
        <div className="sidebar-user-info">
          <div className="sidebar-user-name">{user?.name || 'Utilisateur'}</div>
          <div className="sidebar-user-role">{user?.role || 'Rôle'}</div>
          <div className="sidebar-user-email">{user?.email || 'email@exemple.com'}</div>
        </div>
        <button
          onClick={handleLogout}
          className="sidebar-logout-btn"
        >
          <LogOut className="sidebar-logout-icon" />
          Déconnexion
        </button>
      </div>
    </>
  );

  return (
    <>
      <style>
        {`
          /* ==================== DESKTOP STYLES ==================== */
/* Sidebar.jsx - Updated Styles */
.sidebar-custom {
  display: none;
  width: 16rem;
  flex-shrink: 0;
  flex-direction: column;
  /* Updated: Using the same gradient as .welcome-banner */
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  color: #cbd5e1;
  /* Removed border-right, added margin and border-radius for spacing */
  margin: 12px 0 12px 12px;
  border-radius: 30px;
  height: calc(100vh - 24px);
  position: sticky;
  top: 12px;
  /* Added subtle shadow for depth */
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  overflow: hidden; /* Ensures border-radius clips content */
}

/* Logo image styles */
.sidebar-logo-img {
  height: 36px;
  width: 36px;
  border-radius:8px;
  object-fit: contain;
}

/* Mobile Sidebar Panel - Updated for consistency */
.mobile-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 85%;
  max-width: 320px;
  /* Updated gradient to match welcome banner */
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  color: #cbd5e1;
  z-index: 1001;
  display: flex;
  flex-direction: column;
  transform: translateX(-100%);
  transition: transform 0.3s ease;
  box-shadow: 2px 0 20px rgba(0, 0, 0, 0.3);
  overflow-y: auto;
  /* Added border radius on top and bottom for mobile */
  border-radius: 0 24px 24px 0;
}

/* Adjust scrollbar for the new rounded corners */
.mobile-sidebar::-webkit-scrollbar {
  width: 4px;
}

/* Optional: Adjust the main content area to align with the spaced sidebar */
@media (min-width: 768px) {
  /* Target the main content wrapper to sit next to the spaced sidebar */
  .flex-1 {
    margin: 12px 12px 12px 0;
  }
  
  /* Ensure the main content area has appropriate border radius */
  .flex-1 > div:first-child {
    border-radius: 24px;
    overflow: auto;
    height: calc(100vh - 24px);
  }
}

/* Ensure the welcome banner styles are applied to the sidebar structure */
/* The gradient is already applied to sidebar-custom */

          @media (min-width: 768px) {
            .sidebar-custom {
              display: flex;
            }
          }

          /* ==================== ALERT BADGE ON NAV ITEM - BRIGHT COLORS ==================== */
          .sidebar-alert-badge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.25rem;
            min-width: 2rem;
            height: 1.75rem;
            padding: 0 0.5rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 800;
            letter-spacing: 0.5px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            transition: all 0.3s ease;
          }

          .sidebar-alert-badge .alert-icon {
            animation: bellRing 1s ease-in-out infinite;
          }

          @keyframes bellRing {
            0%, 100% { transform: rotate(0deg); }
            25% { transform: rotate(15deg); }
            75% { transform: rotate(-15deg); }
          }

          /* Warning Level - Orange/Yellow (4-7 days) */
          .sidebar-alert-badge.alert-warning {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            color: #ffffff;
            border: 1px solid #fbbf24;
            animation: pulseWarning 2s infinite;
          }

          @keyframes pulseWarning {
            0%, 100% {
              box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7);
            }
            50% {
              box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.4);
            }
          }

          /* Danger Level - Bright Red (2-3 days) */
          .sidebar-alert-badge.alert-danger {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            color: #ffffff;
            border: 1px solid #fca5a5;
            animation: pulseDanger 1.5s infinite;
          }

          @keyframes pulseDanger {
            0%, 100% {
              box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
              transform: scale(1);
            }
            50% {
              box-shadow: 0 0 0 6px rgba(239, 68, 68, 0.4);
              transform: scale(1.05);
            }
          }

          /* Critical Level - Dark Red/Purple with Blinking (1 day or less) */
          .sidebar-alert-badge.alert-critical {
            background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
            color: #ffffff;
            border: 1px solid #fecaca;
            animation: blinkCritical 0.8s ease-in-out infinite;
            font-weight: 900;
            text-transform: uppercase;
          }

          @keyframes blinkCritical {
            0%, 100% {
              background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
              box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.8);
              transform: scale(1);
            }
            50% {
              background: linear-gradient(135deg, #ff4444 0%, #cc0000 100%);
              box-shadow: 0 0 0 8px rgba(220, 38, 38, 0);
              transform: scale(1.1);
            }
          }

          /* ==================== ALERT BANNER - BRIGHT COLORS ==================== */
          .sidebar-alert-banner {
            margin: 0.75rem;
            padding: 0.75rem 0.875rem;
            border-radius: 0.75rem;
            display: flex;
            align-items: center;
            gap: 0.625rem;
            cursor: pointer;
            transition: all 0.3s ease;
            animation: slideIn 0.5s ease;
            font-weight: 700;
          }

          .sidebar-alert-banner.banner-warning {
            background: linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%);
            border-left: 4px solid #f59e0b;
            box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
          }

          .sidebar-alert-banner.banner-danger {
            background: linear-gradient(135deg, #fee2e2 0%, #fef2f2 100%);
            border-left: 4px solid #ef4444;
            box-shadow: 0 2px 12px rgba(239, 68, 68, 0.4);
            animation: shakeWarning 0.5s ease-in-out;
          }

          .sidebar-alert-banner.banner-critical {
            background: linear-gradient(135deg, #fecaca 0%, #fee2e2 100%);
            border-left: 4px solid #dc2626;
            box-shadow: 0 2px 16px rgba(220, 38, 38, 0.5);
            animation: blinkBanner 1s ease-in-out infinite, shakeWarning 0.5s ease-in-out;
          }

          @keyframes blinkBanner {
            0%, 100% {
              background: linear-gradient(135deg, #fecaca 0%, #fee2e2 100%);
            }
            50% {
              background: linear-gradient(135deg, #fca5a5 0%, #fee2e2 100%);
            }
          }

          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateX(-20px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          @keyframes shakeWarning {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-4px); }
            75% { transform: translateX(4px); }
          }

          .sidebar-alert-banner:hover {
            transform: translateX(4px);
            filter: brightness(1.02);
          }

          .sidebar-alert-banner svg {
            flex-shrink: 0;
          }

          .banner-warning svg {
            color: #d97706;
          }

          .banner-danger svg {
            color: #dc2626;
            animation: bounce 0.5s ease infinite;
          }

          .banner-critical svg {
            color: #991b1b;
            animation: bounce 0.3s ease infinite;
          }

          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-3px); }
          }

          .sidebar-alert-text {
            font-size: 0.75rem;
            font-weight: 700;
            line-height: 1.3;
            flex: 1;
          }

          .very-urgent-text {
            color: #991b1b;
            font-size: 0.8rem;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .urgent-text {
            color: #dc2626;
            font-weight: 700;
          }

          .warning-text {
            color: #b45309;
            font-weight: 600;
          }

          /* ==================== MOBILE MENU BUTTON WITH ALERT ==================== */
          .mobile-menu-btn {
            position: absolute;
            top: 1rem;
            left: 1rem;
            z-index: 1001;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            border: none;
            border-radius: 2rem;
            color: white;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            transition: all 0.3s ease;
            font-weight: 600;
            font-size: 0.875rem;
          }

          .mobile-menu-btn .menu-badge {
            border-radius: 9999px;
            padding: 0.125rem 0.5rem;
            font-size: 0.75rem;
            font-weight: 800;
            animation: pulseDanger 1s infinite;
          }

          .mobile-menu-btn .menu-badge-warning {
            background: #f59e0b;
            color: white;
          }

          .mobile-menu-btn .menu-badge-danger {
            background: #ef4444;
            color: white;
            animation: pulseDanger 1s infinite;
          }

          .mobile-menu-btn .menu-badge-critical {
            background: #dc2626;
            color: white;
            animation: blinkCritical 0.8s ease-in-out infinite;
          }

          .mobile-menu-btn:hover {
            background: linear-gradient(135deg, #2563eb, #1e40af);
            transform: scale(1.02);
          }

          @media (min-width: 768px) {
            .mobile-menu-btn {
              display: none;
            }
          }

          /* ==================== MOBILE OVERLAY ==================== */
          .mobile-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(4px);
            z-index: 1000;
            animation: fadeIn 0.3s ease;
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          /* ==================== MOBILE SIDEBAR PANEL ==================== */
          .mobile-sidebar {
            position: fixed;
            top: 0;
            left: 0;
            bottom: 0;
            width: 85%;
            max-width: 320px;
            background: linear-gradient(to bottom right, #1e293b, #0f172a);
            color: #cbd5e1;
            z-index: 1001;
            display: flex;
            flex-direction: column;
            transform: translateX(-100%);
            transition: transform 0.3s ease;
            box-shadow: 2px 0 20px rgba(0, 0, 0, 0.3);
            overflow-y: auto;
          }

          .mobile-sidebar.open {
            transform: translateX(0);
          }

          .mobile-sidebar-header {
            padding: 0;
            border-bottom: 1px solid #334155;
          }

          .mobile-sidebar .sidebar-logo-section {
            position: relative;
            padding: 1.25rem 3rem 1.25rem 1.5rem;
          }

          .mobile-close-btn {
            position: absolute;
            right: 1rem;
            top: 50%;
            transform: translateY(-50%);
            background: rgba(255, 255, 255, 0.1);
            border: none;
            border-radius: 0.5rem;
            padding: 0.5rem;
            cursor: pointer;
            color: #cbd5e1;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .mobile-close-btn:hover {
            background: rgba(255, 255, 255, 0.2);
            color: white;
          }

          .mobile-sidebar::-webkit-scrollbar {
            width: 4px;
          }

          .mobile-sidebar::-webkit-scrollbar-track {
            background: #1e293b;
          }

          .mobile-sidebar::-webkit-scrollbar-thumb {
            background: #475569;
            border-radius: 4px;
          }

          /* ==================== CONTENT PADDING FOR MOBILE ==================== */
          @media (max-width: 767px) {
            main .p-6.md\\:p-8 {
              padding-top: 5rem !important;
            }
            .flex-1.overflow-auto > div {
              padding-top: 5rem !important;
            }
          }

          /* ==================== COMMON SIDEBAR STYLES ==================== */
          .sidebar-logo-section {
            padding: 1.25rem 1.5rem;
            border-bottom: 1px solid #334155;
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }

          .sidebar-logo-icon {
            height: 2.25rem;
            width: 2.25rem;
            border-radius: 0.5rem;
            background: linear-gradient(to right, #3b82f6, #1d4ed8);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          }

          .sidebar-logo-svg {
            height: 1.25rem;
            width: 1.25rem;
            color: white;
          }

          .sidebar-logo-title {
            color: white;
            font-weight: bold;
            line-height: 1.25;
          }

          .sidebar-logo-subtitle {
            font-size: 0.75rem;
            color: #94a3b8;
          }

          .sidebar-nav {
            flex: 1;
            padding: 1rem 0.75rem;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
          }

          .sidebar-nav-item {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.625rem 0.75rem;
            border-radius: 0.875rem;
            font-size: 0.875rem;
            font-weight: 500;
            transition: all 0.2s;
            color: #cbd5e1;
            text-decoration: none;
            cursor: pointer;
          }

          .sidebar-nav-item:hover {
            background-color: rgba(255, 255, 255, 0.1);
            color: white;
          }

          .sidebar-nav-item.active {
            background-color: rgba(59, 130, 246, 0.2);
            color: white;
          }

          .sidebar-nav-icon {
            height: 1rem;
            width: 1rem;
            flex-shrink: 0;
          }

          .sidebar-user-section {
            padding: 0.75rem;
          }

          .sidebar-user-info {
            padding: 0.5rem 0.75rem;
            margin-bottom: 0.75rem;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 0.5rem;
          }

          .sidebar-user-name {
            font-size: 0.875rem;
            color: white;
            font-weight: 600;
          }

          .sidebar-user-role {
            font-size: 0.75rem;
            color: #94a3b8;
            text-transform: capitalize;
            margin-top: 0.125rem;
          }

          .sidebar-user-email {
            font-size: 0.7rem;
            color: #64748b;
            margin-top: 0.25rem;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .sidebar-logout-btn {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
            padding: 0.625rem 0.75rem;
            border-radius: 0.875rem;
            font-size: 0.875rem;
            font-weight: 500;
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
            border: none;
            color: white;
            cursor: pointer;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          }

          .sidebar-logout-btn::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
            transition: left 0.5s;
          }

          .sidebar-logout-btn:hover {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);
          }

          .sidebar-logout-btn:hover::before {
            left: 100%;
          }

          .sidebar-logout-btn:active {
            transform: translateY(0);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          }

          .sidebar-logout-icon {
            height: 1rem;
            width: 1rem;
            flex-shrink: 0;
            transition: transform 0.3s ease;
          }

          .sidebar-logout-btn:hover .sidebar-logout-icon {
            transform: translateX(3px);
          }

          .sidebar-nav::-webkit-scrollbar {
            width: 6px;
          }

          .sidebar-nav::-webkit-scrollbar-track {
            background: #1e293b;
            border-radius: 3px;
          }

          .sidebar-nav::-webkit-scrollbar-thumb {
            background: #475569;
            border-radius: 3px;
          }

          .sidebar-nav::-webkit-scrollbar-thumb:hover {
            background: #64748b;
          }

          body.mobile-menu-open {
            overflow: hidden;
          }
        `}
      </style>

      {/* Mobile Menu Button with Alert Badge */}
      <button 
        className="mobile-menu-btn"
        onClick={() => setIsMobileMenuOpen(true)}
        aria-label="Open menu"
      >
        <Menu size={20} />
        Menu
        {(approachingCount > 0 || expiringActivationsCount > 0) && (
          <span className={`menu-badge ${
            veryUrgentCount > 0 || veryUrgentActivationsCount > 0 ? 'menu-badge-critical' :
            urgentCount > 0 || urgentActivationsCount > 0 ? 'menu-badge-danger' :
            'menu-badge-warning'
          }`}>
            {(veryUrgentCount + veryUrgentActivationsCount) > 0 
              ? (veryUrgentCount + veryUrgentActivationsCount)
              : (urgentCount + urgentActivationsCount) > 0
                ? (urgentCount + urgentActivationsCount)
                : (approachingCount + expiringActivationsCount)}
          </span>
        )}
      </button>

      {/* Desktop Sidebar */}
      <aside className="sidebar-custom">
        <SidebarContent onItemClick={() => {}} />
      </aside>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="mobile-overlay" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar Panel */}
      <div className={`mobile-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-sidebar-header">
          <div className="sidebar-logo-section" style={{ position: 'relative' }}>
            <div className="sidebar-logo-icon">
              <img src="/logo.png" alt="Logo" className="sidebar-logo-img" />
            </div>
            <div>
              <div className="sidebar-logo-title">AMG TELECOM</div>
              <div className="sidebar-logo-subtitle">Admin Console</div>
            </div>
            <button 
              className="mobile-close-btn"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        <nav className="sidebar-nav">
          {visible.map((item) => {
            const isActive = location.pathname === item.to;
            const showRemiseAlert = item.to === '/remises' && approachingCount > 0;
            const showActivationAlert = item.to === '/activation' && expiringActivationsCount > 0;
            
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              >
                <item.icon className="sidebar-nav-icon" />
                <span style={{ flex: 1 }}>{item.label}</span>
                {showRemiseAlert && (
                  <div className={`sidebar-alert-badge alert-${alertColor}`}>
                    <Bell size={12} className="alert-icon" />
                    {getBadgeText()}
                  </div>
                )}
                {showActivationAlert && (
                  <div className={`sidebar-alert-badge alert-${activationAlertColor}`}>
                    <Bell size={12} className="alert-icon" />
                    {getActivationBadgeText()}
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>
        
        {/* Mobile Alert Banner for Remises */}
        {approachingCount > 0 && (
          <div className={`sidebar-alert-banner banner-${alertColor}`}>
            <AlertCircle size={18} />
            <div className="sidebar-alert-text">
              {veryUrgentCount > 0 && (
                <span className="very-urgent-text">
                  🔴 {veryUrgentCount} remise{veryUrgentCount > 1 ? 's' : ''} À DEMAIN!
                </span>
              )}
              {urgentCount > 0 && veryUrgentCount === 0 && (
                <span className="urgent-text">
                  ⚠️ {urgentCount} remise{urgentCount > 1 ? 's' : ''} dans ≤3 jours
                </span>
              )}
              {approachingCount > 0 && urgentCount === 0 && veryUrgentCount === 0 && (
                <span className="warning-text">
                  📅 {approachingCount} remise{approachingCount > 1 ? 's' : ''} dans les 7 jours
                </span>
              )}
            </div>
          </div>
        )}

        {/* Mobile Alert Banner for Activations */}
        {expiringActivationsCount > 0 && (
          <div className={`sidebar-alert-banner banner-${activationAlertColor}`}>
            <AlertCircle size={18} />
            <div className="sidebar-alert-text">
              {veryUrgentActivationsCount > 0 && (
                <span className="very-urgent-text">
                  🔴 {veryUrgentActivationsCount} activation{veryUrgentActivationsCount > 1 ? 's' : ''} À DEMAIN!
                </span>
              )}
              {urgentActivationsCount > 0 && veryUrgentActivationsCount === 0 && (
                <span className="urgent-text">
                  ⚠️ {urgentActivationsCount} activation{urgentActivationsCount > 1 ? 's' : ''} expire{urgentActivationsCount > 1 ? 'nt' : ''} dans ≤3 jours
                </span>
              )}
              {expiringActivationsCount > 0 && urgentActivationsCount === 0 && veryUrgentActivationsCount === 0 && (
                <span className="warning-text">
                  📅 {expiringActivationsCount} activation{expiringActivationsCount > 1 ? 's' : ''} expire{expiringActivationsCount > 1 ? 'nt' : ''} dans les 7 jours
                </span>
              )}
            </div>
          </div>
        )}
        
        <div className="sidebar-user-section">
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.name || 'Utilisateur'}</div>
            <div className="sidebar-user-email">{user?.email || 'email@exemple.com'}</div>
          </div>
          <button
            onClick={handleLogout}
            className="sidebar-logout-btn"
          >
            <LogOut className="sidebar-logout-icon" />
            Déconnexion
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;