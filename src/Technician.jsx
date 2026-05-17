import { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Pencil, Trash2, Search, X, RefreshCw, AlertTriangle, 
  CheckCircle, Info, ChevronLeft, ChevronRight, FileSpreadsheet, 
  Eye, Edit2, Save, Printer, Calendar, Smartphone, Hash, 
  CreditCard, Clock, ExternalLink, Loader, Package, Trash,
  User, Check, AlertCircle, Download, History, Receipt, List,
  LogOut, MapPin, Phone, Mail, Building, Users, Wallet,
  Activity, Calendar as CalendarIcon, Database, Filter, Layers
} from 'lucide-react';
import { ExportMenu } from './ExportMenu';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  fetchClients,
  createClient,
  updateClient,
  deleteClient,
  searchClients,
  clearClientError,
  selectSales,
  fetchSales,
  createStandaloneActivation,
  createInstallation,
  fetchActivationStats,
  logout
} from './Store/store';

// ==================== MODERN STYLES (Fully Responsive - Mobile First) ====================
const styles = `
  /* Modern CSS Reset & Base */
  * {
    box-sizing: border-box;
  }
  
  /* Main Container */
  .technician-container {
    width: 100%;
    min-height: 100vh;
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    padding: 16px 12px;
  }
  
  @media (min-width: 640px) {
    .technician-container {
      padding: 20px 24px;
    }
  }
  
  @media (min-width: 1024px) {
    .technician-container {
      padding: 24px 32px;
    }
  }
  
  /* Header Section - Modern Glassmorphism */
  .technician-header {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 24px;
    padding: 16px;
    margin-bottom: 20px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.3);
  }
  
  @media (min-width: 640px) {
    .technician-header {
      padding: 20px 24px;
      margin-bottom: 24px;
    }
  }
  
  .technician-header-top {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 16px;
  }
  
  @media (min-width: 640px) {
    .technician-header-top {
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
  }
  
  .technician-title-section h1 {
    font-size: 1.5rem;
    font-weight: 800;
    background: linear-gradient(135deg, #1e3a8a, #3b82f6);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    margin-bottom: 4px;
    letter-spacing: -0.5px;
  }
  
  @media (min-width: 640px) {
    .technician-title-section h1 {
      font-size: 1.875rem;
    }
  }
  
  .technician-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: linear-gradient(135deg, #dbeafe, #eff6ff);
    padding: 4px 12px;
    border-radius: 40px;
    font-size: 0.7rem;
    font-weight: 600;
    color: #1e40af;
    border: 1px solid #bfdbfe;
  }
  
  @media (min-width: 640px) {
    .technician-badge {
      padding: 6px 16px;
      font-size: 0.75rem;
    }
  }
  
  .technician-stats {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
  }
  
  .stat-card {
    background: white;
    border-radius: 16px;
    padding: 10px 16px;
    display: flex;
    align-items: center;
    gap: 10px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
    border: 1px solid #e2e8f0;
    flex: 1;
    min-width: 100px;
  }
  
  .stat-icon {
    width: 36px;
    height: 36px;
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }
  
  .stat-info h4 {
    font-size: 0.7rem;
    color: #64748b;
    margin-bottom: 2px;
  }
  
  .stat-info p {
    font-size: 1.1rem;
    font-weight: 700;
    color: #1e293b;
  }
  
  @media (min-width: 640px) {
    .stat-card {
      padding: 12px 20px;
    }
    .stat-icon {
      width: 44px;
      height: 44px;
    }
    .stat-icon svg {
      width: 22px;
      height: 22px;
    }
    .stat-info h4 {
      font-size: 0.75rem;
    }
    .stat-info p {
      font-size: 1.25rem;
    }
  }
  
  /* Action Buttons */
  .technician-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }
  
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border-radius: 40px;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
    font-family: inherit;
  }
  
  @media (min-width: 640px) {
    .btn {
      padding: 10px 20px;
      font-size: 0.875rem;
    }
  }
  
  .btn-primary {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
  }
  
  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(37, 99, 235, 0.4);
  }
  
  .btn-outline {
    background: white;
    border: 1px solid #e2e8f0;
    color: #475569;
  }
  
  .btn-outline:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
  }
  
  .btn-danger {
    background: linear-gradient(135deg, #ef4444, #dc2626);
    color: white;
  }
  
  .btn-danger:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
  }
  
  /* Search Bar */
  .technician-search {
    background: white;
    border-radius: 20px;
    padding: 4px;
    display: flex;
    align-items: center;
    gap: 8px;
    border: 1px solid #e2e8f0;
    margin-bottom: 20px;
    transition: all 0.2s;
  }
  
  .technician-search:focus-within {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  .search-icon {
    padding-left: 12px;
    color: #94a3b8;
  }
  
  .technician-search input {
    flex: 1;
    border: none;
    padding: 12px 8px 12px 0;
    font-size: 0.875rem;
    background: transparent;
    outline: none;
  }
  
  /* Cards Container */
  .clients-grid {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  /* Modern Client Card (Mobile First) */
  .client-card {
    background: white;
    border-radius: 20px;
    overflow: hidden;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    border: 1px solid #eef2f6;
  }
  
  .client-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.1);
  }
  
  .card-header {
    padding: 16px;
    background: linear-gradient(135deg, #f8fafc, #ffffff);
    border-bottom: 1px solid #eef2f6;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  
  .client-name {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }
  
  .client-name h3 {
    font-size: 1rem;
    font-weight: 700;
    color: #0f172a;
    margin: 0;
  }
  
  .client-phone {
    display: flex;
    align-items: center;
    gap: 4px;
    background: #f1f5f9;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 0.7rem;
    color: #475569;
  }
  
  @media (min-width: 640px) {
    .card-header {
      padding: 18px 20px;
    }
    .client-name h3 {
      font-size: 1.1rem;
    }
  }
  
  .card-actions {
    display: flex;
    gap: 6px;
  }
  
  .icon-btn {
    background: transparent;
    border: none;
    padding: 8px;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #64748b;
  }
  
  .icon-btn:hover {
    background: #f1f5f9;
    color: #3b82f6;
  }
  
  .icon-btn.danger:hover {
    background: #fef2f2;
    color: #ef4444;
  }
  
  .card-body {
    padding: 16px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  
  .info-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.75rem;
    color: #475569;
  }
  
  .info-row svg {
    width: 14px;
    height: 14px;
    color: #94a3b8;
    flex-shrink: 0;
  }
  
  .info-row span:last-child {
    color: #1e293b;
    font-weight: 500;
    word-break: break-word;
  }
  
  .full-width {
    grid-column: span 2;
  }
  
  @media (min-width: 640px) {
    .card-body {
      padding: 16px 20px;
      gap: 14px;
    }
    .info-row {
      font-size: 0.813rem;
    }
    .info-row svg {
      width: 16px;
      height: 16px;
    }
  }
  
  .card-footer {
    padding: 12px 16px;
    background: #f8fafc;
    border-top: 1px solid #eef2f6;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
  }
  
  .stats-badge {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border-radius: 40px;
    font-size: 0.7rem;
    font-weight: 600;
  }
  
  .badge-primary {
    background: #dbeafe;
    color: #1e40af;
  }
  
  .badge-success {
    background: #d1fae5;
    color: #065f46;
  }
  
  .total-spent {
    font-weight: 700;
    color: #059669;
    font-size: 0.9rem;
  }
  
  @media (min-width: 640px) {
    .card-footer {
      padding: 14px 20px;
    }
    .badge {
      padding: 6px 14px;
      font-size: 0.75rem;
    }
    .total-spent {
      font-size: 1rem;
    }
  }
  
  /* Empty State */
  .empty-state {
    text-align: center;
    padding: 48px 24px;
    background: white;
    border-radius: 24px;
    border: 1px solid #eef2f6;
  }
  
  .empty-state svg {
    width: 64px;
    height: 64px;
    color: #cbd5e1;
    margin-bottom: 16px;
  }
  
  .empty-state p {
    color: #64748b;
    font-size: 0.875rem;
  }
  
  /* Loading State */
  .loading-state {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 300px;
  }
  
  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #e2e8f0;
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  /* Pagination */
  .pagination-modern {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 6px;
    margin-top: 24px;
    flex-wrap: wrap;
  }
  
  .page-btn {
    background: white;
    border: 1px solid #e2e8f0;
    padding: 8px 12px;
    border-radius: 40px;
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    color: #475569;
  }
  
  .page-btn.active {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
    border-color: transparent;
  }
  
  .page-btn:hover:not(.active) {
    background: #f1f5f9;
  }
  
  .page-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  /* Modal Styles */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(8px);
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
  }
  
  .modal-container {
    background: white;
    border-radius: 28px;
    width: 100%;
    max-width: 500px;
    max-height: 90vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    animation: modalSlideIn 0.3s ease;
  }
  
  @keyframes modalSlideIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .modal-container-large {
    max-width: 1100px;
  }
  
  .modal-header {
    padding: 18px 20px;
    border-bottom: 1px solid #eef2f6;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .modal-header h2 {
    font-size: 1.125rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 10px;
    color: #0f172a;
  }
  
  .modal-body {
    padding: 20px;
    overflow-y: auto;
    flex: 1;
  }
  
  .modal-footer {
    padding: 16px 20px;
    border-top: 1px solid #eef2f6;
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
  
  /* Form Styles */
  .form-group {
    margin-bottom: 16px;
  }
  
  .form-label {
    display: block;
    font-size: 0.75rem;
    font-weight: 600;
    color: #475569;
    margin-bottom: 6px;
  }
  
  .form-label.required::after {
    content: '*';
    color: #ef4444;
    margin-left: 4px;
  }
  
  .form-input {
    width: 100%;
    padding: 12px 14px;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    font-size: 0.875rem;
    transition: all 0.2s;
    background: white;
  }
  
  .form-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  .form-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  @media (min-width: 640px) {
    .form-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  
  /* Toast Notifications */
  .toast-container {
    position: fixed;
    bottom: 20px;
    left: 20px;
    right: 20px;
    z-index: 200;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
  @media (min-width: 640px) {
    .toast-container {
      left: auto;
      right: 20px;
      min-width: 320px;
    }
  }
  
  .toast {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    background: white;
    border-radius: 16px;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
    border-left: 4px solid;
    animation: toastSlide 0.3s ease;
  }
  
  @keyframes toastSlide {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  .toast-success { border-left-color: #10b981; }
  .toast-error { border-left-color: #ef4444; }
  .toast-info { border-left-color: #3b82f6; }
  
  .toast-message {
    flex: 1;
    font-size: 0.813rem;
    color: #334155;
  }
  
  /* Toggle Group */
  .toggle-group {
    display: flex;
    gap: 8px;
    background: #f1f5f9;
    padding: 4px;
    border-radius: 60px;
    margin-bottom: 20px;
  }
  
  .toggle-btn {
    flex: 1;
    padding: 10px 16px;
    border-radius: 40px;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    text-align: center;
    background: transparent;
    border: none;
    transition: all 0.2s;
    color: #64748b;
  }
  
  .toggle-btn.active {
    background: white;
    color: #2563eb;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }
  
  /* Activation Item */
  .activation-item {
    background: #f8fafc;
    border-radius: 20px;
    padding: 16px;
    margin-bottom: 16px;
    border: 1px solid #e2e8f0;
  }
  
  .activation-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 14px;
    padding-bottom: 10px;
    border-bottom: 1px solid #e2e8f0;
  }
  
  .activation-title {
    font-size: 0.813rem;
    font-weight: 700;
    color: #2563eb;
  }
  
  .remove-btn {
    background: #fee2e2;
    border: none;
    padding: 6px 12px;
    border-radius: 40px;
    font-size: 0.7rem;
    color: #dc2626;
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
  }
  
  /* Status Badge */
  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border-radius: 40px;
    font-size: 0.65rem;
    font-weight: 600;
  }
  
  .status-active { background: #d1fae5; color: #065f46; }
  .status-primary { background: #dbeafe; color: #1e40af; }
  .status-pending { background: #fed7aa; color: #92400e; }
  .status-expired { background: #f1f5f9; color: #475569; }
  
  /* Client Info Card in Modal */
  .client-info-modal {
    background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
    border-radius: 20px;
    padding: 16px;
    margin-bottom: 20px;
  }
  
  .client-info-modal h4 {
    font-size: 0.75rem;
    font-weight: 600;
    color: #1e40af;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 10px;
  }
  
  .info-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.7rem;
    color: #334155;
  }
  
  .info-item svg {
    width: 14px;
    height: 14px;
    color: #3b82f6;
  }
  
  /* Table for Activations */
  .table-wrapper {
    overflow-x: auto;
    border-radius: 16px;
    border: 1px solid #eef2f6;
  }
  
  .activations-table {
    width: 100%;
    min-width: 700px;
    border-collapse: collapse;
    font-size: 0.7rem;
  }
  
  .activations-table th {
    background: #f8fafc;
    padding: 12px;
    text-align: left;
    font-weight: 600;
    color: #475569;
    border-bottom: 1px solid #e2e8f0;
  }
  
  .activations-table td {
    padding: 10px 12px;
    border-bottom: 1px solid #f1f5f9;
  }
  
  .total-amount {
    font-weight: 700;
    color: #059669;
  }
  
  /* Responsive Utilities */
  .hide-mobile {
    display: none;
  }
  
  @media (min-width: 640px) {
    .hide-mobile {
      display: inline-flex;
    }
    .hide-desktop {
      display: none;
    }
  }
  
  .text-right {
    text-align: right;
  }
  
  .spinning {
    animation: spin 1s linear infinite;
  }
`;

