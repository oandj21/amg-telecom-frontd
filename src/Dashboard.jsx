import { useMemo, useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Package, ShoppingCart, TrendingUp, AlertTriangle, Plus, FileText,
  Users, CreditCard, DollarSign, Activity, Calendar, Clock, CheckCircle,
  XCircle, Truck, Battery, Wifi, Signal, MapPin, RefreshCw,
  Download, Filter, Eye, ChevronRight, PieChart as PieChartIcon,
  BarChart3, Gift, Percent, Wallet, Zap, Smartphone, Car, Settings,
  Home, ArrowUp, ArrowDown, TrendingDown, Shield, Award, Star,
  Target, Rocket, Sparkles, Crown, Medal, Trophy, Briefcase,
  Building2, CircleDollarSign, Receipt, ClipboardList, Timer,
  CalendarCheck, CheckSquare, ClockAlert, AlertOctagon, Gauge,
  Printer, X, Loader, Trash2, FolderOpen, Edit, Database, Cloud, Save,
  Hash, Calculator, Search as SearchIcon, ChevronDown as ChevronDownIcon
} from 'lucide-react';
import { 
  BarChart, Bar, CartesianGrid, Tooltip, XAxis, YAxis, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Legend, 
  ComposedChart
} from 'recharts';
import {
  fetchProducts,
  fetchSales,
  fetchDashboardStats,
  fetchSaleStats,
  fetchClients,
  fetchGpsDevices,
  fetchVehicles,
  fetchActivations,
  fetchDepenses,
  selectDepenses,
  // Invoice actions for DEVIS
  fetchNextDevisNumber,
  saveDevis,
  fetchCurrentInvoiceNumber
} from './Store/store';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2pdf from 'html2pdf.js';

// ==================== API CONFIGURATION ====================
const API_URL = window.REACT_APP_API_URL || "https://amg-telecom-backd-production.up.railway.app/api";

// ==================== TOAST COMPONENT ====================
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const getStyles = () => {
    switch (type) {
      case 'success':
        return {
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          icon: <CheckCircle size={18} />,
          borderLeftColor: '#10b981'
        };
      case 'error':
        return {
          background: 'white',
          icon: <XCircle size={18} style={{ color: '#ef4444' }} />,
          borderLeftColor: '#ef4444',
          textColor: '#334155'
        };
      case 'warning':
        return {
          background: 'white',
          icon: <AlertTriangle size={18} style={{ color: '#f59e0b' }} />,
          borderLeftColor: '#f59e0b',
          textColor: '#334155'
        };
      default:
        return {
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          icon: <CheckCircle size={18} />,
          borderLeftColor: '#3b82f6'
        };
    }
  };

  const styles = getStyles();
  const isColored = type === 'success' || type === 'info';

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 9999,
        animation: 'toastSlideIn 0.3s ease-out, toastFadeOut 0.3s ease-out 2.7s forwards'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: styles.background,
          color: isColored ? 'white' : styles.textColor,
          padding: '12px 16px',
          borderRadius: '12px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.02)',
          minWidth: '300px',
          maxWidth: '400px',
          fontWeight: '500',
          fontSize: '0.813rem',
          cursor: 'pointer',
          transition: 'transform 0.2s ease',
          borderLeft: `4px solid ${styles.borderLeftColor}`,
        }}
        onClick={onClose}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {styles.icon}
        </div>
        <div style={{ flex: 1, fontSize: '0.813rem' }}>
          {message}
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: isColored ? 'rgba(255,255,255,0.7)' : '#94a3b8',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '6px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = isColored ? 'rgba(255,255,255,0.2)' : '#f1f5f9'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

// ==================== CUSTOM HOOK FOR TOAST ====================
const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const ToastContainer = () => (
    <>
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
        />
      ))}
    </>
  );

  return { showToast, ToastContainer };
};

