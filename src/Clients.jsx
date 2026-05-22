import React ,{ useState, useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ReactDOM from 'react-dom';
import { 
  Plus, Pencil, Trash2, Search, X, RefreshCw, AlertTriangle, 
  CheckCircle, Info, ChevronLeft, ChevronRight, FileSpreadsheet, 
  Eye, Edit2, Save, Printer, Calendar, Smartphone, Hash, 
  CreditCard, Clock, ExternalLink, Loader, Package, Trash,
  User, Check, AlertCircle, Download, History, Receipt, List,
  Filter, ChevronDown, Stamp, ImageOff, ChevronUp
} from 'lucide-react';
import { ExportMenu } from './ExportMenu';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import html2pdf from 'html2pdf.js';
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

// ==================== STYLES ====================
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
  
  /* Overlay and Dialog */
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
    max-width: 1400px;
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
    }
  }
  
  @media (min-width: 768px) {
    .clients-dialog {
      width: 85%;
    }
  }
  
  .clients-dialog-small {
    max-width: 560px;
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
  
  /* Form Styles */
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
  
  /* Searchable Select Styles */
  .searchable-select {
    position: relative;
    width: 100%;
  }
  
  .searchable-select-input {
    width: 100%;
    height: 2.5rem;
    padding: 0.5rem 2rem 0.5rem 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    background: white;
    color: #111827;
    cursor: pointer;
    appearance: none;
    -webkit-appearance: none;
  }
  
  .searchable-select-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  .searchable-select-arrow {
    position: absolute;
    right: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
    color: #6b7280;
  }
  
  .searchable-select-dropdown {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    z-index: 10;
    max-height: 240px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  
  .searchable-select-search {
    padding: 0.5rem;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .searchable-select-search-input {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.375rem;
    font-size: 0.813rem;
    outline: none;
  }
  
  .searchable-select-search-input:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }
  
  .searchable-select-options {
    overflow-y: auto;
    max-height: 180px;
  }
  
  .searchable-select-option {
    padding: 0.5rem 0.75rem;
    cursor: pointer;
    font-size: 0.813rem;
    transition: background 0.2s;
    border-bottom: 1px solid #f3f4f6;
  }
  
  .searchable-select-option:hover {
    background: #f3f4f6;
  }
  
  .searchable-select-option-selected {
    background: #eff6ff;
    color: #2563eb;
  }
  
  .searchable-select-empty {
    padding: 0.5rem 0.75rem;
    text-align: center;
    color: #9ca3af;
    font-size: 0.813rem;
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
  
  /* Pagination */
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
  
  /* Activation Items */
  .activation-item {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 0.75rem;
    margin-bottom: 0.75rem;
    overflow: hidden;
  }
  
  .activation-item-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    background: #f1f5f9;
    border-bottom: 1px solid #e2e8f0;
  }
  
  .activation-item-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: #2563eb;
  }
  
  .remove-btn {
    background: #fee2e2;
    border: none;
    border-radius: 0.5rem;
    padding: 0.25rem 0.75rem;
    cursor: pointer;
    color: #dc2626;
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.75rem;
    transition: all 0.2s;
  }
  
  .remove-btn:hover {
    background: #fecaca;
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
    max-height: 65vh;
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
    min-width: 800px;
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
    padding: 0.75rem;
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
    padding: 0.75rem;
    border-bottom: 1px solid #f1f5f9;
    vertical-align: middle;
  }
  
  @media (min-width: 768px) {
    .activations-table td {
      padding: 0.75rem;
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

  .modern-btn-success {
    background: linear-gradient(135deg, #2563eb, #1d4ed8);
  }

  .modern-btn-warning {
    background: linear-gradient(135deg, #f59e0b, #d97706);
  }

  .spinning {
    animation: spin 1s linear infinite;
  }

  /* Installation Row Styles - for grouped view */
  .installation-row {
    background-color: #f0f9ff;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .installation-row:hover {
    background-color: #e0f2fe;
  }
  
  .installation-row.expanded {
    background-color: #e0f2fe;
  }
  
  .activation-subrow {
    background-color: #fefce8;
  }
  
  .activation-subrow td {
    padding: 0.5rem 1rem !important;
    border-bottom: 1px solid #fef3c7;
  }
  
  .subtable {
    width: 100%;
    border-collapse: collapse;
    margin: 0;
  }
  
  .subtable td {
    padding: 0.5rem;
    font-size: 0.7rem;
    border-bottom: 1px solid #fef3c7;
  }
  
  .subtable tr:last-child td {
    border-bottom: none;
  }
  
  .subtable .sub-label {
    font-weight: 600;
    color: #92400e;
    width: 120px;
  }
  
  .expand-icon {
    transition: transform 0.2s ease;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  
  .expand-icon.rotated {
    transform: rotate(90deg);
  }

  /* Cachet Choice Dialog - Styled */
  .cachet-choice-overlay {
    position: fixed;
    inset: 0;
    z-index: 100;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    animation: fadeIn 0.2s ease-out;
  }
  
  .cachet-choice-modal {
    background: white;
    border-radius: 1.5rem;
    max-width: 500px;
    width: 90%;
    overflow: hidden;
    animation: slideUpScale 0.3s ease-out;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
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
  
  .cachet-choice-header {
    background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
    padding: 1.5rem 1.5rem 0 1.5rem;
    border-bottom: 1px solid #e2e8f0;
  }
  
  .cachet-choice-title {
    font-size: 1.25rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: #1e293b;
  }
  
  .cachet-choice-title-icon {
    width: 2rem;
    height: 2rem;
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    border-radius: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .cachet-choice-title-icon svg {
    width: 1rem;
    height: 1rem;
    color: white;
  }
  
  .cachet-choice-description {
    font-size: 0.875rem;
    color: #64748b;
    margin-top: 0.5rem;
    margin-bottom: 1rem;
  }
  
  .cachet-choice-body {
    padding: 1.5rem;
  }
  
  .cachet-choice-icon {
    text-align: center;
    margin-bottom: 1rem;
  }
  
  .cachet-choice-icon svg {
    width: 3rem;
    height: 3rem;
  }
  
  .cachet-choice-message {
    text-align: center;
    margin-bottom: 1.5rem;
  }
  
  .cachet-choice-message p {
    font-size: 0.875rem;
    color: #475569;
    line-height: 1.5;
  }
  
  .cachet-choice-buttons {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }
  
  .cachet-choice-btn {
    flex: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1.25rem;
    border-radius: 0.75rem;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
  }
  
  .cachet-choice-btn-primary {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  }
  
  .cachet-choice-btn-primary:hover {
    background: linear-gradient(135deg, #2563eb, #1d4ed8);
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }
  
  .cachet-choice-btn-secondary {
    background: #f1f5f9;
    color: #475569;
    border: 1px solid #e2e8f0;
  }
  
  .cachet-choice-btn-secondary:hover {
    background: #e2e8f0;
    transform: translateY(-1px);
  }
  
  .cachet-choice-btn-danger {
    background: #fef2f2;
    color: #dc2626;
    border: 1px solid #fecaca;
  }
  
  .cachet-choice-btn-danger:hover {
    background: #fee2e2;
    transform: translateY(-1px);
  }
  
  .cachet-choice-footer {
    padding: 1rem 1.5rem 1.5rem 1.5rem;
    border-top: 1px solid #e2e8f0;
    background: #f8fafc;
    display: flex;
    justify-content: flex-end;
  }
  
  .cachet-choice-footer button {
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    font-size: 0.813rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
    background: white;
    border: 1px solid #e2e8f0;
    color: #64748b;
  }
  
  .cachet-choice-footer button:hover {
    background: #f1f5f9;
  }

  /* Date filter row */
  .date-filter-row {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    align-items: flex-end;
    background: #f1f5f9;
    padding: 0.75rem 1rem;
    border-radius: 0.75rem;
    margin-bottom: 1rem;
  }
  
  .date-filter-field {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .date-filter-field label {
    font-size: 0.7rem;
    font-weight: 600;
    color: #475569;
    text-transform: uppercase;
  }
  
  .date-filter-input {
    padding: 0.5rem 0.75rem;
    border: 1px solid #cbd5e1;
    border-radius: 0.5rem;
    font-size: 0.813rem;
    background: white;
  }
  
  /* Checkbox column */
  .checkbox-col {
    width: 40px;
    text-align: center;
  }
  
  .row-checkbox {
    width: 1rem;
    height: 1rem;
    cursor: pointer;
    accent-color: #3b82f6;
  }
`;

// ==================== HELPER FUNCTIONS ====================
const API_URL = window.REACT_APP_API_URL || "https://amg-telecom-backd-production.up.railway.app/api";
const safeNumber = (value) => { const n = Number(value); return isNaN(n) ? 0 : n; };
const safeToFixed = (value, decimals = 2) => safeNumber(value).toFixed(decimals);
const TVA_RATE = 0.20;

const calculateTTC = (htPrice) => {
  return safeNumber(htPrice) * (1 + TVA_RATE);
};

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

// ==================== CONVERT NUMBER TO FRENCH WORDS ====================
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

// ==================== INSTALLATION INVOICE GENERATION (WITH TVA) ====================
const generateInstallationInvoiceHTML = (client, group, companyInfo, logoBase64 = null, cacheImageBase64 = null, showCachet = true) => {
  const invoiceDate = new Date().toLocaleDateString('fr-FR');
  const invoiceNumber = `FACT/${new Date().getFullYear()}/${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
  
  const venteProductsHT = group.saleTotalPriceHT || 0;
  const totalActivationsPriceHT = group.activations.reduce((sum, act) => sum + (act.displayPriceTTC / 1.2), 0);
  const totalHT = venteProductsHT + totalActivationsPriceHT;
  const totalTTC = calculateTTC(totalHT);
  const tvaAmount = totalTTC - totalHT;
  
  const totalProductQuantity = group.totalProductQuantity || 1;
  const totalActivationsCount = group.activations.length;
  const totalQuantity = totalProductQuantity + totalActivationsCount;
  const unitPriceHT = totalQuantity > 0 ? totalHT / totalQuantity : 0;
  const description = `Installation complète`;
  
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <title>Facture ${invoiceNumber}</title>
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
            <div class="document-type-badge">FACTURE</div>
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
            <div class="party-name">${client.nom}</div>
            <div class="party-details">
              ${client.adresse ? `${client.adresse}<br>` : ''}
              Téléphone: ${client.telephone || '-'}<br>
              ${client.ice_client ? `ICE: ${client.ice_client}<br>` : ''}
              ${client.email ? `Email: ${client.email}` : ''}
            </div>
          </div>
        </div>
        
        <div class="table-wrapper">
          <table class="invoice-table">
            <thead>
              <tr>
                <th style="width: 60%;">Désignation</th>
                <th class="text-center" style="width: 10%;">Qté</th>
                <th class="text-right" style="width: 15%;">P.U HT</th>
                <th class="text-right" style="width: 15%;">Montant HT</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>${description}</strong><br>
                  <span style="font-size: 10px; color: #6b7280;">
                    ${group.activations.map(act => `${act.matricule} (${PLAN_LABEL[act.plan] || act.plan || 'Standard'})`).join(', ')}
                  </span>
                 </td>
                <td class="text-center"><strong>${totalQuantity}</strong></td>
                <td class="text-right">${safeToFixed(unitPriceHT)} MAD</td>
                <td class="text-right"><strong>${safeToFixed(totalHT)} MAD</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="summary-container">
          <div class="legal-wordings">
            <div class="wording-label">Arrêté la présente facture à la somme de :</div>
            <div class="wording-value">${convertToFrenchWords(totalTTC)}</div>
            <div class="bank-info" style="margin-top: 15px;">
              <strong>Informations de paiement</strong><br>
              ${companyInfo.rib ? `RIB: ${companyInfo.rib}` : ''}
            </div>
          </div>
          <div>
            <table class="financial-math">
              <tr>
                <td>Montant HT</td>
                <td class="text-right">${safeToFixed(totalHT)} MAD</td>
              </tr>
              <tr>
                <td>TVA (20%)</td>
                <td class="text-right">${safeToFixed(tvaAmount)} MAD</td>
              </tr>
              <tr class="premium-total">
                <td><strong>TOTAL TTC</strong></td>
                <td class="text-right"><strong>${safeToFixed(totalTTC)} MAD</strong></td>
              </tr>
            </table>
          </div>
        </div>
        
        <div class="signature-section">
          <div class="signature-box">
            <div class="signature-label">Cachet & signature</div>
            ${showCachet && cacheImageBase64 ? `
            <div class="signature-image">
              <img src="${cacheImageBase64}" alt="Cachet" class="signature-img" />
            </div>
            ` : '<div style="height: 50px;"></div>'}
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
          <div class="footer-company-name">${companyInfo.name}</div>
          <div>${companyInfo.address} — Tel: ${companyInfo.phone} — Email: ${companyInfo.email}</div>
        </div>
      </div>
    </body>
    </html>
  `;
};

// ==================== SIMPLE ACTIVATION INVOICE GENERATION (FIXED) ====================
const generateSimpleActivationInvoiceHTML = (client, activation, companyInfo, logoBase64 = null, cacheImageBase64 = null, showCachet = true) => {
  const invoiceDate = new Date().toLocaleDateString('fr-FR');
  const invoiceNumber = `FACT/${new Date().getFullYear()}/${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
  
  const QUANTITY = 1;
  let priceHT = safeNumber(activation.price || activation.priceHT || activation.activationPriceHT || 0);
  if (activation.quantity && activation.quantity > 1 && priceHT > 0) {
    priceHT = priceHT / activation.quantity;
  }
  const priceTTC = calculateTTC(priceHT);
  const planLabel = PLAN_LABEL[activation.plan] || activation.plan || 'Standard';
  const description = `Activation ${activation.type === 'Renouvellement' ? 'Renouvellement' : "d'abonnement"} - ${activation.matricule || '-'}`;
  
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <title>Facture ${invoiceNumber}</title>
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
            <div class="document-type-badge">FACTURE</div>
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
            <div class="party-name">${client.nom}</div>
            <div class="party-details">
              ${client.adresse ? `${client.adresse}<br>` : ''}
              Téléphone: ${client.telephone || '-'}<br>
              ${client.ice_client ? `ICE: ${client.ice_client}<br>` : ''}
              ${client.email ? `Email: ${client.email}` : ''}
            </div>
          </div>
        </div>
        
        <div class="table-wrapper">
          <table class="invoice-table">
            <thead>
              <tr>
                <th style="width: 60%;">Désignation</th>
                <th class="text-center" style="width: 10%;">Qté</th>
                <th class="text-right" style="width: 15%;">P.U HT</th>
                <th class="text-right" style="width: 15%;">Montant HT</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>${description}</strong> (${planLabel})</td>
                <td class="text-center"><strong>${QUANTITY}</strong></td>
                <td class="text-right">${safeToFixed(priceHT)} MAD</td>
                <td class="text-right"><strong>${safeToFixed(priceHT)} MAD</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="summary-container">
          <div class="legal-wordings">
            <div class="wording-label">Arrêté la présente facture à la somme de :</div>
            <div class="wording-value">${convertToFrenchWords(priceTTC)}</div>
            <div class="bank-info" style="margin-top: 15px;">
              <strong>Informations de paiement</strong><br>
              ${companyInfo.rib ? `RIB: ${companyInfo.rib}` : ''}
            </div>
          </div>
          <div>
            <table class="financial-math">
              <tr>
                <td>Montant HT</td>
                              <td class="text-right">${safeToFixed(priceHT)} MAD</td>
              </tr>
              <tr>
                <td>TVA (20%)</td>
                <td class="text-right">${safeToFixed(priceTTC - priceHT)} MAD</td>
              </tr>
              <tr class="premium-total">
                <td><strong>TOTAL TTC</strong></td>
                <td class="text-right"><strong>${safeToFixed(priceTTC)} MAD</strong></td>
              </tr>
            </table>
          </div>
        </div>
        
        <div class="signature-section">
          <div class="signature-box">
            <div class="signature-label">Cachet & signature</div>
            ${showCachet && cacheImageBase64 ? `
            <div class="signature-image">
              <img src="${cacheImageBase64}" alt="Cachet" class="signature-img" />
            </div>
            ` : '<div style="height: 50px;"></div>'}
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
          <div class="footer-company-name">${companyInfo.name}</div>
          <div>${companyInfo.address} — Tel: ${companyInfo.phone} — Email: ${companyInfo.email}</div>
        </div>
      </div>
    </body>
    </html>
  `;
};

const getCacheImageBase64 = async () => {
  try {
    const response = await fetch('/cache.png');
    if (response.ok) {
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    }
    return null;
  } catch (e) {
    console.log('Error loading cache.png:', e);
    return null;
  }
};

// ==================== CACHET CHOICE PROMPT ====================
const CachetChoicePrompt = ({ onClose, onConfirm }) => {
  return (
    <div className="cachet-choice-overlay" onClick={onClose}>
      <div className="cachet-choice-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cachet-choice-header">
          <div className="cachet-choice-title">
            <div className="cachet-choice-title-icon">
              <Printer size={16} />
            </div>
            Options d'impression
          </div>
          <div className="cachet-choice-description">
            Personnalisez votre facture avant génération
          </div>
        </div>
        
        <div className="cachet-choice-body">
          <div className="cachet-choice-icon">
            <Stamp size={48} style={{ color: '#3b82f6' }} />
          </div>
          <div className="cachet-choice-message">
            <p>Souhaitez-vous inclure le cachet de l'entreprise dans la facture ?</p>
          </div>
          
          <div className="cachet-choice-buttons">
            <button 
              onClick={() => onConfirm(true)}
              className="cachet-choice-btn cachet-choice-btn-primary"
            >
              <Stamp size={16} />
              Avec cachet
            </button>
            <button 
              onClick={() => onConfirm(false)}
              className="cachet-choice-btn cachet-choice-btn-secondary"
            >
              <ImageOff size={16} />
              Sans cachet
            </button>
          </div>
        </div>
        
        <div className="cachet-choice-footer">
          <button onClick={onClose}>
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================== GENERATE INSTALLATION INVOICE PDF ====================
const generateInvoicePDF = async (client, group, showToast, setLoading, showCachet) => {
  setLoading(true);
  let element = null;
  try {
    const companyInfo = getCompanyInfo();
    
    const [logoBase64, cacheImageBase64] = await Promise.all([
      (async () => {
        try {
          const response = await fetch('/logo.png');
          if (response.ok) {
            const blob = await response.blob();
            return new Promise(resolve => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.readAsDataURL(blob);
            });
          }
          return null;
        } catch (e) {
          return null;
        }
      })(),
      getCacheImageBase64()
    ]);
    
    const html = generateInstallationInvoiceHTML(client, group, companyInfo, logoBase64, cacheImageBase64, showCachet);
    
    element = document.createElement('div');
    element.innerHTML = html;
    document.body.appendChild(element);
    
    const opt = {
      margin: [6, 8, 6, 8],
      filename: `Facture_${client.nom.replace(/\s+/g, '_')}_${group.type}_${new Date().toISOString().slice(0,10)}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: 'avoid-all' }
    };
    
    await html2pdf().set(opt).from(element).save();
    showToast(`Facture générée avec succès${!showCachet ? ' (sans cachet)' : ''}`, 'success');
  } catch (error) {
    console.error('PDF generation error:', error);
    showToast('Erreur lors de la génération de la facture', 'error');
  } finally {
    setLoading(false);
    if (element && element.parentNode) {
      document.body.removeChild(element);
    }
  }
};

// ==================== GENERATE SIMPLE ACTIVATION INVOICE PDF ====================
const generateSimpleActivationInvoicePDF = async (client, activation, showToast, setLoading, showCachet) => {
  setLoading(true);
  let element = null;
  try {
    const companyInfo = getCompanyInfo();
    
    const [logoBase64, cacheImageBase64] = await Promise.all([
      (async () => {
        try {
          const response = await fetch('/logo.png');
          if (response.ok) {
            const blob = await response.blob();
            return new Promise(resolve => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.readAsDataURL(blob);
            });
          }
          return null;
        } catch (e) {
          return null;
        }
      })(),
      getCacheImageBase64()
    ]);
    
    const activationWithPrice = {
      ...activation,
      price: activation.priceHT || activation.price || 0
    };
    
    const html = generateSimpleActivationInvoiceHTML(client, activationWithPrice, companyInfo, logoBase64, cacheImageBase64, showCachet);
    
    element = document.createElement('div');
    element.innerHTML = html;
    document.body.appendChild(element);
    
    const opt = {
      margin: [6, 8, 6, 8],
      filename: `Facture_${client.nom.replace(/\s+/g, '_')}_${activation.matricule || 'activation'}_${new Date().toISOString().slice(0,10)}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: 'avoid-all' }
    };
    
    await html2pdf().set(opt).from(element).save();
    showToast(`Facture d'activation générée avec succès${!showCachet ? ' (sans cachet)' : ''}`, 'success');
  } catch (error) {
    console.error('PDF generation error:', error);
    showToast('Erreur lors de la génération de la facture', 'error');
  } finally {
    setLoading(false);
    if (element && element.parentNode) {
      document.body.removeChild(element);
    }
  }
};

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

// ==================== SEARCHABLE SELECT COMPONENT ====================
const SearchableSelect = ({ options, value, onChange, placeholder = "Sélectionner un produit...", disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);

  const selectedOption = options.find(opt => opt.id === value);

  const filteredOptions = options.filter(opt => 
    opt.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (opt.marque?.toLowerCase() || '').includes(searchTerm.toLowerCase())
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
    onChange(option.id);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="searchable-select" ref={containerRef}>
      <div 
        className="searchable-select-input"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{ cursor: disabled ? 'not-allowed' : 'pointer', backgroundColor: disabled ? '#f3f4f6' : 'white' }}
      >
        {selectedOption ? (
          <span>
            {selectedOption.nom} {selectedOption.marque ? `- ${selectedOption.marque}` : ''}
            {selectedOption.prix_vente && (
              <span style={{ fontSize: '0.7rem', color: '#6b7280', marginLeft: '0.5rem' }}>
                ({selectedOption.prix_vente} MAD)
              </span>
            )}
          </span>
        ) : (
          <span style={{ color: '#9ca3af' }}>{placeholder}</span>
        )}
      </div>
      <ChevronDown size={16} className="searchable-select-arrow" />
      
      {isOpen && !disabled && (
        <div className="searchable-select-dropdown">
          <div className="searchable-select-search">
            <input
              type="text"
              className="searchable-select-search-input"
              placeholder="Rechercher un produit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="searchable-select-options">
            {filteredOptions.length === 0 ? (
              <div className="searchable-select-empty">Aucun produit trouvé</div>
            ) : (
              filteredOptions.map(option => (
                <div
                  key={option.id}
                  className={`searchable-select-option ${value === option.id ? 'searchable-select-option-selected' : ''}`}
                  onClick={() => handleSelect(option)}
                >
                  <div style={{ fontWeight: value === option.id ? 600 : 400 }}>
                    {option.nom} {option.marque ? `- ${option.marque}` : ''}
                  </div>
                  {option.prix_vente && (
                    <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>Prix: {option.prix_vente} MAD</div>
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
const exportClientActivationsToExcel = async (client, flatItems) => {
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
    
    const headers = ['Date', 'Type', 'Matricule', 'IMEI', 'Opérateur', 'Plan', 'Prix HT (MAD)', 'Prix TTC (MAD)', 'Statut', 'Statut Paiement', 'Montant Payé (MAD)', 'Reste (MAD)'];
    const headerRow = worksheet.addRow(headers);
    headerRow.eachCell(cell => { 
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } }; 
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }; 
    });
    
    let grandTotalHT = 0;
    let grandTotalTTC = 0;
    
    for (const item of flatItems) {
      if (item.isGroup) {
        for (const act of item.activations) {
          const htPrice = act.activationPriceHT;
          const ttcPrice = act.displayPriceTTC;
          grandTotalHT += htPrice;
          grandTotalTTC += ttcPrice;
          
          worksheet.addRow([
            act.date ? new Date(act.date).toLocaleDateString('fr-FR') : '-',
            `${item.type} - ${act.type}`,
            act.matricule,
            act.displayImei,
            act.operator || '-',
            PLAN_LABEL[act.plan] || act.plan || '-',
            safeToFixed(htPrice),
            safeToFixed(ttcPrice),
            act.status === 'active' ? 'Actif' : act.status === 'suspended' ? 'Suspendu' : 'Expiré',
            act.paymentStatus === 'paid' ? 'Payé' : act.paymentStatus === 'partial' ? 'Partiel' : 'Non payé',
            safeToFixed(act.amountPaid),
            safeToFixed(act.remainingAmount),
          ]);
        }
      } else {
        const htPrice = item.priceHT;
        const ttcPrice = item.displayPriceTTC;
        grandTotalHT += htPrice;
        grandTotalTTC += ttcPrice;
        
        worksheet.addRow([
          formatDate(item.date),
          item.type === 'renewal' ? 'Renouvellement' : (item.typeLabel || 'Activation'),
          item.matricule,
          item.imei,
          item.operator,
          PLAN_LABEL[item.plan] || item.plan || '-',
          safeToFixed(htPrice),
          safeToFixed(ttcPrice),
          item.status === 'active' ? 'Actif' : item.status === 'suspended' ? 'Suspendu' : 'Expiré',
          item.paymentStatus === 'paid' ? 'Payé' : item.paymentStatus === 'partial' ? 'Partiel' : 'Non payé',
          safeToFixed(item.amountPaid),
          safeToFixed(item.remainingAmount),
        ]);
      }
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

const formatDate = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
};

// ==================== ACTIVATIONS DETAILS MODAL (WITH OVERLAY) ====================
const ActivationsDetailsModal = ({ client, onClose, showToast }) => {
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [generatingPdfTTC, setGeneratingPdfTTC] = useState(false);
  const [generatingPdfHT, setGeneratingPdfHT] = useState(false);
  const [generatingInvoice, setGeneratingInvoice] = useState(null);
  const [generatingCombined, setGeneratingCombined] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [editingPrice, setEditingPrice] = useState(null);
  const [tempPrice, setTempPrice] = useState('');
  const [cachetChoiceItem, setCachetChoiceItem] = useState(null);
  
  // Filter states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Checkbox selection
  const [selectedRows, setSelectedRows] = useState(new Set());
  
  // Cachet choice for combined invoice
  const [showCachetPromptCombined, setShowCachetPromptCombined] = useState(false);
  
  // Flat list with groups and renewals
  const [displayItems, setDisplayItems] = useState([]);
  const [expandedGroups, setExpandedGroups] = useState({});
  
  // Payment status filters for PDF summary
  const [showPaid, setShowPaid] = useState(true);
  const [showPartial, setShowPartial] = useState(true);
  const [showUnpaid, setShowUnpaid] = useState(true);
  
  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };
  
  // Load data and build display items
  useEffect(() => {
    const loadClientActivations = async () => {
      setLoading(true);
      setLoadingProgress(0);
      
      try {
        const token = localStorage.getItem('token');
        
        setLoadingProgress(10);
        const [activationsResponse, salesResponse] = await Promise.all([
          fetch(`${API_URL}/activations?client_id=${client.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${API_URL}/ventes?client_id=${client.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        
        setLoadingProgress(30);
        
        let allActivations = [];
        let clientSales = [];
        
        if (activationsResponse.ok) {
          const data = await activationsResponse.json();
          allActivations = data.data || data.activations || [];
        }
        
        if (salesResponse.ok) {
          const data = await salesResponse.json();
          clientSales = data.ventes || data.data || [];
        }
        
        const uniqueActivationIds = [...new Set(allActivations.map(a => a.id))];
        setLoadingProgress(50);
        
        // Load payment data for each activation
        const paymentPromises = uniqueActivationIds.map(async (activationId) => {
          try {
            const paymentResponse = await fetch(`${API_URL}/activations/${activationId}/payments`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (paymentResponse.ok) {
              const paymentData = await paymentResponse.json();
              return { activationId, data: paymentData };
            }
            return { activationId, data: null };
          } catch (err) {
            return { activationId, data: null };
          }
        });
        
        const paymentResults = await Promise.all(paymentPromises);
        setLoadingProgress(70);
        
        const paymentMap = {};
        paymentResults.forEach(result => {
          if (result.data) {
            paymentMap[result.activationId] = result.data;
          }
        });
        
        // Group activations by sale (installation)
        const groups = new Map();
        const standaloneItems = [];
        
        for (const activation of allActivations) {
          const associatedSale = clientSales.find(s => s.id === activation.vente_id);
          const paymentInfo = paymentMap[activation.id] || {};
          
          const paymentStatus = paymentInfo.payment_status || 'unpaid';
          const amountPaid = safeNumber(paymentInfo.amount_paid);
          const activationOriginalPrice = safeNumber(paymentInfo.original_price || activation.price);
          const totalToPay = paymentInfo.total_price || activationOriginalPrice;
          const activationPriceTTC = calculateTTC(activationOriginalPrice);
          
          let saleTotalPriceHT = 0;
          let totalProductQuantity = 0;
          
          if (associatedSale) {
            for (const product of (associatedSale.produits || [])) {
              const productQuantity = product.pivot?.quantite || 1;
              const productUnitPrice = product.pivot?.prix || product.prix_vente || 0;
              saleTotalPriceHT += safeNumber(productUnitPrice) * productQuantity;
              totalProductQuantity += productQuantity;
            }
          }
          
          const groupKey = activation.vente_id ? `sale_${activation.vente_id}` : null;
          
          if (groupKey) {
            if (!groups.has(groupKey)) {
              groups.set(groupKey, {
                id: groupKey,
                venteId: activation.vente_id,
                type: associatedSale ? 'Installation' : 'Installation (Vente)',
                date: activation.activated_at || activation.created_at,
                saleTotalPriceHT: saleTotalPriceHT,
                saleTotalPriceTTC: calculateTTC(saleTotalPriceHT),
                totalProductQuantity: totalProductQuantity,
                activations: [],
                totalPaid: 0,
                totalRemaining: 0,
                overallPaymentStatus: 'unpaid'
              });
            }
            
            const group = groups.get(groupKey);
            
            let itemPaymentStatus = 'unpaid';
            let itemAmountPaid = 0;
            if (paymentStatus === 'paid') {
              itemPaymentStatus = 'paid';
              itemAmountPaid = activationPriceTTC;
            } else if (paymentStatus === 'partial') {
              if (amountPaid >= activationPriceTTC) {
                itemPaymentStatus = 'paid';
                itemAmountPaid = activationPriceTTC;
              } else if (amountPaid > 0) {
                itemPaymentStatus = 'partial';
                itemAmountPaid = amountPaid;
              }
            }
            
            group.activations.push({
              id: activation.id,
              type: 'Activation',
              date: activation.activated_at,
              matricule: activation.matricule || '-',
              imei: activation.imei || null,
              clientImei: activation.client_imei || null,
              displayImei: getDisplayImei(activation),
              operator: activation.operateur || '-',
              expirationDate: activation.expires_at,
              plan: activation.plan_abonnement,
              originalPriceHT: activationOriginalPrice,
              activationPriceHT: activationOriginalPrice,
              activationPriceTTC: activationPriceTTC,
              displayPriceTTC: activationPriceTTC,
              price: activationOriginalPrice,
              status: activation.status,
              venteId: activation.vente_id,
              paymentStatus: itemPaymentStatus,
              amountPaid: itemAmountPaid,
              remainingAmount: activationPriceTTC - itemAmountPaid,
              paymentHistory: paymentInfo.payment_history || []
            });
            
            // Add renewals as standalone items
            if (activation.renewal_history && Array.isArray(activation.renewal_history)) {
              for (let idx = 0; idx < activation.renewal_history.length; idx++) {
                const entry = activation.renewal_history[idx];
                if (entry.action === 'renewal') {
                  const renewalPriceHT = safeNumber(entry.price);
                  let renewalPaymentStatus = 'unpaid';
                  let renewalAmountPaid = 0;
                  if (paymentStatus === 'paid') {
                    renewalPaymentStatus = 'paid';
                    renewalAmountPaid = calculateTTC(renewalPriceHT);
                  } else if (paymentStatus === 'partial') {
                    const renewalTotalTTC = calculateTTC(renewalPriceHT);
                    if (amountPaid >= renewalTotalTTC) {
                      renewalPaymentStatus = 'paid';
                      renewalAmountPaid = renewalTotalTTC;
                    } else if (amountPaid > 0) {
                      renewalPaymentStatus = 'partial';
                      renewalAmountPaid = amountPaid;
                    }
                  }
                  
                  standaloneItems.push({
                    id: `renewal_${activation.id}_${idx}`,
                    originalId: activation.id,
                    type: 'renewal',
                    typeLabel: 'Renouvellement',
                    date: entry.date,
                    matricule: activation.matricule || '-',
                    imei: activation.imei || activation.client_imei || '-',
                    operator: activation.operateur || '-',
                    plan: entry.new_plan,
                    priceHT: renewalPriceHT,
                    priceTTC: calculateTTC(renewalPriceHT),
                    displayPriceTTC: calculateTTC(renewalPriceHT),
                    status: activation.status,
                    paymentStatus: renewalPaymentStatus,
                    amountPaid: renewalAmountPaid,
                    remainingAmount: calculateTTC(renewalPriceHT) - renewalAmountPaid,
                    saleReference: associatedSale ? `Vente #${associatedSale.id}` : null,
                    venteId: activation.vente_id
                  });
                }
              }
            }
          } else {
            // Standalone activation (no sale)
            let itemPaymentStatus = 'unpaid';
            let itemAmountPaid = 0;
            if (paymentStatus === 'paid') {
              itemPaymentStatus = 'paid';
              itemAmountPaid = activationPriceTTC;
            } else if (paymentStatus === 'partial') {
              if (amountPaid >= activationPriceTTC) {
                itemPaymentStatus = 'paid';
                itemAmountPaid = activationPriceTTC;
              } else if (amountPaid > 0) {
                itemPaymentStatus = 'partial';
                itemAmountPaid = amountPaid;
              }
            }
            
            standaloneItems.push({
              id: `standalone_${activation.id}`,
              originalId: activation.id,
              type: 'activation',
              typeLabel: 'Activation Simple',
              date: activation.activated_at || activation.created_at,
              matricule: activation.matricule || '-',
              imei: activation.imei || activation.client_imei || '-',
              operator: activation.operateur || '-',
              plan: activation.plan_abonnement,
              priceHT: activationOriginalPrice,
              priceTTC: activationPriceTTC,
              displayPriceTTC: activationPriceTTC,
              status: activation.status,
              paymentStatus: itemPaymentStatus,
              amountPaid: itemAmountPaid,
              remainingAmount: activationPriceTTC - itemAmountPaid,
              saleReference: null,
              venteId: null
            });
            
            // Add renewals for standalone
            if (activation.renewal_history && Array.isArray(activation.renewal_history)) {
              for (let idx = 0; idx < activation.renewal_history.length; idx++) {
                const entry = activation.renewal_history[idx];
                if (entry.action === 'renewal') {
                  const renewalPriceHT = safeNumber(entry.price);
                  let renewalPaymentStatus = 'unpaid';
                  let renewalAmountPaid = 0;
                  if (paymentStatus === 'paid') {
                    renewalPaymentStatus = 'paid';
                    renewalAmountPaid = calculateTTC(renewalPriceHT);
                  } else if (paymentStatus === 'partial') {
                    const renewalTotalTTC = calculateTTC(renewalPriceHT);
                    if (amountPaid >= renewalTotalTTC) {
                      renewalPaymentStatus = 'paid';
                      renewalAmountPaid = renewalTotalTTC;
                    } else if (amountPaid > 0) {
                      renewalPaymentStatus = 'partial';
                      renewalAmountPaid = amountPaid;
                    }
                  }
                  
                  standaloneItems.push({
                    id: `renewal_${activation.id}_${idx}`,
                    originalId: activation.id,
                    type: 'renewal',
                    typeLabel: 'Renouvellement',
                    date: entry.date,
                    matricule: activation.matricule || '-',
                    imei: activation.imei || activation.client_imei || '-',
                    operator: activation.operateur || '-',
                    plan: entry.new_plan,
                    priceHT: renewalPriceHT,
                    priceTTC: calculateTTC(renewalPriceHT),
                    displayPriceTTC: calculateTTC(renewalPriceHT),
                    status: activation.status,
                    paymentStatus: renewalPaymentStatus,
                    amountPaid: renewalAmountPaid,
                    remainingAmount: calculateTTC(renewalPriceHT) - renewalAmountPaid,
                    saleReference: null,
                    venteId: null
                  });
                }
              }
            }
          }
        }
        
        // Process groups to calculate totals
        const groupsArray = Array.from(groups.values()).map(group => {
          let totalActivationTTC = 0;
          let totalPaid = 0;
          let totalRemaining = 0;
          let hasPaid = false;
          let hasPartial = false;
          let hasUnpaid = false;
          
          group.activations.forEach(act => {
            totalActivationTTC += act.activationPriceTTC;
            totalPaid += act.amountPaid;
            totalRemaining += act.remainingAmount;
            if (act.paymentStatus === 'paid') hasPaid = true;
            else if (act.paymentStatus === 'partial') hasPartial = true;
            else hasUnpaid = true;
          });
          
          let overallPaymentStatus = 'unpaid';
          if (hasPaid && !hasPartial && !hasUnpaid) overallPaymentStatus = 'paid';
          else if (hasPaid || hasPartial) overallPaymentStatus = 'partial';
          
          return {
            ...group,
            totalActivationTTC,
            totalPaid,
            totalRemaining,
            overallPaymentStatus,
            grandTotalTTC: group.saleTotalPriceTTC + totalActivationTTC,
            isGroup: true
          };
        });
        
        // Sort groups and standalone items by date descending
        groupsArray.sort((a, b) => new Date(b.date) - new Date(a.date));
        standaloneItems.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        const combined = [...groupsArray, ...standaloneItems];
        setDisplayItems(combined);
        setLoadingProgress(100);
        
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
  
  // Filter items by date
  const filteredItems = useMemo(() => {
    let filtered = [...displayItems];
    if (startDate) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate >= new Date(startDate);
      });
    }
    if (endDate) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate <= new Date(endDate);
      });
    }
    return filtered;
  }, [displayItems, startDate, endDate]);
  
  // Total amounts for filtered items
  const totalHTFiltered = useMemo(() => {
    let total = 0;
    for (const item of filteredItems) {
      if (item.isGroup) {
        total += item.grandTotalTTC / (1 + TVA_RATE);
      } else {
        total += item.priceHT;
      }
    }
    return total;
  }, [filteredItems]);
  
  const totalTTCFiltered = useMemo(() => {
    let total = 0;
    for (const item of filteredItems) {
      if (item.isGroup) {
        total += item.grandTotalTTC;
      } else {
        total += item.displayPriceTTC;
      }
    }
    return total;
  }, [filteredItems]);
  
  // Handle checkbox selection
  const toggleRowSelection = (rowId) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(rowId)) {
      newSelected.delete(rowId);
    } else {
      newSelected.add(rowId);
    }
    setSelectedRows(newSelected);
  };
  
  const selectAllFiltered = () => {
    if (selectedRows.size === filteredItems.length && filteredItems.length > 0) {
      setSelectedRows(new Set());
    } else {
      const allIds = filteredItems.map(item => item.id);
      setSelectedRows(new Set(allIds));
    }
  };
  
  // Edit price for an activation inside a group or standalone
  const startEditPrice = (itemId, currentPriceTTC) => {
    setEditingPrice(itemId);
    setTempPrice(currentPriceTTC.toString());
  };
  
  const saveTempPrice = (itemId) => {
    const newPriceTTC = parseFloat(tempPrice);
    if (!isNaN(newPriceTTC) && newPriceTTC > 0) {
      const updateItem = (item) => {
        if (item.id === itemId) {
          if (item.isGroup) {
            const ratio = newPriceTTC / item.grandTotalTTC;
            const newGrandTotal = newPriceTTC;
            const newSaleTotal = item.saleTotalPriceTTC * ratio;
            const newActivationTotal = newGrandTotal - newSaleTotal;
            return {
              ...item,
              grandTotalTTC: newGrandTotal,
              saleTotalPriceTTC: newSaleTotal,
              totalActivationTTC: newActivationTotal,
              activations: item.activations.map(act => ({
                ...act,
                displayPriceTTC: act.displayPriceTTC * ratio
              }))
            };
          } else {
            return {
              ...item,
              displayPriceTTC: newPriceTTC,
              priceTTC: newPriceTTC,
              priceHT: newPriceTTC / (1 + TVA_RATE)
            };
          }
        }
        return item;
      };
      setDisplayItems(prev => prev.map(updateItem));
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
    setDisplayItems(prev => prev.map(item => {
      if (item.isGroup) {
        return {
          ...item,
          grandTotalTTC: item.saleTotalPriceTTC + item.totalActivationTTC,
          activations: item.activations.map(act => ({
            ...act,
            displayPriceTTC: act.activationPriceTTC
          }))
        };
      } else {
        return {
          ...item,
          displayPriceTTC: item.priceTTC,
          priceTTC: item.priceTTC,
          priceHT: item.priceHT
        };
      }
    }));
    showToast('Tous les prix ont été réinitialisés', 'info');
  };
  
  // Generate invoice for a single item (group or standalone)
  const handleGenerateSingleInvoice = async (item, showCachet) => {
    if (item.isGroup) {
      setGeneratingInvoice(item.id);
      const groupForInvoice = {
        type: item.type,
        saleTotalPriceHT: item.saleTotalPriceHT,
        saleTotalPriceTTC: item.saleTotalPriceTTC,
        totalProductQuantity: item.totalProductQuantity,
        activations: item.activations.map(act => ({
          matricule: act.matricule,
          plan: act.plan,
          displayPriceTTC: act.displayPriceTTC
        }))
      };
      await generateInvoicePDF(client, groupForInvoice, showToast, () => {}, showCachet);
      setGeneratingInvoice(null);
    } else {
      setGeneratingInvoice(item.id);
      const invoiceItem = {
        id: item.id,
        type: item.type,
        matricule: item.matricule,
        plan: item.plan,
        priceHT: item.priceHT,
        priceTTC: item.displayPriceTTC
      };
      await generateSimpleActivationInvoicePDF(client, invoiceItem, showToast, () => {}, showCachet);
      setGeneratingInvoice(null);
    }
  };
  
  // Generate combined invoice for selected items (aggregated into one line)
  const handleGenerateCombinedInvoice = async (showCachet) => {
    const selected = filteredItems.filter(item => selectedRows.has(item.id));
    if (selected.length === 0) {
      showToast('Veuillez sélectionner au moins un élément', 'error');
      return;
    }
    
    setGeneratingCombined(true);
    try {
      const companyInfo = getCompanyInfo();
      const [logoBase64, cacheImageBase64] = await Promise.all([
        (async () => {
          try {
            const response = await fetch('/logo.png');
            if (response.ok) {
              const blob = await response.blob();
              return new Promise(resolve => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(blob);
              });
            }
            return null;
          } catch (e) { return null; }
        })(),
        getCacheImageBase64()
      ]);
      
      let totalQuantity = 0;
      let totalHT = 0;
      
      for (const item of selected) {
        if (item.isGroup) {
          const groupQty = (item.totalProductQuantity || 0) + item.activations.length;
          const groupHT = item.grandTotalTTC / (1 + TVA_RATE);
          totalQuantity += groupQty;
          totalHT += groupHT;
        } else {
          const itemHT = item.displayPriceTTC / (1 + TVA_RATE);
          totalQuantity += 1;
          totalHT += itemHT;
        }
      }
      
      const unitPriceHT = totalQuantity > 0 ? totalHT / totalQuantity : 0;
      const totalTTC = calculateTTC(totalHT);
      const tvaAmount = totalTTC - totalHT;
      const invoiceDate = new Date().toLocaleDateString('fr-FR');
      const invoiceNumber = `FACT/${new Date().getFullYear()}/${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
      const description = `ACTIVATION GPS`;
      
      const html = `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <title>Facture ${invoiceNumber}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'Plus Jakarta Sans', sans-serif; color: #1e293b; background-color: #ffffff; line-height: 1.5; padding: 35px 40px 60px 40px; font-size: 12px; }
            .invoice-container { max-width: 850px; margin: 0 auto; box-sizing: border-box; page-break-after: avoid; position: relative; min-height: 100%; }
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
            .executive-footer { border-top: 2px solid #0f172a; padding-top: 15px; padding-bottom: 10px; text-align: center; font-size: 10px; color: #64748b; line-height: 1.6; margin-top: 20px; }
            .executive-footer .footer-company-name { font-weight: 700; color: #0f172a; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.05em; }
            .bank-info { margin-top: 12px; font-size: 11px; color: #475569; border-top: 1px dashed #e2e8f0; padding-top: 10px; }
            .bank-info strong { color: #0f172a; }
            .signature-section { margin-top: 40px; margin-bottom: 30px; display: flex; justify-content: flex-end; padding-right: 20px; }
            .signature-box { text-align: center; width: 200px; }
            .signature-label { font-size: 11px; font-weight: bold; margin-bottom: 10px; text-decoration: underline; color: #1f2937; }
            .signature-image { margin-top: 10px; display: flex; justify-content: center; }
            .signature-img { max-width: 150px; max-height: 80px; object-fit: contain; }
            @media print { body { padding: 0 0 40px 0; } .executive-footer { position: fixed; bottom: 0; left: 0; right: 0; background: white; } }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="header-top">
              <div class="logo-wrapper">
                ${logoBase64 ? `<img src="${logoBase64}" alt="Logo" class="invoice-logo"/>` : `<span class="company-name-placeholder">${companyInfo.name}</span>`}
              </div>
              <div class="corporate-meta-box">
                <div class="document-type-badge">FACTURE</div>
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
                <div class="party-name">${client.nom}</div>
                <div class="party-details">
                  ${client.adresse ? `${client.adresse}<br>` : ''}
                  Téléphone: ${client.telephone || '-'}<br>
                  ${client.ice_client ? `ICE: ${client.ice_client}<br>` : ''}
                  ${client.email ? `Email: ${client.email}` : ''}
                </div>
              </div>
            </div>
            
            <div class="table-wrapper">
              <table class="invoice-table">
                <thead>
                  <tr>
                    <th style="width: 60%;">Désignation</th>
                    <th class="text-center" style="width: 10%;">Qté</th>
                    <th class="text-right" style="width: 15%;">P.U HT</th>
                    <th class="text-right" style="width: 15%;">Montant HT</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>${description}</strong></td>
                    <td class="text-center"><strong>${totalQuantity}</strong></td>
                    <td class="text-right">${safeToFixed(unitPriceHT)} MAD</td>
                    <td class="text-right"><strong>${safeToFixed(totalHT)} MAD</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div class="summary-container">
              <div class="legal-wordings">
                <div class="wording-label">Arrêté la présente facture à la somme de :</div>
                <div class="wording-value">${convertToFrenchWords(totalTTC)}</div>
                <div class="bank-info" style="margin-top: 15px;">
                  <strong>Informations de paiement</strong><br>
                  ${companyInfo.rib ? `RIB: ${companyInfo.rib}` : ''}
                </div>
              </div>
              <div>
                <table class="financial-math">
                  <tr><td>Montant HT</td><td class="text-right">${safeToFixed(totalHT)} MAD</td></tr>
                  <tr><td>TVA (20%)</td><td class="text-right">${safeToFixed(tvaAmount)} MAD</td></tr>
                  <tr class="premium-total"><td><strong>TOTAL TTC</strong></td><td class="text-right"><strong>${safeToFixed(totalTTC)} MAD</strong></td></tr>
                </table>
              </div>
            </div>
            
            <div class="signature-section">
              <div class="signature-box">
                <div class="signature-label">Cachet & signature</div>
                ${showCachet && cacheImageBase64 ? `<div class="signature-image"><img src="${cacheImageBase64}" alt="Cachet" class="signature-img" /></div>` : '<div style="height: 50px;"></div>'}
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
              <div class="footer-company-name">${companyInfo.name}</div>
              <div>${companyInfo.address} — Tel: ${companyInfo.phone} — Email: ${companyInfo.email}</div>
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
        filename: `Facture_Combinee_${client.nom.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: 'avoid-all' }
      };
      await html2pdf().set(opt).from(element).save();
      showToast(`Facture combinée générée avec succès (${selected.length} élément(s))${!showCachet ? ' (sans cachet)' : ''}`, 'success');
      document.body.removeChild(element);
    } catch (error) {
      console.error('Combined PDF error:', error);
      showToast('Erreur lors de la génération de la facture combinée', 'error');
    } finally {
      setGeneratingCombined(false);
    }
  };
  
  const openCachetChoiceCombined = () => {
    if (selectedRows.size === 0) {
      showToast('Veuillez sélectionner au moins un élément', 'error');
      return;
    }
    setShowCachetPromptCombined(true);
  };
  
  // Generate summary PDF (TTC/HT) for filtered items - FLATTENED VERSION with product + activation prices combined
const generateSummaryPDF = async (includeTVA = true) => {
  try {
    if (includeTVA) setGeneratingPdfTTC(true);
    else setGeneratingPdfHT(true);
    
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
    if (client.adresse) { doc.text(client.adresse, 130, y); y += 5; }
    if (client.telephone) { doc.text(`Tél: ${client.telephone}`, 130, y); y += 5; }
    doc.text(`DATE : ${new Date().toLocaleDateString('fr-FR')}`, 130, y + 5);
    
    const formatMoney = (val) => `${Number(val || 0).toFixed(2)} DH`;
    
    // Filter by payment status for PDF summary
    const filteredForPDF = filteredItems.filter(item => {
      if (item.isGroup) {
        if (item.overallPaymentStatus === 'paid' && showPaid) return true;
        if (item.overallPaymentStatus === 'partial' && showPartial) return true;
        if (item.overallPaymentStatus === 'unpaid' && showUnpaid) return true;
        return false;
      } else {
        if (item.paymentStatus === 'paid' && showPaid) return true;
        if (item.paymentStatus === 'partial' && showPartial) return true;
        if (item.paymentStatus === 'unpaid' && showUnpaid) return true;
        return false;
      }
    });
    
    // FLATTEN: each activation inside a group becomes its own row
    // Price = product price (from sale) + activation price
    const rows = [];
    for (const item of filteredForPDF) {
      if (item.isGroup) {
        // For each activation in the group, calculate total price = (product price per activation) + activation price
        const productPricePerActivation = item.saleTotalPriceTTC / item.activations.length;
        
        for (const act of item.activations) {
          // Total price for this activation row = product price share + activation price
          const totalPriceForRow = productPricePerActivation + act.displayPriceTTC;
          const price = includeTVA ? totalPriceForRow : (totalPriceForRow / (1 + TVA_RATE));
          
          const priceColor = (() => {
            if (act.paymentStatus === 'paid') return [5, 150, 105];
            if (act.paymentStatus === 'partial') return [217, 119, 6];
            return [220, 38, 38];
          })();
          
          rows.push([
            formatDate(act.date),
            'Installation + Activation',
            act.matricule,
            PLAN_LABEL[act.plan] || act.plan || '-',
            { content: formatMoney(price), styles: { textColor: priceColor, fontStyle: 'bold' } }
          ]);
        }
      } else {
        // Standalone activation or renewal
        const price = includeTVA ? item.displayPriceTTC : item.priceHT;
        const priceColor = (() => {
          if (item.paymentStatus === 'paid') return [5, 150, 105];
          if (item.paymentStatus === 'partial') return [217, 119, 6];
          return [220, 38, 38];
        })();
        
        rows.push([
          formatDate(item.date),
          item.typeLabel || 'Activation',
          item.matricule,
          PLAN_LABEL[item.plan] || item.plan || '-',
          { content: formatMoney(price), styles: { textColor: priceColor, fontStyle: 'bold' } }
        ]);
      }
    }
    
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
        1: { halign: 'center', cellWidth: 45 },
        2: { halign: 'center', cellWidth: 55 },
        3: { halign: 'center', cellWidth: 30 },
        4: { halign: 'right', cellWidth: 35 }
      },
      margin: { left: 10, right: 10 },
      didDrawPage: () => { doc.setDrawColor(200); doc.rect(5, 5, 200, 287); }
    });
    
    let total = 0;
    for (const item of filteredForPDF) {
      if (item.isGroup) {
        const productPricePerActivation = item.saleTotalPriceTTC / item.activations.length;
        for (const act of item.activations) {
          const totalPriceForRow = productPricePerActivation + act.displayPriceTTC;
          total += includeTVA ? totalPriceForRow : (totalPriceForRow / (1 + TVA_RATE));
        }
      } else {
        total += includeTVA ? item.displayPriceTTC : item.priceHT;
      }
    }
    
    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(145, finalY - 9, 55, 14, 3, 3, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    const totalLabel = includeTVA ? 'TOTAL TTC :' : 'TOTAL HT :';
    doc.text(totalLabel, 150, finalY);
    doc.setFont('times', 'bold');
    doc.text(formatMoney(total), 192, finalY, { align: 'right' });
    
    const fileNameSuffix = includeTVA ? 'TTC' : 'HT';
    doc.save(`Releve_${client.nom.replace(/\s+/g, '_')}_${fileNameSuffix}.pdf`);
    showToast(`PDF généré avec succès (${includeTVA ? 'TTC - TVA incluse' : 'HT - TVA exclue'})`, 'success');
    
  } catch (err) {
    console.error(err);
    showToast('Erreur lors de la génération du PDF', 'error');
  } finally {
    if (includeTVA) setGeneratingPdfTTC(false);
    else setGeneratingPdfHT(false);
  }
};
  
  const exportToExcel = async () => {
    setExportingExcel(true);
    try {
      await exportClientActivationsToExcel(client, filteredItems);
      showToast('Export Excel réussi', 'success');
    } catch (err) {
      showToast('Erreur lors de l\'export Excel', 'error');
    } finally {
      setExportingExcel(false);
    }
  };
  
  const getPaymentStatusColor = (paymentStatus) => {
    switch (paymentStatus) {
      case 'paid': return { color: '#059669', bg: '#d1fae5', label: 'Payé' };
      case 'partial': return { color: '#d97706', bg: '#fed7aa', label: 'Partiel' };
      default: return { color: '#dc2626', bg: '#fee2e2', label: 'Non payé' };
    }
  };
  
  // MODAL WITH OVERLAY AND PORTALS
  return (
    <div className="clients-overlay" onClick={onClose}>
      <div className="clients-dialog" style={{ maxWidth: '1400px' }} onClick={e => e.stopPropagation()}>
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
              {loadingProgress > 0 && loadingProgress < 100 && (
                <div style={{ width: '80%', maxWidth: '300px', margin: '1rem auto 0', height: '4px', background: '#e5e7eb', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: `${loadingProgress}%`, height: '100%', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', transition: 'width 0.3s ease' }} />
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Action Buttons Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <button onClick={resetAllPrices} className="modern-btn modern-btn-secondary" style={{ marginRight: '0.5rem' }}>
                    <RefreshCw size={14} /> Réinitialiser prix
                  </button>
                  <button onClick={exportToExcel} disabled={exportingExcel} className="modern-btn modern-btn-secondary">
                    {exportingExcel ? <Loader size={14} className="spinning" /> : <FileSpreadsheet size={14} />}
                    {exportingExcel ? 'Export...' : 'Excel'}
                  </button>
                </div>
                <div>
                  <button onClick={openCachetChoiceCombined} disabled={selectedRows.size === 0} className="modern-btn modern-btn-success">
                    {generatingCombined ? <Loader size={14} className="spinning" /> : <Printer size={14} />}
                    {generatingCombined ? 'Génération...' : `Combiner (${selectedRows.size})`}
                  </button>
                </div>
              </div>
              
              {/* PDF Summary Buttons */}
              <div className="pdf-filter-group">
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Filter size={14} /> Filtrer par statut de paiement pour PDF récapitulatif:
                </span>
                <label className="pdf-filter-label">
                  <input type="checkbox" checked={showPaid} onChange={(e) => setShowPaid(e.target.checked)} />
                  <span style={{ color: '#059669' }}>Payé</span>
                </label>
                <label className="pdf-filter-label">
                  <input type="checkbox" checked={showPartial} onChange={(e) => setShowPartial(e.target.checked)} />
                  <span style={{ color: '#d97706' }}>Partiel</span>
                </label>
                <label className="pdf-filter-label">
                  <input type="checkbox" checked={showUnpaid} onChange={(e) => setShowUnpaid(e.target.checked)} />
                  <span style={{ color: '#dc2626' }}>Non payé</span>
                </label>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => generateSummaryPDF(true)} disabled={generatingPdfTTC} className="modern-btn modern-btn-success">
                    {generatingPdfTTC ? <Loader size={14} className="spinning" /> : <Printer size={14} />}
                    {generatingPdfTTC ? 'Génération...' : 'PDF TTC (Récap)'}
                  </button>
                  <button onClick={() => generateSummaryPDF(false)} disabled={generatingPdfHT} className="modern-btn modern-btn-warning">
                    {generatingPdfHT ? <Loader size={14} className="spinning" /> : <Printer size={14} />}
                    {generatingPdfHT ? 'Génération...' : 'PDF HT (Récap)'}
                  </button>
                </div>
              </div>
              
              {/* Date Filter Row */}
              <div className="date-filter-row">
                <div className="date-filter-field">
                  <label>Date début</label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="date-filter-input" />
                </div>
                <div className="date-filter-field">
                  <label>Date fin</label>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="date-filter-input" />
                </div>
                <button onClick={() => { setStartDate(''); setEndDate(''); }} className="modern-btn modern-btn-secondary" style={{ padding: '0.5rem 1rem' }}>
                  <X size={14} /> Effacer filtres
                </button>
                <div className="date-filter-field" style={{ marginLeft: 'auto' }}>
                  <span style={{ fontSize: '0.7rem', color: '#475569' }}>
                    Total: {filteredItems.length} élément(s) | HT: {safeToFixed(totalHTFiltered)} MAD | TTC: {safeToFixed(totalTTCFiltered)} MAD
                  </span>
                </div>
              </div>
              
              {/* Main Table */}
              <div className="activations-table-container">
                <table className="activations-table">
                  <thead>
                    <tr>
                      <th className="checkbox-col">
                        <input type="checkbox" checked={selectedRows.size === filteredItems.length && filteredItems.length > 0} onChange={selectAllFiltered} className="row-checkbox" />
                      </th>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Matricule(s)</th>
                      <th>Plan</th>
                      <th>Prix TTC</th>
                      <th>Statut Paiement</th>
                      <th>Montant Payé</th>
                      <th>Reste</th>
                      <th>Facture</th>
                      <th style={{ width: '40px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item) => {
                      const isGroup = item.isGroup;
                      const paymentColor = isGroup ? getPaymentStatusColor(item.overallPaymentStatus) : getPaymentStatusColor(item.paymentStatus);
                      const displayPrice = isGroup ? item.grandTotalTTC : item.displayPriceTTC;
                      const amountPaid = isGroup ? item.totalPaid : item.amountPaid;
                      const remaining = isGroup ? item.totalRemaining : item.remainingAmount;
                      const isGenerating = generatingInvoice === item.id;
                      const isExpanded = isGroup && expandedGroups[item.id];
                      
                      return (
                        <React.Fragment key={item.id}>
                          <tr className={isGroup ? `installation-row ${isExpanded ? 'expanded' : ''}` : ''}>
                            <td className="checkbox-col">
                              <input type="checkbox" checked={selectedRows.has(item.id)} onChange={() => toggleRowSelection(item.id)} className="row-checkbox" />
                            </td>
                            <td>{formatDate(item.date)}</td>
                            <td>
                              <span className="status-badge status-primary">
                                {isGroup ? item.type : (item.typeLabel || 'Activation')}
                              </span>
                              {isGroup && (
                                <span className="expand-icon" style={{ marginLeft: '8px', cursor: 'pointer' }} onClick={() => toggleGroup(item.id)}>
                                  <ChevronRight size={14} className={isExpanded ? 'rotated' : ''} />
                                </span>
                              )}
                            </td>
                            <td>
                              {isGroup ? item.activations.map(a => a.matricule).join(', ') : item.matricule}
                              {isGroup && item.activations.length > 1 && (
                                <span style={{ marginLeft: '0.5rem', background: '#e2e8f0', padding: '0.125rem 0.375rem', borderRadius: '0.25rem', fontSize: '0.6rem', color: '#475569' }}>
                                  {item.activations.length} activations
                                </span>
                              )}
                            </td>
                            <td>
                              {isGroup ? (
                                <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                                  {item.activations.map(a => PLAN_LABEL[a.plan] || a.plan).join(', ')}
                                </span>
                              ) : (
                                PLAN_LABEL[item.plan] || item.plan || '-'
                              )}
                            </td>
                            <td>
                              {editingPrice === item.id ? (
                                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                  <input type="number" step="0.01" value={tempPrice} onChange={e => setTempPrice(e.target.value)} style={{ width: '80px', padding: '4px', borderRadius: '4px', border: '1px solid #d1d5db' }} autoFocus />
                                  <button onClick={() => saveTempPrice(item.id)} style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer' }}>✓</button>
                                  <button onClick={cancelEdit} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer' }}>✗</button>
                                </div>
                              ) : (
                                <span onClick={() => startEditPrice(item.id, displayPrice)} style={{ cursor: 'pointer', backgroundColor: '#f8fafc', padding: '2px 4px', borderRadius: '4px', display: 'inline-block', fontWeight: 'bold', color: '#059669' }}>
                                  {safeToFixed(displayPrice)} MAD
                                </span>
                              )}
                            </td>
                            <td>
                              <span className="status-badge" style={{ background: paymentColor.bg, color: paymentColor.color }}>
                                {paymentColor.label}
                              </span>
                            </td>
                            <td style={{ color: '#059669' }}>{safeToFixed(amountPaid)} MAD</td>
                            <td style={{ color: '#dc2626' }}>{safeToFixed(remaining)} MAD</td>
                            <td>
                              <button onClick={() => setCachetChoiceItem(item)} disabled={isGenerating} className="modern-btn modern-btn-success" style={{ padding: '4px 8px', fontSize: '11px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
                                {isGenerating ? <Loader size={12} className="spinning" /> : <Download size={12} />}
                              </button>
                            </td>
                            <td></td>
                          </tr>
                          {isGroup && isExpanded && item.activations.map((act, idx) => (
                            <tr key={`${item.id}_sub_${idx}`} className="activation-subrow">
                              <td colSpan="10" style={{ padding: '0 !important' }}>
                                <table className="subtable">
                                  <tbody>
                                    <tr>
                                      <td className="sub-label">Activation #{idx+1}:</td>
                                      <td><strong>{act.type}</strong></td>
                                      <td className="sub-label">Matricule:</td>
                                      <td>{act.matricule}</td>
                                      <td className="sub-label">IMEI:</td>
                                      <td style={{ fontFamily: 'monospace' }}>{act.displayImei}</td>
                                    </tr>
                                    <tr>
                                      <td className="sub-label">Date:</td>
                                      <td>{formatDate(act.date)}</td>
                                      <td className="sub-label">Plan:</td>
                                      <td>{PLAN_LABEL[act.plan] || act.plan || '-'}</td>
                                      <td className="sub-label">Opérateur:</td>
                                      <td>{act.operator || '-'}</td>
                                    </tr>
                                    <tr>
                                      <td className="sub-label">Prix TTC:</td>
                                      <td>{safeToFixed(act.displayPriceTTC)} MAD</td>
                                      <td className="sub-label">Statut:</td>
                                      <td><span className="status-badge" style={{ background: getPaymentStatusColor(act.paymentStatus).bg, color: getPaymentStatusColor(act.paymentStatus).color }}>{getPaymentStatusColor(act.paymentStatus).label}</span></td>
                                      <td className="sub-label">Payé:</td>
                                      <td style={{ color: '#059669' }}>{safeToFixed(act.amountPaid)} MAD</td>
                                    </tr>
                                  </tbody>
                                </table>
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      );
                    })}
                    {filteredItems.length === 0 && (
                      <tr><td colSpan={11} className="clients-empty">Aucune activation ou renouvellement trouvé</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
        <div className="clients-dialog-footer">
          <button onClick={onClose} className="modern-btn modern-btn-secondary">Fermer</button>
        </div>
      </div>
      
      {/* PORTALS FOR CACHET CHOICE DIALOGS (rendered outside modal overlay) */}
      {showCachetPromptCombined && ReactDOM.createPortal(
        <CachetChoicePrompt onClose={() => setShowCachetPromptCombined(false)} onConfirm={async (showCachet) => { setShowCachetPromptCombined(false); await handleGenerateCombinedInvoice(showCachet); }} />,
        document.body
      )}
      {cachetChoiceItem && ReactDOM.createPortal(
        <CachetChoicePrompt onClose={() => setCachetChoiceItem(null)} onConfirm={async (showCachet) => { setCachetChoiceItem(null); await handleGenerateSingleInvoice(cachetChoiceItem, showCachet); }} />,
        document.body
      )}
    </div>
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
    const salesTotal = clientSales.reduce((sum, sale) => {
      const saleTotal = sale.sale_total_ttc || sale.total || 0;
      return sum + safeNumber(saleTotal);
    }, 0);
    const clientActivations = allActivations.filter(a => a.client_id === clientId);
    const activationsTotal = clientActivations.reduce((sum, act) => {
      const priceHT = safeNumber(act.price);
      const priceTTC = calculateTTC(priceHT);
      return sum + priceTTC;
    }, 0);
    return salesTotal + activationsTotal;
  };

  const purchaseCount = (id) => {
    return sales?.filter(s => s.client_id === id || s.clientId === id).length || 0;
  };

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
        activations: [{
          id: Date.now(),
          matricule: '',
          date_activation: new Date().toISOString().slice(0,10),
          price: 0,
          plan_abonnement: ''
        }]
      }]
    }));
  };

  const updateInstallationProduct = (id, field, value) => {
    setActivationModal(prev => ({
      ...prev,
      cart: prev.cart.map(item => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          
          if (field === 'quantity') {
            const newQuantity = parseInt(value) || 1;
            const currentActivations = updated.activations || [];
            
            if (newQuantity > currentActivations.length) {
              const additionalActivations = [];
              for (let i = currentActivations.length; i < newQuantity; i++) {
                additionalActivations.push({
                  id: Date.now() + i,
                  matricule: '',
                  date_activation: new Date().toISOString().slice(0,10),
                  price: 0,
                  plan_abonnement: ''
                });
              }
              updated.activations = [...currentActivations, ...additionalActivations];
            } else if (newQuantity < currentActivations.length) {
              updated.activations = currentActivations.slice(0, newQuantity);
            }
          }
          
          if (field === 'produit_id' && value && productPrices[value]) {
            updated.unit_price = productPrices[value];
          }
          
          return updated;
        }
        return item;
      })
    }));
  };

  const updateActivationField = (productId, activationId, field, value) => {
    setActivationModal(prev => ({
      ...prev,
      cart: prev.cart.map(item => {
        if (item.id === productId) {
          return {
            ...item,
            activations: item.activations.map(act => 
              act.id === activationId ? { ...act, [field]: value } : act
            )
          };
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
      sum + (item.activations || []).reduce((actSum, act) => actSum + safeNumber(act.price), 0), 0);
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
        for (const act of (item.activations || [])) {
          if (!act.matricule || !act.matricule.trim()) {
            setActivationModal(prev => ({ ...prev, formError: 'Veuillez remplir le matricule pour toutes les activations' }));
            return false;
          }
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
        const activationsPayload = [];
        for (const item of activationModal.cart) {
          for (const act of (item.activations || [])) {
            activationsPayload.push({
              produit_id: item.produit_id,
              quantity: 1,
              unit_price: item.unit_price,
              matricule: act.matricule.trim(),
              date_activation: act.date_activation,
              price: act.price || 0,
              plan_abonnement: act.plan_abonnement || null
            });
          }
        }
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
                  <td className="font-medium">{c.nom}</td>
                  <td>{c.telephone || '-'}</td>
                  <td className="hide-on-tablet text-muted">{c.email || '-'}</td>
                  <td className="hide-on-mobile font-mono" style={{ fontSize: '0.7rem' }}>{c.ice_client || '-'}</td>
                  <td className="hide-on-tablet text-muted">{c.adresse ? (c.adresse.length > 20 ? c.adresse.substring(0, 20) + '...' : c.adresse) : '-'}</td>
                  <td style={{ textAlign: 'center' }}>{purchaseCount(c.id)}</td>
                  <td className="text-right hide-on-mobile font-semibold" style={{ color: '#059669' }}>{calculateTotalSpent(c.id).toFixed(2)} MAD</td>
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
                  <input className="clients-input" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} placeholder="Ex: Jean Dupont" autoFocus />
                </div>
                <div className="clients-form-group">
                  <label className="clients-label clients-label-required">Numéro de téléphone</label>
                  <input className="clients-input" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} placeholder="Ex: 06 12 34 56 78" />
                </div>
                <div className="clients-form-group">
                  <label className="clients-label">Adresse email</label>
                  <input type="email" className="clients-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="client@example.com" />
                </div>
                <div className="clients-form-group">
                  <label className="clients-label">ICE Client</label>
                  <input type="number" className="clients-input" value={form.ice_client} onChange={(e) => setForm({ ...form, ice_client: e.target.value })} placeholder="Ex: 123456789012345" />
                  <small style={{ fontSize: '0.65rem', color: '#6b7280' }}>Identifiant Commun de l'Entreprise (ICE)</small>
                </div>
                <div className="clients-form-group form-full-width">
                  <label className="clients-label">Adresse</label>
                  <input className="clients-input" value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} placeholder="Ex: 123 Rue Example, Casablanca" />
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

      {/* Activation Modal */}
      {activationModal.isOpen && (
        <>
          <div className="clients-overlay" onClick={() => setActivationModal(prev => ({ ...prev, isOpen: false }))} />
          <div className="clients-dialog" style={{ maxWidth: '900px' }} onClick={e => e.stopPropagation()}>
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
                    cart: [{
                      id: Date.now(), 
                      produit_id: '', 
                      quantity: 1, 
                      unit_price: 0, 
                      activations: [{
                        id: Date.now(),
                        matricule: '',
                        date_activation: new Date().toISOString().slice(0,10),
                        price: 0,
                        plan_abonnement: ''
                      }]
                    }], 
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
                        <button type="button" onClick={() => removeActivationRow(row.id)} className="remove-btn">
                          <Trash2 size={12} /> Supprimer
                        </button>
                      </div>
                      <div style={{ padding: '1rem' }}>
                        <div className="form-grid">
                          <div className="clients-form-group">
                            <label className="clients-label clients-label-required">Date d'activation</label>
                            <input type="date" value={row.date} onChange={e => updateActivationRow(row.id, 'date', e.target.value)} className="clients-input" />
                          </div>
                          <div className="clients-form-group">
                            <label className="clients-label clients-label-required">Matricule</label>
                            <input type="text" value={row.matricule} onChange={e => updateActivationRow(row.id, 'matricule', e.target.value)} className="clients-input" placeholder="Ex: ABC-123" />
                          </div>
                          <div className="clients-form-group">
                            <label className="clients-label clients-label-required">Prix HT (MAD)</label>
                            <input type="number" step="0.01" value={row.price || ""} onChange={e => updateActivationRow(row.id, 'price', parseFloat(e.target.value) || 0)} className="clients-input" placeholder="0.00" />
                            <small style={{ fontSize: '0.65rem', color: '#6b7280' }}>TVA 20% sera ajoutée automatiquement</small>
                          </div>
                          <div className="clients-form-group">
                            <label className="clients-label">Plan d'abonnement</label>
                            <select value={row.plan_abonnement} onChange={e => updateActivationRow(row.id, 'plan_abonnement', e.target.value)} className="clients-input">
                              <option value="">-- Sélectionner un plan --</option>
                              {PLAN_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                          </div>
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
                      Ajoutez des produits avec leurs activations associées (1 activation par quantité)
                    </p>
                  </div>
                  
                  {activationModal.cart.map((item, index) => (
                    <div key={item.id} className="activation-item" style={{ marginBottom: '1.5rem', border: '2px solid #e2e8f0' }}>
                      <div className="activation-item-header" style={{ background: '#f1f5f9' }}>
                        <span className="activation-item-title" style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
                          Produit #{index + 1}
                        </span>
                        <button type="button" onClick={() => removeInstallationProduct(item.id)} className="remove-btn">
                          <Trash2 size={14} /> Supprimer le produit
                        </button>
                      </div>
                      
                      <div style={{ padding: '1rem' }}>
                        <div className="form-grid" style={{ marginBottom: '1.5rem' }}>
                          <div className="clients-form-group">
                            <label className="clients-label clients-label-required">Produit</label>
                            <SearchableSelect
                              options={activationProducts}
                              value={item.produit_id}
                              onChange={(productId) => updateInstallationProduct(item.id, 'produit_id', productId)}
                              placeholder="Rechercher un produit..."
                            />
                          </div>
                          <div className="clients-form-group">
                            <label className="clients-label clients-label-required">Quantité</label>
                            <input 
                              type="number" 
                              min="1" 
                              max="10"
                              value={item.quantity} 
                              onChange={e => updateInstallationProduct(item.id, 'quantity', parseInt(e.target.value) || 1)} 
                              className="clients-input" 
                              style={{ fontWeight: 'bold', borderColor: '#3b82f6' }}
                            />
                            <small style={{ fontSize: '0.65rem', color: '#3b82f6' }}>
                              ⚠️ La quantité détermine le nombre d'activations
                            </small>
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
                        </div>
                        
                        <div style={{ 
                          marginTop: '1rem', 
                          borderTop: '2px solid #e2e8f0', 
                          paddingTop: '1rem',
                          background: '#f8fafc',
                          borderRadius: '0.5rem',
                          padding: '1rem'
                        }}>
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            marginBottom: '1rem',
                            paddingBottom: '0.5rem',
                            borderBottom: '1px solid #cbd5e1'
                          }}>
                            <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1e293b' }}>
                              📱 Activations ({item.activations?.length || 0} / {item.quantity})
                            </h4>
                            <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                              Une activation par quantité
                            </span>
                          </div>
                          
                          {(item.activations || []).map((activation, actIndex) => (
                            <div key={activation.id} className="activation-item" style={{ 
                              marginBottom: '1rem', 
                              background: 'white',
                              border: '1px solid #e2e8f0'
                            }}>
                              <div className="activation-item-header" style={{ 
                                background: '#ffffff', 
                                padding: '0.5rem 0.75rem',
                                borderBottom: '1px solid #e2e8f0'
                              }}>
                                <span className="activation-item-title" style={{ fontSize: '0.8rem' }}>
                                  Activation #{actIndex + 1}
                                </span>
                              </div>
                              <div style={{ padding: '0.75rem' }}>
                                <div className="form-grid">
                                  <div className="clients-form-group">
                                    <label className="clients-label clients-label-required">Matricule</label>
                                    <input 
                                      type="text" 
                                      value={activation.matricule} 
                                      onChange={e => updateActivationField(item.id, activation.id, 'matricule', e.target.value)} 
                                      className="clients-input" 
                                      placeholder="Ex: ABC-123"
                                    />
                                  </div>
                                  <div className="clients-form-group">
                                    <label className="clients-label">Date d'activation</label>
                                    <input 
                                      type="date" 
                                      value={activation.date_activation} 
                                      onChange={e => updateActivationField(item.id, activation.id, 'date_activation', e.target.value)} 
                                      className="clients-input" 
                                    />
                                  </div>
                                  <div className="clients-form-group">
                                    <label className="clients-label">Plan d'abonnement</label>
                                    <select 
                                      value={activation.plan_abonnement} 
                                      onChange={e => updateActivationField(item.id, activation.id, 'plan_abonnement', e.target.value)} 
                                      className="clients-input"
                                    >
                                      <option value="">-- Sélectionner un plan --</option>
                                      {PLAN_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                  </div>
                                  <div className="clients-form-group">
                                    <label className="clients-label">Prix d'activation HT (MAD)</label>
                                    <input 
                                      type="number" 
                                      step="0.01" 
                                      value={activation.price || ""} 
                                      onChange={e => updateActivationField(item.id, activation.id, 'price', parseFloat(e.target.value) || 0)} 
                                      className="clients-input" 
                                      placeholder="0.00"
                                    />
                                    <small style={{ fontSize: '0.65rem', color: '#6b7280' }}>Optionnel - frais d'activation supplémentaires</small>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <button onClick={addInstallationProduct} className="modern-btn modern-btn-secondary" style={{ width: '100%', marginTop: '0.5rem' }}>
                    <Plus size={14} /> Ajouter un produit
                  </button>

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
                      <strong>{safeToFixed(activationModal.cart.reduce((sum, item) => 
                        sum + (item.activations || []).reduce((actSum, act) => actSum + safeNumber(act.price), 0), 0))} MAD</strong>
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
              <button onClick={() => setActivationModal(prev => ({ ...prev, isOpen: false }))} className="clients-btn clients-btn-outline" disabled={activationModal.loading}>
                Annuler
              </button>
              <button onClick={submitActivationModal} className="clients-btn clients-btn-primary" disabled={activationModal.loading}>
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