// Sales.tsx
import { useMemo, useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Plus, Trash2, Eye, Download, FileText, X, Search, AlertCircle, 
  Edit, Save, Check, CreditCard, DollarSign, Calendar, Clock, User, 
  Phone, Mail, MapPin, Car, Wifi, ChevronLeft, ChevronRight,
  Info, Wallet, Receipt, History, TrendingUp, Loader, RefreshCw,
  CheckCircle, Printer, AlertTriangle, ChevronDown, Package, Filter
} from 'lucide-react';
import companyLogo from './assets/logo.png';

import html2pdf from 'html2pdf.js';

import { ExportMenu } from './ExportMenu';
import {
  selectSales,
  selectSalesLoading,
  selectProducts,
  selectClients,
  fetchSales,
  fetchProducts,
  fetchClients,
  createSale,
  deleteSale,
  createClient,
  fetchSaleStats,
  updateSale,
  confirmSale,
  cancelSale,
  addSalePayment,
  updateSalePayment,
  getSalePaymentHistory,
  updateSalePaymentInfo,
  selectPaymentHistory,
  selectPaymentSummary
} from './Store/store';

// ==================== ENHANCED STYLES ====================
const styles = `
  /* Base Layout */
  .sales-page-header {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  
  @media (min-width: 768px) {
    .sales-page-header {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
    }
  }
  
  .sales-title {
    font-size: 1.5rem;
    font-weight: 700;
    letter-spacing: -0.025em;
    line-height: 1.25;
    color: #111827;
  }
  
  @media (min-width: 768px) {
    .sales-title {
      font-size: 1.875rem;
    }
  }
  
  .sales-subtitle {
    font-size: 0.875rem;
    color: #6b7280;
    margin-top: 0.25rem;
  }
  
  .sales-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .sales-card {
    background: white;
    border-radius: 1rem;
    border: 1px solid #e5e7eb;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
    overflow: hidden;
  }
  
  /* Consolidated Filter Bar (like Activation page) */
  .sales-filter-bar {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .sales-search-wrapper {
    position: relative;
    flex: 3;
    min-width: 300px;
  }
  
  .sales-search-icon {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    width: 1rem;
    height: 1rem;
    color: #9ca3af;
    pointer-events: none;
  }
  
  .sales-search-input {
    width: 100%;
    padding: 0.5rem 0.75rem 0.5rem 2.25rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    outline: none;
    transition: all 0.2s;
  }
  
  .sales-search-input:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }
  
  .sales-filter-select {
    padding: 0.5rem 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    background: white;
    cursor: pointer;
    width: auto;
    min-width: 130px;
  }
  
  .sales-filter-select:focus {
    border-color: #3b82f6;
    outline: none;
  }
  
  .sales-filter-group {
    display: flex;
    gap: 0.5rem;
    flex-shrink: 0;
  }
  
  @media (max-width: 1024px) {
    .sales-search-wrapper {
      flex: 2;
      min-width: 250px;
    }
    .sales-filter-select {
      min-width: 110px;
    }
  }
  
  @media (max-width: 768px) {
    .sales-filter-bar {
      flex-wrap: wrap;
    }
    .sales-search-wrapper {
      flex: 1 1 100%;
      min-width: auto;
    }
    .sales-filter-select {
      flex: 1;
      min-width: auto;
    }
  }
  
  /* ==================== SEARCHABLE SELECT STYLES ==================== */
  .searchable-select {
    position: relative;
    width: 100%;
  }
  
  .searchable-select-trigger {
    width: 100%;
    min-height: 2.75rem;
    padding: 0.5rem 2rem 0.5rem 1rem;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 0.75rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: all 0.2s ease;
    font-size: 0.875rem;
    color: #1e293b;
  }
  
  .searchable-select-trigger:hover {
    border-color: #cbd5e1;
    background: #f8fafc;
  }
  
  .searchable-select-trigger.open {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  .searchable-select-trigger-placeholder {
    color: #94a3b8;
  }
  
  .searchable-select-trigger-value {
    color: #1e293b;
    font-weight: 500;
  }
  
  .searchable-select-icon {
    color: #94a3b8;
    transition: transform 0.2s ease;
  }
  
  .searchable-select-icon.open {
    transform: rotate(180deg);
  }
  
  .searchable-select-dropdown {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 0.75rem;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.02);
    z-index: 1000;
    max-height: 280px;
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
  
  .searchable-select-search {
    position: sticky;
    top: 0;
    padding: 0.75rem;
    border-bottom: 1px solid #e2e8f0;
    background: white;
  }
  
  .searchable-select-search-input {
    width: 100%;
    height: 2.25rem;
    padding: 0.5rem 0.75rem 0.5rem 2rem;
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
    font-size: 0.813rem;
    background: #f8fafc;
    transition: all 0.2s ease;
  }
  
  .searchable-select-search-input:focus {
    outline: none;
    border-color: #3b82f6;
    background: white;
  }
  
  .searchable-select-options {
    max-height: 200px;
    overflow-y: auto;
  }
  
  .searchable-select-option {
    padding: 0.625rem 0.75rem;
    cursor: pointer;
    transition: all 0.15s ease;
    font-size: 0.875rem;
    color: #334155;
    border-bottom: 1px solid #f1f5f9;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  
  .searchable-select-option:hover {
    background: #f1f5f9;
  }
  
  .searchable-select-option.selected {
    background: #eff6ff;
    color: #2563eb;
  }
  
  .searchable-select-option.highlighted {
    background: #e2e8f0;
  }
  
  .searchable-select-option-check {
    color: #3b82f6;
  }
  
  .searchable-select-no-results {
    padding: 1rem;
    text-align: center;
    color: #94a3b8;
    font-size: 0.813rem;
  }
  
  /* Modern Form Styles */
  .modern-form-section {
    background: white;
    border-radius: 1rem;
    padding: 1.25rem;
    margin-bottom: 1rem;
    border: 1px solid #e2e8f0;
    transition: all 0.2s ease;
  }
  
  .modern-form-section:hover {
    border-color: #cbd5e1;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  }
  
  .modern-form-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
    padding-bottom: 0.75rem;
    border-bottom: 2px solid #e2e8f0;
  }
  
  .modern-form-header-icon {
    width: 1.5rem;
    height: 1.5rem;
    color: #3b82f6;
  }
  
  .modern-form-header-title {
    font-size: 1rem;
    font-weight: 600;
    color: #1e293b;
  }
  
  .modern-form-header-subtitle {
    font-size: 0.75rem;
    color: #64748b;
    margin-left: auto;
  }
  
  .modern-form-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  @media (min-width: 640px) {
    .modern-form-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  
  .modern-form-field {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }
  
  .modern-form-label {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #64748b;
  }
  
  .modern-form-label-required::after {
    content: '*';
    color: #ef4444;
    margin-left: 0.25rem;
  }
  
  .modern-input {
    width: 100%;
    padding: 0.625rem 0.875rem;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 0.75rem;
    font-size: 0.875rem;
    color: #1e293b;
    transition: all 0.2s ease;
  }
  
  .modern-input:focus {
    outline: none;
    border-color: #3b82f6;
    background: white;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  .modern-input:hover:not(:focus) {
    background: #f1f5f9;
    border-color: #cbd5e1;
  }
  
  /* Modern Items Table - Responsive Fix */
  .modern-items-container {
    margin-top: 1rem;
    border-radius: 0.75rem;
    overflow: hidden;
    border: 1px solid #e2e8f0;
  }
  
  /* Add horizontal scroll on mobile */
  @media (max-width: 640px) {
    .modern-items-container {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }
    
    .modern-items-table {
      min-width: 480px;
    }
  }
  
  .modern-items-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.813rem;
  }
  
  .modern-items-table th {
    padding: 0.75rem;
    text-align: left;
    background: #f8fafc;
    font-weight: 600;
    color: #475569;
    border-bottom: 1px solid #e2e8f0;
  }
  
  .modern-items-table td {
    padding: 0.75rem;
    border-bottom: 1px solid #f1f5f9;
    vertical-align: middle;
  }
  
  .modern-items-table tr:last-child td {
    border-bottom: none;
  }
  
  .modern-items-table tbody tr:hover {
    background: #faf5ff;
  }
  
  .modern-item-input {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
    font-size: 0.813rem;
    transition: all 0.2s ease;
    min-width: 60px;
  }
  
  .modern-item-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }
  
  /* Better table column widths */
  .modern-items-table th:first-child,
  .modern-items-table td:first-child {
    min-width: 120px;
  }
  
  .modern-items-table th:nth-child(2),
  .modern-items-table td:nth-child(2) {
    min-width: 70px;
  }
  
  .modern-items-table th:nth-child(3),
  .modern-items-table td:nth-child(3) {
    min-width: 90px;
  }
  
  .modern-items-table th:nth-child(4),
  .modern-items-table td:nth-child(4) {
    min-width: 80px;
  }
  
  /* Add Item Row */
  .add-item-row {
    background: #f8fafc;
    padding: 0.875rem;
    border-radius: 0.75rem;
    margin-bottom: 1rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    align-items: flex-end;
  }
  
  .add-item-field {
    flex: 2;
    min-width: 180px;
  }
  
  .add-item-quantity {
    flex: 0.5;
    min-width: 80px;
  }
  
  .add-item-button {
    flex: 0;
    min-width: auto;
  }
  
  @media (max-width: 640px) {
    .add-item-field {
      flex: 1 1 100%;
      min-width: auto;
    }
    .add-item-quantity {
      flex: 1;
      min-width: auto;
    }
  }
  
  /* Modern Payment Section */
  .modern-payment-section {
    background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
    border-radius: 1rem;
    padding: 1.25rem;
    margin-top: 1rem;
    border: 1px solid #bbf7d0;
  }
  
  .modern-payment-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #bbf7d0;
  }
  
  .modern-payment-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
    color: #166534;
  }
  
  /* Modern Total Box */
  .modern-total-box {
    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
    border-radius: 1rem;
    padding: 1.25rem;
    margin-top: 1rem;
  }
  
  .modern-total-row {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem 0;
    font-size: 0.875rem;
    color: #cbd5e1;
  }
  
  .modern-total-final {
    display: flex;
    justify-content: space-between;
    padding-top: 0.75rem;
    margin-top: 0.5rem;
    border-top: 1px solid #334155;
    font-size: 1rem;
    font-weight: 700;
    color: white;
  }
  
  /* Modern Dialog - Mobile Responsive */
  .modern-dialog {
    position: fixed;
    left: 50%;
    top: 50%;
    z-index: 51;
    display: flex;
    flex-direction: column;
    width: 95%;
    max-width: 900px;
    max-height: 90vh;
    overflow-y: auto;
    transform: translate(-50%, -50%);
    background: white;
    border-radius: 1.5rem;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    animation: slideIn 0.3s ease-out;
  }
  
  @media (max-width: 640px) {
    .modern-dialog {
      width: 98%;
      max-height: 95vh;
      border-radius: 1rem;
    }
    
    .modern-dialog-body {
      padding: 1rem;
    }
    
    .modern-dialog-header {
      padding: 1rem;
    }
    
    .modern-dialog-footer {
      padding: 0.75rem 1rem;
      flex-wrap: wrap;
    }
    
    .modern-dialog-footer button {
      flex: 1;
      justify-content: center;
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
  
  .modern-dialog-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid #e2e8f0;
    background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
    border-radius: 1.5rem 1.5rem 0 0;
  }
  
  .modern-dialog-title {
    font-size: 1.25rem;
    font-weight: 700;
    background: linear-gradient(135deg, #2563eb, #1e40af);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  
  .modern-dialog-close {
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.2s ease;
    color: #000000;
    background-color: white;
    border: none;
  }
  
  .modern-dialog-close:hover {
    background: #e2e8f0;
    color: #1e293b;
  }
  
  .modern-dialog-body {
    flex: 1;
    padding: 1.5rem;
    overflow-y: auto;
  }
  
  .modern-dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    padding: 1rem 1.5rem;
    border-top: 1px solid #e2e8f0;
    background: #f8fafc;
    border-radius: 0 0 1.5rem 1.5rem;
  }
  
  /* Modern Buttons */
  .modern-btn {
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
  
  .modern-btn-primary {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
  }
  
  .modern-btn-primary:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
  }
  
  .modern-btn-secondary {
    background: #f1f5f9;
    color: #475569;
    border: 1px solid #e2e8f0;
  }
  
  .modern-btn-secondary:hover:not(:disabled) {
    background: #e2e8f0;
  }
  
  .modern-btn-danger {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    color: white;
  }
  
  .modern-btn-sm {
    padding: 0.375rem 0.75rem;
    font-size: 0.75rem;
  }
  
  /* Toggle Group */
  .modern-toggle-group {
    display: flex;
    gap: 0.25rem;
    background: #f1f5f9;
    padding: 0.25rem;
    border-radius: 0.75rem;
  }
  
  .modern-toggle-btn {
    padding: 0.375rem 1rem;
    border-radius: 0.5rem;
    font-size: 0.813rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    background: transparent;
    border: none;
  }
  
  .modern-toggle-btn-active {
    background: white;
    color: #2563eb;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  }
  
  /* Badge Styles */
  .sales-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 500;
    line-height: 1rem;
  }
  
  .sales-badge-success { background-color: #ecfdf5; color: #059669; }
  .sales-badge-confirmed { background-color: #eff6ff; color: #2563eb; }
  .sales-badge-pending { background-color: #fffbeb; color: #d97706; }
  .sales-badge-cancelled { background-color: #fef2f2; color: #dc2626; }
  .sales-badge-paid { background-color: #ecfdf5; color: #059669; }
  .sales-badge-partial { background-color: #fffbeb; color: #d97706; }
  .sales-badge-unpaid { background-color: #fef2f2; color: #dc2626; }
  .sales-badge-secondary { background-color: #f3f4f6; color: #1f2937; }
  
  /* Overlay */
  .sales-overlay {
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
  
  /* Payment History Table - Responsive */
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
  
  /* Payment Row - Mobile Responsive Fix */
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
    font-size: 0.875rem;
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
    font-size: 0.875rem;
    background: white;
    cursor: pointer;
  }
  
  .btn-add-payment {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    padding: 0 1rem;
    height: 2.5rem;
    border: none;
    border-radius: 0.875rem;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    white-space: nowrap;
  }
  
  /* Mobile responsive for payment row */
  @media (max-width: 640px) {
    .add-payment-row {
      flex-direction: column;
      align-items: stretch;
    }
    
    .add-payment-input {
      width: 100%;
      min-width: auto;
    }
    
    .payment-method-select {
      width: 100%;
    }
    
    .btn-add-payment {
      width: 100%;
      justify-content: center;
    }
  }
  
  /* Payment Summary Cards - Responsive */
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
      font-size: 0.6rem;
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
  
  .sales-grid-2 {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  
  .sales-form-label-sm {
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    color: #6b7280;
    display: block;
    margin-bottom: 0.25rem;
  }
  
  .sales-detail-value {
    font-size: 0.875rem;
    font-weight: 500;
    color: #111827;
  }
  
  .sales-form-section {
    margin-bottom: 1rem;
  }
  
  .sales-form-label {
    font-size: 0.75rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    display: block;
    color: #374151;
  }
  
  .sales-items-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.813rem;
  }
  
  .sales-items-table th,
  .sales-items-table td {
    padding: 0.5rem;
    text-align: left;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .sales-items-table th {
    background: #f9fafb;
    font-weight: 600;
    color: #6b7280;
  }
  
  .sales-total-box {
    background: #f9fafb;
    border-radius: 0.5rem;
    padding: 1rem;
  }
  
  .sales-total-row {
    display: flex;
    justify-content: space-between;
    padding: 0.25rem 0;
    font-size: 0.875rem;
    color: #6b7280;
  }
  
  .sales-total-final {
    display: flex;
    justify-content: space-between;
    padding-top: 0.5rem;
    margin-top: 0.5rem;
    border-top: 1px solid #e5e7eb;
    font-weight: 700;
    font-size: 1rem;
    color: #111827;
  }
  
  .sales-text-right {
    text-align: right;
  }
  
  /* Toast */
  .sales-toast-container {
    position: fixed;
    bottom: 1rem;
    right: 1rem;
    z-index: 100;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .sales-toast {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: white;
    border-radius: 0.5rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    border-left: 4px solid;
    min-width: 280px;
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
  
  .sales-toast-success { border-left-color: #10b981; }
  .sales-toast-success svg { color: #10b981; }
  .sales-toast-error { border-left-color: #ef4444; }
  .sales-toast-error svg { color: #ef4444; }
  .sales-toast-info { border-left-color: #3b82f6; }
  .sales-toast-info svg { color: #3b82f6; }
  
  /* Empty State */
  .sales-empty {
    text-align: center;
    color: #9ca3af;
    padding: 3rem 0;
  }
  
  .spinning {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  /* Confirm Dialog */
  .confirm-overlay {
    position: fixed;
    inset: 0;
    z-index: 100;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    animation: fadeIn 0.3s ease-out;
  }
  
  .confirm-dialog {
    background: white;
    border-radius: 1rem;
    padding: 1.5rem;
    max-width: 32rem;
    width: 90%;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    animation: slideUpScale 0.3s ease-out;
    border: 1px solid #e5e7eb;
  }
  
  @keyframes slideUpScale {
    from {
      opacity: 0;
      transform: translateY(20px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  
  .confirm-title {
    font-size: 1.25rem;
    font-weight: 700;
    margin-bottom: 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  
  .confirm-title-danger { color: #dc2626; }
  .confirm-title-primary { color: #2563eb; }
  
  .confirm-message {
    font-size: 0.95rem;
    color: #4b5563;
    margin-bottom: 1.5rem;
    line-height: 1.6;
    padding: 0.75rem;
    background: #f9fafb;
    border-radius: 0.5rem;
  }
  
  .confirm-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
  }
  
  .confirm-btn {
    padding: 0.625rem 1.25rem;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
  }
  
  .confirm-btn-cancel {
    background: #f3f4f6;
    color: #374151;
    border: 1px solid #e5e7eb;
  }
  
  .confirm-btn-danger {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    color: white;
  }
  
  .confirm-btn-primary {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
  }
  
  /* Table Styles */
  .sales-table-container {
    position: relative;
    width: 100%;
    overflow: auto;
  }
  
  .sales-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
  }
  
  .sales-table thead tr {
    border-bottom: 1px solid #e5e7eb;
    background: #f9fafb;
  }
  
  .sales-table th {
    height: 3rem;
    padding: 0 1rem;
    text-align: left;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    color: #6b7280;
  }
  
  .sales-table tbody tr {
    border-bottom: 1px solid #f3f4f6;
    transition: all 0.2s ease;
  }
  
  .sales-table tbody tr:hover {
    background-color: #f9fafb;
  }
  
  .sales-table td {
    padding: 1rem;
    vertical-align: middle;
  }
  
  .sales-table .font-mono {
    font-family: monospace;
    font-weight: 500;
  }
  
  .sales-table .text-right {
    text-align: right;
  }
  
  /* Pagination Styles */
  .sales-pagination-container {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem;
    border-top: 1px solid #e5e7eb;
  }
  
  .sales-pagination-btn {
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
  
  .sales-pagination-btn:hover:not(:disabled) {
    background: #f9fafb;
    border-color: #9ca3af;
    transform: translateY(-1px);
  }
  
  .sales-pagination-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .sales-pagination-info {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    color: #6b7280;
  }
  
  .sales-pagination-active {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
    border-color: #3b82f6;
  }
  
  .sales-loading {
    text-align: center;
    padding: 3rem 0;
  }
  
  .sales-loading-spinner {
    display: inline-block;
    width: 2.5rem;
    height: 2.5rem;
    border: 3px solid #e5e7eb;
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  
  .sales-actions-cell {
    display: flex;
    gap: 0.25rem;
    justify-content: flex-end;
  }
  
  .sales-btn-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.375rem;
    border-radius: 0.5rem;
    background: transparent;
    border: none;
    cursor: pointer;
    color: #6b7280;
  }
  
  .sales-btn-icon:hover {
    background-color: #f3f4f6;
    color: #374151;
  }
  
  .sales-btn-outline {
    padding: 0.5rem 1rem;
    border: 1px solid #d1d5db;
    background: white;
    border-radius: 0.875rem;
    cursor: pointer;
  }
  
  .sales-btn-primary {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
  }
  
  .sales-dialog {
    position: fixed;
    left: 50%;
    top: 50%;
    z-index: 51;
    display: grid;
    width: 95%;
    max-width: 900px;
    max-height: 90vh;
    overflow-y: auto;
    transform: translate(-50%, -50%);
    gap: 1rem;
    background: white;
    padding: 1.5rem;
    border-radius: 1rem;
  }
  
  .sales-dialog-sm {
    max-width: 42rem;
  }
  
  .sales-dialog-title {
    font-size: 1.25rem;
    font-weight: 600;
  }
  
  .sales-dialog-footer {
    display: flex;
    flex-direction: column-reverse;
    gap: 0.75rem;
  }
  
  @media (min-width: 640px) {
    .sales-dialog-footer {
      flex-direction: row;
      justify-content: flex-end;
    }
  }
  
  .text-right {
    text-align: right;
  }
  
  .text-green-600 { color: #16a34a; }
  .text-orange-500 { color: #f97316; }
  .font-semibold { font-weight: 600; }
  
  .payment-badge-cash { background: #dbeafe; color: #1e40af; }
  .payment-badge-card { background: #e0e7ff; color: #3730a3; }
  .payment-badge-check { background: #fef3c7; color: #92400e; }
  .payment-badge-bank_transfer { background: #e0f2fe; color: #075985; }
  .payment-badge-other { background: #f3e8ff; color: #6b21a5; }
  
  .btn-delete-payment {
    background: #ef4444;
    color: white;
    padding: 0.25rem 0.5rem;
    border: none;
    border-radius: 0.5rem;
    font-size: 0.7rem;
    cursor: pointer;
  }
  
  .btn-update-payment {
    background: #3b82f6;
    color: white;
    padding: 0.25rem 0.5rem;
    border: none;
    border-radius: 0.5rem;
    font-size: 0.7rem;
    cursor: pointer;
  }

  /* Product Owner Section Styles */
  .product-owner-group {
    display: flex;
    gap: 1rem;
    background: #f8fafc;
    padding: 1rem;
    border-radius: 0.75rem;
    margin-bottom: 1rem;
  }
  
  .product-owner-option {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid #e2e8f0;
    background: white;
  }
  
  .product-owner-option.selected {
    border-color: #3b82f6;
    background: #eff6ff;
    color: #2563eb;
  }
  
  .product-owner-option.amg.selected {
    border-color: #3b82f6;
    background: #eff6ff;
  }
  
  .product-owner-option.client.selected {
    border-color: #10b981;
    background: #ecfdf5;
    color: #059669;
  }
  
  .client-info-box {
    background: #fef3c7;
    border: 1px solid #fde68a;
    border-radius: 0.75rem;
    padding: 1rem;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  
  .client-info-icon {
    color: #d97706;
    flex-shrink: 0;
  }
  
  .client-info-text {
    font-size: 0.875rem;
    color: #92400e;
  }
`;