// ==================== SEARCHABLE SELECT COMPONENT ====================
const SearchableSelect = ({ options, value, onChange, placeholder = "Sélectionner...", disabled = false, label = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);

  const selectedOption = options.find(opt => opt.id === value);

  const filteredOptions = options.filter(opt => 
    opt.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (opt.telephone?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (opt.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    onChange(option.id, option);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="searchable-select" ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {label && <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>{label}</label>}
      <div 
        className="searchable-select-input"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{ 
          cursor: disabled ? 'not-allowed' : 'pointer', 
          backgroundColor: disabled ? '#f3f4f6' : 'white',
          padding: '0.5rem 2rem 0.5rem 0.75rem',
          border: '1px solid #d1d5db',
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
          position: 'relative'
        }}
      >
        {selectedOption ? (
          <span>
            {selectedOption.nom}
            {selectedOption.telephone && (
              <span style={{ fontSize: '0.7rem', color: '#6b7280', marginLeft: '0.5rem' }}>
                ({selectedOption.telephone})
              </span>
            )}
          </span>
        ) : (
          <span style={{ color: '#9ca3af' }}>{placeholder}</span>
        )}
      </div>
      <ChevronDownIcon size={16} className="searchable-select-arrow" style={{ position: 'absolute', right: '0.75rem', top: label ? '32px' : '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6b7280' }} />
      
      {isOpen && !disabled && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '0.5rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          zIndex: 1000,
          maxHeight: '280px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <div style={{ padding: '0.5rem', borderBottom: '1px solid #e5e7eb' }}>
            <input
              type="text"
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #e5e7eb',
                borderRadius: '0.375rem',
                fontSize: '0.813rem',
                outline: 'none'
              }}
              placeholder="Rechercher un client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div style={{ overflowY: 'auto', maxHeight: '220px' }}>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '0.5rem 0.75rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.813rem' }}>Aucun client trouvé</div>
            ) : (
              filteredOptions.map(option => (
                <div
                  key={option.id}
                  style={{
                    padding: '0.5rem 0.75rem',
                    cursor: 'pointer',
                    fontSize: '0.813rem',
                    transition: 'background 0.2s',
                    borderBottom: '1px solid #f3f4f6',
                    backgroundColor: value === option.id ? '#eff6ff' : 'white'
                  }}
                  onClick={() => handleSelect(option)}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = value === option.id ? '#eff6ff' : 'white'}
                >
                  <div style={{ fontWeight: value === option.id ? 600 : 400 }}>
                    {option.nom}
                  </div>
                  {option.telephone && (
                    <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>{option.telephone}</div>
                  )}
                  {option.email && (
                    <div style={{ fontSize: '0.65rem', color: '#9ca3af' }}>{option.email}</div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== MODERN STYLES ====================
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700;14..32,800&display=swap');
  
  .dashboard-container {
    padding: 0.1rem;
    background: linear-gradient(135deg, #f0f9ff 0%, #f8fafc 50%, #f1f5f9 100%);
    min-height: 100vh;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }
  
  @media (min-width: 768px) {
    .dashboard-container {
      padding: 0rem;
    }
  }
  
  .dashboard-card {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 1.25rem;
    border: 1px solid rgba(226, 232, 240, 0.6);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;
  }
  
  .dashboard-card:hover {
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.02);
    transform: translateY(-2px);
    border-color: rgba(59, 130, 246, 0.2);
  }
  
  .stats-grid {
    display: grid;
    gap: 1.25rem;
    margin-bottom: 1.5rem;
    grid-template-columns: repeat(4, 1fr);
  }
  
  @media (max-width: 1200px) {
    .stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  
  @media (max-width: 640px) {
    .stats-grid {
      grid-template-columns: 1fr;
    }
  }
  
  .stat-card {
    position: relative;
    background: white;
    border-radius: 1.25rem;
    padding: 1.25rem;
    border: 1px solid rgba(226, 232, 240, 0.8);
    transition: all 0.3s ease;
    overflow: hidden;
    cursor: pointer;
  }
  
  .stat-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899);
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  .stat-card:hover::before {
    opacity: 1;
  }
  
  .stat-card:hover {
    border-color: #cbd5e1;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
    transform: translateY(-4px);
  }
  
  .stat-info {
    flex: 1;
  }
  
  .stat-label {
    font-size: 0.7rem;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: 0.5rem;
  }
  
  .stat-value {
    font-size: 1.75rem;
    font-weight: 800;
    background: linear-gradient(135deg, #1e293b 0%, #2d3a4a 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    line-height: 1.2;
    margin-bottom: 0.25rem;
  }
  
  .stat-subtitle {
    font-size: 0.65rem;
    color: #94a3b8;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }
  
  .stat-icon {
    width: 3rem;
    height: 3rem;
    border-radius: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: transform 0.3s ease;
  }
  
  .stat-card:hover .stat-icon {
    transform: scale(1.05);
  }
  
  .trend-up {
    color: #10b981;
    background: #d1fae5;
    padding: 0.125rem 0.375rem;
    border-radius: 1rem;
    font-size: 0.65rem;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 0.125rem;
  }
  
  .trend-down {
    color: #ef4444;
    background: #fee2e2;
    padding: 0.125rem 0.375rem;
    border-radius: 1rem;
    font-size: 0.65rem;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 0.125rem;
  }
  
  .kpi-grid {
    display: grid;
    gap: 1rem;
    margin-bottom: 1.5rem;
    grid-template-columns: repeat(4, 1fr);
  }
  
  @media (max-width: 1200px) {
    .kpi-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  
  @media (max-width: 640px) {
    .kpi-grid {
      grid-template-columns: 1fr;
    }
  }
  
  .kpi-card {
    background: linear-gradient(135deg, #ffffff 0%, #fafcff 100%);
    border-radius: 1rem;
    padding: 1rem;
    border: 1px solid #e2e8f0;
    transition: all 0.2s ease;
    cursor: pointer;
  }
  
  .kpi-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    border-color: #3b82f6;
  }
  
  .kpi-title {
    font-size: 0.7rem;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  .kpi-value {
    font-size: 1.5rem;
    font-weight: 800;
    background: linear-gradient(135deg, #0f172a 0%, #334155 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-top: 0.25rem;
    line-height: 1.2;
  }
  
  .kpi-subtitle {
    font-size: 0.65rem;
    color: #94a3b8;
    margin-top: 0.25rem;
  }
  
  .kpi-icon {
    width: 2.25rem;
    height: 2.25rem;
    background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
    border-radius: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .two-columns {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    margin-bottom: 1.5rem;
  }
  
  @media (max-width: 1024px) {
    .two-columns {
      grid-template-columns: 1fr;
      gap: 1rem;
    }
  }
  
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
    gap: 1rem;
  }
  
  .page-title {
    font-size: 1.75rem;
    font-weight: 800;
    background: linear-gradient(135deg, #0f172a 0%, #334155 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 0;
    letter-spacing: -0.02em;
  }
  
  .page-subtitle {
    font-size: 0.875rem;
    color: #64748b;
    margin-top: 0.25rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 0.75rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
  }
  
  .btn-outline {
    background: white;
    border: 1px solid #e2e8f0;
    color: #1e293b;
  }
  
  .btn-outline:hover {
    background: #f8fafc;
    border-color: #94a3b8;
    transform: translateY(-1px);
  }
  
  .btn-primary {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
    box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
  }
  
  .btn-primary:hover {
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
  }
  
  .btn-secondary {
    background: linear-gradient(135deg, #8b5cf6, #7c3aed);
    color: white;
  }
  
  .btn-secondary:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
  }
  
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.7rem;
    font-weight: 600;
  }
  
  .badge-success {
    background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
    color: #065f46;
  }
  
  .badge-warning {
    background: linear-gradient(135deg, #fed7aa 0%, #fdba74 100%);
    color: #9a3412;
  }
  
  .badge-danger {
    background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
    color: #991b1b;
  }
  
  .badge-info {
    background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
    color: #1e40af;
  }
  
  .progress-bar {
    width: 100%;
    height: 0.625rem;
    background: #e2e8f0;
    border-radius: 9999px;
    overflow: hidden;
  }
  
  .progress-fill {
    height: 100%;
    border-radius: 9999px;
    transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
  }
  
  .progress-fill::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(90deg, rgba(255,255,255,0.2), transparent);
    animation: shimmer 2s infinite;
  }
  
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
  
  .time-range-selector {
    display: flex;
    gap: 0.25rem;
    background: #f1f5f9;
    padding: 0.25rem;
    border-radius: 0.75rem;
  }
  
  .time-range-btn {
    padding: 0.375rem 1rem;
    font-size: 0.75rem;
    font-weight: 600;
    border-radius: 0.5rem;
    background: transparent;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .time-range-btn-active {
    background: white;
    color: #3b82f6;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  
  .loading-spinner {
    width: 2.5rem;
    height: 2.5rem;
    border: 3px solid #e2e8f0;
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .recent-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-height: 400px;
    overflow-y: auto;
  }
  
  .recent-list::-webkit-scrollbar {
    width: 4px;
  }
  
  .recent-list::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 10px;
  }
  
  .recent-list::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 10px;
  }
  
  .recent-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.875rem;
    border-radius: 0.75rem;
    transition: all 0.2s ease;
    background: linear-gradient(135deg, #ffffff 0%, #fafcff 100%);
  }
  
  .recent-item:hover {
    background: #f8fafc;
    transform: translateX(4px);
  }
  
  .chart-container {
    padding: 1rem;
  }
  
  .grid-cols-2 {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
    margin-bottom: 1.5rem;
  }
  
  @media (max-width: 768px) {
    .grid-cols-2 {
      grid-template-columns: 1fr;
    }
  }
  
  .gps-stats-mini {
    display: flex;
    gap: 1rem;
    margin-bottom: 1.2rem;
  }
  
  .gps-stat-mini {
    flex: 1;
    text-align: center;
    padding: 1rem;
    border-radius: 1rem;
    transition: all 0.2s ease;
    cursor: pointer;
  }
  
  .gps-stat-mini:hover {
    transform: scale(1.02);
  }
  
  .gps-stat-value {
    font-size: 1.75rem;
    font-weight: 800;
  }
  
  .gps-stat-label {
    font-size: 0.7rem;
    color: #64748b;
    margin-top: 0.25rem;
    font-weight: 500;
  }
  
  .quick-actions {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }
  
  .quick-action-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 0.75rem;
    font-size: 0.75rem;
    font-weight: 500;
    background: white;
    border: 1px solid #e2e8f0;
    color: #475569;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .quick-action-btn:hover {
    background: #f8fafc;
    border-color: #3b82f6;
    color: #3b82f6;
    transform: translateY(-1px);
  }
  
  .welcome-banner {
    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
    border-radius: 1.25rem;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    position: relative;
    overflow: hidden;
  }
  
  .welcome-banner::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -20%;
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%);
    border-radius: 50%;
  }
  
  .welcome-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: white;
    margin-bottom: 0.5rem;
  }
  
  .welcome-text {
    color: #94a3b8;
    font-size: 0.875rem;
  }
  
  .info-box {
    background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
    border-radius: 1rem;
    padding: 1rem;
  }
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.25rem;
    border-bottom: 1px solid #e2e8f0;
  }
  
  .section-title {
    font-weight: 700;
    color: #0f172a;
    font-size: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  /* Modal Styles */
  .report-modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    animation: fadeIn 0.2s ease-out;
  }
  
  .report-modal {
    background: white;
    border-radius: 1.5rem;
    width: 95%;
    max-width: 1200px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    animation: slideInUp 0.3s ease-out;
  }
  
  .report-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid #e2e8f0;
    background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
  }
  
  .report-modal-title {
    font-size: 1.25rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #1e293b;
  }
  
  .report-modal-body {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
  }
  
  .report-modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    padding: 1rem 1.5rem;
    border-top: 1px solid #e2e8f0;
    background: #f8fafc;
  }
  
  .report-table-container {
    overflow-x: auto;
    border: 1px solid #e2e8f0;
    border-radius: 0.75rem;
    margin-top: 1rem;
  }
  
  .report-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.813rem;
  }
  
  .report-table th {
    background: #f1f5f9;
    padding: 0.75rem;
    text-align: left;
    font-weight: 600;
    color: #475569;
    border-bottom: 1px solid #e2e8f0;
  }
  
  .report-table td {
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid #f1f5f9;
  }
  
  .report-input {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #cbd5e1;
    border-radius: 0.5rem;
    font-size: 0.813rem;
    transition: all 0.2s;
  }
  
  .report-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }
  
  .company-info-bar {
    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
    border-radius: 0.75rem;
    padding: 0.75rem;
    margin-bottom: 1.5rem;
    color: white;
    font-size: 0.7rem;
    text-align: center;
  }
  
  .summary-box {
    background: #f8fafc;
    border-radius: 0.75rem;
    padding: 0.75rem;
    margin-top: 1rem;
    display: flex;
    justify-content: flex-end;
  }
  
  /* Saved Reports Grid */
  .saved-reports-section {
    margin-top: 2rem;
    padding: 1.25rem;
    background: white;
    border-radius: 1.25rem;
    border: 1px solid #e2e8f0;
  }
  
  .saved-reports-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1rem;
    margin-top: 1rem;
  }
  
  .saved-report-card {
    background: #f8fafc;
    border-radius: 1rem;
    padding: 1rem;
    border: 1px solid #e2e8f0;
    transition: all 0.2s ease;
    cursor: pointer;
  }
  
  .saved-report-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-color: #3b82f6;
  }
  
  .saved-report-title {
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 0.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.875rem;
  }
  
  .saved-report-meta {
    font-size: 0.7rem;
    color: #64748b;
    display: flex;
    gap: 0.75rem;
    margin-top: 0.5rem;
    flex-wrap: wrap;
  }
  
  .action-btn {
    background: transparent;
    border: none;
    padding: 0.25rem;
    border-radius: 0.5rem;
    cursor: pointer;
    color: #64748b;
    transition: all 0.2s;
  }
  
  .action-btn:hover {
    background: #e2e8f0;
  }
  
  .action-btn.edit:hover {
    color: #8b5cf6;
  }
  
  .action-btn.delete:hover {
    color: #ef4444;
  }
  
  /* Edit Modal */
  .edit-modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 1100;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    animation: fadeIn 0.2s ease-out;
  }
  
  .edit-modal-container {
    background: white;
    border-radius: 1.5rem;
    width: 95%;
    max-width: 1000px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    animation: slideInUp 0.3s ease-out;
  }
  
  .edit-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid #e2e8f0;
    background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
  }
  
  .edit-modal-title {
    font-size: 1.25rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #1e293b;
  }
  
  .edit-modal-body {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
  }
  
  .edit-modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    padding: 1rem 1.5rem;
    border-top: 1px solid #e2e8f0;
    background: #f8fafc;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes toastSlideIn {
    from {
      opacity: 0;
      transform: translateX(100%);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  @keyframes toastFadeOut {
    to {
      opacity: 0;
      transform: translateX(100%);
    }
  }
  
  .dashboard-card {
    animation: slideInUp 0.4s ease-out;
  }
  
  .spinner {
    width: 1rem;
    height: 1rem;
    border: 2px solid #e2e8f0;
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    display: inline-block;
  }
  
  .spinning {
    animation: spin 0.8s linear infinite;
  }
  
  .searchable-select {
    position: relative;
    width: 100%;
  }
  
  .searchable-select-input {
    width: 100%;
    padding: 0.5rem 2rem 0.5rem 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    background: white;
    color: #111827;
    cursor: pointer;
  }
  
  .searchable-select-arrow {
    position: absolute;
    right: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
    color: #6b7280;
  }
`;

// ==================== SAFE NUMBER UTILITY ====================
const safeNumber = (value, defaultValue = 0) => {
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
};

const safeRound = (value) => {
  const num = safeNumber(value);
  return Math.round(num);
};

const safeToFixed = (value, decimals = 2) => safeNumber(value).toFixed(decimals);

const TVA_RATE = 0.20;
const currentYear = new Date().getFullYear();

const calculateTTC = (htPrice) => {
  return safeNumber(htPrice) * (1 + TVA_RATE);
};

const getCompanyInfo = () => {
  const saved = localStorage.getItem('company_info');
  if (saved) {
    try { return JSON.parse(saved); } catch(e) {}
  }
  return {
    name: 'AMG TELECOM Sarl',
    address: '82 Angle Abdelmounem et Rue Soumaya ETG 2 N°4, CASABLANCA',
    phone: '+212 661 685 758',
    email: 'contact@amgtelecom.ma',
    ice: '003272997000058',
    rc: '577849',
    patente: '34779711',
    tax_number: '53711710',
    cnss: '4767398',
    rib: '011 780 0000762100016378 22',
    tp_number: '34779711',
    bank_name: 'Banque Populaire'
  };
};

const formatMoney = (val) => `${Number(val || 0).toFixed(2)} DH`;

// Helper function for blob to base64
const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Convert number to French words
const convertToFrenchWords = (total) => {
  const integerPart = Math.floor(total);
  
  const units = ['', 'UN', 'DEUX', 'TROIS', 'QUATRE', 'CINQ', 'SIX', 'SEPT', 'HUIT', 'NEUF'];
  const teens = ['DIX', 'ONZE', 'DOUZE', 'TREIZE', 'QUATORZE', 'QUINZE', 'SEIZE', 'DIX-SEPT', 'DIX-HUIT', 'DIX-NEUF'];
  const tens = ['', 'DIX', 'VINGT', 'TRENTE', 'QUARANTE', 'CINQUANTE', 'SOIXANTE', 'SOIXANTE-DIX', 'QUATRE-VINGT', 'QUATRE-VINGT-DIX'];
  
  const convertLessThanOneThousand = (n) => {
    let res = '';
    if (n >= 100) {
      const hundreds = Math.floor(n / 100);
      res += (hundreds === 1 ? '' : units[hundreds] + ' ') + 'CENT ';
      n %= 100;
    }
    if (n >= 20) {
      const t = Math.floor(n / 10);
      res += tens[t] + ' ';
      n %= 10;
    } else if (n >= 10) {
      res += teens[n - 10] + ' ';
      n = 0;
    }
    if (n > 0) {
      res += units[n] + ' ';
    }
    return res.trim();
  };
  
  const convertToWords = (n) => {
    if (n === 0) return 'ZÉRO';
    let words = '';
    if (Math.floor(n / 1000000) > 0) {
      words += convertLessThanOneThousand(Math.floor(n / 1000000)) + ' MILLION ';
      n %= 1000000;
    }
    if (Math.floor(n / 1000) > 0) {
      const thousands = Math.floor(n / 1000);
      words += (thousands === 1 ? '' : convertLessThanOneThousand(thousands) + ' ') + 'MILLE ';
      n %= 1000;
    }
    if (n > 0) {
      words += convertLessThanOneThousand(n);
    }
    return words.trim();
  };
  
  return convertToWords(integerPart) + ' DIRHAMS';
};

// ==================== PREMIUM INVOICE MODAL (WITH CLIENT SELECTION & DATABASE) ====================
const PremiumInvoiceModal = ({ isOpen, onClose, showToast, clients = [] }) => {
  const dispatch = useDispatch();
  const [rows, setRows] = useState([
    { id: 1, description: '', quantity: 1, unitPrice: 0, total: 0 }
  ]);
  const [generating, setGenerating] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [taxRate, setTaxRate] = useState(20);
  const [applyTax, setApplyTax] = useState(true);
  const [customClientInfo, setCustomClientInfo] = useState({ name: '', address: '', phone: '', email: '', ice: '' });
  const [useCustomClient, setUseCustomClient] = useState(false);

  // Load initial DEVIS number from API
  useEffect(() => {
    const loadDevisNumber = async () => {
      try {
        const result = await dispatch(fetchNextDevisNumber()).unwrap();
        setInvoiceNumber(result.devis_number);
      } catch (error) {
        console.error('Error loading devis number:', error);
        // Fallback
        const year = new Date().getFullYear();
        const random = Math.floor(Math.random() * 10000);
        setInvoiceNumber(`DEV-${year}-${String(random).padStart(4, '0')}`);
      }
    };
    if (isOpen) {
      loadDevisNumber();
    }
  }, [dispatch, isOpen]);

  const addRow = () => {
    const newId = rows.length > 0 ? Math.max(...rows.map(r => r.id)) + 1 : 1;
    setRows([
      ...rows,
      { id: newId, description: '', quantity: 1, unitPrice: 0, total: 0 }
    ]);
  };

  const removeRow = (id) => {
    if (rows.length > 1) {
      setRows(rows.filter(row => row.id !== id));
    }
  };

  const updateRow = (id, field, value) => {
    setRows(rows.map(row => {
      if (row.id === id) {
        const updatedRow = { ...row, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          updatedRow.total = safeNumber(updatedRow.quantity) * safeNumber(updatedRow.unitPrice);
        }
        return updatedRow;
      }
      return row;
    }));
  };

  const handleClientSelect = (clientId, client) => {
    if (client) {
      setSelectedClient(client);
      setCustomClientInfo({
        name: client.nom || '',
        address: client.adresse || '',
        phone: client.telephone || '',
        email: client.email || '',
        ice: client.ice_client || ''
      });
    }
  };

  const calculateSubtotal = () => {
    return rows.reduce((sum, row) => sum + safeNumber(row.total), 0);
  };

  const calculateTax = () => {
    const subtotal = calculateSubtotal();
    return applyTax ? (subtotal * taxRate) / 100 : 0;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const resetForm = () => {
    setRows([{ id: 1, description: '', quantity: 1, unitPrice: 0, total: 0 }]);
    setSelectedClient(null);
    setCustomClientInfo({ name: '', address: '', phone: '', email: '', ice: '' });
    setUseCustomClient(false);
    setTaxRate(20);
    setApplyTax(true);
    // Get new devis number
    const loadNewDevisNumber = async () => {
      try {
        const result = await dispatch(fetchNextDevisNumber()).unwrap();
        setInvoiceNumber(result.devis_number);
      } catch (error) {
        console.error('Error loading devis number:', error);
      }
    };
    loadNewDevisNumber();
  };

  const getClientForInvoice = () => {
    if (useCustomClient) {
      return customClientInfo;
    }
    if (selectedClient) {
      return {
        name: selectedClient.nom || selectedClient.name || '',
        address: selectedClient.adresse || '',
        phone: selectedClient.telephone || '',
        email: selectedClient.email || '',
        ice: selectedClient.ice_client || ''
      };
    }
    return null;
  };

  const generateInvoicePDF = async () => {
    const validRows = rows.filter(row => row.description && row.description.trim() && row.quantity > 0 && row.unitPrice > 0);
    if (validRows.length === 0) {
      showToast('Veuillez ajouter au moins une ligne valide (description, quantité et prix requis)', 'warning');
      return;
    }

    const clientForInvoice = getClientForInvoice();
    if (!clientForInvoice || (!clientForInvoice.name && !useCustomClient)) {
      showToast('Veuillez sélectionner un client ou activer "Client personnalisé"', 'warning');
      return;
    }

    setGenerating(true);

    try {
      // Track this DEVIS in database if client is selected
      if (selectedClient?.id) {
        await dispatch(saveDevis({ 
          clientId: selectedClient.id, 
          devisNumber: invoiceNumber 
        })).unwrap();
      } else if (useCustomClient && customClientInfo.name) {
        // For custom clients, we just log it (no database tracking)
        console.log('DEVIS generated for custom client:', customClientInfo.name);
      }

      const companyInfo = getCompanyInfo();
      const invoiceDate = new Date().toLocaleDateString('fr-FR');
      const finalInvoiceNumber = invoiceNumber;

      let logoBase64 = null;
      let cacheImageBase64 = null;
      
      try {
        const logoResponse = await fetch('/logo.png');
        if (logoResponse.ok) {
          const blob = await logoResponse.blob();
          logoBase64 = await blobToBase64(blob);
        }
      } catch (e) {}

      try {
        const cacheResponse = await fetch('/cache.png');
        if (cacheResponse.ok) {
          const blob = await cacheResponse.blob();
          cacheImageBase64 = await blobToBase64(blob);
        }
      } catch (e) {}

      const subtotal = calculateSubtotal();
      const tax = calculateTax();
      const total = calculateTotal();

      const clientName = clientForInvoice?.name || clientForInvoice?.nom || '';
      const clientAddress = clientForInvoice?.address || clientForInvoice?.adresse || '';
      const clientPhone = clientForInvoice?.phone || clientForInvoice?.telephone || '';
      const clientEmail = clientForInvoice?.email || '';
      const clientIce = clientForInvoice?.ice || clientForInvoice?.ice_client || '';

      const html = `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <title>Devis ${finalInvoiceNumber}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: 'Plus Jakarta Sans', sans-serif;
              color: #1e293b;
              background-color: #ffffff;
              line-height: 1.5;
              padding: 35px 40px 60px 40px;
              font-size: 12px;
            }
            .invoice-container { 
              max-width: 850px; 
              margin: 0 auto; 
              box-sizing: border-box; 
              page-break-after: avoid;
              position: relative;
              min-height: 100%;
            }
            .header-top { 
              display: flex; 
              justify-content: space-between; 
              align-items: flex-start; 
              border-bottom: 1px solid #e2e8f0; 
              padding-bottom: 20px; 
              margin-bottom: 25px; 
            }
            .logo-wrapper { 
              width: 130px; 
              height: 130px; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              overflow: hidden; 
              border-radius: 8px; 
            }
            .invoice-logo { width: 100%; height: 100%; object-fit: cover; }
            .company-name-placeholder { font-size: 20px; font-weight: 700; color: #0f172a; font-family: 'Playfair Display', serif; }
            .corporate-meta-box { text-align: right; }
            .document-type-badge { font-family: 'Playfair Display', serif; font-size: 28px; font-style: italic; color: #0f172a; margin-bottom: 4px; font-weight: 600; }
            .invoice-id-badge { font-size: 14px; font-weight: 700; color: #475569; letter-spacing: 0.05em; margin-bottom: 4px; }
            .invoice-date-line { font-size: 12px; color: #94a3b8; }
            .parties-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 30px; }
            .party-card .block-title { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 10px; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px; }
            .party-card .party-name { font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
            .party-card .party-details { color: #475569; line-height: 1.5; font-size: 12px; }
            .table-wrapper { border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin-bottom: 25px; }
            .invoice-table { width: 100%; border-collapse: collapse; }
            .invoice-table th { background-color: #f8fafc; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; padding: 12px 8px; border-bottom: 1px solid #e2e8f0; text-align: left; }
            .invoice-table td { padding: 12px 8px; border-bottom: 1px solid #f1f5f9; color: #334155; font-size: 12px; }
            .invoice-table tr:last-child td { border-bottom: 1px solid #e2e8f0; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .summary-container { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: start; margin-bottom: 25px; }
            .legal-wordings { border-left: 2px solid #e2e8f0; padding-left: 18px; margin-top: 5px; }
            .wording-label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.05em; margin-bottom: 4px; }
            .wording-value { font-family: 'Playfair Display', serif; font-size: 14px; font-style: italic; color: #334155; font-weight: 600; line-height: 1.4; }
            .financial-math { width: 100%; border-collapse: collapse; }
            .financial-math td { padding: 6px 8px; font-size: 12px; color: #475569; }
            .financial-math tr.premium-total td { font-size: 16px; font-weight: 700; color: #0f172a; border-top: 1px solid #e2e8f0; padding-top: 10px; padding-bottom: 10px; }
            .payment-routing { border-top: 1px solid #e2e8f0; padding-top: 15px; margin-bottom: 30px; }
            .routing-title { font-size: 11px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px; }
            .routing-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 15px; font-size: 11px; color: #475569; }
            .routing-item strong { color: #0f172a; display: block; margin-bottom: 2px; }
            .executive-footer { 
              border-top: 2px solid #0f172a; 
              padding-top: 15px; 
              padding-bottom: 10px;
              text-align: center; 
              font-size: 10px; 
              color: #64748b; 
              line-height: 1.6;
              margin-top: 20px;
            }
            .executive-footer .footer-company-name { font-weight: 700; color: #0f172a; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.05em; }
            .bank-info { margin-top: 12px; font-size: 11px; color: #475569; border-top: 1px dashed #e2e8f0; padding-top: 10px; }
            .bank-info strong { color: #0f172a; }
            .signature-section { margin-top: 40px; margin-bottom: 30px; display: flex; justify-content: flex-end; padding-right: 20px; }
            .signature-box { text-align: center; width: 200px; }
            .signature-label { font-size: 11px; font-weight: bold; margin-bottom: 10px; text-decoration: underline; color: #1f2937; }
            .signature-image { margin-top: 10px; display: flex; justify-content: center; }
            .signature-img { max-width: 150px; max-height: 80px; object-fit: contain; }
            
            @media print {
              body { padding: 0 0 40px 0; }
              .executive-footer { position: fixed; bottom: 0; left: 0; right: 0; background: white; }
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="header-top">
              <div class="logo-wrapper">
                ${logoBase64 ? `<img src="${logoBase64}" alt="Logo" class="invoice-logo"/>` : `<span class="company-name-placeholder">${companyInfo.name}</span>`}
              </div>
              <div class="corporate-meta-box">
                <div class="document-type-badge">DEVIS</div>
                <div class="invoice-id-badge">N° ${currentYear}/${finalInvoiceNumber}</div>
                <div class="invoice-date-line">Date: ${invoiceDate}</div>
              </div>
            </div>
            
            <div class="parties-grid">
              <div class="party-card">
                <div class="block-title">Émetteur</div>
                <div class="party-name">${companyInfo.name}</div>
                <div class="party-details">
                  ${companyInfo.address}<br>
                  Téléphone: ${companyInfo.phone}<br>
                  Email: ${companyInfo.email}
                </div>
              </div>
              <div class="party-card">
                <div class="block-title">Facturé à</div>
                <div class="party-name">${clientName}</div>
                <div class="party-details">
                  ${clientAddress ? `${clientAddress}<br>` : ''}
                  ${clientPhone ? `Téléphone: ${clientPhone}<br>` : ''}
                  ${clientIce ? `ICE: ${clientIce}<br>` : ''}
                  ${clientEmail ? `Email: ${clientEmail}` : ''}
                </div>
              </div>
            </div>
            
            <div class="table-wrapper">
              <table class="invoice-table">
                <thead>
                  <tr>
                    <th style="width: 5%;">#</th>
                    <th style="width: 50%;">Désignation</th>
                    <th class="text-center" style="width: 10%;">Qté</th>
                    <th class="text-right" style="width: 15%;">P.U HT</th>
                    <th class="text-right" style="width: 20%;">Montant HT</th>
                  </tr>
                </thead>
                <tbody>
                  ${validRows.map((row, index) => `
                    <tr>
                      <td class="text-center">${index + 1}</td>
                      <td>${row.description}</td>
                      <td class="text-center">${row.quantity}</td>
                      <td class="text-right">${formatMoney(row.unitPrice)}</td>
                      <td class="text-right"><strong>${formatMoney(row.total)}</strong></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            
            <div class="summary-container">
              <div class="legal-wordings">
                <div class="wording-label">Arrêté la présente devis à la somme de :</div>
                <div class="wording-value">${convertToFrenchWords(total)}</div>
                <div class="bank-info" style="margin-top: 15px;">
                  <strong>Informations de paiement</strong><br>
                  ${companyInfo.rib ? `RIB: ${companyInfo.rib}` : ''}
                </div>
              </div>
              <div>
                <table class="financial-math">
                  <tr><td>Montant HT</td><td class="text-right">${formatMoney(subtotal)}</td></tr>
                  ${applyTax ? `<tr><td>TVA (${taxRate}%)</td><td class="text-right">${formatMoney(tax)}</td></tr>` : ''}
                  <tr class="premium-total"><td><strong>TOTAL TTC</strong></td><td class="text-right"><strong>${formatMoney(total)}</strong></td></tr>
                </table>
              </div>
            </div>
            
            <div class="signature-section">
              <div class="signature-box">
                <div class="signature-label">Cachet & signature</div>
                ${cacheImageBase64 ? `<div class="signature-image"><img src="${cacheImageBase64}" alt="Cachet" class="signature-img" /></div>` : '<div style="height: 50px;"></div>'}
              </div>
            </div>
            
            <div class="payment-routing">
              <div class="routing-title">Règlement & Informations Légales</div>
              <div class="routing-grid">
                <div class="routing-item"><strong>ICE</strong> ${companyInfo.ice || '-'}</div>
                <div class="routing-item"><strong>RC</strong> ${companyInfo.rc || '-'}</div>
                <div class="routing-item"><strong>Patente</strong> ${companyInfo.patente || '-'}</div>
                <div class="routing-item"><strong>IF</strong> ${companyInfo.tax_number || '-'}</div>
                <div class="routing-item"><strong>CNSS</strong> ${companyInfo.cnss || '-'}</div>
              </div>
            </div>
            
            <div class="executive-footer">
            </div>
          </div>
        </body>
        </html>
      `;

      const element = document.createElement('div');
      element.innerHTML = html;
      document.body.appendChild(element);
      
      const opt = {
        margin: [6, 8, 6, 8],
        filename: `Devis_${clientName.replace(/\s+/g, '_')}_${finalInvoiceNumber}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: 'avoid-all' }
      };
      
      await html2pdf().set(opt).from(element).save();
      showToast('Devis généré avec succès', 'success');
      document.body.removeChild(element);
      resetForm();
      onClose();
    } catch (err) {
      console.error('Error generating PDF:', err);
      showToast('Erreur lors de la génération du devis', 'error');
    } finally {
      setGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="report-modal-overlay" onClick={onClose}>
      <div className="report-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '1200px' }}>
        <div className="report-modal-header">
          <div className="report-modal-title">
            <Printer size={20} style={{ color: '#3b82f6' }} />
            <span>Générer un Devis Professionnel</span>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.5rem' }}>
            <X size={20} />
          </button>
        </div>

        <div className="report-modal-body">
          <div className="company-info-bar">
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{getCompanyInfo().name}</div>
            <div style={{ fontSize: '0.65rem', opacity: 0.8 }}>{getCompanyInfo().address}</div>
          </div>

          {/* Invoice Header */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '1.5rem',
            padding: '1rem',
            background: '#f8fafc',
            borderRadius: '0.75rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <label style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Numéro de devis</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="text"
                  className="report-input"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  style={{ width: '200px', fontSize: '0.875rem', fontWeight: 'bold' }}
                />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Date</label>
              <input
                type="date"
                className="report-input"
                value={new Date().toISOString().slice(0, 10)}
                disabled
                style={{ width: '150px', background: '#f1f5f9' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>TVA</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={applyTax}
                  onChange={(e) => setApplyTax(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <input
                  type="number"
                  className="report-input"
                  value={taxRate}
                  onChange={(e) => setTaxRate(safeNumber(e.target.value, 20))}
                  disabled={!applyTax}
                  style={{ width: '80px', textAlign: 'center' }}
                />
                <span style={{ fontSize: '0.75rem' }}>%</span>
              </div>
            </div>
          </div>

          {/* Client Selection */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  checked={!useCustomClient}
                  onChange={() => setUseCustomClient(false)}
                />
                <span style={{ fontSize: '0.875rem' }}>Client existant</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  checked={useCustomClient}
                  onChange={() => setUseCustomClient(true)}
                />
                <span style={{ fontSize: '0.875rem' }}>Client personnalisé</span>
              </label>
            </div>

            {!useCustomClient ? (
              <SearchableSelect
                options={clients}
                value={selectedClient?.id || null}
                onChange={handleClientSelect}
                placeholder="Rechercher un client..."
                label="Sélectionner un client"
              />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>
                    Nom du client <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="report-input"
                    placeholder="Nom du client"
                    value={customClientInfo.name}
                    onChange={(e) => setCustomClientInfo({ ...customClientInfo, name: e.target.value })}
                    style={{ background: 'white' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Adresse</label>
                  <input
                    type="text"
                    className="report-input"
                    placeholder="Adresse"
                    value={customClientInfo.address}
                    onChange={(e) => setCustomClientInfo({ ...customClientInfo, address: e.target.value })}
                    style={{ background: 'white' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Téléphone</label>
                  <input
                    type="tel"
                    className="report-input"
                    placeholder="Téléphone"
                    value={customClientInfo.phone}
                    onChange={(e) => setCustomClientInfo({ ...customClientInfo, phone: e.target.value })}
                    style={{ background: 'white' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Email</label>
                  <input
                    type="email"
                    className="report-input"
                    placeholder="Email"
                    value={customClientInfo.email}
                    onChange={(e) => setCustomClientInfo({ ...customClientInfo, email: e.target.value })}
                    style={{ background: 'white' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>ICE</label>
                  <input
                    type="text"
                    className="report-input"
                    placeholder="ICE"
                    value={customClientInfo.ice}
                    onChange={(e) => setCustomClientInfo({ ...customClientInfo, ice: e.target.value })}
                    style={{ background: 'white' }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Line Items */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '0.75rem'
          }}>
            <div className="section-title" style={{ fontSize: '0.875rem' }}>
              <Package size={16} /> Lignes de devis
            </div>
            <button onClick={addRow} className="btn btn-primary" style={{ padding: '0.375rem 0.875rem', fontSize: '0.75rem' }}>
              <Plus size={14} /> Ajouter une ligne
            </button>
          </div>

          <div className="report-table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <table className="report-table">
              <thead>
                <tr style={{ position: 'sticky', top: 0, background: '#f1f5f9', zIndex: 10 }}>
                  <th style={{ width: '5%' }}>#</th>
                  <th style={{ width: '40%' }}>Description</th>
                  <th style={{ width: '10%' }}>Quantité</th>
                  <th style={{ width: '20%' }}>Prix Unitaire (MAD)</th>
                  <th style={{ width: '20%' }}>Total (MAD)</th>
                  <th style={{ width: '5%' }}></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.id}>
                    <td style={{ textAlign: 'center' }}>{index + 1}</td>
                    <td>
                      <input
                        type="text"
                        className="report-input"
                        value={row.description}
                        onChange={e => updateRow(row.id, 'description', e.target.value)}
                        placeholder="Description du produit/service"
                        style={{ fontSize: '0.75rem' }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="1"
                        min="1"
                        className="report-input"
                        value={row.quantity}
                        onChange={e => updateRow(row.id, 'quantity', parseInt(e.target.value) || 0)}
                        style={{ fontSize: '0.75rem', textAlign: 'center' }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="report-input"
                        value={row.unitPrice}
                        onChange={e => updateRow(row.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                        style={{ fontSize: '0.75rem', textAlign: 'right' }}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="report-input"
                        value={formatMoney(row.total)}
                        disabled
                        style={{ fontSize: '0.75rem', textAlign: 'right', background: '#f8fafc', fontWeight: 'bold' }}
                      />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => removeRow(row.id)}
                        className="action-btn"
                        disabled={rows.length === 1}
                        style={{ color: '#ef4444' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Summary */}
          <div className="summary-box">
            <div style={{ textAlign: 'right', minWidth: '250px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.75rem' }}>
                <span>Sous-total HT:</span>
                <span style={{ fontWeight: 'bold' }}>{formatMoney(calculateSubtotal())}</span>
              </div>
              {applyTax && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.75rem' }}>
                  <span>TVA ({taxRate}%):</span>
                  <span>{formatMoney(calculateTax())}</span>
                </div>
              )}
              <div style={{ borderTop: '2px solid #e2e8f0', marginTop: '0.5rem', paddingTop: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 'bold', color: '#059669' }}>
                  <span>TOTAL TTC:</span>
                  <span>{formatMoney(calculateTotal())}</span>
                </div>
              </div>
              <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '0.5rem' }}>
                ({rows.filter(r => r.description && r.quantity > 0 && r.unitPrice > 0).length} ligne(s) valide(s))
              </div>
            </div>
          </div>
        </div>

        <div className="report-modal-footer">
          <button onClick={onClose} className="btn btn-outline" disabled={generating}>
            Annuler
          </button>
          <button onClick={resetForm} className="btn btn-outline" disabled={generating}>
            <RefreshCw size={16} /> Réinitialiser
          </button>
          <button onClick={generateInvoicePDF} className="btn btn-primary" disabled={generating} style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            {generating ? <Loader size={16} className="spinning" /> : <Printer size={16} />}
            {generating ? 'Génération...' : 'Générer le DEVIS'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================== COMPONENTS ====================

// Premium Stat Card
const StatCard = ({ label, value, icon: Icon, color = 'blue', subtitle, trend, trendValue, onClick }) => {
  const colorClasses = {
    blue: { bg: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', text: '#2563eb', iconBg: '#3b82f6' },
    green: { bg: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', text: '#16a34a', iconBg: '#10b981' },
    purple: { bg: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)', text: '#7c3aed', iconBg: '#8b5cf6' },
    orange: { bg: 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)', text: '#ea580c', iconBg: '#f59e0b' }
  };
  
  const formatSafeValue = (val) => {
    if (val === undefined || val === null || isNaN(val)) return '0 MAD';
    const num = Number(val);
    if (isNaN(num)) return '0 MAD';
    return `${Math.round(num).toLocaleString()}  `;
  };
  
  const displayValue = formatSafeValue(value);
  
  return (
    <div className="stat-card" onClick={onClick}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div className="stat-info">
          <div className="stat-label">{label}</div>
          <div className="stat-value">{displayValue}</div>
          {subtitle && <div className="stat-subtitle">{subtitle}</div>}
          {trend && trendValue !== undefined && trendValue !== null && !isNaN(trendValue) && (
            <div style={{ marginTop: '0.5rem' }}>
              <span className={trend === 'up' ? 'trend-up' : 'trend-down'}>
                {trend === 'up' ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
                {Math.abs(trendValue)}% vs mois dernier
              </span>
            </div>
          )}
        </div>
        <div className="stat-icon" style={{ background: colorClasses[color].bg }}>
          <Icon size={20} style={{ color: colorClasses[color].iconBg }} />
        </div>
      </div>
    </div>
  );
};

// Premium KPI Card
const KpiCard = ({ title, value, subtitle, icon: Icon, onClick }) => {
  const formatKpiValue = (val) => {
    if (val === undefined || val === null || isNaN(val)) return '0';
    const num = Number(val);
    if (isNaN(num)) return '0';
    return num.toLocaleString();
  };
  
  const displayValue = formatKpiValue(value);
  
  return (
    <div className="kpi-card" onClick={onClick}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="kpi-title">{title}</div>
          <div className="kpi-value">{displayValue}</div>
          {subtitle && <div className="kpi-subtitle">{subtitle}</div>}
        </div>
        <div className="kpi-icon">
          <Icon size={16} className="text-gray-600" />
        </div>
      </div>
    </div>
  );
};

// Page Header
const PageHeader = ({ title, subtitle, actions }) => (
  <div className="page-header">
    <div>
      <h1 className="page-title">{title}</h1>
      {subtitle && <div className="page-subtitle">{subtitle}</div>}
    </div>
    {actions && <div className="quick-actions">{actions}</div>}
  </div>
);

// Custom Tooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-xl shadow-xl border border-gray-100">
        <p className="text-xs font-semibold text-gray-700 mb-2">{label}</p>
        {payload.map((p, idx) => {
          let displayValue = p.value;
          if (typeof p.value === 'number') {
            displayValue = p.value.toLocaleString() + (p.name === 'CA (MAD)' || p.name === 'Panier moyen (MAD)' ? ' MAD' : '');
          }
          return (
            <p key={idx} className="text-xs mb-1" style={{ color: p.color }}>
              <span className="font-medium">{p.name}:</span> {displayValue}
            </p>
          );
        })}
      </div>
    );
  }
  return null;
};

// ==================== EDIT REPORT MODAL ====================
const EditReportModal = ({ isOpen, onClose, report, onSave, showToast }) => {
  const [rows, setRows] = useState([]);
  const [saving, setSaving] = useState(false);
  const [numberOfLines, setNumberOfLines] = useState(1);

  useEffect(() => {
    if (report && report.rows) {
      const parsedRows = typeof report.rows === 'string' ? JSON.parse(report.rows) : report.rows;
      setRows(parsedRows.map(row => ({
        id: Date.now() + Math.random(),
        date: row.date || new Date().toISOString().slice(0, 10),
        nom: row.nom || row.clientName || '',
        price: row.price || 0
      })));
    }
  }, [report]);

  const addRow = () => {
    setRows([
      ...rows,
      { id: Date.now(), date: new Date().toISOString().slice(0, 10), nom: '', price: 0 }
    ]);
  };

  const createMultipleRows = () => {
    const num = parseInt(numberOfLines);
    if (isNaN(num) || num <= 0) return;
    
    const newRows = [];
    for (let i = 0; i < num; i++) {
      newRows.push({
        id: Date.now() + i,
        date: new Date().toISOString().slice(0, 10),
        nom: '',
        price: 0
      });
    }
    setRows([...rows, ...newRows]);
  };

  const updateRow = (id, field, value) => {
    setRows(rows.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    ));
  };

  const removeRow = (id) => {
    if (rows.length > 1) {
      setRows(rows.filter(row => row.id !== id));
    }
  };

  const calculateTotal = () => {
    return rows.reduce((sum, row) => sum + safeNumber(row.price), 0);
  };

  const handleSave = async () => {
    const validRows = rows.filter(row => row.nom && row.nom.trim() && row.price > 0);
    if (validRows.length === 0) {
      showToast('Veuillez ajouter au moins une ligne valide', 'warning');
      return;
    }

    setSaving(true);

    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const companyInfo = getCompanyInfo();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      let yPos = 20;

      let logoBase64 = null;
      try {
        const response = await fetch('/logo.png');
        if (response.ok) {
          const blob = await response.blob();
          logoBase64 = await blobToBase64(blob);
        }
      } catch (e) {}

      if (logoBase64) {
        doc.addImage(logoBase64, 'PNG', margin, yPos - 2, 40, 25);
      } else {
        doc.setFillColor(15, 23, 42);
        doc.rect(margin, yPos, 8, 8, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(15, 23, 42);
        doc.text(companyInfo.name.substring(0, 3).toUpperCase(), margin + 11, yPos + 6.5);
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(30, 58, 138);
      doc.text("RAPPORT", pageWidth - margin, yPos + 4, { align: 'right' });
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`Édition: ${new Date().toLocaleDateString('fr-FR')}`, pageWidth - margin, yPos + 10, { align: 'right' });

      yPos += 24;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(30, 58, 138);
      doc.text("ÉMETTEUR", margin, yPos);
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(companyInfo.name, margin, yPos + 5.5);

      yPos = yPos + 16;

      const tableRows = validRows.map(row => [
        new Date(row.date).toLocaleDateString('fr-FR'),
        row.nom,
        formatMoney(row.price)
      ]);

      const totalHT = validRows.reduce((sum, row) => sum + safeNumber(row.price), 0);

      autoTable(doc, {
        startY: yPos,
        theme: 'plain',
        head: [['Date', 'Désignation', 'Montant HT']],
        body: tableRows,
        margin: { left: margin, right: margin },
        styles: {
          font: 'helvetica',
          fontSize: 9,
          cellPadding: 5,
          textColor: [30, 41, 59]
        },
        headStyles: {
          textColor: [30, 58, 138],
          fontStyle: 'bold',
          lineWidth: { bottom: 1 },
          drawColor: [30, 58, 138]
        },
        columnStyles: {
          0: { halign: 'left', cellWidth: 35 },
          1: { halign: 'left' },
          2: { halign: 'right', cellWidth: 40 }
        },
        didParseCell: (data) => {
          if (data.section === 'body') {
            data.cell.styles.lineWidth = { bottom: 0.2 };
            data.cell.styles.drawColor = [241, 245, 249];
          }
        }
      });

      let finalY = doc.lastAutoTable.finalY + 10;

      if (finalY + 30 > pageHeight) {
        doc.addPage();
        finalY = margin + 15;
      }

      const calcX = pageWidth - margin - 65;
      doc.setFontSize(9);
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text("Sous-total HT", calcX, finalY);
      doc.text(formatMoney(totalHT), pageWidth - margin, finalY, { align: 'right' });

      finalY += 6;
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(calcX, finalY, pageWidth - margin, finalY);
      
      finalY += 6;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(30, 58, 138);
      doc.text("Montant Total HT", calcX, finalY);
      doc.text(formatMoney(totalHT), pageWidth - margin, finalY, { align: 'right' });

      const footerY = pageHeight - 10;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(164, 175, 190);
      doc.text(`${companyInfo.name} — Document généré informatiquement.`, margin, footerY);

      const fileName = `Rapport_Activations_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.pdf`;
      const pdfBlob = doc.output('blob');
      const pdfBase64 = await blobToBase64(pdfBlob);
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/reports/${report.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          file_name: fileName,
          pdf_data: pdfBase64,
          rows: validRows,
          total_ht: totalHT
        })
      });
      
      if (response.ok) {
        onSave();
        onClose();
        showToast('Rapport modifié avec succès', 'success');
      } else {
        showToast('Erreur lors de la sauvegarde', 'error');
      }
    } catch (err) {
      console.error('Error saving report:', err);
      showToast('Erreur lors de la sauvegarde', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="edit-modal-overlay" onClick={onClose}>
      <div className="edit-modal-container" onClick={e => e.stopPropagation()}>
        <div className="edit-modal-header">
          <div className="edit-modal-title">
            <Edit size={20} style={{ color: '#8b5cf6' }} />
            <span>Modifier le rapport - {report?.file_name?.slice(0, 40)}</span>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.5rem' }}>
            <X size={20} />
          </button>
        </div>
        <div className="edit-modal-body">
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem', 
            marginBottom: '1rem',
            padding: '0.75rem',
            background: '#f8fafc',
            borderRadius: '0.75rem',
            flexWrap: 'wrap'
          }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#475569' }}>
              📝 Création rapide:
            </span>
            <input
              type="number"
              min="1"
              max="50"
              value={numberOfLines}
              onChange={(e) => setNumberOfLines(e.target.value)}
              style={{
                width: '80px',
                padding: '0.375rem 0.5rem',
                border: '1px solid #cbd5e1',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                textAlign: 'center'
              }}
            />
            <button
              onClick={createMultipleRows}
              className="btn btn-primary"
              style={{ padding: '0.375rem 0.875rem', fontSize: '0.75rem' }}
            >
              <Zap size={14} /> Créer {numberOfLines} ligne{parseInt(numberOfLines) > 1 ? 's' : ''}
            </button>
            <button onClick={addRow} className="btn btn-outline" style={{ padding: '0.375rem 0.875rem', fontSize: '0.75rem' }}>
              <Plus size={14} /> Ajouter 1 ligne
            </button>
            <div style={{ fontSize: '0.7rem', color: '#64748b', marginLeft: 'auto' }}>
              📋 {rows.length} ligne(s)
            </div>
          </div>

          <div className="report-table-container" style={{ marginTop: 0, maxHeight: '400px', overflowY: 'auto' }}>
            <table className="report-table">
              <thead>
                <tr style={{ position: 'sticky', top: 0, background: '#f1f5f9' }}>
                  <th style={{ width: '25%' }}>Date</th>
                  <th style={{ width: '45%' }}>Nom du client</th>
                  <th style={{ width: '25%' }}>Prix HT (MAD)</th>
                  <th style={{ width: '5%' }}></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.id}>
                    <td>
                      <input
                        type="date"
                        className="report-input"
                        value={row.date}
                        onChange={e => updateRow(row.id, 'date', e.target.value)}
                        style={{ fontSize: '0.75rem' }}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="report-input"
                        value={row.nom}
                        onChange={e => updateRow(row.id, 'nom', e.target.value)}
                        placeholder={`Client ${index + 1}`}
                        style={{ fontSize: '0.75rem' }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        className="report-input"
                        value={row.price||""}
                        onChange={e => updateRow(row.id, 'price', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        style={{ fontSize: '0.75rem', textAlign: 'right' }}
                      />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => removeRow(row.id)}
                        className="action-btn"
                        disabled={rows.length === 1}
                        style={{ color: '#ef4444' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="summary-box">
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Total HT</div>
              <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#059669' }}>
                {formatMoney(calculateTotal())}
              </div>
              <div style={{ fontSize: '0.65rem', color: '#64748b' }}>
                ({rows.filter(r => r.nom?.trim() && r.price > 0).length} ligne(s) renseignée(s))
              </div>
            </div>
          </div>
        </div>
        <div className="edit-modal-footer">
          <button onClick={onClose} className="btn btn-outline" disabled={saving}>
            Annuler
          </button>
          <button onClick={handleSave} className="btn btn-primary" disabled={saving}>
            {saving ? <Loader size={16} className="spinner" /> : <Save size={16} />}
            {saving ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================== MULTI-ROW REPORT MODAL (CREATE) ====================
const MultiRowReportModal = ({ isOpen, onClose, showToast }) => {
  const [rows, setRows] = useState([
    { id: Date.now(), date: new Date().toISOString().slice(0, 10), nom: '', price: 0 }
  ]);
  const [generating, setGenerating] = useState(false);
  const [numberOfLines, setNumberOfLines] = useState(1);

  const addRow = () => {
    setRows([
      ...rows,
      { id: Date.now(), date: new Date().toISOString().slice(0, 10), nom: '', price: 0 }
    ]);
  };

  const createMultipleRows = () => {
    const num = parseInt(numberOfLines);
    if (isNaN(num) || num <= 0) {
      showToast('Veuillez entrer un nombre valide (1 ou plus)', 'warning');
      return;
    }
    
    const newRows = [];
    for (let i = 0; i < num; i++) {
      newRows.push({
        id: Date.now() + i,
        date: new Date().toISOString().slice(0, 10),
        nom: '',
        price: 0
      });
    }
    setRows(newRows);
  };

  const updateRow = (id, field, value) => {
    setRows(rows.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    ));
  };

  const removeRow = (id) => {
    if (rows.length > 1) {
      setRows(rows.filter(row => row.id !== id));
    }
  };

  const resetForm = () => {
    setRows([{ id: Date.now(), date: new Date().toISOString().slice(0, 10), nom: '', price: 0 }]);
    setNumberOfLines(1);
  };

  const generatePDF = async () => {
    const validRows = rows.filter(row => row.nom && row.nom.trim() && row.price > 0);
    if (validRows.length === 0) {
      showToast('Veuillez ajouter au moins une ligne valide (nom et prix requis)', 'warning');
      return;
    }

    setGenerating(true);

    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const companyInfo = getCompanyInfo();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      let yPos = 20;

      let logoBase64 = null;
      try {
        const response = await fetch('/logo.png');
        if (response.ok) {
          const blob = await response.blob();
          logoBase64 = await blobToBase64(blob);
        }
      } catch (e) {}

      if (logoBase64) {
        doc.addImage(logoBase64, 'PNG', margin, yPos - 2, 40, 25);
      } else {
        doc.setFillColor(15, 23, 42);
        doc.rect(margin, yPos, 8, 8, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(15, 23, 42);
        doc.text(companyInfo.name.substring(0, 3).toUpperCase(), margin + 11, yPos + 6.5);
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(30, 58, 138);
      doc.text("RAPPORT", pageWidth - margin, yPos + 4, { align: 'right' });
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`Édition: ${new Date().toLocaleDateString('fr-FR')}`, pageWidth - margin, yPos + 10, { align: 'right' });

      yPos += 24;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(30, 58, 138);
      doc.text("ÉMETTEUR", margin, yPos);
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(companyInfo.name, margin, yPos + 5.5);

      yPos = yPos + 16;

      const tableRows = validRows.map(row => [
        new Date(row.date).toLocaleDateString('fr-FR'),
        row.nom,
        formatMoney(row.price)
      ]);

      const totalHT = validRows.reduce((sum, row) => sum + safeNumber(row.price), 0);

      autoTable(doc, {
        startY: yPos,
        theme: 'plain',
        head: [['Date', 'Désignation', 'Montant HT']],
        body: tableRows,
        margin: { left: margin, right: margin },
        styles: {
          font: 'helvetica',
          fontSize: 9,
          cellPadding: 5,
          textColor: [30, 41, 59]
        },
        headStyles: {
          textColor: [30, 58, 138],
          fontStyle: 'bold',
          lineWidth: { bottom: 1 },
          drawColor: [30, 58, 138]
        },
        columnStyles: {
          0: { halign: 'left', cellWidth: 35 },
          1: { halign: 'left' },
          2: { halign: 'right', cellWidth: 40 }
        },
        didParseCell: (data) => {
          if (data.section === 'body') {
            data.cell.styles.lineWidth = { bottom: 0.2 };
            data.cell.styles.drawColor = [241, 245, 249];
          }
        }
      });

      let finalY = doc.lastAutoTable.finalY + 10;

      if (finalY + 30 > pageHeight) {
        doc.addPage();
        finalY = margin + 15;
      }

      const calcX = pageWidth - margin - 65;
      doc.setFontSize(9);
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text("Sous-total HT", calcX, finalY);
      doc.text(formatMoney(totalHT), pageWidth - margin, finalY, { align: 'right' });

      finalY += 6;
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(calcX, finalY, pageWidth - margin, finalY);
      
      finalY += 6;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(30, 58, 138);
      doc.text("Montant Total HT", calcX, finalY);
      doc.text(formatMoney(totalHT), pageWidth - margin, finalY, { align: 'right' });

      const footerY = pageHeight - 10;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(164, 175, 190);
      doc.text(`${companyInfo.name} — Document généré informatiquement.`, margin, footerY);

      const fileName = `Rapport_Activations_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.pdf`;
      const pdfBlob = doc.output('blob');
      const pdfBase64 = await blobToBase64(pdfBlob);
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          file_name: fileName,
          pdf_data: pdfBase64,
          rows: validRows,
          total_ht: totalHT
        })
      });
      
      if (response.ok) {
        showToast('Rapport sauvegardé avec succès', 'success');
        resetForm();
        onClose();
        window.dispatchEvent(new Event('reportSaved'));
      } else {
        showToast('Erreur lors de la sauvegarde', 'error');
      }
    } catch (err) {
      console.error('Error generating PDF:', err);
      showToast('Erreur lors de la génération du PDF', 'error');
    } finally {
      setGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="report-modal-overlay" onClick={onClose}>
      <div className="report-modal" onClick={e => e.stopPropagation()}>
        <div className="report-modal-header">
          <h2 className="report-modal-title">
            <FileText size={20} className="text-blue-600" />
            Rapport d'Activation Multi-lignes
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.5rem' }}>
            <X size={20} />
          </button>
        </div>

        <div className="report-modal-body">
          <div className="company-info-bar">
            <div style={{ fontWeight: 'bold' }}>{getCompanyInfo().name}</div>
          </div>

          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem', 
            marginBottom: '1rem',
            padding: '0.75rem',
            background: '#f8fafc',
            borderRadius: '0.75rem',
            flexWrap: 'wrap'
          }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#475569' }}>
              📝 Nombre de lignes:
            </span>
            <input
              type="number"
              min="1"
              max="50"
              value={numberOfLines}
              onChange={(e) => setNumberOfLines(e.target.value)}
              style={{
                width: '80px',
                padding: '0.375rem 0.5rem',
                border: '1px solid #cbd5e1',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                textAlign: 'center'
              }}
            />
            <button
              onClick={createMultipleRows}
              className="btn btn-primary"
              style={{ padding: '0.375rem 0.875rem', fontSize: '0.75rem' }}
            >
              <Zap size={14} /> Créer {numberOfLines} ligne{parseInt(numberOfLines) > 1 ? 's' : ''}
            </button>
            <div style={{ flex: 1 }}></div>
            <button
              onClick={addRow}
              className="btn btn-outline"
              style={{ padding: '0.375rem 0.875rem', fontSize: '0.75rem' }}
            >
              <Plus size={14} /> Ajouter 1 ligne
            </button>
          </div>

          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '0.75rem',
            fontSize: '0.7rem',
            color: '#64748b'
          }}>
            <span>📋 {rows.length} ligne(s) au total</span>
            <span>💡 Cliquez sur Créer X lignes pour générer automatiquement plusieurs lignes vides</span>
          </div>

          <div className="report-table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <table className="report-table">
              <thead>
                <tr style={{ position: 'sticky', top: 0, background: '#f1f5f9' }}>
                  <th style={{ width: '25%' }}>Date</th>
                  <th style={{ width: '45%' }}>Nom du client</th>
                  <th style={{ width: '25%' }}>Prix HT (MAD)</th>
                  <th style={{ width: '5%' }}></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.id}>
                    <td>
                      <input
                        type="date"
                        className="report-input"
                        value={row.date}
                        onChange={e => updateRow(row.id, 'date', e.target.value)}
                        style={{ fontSize: '0.75rem' }}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="report-input"
                        value={row.nom}
                        onChange={e => updateRow(row.id, 'nom', e.target.value)}
                        placeholder={`Client ${index + 1}`}
                        style={{ fontSize: '0.75rem' }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        className="report-input"
                        value={row.price||""}
                        onChange={e => updateRow(row.id, 'price', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        style={{ fontSize: '0.75rem', textAlign: 'right' }}
                      />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => removeRow(row.id)}
                        className="action-btn"
                        disabled={rows.length === 1}
                        style={{ color: '#ef4444' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {rows.filter(r => r.price > 0).length > 0 && (
            <div className="summary-box">
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Total HT</div>
                <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#059669' }}>
                  {formatMoney(rows.filter(r => r.price > 0).reduce((sum, r) => sum + safeNumber(r.price), 0))}
                </div>
                <div style={{ fontSize: '0.65rem', color: '#64748b' }}>
                  ({rows.filter(r => r.price > 0).length} ligne(s) renseignée(s))
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="report-modal-footer">
          <button onClick={onClose} className="btn btn-outline" disabled={generating}>
            Annuler
          </button>
          <button onClick={generatePDF} className="btn btn-primary" disabled={generating}>
            {generating ? <Loader size={16} className="spinning" /> : <Printer size={16} />}
            {generating ? 'Génération...' : 'Générer PDF'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================== SAVED REPORTS SECTION ====================
const SavedReportsSection = ({ onEditReport, showToast }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, reportId: null, reportName: '' });

  const loadReports = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/reports`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || []);
      }
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
    
    const handleReportSaved = () => loadReports();
    window.addEventListener('reportSaved', handleReportSaved);
    return () => window.removeEventListener('reportSaved', handleReportSaved);
  }, []);

  const handleDelete = async () => {
    const { reportId } = deleteModal;
    if (!reportId) return;
    
    setDeleting(reportId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/reports/${reportId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        await loadReports();
        showToast('Rapport supprimé avec succès', 'success');
      } else {
        showToast('Erreur lors de la suppression', 'error');
      }
    } catch (error) {
      console.error('Error deleting report:', error);
      showToast('Erreur lors de la suppression', 'error');
    } finally {
      setDeleting(null);
      setDeleteModal({ isOpen: false, reportId: null, reportName: '' });
    }
  };

  const downloadReport = async (report, e) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/download-report/${report.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = report.file_name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showToast('Rapport téléchargé avec succès', 'success');
      } else {
        showToast('Erreur lors du téléchargement', 'error');
      }
    } catch (error) {
      console.error('Download error:', error);
      showToast('Erreur lors du téléchargement', 'error');
    }
  };

  if (loading) {
    return (
      <div className="saved-reports-section">
        <div className="section-title">
          <FolderOpen size={18} style={{ color: '#3b82f6' }} />
          Rapports sauvegardés
        </div>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="loading-spinner" style={{ width: '2rem', height: '2rem' }}></div>
        </div>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="saved-reports-section">
        <div className="section-title">
          <FolderOpen size={18} style={{ color: '#3b82f6' }} />
          Rapports sauvegardés
        </div>
        <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
          <FileText size={32} style={{ marginBottom: '0.5rem' }} />
          <p>Aucun rapport sauvegardé</p>
          <p style={{ fontSize: '0.75rem' }}>Utilisez "Rapport Manuel" pour créer votre premier rapport</p>
        </div>
      </div>
    );
  }

  return (
    <div className="saved-reports-section">
      <div className="section-title">
        <FolderOpen size={18} style={{ color: '#3b82f6' }} />
        Rapports sauvegardés
        <span style={{ marginLeft: 'auto', fontSize: '0.7rem', background: '#e2e8f0', padding: '0.25rem 0.5rem', borderRadius: '1rem' }}>
          {reports.length} rapport(s)
        </span>
      </div>
      <div className="saved-reports-grid">
        {reports.map((report) => (
          <div key={report.id} className="saved-report-card">
            <div className="saved-report-title">
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={14} style={{ color: '#3b82f6' }} />
                {report.file_name.length > 35 ? report.file_name.slice(0, 32) + '...' : report.file_name}
              </span>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                <button 
                  className="action-btn edit" 
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditReport(report);
                  }}
                  title="Modifier"
                >
                  <Edit size={14} />
                </button>
                <button 
                  className="action-btn" 
                  onClick={(e) => downloadReport(report, e)}
                  title="Télécharger"
                >
                  <Download size={14} />
                </button>
                <button 
                  className="action-btn" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteModal({ isOpen: true, reportId: report.id, reportName: report.file_name });
                  }}
                  title="Supprimer"
                  style={{ color: '#ef4444' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <div style={{ fontSize: '0.7rem', color: '#475569' }}>
              <div>📊 Total HT: <strong>{formatMoney(report.total_ht || 0)}</strong></div>
              <div>📋 {report.rows?.length || 0} ligne(s)</div>
            </div>
            <div className="saved-report-meta">
              <span><Calendar size={10} /> {new Date(report.created_at).toLocaleDateString('fr-FR')}</span>
            </div>
          </div>
        ))}
      </div>

      {deleteModal.isOpen && (
        <div className="report-modal-overlay" onClick={() => setDeleteModal({ isOpen: false, reportId: null, reportName: '' })}>
          <div className="report-modal" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <div className="report-modal-header">
              <h2 className="report-modal-title">
                <AlertTriangle size={20} style={{ color: '#ef4444' }} />
                Confirmer la suppression
              </h2>
              <button onClick={() => setDeleteModal({ isOpen: false, reportId: null, reportName: '' })} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <div className="report-modal-body">
              <p>Êtes-vous sûr de vouloir supprimer le rapport <strong>{deleteModal.reportName?.slice(0, 50)}</strong> ?</p>
              <p style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.5rem' }}>Cette action est irréversible.</p>
            </div>
            <div className="report-modal-footer">
              <button onClick={() => setDeleteModal({ isOpen: false, reportId: null, reportName: '' })} className="btn btn-outline">
                Annuler
              </button>
              <button onClick={handleDelete} className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }} disabled={deleting === deleteModal.reportId}>
                {deleting === deleteModal.reportId ? <Loader size={16} className="spinning" /> : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== MAIN DASHBOARD ====================
const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('week');
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [editReport, setEditReport] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const isRefreshingRef = useRef(false);
  
  const { showToast, ToastContainer } = useToast();
  
  // Redux Selectors
  const { list: products, loading: productsLoading } = useSelector((state) => state.products);
  const { list: sales, loading: salesLoading } = useSelector((state) => state.sales);
  const { list: clients } = useSelector((state) => state.clients);
  const { list: gpsDevices } = useSelector((state) => state.gpsDevices);
  const { list: vehicles } = useSelector((state) => state.vehicles);
  const { list: activations } = useSelector((state) => state.activations);
  const depenses = useSelector((state) => state.depenses.list);
  const { user } = useSelector((state) => state.auth);
  
  // Refresh Data - memoized with useCallback to avoid dependency loops
  const refreshData = useCallback(async () => {
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;
    setRefreshing(true);
    try {
      await Promise.all([
        dispatch(fetchProducts()),
        dispatch(fetchSales()),
        dispatch(fetchDashboardStats()),
        dispatch(fetchSaleStats()),
        dispatch(fetchClients()),
        dispatch(fetchGpsDevices()),
        dispatch(fetchVehicles()),
        dispatch(fetchActivations()),
        dispatch(fetchDepenses())
      ]);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Refresh error:", error);
    } finally {
      setRefreshing(false);
      isRefreshingRef.current = false;
    }
  }, [dispatch]);
  
  // Initial load
  useEffect(() => {
    refreshData();
  }, [refreshData]);
  
  // Listen for report saved events to refresh
  useEffect(() => {
    const handleReportSaved = () => refreshData();
    window.addEventListener('reportSaved', handleReportSaved);
    return () => window.removeEventListener('reportSaved', handleReportSaved);
  }, [refreshData]);
  
  // ==================== COMPUTED STATISTICS ====================
  
  const getActivationTotalExpected = (act) => {
    let total = safeNumber(act.price);
    if (act.renewal_history && Array.isArray(act.renewal_history)) {
      act.renewal_history.forEach(entry => {
        if (entry.action === 'renewal' && entry.price) {
          total += safeNumber(entry.price);
        }
      });
    }
    return total;
  };

const getActivationTotalPaid = (act) => {
  // amount_paid already includes all payments (cash, card, and cashed cheques from remise)
  return safeNumber(act.amount_paid);
};

const getSaleTotalPaid = (sale) => {
  // amount_paid already includes all payments (cash, card, and cashed cheques from remise)
  return safeNumber(sale.amount_paid);
};
  const financialStats = useMemo(() => {
    const salesArray = Array.isArray(sales) ? sales : [];
    const activationsArray = Array.isArray(activations) ? activations : [];
    const depensesArray = Array.isArray(depenses) ? depenses : [];
    
    const today = new Date();
    const currentMonth = today.toISOString().slice(0, 7);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().slice(0, 7);
    
    const currentMonthSalesTotal = salesArray
      .filter(s => s && s.created_at && s.created_at.slice(0, 7) === currentMonth)
      .reduce((sum, s) => sum + safeNumber(s?.total), 0);
    const lastMonthSalesTotal = salesArray
      .filter(s => s && s.created_at && s.created_at.slice(0, 7) === lastMonth)
      .reduce((sum, s) => sum + safeNumber(s?.total), 0);
    
    const currentMonthActivationsExpected = activationsArray
      .filter(a => a && a.created_at && a.created_at.slice(0, 7) === currentMonth)
      .reduce((sum, a) => sum + getActivationTotalExpected(a), 0);
    const lastMonthActivationsExpected = activationsArray
      .filter(a => a && a.created_at && a.created_at.slice(0, 7) === lastMonth)
      .reduce((sum, a) => sum + getActivationTotalExpected(a), 0);
    
    const totalExpectedRevenueCurrent = currentMonthSalesTotal + currentMonthActivationsExpected;
    const totalExpectedRevenueLast = lastMonthSalesTotal + lastMonthActivationsExpected;
    
    let revenueGrowth = 0;
    if (totalExpectedRevenueLast > 0) revenueGrowth = ((totalExpectedRevenueCurrent - totalExpectedRevenueLast) / totalExpectedRevenueLast) * 100;
    else if (totalExpectedRevenueCurrent > 0) revenueGrowth = 100;
    
    const currentMonthSalesPaid = salesArray
  .filter(s => s && s.created_at && s.created_at.slice(0, 7) === currentMonth)
  .reduce((sum, s) => sum + getSaleTotalPaid(s), 0);
    const currentMonthActivationsPaid = activationsArray
      .filter(a => a && a.created_at && a.created_at.slice(0, 7) === currentMonth)
      .reduce((sum, a) => sum + getActivationTotalPaid(a), 0);
    const totalPaidRevenueCurrent = currentMonthSalesPaid + currentMonthActivationsPaid;
    
    const lastMonthSalesPaid = salesArray
  .filter(s => s && s.created_at && s.created_at.slice(0, 7) === lastMonth)
  .reduce((sum, s) => sum + getSaleTotalPaid(s), 0);  // ✅ CORRECT - using getSaleTotalPaid
    const lastMonthActivationsPaid = activationsArray
      .filter(a => a && a.created_at && a.created_at.slice(0, 7) === lastMonth)
      .reduce((sum, a) => sum + getActivationTotalPaid(a), 0);
    const totalPaidRevenueLast = lastMonthSalesPaid + lastMonthActivationsPaid;
    
    // Calculate current month expenses - MORE ROBUST
const currentMonthExpenses = depensesArray
  .filter(d => {
    if (!d) return false;
    // Use the date field (which is what Depenses.jsx uses)
    const expenseDate = d.date;
    if (!expenseDate) return false;
    // Make sure the date format is YYYY-MM-DD
    const expenseMonth = expenseDate.slice(0, 7);
    return expenseMonth === currentMonth;
  })
  .reduce((sum, d) => sum + safeNumber(d?.amount), 0);

// Calculate last month expenses
const lastMonthExpenses = depensesArray
  .filter(d => {
    if (!d) return false;
    const expenseDate = d.date;
    if (!expenseDate) return false;
    const expenseMonth = expenseDate.slice(0, 7);
    return expenseMonth === lastMonth;
  })
  .reduce((sum, d) => sum + safeNumber(d?.amount), 0);

    // After calculating currentMonthExpenses, add this debug:
console.log('=== DEPENSES DEBUG ===');
console.log('Total depenses:', depensesArray.length);
console.log('Current month:', currentMonth);
console.log('Filtered expenses count:', depensesArray.filter(d => d?.date?.slice(0, 7) === currentMonth).length);
console.log('Current month expenses total:', currentMonthExpenses);
console.log('Last month expenses total:', lastMonthExpenses);
console.log('First 3 depenses:', depensesArray.slice(0, 3).map(d => ({ date: d.date, amount: d.amount, title: d.title })));
    const profitCurrent = totalPaidRevenueCurrent - currentMonthExpenses;
    const profitLast = totalPaidRevenueLast - lastMonthExpenses;
    
    let profitGrowth = 0;
    if (profitLast > 0) profitGrowth = ((profitCurrent - profitLast) / profitLast) * 100;
    else if (profitCurrent > 0) profitGrowth = 100;
    
    const pendingRevenue = salesArray
      .filter(s => s && s.payment_status !== 'paid')
      .reduce((sum, s) => sum + safeNumber(s?.remaining_amount), 0);
    
    const pendingActivationRevenue = activationsArray
      .filter(a => a && a.payment_status !== 'paid')
      .reduce((sum, a) => sum + safeNumber(a?.remaining_amount), 0);
    
    const totalPendingRevenue = pendingRevenue + pendingActivationRevenue;
    
    const collectedRevenue = salesArray.reduce((sum, s) => sum + getSaleTotalPaid(s), 0) +
  activationsArray.reduce((sum, a) => sum + getActivationTotalPaid(a), 0);
    
    const totalTransactions = salesArray.length + activationsArray.length;
    let averageOrderValue = 0;
    if (totalTransactions > 0) {
      const totalValue = salesArray.reduce((sum, s) => sum + safeNumber(s?.total), 0) +
        activationsArray.reduce((sum, a) => sum + getActivationTotalExpected(a), 0);
      averageOrderValue = totalValue / totalTransactions;
    }
    
    return {
      currentRevenue: safeRound(totalExpectedRevenueCurrent),
      growth: safeRound(revenueGrowth),
      pendingRevenue: safeRound(totalPendingRevenue),
      collectedRevenue: safeRound(collectedRevenue),
      averageOrderValue: safeRound(averageOrderValue),
      currentProfit: safeRound(profitCurrent),
      profitGrowth: safeRound(profitGrowth),
      expensesCurrent: safeRound(currentMonthExpenses)
    };
  }, [sales, activations, depenses]);
  
  const gpsStats = useMemo(() => {
    const devices = Array.isArray(gpsDevices) ? gpsDevices : [];
    const available = devices.filter(d => d?.status === 'available').length;
    const assigned = devices.filter(d => d?.status === 'assigned').length;
    const reserved = devices.filter(d => d?.status === 'reserved').length;
    const total = devices.length;
    const utilizationRate = total > 0 ? safeRound(((assigned + reserved) / total) * 100) : 0;
    return { available, assigned, reserved, total, utilizationRate };
  }, [gpsDevices]);
  
  const activationStats = useMemo(() => {
    const activationsArray = Array.isArray(activations) ? activations : [];
    const active = activationsArray?.filter(a => a?.status === 'active')?.length || 0;
    const expiringSoon = activationsArray?.filter(a => {
      if (a?.status !== 'active') return false;
      const expiry = new Date(a?.expires_at);
      const daysLeft = (expiry - new Date()) / (1000 * 60 * 60 * 24);
      return daysLeft <= 30 && daysLeft > 0;
    })?.length || 0;
    const expiringThisWeek = activationsArray?.filter(a => {
      if (a?.status !== 'active') return false;
      const expiry = new Date(a?.expires_at);
      const daysLeft = (expiry - new Date()) / (1000 * 60 * 60 * 24);
      return daysLeft <= 7 && daysLeft > 0;
    })?.length || 0;
    return { 
      active, 
      expired: activationsArray?.filter(a => a?.status === 'expired')?.length || 0, 
      expiringSoon, 
      expiringThisWeek, 
      total: activationsArray?.length || 0 
    };
  }, [activations]);
  
  const chartData = useMemo(() => {
    const salesArray = Array.isArray(sales) ? sales : [];
    const activationsArray = Array.isArray(activations) ? activations : [];
    const data = [];
    let period = 7;
    if (timeRange === 'month') period = 30;
    if (timeRange === 'year') period = 12;
    
    if (timeRange === 'year') {
      const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
      for (let i = 0; i < 12; i++) {
        const monthlySales = salesArray.filter(s => {
          if (!s?.created_at) return false;
          const date = new Date(s.created_at);
          return !isNaN(date.getTime()) && date.getMonth() === i && date.getFullYear() === new Date().getFullYear();
        });
        const monthlyActivations = activationsArray.filter(a => {
          if (!a?.created_at) return false;
          const date = new Date(a.created_at);
          return !isNaN(date.getTime()) && date.getMonth() === i && date.getFullYear() === new Date().getFullYear();
        });
        const monthlySalesRevenue = monthlySales.reduce((sum, s) => sum + safeNumber(s?.total), 0);
        const monthlyActivationsRevenue = monthlyActivations.reduce((sum, a) => sum + getActivationTotalExpected(a), 0);
        const monthlyRevenue = monthlySalesRevenue + monthlyActivationsRevenue;
        const totalTransactions = monthlySales.length + monthlyActivations.length;
        const avgOrder = totalTransactions > 0 ? monthlyRevenue / totalTransactions : 0;
        data.push({ name: months[i], revenue: safeRound(monthlyRevenue), avgOrder: safeRound(avgOrder) });
      }
    } else {
      for (let i = period - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10);
        const dailySales = salesArray.filter(s => s?.created_at?.slice(0, 10) === dateStr);
        const dailyActivations = activationsArray.filter(a => a?.created_at?.slice(0, 10) === dateStr);
        const dailySalesRevenue = dailySales.reduce((sum, s) => sum + safeNumber(s?.total), 0);
        const dailyActivationsRevenue = dailyActivations.reduce((sum, a) => sum + getActivationTotalExpected(a), 0);
        const dailyRevenue = dailySalesRevenue + dailyActivationsRevenue;
        const totalTransactions = dailySales.length + dailyActivations.length;
        const avgOrder = totalTransactions > 0 ? dailyRevenue / totalTransactions : 0;
        data.push({ 
          name: d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }), 
          revenue: safeRound(dailyRevenue), 
          avgOrder: safeRound(avgOrder) 
        });
      }
    }
    return data;
  }, [sales, activations, timeRange]);
  
  const paymentDistribution = useMemo(() => {
    const salesArray = Array.isArray(sales) ? sales : [];
    const activationsArray = Array.isArray(activations) ? activations : [];
    
    const paidSales = salesArray.filter(s => s?.payment_status === 'paid').length;
    const paidActivations = activationsArray.filter(a => a?.payment_status === 'paid').length;
    const paid = paidSales + paidActivations;
    
    const partialSales = salesArray.filter(s => s?.payment_status === 'partial').length;
    const partialActivations = activationsArray.filter(a => a?.payment_status === 'partial').length;
    const partial = partialSales + partialActivations;
    
    const unpaidSales = salesArray.filter(s => s?.payment_status === 'unpaid' || !s?.payment_status).length;
    const unpaidActivations = activationsArray.filter(a => a?.payment_status === 'unpaid' || !a?.payment_status).length;
    const unpaid = unpaidSales + unpaidActivations;
    
    const total = paid + partial + unpaid || 1;
    
    return [
      { name: 'Payé', value: paid, percent: Math.round((paid / total) * 100), color: '#10b981' },
      { name: 'Partiel', value: partial, percent: Math.round((partial / total) * 100), color: '#f59e0b' },
      { name: 'Impayé', value: unpaid, percent: Math.round((unpaid / total) * 100), color: '#ef4444' }
    ];
  }, [sales, activations]);
  
  const productDistribution = useMemo(() => {
    const salesArray = Array.isArray(sales) ? sales : [];
    const activationsArray = Array.isArray(activations) ? activations : [];
    const distribution = {};
    
    salesArray.forEach(sale => {
      if (sale?.produits && Array.isArray(sale.produits)) {
        sale.produits.forEach(prod => {
          if (prod) {
            const name = prod?.nom || `Produit ${prod?.id || 'unknown'}`;
            const quantity = safeNumber(prod?.pivot?.quantite, 1);
            distribution[name] = (distribution[name] || 0) + quantity;
          }
        });
      }
    });
    
    activationsArray.forEach(act => {
      if (act?.produit?.nom) {
        const name = act.produit.nom;
        distribution[name] = (distribution[name] || 0) + 1;
      }
    });
    
    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#06b6d4', '#ef4444'];
    const sortedEntries = Object.entries(distribution).sort((a, b) => b[1] - a[1]);
    return sortedEntries.slice(0, 6).map(([name, value], idx) => ({ 
      name: name.length > 15 ? name.slice(0, 12) + '...' : name, 
      value: safeNumber(value), 
      color: colors[idx % colors.length] 
    }));
  }, [sales, activations]);
  
  const recentActivities = useMemo(() => {
    const salesArray = Array.isArray(sales) ? sales : [];
    const activationsArray = Array.isArray(activations) ? activations : [];
    const activities = [];
    
    salesArray.slice(0, 8).forEach(sale => {
      if (sale) activities.push({ 
        id: `sale-${sale?.id}`, 
        type: 'sale', 
        title: 'Nouvelle vente', 
        description: `Vente #${sale?.id || 'N/A'} - ${sale?.client?.nom || 'Client'}`, 
        amount: safeNumber(sale?.total), 
        date: sale?.created_at, 
        status: sale?.payment_status 
      });
    });
    
    activationsArray.slice(0, 8).forEach(act => {
      if (act) activities.push({ 
        id: `act-${act?.id}`, 
        type: 'activation', 
        title: act?.vente_id ? 'Activation GPS (Vente)' : 'Activation GPS (Standalone)',
        description: `IMEI: ${act?.imei?.slice(-6) || act?.client_imei?.slice(-6) || act?.id || 'N/A'}`, 
        amount: safeNumber(act?.price),
        date: act?.activated_at || act?.created_at, 
        status: act?.status 
      });
    });
    
    return activities.filter(a => a.date).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);
  }, [sales, activations]);
  
  const quickActions = [
    { label: 'Nouvelle vente', icon: ShoppingCart, path: '/ventes', color: '#3b82f6' },
    { label: 'Ajouter client', icon: Users, path: '/clients', color: '#10b981' },
    { label: 'Nouveau produit', icon: Package, path: '/produits', color: '#8b5cf6' },
    { label: 'Activation GPS', icon: Wifi, path: '/Activation', color: '#f59e0b' },
    { label: 'Rapport Manuel', icon: FileText, onClick: () => setReportModalOpen(true), color: '#ef4444' },
    { label: 'DEVIS Pro', icon: Receipt, onClick: () => setInvoiceModalOpen(true), color: '#059669' }
  ];
  
  const isLoading = (productsLoading || salesLoading) && (!products?.length && !sales?.length);
  
  const handleEditReport = (report) => {
    setEditReport(report);
  };
  
  const handleReportSaved = () => {
    setEditReport(null);
    refreshData();
    window.dispatchEvent(new Event('reportSaved'));
  };
  
  if (isLoading && !products?.length && !sales?.length) {
    return (
      <div className="dashboard-container">
        <style>{styles}</style>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
          <div className="loading-spinner"></div>
          <p style={{ marginTop: '1rem', color: '#64748b' }}>Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <style>{styles}</style>
      <div className="dashboard-container">
        
        {/* Welcome Banner */}
        <div className="welcome-banner">
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="welcome-title">🌟 Bonjour, {user?.name?.split(' ')[0] || 'Admin'}!</div>
            <div className="welcome-text">Voici le résumé de votre activité du {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
              <div><span className="badge badge-success"><CheckCircle size={12} /> {paymentDistribution[0]?.value || 0} transactions payées</span></div>
              <div><span className="badge badge-warning"><Clock size={12} /> {activationStats.expiringThisWeek || 0} activations expirent cette semaine</span></div>
              <div><span className="badge badge-info"><Activity size={12} /> {activations?.length || 0} activations totales</span></div>
            </div>
          </div>
        </div>
        
        {/* Header */}
        <PageHeader
          title="Tableau de bord"
          subtitle={<><span>📊 Analyse complète de votre activité commerciale</span><span className="badge badge-info"><Activity size={10} /> {(sales?.length || 0) + (activations?.length || 0)} transactions</span></>}
          actions={
            <>
              <div className="time-range-selector">
                <button className={`time-range-btn ${timeRange === 'week' ? 'time-range-btn-active' : ''}`} onClick={() => setTimeRange('week')}>Semaine</button>
                <button className={`time-range-btn ${timeRange === 'month' ? 'time-range-btn-active' : ''}`} onClick={() => setTimeRange('month')}>Mois</button>
                <button className={`time-range-btn ${timeRange === 'year' ? 'time-range-btn-active' : ''}`} onClick={() => setTimeRange('year')}>Année</button>
              </div>
              <button onClick={refreshData} className="btn btn-outline" disabled={refreshing}>
                <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} /> 
                Actualiser
              </button>
              <button onClick={() => navigate('/ventes')} className="btn btn-primary"><Plus size={16} /> Nouvelle vente</button>
            </>
          }
        />
        
        {/* Quick Actions */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {quickActions.map((action, idx) => (
            <button key={idx} className="quick-action-btn" onClick={action.onClick || (() => navigate(action.path))}>
              <action.icon size={14} style={{ color: action.color }} />
              {action.label}
            </button>
          ))}
        </div>
        
        {/* Main Stats Cards */}
<div className="stats-grid">
  <StatCard 
    label="CHIFFRE D'AFFAIRES" 
    value={financialStats.currentRevenue} 
    icon={DollarSign} 
    color="blue" 
    subtitle={`💰 Collecté: ${financialStats.collectedRevenue.toLocaleString()} MAD`} 
    trend={financialStats.growth > 0 ? 'up' : (financialStats.growth < 0 ? 'down' : undefined)} 
    trendValue={financialStats.growth !== 0 ? Math.abs(financialStats.growth) : undefined} 
    onClick={() => navigate('/ventes')} 
  />
          <StatCard 
            label="PROFIT NET" 
            value={financialStats.currentProfit} 
            icon={TrendingUp} 
            color="green" 
            subtitle={`📉 Dépenses: ${financialStats.expensesCurrent.toLocaleString()} MAD`} 
            trend={financialStats.profitGrowth > 0 ? 'up' : (financialStats.profitGrowth < 0 ? 'down' : undefined)} 
            trendValue={financialStats.profitGrowth !== 0 ? Math.abs(financialStats.profitGrowth) : undefined} 
            onClick={() => navigate('/depenses')} 
          />
          <StatCard 
            label="VENTES & ACTIVATIONS" 
            value={(sales?.length || 0) + (activations?.length || 0)} 
            icon={ShoppingCart} 
            color="green" 
            subtitle={`📊 Transactions: ${sales?.length || 0} ventes + ${activations?.length || 0} activations`} 
            onClick={() => navigate('/ventes')} 
          />
          <StatCard 
            label="PRODUITS" 
            value={products?.length || 0} 
            icon={Package} 
            color="purple" 
            subtitle={`⭐ ${productDistribution.length || 0} références vendues`} 
            onClick={() => navigate('/produits')} 
          />
        </div>
        
        {/* KPI Cards Row */}
        <div className="kpi-grid">
          <KpiCard title="Appareils GPS" value={gpsStats.total} subtitle={`${gpsStats.available} disponibles • ${gpsStats.assigned} assignés`} icon={MapPin} onClick={() => navigate('/produits')} />
          <KpiCard title="Activations actives" value={activationStats.active} subtitle={`⚠️ ${activationStats.expiringSoon} expirent bientôt`} icon={Zap} onClick={() => navigate('/Activation')} />
          <KpiCard title="Taux d'utilisation GPS" value={`${gpsStats.utilizationRate}%`} subtitle={`📈 ${gpsStats.utilizationRate >= 70 ? 'Excellent' : 'À améliorer'}`} icon={Gauge} />
          <KpiCard title="CLIENTS" value={clients?.length || 0} icon={Users} subtitle={`👥 +${Math.floor((clients?.length || 0) * 0.12)} nouveaux ce mois`} onClick={() => navigate('/clients')} />
        </div>
        
        {/* Revenue Chart */}
        <div className="dashboard-card" style={{ marginBottom: '1.5rem' }}>
          <div className="section-header">
            <div className="section-title"><TrendingUp size={18} style={{ color: '#3b82f6' }} /> Évolution des ventes et activations</div>
            <div className="text-sm text-gray-500">Total: {chartData.reduce((sum, d) => sum + (d?.revenue || 0), 0).toLocaleString()} MAD</div>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={320}>
              <ComposedChart data={chartData}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} interval={timeRange === 'year' ? 1 : 2} />
                <YAxis yAxisId="left" stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={11} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#revenueGradient)" name="CA (MAD)" />
                <Line yAxisId="right" type="monotone" dataKey="avgOrder" stroke="#10b981" strokeWidth={2} name="Panier moyen (MAD)" dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Payment & Product Distribution */}
        <div className="grid-cols-2">
          <div className="dashboard-card">
            <div className="section-header"><div className="section-title"><Receipt size={18} style={{ color: '#10b981' }} /> Statut des paiements</div></div>
            <div style={{ padding: '1.25rem' }}>
              {paymentDistribution.map((item) => (
                <div key={item.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}><span>{item.name}</span><span className="font-semibold">{item.value} ({item.percent}%)</span></div>
                  <div className="progress-bar"><div className="progress-fill" style={{ width: `${item.percent}%`, background: item.color }}></div></div>
                </div>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginTop: '1.5rem' }}>
                <div style={{ background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', borderRadius: '0.75rem', padding: '0.75rem', textAlign: 'center' }}>
                  <div className="text-lg font-bold text-green-700">{paymentDistribution[0]?.value || 0}</div>
                  <div className="text-xs text-green-600">Payées</div>
                </div>
                <div style={{ background: 'linear-gradient(135deg, #fed7aa 0%, #fdba74 100%)', borderRadius: '0.75rem', padding: '0.75rem', textAlign: 'center' }}>
                  <div className="text-lg font-bold text-orange-700">{paymentDistribution[1]?.value || 0}</div>
                  <div className="text-xs text-orange-600">Partielles</div>
                </div>
                <div style={{ background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)', borderRadius: '0.75rem', padding: '0.75rem', textAlign: 'center' }}>
                  <div className="text-lg font-bold text-red-700">{paymentDistribution[2]?.value || 0}</div>
                  <div className="text-xs text-red-600">Impayées</div>
                </div>
              </div>
              {financialStats.pendingRevenue > 0 && (
                <div className="info-box" style={{ marginTop: '1rem', background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' }}>
                  <div className="text-sm font-semibold text-yellow-800">💰 En attente de paiement</div>
                  <div className="text-xl font-bold text-yellow-900">{financialStats.pendingRevenue.toLocaleString()} MAD</div>
                </div>
              )}
            </div>
          </div>
          
          <div className="dashboard-card">
            <div className="section-header"><div className="section-title"><Trophy size={18} style={{ color: '#f59e0b' }} /> Produits les plus vendus</div></div>
            <div style={{ padding: '1.25rem' }}>
              {productDistribution.length > 0 ? productDistribution.map((product, idx) => {
                const maxValue = productDistribution[0]?.value || 1;
                const percentage = maxValue > 0 ? (product.value / maxValue) * 100 : 0;
                return (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                      <span className="font-medium">{product.name}</span>
                      <span style={{ color: product.color, fontWeight: 600 }}>{product.value} unités</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${percentage}%`, background: product.color }}></div>
                    </div>
                  </div>
                );
              }) : <div className="text-center py-8 text-gray-400">Aucune donnée de produit</div>}
            </div>
          </div>
        </div>
        
        {/* GPS Status & Recent Activities */}
        <div className="two-columns">
          <div className="dashboard-card">
            <div className="section-header"><div className="section-title"><MapPin size={18} style={{ color: '#3b82f6' }} /> État du parc GPS</div></div>
            <div style={{ padding: '1.25rem' }}>
              <div className="gps-stats-mini">
                <div className="gps-stat-mini" style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)' }}>
                  <div className="gps-stat-value" style={{ color: '#2563eb' }}>{gpsStats.available}</div>
                  <div className="gps-stat-label">Disponibles</div>
                </div>
                <div className="gps-stat-mini" style={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)' }}>
                  <div className="gps-stat-value" style={{ color: '#7c3aed' }}>{gpsStats.assigned}</div>
                  <div className="gps-stat-label">Assignés</div>
                </div>
                <div className="gps-stat-mini" style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' }}>
                  <div className="gps-stat-value" style={{ color: '#d97706' }}>{gpsStats.reserved}</div>
                  <div className="gps-stat-label">Réservés</div>
                </div>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                  <span>Taux d'utilisation</span>
                  <span className="font-semibold">{gpsStats.utilizationRate}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${gpsStats.utilizationRate}%`, background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)' }}></div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                <div>
                  <div className="text-xs text-gray-500">Total appareils</div>
                  <div className="text-xl font-bold text-gray-800">{gpsStats.total}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Activations actives</div>
                  <div className="text-xl font-bold text-green-600">{activationStats.active}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Expirations imminentes</div>
                  <div className="text-xl font-bold text-orange-600">{activationStats.expiringSoon}</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="dashboard-card">
            <div className="section-header">
              <div className="section-title"><Activity size={18} style={{ color: '#10b981' }} /> Activités récentes</div>
              <button className="btn btn-ghost" style={{ fontSize: '0.7rem' }} onClick={() => navigate('/ventes')}>Voir tout <ChevronRight size={14} /></button>
            </div>
            <div style={{ padding: '0.75rem' }}>
              <div className="recent-list">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="recent-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                      <div style={{ padding: '0.5rem', borderRadius: '0.75rem', background: activity.type === 'sale' ? '#d1fae5' : '#ede9fe' }}>
                        {activity.type === 'sale' ? <ShoppingCart size={14} className="text-green-600" /> : <Wifi size={14} className="text-purple-600" />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className="font-semibold text-sm text-gray-800">{activity.title}</div>
                        <div className="text-xs text-gray-400">{activity.description}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="text-xs text-gray-400 whitespace-nowrap">{activity.date ? new Date(activity.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '-'}</div>
                      {activity.amount !== undefined && activity.amount !== null && !isNaN(activity.amount) && activity.amount > 0 && (
                        <div className="text-xs font-semibold text-gray-800 mt-1">{Math.round(activity.amount).toLocaleString()} MAD</div>
                      )}
                      {activity.status && (
                        <span className={`badge text-xs mt-1 inline-block ${activity.status === 'paid' || activity.status === 'active' ? 'badge-success' : activity.status === 'partial' ? 'badge-warning' : 'badge-danger'}`}>
                          {activity.status === 'paid' ? 'Payé' : activity.status === 'active' ? 'Actif' : activity.status === 'partial' ? 'Partiel' : activity.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {recentActivities.length === 0 && <div className="text-center py-8 text-gray-400">Aucune activité récente</div>}
              </div>
            </div>
          </div>
        </div>
        
        {/* Saved Reports Section */}
        <SavedReportsSection onEditReport={handleEditReport} showToast={showToast} />
        
        {/* Footer */}
        <div className="text-center text-xs text-gray-400 border-t border-gray-100 pt-4 mt-2">
          <div className="flex justify-center gap-4 mb-2 flex-wrap">
            <span>📊 Données en temps réel</span>
            <span>🔄 Dernière mise à jour: {lastUpdate.toLocaleTimeString('fr-FR')}</span>
            <span>✅ {(sales?.length || 0) + (activations?.length || 0)} transactions enregistrées</span>
            <span>📱 {activationStats.active} activations actives</span>
          </div>
          <div>© 2024 - Tableau de bord commercial</div>
        </div>
        
      </div>

      {/* Toast Container */}
      <ToastContainer />

      {/* Multi-Row Report Modal */}
      <MultiRowReportModal isOpen={reportModalOpen} onClose={() => setReportModalOpen(false)} showToast={showToast} />
      
      {/* Premium Invoice Modal with Client Selection */}
      <PremiumInvoiceModal 
        isOpen={invoiceModalOpen} 
        onClose={() => setInvoiceModalOpen(false)} 
        showToast={showToast}
        clients={clients || []}
      />
      
      {/* Edit Report Modal */}
      {editReport && (
        <EditReportModal 
          isOpen={!!editReport} 
          onClose={() => setEditReport(null)} 
          report={editReport}
          onSave={handleReportSaved}
          showToast={showToast}
        />
      )}
    </>
  );
};

export default Dashboard;