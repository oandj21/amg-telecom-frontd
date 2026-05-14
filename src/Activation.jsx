import { useState, useMemo, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Plus, Satellite, RefreshCw, AlertTriangle, CheckCircle2, Clock,
  Search, Eye, Edit, Trash2, X, Calendar, Wifi, Car,
  Smartphone, Ban, Power, DollarSign, Save, RotateCcw, ChevronDown, ChevronUp,
  FileSpreadsheet, Download, History, ChevronLeft, ChevronRight,
  TrendingUp, Check, AlertCircle
} from 'lucide-react';
import { ExportMenu } from './ExportMenu';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import {
  selectSalesForActivation,
  selectSelectedSaleActivation,
  selectActivations,
  selectActivationStats,
  selectActivationsLoading,
  selectActivationsPagination,
  selectGpsDevices,
  fetchSalesForActivation,
  fetchSaleActivationDetails,
  activateDevices,
  fetchActivations,
  fetchActivationStats,
  updateActivation,
  deleteActivation,
  fetchGpsDevices,
  clearSelectedSale,
  getAvailableDevices,
  fetchAvailableImeis,
  selectAvailableImeis,
  selectProducts
} from './Store/store';

// ==================== CONSTANTS ====================
const PLAN_LABEL = { '1m': '1 mois', '3m': '3 mois', '6m': '6 mois', '12m': '12 mois' };
const PLAN_OPTIONS = [
  { value: '1m', label: '1 mois' },
  { value: '3m', label: '3 mois' },
  { value: '6m', label: '6 mois' },
  { value: '12m', label: '12 mois' }
];
const OPERATORS = ['Inwi', 'Maroc Telecom', 'Orange', 'Autre'];

const API_URL = window.REACT_APP_API_URL || "https://amg-telecom-backd-production.up.railway.app/api";

// ==================== HELPER: Check if activation has empty required fields ====================
const isActivationIncomplete = (activation) => {
  if (!activation) return false;
  
  // Check required fields
  const hasImei = (activation.imei && activation.imei.trim() !== '') || 
                  (activation.client_imei && activation.client_imei.trim() !== '');
  const hasNumeroSim = activation.numero_sim && activation.numero_sim.trim() !== '';
  const hasOperateur = activation.operateur && activation.operateur.trim() !== '';
  const hasMatricule = activation.matricule && activation.matricule.trim() !== '';
  const hasPrice = activation.price !== null && activation.price !== undefined && activation.price > 0;
  const hasPlan = activation.plan_abonnement && activation.plan_abonnement.trim() !== '';
  
  // Fields that are considered critical for a complete activation
  const criticalFieldsMissing = !hasImei || !hasNumeroSim || !hasOperateur || !hasPlan;
  // Optional but recommended fields
  const recommendedFieldsMissing = !hasMatricule || !hasPrice;
  
  // Return true if any critical field is missing, or if at least 2 recommended fields are missing
  return criticalFieldsMissing || (recommendedFieldsMissing && (!hasMatricule && !hasPrice));
};