// ==================== HELPER FUNCTIONS ====================
const API_URL = window.REACT_APP_API_URL || "https://amg-telecom-backd-production.up.railway.app/api";
const safeNumber = (value) => { const n = Number(value); return isNaN(n) ? 0 : n; };
const safeToFixed = (value, decimals = 2) => safeNumber(value).toFixed(decimals);
const TVA_RATE = 0.20;

const calculateTTC = (htPrice) => safeNumber(htPrice) * (1 + TVA_RATE);

const getDisplayImei = (activation) => {
  if (activation.imei && activation.imei.trim()) return activation.imei;
  if (activation.client_imei && activation.client_imei.trim()) return activation.client_imei;
  return '-';
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
    tp_number: '34779711'
  };
};

const PLAN_LABEL = { '1m': '1 mois', '3m': '3 mois', '6m': '6 mois', '12m': '12 mois' };
const PLAN_OPTIONS = [
  { value: '1m', label: '1 mois' },
  { value: '3m', label: '3 mois' },
  { value: '6m', label: '6 mois' },
  { value: '12m', label: '12 mois' }
];

// ==================== TOAST COMPONENT ====================
const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);
  const Icon = type === 'success' ? CheckCircle : type === 'error' ? AlertTriangle : Info;
  return (
    <div className={`toast toast-${type}`}>
      <Icon size={18} />
      <span className="toast-message">{message}</span>
      <button className="icon-btn" onClick={onClose} style={{ padding: 4 }}><X size={14} /></button>
    </div>
  );
};

