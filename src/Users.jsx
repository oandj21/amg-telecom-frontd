import { useState, useEffect, useMemo, useCallback , useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { 
  Plus, Pencil, Trash2, Search, Shield, ShoppingBag, RefreshCw, X, 
  AlertTriangle, CheckCircle, Info, ChevronLeft, ChevronRight, 
  Users as UsersIcon, UserCheck, UserX, Filter, Eye, EyeOff,
  ShieldCheck, UserCog, UserCircle, Calendar, Mail, Key,
  Sparkles, TrendingUp, Award, Star, Zap, Crown, Wrench, HardDrive,
  DollarSign, CreditCard, History, BarChart3, TrendingDown, CalendarDays,
  Receipt, FileText, Printer, Download, Activity, Package, Smartphone,
  RefreshCcw, Upload, File, Image, XCircle, Loader2, ExternalLink
} from 'lucide-react';
import {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  clearUserError,
  getAdminPayments,
  addAdminPayment,
  deleteAdminPayment,
  getAllAdminPayments,
  getTechnicianPayments,
  addTechnicianPayment,
  deleteTechnicianPayment,
  getAllTechnicianPayments,
  clearAdminPaymentsError,
  clearTechnicianPaymentsError
} from './Store/store';
import axios from 'axios';

// Helper function to safely get error message
const getErrorMessage = (err) => {
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object' && err.message) return err.message;
  if (err && typeof err === 'object') return JSON.stringify(err);
  return 'Une erreur est survenue';
};

// API configuration
const API_URL = window.REACT_APP_API_URL || "https://amg-telecom-backd-production.up.railway.app/api";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Helper function to format file size
const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Helper function to get file icon
const getFileIcon = (mimeType) => {
  if (mimeType?.startsWith('image/')) return <Image size={16} />;
  if (mimeType === 'application/pdf') return <FileText size={16} />;
  return <File size={16} />;
};

// ==================== STYLES ====================
const styles = `
  /* Base Layout */
  .users-page-container {
    padding: 1rem;
  }
  
  @media (min-width: 768px) {
    .users-page-container {
      padding: 1.5rem;
    }
  }
  
  .users-page-header {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 2rem;
  }
  
  @media (min-width: 768px) {
    .users-page-header {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
    }
  }
  
  .users-title-section {
    flex: 1;
  }
  
  .users-title {
    font-size: 1.75rem;
    font-weight: 800;
    letter-spacing: -0.025em;
    background: linear-gradient(135deg, #1e293b 0%, #2d3a4a 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 0.25rem;
  }
  
  @media (min-width: 768px) {
    .users-title {
      font-size: 2rem;
    }
  }
  
  .users-subtitle {
    font-size: 0.75rem;
    color: #64748b;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  
  .users-subtitle-badge {
    background: #f1f5f9;
    padding: 0.25rem 0.75rem;
    border-radius: 2rem;
    font-size: 0.75rem;
    font-weight: 500;
    color: #475569;
  }
  
  .users-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }
  
  .users-card {
    background: white;
    border-radius: 1rem;
    border: 1px solid #e2e8f0;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
    overflow: hidden;
    margin-bottom: 1.5rem;
  }
  
  .users-card:hover {
    box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.08);
  }
  
  /* Stats Grid */
  .users-stats-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  
  @media (min-width: 640px) {
    .users-stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  
  @media (min-width: 1024px) {
    .users-stats-grid {
      grid-template-columns: repeat(5, 1fr);
    }
  }
  
  .users-stat-card {
    background: white;
    border-radius: 1rem;
    padding: 1.25rem;
    border: 1px solid #e2e8f0;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
  }
  
  .users-stat-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  }
  
  .users-stat-card-primary::before {
    background: linear-gradient(90deg, #3b82f6, #06b6d4);
  }
  
  .users-stat-card-success::before {
    background: linear-gradient(90deg, #10b981, #34d399);
  }
  
  .users-stat-card-warning::before {
    background: linear-gradient(90deg, #f59e0b, #fbbf24);
  }
  
  .users-stat-card-info::before {
    background: linear-gradient(90deg, #8b5cf6, #a78bfa);
  }
  
  .users-stat-card-technician::before {
    background: linear-gradient(90deg, #06b6d4, #22d3ee);
  }
  
  .users-stat-icon-wrapper {
    width: 3rem;
    height: 3rem;
    border-radius: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
    margin-bottom: 1rem;
  }
  
  .users-stat-icon-wrapper svg {
    width: 1.5rem;
    height: 1.5rem;
  }
  
  .users-stat-icon-primary svg { color: #3b82f6; }
  .users-stat-icon-success svg { color: #10b981; }
  .users-stat-icon-warning svg { color: #f59e0b; }
  .users-stat-icon-info svg { color: #8b5cf6; }
  .users-stat-icon-technician svg { color: #06b6d4; }
  
  .users-stat-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }
  
  .users-stat-label {
    font-size: 0.75rem;
    font-weight: 500;
    color: #64748b;
    margin-bottom: 0.5rem;
  }
  
  .users-stat-value {
    font-size: 2rem;
    font-weight: 800;
    color: #0f172a;
    line-height: 1;
  }
  
  .users-stat-trend {
    font-size: 0.75rem;
    color: #10b981;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }
  
  /* Filter Bar */
  .users-filter-bar {
    padding: 1rem 1.5rem;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }
  
  .users-filter-group {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    align-items: center;
    flex: 1;
  }
  
  .users-search-wrapper {
    position: relative;
    flex: 2;
    min-width: 250px;
  }
  
  .users-search-icon {
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    width: 1.125rem;
    height: 1.125rem;
    color: #94a3b8;
    pointer-events: none;
  }
  
  .users-search-input {
    width: 100%;
    height: 2.75rem;
    padding: 0 1rem 0 2.75rem;
    border: 1px solid #e2e8f0;
    border-radius: 0.75rem;
    font-size: 0.75rem;
    background: white;
    color: #0f172a;
    outline: none;
    transition: all 0.2s ease;
  }
  
  .users-search-input:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  .users-search-input::placeholder {
    color: #94a3b8;
  }
  
  .users-filter-select {
    position: relative;
    min-width: 160px;
  }
  
  .users-filter-icon {
    position: absolute;
    left: 0.875rem;
    top: 50%;
    transform: translateY(-50%);
    width: 1rem;
    height: 1rem;
    color: #94a3b8;
    pointer-events: none;
  }
  
  .users-select-filter {
    width: 100%;
    height: 2.75rem;
    padding: 0 2rem 0 2.5rem;
    border: 1px solid #e2e8f0;
    border-radius: 0.75rem;
    font-size: 0.75rem;
    background: white;
    color: #0f172a;
    cursor: pointer;
    outline: none;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0.75rem center;
  }
  
  .users-select-filter:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  .users-clear-filters {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.375rem 0.875rem;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
    font-size: 0.75rem;
    color: #64748b;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .users-clear-filters:hover {
    background: #fef2f2;
    border-color: #fca5a5;
    color: #dc2626;
  }
  
  /* Table Styles */
  .users-table-container {
    position: relative;
    width: 100%;
    overflow-x: auto;
  }
  
  .users-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.75rem;
  }
  
  .users-table thead tr {
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
  }
  
  .users-table th {
    padding: 1rem;
    text-align: left;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #64748b;
  }
  
  .users-table tbody tr {
    border-bottom: 1px solid #f1f5f9;
    transition: all 0.2s ease;
  }
  
  .users-table tbody tr:hover {
    background-color: #f8fafc;
  }
  
  .users-table td {
    padding: 1rem;
    vertical-align: middle;
  }
  
  .users-user-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  
  .users-user-avatar {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 0.75rem;
    background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 600;
    font-size: 1rem;
  }
  
  .users-user-name {
    font-weight: 600;
    color: #0f172a;
  }
  
  .users-user-email {
    font-size: 0.75rem;
    color: #64748b;
  }
  
  .users-font-medium {
    font-weight: 500;
  }
  
  .users-text-muted {
    color: #64748b;
  }
  
  .users-w-24 {
    width: 6rem;
  }
  
  .users-empty {
    text-align: center;
    padding: 3rem 0;
  }
  
  .users-empty-icon {
    width: 4rem;
    height: 4rem;
    margin: 0 auto 1rem;
    color: #cbd5e1;
  }
  
  .users-empty-text {
    color: #94a3b8;
    font-size: 0.75rem;
  }
  
  /* Loading State */
  .users-loading {
    text-align: center;
    padding: 3rem;
  }
  
  .users-loading-spinner {
    display: inline-block;
    width: 2.5rem;
    height: 2.5rem;
    border: 3px solid #e2e8f0;
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  /* Button Styles */
  .users-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 0.875rem;
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
    font-family: inherit;
  }
  
  .users-btn-primary {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  }
  
  .users-btn-primary:hover {
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }
  
  .users-btn-outline {
    background: white;
    border: 1px solid #e2e8f0;
    color: #0f172a;
  }
  
  .users-btn-outline:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
  }
  
  .users-btn-danger {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    color: white;
  }
  
  .users-btn-danger:hover {
    background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
    transform: translateY(-1px);
  }
  
  .users-btn-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem;
    border-radius: 0.5rem;
    background: transparent;
    border: none;
    cursor: pointer;
    color: #64748b;
    transition: all 0.2s ease;
  }
  
  .users-btn-icon:hover:not(:disabled) {
    background-color: #f1f5f9;
    color: #0f172a;
  }
  
  .users-btn-icon:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
  
  .users-btn-icon-danger:hover:not(:disabled) {
    background-color: #fef2f2;
    color: #dc2626;
  }
  
  .users-actions-cell {
    display: flex;
    gap: 0.25rem;
  }
  
  /* Badge Styles */
  .users-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.25rem 0.75rem;
    border-radius: 2rem;
    font-size: 0.75rem;
    font-weight: 500;
    line-height: 1rem;
  }
  
  .users-badge-default {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
  }
  
  .users-badge-secondary {
    background-color: #f1f5f9;
    color: #475569;
  }
  
  .users-badge-success {
    background-color: #f0fdf4;
    color: #16a34a;
    border: 1px solid #86efac;
  }
  
  .users-badge-destructive {
    background-color: #fef2f2;
    color: #dc2626;
    border: 1px solid #fca5a5;
  }
  
  .users-badge-warning {
    background-color: #fffbeb;
    color: #d97706;
    border: 1px solid #fde68a;
  }
  
  .users-badge-cyan {
    background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
    color: white;
  }
  
  .users-badge-purple {
    background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
    color: white;
  }
  
  /* Modal/Dialog Styles */
  .users-overlay {
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
  
  .users-dialog {
    position: fixed;
    left: 50%;
    top: 50%;
    z-index: 51;
    width: 100%;
    max-width: 32rem;
    max-height: 90vh;
    overflow-y: auto;
    transform: translate(-50%, -50%);
    background: white;
    border-radius: 1rem;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    animation: slideIn 0.3s ease-out;
  }
  
  .users-dialog-large {
    max-width: 48rem;
  }
  
  .users-dialog-xl {
    max-width: 64rem;
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
  
  .users-dialog-header {
    padding: 1.5rem 1.5rem 0 1.5rem;
  }
  
  .users-dialog-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: #0f172a;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .users-dialog-description {
    font-size: 0.75rem;
    color: #64748b;
    margin-top: 0.25rem;
  }
  
  .users-dialog-body {
    padding: 1rem 1.5rem;
  }
  
  .users-dialog-footer {
    display: flex;
    flex-direction: column-reverse;
    gap: 0.75rem;
    padding: 0 1.5rem 1.5rem 1.5rem;
  }
  
  @media (min-width: 640px) {
    .users-dialog-footer {
      flex-direction: row;
      justify-content: flex-end;
    }
  }
  
  .users-dialog-close {
    position: absolute;
    right: 1rem;
    top: 1rem;
    border-radius: 0.5rem;
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0.25rem;
    color: #94a3b8;
    transition: all 0.2s ease;
  }
  
  .users-dialog-close:hover {
    background: #f1f5f9;
    color: #0f172a;
  }
  
  /* Form Styles */
  .users-form-group {
    display: grid;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  
  .users-label {
    font-size: 0.75rem;
    font-weight: 500;
    color: #0f172a;
  }
  
  .users-label-required::after {
    content: '*';
    color: #ef4444;
    margin-left: 0.25rem;
  }
  
  .users-input {
    width: 100%;
    padding: 0.625rem 0.875rem;
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
    font-size: 0.75rem;
    background: white;
    color: #0f172a;
    outline: none;
    transition: all 0.2s ease;
  }
  
  .users-input:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  .users-select {
    width: 100%;
    padding: 0.625rem 0.875rem;
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
    font-size: 0.75rem;
    background: white;
    color: #0f172a;
    outline: none;
    cursor: pointer;
  }
  
  .users-select:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  .users-number-input {
    width: 100%;
    padding: 0.625rem 0.875rem;
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
    font-size: 0.75rem;
    background: white;
    color: #0f172a;
    outline: none;
    transition: all 0.2s ease;
  }
  
  .users-number-input:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  textarea.users-input {
    resize: vertical;
    min-height: 80px;
  }
  
  .users-toggle-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-radius: 0.75rem;
    background: #f8fafc;
    padding: 1rem;
    margin-top: 0.5rem;
  }
  
  .users-toggle-label {
    font-size: 0.75rem;
    font-weight: 500;
    color: #0f172a;
  }
  
  .users-toggle-desc {
    font-size: 0.75rem;
    color: #64748b;
    margin-top: 0.125rem;
  }
  
  .users-toggle-switch {
    width: 2.75rem;
    height: 1.5rem;
    border-radius: 9999px;
    transition: all 0.2s ease;
    cursor: pointer;
    position: relative;
    flex-shrink: 0;
    border: none;
  }
  
  .users-toggle-switch-active {
    background-color: #3b82f6;
  }
  
  .users-toggle-switch-inactive {
    background-color: #cbd5e1;
  }
  
  .users-toggle-knob {
    width: 1.25rem;
    height: 1.25rem;
    background: white;
    border-radius: 50%;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    transition: transform 0.2s ease;
    position: absolute;
    top: 0.125rem;
  }
  
  .users-toggle-knob-active {
    transform: translateX(1.25rem);
  }
  
  .users-toggle-knob-inactive {
    transform: translateX(0.125rem);
  }
  
  /* Toast Styles */
  .users-toast-container {
    position: fixed;
    bottom: 1rem;
    right: 1rem;
    z-index: 100;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .users-toast {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: white;
    border-radius: 0.75rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
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
  
  .users-toast-success {
    border-left-color: #10b981;
  }
  .users-toast-success svg { color: #10b981; }
  
  .users-toast-error {
    border-left-color: #ef4444;
  }
  .users-toast-error svg { color: #ef4444; }
  
  .users-toast-info {
    border-left-color: #3b82f6;
  }
  .users-toast-info svg { color: #3b82f6; }
  
  .users-toast-message {
    flex: 1;
    font-size: 0.75rem;
    color: #0f172a;
  }
  
  .users-toast-close {
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0.25rem;
    color: #94a3b8;
  }
  
  /* Error Message */
  .users-error-message {
    background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
    border: 1px solid #fca5a5;
    border-radius: 0.75rem;
    padding: 0.75rem 1rem;
    color: #dc2626;
    font-size: 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  
  /* Delete Warning */
  .delete-warning {
    background: #fffbeb;
    border: 1px solid #fde68a;
    border-radius: 0.75rem;
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
    font-size: 0.75rem;
    color: #92400e;
  }
  
  /* Pagination */
  .users-pagination-container {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem 1.5rem;
    border-top: 1px solid #e2e8f0;
    flex-wrap: wrap;
  }
  
  .users-pagination-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border: 1px solid #e2e8f0;
    background: white;
    border-radius: 0.5rem;
    font-size: 0.75rem;
    font-weight: 500;
    color: #0f172a;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .users-pagination-btn:hover:not(:disabled) {
    background: #f8fafc;
    border-color: #cbd5e1;
  }
  
  .users-pagination-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .users-pagination-info {
    padding: 0.5rem 1rem;
    font-size: 0.75rem;
    color: #64748b;
  }
  
  .users-pagination-active {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
    border-color: #3b82f6;
  }
  
  /* Payment Summary Cards */
  .users-payment-summary {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
    padding: 1.5rem;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
  }
  
  @media (min-width: 768px) {
    .users-payment-summary {
      grid-template-columns: repeat(3, 1fr);
    }
  }
  
  .users-payment-summary-card {
    background: white;
    border-radius: 0.75rem;
    padding: 1rem;
    border: 1px solid #e2e8f0;
  }
  
  .users-payment-summary-title {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    color: #64748b;
    margin-bottom: 0.5rem;
  }
  
  .users-payment-summary-amount {
    font-size: 1.5rem;
    font-weight: 800;
    color: #0f172a;
  }
  
  .users-payment-summary-count {
    font-size: 0.75rem;
    color: #64748b;
    margin-top: 0.25rem;
  }
  
  /* Payment Table */
  .users-payment-table-container {
    overflow-x: auto;
  }
  
  .users-payment-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.75rem;
  }
  
  .users-payment-table thead tr {
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
  }
  
  .users-payment-table th {
    padding: 0.875rem 1rem;
    text-align: left;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #64748b;
  }
  
  .users-payment-table td {
    padding: 0.875rem 1rem;
    border-bottom: 1px solid #f1f5f9;
  }
  
  .users-payment-table tbody tr:hover {
    background-color: #f8fafc;
  }
  
  .users-amount-positive {
    color: #10b981;
    font-weight: 600;
  }
  
  .users-payment-type-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.25rem 0.625rem;
    border-radius: 2rem;
    font-size: 0.7rem;
    font-weight: 500;
  }
  
  .users-payment-type-activation {
    background: #dbeafe;
    color: #1e40af;
  }
  
  .users-payment-type-vente {
    background: #dcfce7;
    color: #166534;
  }
  
  /* File Upload Styles */
  .file-upload-area {
    border: 2px dashed #e2e8f0;
    border-radius: 0.75rem;
    padding: 1.5rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-bottom: 1rem;
  }
  
  .file-upload-area:hover {
    border-color: #3b82f6;
    background: #eff6ff;
  }
  
  .file-upload-area.dragging {
    border-color: #3b82f6;
    background: #eff6ff;
  }
  
  .file-upload-icon {
    color: #94a3b8;
    margin-bottom: 0.5rem;
  }
  
  .file-upload-text {
    font-size: 0.75rem;
    color: #64748b;
  }
  
  .file-upload-hint {
    font-size: 0.7rem;
    color: #94a3b8;
    margin-top: 0.25rem;
  }
  
  .selected-files {
    margin-top: 1rem;
  }
  
  .selected-files-title {
    font-size: 0.75rem;
    font-weight: 500;
    color: #475569;
    margin-bottom: 0.5rem;
  }
  
  .selected-files-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .selected-file-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: #f8fafc;
    border-radius: 0.5rem;
    border: 1px solid #e2e8f0;
  }
  
  .selected-file-info {
    flex: 1;
    min-width: 0;
  }
  
  .selected-file-name {
    font-size: 0.75rem;
    font-weight: 500;
    color: #0f172a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 200px;
  }
  
  .selected-file-size {
    font-size: 0.65rem;
    color: #94a3b8;
  }
  
  .remove-file-btn {
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0.25rem;
    color: #94a3b8;
    border-radius: 0.25rem;
    transition: all 0.2s ease;
  }
  
  .remove-file-btn:hover {
    background: #fef2f2;
    color: #dc2626;
  }
  
  /* Payment Cards List */
  .payments-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .payment-card {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 0.75rem;
    padding: 1rem;
    transition: all 0.2s ease;
  }
  
  .payment-card:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }
  
  .payment-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.75rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid #f1f5f9;
  }
  
  .payment-type {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.25rem 0.75rem;
    border-radius: 2rem;
    font-size: 0.75rem;
    font-weight: 500;
  }
  
  .payment-type.activation {
    background: #dbeafe;
    color: #1e40af;
  }
  
  .payment-type.vente {
    background: #dcfce7;
    color: #166534;
  }
  
  .payment-date {
    font-size: 0.75rem;
    color: #64748b;
  }
  
  .delete-payment-btn {
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0.25rem;
    color: #94a3b8;
    border-radius: 0.375rem;
    transition: all 0.2s ease;
  }
  
  .delete-payment-btn:hover {
    background: #fef2f2;
    color: #dc2626;
  }
  
  .payment-card-details {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    margin-bottom: 0.75rem;
  }
  
  .payment-detail {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .detail-label {
    font-size: 0.7rem;
    font-weight: 500;
    text-transform: uppercase;
    color: #64748b;
  }
  
  .detail-value {
    font-size: 1rem;
    font-weight: 600;
    color: #0f172a;
  }
  
  .payment-detail.total .detail-value {
    color: #3b82f6;
  }
  
  .payment-notes {
    background: #f8fafc;
    border-radius: 0.5rem;
    padding: 0.75rem;
    margin-bottom: 0.75rem;
  }
  
  .notes-label {
    font-size: 0.7rem;
    font-weight: 500;
    color: #64748b;
    margin-bottom: 0.25rem;
  }
  
  .notes-text {
    font-size: 0.75rem;
    color: #0f172a;
  }
  
  .payment-files {
    margin-top: 0.75rem;
    margin-bottom: 0.75rem;
  }
  
  .files-label {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.75rem;
    font-weight: 500;
    color: #475569;
    margin-bottom: 0.5rem;
  }
  
  .files-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .file-attachment-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: #f8fafc;
    border-radius: 0.5rem;
    border: 1px solid #e2e8f0;
    transition: all 0.2s ease;
  }
  
  .file-attachment-item:hover {
    background: #f1f5f9;
  }
  
  .file-attachment-info {
    flex: 1;
    min-width: 0;
  }
  
  .file-attachment-name {
    font-size: 0.75rem;
    font-weight: 500;
    color: #0f172a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 200px;
  }
  
  .file-attachment-meta {
    font-size: 0.65rem;
    color: #94a3b8;
  }
  
  .file-attachment-actions {
    display: flex;
    gap: 0.25rem;
  }
  
  .file-action-btn {
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 0.25rem;
    color: #64748b;
    transition: all 0.2s ease;
  }
  
  .file-action-btn:hover {
    background: white;
    color: #3b82f6;
  }
  
  .file-action-btn.delete:hover {
    background: #fef2f2;
    color: #dc2626;
  }
  
  .file-action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .payment-footer {
    margin-top: 0.75rem;
    padding-top: 0.75rem;
    border-top: 1px solid #f1f5f9;
  }
  
  .created-by {
    font-size: 0.7rem;
    color: #94a3b8;
  }
  
  .created-date {
    margin-left: 0.25rem;
  }
  
  .info-box {
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    border-radius: 0.75rem;
    padding: 0.75rem 1rem;
    margin-bottom: 1rem;
    font-size: 0.75rem;
    color: #1e40af;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .spinner {
    animation: spin 1s linear infinite;
  }
`;

// ==================== TOAST COMPONENT ====================
const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(), 3000);
    return () => clearTimeout(timer);
  }, [onClose]);
  
  const Icon = type === 'success' ? CheckCircle : type === 'error' ? AlertTriangle : Info;
  const displayMessage = typeof message === 'string' ? message : getErrorMessage(message);
  
  return (
    <div className={`users-toast users-toast-${type}`}>
      <Icon size={20} />
      <span className="users-toast-message">{displayMessage}</span>
      <button className="users-toast-close" onClick={onClose}>
        <X size={16} />
      </button>
    </div>
  );
};

