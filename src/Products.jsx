import { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Pencil, Trash2, Search, X, Package, RefreshCw, HardDrive, Edit, Save, AlertCircle, CheckCircle, Info, AlertTriangle, Cpu, Wifi, MapPin, Battery, Signal, Activity, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { ExportMenu } from './ExportMenu';
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  fetchCategories,
  clearProductError,
  fetchGpsDevices,
  createGpsDevice,
  updateGpsDevice,
  deleteGpsDevice,
  getAvailableDevices
} from './Store/store';

// ==================== STYLES ====================
const styles = `
  /* Base Layout */
  .products-page-header {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  
  @media (min-width: 768px) {
    .products-page-header {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
    }
  }
  
  .products-title {
    font-size: 1.5rem;
    font-weight: 700;
    letter-spacing: -0.025em;
    line-height: 1.25;
    color: #111827;
  }
  
  @media (min-width: 768px) {
    .products-title {
      font-size: 1.875rem;
    }
  }
  
  .products-subtitle {
    font-size: 0.75rem;
    color: #6b7280;
    margin-top: 0.25rem;
  }
  
  .products-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .products-card {
    background: white;
    border-radius: 0.5rem;
    border: 1px solid #e5e7eb;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  }
  
  /* Consolidated Filter Bar (like Sales page) */
  .products-filter-bar {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .products-search-wrapper {
    position: relative;
    flex: 3;
    min-width: 300px;
  }
  
  .products-search-icon {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    width: 1rem;
    height: 1rem;
    color: #9ca3af;
    pointer-events: none;
  }
  
  .products-search-input {
    width: 100%;
    padding: 0.5rem 0.75rem 0.5rem 2.25rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 0.75rem;
    outline: none;
    transition: all 0.2s;
  }
  
  .products-search-input:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }
  
  .products-filter-select {
    padding: 0.5rem 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 0.75rem;
    background: white;
    cursor: pointer;
    width: auto;
    min-width: 130px;
  }
  
  .products-filter-select:focus {
    border-color: #3b82f6;
    outline: none;
  }
  
  .products-filter-group {
    display: flex;
    gap: 0.5rem;
    flex-shrink: 0;
  }
  
  @media (max-width: 1024px) {
    .products-search-wrapper {
      flex: 2;
      min-width: 250px;
    }
    .products-filter-select {
      min-width: 110px;
    }
  }
  
  @media (max-width: 768px) {
    .products-filter-bar {
      flex-wrap: wrap;
    }
    .products-search-wrapper {
      flex: 1 1 100%;
      min-width: auto;
    }
    .products-filter-select {
      flex: 1;
      min-width: auto;
    }
  }
  
  /* Table Styles */
  .products-table-container {
    position: relative;
    width: 100%;
    overflow: auto;
  }
  
  .products-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.75rem;
  }
  
  .products-table thead tr {
    border-bottom: 1px solid #e5e7eb;
    background: #f9fafb;
  }
  
  .products-table th {
    height: 3rem;
    padding: 0 1rem;
    text-align: left;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    color: #6b7280;
    vertical-align: middle;
  }
  
  .products-table tbody tr {
    border-bottom: 1px solid #f3f4f6;
    transition: all 0.2s ease;
  }
  
  .products-table tbody tr:hover {
    background-color: #f9fafb;
    transform: translateX(2px);
  }
  
  .products-table tbody tr:last-child {
    border-bottom: 0;
  }
  
  .products-table td {
    padding: 1rem;
    vertical-align: middle;
  }
  
  .products-table .font-medium {
    font-weight: 500;
    color: #111827;
  }
  
  .products-table .text-muted {
    color: #6b7280;
  }
  
  .products-table .text-right {
    text-align: right;
  }
  
  .products-table .font-semibold {
    font-weight: 600;
    color: #059669;
  }
  
  .products-table .font-mono {
    font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
  }
  
  .products-table .w-24 {
    width: 6rem;
  }
  
  .products-empty {
    text-align: center;
    color: #9ca3af;
    padding: 3rem 0;
  }
  
  /* Loading State */
  .products-loading {
    text-align: center;
    padding: 3rem 0;
  }
  
  .products-loading-spinner {
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
  .products-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
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
  
  .products-btn:focus-visible {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }
  
  .products-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .products-btn svg {
    pointer-events: none;
    width: 1rem;
    height: 1rem;
    flex-shrink: 0;
  }
  
  .products-btn-default {
    height: 2.5rem;
    padding: 0.5rem 1rem;
  }
  
  .products-btn-primary {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  }
  
  .products-btn-primary:hover:not(:disabled) {
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }
  
  .products-btn-outline {
    height: 2.5rem;
    padding: 0.5rem 1rem;
    border: 1px solid #d1d5db;
    background: white;
    color: #374151;
  }
  
  .products-btn-outline:hover:not(:disabled) {
    background: #f9fafb;
    border-color: #9ca3af;
  }
  
  .products-btn-ghost {
    background: transparent;
    color: #6b7280;
  }
  
  .products-btn-ghost:hover:not(:disabled) {
    background: #f3f4f6;
    color: #374151;
  }
  
  .products-btn-icon {
    height: 2.5rem;
    width: 2.5rem;
    padding: 0;
  }
  
  .products-btn-danger {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    color: white;
  }
  
  .products-btn-danger:hover:not(:disabled) {
    background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }
  
  .products-actions-cell {
    display: flex;
    gap: 0.25rem;
  }
  
  /* Badge Styles */
  .products-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 500;
    line-height: 1rem;
  }
  
  .products-badge-destructive {
    background-color: #fef2f2;
    color: #dc2626;
    border: 1px solid #fca5a5;
  }
  
  .products-badge-success {
    background-color: #f0fdf4;
    color: #16a34a;
    border: 1px solid #86efac;
  }
  
  .products-badge-warning {
    background-color: #fefce8;
    color: #ca8a04;
    border: 1px solid #fde047;
  }
  
  .products-badge-info {
    background-color: #eff6ff;
    color: #2563eb;
    border: 1px solid #bfdbfe;
  }
  
  .products-device-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.25rem 0.5rem;
    border-radius: 0.375rem;
    font-size: 0.75rem;
    color: #2563eb;
    transition: all 0.2s ease;
  }
  
  .products-device-btn:hover {
    background-color: #eff6ff;
    transform: scale(1.05);
  }
  
  .products-device-btn svg {
    width: 1rem;
    height: 1rem;
  }
  
  /* Modal/Dialog Styles */
  .products-overlay {
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
  
  .products-dialog {
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
  
  .products-dialog-lg {
    max-width: 48rem;
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
  
  /* Delete Confirmation Dialog - Enhanced */
  .products-dialog-danger {
    border-top: 4px solid #ef4444;
    animation: shakeWarning 0.5s ease-out;
  }
  
  @keyframes shakeWarning {
    0%, 100% { transform: translate(-50%, -50%) scale(1); }
    25% { transform: translate(-50%, -50%) scale(1.02); }
    75% { transform: translate(-50%, -50%) scale(0.98); }
  }
  
  .products-dialog-header {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    text-align: center;
  }
  
  @media (min-width: 640px) {
    .products-dialog-header {
      text-align: left;
    }
  }
  
  .products-dialog-title {
    font-size: 1.25rem;
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: -0.025em;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .products-dialog-title-danger {
    color: #dc2626;
  }
  
  .products-dialog-description {
    font-size: 0.75rem;
    color: #6b7280;
    margin-top: 0.25rem;
  }
  
  .products-dialog-body {
    display: grid;
    gap: 1rem;
  }
  
  .products-dialog-footer {
    display: flex;
    flex-direction: column-reverse;
    gap: 0.75rem;
  }
  
  @media (min-width: 640px) {
    .products-dialog-footer {
      flex-direction: row;
      justify-content: flex-end;
    }
  }
  
  .products-dialog-close {
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
  
  .products-dialog-close:hover {
    opacity: 1;
    background: #f3f4f6;
  }
  
  /* Enhanced Warning Box for Delete */
  .delete-warning {
    background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
    border: 2px solid #f59e0b;
    border-radius: 0.75rem;
    padding: 1.25rem;
    margin: 0.5rem 0;
    position: relative;
    overflow: hidden;
    animation: pulseWarning 2s ease-in-out infinite;
  }
  
  @keyframes pulseWarning {
    0%, 100% {
      box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4);
    }
    50% {
      box-shadow: 0 0 0 8px rgba(245, 158, 11, 0);
    }
  }
  
  .delete-warning::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #f59e0b, #ef4444, #f59e0b);
    animation: gradientShift 2s linear infinite;
  }
  
  @keyframes gradientShift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  
  .delete-warning-title {
    font-weight: 700;
    font-size: 1rem;
    color: #d97706;
    margin-bottom: 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .delete-warning-text {
    font-size: 0.75rem;
    color: #78350f;
    line-height: 1.5;
  }
  
  .delete-warning-text strong {
    color: #dc2626;
    font-weight: 600;
  }
  
  /* Form Styles */
  .products-label {
    font-size: 0.75rem;
    font-weight: 500;
    line-height: 1;
    color: #374151;
  }
  
  .products-label-required::after {
    content: '*';
    color: #ef4444;
    margin-left: 0.25rem;
  }
  
  .products-input {
    width: 100%;
    height: 2.5rem;
    padding: 0.5rem 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    font-size: 0.75rem;
    background: white;
    color: #111827;
    outline: none;
    transition: all 0.2s ease;
  }
  
  .products-input:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  .products-input::placeholder {
    color: #9ca3af;
  }
  
  .products-input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: #f9fafb;
  }
  
  .products-select {
    width: 100%;
    height: 2.5rem;
    padding: 0.5rem 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    font-size: 0.75rem;
    background: white;
    color: #111827;
    outline: none;
    cursor: pointer;
    transition: all 0.2s ease;
    appearance: auto;
  }
  
  .products-select:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  .products-form-group {
    display: grid;
    gap: 0.5rem;
  }
  
  .products-grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }
  
  /* Pagination Styles */
  .products-pagination-container {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem;
    border-top: 1px solid #e5e7eb;
  }
  
  .products-pagination-btn {
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
  
  .products-pagination-btn:hover:not(:disabled) {
    background: #f9fafb;
    border-color: #9ca3af;
    transform: translateY(-1px);
  }
  
  .products-pagination-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .products-pagination-info {
    padding: 0.5rem 1rem;
    font-size: 0.75rem;
    color: #6b7280;
  }
  
  .products-pagination-active {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
    border-color: #3b82f6;
  }
  
  /* Toast/Notification Styles */
  .products-toast-container {
    position: fixed;
    bottom: 1rem;
    right: 1rem;
    z-index: 100;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .products-toast {
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
  
  .products-toast-success {
    border-left-color: #10b981;
  }
  
  .products-toast-success svg {
    color: #10b981;
  }
  
  .products-toast-error {
    border-left-color: #ef4444;
  }
  
  .products-toast-error svg {
    color: #ef4444;
  }
  
  .products-toast-info {
    border-left-color: #3b82f6;
  }
  
  .products-toast-info svg {
    color: #3b82f6;
  }
  
  .products-toast-message {
    flex: 1;
    font-size: 0.75rem;
    color: #374151;
  }
  
  .products-toast-close {
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0.25rem;
    color: #9ca3af;
    transition: color 0.2s ease;
  }
  
  .products-toast-close:hover {
    color: #374151;
  }
  
  /* Message Styles */
  .error-message {
    background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
    border: 1px solid #fca5a5;
    border-radius: 0.5rem;
    padding: 0.75rem 1rem;
    color: #dc2626;
    font-size: 0.75rem;
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
    font-size: 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  /* Enhanced Confirmation Dialog */
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
    position: relative;
    overflow: hidden;
  }
  
  .confirm-dialog::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #ef4444, #dc2626, #b91c1c);
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
    color: #111827;
    margin-bottom: 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  
  .confirm-title-danger {
    color: #dc2626;
  }
  
  .confirm-message {
    font-size: 0.95rem;
    color: #4b5563;
    margin-bottom: 1.5rem;
    line-height: 1.6;
    padding: 0.75rem;
    background: #f9fafb;
    border-radius: 0.5rem;
    border-left: 3px solid #ef4444;
  }
  
  .confirm-message strong {
    color: #dc2626;
    font-weight: 600;
  }
  
  .confirm-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
  }
  
  .confirm-btn {
    padding: 0.625rem 1.25rem;
    border-radius: 0.5rem;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .confirm-btn-cancel {
    background: #f3f4f6;
    color: #374151;
    border: 1px solid #e5e7eb;
  }
  
  .confirm-btn-cancel:hover {
    background: #e5e7eb;
    transform: translateY(-1px);
  }
  
  .confirm-btn-danger {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    color: white;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  }
  
  .confirm-btn-danger:hover {
    background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
    transform: translateY(-2px);
    box-shadow: 0 4px 6px -1px rgba(220, 38, 38, 0.3);
  }
  
  .confirm-btn-danger:active {
    transform: translateY(0);
  }
  
  .confirm-btn-primary {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
  }
  
  .confirm-btn-primary:hover {
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.3);
  }
  
  /* ==================== IMPROVED IMEI DEVICES STYLES ==================== */
  
  /* Device Manager Container */
  .device-manager-container {
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border-radius: 1rem;
    padding: 1.25rem;
    margin-top: 0.5rem;
  }
  
  /* Add Device Section - Enhanced */
  .add-device-section {
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
    border-radius: 1rem;
    padding: 1.25rem;
    border: 1px solid #e2e8f0;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
  }
  
  .add-device-section:hover {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    border-color: #cbd5e1;
  }
  
  .add-device-title {
    font-size: 0.75rem;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .add-device-title svg {
    color: #3b82f6;
  }
  
  /* IMEI Input - Special Styling */
  .imei-input-wrapper {
    position: relative;
  }
  
  .imei-input {
    font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
    font-size: 0.75rem;
    letter-spacing: 0.5px;
    background: #ffffff;
    border: 2px solid #e2e8f0;
    border-radius: 0.75rem;
    padding: 0.625rem 1rem;
    transition: all 0.3s ease;
  }
  
  .imei-input:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    background: #ffffff;
  }
  
  .imei-input::placeholder {
    font-family: system-ui, -apple-system, sans-serif;
    letter-spacing: normal;
    color: #94a3b8;
  }
  
  /* Devices Table - Enhanced */
  .devices-table-container {
    background: white;
    border-radius: 1rem;
    overflow: hidden;
    border: 1px solid #e2e8f0;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
  }
  
  .devices-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    font-size: 0.75rem;
  }
  
  .devices-table thead tr {
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  }
  
  .devices-table th {
    padding: 1rem 0.75rem;
    text-align: left;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #475569;
    border-bottom: 2px solid #e2e8f0;
  }
  
  .devices-table tbody tr {
    transition: all 0.2s ease;
    border-bottom: 1px solid #f1f5f9;
  }
  
  .devices-table tbody tr:hover {
    background: linear-gradient(90deg, #f8fafc 0%, #ffffff 100%);
    transform: scale(1.01);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
  
  .devices-table td {
    padding: 0.875rem 0.75rem;
    vertical-align: middle;
    border-bottom: 1px solid #f1f5f9;
  }
  
  /* IMEI Cell - Special Styling */
  .imei-cell {
    font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
    font-weight: 600;
    font-size: 0.8125rem;
    color: #0f172a;
    background: linear-gradient(135deg, #f1f5f9 0%, #f8fafc 100%);
    padding: 0.375rem 0.75rem;
    border-radius: 0.5rem;
    display: inline-block;
    letter-spacing: 0.5px;
    border: 1px solid #e2e8f0;
  }
  
  .imei-cell:hover {
    background: linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%);
    border-color: #3b82f6;
    transform: translateX(2px);
    transition: all 0.2s ease;
  }
  
  /* Edit Mode IMEI Input */
  .imei-edit-input {
    font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
    font-size: 0.8125rem;
    font-weight: 600;
    padding: 0.5rem 0.75rem;
    border: 2px solid #3b82f6;
    border-radius: 0.5rem;
    background: white;
    width: 160px;
    transition: all 0.2s ease;
  }
  
  .imei-edit-input:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  }
  
  /* Status Badges - Enhanced */
  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.375rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.025em;
    transition: all 0.2s ease;
    cursor: default;
  }
  
  .status-badge:hover {
    transform: scale(1.05);
  }
  
  .status-available {
    background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
    color: #16a34a;
    border: 1px solid #86efac;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }
  
  .status-available::before {
    content: '●';
    color: #22c55e;
    font-size: 0.625rem;
    animation: pulse 2s ease-in-out infinite;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  
  .status-reserved {
    background: linear-gradient(135deg, #fefce8 0%, #fef9c3 100%);
    color: #ca8a04;
    border: 1px solid #fde047;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }
  
  .status-reserved::before {
    content: '⏱';
    font-size: 0.75rem;
  }
  
  .status-assigned {
    background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
    color: #2563eb;
    border: 1px solid #bfdbfe;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }
  
  .status-assigned::before {
    content: '✓';
    font-size: 0.75rem;
    font-weight: bold;
  }
  
  /* Device ID Cell */
  .device-id {
    font-family: monospace;
    font-size: 0.75rem;
    color: #64748b;
    background: #f1f5f9;
    padding: 0.25rem 0.5rem;
    border-radius: 0.375rem;
    display: inline-block;
  }
  
  /* Date Cell */
  .device-date {
    font-size: 0.75rem;
    color: #64748b;
    white-space: nowrap;
    background: #f8fafc;
    padding: 0.25rem 0.5rem;
    border-radius: 0.375rem;
    display: inline-block;
  }
  
  /* Action Buttons - Enhanced */
  .device-actions {
    display: flex;
    gap: 0.375rem;
  }
  
  .device-action-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.375rem;
    border-radius: 0.5rem;
    background: transparent;
    border: 1px solid #e2e8f0;
    cursor: pointer;
    transition: all 0.2s ease;
    color: #64748b;
  }
  
  .device-action-btn:hover {
    transform: translateY(-1px);
  }
  
  .device-action-btn.edit-btn:hover {
    background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
    color: #2563eb;
    border-color: #3b82f6;
  }
  
  .device-action-btn.delete-btn:hover {
    background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
    color: #dc2626;
    border-color: #fca5a5;
    transform: scale(1.1);
  }
  
  .device-action-btn.save-btn:hover {
    background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
    color: #16a34a;
    border-color: #86efac;
  }
  
  .device-action-btn.cancel-btn:hover {
    background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
    color: #ef4444;
    border-color: #fca5a5;
  }
  
  /* Loading State for Devices */
  .devices-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    gap: 1rem;
  }
  
  .devices-loading-spinner {
    width: 2rem;
    height: 2rem;
    border: 3px solid #e2e8f0;
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  
  /* Empty State for Devices */
  .devices-empty {
    text-align: center;
    padding: 2.5rem;
    color: #94a3b8;
  }
  
  .devices-empty svg {
    width: 3rem;
    height: 3rem;
    margin-bottom: 0.75rem;
    opacity: 0.5;
  }
  
  /* Form Group for Device Add */
  .device-form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    flex: 1;
  }
  
  .device-form-label {
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #475569;
  }
  
  /* Add Device Form Layout - Responsive */
  .add-device-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  @media (min-width: 640px) {
    .add-device-form {
      flex-direction: row;
      align-items: flex-end;
    }
  }
  
  /* Status Select in Add Form */
  .status-select {
    padding: 0.625rem 1rem;
    border: 2px solid #e2e8f0;
    border-radius: 0.75rem;
    font-size: 0.75rem;
    font-weight: 500;
    background: white;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .status-select:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  /* Add Device Button - Enhanced */
  .add-device-submit-btn {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
    border: none;
    padding: 0.625rem 1.5rem;
    border-radius: 0.75rem;
    font-weight: 600;
    font-size: 0.75rem;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.2s ease;
    white-space: nowrap;
  }
  
  .add-device-submit-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  }
  
  .add-device-submit-btn:active {
    transform: translateY(0);
  }
  
  /* Delete Confirmation Dialog for Device */
  .delete-device-confirm {
    max-width: 28rem;
  }
  
  /* Scrollbar Styling for Device Table */
  .devices-table-container::-webkit-scrollbar {
    height: 0.5rem;
    width: 0.5rem;
  }
  
  .devices-table-container::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 9999px;
  }
  
  .devices-table-container::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 9999px;
  }
  
  .devices-table-container::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
  
  /* Stats Badge for Devices Count */
  .device-stats {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
    padding: 0.25rem 0.625rem;
    border-radius: 9999px;
    font-size: 0.7rem;
    font-weight: 600;
  }
  
  /* Responsive Table */
  @media (max-width: 768px) {
    .devices-table th,
    .devices-table td {
      padding: 0.75rem 0.5rem;
    }
    
    .imei-cell {
      font-size: 0.7rem;
      padding: 0.25rem 0.5rem;
    }
    
    .device-date {
      font-size: 0.65rem;
    }
    
    .status-badge {
      padding: 0.25rem 0.5rem;
      font-size: 0.65rem;
    }
  }
  
  /* Animation for new device addition */
  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  .device-row-new {
    animation: slideInRight 0.3s ease-out;
  }
  
  /* Tooltip Styles for IMEI */
  .imei-cell[title] {
    cursor: help;
    position: relative;
  }
  
  .text-destructive {
    color: #ef4444;
  }
  
  /* Hover Effects */
  .delete-hover-effect {
    transition: all 0.2s ease;
  }
  
  .delete-hover-effect:hover {
    transform: scale(1.1);
    filter: drop-shadow(0 0 4px rgba(239, 68, 68, 0.5));
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
    input::placeholder {
  color: #999;
  font-style: italic;
  opacity: 1;
}
`;

