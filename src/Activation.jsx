// Activation.jsx
import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Plus, Satellite, RefreshCw, AlertTriangle, CheckCircle2, Clock,
  Search, Eye, Edit, Trash2, X, Calendar, Wifi, Car,
  Smartphone, Ban, Power, DollarSign, Save, RotateCcw, ChevronDown, ChevronUp,
  FileSpreadsheet, Download, History, ChevronLeft, ChevronRight,
  TrendingUp, Check, AlertCircle, CreditCard, Receipt, Loader, Info
} from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import {
  selectActivations,
  selectActivationStats,
  selectActivationsLoading,
  selectActivationsPagination,
  fetchActivations,
  fetchActivationStats,
  updateActivation,
  deleteActivation,
  fetchAvailableImeis,
  selectAvailableImeis,
  selectProducts,
  setFullList
} from './Store/store';

// ==================== CONSTANTS ====================
const PLAN_LABEL = { '1m': '1 mois', '3m': '3 mois', '6m': '6 mois', '12m': '12 mois' };
const PLAN_OPTIONS = [
  { value: '', label: '-- Sélectionner un plan --' },
  { value: '1m', label: '1 mois' },
  { value: '3m', label: '3 mois' },
  { value: '6m', label: '6 mois' },
  { value: '12m', label: '12 mois' }
];
const OPERATORS = ['Inwi', 'Maroc Telecom', 'Orange', 'Autre'];

const API_URL = window.REACT_APP_API_URL || "https://amg-telecom-backd-production.up.railway.app/api";

// ==================== HELPER FUNCTIONS ====================
const isActivationIncomplete = (activation) => {
  if (!activation) return false;
  
  const hasImei = (activation.imei && activation.imei.trim() !== '') || 
                  (activation.client_imei && activation.client_imei.trim() !== '');
  const hasNumeroSim = activation.numero_sim && activation.numero_sim.trim() !== '';
  const hasOperateur = activation.operateur && activation.operateur.trim() !== '';
  const hasPlan = activation.plan_abonnement && activation.plan_abonnement.trim() !== '';
  
  const criticalFieldsMissing = !hasImei || !hasNumeroSim || !hasOperateur || !hasPlan;
  const hasMatricule = activation.matricule && activation.matricule.trim() !== '';
  const hasPrice = activation.price !== null && activation.price !== undefined && activation.price > 0;
  const recommendedFieldsMissing = !hasMatricule || !hasPrice;
  
  return criticalFieldsMissing || (recommendedFieldsMissing && (!hasMatricule && !hasPrice));
};

const getEmptyFields = (activation) => {
  const empty = [];
  const hasImei = (activation.imei && activation.imei.trim() !== '') || 
                  (activation.client_imei && activation.client_imei.trim() !== '');
  if (!hasImei) empty.push('IMEI');
  if (!activation.numero_sim?.trim()) empty.push('N° SIM');
  if (!activation.operateur?.trim()) empty.push('Opérateur');
  if (!activation.plan_abonnement?.trim()) empty.push('Plan');
  if (!activation.matricule?.trim()) empty.push('Matricule');
  if (!activation.price || activation.price <= 0) empty.push('Prix');
  return empty;
};

const safeFormatPrice = (value) => {
  if (value === null || value === undefined) return '0.00';
  const num = parseFloat(value);
  return isNaN(num) ? '0.00' : num.toFixed(2);
};

const safeParseNumber = (value) => {
  if (value === null || value === undefined) return 0;
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
};
const safeNumber = (value) => {
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};
const formatDate = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
};

const getDisplayPrice = (activation) => {
  // After invoicing, activation.price already contains the TTC amount.
  // Before invoicing, it contains the HT amount.
  return safeNumber(activation.price);
};

// Helper for editable value: always the original HT
const getEditablePrice = (activation) => {
  return safeNumber(activation.price);
};

