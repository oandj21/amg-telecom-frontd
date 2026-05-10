import { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Pencil, Trash2, Search, X, RefreshCw, AlertTriangle, CheckCircle, Info, ChevronLeft, ChevronRight, FileSpreadsheet } from 'lucide-react';
import { ExportMenu } from './ExportMenu';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import {
  fetchClients,
  createClient,
  updateClient,
  deleteClient,
  searchClients,
  clearClientError,
  selectSales
} from './Store/store';

// ==================== STYLES ====================
const styles = `
  /* Base Layout */
  .clients-page-header {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  
  @media (min-width: 768px) {
    .clients-page-header {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
    }
  }
  
  .clients-title {
    font-size: 1.5rem;
    font-weight: 700;
    letter-spacing: -0.025em;
    line-height: 1.25;
    color: #111827;
  }
  
  @media (min-width: 768px) {
    .clients-title {
      font-size: 1.875rem;
    }
  }
  
  .clients-subtitle {
    font-size: 0.875rem;
    color: #6b7280;
    margin-top: 0.25rem;
  }
  
  .clients-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .clients-card {
    background: white;
    border-radius: 0.5rem;
    border: 1px solid #e5e7eb;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  }
  
  /* Search Section */
  .clients-search-container {
    padding: 1rem;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }
  
  .clients-search-wrapper {
    position: relative;
    flex: 1;
    max-width: 24rem;
  }
  
  .clients-search-icon {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    width: 1rem;
    height: 1rem;
    color: #9ca3af;
  }
  
  .clients-search-input {
    width: 100%;
    height: 2.5rem;
    padding: 0.5rem 0.75rem 0.5rem 2.25rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    background: white;
    color: #111827;
    outline: none;
    transition: all 0.2s ease;
  }
  
  .clients-search-input::placeholder {
    color: #9ca3af;
  }
  
  .clients-search-input:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  .clients-refresh-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    background: white;
    cursor: pointer;
    font-size: 0.875rem;
    transition: all 0.2s ease;
  }
  
  .clients-refresh-btn:hover {
    background: #f9fafb;
    transform: translateY(-1px);
  }
  
  /* Table Styles */
  .clients-table-container {
    position: relative;
    width: 100%;
    overflow: auto;
  }
  
  .clients-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
  }
  
  .clients-table thead tr {
    border-bottom: 1px solid #e5e7eb;
    background: #f9fafb;
  }
  
  .clients-table th {
    height: 3rem;
    padding: 0 1rem;
    text-align: left;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    color: #6b7280;
    vertical-align: middle;
  }
  
  .clients-table tbody tr {
    border-bottom: 1px solid #f3f4f6;
    transition: all 0.2s ease;
  }
  
  .clients-table tbody tr:hover {
    background-color: #f9fafb;
    transform: translateX(2px);
  }
  
  .clients-table tbody tr:last-child {
    border-bottom: 0;
  }
  
  .clients-table td {
    padding: 1rem;
    vertical-align: middle;
  }
  
  .clients-table .font-medium {
    font-weight: 500;
    color: #111827;
  }
  
  .clients-table .text-muted {
    color: #6b7280;
  }
  
  .clients-table .text-right {
    text-align: right;
  }
  
  .clients-table .font-semibold {
    font-weight: 600;
    color: #059669;
  }
  
  .clients-table .font-mono {
    font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
  }
  
  .clients-table .w-24 {
    width: 6rem;
  }
  
  .clients-empty {
    text-align: center;
    color: #9ca3af;
    padding: 3rem 0;
  }
  
  /* Loading State */
  .clients-loading {
    text-align: center;
    padding: 3rem 0;
  }
  
  .clients-loading-spinner {
    display: inline-block;
    width: 2.5rem;
    height: 2.5rem;
    border: 3px solid #e5e7eb;
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  /* Button Styles */
  .clients-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    white-space: nowrap;
    border-radius: 0.875rem;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.2s ease;
    outline: none;
    cursor: pointer;
    border: none;
    font-family: inherit;
  }
  
  .clients-btn:focus-visible {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }
  
  .clients-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .clients-btn svg {
    pointer-events: none;
    width: 1rem;
    height: 1rem;
    flex-shrink: 0;
  }
  
  .clients-btn-default {
    height: 2.5rem;
    padding: 0.5rem 1rem;
  }
  
  .clients-btn-primary {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  }
  
  .clients-btn-primary:hover:not(:disabled) {
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }
  
  .clients-btn-outline {
    height: 2.5rem;
    padding: 0.5rem 1rem;
    border: 1px solid #d1d5db;
    background: white;
    color: #374151;
  }
  
  .clients-btn-outline:hover:not(:disabled) {
    background: #f9fafb;
    border-color: #9ca3af;
  }
  
  .clients-btn-ghost {
    background: transparent;
    color: #6b7280;
  }
  
  .clients-btn-ghost:hover:not(:disabled) {
    background: #f3f4f6;
    color: #374151;
  }
  
  .clients-btn-icon {
    height: 2.5rem;
    width: 2.5rem;
    padding: 0;
  }
  
  .clients-btn-danger {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    color: white;
  }
  
  .clients-btn-danger:hover:not(:disabled) {
    background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
    transform: translateY(-1px);
  }
  
  .clients-actions-cell {
    display: flex;
    gap: 0.25rem;
  }
  
  /* Modal/Dialog Styles */
  .clients-overlay {
    position: fixed;
    inset: 0;
    z-index: 50;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    animation: fadeIn 0.2s ease-out;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  .clients-dialog {
    position: fixed;
    left: 50%;
    top: 50%;
    z-index: 51;
    display: grid;
    width: 100%;
    max-width: 32rem;
    max-height: 90vh;
    overflow-y: auto;
    transform: translate(-50%, -50%);
    gap: 1.5rem;
    border: 1px solid #e5e7eb;
    background: white;
    padding: 1.5rem;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    border-radius: 0.75rem;
    animation: slideIn 0.3s ease-out;
  }
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translate(-50%, -48%) scale(0.96);
    }
    to {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
  }
  
  /* Delete Confirmation Dialog */
  .clients-dialog-danger {
    border-top: 4px solid #ef4444;
  }
  
  .clients-dialog-header {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    text-align: center;
  }
  
  @media (min-width: 640px) {
    .clients-dialog-header {
      text-align: left;
    }
  }
  
  .clients-dialog-title {
    font-size: 1.25rem;
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: -0.025em;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .clients-dialog-title-danger {
    color: #dc2626;
  }
  
  .clients-dialog-description {
    font-size: 0.875rem;
    color: #6b7280;
    margin-top: 0.25rem;
  }
  
  .clients-dialog-body {
    display: grid;
    gap: 1rem;
  }
  
  .clients-dialog-footer {
    display: flex;
    flex-direction: column-reverse;
    gap: 0.75rem;
  }
  
  @media (min-width: 640px) {
    .clients-dialog-footer {
      flex-direction: row;
      justify-content: flex-end;
    }
  }
  
  .clients-dialog-close {
    position: absolute;
    right: 1rem;
    top: 1rem;
    border-radius: 0.375rem;
    opacity: 0.7;
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0.25rem;
    transition: all 0.2s ease;
  }
  
  .clients-dialog-close:hover {
    opacity: 1;
    background: #f3f4f6;
  }
  
  /* Form Styles */
  .clients-label {
    font-size: 0.875rem;
    font-weight: 500;
    line-height: 1;
    color: #374151;
  }
  
  .clients-label-required::after {
    content: '*';
    color: #ef4444;
    margin-left: 0.25rem;
  }
  
  .clients-input {
    width: 100%;
    height: 2.5rem;
    padding: 0.5rem 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    background: white;
    color: #111827;
    outline: none;
    transition: all 0.2s ease;
  }
  
  .clients-input:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  .clients-input::placeholder {
    color: #9ca3af;
  }
  
  .clients-input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: #f9fafb;
  }
  
  .clients-form-group {
    display: grid;
    gap: 0.5rem;
  }
  
  /* Toast/Notification Styles */
  .clients-toast-container {
    position: fixed;
    bottom: 1rem;
    right: 1rem;
    z-index: 100;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    animation: slideUp 0.3s ease-out;
  }
  
  @keyframes slideUp {
    from {
      transform: translateY(100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  .clients-toast {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: white;
    border-radius: 0.5rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    border-left: 4px solid;
    min-width: 280px;
    max-width: 400px;
    animation: toastIn 0.3s ease-out;
  }
  
  @keyframes toastIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  .clients-toast-success {
    border-left-color: #10b981;
  }
  
  .clients-toast-success svg {
    color: #10b981;
  }
  
  .clients-toast-error {
    border-left-color: #ef4444;
  }
  
  .clients-toast-error svg {
    color: #ef4444;
  }
  
  .clients-toast-info {
    border-left-color: #3b82f6;
  }
  
  .clients-toast-info svg {
    color: #3b82f6;
  }
  
  .clients-toast-message {
    flex: 1;
    font-size: 0.875rem;
    color: #374151;
  }
  
  .clients-toast-close {
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0.25rem;
    color: #9ca3af;
    transition: color 0.2s ease;
  }
  
  .clients-toast-close:hover {
    color: #374151;
  }
  
  /* Error Message */
  .error-message {
    background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
    border: 1px solid #fca5a5;
    border-radius: 0.5rem;
    padding: 0.75rem 1rem;
    color: #dc2626;
    font-size: 0.875rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .success-message {
    background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
    border: 1px solid #86efac;
    border-radius: 0.5rem;
    padding: 0.75rem 1rem;
    color: #059669;
    font-size: 0.875rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  /* Warning Box for Delete */
  .delete-warning {
    background: #fffbeb;
    border: 1px solid #fde68a;
    border-radius: 0.5rem;
    padding: 1rem;
    margin: 1rem 0;
  }
  
  .delete-warning-title {
    font-weight: 600;
    color: #d97706;
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .delete-warning-text {
    font-size: 0.875rem;
    color: #92400e;
  }
  
  /* Pagination Styles */
  .clients-pagination-container {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem;
    border-top: 1px solid #e5e7eb;
  }
  
  .clients-pagination-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border: 1px solid #d1d5db;
    background: white;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .clients-pagination-btn:hover:not(:disabled) {
    background: #f9fafb;
    border-color: #9ca3af;
    transform: translateY(-1px);
  }
  
  .clients-pagination-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .clients-pagination-info {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    color: #6b7280;
  }
  
  .clients-pagination-active {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
    border-color: #3b82f6;
  }
  
  /* Grid layout for form */
  .form-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  @media (min-width: 640px) {
    .form-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  
  .form-full-width {
    grid-column: 1 / -1;
  }
  
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
  
  .text-destructive {
    color: #ef4444;
  }
  
  /* Animations */
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
  
  .deleting {
    animation: pulse 1s ease-in-out infinite;
    pointer-events: none;
    opacity: 0.6;
  }
`;