// ==================== SEARCHABLE SELECT COMPONENT ====================
const SearchableSelect = ({ 
  options, 
  value, 
  onChange, 
  placeholder = "Sélectionner...",
  disabled = false,
  renderOption = null
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  
  const selectedOption = options.find(opt => opt.id === value);
  
  const filteredOptions = options.filter(opt => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      (opt.nom?.toLowerCase().includes(searchLower)) ||
      (opt.name?.toLowerCase().includes(searchLower)) ||
      (opt.telephone?.toLowerCase().includes(searchLower)) ||
      (opt.email?.toLowerCase().includes(searchLower)) ||
      (opt.ice_client?.toString().toLowerCase().includes(searchLower)) ||
      (opt.marque?.toLowerCase().includes(searchLower)) ||
      (opt.id?.toString().includes(searchLower))
    );
  });
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
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
    onChange(option.id);
    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(-1);
  };
  
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        setIsOpen(true);
      }
      return;
    }
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
        break;
    }
  };
  
  const defaultRenderOption = (option) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      <span style={{ fontWeight: 500 }}>{option.nom || option.name}</span>
      {option.ice_client && (
        <span style={{ fontSize: '0.7rem', color: '#64748b' }}>ICE: {option.ice_client}</span>
      )}
      {option.telephone && (
        <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{option.telephone}</span>
      )}
      {option.email && (
        <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{option.email}</span>
      )}
      {option.marque && (
        <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
          {option.marque} - {safeToFixed(option.prix_vente || option.prix)} MAD
        </span>
      )}
    </div>
  );
  
  return (
    <div className="searchable-select" ref={containerRef} onKeyDown={handleKeyDown}>
      <div 
        className={`searchable-select-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{ cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1 }}
      >
        <span className={selectedOption ? 'searchable-select-trigger-value' : 'searchable-select-trigger-placeholder'}>
          {selectedOption ? (selectedOption.nom || selectedOption.name) : placeholder}
        </span>
        <ChevronDown size={16} className={`searchable-select-icon ${isOpen ? 'open' : ''}`} />
      </div>
      
      {isOpen && !disabled && (
        <div className="searchable-select-dropdown">
          <div className="searchable-select-search">
            <input
              ref={searchInputRef}
              type="text"
              className="searchable-select-search-input"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="searchable-select-options">
            {filteredOptions.length === 0 ? (
              <div className="searchable-select-no-results">
                Aucun résultat trouvé
              </div>
            ) : (
              filteredOptions.map((option, index) => (
                <div
                  key={option.id}
                  className={`searchable-select-option ${selectedOption?.id === option.id ? 'selected' : ''} ${highlightedIndex === index ? 'highlighted' : ''}`}
                  onClick={() => handleSelect(option)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  {renderOption ? renderOption(option) : defaultRenderOption(option)}
                  {selectedOption?.id === option.id && (
                    <Check size={16} className="searchable-select-option-check" />
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

// ==================== TOAST COMPONENT ====================
const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [onClose]);
  
  const Icon = type === 'success' ? CheckCircle : type === 'error' ? AlertCircle : Info;
  
  return (
    <div className={`sales-toast sales-toast-${type}`}>
      <Icon size={20} />
      <span className="sales-toast-message">{message}</span>
      <button className="sales-toast-close" onClick={onClose}>
        <X size={16} />
      </button>
    </div>
  );
};

// ==================== CONFIRM DIALOG ====================
const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirmer", cancelText = "Annuler", variant = "primary", loading = false }) => {
  if (!isOpen) return null;
  
  const isDestructive = variant === "destructive";
  
  return (
    <div className="confirm-overlay" onClick={onClose}>
      <div className={`confirm-dialog ${isDestructive ? 'confirm-destructive' : 'confirm-primary'}`} onClick={(e) => e.stopPropagation()}>
        <div className={`confirm-title ${isDestructive ? 'confirm-title-danger' : 'confirm-title-primary'}`}>
          {isDestructive ? <AlertTriangle size={24} /> : <CheckCircle size={24} />}
          {title || (isDestructive ? 'Confirmer la suppression' : 'Confirmation')}
        </div>
        <div className="confirm-message">
          {message}
        </div>
        <div className="confirm-actions">
          <button className="confirm-btn confirm-btn-cancel" onClick={onClose} disabled={loading}>
            {cancelText}
          </button>
          <button 
            className={`confirm-btn ${isDestructive ? 'confirm-btn-danger' : 'confirm-btn-primary'}`} 
            onClick={onConfirm}
            disabled={loading}
          >
            {loading && <div className="confirm-loading-spinner" />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================== HELPER FUNCTIONS ====================
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

const API_URL = window.REACT_APP_API_URL || "https://amg-telecom-backd-production.up.railway.app/api";

const safeNumber = (value) => {
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

const safeToFixed = (value, decimals = 2) => {
  return safeNumber(value).toFixed(decimals);
};

// ==================== PAYMENT HISTORY MODAL (MOVED OUTSIDE SALES) ====================
const PaymentHistoryModal = ({ 
  isOpen, 
  sale, 
  onClose,
  onPaymentChange,
  showToast ,
  showConfirm
}) => {
  const [editPaymentId, setEditPaymentId] = useState(null);
  const [editPaymentAmount, setEditPaymentAmount] = useState('');
  const [editPaymentMethod, setEditPaymentMethod] = useState('');
  const [editPaymentReference, setEditPaymentReference] = useState('');
  const [updatingPayment, setUpdatingPayment] = useState(null);
  const [deletingPayment, setDeletingPayment] = useState(null);
  
  const [localPaymentAmount, setLocalPaymentAmount] = useState('');
  const [localPaymentMethod, setLocalPaymentMethod] = useState('cash');
  const [localPaymentReference, setLocalPaymentReference] = useState('');
  const [localAddingPayment, setLocalAddingPayment] = useState(false);
  const [localPayments, setLocalPayments] = useState([]);
  const [localTotal, setLocalTotal] = useState(0);
  const [localAmountPaid, setLocalAmountPaid] = useState(0);
  const [localRemaining, setLocalRemaining] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const loadPayments = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/ventes/${sale.id}/payments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        
        setLocalPayments(data.payment_history || data.payments || []);
        
        let total = 0;
        let amountPaid = 0;
        let remaining = 0;
        
        if (data.vente) {
          total = safeNumber(data.vente.total);
          amountPaid = safeNumber(data.vente.amount_paid);
          remaining = safeNumber(data.vente.remaining_amount);
        } else if (data.sale) {
          total = safeNumber(data.sale.total);
          amountPaid = safeNumber(data.sale.amount_paid);
          remaining = safeNumber(data.sale.remaining_amount);
        } else if (data.total !== undefined) {
          total = safeNumber(data.total);
          amountPaid = safeNumber(data.amount_paid || 0);
          remaining = safeNumber(data.remaining_amount || (total - amountPaid));
        } else {
          const payments = data.payment_history || data.payments || [];
          const totalPayments = payments.reduce((sum, p) => sum + safeNumber(p.amount), 0);
          amountPaid = totalPayments;
          
          const saleResponse = await fetch(`${API_URL}/ventes/${sale.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (saleResponse.ok) {
            const saleData = await saleResponse.json();
            total = safeNumber(saleData.total);
            remaining = total - amountPaid;
          }
        }
        
        setLocalTotal(total);
        setLocalAmountPaid(amountPaid);
        setLocalRemaining(remaining);
        setHasLoaded(true);
      }
    } catch (err) {
      console.error('Error loading payments:', err);
      if (showToast) showToast('Erreur lors du chargement des paiements', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && sale?.id && !hasLoaded) {
      loadPayments();
    }
    if (!isOpen) {
      setHasLoaded(false);
    }
  }, [isOpen, sale?.id]);

  const handleAddPayment = async () => {
    if (!localPaymentAmount || parseFloat(localPaymentAmount) <= 0) {
      if (showToast) showToast('Montant invalide', 'error');
      return;
    }
    
    const amount = parseFloat(localPaymentAmount);
    if (amount > localRemaining) {
      if (showToast) showToast(`Le montant ne peut pas dépasser ${safeToFixed(localRemaining)} MAD`, 'error');
      return;
    }
    
    setLocalAddingPayment(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/ventes/${sale.id}/payments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: amount,
          method: localPaymentMethod,
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

  const handleUpdatePayment = async (paymentId, amount, method, reference) => {
    if (!amount || parseFloat(amount) <= 0) {
      if (showToast) showToast('Montant invalide', 'error');
      return;
    }
    
    setUpdatingPayment(paymentId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/ventes/${sale.id}/payments/${paymentId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          amount: parseFloat(amount), 
          method, 
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
          const response = await fetch(`${API_URL}/ventes/${sale.id}/payments/${paymentId}`, {
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
    setEditPaymentReference(payment.reference || '');
  };

  const cancelEditPayment = () => {
    setEditPaymentId(null);
    setEditPaymentAmount('');
    setEditPaymentMethod('');
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

  if (!isOpen || !sale) return null;

  return (
    <div className="sales-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="sales-dialog" style={{ maxWidth: '700px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 className="sales-dialog-title">
            Gestion des paiements - Vente #{sale.id}
          </h2>
          <button onClick={onClose} className="modern-dialog-close">
            <X size={20} />
          </button>
        </div>
        
        {isLoading && !hasLoaded ? (
          <div className="sales-loading">
            <div className="sales-loading-spinner"></div>
            <p>Chargement des paiements...</p>
          </div>
        ) : (
          <>
            <div className="payment-summary-grid" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-around' }}>
              <div className="payment-summary-card">
                <div className="payment-summary-label">Total TTC</div>
                <div className="payment-summary-value">{safeToFixed(localTotal)} MAD</div>
              </div>
              <div className="payment-summary-card">
                <div className="payment-summary-label">Déjà payé</div>
                <div className="payment-summary-value paid">{safeToFixed(localAmountPaid)} MAD</div>
              </div>
              <div className="payment-summary-card">
                <div className="payment-summary-label">Reste à payer</div>
                <div className="payment-summary-value remaining">{safeToFixed(localRemaining)} MAD</div>
              </div>
            </div>

            {localPayments && localPayments.length > 0 ? (
              <table className="payment-history-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Montant</th>
                    <th>Méthode</th>
                    <th>Référence</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {localPayments.map((payment, idx) => (
                    <tr key={payment.id || idx}>
                      <td>{new Date(payment.date || payment.created_at).toLocaleString('fr-FR')}</td>
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
                          `${safeToFixed(payment.amount)} MAD`
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
                        {editPaymentId === payment.id ? (
                          <div style={{ display: 'flex', gap: '0.25rem' }}>
                            <button 
                              onClick={() => handleUpdatePayment(payment.id, editPaymentAmount, editPaymentMethod, editPaymentReference)}
                              className="btn-update-payment"
                              disabled={updatingPayment !== null}
                            >
                              Sauver
                            </button>
                            <button onClick={cancelEditPayment} className="sales-btn-outline" style={{ padding: '0.25rem', fontSize: '0.7rem' }}>
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
              <div className="sales-empty">
                <Receipt size={32} />
                <p>Aucun paiement enregistré</p>
              </div>
            )}

            <div style={{ marginTop: '1.5rem', borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
              <div style={{ marginBottom: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CreditCard size={16} />
                Ajouter un nouveau paiement
              </div>
              <div className="add-payment-row" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <input 
                  type="number" 
                  step="0.01" 
                  placeholder="Montant" 
                  value={localPaymentAmount} 
                  onChange={(e) => setLocalPaymentAmount(e.target.value)} 
                  className="add-payment-input" 
                  style={{ flex: 1 }} 
                />
                <select 
                  value={localPaymentMethod} 
                  onChange={(e) => setLocalPaymentMethod(e.target.value)} 
                  className="payment-method-select"
                  style={{ flex: 1 }}
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
                  style={{ flex: 1 }} 
                />
                <button 
                  onClick={handleAddPayment} 
                  disabled={localAddingPayment || !localPaymentAmount || parseFloat(localPaymentAmount) <= 0 || parseFloat(localPaymentAmount) > localRemaining} 
                  className="btn-add-payment"
                  style={{ padding: '0.5rem 1.5rem' }}
                >
                  {localAddingPayment ? <Loader size={14} className="spinning" /> : <><Plus size={14} /> Ajouter</>}
                </button>
              </div>
              {localPaymentAmount && parseFloat(localPaymentAmount) > localRemaining && localRemaining > 0 && (
                <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                  Le montant dépasse le reste à payer ({safeToFixed(localRemaining)} MAD)
                </div>
              )}
            </div>
          </>
        )}

        <div className="sales-dialog-footer" style={{ marginTop: '1rem' }}>
          <button onClick={onClose} className="sales-btn-outline">
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================== SUB-COMPONENTS ====================
const PageHeader = ({ title, subtitle, actions }) => (
  <div className="sales-page-header">
    <div>
      <h1 className="sales-title">{title}</h1>
      {subtitle && <p className="sales-subtitle">{subtitle}</p>}
    </div>
    {actions && <div className="sales-actions">{actions}</div>}
  </div>
);

const Card = ({ children, className = '' }) => (
  <div className={`sales-card ${className}`}>{children}</div>
);

const Badge = ({ children, variant = 'default' }) => {
  const variantClass = variant === 'success' ? 'sales-badge-success' :
                       variant === 'confirmed' ? 'sales-badge-confirmed' :
                       variant === 'pending' ? 'sales-badge-pending' :
                       variant === 'cancelled' ? 'sales-badge-cancelled' :
                       variant === 'paid' ? 'sales-badge-paid' :
                       variant === 'partial' ? 'sales-badge-partial' :
                       variant === 'unpaid' ? 'sales-badge-unpaid' :
                       'sales-badge-secondary';
  return <span className={`sales-badge ${variantClass}`}>{children}</span>;
};

const LoadingSpinner = () => (
  <div className="sales-loading">
    <div className="sales-loading-spinner"></div>
    <p style={{ marginTop: '1rem', color: '#6b7280' }}>Chargement des ventes...</p>
  </div>
);

// ==================== MAIN COMPONENT ====================
const Sales = () => {
  const dispatch = useDispatch();
  
  // ---- Redux State ----
  const sales = useSelector(selectSales);
  const salesLoading = useSelector(selectSalesLoading);
  const products = useSelector(selectProducts);
  const clients = useSelector(selectClients);
  
  // ---- User Role State ----
  const [userRole, setUserRole] = useState(null);
  
  // ---- UI State ----
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(null);
  const [editingSale, setEditingSale] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [selectedSaleForHistory, setSelectedSaleForHistory] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [toasts, setToasts] = useState([]);
  
  // ---- New: Product Owner State ----
  const [productOwner, setProductOwner] = useState('amg'); // 'amg' or 'client'
  
  // ---- Delete Confirm State ----
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, saleId: null, saleInfo: '' });
  const [deletingSale, setDeletingSale] = useState(false);
  
  // ---- Custom Confirm Dialog State ----
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirmer',
    cancelText: 'Annuler',
    variant: 'primary',
    onConfirm: null,
    loading: false
  });
  
  // ---- Form State ----
  const [items, setItems] = useState([]);
  const [productId, setProductId] = useState('');
  const [qty, setQty] = useState(1);
  const [clientMode, setClientMode] = useState('existing');
  const [clientId, setClientId] = useState('');
  const [newClient, setNewClient] = useState({ 
    nom: '', telephone: '', email: '', adresse: '', ice_client: '' 
  });
  const [paymentStatus, setPaymentStatus] = useState('unpaid');
  const [saleStatus, setSaleStatus] = useState('pending');
  const [selectedGpsDevices, setSelectedGpsDevices] = useState([]);
  
  // ---- Payment Form State ----
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [addingPayment, setAddingPayment] = useState(false);
  const [paymentDueDate, setPaymentDueDate] = useState('');
  
  // ---- Pagination and Filters ----
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // ---- Reset product state when owner changes ----
  useEffect(() => {
    // Clear items when switching to client mode
    if (productOwner === 'client') {
      setItems([]);
      setProductId('');
      setQty(1);
    }
  }, [productOwner]);

  // ---- Toast Management ----
  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };
  
  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };
  
  // ---- Custom Confirm Helper ----
  const showConfirm = (title, message, onConfirm, variant = 'primary', confirmText = 'Confirmer', cancelText = 'Annuler') => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      confirmText,
      cancelText,
      variant,
      loading: false,
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, loading: true }));
        try {
          await onConfirm();
        } finally {
          setConfirmDialog(prev => ({ ...prev, isOpen: false, loading: false }));
        }
      }
    });
  };

  // ---- Fetch User Role on Mount ----
  useEffect(() => {
    const getUserRole = () => {
      try {
        const user = localStorage.getItem('user');
        if (user) {
          const userData = JSON.parse(user);
          setUserRole(userData.role);
        }
      } catch (e) {
        console.error('Error parsing user data:', e);
        setUserRole(null);
      }
    };
    getUserRole();
  }, []);

  // ---- Data Fetching ----
  useEffect(() => {
    dispatch(fetchSales());
    dispatch(fetchProducts());
    dispatch(fetchClients());
  }, [dispatch, refreshTrigger]);

  // ---- Helper: Check if user is admin or superadmin ----
  const isAdminOrSuperAdmin = () => {
    return userRole === 'admin' || userRole === 'superadmin';
  };
  
  // ---- Helper: Check if actions should be shown for a sale ----
  const shouldShowActionsForSale = (sale) => {
    if (userRole === 'user') {
      return sale.status === 'pending';
    }
    if (sale.status === 'confirmed') {
      return isAdminOrSuperAdmin();
    }
    return true;
  };

  // ---- Refresh Sales Data after Payment Changes ----
  const handlePaymentChange = () => {
    dispatch(fetchSales());
    setRefreshTrigger(prev => prev + 1);
  };

  // ---- Form Reset & Helpers ----
  const reset = () => {
    setItems([]);
    setProductId('');
    setQty(1);
    setClientId('');
    setClientMode('existing');
    setNewClient({ nom: '', telephone: '', email: '', adresse: '', ice_client: '' });
    setPaymentStatus('unpaid');
    setSaleStatus('pending');
    setPaymentAmount('');
    setPaymentMethod('cash');
    setPaymentReference('');
    setPaymentNotes('');
    setPaymentDueDate('');
    setSelectedGpsDevices([]);
    setIsEditingMode(false);
    setEditingSale(null);
    setProductOwner('amg'); // Reset to AMG
  };

  const loadSaleForEditing = (sale) => {
    setIsEditingMode(true);
    setEditingSale(sale);
    setClientMode('existing');
    setClientId(sale.client_id);
    setSaleStatus(sale.status);
    setPaymentStatus(sale.payment_status);
    setPaymentDueDate(sale.payment_due_date || '');
    setPaymentMethod(sale.payment_method || 'cash');
    const saleItems = (sale.produits || []).map(produit => ({
      productId: produit.id,
      name: produit.nom,
      quantity: produit.pivot?.quantite || 1,
      unitPrice: safeNumber(produit.pivot?.prix || produit.prix_vente || produit.prix),
      categorie: produit.categorie,
      originalPrice: safeNumber(produit.prix_vente || produit.prix)
    }));
    setItems(saleItems);
    if (sale.gpsDevices && sale.gpsDevices.length > 0) {
      setSelectedGpsDevices(sale.gpsDevices);
    }
    // For editing, we check if the sale has products - if yes, it's likely AMG, but we'll set based on existing items
    setProductOwner(saleItems.length > 0 ? 'amg' : 'client');
    setOpen(true);
  };

  // ---- Cart Management ----
  const addItem = () => {
    const p = products.find(x => x.id === parseInt(productId));
    if (!p) {
      showToast('Sélectionnez un produit', 'error');
      return;
    }
    if (qty < 1) {
      showToast('Quantité invalide', 'error');
      return;
    }
    if (p.categorie !== 'GPS') {
      const existingItem = items.find(i => i.productId === p.id);
      const currentQuantityInCart = existingItem ? existingItem.quantity : 0;
      const newTotalQuantity = currentQuantityInCart + qty;
      if (newTotalQuantity > (p.stock || 0)) {
        showToast(`Stock insuffisant (${p.stock || 0} disponibles)`, 'error');
        return;
      }
    }
    setItems(prev => {
      const exist = prev.find(i => i.productId === p.id);
      if (exist) {
        return prev.map(i => i.productId === p.id ? { ...i, quantity: i.quantity + qty } : i);
      }
      return [...prev, {
        productId: p.id,
        name: p.nom,
        quantity: qty,
        unitPrice: safeNumber(p.prix_vente || p.prix),
        categorie: p.categorie,
        originalPrice: safeNumber(p.prix_vente || p.prix)
      }];
    });
    setProductId('');
    setQty(1);
  };

  const updateQuantity = (id, value) => {
    const val = parseInt(value) || 1;
    setItems(prev => prev.map(i => i.productId === id ? { ...i, quantity: val } : i));
  };

  const updatePrice = (id, value) => {
    const val = parseFloat(value) || 0;
    setItems(prev => prev.map(i => i.productId === id ? { ...i, unitPrice: val } : i));
  };

  const removeItem = (id) => {
    setItems(prev => prev.filter(i => i.productId !== id));
  };

  // ---- Sale Actions ----
  const handleConfirmSale = async (id) => {
    showConfirm(
      'Confirmer la vente',
      <div>
        Êtes-vous sûr de vouloir confirmer cette vente ?<br />
        <span style={{ color: '#2563eb', fontSize: '0.875rem' }}>
          Cette action va valider la vente et mettre à jour les stocks.
        </span>
      </div>,
      async () => {
        setLoading(true);
        try {
          await dispatch(confirmSale(id)).unwrap();
          showToast('Vente confirmée avec succès', 'success');
          dispatch(fetchSales());
        } catch (err) {
          showToast(err.message || 'Erreur lors de la confirmation', 'error');
        } finally {
          setLoading(false);
        }
      },
      'primary',
      'Confirmer la vente',
      'Annuler'
    );
  };

  const handleCancelSale = async (id) => {
    showConfirm(
      'Annuler la vente',
      <div>
        Êtes-vous sûr de vouloir annuler cette vente ?<br />
        <span style={{ color: '#dc2626', fontSize: '0.875rem' }}>
          ⚠️ Cette action va annuler la vente et remettre les produits en stock.
        </span>
      </div>,
      async () => {
        setLoading(true);
        try {
          await dispatch(cancelSale(id)).unwrap();
          showToast('Vente annulée', 'success');
          dispatch(fetchSales());
        } catch (err) {
          showToast(err.message || "Erreur lors de l'annulation", 'error');
        } finally {
          setLoading(false);
        }
      },
      'destructive',
      'Annuler la vente',
      'Retour'
    );
  };

  const handleDeleteSale = async () => {
    const { saleId, saleInfo } = deleteConfirm;
    if (!saleId) return;
    
    setDeletingSale(true);
    try {
      await dispatch(deleteSale(saleId)).unwrap();
      showToast('Vente supprimée avec succès', 'success');
      dispatch(fetchSales());
      setDeleteConfirm({ isOpen: false, saleId: null, saleInfo: '' });
    } catch (err) {
      showToast(err.message || 'Erreur lors de la suppression', 'error');
    } finally {
      setDeletingSale(false);
    }
  };
  
  const openDeleteConfirm = (saleId, saleInfo) => {
    setDeleteConfirm({ isOpen: true, saleId, saleInfo });
  };

  const handleUpdateSale = async () => {
    setLoading(true);
    setError(null);
    try {
      const productsData = items.map(item => ({
        id: item.productId,
        quantite: item.quantity,
        prix: item.unitPrice
      }));
      const payload = {
        client_id: clientId,
        status: saleStatus,
        payment_status: paymentStatus,
        payment_due_date: paymentDueDate || null,
        payment_method: paymentMethod,
        produits: productsData
      };
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/ventes/${editingSale.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Erreur lors de la mise à jour');
      }
      showToast('Vente mise à jour avec succès', 'success');
      reset();
      setOpen(false);
      dispatch(fetchSales());
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Erreur de mise à jour', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Replace the submit function in your Sales component with this:

const submit = async () => {
  // For client product owner, we don't need items
  if (productOwner === 'amg' && items.length === 0) {
    showToast('Ajoutez au moins un produit', 'error');
    return;
  }
  
  if (isEditingMode) {
    await handleUpdateSale();
    return;
  }
  
  setLoading(true);
  setError(null);
  try {
    let finalClientId = clientId;
    if (clientMode === 'new') {
      if (!newClient.nom || !newClient.telephone) {
        showToast('Nom et téléphone du client requis', 'error');
        setLoading(false);
        return;
      }
      const clientData = {
        nom: newClient.nom,
        telephone: newClient.telephone,
        email: newClient.email || null,
        adresse: newClient.adresse || null,
        ice_client: newClient.ice_client || null
      };
      const result = await dispatch(createClient(clientData)).unwrap();
      finalClientId = result.id;
      showToast(`Client "${newClient.nom}" créé avec succès`, 'success');
    } else if (!clientId) {
      showToast('Sélectionnez un client', 'error');
      setLoading(false);
      return;
    }
    
    let productsData = [];
    // For AMG: send the items
    if (productOwner === 'amg') {
      productsData = items.map(item => ({
        id: item.productId,
        quantite: item.quantity,
        prix: item.unitPrice
      }));
    }
    // For client product owner, send empty array
    // (backend will handle this - no products attached)
    
    const saleData = {
      client_id: finalClientId,
      product_owner: productOwner, // IMPORTANT: Add this field
      produits: productsData,
      status: saleStatus,
      payment_due_date: paymentDueDate || null,
      payment_method: paymentMethod,
      initial_payment: paymentStatus !== 'unpaid' ? (parseFloat(paymentAmount) || 0) : 0,
    };
    
    // REMOVED: gps_devices, is_client_sale (these fields don't exist in backend)
    
    console.log('Sending sale data:', saleData); // Debug log
    
    await dispatch(createSale(saleData)).unwrap();
    showToast(`Vente ${productOwner === 'client' ? 'client' : ''} créée avec succès`, 'success');
    reset();
    setOpen(false);
    dispatch(fetchSales());
  } catch (err) {
    console.error('Sale creation error:', err);
    // Show detailed validation errors if available
    if (err.response?.data?.errors) {
      const errorMessages = Object.values(err.response.data.errors).flat().join(', ');
      showToast(`Erreur: ${errorMessages}`, 'error');
    } else {
      showToast(err.message || 'Erreur lors de la création de la vente', 'error');
    }
    setError(err.message || 'Erreur lors de la création de la vente');
  } finally {
    setLoading(false);
  }
};

  // ---- Invoice Generation ----
  const getLogoBase64 = async () => {
    try {
      const response = await fetch(companyLogo);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      return null;
    }
  };

  const generateInvoiceHTML = (sale, companyInfo, logoBase64 = null) => {
    const saleItems = sale.items || sale.produits || [];
    const totalAmount = safeNumber(sale.total);
    const subtotalCalc = sale.subtotal || (totalAmount / 1.2);
    const tvaCalc = sale.tva || (totalAmount - subtotalCalc);
    const amountPaid = safeNumber(sale.amount_paid);
    const remainingAmount = safeNumber(sale.remaining_amount || (totalAmount - amountPaid));

    const formatFrenchAmount = (total) => {
      const integerPart = Math.floor(total);
      const convertLessThanOneThousand = (n) => {
        const units = ['', 'UN', 'DEUX', 'TROIS', 'QUATRE', 'CINQ', 'SIX', 'SEPT', 'HUIT', 'NEUF'];
        const teens = ['DIX', 'ONZE', 'DOUZE', 'TREIZE', 'QUATORZE', 'QUINZE', 'SEIZE', 'DIX-SEPT', 'DIX-HUIT', 'DIX-NEUF'];
        const tens = ['', 'DIX', 'VINGT', 'TRENTE', 'QUARANTE', 'CINQUANTRE', 'SOIXANTE', 'SOIXANTE-DIX', 'QUATRE-VINGT', 'QUATRE-VINGT-DIX'];
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
          n %= 100;
        }
        if (n > 0) {
          words += convertLessThanOneThousand(n);
        }
        return words.trim();
      };
      return convertToWords(integerPart) + ' DIRHAMS';
    };

    const invoiceDate = sale.created_at ? new Date(sale.created_at).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR');
    const invoiceNumber = sale.facture_numero || `011/${new Date().getFullYear()}`;

    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>Facture N° ${invoiceNumber}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Plus Jakarta Sans', sans-serif;
            color: #1e293b;
            background-color: #ffffff;
            line-height: 1.5;
            padding: 35px 40px;
            font-size: 12px;
          }
          .invoice-container { max-width: 850px; margin: 0 auto; max-height: 100%; box-sizing: border-box; page-break-inside: avoid; }
          .header-top { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 25px; }
          .logo-wrapper { width: 130px; height: 130px; display: flex; align-items: center; justify-content: center; overflow: hidden; border-radius: 8px; }
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
          .invoice-table tr:last-child td { border-bottom: 1px solid #334155; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .text-cas { text-align: center; }
          .summary-container { display: grid; grid-template-columns: 1.12fr 0.88fr; gap: 40px; align-items: start; margin-bottom: 25px; }
          .legal-wordings { border-left: 2px solid #e2e8f0; padding-left: 18px; margin-top: 5px; }
          .wording-label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.05em; margin-bottom: 4px; }
          .wording-value { font-family: 'Playfair Display', serif; font-size: 14px; font-style: italic; color: #334155; font-weight: 600; line-height: 1.4; }
          .financial-math { width: 100%; border-collapse: collapse; }
          .financial-math td { padding: 6px 8px; font-size: 12px; color: #475569; }
          .financial-math tr.premium-total td { font-size: 16px; font-weight: 700; color: #0f172a; border-top: 1px solid #e2e8f0; padding-top: 10px; padding-bottom: 10px; }
          .payment-routing { border-top: 1px solid #e2e8f0; padding-top: 15px; margin-bottom: 30px; }
          .routing-title { font-size: 11px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px; }
          .routing-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; font-size: 11px; color: #475569; }
          .routing-item strong { color: #0f172a; display: block; margin-bottom: 2px; }
          .executive-footer { border-top: 2px solid #0f172a; padding-top: 15px; text-align: center; font-size: 10px; color: #64748b; line-height: 1.6; }
          .executive-footer .footer-company-name { font-weight: 700; color: #0f172a; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.05em; }
          .bank-info { margin-top: 12px; font-size: 11px; color: #475569; border-top: 1px dashed #e2e8f0; padding-top: 10px; }
          .bank-info strong { color: #0f172a; }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="header-top">
            <div class="logo-wrapper">
              ${logoBase64 ? `<img src="${logoBase64}" alt="Logo" class="invoice-logo"/>` : `<span class="company-name-placeholder">${companyInfo.name}</span>`}
            </div>
            <div class="corporate-meta-box">
              <div class="document-type-badge">Facture</div>
              <div class="invoice-id-badge">N° ${invoiceNumber}</div>
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
              <div class="party-name">${sale.client?.nom || 'Client'}</div>
              <div class="party-details">
                ${sale.client?.adresse ? `${sale.client.adresse}<br>` : ''}
                Téléphone: ${sale.client?.telephone || '-'}<br>
                ${sale.client?.ice_client ? `ICE: ${sale.client.ice_client}<br>` : ''}
                ${sale.client?.email ? `Email: ${sale.client.email}` : ''}
              </div>
            </div>
          </div>
          
          <div class="table-wrapper">
            <table class="invoice-table">
              <thead>
                <tr>
                  <th style="width: 50%;">Description de la prestation</th>
                  <th class="text-center" style="width: 10%;">Qté</th>
                  <th class="text-right" style="width: 20%;">P.U HT</th>
                  <th class="text-right" style="width: 20%;">Montant HT</th>
                </tr>
              </thead>
              <tbody>
                ${saleItems.map(item => {
                  const qty = safeNumber(item.quantity || item.pivot?.quantite);
                  const price = safeNumber(item.unitPrice || item.pivot?.prix || item.prix_vente);
                  const totalItemHt = qty * price;
                  return `
                    <tr>
                      <td><strong>${item.name || item.nom || 'Produit'}</strong></td>
                      <td class="text-center">${qty}</td>
                      <td class="text-cas">${safeToFixed(price)} MAD</td>
                      <td class="text-right">${safeToFixed(totalItemHt)} MAD</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
          
          <div class="summary-container">
            <div class="legal-wordings">
              <div class="wording-label">Arrêté le présent document à la somme de :</div>
              <div class="wording-value">${formatFrenchAmount(totalAmount)}</div>
              ${companyInfo.bank_name || companyInfo.rib ? `
              <div class="bank-info">
                ${companyInfo.bank_name ? `<div><strong>Banque:</strong> ${companyInfo.bank_name}</div>` : ''}
                ${companyInfo.rib ? `<div><strong>RIB:</strong> ${companyInfo.rib}</div>` : ''}
              </div>
              ` : ''}
            </div>
            <div>
              <table class="financial-math">
                <tr>
                  <td>Total Hors Taxe (HT)</td>
                  <td class="text-right">${safeToFixed(subtotalCalc)} MAD</td>
                </tr>
                <tr>
                  <td>TVA (20%)</td>
                  <td class="text-right">${safeToFixed(tvaCalc)} MAD</td>
                </tr>
                <tr class="premium-total">
                  <td>Total TTC</td>
                  <td class="text-right">${safeToFixed(totalAmount)} MAD</td>
                </tr>
                ${amountPaid > 0 ? `
                <tr>
                  <td>Montant déjà réglé</td>
                  <td class="text-right" style="color: #0f172a; font-weight: 600;">${safeToFixed(amountPaid)} MAD</td>
                </tr>
                <tr style="border-top: 1px dashed #e2e8f0;">
                  <td style="font-weight: 700; color: #0f172a; padding-top: 12px;">Solde dû restant</td>
                  <td class="text-right" style="font-weight: 700; color: #0f172a; padding-top: 12px;">${safeToFixed(remainingAmount)} MAD</td>
                </tr>
                ` : ''}
              </table>
            </div>
          </div>
          <div style="margin-top: 55px; margin-bottom: 55px; display: flex; justify-content: flex-end; padding-right: 20px;">
            <div style="text-align: center; width: 200px;">
              <p style="font-size: 11px; font-weight: bold; margin-bottom: 50px; text-decoration: underline; color: #1f2937;">
                Cachet & signature
              </p>
            </div>
          </div>
          <div class="payment-routing">
            <div class="routing-title">Règlement & Informations Légales</div>
            <div class="routing-grid">
              <div class="routing-item"><strong>ICE</strong> ${companyInfo.ice || '-'}</div>
              <div class="routing-item"><strong>RC</strong> ${companyInfo.rc || '-'}</div>
              <div class="routing-item"><strong>Patente</strong> ${companyInfo.patente || '-'}</div>
              <div class="routing-item"><strong>IF</strong> ${companyInfo.tax_number || '-'}</div>
            </div>

          </div>
          
          <div class="executive-footer">
            <div class="footer-company-name">${companyInfo.name}</div>
            <div>${companyInfo.address} — Tel: ${companyInfo.phone} — Email: ${companyInfo.email}</div>
          </div>
        </div>
      </body>
      </html>
    `;
};

  const downloadPDF = async (sale) => {
    setLoading(true);
    const companyInfo = getCompanyInfo();
    const logoBase64 = await getLogoBase64();
    const html = generateInvoiceHTML(sale, companyInfo, logoBase64);

    const element = document.createElement('div');
    element.innerHTML = html;
    document.body.appendChild(element);

    const container = element.querySelector('.invoice-container');
    if (container) {
      container.style.maxHeight = '100%';
      container.style.boxSizing = 'border-box';
      container.style.pageBreakInside = 'avoid';
    }

    const opt = {
      margin:         [6, 8, 6, 8],
      filename:       `Facture_${sale.facture_numero || sale.id}.pdf`,
      image:          { type: 'jpeg', quality: 0.98 },
      html2canvas:    { scale: 2, useCORS: true, letterRendering: true },
      jsPDF:          { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak:      { mode: 'avoid-all' }
    };

    try {
      await html2pdf().set(opt).from(element).save();
      showToast('Facture téléchargée avec succès', 'success');
    } catch (error) {
      console.error('PDF generation error:', error);
      showToast('Erreur lors de la génération du PDF', 'error');
    } finally {
      document.body.removeChild(element);
      setLoading(false);
    }
  };

  const printInvoice = async (sale) => {
    const companyInfo = getCompanyInfo();
    const logoBase64 = await getLogoBase64();
    const html = generateInvoiceHTML(sale, companyInfo, logoBase64);
    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
  };

  // ---- Helpers for UI ----
  const statusBadge = (status, paymentStatusParam = null) => {
    if (paymentStatusParam) {
      const paymentMap = {
        paid: { label: 'Payé', variant: 'paid' },
        partial: { label: 'Partiel', variant: 'partial' },
        unpaid: { label: 'Impayé', variant: 'unpaid' },
      };
      const p = paymentMap[paymentStatusParam] || { label: paymentStatusParam, variant: 'secondary' };
      return <Badge variant={p.variant}>{p.label}</Badge>;
    }
    const statusMap = {
      confirmed: { label: 'Confirmée', variant: 'confirmed' },
      pending: { label: 'En attente', variant: 'pending' },
      cancelled: { label: 'Annulée', variant: 'cancelled' },
    };
    const s = statusMap[status] || { label: status, variant: 'secondary' };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPaymentStatusBadge = (paymentStatusParam) => {
    const config = {
      paid: { label: 'Payé', variant: 'paid' },
      partial: { label: 'Partiel', variant: 'partial' },
      unpaid: { label: 'Impayé', variant: 'unpaid' }
    };
    const c = config[paymentStatusParam] || { label: paymentStatusParam, variant: 'secondary' };
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  // ---- Filtering & Pagination ----
  const filteredSales = (sales || []).filter(sale => {
    const matchesSearch = searchTerm === '' || 
      sale.client?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      sale.id.toString().includes(searchTerm) ||
      sale.client?.ice_client?.toString().includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || sale.status === statusFilter;
    const matchesPayment = paymentFilter === 'all' || sale.payment_status === paymentFilter;
    return matchesSearch && matchesStatus && matchesPayment;
  });

  // Calculate cart totals (only used for AMG mode)
  const subtotal = useMemo(() => {
    if (productOwner === 'client') return 0;
    return items.reduce((sum, item) => sum + (safeNumber(item.unitPrice) * safeNumber(item.quantity)), 0);
  }, [items, productOwner]);

  const tva = useMemo(() => {
    if (productOwner === 'client') return 0;
    return subtotal * 0.2;
  }, [subtotal, productOwner]);

  const total = useMemo(() => {
    if (productOwner === 'client') return 0;
    return subtotal + tva;
  }, [subtotal, tva, productOwner]);
  
  const totalRevenue = useMemo(() => {
    return filteredSales.reduce((sum, s) => sum + safeNumber(s.amount_paid), 0);
  }, [filteredSales]);

  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);
  const paginatedSales = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSales.slice(start, start + itemsPerPage);
  }, [filteredSales, currentPage]);

  const availableGpsDevices = useMemo(() => {
    const gpsProd = products.find(p => p.categorie === 'GPS');
    return gpsProd ? (gpsProd.gpsDevices || []).filter(d => d.status === 'available') : [];
  }, [products]);

  // ---- Delete Confirmation Dialog Component ----
  const DeleteConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, deleting = false }) => {
    if (!isOpen) return null;
    
    return (
      <div className="confirm-overlay" onClick={onClose}>
        <div className="confirm-dialog confirm-destructive" onClick={(e) => e.stopPropagation()}>
          <div className="confirm-title confirm-title-danger">
            <AlertTriangle size={24} />
            {title || 'Confirmer la suppression'}
          </div>
          <div className="confirm-message confirm-message-danger">
            <div className="delete-warning-box">
              <div className="delete-warning-text">
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <div>
                  {message || 'Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible.'}
                </div>
              </div>
            </div>
          </div>
          <div className="confirm-actions">
            <button className="confirm-btn confirm-btn-cancel" onClick={onClose} disabled={deleting}>
              Annuler
            </button>
            <button className="confirm-btn confirm-btn-danger" onClick={onConfirm} disabled={deleting}>
              {deleting && <div className="confirm-loading-spinner" />}
              Supprimer
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <style>{styles}</style>
      
      {/* Payment History Modal - Moved outside */}
      <PaymentHistoryModal 
        isOpen={showPaymentHistory}
        sale={selectedSaleForHistory}
        onClose={() => {
          setShowPaymentHistory(false);
          setSelectedSaleForHistory(null);
        }}
        onPaymentChange={handlePaymentChange}
        showToast={showToast}
        showConfirm={showConfirm}
      />
      
      {/* Custom Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false, loading: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
        variant={confirmDialog.variant}
        loading={confirmDialog.loading}
      />
      
      {/* Delete Confirm Dialog */}
      <DeleteConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, saleId: null, saleInfo: '' })}
        onConfirm={handleDeleteSale}
        title="Supprimer la vente"
        message={`Êtes-vous sûr de vouloir supprimer la vente ${deleteConfirm.saleInfo} ? Cette action est irréversible et supprimera définitivement toutes les données associées.`}
        deleting={deletingSale}
      />
      
      {/* Toast Container */}
      {toasts.length > 0 && (
        <div className="sales-toast-container">
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
        title="Ventes" 
        subtitle={`${filteredSales.length} ventes · ${safeToFixed(totalRevenue)} MAD encaissés`} 
        actions={
          <>
            <ExportMenu 
              title="Liste des ventes" 
              rows={filteredSales} 
              columns={[
                { header: 'N° Facture', accessor: s => s.id },
                { header: 'Date', accessor: s => formatDate(s.created_at) },
                { header: 'Client', accessor: s => s.client?.nom },
                { header: 'ICE', accessor: s => s.client?.ice_client || '-' },
                { header: 'Statut vente', accessor: s => s.status },
                { header: 'Statut paiement', accessor: s => s.payment_status },
                { header: 'Total (MAD)', accessor: s => safeToFixed(s.total) }
              ]} 
            />
            <button onClick={() => { reset(); setOpen(true); }} className="modern-btn modern-btn-primary">
              <Plus size={16} /> Nouvelle Vente
            </button>
          </>
        } 
      />

      <Card>
        {/* Consolidated Filter Bar */}
        <div className="sales-filter-bar">
          <div className="sales-search-wrapper">
            <Search className="sales-search-icon" />
            <input 
              className="sales-search-input" 
              placeholder="Rechercher par client, ICE ou ID..." 
              value={searchTerm} 
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
            />
          </div>
          <div className="sales-filter-group">
            <select 
              value={statusFilter} 
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }} 
              className="sales-filter-select"
            >
              <option value="all">Tous statuts</option>
              <option value="pending">En attente</option>
              <option value="confirmed">Confirmée</option>
              <option value="cancelled">Annulée</option>
            </select>
            <select 
              value={paymentFilter} 
              onChange={(e) => { setPaymentFilter(e.target.value); setCurrentPage(1); }} 
              className="sales-filter-select"
            >
              <option value="all">Tous paiements</option>
              <option value="paid">Payé</option>
              <option value="partial">Partiel</option>
              <option value="unpaid">Impayé</option>
            </select>
          </div>
        </div>

        {salesLoading ? (
          <LoadingSpinner />
        ) : (
          <>
            <div className="sales-table-container">
              <table className="sales-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Date</th>
                    <th>Client</th>
                    <th className="text-right">Total TTC</th>
                    <th className="text-right">Payé</th>
                    <th className="text-right">Reste</th>
                    <th>Statut</th>
                    <th>Paiement</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedSales.map((sale) => {
                    const totalAmount = safeNumber(sale.total);
                    const paidAmount = safeNumber(sale.amount_paid);
                    const remainingAmount = safeNumber(sale.remaining_amount || (totalAmount - paidAmount));
                    const showActions = shouldShowActionsForSale(sale);
                    
                    return (
                      <tr key={sale.id}>
                        <td className="font-mono">#{sale.id}</td>
                        <td>{formatDate(sale.created_at)}</td>
                        <td>{sale.client?.nom || '-'}</td>
                        <td className="text-right font-semibold">{safeToFixed(totalAmount)} MAD</td>
                        <td className="text-right text-green-600">{safeToFixed(paidAmount)} MAD</td>
                        <td className="text-right text-orange-500">{safeToFixed(remainingAmount)} MAD</td>
                        <td>{statusBadge(sale.status)}</td>
                        <td>{getPaymentStatusBadge(sale.payment_status)}</td>
                        <td>
                          <div className="sales-actions-cell">
                            <button onClick={() => setView(sale)} className="sales-btn-icon" title="Voir détails">
                              <Eye size={16} style={{ color: '#232224' }}/>
                            </button>
                            <button onClick={() => printInvoice(sale)} className="sales-btn-icon" title="Aperçu facture">
                              <FileText size={16} style={{ color: '#8b5cf6' }} />
                            </button>
                            <button onClick={() => downloadPDF(sale)} className="sales-btn-icon" title="Télécharger PDF">
                              <Download size={16} style={{ color: '#3e5dfb' }}/>
                            </button>
                            <button 
                              onClick={() => { setSelectedSaleForHistory(sale); setShowPaymentHistory(true); }} 
                              className="sales-btn-icon" 
                              title="Historique des paiements"
                            >
                              <History size={16} style={{ color: '#eb7f2c' }}/>
                            </button>
                            {showActions && (
                              <>
                                <button onClick={() => loadSaleForEditing(sale)} className="sales-btn-icon" title="Modifier">
                                  <Edit size={16} style={{ color: '#818177' }}/>
                                </button>
                                {sale.status === 'pending' && (
                                  <>
                                    <button onClick={() => handleConfirmSale(sale.id)} className="sales-btn-icon" title="Confirmer">
                                      <Check size={16} style={{ color: '#16a34a' }} />
                                    </button>
                                    <button onClick={() => handleCancelSale(sale.id)} className="sales-btn-icon" title="Annuler">
                                      <X size={16} style={{ color: '#ef4444' }} />
                                    </button>
                                  </>
                                )}
                                <button onClick={() => openDeleteConfirm(sale.id, `#${sale.id}`)} className="sales-btn-icon" title="Supprimer">
                                  <Trash2 size={16} />
                                </button>
                              </>
                            )}
                          </div>
                          </td>
                        </tr>
                    );
                  })}
                  {filteredSales.length === 0 && (
                    <tr>
                      <td colSpan={9} className="sales-empty">
                        <FileText size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                        Aucune vente trouvée
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="sales-pagination-container">
                <button 
                  className="sales-pagination-btn"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} 
                  disabled={currentPage === 1}
                >
                  <ChevronLeft size={16} />
                  Précédent
                </button>
                
                {(() => {
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
                  
                  return pages.map((page, index) => (
                    page === '...' ? (
                      <span key={`ellipsis-${index}`} className="sales-pagination-info">...</span>
                    ) : (
                      <button
                        key={page}
                        className={`sales-pagination-btn ${currentPage === page ? 'sales-pagination-active' : ''}`}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    )
                  ));
                })()}
                
                <button 
                  className="sales-pagination-btn"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} 
                  disabled={currentPage === totalPages}
                >
                  Suivant
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </Card>

      {/* View Sale Details Dialog */}
      {view && (
        <div className="sales-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="sales-dialog sales-dialog-sm">
            <h2 className="sales-dialog-title">Détails de la Vente #{view.id}</h2>
            
            <div className="sales-grid-2">
              <div>
                <span className="sales-form-label-sm">Client:</span>
                <div className="sales-detail-value">{view.client?.nom || '-'}</div>
              </div>
              <div>
                <span className="sales-form-label-sm">Date:</span>
                <div className="sales-detail-value">{formatDate(view.created_at)}</div>
              </div>
              <div>
                <span className="sales-form-label-sm">Statut Vente:</span>
                <div>{statusBadge(view.status)}</div>
              </div>
              <div>
                <span className="sales-form-label-sm">Statut Paiement:</span>
                <div>{getPaymentStatusBadge(view.payment_status)}</div>
              </div>
            </div>

            <div className="sales-form-section" style={{ background: 'white' }}>
              <label className="sales-form-label">Articles</label>
              <table className="sales-items-table" style={{ marginTop: '0.5rem', width: '100%' }}>
                <thead>
                  <tr>
                    <th>Produit</th>
                    <th>Quantité</th>
                    <th className="sales-text-right">Prix Unitaire</th>
                    <th className="sales-text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(view.items || view.produits || []).map((item, index) => {
                    const qty = safeNumber(item.quantity || item.pivot?.quantite);
                    const prc = safeNumber(item.unitPrice || item.pivot?.prix || item.prix_vente);
                    return (
                      <tr key={item.id || index}>
                        <td>{item.name || item.nom}</td>
                        <td>{qty}</td>
                        <td className="sales-text-right">{safeToFixed(prc)} MAD</td>
                        <td className="sales-text-right font-semibold">{safeToFixed(qty * prc)} MAD</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="sales-total-box" style={{ marginTop: '1rem' }}>
                <div className="sales-total-row">
                  <span>Sous-total</span>
                  <span>{safeToFixed(view.subtotal || (safeNumber(view.total) / 1.2))} MAD</span>
                </div>
                <div className="sales-total-row">
                  <span>TVA 20%</span>
                  <span>{safeToFixed(view.tva || (safeNumber(view.total) - (safeNumber(view.total) / 1.2)))} MAD</span>
                </div>
                <div className="sales-total-final">
                  <span>Total</span>
                  <span>{safeToFixed(view.total)} MAD</span>
                </div>
              </div>
            </div>

            <div className="sales-dialog-footer">
              <button onClick={() => downloadPDF(view)} className="sales-btn-outline">
                <Download size={16} /> PDF
              </button>
              <button onClick={() => printInvoice(view)} className="sales-btn-primary">
                <Printer size={16} /> Imprimer
              </button>
              <button onClick={() => setView(null)} className="sales-btn-outline">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Dialog - Modern Styled Form */}
      {open && (
        <div className="sales-overlay">
          <div className="modern-dialog">
            <div className="modern-dialog-header">
              <h2 className="modern-dialog-title">
                {isEditingMode ? `Modifier la Vente #${editingSale.id}` : 'Nouvelle Vente'}
              </h2>
              <div className="modern-dialog-close" onClick={() => { reset(); setOpen(false); }}>
                <X size={20} />
              </div>
            </div>
            
            <div className="modern-dialog-body">
              {/* Product Owner Selection - Only show for new sales, not for editing */}
              {!isEditingMode && (
                <div className="modern-form-section">
                  <div className="modern-form-header">
                    <Package className="modern-form-header-icon" />
                    <span className="modern-form-header-title">Type de vente</span>
                  </div>
                  <div className="product-owner-group">
                    <div 
                      className={`product-owner-option amg ${productOwner === 'amg' ? 'selected' : ''}`}
                      onClick={() => setProductOwner('amg')}
                    >
                      <Package size={18} />
                      <span>Vente AMG (Produits)</span>
                    </div>
                    <div 
                      className={`product-owner-option client ${productOwner === 'client' ? 'selected' : ''}`}
                      onClick={() => setProductOwner('client')}
                    >
                      <User size={18} />
                      <span>Vente Client (Hors AMG)</span>
                    </div>
                  </div>
                  {productOwner === 'client' && (
                    <div className="client-info-box">
                      <Info className="client-info-icon" size={18} />
                      <div className="client-info-text">
                        Mode vente client sélectionné : Aucun produit ne sera ajouté. Le total de la vente sera de 0 MAD.
                        Vous pouvez toujours gérer les paiements ultérieurement.
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Client Section */}
              <div className="modern-form-section">
                <div className="modern-form-header">
                  <User className="modern-form-header-icon" />
                  <span className="modern-form-header-title">Informations Client</span>
                  {!isEditingMode && (
                    <div className="modern-toggle-group">
                      <button 
                        type="button"
                        className={`modern-toggle-btn ${clientMode === 'existing' ? 'modern-toggle-btn-active' : ''}`}
                        onClick={() => setClientMode('existing')}
                      >
                        Existant
                      </button>
                      <button 
                        type="button"
                        className={`modern-toggle-btn ${clientMode === 'new' ? 'modern-toggle-btn-active' : ''}`}
                        onClick={() => setClientMode('new')}
                      >
                        Nouveau
                      </button>
                    </div>
                  )}
                </div>

                {clientMode === 'existing' ? (
                  <div className="modern-form-field">
                    <label className="modern-form-label modern-form-label-required">Sélectionner un client</label>
                    <SearchableSelect
                      options={clients}
                      value={clientId}
                      onChange={setClientId}
                      placeholder="Rechercher un client..."
                      disabled={isEditingMode}
                    />
                  </div>
                ) : (
                  <div className="modern-form-grid">
                    <div className="modern-form-field">
                      <label className="modern-form-label modern-form-label-required">Nom complet</label>
                      <input 
                        type="text"
                        placeholder="Nom du client" 
                        value={newClient.nom} 
                        onChange={(e) => setNewClient({ ...newClient, nom: e.target.value })} 
                        className="modern-input" 
                      />
                    </div>
                    <div className="modern-form-field">
                      <label className="modern-form-label modern-form-label-required">Téléphone</label>
                      <input 
                        type="tel"
                        placeholder="Téléphone" 
                        value={newClient.telephone} 
                        onChange={(e) => setNewClient({ ...newClient, telephone: e.target.value })} 
                        className="modern-input" 
                      />
                    </div>
                    <div className="modern-form-field">
                      <label className="modern-form-label">ICE</label>
                      <input 
                        type="text"
                        placeholder="ICE (Identifiant Commun de l'Entreprise)" 
                        value={newClient.ice_client} 
                        onChange={(e) => setNewClient({ ...newClient, ice_client: e.target.value })} 
                        className="modern-input" 
                      />
                    </div>
                    <div className="modern-form-field">
                      <label className="modern-form-label">Email</label>
                      <input 
                        type="email"
                        placeholder="Email" 
                        value={newClient.email} 
                        onChange={(e) => setNewClient({ ...newClient, email: e.target.value })} 
                        className="modern-input" 
                      />
                    </div>
                    <div className="modern-form-field">
                      <label className="modern-form-label">Adresse</label>
                      <input 
                        type="text"
                        placeholder="Adresse" 
                        value={newClient.adresse} 
                        onChange={(e) => setNewClient({ ...newClient, adresse: e.target.value })} 
                        className="modern-input" 
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Products Section - Only show for AMG mode */}
              {productOwner === 'amg' && (
                <div className="modern-form-section">
                  <div className="modern-form-header">
                    <Package className="modern-form-header-icon" />
                    <span className="modern-form-header-title">Produits & Services</span>
                    <span className="modern-form-header-subtitle">{items.length} article(s)</span>
                  </div>
                  
                  <div className="add-item-row">
                    <div className="add-item-field">
                      <SearchableSelect
                        options={products}
                        value={productId}
                        onChange={setProductId}
                        placeholder="Rechercher un produit..."
                        renderOption={(product) => (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                            <div>
                              <div style={{ fontWeight: 600 }}>{product.nom}</div>
                              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{product.marque}</div>
                            </div>
                            <div style={{ fontWeight: 600, color: '#2563eb' }}>
                              {safeToFixed(product.prix_vente || product.prix)} MAD
                            </div>
                          </div>
                        )}
                      />
                    </div>
                    <div className="add-item-quantity">
                      <input 
                        type="number" 
                        min={1} 
                        value={qty} 
                        onChange={(e) => setQty(parseInt(e.target.value) || 1)} 
                        className="modern-input" 
                        placeholder="Qté"
                      />
                    </div>
                    <div className="add-item-button">
                      <button onClick={addItem} className="modern-btn modern-btn-primary modern-btn-sm" type="button">
                        <Plus size={14} /> Ajouter
                      </button>
                    </div>
                  </div>

                  {items.length > 0 && (
                    <div className="modern-items-container">
                      <table className="modern-items-table">
                        <thead>
                          <tr>
                            <th>Produit</th>
                            <th style={{ width: '80px' }}>Qté</th>
                            <th style={{ width: '100px' }}>Prix unit.</th>
                            <th style={{ width: '100px' }} className="text-right">Total</th>
                            <th style={{ width: '40px' }}></th>
                           </tr>
                        </thead>
                        <tbody>
                          {items.map((item) => (
                            <tr key={item.productId}>
                              <td>
                                <div style={{ fontWeight: 500 }}>{item.name}</div>
                                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                                  Catégorie: {item.categorie}
                                </div>
                              </td>
                              <td>
                                <input 
                                  type="number" 
                                  min={1} 
                                  value={item.quantity} 
                                  onChange={(e) => updateQuantity(item.productId, e.target.value)} 
                                  className="modern-item-input" 
                                />
                              </td>
                              <td>
                                <input 
                                  type="number" 
                                  value={item.unitPrice} 
                                  onChange={(e) => updatePrice(item.productId, e.target.value)} 
                                  step="0.01" 
                                  className="modern-item-input" 
                                />
                              </td>
                              <td className="text-right font-semibold">
                                {safeToFixed(item.unitPrice * item.quantity)} MAD
                              </td>
                              <td className="text-right">
                                <button onClick={() => removeItem(item.productId)} className="modern-btn-danger modern-btn-sm" style={{ padding: '0.25rem 0.5rem', borderRadius: '0.375rem' }} type="button">
                                  <Trash2 size={12} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Sale Status Section */}
              <div className="modern-form-grid">
                <div className="modern-form-section">
                  <div className="modern-form-header">
                    <Info className="modern-form-header-icon" />
                    <span className="modern-form-header-title">Statut Vente</span>
                  </div>
                  <select value={saleStatus} onChange={(e) => setSaleStatus(e.target.value)} className="modern-input">
                    <option value="pending">En attente</option>
                    <option value="confirmed">Confirmée</option>
                    <option value="cancelled">Annulée</option>
                  </select>
                </div>

                <div className="modern-form-section">
                  <div className="modern-form-header">
                    <Calendar className="modern-form-header-icon" />
                    <span className="modern-form-header-title">Date Limite</span>
                  </div>
                  <input 
                    type="date" 
                    value={paymentDueDate} 
                    onChange={(e) => setPaymentDueDate(e.target.value)} 
                    className="modern-input" 
                  />
                </div>
              </div>

              {/* Payment Section */}
              <div className="modern-payment-section">
                <div className="modern-payment-header">
                  <div className="modern-payment-title">
                    <Wallet size={18} />
                    <span>Informations de paiement</span>
                  </div>
                  {isEditingMode && editingSale && (
                    <button 
                      className="modern-btn modern-btn-secondary modern-btn-sm"
                      onClick={() => {
                        setSelectedSaleForHistory(editingSale);
                        setShowPaymentHistory(true);
                      }}
                    >
                      <History size={14} /> Historique
                    </button>
                  )}
                </div>
                
                {isEditingMode && editingSale && (
                  <div className="payment-summary-grid" style={{ display: 'flex', justifyContent: 'space-around' }}>
                    <div className="payment-summary-card">
                      <div className="payment-summary-label">Total TTC</div>
                      <div className="payment-summary-value">{safeToFixed(editingSale.total)} MAD</div>
                    </div>
                    <div className="payment-summary-card">
                      <div className="payment-summary-label">Déjà payé</div>
                      <div className="payment-summary-value paid">{safeToFixed(editingSale.amount_paid)} MAD</div>
                    </div>
                    <div className="payment-summary-card">
                      <div className="payment-summary-label">Reste à payer</div>
                      <div className="payment-summary-value remaining">{safeToFixed(safeNumber(editingSale.total) - safeNumber(editingSale.amount_paid))} MAD</div>
                    </div>
                  </div>
                )}
                
                {!isEditingMode && (
                  <div className="modern-form-grid">
                    <div className="modern-form-field">
                      <label className="modern-form-label">Statut paiement</label>
                      <select 
                        value={paymentStatus} 
                        onChange={(e) => setPaymentStatus(e.target.value)} 
                        className="modern-input"
                      >
                        <option value="paid">Payé</option>
                        <option value="partial">Partiel</option>
                        <option value="unpaid">Impayé</option>
                      </select>
                    </div>
                    <div className="modern-form-field">
                      <label className="modern-form-label">Méthode de paiement</label>
                      <select 
                        value={paymentMethod} 
                        onChange={(e) => setPaymentMethod(e.target.value)} 
                        className="modern-input"
                      >
                        <option value="cash">Espèces</option>
                        <option value="card">Carte Bancaire</option>
                        <option value="check">Chèque</option>
                        <option value="bank_transfer">Virement</option>
                        <option value="other">Autre</option>
                      </select>
                    </div>
                  </div>
                )}
                
                {(!isEditingMode && paymentStatus !== 'unpaid') && (
                  <div className="add-payment-row" style={{ marginTop: '0.75rem' }}>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Montant initial"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="add-payment-input"
                      style={{ flex: 1 }}
                    />
                    <span className="info-text" style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                      Paiement initial
                    </span>
                  </div>
                )}
                
                {!isEditingMode && paymentStatus === 'unpaid' && (
                  <div className="info-text" style={{ fontSize: '0.75rem', color: '#6b7280', textAlign: 'center', padding: '0.5rem' }}>
                    Aucun paiement initial - La vente sera marquée comme impayée
                  </div>
                )}
              </div>

              {/* Total Box - Only show for AMG mode */}
              {!isEditingMode && productOwner === 'amg' && (
                <div className="modern-total-box">
                  <div className="modern-total-row">
                    <span>Sous-total HT</span>
                    <span>{safeToFixed(subtotal)} MAD</span>
                  </div>
                  <div className="modern-total-row">
                    <span>TVA 20%</span>
                    <span>{safeToFixed(tva)} MAD</span>
                  </div>
                  <div className="modern-total-final">
                    <span>Total TTC</span>
                    <span>{safeToFixed(total)} MAD</span>
                  </div>
                </div>
              )}
              
              {/* For client mode, show a simpler total box */}
              {!isEditingMode && productOwner === 'client' && (
                <div className="modern-total-box">
                  <div className="modern-total-final">
                    <span>Total TTC</span>
                    <span>0 MAD</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="modern-dialog-footer">
              <button onClick={() => { reset(); setOpen(false); }} className="modern-btn modern-btn-secondary" type="button">
                Annuler
              </button>
              <button onClick={submit} disabled={loading} className="modern-btn modern-btn-primary">
                {loading ? (
                  <>
                    <Loader size={16} className="spinning" /> Enregistrement...
                  </>
                ) : (
                  <>
                    <Save size={16} /> {isEditingMode ? 'Mettre à jour' : 'Enregistrer la vente'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sales;