// ==================== STYLES ====================
const styles = `
  .activation-container {
    padding: 1rem;
  }
  
  .activation-page-header {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  
  @media (min-width: 768px) {
    .activation-page-header {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
    }
  }
  
  .activation-title {
    font-size: 1.5rem;
    font-weight: 700;
    letter-spacing: -0.025em;
    color: #111827;
  }
  
  .activation-subtitle {
    font-size: 0.75rem;
    color: #6b7280;
    margin-top: 0.25rem;
  }
  
  .activation-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .activation-card {
    background: white;
    border-radius: 0.5rem;
    border: 1px solid #e5e7eb;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    margin-bottom: 1.5rem;
  }
  
  .activation-stats-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  
  @media (min-width: 640px) {
    .activation-stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  
  @media (min-width: 1024px) {
    .activation-stats-grid {
      grid-template-columns: repeat(5, 1fr);
    }
  }
  
  .activation-stat-card {
    background: white;
    border-radius: 1rem;
    padding: 1.25rem;
    border: 1px solid #e2e8f0;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
  }
  
  .activation-stat-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  }
  
  .activation-stat-card-primary::before {
    background: linear-gradient(90deg, #3b82f6, #06b6d4);
  }
  
  .activation-stat-card-success::before {
    background: linear-gradient(90deg, #10b981, #34d399);
  }
  
  .activation-stat-card-warning::before {
    background: linear-gradient(90deg, #f59e0b, #fbbf24);
  }
  
  .activation-stat-card-danger::before {
    background: linear-gradient(90deg, #ef4444, #f87171);
  }
  
  .activation-stat-card-info::before {
    background: linear-gradient(90deg, #8b5cf6, #a78bfa);
  }
  
  .activation-stat-icon-wrapper {
    width: 3rem;
    height: 3rem;
    border-radius: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
    margin-bottom: 1rem;
  }
  
  .activation-stat-icon-wrapper svg {
    width: 1.5rem;
    height: 1.5rem;
  }
  
  .activation-stat-icon-primary svg { color: #3b82f6; }
  .activation-stat-icon-success svg { color: #10b981; }
  .activation-stat-icon-warning svg { color: #f59e0b; }
  .activation-stat-icon-danger svg { color: #ef4444; }
  .activation-stat-icon-info svg { color: #8b5cf6; }
  
  .activation-stat-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }
  
  .activation-stat-label {
    font-size: 0.75rem;
    font-weight: 500;
    color: #64748b;
    margin-bottom: 0.5rem;
  }
  
  .activation-stat-value {
    font-size: 2rem;
    font-weight: 800;
    color: #0f172a;
    line-height: 1;
  }
  
  .activation-filter-bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .activation-search-wrapper {
    position: relative;
    flex: 3;
    min-width: 250px;
  }
  
  .activation-search-icon {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    width: 1rem;
    height: 1rem;
    color: #9ca3af;
    pointer-events: none;
  }
  
  .activation-search-input {
    width: 100%;
    padding: 0.5rem 0.75rem 0.5rem 2.25rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 0.75rem;
    outline: none;
    transition: all 0.2s;
  }
  
  .activation-search-input:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }
  
  .activation-filter-select {
    padding: 0.5rem 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 0.75rem;
    background: white;
    cursor: pointer;
    width: auto;
    min-width: 130px;
  }
  
  .activation-filter-group {
    display: flex;
    gap: 0.5rem;
    flex-shrink: 0;
  }
  
  @media (max-width: 768px) {
    .activation-filter-bar {
      flex-direction: column;
      align-items: stretch;
    }
    .activation-search-wrapper {
      flex: 1;
      min-width: auto;
    }
    .activation-filter-group {
      flex-wrap: wrap;
    }
    .activation-filter-select {
      flex: 1;
      min-width: auto;
    }
  }
  
  .activation-table-container {
    overflow-x: auto;
  }
  
  .activation-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.75rem;
  }
  
  .activation-table th {
    padding: 0.75rem 1rem;
    text-align: left;
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: uppercase;
    color: #6b7280;
    border-bottom: 1px solid #e5e7eb;
    background: #f9fafb;
  }
  
  .activation-table td {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #f3f4f6;
    vertical-align: middle;
  }
  
  .activation-table tr:hover {
    background: #f9fafb;
  }
  
  .empty-cell-highlight {
    background-color: #fef2f2;
    border-left: 3px solid #ef4444;
    position: relative;
  }
  
  .empty-cell-highlight .editable-cell-value {
    color: #dc2626;
    font-weight: 500;
  }
  
  .empty-cell-warning {
    display: inline-block;
    margin-left: 6px;
    color: #ef4444;
    font-size: 0.7rem;
    font-weight: bold;
    animation: pulseWarning 1s ease-in-out;
  }
  
  @keyframes pulseWarning {
    0%, 100% { opacity: 0.6; transform: scale(0.9); }
    50% { opacity: 1; transform: scale(1.1); }
  }
  
  .incomplete-row {
    background-color: #fef2f2;
    transition: background 0.2s;
  }
  
  .incomplete-row:hover {
    background-color: #fee2e2;
  }
  
  .activation-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.125rem 0.5rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 500;
  }
  
  .activation-badge-success {
    background: #f0fdf4;
    color: #16a34a;
  }
  
  .activation-badge-warning {
    background: #fefce8;
    color: #ca8a04;
  }
  
  .activation-badge-danger {
    background: #fef2f2;
    color: #dc2626;
  }
  
  .activation-badge-info {
    background: #eff6ff;
    color: #2563eb;
  }
  
  .activation-badge-secondary {
    background: #f3f4f6;
    color: #4b5563;
  }
  
  .activation-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.625rem 1.25rem;
    border-radius: 0.5rem;
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
    font-family: inherit;
  }
  
  .activation-btn-primary {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }
  
  .activation-btn-primary:hover:not(:disabled) {
    background: linear-gradient(135deg, #2563eb, #1d4ed8);
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }
  
  .activation-btn-primary:active:not(:disabled) {
    transform: translateY(0);
  }
  
  .activation-btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
  
  .activation-btn-secondary {
    background: #f3f4f6;
    color: #374151;
    border: 1px solid #e5e7eb;
  }
  
  .activation-btn-secondary:hover:not(:disabled) {
    background: #e5e7eb;
    border-color: #d1d5db;
  }
  
  .activation-btn-secondary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .activation-btn-danger {
    background: linear-gradient(135deg, #ef4444, #dc2626);
    color: white;
  }
  
  .activation-btn-danger:hover:not(:disabled) {
    background: linear-gradient(135deg, #dc2626, #b91c1c);
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }
  
  .activation-btn-outline {
    background: white;
    border: 1px solid #d1d5db;
    color: #374151;
  }
  
  .activation-btn-outline:hover:not(:disabled) {
    background: #f9fafb;
    border-color: #9ca3af;
  }
  
  .activation-btn-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem;
    border-radius: 0.5rem;
    background: transparent;
    border: none;
    cursor: pointer;
    transition: all 0.15s;
  }
  
  .activation-btn-icon:hover:not(:disabled) {
    background: #f3f4f6;
  }
  
  .action-buttons {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: nowrap;
  }
  
  .activation-icon-btn {
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0.375rem;
    border-radius: 0.5rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
  }
  
  .activation-icon-btn:hover {
    background: #f3f4f6;
    transform: scale(1.05);
  }
  
  .activation-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(2px);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow-y: auto;
    padding: 1rem;
  }
  
  .activation-dialog {
    background: white;
    border-radius: 0.75rem;
    width: 100%;
    max-width: 80rem;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    animation: dialogFadeIn 0.2s ease;
    z-index: 1010;
    position: relative;
  }
  
  @keyframes dialogFadeIn {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  
  .activation-dialog-header {
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: sticky;
    top: 0;
    background: white;
    z-index: 10;
  }
  
  .activation-dialog-title {
    font-size: 1.125rem;
    font-weight: 600;
  }
  
  .activation-dialog-body {
    padding: 1.5rem;
  }
  
  .activation-dialog-footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid #e5e7eb;
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    position: sticky;
    bottom: 0;
    background: white;
    z-index: 10;
  }
  
  .confirmation-dialog {
    max-width: 28rem;
    z-index: 1100 !important;
    position: relative;
  }
  
  .confirmation-dialog .activation-dialog-body {
    text-align: center;
    padding: 2rem 1.5rem;
  }
  
  .confirmation-icon {
    width: 3rem;
    height: 3rem;
    margin: 0 auto 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 9999px;
  }
  
  .confirmation-icon-danger {
    background: #fef2f2;
    color: #dc2626;
  }
  
  .confirmation-icon-warning {
    background: #fefce8;
    color: #ca8a04;
  }
  
  .confirmation-icon-info {
    background: #eff6ff;
    color: #3b82f6;
  }
  
  .confirmation-title {
    font-size: 1.125rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }
  
  .confirmation-message {
    font-size: 0.75rem;
    color: #6b7280;
    margin-bottom: 1.5rem;
  }
  
  .confirmation-details {
    background: #f9fafb;
    border-radius: 0.5rem;
    padding: 0.75rem;
    margin: 1rem 0;
    text-align: left;
    font-size: 0.75rem;
  }
  
  .confirmation-buttons {
    display: flex;
    justify-content: center;
    gap: 0.75rem;
  }
  
  .history-dialog {
    max-width: 40rem;
  }
  
  .history-list {
    max-height: 400px;
    overflow-y: auto;
  }
  
  .history-item {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.75rem;
    border-bottom: 1px solid #f3f4f6;
    transition: background 0.15s;
  }
  
  .history-item:hover {
    background: #f9fafb;
  }
  
  .history-icon {
    flex-shrink: 0;
    width: 2rem;
    height: 2rem;
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .history-icon-activation { background: #eff6ff; color: #2563eb; }
  .history-icon-renewal { background: #f0fdf4; color: #16a34a; }
  .history-icon-suspension { background: #fefce8; color: #ca8a04; }
  .history-icon-reactivation { background: #e0f2fe; color: #0284c7; }
  .history-icon-deletion { background: #fef2f2; color: #dc2626; }
  .history-icon-payment { background: #e0f2fe; color: #0284c7; }
  .history-icon-cheque { background: #fef3c7; color: #d97706; }
  
  .history-content {
    flex: 1;
  }
  
  .history-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 0.25rem;
  }
  
  .history-action {
    font-weight: 600;
    font-size: 0.75rem;
  }
  
  .history-date {
    font-size: 0.7rem;
    color: #9ca3af;
  }
  
  .history-details {
    font-size: 0.75rem;
    color: #6b7280;
  }
  
  .history-user {
    font-size: 0.7rem;
    color: #9ca3af;
    margin-top: 0.25rem;
  }
  
  .empty-history {
    text-align: center;
    padding: 2rem;
    color: #9ca3af;
  }
  
  .activation-empty {
    text-align: center;
    padding: 3rem;
    color: #9ca3af;
  }
  
  .activation-loading {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 3rem;
  }
  
  .activation-spinner {
    width: 2rem;
    height: 2rem;
    border: 3px solid #e5e7eb;
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .font-mono {
    font-family: monospace;
    font-size: 0.75rem;
  }
  
  .text-green-600 { color: #16a34a; }
  .text-red-600 { color: #dc2626; }
  .text-yellow-600 { color: #ca8a04; }
  .text-blue-600 { color: #2563eb; }
  .text-gray-400 { color: #9ca3af; }
  .mb-1 { margin-bottom: 0.25rem; }
  .mb-2 { margin-bottom: 0.5rem; }
  .mb-4 { margin-bottom: 1rem; }
  .mt-2 { margin-top: 0.5rem; }
  .mt-4 { margin-top: 1rem; }
  .ml-2 { margin-left: 0.5rem; }
  .p-2 { padding: 0.5rem; }
  .p-3 { padding: 0.75rem; }
  .text-sm { font-size: 0.75rem; }
  .text-xs { font-size: 0.75rem; }
  .font-medium { font-weight: 500; }
  .font-bold { font-weight: 700; }
  .text-right { text-align: right; }
  .text-left { text-align: left; }
  .text-center { text-align: center; }
  
  .error-message {
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 0.5rem;
    padding: 0.75rem;
    margin-bottom: 1rem;
    color: #dc2626;
    font-size: 0.75rem;
  }
  
  .success-message {
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 0.5rem;
    padding: 0.75rem;
    margin-bottom: 1rem;
    color: #16a34a;
    font-size: 0.75rem;
  }
  
  .expiring-row {
    background-color: #fffbeb;
    transition: background 0.2s;
  }
  
  .expiring-row:hover {
    background-color: #fef3c7;
  }
  
  .activation-pagination-container {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem;
    border-top: 1px solid #e5e7eb;
    flex-wrap: wrap;
  }
  
  .activation-pagination-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border: 1px solid #d1d5db;
    background: white;
    border-radius: 0.5rem;
    font-size: 0.75rem;
    font-weight: 500;
    color: #374151;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .activation-pagination-btn:hover:not(:disabled) {
    background: #f9fafb;
    border-color: #9ca3af;
    transform: translateY(-1px);
  }
  
  .activation-pagination-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .activation-pagination-active {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
    border-color: #3b82f6;
  }
  
  .activation-pagination-info {
    padding: 0.5rem 1rem;
    font-size: 0.75rem;
    color: #6b7280;
  }
  
  .price-input-group {
    position: relative;
  }
  
  .price-input-group::before {
    content: "MAD";
    position: absolute;
    right: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    font-size: 0.7rem;
    color: #6b7280;
    pointer-events: none;
  }
  
  .price-input {
    padding-right: 2.5rem;
  }
  
  .grid {
    display: grid;
  }
  
  .grid-cols-2 {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .gap-2 {
    gap: 0.5rem;
  }
  
  .bg-gray-50 {
    background: #f9fafb;
  }
  
  .rounded-lg {
    border-radius: 0.5rem;
  }
  
  .border-t {
    border-top: 1px solid #e5e7eb;
  }
  
  .border-gray-200 {
    border-color: #e5e7eb;
  }
  
  .editable-cell {
    cursor: pointer;
    transition: background 0.15s;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-width: 100px;
  }
  
  .editable-cell:hover {
    background: #eff6ff;
    border-radius: 0.375rem;
  }
  
  .editable-cell-value {
    flex: 1;
    padding: 0.25rem 0.5rem;
  }
  
  .editable-cell-edit-icon {
    opacity: 0;
    transition: opacity 0.15s;
    margin-left: 8px;
    color: #3b82f6;
  }
  
  .editable-cell:hover .editable-cell-edit-icon {
    opacity: 0.7;
  }
  
  .inline-edit-wrapper {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-width: 300px;
  }
  
  .inline-edit-input {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 2px solid #3b82f6;
    border-radius: 0.5rem;
    font-size: 0.75rem;
    outline: none;
    font-family: inherit;
    background: white;
  }
  
  .inline-edit-input:focus {
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  }
  
  .inline-edit-select {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 2px solid #3b82f6;
    border-radius: 0.5rem;
    font-size: 0.75rem;
    outline: none;
    background: white;
    font-family: inherit;
    cursor: pointer;
  }
  
  .inline-edit-select:focus {
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  }
  
  .edit-actions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
  }
  
  .edit-save-btn {
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    border: none;
    padding: 0.375rem 0.75rem;
    border-radius: 0.5rem;
    cursor: pointer;
    font-size: 0.75rem;
    font-weight: 500;
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    transition: all 0.2s;
  }
  
  .edit-save-btn:hover {
    background: linear-gradient(135deg, #059669, #047857);
    transform: translateY(-1px);
  }
  
  .edit-cancel-btn {
    background: linear-gradient(135deg, #ef4444, #dc2626);
    color: white;
    border: none;
    padding: 0.375rem 0.75rem;
    border-radius: 0.5rem;
    cursor: pointer;
    font-size: 0.75rem;
    font-weight: 500;
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    transition: all 0.2s;
  }
  
  .edit-cancel-btn:hover {
    background: linear-gradient(135deg, #dc2626, #b91c1c);
    transform: translateY(-1px);
  }
  
  .activation-form-group {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .activation-label {
    font-size: 0.75rem;
    font-weight: 500;
    color: #4b5563;
  }
  
  .activation-label-required::after {
    content: "*";
    color: #ef4444;
    margin-left: 0.25rem;
  }
  
  .activation-input {
    padding: 0.5rem 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 0.75rem;
    outline: none;
    transition: all 0.15s;
  }
  
  .activation-input:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }
  
  .activation-select {
    padding: 0.5rem 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 0.75rem;
    background: white;
    cursor: pointer;
  }
  
  .activation-select:focus {
    border-color: #3b82f6;
    outline: none;
  }
  
  @media (max-width: 640px) {
    .grid-cols-2 {
      grid-template-columns: 1fr;
    }
    .action-buttons {
      flex-wrap: wrap;
    }
    .inline-edit-wrapper {
      min-width: 280px;
    }
  }
  
  .incomplete-alert-banner {
    background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
    border: 1px solid #fecaca;
    border-radius: 0.75rem;
    padding: 0.875rem 1rem;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.875rem;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(239, 68, 68, 0.15);
  }
  
  .incomplete-alert-banner:hover {
    transform: translateX(4px);
    background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  }
  
  .incomplete-alert-banner svg {
    color: #dc2626;
    flex-shrink: 0;
  }
  
  .incomplete-alert-text {
    flex: 1;
    font-size: 0.75rem;
    color: #991b1b;
    font-weight: 600;
  }
  
  .incomplete-alert-text strong {
    font-weight: 800;
    font-size: 1rem;
  }
  
  .empty-fields-tooltip {
    font-size: 0.7rem;
    color: #dc2626;
    margin-left: 6px;
    font-weight: normal;
  }

  .payment-badge-cash { background: #dbeafe; color: #1e40af; padding: 0.25rem 0.5rem; border-radius: 0.375rem; font-size: 0.7rem; display: inline-block; }
  .payment-badge-card { background: #e0e7ff; color: #3730a3; padding: 0.25rem 0.5rem; border-radius: 0.375rem; font-size: 0.7rem; display: inline-block; }
  .payment-badge-check { background: #fef3c7; color: #92400e; padding: 0.25rem 0.5rem; border-radius: 0.375rem; font-size: 0.7rem; display: inline-block; }
  .payment-badge-bank_transfer { background: #e0f2fe; color: #075985; padding: 0.25rem 0.5rem; border-radius: 0.375rem; font-size: 0.7rem; display: inline-block; }
  .payment-badge-other { background: #f3e8ff; color: #6b21a5; padding: 0.25rem 0.5rem; border-radius: 0.375rem; font-size: 0.7rem; display: inline-block; }
  
  .btn-update-payment {
    background: #3b82f6;
    color: white;
    padding: 0.25rem 0.5rem;
    border: none;
    border-radius: 0.5rem;
    font-size: 0.7rem;
    cursor: pointer;
  }
  
  .btn-delete-payment {
    background: #ef4444;
    color: white;
    padding: 0.25rem 0.5rem;
    border: none;
    border-radius: 0.5rem;
    font-size: 0.7rem;
    cursor: pointer;
  }
  
  .btn-add-payment {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    padding: 0.5rem 1rem;
    height: 2.5rem;
    border: none;
    border-radius: 0.875rem;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    white-space: nowrap;
  }
  
  .add-payment-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    align-items: center;
    background: white;
    padding: 0.875rem;
    border-radius: 0.75rem;
    border: 1px solid #e2e8f0;
  }
  
  .add-payment-input {
    flex: 1;
    min-width: 120px;
    padding: 0.5rem 0.75rem;
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
    font-size: 0.75rem;
    transition: all 0.2s ease;
  }
  
  .add-payment-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }
  
  .payment-method-select {
    padding: 0.5rem 0.75rem;
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
    font-size: 0.75rem;
    background: white;
    cursor: pointer;
  }
  
  .payment-summary-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    margin-top: 1rem;
    margin-bottom: 1rem;
  }
  
  @media (max-width: 640px) {
    .payment-summary-grid {
      gap: 0.5rem;
    }
    .payment-summary-card {
      padding: 0.5rem;
    }
    .payment-summary-label {
      font-size: 0.75rem;
    }
    .payment-summary-value {
      font-size: 0.9rem;
    }
  }
  
  .payment-summary-card {
    background: white;
    border-radius: 1rem;
    padding: 1rem;
    text-align: center;
    border: 1px solid #e2e8f0;
    transition: all 0.2s ease;
  }
  
  .payment-summary-card:hover {
    border-color: #cbd5e1;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
  
  .payment-summary-label {
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #64748b;
    margin-bottom: 0.5rem;
  }
  
  .payment-summary-value {
    font-size: 1.25rem;
    font-weight: 700;
    color: #1e293b;
  }
  
  .payment-summary-value.paid {
    color: #059669;
  }
  
  .payment-summary-value.remaining {
    color: #d97706;
  }
  
  .payment-history-table {
    width: 100%;
    font-size: 0.75rem;
    border-collapse: collapse;
  }
  
  @media (max-width: 640px) {
    .payment-history-table {
      display: block;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }
    
    .payment-history-table thead,
    .payment-history-table tbody,
    .payment-history-table tr {
      min-width: 500px;
    }
  }
  
  .payment-history-table th {
    text-align: left;
    padding: 0.5rem;
    background: #f3f4f6;
    font-weight: 600;
  }
  
  .payment-history-table td {
    padding: 0.5rem;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .spinning {
    animation: spin 1s linear infinite;
  }
`;

// ==================== COMPONENTS ====================
const Badge = ({ children, variant = 'secondary' }) => {
  const variants = {
    success: 'activation-badge-success',
    warning: 'activation-badge-warning',
    danger: 'activation-badge-danger',
    info: 'activation-badge-info',
    secondary: 'activation-badge-secondary'
  };
  return <span className={`activation-badge ${variants[variant] || variants.secondary}`}>{children}</span>;
};

const LoadingSpinner = () => (
  <div className="activation-loading">
    <div className="activation-spinner"></div>
  </div>
);

const StatCard = ({ icon: Icon, label, value, color = 'primary' }) => (
  <div className={`activation-stat-card activation-stat-card-${color}`}>
    <div className={`activation-stat-icon-wrapper activation-stat-icon-${color}`}>
      <Icon size={24} />
    </div>
    <div className="activation-stat-content">
      <div>
        <div className="activation-stat-label">{label}</div>
        <div className="activation-stat-value">{value}</div>
      </div>
    </div>
  </div>
);