// Helper function to safely format price
const formatPrice = (price) => {
  if (price === undefined || price === null) return '0';
  const num = typeof price === 'string' ? parseFloat(price) : price;
  return isNaN(num) ? '0' : num.toFixed(2);
};

// Helper function to safely parse number
const parseNumber = (value) => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(num) ? 0 : num;
};

// Helper function to get status label
const getStatusLabel = (status) => {
  const labels = {
    available: 'Disponible',
    reserved: 'Réservé',
    assigned: 'Assigné'
  };
  return labels[status] || status;
};

// Type mapping for display
const TYPE_OPTIONS = [
  { value: 'OBD', label: 'OBD (Plug & Play)' },
  { value: 'MAGNETIC', label: 'Magnétique' },
  { value: 'HARDWIRED', label: 'Câblé' },
  { value: 'SIM', label: 'Temps réel (SIM)' },
  { value: 'NAVIGATION', label: 'Navigation GPS' }
];

const getTypeLabel = (type) => {
  const option = TYPE_OPTIONS.find(opt => opt.value === type);
  return option ? option.label : type;
};

const getTypeBadgeClass = (type) => {
  switch(type) {
    case 'OBD': return 'type-obd';
    case 'MAGNETIC': return 'type-magnetic';
    case 'HARDWIRED': return 'type-hardwired';
    case 'SIM': return 'type-sim';
    case 'NAVIGATION': return 'type-navigation';
    default: return '';
  }
};