// ==================== STAT CARD COMPONENT ====================
const StatCard = ({ icon: Icon, label, value, trend, color = 'primary' }) => (
  <div className={`users-stat-card users-stat-card-${color}`}>
    <div className={`users-stat-icon-wrapper users-stat-icon-${color}`}>
      <Icon size={24} />
    </div>
    <div className="users-stat-content">
      <div>
        <div className="users-stat-label">{label}</div>
        <div className="users-stat-value">{value !== undefined && value !== null ? value : 0}</div>
      </div>
      {trend && (
        <div className="users-stat-trend">
          <TrendingUp size={12} />
          <span>{trend}</span>
        </div>
      )}
    </div>
  </div>
);

// ==================== PAGINATION COMPONENT ====================
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
    <div className="users-pagination-container">
      <button
        className="users-pagination-btn"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft size={16} />
        Précédent
      </button>
      
      {getPageNumbers().map((page, index) => (
        page === '...' ? (
          <span key={`ellipsis-${index}`} className="users-pagination-info">...</span>
        ) : (
          <button
            key={page}
            className={`users-pagination-btn ${currentPage === page ? 'users-pagination-active' : ''}`}
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        )
      ))}
      
      <button
        className="users-pagination-btn"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Suivant
        <ChevronRight size={16} />
      </button>
    </div>
  );
};