// Get list of empty fields for display
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
    font-size: 0.875rem;
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
    font-size: 0.875rem;
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
    font-size: 0.875rem;
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
    font-size: 0.875rem;
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
    font-size: 0.875rem;
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
  
  /* Empty cell highlighting */
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
    font-size: 0.875rem;
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
    z-index: 50;
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
    font-size: 0.875rem;
    color: #6b7280;
    margin-bottom: 1.5rem;
  }
  
  .confirmation-details {
    background: #f9fafb;
    border-radius: 0.5rem;
    padding: 0.75rem;
    margin: 1rem 0;
    text-align: left;
    font-size: 0.875rem;
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
    font-size: 0.875rem;
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
  .text-sm { font-size: 0.875rem; }
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
    font-size: 0.875rem;
  }
  
  .success-message {
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 0.5rem;
    padding: 0.75rem;
    margin-bottom: 1rem;
    color: #16a34a;
    font-size: 0.875rem;
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
    font-size: 0.875rem;
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
    font-size: 0.875rem;
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
    font-size: 0.875rem;
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
    font-size: 0.875rem;
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
    font-size: 0.875rem;
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
    font-size: 0.875rem;
    background: white;
    cursor: pointer;
  }
  
  .activation-select:focus {
    border-color: #3b82f6;
    outline: none;
  }
  
  /* Searchable IMEI Select Styles */
  .searchable-imei-select {
    position: relative;
    width: 100%;
  }
  
  .searchable-imei-trigger {
    width: 100%;
    padding: 0.5rem 2rem 0.5rem 0.75rem;
    border: 2px solid #3b82f6;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    background: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: all 0.2s;
  }
  
  .searchable-imei-trigger:hover {
    border-color: #2563eb;
    background: #f8fafc;
  }
  
  .searchable-imei-trigger.open {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  }
  
  .searchable-imei-trigger-placeholder {
    color: #9ca3af;
  }
  
  .searchable-imei-trigger-value {
    color: #1e293b;
    font-weight: 500;
  }
  
  .searchable-imei-icon {
    color: #94a3b8;
    transition: transform 0.2s ease;
  }
  
  .searchable-imei-icon.open {
    transform: rotate(180deg);
  }
  
  .searchable-imei-dropdown {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 0.75rem;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    max-height: 320px;
    overflow: hidden;
    animation: dropdownFadeIn 0.2s ease;
  }
  
  @keyframes dropdownFadeIn {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .searchable-imei-search {
    position: sticky;
    top: 0;
    padding: 0.75rem;
    border-bottom: 1px solid #e2e8f0;
    background: white;
  }
  
  .searchable-imei-search-input {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
    font-size: 0.813rem;
    outline: none;
  }
  
  .searchable-imei-search-input:focus {
    border-color: #3b82f6;
    outline: none;
  }
  
  .searchable-imei-options {
    max-height: 200px;
    overflow-y: auto;
  }
  
  .searchable-imei-option {
    padding: 0.75rem;
    cursor: pointer;
    transition: all 0.15s ease;
    border-bottom: 1px solid #f1f5f9;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .searchable-imei-option:hover {
    background: #f1f5f9;
  }
  
  .searchable-imei-option.selected {
    background: #eff6ff;
  }
  
  .searchable-imei-option-imei {
    font-weight: 600;
    font-family: monospace;
    color: #1e293b;
  }
  
  .searchable-imei-option-product {
    font-size: 0.7rem;
    color: #64748b;
  }
  
  .searchable-imei-no-results {
    padding: 1rem;
    text-align: center;
    color: #94a3b8;
    font-size: 0.813rem;
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
  
  /* Incomplete banner styles */
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
    font-size: 0.875rem;
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
`;

// ==================== STAT CARD COMPONENT ====================
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

// ==================== SEARCHABLE IMEI SELECT COMPONENT ====================
const SearchableImeiSelect = ({ options, value, onChange, placeholder = "Sélectionner un IMEI...", disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  
  const selectedOption = options.find(opt => opt.imei === value);
  
  const filteredOptions = options.filter(opt => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return opt.imei.toLowerCase().includes(searchLower) ||
           (opt.produit_nom && opt.produit_nom.toLowerCase().includes(searchLower));
  });
  
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
  
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);
  
  const handleSelect = (option) => {
    onChange(option.imei);
    setIsOpen(false);
    setSearchTerm('');
  };
  
  return (
    <div className="searchable-imei-select" ref={containerRef}>
      <div 
        className={`searchable-imei-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{ cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1 }}
      >
        <span className={selectedOption ? 'searchable-imei-trigger-value' : 'searchable-imei-trigger-placeholder'}>
          {selectedOption ? selectedOption.imei : placeholder}
        </span>
        <ChevronDown size={16} className={`searchable-imei-icon ${isOpen ? 'open' : ''}`} />
      </div>
      
      {isOpen && !disabled && (
        <div className="searchable-imei-dropdown">
          <div className="searchable-imei-search">
            <input
              ref={searchInputRef}
              type="text"
              className="searchable-imei-search-input"
              placeholder="Rechercher par IMEI ou produit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="searchable-imei-options">
            {filteredOptions.length === 0 ? (
              <div className="searchable-imei-no-results">
                Aucun IMEI trouvé
              </div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.id}
                  className={`searchable-imei-option ${selectedOption?.imei === option.imei ? 'selected' : ''}`}
                  onClick={() => handleSelect(option)}
                >
                  <span className="searchable-imei-option-imei">{option.imei}</span>
                  <span className="searchable-imei-option-product">{option.produit_nom}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== CONFIRMATION DIALOG ====================
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

// ==================== HISTORY MODAL ====================
const HistoryModal = ({ isOpen, onClose, activation, history }) => {
  if (!isOpen || !activation) return null;
  
  const getActionIcon = (action) => {
    const iconClass = `history-icon ${getIconClass(action)}`;
    switch (action) {
      case 'activation': return <div className={iconClass}><CheckCircle2 size={16} /></div>;
      case 'renewal': return <div className={iconClass}><RefreshCw size={16} /></div>;
      case 'suspension': return <div className={iconClass}><Ban size={16} /></div>;
      case 'reactivation': return <div className={iconClass}><Power size={16} /></div>;
      case 'deletion': return <div className={iconClass}><Trash2 size={16} /></div>;
      default: return <div className={iconClass}><History size={16} /></div>;
    }
  };
  
  const getIconClass = (action) => {
    switch (action) {
      case 'activation': return 'history-icon-activation';
      case 'renewal': return 'history-icon-renewal';
      case 'suspension': return 'history-icon-suspension';
      case 'reactivation': return 'history-icon-reactivation';
      case 'deletion': return 'history-icon-deletion';
      default: return 'history-icon-activation';
    }
  };
  
  const getActionLabel = (action) => {
    const labels = {
      'activation': '✅ Activation',
      'renewal': '🔄 Renouvellement',
      'suspension': '⛔ Suspension',
      'reactivation': '▶️ Réactivation',
      'deletion': '🗑️ Suppression'
    };
    return labels[action] || action;
  };
  
  const getActionDetails = (entry) => {
    switch (entry.action) {
      case 'renewal':
        return `${entry.old_plan || entry.details?.old_plan || ''} → ${entry.new_plan || entry.details?.new_plan || ''} | Prix: ${entry.price || entry.details?.price || 0} MAD`;
      case 'activation':
        return `Activé avec plan ${entry.plan || entry.details?.plan || ''} | Prix activation: ${entry.price || entry.details?.price || 0} MAD`;
      case 'suspension':
        return 'Service suspendu';
      case 'reactivation':
        return 'Service réactivé';
      default:
        return '';
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
              <div><strong>Prix activation:</strong> {safeFormatPrice(activation.price)} MAD</div>
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
                    {entry.user_name && <div className="history-user">Par: {entry.user_name}</div>}
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

// Helper functions
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

const formatDate = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
};

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

// ==================== MAIN ACTIVATION COMPONENT ====================
const Activation = () => {
  const dispatch = useDispatch();
  
  const activations = useSelector(selectActivations);
  const stats = useSelector(selectActivationStats);
  const loading = useSelector(selectActivationsLoading);
  const pagination = useSelector(selectActivationsPagination);
  const availableImeis = useSelector(selectAvailableImeis);
  const products = useSelector(selectProducts);
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [operatorFilter, setOperatorFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showDetailModal, setShowDetailModal] = useState(null);
  const [loadingAction, setLoadingAction] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [showExpiringOnly, setShowExpiringOnly] = useState(false);
  const [showIncompleteOnly, setShowIncompleteOnly] = useState(false);
  
  // Inline editing states
  const [editingCell, setEditingCell] = useState({ id: null, field: null });
  const [editValue, setEditValue] = useState('');
  const [editImeiType, setEditImeiType] = useState('existing');
  
  // Items per page
  const itemsPerPage = 15;
  
  // Confirmation dialog state
  const [confirmationState, setConfirmationState] = useState({
    isOpen: false, title: '', message: '', details: null, type: 'danger', confirmText: 'Confirmer', onConfirm: null
  });
  
  // Renew selection modal state
  const [renewSelectionState, setRenewSelectionState] = useState({
    isOpen: false, activation: null, selectedPlan: '12m', price: 0
  });
  
  // History modal state
  const [historyState, setHistoryState] = useState({
    isOpen: false, activation: null, history: []
  });
  
  const [actionHistory, setActionHistory] = useState({});
  
  // Fetch available IMEIs and products on mount
  useEffect(() => {
    dispatch(fetchAvailableImeis());
  }, [dispatch]);
  
  useEffect(() => {
    loadData();
  }, [dispatch, currentPage]);
  
  const loadData = () => {
    dispatch(fetchActivations({ page: currentPage, per_page: itemsPerPage }));
    dispatch(fetchActivationStats());
  };
  
  // Build action history
  useEffect(() => {
    if (activations && activations.length > 0) {
      const historyMap = {};
      activations.forEach(activation => {
        const history = [];
        
        if (activation.activated_at) {
          history.push({
            id: `activation_${activation.id}`,
            date: activation.activated_at,
            action: 'activation',
            plan: activation.plan_abonnement,
            price: activation.price,
            user_name: activation.created_by_user_name || 'System'
          });
        }
        
        if (activation.renewal_history && Array.isArray(activation.renewal_history)) {
          activation.renewal_history.forEach((entry, idx) => {
            if (entry.action === 'renewal') {
              history.push({
                id: `renewal_${activation.id}_${idx}`,
                date: entry.date,
                action: entry.action,
                old_plan: entry.old_plan,
                new_plan: entry.new_plan,
                price: entry.price,
                user_name: entry.user_name || 'System'
              });
            } else if (entry.action === 'suspension') {
              history.push({
                id: `suspension_${activation.id}_${idx}`,
                date: entry.date,
                action: entry.action,
                reason: entry.reason,
                user_name: entry.user_name || 'System'
              });
            } else if (entry.action === 'reactivation') {
              history.push({
                id: `reactivation_${activation.id}_${idx}`,
                date: entry.date,
                action: entry.action,
                user_name: entry.user_name || 'System'
              });
            } else if (entry.action === 'deletion') {
              history.push({
                id: `deletion_${activation.id}_${idx}`,
                date: entry.date,
                action: entry.action,
                user_name: entry.user_name || 'System'
              });
            }
          });
        }
        
        history.sort((a, b) => new Date(a.date) - new Date(b.date));
        historyMap[activation.id] = history;
      });
      setActionHistory(historyMap);
    }
  }, [activations]);
  
  const expiringActivations = useMemo(() => {
    if (!activations || !Array.isArray(activations)) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return activations.filter(act => {
      if (!act.expires_at) return false;
      const expiryDate = new Date(act.expires_at);
      expiryDate.setHours(0, 0, 0, 0);
      const daysRemaining = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
      return daysRemaining > 0 && daysRemaining <= 7 && act.status !== 'expired' && act.status !== 'suspended';
    });
  }, [activations]);
  
  const expiringCount = expiringActivations.length;
  
  // Compute incomplete activations
  const incompleteActivations = useMemo(() => {
    if (!activations || !Array.isArray(activations)) return [];
    return activations.filter(act => isActivationIncomplete(act));
  }, [activations]);
  
  const incompleteCount = incompleteActivations.length;
  
  const filteredActivations = useMemo(() => {
    if (!activations || !Array.isArray(activations)) return [];
    let filtered = activations;
    
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
      filtered = filtered.filter(act => 
        act.imei?.toLowerCase().includes(search.toLowerCase()) ||
        act.client_imei?.toLowerCase().includes(search.toLowerCase()) ||
        act.numero_sim?.toLowerCase().includes(search.toLowerCase()) ||
        act.matricule?.toLowerCase().includes(search.toLowerCase()) ||
        act.vente?.client?.nom?.toLowerCase().includes(search.toLowerCase()) ||
        act.vente?.id?.toString().includes(search)
      );
    }
    
    return filtered;
  }, [activations, search, statusFilter, operatorFilter, showExpiringOnly, showIncompleteOnly, expiringActivations, incompleteActivations]);
  
  const paginatedActivations = useMemo(() => {
    if (showExpiringOnly || showIncompleteOnly) {
      const start = (currentPage - 1) * itemsPerPage;
      return filteredActivations.slice(start, start + itemsPerPage);
    }
    return filteredActivations;
  }, [filteredActivations, currentPage, itemsPerPage, showExpiringOnly, showIncompleteOnly]);
  
  const totalPages = (showExpiringOnly || showIncompleteOnly)
    ? Math.ceil(filteredActivations.length / itemsPerPage)
    : (pagination?.last_page || 1);
  
  // Get filtered IMEIs for a specific activation
  const getFilteredImeisForActivation = (activation) => {
    if (!availableImeis || !Array.isArray(availableImeis)) return [];
    
    // Filter IMEIs by product ID if the activation has a produit_id
    if (activation.produit_id) {
      return availableImeis.filter(imei => imei.produit_id === activation.produit_id);
    }
    
    return availableImeis;
  };
  
  // ==================== INLINE EDITING FUNCTIONS ====================
  const startEditing = (activationId, field, currentValue, currentImeiType = null) => {
    setEditingCell({ id: activationId, field });
    let displayValue = currentValue !== null && currentValue !== undefined ? currentValue.toString() : '';
    
    if (field === 'plan_abonnement' && currentValue && PLAN_LABEL[currentValue]) {
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
          // Find the activation to get its produit_id
          const activation = activations.find(a => a.id === activationId);
          const selectedImei = availableImeis.find(imei => imei.imei === value);
          
          // Validate that the selected IMEI belongs to the same product
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
      
      await dispatch(updateActivation({ id: activationId, ...updateData })).unwrap();
      setSuccessMessage(`${getFieldLabel(field)} mis à jour avec succès`);
      loadData();
      setTimeout(() => setSuccessMessage(null), 2000);
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
  
  // Helper to check if a field value is empty
  const isFieldEmpty = (value) => {
    return value === null || value === undefined || value === '' || (typeof value === 'string' && value.trim() === '');
  };
  
  // ==================== RENDER EDITABLE CELL ====================
  const renderEditableCell = (activation, field, value, type = 'text') => {
    const isEditing = editingCell.id === activation.id && editingCell.field === field;
    const isEmpty = isFieldEmpty(value);
    
    if (isEditing) {
      if (field === 'imei') {
        const filteredImeis = getFilteredImeisForActivation(activation);
        
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
              <SearchableImeiSelect
                options={filteredImeis}
                value={editValue}
                onChange={(selectedImei) => setEditValue(selectedImei)}
                placeholder="-- Sélectionner un IMEI --"
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
        // Add an empty option for operator field
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
    
    // Display value
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
  
  // ==================== OTHER HANDLERS ====================
  const openRenewSelectionModal = (activation) => {
    setRenewSelectionState({ 
      isOpen: true, 
      activation, 
      selectedPlan: activation.plan_abonnement || '12m',
      price: 0
    });
  };
  
  const handleRenewWithPlan = async () => {
    const { activation, selectedPlan, price } = renewSelectionState;
    if (!activation || !selectedPlan) return;
    
    if (!price || price <= 0) {
      setErrorMessage("Veuillez saisir un prix valide pour le renouvellement");
      return;
    }
    
    setRenewSelectionState(prev => ({ ...prev, isOpen: false }));
    setLoadingAction(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    
    try {
      // Send renew: true - this will NOT overwrite the original price field
      await dispatch(updateActivation({ 
        id: activation.id, 
        plan_abonnement: selectedPlan, 
        renew: true,
        price: price  // This goes into renewal_history, NOT the main price field
      })).unwrap();
      setSuccessMessage(`Abonnement renouvelé avec +${PLAN_LABEL[selectedPlan]} pour ${safeFormatPrice(price)} MAD (IMEI ${activation.imei || activation.client_imei})`);
      loadData();
      setTimeout(() => setSuccessMessage(null), 3000);
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
    setSuccessMessage(null);
    
    try {
      const statusText = newStatus === 'suspended' ? 'suspendue' : 'réactivée';
      await dispatch(updateActivation({ id: activation.id, status: newStatus })).unwrap();
      setSuccessMessage(`Activation ${statusText} avec succès`);
      loadData();
      setTimeout(() => setSuccessMessage(null), 1500);
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
          <p><strong>Prix activation original:</strong> {safeFormatPrice(activation.price)} MAD</p>
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
  
  const showHistoryModal = (activation) => {
    const history = actionHistory[activation.id] || [];
    setHistoryState({ isOpen: true, activation, history });
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
  
  const handleDeleteActivation = async (activation) => {
    setLoadingAction(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    
    try {
      await dispatch(deleteActivation(activation.id)).unwrap();
      setSuccessMessage('Activation supprimée avec succès');
      loadData();
      setTimeout(() => setSuccessMessage(null), 1500);
    } catch (err) {
      setErrorMessage(err || 'Erreur lors de la suppression');
      setTimeout(() => setErrorMessage(null), 3000);
    } finally {
      setLoadingAction(false);
    }
  };
  
  const handlePageChange = (page) => {
    if (!showExpiringOnly && !showIncompleteOnly) {
      setCurrentPage(page);
      dispatch(fetchActivations({ page: page, per_page: itemsPerPage }));
    } else {
      setCurrentPage(page);
    }
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
  };
  
  // Export function
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
      
      worksheet.mergeCells(`A${1 + rowOffset}:K${1 + rowOffset}`);
      worksheet.getCell(`A${1 + rowOffset}`).value = companyName;
      worksheet.getCell(`A${1 + rowOffset}`).font = { bold: true, size: 16 };
      worksheet.getCell(`A${1 + rowOffset}`).alignment = { horizontal: 'center' };
      
      worksheet.mergeCells(`A${2 + rowOffset}:K${2 + rowOffset}`);
      worksheet.getCell(`A${2 + rowOffset}`).value = companyAddress;
      worksheet.getCell(`A${2 + rowOffset}`).font = { size: 10 };
      worksheet.getCell(`A${2 + rowOffset}`).alignment = { horizontal: 'center' };
      
      worksheet.mergeCells(`A${3 + rowOffset}:K${3 + rowOffset}`);
      worksheet.getCell(`A${3 + rowOffset}`).value = `TEL: ${companyPhone} | EMAIL: ${companyEmail}`;
      worksheet.getCell(`A${3 + rowOffset}`).font = { size: 10 };
      worksheet.getCell(`A${3 + rowOffset}`).alignment = { horizontal: 'center' };
      
      worksheet.mergeCells(`A${4 + rowOffset}:K${4 + rowOffset}`);
      worksheet.getCell(`A${4 + rowOffset}`).value = `ICE: ${companyIce} | RC: ${companyRc} | Patente: ${companyPatente}`;
      worksheet.getCell(`A${4 + rowOffset}`).font = { size: 9 };
      worksheet.getCell(`A${4 + rowOffset}`).alignment = { horizontal: 'center' };
      
      worksheet.addRow([]);
      
      worksheet.mergeCells(`A${6 + rowOffset}:K${6 + rowOffset}`);
      worksheet.getCell(`A${6 + rowOffset}`).value = 'LISTE DES ACTIVATIONS GPS';
      worksheet.getCell(`A${6 + rowOffset}`).font = { bold: true, size: 14 };
      worksheet.getCell(`A${6 + rowOffset}`).alignment = { horizontal: 'center' };
      worksheet.getCell(`A${6 + rowOffset}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
      worksheet.getCell(`A${6 + rowOffset}`).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      
      worksheet.addRow([]);
      
      const headers = [
        'Client', 'Type IMEI', 'IMEI', 'IMEI Client', 'N° SIM', 'Opérateur', 'Plan',
        'Prix Activation', 'Total Payé', 'Nb Renouv.', 'Matricule', 'Date Activation', 'Expiration', 'Statut', 'Champs manquants'
      ];
      const headerRow = worksheet.addRow(headers);
      headerRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
        cell.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
      });
      
      const dataToExport = showExpiringOnly || showIncompleteOnly ? filteredActivations : activations;
      dataToExport.forEach(activation => {
        const imeiType = activation.imei ? 'Existant' : (activation.client_imei ? 'Client' : '-');
        const emptyFields = getEmptyFields(activation);
        const totalPaid = activation.total_price_paid || activation.price;
        const renewalCount = activation.renewal_count || 0;
        
        worksheet.addRow([
          activation.vente?.client?.nom || activation.client?.nom || '-',
          imeiType,
          activation.imei || '-',
          activation.client_imei || '-',
          activation.numero_sim || '-',
          activation.operateur || '-',
          PLAN_LABEL[activation.plan_abonnement] || '-',
          safeFormatPrice(activation.price),
          safeFormatPrice(totalPaid),
          renewalCount,
          activation.matricule || '-',
          formatDate(activation.activated_at),
          formatDate(activation.expires_at),
          activation.status === 'active' ? 'Actif' : activation.status === 'suspended' ? 'Suspendu' : activation.status === 'expired' ? 'Expiré' : 'En attente',
          emptyFields.length > 0 ? emptyFields.join(', ') : '-'
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
    } catch (error) {
      console.error('Export error:', error);
      setErrorMessage('Erreur lors de l\'export Excel');
    }
  };
  
  if (loading && (!activations || activations.length === 0)) {
    return (
      <>
        <style>{styles}</style>
        <LoadingSpinner />
      </>
    );
  }
  
  return (
    <>
      <style>{styles}</style>
      
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
      
      {renewSelectionState.isOpen && renewSelectionState.activation && (
        <div className="activation-overlay">
          <div className="activation-dialog" style={{ maxWidth: '32rem' }}>
            <div className="activation-dialog-header">
              <h2 className="activation-dialog-title">Renouvellement d'abonnement</h2>
              <button onClick={() => setRenewSelectionState(prev => ({ ...prev, isOpen: false }))} className="activation-btn-icon"><X size={20} /></button>
            </div>
            <div className="activation-dialog-body">
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm mb-1"><strong>IMEI:</strong> <span className="font-mono">{renewSelectionState.activation.imei || renewSelectionState.activation.client_imei}</span></p>
                <p className="text-sm mb-1"><strong>Client:</strong> {renewSelectionState.activation.vente?.client?.nom || renewSelectionState.activation.client?.nom || '-'}</p>
                <p className="text-sm mb-1"><strong>Plan actuel:</strong> {PLAN_LABEL[renewSelectionState.activation.plan_abonnement]}</p>
                <p className="text-sm"><strong>Expire le:</strong> {formatDate(renewSelectionState.activation.expires_at)}</p>
                <p className="text-sm mt-2"><strong>Prix d'activation original:</strong> {safeFormatPrice(renewSelectionState.activation.price)} MAD</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="activation-form-group">
                  <label className="activation-label activation-label-required">Nouvelle durée</label>
                  <select 
                    className="activation-select" 
                    value={renewSelectionState.selectedPlan} 
                    onChange={(e) => setRenewSelectionState(prev => ({ ...prev, selectedPlan: e.target.value }))}
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
                      value={renewSelectionState.price}
                      onChange={(e) => setRenewSelectionState(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm">
                <p className="font-medium text-blue-800 mb-1">Information:</p>
                <p className="text-blue-700">Le renouvellement ajoutera <strong>{PLAN_LABEL[renewSelectionState.selectedPlan]}</strong> à l'abonnement actuel.</p>
                <p className="text-blue-700">Le prix d'activation original ({safeFormatPrice(renewSelectionState.activation.price)} MAD) restera inchangé.</p>
                {renewSelectionState.price > 0 && (
                  <p className="text-blue-700 mt-1">Montant du renouvellement: <strong>{safeFormatPrice(renewSelectionState.price)} MAD</strong></p>
                )}
              </div>
            </div>
            <div className="activation-dialog-footer">
              <button onClick={() => setRenewSelectionState(prev => ({ ...prev, isOpen: false }))} className="activation-btn activation-btn-secondary" disabled={loadingAction}>Annuler</button>
              <button onClick={handleRenewWithPlan} disabled={loadingAction || !renewSelectionState.price} className="activation-btn activation-btn-primary">
                {loadingAction ? <><div className="activation-spinner" style={{ width: '1rem', height: '1rem', borderWidth: '2px' }} /> Renouvellement...</> : `Renouveler (${safeFormatPrice(renewSelectionState.price)} MAD)`}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <HistoryModal isOpen={historyState.isOpen} onClose={() => setHistoryState(prev => ({ ...prev, isOpen: false }))} activation={historyState.activation} history={historyState.history} />
      
      <div className="activation-container">
        <div className="activation-page-header">
          <div>
            <h1 className="activation-title">Activations GPS</h1>
            <p className="activation-subtitle">Gérez toutes les activations des traceurs GPS (Cliquez sur n'importe quelle cellule pour la modifier)</p>
          </div>
          <div className="activation-actions">
            <button onClick={exportToExcel} className="activation-btn activation-btn-outline">
              <FileSpreadsheet size={16} /> Exporter Excel
            </button>
            <button onClick={() => loadData()} className="activation-btn activation-btn-outline">
              <RefreshCw size={16} /> Actualiser
            </button>
            {(showExpiringOnly || showIncompleteOnly) && (
              <button onClick={clearFilters} className="activation-btn activation-btn-outline">
                <X size={16} /> Effacer les filtres
              </button>
            )}
          </div>
        </div>
        
        <div className="activation-stats-grid">
          <StatCard icon={Satellite} label="Total Activations" value={stats?.total_activations || 0} color="primary" />
<StatCard 
  icon={DollarSign} 
  label="Chiffre d'affaires" 
  value={`${safeFormatPrice(
    (activations || []).reduce(
      (sum, act) => sum + (act.total_price_paid || act.price || 0), 
      0
    )
  )} MAD`} 
  color="success" 
/>          <StatCard icon={CheckCircle2} label="Actives" value={stats?.active_activations || 0} color="success" />
          <StatCard icon={Clock} label="Expirent bientôt" value={stats?.expiring_soon || 0} color="warning" />
          <StatCard icon={AlertTriangle} label="Expirées" value={stats?.expired_activations || 0} color="danger" />
        </div>
        
        {/* Expiring Alert Banner */}
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
        
        {/* Incomplete Activations Alert Banner */}
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
                placeholder="Rechercher par IMEI, N° SIM, matricule, client, N° vente..." 
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
                  🔍 Filtre: Activations incomplètes uniquement
                </div>
              )}
              {showExpiringOnly && (
                <div style={{ padding: '0.5rem 0.75rem', background: '#fef3c7', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#92400e' }}>
                  🔍 Filtre: Expirations proches uniquement
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
                  <th>Matricule</th>
                  <th>Expiration</th>
                  <th>Statut</th>
                  <th style={{ width: '160px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(showExpiringOnly || showIncompleteOnly ? paginatedActivations : (paginatedActivations.length > 0 ? paginatedActivations : filteredActivations)).map(activation => {
                  const daysRemaining = activation.days_remaining || 
                    (activation.expires_at ? Math.ceil((new Date(activation.expires_at) - new Date()) / (1000 * 60 * 60 * 24)) : 999);
                  const isExpiringSoon = daysRemaining > 0 && daysRemaining <= 7 && activation.status === 'active';
                  const isIncomplete = isActivationIncomplete(activation);
                  const imeiType = activation.imei ? 'existing' : (activation.client_imei ? 'client' : '-');
                  const imeiTypeLabel = imeiType === 'existing' ? 'Existant' : imeiType === 'client' ? 'Client' : '-';
                  const emptyFields = getEmptyFields(activation);
                  const totalPaid = activation.total_price_paid || activation.price;
                  const renewalCount = activation.renewal_count || 0;
                  
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
                        {renderEditableCell(activation, 'price', activation.price, 'number')}
                        {renewalCount > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            (original: {safeFormatPrice(activation.price)} MAD)
                          </div>
                        )}
                      </td>
                      <td className="text-green-600 font-medium">
                        {safeFormatPrice(totalPaid)} MAD
                        {renewalCount > 0 && (
                          <span className="text-xs text-gray-500 block">
                            +{renewalCount} renouvellement(s)
                          </span>
                        )}
                      </td>
                      <td>{renderEditableCell(activation, 'matricule', activation.matricule, 'text')}</td>
                      <td className={daysRemaining <= 30 && daysRemaining > 0 ? 'text-red-600' : ''}>
                        {formatDate(activation.expires_at)}
                        {daysRemaining > 0 && daysRemaining < 999 && <span className="text-xs ml-2">({daysRemaining}j{isExpiringSoon && ' ⚠️'})</span>}
                      </td>
                      <td>{getStatusBadge(activation)}</td>
                      <td>
                        <div className="action-buttons">
                          <button onClick={() => setShowDetailModal(activation)} className="activation-icon-btn" title="Détails">
                            <Eye size={16} className="text-blue-600" />
                          </button>
                          <button onClick={() => showHistoryModal(activation)} className="activation-icon-btn" title="Historique">
                            <History size={16} className="text-purple-600" />
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
                {filteredActivations.length === 0 && (
                  <tr>
                    <td colSpan={12} className="activation-empty">
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
                <div><strong>Prix Activation Original:</strong> <span className="text-blue-600 font-medium">{safeFormatPrice(showDetailModal.price)} MAD</span></div>
                <div><strong>Total payé (avec renouvellements):</strong> <span className="text-green-600 font-bold">{safeFormatPrice(showDetailModal.total_price_paid || showDetailModal.price)} MAD</span></div>
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