const getStatusBadge = (activation) => {
  if (activation.status === 'suspended') return <Badge variant="warning">Suspendu</Badge>;
  if (activation.status === 'expired') return <Badge variant="danger">Expiré</Badge>;
  if (activation.status === 'pending') return <Badge variant="secondary">En attente</Badge>;
  if (activation.expires_at && new Date(activation.expires_at) < new Date()) return <Badge variant="danger">Expiré</Badge>;
  if (activation.days_remaining <= 30 && activation.days_remaining > 0) {
    return <Badge variant="warning">Expire dans {activation.days_remaining}j</Badge>;
  }
  return <Badge variant="success">Actif</Badge>;
};

const ConfirmationDialog = ({ isOpen, onClose, onConfirm, title, message, details, type = 'danger', confirmText = 'Confirmer', cancelText = 'Annuler', loading = false }) => {
  if (!isOpen) return null;
  
  const iconConfig = {
    danger: { icon: <AlertTriangle size={28} />, class: 'confirmation-icon-danger' },
    warning: { icon: <AlertTriangle size={28} />, class: 'confirmation-icon-warning' },
    info: { icon: <CheckCircle2 size={28} />, class: 'confirmation-icon-info' }
  };
  
  const currentIcon = iconConfig[type] || iconConfig.danger;
  
  return (
    <div className="activation-overlay" onClick={onClose}>
      <div className="activation-dialog confirmation-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="activation-dialog-body">
          <div className={`confirmation-icon ${currentIcon.class}`}>
            {currentIcon.icon}
          </div>
          <h3 className="confirmation-title">{title}</h3>
          <p className="confirmation-message">{message}</p>
          {details && (
            <div className="confirmation-details">
              {details}
            </div>
          )}
          <div className="confirmation-buttons">
            <button onClick={onClose} className="activation-btn activation-btn-secondary" disabled={loading}>
              {cancelText}
            </button>
            <button onClick={onConfirm} className={`activation-btn ${type === 'danger' ? 'activation-btn-danger' : 'activation-btn-primary'}`} disabled={loading}>
              {loading ? (
                <>
                  <div className="activation-spinner" style={{ width: '1rem', height: '1rem', borderWidth: '2px' }} />
                  Chargement...
                </>
              ) : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const HistoryModal = ({ isOpen, onClose, activation, history }) => {
  if (!isOpen || !activation) return null;
  
  const getActionIcon = (action) => {
    let iconClass = "history-icon ";
    switch (action) {
      case 'activation': iconClass += 'history-icon-activation'; return <div className={iconClass}><CheckCircle2 size={16} /></div>;
      case 'renewal': iconClass += 'history-icon-renewal'; return <div className={iconClass}><RefreshCw size={16} /></div>;
      case 'suspension': iconClass += 'history-icon-suspension'; return <div className={iconClass}><Ban size={16} /></div>;
      case 'reactivation': iconClass += 'history-icon-reactivation'; return <div className={iconClass}><Power size={16} /></div>;
      case 'deletion': iconClass += 'history-icon-deletion'; return <div className={iconClass}><Trash2 size={16} /></div>;
      case 'payment': iconClass += 'history-icon-payment'; return <div className={iconClass}><CreditCard size={16} /></div>;
      case 'cheque_payment': iconClass += 'history-icon-cheque'; return <div className={iconClass}><Receipt size={16} /></div>;
      default: iconClass += 'history-icon-activation'; return <div className={iconClass}><History size={16} /></div>;
    }
  };
  
  const getActionLabel = (action) => {
    const labels = {
      'activation': '✅ Activation',
      'renewal': '🔄 Renouvellement',
      'suspension': '⛔ Suspension',
      'reactivation': '▶️ Réactivation',
      'deletion': '🗑️ Suppression',
      'payment': '💰 Paiement',
      'cheque_payment': '📝 Paiement par chèque',
      'cheque_remis': '🏦 Remis en banque',
      'cheque_encaisse': '✅ Chèque encaissé',
      'payment_updated': '✏️ Paiement modifié',
      'payment_removed': '🗑️ Paiement supprimé'
    };
    return labels[action] || action;
  };
  
  const getActionDetails = (entry) => {
    switch (entry.action) {
      case 'renewal':
        return `${entry.details?.old_plan || ''} → ${entry.details?.new_plan || ''} | Prix: ${entry.details?.price || 0} MAD`;
      case 'activation':
        return `Activé avec plan ${entry.details?.plan || ''} | Prix activation: ${entry.details?.price || 0} MAD`;
      case 'payment':
        return `${entry.details?.amount || 0} MAD par ${entry.details?.method || ''}${entry.details?.reference ? ` - Réf: ${entry.details.reference}` : ''}`;
      case 'cheque_payment':
        return `${entry.details?.amount || 0} MAD - N° Chèque: ${entry.details?.cheque_number || 'N/A'}`;
      case 'cheque_encaisse':
        return `Chèque encaissé - ${entry.details?.amount || 0} MAD`;
      default:
        return entry.details ? (typeof entry.details === 'object' ? JSON.stringify(entry.details) : entry.details) : '';
    }
  };
  
  return (
    <div className="activation-overlay" onClick={onClose}>
      <div className="activation-dialog history-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="activation-dialog-header">
          <h2 className="activation-dialog-title">Historique - IMEI: {activation.imei || activation.client_imei}</h2>
          <button onClick={onClose} className="activation-btn-icon"><X size={20} /></button>
        </div>
        <div className="activation-dialog-body">
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><strong>IMEI:</strong> {activation.imei || '-'}</div>
              <div><strong>IMEI Client:</strong> {activation.client_imei || '-'}</div>
              <div><strong>N° SIM:</strong> {activation.numero_sim || '-'}</div>
              <div><strong>Opérateur:</strong> {activation.operateur || '-'}</div>
              <div><strong>Plan:</strong> {PLAN_LABEL[activation.plan_abonnement] || '-'}</div>
              <div><strong>Prix activation:</strong> {safeFormatPrice(getDisplayPrice(activation))} MAD</div>
              <div><strong>Total payé:</strong> <span className="text-green-600 font-bold">{safeFormatPrice(activation.total_price_paid || activation.price)} MAD</span></div>
              <div><strong>Client:</strong> {activation.vente?.client?.nom || activation.client?.nom || '-'}</div>
              <div><strong>Matricule:</strong> {activation.matricule || '-'}</div>
            </div>
          </div>
          
          {history && history.length > 0 ? (
            <div className="history-list">
              {history.map((entry, index) => (
                <div key={entry.id || index} className="history-item">
                  {getActionIcon(entry.action)}
                  <div className="history-content">
                    <div className="history-header">
                      <span className="history-action">{getActionLabel(entry.action)}</span>
                      <span className="history-date">
                        {new Date(entry.date).toLocaleString('fr-FR', {
                          day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                    {getActionDetails(entry) && <div className="history-details">{getActionDetails(entry)}</div>}
                    {entry.user && <div className="history-user">Par: {entry.user}</div>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-history">
              <History size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
              Aucun historique d'action pour cette activation
            </div>
          )}
        </div>
        <div className="activation-dialog-footer">
          <button onClick={onClose} className="activation-btn activation-btn-secondary">Fermer</button>
        </div>
      </div>
    </div>
  );
};

const ActivationPaymentHistoryModal = ({ 
  isOpen, 
  activation, 
  onClose,
  onPaymentChange,
  showToast,
  showConfirm
}) => {
  const [editPaymentId, setEditPaymentId] = useState(null);
  const [editPaymentAmount, setEditPaymentAmount] = useState('');
  const [editPaymentMethod, setEditPaymentMethod] = useState('');
  const [editPaymentType, setEditPaymentType] = useState('activation');
  const [editPaymentReference, setEditPaymentReference] = useState('');
  const [updatingPayment, setUpdatingPayment] = useState(null);
  const [deletingPayment, setDeletingPayment] = useState(null);
  
  const [localPaymentAmount, setLocalPaymentAmount] = useState('');
  const [localPaymentMethod, setLocalPaymentMethod] = useState('cash');
  const [localPaymentType, setLocalPaymentType] = useState('activation');
  const [localPaymentReference, setLocalPaymentReference] = useState('');
  const [localAddingPayment, setLocalAddingPayment] = useState(false);
  const [localPayments, setLocalPayments] = useState([]);
  const [localTotal, setLocalTotal] = useState(0);
  const [localOriginalPrice, setLocalOriginalPrice] = useState(0);
  const [localRenewalTotal, setLocalRenewalTotal] = useState(0);
  const [localAmountPaid, setLocalAmountPaid] = useState(0);
  const [localRemaining, setLocalRemaining] = useState(0);
  const [localOriginalPaid, setLocalOriginalPaid] = useState(0);
  const [localRenewalPaid, setLocalRenewalPaid] = useState(0);
  const [localOriginalRemaining, setLocalOriginalRemaining] = useState(0);
  const [localRenewalRemaining, setLocalRenewalRemaining] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

 const loadPayments = async () => {
  if (isLoading) return;
  setIsLoading(true);
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/activations/${activation.id}/payments`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      const data = await response.json();

      setLocalPayments(data.payment_history || []);

      // Prix d'activation (déjà en TTC si facturée, HT sinon)
      let activationPrice = safeNumber(activation.price);
      
      // Total des renouvellements (appliquer TVA si facturée)
      let totalRenewals = 0;
      if (activation.renewal_history && Array.isArray(activation.renewal_history)) {
        for (const entry of activation.renewal_history) {
          if (entry.action === 'renewal') {
            let renewalPrice = safeNumber(entry.price);
            if (activation.is_invoiced) {
              renewalPrice = renewalPrice * 1.2; // TVA si facturée
            }
            totalRenewals += renewalPrice;
          }
        }
      }

      let sumActivationPayments = 0;
      let sumRenewalPayments = 0;
      const paymentHistory = data.payment_history || [];

      for (const payment of paymentHistory) {
        const amount = safeNumber(payment.amount);
        const method = payment.method;
        const remiseStatus = payment.remise_status;
        const paymentType = payment.payment_type || 'activation';

        // Règle :
        // - Activation : toujours compter (même chèque non encaissé)
        // - Renouvellement : compter seulement si pas un chèque ou si chèque encaissé
        let isCounted = false;
        if (paymentType === 'activation') {
          isCounted = true;
        } else { // 'renewal'
          if (method !== 'cheque' || remiseStatus === 'encaisse') {
            isCounted = true;
          }
        }

        if (isCounted) {
          if (paymentType === 'renewal') {
            sumRenewalPayments += amount;
          } else {
            sumActivationPayments += amount;
          }
        }
      }

      const originalRemaining = Math.max(0, activationPrice - sumActivationPayments);
      const renewalRemaining = Math.max(0, totalRenewals - sumRenewalPayments);
      const totalToPay = activationPrice + totalRenewals;
      const amountPaid = sumActivationPayments + sumRenewalPayments;
      const remaining = totalToPay - amountPaid;

      setLocalTotal(totalToPay);
      setLocalOriginalPrice(activationPrice);
      setLocalRenewalTotal(totalRenewals);
      setLocalAmountPaid(amountPaid);
      setLocalRemaining(Math.max(0, remaining));
      setLocalOriginalRemaining(originalRemaining);
      setLocalRenewalRemaining(renewalRemaining);
      setLocalOriginalPaid(sumActivationPayments);
      setLocalRenewalPaid(sumRenewalPayments);

      setHasLoaded(true);
    } else {
      const error = await response.json();
      if (showToast) showToast(error.message || 'Erreur de chargement', 'error');
    }
  } catch (err) {
    console.error('Error loading payments:', err);
    if (showToast) showToast('Erreur lors du chargement des paiements', 'error');
  } finally {
    setIsLoading(false);
  }
};

  useEffect(() => {
    if (isOpen && activation?.id && !hasLoaded) {
      loadPayments();
    }
    if (!isOpen) {
      setHasLoaded(false);
    }
  }, [isOpen, activation?.id]);

  const getMaxAmountByType = () => {
    if (localPaymentType === 'activation') {
      return localOriginalRemaining;
    } else {
      return localRenewalRemaining;
    }
  };

  const handleAddPayment = async () => {
    if (!localPaymentAmount || parseFloat(localPaymentAmount) <= 0) {
      if (showToast) showToast('Montant invalide', 'error');
      return;
    }
    
    const amount = parseFloat(localPaymentAmount);
    const maxAmount = getMaxAmountByType();
    
    if (amount > maxAmount) {
      if (showToast) showToast(`Le montant ne peut pas dépasser ${safeFormatPrice(maxAmount)} MAD (${localPaymentType === 'activation' ? 'Activation' : 'Renouvellements'})`, 'error');
      return;
    }
    
    setLocalAddingPayment(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/activations/${activation.id}/payments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: amount,
          method: localPaymentMethod,
          payment_type: localPaymentType,
          reference: localPaymentReference,
          notes: ''
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur lors de l'ajout");
      }
      
      setHasLoaded(false);
      await loadPayments();
      
      setLocalPaymentAmount('');
      setLocalPaymentReference('');
      
      if (showToast) showToast('Paiement ajouté avec succès', 'success');
      
      if (onPaymentChange) onPaymentChange();
      
    } catch (err) {
      if (showToast) showToast(err.message, 'error');
    } finally {
      setLocalAddingPayment(false);
    }
  };

  const handleAddChequePayment = async () => {
    if (!localPaymentAmount || parseFloat(localPaymentAmount) <= 0) {
      if (showToast) showToast('Montant invalide', 'error');
      return;
    }
    
    const amount = parseFloat(localPaymentAmount);
    const maxAmount = getMaxAmountByType();
    
    if (amount > maxAmount) {
      if (showToast) showToast(`Le montant ne peut pas dépasser ${safeFormatPrice(maxAmount)} MAD (${localPaymentType === 'activation' ? 'Activation' : 'Renouvellements'})`, 'error');
      return;
    }
    
    setLocalAddingPayment(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/activations/${activation.id}/cheque-payment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: amount,
          payment_type: localPaymentType,
          cheque_number: localPaymentReference,
          bank_name: 'Autre',
          notes: `Paiement par chèque - ${localPaymentReference || 'sans référence'} (${localPaymentType === 'activation' ? 'Activation' : 'Renouvellement'})`
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur lors de l'ajout");
      }
      
      setHasLoaded(false);
      await loadPayments();
      
      setLocalPaymentAmount('');
      setLocalPaymentReference('');
      
      if (showToast) showToast('Chèque enregistré. En attente de remise.', 'info');
      
      if (onPaymentChange) onPaymentChange();
      
    } catch (err) {
      if (showToast) showToast(err.message, 'error');
    } finally {
      setLocalAddingPayment(false);
    }
  };

  const handleUpdatePayment = async (paymentId, amount, method, paymentType, reference) => {
    if (!amount || parseFloat(amount) <= 0) {
      if (showToast) showToast('Montant invalide', 'error');
      return;
    }
    
    setUpdatingPayment(paymentId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/activations/${activation.id}/payments/${paymentId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          amount: parseFloat(amount), 
          method, 
          payment_type: paymentType,
          reference 
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur de mise à jour');
      }
      
      setHasLoaded(false);
      await loadPayments();
      
      if (showToast) showToast('Paiement mis à jour', 'success');
      
      if (onPaymentChange) onPaymentChange();
      
      setEditPaymentId(null);
      setEditPaymentAmount('');
      setEditPaymentMethod('');
      setEditPaymentType('activation');
      setEditPaymentReference('');
      
    } catch (err) {
      if (showToast) showToast(err.message, 'error');
    } finally {
      setUpdatingPayment(null);
    }
  };

  const handleDeletePayment = async (paymentId) => {
    showConfirm(
      'Supprimer le paiement',
      'Êtes-vous sûr de vouloir supprimer ce paiement ? Cette action est irréversible.',
      async () => {
        setDeletingPayment(paymentId);
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`${API_URL}/activations/${activation.id}/payments/${paymentId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erreur de suppression');
          }

          setHasLoaded(false);
          await loadPayments();
          
          if (showToast) showToast('Paiement supprimé', 'success');
          if (onPaymentChange) onPaymentChange();
        } catch (err) {
          if (showToast) showToast(err.message, 'error');
        } finally {
          setDeletingPayment(null);
        }
      },
      'destructive',
      'Supprimer',
      'Annuler'
    );
  };

  const startEditPayment = (payment) => {
    setEditPaymentId(payment.id);
    setEditPaymentAmount(payment.amount.toString());
    setEditPaymentMethod(payment.method);
    setEditPaymentType(payment.payment_type || 'activation');
    setEditPaymentReference(payment.reference || '');
  };

  const cancelEditPayment = () => {
    setEditPaymentId(null);
    setEditPaymentAmount('');
    setEditPaymentMethod('');
    setEditPaymentType('activation');
    setEditPaymentReference('');
  };

  const PaymentBadge = ({ method }) => {
    const methodClasses = {
      cash: 'payment-badge-cash',
      card: 'payment-badge-card',
      check: 'payment-badge-check',
      bank_transfer: 'payment-badge-bank_transfer',
      other: 'payment-badge-other'
    };
    const methodLabels = {
      cash: 'Espèces',
      card: 'Carte',
      check: 'Chèque',
      bank_transfer: 'Virement',
      other: 'Autre'
    };
    return (
      <span className={`payment-badge ${methodClasses[method] || 'payment-badge-other'}`} style={{ padding: '0.25rem 0.5rem', borderRadius: '0.375rem', fontSize: '0.7rem' }}>
        {methodLabels[method] || method}
      </span>
    );
  };

  const PaymentTypeBadge = ({ paymentType }) => {
    if (paymentType === 'renewal') {
      return <span style={{ fontSize: '0.65rem', background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '12px' }}>🔄 Renouvellement</span>;
    }
    return <span style={{ fontSize: '0.65rem', background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '12px' }}>✅ Activation</span>;
  };

  const getChequeStatusBadge = (remiseStatus) => {
    if (!remiseStatus || remiseStatus === 'pending') {
      return <span style={{ fontSize: '0.65rem', color: '#d97706', background: '#fef3c7', padding: '2px 6px', borderRadius: '12px' }}>⏳ En attente remise</span>;
    } else if (remiseStatus === 'remis') {
      return <span style={{ fontSize: '0.65rem', color: '#2563eb', background: '#dbeafe', padding: '2px 6px', borderRadius: '12px' }}>📝 Remis en banque</span>;
    } else if (remiseStatus === 'encaisse') {
      return <span style={{ fontSize: '0.65rem', color: '#059669', background: '#d1fae5', padding: '2px 6px', borderRadius: '12px' }}>✅ Encaissé</span>;
    }
    return null;
  };

  if (!isOpen || !activation) return null;

  return (
    <div className="activation-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="activation-dialog" style={{ maxWidth: '750px' }}>
        <div className="activation-dialog-header" style={{ justifyContent: 'space-between' }}>
          <h2 className="activation-dialog-title">
            Gestion des paiements - IMEI: {activation.imei || activation.client_imei}
          </h2>
          <button onClick={onClose} className="activation-btn-icon">
            <X size={20} />
          </button>
        </div>
        
        <div className="activation-dialog-body">
          {isLoading && !hasLoaded ? (
            <div className="activation-loading">
              <div className="activation-spinner"></div>
              <p>Chargement des paiements...</p>
            </div>
          ) : (
            <>
              <div className="payment-summary-grid" style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
                gap: '0.75rem',
                marginBottom: '1rem'
              }}>
                <div className="payment-summary-card">
                  <div className="payment-summary-label">Total à payer</div>
                  <div className="payment-summary-value">{safeFormatPrice(localTotal)} MAD</div>
                  <div style={{ fontSize: '0.65rem', color: '#6b7280', marginTop: '4px' }}>
                    Activation: {safeFormatPrice(localOriginalPrice)} MAD
                    {localRenewalTotal > 0 && ` + ${safeFormatPrice(localRenewalTotal)} MAD (renouvellements)`}
                  </div>
                </div>
                <div className="payment-summary-card">
                  <div className="payment-summary-label">Déjà payé</div>
                  <div className="payment-summary-value paid">{safeFormatPrice(localAmountPaid)} MAD</div>
                  <div style={{ fontSize: '0.65rem', color: '#6b7280', marginTop: '4px' }}>
                    Activation: {safeFormatPrice(localOriginalPaid)} MAD
                    {localRenewalPaid > 0 && ` / Renouv: ${safeFormatPrice(localRenewalPaid)} MAD`}
                  </div>
                </div>
                <div className="payment-summary-card">
                  <div className="payment-summary-label">Reste à payer</div>
                  <div className="payment-summary-value remaining">{safeFormatPrice(localRemaining)} MAD</div>
                  <div style={{ fontSize: '0.65rem', color: '#6b7280', marginTop: '4px' }}>
                    Activation: {safeFormatPrice(localOriginalRemaining)} MAD
                    {localRenewalRemaining > 0 && ` / Renouv: ${safeFormatPrice(localRenewalRemaining)} MAD`}
                  </div>
                </div>
              </div>

              {localPayments && localPayments.length > 0 ? (
                <table className="payment-history-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Montant</th>
                      <th>Méthode</th>
                      <th>Référence</th>
                      <th>Statut Chèque</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {localPayments.map((payment, idx) => (
                      <tr key={payment.id || idx}>
                        <td>{new Date(payment.date || payment.created_at).toLocaleString('fr-FR')}</td>
                        <td><PaymentTypeBadge paymentType={payment.payment_type || 'activation'} /></td>
                        <td>
                          {editPaymentId === payment.id ? (
                            <input 
                              type="number" 
                              step="0.01" 
                              value={editPaymentAmount} 
                              onChange={(e) => setEditPaymentAmount(e.target.value)} 
                              style={{ width: '100px', padding: '0.25rem', borderRadius: '0.375rem', border: '1px solid #d1d5db' }} 
                            />
                          ) : (
                            `${safeFormatPrice(payment.amount)} MAD`
                          )}
                        </td>
                        <td>
                          {editPaymentId === payment.id ? (
                            <select 
                              value={editPaymentMethod} 
                              onChange={(e) => setEditPaymentMethod(e.target.value)}
                              style={{ padding: '0.25rem', borderRadius: '0.375rem', border: '1px solid #d1d5db' }}
                            >
                              <option value="cash">Espèces</option>
                              <option value="card">Carte</option>
                              <option value="check">Chèque</option>
                              <option value="bank_transfer">Virement</option>
                              <option value="other">Autre</option>
                            </select>
                          ) : (
                            <PaymentBadge method={payment.method} />
                          )}
                        </td>
                        <td>
                          {editPaymentId === payment.id ? (
                            <input 
                              type="text" 
                              value={editPaymentReference} 
                              onChange={(e) => setEditPaymentReference(e.target.value)} 
                              style={{ width: '100px', padding: '0.25rem', borderRadius: '0.375rem', border: '1px solid #d1d5db' }} 
                            />
                          ) : (
                            payment.reference || '-'
                          )}
                        </td>
                        <td>
                          {(payment.method === 'check' || payment.method === 'cheque') && (
                            getChequeStatusBadge(payment.remise_status)
                          )}
                        </td>
                        <td>
                          {editPaymentId === payment.id ? (
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                              <button 
                                onClick={() => handleUpdatePayment(payment.id, editPaymentAmount, editPaymentMethod, editPaymentType, editPaymentReference)}
                                className="btn-update-payment"
                                disabled={updatingPayment !== null}
                              >
                                Sauver
                              </button>
                              <button onClick={cancelEditPayment} className="activation-btn-outline" style={{ padding: '0.25rem', fontSize: '0.7rem' }}>
                                Annuler
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                              <button onClick={() => startEditPayment(payment)} className="btn-update-payment">
                                Modifier
                              </button>
                              <button 
                                onClick={() => handleDeletePayment(payment.id)} 
                                className="btn-delete-payment"
                                disabled={deletingPayment !== null}
                              >
                                {deletingPayment === payment.id ? '...' : 'Supprimer'}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="activation-empty">
                  <CreditCard size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                  <p>Aucun paiement enregistré</p>
                </div>
              )}

              <div style={{ marginTop: '1.5rem', borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
                <div style={{ marginBottom: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CreditCard size={16} />
                  Ajouter un nouveau paiement
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  gap: '0.5rem', 
                  marginBottom: '1rem',
                  background: '#f3f4f6',
                  padding: '0.25rem',
                  borderRadius: '0.75rem'
                }}>
                  <button
                    onClick={() => setLocalPaymentType('activation')}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      borderRadius: '0.5rem',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 500,
                      background: localPaymentType === 'activation' ? 'linear-gradient(135deg, #10b981, #059669)' : 'transparent',
                      color: localPaymentType === 'activation' ? 'white' : '#4b5563',
                      transition: 'all 0.2s'
                    }}
                  >
                    ✅ Paiement Activation
                    <span style={{ fontSize: '0.7rem', display: 'block', opacity: 0.8 }}>
                      Restant: {safeFormatPrice(localOriginalRemaining)} MAD
                    </span>
                  </button>
                  <button
                    onClick={() => setLocalPaymentType('renewal')}
                    disabled={localRenewalRemaining <= 0}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      borderRadius: '0.5rem',
                      border: 'none',
                      cursor: localRenewalRemaining <= 0 ? 'not-allowed' : 'pointer',
                      fontWeight: 500,
                      background: localPaymentType === 'renewal' ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'transparent',
                      color: localPaymentType === 'renewal' ? 'white' : localRenewalRemaining <= 0 ? '#9ca3af' : '#4b5563',
                      transition: 'all 0.2s',
                      opacity: localRenewalRemaining <= 0 ? 0.6 : 1
                    }}
                  >
                    🔄 Paiement Renouvellement
                    <span style={{ fontSize: '0.7rem', display: 'block', opacity: 0.8 }}>
                      Restant: {safeFormatPrice(localRenewalRemaining)} MAD
                    </span>
                  </button>
                </div>
                
                <div className="add-payment-row">
                  <input 
                    type="number" 
                    step="0.01" 
                    placeholder="Montant" 
                    value={localPaymentAmount} 
                    onChange={(e) => setLocalPaymentAmount(e.target.value)} 
                    className="add-payment-input" 
                  />
                  <select 
                    value={localPaymentMethod} 
                    onChange={(e) => setLocalPaymentMethod(e.target.value)} 
                    className="payment-method-select"
                  >
                    <option value="cash">Espèces</option>
                    <option value="card">Carte Bancaire</option>
                    <option value="check">Chèque</option>
                    <option value="bank_transfer">Virement</option>
                    <option value="other">Autre</option>
                  </select>
                  <input 
                    type="text" 
                    placeholder="Référence (optionnel)" 
                    value={localPaymentReference} 
                    onChange={(e) => setLocalPaymentReference(e.target.value)} 
                    className="add-payment-input" 
                  />
                  <button 
                    onClick={localPaymentMethod === 'check' || localPaymentMethod === 'cheque' ? handleAddChequePayment : handleAddPayment} 
                    disabled={localAddingPayment || !localPaymentAmount || parseFloat(localPaymentAmount) <= 0} 
                    className="btn-add-payment"
                  >
                    {localAddingPayment ? <div className="activation-spinner" style={{ width: '1rem', height: '1rem' }} /> : <><Plus size={14} /> Ajouter</>}
                  </button>
                </div>
                
                {localPaymentAmount && parseFloat(localPaymentAmount) > getMaxAmountByType() && getMaxAmountByType() > 0 && (
                  <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                    Le montant dépasse le reste à payer ({safeFormatPrice(getMaxAmountByType())} MAD)
                  </div>
                )}
                
                {(localPaymentMethod === 'check' || localPaymentMethod === 'cheque') && (
                  <div style={{ fontSize: '0.7rem', color: '#d97706', marginTop: '0.5rem', background: '#fef3c7', padding: '0.5rem', borderRadius: '0.5rem' }}>
                    ⚠️ Les paiements par chèque ne sont pas comptabilisés immédiatement. Vous devrez créer une remise pour finaliser le paiement.
                  </div>
                )}
                
                {localRenewalRemaining <= 0 && localPaymentType === 'renewal' && (
                  <div style={{ fontSize: '0.7rem', color: '#059669', marginTop: '0.5rem', background: '#d1fae5', padding: '0.5rem', borderRadius: '0.5rem' }}>
                    ✅ Tous les renouvellements sont déjà payés !
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        
        <div className="activation-dialog-footer">
          <button onClick={onClose} className="activation-btn activation-btn-secondary">
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

const RenewalModal = ({ state, onClose, onConfirm, loading }) => {
  if (!state.isOpen || !state.activation) return null;
  
  const [selectedPlan, setSelectedPlan] = useState(state.selectedPlan || '12m');
  const [price, setPrice] = useState(state.price || 0);
  
  useEffect(() => {
    setSelectedPlan(state.selectedPlan || '12m');
    setPrice(state.price || 0);
  }, [state.selectedPlan, state.price]);
  
  return (
    <div className="activation-overlay">
      <div className="activation-dialog" style={{ maxWidth: '32rem' }}>
        <div className="activation-dialog-header">
          <h2 className="activation-dialog-title">Renouvellement d'abonnement</h2>
          <button onClick={onClose} className="activation-btn-icon"><X size={20} /></button>
        </div>
        <div className="activation-dialog-body">
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm mb-1"><strong>IMEI:</strong> <span className="font-mono">{state.activation.imei || state.activation.client_imei}</span></p>
            <p className="text-sm mb-1"><strong>Client:</strong> {state.activation.vente?.client?.nom || state.activation.client?.nom || '-'}</p>
            <p className="text-sm mb-1"><strong>Plan actuel:</strong> {PLAN_LABEL[state.activation.plan_abonnement]}</p>
            <p className="text-sm"><strong>Expire le:</strong> {formatDate(state.activation.expires_at)}</p>
            <p className="text-sm mt-2"><strong>Prix d'activation original:</strong> {safeFormatPrice(getDisplayPrice(state.activation))} MAD</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="activation-form-group">
              <label className="activation-label activation-label-required">Nouvelle durée</label>
              <select 
                className="activation-select" 
                value={selectedPlan} 
                onChange={(e) => setSelectedPlan(e.target.value)}
              >
                <option value="1m">+ 1 mois</option>
                <option value="3m">+ 3 mois</option>
                <option value="6m">+ 6 mois</option>
                <option value="12m">+ 12 mois</option>
              </select>
            </div>
            <div className="activation-form-group">
              <label className="activation-label activation-label-required">Prix de renouvellement (MAD)</label>
              <div className="price-input-group">
                <input 
                  type="number" 
                  className="activation-input price-input" 
                  placeholder="0.00"
                  value={price||''}
                  onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                  step="0.01"
                  min="0"
                />
              </div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm">
            <p className="font-medium text-blue-800 mb-1">Information:</p>
            <p className="text-blue-700">Le renouvellement ajoutera <strong>{PLAN_LABEL[selectedPlan]}</strong> à l'abonnement actuel.</p>
            <p className="text-blue-700">Le prix d'activation original ({safeFormatPrice(getDisplayPrice(state.activation))} MAD) restera inchangé.</p>
            {price > 0 && (
              <p className="text-blue-700 mt-1">Montant du renouvellement: <strong>{safeFormatPrice(price)} MAD</strong></p>
            )}
          </div>
        </div>
        <div className="activation-dialog-footer">
          <button onClick={onClose} className="activation-btn activation-btn-secondary" disabled={loading}>Annuler</button>
          <button onClick={() => onConfirm(selectedPlan, price)} disabled={loading || !price} className="activation-btn activation-btn-primary">
            {loading ? <><div className="activation-spinner" style={{ width: '1rem', height: '1rem', borderWidth: '2px' }} /> Renouvellement...</> : `Renouveler (${safeFormatPrice(price)} MAD)`}
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================== MAIN ACTIVATION COMPONENT ====================
const Activation = () => {
  const dispatch = useDispatch();
  
  const stats = useSelector(selectActivationStats);
  const availableImeis = useSelector(selectAvailableImeis);
  const products = useSelector(selectProducts);
  
  const [allActivations, setAllActivations] = useState([]);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [isLoadingAll, setIsLoadingAll] = useState(false);
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [operatorFilter, setOperatorFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showExpiringOnly, setShowExpiringOnly] = useState(false);
  const [showIncompleteOnly, setShowIncompleteOnly] = useState(false);
  const [alertDismissed, setAlertDismissed] = useState(false);
  
  const [showDetailModal, setShowDetailModal] = useState(null);
  const [showActivationPaymentHistory, setShowActivationPaymentHistory] = useState(false);
  const [selectedActivationForPayment, setSelectedActivationForPayment] = useState(null);
  const [loadingAction, setLoadingAction] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  
  const [editingCell, setEditingCell] = useState({ id: null, field: null });
  const [editValue, setEditValue] = useState('');
  const [editImeiType, setEditImeiType] = useState('existing');
  
  const [confirmationState, setConfirmationState] = useState({
    isOpen: false, title: '', message: '', details: null, type: 'danger', confirmText: 'Confirmer', onConfirm: null
  });
  
  const [renewSelectionState, setRenewSelectionState] = useState({
    isOpen: false, activation: null, selectedPlan: '12m', price: 0
  });
  
  const [historyState, setHistoryState] = useState({
    isOpen: false, activation: null, history: []
  });
  
  const [actionHistory, setActionHistory] = useState({});
  const [toasts, setToasts] = useState([]);
  
  const itemsPerPage = 15;
  
  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 5000);
  };
  
  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };
  
  const showConfirm = (title, message, onConfirm, variant = 'primary', confirmText = 'Confirmer', cancelText = 'Annuler') => {
    setConfirmationState({
      isOpen: true,
      title,
      message,
      details: null,
      type: variant === 'destructive' ? 'danger' : (variant === 'warning' ? 'warning' : 'info'),
      confirmText,
      onConfirm: async () => {
        setConfirmationState(prev => ({ ...prev, isOpen: false }));
        await onConfirm();
      }
    });
  };
  
  const loadAllActivations = useCallback(async (forceRefresh = false) => {
    if (initialLoadDone && !forceRefresh) return;
    
    setIsLoadingAll(true);
    
    try {
      const token = localStorage.getItem('token');
      
      const cached = localStorage.getItem('activations_cache');
      const cacheTime = localStorage.getItem('activations_cache_time');
      const now = Date.now();
      
      // Only use cache if NOT forcing refresh and cache is valid
      if (!forceRefresh && cached && cacheTime && (now - parseInt(cacheTime)) < 30000) {
        const cachedData = JSON.parse(cached);
        setAllActivations(cachedData);
        setInitialLoadDone(true);
        setIsLoadingAll(false);
        dispatch(setFullList(cachedData));
        return;
      }
      
      const response = await fetch(`${API_URL}/activations?per_page=5000`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        const activationsList = data.data || data.activations || [];
        
        setAllActivations(activationsList);
        localStorage.setItem('activations_cache', JSON.stringify(activationsList));
        localStorage.setItem('activations_cache_time', now.toString());
        dispatch(setFullList(activationsList));
        setInitialLoadDone(true);
      }
    } catch (err) {
      console.error('Error loading activations:', err);
      setErrorMessage('Erreur lors du chargement des activations');
      setTimeout(() => setErrorMessage(null), 3000);
    } finally {
      setIsLoadingAll(false);
    }
  }, [dispatch, initialLoadDone]);
  
  const loadStats = useCallback(async () => {
    try {
      await dispatch(fetchActivationStats()).unwrap();
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  }, [dispatch]);
  
  useEffect(() => {
    loadAllActivations();
    loadStats();
    dispatch(fetchAvailableImeis());
  }, [loadAllActivations, loadStats, dispatch]);
  
  const refreshData = useCallback(() => {
    loadAllActivations(true);
    loadStats();
    showToast('Données actualisées', 'success');
  }, [loadAllActivations, loadStats]);
  
  useEffect(() => {
    if (allActivations && allActivations.length > 0) {
      const historyMap = {};
      allActivations.forEach(activation => {
        const history = [];
        
        if (activation.activated_at) {
          history.push({
            id: `activation_${activation.id}`,
            date: activation.activated_at,
            action: 'activation',
            plan: activation.plan_abonnement,
            price: activation.price,
            user: activation.created_by_user_name || 'System'
          });
        }
        
        if (activation.renewal_history && Array.isArray(activation.renewal_history)) {
          activation.renewal_history.forEach((entry, idx) => {
            history.push({
              id: `${entry.action}_${activation.id}_${idx}`,
              date: entry.date,
              action: entry.action,
              details: entry,
              user: entry.user_name || 'System'
            });
          });
        }
        
        if (activation.payment_history && Array.isArray(activation.payment_history)) {
          activation.payment_history.forEach((entry, idx) => {
            history.push({
              id: `payment_${activation.id}_${idx}`,
              date: entry.date,
              action: entry.method === 'cheque' ? 'cheque_payment' : 'payment',
              details: entry,
              user: entry.user || 'System'
            });
          });
        }
        
        history.sort((a, b) => new Date(a.date) - new Date(b.date));
        historyMap[activation.id] = history;
      });
      setActionHistory(historyMap);
    }
  }, [allActivations]);
  
  const expiringActivations = useMemo(() => {
    if (!allActivations || !Array.isArray(allActivations)) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return allActivations.filter(act => {
      if (!act.expires_at) return false;
      const expiryDate = new Date(act.expires_at);
      expiryDate.setHours(0, 0, 0, 0);
      const daysRemaining = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
      return daysRemaining > 0 && daysRemaining <= 7 && act.status !== 'expired' && act.status !== 'suspended';
    });
  }, [allActivations]);
  
  const expiringCount = expiringActivations.length;
  
  const incompleteActivations = useMemo(() => {
    if (!allActivations || !Array.isArray(allActivations)) return [];
    return allActivations.filter(act => isActivationIncomplete(act));
  }, [allActivations]);
  
  const incompleteCount = incompleteActivations.length;
  
  const filteredActivations = useMemo(() => {
    if (!allActivations || !Array.isArray(allActivations)) return [];
    let filtered = [...allActivations];
    
    if (showExpiringOnly) {
      const expiringIds = new Set(expiringActivations.map(a => a.id));
      filtered = filtered.filter(act => expiringIds.has(act.id));
    }
    
    if (showIncompleteOnly) {
      const incompleteIds = new Set(incompleteActivations.map(a => a.id));
      filtered = filtered.filter(act => incompleteIds.has(act.id));
    }
    
    if (statusFilter !== 'all' && !showExpiringOnly && !showIncompleteOnly) {
      filtered = filtered.filter(act => act.status === statusFilter);
    }
    
    if (operatorFilter !== 'all') {
      filtered = filtered.filter(act => act.operateur === operatorFilter);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(act => 
        act.imei?.toLowerCase().includes(searchLower) ||
        act.client_imei?.toLowerCase().includes(searchLower) ||
        act.numero_sim?.toLowerCase().includes(searchLower) ||
        act.matricule?.toLowerCase().includes(searchLower) ||
        act.vente?.client?.nom?.toLowerCase().includes(searchLower) ||
        act.vente?.id?.toString().includes(search)
      );
    }
    
    return filtered;
  }, [allActivations, search, statusFilter, operatorFilter, showExpiringOnly, showIncompleteOnly, expiringActivations, incompleteActivations]);
  
  const paginatedActivations = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredActivations.slice(start, start + itemsPerPage);
  }, [filteredActivations, currentPage]);
  
  const totalPages = useMemo(() => {
    return Math.ceil(filteredActivations.length / itemsPerPage);
  }, [filteredActivations]);
  
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, operatorFilter, showExpiringOnly, showIncompleteOnly]);
  
  const startEditing = (activationId, field, currentValue, currentImeiType = null) => {
    setEditingCell({ id: activationId, field });
    
    let displayValue = currentValue !== null && currentValue !== undefined ? currentValue.toString() : '';
    if (field === 'price') {
      const activation = allActivations.find(a => a.id === activationId);
      if (activation) {
        displayValue = activation.price?.toString() || '';
      }
    } else if (field === 'plan_abonnement' && currentValue && PLAN_LABEL[currentValue]) {
      displayValue = currentValue;
    }
    
    setEditValue(displayValue);
    
    if (field === 'imei') {
      setEditImeiType(currentImeiType || 'existing');
    }
  };
  
  const cancelEditing = () => {
    setEditingCell({ id: null, field: null });
    setEditValue('');
    setEditImeiType('existing');
  };
  
  const handleInlineSave = async (activationId, field, value) => {
    setLoadingAction(true);
    setErrorMessage(null);
    
    try {
      let updateData = {};
      
      if (field === 'imei') {
        if (editImeiType === 'existing') {
          const activation = allActivations.find(a => a.id === activationId);
          const selectedImei = availableImeis.find(imei => imei.imei === value);
          
          if (activation && selectedImei && activation.produit_id && activation.produit_id !== selectedImei.produit_id) {
            const product = products.find(p => p.id === activation.produit_id);
            setErrorMessage(`Cet IMEI n'est pas compatible avec le produit "${product?.nom || 'associé'}"`);
            cancelEditing();
            setLoadingAction(false);
            return;
          }
          updateData = { imei: value };
        } else {
          updateData = { client_imei: value };
        }
      } else {
        switch (field) {
          case 'matricule':
            updateData = { matricule: value };
            break;
          case 'numero_sim':
            updateData = { numero_sim: value };
            break;
          case 'operateur':
            updateData = { operateur: value };
            break;
          case 'plan_abonnement':
            updateData = { plan_abonnement: value };
            break;
          case 'price':
            updateData = { price: safeParseNumber(value) };
            break;
          default:
            setErrorMessage(`Le champ "${field}" ne peut pas être modifié directement`);
            cancelEditing();
            setLoadingAction(false);
            return;
        }
      }
      
      const updatedActivation = await dispatch(updateActivation({ id: activationId, ...updateData })).unwrap();
      showToast(`${getFieldLabel(field)} mis à jour avec succès`, 'success');
      
      setAllActivations(prev => prev.map(act => 
        act.id === activationId ? updatedActivation : act
      ));
      
      localStorage.removeItem('activations_cache');
      
    } catch (err) {
      setErrorMessage(err || `Erreur lors de la mise à jour de ${getFieldLabel(field)}`);
      setTimeout(() => setErrorMessage(null), 3000);
    } finally {
      setLoadingAction(false);
      cancelEditing();
    }
  };
  
  const getFieldLabel = (field) => {
    const labels = {
      'imei': 'IMEI',
      'matricule': 'Matricule',
      'numero_sim': 'Numéro SIM',
      'operateur': 'Opérateur',
      'plan_abonnement': 'Plan',
      'price': 'Prix d\'activation'
    };
    return labels[field] || field;
  };
  
  const handleKeyDown = (e, activationId, field) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleInlineSave(activationId, field, editValue);
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };
  
  const isFieldEmpty = (value) => {
    return value === null || value === undefined || value === '' || (typeof value === 'string' && value.trim() === '');
  };
  
  const renderEditableCell = (activation, field, value, type = 'text') => {
    const isEditing = editingCell.id === activation.id && editingCell.field === field;
    const isEmpty = isFieldEmpty(value);
    
    if (isEditing) {
      if (field === 'imei') {
        return (
          <div className="inline-edit-wrapper" style={{ minWidth: '300px' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <label style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input type="radio" value="existing" checked={editImeiType === 'existing'} onChange={() => setEditImeiType('existing')} />
                IMEI existant
              </label>
              <label style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input type="radio" value="client" checked={editImeiType === 'client'} onChange={() => setEditImeiType('client')} />
                IMEI client
              </label>
            </div>
            {editImeiType === 'existing' ? (
              <input
                type="text"
                className="inline-edit-input"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, activation.id, field)}
                placeholder="Saisir l'IMEI"
                autoFocus
              />
            ) : (
              <input
                type="text"
                className="inline-edit-input"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, activation.id, field)}
                placeholder="Saisir l'IMEI client"
                autoFocus
              />
            )}
            <div className="edit-actions">
              <button onClick={() => handleInlineSave(activation.id, field, editValue)} className="edit-save-btn">
                <Check size={14} /> Enregistrer
              </button>
              <button onClick={cancelEditing} className="edit-cancel-btn">
                <X size={14} /> Annuler
              </button>
            </div>
          </div>
        );
      } else if (type === 'select') {
        const options = field === 'operateur' ? OPERATORS : PLAN_OPTIONS;
        const selectOptions = field === 'operateur' 
          ? [{ value: '', label: '-- Sélectionner --' }, ...options.map(opt => ({ value: opt, label: opt }))]
          : options;
        
        return (
          <div className="inline-edit-wrapper">
            <select
              className="inline-edit-select"
              value={editValue || ''}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, activation.id, field)}
              autoFocus
            >
              {selectOptions.map(opt => (
                <option key={opt.value || opt} value={opt.value || opt}>
                  {opt.label || opt}
                </option>
              ))}
            </select>
            <div className="edit-actions">
              <button onClick={() => handleInlineSave(activation.id, field, editValue)} className="edit-save-btn">
                <Check size={14} /> Enregistrer
              </button>
              <button onClick={cancelEditing} className="edit-cancel-btn">
                <X size={14} /> Annuler
              </button>
            </div>
          </div>
        );
      }
      
      return (
        <div className="inline-edit-wrapper">
          <input
            type={type === 'number' ? 'number' : 'text'}
            className="inline-edit-input"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, activation.id, field)}
            step={type === 'number' ? "0.01" : undefined}
            autoFocus
          />
          <div className="edit-actions">
            <button onClick={() => handleInlineSave(activation.id, field, editValue)} className="edit-save-btn">
              <Check size={14} /> Enregistrer
            </button>
            <button onClick={cancelEditing} className="edit-cancel-btn">
              <X size={14} /> Annuler
            </button>
          </div>
        </div>
      );
    }
    
    let displayValue = value || '-';
    if (field === 'imei') {
      let imeiDisplay = '';
      if (activation.imei && activation.client_imei) {
        imeiDisplay = `${activation.imei} (client: ${activation.client_imei})`;
      } else if (activation.imei) {
        imeiDisplay = activation.imei;
      } else if (activation.client_imei) {
        imeiDisplay = `Client: ${activation.client_imei}`;
      } else {
        imeiDisplay = '-';
      }
      displayValue = imeiDisplay;
    } else if (type === 'number' && value !== null && value !== undefined) {
      displayValue = `${safeFormatPrice(value)} MAD`;
    } else if (field === 'plan_abonnement' && value && PLAN_LABEL[value]) {
      displayValue = PLAN_LABEL[value];
    }
    
    const imeiType = activation.imei ? 'existing' : (activation.client_imei ? 'client' : null);
    const showEmptyWarning = isEmpty && (!isEditing);
    
    return (
      <div 
        className={`editable-cell ${isEmpty ? 'empty-cell-highlight' : ''}`} 
        onClick={() => startEditing(activation.id, field, field === 'imei' ? (activation.imei || activation.client_imei) : value, imeiType)} 
        title={isEmpty ? "⚠️ Champ vide - Cliquer pour remplir" : "Cliquer pour modifier"}
      >
        <span className="editable-cell-value">
          {displayValue}
          {showEmptyWarning && (
            <span className="empty-cell-warning" title="Champ requis manquant">
              ⚠️
            </span>
          )}
        </span>
        <Edit size={14} className="editable-cell-edit-icon" />
      </div>
    );
  };
  
  const openRenewSelectionModal = (activation) => {
    setRenewSelectionState({ 
      isOpen: true, 
      activation, 
      selectedPlan: activation.plan_abonnement || '12m',
      price: 0
    });
  };
  
  const handleRenewWithPlan = async (selectedPlan, price) => {
    const { activation } = renewSelectionState;
    if (!activation || !selectedPlan) return;
    
    if (!price || price <= 0) {
      setErrorMessage("Veuillez saisir un prix valide pour le renouvellement");
      return;
    }
    
    setRenewSelectionState(prev => ({ ...prev, isOpen: false }));
    setLoadingAction(true);
    setErrorMessage(null);
    
    try {
      const updatedActivation = await dispatch(updateActivation({ 
        id: activation.id, 
        plan_abonnement: selectedPlan, 
        renew: true,
        price: price
      })).unwrap();
      
      showToast(`Abonnement renouvelé avec +${PLAN_LABEL[selectedPlan]} pour ${safeFormatPrice(price)} MAD`, 'success');
      
      setAllActivations(prev => prev.map(act => 
        act.id === activation.id ? updatedActivation : act
      ));
      
      localStorage.removeItem('activations_cache');
      loadStats();
      
    } catch (err) {
      setErrorMessage(err || 'Erreur lors du renouvellement');
      setTimeout(() => setErrorMessage(null), 3000);
    } finally {
      setLoadingAction(false);
    }
  };
  
  const handleToggleStatus = async (activation, newStatus) => {
    setLoadingAction(true);
    setErrorMessage(null);
    
    try {
      const statusText = newStatus === 'suspended' ? 'suspendue' : 'réactivée';
      const updatedActivation = await dispatch(updateActivation({ id: activation.id, status: newStatus })).unwrap();
      showToast(`Activation ${statusText} avec succès`, 'success');
      
      setAllActivations(prev => prev.map(act => 
        act.id === activation.id ? updatedActivation : act
      ));
      
      localStorage.removeItem('activations_cache');
      loadStats();
      
    } catch (err) {
      setErrorMessage(err || 'Erreur lors du changement de statut');
      setTimeout(() => setErrorMessage(null), 3000);
    } finally {
      setLoadingAction(false);
    }
  };
  
  const showDeleteConfirmation = (activation) => {
    setConfirmationState({
      isOpen: true,
      title: 'Confirmer la suppression',
      message: `Êtes-vous sûr de vouloir supprimer l'activation pour l'IMEI ${activation.imei || activation.client_imei} ?`,
      details: (
        <div>
          <p><strong>IMEI:</strong> {activation.imei || '-'}</p>
          <p><strong>IMEI Client:</strong> {activation.client_imei || '-'}</p>
          <p><strong>N° SIM:</strong> {activation.numero_sim || '-'}</p>
          <p><strong>Client:</strong> {activation.vente?.client?.nom || activation.client?.nom || '-'}</p>
          <p><strong>Prix activation original:</strong> {safeFormatPrice(getDisplayPrice(activation))} MAD</p>
          <p><strong>Total payé (avec renouvellements):</strong> {safeFormatPrice(activation.total_price_paid || activation.price)} MAD</p>
          <p><strong>Nombre de renouvellements:</strong> {activation.renewal_count || 0}</p>
          <p className="text-red-600 mt-2">⚠️ Cette action est irréversible.</p>
        </div>
      ),
      type: 'danger',
      confirmText: 'Supprimer',
      onConfirm: async () => {
        setConfirmationState(prev => ({ ...prev, isOpen: false }));
        await handleDeleteActivation(activation);
      }
    });
  };
  
  const handleDeleteActivation = async (activation) => {
    setLoadingAction(true);
    setErrorMessage(null);
    
    try {
      await dispatch(deleteActivation(activation.id)).unwrap();
      showToast('Activation supprimée avec succès', 'success');
      
      setAllActivations(prev => prev.filter(act => act.id !== activation.id));
      
      localStorage.removeItem('activations_cache');
      loadStats();
      
    } catch (err) {
      setErrorMessage(err || 'Erreur lors de la suppression');
      setTimeout(() => setErrorMessage(null), 3000);
    } finally {
      setLoadingAction(false);
    }
  };
  
  const showHistoryModal = (activation) => {
    const history = actionHistory[activation.id] || [];
    setHistoryState({ isOpen: true, activation, history });
  };
  
  const showPaymentModal = (activation) => {
    setSelectedActivationForPayment(activation);
    setShowActivationPaymentHistory(true);
  };
  
  const showStatusConfirmation = (activation, newStatus) => {
    const isSuspending = newStatus === 'suspended';
    setConfirmationState({
      isOpen: true,
      title: isSuspending ? 'Confirmer la suspension' : 'Confirmer la réactivation',
      message: isSuspending 
        ? `Êtes-vous sûr de vouloir suspendre l'activation pour l'IMEI ${activation.imei || activation.client_imei} ?`
        : `Êtes-vous sûr de vouloir réactiver l'activation pour l'IMEI ${activation.imei || activation.client_imei} ?`,
      details: (
        <div>
          <p><strong>IMEI:</strong> {activation.imei || '-'}</p>
          <p><strong>IMEI Client:</strong> {activation.client_imei || '-'}</p>
          <p><strong>Client:</strong> {activation.vente?.client?.nom || activation.client?.nom || '-'}</p>
          {isSuspending && <p className="text-yellow-600 mt-2">⚠️ Le service sera temporairement désactivé.</p>}
        </div>
      ),
      type: isSuspending ? 'warning' : 'info',
      confirmText: isSuspending ? 'Suspendre' : 'Réactiver',
      onConfirm: async () => {
        setConfirmationState(prev => ({ ...prev, isOpen: false }));
        await handleToggleStatus(activation, newStatus);
      }
    });
  };
  
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const getPageNumbers = (totalPages) => {
    if (totalPages <= 1) return [];
    const current = Math.min(currentPage, totalPages);
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (current <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (current >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = current - 1; i <= current + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };
  
  const handleAlertClick = () => {
    setShowExpiringOnly(true);
    setShowIncompleteOnly(false);
    setCurrentPage(1);
    setAlertDismissed(true);
  };
  
  const handleIncompleteClick = () => {
    setShowIncompleteOnly(true);
    setShowExpiringOnly(false);
    setCurrentPage(1);
  };
  
  const clearFilters = () => {
    setShowExpiringOnly(false);
    setShowIncompleteOnly(false);
    setCurrentPage(1);
    setSearch('');
    setStatusFilter('all');
    setOperatorFilter('all');
  };
  
  const exportToExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Activations GPS');
      
      const companyInfo = JSON.parse(localStorage.getItem('company_info') || '{}');
      const companyName = companyInfo.name || 'AMG TELECOM Sarl';
      const companyAddress = companyInfo.address || '82 Angle Abdelmounem et Rue Soumaya ETG 2 N°4, CASABLANCA';
      const companyPhone = companyInfo.phone || '+212 661 685 758';
      const companyEmail = companyInfo.email || 'contact@amgtelecom.ma';
      const companyIce = companyInfo.ice || '003272997000058';
      const companyRc = companyInfo.rc || '577849';
      const companyPatente = companyInfo.patente || '34779711';
      
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
            ext: { width: 120, height: 80 }
          });
          logoAdded = true;
        }
      } catch (err) {
        console.warn('Logo not found', err);
      }
      
      let rowOffset = logoAdded ? 3 : 0;
      
      worksheet.mergeCells(`A${1 + rowOffset}:O${1 + rowOffset}`);
      worksheet.getCell(`A${1 + rowOffset}`).value = companyName;
      worksheet.getCell(`A${1 + rowOffset}`).font = { bold: true, size: 16 };
      worksheet.getCell(`A${1 + rowOffset}`).alignment = { horizontal: 'center' };
      
      worksheet.mergeCells(`A${2 + rowOffset}:O${2 + rowOffset}`);
      worksheet.getCell(`A${2 + rowOffset}`).value = companyAddress;
      worksheet.getCell(`A${2 + rowOffset}`).font = { size: 10 };
      worksheet.getCell(`A${2 + rowOffset}`).alignment = { horizontal: 'center' };
      
      worksheet.mergeCells(`A${3 + rowOffset}:O${3 + rowOffset}`);
      worksheet.getCell(`A${3 + rowOffset}`).value = `TEL: ${companyPhone} | EMAIL: ${companyEmail}`;
      worksheet.getCell(`A${3 + rowOffset}`).font = { size: 10 };
      worksheet.getCell(`A${3 + rowOffset}`).alignment = { horizontal: 'center' };
      
      worksheet.mergeCells(`A${4 + rowOffset}:O${4 + rowOffset}`);
      worksheet.getCell(`A${4 + rowOffset}`).value = `ICE: ${companyIce} | RC: ${companyRc} | Patente: ${companyPatente}`;
      worksheet.getCell(`A${4 + rowOffset}`).font = { size: 9 };
      worksheet.getCell(`A${4 + rowOffset}`).alignment = { horizontal: 'center' };
      
      worksheet.addRow([]);
      
      worksheet.mergeCells(`A${6 + rowOffset}:O${6 + rowOffset}`);
      worksheet.getCell(`A${6 + rowOffset}`).value = 'LISTE DES ACTIVATIONS GPS';
      worksheet.getCell(`A${6 + rowOffset}`).font = { bold: true, size: 14 };
      worksheet.getCell(`A${6 + rowOffset}`).alignment = { horizontal: 'center' };
      worksheet.getCell(`A${6 + rowOffset}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
      worksheet.getCell(`A${6 + rowOffset}`).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      
      worksheet.addRow([]);
      
      const headers = [
        'Client', 'Type IMEI', 'IMEI', 'IMEI Client', 'N° SIM', 'Opérateur', 'Plan',
        'Prix Activation', 'Total Payé', 'Nb Renouv.', 'Montant Payé', 'Reste à Payer', 'Statut Paiement',
        'Matricule', 'Date Activation', 'Expiration', 'Statut', 'Champs manquants', 'Facturé'
      ];
      const headerRow = worksheet.addRow(headers);
      headerRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
        cell.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
      });
      
      const dataToExport = showExpiringOnly || showIncompleteOnly ? filteredActivations : allActivations;
      dataToExport.forEach(activation => {
        const imeiType = activation.imei ? 'Existant' : (activation.client_imei ? 'Client' : '-');
        const emptyFields = getEmptyFields(activation);
        const totalPaid = activation.total_price_paid || activation.price;
        const renewalCount = activation.renewal_count || 0;
        const displayPrice = getDisplayPrice(activation);
        
        worksheet.addRow([
          activation.vente?.client?.nom || activation.client?.nom || '-',
          imeiType,
          activation.imei || '-',
          activation.client_imei || '-',
          activation.numero_sim || '-',
          activation.operateur || '-',
          PLAN_LABEL[activation.plan_abonnement] || '-',
          safeFormatPrice(displayPrice),
          safeFormatPrice(totalPaid),
          renewalCount,
          safeFormatPrice(activation.amount_paid || 0),
          safeFormatPrice(activation.remaining_amount || 0),
          activation.payment_status === 'paid' ? 'Payé' : activation.payment_status === 'partial' ? 'Partiel' : 'Impayé',
          activation.matricule || '-',
          formatDate(activation.activated_at),
          formatDate(activation.expires_at),
          activation.status === 'active' ? 'Actif' : activation.status === 'suspended' ? 'Suspendu' : activation.status === 'expired' ? 'Expiré' : 'En attente',
          emptyFields.length > 0 ? emptyFields.join(', ') : '-',
          activation.is_invoiced ? 'Oui' : 'Non'
        ]);
      });
      
      worksheet.columns.forEach((column) => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, (cell) => {
          const cellValue = cell.value ? cell.value.toString() : '';
          let columnLength = cellValue.length;
          if (columnLength > maxLength) maxLength = columnLength;
        });
        let width = Math.max(10, Math.min(maxLength + 2, 25));
        column.width = width;
      });
      
      const buffer = await workbook.xlsx.writeBuffer();
      const fileName = `activations_gps_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.xlsx`;
      saveAs(new Blob([buffer]), fileName);
      showToast('Export Excel réussi', 'success');
    } catch (error) {
      console.error('Export error:', error);
      setErrorMessage('Erreur lors de l\'export Excel');
    }
  };
  
  if ((!initialLoadDone && isLoadingAll) || (allActivations.length === 0 && isLoadingAll)) {
    return (
      <>
        <style>{styles}</style>
        <div className="activation-loading">
          <div className="activation-spinner"></div>
          <p style={{ marginTop: '1rem', color: '#64748b' }}>Chargement des activations...</p>
        </div>
      </>
    );
  }
  
  return (
    <>
      <style>{styles}</style>
      
      {toasts.length > 0 && (
        <div style={{ position: 'fixed', bottom: '1rem', right: '1rem', zIndex: 100, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {toasts.map(toast => (
            <div key={toast.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'white', borderRadius: '0.5rem', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', borderLeft: `4px solid ${toast.type === 'success' ? '#10b981' : toast.type === 'error' ? '#ef4444' : '#3b82f6'}` }}>
              {toast.type === 'success' ? <CheckCircle2 size={20} color="#10b981" /> : toast.type === 'error' ? <AlertTriangle size={20} color="#ef4444" /> : <Info size={20} color="#3b82f6" />}
              <span>{toast.message}</span>
              <button onClick={() => removeToast(toast.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={16} /></button>
            </div>
          ))}
        </div>
      )}
      
      <ConfirmationDialog
        isOpen={confirmationState.isOpen}
        onClose={() => setConfirmationState(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmationState.onConfirm}
        title={confirmationState.title}
        message={confirmationState.message}
        details={confirmationState.details}
        type={confirmationState.type}
        confirmText={confirmationState.confirmText}
        loading={loadingAction}
      />
      
      <RenewalModal
        state={renewSelectionState}
        onClose={() => setRenewSelectionState(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handleRenewWithPlan}
        loading={loadingAction}
      />
      
      <HistoryModal isOpen={historyState.isOpen} onClose={() => setHistoryState(prev => ({ ...prev, isOpen: false }))} activation={historyState.activation} history={historyState.history} />
      
      <ActivationPaymentHistoryModal 
        isOpen={showActivationPaymentHistory}
        activation={selectedActivationForPayment}
        onClose={() => {
          setShowActivationPaymentHistory(false);
          setSelectedActivationForPayment(null);
        }}
        onPaymentChange={refreshData}
        showToast={showToast}
        showConfirm={showConfirm}
      />
      
      <div className="activation-container">
        <div className="activation-page-header">
          <div>
            <h1 className="activation-title">Activations GPS</h1>
            <p className="activation-subtitle">
              {allActivations.length} activation(s) au total | Page {currentPage} sur {totalPages}
            </p>
          </div>
          <div className="activation-actions">
            <button onClick={exportToExcel} className="activation-btn activation-btn-outline">
              <FileSpreadsheet size={16} /> Exporter Excel
            </button>
            <button onClick={refreshData} className="activation-btn activation-btn-outline" disabled={isLoadingAll}>
              <RefreshCw size={16} className={isLoadingAll ? 'spinning' : ''} /> Actualiser
            </button>
            {(showExpiringOnly || showIncompleteOnly) && (
              <button onClick={clearFilters} className="activation-btn activation-btn-outline">
                <X size={16} /> Effacer les filtres
              </button>
            )}
          </div>
        </div>
        
        <div className="activation-stats-grid">
          <StatCard icon={Satellite} label="Total Activations" value={allActivations.length || 0} color="primary" />
          <StatCard
  icon={DollarSign}
  label="Chiffre d'affaires"
  value={`${allActivations.reduce((sum, act) => {
    const paymentsTotal = (act.payment_history || []).reduce((paymentSum, payment) => {
      if (payment.method === 'check' || payment.method === 'cheque') {
        return payment.remise_status === 'encaisse'
          ? paymentSum + (parseFloat(payment.amount) || 0)
          : paymentSum;
      }

      return paymentSum + (parseFloat(payment.amount) || 0);
    }, 0);

    const directPaid =
      (!act.payment_history || act.payment_history.length === 0)
        ? (parseFloat(act.amount_paid) || 0)
        : 0;

    return sum + paymentsTotal + directPaid;
  }, 0)} MAD`}
  color="success"
/>
          <StatCard icon={CheckCircle2} label="Actives" value={stats?.active_activations || allActivations.filter(a => a.status === 'active').length} color="success" />
          <StatCard icon={Clock} label="Expirent bientôt" value={expiringCount} color="warning" />
          <StatCard icon={AlertTriangle} label="Incomplètes" value={incompleteCount} color="danger" />
        </div>
        
        {expiringCount > 0 && !alertDismissed && !showExpiringOnly && !showIncompleteOnly && (
          <div className="alert-banner" onClick={handleAlertClick} style={{ cursor: 'pointer', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '0.5rem', padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertTriangle size={20} style={{ color: '#d97706' }} />
            <div style={{ flex: 1, fontSize: '0.875rem', color: '#92400e' }}>
              <strong>{expiringCount} activation{expiringCount > 1 ? 's' : ''}</strong> {expiringCount > 1 ? 'expirent' : 'expire'} dans 7 jours ou moins.
              <span style={{ fontWeight: 500, marginLeft: '0.5rem' }}>Cliquez ici pour les voir</span>
            </div>
            <button onClick={(e) => { e.stopPropagation(); setAlertDismissed(true); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#92400e' }}><X size={16} /></button>
          </div>
        )}
        
        {incompleteCount > 0 && !showIncompleteOnly && !showExpiringOnly && (
          <div className="incomplete-alert-banner" onClick={handleIncompleteClick}>
            <AlertCircle size={22} />
            <div className="incomplete-alert-text">
              <strong>{incompleteCount} activation{incompleteCount > 1 ? 's' : ''}</strong> {incompleteCount > 1 ? 'ont' : 'a'} des champs obligatoires vides 
              (IMEI, N° SIM, Opérateur, Plan, etc.)
              <span style={{ fontWeight: 500, marginLeft: '0.5rem' }}>→ Cliquez pour les voir et compléter</span>
            </div>
            <ChevronRight size={18} style={{ color: '#dc2626' }} />
          </div>
        )}
        
        {errorMessage && <div className="error-message"><AlertTriangle size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />{errorMessage}</div>}
        {successMessage && <div className="success-message"><CheckCircle2 size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />{successMessage}</div>}
        
        <div className="activation-card">
          <div className="activation-filter-bar">
            <div className="activation-search-wrapper">
              <Search className="activation-search-icon" />
              <input 
                className="activation-search-input" 
                placeholder="Rechercher par IMEI, N° SIM, matricule, client..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
              />
            </div>
            <div className="activation-filter-group">
              {!showExpiringOnly && !showIncompleteOnly && (
                <>
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="activation-filter-select">
                    <option value="all">Tous statuts</option>
                    <option value="active">Actifs</option>
                    <option value="expired">Expirés</option>
                    <option value="suspended">Suspendus</option>
                    <option value="pending">En attente</option>
                  </select>
                  <select value={operatorFilter} onChange={(e) => setOperatorFilter(e.target.value)} className="activation-filter-select">
                    <option value="all">Tous opérateurs</option>
                    {OPERATORS.map(op => <option key={op} value={op}>{op}</option>)}
                  </select>
                </>
              )}
              {showIncompleteOnly && (
                <div style={{ padding: '0.5rem 0.75rem', background: '#fee2e2', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#991b1b' }}>
                  🔍 Filtre: Activations incomplètes uniquement ({incompleteCount})
                </div>
              )}
              {showExpiringOnly && (
                <div style={{ padding: '0.5rem 0.75rem', background: '#fef3c7', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#92400e' }}>
                  🔍 Filtre: Expirations proches uniquement ({expiringCount})
                </div>
              )}
            </div>
          </div>
          
          <div className="activation-table-container">
            <table className="activation-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Type IMEI</th>
                  <th>IMEI</th>
                  <th>N° SIM</th>
                  <th>Opérateur</th>
                  <th>Plan</th>
                  <th>Prix Activation</th>
                  <th>Total Payé</th>
                  <th>Montant Payé</th>
                  <th>Reste</th>
                  <th>Matricule</th>
                  <th>Expiration</th>
                  <th>Statut</th>
                  <th>Facturé</th>
                  <th style={{ width: '180px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedActivations.map(activation => {
                  const daysRemaining = activation.days_remaining || 
                    (activation.expires_at ? Math.ceil((new Date(activation.expires_at) - new Date()) / (1000 * 60 * 60 * 24)) : 999);
                  const isExpiringSoon = daysRemaining > 0 && daysRemaining <= 7 && activation.status === 'active';
                  const isIncomplete = isActivationIncomplete(activation);
                  const imeiType = activation.imei ? 'existing' : (activation.client_imei ? 'client' : '-');
                  const imeiTypeLabel = imeiType === 'existing' ? 'Existant' : imeiType === 'client' ? 'Client' : '-';
                  const emptyFields = getEmptyFields(activation);
                  const totalPaid = activation.total_price_paid || activation.price;
                  const renewalCount = activation.renewal_count || 0;
                  const displayPrice = getDisplayPrice(activation);
                  const displayPricePaid = activation.is_invoiced ? activation.amount_paid : activation.amount_paid;
                  const displayRemaining = activation.is_invoiced ? activation.remaining_amount : activation.remaining_amount;
                  
                  return (
                    <tr key={activation.id} className={`${isExpiringSoon ? 'expiring-row' : ''} ${isIncomplete ? 'incomplete-row' : ''}`}>
                      <td className="font-medium">
                        {activation.vente?.client?.nom || activation.client?.nom || '-'}
                        {isIncomplete && emptyFields.length > 0 && (
                          <span className="empty-fields-tooltip" title={`Champs manquants: ${emptyFields.join(', ')}`}>
                            ⚠️
                          </span>
                        )}
                      </td>
                      <td>{imeiTypeLabel}</td>
                      <td>{renderEditableCell(activation, 'imei', activation.imei || activation.client_imei, 'text')}</td>
                      <td>{renderEditableCell(activation, 'numero_sim', activation.numero_sim, 'text')}</td>
                      <td>{renderEditableCell(activation, 'operateur', activation.operateur, 'select')}</td>
                      <td>{renderEditableCell(activation, 'plan_abonnement', activation.plan_abonnement, 'select')}</td>
                      <td>
                        {renderEditableCell(activation, 'price', displayPrice, 'number')}
                        {renewalCount > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            (original: {safeFormatPrice(activation.price)/1.2} MAD)
                          </div>
                        )}
                      </td>
                      <td className="text-green-600 font-medium">
  {(() => {
    const displayActivationPrice = getDisplayPrice(activation);
    let displayRenewalsTotal = 0;
    if (activation.renewal_history && Array.isArray(activation.renewal_history)) {
      displayRenewalsTotal = activation.renewal_history.reduce((sum, entry) => {
        if (entry.action === 'renewal') {
          let renewalPrice = safeNumber(entry.price);
          if (activation.is_invoiced) {
            renewalPrice = renewalPrice * 1.2;  // Apply TVA when invoiced
          }
          return sum + renewalPrice;
        }
        return sum;
      }, 0);
    }
    const totalToPay = displayActivationPrice + displayRenewalsTotal;
    return `${safeFormatPrice(totalToPay)} MAD`;
  })()}
</td>
                      <td className={activation.payment_status === 'paid' ? 'text-green-600 font-medium' : activation.payment_status === 'partial' ? 'text-orange-500' : 'text-red-500'}>
                        {safeFormatPrice(displayPricePaid)} MAD
                      </td>
                      <td className="text-red-500 font-medium">
  {(() => {
    const displayActivationPrice = getDisplayPrice(activation);
    let displayRenewalsTotal = 0;
    if (activation.renewal_history && Array.isArray(activation.renewal_history)) {
      displayRenewalsTotal = activation.renewal_history.reduce((sum, entry) => {
        if (entry.action === 'renewal') {
          let renewalPrice = safeNumber(entry.price);
          if (activation.is_invoiced) {
            renewalPrice = renewalPrice * 1.2;
          }
          return sum + renewalPrice;
        }
        return sum;
      }, 0);
    }
    const totalToPay = displayActivationPrice + displayRenewalsTotal;
    const amountPaid = safeNumber(activation.amount_paid);
    const remaining = Math.max(0, totalToPay - amountPaid);
    return `${safeFormatPrice(remaining)} MAD`;
  })()}
</td>
                      <td>{renderEditableCell(activation, 'matricule', activation.matricule, 'text')}</td>
                      <td className={daysRemaining <= 30 && daysRemaining > 0 ? 'text-red-600' : ''}>
                        {formatDate(activation.expires_at)}
                        {daysRemaining > 0 && daysRemaining < 999 && <span className="text-xs ml-2">({daysRemaining}j{isExpiringSoon && ' ⚠️'})</span>}
                      </td>
                      <td>{getStatusBadge(activation)}</td>
                                            <td>
                        <Badge variant={activation.is_invoiced ? 'success' : 'secondary'}>
                          {activation.is_invoiced ? 'Facturée (TTC)' : 'Non facturée (HT)'}
                        </Badge>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button onClick={() => setShowDetailModal(activation)} className="activation-icon-btn" title="Détails">
                            <Eye size={16} className="text-blue-600" />
                          </button>
                          <button onClick={() => showHistoryModal(activation)} className="activation-icon-btn" title="Historique">
                            <History size={16} className="text-purple-600" />
                          </button>
                          <button onClick={() => showPaymentModal(activation)} className="activation-icon-btn" title="Gérer les paiements">
                            <CreditCard size={16} className="text-green-600" />
                          </button>
                          <button onClick={() => openRenewSelectionModal(activation)} className="activation-icon-btn" title="Renouveler">
                            <RotateCcw size={16} style={{ color: '#16a34a' }} />
                          </button>
                          {activation.status === 'active' && (
                            <button onClick={() => showStatusConfirmation(activation, 'suspended')} className="activation-icon-btn" title="Suspendre">
                              <Ban size={16} className="text-yellow-600" />
                            </button>
                          )}
                          {activation.status === 'suspended' && (
                            <button onClick={() => showStatusConfirmation(activation, 'active')} className="activation-icon-btn" title="Réactiver">
                              <Power size={16} className="text-green-600" />
                            </button>
                          )}
                          <button onClick={() => showDeleteConfirmation(activation)} className="activation-icon-btn" title="Supprimer">
                            <Trash2 size={16} className="text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {paginatedActivations.length === 0 && (
                  <tr>
                    <td colSpan={15} className="activation-empty">
                      <Satellite size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                      {showIncompleteOnly ? 'Aucune activation incomplète trouvée' : 'Aucune activation trouvée'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {totalPages > 1 && (
            <div className="activation-pagination-container">
              <button 
                className="activation-pagination-btn" 
                onClick={() => handlePageChange(currentPage - 1)} 
                disabled={currentPage === 1}
              >
                <ChevronLeft size={16} /> Précédent
              </button>
              {getPageNumbers(totalPages).map((page, idx) => 
                page === '...' ? (
                  <span key={`ellipsis-${idx}`} className="activation-pagination-info">...</span>
                ) : (
                  <button 
                    key={page} 
                    className={`activation-pagination-btn ${currentPage === page ? 'activation-pagination-active' : ''}`} 
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </button>
                )
              )}
              <button 
                className="activation-pagination-btn" 
                onClick={() => handlePageChange(currentPage + 1)} 
                disabled={currentPage === totalPages}
              >
                Suivant <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Detail Modal */}
      {showDetailModal && (
        <div className="activation-overlay">
          <div className="activation-dialog" style={{ maxWidth: '36rem' }}>
            <div className="activation-dialog-header">
              <h2 className="activation-dialog-title">Détails de l'activation</h2>
              <button onClick={() => setShowDetailModal(null)} className="activation-btn-icon"><X size={20} /></button>
            </div>
            <div className="activation-dialog-body">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><strong>ID:</strong> {showDetailModal.id}</div>
                <div><strong>Type IMEI:</strong> {showDetailModal.imei ? 'Existant' : (showDetailModal.client_imei ? 'Client' : '-')}</div>
                <div><strong>IMEI:</strong> <span className="font-mono">{showDetailModal.imei || '-'}</span></div>
                <div><strong>IMEI Client:</strong> <span className="font-mono">{showDetailModal.client_imei || '-'}</span></div>
                <div><strong>N° SIM:</strong> <span className="font-mono">{showDetailModal.numero_sim || '-'}</span></div>
                <div><strong>Opérateur:</strong> {showDetailModal.operateur || '-'}</div>
                <div><strong>Plan:</strong> {PLAN_LABEL[showDetailModal.plan_abonnement]}</div>
                <div><strong>Matricule:</strong> {showDetailModal.matricule || '-'}</div>
                <div><strong>Client:</strong> {showDetailModal.vente?.client?.nom || showDetailModal.client?.nom || '-'}</div>
                <div><strong>ICE Client:</strong> {showDetailModal.vente?.client?.ice_client || showDetailModal.client?.ice_client || '-'}</div>
                <div><strong>N° Vente:</strong> #{showDetailModal.vente_id || '-'}</div>
                <div><strong>Date activation:</strong> {formatDate(showDetailModal.activated_at)}</div>
                <div><strong>Expiration:</strong> {formatDate(showDetailModal.expires_at)}</div>
                <div><strong>Statut:</strong> {getStatusBadge(showDetailModal)}</div>
                <div><strong>Prix Activation (HT):</strong> <span className="text-blue-600 font-medium">{safeFormatPrice(showDetailModal.price)} MAD</span></div>
                <div><strong>Prix affiché:</strong> <span className="text-blue-600 font-medium">{safeFormatPrice(getDisplayPrice(showDetailModal))} MAD {showDetailModal.is_invoiced ? '(TTC)' : '(HT)'}</span></div>
                <div><strong>Total payé (avec renouvellements):</strong> <span className="text-green-600 font-bold">{safeFormatPrice(showDetailModal.total_price_paid || showDetailModal.price)} MAD</span></div>
                <div><strong>Montant payé:</strong> <span className="text-green-600">{safeFormatPrice(showDetailModal.amount_paid || 0)} MAD</span></div>
                <div><strong>Reste à payer:</strong> <span className="text-red-600">{safeFormatPrice(showDetailModal.remaining_amount || 0)} MAD</span></div>
                <div><strong>Statut paiement:</strong> 
                  <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                    showDetailModal.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 
                    showDetailModal.payment_status === 'partial' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-red-100 text-red-800'
                  }`}>
                    {showDetailModal.payment_status === 'paid' ? 'Payé' : showDetailModal.payment_status === 'partial' ? 'Partiel' : 'Impayé'}
                  </span>
                </div>
                <div><strong>Facturé:</strong> {showDetailModal.is_invoiced ? 'Oui (TTC affiché)' : 'Non (HT affiché)'}</div>
                <div><strong>Nombre de renouvellements:</strong> {showDetailModal.renewal_count || 0}</div>
              </div>
              {showDetailModal.renewal_history && showDetailModal.renewal_history.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <strong>Historique des renouvellements:</strong>
                  <ul className="mt-2 space-y-1">
                    {showDetailModal.renewal_history.filter(entry => entry.action === 'renewal').map((renewal, idx) => (
                      <li key={idx} className="text-sm text-gray-600">
                        {formatDate(renewal.date)}: {PLAN_LABEL[renewal.old_plan]} → {PLAN_LABEL[renewal.new_plan]} - {safeFormatPrice(renewal.price)} MAD
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {showDetailModal.payment_history && showDetailModal.payment_history.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <strong>Historique des paiements:</strong>
                  <ul className="mt-2 space-y-1">
                    {showDetailModal.payment_history.map((payment, idx) => (
                      <li key={idx} className="text-sm text-gray-600">
                        {formatDate(payment.date)}: {safeFormatPrice(payment.amount)} MAD - {payment.method} {payment.reference ? `(Réf: ${payment.reference})` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="activation-dialog-footer">
              <button onClick={() => setShowDetailModal(null)} className="activation-btn activation-btn-secondary">Fermer</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Activation;