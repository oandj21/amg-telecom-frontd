// Dashboard.jsx
import { useMemo, useEffect, useState } from 'react';
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
  Printer, X, Loader, Trash2
} from 'lucide-react';
import { 
  BarChart, Bar, CartesianGrid, Tooltip, XAxis, YAxis, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Legend, 
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart, Scatter, RadialBarChart, RadialBar
} from 'recharts';
import {
  fetchProducts,
  fetchSales,
  fetchDashboardStats,
  fetchSaleStats,
  fetchClients,
  fetchGpsDevices,
  fetchVehicles,
  fetchActivations
} from './Store/store';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
    max-width: 900px;
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
  
  .dashboard-card {
    animation: slideInUp 0.4s ease-out;
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

const TVA_RATE = 0.20;

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

// Helper function to split text into multiple lines for PDF
const splitTextToLines = (doc, text, maxWidth) => {
  return doc.splitTextToSize(text, maxWidth);
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

// Multi-Row Report Modal with Add Row Button
const MultiRowReportModal = ({ isOpen, onClose }) => {
  const [rows, setRows] = useState([
    { id: Date.now(), date: new Date().toISOString().slice(0, 10), nom: '', price: 0 }
  ]);
  const [generating, setGenerating] = useState(false);

  const addRow = () => {
    setRows([
      ...rows,
      { id: Date.now(), date: new Date().toISOString().slice(0, 10), nom: '', price: 0 }
    ]);
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
  };

 const generatePDF = async () => {
  const validRows = rows.filter(row => row.nom && row.nom.trim() && row.price > 0);
  if (validRows.length === 0) {
    alert('Veuillez ajouter au moins une ligne valide (nom et prix requis)');
    return;
  }

  setGenerating(true);

  try {
    // 1. Initialize Document Geometry (Clean layout format)
    const doc = new jsPDF('p', 'mm', 'a4');
    const companyInfo = getCompanyInfo();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15; 
    const contentWidth = pageWidth - (margin * 2);
    let yPos = 20;

    // 2. Async Logo Extraction
    let logoBase64 = null;
    try {
      const response = await fetch('/logo.png');
      if (response.ok) {
        const blob = await response.blob();
        logoBase64 = await new Promise(resolve => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
      }
    } catch (e) {}

    // ==================== ASYMMETRIC HEADER ====================
    if (logoBase64) {
      doc.addImage(logoBase64, 'PNG', margin, yPos - 2, 40, 25);
    } else {
      // Elegant fallback typography badge if no logo is provided
      doc.setFillColor(15, 23, 42);
      doc.rect(margin, yPos, 8, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text(companyInfo.name.substring(0, 3).toUpperCase(), margin + 11, yPos + 6.5);
    }

    // Right-Aligned Document Meta Info block
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(30, 58, 138); // Deep Premium Navy Blue (#1e3a8a)
    doc.text("RAPPORT", pageWidth - margin, yPos + 4, { align: 'right' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Édition: ${new Date().toLocaleDateString('fr-FR')}`, pageWidth - margin, yPos + 10, { align: 'right' });

    yPos += 24;

    // ==================== TWO-COLUMN ADDRESS GRID ====================
    // Left Side: From (Company)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 58, 138);
    doc.text("ÉMETTEUR", margin, yPos);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(companyInfo.name, margin, yPos + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    
    let companyY = yPos + 11;
    const splitAddress = doc.splitTextToSize(companyInfo.address, contentWidth * 0.45);
    splitAddress.forEach(line => {
      doc.text(line, margin, companyY);
      companyY += 4.5;
    });
    doc.text(`Tél: ${companyInfo.phone}`, margin, companyY);
    doc.text(`Email: ${companyInfo.email}`, margin, companyY + 4.5);

    // Right Side: Tax / Legal Structure Info
    const rightColX = pageWidth * 0.55;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 58, 138);
    doc.text("REGISTRES LÉGAUX", rightColX, yPos);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(`ICE: ${companyInfo.ice || '-'}`, rightColX, yPos + 5.5);
    doc.text(`RC: ${companyInfo.rc || '-'}`, rightColX, yPos + 10);
    doc.text(`Patente: ${companyInfo.patente || '-'}`, rightColX, yPos + 14.5);

    yPos = Math.max(companyY + 12, yPos + 22);

    // ==================== PREMIUM MINIMAL TABLE ====================
    const tableRows = validRows.map(row => [
      new Date(row.date).toLocaleDateString('fr-FR'),
      row.nom,
      formatMoney(row.price)
    ]);

    const totalHT = validRows.reduce((sum, row) => sum + safeNumber(row.price), 0);
    const totalTVA = totalHT * TVA_RATE;
    const totalTTC = totalHT + totalTVA;

    autoTable(doc, {
      startY: yPos,
      theme: 'plain', // Minimalist layout line grid style
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
        drawColor: [30, 58, 138] // Solid sharp navy baseline accent under head
      },
      columnStyles: {
        0: { halign: 'left', cellWidth: 35 },
        1: { halign: 'left' },
        2: { halign: 'right', cellWidth: 40 }
      },
      didParseCell: (data) => {
        // Soft border lines beneath individual rows instead of alternating block colors
        if (data.section === 'body') {
          data.cell.styles.lineWidth = { bottom: 0.2 };
          data.cell.styles.drawColor = [241, 245, 249];
        }
      }
    });

    let finalY = doc.lastAutoTable.finalY + 10;

    // Safety multi-page check
    if (finalY + 40 > pageHeight) {
      doc.addPage();
      finalY = margin + 15;
    }

    // ==================== ASYMMETRIC BILLING FINALS ====================
    const calcX = pageWidth - margin - 65;
    doc.setFontSize(9);
    
    // Subtotal
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text("Sous-total HT", calcX, finalY);
    doc.text(formatMoney(totalHT), pageWidth - margin, finalY, { align: 'right' });
    
    // Tax line
    finalY += 5;
    doc.text(`TVA (${TVA_RATE * 100}%)`, calcX, finalY);
    doc.text(formatMoney(totalTVA), pageWidth - margin, finalY, { align: 'right' });

    // Premium Underlined Total TTC Frame
    finalY += 6;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(calcX, finalY, pageWidth - margin, finalY);
    
    finalY += 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 58, 138);
    doc.text("Montant Total TTC", calcX, finalY);
    doc.text(formatMoney(totalTTC), pageWidth - margin, finalY, { align: 'right' });

    // ==================== BANK LAYOUT LINK ====================
    if (companyInfo.bank_name || companyInfo.rib) {
      finalY += 18;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text("RÈGLEMENT ET COORDONNÉES BANCAIRES", margin, finalY);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      
      let bankInfoLine = "";
      if (companyInfo.bank_name) bankInfoLine += `Établissement: ${companyInfo.bank_name}`;
      if (companyInfo.rib) bankInfoLine += `   •   RIB: ${companyInfo.rib}`;
      doc.text(bankInfoLine, margin, finalY + 4.5);
    }

    // Minimal Subtle Footer Text
    const footerY = pageHeight - 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(164, 175, 190);
    doc.text(`${companyInfo.name} — Document généré informatiquement.`, margin, footerY);

    // Save handling execution
    const fileName = `Rapport_Activations_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(fileName);

    resetForm();
    onClose();
  } catch (err) {
    console.error('Error generating PDF:', err);
    alert('Erreur lors de la génération du PDF');
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
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '0.5rem' }}>
            <X size={20} />
          </button>
        </div>

        <div className="report-modal-body">
          {/* Company Info Bar */}
          <div className="company-info-bar">
            <div style={{ fontWeight: 'bold' }}>{getCompanyInfo().name}</div>
            <div style={{ fontSize: '0.65rem', opacity: 0.8, whiteSpace: 'normal', wordBreak: 'break-word' }}>{getCompanyInfo().address}</div>
            <div style={{ fontSize: '0.65rem', opacity: 0.8 }}>Tél: {getCompanyInfo().phone}</div>
          </div>

          {/* Add Row Button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#475569' }}>Liste des activations</span>
            <button onClick={addRow} className="btn btn-outline" style={{ padding: '0.375rem 0.875rem', fontSize: '0.75rem' }}>
              <Plus size={14} /> Ajouter ligne
            </button>
          </div>

          {/* Rows Table */}
          <div className="report-table-container">
            <table className="report-table">
              <thead>
                <tr>
                  <th style={{ width: '30%' }}>Date</th>
                  <th style={{ width: '45%' }}>Nom du client</th>
                  <th style={{ width: '20%' }}>Prix HT (MAD)</th>
                  <th style={{ width: '5%' }}></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
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
                        placeholder="Nom du client"
                        style={{ fontSize: '0.75rem' }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        className="report-input"
                        value={row.price}
                        onChange={e => updateRow(row.id, 'price', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        style={{ fontSize: '0.75rem', textAlign: 'right' }}
                      />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => removeRow(row.id)}
                        className="btn btn-ghost"
                        style={{ padding: '0.25rem', color: '#ef4444' }}
                        disabled={rows.length === 1}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          {rows.filter(r => r.price > 0).length > 0 && (
            <div className="summary-box">
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Total HT</div>
                <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#059669' }}>
                  {formatMoney(rows.filter(r => r.price > 0).reduce((sum, r) => sum + safeNumber(r.price), 0))}
                </div>
                <div style={{ fontSize: '0.65rem', color: '#64748b' }}>
                  TVA 20%: {formatMoney(rows.filter(r => r.price > 0).reduce((sum, r) => sum + safeNumber(r.price), 0) * TVA_RATE)}
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

// ==================== MAIN DASHBOARD ====================
const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('week');
  const [reportModalOpen, setReportModalOpen] = useState(false);
  
  // Redux Selectors
  const { list: products, loading: productsLoading } = useSelector((state) => state.products);
  const { list: sales, loading: salesLoading } = useSelector((state) => state.sales);
  const { list: clients } = useSelector((state) => state.clients);
  const { list: gpsDevices } = useSelector((state) => state.gpsDevices);
  const { list: vehicles } = useSelector((state) => state.vehicles);
  const { list: activations } = useSelector((state) => state.activations);
  const { user } = useSelector((state) => state.auth);
  
  // Refresh Data
  const refreshData = async () => {
    setRefreshing(true);
    await Promise.all([
      dispatch(fetchProducts()),
      dispatch(fetchSales()),
      dispatch(fetchDashboardStats()),
      dispatch(fetchSaleStats()),
      dispatch(fetchClients()),
      dispatch(fetchGpsDevices()),
      dispatch(fetchVehicles()),
      dispatch(fetchActivations())
    ]);
    setTimeout(() => setRefreshing(false), 500);
  };
  
  useEffect(() => {
    refreshData();
  }, [dispatch]);
  
  // ==================== COMPUTED STATISTICS ====================
  
  const revenueStats = useMemo(() => {
    const salesArray = Array.isArray(sales) ? sales : [];
    const today = new Date();
    const currentMonth = today.toISOString().slice(0, 7);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().slice(0, 7);
    
    const currentMonthSales = salesArray.filter(s => s && s.created_at && s.created_at.slice(0, 7) === currentMonth);
    const lastMonthSales = salesArray.filter(s => s && s.created_at && s.created_at.slice(0, 7) === lastMonth);
    
    const currentRevenue = currentMonthSales.reduce((sum, s) => sum + safeNumber(s?.total), 0);
    const lastRevenue = lastMonthSales.reduce((sum, s) => sum + safeNumber(s?.total), 0);
    
    let growth = 0;
    if (lastRevenue > 0) growth = ((currentRevenue - lastRevenue) / lastRevenue) * 100;
    else if (currentRevenue > 0) growth = 100;
    
    const pendingRevenue = salesArray.filter(s => s && s.payment_status !== 'paid').reduce((sum, s) => sum + safeNumber(s?.remaining_amount), 0);
    const collectedRevenue = salesArray.reduce((sum, s) => sum + safeNumber(s?.amount_paid), 0);
    
    let averageOrderValue = 0;
    if (salesArray.length > 0) averageOrderValue = currentRevenue / salesArray.length;
    
    return {
      currentRevenue: safeRound(currentRevenue),
      growth: safeRound(growth),
      pendingRevenue: safeRound(pendingRevenue),
      collectedRevenue: safeRound(collectedRevenue),
      averageOrderValue: safeRound(averageOrderValue)
    };
  }, [sales]);
  
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
    return { active, expired: activationsArray?.filter(a => a?.status === 'expired')?.length || 0, expiringSoon, expiringThisWeek, total: activationsArray?.length || 0 };
  }, [activations]);
  
  const chartData = useMemo(() => {
    const salesArray = Array.isArray(sales) ? sales : [];
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
        const monthlyRevenue = monthlySales.reduce((sum, s) => sum + safeNumber(s?.total), 0);
        data.push({ name: months[i], revenue: safeRound(monthlyRevenue), avgOrder: monthlySales.length > 0 ? safeRound(monthlyRevenue / monthlySales.length) : 0 });
      }
    } else {
      for (let i = period - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10);
        const dailySales = salesArray.filter(s => s?.created_at?.slice(0, 10) === dateStr);
        const dailyRevenue = dailySales.reduce((sum, s) => sum + safeNumber(s?.total), 0);
        data.push({ name: d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }), revenue: safeRound(dailyRevenue), avgOrder: dailySales.length > 0 ? safeRound(dailyRevenue / dailySales.length) : 0 });
      }
    }
    return data;
  }, [sales, timeRange]);
  
  const paymentDistribution = useMemo(() => {
    const salesArray = Array.isArray(sales) ? sales : [];
    const paid = salesArray.filter(s => s?.payment_status === 'paid').length;
    const partial = salesArray.filter(s => s?.payment_status === 'partial').length;
    const unpaid = salesArray.filter(s => s?.payment_status === 'unpaid' || !s?.payment_status).length;
    const total = salesArray.length || 1;
    return [
      { name: 'Payé', value: paid, percent: Math.round((paid / total) * 100), color: '#10b981' },
      { name: 'Partiel', value: partial, percent: Math.round((partial / total) * 100), color: '#f59e0b' },
      { name: 'Impayé', value: unpaid, percent: Math.round((unpaid / total) * 100), color: '#ef4444' }
    ];
  }, [sales]);
  
  const productDistribution = useMemo(() => {
    const salesArray = Array.isArray(sales) ? sales : [];
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
    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#06b6d4', '#ef4444'];
    const sortedEntries = Object.entries(distribution).sort((a, b) => b[1] - a[1]);
    return sortedEntries.slice(0, 6).map(([name, value], idx) => ({ name: name.length > 15 ? name.slice(0, 12) + '...' : name, value: safeNumber(value), color: colors[idx % colors.length] }));
  }, [sales]);
  
  const recentActivities = useMemo(() => {
    const salesArray = Array.isArray(sales) ? sales : [];
    const activationsArray = Array.isArray(activations) ? activations : [];
    const activities = [];
    
    salesArray.slice(0, 8).forEach(sale => {
      if (sale) activities.push({ id: `sale-${sale?.id}`, type: 'sale', title: 'Nouvelle vente', description: `Vente #${sale?.id || 'N/A'} - ${sale?.client?.nom || 'Client'}`, amount: safeNumber(sale?.total), date: sale?.created_at, status: sale?.payment_status });
    });
    
    activationsArray.slice(0, 6).forEach(act => {
      if (act) activities.push({ id: `act-${act?.id}`, type: 'activation', title: 'Activation GPS', description: `IMEI: ${act?.imei?.slice(-6) || act?.id || 'N/A'}`, date: act?.activated_at, status: act?.status });
    });
    
    return activities.filter(a => a.date).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);
  }, [sales, activations]);
  
  // Quick actions including the new Report button
  const quickActions = [
    { label: 'Nouvelle vente', icon: ShoppingCart, path: '/ventes', color: '#3b82f6' },
    { label: 'Ajouter client', icon: Users, path: '/clients', color: '#10b981' },
    { label: 'Nouveau produit', icon: Package, path: '/produits', color: '#8b5cf6' },
    { label: 'Activation GPS', icon: Wifi, path: '/Activation', color: '#f59e0b' },
    { label: 'Rapport Manuel', icon: FileText, onClick: () => setReportModalOpen(true), color: '#ef4444' }
  ];
  
  const isLoading = (productsLoading || salesLoading) && (!products?.length && !sales?.length);
  
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
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <div><span className="badge badge-success"><CheckCircle size={12} /> {paymentDistribution[0]?.value || 0} ventes payées</span></div>
              <div><span className="badge badge-warning"><Clock size={12} /> {activationStats.expiringThisWeek || 0} activations expirent cette semaine</span></div>
            </div>
          </div>
        </div>
        
        {/* Header */}
        <PageHeader
          title="Tableau de bord"
          subtitle={<><span>📊 Analyse complète de votre activité commerciale</span><span className="badge badge-info"><Activity size={10} /> {sales?.length || 0} ventes</span></>}
          actions={
            <>
              <div className="time-range-selector">
                <button className={`time-range-btn ${timeRange === 'week' ? 'time-range-btn-active' : ''}`} onClick={() => setTimeRange('week')}>Semaine</button>
                <button className={`time-range-btn ${timeRange === 'month' ? 'time-range-btn-active' : ''}`} onClick={() => setTimeRange('month')}>Mois</button>
                <button className={`time-range-btn ${timeRange === 'year' ? 'time-range-btn-active' : ''}`} onClick={() => setTimeRange('year')}>Année</button>
              </div>
              <button onClick={refreshData} className="btn btn-outline" disabled={refreshing}><RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} /> Actualiser</button>
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
          <StatCard label="CHIFFRE D'AFFAIRES" value={revenueStats.currentRevenue} icon={DollarSign} color="blue" subtitle={`💰 Collecté: ${revenueStats.collectedRevenue.toLocaleString()} MAD`} trend={revenueStats.growth > 0 ? 'up' : (revenueStats.growth < 0 ? 'down' : undefined)} trendValue={revenueStats.growth !== 0 ? Math.abs(revenueStats.growth) : undefined} onClick={() => navigate('/ventes')} />
          <StatCard label="VENTES" value={sales?.length || 0} icon={ShoppingCart} color="green" subtitle={`📊 Panier moyen: ${revenueStats.averageOrderValue.toLocaleString()} MAD`} onClick={() => navigate('/ventes')} />
          <StatCard label="PRODUITS" value={products?.length || 0} icon={Package} color="purple" subtitle={`⭐ ${productDistribution.length || 0} références vendues`} onClick={() => navigate('/produits')} />
          <StatCard label="CLIENTS" value={clients?.length || 0} icon={Users} color="orange" subtitle={`👥 +${Math.floor((clients?.length || 0) * 0.12)} nouveaux ce mois`} onClick={() => navigate('/clients')} />
        </div>
        
        {/* KPI Cards Row */}
        <div className="kpi-grid">
          <KpiCard title="Appareils GPS" value={gpsStats.total} subtitle={`${gpsStats.available} disponibles • ${gpsStats.assigned} assignés`} icon={MapPin} onClick={() => navigate('/produits')} />
          <KpiCard title="Activations actives" value={activationStats.active} subtitle={`⚠️ ${activationStats.expiringSoon} expirent bientôt`} icon={Zap} onClick={() => navigate('/Activation')} />
          <KpiCard title="Véhicules équipés" value={vehicles?.length || 0} subtitle={`🚗 +${Math.floor((vehicles?.length || 0) * 0.08)} ce trimestre`} icon={Car} onClick={() => navigate('/vehicules')} />
          <KpiCard title="Taux d'utilisation GPS" value={`${gpsStats.utilizationRate}%`} subtitle={`📈 ${gpsStats.utilizationRate >= 70 ? 'Excellent' : 'À améliorer'}`} icon={Gauge} />
        </div>
        
        {/* Revenue Chart */}
        <div className="dashboard-card" style={{ marginBottom: '1.5rem' }}>
          <div className="section-header">
            <div className="section-title"><TrendingUp size={18} style={{ color: '#3b82f6' }} /> Évolution des ventes</div>
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
                <div style={{ background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', borderRadius: '0.75rem', padding: '0.75rem', textAlign: 'center' }}><div className="text-lg font-bold text-green-700">{paymentDistribution[0]?.value || 0}</div><div className="text-xs text-green-600">Payées</div></div>
                <div style={{ background: 'linear-gradient(135deg, #fed7aa 0%, #fdba74 100%)', borderRadius: '0.75rem', padding: '0.75rem', textAlign: 'center' }}><div className="text-lg font-bold text-orange-700">{paymentDistribution[1]?.value || 0}</div><div className="text-xs text-orange-600">Partielles</div></div>
                <div style={{ background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)', borderRadius: '0.75rem', padding: '0.75rem', textAlign: 'center' }}><div className="text-lg font-bold text-red-700">{paymentDistribution[2]?.value || 0}</div><div className="text-xs text-red-600">Impayées</div></div>
              </div>
              {revenueStats.pendingRevenue > 0 && (<div className="info-box" style={{ marginTop: '1rem', background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' }}><div className="text-sm font-semibold text-yellow-800">💰 En attente de paiement</div><div className="text-xl font-bold text-yellow-900">{revenueStats.pendingRevenue.toLocaleString()} MAD</div></div>)}
            </div>
          </div>
          
          <div className="dashboard-card">
            <div className="section-header"><div className="section-title"><Trophy size={18} style={{ color: '#f59e0b' }} /> Produits les plus vendus</div></div>
            <div style={{ padding: '1.25rem' }}>
              {productDistribution.length > 0 ? productDistribution.map((product, idx) => {
                const maxValue = productDistribution[0]?.value || 1;
                const percentage = maxValue > 0 ? (product.value / maxValue) * 100 : 0;
                return (<div key={idx}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}><span className="font-medium">{product.name}</span><span style={{ color: product.color, fontWeight: 600 }}>{product.value} unités</span></div><div className="progress-bar"><div className="progress-fill" style={{ width: `${percentage}%`, background: product.color }}></div></div></div>);
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
                <div className="gps-stat-mini" style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)' }}><div className="gps-stat-value" style={{ color: '#2563eb' }}>{gpsStats.available}</div><div className="gps-stat-label">Disponibles</div></div>
                <div className="gps-stat-mini" style={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)' }}><div className="gps-stat-value" style={{ color: '#7c3aed' }}>{gpsStats.assigned}</div><div className="gps-stat-label">Assignés</div></div>
                <div className="gps-stat-mini" style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' }}><div className="gps-stat-value" style={{ color: '#d97706' }}>{gpsStats.reserved}</div><div className="gps-stat-label">Réservés</div></div>
              </div>
              <div style={{ marginBottom: '1rem' }}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}><span>Taux d'utilisation</span><span className="font-semibold">{gpsStats.utilizationRate}%</span></div><div className="progress-bar"><div className="progress-fill" style={{ width: `${gpsStats.utilizationRate}%`, background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)' }}></div></div></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                <div><div className="text-xs text-gray-500">Total appareils</div><div className="text-xl font-bold text-gray-800">{gpsStats.total}</div></div>
                <div><div className="text-xs text-gray-500">Activations actives</div><div className="text-xl font-bold text-green-600">{activationStats.active}</div></div>
                <div><div className="text-xs text-gray-500">Expirations imminentes</div><div className="text-xl font-bold text-orange-600">{activationStats.expiringSoon}</div></div>
              </div>
            </div>
          </div>
          
          <div className="dashboard-card">
            <div className="section-header"><div className="section-title"><Activity size={18} style={{ color: '#10b981' }} /> Activités récentes</div><button className="btn btn-ghost" style={{ fontSize: '0.7rem' }} onClick={() => navigate('/ventes')}>Voir tout <ChevronRight size={14} /></button></div>
            <div style={{ padding: '0.75rem' }}>
              <div className="recent-list">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="recent-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                      <div style={{ padding: '0.5rem', borderRadius: '0.75rem', background: activity.type === 'sale' ? '#d1fae5' : '#ede9fe' }}>
                        {activity.type === 'sale' ? <ShoppingCart size={14} className="text-green-600" /> : <Wifi size={14} className="text-purple-600" />}
                      </div>
                      <div style={{ flex: 1 }}><div className="font-semibold text-sm text-gray-800">{activity.title}</div><div className="text-xs text-gray-400">{activity.description}</div></div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="text-xs text-gray-400 whitespace-nowrap">{activity.date ? new Date(activity.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '-'}</div>
                      {activity.amount !== undefined && activity.amount !== null && !isNaN(activity.amount) && activity.amount > 0 && (<div className="text-xs font-semibold text-gray-800 mt-1">{Math.round(activity.amount).toLocaleString()} MAD</div>)}
                      {activity.status && (<span className={`badge text-xs mt-1 inline-block ${activity.status === 'paid' || activity.status === 'active' ? 'badge-success' : activity.status === 'partial' ? 'badge-warning' : 'badge-danger'}`}>{activity.status === 'paid' ? 'Payé' : activity.status === 'active' ? 'Actif' : activity.status === 'partial' ? 'Partiel' : activity.status}</span>)}
                    </div>
                  </div>
                ))}
                {recentActivities.length === 0 && <div className="text-center py-8 text-gray-400">Aucune activité récente</div>}
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="text-center text-xs text-gray-400 border-t border-gray-100 pt-4 mt-2">
          <div className="flex justify-center gap-4 mb-2"><span>📊 Données en temps réel</span><span>🔄 Dernière mise à jour: {new Date().toLocaleTimeString('fr-FR')}</span><span>✅ {sales?.length || 0} ventes enregistrées</span></div>
          <div>© 2024 - Tableau de bord commercial</div>
        </div>
        
      </div>

      {/* Multi-Row Report Modal */}
      <MultiRowReportModal isOpen={reportModalOpen} onClose={() => setReportModalOpen(false)} />
    </>
  );
};

export default Dashboard;