// ==================== ADMIN PAYMENT MODAL ====================
const AdminPaymentModal = ({ user, onClose, onSuccess }) => {
  const dispatch = useDispatch();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Montant invalide');
      return;
    }

    setLoading(true);
    try {
      await dispatch(addAdminPayment({
        userId: user.id,
        amount: parseFloat(amount),
        description: description || null,
        date: date
      })).unwrap();
      onSuccess(`Paiement de ${parseFloat(amount).toLocaleString('fr-FR')} DH ajouté avec succès`);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="users-overlay" onClick={onClose} />
      <div className="users-dialog">
        <div className="users-dialog-header">
          <h2 className="users-dialog-title">
            <DollarSign size={20} />
            Ajouter un paiement - {user?.name || 'Utilisateur'}
          </h2>
          <p className="users-dialog-description">
            Ajouter un paiement à l'historique de l'administrateur
          </p>
        </div>
        <div className="users-dialog-body">
          {error && (
            <div className="users-error-message">
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}
          
          <div className="users-form-group">
            <label className="users-label users-label-required">Montant (DH)</label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="users-input"
              placeholder="0.00"
              autoFocus
            />
          </div>
          
          <div className="users-form-group">
            <label className="users-label">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="users-input"
            />
          </div>
          
          <div className="users-form-group">
            <label className="users-label">Description (optionnel)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="users-input"
              rows="3"
              placeholder="Ex: Commission mensuelle, Prime, etc."
            />
          </div>
        </div>
        <div className="users-dialog-footer">
          <button onClick={onClose} className="users-btn users-btn-outline" disabled={loading}>
            Annuler
          </button>
          <button onClick={handleSubmit} className="users-btn users-btn-primary" disabled={loading}>
            {loading ? (
              <>
                <div className="users-loading-spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                Ajout en cours...
              </>
            ) : (
              <>
                <Plus size={16} />
                Ajouter le paiement
              </>
            )}
          </button>
        </div>
        <button className="users-dialog-close" onClick={onClose}>
          <X size={18} />
        </button>
      </div>
    </>
  );
};

