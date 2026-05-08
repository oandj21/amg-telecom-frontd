import { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { 
  Plus, Pencil, Trash2, Search, Shield, ShoppingBag, RefreshCw, X, 
  AlertTriangle, CheckCircle, Info, ChevronLeft, ChevronRight, 
  Users as UsersIcon, UserCheck, UserX, Filter, Eye, EyeOff,
  ShieldCheck, UserCog, UserCircle, Calendar, Mail, Key,
  Sparkles, TrendingUp, Award, Star, Zap, Crown
} from 'lucide-react';
import { ExportMenu } from './ExportMenu';
import {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  clearUserError
} from './Store/store';

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
    font-size: 0.875rem;
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
      grid-template-columns: repeat(4, 1fr);
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
  
  .users-stat-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }
  
  .users-stat-label {
    font-size: 0.875rem;
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
    font-size: 0.875rem;
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
    font-size: 0.875rem;
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
  
  .users-filter-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.375rem 0.875rem;
    background: #f1f5f9;
    border-radius: 2rem;
    font-size: 0.75rem;
    font-weight: 500;
    color: #475569;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .users-filter-badge:hover {
    background: #e2e8f0;
  }
  
  .users-filter-badge-active {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
  }
  
  .users-filter-badge-active svg {
    color: white;
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
    font-size: 0.875rem;
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
    font-size: 0.875rem;
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
    font-size: 0.875rem;
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
  
  .users-btn-ghost {
    background: transparent;
    color: #64748b;
  }
  
  .users-btn-ghost:hover {
    background: #f1f5f9;
    color: #0f172a;
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
    font-size: 0.875rem;
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
    font-size: 0.875rem;
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
    font-size: 0.875rem;
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
    font-size: 0.875rem;
    background: white;
    color: #0f172a;
    outline: none;
    cursor: pointer;
  }
  
  .users-select:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  .users-select:disabled {
    background-color: #f8fafc;
    cursor: not-allowed;
    opacity: 0.7;
  }
  
  /* Toggle Switch */
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
    font-size: 0.875rem;
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
    font-size: 0.875rem;
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
    font-size: 0.875rem;
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
    font-size: 0.875rem;
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
    font-size: 0.875rem;
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
    font-size: 0.875rem;
    color: #64748b;
  }
  
  .users-pagination-active {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
    border-color: #3b82f6;
  }
  
  .users-text-destructive {
    color: #ef4444;
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
  
  /* Animations */
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
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
    const timer = setTimeout(() => onClose(), 3000);
    return () => clearTimeout(timer);
  }, [onClose]);
  
  const Icon = type === 'success' ? CheckCircle : type === 'error' ? AlertTriangle : Info;
  
  return (
    <div className={`users-toast users-toast-${type}`}>
      <Icon size={20} />
      <span className="users-toast-message">{message}</span>
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
        <div className="users-stat-value">{value}</div>
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

// ==================== MAIN COMPONENT ====================
const Users = () => {
  const dispatch = useDispatch();
  const { user: currentUser } = useSelector((state) => state.auth);
  const { list: users, loading, error } = useSelector((state) => state.users);
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, actif, inactif
  const [roleFilter, setRoleFilter] = useState('all'); // all, user, admin, superadmin
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
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Check if current user is admin or superadmin
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';
  const isSuperAdmin = currentUser?.role === 'superadmin';
  const isAdminOnly = currentUser?.role === 'admin';
  
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // Permission checking functions
  const canModifyUser = (user) => {
    // Superadmin can modify anyone
    if (isSuperAdmin) return true;
    
    // Admin cannot modify superadmins
    if (isAdminOnly && user?.role === 'superadmin') return false;
    
    // Cannot modify yourself
    if (user?.id === currentUser?.id) return false;
    
    return true;
  };

  const canDeleteUser = (user) => {
    // Superadmin can delete anyone
    if (isSuperAdmin) return true;
    
    // Admin cannot delete superadmins
    if (isAdminOnly && user?.role === 'superadmin') return false;
    
    // Cannot delete yourself
    if (user?.id === currentUser?.id) return false;
    
    // Cannot delete system users
    if (user?.is_system) return false;
    
    return true;
  };

  const canToggleStatus = (user) => {
    // Superadmin can toggle anyone
    if (isSuperAdmin) return true;
    
    // Admin cannot toggle superadmins
    if (isAdminOnly && user?.role === 'superadmin') return false;
    
    // Cannot toggle your own status
    if (user?.id === currentUser?.id) return false;
    
    // Cannot toggle system users
    if (user?.is_system) return false;
    
    return true;
  };

  const getAvailableRoles = () => {
    if (isSuperAdmin) {
      return [
        { value: 'user', label: 'Utilisateur standard' },
        { value: 'admin', label: 'Administrateur' },
        { value: 'superadmin', label: 'Super Administrateur' }
      ];
    }
    if (isAdminOnly) {
      return [
        { value: 'user', label: 'Utilisateur standard' },
        { value: 'admin', label: 'Administrateur' }
      ];
    }
    return [];
  };

  // Fetch users on mount
  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, roleFilter]);

  // Clear errors when modal opens/closes
  useEffect(() => {
    if (!open) {
      setFormError('');
      dispatch(clearUserError());
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

  // Filter users based on search, status, and role
  const filtered = users.filter(u => {
    const matchesSearch = (u.name?.toLowerCase() || '').includes(search.toLowerCase()) ||
                          (u.email?.toLowerCase() || '').includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || u.statut === statusFilter;
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesStatus && matchesRole;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  // Statistics
  const adminCount = users.filter(u => u.role === 'admin').length;
  const superAdminCount = users.filter(u => u.role === 'superadmin').length;
  const userCount = users.filter(u => u.role === 'user').length;
  const activeCount = users.filter(u => u.statut === 'actif').length;
  const inactiveCount = users.filter(u => u.statut === 'inactif').length;

  const openNew = () => {
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
      showToast('Vous ne pouvez pas modifier ce compte', 'error');
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
    
    // Check if admin is trying to create a superadmin
    if (isAdminOnly && form.role === 'superadmin') {
      setFormError('Vous n\'avez pas les droits pour créer un compte Super Administrateur');
      showToast('Vous n\'avez pas les droits pour créer un compte Super Administrateur', 'error');
      return;
    }
    
    // Check if admin is trying to update a role to superadmin
    if (isAdminOnly && editing && form.role === 'superadmin' && editing.role !== 'superadmin') {
      setFormError('Vous ne pouvez pas promouvoir un compte au rang de Super Administrateur');
      showToast('Vous ne pouvez pas promouvoir un compte au rang de Super Administrateur', 'error');
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
      dispatch(fetchUsers());
    } catch (err) {
      setFormError(err || 'Une erreur est survenue');
      showToast(err || 'Erreur lors de l\'enregistrement', 'error');
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
      dispatch(fetchUsers());
    } catch (err) {
      showToast(err || 'Erreur lors de la suppression', 'error');
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
      }
      return;
    }
    
    try {
      await dispatch(toggleUserStatus(user.id)).unwrap();
      const newStatus = user.statut === 'actif' ? 'inactif' : 'actif';
      showToast(`Utilisateur ${newStatus === 'actif' ? 'activé' : 'désactivé'} avec succès`, 'success');
      dispatch(fetchUsers());
    } catch (err) {
      showToast(err || 'Erreur lors du changement de statut', 'error');
    }
  };

  const clearAllFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setRoleFilter('all');
  };

  const getRoleBadgeVariant = (role) => {
    if (role === 'superadmin') return 'default';
    if (role === 'admin') return 'warning';
    return 'secondary';
  };

  const getRoleLabel = (role) => {
    if (role === 'superadmin') return 'Super Admin';
    if (role === 'admin') return 'Admin';
    return 'Utilisateur';
  };

  const getRoleIcon = (role) => {
    if (role === 'superadmin') return <Crown size={12} />;
    if (role === 'admin') return <UserCog size={12} />;
    return <UserCircle size={12} />;
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const hasActiveFilters = search !== '' || statusFilter !== 'all' || roleFilter !== 'all';

  if (loading && users.length === 0) {
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
      
      {/* Toast Container */}
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
      
      {/* Header */}
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
                Mode Admin (Super Admins visibles uniquement)
              </span>
            )}
            {isSuperAdmin && (
              <span className="users-subtitle-badge" style={{ background: '#dbeafe', color: '#2563eb' }}>
                <Crown size={12} style={{ display: 'inline', marginRight: '0.25rem' }} />
                Super Admin - Accès total
              </span>
            )}
          </div>
        </div>
        <div className="users-actions">
          <ExportMenu 
            title="Liste des utilisateurs" 
            rows={filtered} 
            columns={[
              { header: 'Nom', accessor: u => u.name },
              { header: 'Email', accessor: u => u.email },
              { header: 'Rôle', accessor: u => getRoleLabel(u.role) },
              { header: 'Statut', accessor: u => u.statut === 'actif' ? 'Actif' : 'Inactif' },
              { header: 'Date création', accessor: u => u.created_at ? new Date(u.created_at).toLocaleDateString('fr-FR') : '-' },
            ]} 
          />
          <button onClick={openNew} className="users-btn users-btn-primary">
            <Plus size={16} /> Ajouter un utilisateur
          </button>
        </div>
      </div>

      {/* Stats Cards */}
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
          value={adminCount + superAdminCount} 
          color="warning"
          trend={`${superAdminCount} super admin`}
        />
        <StatCard 
          icon={UserCheck} 
          label="Utilisateurs actifs" 
          value={activeCount} 
          color="success"
        />
        <StatCard 
          icon={UserX} 
          label="Comptes inactifs" 
          value={inactiveCount} 
          color="info"
        />
      </div>

      {/* Main Card */}
      <div className="users-card">
        {/* Filter Bar */}
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
        
        {/* Table */}
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Email</th>
                <th>Rôle</th>
                <th>Statut</th>
                <th>Date création</th>
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
                  <td className="users-text-muted">{u.email}</td>
                  <td>
                    <div className={`users-badge ${
                      u.role === 'superadmin' ? 'users-badge-default' : 
                      u.role === 'admin' ? 'users-badge-warning' : 
                      'users-badge-secondary'
                    }`}>
                      {getRoleIcon(u.role)}
                      {getRoleLabel(u.role)}
                      {u.role === 'superadmin' && <Crown size={12} style={{ marginLeft: '0.25rem' }} />}
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
        
        {/* Pagination */}
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
                  {formError}
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
                {isAdminOnly && editing && editing.role === 'superadmin' && (
                  <p className="users-text-muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: '#ef4444' }}>
                    Vous ne pouvez pas modifier ce compte Super Administrateur
                  </p>
                )}
                {isAdminOnly && !editing && (
                  <p className="users-text-muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: '#64748b' }}>
                    Vous ne pouvez créer que des comptes Utilisateur ou Administrateur
                  </p>
                )}
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
                  {deleteDialog.role === 'superadmin' && ' ⚠️ Ce compte a des privilèges maximum'}
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
                style={deleting ? { animation: 'pulse 1s ease-in-out infinite' } : {}}
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
    </div>
  );
};

export default Users;