// ==================== TOAST COMPONENT ====================
const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [onClose]);
  
  const Icon = type === 'success' ? CheckCircle : type === 'error' ? AlertTriangle : Info;
  
  return (
    <div className={`clients-toast clients-toast-${type}`}>
      <Icon size={20} />
      <span className="clients-toast-message">{message}</span>
      <button className="clients-toast-close" onClick={onClose}>
        <X size={16} />
      </button>
    </div>
  );
};

// ==================== COMPONENTS ====================
const PageHeader = ({ title, subtitle, actions }) => (
  <div className="clients-page-header">
    <div>
      <h1 className="clients-title">{title}</h1>
      {subtitle && <p className="clients-subtitle">{subtitle}</p>}
    </div>
    {actions && <div className="clients-actions">{actions}</div>}
  </div>
);

const Card = ({ children, className = '' }) => (
  <div className={`clients-card ${className}`}>{children}</div>
);

const Button = ({ children, variant = 'default', size = 'default', className = '', ...props }) => {
  const variantClass = variant === 'outline' ? 'clients-btn-outline' :
                       variant === 'ghost' ? 'clients-btn-ghost' :
                       variant === 'danger' ? 'clients-btn-danger' :
                       'clients-btn-primary';
  
  const sizeClass = size === 'icon' ? 'clients-btn-icon' : 'clients-btn-default';
  
  return (
    <button className={`clients-btn ${variantClass} ${sizeClass} ${className}`} {...props}>
      {children}
    </button>
  );
};