// ==================== TECHNICIAN PAYMENT MODAL WITH FILE UPLOAD ====================
const TechnicianPaymentModal = ({ user, onClose, onSuccess }) => {
  const dispatch = useDispatch();
  const [type, setType] = useState('activation');
  const [unitPrice, setUnitPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (selectedFiles) => {
    const validFiles = [];
    const invalidFiles = [];
    
    Array.from(selectedFiles).forEach(file => {
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      const maxSize = 5 * 1024 * 1024; // 5MB
      
      if (validTypes.includes(file.type) && file.size <= maxSize) {
        validFiles.push(file);
      } else {
        invalidFiles.push(file.name);
      }
    });
    
    if (invalidFiles.length > 0) {
      setError(`Fichiers non supportés ou trop volumineux: ${invalidFiles.join(', ')}`);
    }
    
    setFiles(prev => [...prev, ...validFiles]);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const removeFile = (indexToRemove) => {
    setFiles(files.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async () => {
    if (!unitPrice || parseFloat(unitPrice) <= 0) {
      setError('Prix unitaire invalide');
      return;
    }
    
    if (!quantity || parseInt(quantity) <= 0) {
      setError('Quantité invalide');
      return;
    }

    const qty = parseInt(quantity);
    const price = parseFloat(unitPrice);
    const totalAmount = price * qty;

    const formData = new FormData();
    formData.append('type', type);
    formData.append('amount', price);
    formData.append('count', qty);
    formData.append('date', date);
    if (notes) formData.append('notes', notes);
    
    files.forEach((file, index) => {
      formData.append(`payment_files[${index}]`, file);
    });

    setLoading(true);
    try {
      const response = await api.post(`/technician-payments/${user.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      onSuccess(`${type === 'activation' ? 'Activation' : 'Vente'} de ${qty} unité(s) à ${price.toLocaleString('fr-FR')} DH/unité ajoutée (Total: ${totalAmount.toLocaleString('fr-FR')} DH)${files.length > 0 ? ` avec ${files.length} fichier(s) joint(s)` : ''}`);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = unitPrice && quantity ? parseFloat(unitPrice) * parseInt(quantity) : 0;

  return (
    <>
      <div className="users-overlay" onClick={onClose} />
      <div className="users-dialog users-dialog-large">
        <div className="users-dialog-header">
          <h2 className="users-dialog-title">
            <DollarSign size={20} />
            Ajouter un paiement - {user?.name || 'Utilisateur'}
          </h2>
          <p className="users-dialog-description">
            Ajouter manuellement une activation ou une vente avec justificatifs
          </p>
        </div>
        <div className="users-dialog-body">
          {error && (
            <div className="users-error-message">
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}
          
          <div className="info-box">
            <Info size={14} />
            <span>Saisissez manuellement la quantité et le prix unitaire pour calculer le total.</span>
          </div>
          
          <div className="users-form-group">
            <label className="users-label users-label-required">Type de paiement</label>
            <select 
              value={type} 
              onChange={(e) => setType(e.target.value)} 
              className="users-select"
            >
              <option value="activation">Activation GPS</option>
              <option value="vente">Vente GPS</option>
            </select>
          </div>
          
          <div className="users-form-group">
            <label className="users-label users-label-required">Prix unitaire (DH)</label>
            <input
              type="number"
              step="0.01"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              className="users-number-input"
              placeholder="0.00"
              autoFocus
            />
          </div>
          
          <div className="users-form-group">
            <label className="users-label users-label-required">Quantité</label>
            <input
              type="number"
              step="1"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="users-number-input"
              placeholder="1"
            />
          </div>
          
          {unitPrice && quantity && totalAmount > 0 && (
            <div className="info-box" style={{ background: '#f0fdf4', borderColor: '#86efac', color: '#166534' }}>
              <CheckCircle size={14} />
              <span>
                <strong>Total à payer: {totalAmount.toLocaleString('fr-FR')} DH</strong>
                {' '}({parseInt(quantity)} × {parseFloat(unitPrice).toLocaleString('fr-FR')} DH)
              </span>
            </div>
          )}
          
          <div className="users-form-group">
            <label className="users-label">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="users-input"
            />
          </div>
          
          <div className="users-form-group">
            <label className="users-label">Notes (optionnel)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="users-input"
              rows="2"
              placeholder="Informations supplémentaires..."
            />
          </div>
          
          <div className="users-form-group">
            <label className="users-label">Justificatifs (optionnel)</label>
            <div 
              className={`file-upload-area ${dragActive ? 'dragging' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="file-upload-icon">
                <Upload size={32} />
              </div>
              <div className="file-upload-text">
                Cliquez ou glissez-déposez des fichiers
              </div>
              <div className="file-upload-hint">
                JPG, PNG, PDF, DOC (max. 5MB par fichier)
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                style={{ display: 'none' }}
                onChange={(e) => handleFileSelect(e.target.files)}
              />
            </div>
            
            {files.length > 0 && (
              <div className="selected-files">
                <div className="selected-files-title">
                  Fichiers sélectionnés ({files.length})
                </div>
                <div className="selected-files-list">
                  {files.map((file, index) => (
                    <div key={index} className="selected-file-item">
                      {getFileIcon(file.type)}
                      <div className="selected-file-info">
                        <div className="selected-file-name">{file.name}</div>
                        <div className="selected-file-size">{formatFileSize(file.size)}</div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(index);
                        }}
                        className="remove-file-btn"
                      >
                        <XCircle size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="users-dialog-footer">
          <button onClick={onClose} className="users-btn users-btn-outline" disabled={loading}>
            Annuler
          </button>
          <button 
            onClick={handleSubmit} 
            className="users-btn users-btn-primary" 
            disabled={loading || !unitPrice || !quantity || parseFloat(unitPrice) <= 0 || parseInt(quantity) <= 0}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="spinner" />
                Ajout en cours...
              </>
            ) : (
              <>
                <Plus size={16} />
                Ajouter le paiement
              </>
            )}
          </button>
        </div>
        <button className="users-dialog-close" onClick={onClose}>
          <X size={18} />
        </button>
      </div>
    </>
  );
};

// ==================== ADMIN PAYMENT HISTORY MODAL ====================
const AdminPaymentHistoryModal = ({ user, onClose }) => {
  const dispatch = useDispatch();
  const { currentAdminPayments, loading } = useSelector((state) => state.adminPayments);
  const { user: currentUser } = useSelector((state) => state.auth);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const isSuperAdmin = currentUser?.role === 'superadmin';

  useEffect(() => {
    if (user) {
      dispatch(getAdminPayments(user.id));
    }
  }, [dispatch, user]);

  const handleDelete = async (paymentIndex) => {
    setDeleting(true);
    try {
      await dispatch(deleteAdminPayment({ userId: user.id, paymentIndex })).unwrap();
      setDeleteConfirm(null);
      dispatch(getAdminPayments(user.id));
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setDeleting(false);
    }
  };

  const payments = currentAdminPayments?.summary?.payments || [];
  const total = currentAdminPayments?.summary?.total || 0;

  return (
    <>
      <div className="users-overlay" onClick={onClose} />
      <div className="users-dialog users-dialog-large">
        <div className="users-dialog-header">
          <h2 className="users-dialog-title">
            <History size={20} />
            Historique des paiements - {user?.name || 'Utilisateur'}
          </h2>
          <p className="users-dialog-description">
            Total des paiements: <strong>{total.toLocaleString('fr-FR')} DH</strong>
          </p>
        </div>
        <div className="users-dialog-body">
          {loading ? (
            <div className="users-loading">
              <div className="users-loading-spinner" />
            </div>
          ) : payments.length === 0 ? (
            <div className="users-empty">
              <div className="users-empty-icon">
                <Receipt size={48} />
              </div>
              <div className="users-empty-text">
                Aucun paiement enregistré pour cet administrateur
              </div>
            </div>
          ) : (
            <div className="users-payment-table-container">
              <table className="users-payment-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Montant</th>
                    <th>Description</th>
                    <th>Ajouté par</th>
                    {isSuperAdmin && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment, index) => (
                    <tr key={index}>
                      <td>{payment?.date ? new Date(payment.date).toLocaleDateString('fr-FR') : '-'}</td>
                      <td className="users-amount-positive">
                        {payment?.amount ? payment.amount.toLocaleString('fr-FR') : 0} DH
                       </td>
                      <td>{payment?.description || '-'}</td>
                      <td className="users-text-muted">
                        {payment?.created_by_name || '-'}
                        {payment?.created_at && (
                          <div style={{ fontSize: '0.7rem' }}>
                            {new Date(payment.created_at).toLocaleDateString('fr-FR')}
                          </div>
                        )}
                       </td>
                      {isSuperAdmin && (
                        <td>
                          <button
                            onClick={() => setDeleteConfirm(index)}
                            className="users-btn-icon users-btn-icon-danger"
                            disabled={deleting}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="users-dialog-footer">
          <button onClick={onClose} className="users-btn users-btn-outline">
            Fermer
          </button>
        </div>
        <button className="users-dialog-close" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      {/* Delete Confirmation */}
      {deleteConfirm !== null && payments[deleteConfirm] && (
        <>
          <div className="users-overlay" onClick={() => setDeleteConfirm(null)} />
          <div className="users-dialog">
            <div className="users-dialog-header">
              <h2 className="users-dialog-title" style={{ color: '#dc2626' }}>
                <AlertTriangle size={20} />
                Confirmer la suppression
              </h2>
            </div>
            <div className="users-dialog-body">
              <div className="delete-warning">
                <div className="delete-warning-title">
                  Supprimer ce paiement ?
                </div>
                <div className="delete-warning-text">
                  Montant: {payments[deleteConfirm]?.amount?.toLocaleString('fr-FR') || 0} DH<br />
                  Date: {payments[deleteConfirm]?.date ? new Date(payments[deleteConfirm].date).toLocaleDateString('fr-FR') : '-'}
                </div>
              </div>
            </div>
            <div className="users-dialog-footer">
              <button onClick={() => setDeleteConfirm(null)} className="users-btn users-btn-outline">
                Annuler
              </button>
              <button onClick={() => handleDelete(deleteConfirm)} className="users-btn users-btn-danger">
                Supprimer
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

// ==================== TECHNICIAN PAYMENT HISTORY MODAL WITH FILE VIEW ====================
const TechnicianPaymentHistoryModal = ({ user, onClose }) => {
  const dispatch = useDispatch();
  const { currentTechnicianPayments, loading } = useSelector((state) => state.technicianPayments);
  const { user: currentUser } = useSelector((state) => state.auth);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const isSuperAdmin = currentUser?.role === 'superadmin';
  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    if (user) {
      dispatch(getTechnicianPayments(user.id));
    }
  }, [dispatch, user, refreshKey]);

  const refreshData = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleDownloadFile = async (paymentId, fileId, fileName) => {
    setDownloading(true);
    try {
      const response = await api.get(`/technician-payments/${user.id}/${paymentId}/files/${fileId}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      setDownloading(false);
    }
  };

  const handleDeleteFile = async (paymentId, fileId) => {
    if (!window.confirm('Supprimer ce fichier ?')) return;
    
    try {
      await api.delete(`/technician-payments/${user.id}/${paymentId}/files/${fileId}`);
      refreshData();
    } catch (error) {
      console.error('Delete file error:', error);
    }
  };

  const handleDeletePayment = async (paymentId) => {
    setDeleting(true);
    try {
      await api.delete(`/technician-payments/${user.id}/${paymentId}`);
      setDeleteConfirm(null);
      refreshData();
    } catch (error) {
      console.error('Delete payment error:', error);
    } finally {
      setDeleting(false);
    }
  };

  const summary = currentTechnicianPayments?.summary;
  const activationTotal = summary?.activation?.total || 0;
  const venteTotal = summary?.vente?.total || 0;
  const activationCount = summary?.activation?.count || 0;
  const venteCount = summary?.vente?.count || 0;
  const payments = summary?.all_payments || [];

  return (
    <>
      <div className="users-overlay" onClick={onClose} />
      <div className="users-dialog users-dialog-xl">
        <div className="users-dialog-header">
          <h2 className="users-dialog-title">
            <History size={20} />
            Historique des paiements - {user?.name || 'Utilisateur'}
          </h2>
          <p className="users-dialog-description">
            Total général: <strong>{(activationTotal + venteTotal).toLocaleString('fr-FR')} DH</strong>
          </p>
        </div>
        
        {/* Payment Summary Cards */}
        <div className="users-payment-summary">
          <div className="users-payment-summary-card">
            <div className="users-payment-summary-title">
              <Smartphone size={14} style={{ display: 'inline', marginRight: '0.25rem' }} />
              Activations
            </div>
            <div className="users-payment-summary-amount">
              {activationTotal.toLocaleString('fr-FR')} DH
            </div>
            <div className="users-payment-summary-count">
              {activationCount} activation(s)
            </div>
          </div>
          <div className="users-payment-summary-card">
            <div className="users-payment-summary-title">
              <Package size={14} style={{ display: 'inline', marginRight: '0.25rem' }} />
              Ventes
            </div>
            <div className="users-payment-summary-amount">
              {venteTotal.toLocaleString('fr-FR')} DH
            </div>
            <div className="users-payment-summary-count">
              {venteCount} vente(s)
            </div>
          </div>
          <div className="users-payment-summary-card">
            <div className="users-payment-summary-title">
              <BarChart3 size={14} style={{ display: 'inline', marginRight: '0.25rem' }} />
              Total Général
            </div>
            <div className="users-payment-summary-amount">
              {(activationTotal + venteTotal).toLocaleString('fr-FR')} DH
            </div>
            <div className="users-payment-summary-count">
              {activationCount + venteCount} opération(s)
            </div>
          </div>
        </div>
        
        <div className="users-dialog-body">
          {loading ? (
            <div className="users-loading">
              <div className="users-loading-spinner" />
            </div>
          ) : payments.length === 0 ? (
            <div className="users-empty">
              <div className="users-empty-icon">
                <Receipt size={48} />
              </div>
              <div className="users-empty-text">
                Aucun paiement enregistré pour ce technicien
              </div>
            </div>
          ) : (
            <div className="payments-list">
              {payments.map((payment) => (
                <div key={payment.id || payment.index} className="payment-card">
                  <div className="payment-card-header">
                    <div>
                      <span className={`payment-type ${payment.type}`}>
                        {payment.type === 'activation' ? <Smartphone size={14} /> : <Package size={14} />}
                        {payment.type === 'activation' ? 'Activation' : 'Vente'}
                      </span>
                    </div>
                    <div className="payment-date">
                      {payment.date ? new Date(payment.date).toLocaleDateString('fr-FR') : '-'}
                    </div>
                    {isSuperAdmin && (
                      <button 
                        onClick={() => setDeleteConfirm(payment)} 
                        className="delete-payment-btn"
                        title="Supprimer le paiement"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  
                  <div className="payment-card-details">
                    <div className="payment-detail">
                      <span className="detail-label">Prix unitaire:</span>
                      <span className="detail-value">{payment.amount?.toLocaleString('fr-FR')} DH</span>
                    </div>
                    <div className="payment-detail">
                      <span className="detail-label">Quantité:</span>
                      <span className="detail-value">{payment.count}</span>
                    </div>
                    <div className="payment-detail total">
                      <span className="detail-label">Total:</span>
                      <span className="detail-value">
                        {(payment.amount * payment.count).toLocaleString('fr-FR')} DH
                      </span>
                    </div>
                  </div>
                  
                  {payment.notes && (
                    <div className="payment-notes">
                      <div className="notes-label">Notes:</div>
                      <div className="notes-text">{payment.notes}</div>
                    </div>
                  )}
                  
                  {payment.files && payment.files.length > 0 && (
                    <div className="payment-files">
                      <div className="files-label">
                        <File size={12} />
                        Fichiers joints ({payment.files.length})
                      </div>
                      <div className="files-list">
                        {payment.files.map((file) => (
                          <div key={file.id} className="file-attachment-item">
                            {getFileIcon(file.mime_type)}
                            <div className="file-attachment-info">
                              <div className="file-attachment-name" title={file.original_name}>
                                {file.original_name.length > 30 
                                  ? file.original_name.substring(0, 27) + '...' 
                                  : file.original_name}
                              </div>
                              <div className="file-attachment-meta">
                                {formatFileSize(file.size)}
                              </div>
                            </div>
                            <div className="file-attachment-actions">
                              <button
                                onClick={() => handleDownloadFile(payment.id, file.id, file.original_name)}
                                className="file-action-btn"
                                title="Télécharger"
                                disabled={downloading}
                              >
                                {downloading ? <Loader2 size={16} className="spinner" /> : <Download size={16} />}
                              </button>
                              {isSuperAdmin && (
                                <button
                                  onClick={() => handleDeleteFile(payment.id, file.id)}
                                  className="file-action-btn delete"
                                  title="Supprimer le fichier"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="payment-footer">
                    <div className="created-by">
                      Ajouté par: {payment.created_by_name || '-'}
                      {payment.created_at && (
                        <span className="created-date">
                          le {new Date(payment.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="users-dialog-footer">
          <button onClick={onClose} className="users-btn users-btn-outline">
            Fermer
          </button>
        </div>
        <button className="users-dialog-close" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      {/* Delete Payment Confirmation */}
      {deleteConfirm && (
        <>
          <div className="users-overlay" onClick={() => setDeleteConfirm(null)} />
          <div className="users-dialog">
            <div className="users-dialog-header">
              <h2 className="users-dialog-title" style={{ color: '#dc2626' }}>
                <AlertTriangle size={20} />
                Confirmer la suppression
              </h2>
            </div>
            <div className="users-dialog-body">
              <div className="delete-warning">
                <div className="delete-warning-title">
                  Supprimer ce paiement ?
                </div>
                <div className="delete-warning-text">
                  Type: {deleteConfirm.type === 'activation' ? 'Activation' : 'Vente'}<br />
                  Total: {(deleteConfirm.amount * deleteConfirm.count).toLocaleString('fr-FR')} DH<br />
                  Date: {deleteConfirm.date ? new Date(deleteConfirm.date).toLocaleDateString('fr-FR') : '-'}
                  {deleteConfirm.files?.length > 0 && (
                    <><br />Fichiers joints: {deleteConfirm.files.length} fichier(s) (seront supprimés)</>
                  )}
                </div>
              </div>
            </div>
            <div className="users-dialog-footer">
              <button onClick={() => setDeleteConfirm(null)} className="users-btn users-btn-outline" disabled={deleting}>
                Annuler
              </button>
              <button onClick={() => handleDeletePayment(deleteConfirm.id)} className="users-btn users-btn-danger" disabled={deleting}>
                {deleting ? (
                  <>
                    <Loader2 size={16} className="spinner" />
                    Suppression...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Supprimer le paiement
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

// ==================== MAIN COMPONENT ====================
const Users = () => {
  const dispatch = useDispatch();
  const { user: currentUser } = useSelector((state) => state.auth);
  const { list: users, loading, error } = useSelector((state) => state.users);
  
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [open, setOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    role: 'user', 
    password: '', 
    statut: 'actif' 
  });
  const [formError, setFormError] = useState('');
  const [toasts, setToasts] = useState([]);
  const [deleting, setDeleting] = useState(false);
  
  const [paymentModal, setPaymentModal] = useState({ open: false, user: null, type: null });
  const [historyModal, setHistoryModal] = useState({ open: false, user: null, type: null });
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';
  const isSuperAdmin = currentUser?.role === 'superadmin';
  const isAdminOnly = currentUser?.role === 'admin';
  const isTechnician = currentUser?.role === 'technician';
  
  if (!isAdmin && !isTechnician) {
    return <Navigate to="/dashboard" replace />;
  }

  const canModifyUser = (user) => {
    if (isSuperAdmin) return true;
    if (isAdminOnly && user?.role === 'superadmin') return false;
    if (isTechnician) return false;
    if (user?.id === currentUser?.id) return false;
    return true;
  };

  const canDeleteUser = (user) => {
    if (isSuperAdmin) return true;
    if (isAdminOnly && user?.role === 'superadmin') return false;
    if (isTechnician) return false;
    if (user?.id === currentUser?.id) return false;
    if (user?.is_system) return false;
    return true;
  };

  const canToggleStatus = (user) => {
    if (isSuperAdmin) return true;
    if (isAdminOnly && user?.role === 'superadmin') return false;
    if (isTechnician) return false;
    if (user?.id === currentUser?.id) return false;
    if (user?.is_system) return false;
    return true;
  };

  const canViewPayments = (user) => {
    if (isSuperAdmin) return true;
    if (isAdminOnly && (user?.role === 'admin' || user?.role === 'technician')) return true;
    if (isTechnician && user?.id === currentUser?.id) return true;
    return false;
  };

  const canAddPayments = (user) => {
    if (isSuperAdmin && (user?.role === 'admin' || user?.role === 'technician')) return true;
    if (isAdminOnly && user?.role === 'technician') return true;
    if (isAdminOnly && user?.role === 'admin' && user?.id === currentUser?.id) return true;
    return false;
  };

  const getAvailableRoles = () => {
    if (isSuperAdmin) {
      return [
        { value: 'user', label: 'Utilisateur standard' },
        { value: 'technician', label: 'Technicien' },
        { value: 'admin', label: 'Administrateur' },
        { value: 'superadmin', label: 'Super Administrateur' }
      ];
    }
    if (isAdminOnly) {
      return [
        { value: 'user', label: 'Utilisateur standard' },
        { value: 'technician', label: 'Technicien' },
        { value: 'admin', label: 'Administrateur' }
      ];
    }
    if (isTechnician) {
      return [
        { value: 'user', label: 'Utilisateur standard' }
      ];
    }
    return [];
  };

  useEffect(() => {
    let isMounted = true;
    
    const loadUsers = async () => {
      if (!initialLoadDone) {
        try {
          await dispatch(fetchUsers()).unwrap();
          if (isMounted) {
            setInitialLoadDone(true);
          }
        } catch (err) {
          console.error('Failed to load users:', err);
          if (isMounted) {
            showToast(getErrorMessage(err), 'error');
            setInitialLoadDone(true);
          }
        }
      }
    };
    
    loadUsers();
    
    return () => {
      isMounted = false;
    };
  }, [dispatch, initialLoadDone]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, roleFilter]);

  useEffect(() => {
    if (!open) {
      setFormError('');
      dispatch(clearUserError());
    }
  }, [open, dispatch]);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    const displayMessage = getErrorMessage(message);
    setToasts(prev => [...prev, { id, message: displayMessage, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3000);
  };
  
  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const filtered = users.filter(u => {
    const matchesSearch = (u.name?.toLowerCase() || '').includes(search.toLowerCase()) ||
                          (u.email?.toLowerCase() || '').includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || u.statut === statusFilter;
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesStatus && matchesRole;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  const stats = useMemo(() => {
    const adminCount = users.filter(u => u.role === 'admin').length;
    const superAdminCount = users.filter(u => u.role === 'superadmin').length;
    const technicianCount = users.filter(u => u.role === 'technician').length;
    const userCount = users.filter(u => u.role === 'user').length;
    const activeCount = users.filter(u => u.statut === 'actif').length;
    const inactiveCount = users.filter(u => u.statut === 'inactif').length;
    
    return { adminCount, superAdminCount, technicianCount, userCount, activeCount, inactiveCount };
  }, [users]);

  const refreshUsers = useCallback(() => {
    setInitialLoadDone(false);
    dispatch(fetchUsers());
  }, [dispatch]);

  const openNew = () => {
    if (isTechnician) {
      showToast('Les techniciens ne peuvent pas créer d\'utilisateurs', 'error');
      return;
    }
    setEditing(null);
    setForm({ 
      name: '', 
      email: '', 
      role: 'user', 
      password: '', 
      statut: 'actif' 
    });
    setFormError('');
    setOpen(true);
  };
  
  const openEdit = (u) => {
    if (!canModifyUser(u)) {
      if (u.role === 'superadmin') {
        showToast('Vous ne pouvez pas modifier un compte Super Administrateur', 'error');
      } else if (isTechnician) {
        showToast('Les techniciens ne peuvent pas modifier d\'utilisateurs', 'error');
      } else if (u.id === currentUser?.id) {
        showToast('Vous ne pouvez pas modifier votre propre compte', 'error');
      } else {
        showToast('Vous ne pouvez pas modifier ce compte', 'error');
      }
      return;
    }
    setEditing(u);
    setForm({ 
      name: u.name || '', 
      email: u.email || '', 
      role: u.role || 'user', 
      password: '', 
      statut: u.statut || 'actif'
    });
    setFormError('');
    setOpen(true);
  };

  const save = async () => {
    if (!form.name || !form.name.trim()) {
      setFormError('Le nom est requis');
      showToast('Le nom est requis', 'error');
      return;
    }
    
    if (!form.email || !form.email.trim()) {
      setFormError('L\'email est requis');
      showToast('L\'email est requis', 'error');
      return;
    }
    
    if (isAdminOnly && form.role === 'superadmin') {
      setFormError('Vous n\'avez pas les droits pour créer un compte Super Administrateur');
      showToast('Vous n\'avez pas les droits pour créer un compte Super Administrateur', 'error');
      return;
    }
    
    if (isAdminOnly && editing && form.role === 'superadmin' && editing.role !== 'superadmin') {
      setFormError('Vous ne pouvez pas promouvoir un compte au rang de Super Administrateur');
      showToast('Vous ne pouvez pas promouvoir un compte au rang de Super Administrateur', 'error');
      return;
    }
    
    if (isTechnician) {
      setFormError('Les techniciens ne peuvent pas créer ou modifier d\'utilisateurs');
      showToast('Les techniciens ne peuvent pas créer ou modifier d\'utilisateurs', 'error');
      return;
    }
    
    if (!editing && (!form.password || form.password.length < 6)) {
      setFormError('Le mot de passe doit contenir au moins 6 caractères');
      showToast('Le mot de passe doit contenir au moins 6 caractères', 'error');
      return;
    }

    const userData = {
      name: form.name,
      email: form.email,
      role: form.role,
      statut: form.statut,
    };
    
    if (form.password) {
      userData.password = form.password;
    }

    try {
      if (editing) {
        await dispatch(updateUser({ id: editing.id, ...userData })).unwrap();
        showToast(`Utilisateur "${form.name}" mis à jour avec succès`, 'success');
      } else {
        await dispatch(createUser(userData)).unwrap();
        showToast(`Utilisateur "${form.name}" créé avec succès`, 'success');
      }
      setOpen(false);
      refreshUsers();
    } catch (err) {
      const errorMsg = getErrorMessage(err);
      setFormError(errorMsg);
      showToast(errorMsg, 'error');
    }
  };

  const confirmDelete = (user) => {
    if (!canDeleteUser(user)) {
      if (user.role === 'superadmin') {
        showToast('Vous ne pouvez pas supprimer un compte Super Administrateur', 'error');
      } else if (user.id === currentUser?.id) {
        showToast('Impossible de supprimer votre propre compte', 'error');
      } else if (user.is_system) {
        showToast('Impossible de supprimer un compte système', 'error');
      } else if (isTechnician) {
        showToast('Les techniciens ne peuvent pas supprimer d\'utilisateurs', 'error');
      }
      return;
    }
    setDeleteDialog(user);
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    
    setDeleting(true);
    try {
      await dispatch(deleteUser(deleteDialog.id)).unwrap();
      showToast(`Utilisateur "${deleteDialog.name}" supprimé avec succès`, 'success');
      setDeleteDialog(null);
      refreshUsers();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleStatus = async (user) => {
    if (!canToggleStatus(user)) {
      if (user.role === 'superadmin') {
        showToast('Vous ne pouvez pas modifier le statut d\'un Super Administrateur', 'error');
      } else if (user.id === currentUser?.id) {
        showToast('Impossible de modifier votre propre statut', 'error');
      } else if (user.is_system) {
        showToast('Impossible de modifier le statut d\'un compte système', 'error');
      } else if (isTechnician) {
        showToast('Les techniciens ne peuvent pas modifier le statut d\'utilisateurs', 'error');
      }
      return;
    }
    
    try {
      await dispatch(toggleUserStatus(user.id)).unwrap();
      const newStatus = user.statut === 'actif' ? 'inactif' : 'actif';
      showToast(`Utilisateur ${newStatus === 'actif' ? 'activé' : 'désactivé'} avec succès`, 'success');
      refreshUsers();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  const openPaymentModal = (user, type) => {
    setPaymentModal({ open: true, user, type });
  };

  const openHistoryModal = (user, type) => {
    setHistoryModal({ open: true, user, type });
  };

  const clearAllFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setRoleFilter('all');
  };

  const getRoleLabel = (role) => {
    if (role === 'superadmin') return 'Super Admin';
    if (role === 'admin') return 'Admin';
    if (role === 'technician') return 'Technicien';
    return 'Utilisateur';
  };

  const getRoleIcon = (role) => {
    if (role === 'superadmin') return <Crown size={12} />;
    if (role === 'admin') return <UserCog size={12} />;
    if (role === 'technician') return <Wrench size={12} />;
    return <UserCircle size={12} />;
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const hasActiveFilters = search !== '' || statusFilter !== 'all' || roleFilter !== 'all';

  if (loading && users.length === 0 && !initialLoadDone) {
    return (
      <div className="users-loading">
        <div className="users-loading-spinner" />
        <p style={{ marginTop: '1rem', color: '#64748b' }}>Chargement des utilisateurs...</p>
      </div>
    );
  }

  return (
    <div className="users-page-container">
      <style>{styles}</style>
      
      {toasts.length > 0 && (
        <div className="users-toast-container">
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
      
      <div className="users-page-header">
        <div className="users-title-section">
          <h1 className="users-title">
            Gestion des Utilisateurs
          </h1>
          <div className="users-subtitle">
            <span>Gérez les comptes et permissions de votre équipe</span>
            <span className="users-subtitle-badge">
              <UsersIcon size={12} style={{ display: 'inline', marginRight: '0.25rem' }} />
              {users.length} total
            </span>
            {isAdminOnly && (
              <span className="users-subtitle-badge" style={{ background: '#fef3c7', color: '#d97706' }}>
                <Shield size={12} style={{ display: 'inline', marginRight: '0.25rem' }} />
                Mode Admin
              </span>
            )}
            {isSuperAdmin && (
              <span className="users-subtitle-badge" style={{ background: '#dbeafe', color: '#2563eb' }}>
                <Crown size={12} style={{ display: 'inline', marginRight: '0.25rem' }} />
                Super Admin - Accès total
              </span>
            )}
            {isTechnician && (
              <span className="users-subtitle-badge" style={{ background: '#cffafe', color: '#0891b2' }}>
                <Wrench size={12} style={{ display: 'inline', marginRight: '0.25rem' }} />
                Technicien - Accès limité
              </span>
            )}
          </div>
        </div>
        <div className="users-actions">
          <button 
            onClick={openNew} 
            className="users-btn users-btn-primary"
            disabled={isTechnician}
          >
            <Plus size={16} /> Ajouter un utilisateur
          </button>
          <button 
            onClick={refreshUsers} 
            className="users-btn users-btn-outline"
            title="Rafraîchir"
          >
            <RefreshCw size={16} /> Rafraîchir
          </button>
        </div>
      </div>

      <div className="users-stats-grid">
        <StatCard 
          icon={UsersIcon} 
          label="Total utilisateurs" 
          value={users.length} 
          color="primary"
        />
        <StatCard 
          icon={ShieldCheck} 
          label="Administrateurs" 
          value={stats.adminCount + stats.superAdminCount} 
          color="warning"
        />
        <StatCard 
          icon={Wrench} 
          label="Techniciens" 
          value={stats.technicianCount} 
          color="technician"
        />
        <StatCard 
          icon={UserCheck} 
          label="Utilisateurs actifs" 
          value={stats.activeCount} 
          color="success"
        />
        <StatCard 
          icon={UserX} 
          label="Comptes inactifs" 
          value={stats.inactiveCount} 
          color="info"
        />
      </div>

      <div className="users-card">
        <div className="users-filter-bar">
          <div className="users-filter-group">
            <div className="users-search-wrapper">
              <Search className="users-search-icon" />
              <input 
                className="users-search-input" 
                placeholder="Rechercher par nom ou email..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
              />
            </div>
            
            <div className="users-filter-select">
              <Filter className="users-filter-icon" />
              <select 
                className="users-select-filter" 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Tous les statuts</option>
                <option value="actif">Actifs</option>
                <option value="inactif">Inactifs</option>
              </select>
            </div>
            
            <div className="users-filter-select">
              <Shield className="users-filter-icon" />
              <select 
                className="users-select-filter" 
                value={roleFilter} 
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="all">Tous les rôles</option>
                <option value="user">Utilisateurs</option>
                <option value="technician">Techniciens</option>
                <option value="admin">Admins</option>
                <option value="superadmin">Super Admins</option>
              </select>
            </div>
          </div>
          
          {hasActiveFilters && (
            <button className="users-clear-filters" onClick={clearAllFilters}>
              <X size={14} />
              Effacer les filtres
            </button>
          )}
        </div>
        
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Rôle</th>
                <th>Statut</th>
                <th>Date création</th>
                <th>Paiements</th>
                <th className="users-w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="users-user-info">
                      <div className="users-user-avatar">
                        {getInitials(u.name)}
                      </div>
                      <div>
                        <div className="users-user-name">
                          {u.name}
                          {u.is_system && (
                            <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', color: '#64748b' }}>
                              (Système)
                            </span>
                          )}
                        </div>
                        <div className="users-user-email">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className={`users-badge ${
                      u.role === 'superadmin' ? 'users-badge-default' : 
                      u.role === 'admin' ? 'users-badge-warning' : 
                      u.role === 'technician' ? 'users-badge-cyan' :
                      'users-badge-secondary'
                    }`}>
                      {getRoleIcon(u.role)}
                      {getRoleLabel(u.role)}
                    </div>
                  </td>
                  <td>
                    {u.statut === 'actif' ? 
                      <span className="users-badge users-badge-success">
                        <CheckCircle size={12} />
                        Actif
                      </span> : 
                      <span className="users-badge users-badge-destructive">
                        <X size={12} />
                        Inactif
                      </span>
                    }
                  </td>
                  <td className="users-text-muted">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString('fr-FR') : '-'}
                  </td>
                  <td>
                    <div className="users-actions-cell">
                      {canViewPayments(u) && (
                        <button 
                          onClick={() => openHistoryModal(u, u.role === 'admin' ? 'admin' : 'technician')} 
                          className="users-btn-icon" 
                          title="Voir historique des paiements"
                        >
                          <History size={16} />
                        </button>
                      )}
                      {canAddPayments(u) && (
                        <button 
                          onClick={() => openPaymentModal(u, u.role === 'admin' ? 'admin' : 'technician')} 
                          className="users-btn-icon" 
                          title="Ajouter un paiement"
                        >
                          <DollarSign size={16} />
                        </button>
                      )}
                    </div>
                   </td>
                  <td>
                    <div className="users-actions-cell">
                      <button 
                        onClick={() => openEdit(u)} 
                        className="users-btn-icon" 
                        title="Modifier"
                        disabled={!canModifyUser(u)}
                      >
                        <Pencil size={16} />
                      </button>
                      <button 
                        onClick={() => handleToggleStatus(u)} 
                        className="users-btn-icon" 
                        title={u.statut === 'actif' ? 'Désactiver' : 'Activer'}
                        disabled={!canToggleStatus(u)}
                      >
                        {u.statut === 'actif' ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <button 
                        onClick={() => confirmDelete(u)} 
                        className="users-btn-icon users-btn-icon-danger" 
                        title="Supprimer"
                        disabled={!canDeleteUser(u)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                   </td>
                </tr>
              ))}
              {paginatedUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="users-empty">
                    <div className="users-empty-icon">
                      <UsersIcon size={64} />
                    </div>
                    <div className="users-empty-text">
                      {hasActiveFilters 
                        ? 'Aucun utilisateur ne correspond aux critères de recherche'
                        : 'Aucun utilisateur dans la base de données'}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <Pagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          onPageChange={setCurrentPage} 
        />
      </div>

      {/* Add/Edit Dialog */}
      {open && (
        <>
          <div className="users-overlay" onClick={() => setOpen(false)} />
          <div className="users-dialog">
            <div className="users-dialog-header">
              <h2 className="users-dialog-title">
                {editing ? (
                  <>
                    <Pencil size={20} />
                    Modifier l'utilisateur
                  </>
                ) : (
                  <>
                    <Plus size={20} />
                    Nouvel utilisateur
                  </>
                )}
              </h2>
              <p className="users-dialog-description">
                {editing 
                  ? 'Modifiez les informations de l\'utilisateur ci-dessous' 
                  : 'Remplissez les informations pour ajouter un nouvel utilisateur'}
              </p>
            </div>
            <div className="users-dialog-body">
              {formError && (
                <div className="users-error-message">
                  <AlertTriangle size={16} />
                  <span>{formError}</span>
                </div>
              )}
              
              <div className="users-form-group">
                <label className="users-label users-label-required">Nom complet</label>
                <input 
                  value={form.name} 
                  onChange={(e) => setForm({ ...form, name: e.target.value })} 
                  className="users-input" 
                  placeholder="Jean Dupont"
                  autoFocus
                />
              </div>
              
              <div className="users-form-group">
                <label className="users-label users-label-required">Email</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input 
                    type="email" 
                    value={form.email} 
                    onChange={(e) => setForm({ ...form, email: e.target.value })} 
                    className="users-input" 
                    style={{ paddingLeft: '2.5rem' }}
                    placeholder="utilisateur@exemple.com"
                  />
                </div>
              </div>
              
              <div className="users-form-group">
                <label className="users-label users-label-required">Rôle</label>
                <select 
                  value={form.role} 
                  onChange={(e) => setForm({ ...form, role: e.target.value })} 
                  className="users-select"
                  disabled={editing && !canModifyUser(editing)}
                >
                  {getAvailableRoles().map(role => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="users-form-group">
                <label className={`users-label ${!editing ? 'users-label-required' : ''}`}>
                  {editing ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe'}
                </label>
                <div style={{ position: 'relative' }}>
                  <Key size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input 
                    type="password" 
                    value={form.password} 
                    onChange={(e) => setForm({ ...form, password: e.target.value })} 
                    className="users-input" 
                    style={{ paddingLeft: '2.5rem' }}
                    placeholder={editing ? 'Laisser vide pour garder le mot de passe actuel' : 'Minimum 6 caractères'}
                  />
                </div>
              </div>
              
              <div className="users-toggle-container">
                <div>
                  <div className="users-toggle-label">Compte actif</div>
                  <div className="users-toggle-desc">Désactiver pour bloquer la connexion de l'utilisateur</div>
                </div>
                <button 
                  onClick={() => setForm({ ...form, statut: form.statut === 'actif' ? 'inactif' : 'actif' })} 
                  className={`users-toggle-switch ${form.statut === 'actif' ? 'users-toggle-switch-active' : 'users-toggle-switch-inactive'}`}
                >
                  <div className={`users-toggle-knob ${form.statut === 'actif' ? 'users-toggle-knob-active' : 'users-toggle-knob-inactive'}`} />
                </button>
              </div>
            </div>
            <div className="users-dialog-footer">
              <button onClick={() => setOpen(false)} className="users-btn users-btn-outline">Annuler</button>
              <button onClick={save} className="users-btn users-btn-primary">
                {editing ? 'Mettre à jour' : 'Créer l\'utilisateur'}
              </button>
            </div>
            <button className="users-dialog-close" onClick={() => setOpen(false)}>
              <X size={18} />
              <span className="sr-only">Fermer</span>
            </button>
          </div>
        </>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteDialog && (
        <>
          <div className="users-overlay" onClick={() => !deleting && setDeleteDialog(null)} />
          <div className="users-dialog">
            <div className="users-dialog-header" style={{ borderTop: '4px solid #ef4444', borderRadius: '1rem' }}>
              <h2 className="users-dialog-title" style={{ color: '#dc2626' }}>
                <AlertTriangle size={24} />
                Confirmer la suppression
              </h2>
              <p className="users-dialog-description">
                Cette action est irréversible. Veuillez confirmer votre choix.
              </p>
            </div>
            
            <div className="delete-warning">
              <div className="delete-warning-title">
                <AlertTriangle size={18} />
                Utilisateur à supprimer :
              </div>
              <div className="delete-warning-text">
                <strong>{deleteDialog.name}</strong>
                <div style={{ marginTop: '0.5rem' }}>
                  ✉️ {deleteDialog.email}<br />
                  👤 {getRoleLabel(deleteDialog.role)}
                </div>
              </div>
            </div>
            
            <div className="users-dialog-footer">
              <button 
                className="users-btn users-btn-outline" 
                onClick={() => setDeleteDialog(null)}
                disabled={deleting}
              >
                Annuler
              </button>
              <button 
                className="users-btn users-btn-danger" 
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <div className="users-loading-spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                    Suppression en cours...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Supprimer définitivement
                  </>
                )}
              </button>
            </div>
            <button 
              className="users-dialog-close" 
              onClick={() => !deleting && setDeleteDialog(null)}
              disabled={deleting}
            >
              <X size={18} />
              <span className="sr-only">Fermer</span>
            </button>
          </div>
        </>
      )}

      {/* Payment Modals */}
      {paymentModal.open && paymentModal.type === 'admin' && (
        <AdminPaymentModal
          user={paymentModal.user}
          onClose={() => setPaymentModal({ open: false, user: null, type: null })}
          onSuccess={showToast}
        />
      )}
      
      {paymentModal.open && paymentModal.type === 'technician' && (
        <TechnicianPaymentModal
          user={paymentModal.user}
          onClose={() => setPaymentModal({ open: false, user: null, type: null })}
          onSuccess={showToast}
        />
      )}
      
      {historyModal.open && historyModal.type === 'admin' && (
        <AdminPaymentHistoryModal
          user={historyModal.user}
          onClose={() => setHistoryModal({ open: false, user: null, type: null })}
        />
      )}
      
      {historyModal.open && historyModal.type === 'technician' && (
        <TechnicianPaymentHistoryModal
          user={historyModal.user}
          onClose={() => setHistoryModal({ open: false, user: null, type: null })}
        />
      )}
    </div>
  );
};

export default Users;