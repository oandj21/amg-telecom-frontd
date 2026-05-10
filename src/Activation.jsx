import { useState, useMemo, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Plus, Satellite, RefreshCw, AlertTriangle, CheckCircle2, Clock,
  Search, Eye, Edit, Trash2, X, Calendar, Wifi, Car,
  Smartphone, Ban, Power, DollarSign, Save, RotateCcw, ChevronDown, ChevronUp,
  FileSpreadsheet, Download, History, ChevronLeft, ChevronRight,
  TrendingUp
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
  getAvailableDevices
} from './Store/store';

// ==================== CONSTANTS ====================
const PLAN_LABEL = { '1m': '1 mois', '3m': '3 mois', '6m': '6 mois', '12m': '12 mois' };
const PLAN_MONTHS = { '1m': 1, '3m': 3, '6m': 6, '12m': 12 };
const OPERATORS = ['Inwi', 'Maroc Telecom', 'Orange', 'Autre'];

const API_URL = window.REACT_APP_API_URL || "https://amg-telecom-backd-production.up.railway.app/api";

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
  
  .activation-stat-trend {
    font-size: 0.75rem;
    color: #10b981;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }
  
  .activation-filter-bar {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .activation-search-wrapper {
    position: relative;
    flex: 3;
    min-width: 300px;
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
  
  .activation-filter-select:focus {
    border-color: #3b82f6;
    outline: none;
  }
  
  .activation-filter-group {
    display: flex;
    gap: 0.5rem;
    flex-shrink: 0;
  }
  
  @media (max-width: 1024px) {
    .activation-search-wrapper {
      flex: 2;
      min-width: 250px;
    }
    .activation-filter-select {
      min-width: 110px;
    }
  }
  
  @media (max-width: 768px) {
    .activation-filter-bar {
      flex-wrap: wrap;
    }
    .activation-search-wrapper {
      flex: 1 1 100%;
      min-width: auto;
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
  }
  
  .activation-table td {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #f3f4f6;
  }
  
  .activation-table tr:hover {
    background: #f9fafb;
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
  
  .activation-icon-btn-excel {
    color: #217346;
  }
  
  .activation-icon-btn-excel:hover {
    background: #e8f5e9;
  }
  
  .activation-icon-btn-activate {
    color: #2563eb;
  }
  
  .activation-icon-btn-activate:hover {
    background: #eff6ff;
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
  
  .activation-product-row {
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    margin-bottom: 1rem;
    overflow: hidden;
  }
  
  .activation-product-title {
    padding: 0.75rem 1rem;
    background: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
    font-weight: 500;
  }
  
  .activation-item-card {
    padding: 1rem;
    border-bottom: 1px solid #f3f4f6;
  }
  
  .activation-item-card:last-child {
    border-bottom: none;
  }
  
  .activation-grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }
  
  .activation-grid-3 {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 1rem;
  }
  
  .activation-grid-4 {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr;
    gap: 1rem;
  }
  
  @media (max-width: 768px) {
    .activation-grid-2, .activation-grid-3, .activation-grid-4 {
      grid-template-columns: 1fr;
    }
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
  
  .activation-combobox {
    position: relative;
    width: 100%;
  }
  
  .activation-combobox-input {
    width: 100%;
    padding: 0.5rem 2rem 0.5rem 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-family: monospace;
    outline: none;
    background: white;
  }
  
  .activation-combobox-input:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }
  
  .activation-combobox-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    max-height: 200px;
    overflow-y: auto;
    background: white;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    margin-top: 0.25rem;
    z-index: 10;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }
  
  .activation-combobox-option {
    padding: 0.5rem 0.75rem;
    cursor: pointer;
    font-family: monospace;
    font-size: 0.875rem;
    border-bottom: 1px solid #f3f4f6;
  }
  
  .activation-combobox-option:hover {
    background: #f3f4f6;
  }
  
  .activation-combobox-option.selected {
    background: #eff6ff;
    color: #2563eb;
  }
  
  .activation-combobox-highlight {
    background: #bfdbfe;
    font-weight: 500;
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
  .mb-2 { margin-bottom: 0.5rem; }
  .mt-2 { margin-top: 0.5rem; }
  .mb-4 { margin-bottom: 1rem; }
  .ml-2 { margin-left: 0.5rem; }
  .p-2 { padding: 0.5rem; }
  .text-sm { font-size: 0.875rem; }
  .font-medium { font-weight: 500; }
  .text-right { text-align: right; }
  
  .expandable-row {
    cursor: pointer;
  }
  
  .expandable-content {
    background: #f9fafb;
  }
  
  .expandable-content td {
    padding: 0;
  }
  
  .sub-table {
    width: 100%;
    border-collapse: collapse;
  }
  
  .sub-table th {
    background: #f3f4f6;
    padding: 0.5rem 1rem;
    font-size: 0.7rem;
  }
  
  .sub-table td {
    padding: 0.5rem 1rem;
    border-bottom: 1px solid #e5e7eb;
  }
  
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
  
  .action-buttons {
    display: flex;
    gap: 0.25rem;
    flex-wrap: wrap;
  }
  
  .product-status-item {
    font-size: 0.75rem;
    line-height: 1.4;
    padding: 0.125rem 0;
  }
  .product-status-active { color: #16a34a; }
  .product-status-suspended { color: #ca8a04; }
  .product-status-expired { color: #dc2626; }
  .product-status-pending { color: #6b7280; }
  
  .alert-banner {
    background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
    border: 1px solid #fed7aa;
    border-radius: 0.5rem;
    padding: 0.75rem 1rem;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
    animation: slideDown 0.3s ease-out;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .alert-banner:hover {
    background: linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }
  
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .alert-banner-icon {
    color: #ea580c;
    flex-shrink: 0;
  }
  
  .alert-banner-content {
    flex: 1;
    font-size: 0.875rem;
    color: #9a3412;
  }
  
  .alert-banner-content strong {
    font-weight: 600;
    color: #c2410c;
  }
  
  .alert-banner-close {
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0.25rem;
    color: #9a3412;
    border-radius: 0.375rem;
    transition: background 0.2s;
  }
  
  .alert-banner-close:hover {
    background: rgba(154, 52, 18, 0.1);
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
  
  .expiring-row {
    background-color: #fffbeb;
    transition: background 0.2s;
  }
  
  .expiring-row:hover {
    background-color: #fef3c7;
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
  
  .total-price-summary {
    background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
    border: 1px solid #bbf7d0;
    border-radius: 0.5rem;
    padding: 0.75rem 1rem;
    margin-top: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .total-price-label {
    font-weight: 600;
    color: #166534;
  }
  
  .total-price-value {
    font-size: 1.25rem;
    font-weight: 800;
    color: #166534;
  }
  
  .renewals-list {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  
  .renewals-list li {
    font-size: 0.7rem;
    padding: 0.125rem 0;
    border-bottom: 1px dashed #e5e7eb;
  }
  
  .renewals-list li:last-child {
    border-bottom: none;
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
          <h2 className="activation-dialog-title">Historique - IMEI: {activation.imei}</h2>
          <button onClick={onClose} className="activation-btn-icon"><X size={20} /></button>
        </div>
        <div className="activation-dialog-body">
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><strong>N° SIM:</strong> {activation.numero_sim || '-'}</div>
              <div><strong>Opérateur:</strong> {activation.operateur || '-'}</div>
              <div><strong>Plan:</strong> {PLAN_LABEL[activation.plan_abonnement] || '-'}</div>
              <div><strong>Prix activation:</strong> {activation.price || 0} MAD</div>
              <div><strong>Prix produit:</strong> {activation.product_price ? `${activation.product_price} MAD` : '-'}</div>
              <div><strong>Client:</strong> {activation.vente?.client?.nom || '-'}</div>
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

// ==================== IMEI COMBOBOX ====================
const ImeiCombobox = ({ value, onChange, options, placeholder, disabled = false, usedImeis = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value || '');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  const filteredOptions = useMemo(() => {
    if (!options || options.length === 0) return [];
    let filtered = [...options];
    if (usedImeis && usedImeis.length > 0) {
      filtered = filtered.filter(opt => !usedImeis.includes(opt.imei));
    }
    if (searchTerm) {
      filtered = filtered.filter(opt => opt.imei.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    return filtered;
  }, [options, searchTerm, usedImeis]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    onChange(newValue);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const handleSelectOption = (imei) => {
    setSearchTerm(imei);
    onChange(imei);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!isOpen && filteredOptions.length > 0 && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setIsOpen(true);
      e.preventDefault();
      return;
    }
    if (isOpen) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex(prev => prev < filteredOptions.length - 1 ? prev + 1 : prev);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
          break;
        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
            handleSelectOption(filteredOptions[highlightedIndex].imei);
          } else if (filteredOptions.length === 1) {
            handleSelectOption(filteredOptions[0].imei);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setHighlightedIndex(-1);
          break;
        default: break;
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const highlightMatch = (text, search) => {
    if (!search) return text;
    const index = text.toLowerCase().indexOf(search.toLowerCase());
    if (index === -1) return text;
    return (
      <>
        {text.substring(0, index)}
        <span className="activation-combobox-highlight">
          {text.substring(index, index + search.length)}
        </span>
        {text.substring(index + search.length)}
      </>
    );
  };

  return (
    <div className="activation-combobox" ref={containerRef}>
      <input
        ref={inputRef}
        type="text"
        className="activation-combobox-input"
        placeholder={placeholder || "Sélectionner ou saisir un IMEI..."}
        value={searchTerm}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        autoComplete="off"
      />
      {isOpen && filteredOptions.length > 0 && (
        <div className="activation-combobox-dropdown">
          {filteredOptions.map((option, index) => (
            <div
              key={option.id || option.imei}
              className={`activation-combobox-option ${index === highlightedIndex ? 'selected' : ''}`}
              onClick={() => handleSelectOption(option.imei)}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              {highlightMatch(option.imei, searchTerm)}
              {option.model && (
                <span style={{ fontSize: '0.7rem', color: '#6b7280', marginLeft: '0.5rem' }}>
                  ({option.model})
                </span>
              )}
            </div>
          ))}
        </div>
      )}
      {isOpen && filteredOptions.length === 0 && options.length > 0 && (
        <div className="activation-combobox-dropdown">
          <div className="activation-combobox-option" style={{ color: '#9ca3af' }}>
            {searchTerm ? "Aucun IMEI correspondant" : "Tous les IMEI sont déjà utilisés"}
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to get renewal history from renewal_history field
const getRenewalHistoryFromField = (activation) => {
  if (activation.renewal_history && Array.isArray(activation.renewal_history)) {
    return activation.renewal_history.filter(item => item.action === 'renewal' || item.action === 'activation');
  }
  if (activation.histories && Array.isArray(activation.histories)) {
    return activation.histories.filter(item => item.action === 'renewal' || item.action === 'activation');
  }
  return [];
};

// Helper function to get individual renewal entries
const getRenewalEntries = (activation) => {
  const renewalHistory = getRenewalHistoryFromField(activation);
  return renewalHistory.filter(entry => entry.action === 'renewal');
};

// Helper function to get total paid (activation price + all renewals)
const getTotalPaid = (activation) => {
  let total = parseFloat(activation.price) || 0;
  const renewalHistory = getRenewalHistoryFromField(activation);
  renewalHistory.forEach(entry => {
    if (entry.action === 'renewal') {
      total += parseFloat(entry.price) || 0;
    }
  });
  return total;
};

// Helper function to get product price (from product table via relation)
const getProductPrice = (activation) => {
  if (activation.product && activation.product.prix) {
    return parseFloat(activation.product.prix);
  }
  if (activation.product && activation.product.prix_vente) {
    return parseFloat(activation.product.prix_vente);
  }
  if (activation.produit && activation.produit.prix) {
    return parseFloat(activation.produit.prix);
  }
  return parseFloat(activation.price) || 0;
};

// Helper function to calculate product price with 20% markup
const getProductPriceWithMarkup = (activation) => {
  const productPrice = getProductPrice(activation);
  return productPrice * 1.2;
};

// Helper function to get all action history entries (activation + renewals + status changes)
const getAllActionHistory = (activation) => {
  const actions = [];
  
  // Add initial activation
  if (activation.activated_at) {
    actions.push({
      id: `activation_${activation.id}`,
      date: activation.activated_at,
      action_type: 'Activation',
      plan: activation.plan_abonnement,
      amount: parseFloat(activation.price) || 0,
      old_plan: null,
      new_plan: activation.plan_abonnement,
      user_name: activation.created_by_user_name || 'System',
      details: `Activation initiale avec plan ${PLAN_LABEL[activation.plan_abonnement] || activation.plan_abonnement}`
    });
  }
  
  // Add renewals from renewal_history
  if (activation.renewal_history && Array.isArray(activation.renewal_history)) {
    activation.renewal_history.forEach((entry, idx) => {
      if (entry.action === 'renewal') {
        actions.push({
          id: `renewal_${activation.id}_${idx}`,
          date: entry.date,
          action_type: 'Renouvellement',
          plan: entry.new_plan,
          amount: entry.price || 0,
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
          plan: activation.plan_abonnement,
          amount: 0,
          old_plan: null,
          new_plan: null,
          user_name: entry.user_name || 'System',
          details: `Service suspendu${entry.reason ? `: ${entry.reason}` : ''}`
        });
      } else if (entry.action === 'reactivation') {
        actions.push({
          id: `reactivation_${activation.id}_${idx}`,
          date: entry.date,
          action_type: 'Réactivation',
          plan: activation.plan_abonnement,
          amount: 0,
          old_plan: null,
          new_plan: null,
          user_name: entry.user_name || 'System',
          details: 'Service réactivé'
        });
      }
    });
  }
  
  // Sort by date
  actions.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  return actions;
};

// SIMPLIFIED EXPORT FUNCTION - each action in its own row


const addTextHeader = (worksheet, companyName, companyAddress, companyPhone, companyEmail, companyIce, companyRc, companyPatente) => {
  worksheet.mergeCells(`A1:N1`);
  worksheet.getCell('A1').value = companyName;
  worksheet.getCell('A1').font = { bold: true, size: 16 };
  worksheet.getCell('A1').alignment = { horizontal: 'center' };
  worksheet.mergeCells(`A2:N2`);
  worksheet.getCell('A2').value = companyAddress;
  worksheet.getCell('A2').font = { size: 10 };
  worksheet.getCell('A2').alignment = { horizontal: 'center' };
  worksheet.mergeCells(`A3:N3`);
  worksheet.getCell('A3').value = `TEL: ${companyPhone} | EMAIL: ${companyEmail}`;
  worksheet.getCell('A3').font = { size: 10 };
  worksheet.getCell('A3').alignment = { horizontal: 'center' };
  worksheet.mergeCells(`A4:N4`);
  worksheet.getCell('A4').value = `ICE: ${companyIce} | RC: ${companyRc} | Patente: ${companyPatente}`;
  worksheet.getCell('A4').font = { size: 9 };
  worksheet.getCell('A4').alignment = { horizontal: 'center' };
};

const getGlobalActionLabel = (action) => {
  const labels = {
    'activation': '✅ Activation', 'renewal': '🔄 Renouvellement',
    'suspension': '⛔ Suspension', 'reactivation': '▶️ Réactivation', 'deletion': '🗑️ Suppression'
  };
  return labels[action] || action;
};

const getStatusText = (activation) => {
  if (activation.status === 'suspended') return 'Suspendu';
  if (activation.status === 'expired') return 'Expiré';
  if (activation.status === 'pending') return 'En attente';
  if (activation.expires_at && new Date(activation.expires_at) < new Date()) return 'Expiré';
  return 'Actif';
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



// ==================== MAIN COMPONENT ====================
const Activation = () => {
  const dispatch = useDispatch();
  
  const sales = useSelector(selectSalesForActivation);
  const selectedSaleData = useSelector(selectSelectedSaleActivation);
  const activations = useSelector(selectActivations);
  const stats = useSelector(selectActivationStats);
  const loading = useSelector(selectActivationsLoading);
  const pagination = useSelector(selectActivationsPagination);
  const availableDevicesByProduct = useSelector(state => state.gpsDevices?.availableByProduct || {});
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [operatorFilter, setOperatorFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedSales, setExpandedSales] = useState({});
  const [selectedSale, setSelectedSale] = useState(null);
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(null);
  const [editActivation, setEditActivation] = useState(null);
  const [loadingAction, setLoadingAction] = useState(false);
  const [activationsData, setActivationsData] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [showExpiringOnly, setShowExpiringOnly] = useState(false);
  
  // Sales Pagination
  const [salesPage, setSalesPage] = useState(1);
  const salesPerPage = 12;
  
  // Items per page
  const itemsPerPage = 12;
  
  // Confirmation dialog state
  const [confirmationState, setConfirmationState] = useState({
    isOpen: false, title: '', message: '', details: null, type: 'danger', confirmText: 'Confirmer', onConfirm: null
  });
  
  // Renew selection modal state with price
  const [renewSelectionState, setRenewSelectionState] = useState({
    isOpen: false, activation: null, selectedPlan: '12m', price: 0
  });
  
  // History modal state
  const [historyState, setHistoryState] = useState({
    isOpen: false, activation: null, history: []
  });
  
  const [actionHistory, setActionHistory] = useState({});
  
  useEffect(() => {
    loadData();
  }, [dispatch, currentPage]);
  
  const loadData = () => {
    dispatch(fetchSalesForActivation());
    dispatch(fetchActivations({ page: currentPage, per_page: itemsPerPage }));
    dispatch(fetchActivationStats());
    dispatch(fetchGpsDevices({ status: 'available' }));
  };
  
  useEffect(() => {
    if (selectedSale) {
      dispatch(fetchSaleActivationDetails(selectedSale.id));
    }
  }, [dispatch, selectedSale]);
  
  useEffect(() => {
    if (selectedSaleData?.activation_details) {
      const forms = [];
      for (const detail of selectedSaleData.activation_details) {
        for (let i = 0; i < detail.remaining; i++) {
          forms.push({
            id: `${detail.produit_id}_${i}_${Date.now()}_${Math.random()}`,
            produit_id: detail.produit_id,
            produit_nom: detail.produit_nom,
            produit_prix: detail.produit_prix || detail.default_price || 0,
            imei: '',
            numero_sim: '',
            operateur: 'Inwi',
            plan_abonnement: '12m',
            matricule: '',
            price: detail.default_price || 0,
          });
        }
      }
      setActivationsData(forms);
    }
  }, [selectedSaleData]);
  
  // Build action history from renewal_history field
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
  
  const getSaleActivations = (saleId) => {
    if (!activations || !Array.isArray(activations)) return [];
    return activations.filter(act => act.vente_id === saleId || act.sale_id === saleId || act.vente?.id === saleId);
  };
  const renderProductStatus = (sale) => {
  const saleActivations = getSaleActivations(sale.id);
  const remainingProducts = sale.remaining_activations || [];
  
  if (!remainingProducts.length && saleActivations.length === 0) {
    return <span className="text-sm text-gray-400">Aucun produit GPS</span>;
  }
  
  const productStatusMap = {};
  saleActivations.forEach(act => {
    if (!productStatusMap[act.produit_id]) {
      productStatusMap[act.produit_id] = { name: act.produit_nom || 'GPS', active: 0, suspended: 0, expired: 0, total: 0, totalPaid: 0 };
    }
    if (act.status === 'active') productStatusMap[act.produit_id].active++;
    else if (act.status === 'suspended') productStatusMap[act.produit_id].suspended++;
    else if (act.status === 'expired') productStatusMap[act.produit_id].expired++;
    productStatusMap[act.produit_id].total++;
    productStatusMap[act.produit_id].totalPaid += getTotalPaid(act);
  });
  
  remainingProducts.forEach(prod => {
    if (!productStatusMap[prod.produit_id]) {
      productStatusMap[prod.produit_id] = { name: prod.produit_nom, active: 0, suspended: 0, expired: 0, total: 0, totalPaid: 0, remaining: prod.remaining || prod.quantity };
    } else {
      productStatusMap[prod.produit_id].remaining = (prod.remaining || 0);
    }
  });
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {Object.values(productStatusMap).map((prod, idx) => {
        const activatedCount = prod.active + prod.suspended + prod.expired;
        const totalCount = prod.total + (prod.remaining || 0);
        const remaining = (prod.remaining !== undefined) ? prod.remaining : (totalCount - activatedCount);
        return (
          <div key={idx} className="product-status-item">
            <span className="font-medium">{prod.name}:</span>{' '}
            {activatedCount > 0 && (
              <>
                <span className="product-status-active">✓ {prod.active} actif(s)</span>
                {prod.suspended > 0 && <span className="product-status-suspended"> ⚠️ {prod.suspended} suspendu(s)</span>}
                {prod.expired > 0 && <span className="product-status-expired"> ✗ {prod.expired} expiré(s)</span>}
                {prod.totalPaid > 0 && <span className="text-green-600"> ({prod.totalPaid} MAD)</span>}
              </>
            )}
            {remaining > 0 && <span className="product-status-pending"> ⌛ {remaining} à activer</span>}
            {activatedCount === 0 && remaining === 0 && <span className="text-gray-400">Aucun</span>}
          </div>
        );
      })}
    </div>
  );
};
const exportSaleDetailsToExcel = async (sale) => {
  const saleActivations = getSaleActivations(sale.id);
  if (!saleActivations || saleActivations.length === 0) {
    alert('Aucune activation pour cette vente');
    return;
  }
  
  try {
    const token = localStorage.getItem('token');
    const saleDetailsResponse = await fetch(`${API_URL}/ventes/${sale.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const saleDetails = await saleDetailsResponse.json();
    const completeSale = saleDetails.vente || saleDetails;
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`Vente_${sale.id}`);
    
    // ==================== AJOUT DU LOGO ====================
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
      console.warn('Logo non trouvé, poursuite sans logo', err);
    }
    
    // Décaler les lignes si le logo est présent
    let rowOffset = 0;
    if (logoAdded) {
      worksheet.addRow([]);
      rowOffset = 2;
    }
    
    const companyInfo = JSON.parse(localStorage.getItem('company_info') || '{}');
    const companyName = companyInfo.name || 'AMG TELECOM Sarl';
    const companyAddress = companyInfo.address || '82 Angle Abdelmounem et Rue Soumaya ETG 2 N°4, CASABLANCA';
    const companyPhone = companyInfo.phone || '+212 661 685 758';
    const companyEmail = companyInfo.email || 'contact@amgtelecom.ma';
    const companyIce = companyInfo.ice || '003272997000058';
    const companyRc = companyInfo.rc || '577849';
    const companyPatente = companyInfo.patente || '34779711';
    
    // ========== COMPANY INFO BLOCK – CENTERED BETWEEN COLUMNS D & F ==========
    const headerRowStart = 1 + rowOffset;
    
    // Company name – merged D:F, centered
    worksheet.mergeCells(`D${headerRowStart}:F${headerRowStart}`);
    worksheet.getCell(`D${headerRowStart}`).value = companyName;
    worksheet.getCell(`D${headerRowStart}`).font = { bold: true, size: 16 };
    worksheet.getCell(`D${headerRowStart}`).alignment = { horizontal: 'center', vertical: 'middle' };
    
    // Company address
    worksheet.mergeCells(`D${headerRowStart + 1}:F${headerRowStart + 1}`);
    worksheet.getCell(`D${headerRowStart + 1}`).value = companyAddress;
    worksheet.getCell(`D${headerRowStart + 1}`).font = { size: 10 };
    worksheet.getCell(`D${headerRowStart + 1}`).alignment = { horizontal: 'center', vertical: 'middle' };
    
    // Phone & email
    worksheet.mergeCells(`D${headerRowStart + 2}:F${headerRowStart + 2}`);
    worksheet.getCell(`D${headerRowStart + 2}`).value = `TEL: ${companyPhone} | EMAIL: ${companyEmail}`;
    worksheet.getCell(`D${headerRowStart + 2}`).font = { size: 10 };
    worksheet.getCell(`D${headerRowStart + 2}`).alignment = { horizontal: 'center', vertical: 'middle' };
    
    // ICE / RC / Patente
    worksheet.mergeCells(`D${headerRowStart + 3}:F${headerRowStart + 3}`);
    worksheet.getCell(`D${headerRowStart + 3}`).value = `ICE: ${companyIce} | RC: ${companyRc} | Patente: ${companyPatente}`;
    worksheet.getCell(`D${headerRowStart + 3}`).font = { size: 9 };
    worksheet.getCell(`D${headerRowStart + 3}`).alignment = { horizontal: 'center', vertical: 'middle' };
    
    // Ligne vide après l'en-tête
    worksheet.addRow([]);
    
    // ========== INFORMATIONS VENTE ==========
    const saleInfoRowStart = headerRowStart + 6;
    worksheet.addRow(['INFORMATIONS VENTE']);
    worksheet.mergeCells(`A${saleInfoRowStart}:N${saleInfoRowStart}`);
    worksheet.getCell(`A${saleInfoRowStart}`).font = { bold: true, size: 12 };
    worksheet.getCell(`A${saleInfoRowStart}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
    worksheet.getCell(`A${saleInfoRowStart}`).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    
    worksheet.addRow(['N° Vente', sale.id]);
    worksheet.addRow(['Client', sale.client?.nom || '-']);
    worksheet.addRow(['ICE Client', sale.client?.ice_client || '-']);
    worksheet.addRow(['Téléphone', sale.client?.telephone || sale.client?.phone || '-']);
    worksheet.addRow(['Email', sale.client?.email || '-']);
    worksheet.addRow(['Adresse', sale.client?.adresse || '-']);
    worksheet.addRow(['Date Vente', formatDate(sale.created_at)]);
    worksheet.addRow([]);
    
    // ========== PRODUITS VENDUS ==========
    const productStartRow = saleInfoRowStart + 9;
    worksheet.addRow(['PRODUITS VENDUS']);
    worksheet.mergeCells(`A${productStartRow}:N${productStartRow}`);
    worksheet.getCell(`A${productStartRow}`).font = { bold: true, size: 12 };
    worksheet.getCell(`A${productStartRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
    worksheet.getCell(`A${productStartRow}`).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    
    const productHeaders = [
      'Produit', 'Quantité', 'Prix Unitaire (MAD)',
      'TVA 20% (MAD)', 'Total TTC (MAD)'
    ];
    const productHeaderRow = worksheet.addRow(productHeaders);
    productHeaderRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
      cell.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
    
    let totalProductsHT = 0;
    let totalProductsTTC = 0;
    const productsList = completeSale.produits || [];
    
    for (const prod of productsList) {
      const qty = prod.pivot?.quantite || 1;
      const unitPrice = parseFloat(prod.pivot?.prix || prod.prix_vente || prod.prix || 0);
      const totalHT = qty * unitPrice;
      const tva = totalHT * 0.2;
      const totalTTC = totalHT + tva;
      
      totalProductsHT += totalHT;
      totalProductsTTC += totalTTC;
      
      const row = worksheet.addRow([
        prod.nom,
        qty,
        unitPrice.toFixed(2),
        tva.toFixed(2),
        totalTTC.toFixed(2)
      ]);
      row.eachCell((cell, colNumber) => {
        if (colNumber >= 3) cell.alignment = { horizontal: 'right' };
      });
    }
    
    worksheet.addRow([]);
    const productsTotalRow = worksheet.addRow([
      '', '', '', '',
      `Total TTC: ${totalProductsTTC.toFixed(2)} MAD`
    ]);
    productsTotalRow.eachCell((cell, colNumber) => {
      if (colNumber === 5) {
        cell.font = { bold: true, color: { argb: 'FF2563EB' } };
        cell.alignment = { horizontal: 'right' };
      }
    });
    worksheet.addRow([]);
    
    // ========== HISTORIQUE DES ACTIONS ==========
    const actionStartRow = productStartRow + 6 + productsList.length;
    worksheet.addRow(['HISTORIQUE DES ACTIONS']);
    worksheet.mergeCells(`A${actionStartRow}:N${actionStartRow}`);
    worksheet.getCell(`A${actionStartRow}`).font = { bold: true, size: 12 };
    worksheet.getCell(`A${actionStartRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF059669' } };
    worksheet.getCell(`A${actionStartRow}`).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    
    const actionHeaders = [
      'Matricule', 'Action', 'Date', "Date d'expiration", 'Plan', 'Montant (MAD)', 'Statut Actuel'
    ];
    const actionHeaderRow = worksheet.addRow(actionHeaders);
    actionHeaderRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
      cell.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
    
    let grandTotalActivations = 0;
    
    saleActivations.forEach(activation => {
      const actions = getAllActionHistory(activation);
      const currentStatus = getStatusText(activation);
      const expirationDateFormatted = formatDate(activation.expires_at);
      
      actions.forEach(action => {
        const amount = action.amount > 0 ? action.amount : 0;
        if (action.action_type === 'Activation' || action.action_type === 'Renouvellement') {
          grandTotalActivations += amount;
        }
        const rowData = [
          activation.matricule || '-',
          action.action_type,
          formatDateTime(action.date),
          expirationDateFormatted,
          action.plan ? (PLAN_LABEL[action.plan] || action.plan) : (action.new_plan ? (PLAN_LABEL[action.new_plan] || action.new_plan) : '-'),
          amount > 0 ? amount.toFixed(2) : '-',
          currentStatus
        ];
        worksheet.addRow(rowData);
      });
    });
    
    worksheet.addRow([]);
    const activationTotalRow = worksheet.addRow(['', '', '', '', '', 'Total Activations :', `${grandTotalActivations.toFixed(2)} MAD`]);
    activationTotalRow.eachCell((cell, colNumber) => {
      if (colNumber === 6) {
        cell.font = { bold: true };
        cell.alignment = { horizontal: 'right' };
      }
      if (colNumber === 7) {
        cell.font = { bold: true, color: { argb: 'FF16A34A' } };
        cell.alignment = { horizontal: 'left' };
      }
    });
    
    // ========== GRAND TOTAL ==========
    worksheet.addRow([]);
    const grandTotalRow = worksheet.addRow([
      '', '', '', '', '', 
      'GRAND TOTAL :', 
      `${(totalProductsTTC + grandTotalActivations).toFixed(2)} MAD`
    ]);
    grandTotalRow.eachCell((cell, colNumber) => {
      if (colNumber === 6) {
        cell.font = { bold: true, size: 11 };
        cell.alignment = { horizontal: 'right' };
      }
      if (colNumber === 7) {
        cell.font = { bold: true, size: 11, color: { argb: 'FFDC2626' } };
        cell.alignment = { horizontal: 'left' };
      }
    });
    
    // Auto-size columns
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
    const fileName = `Vente_${sale.id}_${sale.client?.nom || 'client'}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    saveAs(new Blob([buffer]), fileName);
  } catch (error) {
    console.error('Excel export error:', error);
    alert('Erreur lors de l\'export Excel');
  }
};

  const filteredSales = useMemo(() => {
    if (!sales || !Array.isArray(sales)) return [];
    return sales.filter(sale => {
      const matchesSearch = search === '' || 
        sale.client?.nom?.toLowerCase().includes(search.toLowerCase()) ||
        sale.id?.toString().includes(search);
      return matchesSearch;
    });
  }, [sales, search]);
  
  const paginatedSales = useMemo(() => {
    const start = (salesPage - 1) * salesPerPage;
    return filteredSales.slice(start, start + salesPerPage);
  }, [filteredSales, salesPage]);
  
  const salesTotalPages = Math.ceil(filteredSales.length / salesPerPage);
  
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
  
  const filteredActivations = useMemo(() => {
    if (!activations || !Array.isArray(activations)) return [];
    let filtered = activations;
    
    if (showExpiringOnly) {
      const expiringIds = new Set(expiringActivations.map(a => a.id));
      filtered = filtered.filter(act => expiringIds.has(act.id));
    }
    
    if (search) {
      filtered = filtered.filter(act => 
        act.imei?.toLowerCase().includes(search.toLowerCase()) ||
        act.numero_sim?.toLowerCase().includes(search.toLowerCase()) ||
        act.matricule?.toLowerCase().includes(search.toLowerCase()) ||
        act.vente?.client?.nom?.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(act => act.status === statusFilter);
    }
    
    if (operatorFilter !== 'all') {
      filtered = filtered.filter(act => act.operateur === operatorFilter);
    }
    
    return filtered;
  }, [activations, search, statusFilter, operatorFilter, showExpiringOnly, expiringActivations]);
  
  const getImeiOptions = (productId) => {
    if (selectedSaleData?.activation_details) {
      const detail = selectedSaleData.activation_details.find(d => d.produit_id === productId);
      if (detail?.available_devices) return detail.available_devices;
    }
    return availableDevicesByProduct[productId] || [];
  };
  
  const getUsedImeisForProduct = (productId, currentId) => {
    return activationsData
      .filter(a => a.produit_id === productId && a.id !== currentId)
      .map(a => a.imei)
      .filter(Boolean);
  };
  
  const getTotalActivationPrice = () => {
    const total = activationsData
      .filter(a => a.imei)
      .reduce((total, a) => {
        const price = parseFloat(a.price) || 0;
        return total + price;
      }, 0);
    return total;
  };
  
  const toggleExpand = (saleId, e) => {
    if (e) e.stopPropagation();
    setExpandedSales(prev => ({ ...prev, [saleId]: !prev[saleId] }));
  };
  
  const openActivationModal = async (sale) => {
    setSelectedSale(sale);
    setShowActivationModal(true);
    setErrorMessage(null);
    setSuccessMessage(null);
  };
  
  const validateActivationForm = () => {
    const filled = activationsData.filter(a => a.imei);
    if (filled.length === 0) {
      setErrorMessage("Veuillez sélectionner au moins un IMEI");
      return false;
    }
    for (const act of filled) {
      if (!act.numero_sim) {
        setErrorMessage(`Veuillez saisir le numéro SIM pour l'IMEI ${act.imei}`);
        return false;
      }
      if (!act.price || act.price <= 0) {
        setErrorMessage(`Veuillez saisir un prix d'activation valide pour l'IMEI ${act.imei}`);
        return false;
      }
    }
    return true;
  };
  
  const handleActivate = async () => {
    if (!validateActivationForm()) return;
    
    setLoadingAction(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    
    try {
      const activationsToSend = activationsData.filter(a => a.imei).map(act => ({
        produit_id: act.produit_id,
        imei: act.imei,
        numero_sim: act.numero_sim,
        operateur: act.operateur,
        plan_abonnement: act.plan_abonnement,
        matricule: act.matricule,
        price: parseFloat(act.price) || 0,
      }));
      
      await dispatch(activateDevices({
        saleId: selectedSale.id,
        activations: activationsToSend
      })).unwrap();
      
      const totalPrice = getTotalActivationPrice();
      setSuccessMessage(`Activation réussie - Total des activations: ${totalPrice.toFixed(2)} MAD`);
      setTimeout(() => {
        setShowActivationModal(false);
        setSelectedSale(null);
        setActivationsData([]);
        setSuccessMessage(null);
        loadData();
      }, 1500);
    } catch (err) {
      setErrorMessage(err || 'Erreur lors de l\'activation');
    } finally {
      setLoadingAction(false);
    }
  };
  
  const updateActivationField = (id, field, value) => {
    const newData = [...activationsData];
    const index = newData.findIndex(a => a.id === id);
    if (index !== -1) {
      if (field === 'price') {
        newData[index][field] = parseFloat(value) || 0;
      } else {
        newData[index][field] = value;
      }
    }
    setActivationsData(newData);
  };
  
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
      await dispatch(updateActivation({ 
        id: activation.id, 
        plan_abonnement: selectedPlan, 
        renew: true,
        price: price
      })).unwrap();
      setSuccessMessage(`Abonnement renouvelé avec +${PLAN_LABEL[selectedPlan]} pour ${price} MAD (IMEI ${activation.imei})`);
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
    const productPrice = getProductPrice(activation);
    const productPriceWithMarkup = productPrice * 1.2;
    
    setConfirmationState({
      isOpen: true,
      title: 'Confirmer la suppression',
      message: `Êtes-vous sûr de vouloir supprimer l'activation pour l'IMEI ${activation.imei} ?`,
      details: (
        <div>
          <p><strong>IMEI:</strong> {activation.imei}</p>
          <p><strong>N° SIM:</strong> {activation.numero_sim || '-'}</p>
          <p><strong>Client:</strong> {activation.vente?.client?.nom || '-'}</p>
          <p><strong>Prix produit:</strong> {productPrice.toFixed(2)} MAD</p>
          <p><strong>Prix produit +20%:</strong> {productPriceWithMarkup.toFixed(2)} MAD</p>
          <p><strong>Prix activation total (avec renouvellements):</strong> {getTotalPaid(activation)} MAD</p>
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
        ? `Êtes-vous sûr de vouloir suspendre l'activation pour l'IMEI ${activation.imei} ?`
        : `Êtes-vous sûr de vouloir réactiver l'activation pour l'IMEI ${activation.imei} ?`,
      details: (
        <div>
          <p><strong>IMEI:</strong> {activation.imei}</p>
          <p><strong>Client:</strong> {activation.vente?.client?.nom || '-'}</p>
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
  
  const getLogoAsBase64 = async () => {
    try {
      const logoPaths = ['/logo.png', '/logo.jpg', '/logo.jpeg', '/assets/logo.png', '/images/logo.png'];
      for (const logoPath of logoPaths) {
        try {
          const response = await fetch(logoPath);
          if (response.ok) {
            const blob = await response.blob();
            const base64Logo = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.readAsDataURL(blob);
            });
            return base64Logo;
          }
        } catch (e) {}
      }
      const savedLogo = localStorage.getItem('company_logo');
      if (savedLogo) return savedLogo;
    } catch (error) {}
    return null;
  };
  
  const handlePageChange = (page) => {
    if (!showExpiringOnly) {
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
  
  const getSalesTotalPages = Math.ceil(filteredSales.length / salesPerPage);
  const getActivationsTotalPages = showExpiringOnly ? Math.ceil(filteredActivations.length / itemsPerPage) : (pagination?.last_page || 1);
  
  const handleAlertClick = () => {
    setShowExpiringOnly(true);
    setCurrentPage(1);
    setAlertDismissed(true);
  };
  
  const clearExpiringFilter = () => {
    setShowExpiringOnly(false);
    setCurrentPage(1);
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
                <p className="text-sm mb-1"><strong>IMEI:</strong> <span className="font-mono">{renewSelectionState.activation.imei}</span></p>
                <p className="text-sm mb-1"><strong>Client:</strong> {renewSelectionState.activation.vente?.client?.nom || '-'}</p>
                <p className="text-sm mb-1"><strong>Plan actuel:</strong> {PLAN_LABEL[renewSelectionState.activation.plan_abonnement]}</p>
                <p className="text-sm"><strong>Expire le:</strong> {formatDate(renewSelectionState.activation.expires_at)}</p>
              </div>
              <div className="activation-grid-2">
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
                {renewSelectionState.price > 0 && (
                  <p className="text-blue-700 mt-1">Montant à payer: <strong>{renewSelectionState.price} MAD</strong></p>
                )}
              </div>
            </div>
            <div className="activation-dialog-footer">
              <button onClick={() => setRenewSelectionState(prev => ({ ...prev, isOpen: false }))} className="activation-btn activation-btn-secondary" disabled={loadingAction}>Annuler</button>
              <button onClick={handleRenewWithPlan} disabled={loadingAction || !renewSelectionState.price} className="activation-btn activation-btn-primary">
                {loadingAction ? <><div className="activation-spinner" style={{ width: '1rem', height: '1rem', borderWidth: '2px' }} /> Renouvellement...</> : `Renouveler (${renewSelectionState.price} MAD)`}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <HistoryModal isOpen={historyState.isOpen} onClose={() => setHistoryState(prev => ({ ...prev, isOpen: false }))} activation={historyState.activation} history={historyState.history} />
      
      <div className="activation-container">
        <div className="activation-page-header">
          <div>
            <h1 className="activation-title">Activation GPS</h1>
            <p className="activation-subtitle">Gérez les activations des traceurs GPS pour vos clients</p>
          </div>
          <div className="activation-actions">
            <ExportMenu 
              title="Activations GPS" 
              rows={filteredActivations} 
              columns={[
                { header: 'IMEI', accessor: a => a.imei },
                { header: 'N° SIM', accessor: a => a.numero_sim },
                { header: 'Opérateur', accessor: a => a.operateur },
                { header: 'Client', accessor: a => a.vente?.client?.nom },
                { header: 'Plan', accessor: a => PLAN_LABEL[a.plan_abonnement] },
                { header: 'Prix Produit', accessor: a => `${getProductPrice(a).toFixed(2)} MAD` },
                { header: 'Prix Produit +20%', accessor: a => `${getProductPriceWithMarkup(a).toFixed(2)} MAD` },
                { header: 'Prix Activation', accessor: a => `${(a.price || 0)} MAD` },
                { header: 'Matricule', accessor: a => a.matricule },
                { header: 'Expiration', accessor: a => formatDate(a.expires_at) },
                { header: 'Statut', accessor: a => a.status },
                { header: 'Total Payé', accessor: a => `${getTotalPaid(a)} MAD` },
              ]} 
            />
            {showExpiringOnly && (
              <button onClick={clearExpiringFilter} className="activation-btn activation-btn-outline"><X size={16} /> Effacer le filtre</button>
            )}
          </div>
        </div>
        
        <div className="activation-stats-grid">
          <StatCard icon={Satellite} label="Total Activations" value={stats?.total_activations || 0} color="primary" />
          <StatCard icon={DollarSign} label="Chiffre d'affaires" value={`${parseFloat(stats?.total_revenue ?? 0).toFixed(2)} MAD`} color="success" />
          <StatCard icon={CheckCircle2} label="Actives" value={stats?.active_activations || 0} color="success" />
          <StatCard icon={Clock} label="Expirent bientôt" value={stats?.expiring_soon || 0} color="warning" />
          <StatCard icon={AlertTriangle} label="Expirées" value={stats?.expired_activations || 0} color="danger" />
        </div>
        
        {expiringCount > 0 && !alertDismissed && (
          <div className="alert-banner" onClick={handleAlertClick}>
            <AlertTriangle size={20} className="alert-banner-icon" />
            <div className="alert-banner-content">
              <strong>{expiringCount} activation{expiringCount > 1 ? 's' : ''}</strong> {expiringCount > 1 ? 'expirent' : 'expire'} dans 7 jours ou moins.
              <span style={{ fontWeight: 500, marginLeft: '0.5rem' }}><Search /> Cliquez ici pour les voir</span>
            </div>
            <button onClick={(e) => { e.stopPropagation(); setAlertDismissed(true); }} className="alert-banner-close"><X size={16} /></button>
          </div>
        )}
        
        {errorMessage && <div className="error-message"><AlertTriangle size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />{errorMessage}</div>}
        {successMessage && <div className="success-message"><CheckCircle2 size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />{successMessage}</div>}
        
        <div className="activation-card" style={{ marginBottom: '1rem' }}>
          <div className="activation-filter-bar">
            <div className="activation-search-wrapper">
              <Search className="activation-search-icon" />
              <input className="activation-search-input" placeholder="Rechercher par client, N° vente, IMEI, N° SIM, matricule..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="activation-filter-group">
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
            </div>
          </div>
        </div>
        
        <div className="activation-card">
          <div className="activation-table-container">
            <table className="activation-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}></th>
                  <th>N° Vente</th>
                  <th>Client</th>
                  <th>Date</th>
                  <th>Produits GPS</th>
                  <th>Status</th>
                  <th style={{ width: '120px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedSales.map(sale => {
                  const saleActivations = getSaleActivations(sale.id);
                  const isExpanded = expandedSales[sale.id];
                  const hasActivations = saleActivations.length > 0;
                  const needsActivation = sale.needs_activation;
                  
                  return (
                    <React.Fragment key={sale.id}>
                      <tr className="expandable-row" onClick={() => toggleExpand(sale.id)}>
                        <td onClick={(e) => e.stopPropagation()}>{isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</td>
                        <td className="font-mono">#{sale.id}</td>
                        <td className="font-medium">{sale.client?.nom || '-'}</td>
                        <td>{formatDate(sale.created_at)}</td>
                        <td>{renderProductStatus(sale)}</td>
                        <td>
                          {needsActivation ? <Badge variant="warning">Activation en attente</Badge> : hasActivations ? <Badge variant="success">Partiellement activé</Badge> : <Badge variant="secondary">Aucun GPS</Badge>}
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="action-buttons">
                            {needsActivation && <button onClick={() => openActivationModal(sale)} className="activation-icon-btn activation-icon-btn-activate" title="Activer les appareils GPS"><Wifi size={18} /></button>}
                            {hasActivations && <button onClick={() => exportSaleDetailsToExcel(sale)} className="activation-icon-btn activation-icon-btn-excel" title="Exporter les détails de cette vente"><FileSpreadsheet size={18} /></button>}
                            {!needsActivation && !hasActivations && <span className="text-gray-400 text-xs">-</span>}
                          </div>
                        </td>
                      </tr>
                      
                      {isExpanded && (
                        <tr key={`${sale.id}-expanded`} className="expandable-content">
                          <td colSpan={7}>
                            <div style={{ padding: '1rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                <h4 style={{ fontWeight: '600' }}>Activations pour la vente #{sale.id}</h4>
                              </div>
                              {saleActivations.length > 0 ? (
                                <table className="sub-table">
                                  <thead>
                                    <tr>
                                      <th>Plan</th>
                                      <th>Prix Produit</th>
                                      <th>Prix Produit+20%</th>
                                      <th>Prix Activation</th>
                                      <th>Matricule</th>
                                      <th>Expiration</th>
                                      <th>Statut</th>
                                      <th>Total Payé</th>
                                      <th>Historique Renouvellements</th>
                                      <th>Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {saleActivations.map(activation => {
                                      const daysRemaining = activation.days_remaining || 
                                        (activation.expires_at ? Math.ceil((new Date(activation.expires_at) - new Date()) / (1000 * 60 * 60 * 24)) : 999);
                                      const isExpiringSoon = daysRemaining > 0 && daysRemaining <= 7;
                                      const totalPaid = getTotalPaid(activation);
                                      const productPrice = getProductPrice(activation);
                                      const productPriceWithMarkup = productPrice * 1.2;
                                      const activationPrice = parseFloat(activation.price) || 0;
                                      const renewalEntries = getRenewalEntries(activation);
                                      
                                      return (
                                        <tr key={activation.id} className={isExpiringSoon ? 'expiring-row' : ''}>
                                          <td>{PLAN_LABEL[activation.plan_abonnement]}</td>
                                          <td className="text-green-600 font-medium">{productPrice.toFixed(2)} MAD</td>
                                          <td className="text-blue-600 font-medium">{productPriceWithMarkup.toFixed(2)} MAD</td>
                                          <td>{activationPrice} MAD</td>
                                          <td className="font-mono">{activation.matricule || '-'}</td>
                                          <td className={daysRemaining <= 30 && daysRemaining > 0 ? 'text-red-600' : ''}>
                                            {formatDate(activation.expires_at)}
                                            {daysRemaining > 0 && daysRemaining < 999 && <span className="text-sm ml-2">({daysRemaining}j{isExpiringSoon && ' ⚠️'})</span>}
                                          </td>
                                          <td>{getStatusBadge(activation)}</td>
                                          <td className="font-medium">{totalPaid} MAD</td>
                                          <td>
                                            {renewalEntries.length > 0 ? (
                                              <ul className="renewals-list">
                                                {renewalEntries.map((renewal, idx) => (
                                                  <li key={idx}>
                                                    {formatDate(renewal.date)}: {PLAN_LABEL[renewal.old_plan]} → {PLAN_LABEL[renewal.new_plan]} ({renewal.price} MAD)
                                                  </li>
                                                ))}
                                              </ul>
                                            ) : (
                                              <span className="text-gray-400 text-xs">Aucun</span>
                                            )}
                                          </td>
                                          <td>
                                            <div className="action-buttons">
                                              <button onClick={() => setShowDetailModal(activation)} className="activation-icon-btn" title="Détails"><Eye size={16} /></button>
                                              <button onClick={() => showHistoryModal(activation)} className="activation-icon-btn" title="Historique"><History size={16} className="text-blue-600" /></button>
                                              <button onClick={() => openRenewSelectionModal(activation)} className="activation-icon-btn" title="Renouveler l'abonnement"><RotateCcw size={16} style={{ color: '#16a34a' }} /></button>
                                              {activation.status === 'active' && <button onClick={() => showStatusConfirmation(activation, 'suspended')} className="activation-icon-btn" title="Suspendre"><Ban size={16} className="text-yellow-600" /></button>}
                                              {activation.status === 'suspended' && <button onClick={() => showStatusConfirmation(activation, 'active')} className="activation-icon-btn" title="Réactiver"><Power size={16} className="text-green-600" /></button>}
                                              <button onClick={() => showDeleteConfirmation(activation)} className="activation-icon-btn" title="Supprimer"><Trash2 size={16} className="text-red-600" /></button>
                                            </div>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              ) : (
                                <div className="activation-empty" style={{ padding: '2rem' }}><Satellite size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />Aucune activation pour cette vente</div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
                {paginatedSales.length === 0 && (
                  <tr><td colSpan={7} className="activation-empty"><Satellite size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />Aucune vente trouvée</td></tr>
                )}
              </tbody>
            </table>
          </div>
          
          {getSalesTotalPages > 1 && (
            <div className="activation-pagination-container">
              <button className="activation-pagination-btn" onClick={() => setSalesPage(prev => Math.max(1, prev - 1))} disabled={salesPage === 1}><ChevronLeft size={16} /> Précédent</button>
              {getPageNumbers(getSalesTotalPages).map((page, idx) => page === '...' ? <span key={`ellipsis-${idx}`} className="activation-pagination-info">...</span> : (
                <button key={page} className={`activation-pagination-btn ${salesPage === page ? 'activation-pagination-active' : ''}`} onClick={() => setSalesPage(page)}>{page}</button>
              ))}
              <button className="activation-pagination-btn" onClick={() => setSalesPage(prev => Math.min(getSalesTotalPages, prev + 1))} disabled={salesPage === getSalesTotalPages}>Suivant <ChevronRight size={16} /></button>
            </div>
          )}
          
          {getActivationsTotalPages > 1 && (
            <div className="activation-pagination-container" style={{ borderTop: '1px solid #e5e7eb', marginTop: '0.5rem' }}>
              <button className="activation-pagination-btn" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}><ChevronLeft size={16} /> Précédent</button>
              {getPageNumbers(getActivationsTotalPages).map((page, idx) => page === '...' ? <span key={`ellipsis-${idx}`} className="activation-pagination-info">...</span> : (
                <button key={page} className={`activation-pagination-btn ${currentPage === page ? 'activation-pagination-active' : ''}`} onClick={() => handlePageChange(page)}>{page}</button>
              ))}
              <button className="activation-pagination-btn" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === getActivationsTotalPages}>Suivant <ChevronRight size={16} /></button>
            </div>
          )}
        </div>
      </div>
      
      {/* Activation Modal */}
      {showActivationModal && selectedSaleData && selectedSale && (
        <div className="activation-overlay">
          <div className="activation-dialog" style={{ maxWidth: '64rem' }}>
            <div className="activation-dialog-header">
              <h2 className="activation-dialog-title">Activation GPS - Vente #{selectedSale.id}</h2>
              <button onClick={() => { setShowActivationModal(false); setSelectedSale(null); setActivationsData([]); setErrorMessage(null); setSuccessMessage(null); }} className="activation-btn-icon"><X size={20} /></button>
            </div>
            <div className="activation-dialog-body">
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm"><strong>Client:</strong> {selectedSaleData.sale?.client?.nom || selectedSale.client?.nom}<br /><strong>Date vente:</strong> {formatDate(selectedSaleData.sale?.sale_date || selectedSale.created_at)}</p>
                {selectedSale.client?.ice_client && <p className="text-sm"><strong>ICE Client:</strong> {selectedSale.client.ice_client}</p>}
              </div>
              
              {selectedSaleData.activation_details?.map((detail, idx) => detail.remaining > 0 && (
                <div key={detail.produit_id} className="activation-product-row">
                  <div className="activation-product-title">{detail.produit_nom} ({detail.produit_marque}) - Prix produit: {detail.produit_prix || detail.default_price || 0} MAD - {detail.remaining} à activer</div>
                  {activationsData.filter(a => a.produit_id === detail.produit_id).map((act) => {
                    const availableImeiList = getImeiOptions(detail.produit_id);
                    const usedImeisForProduct = getUsedImeisForProduct(detail.produit_id, act.id);
                    const productPrice = act.produit_prix || detail.produit_prix || detail.default_price || 0;
                    const productPriceWithMarkup = productPrice * 1.2;
                    
                    return (
                      <div key={act.id} className="activation-item-card">
                        <div className="activation-grid-2">
                          <div className="activation-form-group">
                            <label className="activation-label activation-label-required">IMEI *</label>
                            <ImeiCombobox 
                              value={act.imei} 
                              onChange={(value) => updateActivationField(act.id, 'imei', value)} 
                              options={availableImeiList} 
                              placeholder="Sélectionner ou saisir un IMEI..." 
                              usedImeis={usedImeisForProduct} 
                            />
                            {availableImeiList.length === 0 && <p className="text-xs text-red-600 mt-1">Aucun appareil disponible pour ce produit.</p>}
                          </div>
                          <div className="activation-form-group">
                            <label className="activation-label activation-label-required">N° SIM *</label>
                            <input type="text" className="activation-input font-mono" placeholder="0612345678" value={act.numero_sim} onChange={(e) => updateActivationField(act.id, 'numero_sim', e.target.value)} />
                          </div>
                        </div>
                        <div className="activation-grid-3 mt-2">
                          <div className="activation-form-group">
                            <label className="activation-label activation-label-required">Opérateur *</label>
                            <select className="activation-select" value={act.operateur} onChange={(e) => updateActivationField(act.id, 'operateur', e.target.value)}>
                              {OPERATORS.map(op => <option key={op} value={op}>{op}</option>)}
                            </select>
                          </div>
                          <div className="activation-form-group">
                            <label className="activation-label activation-label-required">Plan *</label>
                            <select className="activation-select" value={act.plan_abonnement} onChange={(e) => updateActivationField(act.id, 'plan_abonnement', e.target.value)}>
                              <option value="1m">1 mois</option>
                              <option value="3m">3 mois</option>
                              <option value="6m">6 mois</option>
                              <option value="12m">12 mois</option>
                            </select>
                          </div>
                          <div className="activation-form-group">
                            <label className="activation-label activation-label-required">Prix Activation (MAD) *</label>
                            <div className="price-input-group">
                              <input 
                                type="number" 
                                className="activation-input price-input" 
                                placeholder="0.00"
                                onChange={(e) => updateActivationField(act.id, 'price', parseFloat(e.target.value) || 0)}
                                step="0.01"
                                min="0"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="activation-grid-2 mt-2">
                          <div className="activation-form-group">
                            <label className="activation-label">Matricule (véhicule)</label>
                            <input type="text" className="activation-input" placeholder="123 ABC 45" value={act.matricule} onChange={(e) => updateActivationField(act.id, 'matricule', e.target.value)} />
                          </div>
                          <div className="activation-form-group">
                            <label className="activation-label">Informations produit</label>
                            <div className="text-sm">
                              <span className="text-gray-600">Prix produit: </span>
                              <span className="text-green-600 font-medium">{productPrice} MAD</span>
                              <span className="text-gray-600 ml-2">(+20%: </span>
                              <span className="text-blue-600 font-medium">{productPriceWithMarkup.toFixed(2)} MAD</span>
                              <span className="text-gray-600">)</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
              
              <div className="total-price-summary">
                <span className="total-price-label">Total des activations à encaisser :</span>
                <span className="total-price-value">{getTotalActivationPrice().toFixed(2)} MAD</span>
              </div>
            </div>
            <div className="activation-dialog-footer">
              <button onClick={() => { setShowActivationModal(false); setSelectedSale(null); setActivationsData([]); }} className="activation-btn activation-btn-secondary" disabled={loadingAction}>Annuler</button>
              <button onClick={handleActivate} disabled={loadingAction} className="activation-btn activation-btn-primary">
                {loadingAction ? <><div className="activation-spinner" style={{ width: '1rem', height: '1rem', borderWidth: '2px' }} /> Activation...</> : `Activer (${getTotalActivationPrice().toFixed(2)} MAD)`}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Detail Modal */}
      {showDetailModal && (
        <div className="activation-overlay">
          <div className="activation-dialog" style={{ maxWidth: '32rem' }}>
            <div className="activation-dialog-header">
              <h2 className="activation-dialog-title">Détails de l'activation</h2>
              <button onClick={() => setShowDetailModal(null)} className="activation-btn-icon"><X size={20} /></button>
            </div>
            <div className="activation-dialog-body">
              <div className="activation-grid-2">
                <div><strong>IMEI:</strong> <span className="font-mono">{showDetailModal.imei}</span></div>
                <div><strong>N° SIM:</strong> <span className="font-mono">{showDetailModal.numero_sim}</span></div>
                <div><strong>Opérateur:</strong> {showDetailModal.operateur}</div>
                <div><strong>Plan:</strong> {PLAN_LABEL[showDetailModal.plan_abonnement]}</div>
                <div><strong>Prix Produit (Origine):</strong> <span className="text-green-600 font-medium">{getProductPrice(showDetailModal).toFixed(2)} MAD</span></div>
                <div><strong>Prix Produit +20%:</strong> <span className="text-blue-600 font-medium">{getProductPriceWithMarkup(showDetailModal).toFixed(2)} MAD</span></div>
                <div><strong>Prix Activation:</strong> <span className="text-green-600 font-medium">{showDetailModal.price || 0} MAD</span></div>
                <div><strong>Total payé (activations + renouvellements):</strong> <span className="text-green-600 font-medium">{getTotalPaid(showDetailModal)} MAD</span></div>
                <div><strong>Client:</strong> {showDetailModal.vente?.client?.nom}</div>
                <div><strong>ICE Client:</strong> {showDetailModal.vente?.client?.ice_client || '-'}</div>
                <div><strong>Matricule:</strong> {showDetailModal.matricule || '-'}</div>
                <div><strong>Date activation:</strong> {formatDate(showDetailModal.activated_at)}</div>
                <div><strong>Expiration:</strong> {formatDate(showDetailModal.expires_at)}</div>
                <div><strong>Statut:</strong> {getStatusBadge(showDetailModal)}</div>
              </div>
              {getRenewalEntries(showDetailModal).length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <strong>Historique des renouvellements:</strong>
                  <ul className="mt-2 space-y-1">
                    {getRenewalEntries(showDetailModal).map((renewal, idx) => (
                      <li key={idx} className="text-sm text-gray-600">
                        {formatDate(renewal.date)}: {PLAN_LABEL[renewal.old_plan]} → {PLAN_LABEL[renewal.new_plan]} - {renewal.price} MAD
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

import React from 'react';
export default Activation;