const Input = ({ className = '', type = 'text', ...props }) => (
  <input type={type} className={`clients-input ${className}`} {...props} />
);

const Label = ({ children, required = false, className = '' }) => (
  <label className={`clients-label ${required ? 'clients-label-required' : ''} ${className}`}>
    {children}
  </label>
);

// ==================== PAGINATION COMPONENT ====================
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
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
    <div className="clients-pagination-container">
      <button
        className="clients-pagination-btn"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft size={16} />
        Précédent
      </button>
      
      {getPageNumbers().map((page, index) => (
        page === '...' ? (
          <span key={`ellipsis-${index}`} className="clients-pagination-info">...</span>
        ) : (
          <button
            key={page}
            className={`clients-pagination-btn ${currentPage === page ? 'clients-pagination-active' : ''}`}
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        )
      ))}
      
      <button
        className="clients-pagination-btn"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Suivant
        <ChevronRight size={16} />
      </button>
    </div>
  );
};

// ==================== CONFIRM DIALOG COMPONENT ====================
const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel, variant = 'danger', loading = false }) => {
  if (!isOpen) return null;
  
  return (
    <div className="clients-overlay" onClick={onCancel}>
      <div className="clients-dialog clients-dialog-danger" onClick={(e) => e.stopPropagation()}>
        <div className="clients-dialog-header">
          <h2 className={`clients-dialog-title ${variant === 'danger' ? 'clients-dialog-title-danger' : ''}`}>
            {variant === 'danger' ? <AlertTriangle size={24} /> : <Info size={24} />}
            {title}
          </h2>
          <p className="clients-dialog-description">
            {message}
          </p>
        </div>
        <div className="clients-dialog-footer">
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            Annuler
          </Button>
          <Button 
            variant="danger" 
            onClick={onConfirm}
            disabled={loading}
            className={loading ? 'deleting' : ''}
          >
            {loading && <div className="clients-loading-spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />}
            {variant === 'danger' ? 'Supprimer' : 'Confirmer'}
          </Button>
        </div>
        <button className="clients-dialog-close" onClick={onCancel} disabled={loading}>
          <X size={18} />
          <span className="sr-only">Fermer</span>
        </button>
      </div>
    </div>
  );
};

// ==================== HELPER FUNCTIONS FOR EXPORT ====================
const API_URL = window.REACT_APP_API_URL || "https://amg-telecom-backd-production.up.railway.app/api";
const PLAN_LABEL = { '1m': '1 mois', '3m': '3 mois', '6m': '6 mois', '12m': '12 mois' };

const safeNumber = (value) => {
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

const safeToFixed = (value, decimals = 2) => {
  return safeNumber(value).toFixed(decimals);
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
};

const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

const getCompanyInfo = () => {
  const saved = localStorage.getItem('company_info');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
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
        tp_number: '34779711'
      };
    }
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
    tp_number: '34779711'
  };
};

// Helper to get product price
const getProductPrice = (activation) => {
  if (activation.product && activation.product.prix) {
    return safeNumber(activation.product.prix);
  }
  if (activation.product && activation.product.prix_vente) {
    return safeNumber(activation.product.prix_vente);
  }
  if (activation.produit && activation.produit.prix) {
    return safeNumber(activation.produit.prix);
  }
  return safeNumber(activation.price);
};

// Helper to get total paid (activation + renewals)
const getTotalPaid = (activation) => {
  let total = safeNumber(activation.price);
  if (activation.renewal_history && Array.isArray(activation.renewal_history)) {
    activation.renewal_history.forEach(entry => {
      if (entry.action === 'renewal') {
        total += safeNumber(entry.price);
      }
    });
  }
  return total;
};

