// Depenses.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Plus, Pencil, Trash2, Search, TrendingUp, TrendingDown, RefreshCw,
  X, AlertTriangle, CheckCircle, Info, ChevronLeft, ChevronRight,
  Calendar, Tag, Wallet, Receipt, PieChart as PieChartIcon, DollarSign,
  Filter, ArrowUp, ArrowDown, Download, Printer,
  Building2, CreditCard, Landmark, Home, Car, ShoppingBag,
  Wrench, Truck, Smartphone, Database, Globe, Settings, MoreHorizontal,
  Loader, CircleDollarSign, Percent, Shield, Award, Target, Sparkles
} from 'lucide-react';
import {
  fetchDepenses,
  createDepense,
  updateDepense,
  deleteDepense,
  fetchDepenseStats,
  fetchDepenseCategories,
  clearDepenseError,
  selectDepenses,
  selectSelectedDepense,
  selectDepensesStats,
  selectDepensesCategories,
  selectDepensesLoading,
  selectDepensesError,
  selectDepensesPagination
} from './Store/store';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ==================== BACKEND CATEGORIES ====================
const BACKEND_CATEGORIES = [
  { value: 'gps_device', label: 'Appareil GPS', icon: '📍', color: '#3b82f6' },
  { value: 'installation', label: 'Installation', icon: '🔧', color: '#f59e0b' },
  { value: 'activation', label: 'Activation', icon: '⚡', color: '#10b981' },
  { value: 'subscription', label: 'Abonnement', icon: '🔄', color: '#8b5cf6' },
  { value: 'maintenance', label: 'Maintenance', icon: '🛠️', color: '#ef4444' },
  { value: 'repair', label: 'Réparation', icon: '🔨', color: '#ec4899' },
  { value: 'sim_card', label: 'Carte SIM', icon: '📱', color: '#06b6d4' },
  { value: 'accessories', label: 'Accessoires', icon: '🎧', color: '#14b8a6' },
  { value: 'software', label: 'Logiciel', icon: '💻', color: '#6366f1' },
  { value: 'other', label: 'Autre', icon: '📦', color: '#64748b' }
];

const getCategoryIcon = (category) => {
  const cat = BACKEND_CATEGORIES.find(c => c.value === category);
  return cat ? cat.icon : '📦';
};

const getCategoryColor = (category) => {
  const cat = BACKEND_CATEGORIES.find(c => c.value === category);
  return cat ? cat.color : '#64748b';
};

const getCategoryLabel = (category) => {
  const cat = BACKEND_CATEGORIES.find(c => c.value === category);
  return cat ? cat.label : category;
};

