import { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Plus, Pencil, Trash2, Search, X, RefreshCw, AlertTriangle, 
  CheckCircle, Info, ChevronLeft, ChevronRight, FileSpreadsheet, 
  Eye, Edit2, Save, Printer, Calendar, Smartphone, Hash, 
  CreditCard, Clock, ExternalLink, Loader, Package, Trash,
  User, Check, AlertCircle, Download, History, Receipt, List,
  Filter
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
  fetchActivationStats
} from './Store/store';

// ==================== STYLES (Fully Responsive - Mobile First) ====================
const styles = `
  /* Base Layout - Mobile First */
  .clients-container {
    width: 100%;
    max-width: 100%;
    overflow-x: hidden;
    padding: 0 0.75rem;
    margin: 0 auto;
    box-sizing: border-box;
  }
  
  @media (min-width: 640px) {
    .clients-container {
      padding: 0 1rem;
    }
  }
  
  @media (min-width: 768px) {
    .clients-container {
      padding: 0 1.5rem;
    }
  }
  
  @media (min-width: 1280px) {
    .clients-container {
      max-width: 1280px;
      margin: 0 auto;
    }
  }
  
  .clients-page-header {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }
  
  @media (min-width: 640px) {
    .clients-page-header {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.5rem;
    }
  }
  
  .clients-title {
    font-size: 1.25rem;
    font-weight: 700;
    letter-spacing: -0.025em;
    line-height: 1.25;
    color: #111827;
  }
  
  @media (min-width: 640px) {
    .clients-title {
      font-size: 1.5rem;
    }
  }
  
  @media (min-width: 768px) {
    .clients-title {
      font-size: 1.875rem;
    }
  }
  
  .clients-subtitle {
    font-size: 0.7rem;
    color: #6b7280;
    margin-top: 0.25rem;
  }
  
  @media (min-width: 640px) {
    .clients-subtitle {
      font-size: 0.875rem;
    }
  }
  
  .clients-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .clients-card {
    background: white;
    border-radius: 0.75rem;
    border: 1px solid #e5e7eb;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    width: 100%;
    overflow: hidden;
  }
  
  .clients-search-container {
    padding: 0.75rem;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  
  @media (min-width: 640px) {
    .clients-search-container {
      padding: 1rem;
      gap: 0.75rem;
    }
  }
  
  .clients-search-wrapper {
    position: relative;
    flex: 1;
    min-width: 180px;
  }
  
  @media (min-width: 640px) {
    .clients-search-wrapper {
      max-width: 24rem;
    }
  }
  
  .clients-search-icon {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    width: 0.875rem;
    height: 0.875rem;
    color: #9ca3af;
  }
  
  .clients-search-input {
    width: 100%;
    height: 2.25rem;
    padding: 0.5rem 0.75rem 0.5rem 2rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 0.813rem;
    background: white;
    color: #111827;
    outline: none;
    transition: all 0.2s ease;
    -webkit-appearance: none;
  }
  
  .clients-search-input:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  .clients-table-container {
    position: relative;
    width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  
  .clients-table {
    width: 100%;
    min-width: 580px;
    border-collapse: collapse;
    font-size: 0.75rem;
  }
  
  @media (min-width: 768px) {
    .clients-table {
      font-size: 0.875rem;
      min-width: auto;
    }
  }
  
  .clients-table thead tr {
    border-bottom: 1px solid #e5e7eb;
    background: #f9fafb;
  }
  
  .clients-table th {
    height: 2.25rem;
    padding: 0 0.5rem;
    text-align: left;
    font-size: 0.65rem;
    font-weight: 600;
    text-transform: uppercase;
    color: #6b7280;
    vertical-align: middle;
  }
  
  @media (min-width: 640px) {
    .clients-table th {
      padding: 0 0.75rem;
      font-size: 0.7rem;
    }
  }
  
  @media (min-width: 768px) {
    .clients-table th {
      padding: 0 1rem;
      font-size: 0.75rem;
      height: 3rem;
    }
  }
  
  .clients-table tbody tr {
    border-bottom: 1px solid #f3f4f6;
    transition: all 0.2s ease;
  }
  
  .clients-table tbody tr:hover {
    background-color: #f9fafb;
  }
  
  .clients-table td {
    padding: 0.5rem;
    vertical-align: middle;
  }
  
  @media (min-width: 640px) {
    .clients-table td {
      padding: 0.75rem;
    }
  }
  
  @media (min-width: 768px) {
    .clients-table td {
      padding: 1rem;
    }
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
    font-family: monospace;
  }
  
  @media (max-width: 640px) {
    .clients-table .hide-on-mobile {
      display: none;
    }
    .clients-table th.hide-on-mobile,
    .clients-table td.hide-on-mobile {
      display: none;
    }
  }
  
  @media (max-width: 768px) {
    .clients-table .hide-on-tablet {
      display: none;
    }
    .clients-table th.hide-on-tablet,
    .clients-table td.hide-on-tablet {
      display: none;
    }
  }
  
  .clients-empty {
    text-align: center;
    color: #9ca3af;
    padding: 1.5rem 0;
  }
  
  @media (min-width: 640px) {
    .clients-empty {
      padding: 2rem 0;
    }
  }
  
  @media (min-width: 768px) {
    .clients-empty {
      padding: 3rem 0;
    }
  }
  
  .clients-loading {
    text-align: center;
    padding: 2rem 0;
  }
  
  .clients-loading-spinner {
    display: inline-block;
    width: 1.75rem;
    height: 1.75rem;
    border: 3px solid #e5e7eb;
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  
  @media (min-width: 640px) {
    .clients-loading-spinner {
      width: 2rem;
      height: 2rem;
    }
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .clients-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.375rem;
    white-space: nowrap;
    border-radius: 0.875rem;
    font-size: 0.75rem;
    font-weight: 500;
    transition: all 0.2s ease;
    outline: none;
    cursor: pointer;
    border: none;
    font-family: inherit;
  }
  
  @media (min-width: 640px) {
    .clients-btn {
      gap: 0.5rem;
      font-size: 0.875rem;
    }
  }
  
  .clients-btn-primary {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
    padding: 0.375rem 0.75rem;
    height: 2rem;
  }
  
  @media (min-width: 640px) {
    .clients-btn-primary {
      padding: 0.5rem 1rem;
      height: 2.5rem;
    }
  }
  
  .clients-btn-primary:hover {
    background: linear-gradient(135deg, #2563eb, #1d4ed8);
    transform: translateY(-1px);
  }
  
  .clients-btn-outline {
    background: white;
    border: 1px solid #d1d5db;
    color: #374151;
    padding: 0.375rem 0.75rem;
    height: 2rem;
  }
  
  @media (min-width: 640px) {
    .clients-btn-outline {
      padding: 0.5rem 1rem;
      height: 2.5rem;
    }
  }
  
  .clients-btn-outline:hover {
    background: #f9fafb;
    border-color: #9ca3af;
  }
  
  .clients-btn-icon {
    height: 2rem;
    width: 2rem;
    background: transparent;
    border: none;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.5rem;
    color: #6b7280;
  }
  
  @media (min-width: 640px) {
    .clients-btn-icon {
      height: 2.25rem;
      width: 2.25rem;
    }
  }
  
  .clients-btn-icon:hover {
    background: #f3f4f6;
    color: #374151;
  }
  
  .clients-btn-danger {
    background: linear-gradient(135deg, #ef4444, #dc2626);
    color: white;
    padding: 0.375rem 0.75rem;
  }
  
  @media (min-width: 640px) {
    .clients-btn-danger {
      padding: 0.5rem 1rem;
    }
  }
  
  .clients-actions-cell {
    display: flex;
    gap: 0.25rem;
    flex-wrap: nowrap;
    justify-content: flex-end;
  }
  
  /* Overlay and Dialog - Mobile Optimized */
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
    display: flex;
    flex-direction: column;
    width: 92%;
    max-width: 92%;
    max-height: 90vh;
    transform: translate(-50%, -50%);
    background: white;
    border-radius: 1rem;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    animation: slideIn 0.3s ease-out;
    overflow: hidden;
  }
  
  @media (min-width: 640px) {
    .clients-dialog {
      width: 90%;
      max-width: 90%;
    }
  }
  
  @media (min-width: 768px) {
    .clients-dialog {
      width: 85%;
      max-width: 85%;
    }
  }
  
  @media (min-width: 1024px) {
    .clients-dialog {
      width: 80%;
      max-width: 1400px;
    }
  }
  
  .clients-dialog-small {
    max-width: 92%;
  }
  
  @media (min-width: 640px) {
    .clients-dialog-small {
      max-width: 90%;
    }
  }
  
  @media (min-width: 768px) {
    .clients-dialog-small {
      max-width: 560px;
    }
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
  
  .clients-dialog-header {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1rem;
    border-bottom: 1px solid #e5e7eb;
  }
  
  @media (min-width: 640px) {
    .clients-dialog-header {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.25rem;
    }
  }
  
  @media (min-width: 768px) {
    .clients-dialog-header {
      padding: 1.25rem 1.5rem;
    }
  }
  
  .clients-dialog-title {
    font-size: 1rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  @media (min-width: 768px) {
    .clients-dialog-title {
      font-size: 1.25rem;
    }
  }
  
  .clients-dialog-body {
    padding: 1rem;
    overflow-y: auto;
    flex: 1;
  }
  
  @media (min-width: 768px) {
    .clients-dialog-body {
      padding: 1.5rem;
    }
  }
  
  .clients-dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    padding: 1rem;
    border-top: 1px solid #e5e7eb;
  }
  
  @media (min-width: 768px) {
    .clients-dialog-footer {
      padding: 1rem 1.5rem;
    }
  }
  
  .clients-dialog-close {
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 0.5rem;
    align-self: flex-start;
  }
  
  .clients-dialog-close:hover {
    background: #f3f4f6;
  }
  
  /* Form Styles - Mobile Optimized */
  .clients-label {
    font-size: 0.75rem;
    font-weight: 500;
    color: #374151;
    display: block;
    margin-bottom: 0.25rem;
  }
  
  @media (min-width: 640px) {
    .clients-label {
      font-size: 0.875rem;
    }
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
    border-radius: 0.5rem;
    font-size: 0.875rem;
    background: white;
    color: #111827;
    -webkit-appearance: none;
  }
  
  .clients-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  select.clients-input {
    cursor: pointer;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E");
    background-position: right 0.5rem center;
    background-repeat: no-repeat;
    background-size: 1.25rem;
    appearance: none;
  }
  
  .clients-form-group {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    margin-bottom: 0.75rem;
  }
  
  @media (min-width: 640px) {
    .clients-form-group {
      margin-bottom: 1rem;
    }
  }
  
  .form-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
  
  @media (min-width: 640px) {
    .form-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }
  }
  
  .form-full-width {
    grid-column: 1 / -1;
  }
  
  /* Toast Messages */
  .clients-toast-container {
    position: fixed;
    bottom: 1rem;
    left: 1rem;
    right: 1rem;
    z-index: 100;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  @media (min-width: 640px) {
    .clients-toast-container {
      left: auto;
      right: 1rem;
      min-width: 300px;
    }
  }
  
  .clients-toast {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    background: white;
    border-radius: 0.5rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    border-left: 4px solid;
    width: 100%;
    animation: toastIn 0.3s ease-out;
  }
  
  @keyframes toastIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  .clients-toast-success { border-left-color: #10b981; }
  .clients-toast-error { border-left-color: #ef4444; }
  .clients-toast-info { border-left-color: #3b82f6; }
  .clients-toast-message { flex: 1; font-size: 0.75rem; }
  
  @media (min-width: 640px) {
    .clients-toast-message { font-size: 0.875rem; }
  }
  
  .clients-toast-close { 
    background: none; 
    border: none; 
    cursor: pointer;
    padding: 0.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  /* Error Message */
  .error-message {
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 0.5rem;
    padding: 0.5rem;
    color: #dc2626;
    font-size: 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  
  @media (min-width: 640px) {
    .error-message {
      padding: 0.75rem;
      font-size: 0.875rem;
    }
  }
  
  /* Pagination - Mobile Optimized */
  .clients-pagination-container {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.25rem;
    padding: 0.5rem;
    border-top: 1px solid #e5e7eb;
  }
  
  @media (min-width: 640px) {
    .clients-pagination-container {
      gap: 0.5rem;
      padding: 0.75rem;
    }
  }
  
  .clients-pagination-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.125rem;
    padding: 0.25rem 0.5rem;
    border: 1px solid #d1d5db;
    background: white;
    border-radius: 0.375rem;
    font-size: 0.7rem;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  @media (min-width: 640px) {
    .clients-pagination-btn {
      gap: 0.5rem;
      padding: 0.5rem 0.875rem;
      font-size: 0.813rem;
    }
  }
  
  .clients-pagination-btn:hover:not(:disabled) {
    background: #f9fafb;
    transform: translateY(-1px);
  }
  
  .clients-pagination-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .clients-pagination-active {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
    border-color: #3b82f6;
  }
  
  .clients-pagination-info {
    padding: 0.25rem 0.375rem;
    font-size: 0.7rem;
    color: #6b7280;
  }
  
  @media (min-width: 640px) {
    .clients-pagination-info {
      padding: 0.5rem 0.75rem;
      font-size: 0.813rem;
    }
  }
  
  /* Toggle Group */
  .modern-toggle-group {
    display: flex;
    gap: 0.25rem;
    background: #f1f5f9;
    padding: 0.25rem;
    border-radius: 0.75rem;
    width: 100%;
  }
  
  @media (min-width: 640px) {
    .modern-toggle-group {
      width: auto;
    }
  }
  
  .modern-toggle-btn {
    padding: 0.375rem 0.75rem;
    border-radius: 0.5rem;
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    background: transparent;
    border: none;
    flex: 1;
    text-align: center;
    transition: all 0.2s;
  }
  
  @media (min-width: 640px) {
    .modern-toggle-btn {
      padding: 0.5rem 1rem;
      font-size: 0.813rem;
      flex: none;
    }
  }
  
  .modern-toggle-btn-active {
    background: white;
    color: #2563eb;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  }
  
  /* List Items for Activation Form */
  .activation-item {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 0.75rem;
    padding: 0.75rem;
    margin-bottom: 0.75rem;
  }
  
  .activation-item-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #e2e8f0;
  }
  
  .activation-item-title {
    font-size: 0.75rem;
    font-weight: 600;
    color: #2563eb;
  }
  
  @media (min-width: 640px) {
    .activation-item-title {
      font-size: 0.813rem;
    }
  }
  
  .remove-btn {
    background: #fee2e2;
    border: none;
    border-radius: 0.5rem;
    padding: 0.25rem 0.5rem;
    cursor: pointer;
    color: #dc2626;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.7rem;
  }
  
  /* Summary Card */
  .summary-card {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 0.75rem;
    padding: 1rem;
    color: white;
  }
  
  .price-auto {
    background-color: #ecfdf5;
    border-color: #10b981;
  }
  
  .total-amount-cell {
    font-weight: 700;
    color: #059669;
  }
  
  .sale-total-cell {
    font-size: 0.6rem;
    color: #6b7280;
  }
  
  /* Status Badges */
  .status-badge {
    display: inline-block;
    padding: 0.125rem 0.375rem;
    border-radius: 0.25rem;
    font-size: 0.6rem;
    font-weight: 600;
    white-space: nowrap;
  }
  
  @media (min-width: 640px) {
    .status-badge {
      padding: 0.25rem 0.5rem;
      font-size: 0.7rem;
    }
  }
  
  .status-active { background: #d1fae5; color: #065f46; }
  .status-primary { background: #dbeafe; color: #1e40af; }
  .status-pending { background: #fed7aa; color: #92400e; }
  .status-suspended { background: #fee2e2; color: #991b1b; }
  .status-expired { background: #e5e7eb; color: #374151; }
  
  /* Payment Status Badge Styles */
  .payment-status-paid { background: #d1fae5; color: #065f46; }
  .payment-status-partial { background: #fed7aa; color: #92400e; }
  .payment-status-unpaid { background: #fee2e2; color: #991b1b; }
  
  /* Filter Checkbox Group */
  .pdf-filter-group {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    align-items: center;
    background: #f8fafc;
    padding: 0.75rem 1rem;
    border-radius: 0.75rem;
    border: 1px solid #e2e8f0;
    margin-bottom: 1rem;
  }
  
  .pdf-filter-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    font-weight: 500;
    color: #1e293b;
    cursor: pointer;
  }
  
  .pdf-filter-label input[type="checkbox"] {
    width: 1rem;
    height: 1rem;
    cursor: pointer;
    accent-color: #3b82f6;
  }
  
  /* Utilities */
  .text-green-600 { color: #16a34a; }
  .text-destructive { color: #ef4444; }
  .text-blue-600 { color: #2563eb; }
  .text-orange-600 { color: #ea580c; }
  .text-right { text-align: right; }
  
  .activations-table-container {
    max-height: 50vh;
    overflow-x: auto;
    overflow-y: auto;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    -webkit-overflow-scrolling: touch;
  }
  
  @media (min-width: 768px) {
    .activations-table-container {
      max-height: 60vh;
    }
  }
  
  .activations-table {
    width: 100%;
    min-width: 700px;
    border-collapse: collapse;
    font-size: 0.7rem;
  }
  
  @media (min-width: 768px) {
    .activations-table {
      font-size: 0.813rem;
      min-width: auto;
    }
  }
  
  .activations-table th {
    background: #f8fafc;
    padding: 0.5rem;
    text-align: left;
    font-weight: 600;
    color: #1e293b;
    border-bottom: 1px solid #e2e8f0;
    position: sticky;
    top: 0;
  }
  
  @media (min-width: 768px) {
    .activations-table th {
      padding: 0.75rem;
    }
  }
  
  .activations-table td {
    padding: 0.5rem;
    border-bottom: 1px solid #f1f5f9;
  }
  
  @media (min-width: 768px) {
    .activations-table td {
      padding: 0.75rem;
    }
  }
  
  /* Scrollbar for mobile */
  @media (max-width: 640px) {
    .clients-table-container::-webkit-scrollbar,
    .activations-table-container::-webkit-scrollbar {
      height: 3px;
    }
    .clients-table-container::-webkit-scrollbar-track,
    .activations-table-container::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 3px;
    }
    .clients-table-container::-webkit-scrollbar-thumb,
    .activations-table-container::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 3px;
    }
  }
  
  .modern-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 18px;
    border: none;
    border-radius: 12px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.25s ease;
    color: white;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  }

  .modern-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 18px rgba(0,0,0,0.12);
  }

  .modern-btn:active {
    transform: scale(0.98);
  }

  .modern-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .modern-btn-secondary {
    background: linear-gradient(135deg, #64748b, #475569);
  }

  .modern-btn-secondary:nth-child(2) {
    background: linear-gradient(135deg, #16a34a, #15803d);
  }

  .modern-btn-success {
    background: linear-gradient(135deg, #2563eb, #1d4ed8);
  }

  .modern-btn-warning {
    background: linear-gradient(135deg, #f59e0b, #d97706);
  }
  
  .filter-btn {
    background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  }

  .spinning {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

// ==================== HELPER FUNCTIONS ====================
const API_URL = window.REACT_APP_API_URL || "https://amg-telecom-backd-production.up.railway.app/api";
const safeNumber = (value) => { const n = Number(value); return isNaN(n) ? 0 : n; };
const safeToFixed = (value, decimals = 2) => safeNumber(value).toFixed(decimals);
const TVA_RATE = 0.20;

// Helper function to calculate TTC price from HT price
const calculateTTC = (htPrice) => {
  return safeNumber(htPrice) * (1 + TVA_RATE);
};

// Helper function to get display IMEI (prefers imei, falls back to client_imei)
const getDisplayImei = (activation) => {
  if (activation.imei && activation.imei.trim() !== '') {
    return activation.imei;
  }
  if (activation.client_imei && activation.client_imei.trim() !== '') {
    return activation.client_imei;
  }
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
    <div className={`clients-toast clients-toast-${type}`}>
      <Icon size={18} />
      <span className="clients-toast-message">{message}</span>
      <button className="clients-toast-close" onClick={onClose}><X size={14} /></button>
    </div>
  );
};

// ==================== CONFIRM DIALOG ====================
const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel, variant = 'danger', loading = false }) => {
  if (!isOpen) return null;
  return (
    <div className="clients-overlay" onClick={onCancel}>
      <div className="clients-dialog clients-dialog-small" onClick={e => e.stopPropagation()}>
        <div className="clients-dialog-header">
          <h2 className="clients-dialog-title">{title}</h2>
          <button className="clients-dialog-close" onClick={onCancel}><X size={18} /></button>
        </div>
        <div className="clients-dialog-body">
          <p style={{ fontSize: '0.875rem' }}>{message}</p>
        </div>
        <div className="clients-dialog-footer">
          <button onClick={onCancel} className="clients-btn clients-btn-outline" disabled={loading}>Annuler</button>
          <button onClick={onConfirm} className={`clients-btn ${variant === 'danger' ? 'clients-btn-danger' : 'clients-btn-primary'}`} disabled={loading}>
            {loading && <div className="clients-loading-spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />}
            Confirmer
          </button>
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
    <div className="clients-pagination-container">
      <button className="clients-pagination-btn" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
        <ChevronLeft size={14} /> <span className="hide-on-mobile">Précédent</span>
      </button>
      {getPageNumbers().map((page, idx) => (
        page === '...' ? <span key={`ellipsis-${idx}`} className="clients-pagination-info">...</span> :
        <button key={page} className={`clients-pagination-btn ${currentPage === page ? 'clients-pagination-active' : ''}`} onClick={() => onPageChange(page)}>{page}</button>
      ))}
      <button className="clients-pagination-btn" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>
        <span className="hide-on-mobile">Suivant</span> <ChevronRight size={14} />
      </button>
    </div>
  );
};

// ==================== EXPORT HELPER ====================
const exportClientActivationsToExcel = async (client, activationsData) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`Client_${client.nom}_Activations`);
    
    try {
      const response = await fetch('/logo.png');
      if (response.ok) {
        const blob = await response.blob();
        const base64 = await new Promise(resolve => { 
          const reader = new FileReader(); 
          reader.onloadend = () => resolve(reader.result.split(',')[1]); 
          reader.readAsDataURL(blob); 
        });
        const imageId = workbook.addImage({ base64, extension: 'png' });
        worksheet.addImage(imageId, { tl: { col: 0, row: 0 }, ext: { width: 180, height: 130 } });
      }
    } catch(e) {}
    
    let rowOffset = 2;
    const company = getCompanyInfo();
    worksheet.mergeCells(`D${1+rowOffset}:F${1+rowOffset}`); 
    worksheet.getCell(`D${1+rowOffset}`).value = company.name; 
    worksheet.getCell(`D${1+rowOffset}`).font = { bold: true, size: 16 };
    worksheet.mergeCells(`D${2+rowOffset}:F${2+rowOffset}`); 
    worksheet.getCell(`D${2+rowOffset}`).value = company.address;
    worksheet.mergeCells(`D${3+rowOffset}:F${3+rowOffset}`); 
    worksheet.getCell(`D${3+rowOffset}`).value = `TEL: ${company.phone} | EMAIL: ${company.email}`;
    worksheet.mergeCells(`D${4+rowOffset}:F${4+rowOffset}`); 
    worksheet.getCell(`D${4+rowOffset}`).value = `ICE: ${company.ice} | RC: ${company.rc} | Patente: ${company.patente}`;
    
    const titleRow = worksheet.addRow([`RAPPORT DES ACTIVATIONS - CLIENT: ${client.nom.toUpperCase()}`]); 
    worksheet.mergeCells(`A${titleRow.number}:H${titleRow.number}`); 
    worksheet.getCell(`A${titleRow.number}`).font = { bold: true, size: 14 };
    worksheet.addRow([]);
    
    worksheet.addRow(['INFORMATIONS CLIENT']); 
    worksheet.mergeCells(`A${worksheet.lastRow.number}:H${worksheet.lastRow.number}`);
    worksheet.getCell(`A${worksheet.lastRow.number}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } }; 
    worksheet.getCell(`A${worksheet.lastRow.number}`).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.addRow(['Nom:', client.nom]); 
    worksheet.addRow(['ICE:', client.ice_client || '-']); 
    worksheet.addRow(['Téléphone:', client.telephone || '-']); 
    worksheet.addRow(['Email:', client.email || '-']); 
    worksheet.addRow(['Adresse:', client.adresse || '-']); 
    worksheet.addRow([]);
    
    const headers = ['Date', 'Type', 'Matricule', 'IMEI / Client IMEI', 'Opérateur', 'Expiration', 'Plan', 'Prix HT (MAD)', 'Prix TTC (MAD)', 'Statut', 'Statut Paiement', 'Montant Payé (MAD)', 'Reste (MAD)'];
    const headerRow = worksheet.addRow(headers);
    headerRow.eachCell(cell => { 
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } }; 
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }; 
    });
    
    let grandTotalHT = 0;
    let grandTotalTTC = 0;
    for (const act of activationsData) {
      const htPrice = act.activationPriceHT;
      const ttcPrice = calculateTTC(htPrice);
      grandTotalHT += htPrice;
      grandTotalTTC += ttcPrice;
      
      // Determine payment status and amounts
      let paymentStatus = 'Non payé';
      let amountPaid = 0;
      let remaining = ttcPrice;
      
      if (act.paymentStatus === 'paid') {
        paymentStatus = 'Payé';
        amountPaid = ttcPrice;
        remaining = 0;
      } else if (act.paymentStatus === 'partial') {
        paymentStatus = 'Partiel';
        amountPaid = act.amountPaid || 0;
        remaining = ttcPrice - amountPaid;
      } else {
        paymentStatus = 'Non payé';
        amountPaid = 0;
        remaining = ttcPrice;
      }
      
      worksheet.addRow([
        act.date ? new Date(act.date).toLocaleDateString('fr-FR') : '-',
        act.type,
        act.matricule,
        act.displayImei,
        act.operator || '-',
        act.expirationDate ? new Date(act.expirationDate).toLocaleDateString('fr-FR') : '-',
        PLAN_LABEL[act.plan] || act.plan || '-',
        safeToFixed(htPrice),
        safeToFixed(ttcPrice),
        act.status === 'active' ? 'Actif' : act.status === 'suspended' ? 'Suspendu' : 'Expiré',
        paymentStatus,
        safeToFixed(amountPaid),
        safeToFixed(remaining),
      ]);
    }
    
    worksheet.addRow([]);
    worksheet.addRow([`Total HT: ${safeToFixed(grandTotalHT)} MAD`]);
    worksheet.addRow([`Total TTC (TVA 20%): ${safeToFixed(grandTotalTTC)} MAD`]);
    
    worksheet.columns.forEach(col => { 
      let max = 0; 
      col.eachCell({ includeEmpty: true }, cell => { 
        const len = cell.value ? cell.value.toString().length : 0; 
        if (len > max) max = len; 
      }); 
      col.width = Math.min(Math.max(10, max + 2), 35); 
    });
    
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Client_${client.nom}_Activations_${new Date().toISOString().slice(0,10)}.xlsx`);
    return true;
  } catch (err) { 
    console.error(err); 
    throw err;
  }
};

// ==================== ACTIVATIONS DETAILS MODAL ====================
const ActivationsDetailsModal = ({ client, onClose, showToast }) => {
  const [activationsData, setActivationsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatingPdfTTC, setGeneratingPdfTTC] = useState(false);
  const [generatingPdfHT, setGeneratingPdfHT] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [editingPrice, setEditingPrice] = useState(null);
  const [tempPrice, setTempPrice] = useState('');
  const [salesData, setSalesData] = useState([]);
  // PDF Filter States
  const [showPaid, setShowPaid] = useState(true);
  const [showPartial, setShowPartial] = useState(true);
  const [showUnpaid, setShowUnpaid] = useState(true);

  useEffect(() => {
    const loadClientActivations = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        
        const activationsResponse = await fetch(`${API_URL}/activations?client_id=${client.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const salesResponse = await fetch(`${API_URL}/ventes?client_id=${client.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        let allActivations = [];
        let clientSales = [];
        
        if (activationsResponse.ok) {
          const data = await activationsResponse.json();
          allActivations = data.data || data.activations || [];
        }
        
        if (salesResponse.ok) {
          const data = await salesResponse.json();
          clientSales = data.ventes || data.data || [];
          setSalesData(clientSales);
        }
        
        // Fetch payment details for each activation
        const processedActions = [];
        const processedKeys = new Set();
        
        for (const activation of allActivations) {
          const associatedSale = clientSales.find(s => s.id === activation.vente_id);
          
          // Fetch payment history for this activation
          let paymentHistory = [];
          let activationPaymentStatus = 'unpaid';
          let activationAmountPaid = 0;
          let renewalAmountPaid = 0;
          let activationOriginalPrice = safeNumber(activation.price);
          let renewalTotal = 0;
          
          try {
            const paymentResponse = await fetch(`${API_URL}/activations/${activation.id}/payments`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (paymentResponse.ok) {
              const paymentData = await paymentResponse.json();
              paymentHistory = paymentData.payment_history || [];
              activationPaymentStatus = paymentData.payment_status || 'unpaid';
              activationAmountPaid = safeNumber(paymentData.amount_paid);
              activationOriginalPrice = safeNumber(paymentData.original_price || activation.price);
              renewalTotal = safeNumber(paymentData.renewal_total);
              renewalAmountPaid = safeNumber(paymentData.renewal_paid);
            }
          } catch (err) {
            console.error('Error fetching payment history for activation', activation.id, err);
          }
          
          let totalActivationPriceHT = activationOriginalPrice;
          let saleTotalPriceHT = 0;
          
          if (associatedSale) {
            const saleProduct = associatedSale.produits?.find(p => p.id === activation.produit_id);
            if (saleProduct) {
              const productQuantity = saleProduct.pivot?.quantite || 1;
              const productUnitPrice = saleProduct.pivot?.prix || saleProduct.prix_vente || 0;
              saleTotalPriceHT = safeNumber(productUnitPrice) * productQuantity;
            }
          }
          
          const activationPriceTTC = calculateTTC(totalActivationPriceHT);
          const saleTotalPriceTTC = calculateTTC(saleTotalPriceHT);
          const grandTotalTTC = activationPriceTTC + saleTotalPriceTTC;
          
          const activationKey = `activation_${activation.id}`;
          if (!processedKeys.has(activationKey) && activation.activated_at) {
            processedKeys.add(activationKey);
            
            let activationType = 'Activation';
            if (activation.vente_id) {
              activationType = associatedSale ? 'Installation + Activation' : 'Activation (Vente)';
            } else {
              activationType = 'Activation Simple';
            }
            
            // Calculate payment status for this activation item
            let itemPaymentStatus = 'unpaid';
            let itemAmountPaid = 0;
            if (activationPaymentStatus === 'paid') {
              itemPaymentStatus = 'paid';
              itemAmountPaid = activationPriceTTC;
            } else if (activationPaymentStatus === 'partial') {
              if (activationAmountPaid >= activationPriceTTC) {
                itemPaymentStatus = 'paid';
                itemAmountPaid = activationPriceTTC;
              } else if (activationAmountPaid > 0) {
                itemPaymentStatus = 'partial';
                itemAmountPaid = activationAmountPaid;
              }
            }
            
            processedActions.push({
              id: activation.id,
              type: activationType,
              date: activation.activated_at,
              matricule: activation.matricule || '-',
              imei: activation.imei || null,
              clientImei: activation.client_imei || null,
              displayImei: getDisplayImei(activation),
              operator: activation.operateur || '-',
              expirationDate: activation.expires_at,
              plan: activation.plan_abonnement,
              originalPriceHT: totalActivationPriceHT,
              activationPriceHT: totalActivationPriceHT,
              activationPriceTTC: activationPriceTTC,
              saleTotalPriceHT: saleTotalPriceHT,
              saleTotalPriceTTC: saleTotalPriceTTC,
              displayPriceTTC: grandTotalTTC,
              status: activation.status,
              venteId: activation.vente_id,
              saleReference: associatedSale ? `Vente #${associatedSale.id}` : null,
              paymentStatus: itemPaymentStatus,
              amountPaid: itemAmountPaid,
              remainingAmount: activationPriceTTC - itemAmountPaid,
              paymentHistory: paymentHistory
            });
          }
          
          if (activation.renewal_history && Array.isArray(activation.renewal_history)) {
            activation.renewal_history.forEach((entry, idx) => {
              if (entry.action === 'renewal') {
                const renewalKey = `renewal_${activation.id}_${entry.date}_${entry.price}`;
                if (!processedKeys.has(renewalKey)) {
                  processedKeys.add(renewalKey);
                  const renewalPriceHT = safeNumber(entry.price);
                  
                  // Calculate payment status for renewal
                  let renewalPaymentStatus = 'unpaid';
                  let renewalItemAmountPaid = 0;
                  if (activationPaymentStatus === 'paid') {
                    renewalPaymentStatus = 'paid';
                    renewalItemAmountPaid = calculateTTC(renewalPriceHT);
                  } else if (activationPaymentStatus === 'partial' && renewalAmountPaid > 0) {
                    if (renewalAmountPaid >= calculateTTC(renewalPriceHT)) {
                      renewalPaymentStatus = 'paid';
                      renewalItemAmountPaid = calculateTTC(renewalPriceHT);
                    } else if (renewalAmountPaid > 0) {
                      renewalPaymentStatus = 'partial';
                      renewalItemAmountPaid = renewalAmountPaid;
                    }
                  }
                  
                  processedActions.push({
                    id: `${activation.id}_renewal_${idx}`,
                    type: 'Renouvellement',
                    date: entry.date,
                    matricule: activation.matricule || '-',
                    imei: activation.imei || null,
                    clientImei: activation.client_imei || null,
                    displayImei: getDisplayImei(activation),
                    operator: activation.operateur || '-',
                    expirationDate: entry.new_expires_at || activation.expires_at,
                    plan: entry.new_plan,
                    originalPriceHT: renewalPriceHT,
                    activationPriceHT: renewalPriceHT,
                    activationPriceTTC: calculateTTC(renewalPriceHT),
                    saleTotalPriceHT: 0,
                    saleTotalPriceTTC: 0,
                    displayPriceTTC: calculateTTC(renewalPriceHT),
                    status: activation.status,
                    venteId: activation.vente_id,
                    saleReference: associatedSale ? `Vente #${associatedSale.id}` : null,
                    paymentStatus: renewalPaymentStatus,
                    amountPaid: renewalItemAmountPaid,
                    remainingAmount: calculateTTC(renewalPriceHT) - renewalItemAmountPaid,
                    paymentHistory: paymentHistory
                  });
                }
              }
            });
          }
        }
        
        processedActions.sort((a, b) => new Date(a.date) - new Date(b.date));
        setActivationsData(processedActions);
        
      } catch (err) {
        console.error('Error loading client activations:', err);
        showToast('Erreur lors du chargement des données', 'error');
      } finally {
        setLoading(false);
      }
    };
    
    if (client?.id) {
      loadClientActivations();
    }
  }, [client, showToast]);

  const startEditPrice = (idx, currentPriceTTC) => {
    setEditingPrice(idx);
    setTempPrice(currentPriceTTC.toString());
  };
  
  const saveTempPrice = (idx) => {
    const newPriceTTC = parseFloat(tempPrice);
    if (!isNaN(newPriceTTC)) {
      const updated = [...activationsData];
      updated[idx].displayPriceTTC = safeNumber(newPriceTTC);
      setActivationsData(updated);
      showToast(`Prix modifié temporairement`, 'success');
    } else {
      showToast('Veuillez entrer un nombre valide', 'error');
    }
    setEditingPrice(null);
    setTempPrice('');
  };
  
  const cancelEdit = () => {
    setEditingPrice(null);
    setTempPrice('');
  };
  
  const resetAllPrices = () => {
    const reset = activationsData.map(item => ({ 
      ...item, 
      displayPriceTTC: item.activationPriceTTC + (item.saleTotalPriceTTC || 0)
    }));
    setActivationsData(reset);
    showToast('Tous les prix ont été réinitialisés', 'info');
  };

  const handleExportExcel = async () => {
    setExportingExcel(true);
    try {
      await exportClientActivationsToExcel(client, activationsData);
      showToast('Export Excel réussi', 'success');
    } catch (err) {
      showToast('Erreur lors de l\'export Excel', 'error');
    } finally {
      setExportingExcel(false);
    }
  };
  
  // Get payment status color for display
  const getPaymentStatusColor = (paymentStatus) => {
    switch (paymentStatus) {
      case 'paid': return { color: '#059669', bg: '#d1fae5', label: 'Payé' };
      case 'partial': return { color: '#d97706', bg: '#fed7aa', label: 'Partiel' };
      default: return { color: '#dc2626', bg: '#fee2e2', label: 'Non payé' };
    }
  };
  
  // Filter data based on selected payment statuses
  const getFilteredDataForPDF = () => {
    return activationsData.filter(item => {
      if (item.paymentStatus === 'paid' && showPaid) return true;
      if (item.paymentStatus === 'partial' && showPartial) return true;
      if (item.paymentStatus === 'unpaid' && showUnpaid) return true;
      return false;
    });
  };
  
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

    // Get filtered data based on selected payment statuses
    const filteredData = getFilteredDataForPDF();
    
    const processedData = filteredData.map(item => {
      let displayPrice;
      if (includeTVA) {
        displayPrice = item.displayPriceTTC;
      } else {
        displayPrice = item.activationPriceHT + (item.saleTotalPriceHT || 0);
      }
      return { ...item, displayPriceForPdf: displayPrice };
    });

    // Define color based on payment status
    const getPriceColor = (paymentStatus) => {
      switch (paymentStatus) {
        case 'paid': return [5, 150, 105];     // Green
        case 'partial': return [217, 119, 6];  // Orange
        default: return [220, 38, 38];         // Red
      }
    };

    const rows = processedData.map(item => {
      const priceColor = getPriceColor(item.paymentStatus);
      return [
        item.date ? new Date(item.date).toLocaleDateString('fr-FR') : '-',
        item.type || '-',
        item.matricule || '-',
        PLAN_LABEL[item.plan] || item.plan || '-',
        { content: formatMoney(item.displayPriceForPdf), styles: { textColor: priceColor, fontStyle: 'bold' } }
      ];
    });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    const titleText = includeTVA 
      ? 'DÉTAIL DES ACTIVATIONS (Prix TTC - TVA incluse)'
      : 'DÉTAIL DES ACTIVATIONS (Prix HT - TVA exclue)';
    doc.text(titleText, 105, 108, { align: 'center' });

    autoTable(doc, {
      startY: 116,
      head: [[
        { content: "Date", styles: { textColor: [59, 130, 246] } },
        { content: "Type", styles: { textColor: [139, 92, 246] } },
        { content: "Matricule", styles: { textColor: [16, 185, 129] } },
        { content: "Plan", styles: { textColor: [245, 158, 11] } },
        { content: includeTVA ? "Prix TTC" : "Prix HT", styles: { textColor: [239, 68, 68] } }
      ]],
      body: rows,
      theme: 'grid',
      styles: { font: 'times', fontSize: 9, cellPadding: 3, valign: 'middle' },
      headStyles: { fillColor: [248, 250, 252], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center', lineWidth: 0.3 },
      columnStyles: {
        0: { halign: 'center', cellWidth: 35 },
        1: { halign: 'center', cellWidth: 40 },
        2: { halign: 'center', cellWidth: 55 },
        3: { halign: 'center', cellWidth: 30 },
        4: { halign: 'right', cellWidth: 35 }
      },
      margin: { left: 10, right: 10 },
      didDrawPage: () => {
        doc.setDrawColor(200);
        doc.rect(5, 5, 200, 287);
      }
    });

    const total = processedData.reduce((s, i) => s + safeNumber(i.displayPriceForPdf), 0);
    const finalY = doc.lastAutoTable.finalY + 15;

    // Draw total box
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(145, finalY - 9, 55, 14, 3, 3, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    const totalLabel = includeTVA ? 'TOTAL TTC :' : 'TOTAL HT :';
    doc.text(totalLabel, 150, finalY);
    doc.setFont('times', 'bold');
    doc.text(formatMoney(total), 192, finalY, { align: 'right' });

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

  const totalAmountTTC = activationsData.reduce((s, act) => s + safeNumber(act.displayPriceTTC), 0);
  const hasModifiedPrices = activationsData.some(act => act.displayPriceTTC !== (act.activationPriceTTC + (act.saleTotalPriceTTC || 0)));
  const activationsCount = activationsData.filter(a => a.type !== 'Renouvellement').length;
  const renewalsCount = activationsData.filter(a => a.type === 'Renouvellement').length;
  
  return (
    <>
      <div className="clients-overlay" onClick={onClose} />
      <div className="clients-dialog" style={{ maxWidth: '1400px' }}>
        <div className="clients-dialog-header">
          <h2 className="clients-dialog-title">
            <Smartphone size={20} className="text-blue-600" />
            Détails des Activations - {client.nom}
          </h2>
          <button className="clients-dialog-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="clients-dialog-body">
          {loading ? (
            <div className="clients-loading">
              <div className="clients-loading-spinner" />
              <p style={{ marginTop: '1rem' }}>Chargement des activations...</p>
            </div>
          ) : activationsData.length === 0 ? (
            <div className="error-message">
              <Info size={18} />
              Aucune activation trouvée pour ce client
            </div>
          ) : (
            <>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
                flexWrap: 'wrap',
                gap: '0.5rem'
              }}>
                <div>
                  {hasModifiedPrices && (
                    <span style={{
                      background: '#fef3c7',
                      color: '#d97706',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.5rem',
                      fontSize: '0.7rem'
                    }}>
                      Prix modifiés temporairement
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button onClick={resetAllPrices} className="modern-btn modern-btn-secondary">
                    <RefreshCw size={14} /> Réinitialiser
                  </button>
                  <button onClick={handleExportExcel} disabled={exportingExcel} className="modern-btn modern-btn-secondary">
                    {exportingExcel ? <Loader size={14} className="spinning" /> : <FileSpreadsheet size={14} />}
                    {exportingExcel ? 'Export...' : 'Excel'}
                  </button>
                  <button 
                    onClick={() => generatePDF(true)} 
                    disabled={generatingPdfTTC} 
                    className="modern-btn modern-btn-success"
                  >
                    {generatingPdfTTC ? <Loader size={14} className="spinning" /> : <Printer size={14} />}
                    {generatingPdfTTC ? 'Génération...' : 'PDF TTC'}
                  </button>
                  <button 
                    onClick={() => generatePDF(false)} 
                    disabled={generatingPdfHT} 
                    className="modern-btn modern-btn-warning"
                  >
                    {generatingPdfHT ? <Loader size={14} className="spinning" /> : <Printer size={14} />}
                    {generatingPdfHT ? 'Génération...' : 'PDF HT'}
                  </button>
                </div>
              </div>
              
              {/* PDF Filter Checkboxes */}
              <div className="pdf-filter-group">
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Filter size={14} /> Filtrer par statut de paiement pour PDF:
                </span>
                <label className="pdf-filter-label">
                  <input 
                    type="checkbox" 
                    checked={showPaid} 
                    onChange={(e) => setShowPaid(e.target.checked)} 
                  />
                  <span style={{ color: '#059669' }}>Payé</span>
                </label>
                <label className="pdf-filter-label">
                  <input 
                    type="checkbox" 
                    checked={showPartial} 
                    onChange={(e) => setShowPartial(e.target.checked)} 
                  />
                  <span style={{ color: '#d97706' }}>Partiel</span>
                </label>
                <label className="pdf-filter-label">
                  <input 
                    type="checkbox" 
                    checked={showUnpaid} 
                    onChange={(e) => setShowUnpaid(e.target.checked)} 
                  />
                  <span style={{ color: '#dc2626' }}>Non payé</span>
                </label>
              </div>

              <div className="activations-table-container">
                <table className="activations-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Matricule</th>
                      <th className="hide-on-tablet">IMEI / Client</th>
                      <th className="hide-on-mobile">Opérateur</th>
                      <th className="hide-on-tablet">Expiration</th>
                      <th>Plan</th>
                      <th className="hide-on-mobile">Prix HT</th>
                      <th className="hide-on-mobile">Prix Vente HT</th>
                      <th>Total TTC</th>
                      <th>Statut Paiement</th>
                      <th>Montant Payé</th>
                      <th>Reste</th>
                      <th>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activationsData.map((act, idx) => {
                      const paymentColor = getPaymentStatusColor(act.paymentStatus);
                      return (
                        <tr key={act.id}>
                          <td style={{ whiteSpace: 'nowrap' }}>{act.date ? new Date(act.date).toLocaleDateString('fr-FR') : '-'}</td>
                          <td>
                            <span className={`status-badge ${
                              act.type === 'Activation Simple' ? 'status-active' :
                              act.type === 'Installation + Activation' ? 'status-primary' :
                              act.type === 'Renouvellement' ? 'status-pending' : 'status-expired'
                            }`}>
                              {act.type === 'Activation Simple' ? 'Simple' : 
                               act.type === 'Installation + Activation' ? 'Install+' : 
                               act.type === 'Renouvellement' ? 'Renouv.' : act.type}
                            </span>
                          </td>
                          <td style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>{act.matricule}</td>
                          <td className="hide-on-tablet" style={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>
                            {act.displayImei}
                            {act.clientImei && act.imei && (
                              <span style={{ fontSize: '0.6rem', color: '#6b7280', marginLeft: '4px' }}>(IMEI)</span>
                            )}
                            {act.clientImei && !act.imei && (
                              <span style={{ fontSize: '0.6rem', color: '#f59e0b', marginLeft: '4px' }}>(client)</span>
                            )}
                          </td>
                          <td className="hide-on-mobile">{act.operator || '-'}</td>
                          <td className="hide-on-tablet">{act.expirationDate ? new Date(act.expirationDate).toLocaleDateString('fr-FR') : '-'}</td>
                          <td>{PLAN_LABEL[act.plan] || act.plan || '-'}</td>
                          <td className="hide-on-mobile text-right">{safeToFixed(act.activationPriceHT)} MAD</td>
                          <td className="hide-on-mobile text-right">
                            {act.saleTotalPriceHT > 0 ? (
                              <span className="sale-total-cell">{safeToFixed(act.saleTotalPriceHT)} MAD</span>
                            ) : '-'}
                          </td>
                          <td className="text-right total-amount-cell">
                            {editingPrice === idx ? (
                              <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={tempPrice}
                                  onChange={e => setTempPrice(e.target.value)}
                                  style={{ width: '80px', padding: '4px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '0.7rem' }}
                                  autoFocus
                                />
                                <button onClick={() => saveTempPrice(idx)} style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer' }}>✓</button>
                                <button onClick={cancelEdit} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer' }}>✗</button>
                              </div>
                            ) : (
                              <span 
                                onClick={() => startEditPrice(idx, act.displayPriceTTC)} 
                                style={{ 
                                  cursor: 'pointer', 
                                  backgroundColor: act.displayPriceTTC !== (act.activationPriceTTC + act.saleTotalPriceTTC) ? '#fef3c7' : 'transparent', 
                                  padding: '2px 4px', 
                                  borderRadius: '4px', 
                                  display: 'inline-block',
                                  fontWeight: 'bold',
                                  color: '#059669',
                                  fontSize: '0.8rem'
                                }}
                              >
                                {safeToFixed(act.displayPriceTTC)} MAD
                              </span>
                            )}
                          </td>
                          <td>
                            <span className={`status-badge ${paymentColor.bg}`} style={{ color: paymentColor.color, fontWeight: 600 }}>
                              {paymentColor.label}
                            </span>
                          </td>
                          <td className="text-right" style={{ color: '#059669' }}>
                            {safeToFixed(act.amountPaid)} MAD
                          </td>
                          <td className="text-right" style={{ color: '#dc2626' }}>
                            {safeToFixed(act.remainingAmount)} MAD
                          </td>
                          <td>
                            <span className={`status-badge ${
                              act.status === 'active' ? 'status-active' :
                              act.status === 'suspended' ? 'status-suspended' : 'status-expired'
                            }`}>
                              {act.status === 'active' ? 'Actif' : act.status === 'suspended' ? 'Suspendu' : 'Expiré'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div style={{
                marginTop: '1rem',
                padding: '0.75rem',
                background: '#f8fafc',
                borderRadius: '0.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.5rem',
                fontSize: '0.75rem'
              }}>
                <div>
                  <strong>Statistiques:</strong>
                  <span style={{ marginLeft: '0.5rem' }}>
                    {activationsCount} activation(s) | {renewalsCount} renouvellement(s)
                  </span>
                </div>
                <div>
                  <strong>Montant total TTC:</strong>
                  <span style={{ color: '#059669', fontWeight: 'bold', marginLeft: '0.5rem', fontSize: '0.9rem' }}>
                    {safeToFixed(totalAmountTTC)} MAD
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
        <div className="clients-dialog-footer">
          <button onClick={onClose} className="modern-btn modern-btn-secondary">
            Fermer
          </button>
        </div>
      </div>
    </>
  );
};

// ==================== MAIN CLIENTS COMPONENT ====================
const Clients = () => {
  const dispatch = useDispatch();
  const { list: clients, loading, error } = useSelector((state) => state.clients);
  const sales = useSelector(selectSales);

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
  const itemsPerPage = 15;

  const [activationsModal, setActivationsModal] = useState({ isOpen: false, client: null });
  const [activationModal, setActivationModal] = useState({
    isOpen: false,
    client: null,
    mode: 'simple',
    rows: [],
    cart: [],
    loading: false,
    formError: ''
  });
  const [activationProducts, setActivationProducts] = useState([]);
  const [productPrices, setProductPrices] = useState({});

  const [allActivations, setAllActivations] = useState([]);

  useEffect(() => {
    const fetchAllActivations = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/activations?per_page=1000`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          const activations = data.data || data.activations || [];
          setAllActivations(activations);
        }
      } catch (err) {
        console.error('Error fetching activations:', err);
      }
    };
    fetchAllActivations();
  }, []);

  useEffect(() => {
    if (activationModal.isOpen && activationProducts.length === 0) {
      const fetchProducts = async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await fetch(`${API_URL}/produits`, { headers: { Authorization: `Bearer ${token}` } });
          const data = await res.json();
          const products = data.produits || data || [];
          setActivationProducts(products);
          const priceMap = {};
          products.forEach(p => {
            priceMap[p.id] = safeNumber(p.prix_vente);
          });
          setProductPrices(priceMap);
        } catch (err) { console.error(err); }
      };
      fetchProducts();
    }
  }, [activationModal.isOpen, activationProducts.length]);

  useEffect(() => {
    dispatch(fetchClients());
    dispatch(fetchSales());
  }, [dispatch]);

  const filtered = search ? clients.filter(c =>
    (c.nom?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (c.telephone || '').includes(search) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.ice_client?.toString() || '').includes(search) ||
    (c.adresse?.toLowerCase() || '').includes(search.toLowerCase())
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
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

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
    setFormError('');
    setOpen(true);
  };

  const save = async () => {
    if (!form.nom?.trim()) {
      setFormError('Le nom du client est requis');
      showToast('Le nom du client est requis', 'error');
      return;
    }
    if (!form.telephone?.trim()) {
      setFormError('Le numéro de téléphone est requis');
      showToast('Le numéro de téléphone est requis', 'error');
      return;
    }

    const iceValue = String(form.ice_client || '').trim();

    const clientData = {
      nom: form.nom.trim(),
      telephone: form.telephone.trim(),
      email: form.email?.trim() || null,
      ice_client: iceValue ? parseInt(iceValue, 10) : null,
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
      dispatch(fetchSales());
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
      dispatch(fetchSales());
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

  const calculateTotalSpent = (clientId) => {
    const clientSales = sales?.filter(s => s.client_id === clientId || s.clientId === clientId) || [];
    const salesTotal = clientSales.reduce((sum, sale) => sum + safeNumber(sale.total), 0);
    
    const clientActivations = allActivations.filter(a => a.client_id === clientId);
    const activationsTotal = clientActivations.reduce((sum, act) => sum + safeNumber(act.price), 0);
    
    return salesTotal + activationsTotal;
  };

  const purchaseCount = (id) => sales?.filter(s => s.client_id === id || s.clientId === id).length || 0;

  const openActivationsDetails = (client) => {
    setActivationsModal({ isOpen: true, client });
  };

  const openActivationModal = (client) => {
    setActivationModal({
      isOpen: true,
      client,
      mode: 'simple',
      rows: [{
        id: Date.now(),
        date: new Date().toISOString().slice(0,10),
        matricule: '',
        price: 0,
        plan_abonnement: ''
      }],
      cart: [],
      loading: false,
      formError: ''
    });
  };

  const addActivationRow = () => {
    setActivationModal(prev => ({
      ...prev,
      rows: [...prev.rows, {
        id: Date.now(),
        date: new Date().toISOString().slice(0,10),
        matricule: '',
        price: 0,
        plan_abonnement: ''
      }]
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
      setActivationModal(prev => ({ ...prev, formError: 'Vous devez garder au moins une ligne d\'activation' }));
      return;
    }
    setActivationModal(prev => ({
      ...prev,
      rows: prev.rows.filter(row => row.id !== id),
      formError: ''
    }));
  };

  const addInstallationProduct = () => {
    setActivationModal(prev => ({
      ...prev,
      cart: [...prev.cart, {
        id: Date.now(),
        produit_id: '',
        quantity: 1,
        unit_price: 0,
        matricule: '',
        date_activation: new Date().toISOString().slice(0,10),
        price: 0,
        plan_abonnement: ''
      }]
    }));
  };

  const updateInstallationProduct = (id, field, value) => {
    setActivationModal(prev => ({
      ...prev,
      cart: prev.cart.map(item => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === 'produit_id' && value && productPrices[value]) {
            updated.unit_price = productPrices[value];
          }
          return updated;
        }
        return item;
      })
    }));
  };

  const removeInstallationProduct = (id) => {
    if (activationModal.cart.length === 1) {
      setActivationModal(prev => ({ ...prev, formError: 'Vous devez garder au moins un produit' }));
      return;
    }
    setActivationModal(prev => ({
      ...prev,
      cart: prev.cart.filter(item => item.id !== id),
      formError: ''
    }));
  };

  const calculateInstallationTotals = () => {
    const subtotal = activationModal.cart.reduce((sum, item) => 
      sum + (safeNumber(item.unit_price) * safeNumber(item.quantity)), 0);
    const tva = subtotal * 0.2;
    const total = subtotal + tva;
    return { subtotal, tva, total };
  };

  const calculateGrandTotal = () => {
    const installationTotal = calculateInstallationTotals().total;
    const activationTotal = activationModal.cart.reduce((sum, item) => 
      sum + (safeNumber(item.price) * safeNumber(item.quantity)), 0);
    return installationTotal + activationTotal;
  };

  const validateActivationForm = () => {
    if (activationModal.mode === 'simple') {
      for (const row of activationModal.rows) {
        if (!row.matricule || !row.matricule.trim()) {
          setActivationModal(prev => ({ ...prev, formError: 'Veuillez remplir le matricule pour toutes les lignes' }));
          return false;
        }
        if (row.price <= 0) {
          setActivationModal(prev => ({ ...prev, formError: 'Le prix HT doit être supérieur à 0' }));
          return false;
        }
      }
    } else {
      if (activationModal.cart.length === 0) {
        setActivationModal(prev => ({ ...prev, formError: 'Ajoutez au moins un produit' }));
        return false;
      }
      for (const item of activationModal.cart) {
        if (!item.produit_id) {
          setActivationModal(prev => ({ ...prev, formError: 'Veuillez sélectionner un produit' }));
          return false;
        }
        if (item.quantity <= 0) {
          setActivationModal(prev => ({ ...prev, formError: 'La quantité doit être supérieure à 0' }));
          return false;
        }
        if (item.unit_price <= 0) {
          setActivationModal(prev => ({ ...prev, formError: 'Le prix unitaire HT doit être supérieur à 0' }));
          return false;
        }
        if (!item.matricule || !item.matricule.trim()) {
          setActivationModal(prev => ({ ...prev, formError: 'Veuillez remplir le matricule pour tous les produits' }));
          return false;
        }
      }
    }
    return true;
  };

  const submitActivationModal = async () => {
    if (!activationModal.client) return;
    if (!validateActivationForm()) return;
    
    setActivationModal(prev => ({ ...prev, loading: true, formError: '' }));
    try {
      if (activationModal.mode === 'simple') {
        let successCount = 0;
        for (const row of activationModal.rows) {
          await dispatch(createStandaloneActivation({
            client_id: activationModal.client.id,
            matricule: row.matricule.trim(),
            price: row.price,
            date_activation: row.date,
            plan_abonnement: row.plan_abonnement || null
          })).unwrap();
          successCount++;
        }
        showToast(`${successCount} activation(s) créée(s) avec succès`, 'success');
        dispatch(fetchActivationStats());
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/activations?per_page=1000`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setAllActivations(data.data || data.activations || []);
        }
      } else {
        const activationsPayload = activationModal.cart.map(item => ({
          produit_id: item.produit_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          matricule: item.matricule.trim(),
          date_activation: item.date_activation,
          price: item.price || 0,
          plan_abonnement: item.plan_abonnement || null
        }));
        await dispatch(createInstallation({
          client_id: activationModal.client.id,
          activations: activationsPayload
        })).unwrap();
        showToast(`Installation créée avec succès (${activationsPayload.length} activation(s))`, 'success');
        dispatch(fetchSales());
        dispatch(fetchActivationStats());
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/activations?per_page=1000`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setAllActivations(data.data || data.activations || []);
        }
      }
      setActivationModal({ isOpen: false, client: null, mode: 'simple', rows: [], cart: [], loading: false, formError: '' });
    } catch (err) {
      setActivationModal(prev => ({ ...prev, formError: err || 'Erreur lors de la création' }));
      showToast(err || 'Erreur lors de la création', 'error');
      setActivationModal(prev => ({ ...prev, loading: false }));
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
    <div className="clients-container">
      <style>{styles}</style>

      {toasts.length > 0 && (
        <div className="clients-toast-container">
          {toasts.map(toast => (
            <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
          ))}
        </div>
      )}

      <div className="clients-page-header">
        <div>
          <h1 className="clients-title">Clients</h1>
          <p className="clients-subtitle">{filtered.length} clients sur {clients.length} enregistrés</p>
        </div>
        <div className="clients-actions">
          <ExportMenu
            title="Liste des clients"
            rows={filtered}
            columns={[
              { header: 'Nom', accessor: c => c.nom },
              { header: 'Téléphone', accessor: c => c.telephone || '-' },
              { header: 'Email', accessor: c => c.email || '-' },
              { header: 'ICE', accessor: c => c.ice_client || '-' },
              { header: 'Adresse', accessor: c => c.adresse || '-' },
              { header: 'Achats', accessor: c => purchaseCount(c.id) },
              { header: 'Total dépensé (MAD)', accessor: c => calculateTotalSpent(c.id).toFixed(2) },
            ]}
          />
          <button onClick={openNew} className="clients-btn clients-btn-primary">
            <Plus size={14} /> Ajouter client
          </button>
        </div>
      </div>

      <div className="clients-card">
        <div className="clients-search-container">
          <div className="clients-search-wrapper">
            <Search className="clients-search-icon" />
            <input
              className="clients-search-input"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
                if (searchTimeout) clearTimeout(searchTimeout);
                const timeout = setTimeout(() => {
                  if (e.target.value.trim()) {
                    dispatch(searchClients(e.target.value));
                  } else {
                    dispatch(fetchClients());
                  }
                }, 500);
                setSearchTimeout(timeout);
              }}
            />
          </div>
        </div>
        <div className="clients-table-container">
          <table className="clients-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Téléphone</th>
                <th className="hide-on-tablet">Email</th>
                <th className="hide-on-mobile">ICE</th>
                <th className="hide-on-tablet">Adresse</th>
                <th>Achats</th>
                <th className="text-right hide-on-mobile">Total dépensé</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedClients.map((c) => (
                <tr key={c.id}>
                  <td className="font-medium" style={{ whiteSpace: 'nowrap' }}>{c.nom}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{c.telephone || '-'}</td>
                  <td className="hide-on-tablet text-muted">{c.email || '-'}</td>
                  <td className="hide-on-mobile font-mono" style={{ fontSize: '0.7rem' }}>{c.ice_client || '-'}</td>
                  <td className="hide-on-tablet text-muted">{c.adresse ? (c.adresse.length > 20 ? c.adresse.substring(0, 20) + '...' : c.adresse) : '-'}</td>
                  <td style={{ textAlign: 'center' }}>{purchaseCount(c.id)}</td>
                  <td className="text-right hide-on-mobile font-semibold" style={{ color: '#059669', whiteSpace: 'nowrap' }}>{calculateTotalSpent(c.id).toFixed(0)} MAD</td>
                  <td>
                    <div className="clients-actions-cell">
                      <button onClick={() => openActivationsDetails(c)} className="clients-btn-icon" title="Voir détails">
                        <Eye size={14} className="text-blue-600" />
                      </button>
                      <button onClick={() => openActivationModal(c)} className="clients-btn-icon" title="Ajouter activation">
                        <Plus size={14} className="text-blue-600" />
                      </button>
                      <button onClick={() => openEdit(c)} className="clients-btn-icon" title="Modifier">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => setConfirmDelete({ isOpen: true, id: c.id, name: c.nom })} className="clients-btn-icon" title="Supprimer">
                        <Trash2 size={14} className="text-destructive" />
                      </button>
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

        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      {/* Client Form Modal */}
      {open && (
        <>
          <div className="clients-overlay" onClick={() => setOpen(false)} />
          <div className="clients-dialog clients-dialog-small">
            <div className="clients-dialog-header">
              <h2 className="clients-dialog-title">{editing ? '✏️ Modifier le client' : '➕ Nouveau client'}</h2>
              <button className="clients-dialog-close" onClick={() => setOpen(false)}><X size={18} /></button>
            </div>
            <div className="clients-dialog-body">
              {formError && (
                <div className="error-message">
                  <AlertTriangle size={14} />
                  {formError}
                </div>
              )}
              <div className="form-grid">
                <div className="clients-form-group">
                  <label className="clients-label clients-label-required">Nom complet</label>
                  <input 
                    className="clients-input" 
                    value={form.nom} 
                    onChange={(e) => setForm({ ...form, nom: e.target.value })} 
                    placeholder="Ex: Jean Dupont" 
                    autoFocus 
                  />
                </div>
                <div className="clients-form-group">
                  <label className="clients-label clients-label-required">Numéro de téléphone</label>
                  <input 
                    className="clients-input" 
                    value={form.telephone} 
                    onChange={(e) => setForm({ ...form, telephone: e.target.value })} 
                    placeholder="Ex: 06 12 34 56 78" 
                  />
                </div>
                <div className="clients-form-group">
                  <label className="clients-label">Adresse email</label>
                  <input 
                    type="email" 
                    className="clients-input" 
                    value={form.email} 
                    onChange={(e) => setForm({ ...form, email: e.target.value })} 
                    placeholder="client@example.com" 
                  />
                </div>
                <div className="clients-form-group">
                  <label className="clients-label">ICE Client</label>
                  <input 
                    type="number" 
                    className="clients-input" 
                    value={form.ice_client} 
                    onChange={(e) => setForm({ ...form, ice_client: e.target.value })} 
                    placeholder="Ex: 123456789012345" 
                  />
                  <small style={{ fontSize: '0.65rem', color: '#6b7280' }}>Identifiant Commun de l'Entreprise (ICE)</small>
                </div>
                <div className="clients-form-group form-full-width">
                  <label className="clients-label">Adresse</label>
                  <input 
                    className="clients-input" 
                    value={form.adresse} 
                    onChange={(e) => setForm({ ...form, adresse: e.target.value })} 
                    placeholder="Ex: 123 Rue Example, Casablanca" 
                  />
                </div>
              </div>
            </div>
            <div className="clients-dialog-footer">
              <button onClick={() => setOpen(false)} className="clients-btn clients-btn-outline">Annuler</button>
              <button onClick={save} className="clients-btn clients-btn-primary">{editing ? 'Mettre à jour' : 'Ajouter'}</button>
            </div>
          </div>
        </>
      )}

      <ConfirmDialog
        isOpen={confirmDelete.isOpen}
        title="Confirmer la suppression"
        message={
          <div>
            <p>Êtes-vous sûr de vouloir supprimer le client <strong>"{confirmDelete.name}"</strong> ?</p>
            {purchaseCount(confirmDelete.id) > 0 && (
              <p style={{ color: '#dc2626', marginTop: '8px', fontSize: '0.75rem' }}>
                ⚠️ Attention : Ce client a {purchaseCount(confirmDelete.id)} achat(s) associé(s).
              </p>
            )}
            <p style={{ marginTop: '8px', fontSize: '0.75rem', color: '#dc2626' }}>Cette action est irréversible.</p>
          </div>
        }
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete({ isOpen: false, id: null, name: '' })}
        variant="danger"
        loading={deleting}
      />

      {activationsModal.isOpen && (
        <ActivationsDetailsModal
          client={activationsModal.client}
          onClose={() => setActivationsModal({ isOpen: false, client: null })}
          showToast={showToast}
        />
      )}

      {/* Activation Modal - Redesigned like Ajouter client form */}
      {activationModal.isOpen && (
        <>
          <div className="clients-overlay" onClick={() => setActivationModal(prev => ({ ...prev, isOpen: false }))} />
          <div className="clients-dialog" style={{ maxWidth: '700px' }} onClick={e => e.stopPropagation()}>
            <div className="clients-dialog-header">
              <h2 className="clients-dialog-title">
                <Smartphone size={20} className="text-blue-600" />
                {activationModal.mode === 'simple' ? '➕ Nouvelle Activation' : '🔧 Nouvelle Installation'} – {activationModal.client?.nom}
              </h2>
              <button className="clients-dialog-close" onClick={() => setActivationModal(prev => ({ ...prev, isOpen: false }))}>
                <X size={18} />
              </button>
            </div>
            <div className="clients-dialog-body">
              {/* Mode Toggle */}
              <div className="modern-toggle-group" style={{ marginBottom: '1rem' }}>
                <button 
                  className={`modern-toggle-btn ${activationModal.mode === 'simple' ? 'modern-toggle-btn-active' : ''}`} 
                  onClick={() => setActivationModal(prev => ({ 
                    ...prev, 
                    mode: 'simple', 
                    rows: [{ id: Date.now(), date: new Date().toISOString().slice(0,10), matricule: '', price: 0, plan_abonnement: '' }], 
                    cart: [],
                    formError: ''
                  }))}
                >
                  Activation Simple
                </button>
                <button 
                  className={`modern-toggle-btn ${activationModal.mode === 'installation' ? 'modern-toggle-btn-active' : ''}`} 
                  onClick={() => setActivationModal(prev => ({ 
                    ...prev, 
                    mode: 'installation', 
                    cart: [{ id: Date.now(), produit_id: '', quantity: 1, unit_price: 0, matricule: '', date_activation: new Date().toISOString().slice(0,10), price: 0, plan_abonnement: '' }], 
                    rows: [],
                    formError: ''
                  }))}
                >
                  Installation + Activation
                </button>
              </div>

              {activationModal.formError && (
                <div className="error-message">
                  <AlertTriangle size={14} />
                  {activationModal.formError}
                </div>
              )}

              {activationModal.mode === 'simple' ? (
                <>
                  <div style={{ marginBottom: '1rem' }}>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                      Ajoutez une ou plusieurs activations pour ce client
                    </p>
                  </div>
                  
                  {activationModal.rows.map((row, index) => (
                    <div key={row.id} className="activation-item">
                      <div className="activation-item-header">
                        <span className="activation-item-title">Activation #{index + 1}</span>
                        <button 
                          type="button"
                          onClick={() => removeActivationRow(row.id)} 
                          className="remove-btn"
                        >
                          <Trash2 size={12} /> Supprimer
                        </button>
                      </div>
                      <div className="form-grid">
                        <div className="clients-form-group">
                          <label className="clients-label clients-label-required">Date d'activation</label>
                          <input 
                            type="date" 
                            value={row.date} 
                            onChange={e => updateActivationRow(row.id, 'date', e.target.value)} 
                            className="clients-input" 
                          />
                        </div>
                        <div className="clients-form-group">
                          <label className="clients-label clients-label-required">Matricule</label>
                          <input 
                            type="text" 
                            value={row.matricule} 
                            onChange={e => updateActivationRow(row.id, 'matricule', e.target.value)} 
                            className="clients-input" 
                            placeholder="Ex: ABC-123"
                          />
                        </div>
                        <div className="clients-form-group">
                          <label className="clients-label clients-label-required">Prix HT (MAD)</label>
                          <input 
                            type="number" 
                            step="0.01" 
                            value={row.price || ""} 
                            onChange={e => updateActivationRow(row.id, 'price', parseFloat(e.target.value) || 0)} 
                            className="clients-input" 
                            placeholder="0.00"
                          />
                          <small style={{ fontSize: '0.65rem', color: '#6b7280' }}>TVA 20% sera ajoutée automatiquement</small>
                        </div>
                        <div className="clients-form-group">
                          <label className="clients-label">Plan d'abonnement</label>
                          <select 
                            value={row.plan_abonnement} 
                            onChange={e => updateActivationRow(row.id, 'plan_abonnement', e.target.value)} 
                            className="clients-input"
                          >
                            <option value="">-- Sélectionner un plan --</option>
                            {PLAN_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <button onClick={addActivationRow} className="modern-btn modern-btn-secondary" style={{ width: '100%', marginTop: '0.5rem' }}>
                    <Plus size={14} /> Ajouter une activation
                  </button>
                </>
              ) : (
                <>
                  <div style={{ marginBottom: '1rem' }}>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                      Ajoutez des produits avec leurs activations associées
                    </p>
                  </div>
                  
                  {activationModal.cart.map((item, index) => (
                    <div key={item.id} className="activation-item">
                      <div className="activation-item-header">
                        <span className="activation-item-title">Produit #{index + 1}</span>
                        <button 
                          type="button"
                          onClick={() => removeInstallationProduct(item.id)} 
                          className="remove-btn"
                        >
                          <Trash2 size={12} /> Supprimer
                        </button>
                      </div>
                      <div className="form-grid">
                        <div className="clients-form-group">
                          <label className="clients-label clients-label-required">Produit</label>
                          <select 
                            value={item.produit_id} 
                            onChange={e => updateInstallationProduct(item.id, 'produit_id', e.target.value)} 
                            className="clients-input"
                          >
                            <option value="">-- Sélectionner un produit --</option>
                            {activationProducts.map(p => (
                              <option key={p.id} value={p.id}>{p.nom} {p.marque ? `- ${p.marque}` : ''}</option>
                            ))}
                          </select>
                        </div>
                        <div className="clients-form-group">
                          <label className="clients-label clients-label-required">Quantité</label>
                          <input 
                            type="number" 
                            min="1" 
                            value={item.quantity} 
                            onChange={e => updateInstallationProduct(item.id, 'quantity', parseInt(e.target.value) || 1)} 
                            className="clients-input" 
                          />
                        </div>
                        <div className="clients-form-group">
                          <label className="clients-label clients-label-required">Prix unitaire HT (MAD)</label>
                          <input 
                            type="number" 
                            step="0.01" 
                            value={item.unit_price || ""} 
                            onChange={e => updateInstallationProduct(item.id, 'unit_price', parseFloat(e.target.value) || 0)} 
                            className={`clients-input ${item.produit_id && item.unit_price === productPrices[item.produit_id] ? 'price-auto' : ''}`} 
                            placeholder="0.00"
                          />
                        </div>
                        <div className="clients-form-group">
                          <label className="clients-label">Plan d'abonnement</label>
                          <select 
                            value={item.plan_abonnement} 
                            onChange={e => updateInstallationProduct(item.id, 'plan_abonnement', e.target.value)} 
                            className="clients-input"
                          >
                            <option value="">-- Sélectionner un plan --</option>
                            {PLAN_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                          </select>
                        </div>
                        <div className="clients-form-group">
                          <label className="clients-label clients-label-required">Matricule</label>
                          <input 
                            type="text" 
                            value={item.matricule} 
                            onChange={e => updateInstallationProduct(item.id, 'matricule', e.target.value)} 
                            className="clients-input" 
                            placeholder="Ex: ABC-123"
                          />
                        </div>
                        <div className="clients-form-group">
                          <label className="clients-label">Date d'activation</label>
                          <input 
                            type="date" 
                            value={item.date_activation} 
                            onChange={e => updateInstallationProduct(item.id, 'date_activation', e.target.value)} 
                            className="clients-input" 
                          />
                        </div>
                        <div className="clients-form-group">
                          <label className="clients-label">Prix d'activation HT (MAD)</label>
                          <input 
                            type="number" 
                            step="0.01" 
                            value={item.price || ""} 
                            onChange={e => updateInstallationProduct(item.id, 'price', parseFloat(e.target.value) || 0)} 
                            className="clients-input" 
                            placeholder="0.00"
                          />
                          <small style={{ fontSize: '0.65rem', color: '#6b7280' }}>Optionnel - frais d'activation supplémentaires</small>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <button onClick={addInstallationProduct} className="modern-btn modern-btn-secondary" style={{ width: '100%', marginTop: '0.5rem' }}>
                    <Plus size={14} /> Ajouter un produit
                  </button>

                  {/* Summary Section */}
                  <div style={{ 
                    marginTop: '1.5rem', 
                    background: '#f8fafc', 
                    padding: '1rem', 
                    borderRadius: '0.75rem',
                    border: '1px solid #e2e8f0'
                  }}>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem', color: '#1e293b' }}>
                      Récapitulatif
                    </h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.75rem' }}>
                      <span>Sous-total produits HT:</span>
                      <strong>{safeToFixed(calculateInstallationTotals().subtotal)} MAD</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#6b7280', fontSize: '0.75rem' }}>
                      <span>TVA 20%:</span>
                      <span>{safeToFixed(calculateInstallationTotals().tva)} MAD</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px dashed #cbd5e1' }}>
                      <span>Total vente TTC:</span>
                      <strong style={{ color: '#059669' }}>{safeToFixed(calculateInstallationTotals().total)} MAD</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.75rem' }}>
                      <span>Total activation(s) HT:</span>
                      <strong>{safeToFixed(activationModal.cart.reduce((sum, item) => sum + safeNumber(item.price), 0))} MAD</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '2px solid #cbd5e1' }}>
                      <span className="text-green-600 font-bold" style={{ fontSize: '0.875rem' }}>GRAND TOTAL TTC:</span>
                      <span className="text-green-600 font-bold" style={{ fontSize: '0.875rem' }}>
                        {safeToFixed(calculateGrandTotal())} MAD
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="clients-dialog-footer">
              <button 
                onClick={() => setActivationModal(prev => ({ ...prev, isOpen: false }))} 
                className="clients-btn clients-btn-outline" 
                disabled={activationModal.loading}
              >
                Annuler
              </button>
              <button 
                onClick={submitActivationModal} 
                className="clients-btn clients-btn-primary" 
                disabled={activationModal.loading}
              >
                {activationModal.loading ? <Loader size={14} className="spinning" /> : <Save size={14} />}
                {activationModal.loading ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Clients;