// Helper to get all action history for an activation
const getAllActionHistory = (activation) => {
  const actions = [];
  
  if (activation.activated_at) {
    actions.push({
      id: `activation_${activation.id}`,
      date: activation.activated_at,
      action_type: 'Activation',
      plan: activation.plan_abonnement,
      amount: safeNumber(activation.price),
      user_name: activation.created_by_user_name || 'System',
      details: `Activation initiale avec plan ${PLAN_LABEL[activation.plan_abonnement] || activation.plan_abonnement}`
    });
  }
  
  if (activation.renewal_history && Array.isArray(activation.renewal_history)) {
    activation.renewal_history.forEach((entry, idx) => {
      if (entry.action === 'renewal') {
        actions.push({
          id: `renewal_${activation.id}_${idx}`,
          date: entry.date,
          action_type: 'Renouvellement',
          plan: entry.new_plan,
          amount: safeNumber(entry.price),
          old_plan: entry.old_plan,
          new_plan: entry.new_plan,
          user_name: entry.user_name || 'System',
          details: `${PLAN_LABEL[entry.old_plan] || entry.old_plan} → ${PLAN_LABEL[entry.new_plan] || entry.new_plan}`
        });
      } else if (entry.action === 'suspension') {
        actions.push({
          id: `suspension_${activation.id}_${idx}`,
          date: entry.date,
          action_type: 'Suspension',
          amount: 0,
          user_name: entry.user_name || 'System',
          details: `Service suspendu${entry.reason ? `: ${entry.reason}` : ''}`
        });
      } else if (entry.action === 'reactivation') {
        actions.push({
          id: `reactivation_${activation.id}_${idx}`,
          date: entry.date,
          action_type: 'Réactivation',
          amount: 0,
          user_name: entry.user_name || 'System',
          details: 'Service réactivé'
        });
      }
    });
  }
  
  actions.sort((a, b) => new Date(a.date) - new Date(b.date));
  return actions;
};