// ==================== STYLES (Fixed - no blur issues) ====================
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700;14..32,800&display=swap');
  
  .depenses-container {
    padding: 1.5rem;
    background: #f1f5f9;
    min-height: 100vh;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }
  
  .depenses-card {
    background: #ffffff;
    border-radius: 1rem;
    border: 1px solid #e2e8f0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    overflow: hidden;
    margin-bottom: 1.5rem;
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
    font-weight: 700;
    color: #0f172a;
    margin: 0;
  }
  
  .page-subtitle {
    font-size: 0.75rem;
    color: #64748b;
    margin-top: 0.25rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }
  
  .stats-grid {
    display: grid;
    gap: 1rem;
    margin-bottom: 1.5rem;
    grid-template-columns: repeat(4, 1fr);
  }
  
  @media (max-width: 1024px) {
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
    background: #ffffff;
    border-radius: 1rem;
    padding: 1.25rem;
    border: 1px solid #e2e8f0;
    transition: all 0.2s ease;
    cursor: pointer;
  }
  
  .stat-card:hover {
    border-color: #cbd5e1;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
  
  .stat-info {
    flex: 1;
  }
  
  .stat-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.5rem;
  }
  
  .stat-value {
    font-size: 1.75rem;
    font-weight: 700;
    color: #1e293b;
    line-height: 1.2;
    margin-bottom: 0.25rem;
  }
  
  .stat-subtitle {
    font-size: 0.7rem;
    color: #94a3b8;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }
  
  .stat-icon {
    width: 2.75rem;
    height: 2.75rem;
    border-radius: 0.875rem;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
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
  
  .chart-container {
    padding: 1rem;
    height: 320px;
  }
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.25rem;
    border-bottom: 1px solid #e2e8f0;
    background: #f8fafc;
  }
  
  .section-title {
    font-weight: 600;
    color: #0f172a;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .filter-bar {
    padding: 1rem 1.25rem;
    background: #ffffff;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }
  
  .filter-group {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    align-items: center;
    flex: 1;
  }
  
  .search-wrapper {
    position: relative;
    flex: 2;
    min-width: 250px;
  }
  
  .search-icon {
    position: absolute;
    left: 0.875rem;
    top: 50%;
    transform: translateY(-50%);
    width: 1rem;
    height: 1rem;
    color: #94a3b8;
  }
  
  .search-input {
    width: 100%;
    height: 2.5rem;
    padding: 0 1rem 0 2.5rem;
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
    font-size: 0.75rem;
    background: white;
    color: #0f172a;
    outline: none;
    transition: all 0.2s ease;
  }
  
  .search-input:focus {
    border-color: #ef4444;
    box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.1);
  }
  
  .filter-select {
    position: relative;
    min-width: 160px;
  }
  
  .filter-icon {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    width: 1rem;
    height: 1rem;
    color: #94a3b8;
    pointer-events: none;
  }
  
  .select-filter {
    width: 100%;
    height: 2.5rem;
    padding: 0 2rem 0 2.25rem;
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
    font-size: 0.75rem;
    background: white;
    color: #0f172a;
    cursor: pointer;
    outline: none;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0.75rem center;
  }
  
  .select-filter:focus {
    border-color: #ef4444;
    box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.1);
  }
  
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
  }
  
  .btn-primary {
    background: #2563eb;
    color: white;
  }
  
  .btn-primary:hover {
    background: #2563eb;
    transform: translateY(-1px);
  }
  
  .btn-outline {
    background: white;
    border: 1px solid #e2e8f0;
    color: #1e293b;
  }
  
  .btn-outline:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
  }
  
  .btn-danger {
    background: #dc2626;
    color: white;
  }
  
  .btn-danger:hover {
    background: #b91c1c;
  }
  
  .btn-ghost {
    background: transparent;
    color: #64748b;
  }
  
  .btn-ghost:hover {
    background: #f1f5f9;
    color: #0f172a;
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
  
  .badge-info {
    background: #dbeafe;
    color: #1e40af;
  }
  
  .table-container {
    overflow-x: auto;
  }
  
  .data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.75rem;
  }
  
  .data-table thead tr {
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
  }
  
  .data-table th {
    padding: 0.875rem 1rem;
    text-align: left;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #64748b;
  }
  
  .data-table tbody tr {
    border-bottom: 1px solid #f1f5f9;
    transition: background 0.2s ease;
  }
  
  .data-table tbody tr:hover {
    background-color: #f8fafc;
  }
  
  .data-table td {
    padding: 0.875rem 1rem;
    vertical-align: middle;
  }
  
  .pagination-container {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem 1.25rem;
    border-top: 1px solid #e2e8f0;
    flex-wrap: wrap;
  }
  
  .pagination-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.375rem 0.875rem;
    border: 1px solid #e2e8f0;
    background: white;
    border-radius: 0.375rem;
    font-size: 0.75rem;
    font-weight: 500;
    color: #0f172a;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .pagination-btn:hover:not(:disabled) {
    background: #f8fafc;
    border-color: #cbd5e1;
  }
  
  .pagination-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .pagination-active {
    background: #ef4444;
    color: white;
    border-color: #ef4444;
  }
  
  /* Modal styles - Fixed positioning */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .modal {
    background: white;
    border-radius: 1rem;
    width: 90%;
    max-width: 500px;
    max-height: 85vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    position: relative;
    z-index: 1001;
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.25rem;
    border-bottom: 1px solid #e2e8f0;
    background: #f8fafc;
  }
  
  .modal-title {
    font-size: 1.125rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #1e293b;
  }
  
  .modal-body {
    flex: 1;
    overflow-y: auto;
    padding: 1.25rem;
  }
  
  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    padding: 1rem 1.25rem;
    border-top: 1px solid #e2e8f0;
    background: #f8fafc;
  }
  
  .form-group {
    margin-bottom: 1rem;
  }
  
  .form-label {
    display: block;
    font-size: 0.75rem;
    font-weight: 500;
    color: #0f172a;
    margin-bottom: 0.375rem;
  }
  
  .form-label-required::after {
    content: '*';
    color: #ef4444;
    margin-left: 0.25rem;
  }
  
  .form-input, .form-textarea, .form-select {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
    font-size: 0.75rem;
    background: white;
    color: #0f172a;
    outline: none;
    transition: all 0.2s ease;
  }
  
  .form-input:focus, .form-textarea:focus, .form-select:focus {
    border-color: #ef4444;
    box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.1);
  }
  
  .form-textarea {
    resize: vertical;
    min-height: 80px;
  }
  
  .error-message {
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 0.5rem;
    padding: 0.75rem;
    color: #dc2626;
    font-size: 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  
  .delete-warning {
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 0.75rem;
    padding: 1rem;
    margin: 1rem;
  }
  
  .delete-warning-title {
    font-weight: 600;
    color: #dc2626;
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .category-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.25rem 0.75rem;
    border-radius: 2rem;
    font-size: 0.7rem;
    font-weight: 500;
  }
  
  .amount-positive {
    color: #dc2626;
    font-weight: 600;
  }
  
  .text-right {
    text-align: right;
  }
  
  .toast-container {
    position: fixed;
    bottom: 1rem;
    right: 1rem;
    z-index: 1100;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .toast {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: white;
    border-radius: 0.5rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    border-left: 3px solid;
    min-width: 250px;
  }
  
  .toast-success {
    border-left-color: #10b981;
  }
  .toast-success svg { color: #10b981; }
  
  .toast-error {
    border-left-color: #ef4444;
  }
  .toast-error svg { color: #ef4444; }
  
  .loading-spinner {
    width: 2rem;
    height: 2rem;
    border: 2px solid #e2e8f0;
    border-top-color: #ef4444;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .flex { display: flex; }
  .items-center { align-items: center; }
  .justify-between { justify-content: space-between; }
  .gap-1 { gap: 0.25rem; }
  .gap-2 { gap: 0.5rem; }
  .gap-3 { gap: 0.75rem; }
  .text-sm { font-size: 0.75rem; }
  .text-xs { font-size: 0.75rem; }
  .text-gray-400 { color: #94a3b8; }
  .text-gray-500 { color: #64748b; }
  .text-gray-600 { color: #475569; }
  .text-gray-700 { color: #334155; }
  .text-gray-800 { color: #1e293b; }
  .text-red-500 { color: #ef4444; }
  .text-green-500 { color: #10b981; }
  .mt-1 { margin-top: 0.25rem; }
  .mt-2 { margin-top: 0.5rem; }
  .mt-3 { margin-top: 0.75rem; }
  .mt-4 { margin-top: 1rem; }
  .mb-1 { margin-bottom: 0.25rem; }
  .mb-2 { margin-bottom: 0.5rem; }
  .mb-3 { margin-bottom: 0.75rem; }
  .mb-4 { margin-bottom: 1rem; }
  .p-2 { padding: 0.5rem; }
  .p-3 { padding: 0.75rem; }
  .py-12 { padding-top: 3rem; padding-bottom: 3rem; }
  .mx-auto { margin-left: auto; margin-right: auto; }
  .text-center { text-align: center; }
  .max-w-xs { max-width: 20rem; }
  .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .rounded-lg { border-radius: 0.5rem; }
  .cursor-pointer { cursor: pointer; }
  .underline { text-decoration: underline; }
`;

// ==================== TOAST COMPONENT ====================
const Toast = ({ message, type = 'success', onClose }) => {
  React.useEffect(() => {
    const timer = setTimeout(() => onClose(), 3000);
    return () => clearTimeout(timer);
  }, [onClose]);
  
  const Icon = type === 'success' ? CheckCircle : type === 'error' ? AlertTriangle : Info;
  
  return (
    <div className={`toast toast-${type}`}>
      <Icon size={18} />
      <span className="flex-1 text-sm">{message}</span>
      <button className="bg-transparent border-none cursor-pointer p-1" onClick={onClose}>
        <X size={14} />
      </button>
    </div>
  );
};

// ==================== STAT CARD ====================
const StatCard = ({ label, value, icon: Icon, color = 'red', subtitle, onClick }) => {
  const colorClasses = {
    red: { bg: '#fef2f2', iconBg: '#ef4444' },
    green: { bg: '#f0fdf4', iconBg: '#10b981' },
    orange: { bg: '#fff7ed', iconBg: '#f59e0b' },
    blue: { bg: '#eff6ff', iconBg: '#3b82f6' }
  };
  
  const formatValue = (val) => {
    if (val === undefined || val === null || isNaN(val)) return '0 MAD';
    const num = Number(val);
    if (isNaN(num)) return '0 MAD';
    return `${Math.round(num).toLocaleString()} MAD`;
  };
  
  return (
    <div className="stat-card" onClick={onClick}>
      <div className="flex justify-between items-start">
        <div className="stat-info">
          <div className="stat-label">{label}</div>
          <div className="stat-value">{formatValue(value)}</div>
          {subtitle && <div className="stat-subtitle">{subtitle}</div>}
        </div>
        <div className="stat-icon" style={{ background: colorClasses[color].bg }}>
          <Icon size={18} style={{ color: colorClasses[color].iconBg }} />
        </div>
      </div>
    </div>
  );
};

// ==================== PAGINATION ====================
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };
  
  return (
    <div className="pagination-container">
      <button
        className="pagination-btn"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft size={14} />
        Précédent
      </button>
      
      {getPageNumbers().map((page, index) => (
        page === '...' ? (
          <span key={`ellipsis-${index}`} className="text-gray-400 px-2">...</span>
        ) : (
          <button
            key={page}
            className={`pagination-btn ${currentPage === page ? 'pagination-active' : ''}`}
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        )
      ))}
      
      <button
        className="pagination-btn"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Suivant
        <ChevronRight size={14} />
      </button>
    </div>
  );
};

// ==================== CUSTOM TOOLTIP ====================
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 rounded-lg shadow-lg border border-gray-100">
        <p className="text-xs font-semibold text-gray-700">{payload[0].name}</p>
        <p className="text-sm font-bold text-red-500">{payload[0].value?.toLocaleString()} MAD</p>
      </div>
    );
  }
  return null;
};

// ==================== MAIN COMPONENT ====================
const Depenses = () => {
  const dispatch = useDispatch();
  
  // Redux selectors
  const depenses = useSelector(selectDepenses);
  const stats = useSelector(selectDepensesStats);
  const categories = useSelector(selectDepensesCategories);
  const loading = useSelector(selectDepensesLoading);
  const error = useSelector(selectDepensesError);
  const pagination = useSelector(selectDepensesPagination);
  
  // Local state
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDepense, setEditingDepense] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    category: 'other'
  });
  const [formError, setFormError] = useState('');
  const [toasts, setToasts] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Use backend categories
  const availableCategories = categories.length > 0 ? categories : BACKEND_CATEGORIES.map(c => c.value);
  const categoryLabels = categories.length > 0 ? categories : BACKEND_CATEGORIES;
  
  // Fetch data on mount and page change
  useEffect(() => {
    dispatch(fetchDepenses({ page: currentPage }));
    dispatch(fetchDepenseStats());
    dispatch(fetchDepenseCategories());
  }, [dispatch, currentPage]);
  
  // Reset filters
  const clearFilters = () => {
    setSearch('');
    setCategoryFilter('all');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };
  
  const hasActiveFilters = search !== '' || categoryFilter !== 'all' || startDate !== '' || endDate !== '';
  
  // Filter depenses
  const filteredDepenses = useMemo(() => {
    let filtered = [...depenses];
    
    if (search) {
      filtered = filtered.filter(d =>
        d.title?.toLowerCase().includes(search.toLowerCase()) ||
        d.description?.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(d => d.category === categoryFilter);
    }
    
    if (startDate) {
      filtered = filtered.filter(d => d.date >= startDate);
    }
    
    if (endDate) {
      filtered = filtered.filter(d => d.date <= endDate);
    }
    
    return filtered;
  }, [depenses, search, categoryFilter, startDate, endDate]);
  
  // Pagination for filtered results
  const itemsPerPage = 10;
  const totalFilteredPages = Math.ceil(filteredDepenses.length / itemsPerPage);
  const paginatedDepenses = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredDepenses.slice(start, start + itemsPerPage);
  }, [filteredDepenses, currentPage, itemsPerPage]);
  
  // Chart data - Category distribution
  const categoryDistribution = useMemo(() => {
    const distribution = {};
    depenses.forEach(d => {
      if (d.category) {
        distribution[d.category] = (distribution[d.category] || 0) + (Number(d.amount) || 0);
      }
    });
    return Object.entries(distribution).map(([name, value]) => ({
      name: getCategoryLabel(name),
      value: Math.round(value),
      color: getCategoryColor(name),
      originalName: name
    })).sort((a, b) => b.value - a.value);
  }, [depenses]);
  
  // Monthly trend data
  const monthlyTrend = useMemo(() => {
    const months = {};
    depenses.forEach(d => {
      if (d.date) {
        const month = d.date.slice(0, 7);
        months[month] = (months[month] || 0) + (Number(d.amount) || 0);
      }
    });
    const sorted = Object.entries(months)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6);
    return sorted.map(([month, total]) => ({
      month: new Date(month + '-01').toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
      amount: Math.round(total)
    }));
  }, [depenses]);
  
  // Toast management
  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3000);
  };
  
  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };
  
  // Open create modal
  const openCreateModal = () => {
    setEditingDepense(null);
    setForm({
      title: '',
      description: '',
      amount: '',
      date: new Date().toISOString().slice(0, 10),
      category: 'other'
    });
    setFormError('');
    setModalOpen(true);
  };
  
  // Open edit modal
  const openEditModal = (depense) => {
    setEditingDepense(depense);
    setForm({
      title: depense.title || '',
      description: depense.description || '',
      amount: depense.amount?.toString() || '',
      date: depense.date?.slice(0, 10) || new Date().toISOString().slice(0, 10),
      category: depense.category || 'other'
    });
    setFormError('');
    setModalOpen(true);
  };
  
  // Save depense
  const saveDepense = async () => {
    // Validation
    if (!form.title.trim()) {
      setFormError('Le titre est requis');
      return;
    }
    
    if (!form.amount || parseFloat(form.amount) <= 0) {
      setFormError('Le montant doit être supérieur à 0');
      return;
    }
    
    if (!form.date) {
      setFormError('La date est requise');
      return;
    }
    
    if (!form.category) {
      setFormError('La catégorie est requise');
      return;
    }
    
    const depenseData = {
      title: form.title.trim(),
      description: form.description?.trim() || '',
      amount: parseFloat(form.amount),
      date: form.date,
      category: form.category
    };
    
    setSubmitting(true);
    try {
      if (editingDepense) {
        await dispatch(updateDepense({ id: editingDepense.id, ...depenseData })).unwrap();
        showToast(`Dépense "${form.title}" mise à jour avec succès`, 'success');
      } else {
        await dispatch(createDepense(depenseData)).unwrap();
        showToast(`Dépense "${form.title}" créée avec succès`, 'success');
      }
      setModalOpen(false);
      dispatch(fetchDepenses({ page: currentPage }));
      dispatch(fetchDepenseStats());
    } catch (err) {
      setFormError(err || 'Une erreur est survenue');
      showToast(err || 'Erreur lors de l\'enregistrement', 'error');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Confirm delete
  const confirmDelete = (depense) => {
    setDeleteDialog(depense);
  };
  
  // Handle delete
  const handleDelete = async () => {
    if (!deleteDialog) return;
    
    setDeleting(true);
    try {
      await dispatch(deleteDepense(deleteDialog.id)).unwrap();
      showToast(`Dépense "${deleteDialog.title}" supprimée avec succès`, 'success');
      setDeleteDialog(null);
      dispatch(fetchDepenses({ page: currentPage }));
      dispatch(fetchDepenseStats());
    } catch (err) {
      showToast(err || 'Erreur lors de la suppression', 'error');
    } finally {
      setDeleting(false);
    }
  };
  
  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF('landscape');
    
    doc.setFontSize(18);
    doc.setTextColor(239, 68, 68);
    doc.text('Rapport des Dépenses', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text('AMG TELECOM Sarl', 14, 30);
    doc.text('82 Angle Abdelmounem et Rue Soumaya ETG 2 N°4, CASABLANCA', 14, 36);
    doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 14, 42);
    
    const tableData = filteredDepenses.map(d => [
      d.date?.slice(0, 10) || '-',
      d.title || '-',
      getCategoryLabel(d.category),
      `${Number(d.amount || 0).toLocaleString()} MAD`
    ]);
    
    autoTable(doc, {
      startY: 50,
      head: [['Date', 'Titre', 'Catégorie', 'Montant']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [239, 68, 68], textColor: 255 },
      styles: { fontSize: 9 }
    });
    
    const total = filteredDepenses.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`Total des dépenses: ${total.toLocaleString()} MAD`, 14, finalY);
    
    doc.save(`depenses_${new Date().toISOString().slice(0, 10)}.pdf`);
    showToast('Export PDF réussi', 'success');
  };
  
  // Format amount
  const formatAmount = (amount) => {
    const num = Number(amount);
    if (isNaN(num)) return '0 MAD';
    return `${Math.round(num).toLocaleString()} MAD`;
  };
  
  if (loading && depenses.length === 0) {
    return (
      <div className="depenses-container">
        <style>{styles}</style>
        <div className="flex flex-col items-center justify-center" style={{ minHeight: '400px' }}>
          <div className="loading-spinner"></div>
          <p className="mt-4 text-gray-500">Chargement des dépenses...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="depenses-container">
      <style>{styles}</style>
      
      {/* Toast Container */}
      {toasts.length > 0 && (
        <div className="toast-container">
          {toasts.map(toast => (
            <Toast
              key={toast.id}
              message={toast.message}
              type={toast.type}
              onClose={() => removeToast(toast.id)}
            />
          ))}
        </div>
      )}
      
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestion des Dépenses</h1>
          <div className="page-subtitle">
            <span>💰 Suivez et gérez toutes vos dépenses</span>
            <span className="badge badge-info">
              <Receipt size={12} />
              {depenses.length} dépenses enregistrées
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={exportToPDF} className="btn btn-outline">
            <Printer size={16} /> Exporter PDF
          </button>
          <button onClick={openCreateModal} className="btn btn-primary">
            <Plus size={16} /> Ajouter une dépense
          </button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="stats-grid">
        <StatCard 
          label="Total des dépenses" 
          value={stats?.total || depenses.reduce((sum, d) => sum + (Number(d.amount) || 0), 0)} 
          icon={DollarSign} 
          color="red"
          subtitle="Toutes catégories confondues"
        />
        <StatCard 
          label="Dépense moyenne" 
          value={stats?.average || (depenses.length > 0 ? depenses.reduce((sum, d) => sum + (Number(d.amount) || 0), 0) / depenses.length : 0)} 
          icon={TrendingUp} 
          color="orange"
          subtitle="Par transaction"
        />
        <StatCard 
          label="Ce mois-ci" 
          value={stats?.current_month || depenses.filter(d => {
            const today = new Date();
            const depDate = new Date(d.date);
            return depDate.getMonth() === today.getMonth() && depDate.getFullYear() === today.getFullYear();
          }).reduce((sum, d) => sum + (Number(d.amount) || 0), 0)} 
          icon={Calendar} 
          color="blue"
          subtitle="Dépenses du mois en cours"
        />
        <StatCard 
          label="Mois dernier" 
          value={stats?.last_month || depenses.filter(d => {
            const today = new Date();
            const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const depDate = new Date(d.date);
            return depDate.getMonth() === lastMonth.getMonth() && depDate.getFullYear() === lastMonth.getFullYear();
          }).reduce((sum, d) => sum + (Number(d.amount) || 0), 0)} 
          icon={Calendar} 
          color="green"
          subtitle="Comparaison mois précédent"
        />
      </div>
      
      {/* Charts Section */}
      <div className="two-columns">
        {/* Category Distribution Pie Chart */}
        <div className="depenses-card">
          <div className="section-header">
            <div className="section-title">
              <PieChartIcon size={18} style={{ color: '#ef4444' }} />
              Répartition par catégorie
            </div>
          </div>
          <div className="chart-container">
            {categoryDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                  >
                    {categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <PieChartIcon size={48} className="mx-auto mb-3 opacity-50" />
                <p>Aucune donnée de catégorie</p>
                <p className="text-xs">Ajoutez des dépenses pour voir la répartition</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Monthly Trend Area Chart */}
        <div className="depenses-card">
          <div className="section-header">
            <div className="section-title">
              <TrendingUp size={18} style={{ color: '#f59e0b' }} />
              Évolution mensuelle
            </div>
          </div>
          <div className="chart-container">
            {monthlyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrend}>
                  <defs>
                    <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#ef4444" 
                    strokeWidth={2} 
                    fill="url(#expenseGradient)" 
                    name="Dépenses (MAD)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <TrendingUp size={48} className="mx-auto mb-3 opacity-50" />
                <p>Aucune donnée mensuelle</p>
                <p className="text-xs">Ajoutez des dépenses pour voir l'évolution</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Filter Bar and Table */}
      <div className="depenses-card">
        <div className="filter-bar">
          <div className="filter-group">
            <div className="search-wrapper">
              <Search className="search-icon" />
              <input 
                className="search-input" 
                placeholder="Rechercher par titre ou description..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
              />
            </div>
            
            <div className="filter-select">
              <Tag className="filter-icon" />
              <select 
                className="select-filter" 
                value={categoryFilter} 
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">Toutes les catégories</option>
                {BACKEND_CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-select">
              <Calendar className="filter-icon" />
              <input 
                type="date" 
                className="select-filter" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                style={{ paddingLeft: '2.25rem' }}
              />
            </div>
            
            <div className="filter-select">
              <Calendar className="filter-icon" />
              <input 
                type="date" 
                className="select-filter" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
                style={{ paddingLeft: '2.25rem' }}
              />
            </div>
          </div>
          
          {hasActiveFilters && (
            <button className="btn btn-outline" onClick={clearFilters} style={{ padding: '0.375rem 0.875rem' }}>
              <X size={14} />
              Effacer
            </button>
          )}
        </div>
        
        {/* Table */}
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Titre</th>
                <th>Description</th>
                <th>Catégorie</th>
                <th className="text-right">Montant</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedDepenses.map((depense) => (
                <tr key={depense.id}>
                  <td>
                    <div className="flex items-center gap-1">
                      <Calendar size={12} className="text-gray-400" />
                      <span>{depense.date?.slice(0, 10) || '-'}</span>
                    </div>
                  </td>
                  <td className="font-semibold text-gray-800">{depense.title || '-'}</td>
                  <td>
                    <div className="text-gray-500 max-w-xs truncate">
                      {depense.description || '-'}
                    </div>
                  </td>
                  <td>
                    <div className="category-badge" style={{ background: `${getCategoryColor(depense.category)}20`, color: getCategoryColor(depense.category) }}>
                      <span>{getCategoryIcon(depense.category)}</span>
                      {getCategoryLabel(depense.category)}
                    </div>
                  </td>
                  <td className="text-right">
                    <span className="amount-positive">{formatAmount(depense.amount)}</span>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => openEditModal(depense)} 
                        className="btn-ghost p-2 rounded-lg"
                        title="Modifier"
                      >
                        <Pencil size={16} />
                      </button>
                      <button 
                        onClick={() => confirmDelete(depense)} 
                        className="btn-ghost p-2 rounded-lg"
                        title="Supprimer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedDepenses.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <div className="text-gray-400">
                      <Receipt size={48} className="mx-auto mb-3 opacity-50" />
                      <p>Aucune dépense trouvée</p>
                      {hasActiveFilters && (
                        <p className="text-sm">Modifiez vos filtres ou <button onClick={clearFilters} className="text-red-500 underline">effacez-les</button></p>
                      )}
                      {!hasActiveFilters && (
                        <button onClick={openCreateModal} className="mt-3 btn btn-primary text-sm">
                          <Plus size={14} /> Ajouter votre première dépense
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalFilteredPages > 1 && (
          <Pagination 
            currentPage={currentPage} 
            totalPages={totalFilteredPages} 
            onPageChange={setCurrentPage} 
          />
        )}
      </div>
      
      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => !submitting && setModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingDepense ? (
                  <>
                    <Pencil size={18} className="text-red-500" />
                    Modifier la dépense
                  </>
                ) : (
                  <>
                    <Plus size={18} className="text-red-500" />
                    Nouvelle dépense
                  </>
                )}
              </h2>
              <button className="btn-ghost p-2" onClick={() => setModalOpen(false)} disabled={submitting}>
                <X size={18} />
              </button>
            </div>
            
            <div className="modal-body">
              {formError && (
                <div className="error-message">
                  <AlertTriangle size={16} />
                  {formError}
                </div>
              )}
              
              <div className="form-group">
                <label className="form-label form-label-required">Titre</label>
                <input 
                  type="text"
                  className="form-input"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Ex: Achat GPS X5"
                  disabled={submitting}
                  autoFocus
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea 
                  className="form-textarea"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Description optionnelle..."
                  rows={3}
                  disabled={submitting}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label form-label-required">Montant (MAD)</label>
                <input 
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="0.00"
                  disabled={submitting}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label form-label-required">Date</label>
                <input 
                  type="date"
                  className="form-input"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  disabled={submitting}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label form-label-required">Catégorie</label>
                <select 
                  className="form-select"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  disabled={submitting}
                >
                  {BACKEND_CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="modal-footer">
              <button onClick={() => setModalOpen(false)} className="btn btn-outline" disabled={submitting}>
                Annuler
              </button>
              <button onClick={saveDepense} className="btn btn-primary" disabled={submitting}>
                {submitting ? (
                  <>
                    <div className="loading-spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }} />
                    {editingDepense ? 'Mise à jour...' : 'Création...'}
                  </>
                ) : (
                  editingDepense ? 'Mettre à jour' : 'Créer la dépense'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {deleteDialog && (
        <div className="modal-overlay" onClick={() => !deleting && setDeleteDialog(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ borderTop: '3px solid #ef4444' }}>
              <h2 className="modal-title" style={{ color: '#dc2626' }}>
                <AlertTriangle size={18} />
                Confirmer la suppression
              </h2>
            </div>
            
            <div className="delete-warning">
              <div className="delete-warning-title">
                <AlertTriangle size={16} />
                Dépense à supprimer :
              </div>
              <div className="text-gray-700">
                <div><strong>{deleteDialog.title}</strong></div>
                <div className="text-sm text-gray-500 mt-2">
                  📅 {deleteDialog.date?.slice(0, 10)}<br />
                  🏷️ {getCategoryLabel(deleteDialog.category)}<br />
                  💰 {formatAmount(deleteDialog.amount)}
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn btn-outline" 
                onClick={() => setDeleteDialog(null)}
                disabled={deleting}
              >
                Annuler
              </button>
              <button 
                className="btn btn-danger" 
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <div className="loading-spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }} />
                    Suppression...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Supprimer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Depenses;