// Type Badge Styles
const typeStyles = `
  .type-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.7rem;
    font-weight: 500;
  }
  .type-obd { 
    background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
    color: #1e40af; 
  }
  .type-magnetic { 
    background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
    color: #6b21a5; 
  }
  .type-hardwired { 
    background: linear-gradient(135deg, #fed7aa 0%, #fdba74 100%);
    color: #9a3412; 
  }
  .type-sim { 
    background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
    color: #065f46; 
  }
  .type-navigation { 
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    color: #92400e; 
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
  
  const Icon = type === 'success' ? CheckCircle : type === 'error' ? AlertCircle : Info;
  
  return (
    <div className={`products-toast products-toast-${type}`}>
      <Icon size={20} />
      <span className="products-toast-message">{message}</span>
      <button className="products-toast-close" onClick={onClose}>
        <X size={16} />
      </button>
    </div>
  );
};

// ==================== COMPONENTS ====================
const PageHeader = ({ title, subtitle, actions }) => (
  <div className="products-page-header">
    <div>
      <h1 className="products-title">{title}</h1>
      {subtitle && <p className="products-subtitle">{subtitle}</p>}
    </div>
    {actions && <div className="products-actions">{actions}</div>}
  </div>
);

const Card = ({ children, className = '' }) => (
  <div className={`products-card ${className}`}>{children}</div>
);

const Button = ({ children, variant = 'default', size = 'default', className = '', ...props }) => {
  const variantClass = variant === 'outline' ? 'products-btn-outline' :
                       variant === 'ghost' ? 'products-btn-ghost' :
                       variant === 'danger' ? 'products-btn-danger' :
                       'products-btn-primary';
  
  const sizeClass = size === 'icon' ? 'products-btn-icon' : 'products-btn-default';
  
  return (
    <button className={`products-btn ${variantClass} ${sizeClass} ${className}`} {...props}>
      {children}
    </button>
  );
};

const Input = ({ className = '', type = 'text', ...props }) => (
  <input type={type} className={`products-input ${className}`} {...props} />
);

const Select = ({ children, className = '', ...props }) => (
  <select className={`products-select ${className}`} {...props}>{children}</select>
);

const Label = ({ children, required = false, className = '' }) => (
  <label className={`products-label ${required ? 'products-label-required' : ''} ${className}`}>
    {children}
  </label>
);

const Badge = ({ children, variant = 'default' }) => {
  const variantClass = variant === 'destructive' ? 'products-badge-destructive' :
                       variant === 'success' ? 'products-badge-success' :
                       variant === 'warning' ? 'products-badge-warning' :
                       variant === 'info' ? 'products-badge-info' : '';
  
  return (
    <span className={`products-badge ${variantClass}`}>
      {children}
    </span>
  );
};

const TypeBadge = ({ type }) => {
  return (
    <span className={`type-badge ${getTypeBadgeClass(type)}`}>
      {getTypeLabel(type)}
    </span>
  );
};

// Enhanced Confirmation Dialog Component
const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel, variant = 'danger', loading = false }) => {
  if (!isOpen) return null;
  
  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <div className={`confirm-title ${variant === 'danger' ? 'confirm-title-danger' : ''}`}>
          {variant === 'danger' ? <AlertTriangle size={24} /> : <Info size={24} />}
          {title}
        </div>
        <div className="confirm-message">
          {message}
        </div>
        <div className="confirm-actions">
          <button onClick={onCancel} className="confirm-btn confirm-btn-cancel" disabled={loading}>
            Annuler
          </button>
          <button 
            onClick={onConfirm} 
            className={`confirm-btn ${variant === 'danger' ? 'confirm-btn-danger' : 'confirm-btn-primary'}`}
            disabled={loading}
          >
            {loading && <div className="products-loading-spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />}
            {variant === 'danger' ? 'Supprimer' : 'Confirmer'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Enhanced Device Management Modal
const DeviceManager = ({ product, onClose, onDevicesUpdated }) => {
  const dispatch = useDispatch();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newImei, setNewImei] = useState('');
  const [newStatus, setNewStatus] = useState('available');
  const [editingDevice, setEditingDevice] = useState(null);
  const [editImei, setEditImei] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, deviceId: null, deviceImei: '' });
  const [message, setMessage] = useState({ text: '', type: '' });
  const [toasts, setToasts] = useState([]);
  const [deleting, setDeleting] = useState(false);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3000);
  };

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    setLoading(true);
    try {
      const result = await dispatch(fetchGpsDevices({ produit_id: product.id })).unwrap();
      setDevices(Array.isArray(result) ? result : []);
    } catch (err) {
      setMessage({ text: err || 'Erreur lors du chargement des appareils', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddDevice = async () => {
    if (!newImei.trim()) {
      setMessage({ text: 'IMEI est requis', type: 'error' });
      showToast('IMEI est requis', 'error');
      return;
    }

    try {
      await dispatch(createGpsDevice({
        produit_id: product.id,
        imei: newImei.trim(),
        status: newStatus
      })).unwrap();
      setMessage({ text: 'Appareil ajouté avec succès', type: 'success' });
      showToast(`Appareil ${newImei} ajouté avec succès`, 'success');
      setNewImei('');
      setNewStatus('available');
      loadDevices();
      if (onDevicesUpdated) onDevicesUpdated();
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (err) {
      setMessage({ text: err || 'Erreur lors de l\'ajout', type: 'error' });
      showToast(err || 'Erreur lors de l\'ajout', 'error');
    }
  };

  const handleUpdateDevice = async () => {
    if (!editImei.trim()) {
      setMessage({ text: 'IMEI est requis', type: 'error' });
      showToast('IMEI est requis', 'error');
      return;
    }

    try {
      await dispatch(updateGpsDevice({
        id: editingDevice.id,
        imei: editImei.trim(),
        status: editStatus
      })).unwrap();
      setMessage({ text: 'Appareil mis à jour avec succès', type: 'success' });
      showToast(`Appareil ${editImei} mis à jour avec succès`, 'success');
      setEditingDevice(null);
      loadDevices();
      if (onDevicesUpdated) onDevicesUpdated();
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (err) {
      setMessage({ text: err || 'Erreur lors de la mise à jour', type: 'error' });
      showToast(err || 'Erreur lors de la mise à jour', 'error');
    }
  };

  const handleDeleteDevice = async () => {
    setDeleting(true);
    try {
      await dispatch(deleteGpsDevice(confirmDialog.deviceId)).unwrap();
      setMessage({ text: 'Appareil supprimé avec succès', type: 'success' });
      showToast(`Appareil ${confirmDialog.deviceImei} supprimé avec succès`, 'success');
      setConfirmDialog({ isOpen: false, deviceId: null, deviceImei: '' });
      loadDevices();
      if (onDevicesUpdated) onDevicesUpdated();
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (err) {
      setMessage({ text: err || 'Erreur lors de la suppression', type: 'error' });
      showToast(err || 'Erreur lors de la suppression', 'error');
      setConfirmDialog({ isOpen: false, deviceId: null, deviceImei: '' });
    } finally {
      setDeleting(false);
    }
  };

  const startEdit = (device) => {
    setEditingDevice(device);
    setEditImei(device.imei);
    setEditStatus(device.status);
  };

  const cancelEdit = () => {
    setEditingDevice(null);
    setEditImei('');
    setEditStatus('');
  };

  return (
    <>
      <style>{typeStyles}</style>
      
      {toasts.length > 0 && (
        <div className="products-toast-container">
          {toasts.map(toast => (
            <Toast
              key={toast.id}
              message={toast.message}
              type={toast.type}
              onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
            />
          ))}
        </div>
      )}
      
      <div className="products-overlay" onClick={onClose} />
      <div className="products-dialog products-dialog-lg" onClick={(e) => e.stopPropagation()}>
        <div className="products-dialog-header">
          <h2 className="products-dialog-title">
            <HardDrive size={20} />
            Gérer les appareils - {product.nom}
          </h2>
          <p className="products-dialog-description">
            Ajoutez, modifiez ou supprimez les IMEI associés à ce produit
          </p>
        </div>
        
        <div className="products-dialog-body">
          {message.text && (
            <div className={message.type === 'success' ? 'success-message' : 'error-message'}>
              {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              {message.text}
            </div>
          )}
          
          {/* Enhanced Add Device Section */}
          <div className="add-device-section">
            <div className="add-device-title">
              <Cpu size={18} />
              Ajouter un nouvel appareil
            </div>
            <div className="add-device-form">
              <div className="device-form-group">
                <label className="device-form-label">IMEI / Numéro de série</label>
                <input 
                  type="text"
                  className="imei-input"
                  placeholder="Ex: 123456789012345"
                  value={newImei} 
                  onChange={(e) => setNewImei(e.target.value)}
                />
              </div>
              <div className="device-form-group">
                <label className="device-form-label">Statut</label>
                <select 
                  className="status-select"
                  value={newStatus} 
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  <option value="available">Disponible</option>
                  <option value="reserved">Réservé</option>
                  <option value="assigned">Assigné</option>
                </select>
              </div>
              <button className="add-device-submit-btn" onClick={handleAddDevice}>
                <Plus size={16} /> Ajouter l'appareil
              </button>
            </div>
          </div>
          
          {/* Devices List - Enhanced Table */}
          {loading ? (
            <div className="devices-loading">
              <div className="devices-loading-spinner" />
              <span style={{ color: '#64748b', fontSize: '0.875rem' }}>Chargement des appareils...</span>
            </div>
          ) : devices.length === 0 ? (
            <div className="devices-empty">
              <HardDrive size={48} strokeWidth={1.5} />
              <p>Aucun appareil associé à ce produit</p>
              <small>Utilisez le formulaire ci-dessus pour ajouter votre premier appareil</small>
            </div>
          ) : (
            <div className="devices-table-container">
              <table className="devices-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>IMEI / Série</th>
                    <th>Statut</th>
                    <th>Date création</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {devices.map((device, index) => (
                    <tr key={device.id} className={index === devices.length - 1 ? 'device-row-new' : ''}>
                      <td>
                        <span className="device-id">#{device.id}</span>
                      </td>
                      <td>
                        {editingDevice?.id === device.id ? (
                          <input 
                            type="text" 
                            value={editImei} 
                            onChange={(e) => setEditImei(e.target.value)}
                            className="imei-edit-input"
                            placeholder="IMEI"
                          />
                        ) : (
                          <span className="imei-cell" title={`IMEI: ${device.imei}`}>
                            {device.imei}
                          </span>
                        )}
                      </td>
                      <td>
                        {editingDevice?.id === device.id ? (
                          <select 
                            value={editStatus} 
                            onChange={(e) => setEditStatus(e.target.value)}
                            className="status-select"
                            style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}
                          >
                            <option value="available">Disponible</option>
                            <option value="reserved">Réservé</option>
                            <option value="assigned">Assigné</option>
                          </select>
                        ) : (
                          <span className={`status-badge status-${device.status}`}>
                            {getStatusLabel(device.status)}
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="device-date">
                          {new Date(device.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </td>
                      <td>
                        <div className="device-actions">
                          {editingDevice?.id === device.id ? (
                            <>
                              <button 
                                onClick={handleUpdateDevice} 
                                className="device-action-btn save-btn" 
                                title="Sauvegarder"
                              >
                                <Save size={16} />
                              </button>
                              <button 
                                onClick={cancelEdit} 
                                className="device-action-btn cancel-btn" 
                                title="Annuler"
                              >
                                <X size={16} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button 
                                onClick={() => startEdit(device)} 
                                className="device-action-btn edit-btn" 
                                title="Modifier l'IMEI"
                              >
                                <Edit size={16} />
                              </button>
                              <button 
                                onClick={() => setConfirmDialog({ 
                                  isOpen: true, 
                                  deviceId: device.id, 
                                  deviceImei: device.imei 
                                })} 
                                className="device-action-btn delete-btn" 
                                title="Supprimer l'appareil"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        <div className="products-dialog-footer">
          <Button variant="outline" onClick={onClose}>Fermer</Button>
        </div>
        <button className="products-dialog-close" onClick={onClose}>
          <X size={18} />
          <span className="sr-only">Fermer</span>
        </button>
      </div>
      
      {/* Delete Confirmation Dialog for Device */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="Confirmer la suppression"
        message={
          <div>
            Êtes-vous sûr de vouloir supprimer l'appareil <strong>"{confirmDialog.deviceImei}"</strong> ?
            <br /><br />
            <span style={{ color: '#dc2626', fontSize: '0.875rem' }}>
              ⚠️ Cette action est irréversible et supprimera définitivement cet appareil de la base de données.
            </span>
          </div>
        }
        onConfirm={handleDeleteDevice}
        onCancel={() => setConfirmDialog({ isOpen: false, deviceId: null, deviceImei: '' })}
        variant="danger"
        loading={deleting}
      />
    </>
  );
};

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
    <div className="products-pagination-container">
      <button
        className="products-pagination-btn"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft size={16} />
        Précédent
      </button>
      
      {getPageNumbers().map((page, index) => (
        page === '...' ? (
          <span key={`ellipsis-${index}`} className="products-pagination-info">...</span>
        ) : (
          <button
            key={page}
            className={`products-pagination-btn ${currentPage === page ? 'products-pagination-active' : ''}`}
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        )
      ))}
      
      <button
        className="products-pagination-btn"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Suivant
        <ChevronRight size={16} />
      </button>
    </div>
  );
};

// ==================== MAIN PRODUCTS COMPONENT ====================
const Products = () => {
  const dispatch = useDispatch();
  const { list: products, loading, error, categories } = useSelector((state) => state.products);
  
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deviceManagerProduct, setDeviceManagerProduct] = useState(null);
  const [form, setForm] = useState({ 
    nom: '', 
    marque: '', 
    type: '', 
    prix_vente: 0, 
    prix: 0, 
    stock: 0 
  });
  const [formError, setFormError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null, name: '' });
  const [toasts, setToasts] = useState([]);
  const [deleting, setDeleting] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3000);
  };

  // Fetch products and types on mount
  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchCategories());
  }, [dispatch]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, typeFilter]);

  // Clear errors when modal opens/closes
  useEffect(() => {
    if (!open) {
      setFormError('');
      dispatch(clearProductError());
    }
  }, [open, dispatch]);

  // Filter products based on search and type
  const filtered = products.filter(p => {
    const matchesSearch = !search || 
      (p.nom?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (p.marque?.toLowerCase() || '').includes(search.toLowerCase());
    
    const matchesType = !typeFilter || p.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  // Get unique types for filter
  const uniqueTypes = [...new Set(products.map(p => p.type).filter(Boolean))];

  // Pagination calculations
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  const openNew = () => {
    setEditing(null);
    setForm({ 
      nom: '', 
      marque: '', 
      type: '', 
      prix_vente: 0, 
      prix: 0, 
      stock: 0 
    });
    setFormError('');
    setOpen(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({ 
      nom: p.nom || '', 
      marque: p.marque || '', 
      type: p.type || '', 
      prix_vente: parseNumber(p.prix_vente), 
      prix: parseNumber(p.prix), 
      stock: parseNumber(p.stock)
    });
    setFormError('');
    setOpen(true);
  };

  const openDeviceManager = (product) => {
    setDeviceManagerProduct(product);
  };

  const save = async () => {
    if (!form.nom || !form.nom.trim()) {
      setFormError('Le nom du produit est requis');
      showToast('Le nom du produit est requis', 'error');
      return;
    }
    
    if (!form.type) {
      setFormError('Le type de produit est requis');
      showToast('Le type de produit est requis', 'error');
      return;
    }
    
    if (form.prix_vente <= 0 && form.prix <= 0) {
      setFormError('Le prix doit être supérieur à 0');
      showToast('Le prix doit être supérieur à 0', 'error');
      return;
    }

    const productData = {
      nom: form.nom.trim(),
      marque: form.marque,
      type: form.type,
      prix_vente: parseFloat(form.prix_vente),
      prix: parseFloat(form.prix),
      stock: parseInt(form.stock) || 0
    };

    try {
      if (editing) {
        await dispatch(updateProduct({ id: editing.id, ...productData })).unwrap();
        showToast(`Produit "${form.nom}" mis à jour avec succès`, 'success');
      } else {
        await dispatch(createProduct(productData)).unwrap();
        showToast(`Produit "${form.nom}" ajouté avec succès`, 'success');
      }
      setOpen(false);
      dispatch(fetchProducts());
    } catch (err) {
      setFormError(err || 'Une erreur est survenue');
      showToast(err || 'Erreur lors de l\'enregistrement', 'error');
    }
  };

  const handleDeleteProduct = async () => {
    setDeleting(true);
    try {
      await dispatch(deleteProduct(confirmDelete.id)).unwrap();
      showToast(`Produit "${confirmDelete.name}" supprimé avec succès`, 'success');
      dispatch(fetchProducts());
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

  const stockBadge = (stock) => {
    const stockNum = parseNumber(stock);
    if (stockNum === 0) return <Badge variant="destructive">Rupture</Badge>;
    if (stockNum < 5) return <Badge variant="warning">Faible ({stockNum})</Badge>;
    return <Badge variant="success">{stockNum}</Badge>;
  };

  if (loading && products.length === 0) {
    return (
      <div className="products-loading">
        <div className="products-loading-spinner" />
        <p style={{ marginTop: '1rem', color: '#6b7280' }}>Chargement des produits...</p>
      </div>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <style>{typeStyles}</style>
      
      {/* Toast Container */}
      {toasts.length > 0 && (
        <div className="products-toast-container">
          {toasts.map(toast => (
            <Toast
              key={toast.id}
              message={toast.message}
              type={toast.type}
              onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
            />
          ))}
        </div>
      )}
      
      <PageHeader
        title="Produits"
        subtitle={`${filtered.length} produits dans le catalogue`}
        actions={
          <>
            <ExportMenu 
              title="Liste des produits" 
              rows={filtered} 
              columns={[
                { header: 'Nom', accessor: p => p.nom },
                { header: 'Marque', accessor: p => p.marque || '-' },
                { header: 'Type', accessor: p => getTypeLabel(p.type) },
                { header: 'Prix vente (MAD)', accessor: p => formatPrice(p.prix_vente) },
                { header: 'Prix achat (MAD)', accessor: p => formatPrice(p.prix) },
                { header: 'Stock', accessor: p => parseNumber(p.stock) },
                { header: 'Appareils dispo', accessor: p => p.available_devices_count || 0 },
              ]} 
            />

            <Button onClick={openNew}>
              <Plus size={16} /> Ajouter produit
            </Button>
          </>
        }
      />

      <Card>
        {/* Consolidated Filter Bar (like Sales page) */}
        <div className="products-filter-bar">
          <div className="products-search-wrapper">
            <Search className="products-search-icon" />
            <input 
              className="products-search-input" 
              placeholder="Rechercher par nom ou marque..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
          </div>
          <div className="products-filter-group">
            <select 
              className="products-filter-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">Tous types</option>
              {uniqueTypes.map(type => (
                <option key={type} value={type}>{getTypeLabel(type)}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="products-table-container">
          <table className="products-table">
            <thead>
              <tr>
                <th>Produit</th>
                <th>Marque</th>
                <th>Type</th>
                <th className="text-right">Prix vente</th>
                <th className="text-right">Prix achat</th>
                <th>Stock</th>
                <th>Appareils</th>
                <th className="w-24"></th>
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.map((p) => (
                <tr key={p.id}>
                  <td className="font-medium">{p.nom}</td>
                  <td className="text-muted">{p.marque || '-'}</td>
                  <td><TypeBadge type={p.type} /></td>
                  <td className="text-right font-semibold">{formatPrice(p.prix_vente)} MAD</td>
                  <td className="text-right text-muted">{formatPrice(p.prix)} MAD</td>
                  <td>{stockBadge(p.stock)}</td>
                  <td className="device-cell">
                    <button 
                      onClick={() => openDeviceManager(p)} 
                      className="products-device-btn"
                    >
                      <HardDrive size={14} />
                      {p.available_devices_count || 0} / {p.total_devices_count || 0}
                    </button>
                   </td>
                  <td>
                    <div className="products-actions-cell">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(p)} title="Modifier">
                        <Pencil size={16} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setConfirmDelete({ isOpen: true, id: p.id, name: p.nom })}
                        title="Supprimer"
                      >
                        <Trash2 size={16} className="text-destructive" />
                      </Button>
                    </div>
                   </td>
                 </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="products-empty">
                    {search || typeFilter ? 'Aucun produit ne correspond aux critères' : 'Aucun produit dans le catalogue'}
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

      {/* Product Form Dialog */}
      {open && (
        <>
          <div className="products-overlay" onClick={() => setOpen(false)} />
          <div className="products-dialog">
            <div className="products-dialog-header">
              <h2 className="products-dialog-title">
                {editing ? <Pencil size={20} /> : <Plus size={20} />}
                {editing ? 'Modifier le produit' : 'Nouveau produit'}
              </h2>
              <p className="products-dialog-description">
                {editing 
                  ? 'Modifiez les informations du produit ci-dessous' 
                  : 'Remplissez les informations pour ajouter un nouveau produit'}
              </p>
            </div>
            <div className="products-dialog-body">
              {formError && (
                <div className="error-message">
                  <AlertCircle size={16} />
                  {formError}
                </div>
              )}
              
              <div className="products-form-group">
                <Label required>Nom du produit</Label>
                <Input 
                  value={form.nom} 
                  onChange={(e) => setForm({ ...form, nom: e.target.value })} 
                  placeholder="Ex: Traceur GPS X5"
                  autoFocus
                />
              </div>
              
              <div className="products-form-group">
                <Label>Marque</Label>
                <Input 
                  value={form.marque} 
                  onChange={(e) => setForm({ ...form, marque: e.target.value })} 
                  placeholder="Ex: Queclink"
                />
              </div>
              
              <div className="products-form-group">
                <Label required>Type de produit</Label>
                <Select 
                  value={form.type} 
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="">Sélectionner un type</option>
                  {TYPE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>
              
              <div className="products-grid-2">
                <div className="products-form-group">
  <Label required>Prix de vente (MAD)</Label>

  <Input
    type="number"
    step="0.01"
    value={form.prix_vente || ""}
    onChange={(e) =>
      setForm({
        ...form,
        prix_vente: e.target.value
      })
    }
    placeholder="0.00 MAD"
  />
</div>
                <div className="products-form-group">
                  <Label>Prix d'achat (MAD)</Label>
                  <Input 
                    type="number" 
                    step="0.01"
                    value={form.prix || ""}
                    onChange={(e) => setForm({ ...form, prix: parseFloat(e.target.value) || 0 })} 
                    placeholder="0.00 MAD"
                  />
                </div>
              </div>
              
            </div>
            <div className="products-dialog-footer">
              <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              <Button onClick={save}>
                {editing ? 'Mettre à jour' : 'Ajouter le produit'}
              </Button>
            </div>
            <button className="products-dialog-close" onClick={() => setOpen(false)}>
              <X size={18} />
              <span className="sr-only">Fermer</span>
            </button>
          </div>
        </>
      )}

      {/* Device Manager Modal */}
      {deviceManagerProduct && (
        <DeviceManager 
          product={deviceManagerProduct} 
          onClose={() => setDeviceManagerProduct(null)}
          onDevicesUpdated={() => dispatch(fetchProducts())}
        />
      )}

      {/* Delete Product Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDelete.isOpen}
        title="Confirmer la suppression"
        message={
          <div>
            Supprimer le produit <strong>"{confirmDelete.name}"</strong> ?<br />
            Cette action est irréversible et supprimera toutes les données associées.
          </div>
        }
        onConfirm={handleDeleteProduct}
        onCancel={() => setConfirmDelete({ isOpen: false, id: null, name: '' })}
        variant="danger"
        loading={deleting}
      />
    </>
  );
};

export default Products;