const exportClientSalesToExcel = async (client, sales, fetchSaleActivations) => {
  if (!sales || sales.length === 0) {
    alert(`Aucune vente trouvée pour le client "${client.nom}"`);
    return;
  }

  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`Client_${client.nom}_Ventes`);

    // Logo and company header (unchanged)
    let logoAdded = false;
    try {
      const logoUrl = '/logo.png';
      const response = await fetch(logoUrl);
      if (response.ok) {
        const blob = await response.blob();
        const reader = new FileReader();
        const base64Logo = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
        const base64Data = base64Logo.split(',')[1];
        const imageId = workbook.addImage({
          base64: base64Data,
          extension: 'png',
        });
        worksheet.addImage(imageId, {
          tl: { col: 0, row: 0 },
          ext: { width: 180, height: 130 }
        });
        logoAdded = true;
      }
    } catch (err) {
      console.warn('Logo non trouvé', err);
    }

    let rowOffset = 0;
    if (logoAdded) {
      worksheet.addRow([]);
      rowOffset = 2;
    }

    const companyInfo = getCompanyInfo();
    const companyName = companyInfo.name;
    const companyAddress = companyInfo.address;
    const companyPhone = companyInfo.phone;
    const companyEmail = companyInfo.email;
    const companyIce = companyInfo.ice;
    const companyRc = companyInfo.rc;
    const companyPatente = companyInfo.patente;

    const headerRowStart = 1 + rowOffset;

    worksheet.mergeCells(`D${headerRowStart}:F${headerRowStart}`);
    worksheet.getCell(`D${headerRowStart}`).value = companyName;
    worksheet.getCell(`D${headerRowStart}`).font = { bold: true, size: 16 };
    worksheet.getCell(`D${headerRowStart}`).alignment = { horizontal: 'center', vertical: 'middle' };

    worksheet.mergeCells(`D${headerRowStart + 1}:F${headerRowStart + 1}`);
    worksheet.getCell(`D${headerRowStart + 1}`).value = companyAddress;
    worksheet.getCell(`D${headerRowStart + 1}`).font = { size: 10 };
    worksheet.getCell(`D${headerRowStart + 1}`).alignment = { horizontal: 'center', vertical: 'middle' };

    worksheet.mergeCells(`D${headerRowStart + 2}:F${headerRowStart + 2}`);
    worksheet.getCell(`D${headerRowStart + 2}`).value = `TEL: ${companyPhone} | EMAIL: ${companyEmail}`;
    worksheet.getCell(`D${headerRowStart + 2}`).font = { size: 10 };
    worksheet.getCell(`D${headerRowStart + 2}`).alignment = { horizontal: 'center', vertical: 'middle' };

    worksheet.mergeCells(`D${headerRowStart + 3}:F${headerRowStart + 3}`);
    worksheet.getCell(`D${headerRowStart + 3}`).value = `ICE: ${companyIce} | RC: ${companyRc} | Patente: ${companyPatente}`;
    worksheet.getCell(`D${headerRowStart + 3}`).font = { size: 9 };
    worksheet.getCell(`D${headerRowStart + 3}`).alignment = { horizontal: 'center', vertical: 'middle' };

    worksheet.addRow([]);

    // Title
    const titleRow = worksheet.addRow([`RAPPORT DES VENTES - CLIENT: ${client.nom.toUpperCase()}`]);
    worksheet.mergeCells(`A${titleRow.number}:N${titleRow.number}`);
    worksheet.getCell(`A${titleRow.number}`).font = { bold: true, size: 14 };
    worksheet.getCell(`A${titleRow.number}`).alignment = { horizontal: 'center' };
    worksheet.addRow([]);

    // Client info
    worksheet.addRow(['INFORMATIONS CLIENT']);
    worksheet.mergeCells(`A${worksheet.lastRow.number}:N${worksheet.lastRow.number}`);
    worksheet.getCell(`A${worksheet.lastRow.number}`).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A8A' }
    };
    worksheet.getCell(`A${worksheet.lastRow.number}`).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    worksheet.addRow(['Nom:', client.nom]);
    worksheet.addRow(['ICE:', client.ice_client || '-']);
    worksheet.addRow(['Téléphone:', client.telephone || '-']);
    worksheet.addRow(['Email:', client.email || '-']);
    worksheet.addRow(['Adresse:', client.adresse || '-']);
    worksheet.addRow([]);

    // Summary stats
    let totalSalesAmount = 0;
    let totalPaidAmount = 0;
    let amgSalesCount = 0;
    let clientSalesCount = 0;

    // Prepare sales with activations
    const salesWithActivations = [];
    for (const sale of sales) {
      let activations = [];
      const hasProducts = (sale.produits && sale.produits.length > 0) || (sale.items && sale.items.length > 0);
      const isAmgSale = hasProducts;

      if (isAmgSale) {
        try {
          activations = await fetchSaleActivations(sale.id);
        } catch (e) {
          console.warn(`Could not fetch activations for sale ${sale.id}`);
        }
      }

      salesWithActivations.push({
        ...sale,
        isAmgSale,
        activations
      });

      const saleTotal = safeNumber(sale.total);
      const salePaid = safeNumber(sale.amount_paid);
      totalSalesAmount += saleTotal;
      totalPaidAmount += salePaid;
      if (isAmgSale) amgSalesCount++;
      else clientSalesCount++;
    }

    // Stats row
    const statsRow = worksheet.addRow([
      'Total ventes:', sales.length,
      'Montant total TTC:', `${safeToFixed(totalSalesAmount)} MAD`,
      'Total encaissé:', `${safeToFixed(totalPaidAmount)} MAD`
    ]);
    statsRow.eachCell((cell) => { cell.font = { bold: true }; });

    const statsRow2 = worksheet.addRow([
      'Ventes AMG (Produits):', amgSalesCount,
      'Ventes Client (Hors AMG):', clientSalesCount,
      '', ''
    ]);
    worksheet.addRow([]);

    // ========== MAIN LOOP: keep only PRODUITS VENDUS and HISTORIQUE DES ACTIVATIONS ==========
    for (const sale of salesWithActivations) {
      // Only process AMG sales (non-AMG sales are completely omitted)
      if (!sale.isAmgSale) continue;

      // --- PRODUITS VENDUS section ---
      const saleItems = sale.produits || sale.items || [];
      let productsTotalTTC = 0; // will be used later for grand total

      if (saleItems.length > 0) {
        worksheet.addRow([]);
        const productsHeaderRow = worksheet.addRow(['PRODUITS VENDUS']);
        worksheet.mergeCells(`A${productsHeaderRow.number}:N${productsHeaderRow.number}`);
        worksheet.getCell(`A${productsHeaderRow.number}`).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF3B82F6' }
        };
        worksheet.getCell(`A${productsHeaderRow.number}`).font = { bold: true, color: { argb: 'FFFFFFFF' } };

        const productHeaders = ['Produit', 'Quantité', 'Prix Unitaire (MAD)', 'TVA 20% (MAD)', 'Total TTC (MAD)'];
        const productHeaderRow = worksheet.addRow(productHeaders);
        productHeaderRow.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
          cell.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        });

        for (const item of saleItems) {
          const qty = safeNumber(item.quantity || item.pivot?.quantite || 1);
          const unitPrice = safeNumber(item.unitPrice || item.pivot?.prix || item.prix_vente || item.prix);
          const totalHT = qty * unitPrice;
          const tva = totalHT * 0.2;
          const totalTTC = totalHT + tva;
          productsTotalTTC += totalTTC;

          const row = worksheet.addRow([item.name || item.nom, qty, safeToFixed(unitPrice), safeToFixed(tva), safeToFixed(totalTTC)]);
          row.eachCell((cell, colNumber) => {
            if (colNumber >= 3) cell.alignment = { horizontal: 'right' };
          });
        }

        worksheet.addRow([]);
        const productsTotalRow = worksheet.addRow(['', '', '', 'Total TTC produits:', `${safeToFixed(productsTotalTTC)} MAD`]);
        productsTotalRow.eachCell((cell, colNumber) => {
          if (colNumber === 5) {
            cell.font = { bold: true, color: { argb: 'FF2563EB' } };
            cell.alignment = { horizontal: 'right' };
          }
        });
      }

      // --- HISTORIQUE DES ACTIVATIONS section ---
      if (sale.activations && sale.activations.length > 0) {
        worksheet.addRow([]);
        const actionsHeaderRow = worksheet.addRow(['HISTORIQUE DES ACTIVATIONS']);
        worksheet.mergeCells(`A${actionsHeaderRow.number}:N${actionsHeaderRow.number}`);
        worksheet.getCell(`A${actionsHeaderRow.number}`).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF8B5CF6' }
        };
        worksheet.getCell(`A${actionsHeaderRow.number}`).font = { bold: true, color: { argb: 'FFFFFFFF' } };

        // Headers without IMEI and N° SIM
        const actionHeaders = [
          'Matricule', 'Action', 'Date', "Date d'expiration", 'Plan', 'Montant (MAD)', 'Statut Actuel'
        ];
        const actionHeaderRow = worksheet.addRow(actionHeaders);
        actionHeaderRow.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
          cell.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        });

        for (const activation of sale.activations) {
          const actions = getAllActionHistory(activation);
          const currentStatus = activation.status === 'suspended' ? 'Suspendu' :
                               activation.status === 'expired' ? 'Expiré' :
                               activation.status === 'pending' ? 'En attente' : 'Actif';
          const expirationDate = formatDate(activation.expires_at);

          for (const action of actions) {
            const amount = action.amount > 0 ? action.amount : 0;
            const rowData = [
              activation.matricule || '-',
              action.action_type,
              formatDateTime(action.date),
              expirationDate,
              action.plan ? (PLAN_LABEL[action.plan] || action.plan) : (action.new_plan ? (PLAN_LABEL[action.new_plan] || action.new_plan) : '-'),
              amount > 0 ? safeToFixed(amount) : '-',
              currentStatus
            ];
            worksheet.addRow(rowData);
          }
        }

        // Total activations revenue for this sale
        let totalActivationsRevenue = 0;
        for (const activation of sale.activations) {
          totalActivationsRevenue += getTotalPaid(activation);
        }
        worksheet.addRow([]);
        const activationTotalRow = worksheet.addRow(['', '', '', '', '', 'Total activations:', `${safeToFixed(totalActivationsRevenue)} MAD`]);
        activationTotalRow.eachCell((cell, colNumber) => {
          if (colNumber === 7) {
            cell.font = { bold: true, color: { argb: 'FF16A34A' } };
            cell.alignment = { horizontal: 'left' };
          }
        });

        // Add a blank row for spacing
        worksheet.addRow([]);

        // ========== NEW: TOTAL GÉNÉRAL row ==========
        const grandTotal = productsTotalTTC + totalActivationsRevenue;
        const grandTotalRow = worksheet.addRow(['', '', '', '', '', 'Total général:', `${safeToFixed(grandTotal)} MAD`]);
        grandTotalRow.eachCell((cell, colNumber) => {
          if (colNumber === 7) {
            cell.font = { bold: true, color: { argb: 'FFD97706' } }; // orange color for emphasis
            cell.alignment = { horizontal: 'left' };
          }
        });

      } else if (sale.isAmgSale) {
        // AMG sale with no activations: still show a note
        worksheet.addRow([]);
        worksheet.addRow(['Aucune activation trouvée pour cette vente AMG']);
      }

      // Add a blank row to separate different sales
      worksheet.addRow([]);
    }

    // Auto-size columns
    worksheet.columns.forEach((column) => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const cellValue = cell.value ? cell.value.toString() : '';
        let columnLength = cellValue.length;
        if (columnLength > maxLength) maxLength = columnLength;
      });
      let width = Math.max(10, Math.min(maxLength + 2, 35));
      column.width = width;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const fileName = `Client_${client.nom}_Ventes_${new Date().toISOString().slice(0, 10)}.xlsx`;
    saveAs(new Blob([buffer]), fileName);

  } catch (error) {
    console.error('Excel export error:', error);
    alert('Erreur lors de l\'export Excel');
  }
};