// ==================== CONFIRM DIALOG ====================
const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel, loading = false }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onCancel}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: '0.875rem' }}>{message}</p>
        </div>
        <div className="modal-footer">
          <button onClick={onCancel} className="btn btn-outline" disabled={loading}>Annuler</button>
          <button onClick={onConfirm} className="btn btn-primary" disabled={loading} style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
            {loading && <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />}
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================== ACTIVATIONS DETAILS MODAL ====================
const ActivationsDetailsModal = ({ client, onClose, showToast }) => {
  const [activationsData, setActivationsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatingPdfTTC, setGeneratingPdfTTC] = useState(false);
  const [generatingPdfHT, setGeneratingPdfHT] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const { user } = useSelector((state) => state.auth);
  const isTechnician = user?.role === 'technician';
  const currentUserId = user?.id;

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const [activationsRes, salesRes] = await Promise.all([
          fetch(`${API_URL}/activations?client_id=${client.id}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/ventes?client_id=${client.id}`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        
        let allActivations = activationsRes.ok ? (await activationsRes.json()).data || [] : [];
        let clientSales = salesRes.ok ? (await salesRes.json()).ventes || [] : [];
        
        if (isTechnician && currentUserId) {
          allActivations = allActivations.filter(act => act.user_id === currentUserId);
          clientSales = clientSales.filter(sale => sale.user_id === currentUserId);
        }
        
        const processed = [];
        const keys = new Set();
        
        for (const act of allActivations) {
          const sale = clientSales.find(s => s.id === act.vente_id);
          const actPriceHT = safeNumber(act.price);
          let salePriceHT = 0;
          
          if (sale) {
            const prod = sale.produits?.find(p => p.id === act.produit_id);
            if (prod) {
              salePriceHT = safeNumber(prod.pivot?.prix || prod.prix_vente || 0) * (prod.pivot?.quantite || 1);
            }
          }
          
          const key = `act_${act.id}`;
          if (!keys.has(key) && act.activated_at) {
            keys.add(key);
            let type = 'Activation Simple';
            if (act.vente_id) type = sale ? 'Installation + Activation' : 'Activation (Vente)';
            
            processed.push({
              id: act.id,
              type,
              date: act.activated_at,
              matricule: act.matricule || '-',
              imei: act.imei,
              clientImei: act.client_imei,
              displayImei: getDisplayImei(act),
              operator: act.operateur || '-',
              expirationDate: act.expires_at,
              plan: act.plan_abonnement,
              activationPriceHT: actPriceHT,
              salePriceHT,
              totalTTC: calculateTTC(actPriceHT) + calculateTTC(salePriceHT),
              status: act.status,
              createdBy: act.user?.name || act.user_name || 'N/A'
            });
          }
          
          if (act.renewal_history?.length) {
            act.renewal_history.forEach((entry, idx) => {
              const renewalKey = `renew_${act.id}_${entry.date}`;
              if (!keys.has(renewalKey) && entry.action === 'renewal') {
                keys.add(renewalKey);
                processed.push({
                  id: `${act.id}_renewal_${idx}`,
                  type: 'Renouvellement',
                  date: entry.date,
                  matricule: act.matricule || '-',
                  displayImei: getDisplayImei(act),
                  operator: act.operateur || '-',
                  expirationDate: entry.new_expires_at,
                  plan: entry.new_plan,
                  activationPriceHT: safeNumber(entry.price),
                  salePriceHT: 0,
                  totalTTC: calculateTTC(safeNumber(entry.price)),
                  status: act.status,
                  createdBy: act.user?.name || act.user_name || 'N/A'
                });
              }
            });
          }
        }
        
        processed.sort((a, b) => new Date(a.date) - new Date(b.date));
        setActivationsData(processed);
      } catch (err) {
        console.error(err);
        showToast('Erreur de chargement', 'error');
      } finally {
        setLoading(false);
      }
    };
    if (client?.id) loadData();
  }, [client, showToast, isTechnician, currentUserId]);

 const generatePDF = async (includeTVA = true) => {
  try {
    if (includeTVA) {
      setGeneratingPdfTTC(true);
    } else {
      setGeneratingPdfHT(true);
    }

    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;

    const doc = new jsPDF('p', 'mm', 'a4');
    const companyInfo = getCompanyInfo();

    let logoBase64 = null;
    try {
      const response = await fetch('/logo.png');
      const blob = await response.blob();
      logoBase64 = await new Promise(resolve => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    } catch (e) {}

    if (logoBase64) {
      doc.addImage(logoBase64, 'PNG', 87.5, 10, 35, 30);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(companyInfo.name.toUpperCase(), 12, 50);
    doc.setFont('times', 'normal');
    doc.setFontSize(9.5);
    const addressLines = doc.splitTextToSize(companyInfo.address, 70);
    doc.text(addressLines, 12, 56);     
    doc.text(`Tél: ${companyInfo.phone}`, 12, 68);
    doc.text(`Email: ${companyInfo.email}`, 12, 73);

    doc.setFont('helvetica', 'bold');
    doc.text('RELEVÉ POUR :', 130, 50);
    doc.setFont('times', 'bold');
    doc.setFontSize(13);
    doc.text(client.nom.toUpperCase(), 130, 57);
    doc.setFont('times', 'normal');
    doc.setFontSize(10);

    let y = 63;
    if (client.adresse) {
      doc.text(client.adresse, 130, y);
      y += 5;
    }
    if (client.telephone) {
      doc.text(`Tél: ${client.telephone}`, 130, y);
      y += 5;
    }
    doc.text(`DATE : ${new Date().toLocaleDateString('fr-FR')}`, 130, y + 5);

    const formatMoney = (val) => `${Number(val || 0).toFixed(2)} DH`;

    // FIX: Calculate prices correctly for each activation item
    const processedData = activationsData.map(item => {
      let displayPrice;
      if (includeTVA) {
        // Calculate TTC price: (activationPriceHT * 1.2) + (salePriceHT * 1.2)
        const activationTTC = (item.activationPriceHT || 0) * 1.2;
        const saleTTC = (item.salePriceHT || 0) * 1.2;
        displayPrice = activationTTC + saleTTC;
      } else {
        // HT price is just the sum of HT values
        displayPrice = (item.activationPriceHT || 0) + (item.salePriceHT || 0);
      }
      return { ...item, displayPriceForPdf: displayPrice };
    });

    const rows = processedData.map(item => [
      item.date ? new Date(item.date).toLocaleDateString('fr-FR') : '-',
      item.type || '-',
      item.matricule || '-',
      PLAN_LABEL[item.plan] || item.plan || '-',
      formatMoney(item.displayPriceForPdf)
    ]);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    const titleText = includeTVA 
      ? 'DÉTAIL DES ACTIVATIONS (Prix TTC - TVA incluse)'
      : 'DÉTAIL DES ACTIVATIONS (Prix HT - TVA exclue)';
    doc.text(titleText, 105, 108, { align: 'center' });

    autoTable(doc, {
      startY: 116,
      head: [[
        { content: "Date d'activation", styles: { textColor: [59, 130, 246] } },
        { content: 'Type', styles: { textColor: [139, 92, 246] } },
        { content: 'Matricule', styles: { textColor: [16, 185, 129] } },
        { content: 'Plan', styles: { textColor: [245, 158, 11] } },
        { content: includeTVA ? 'Prix TTC' : 'Prix HT', styles: { textColor: [239, 68, 68] } }
      ]],
      body: rows,
      theme: 'grid',
      styles: { font: 'times', fontSize: 10, cellPadding: 4, valign: 'middle' },
      headStyles: { fillColor: [248, 250, 252], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center', lineWidth: 0.3 },
      columnStyles: {
        0: { halign: 'center', cellWidth: 42 },
        1: { halign: 'center', cellWidth: 45 },
        2: { halign: 'center', cellWidth: 40 },
        3: { halign: 'center', cellWidth: 32 },
        4: { halign: 'right', cellWidth: 30 }
      },
      didDrawPage: () => {
        doc.setDrawColor(200);
        doc.rect(5, 5, 200, 287);
      }
    });

    const total = processedData.reduce((s, i) => s + safeNumber(i.displayPriceForPdf), 0);
    const finalY = doc.lastAutoTable.finalY + 15;

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(140, finalY - 9, 55, 14, 3, 3, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    const totalLabel = includeTVA ? 'TOTAL TTC :' : 'TOTAL HT :';
    doc.text(totalLabel, 145, finalY);
    doc.setFont('times', 'bold');
    doc.text(formatMoney(total), 190, finalY, { align: 'right' });

    if (!includeTVA) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text('* TVA (20%) non incluse dans ce relevé', 14, finalY + 10);
      doc.setTextColor(0, 0, 0);
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`* TVA (20%) incluse - Taux applicable: ${TVA_RATE * 100}%`, 14, finalY + 10);
      doc.setTextColor(0, 0, 0);
    }

    const fileNameSuffix = includeTVA ? 'TTC' : 'HT';
    doc.save(`Releve_${client.nom.replace(/\s+/g, '_')}_${fileNameSuffix}.pdf`);
    showToast(`PDF généré avec succès (${includeTVA ? 'TTC - TVA incluse' : 'HT - TVA exclue'})`, 'success');

  } catch (err) {
    console.error(err);
    showToast('Erreur lors de la génération du PDF', 'error');
  } finally {
    if (includeTVA) {
      setGeneratingPdfTTC(false);
    } else {
      setGeneratingPdfHT(false);
    }
  }
};
  
  const exportExcel = async () => {
    setExportingExcel(true);
    try {
      const workbook = new ExcelJS.Workbook();
      const ws = workbook.addWorksheet(`Activations_${client.nom}`);
      ws.addRow(['Date', 'Type', 'Matricule', 'IMEI', 'Opérateur', 'Expiration', 'Plan', 'Prix HT', 'Prix TTC', 'Statut', 'Créé par']);
      activationsData.forEach(act => {
        ws.addRow([
          new Date(act.date).toLocaleDateString('fr-FR'),
          act.type,
          act.matricule,
          act.displayImei,
          act.operator,
          act.expirationDate ? new Date(act.expirationDate).toLocaleDateString('fr-FR') : '-',
          PLAN_LABEL[act.plan] || act.plan || '-',
          (act.activationPriceHT + act.salePriceHT).toFixed(2),
          act.totalTTC.toFixed(2),
          act.status === 'active' ? 'Actif' : 'Expiré',
          act.createdBy
        ]);
      });
      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `Client_${client.nom}_Activations.xlsx`);
      showToast('Export Excel réussi', 'success');
    } catch (err) {
      showToast('Erreur export Excel', 'error');
    } finally {
      setExportingExcel(false);
    }
  };
  
  const totalTTC = activationsData.reduce((s, act) => s + act.totalTTC, 0);
  const activationCount = activationsData.filter(a => a.type !== 'Renouvellement').length;
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container modal-container-large" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2><Smartphone size={20} /> Détails - {client.nom}</h2>
          <button className="icon-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">
          {/* Client Information Card */}
          <div className="client-info-modal">
            <h4><Building size={14} /> Informations Client</h4>
            <div className="info-grid">
              <div className="info-item"><User size={12} /> {client.nom}</div>
              <div className="info-item"><Phone size={12} /> {client.telephone || '-'}</div>
              <div className="info-item"><Mail size={12} /> {client.email || '-'}</div>
              <div className="info-item"><Hash size={12} /> ICE: {client.ice_client || '-'}</div>
              <div className="info-item full-width"><MapPin size={12} /> {client.adresse || '-'}</div>
            </div>
          </div>
          
          {loading ? (
            <div className="loading-state"><div className="spinner" /></div>
          ) : activationsData.length === 0 ? (
            <div className="empty-state" style={{ padding: 40 }}>
              <Info size={48} color="#94a3b8" />
              <p>Aucune activation trouvée</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20, justifyContent: 'space-between' }}>
                <div className="stats-badge">
                  <span className="badge badge-primary">{activationCount} activation(s)</span>
                  <span className="badge badge-success">{activationsData.length - activationCount} renouvellement(s)</span>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button onClick={exportExcel} className="btn btn-outline" disabled={exportingExcel}>
                    {exportingExcel ? <Loader size={14} className="spinning" /> : <FileSpreadsheet size={14} />} Excel
                  </button>
                  <button onClick={() => generatePDF(true)} className="btn btn-primary" disabled={generatingPdfTTC}>
                    {generatingPdfTTC ? <Loader size={14} className="spinning" /> : <Printer size={14} />} PDF TTC
                  </button>
                  <button onClick={() => generatePDF(false)} className="btn btn-outline" disabled={generatingPdfHT}>
                    {generatingPdfHT ? <Loader size={14} className="spinning" /> : <Printer size={14} />} PDF HT
                  </button>
                </div>
              </div>
              
              <div className="table-wrapper">
                <table className="activations-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Matricule</th>
                      <th className="hide-mobile">IMEI</th>
                      <th className="hide-mobile">Opérateur</th>
                      <th>Plan</th>
                      <th>Total TTC</th>
                      <th>Statut</th>
                      {!isTechnician && <th>Créé par</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {activationsData.map((act, idx) => (
                      <tr key={act.id}>
                        <td>{new Date(act.date).toLocaleDateString('fr-FR')}</td>
                        <td>
                          <span className={`status-badge ${act.type === 'Activation Simple' ? 'status-active' : act.type === 'Installation + Activation' ? 'status-primary' : 'status-pending'}`}>
                            {act.type === 'Activation Simple' ? 'Simple' : act.type === 'Installation + Activation' ? 'Install+' : 'Renouv.'}
                          </span>
                        </td>
                        <td>{act.matricule}</td>
                        <td className="hide-mobile" style={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>{act.displayImei}</td>
                        <td className="hide-mobile">{act.operator || '-'}</td>
                        <td>{PLAN_LABEL[act.plan] || act.plan || '-'}</td>
                        <td className="total-amount">{act.totalTTC.toFixed(2)} DH</td>
                        <td>
                          <span className={`status-badge ${act.status === 'active' ? 'status-active' : 'status-expired'}`}>
                            {act.status === 'active' ? 'Actif' : 'Expiré'}
                          </span>
                        </td>
                        {!isTechnician && <td><span className="badge badge-primary" style={{ fontSize: '0.6rem' }}><User size={10} /> {act.createdBy}</span></td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div style={{ marginTop: 20, textAlign: 'right', padding: 12, background: '#f8fafc', borderRadius: 16 }}>
                <strong>Montant total TTC:</strong> <span className="total-amount" style={{ fontSize: '1.1rem' }}>{totalTTC.toFixed(2)} DH</span>
              </div>
            </>
          )}
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-outline">Fermer</button>
        </div>
      </div>
    </div>
  );
};

// ==================== MAIN TECHNICIAN COMPONENT ====================
const Technician = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list: clients, loading } = useSelector((state) => state.clients);
  const sales = useSelector(selectSales);
  const { user } = useSelector((state) => state.auth);

  const [search, setSearch] = useState('');
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ nom: '', telephone: '', email: '', ice_client: '', adresse: '' });
  const [formError, setFormError] = useState('');
  const [toasts, setToasts] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null, name: '' });
  const [deleting, setDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [activationsModal, setActivationsModal] = useState({ isOpen: false, client: null });
  const [activationModal, setActivationModal] = useState({
    isOpen: false, client: null, mode: 'simple', rows: [], cart: [], loading: false, formError: ''
  });
  const [activationProducts, setActivationProducts] = useState([]);
  const [productPrices, setProductPrices] = useState({});
  const [allActivations, setAllActivations] = useState([]);

  const isTechnician = user?.role === 'technician';
  const currentUserId = user?.id;

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/activations?per_page=1000`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          let data = (await res.json()).data || [];
          if (isTechnician && currentUserId) data = data.filter(a => a.user_id === currentUserId);
          setAllActivations(data);
        }
      } catch (err) { console.error(err); }
    };
    fetchAll();
  }, [isTechnician, currentUserId]);

  useEffect(() => {
    if (activationModal.isOpen && !activationProducts.length) {
      const fetchProducts = async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await fetch(`${API_URL}/produits`, { headers: { Authorization: `Bearer ${token}` } });
          const products = (await res.json()).produits || [];
          setActivationProducts(products);
          const prices = {};
          products.forEach(p => { prices[p.id] = safeNumber(p.prix_vente); });
          setProductPrices(prices);
        } catch (err) { console.error(err); }
      };
      fetchProducts();
    }
  }, [activationModal.isOpen]);

  useEffect(() => {
    dispatch(fetchClients());
    dispatch(fetchSales());
  }, [dispatch]);

  const filtered = search ? clients.filter(c =>
    c.nom?.toLowerCase().includes(search.toLowerCase()) ||
    c.telephone?.includes(search) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.ice_client?.toString().includes(search)
  ) : clients;

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedClients = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  const calculateTotalSpent = (clientId) => {
    const clientSales = sales?.filter(s => s.client_id === clientId || s.clientId === clientId) || [];
    let salesTotal = 0;
    for (const sale of clientSales) {
      if (isTechnician && sale.user_id !== currentUserId) continue;
      salesTotal += safeNumber(sale.total);
    }
    const clientActivations = allActivations.filter(a => a.client_id === clientId);
    return salesTotal + clientActivations.reduce((s, a) => s + safeNumber(a.price), 0);
  };

  const purchaseCount = (clientId) => {
    const clientSales = sales?.filter(s => s.client_id === clientId || s.clientId === clientId) || [];
    let count = 0;
    for (const sale of clientSales) {
      if (isTechnician && sale.user_id !== currentUserId) continue;
      count++;
    }
    return count;
  };

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
      ice_client: c.ice_client?.toString() || '',
      adresse: c.adresse || ''
    });
    setOpen(true);
  };

  const saveClient = async () => {
    if (!form.nom?.trim()) {
      setFormError('Le nom est requis');
      showToast('Le nom est requis', 'error');
      return;
    }
    if (!form.telephone?.trim()) {
      setFormError('Le téléphone est requis');
      showToast('Le téléphone est requis', 'error');
      return;
    }
    const data = {
      nom: form.nom.trim(),
      telephone: form.telephone.trim(),
      email: form.email?.trim() || null,
      ice_client: form.ice_client ? parseInt(form.ice_client, 10) : null,
      adresse: form.adresse?.trim() || null
    };
    try {
      if (editing) {
        await dispatch(updateClient({ id: editing.id, ...data })).unwrap();
        showToast('Client modifié', 'success');
      } else {
        await dispatch(createClient(data)).unwrap();
        showToast('Client ajouté', 'success');
      }
      setOpen(false);
      dispatch(fetchClients());
    } catch (err) {
      setFormError(err || 'Erreur');
      showToast(err || 'Erreur', 'error');
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await dispatch(deleteClient(confirmDelete.id)).unwrap();
      showToast('Client supprimé', 'success');
      dispatch(fetchClients());
      const newTotal = Math.ceil((filtered.length - 1) / itemsPerPage);
      if (currentPage > newTotal && newTotal > 0) setCurrentPage(newTotal);
      else if (filtered.length - 1 === 0) setCurrentPage(1);
    } catch (err) {
      showToast(err || 'Erreur', 'error');
    } finally {
      setDeleting(false);
      setConfirmDelete({ isOpen: false, id: null, name: '' });
    }
  };

  const openActivationsDetails = (client) => setActivationsModal({ isOpen: true, client });

  const openActivationModal = (client) => {
    setActivationModal({
      isOpen: true, client, mode: 'simple',
      rows: [{ id: Date.now(), date: new Date().toISOString().slice(0,10), matricule: '', price: 0, plan_abonnement: '' }],
      cart: [], loading: false, formError: ''
    });
  };

  const addActivationRow = () => {
    setActivationModal(prev => ({
      ...prev,
      rows: [...prev.rows, { id: Date.now(), date: new Date().toISOString().slice(0,10), matricule: '', price: 0, plan_abonnement: '' }]
    }));
  };

  const updateActivationRow = (id, field, value) => {
    setActivationModal(prev => ({
      ...prev,
      rows: prev.rows.map(row => row.id === id ? { ...row, [field]: value } : row)
    }));
  };

  const removeActivationRow = (id) => {
    if (activationModal.rows.length === 1) {
      setActivationModal(prev => ({ ...prev, formError: 'Gardez au moins une ligne' }));
      return;
    }
    setActivationModal(prev => ({ ...prev, rows: prev.rows.filter(r => r.id !== id), formError: '' }));
  };

  const addInstallationProduct = () => {
    setActivationModal(prev => ({
      ...prev,
      cart: [...prev.cart, { id: Date.now(), produit_id: '', quantity: 1, unit_price: 0, matricule: '', date_activation: new Date().toISOString().slice(0,10), price: 0, plan_abonnement: '' }]
    }));
  };

  const updateInstallationProduct = (id, field, value) => {
    setActivationModal(prev => ({
      ...prev,
      cart: prev.cart.map(item => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === 'produit_id' && value && productPrices[value]) updated.unit_price = productPrices[value];
          return updated;
        }
        return item;
      })
    }));
  };

  const removeInstallationProduct = (id) => {
    if (activationModal.cart.length === 1) {
      setActivationModal(prev => ({ ...prev, formError: 'Gardez au moins un produit' }));
      return;
    }
    setActivationModal(prev => ({ ...prev, cart: prev.cart.filter(i => i.id !== id), formError: '' }));
  };

  const calculateInstallationTotals = () => {
    const subtotal = activationModal.cart.reduce((s, i) => s + (safeNumber(i.unit_price) * safeNumber(i.quantity)), 0);
    return { subtotal, tva: subtotal * 0.2, total: subtotal * 1.2 };
  };

  const calculateGrandTotal = () => {
    const install = calculateInstallationTotals().total;
    const activationTotal = activationModal.cart.reduce((s, i) => s + safeNumber(i.price), 0);
    return install + activationTotal;
  };

  const validateForm = () => {
    if (activationModal.mode === 'simple') {
      for (const row of activationModal.rows) {
        if (!row.matricule?.trim()) {
          setActivationModal(prev => ({ ...prev, formError: 'Matricule requis' }));
          return false;
        }
        if (row.price <= 0) {
          setActivationModal(prev => ({ ...prev, formError: 'Prix > 0 requis' }));
          return false;
        }
      }
    } else {
      if (!activationModal.cart.length) {
        setActivationModal(prev => ({ ...prev, formError: 'Ajoutez un produit' }));
        return false;
      }
      for (const item of activationModal.cart) {
        if (!item.produit_id) {
          setActivationModal(prev => ({ ...prev, formError: 'Sélectionnez un produit' }));
          return false;
        }
        if (item.quantity <= 0) {
          setActivationModal(prev => ({ ...prev, formError: 'Quantité > 0' }));
          return false;
        }
        if (item.unit_price <= 0) {
          setActivationModal(prev => ({ ...prev, formError: 'Prix unitaire > 0' }));
          return false;
        }
        if (!item.matricule?.trim()) {
          setActivationModal(prev => ({ ...prev, formError: 'Matricule requis' }));
          return false;
        }
      }
    }
    return true;
  };

  const submitActivation = async () => {
    if (!activationModal.client) return;
    if (!validateForm()) return;
    setActivationModal(prev => ({ ...prev, loading: true, formError: '' }));
    try {
      if (activationModal.mode === 'simple') {
        for (const row of activationModal.rows) {
          await dispatch(createStandaloneActivation({
            client_id: activationModal.client.id,
            matricule: row.matricule.trim(),
            price: row.price,
            date_activation: row.date,
            plan_abonnement: row.plan_abonnement || null
          })).unwrap();
        }
        showToast(`${activationModal.rows.length} activation(s) créée(s)`, 'success');
      } else {
        const payload = activationModal.cart.map(item => ({
          produit_id: item.produit_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          matricule: item.matricule.trim(),
          date_activation: item.date_activation,
          price: item.price || 0,
          plan_abonnement: item.plan_abonnement || null
        }));
        await dispatch(createInstallation({ client_id: activationModal.client.id, activations: payload })).unwrap();
        showToast('Installation créée', 'success');
      }
      dispatch(fetchActivationStats());
      setActivationModal({ isOpen: false, client: null, mode: 'simple', rows: [], cart: [], loading: false, formError: '' });
    } catch (err) {
      setActivationModal(prev => ({ ...prev, formError: err || 'Erreur', loading: false }));
      showToast(err || 'Erreur', 'error');
    }
  };

  if (loading && !clients.length) {
    return (
      <div className="technician-container">
        <div className="loading-state"><div className="spinner" /></div>
      </div>
    );
  }

  const stats = {
    total: clients.length,
    filtered: filtered.length,
    totalSpent: filtered.reduce((s, c) => s + calculateTotalSpent(c.id), 0)
  };

  return (
    <div className="technician-container">
      <style>{styles}</style>
      
      {toasts.length > 0 && (
        <div className="toast-container">
          {toasts.map(t => <Toast key={t.id} message={t.message} type={t.type} onClose={() => setToasts(prev => prev.filter(to => to.id !== t.id))} />)}
        </div>
      )}

      {/* Modern Header */}
      <div className="technician-header">
        <div className="technician-header-top">
          <div className="technician-title-section">
            <h1>Gestion Clients</h1>
            <div className="technician-badge">
              <User size={12} /> {isTechnician ? 'Mode Technicien' : 'Administrateur'}
            </div>
          </div>
          <div className="technician-actions">
            <button onClick={openNew} className="btn btn-primary">
              <Plus size={16} /> <span className="hide-mobile">Nouveau client</span>
            </button>
            <button onClick={handleLogout} className="btn btn-danger">
              <LogOut size={16} /> <span className="hide-mobile">Déconnexion</span>
            </button>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="technician-stats">
          <div className="stat-card">
            <div className="stat-icon"><Users size={20} /></div>
            <div className="stat-info">
              <h4>Clients</h4>
              <p>{stats.filtered} / {stats.total}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><Wallet size={20} /></div>
            <div className="stat-info">
              <h4>Total dépensé</h4>
              <p>{stats.totalSpent.toFixed(0)} DH</p>
            </div>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="technician-search">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Rechercher un client..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
              if (searchTimeout) clearTimeout(searchTimeout);
              const timeout = setTimeout(() => {
                if (e.target.value.trim()) dispatch(searchClients(e.target.value));
                else dispatch(fetchClients());
              }, 500);
              setSearchTimeout(timeout);
            }}
          />
          {search && <button className="icon-btn" onClick={() => { setSearch(''); dispatch(fetchClients()); }}><X size={16} /></button>}
        </div>
      </div>

      {/* Clients Grid - Modern Cards */}
      <div className="clients-grid">
        {paginatedClients.length === 0 ? (
          <div className="empty-state">
            <Users size={48} />
            <p>{search ? 'Aucun résultat' : 'Aucun client'}</p>
          </div>
        ) : (
          paginatedClients.map(client => (
            <div key={client.id} className="client-card">
              <div className="card-header">
                <div className="client-name">
                  <h3>{client.nom}</h3>
                  <span className="client-phone"><Phone size={10} /> {client.telephone || '-'}</span>
                </div>
                <div className="card-actions">
                  <button className="icon-btn" onClick={() => openActivationsDetails(client)} title="Détails"><Eye size={16} /></button>
                  <button className="icon-btn" onClick={() => openActivationModal(client)} title="Activation"><Plus size={16} /></button>
                  <button className="icon-btn" onClick={() => openEdit(client)} title="Modifier"><Pencil size={16} /></button>
                  <button className="icon-btn danger" onClick={() => setConfirmDelete({ isOpen: true, id: client.id, name: client.nom })} title="Supprimer"><Trash2 size={16} /></button>
                </div>
              </div>
              <div className="card-body">
                {client.email && (
                  <div className="info-row">
                    <Mail size={14} /> <span>{client.email}</span>
                  </div>
                )}
                {client.ice_client && (
                  <div className="info-row">
                    <Hash size={14} /> <span>ICE: {client.ice_client}</span>
                  </div>
                )}
                {client.adresse && (
                  <div className="info-row full-width">
                    <MapPin size={14} /> <span>{client.adresse}</span>
                  </div>
                )}
              </div>
              <div className="card-footer">
                <div className="stats-badge">
                  <span className="badge badge-primary"><Package size={12} /> {purchaseCount(client.id)} achats</span>
                  <span className="badge badge-success"><Activity size={12} /> {allActivations.filter(a => a.client_id === client.id).length} activations</span>
                </div>
                <div className="total-spent">{calculateTotalSpent(client.id).toFixed(0)} DH</div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination-modern">
          <button className="page-btn" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>«</button>
          <button className="page-btn" onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1}>‹</button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) pageNum = i + 1;
            else if (currentPage <= 3) pageNum = i + 1;
            else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
            else pageNum = currentPage - 2 + i;
            return (
              <button key={pageNum} className={`page-btn ${currentPage === pageNum ? 'active' : ''}`} onClick={() => setCurrentPage(pageNum)}>
                {pageNum}
              </button>
            );
          })}
          <button className="page-btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages}>›</button>
          <button className="page-btn" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>»</button>
        </div>
      )}

      {/* Client Form Modal */}
      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? <Pencil size={18} /> : <Plus size={18} />} {editing ? 'Modifier' : 'Nouveau'} client</h2>
              <button className="icon-btn" onClick={() => setOpen(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              {formError && <div className="toast toast-error" style={{ marginBottom: 16 }}><AlertTriangle size={14} /> {formError}</div>}
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label required">Nom complet</label>
                  <input className="form-input" value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} placeholder="Jean Dupont" />
                </div>
                <div className="form-group">
                  <label className="form-label required">Téléphone</label>
                  <input className="form-input" value={form.telephone} onChange={e => setForm({...form, telephone: e.target.value})} placeholder="0612345678" />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="client@exemple.com" />
                </div>
                <div className="form-group">
                  <label className="form-label">ICE</label>
                  <input className="form-input" value={form.ice_client} onChange={e => setForm({...form, ice_client: e.target.value})} placeholder="123456789012345" />
                </div>
                <div className="form-group form-full-width">
                  <label className="form-label">Adresse</label>
                  <input className="form-input" value={form.adresse} onChange={e => setForm({...form, adresse: e.target.value})} placeholder="Adresse complète" />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setOpen(false)} className="btn btn-outline">Annuler</button>
              <button onClick={saveClient} className="btn btn-primary">{editing ? 'Mettre à jour' : 'Ajouter'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={confirmDelete.isOpen}
        title="Supprimer le client"
        message={`Supprimer "${confirmDelete.name}" ? Cette action est irréversible.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete({ isOpen: false, id: null, name: '' })}
        loading={deleting}
      />

      {/* Activations Details Modal */}
      {activationsModal.isOpen && (
        <ActivationsDetailsModal
          client={activationsModal.client}
          onClose={() => setActivationsModal({ isOpen: false, client: null })}
          showToast={showToast}
        />
      )}

      {/* Activation Creation Modal */}
      {activationModal.isOpen && (
        <div className="modal-overlay" onClick={() => setActivationModal(prev => ({ ...prev, isOpen: false }))}>
          <div className="modal-container" style={{ maxWidth: 700 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2><Smartphone size={18} /> {activationModal.mode === 'simple' ? 'Activation' : 'Installation'} - {activationModal.client?.nom}</h2>
              <button className="icon-btn" onClick={() => setActivationModal(prev => ({ ...prev, isOpen: false }))}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="toggle-group">
                <button className={`toggle-btn ${activationModal.mode === 'simple' ? 'active' : ''}`} onClick={() => setActivationModal(prev => ({ ...prev, mode: 'simple', rows: [{ id: Date.now(), date: new Date().toISOString().slice(0,10), matricule: '', price: 0, plan_abonnement: '' }], cart: [], formError: '' }))}>
                  Activation Simple
                </button>
                <button className={`toggle-btn ${activationModal.mode === 'installation' ? 'active' : ''}`} onClick={() => setActivationModal(prev => ({ ...prev, mode: 'installation', cart: [{ id: Date.now(), produit_id: '', quantity: 1, unit_price: 0, matricule: '', date_activation: new Date().toISOString().slice(0,10), price: 0, plan_abonnement: '' }], rows: [], formError: '' }))}>
                  Installation + Activation
                </button>
              </div>
              
              {activationModal.formError && (
                <div className="toast toast-error" style={{ marginBottom: 16 }}><AlertTriangle size={14} /> {activationModal.formError}</div>
              )}
              
              {activationModal.mode === 'simple' ? (
                <>
                  {activationModal.rows.map((row, idx) => (
                    <div key={row.id} className="activation-item">
                      <div className="activation-header">
                        <span className="activation-title">Activation #{idx+1}</span>
                        <button className="remove-btn" onClick={() => removeActivationRow(row.id)}><Trash2 size={12} /> Supprimer</button>
                      </div>
                      <div className="form-grid">
                        <div className="form-group">
                          <label className="form-label required">Date</label>
                          <input type="date" className="form-input" value={row.date} onChange={e => updateActivationRow(row.id, 'date', e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label className="form-label required">Matricule</label>
                          <input className="form-input" value={row.matricule} onChange={e => updateActivationRow(row.id, 'matricule', e.target.value)} placeholder="ABC-123" />
                        </div>
                        <div className="form-group">
                          <label className="form-label required">Prix HT</label>
                          <input type="number" step="0.01" className="form-input" value={row.price || ''} onChange={e => updateActivationRow(row.id, 'price', parseFloat(e.target.value) || 0)} placeholder="0.00" />
                          <small style={{ fontSize: '0.65rem', color: '#64748b' }}>TVA 20% ajoutée</small>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Plan</label>
                          <select className="form-input" value={row.plan_abonnement} onChange={e => updateActivationRow(row.id, 'plan_abonnement', e.target.value)}>
                            <option value="">Aucun</option>
                            {PLAN_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }} onClick={addActivationRow}>
                    <Plus size={14} /> Ajouter une activation
                  </button>
                </>
              ) : (
                <>
                  {activationModal.cart.map((item, idx) => (
                    <div key={item.id} className="activation-item">
                      <div className="activation-header">
                        <span className="activation-title">Produit #{idx+1}</span>
                        <button className="remove-btn" onClick={() => removeInstallationProduct(item.id)}><Trash2 size={12} /> Supprimer</button>
                      </div>
                      <div className="form-grid">
                        <div className="form-group">
                          <label className="form-label required">Produit</label>
                          <select className="form-input" value={item.produit_id} onChange={e => updateInstallationProduct(item.id, 'produit_id', e.target.value)}>
                            <option value="">Sélectionner</option>
                            {activationProducts.map(p => <option key={p.id} value={p.id}>{p.nom} {p.marque ? `- ${p.marque}` : ''}</option>)}
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label required">Quantité</label>
                          <input type="number" min="1" className="form-input" value={item.quantity} onChange={e => updateInstallationProduct(item.id, 'quantity', parseInt(e.target.value) || 1)} />
                        </div>
                        <div className="form-group">
                          <label className="form-label required">Prix unitaire HT</label>
                          <input type="number" step="0.01" className="form-input" value={item.unit_price || ''} onChange={e => updateInstallationProduct(item.id, 'unit_price', parseFloat(e.target.value) || 0)} placeholder="0.00" />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Plan</label>
                          <select className="form-input" value={item.plan_abonnement} onChange={e => updateInstallationProduct(item.id, 'plan_abonnement', e.target.value)}>
                            <option value="">Aucun</option>
                            {PLAN_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label required">Matricule</label>
                          <input className="form-input" value={item.matricule} onChange={e => updateInstallationProduct(item.id, 'matricule', e.target.value)} placeholder="ABC-123" />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Date activation</label>
                          <input type="date" className="form-input" value={item.date_activation} onChange={e => updateInstallationProduct(item.id, 'date_activation', e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Prix activation HT</label>
                          <input type="number" step="0.01" className="form-input" value={item.price || ''} onChange={e => updateInstallationProduct(item.id, 'price', parseFloat(e.target.value) || 0)} placeholder="0.00" />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }} onClick={addInstallationProduct}>
                    <Plus size={14} /> Ajouter un produit
                  </button>
                  
                  <div style={{ marginTop: 20, background: '#f8fafc', padding: 16, borderRadius: 20 }}>
                    <h4 style={{ marginBottom: 12 }}>Récapitulatif</h4>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span>Sous-total produits HT:</span> <strong>{calculateInstallationTotals().subtotal.toFixed(2)} DH</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: '#64748b' }}>
                      <span>TVA 20%:</span> <span>{calculateInstallationTotals().tva.toFixed(2)} DH</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #e2e8f0' }}>
                      <span>Total vente TTC:</span> <strong style={{ color: '#059669' }}>{calculateInstallationTotals().total.toFixed(2)} DH</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                      <span>Total activations HT:</span> <strong>{activationModal.cart.reduce((s, i) => s + safeNumber(i.price), 0).toFixed(2)} DH</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, paddingTop: 8, borderTop: '2px solid #cbd5e1' }}>
                      <span className="text-green-600" style={{ fontWeight: 700 }}>GRAND TOTAL TTC:</span>
                      <span className="text-green-600" style={{ fontWeight: 700 }}>{calculateGrandTotal().toFixed(2)} DH</span>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button onClick={() => setActivationModal(prev => ({ ...prev, isOpen: false }))} className="btn btn-outline">Annuler</button>
              <button onClick={submitActivation} className="btn btn-primary" disabled={activationModal.loading}>
                {activationModal.loading ? <Loader size={14} className="spinning" /> : <Save size={14} />}
                {activationModal.loading ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Technician;