// ==================== MAIN COMPONENT ====================
const Clients = () => {
  const dispatch = useDispatch();
  const { list: clients, loading, error } = useSelector((state) => state.clients);
  const sales = useSelector(selectSales);
  const [exportingClientId, setExportingClientId] = useState(null);
  
  const [search, setSearch] = useState('');
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ 
    nom: '', 
    telephone: '', 
    email: '',
    ice_client: '',
    adresse: ''
  });
  const [formError, setFormError] = useState('');
  const [toasts, setToasts] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null, name: '' });
  const [deleting, setDeleting] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Fetch clients on mount
  useEffect(() => {
    dispatch(fetchClients());
  }, [dispatch]);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // Clear errors when modal opens/closes
  useEffect(() => {
    if (!open) {
      setFormError('');
      dispatch(clearClientError());
    }
  }, [open, dispatch]);

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

  // Handle search with debounce
  const handleSearch = (value) => {
    setSearch(value);
    
    if (searchTimeout) clearTimeout(searchTimeout);
    
    const timeout = setTimeout(() => {
      if (value.trim()) {
        dispatch(searchClients(value));
      } else {
        dispatch(fetchClients());
      }
    }, 500);
    
    setSearchTimeout(timeout);
  };

  // Filter clients based on search
  const filtered = search ? clients.filter(c =>
    (c.nom?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (c.telephone || '').includes(search) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.ice_client?.toString() || '').includes(search) ||
    (c.adresse?.toLowerCase() || '').includes(search.toLowerCase())
  ) : clients;

  // Pagination calculations
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedClients = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  const openNew = () => {
    setEditing(null);
    setForm({ nom: '', telephone: '', email: '', ice_client: '', adresse: '' });
    setFormError('');
    setOpen(true);
  };
  
  const openEdit = (c) => {
    setEditing(c);
    setForm({ 
      nom: c.nom || '', 
      telephone: c.telephone || '', 
      email: c.email || '',
      ice_client: c.ice_client || '',
      adresse: c.adresse || ''
    });
    setFormError('');
    setOpen(true);
  };
  
  const save = async () => {
    // Validation
    if (!form.nom || !form.nom.trim()) {
      setFormError('Le nom du client est requis');
      showToast('Le nom du client est requis', 'error');
      return;
    }
    
    if (!form.telephone || !form.telephone.trim()) {
      setFormError('Le numéro de téléphone est requis');
      showToast('Le numéro de téléphone est requis', 'error');
      return;
    }

    if (!form.ice_client || !form.ice_client.trim()) {
      setFormError("L'ICE client est requis");
      showToast("L'ICE client est requis", 'error');
      return;
    }

    // Validate ICE format (should be numeric)
    if (form.ice_client && !/^\d+$/.test(form.ice_client.toString())) {
      setFormError("L'ICE client doit contenir uniquement des chiffres");
      showToast("L'ICE client doit contenir uniquement des chiffres", 'error');
      return;
    }

    const clientData = {
      nom: form.nom.trim(),
      telephone: form.telephone.trim(),
      email: form.email?.trim() || null,
      ice_client: parseInt(form.ice_client),
      adresse: form.adresse?.trim() || null
    };

    try {
      if (editing) {
        await dispatch(updateClient({ id: editing.id, ...clientData })).unwrap();
        showToast(`Client "${form.nom}" mis à jour avec succès`, 'success');
      } else {
        await dispatch(createClient(clientData)).unwrap();
        showToast(`Client "${form.nom}" ajouté avec succès`, 'success');
      }
      setOpen(false);
      dispatch(fetchClients());
    } catch (err) {
      setFormError(err || 'Une erreur est survenue');
      showToast(err || 'Erreur lors de l\'enregistrement', 'error');
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await dispatch(deleteClient(confirmDelete.id)).unwrap();
      showToast(`Client "${confirmDelete.name}" supprimé avec succès`, 'success');
      dispatch(fetchClients());
      // Adjust current page if needed after deletion
      const newTotalPages = Math.ceil((filtered.length - 1) / itemsPerPage);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      } else if (filtered.length - 1 === 0) {
        setCurrentPage(1);
      }
    } catch (err) {
      showToast(err || 'Erreur lors de la suppression', 'error');
    } finally {
      setDeleting(false);
      setConfirmDelete({ isOpen: false, id: null, name: '' });
    }
  };

  const purchaseCount = (id) => sales?.filter(s => s.client_id === id || s.clientId === id).length || 0;
  const purchaseTotal = (id) => {
    const clientSales = sales?.filter(s => s.client_id === id || s.clientId === id) || [];
    return clientSales.reduce((sum, sale) => sum + (safeNumber(sale.total) || 0), 0);
  };

  // Function to fetch activations for a specific sale (for export)
  const fetchSaleActivations = async (saleId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/activations?sale_id=${saleId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        return data.activations || data.data || [];
      }
      return [];
    } catch (err) {
      console.error('Error fetching activations:', err);
      return [];
    }
  };

  // Export handler for a specific client
  const handleExportClientSales = async (client) => {
    const clientSales = sales?.filter(s => s.client_id === client.id || s.clientId === client.id) || [];
    if (clientSales.length === 0) {
      showToast(`Aucune vente trouvée pour le client "${client.nom}"`, 'error');
      return;
    }
    
    setExportingClientId(client.id);
    try {
      await exportClientSalesToExcel(client, clientSales, fetchSaleActivations);
      showToast(`Export des ventes pour "${client.nom}" terminé avec succès`, 'success');
    } catch (err) {
      console.error(err);
      showToast(`Erreur lors de l'export pour "${client.nom}"`, 'error');
    } finally {
      setExportingClientId(null);
    }
  };

  if (loading && clients.length === 0) {
    return (
      <div className="clients-loading">
        <div className="clients-loading-spinner" />
        <p style={{ marginTop: '1rem', color: '#6b7280' }}>Chargement des clients...</p>
      </div>
    );
  }

  return (
    <>
      <style>{styles}</style>
      
      {/* Toast Container */}
      {toasts.length > 0 && (
        <div className="clients-toast-container">
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
      
      <PageHeader
        title="Clients"
        subtitle={`${filtered.length} clients sur ${clients.length} enregistrés`}
        actions={
          <>
            <ExportMenu 
              title="Liste des clients" 
              rows={filtered} 
              dateField="created_at"
              columns={[
                { header: 'Nom', accessor: c => c.nom },
                { header: 'Téléphone', accessor: c => c.telephone || '-' },
                { header: 'Email', accessor: c => c.email || '-' },
                { header: 'ICE', accessor: c => c.ice_client || '-' },
                { header: 'Adresse', accessor: c => c.adresse || '-' },
                { header: 'Achats', accessor: c => purchaseCount(c.id) },
                { header: 'Total dépensé (MAD)', accessor: c => purchaseTotal(c.id).toFixed(2) },
              ]} 
            />

            <Button onClick={openNew}>
              <Plus size={16} /> Ajouter client
            </Button>
          </>
        }
      />

      <Card>
        <div className="clients-search-container">
          <div className="clients-search-wrapper">
            <Search className="clients-search-icon" />
            <input 
              className="clients-search-input" 
              placeholder="Rechercher par nom, téléphone, email, ICE ou adresse..." 
              value={search} 
              onChange={(e) => handleSearch(e.target.value)} 
            />
          </div>
        </div>
        <div className="clients-table-container">
          <table className="clients-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Téléphone</th>
                <th>Email</th>
                <th>ICE</th>
                <th>Adresse</th>
                <th>Achats</th>
                <th className="text-right">Total dépensé</th>
                <th className="w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedClients.map((c) => (
                <tr key={c.id}>
                  <td className="font-medium">{c.nom}</td>
                  <td>{c.telephone || '-'}</td>
                  <td className="text-muted">{c.email || '-'}</td>
                  <td className="font-mono text-sm">{c.ice_client || '-'}</td>
                  <td className="text-muted">{c.adresse || '-'}</td>
                  <td>{purchaseCount(c.id)}</td>
                  <td className="text-right font-semibold">{purchaseTotal(c.id).toFixed(2)} MAD</td>
                  <td>
                    <div className="clients-actions-cell">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleExportClientSales(c)} 
                        title={`Exporter toutes les ventes de ${c.nom}`}
                        disabled={exportingClientId === c.id}
                      >
                        <FileSpreadsheet size={16} className="text-green-600" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(c)} title="Modifier">
                        <Pencil size={16} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setConfirmDelete({ isOpen: true, id: c.id, name: c.nom })}
                        title="Supprimer"
                      >
                        <Trash2 size={16} className="text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedClients.length === 0 && (
                <tr>
                  <td colSpan={8} className="clients-empty">
                    {search ? 'Aucun client ne correspond à votre recherche' : 'Aucun client dans la base de données'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <Pagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          onPageChange={setCurrentPage} 
        />
      </Card>

      {/* Add/Edit Dialog */}
      {open && (
        <>
          <div className="clients-overlay" onClick={() => setOpen(false)} />
          <div className="clients-dialog">
            <div className="clients-dialog-header">
              <h2 className="clients-dialog-title">
                {editing ? '✏️ Modifier le client' : '➕ Nouveau client'}
              </h2>
              <p className="clients-dialog-description">
                {editing 
                  ? 'Modifiez les informations du client ci-dessous' 
                  : 'Remplissez les informations pour ajouter un nouveau client'}
              </p>
            </div>
            <div className="clients-dialog-body">
              {formError && (
                <div className="error-message">
                  <AlertTriangle size={16} />
                  {formError}
                </div>
              )}
              
              <div className="form-grid">
                <div className="clients-form-group">
                  <Label required>Nom complet</Label>
                  <Input 
                    value={form.nom} 
                    onChange={(e) => setForm({ ...form, nom: e.target.value })} 
                    placeholder="Ex: Jean Dupont"
                    autoFocus
                  />
                </div>
                
                <div className="clients-form-group">
                  <Label required>Numéro de téléphone</Label>
                  <Input 
                    value={form.telephone} 
                    onChange={(e) => setForm({ ...form, telephone: e.target.value })} 
                    placeholder="Ex: 06 12 34 56 78"
                  />
                </div>
                
                <div className="clients-form-group">
                  <Label>Adresse email</Label>
                  <Input 
                    type="email"
                    value={form.email} 
                    onChange={(e) => setForm({ ...form, email: e.target.value })} 
                    placeholder="client@example.com"
                  />
                </div>
                
                <div className="clients-form-group">
                  <Label required>ICE Client</Label>
                  <Input 
                    type="number"
                    value={form.ice_client} 
                    onChange={(e) => setForm({ ...form, ice_client: e.target.value })} 
                    placeholder="Ex: 123456789012345"
                  />
                  <small style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                    Identifiant Commun de l'Entreprise (ICE)
                  </small>
                </div>
                
                <div className="clients-form-group form-full-width">
                  <Label>Adresse</Label>
                  <Input 
                    value={form.adresse} 
                    onChange={(e) => setForm({ ...form, adresse: e.target.value })} 
                    placeholder="Ex: 123 Rue Example, Casablanca"
                  />
                </div>
              </div>
            </div>
            <div className="clients-dialog-footer">
              <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              <Button onClick={save}>
                {editing ? 'Mettre à jour' : 'Ajouter le client'}
              </Button>
            </div>
            <button className="clients-dialog-close" onClick={() => setOpen(false)}>
              <X size={18} />
              <span className="sr-only">Fermer</span>
            </button>
          </div>
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDelete.isOpen}
        title="Confirmer la suppression"
        message={
          <div className="delete-warning-text">
            Êtes-vous sûr de vouloir supprimer le client <strong>"{confirmDelete.name}"</strong> ?
            <br /><br />
            {purchaseCount(confirmDelete.id) > 0 && (
              <span style={{ color: '#dc2626' }}>
                ⚠️ Attention : Ce client a {purchaseCount(confirmDelete.id)} achat(s) associé(s). 
                La suppression du client n'affectera pas l'historique des ventes.
              </span>
            )}
            <br /><br />
            <span style={{ color: '#dc2626', fontSize: '0.875rem' }}>
              Cette action est irréversible.
            </span>
          </div>
        }
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete({ isOpen: false, id: null, name: '' })}
        variant="danger"
        loading={deleting}
      />
    </>
  );
};

export default Clients;