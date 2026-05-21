import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Plus, Search, Filter, Download, Edit, Trash2, X, 
  ChevronLeft, ChevronRight, Upload, FileText, 
  FileUp, Image as ImageIcon, File, Loader2, 
  RefreshCw, Eye, Printer, AlertTriangle, CheckCircle, Info,
  Calendar, Building2, User, CreditCard, Banknote, ChevronDown,
  TrendingUp, Shield, Clock, Wallet, Landmark, Users,
  AlertCircle, Bell, FileCheck, DollarSign, CalendarDays,
  Check as CheckIcon
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ExportMenu } from './ExportMenu';
import logo from './assets/logo.png';
import {
  fetchChecks,
  fetchCheckById,
  createCheck,
  updateCheck,
  deleteCheck,
  uploadCheckFiles,
  deleteCheckFile,
  fetchCheckSummary,
  fetchCheckFilterOptions,
  exportChecks,
  clearCheckError,
  clearSelectedCheck,
  setPage
} from './Store/store';

// ==================== IMAGE COMPRESSION UTILITY ====================
const compressImage = async (file, maxWidth = 1200, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      resolve(file);
      return;
    }
    
    if (file.type === 'application/pdf') {
      resolve(file);
      return;
    }
    
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, width, height);
        
        let outputFormat = 'image/jpeg';
        let outputQuality = quality;
        
        if (file.type === 'image/png') {
          outputFormat = 'image/png';
          outputQuality = 0.9;
        } else if (file.type === 'image/webp') {
          outputFormat = 'image/webp';
        }
        
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            
            let newFileName = file.name;
            if (file.type.startsWith('image/')) {
              const extension = outputFormat === 'image/jpeg' ? '.jpg' : 
                               outputFormat === 'image/png' ? '.png' : '.webp';
              newFileName = file.name.replace(/\.[^/.]+$/, '') + extension;
            }
            
            const compressedFile = new window.File([blob], newFileName, {
              type: outputFormat,
              lastModified: Date.now()
            });
            
            const originalSize = (file.size / 1024 / 1024).toFixed(2);
            const compressedSize = (compressedFile.size / 1024 / 1024).toFixed(2);
            console.log(`Compressed ${file.name}: ${originalSize}MB -> ${compressedSize}MB`);
            resolve(compressedFile);
          },
          outputFormat,
          outputQuality
        );
      };
      
      img.onerror = () => {
        console.warn('Image compression failed, using original file');
        resolve(file);
      };
    };
    
    reader.onerror = () => {
      console.warn('File reading failed, using original file');
      resolve(file);
    };
  });
};

const formatCurrencyHelper = (amount) => {
  if (amount === undefined || amount === null) return '0 MAD';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0 MAD';
  return new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(num);
};

// ==================== SEARCHABLE SELECT COMPONENT ====================
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
  
  const selectedOption = options.find(opt => 
    (opt.id && opt.id === value) || (opt.nom && opt.nom === value) || opt === value
  );
  
  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    const searchLower = searchTerm.toLowerCase();
    return options.filter(opt => {
      const optionValue = typeof opt === 'object' ? (opt.nom || opt.name || '') : opt;
      return optionValue.toLowerCase().includes(searchLower);
    });
  }, [options, searchTerm]);
  
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
    const optionValue = typeof option === 'object' ? (option.nom || option.name) : option;
    onChange(optionValue, option);
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
  
  // Helper to get a unique key for an option
  const getOptionKey = (option, index) => {
    if (typeof option === 'object') {
      // Use a combination of properties to create a unique key
      if (option.id !== undefined && option.id !== null) {
        return `${option.id}_${option.source_type || ''}_${option.source_reference || ''}`;
      }
      if (option.nom) {
        // For client objects, use nom + source_reference for uniqueness
        return `${option.nom}_${option.source_reference || index}_${option.source_type || ''}`;
      }
    }
    // Fallback to index with prefix to ensure uniqueness
    return `option_${index}_${Date.now()}`;
  };
  
  return (
    <div className="searchable-select" ref={containerRef} onKeyDown={handleKeyDown}>
      <div 
        className={`searchable-select-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{ cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1 }}
      >
        <span className={selectedOption ? 'searchable-select-trigger-value' : 'searchable-select-trigger-placeholder'}>
          {selectedOption ? (typeof selectedOption === 'object' ? (selectedOption.nom || selectedOption.name) : selectedOption) : placeholder}
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
              filteredOptions.map((option, index) => {
                const optionName = typeof option === 'object' ? (option.nom || option.name) : option;
                const isSelected = selectedOption && (
                  (typeof selectedOption === 'object' ? selectedOption.nom === optionName : selectedOption === optionName)
                );
                return (
                  <div
                    key={getOptionKey(option, index)}
                    className={`searchable-select-option ${isSelected ? 'selected' : ''} ${highlightedIndex === index ? 'highlighted' : ''}`}
                    onClick={() => handleSelect(option)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    {renderOption ? renderOption(option) : <span>{optionName}</span>}
                    {isSelected && (
                      <CheckIcon size={16} className="searchable-select-option-check" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== STYLES ====================
const styles = `
  /* Base Layout */
  .check-page-container {
    padding: 1rem;
  }
  
  @media (min-width: 768px) {
    .check-page-container {
      padding: 1.5rem;
    }
  }
  
  .check-page-header {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 2rem;
  }
  
  @media (min-width: 768px) {
    .check-page-header {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
    }
  }
  
  .check-title-section {
    flex: 1;
  }
  
  .check-title {
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
    .check-title {
      font-size: 2rem;
    }
  }
  
  .check-subtitle {
    font-size: 0.875rem;
    color: #64748b;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  
  .check-subtitle-badge {
    background: #f1f5f9;
    padding: 0.25rem 0.75rem;
    border-radius: 2rem;
    font-size: 0.75rem;
    font-weight: 500;
    color: #475569;
  }
  
  .check-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }
  
  .check-card {
    background: white;
    border-radius: 1rem;
    border: 1px solid #e2e8f0;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
    overflow: hidden;
  }
  
  .check-card:hover {
    box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.08);
  }
  
  /* Summary Cards */
  .check-summary-container {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  
  @media (min-width: 640px) {
    .check-summary-container {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  
  @media (min-width: 1024px) {
    .check-summary-container {
      grid-template-columns: repeat(4, 1fr);
    }
  }
  
  .check-summary-card {
    background: white;
    border-radius: 1rem;
    padding: 1.25rem;
    border: 1px solid #e2e8f0;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
  }
  
  .check-summary-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  }
  
  .check-summary-card-primary::before {
    background: linear-gradient(90deg, #3b82f6, #06b6d4);
  }
  
  .check-summary-card-success::before {
    background: linear-gradient(90deg, #10b981, #34d399);
  }
  
  .check-summary-card-warning::before {
    background: linear-gradient(90deg, #f59e0b, #fbbf24);
  }
  
  .check-summary-card-info::before {
    background: linear-gradient(90deg, #8b5cf6, #a78bfa);
  }
  
  .check-summary-icon-wrapper {
    width: 3rem;
    height: 3rem;
    border-radius: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
    margin-bottom: 1rem;
  }
  
  .check-summary-icon-wrapper svg {
    width: 1.5rem;
    height: 1.5rem;
  }
  
  .check-summary-icon-primary svg { color: #3b82f6; }
  .check-summary-icon-success svg { color: #10b981; }
  .check-summary-icon-warning svg { color: #f59e0b; }
  .check-summary-icon-info svg { color: #8b5cf6; }
  
  .check-summary-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }
  
  .check-summary-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #64748b;
    margin-bottom: 0.5rem;
  }
  
  .check-summary-value {
    font-size: 1.75rem;
    font-weight: 800;
    color: #0f172a;
    line-height: 1;
  }
  
  /* Filter Bar */
  .check-filter-bar {
    padding: 1rem 1.5rem;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }
  
  .check-filter-group {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    align-items: center;
    flex: 1;
  }
  
  .check-search-wrapper {
    position: relative;
    flex: 2;
    min-width: 280px;
  }
  
  .check-search-icon {
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    width: 1.125rem;
    height: 1.125rem;
    color: #94a3b8;
    pointer-events: none;
  }
  
  .check-search-input {
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
  
  .check-search-input:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  .check-search-input::placeholder {
    color: #94a3b8;
  }
  
  .check-filter-select {
    position: relative;
    min-width: 160px;
  }
  
  .check-filter-icon {
    position: absolute;
    left: 0.875rem;
    top: 50%;
    transform: translateY(-50%);
    width: 1rem;
    height: 1rem;
    color: #94a3b8;
    pointer-events: none;
  }
  
  .check-select-filter {
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
  
  .check-select-filter:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  .check-clear-filters {
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
  
  .check-clear-filters:hover {
    background: #fef2f2;
    border-color: #fca5a5;
    color: #dc2626;
  }
  
  /* Table Styles */
  .check-table-container {
    position: relative;
    width: 100%;
    overflow-x: auto;
  }
  
  .check-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
  }
  
  .check-table thead tr {
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
  }
  
  .check-table th {
    padding: 1rem;
    text-align: left;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #64748b;
  }
  
  .check-table tbody tr {
    border-bottom: 1px solid #f1f5f9;
    transition: all 0.2s ease;
  }
  
  .check-table tbody tr:hover {
    background-color: #f8fafc;
  }
  
  .check-table td {
    padding: 1rem;
    vertical-align: middle;
  }
  
  .check-font-medium {
    font-weight: 500;
    color: #0f172a;
  }
  
  .check-text-muted {
    color: #64748b;
  }
  
  .check-text-right {
    text-align: right;
  }
  
  .check-font-semibold {
    font-weight: 600;
    color: #059669;
  }
  
  .check-empty {
    text-align: center;
    padding: 3rem 0;
  }
  
  .check-empty-icon {
    width: 4rem;
    height: 4rem;
    margin: 0 auto 1rem;
    color: #cbd5e1;
  }
  
  .check-empty-text {
    color: #94a3b8;
    font-size: 0.875rem;
  }
  
  /* Loading State */
  .check-loading {
    text-align: center;
    padding: 3rem;
  }
  
  .check-loading-spinner {
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
  .check-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    white-space: nowrap;
    border-radius: 0.875rem;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.2s ease;
    outline: none;
    cursor: pointer;
    border: none;
    font-family: inherit;
    padding: 11px;
  }
  
  .check-btn:focus-visible {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }
  
  .check-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .check-btn-default {
    height: 2.5rem;
    padding: 0.5rem 1rem;
  }
  
  .check-btn-primary {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  }
  
  .check-btn-primary:hover:not(:disabled) {
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }
  
  .check-btn-outline {
    height: 2.5rem;
    padding: 0.5rem 1rem;
    border: 1px solid #e2e8f0;
    background: white;
    color: #374151;
  }
  
  .check-btn-outline:hover:not(:disabled) {
    background: #f8fafc;
    border-color: #cbd5e1;
  }
  
  .check-btn-ghost {
    background: transparent;
    color: #64748b;
  }
  
  .check-btn-ghost:hover:not(:disabled) {
    background: #f1f5f9;
    color: #0f172a;
  }
  
  .check-btn-icon {
    height: 2.5rem;
    width: 2.5rem;
    padding: 0;
  }
  
  .check-btn-danger {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    color: white;
  }
  
  .check-btn-danger:hover:not(:disabled) {
    background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
    transform: translateY(-1px);
  }
  
  .check-btn-success {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
  }
  
  .check-btn-success:hover:not(:disabled) {
    background: linear-gradient(135deg, #059669 0%, #047857 100%);
    transform: translateY(-1px);
  }
  
  /* Actions Cell */
  .check-actions-cell {
    display: flex;
    gap: 0.25rem;
  }
  
  .check-icon-btn {
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0.5rem;
    display: inline-flex;
    align-items: center;
    border-radius: 0.5rem;
    transition: all 0.2s ease;
    color: #64748b;
  }
  
  .check-icon-btn:hover {
    background: #f1f5f9;
    color: #0f172a;
  }
  
  /* Status Badge */
  .check-status-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.25rem 0.75rem;
    border-radius: 2rem;
    font-size: 0.75rem;
    font-weight: 500;
  }
  
  .check-status-approaching {
    background-color: #fef3c7;
    color: #d97706;
    border: 1px solid #fde68a;
  }
  
  .check-status-urgent {
    background-color: #fee2e2;
    color: #dc2626;
    border: 1px solid #fca5a5;
    animation: pulse 2s ease-in-out infinite;
  }
  
  .check-status-today {
    background-color: #fef2f2;
    color: #dc2626;
    border: 1px solid #fca5a5;
    font-weight: bold;
  }
  
  .check-status-normal {
    background-color: #f0fdf4;
    color: #10b981;
    border: 1px solid #86efac;
  }
  
  .check-status-pending {
    background-color: #fef3c7;
    color: #d97706;
    border: 1px solid #fde68a;
  }
  
  .check-status-remis {
    background-color: #dbeafe;
    color: #2563eb;
    border: 1px solid #bfdbfe;
  }
  
  .check-status-encaisse {
    background-color: #d1fae5;
    color: #059669;
    border: 1px solid #a7f3d0;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
  
  /* Pagination */
  .check-pagination-container {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem 1.5rem;
    border-top: 1px solid #e2e8f0;
    flex-wrap: wrap;
  }
  
  .check-pagination-btn {
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
  
  .check-pagination-btn:hover:not(:disabled) {
    background: #f8fafc;
    border-color: #cbd5e1;
  }
  
  .check-pagination-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .check-pagination-info {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    color: #64748b;
  }
  
  .check-pagination-active {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
    border-color: #3b82f6;
  }
  
  /* Badge */
  .check-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.625rem;
    border-radius: 2rem;
    font-size: 0.75rem;
    font-weight: 500;
    background-color: #fff7ed;
    color: #ea580c;
    border: 1px solid #fed7aa;
  }
  
  /* Modal/Dialog Styles */
  .check-overlay {
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
  
  .check-dialog {
    position: fixed;
    left: 50%;
    top: 50%;
    z-index: 51;
    display: grid;
    width: 100%;
    max-width: 52rem;
    max-height: 90vh;
    overflow-y: auto;
    transform: translate(-50%, -50%);
    gap: 1.5rem;
    border: 1px solid #e2e8f0;
    background: white;
    padding: 1.5rem;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    border-radius: 1rem;
    animation: slideIn 0.3s ease-out;
  }
  
  .check-dialog-danger {
    border-top: 4px solid #ef4444;
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
  
  .check-dialog-header {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .check-dialog-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: #0f172a;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .check-dialog-title-danger {
    color: #dc2626;
  }
  
  .check-dialog-description {
    font-size: 0.875rem;
    color: #64748b;
    margin-top: 0.25rem;
  }
  
  .check-dialog-body {
    display: grid;
    gap: 1rem;
  }
  
  .check-dialog-footer {
    display: flex;
    flex-direction: column-reverse;
    gap: 0.75rem;
  }
  
  @media (min-width: 640px) {
    .check-dialog-footer {
      flex-direction: row;
      justify-content: flex-end;
    }
  }
  
  .check-dialog-close {
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
  
  .check-dialog-close:hover {
    background: #f1f5f9;
    color: #0f172a;
  }
  
  /* Form Styles */
  .check-form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1rem;
  }
  
  .check-form-group {
    display: grid;
    gap: 0.5rem;
  }
  
  .check-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #0f172a;
  }
  
  .check-label-required::after {
    content: '*';
    color: #ef4444;
    margin-left: 0.25rem;
  }
  
  .check-input, .check-select {
    width: 100%;
    height: 2.5rem;
    padding: 0.5rem 0.75rem;
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    background: white;
    color: #0f172a;
    outline: none;
    transition: all 0.2s ease;
  }
  
  .check-input:focus, .check-select:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  .check-input:disabled, .check-select:disabled {
    background: #f8fafc;
    cursor: not-allowed;
  }
  
  /* File Upload Area */
  .check-upload-area {
    border: 2px dashed #cbd5e1;
    border-radius: 0.75rem;
    padding: 1.5rem;
    text-align: center;
    transition: all 0.2s ease;
    cursor: pointer;
    background: #f8fafc;
    margin: 1rem;
  }
  
  .check-upload-area:hover {
    border-color: #3b82f6;
    background: #eff6ff;
  }
  
  .check-upload-label {
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    color: #3b82f6;
    font-size: 0.875rem;
    font-weight: 500;
  }
  
  .check-file-list {
    max-height: 200px;
    overflow-y: auto;
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
    padding: 0.75rem;
    margin-top: 1rem;
  }
  
  .check-file-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem;
    background: #f8fafc;
    border-radius: 0.5rem;
    margin-bottom: 0.5rem;
    transition: all 0.2s ease;
  }
  
  .check-file-item:hover {
    background: #f1f5f9;
  }
  
  .check-file-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
  }
  
  .check-file-actions {
    display: flex;
    gap: 0.5rem;
  }
  
  /* Section */
  .check-section {
    border-top: 1px solid #e2e8f0;
    padding-top: 1.25rem;
    margin-top: 0.5rem;
  }
  
  .check-section-title {
    font-size: 1rem;
    font-weight: 600;
    color: #0f172a;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  /* Alert Cards */
  .check-alert-card {
    margin-bottom: 1.5rem;
    padding: 1rem;
    border-radius: 0.75rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
  }
  
  .check-alert-warning {
    background: #fef3c7;
    border-left: 4px solid #f59e0b;
  }
  
  .check-alert-danger {
    background: #fee2e2;
    border-left: 4px solid #ef4444;
  }
  
  .check-alert-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  
  .check-alert-title {
    font-weight: 700;
    color: #78350f;
  }
  
  .check-alert-title-danger {
    color: #991b1b;
  }
  
  .check-alert-text {
    font-size: 0.75rem;
    color: #b45309;
  }
  
  .check-alert-text-danger {
    color: #b91c1c;
  }
  
  /* Toast Styles */
  .check-toast-container {
    position: fixed;
    bottom: 1rem;
    right: 1rem;
    z-index: 100;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .check-toast {
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
  
  .check-toast-success {
    border-left-color: #10b981;
  }
  .check-toast-success svg { color: #10b981; }
  
  .check-toast-error {
    border-left-color: #ef4444;
  }
  .check-toast-error svg { color: #ef4444; }
  
  .check-toast-info {
    border-left-color: #3b82f6;
  }
  .check-toast-info svg { color: #3b82f6; }
  
  .check-toast-message {
    flex: 1;
    font-size: 0.875rem;
    color: #0f172a;
  }
  
  .check-toast-close {
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0.25rem;
    color: #94a3b8;
  }
  
  .check-info-message {
    background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
    border: 1px solid #93c5fd;
    border-radius: 0.75rem;
    padding: 0.75rem 1rem;
    color: #2563eb;
    font-size: 0.875rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .check-error-message {
    background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
    border: 1px solid #fca5a5;
    border-radius: 0.75rem;
    padding: 0.75rem 1rem;
    color: #dc2626;
    font-size: 0.875rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .check-warning-message {
    background: linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%);
    border: 1px solid #fde68a;
    border-radius: 0.75rem;
    padding: 0.75rem 1rem;
    color: #d97706;
    font-size: 0.875rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .check-delete-warning {
    background: #fffbeb;
    border: 1px solid #fde68a;
    border-radius: 0.75rem;
    padding: 1rem;
    margin: 0.5rem 0;
  }
  
  .check-delete-warning-title {
    font-weight: 600;
    color: #d97706;
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .check-delete-warning-text {
    font-size: 0.875rem;
    color: #92400e;
  }
  
  .text-destructive {
    color: #ef4444;
  }
  
  .deleting {
    animation: pulse 1s ease-in-out infinite;
    pointer-events: none;
    opacity: 0.6;
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
  
  /* Searchable Select Styles */
  .searchable-select {
    position: relative;
    width: 100%;
  }
  
  .searchable-select-trigger {
    width: 100%;
    min-height: 2.5rem;
    padding: 0.5rem 2rem 0.5rem 0.75rem;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
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
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
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
  
  /* Compression progress indicator */
  .compression-progress {
    position: fixed;
    bottom: 1rem;
    left: 50%;
    transform: translateX(-50%);
    background: #1e293b;
    color: white;
    padding: 0.75rem 1.5rem;
    border-radius: 2rem;
    font-size: 0.875rem;
    z-index: 1000;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  .compression-progress .spinner {
    width: 1.25rem;
    height: 1.25rem;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }
  
  /* Auto-link success message */
  .auto-link-success {
    background: #d1fae5;
    border: 1px solid #86efac;
    border-radius: 0.75rem;
    padding: 0.75rem 1rem;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: #065f46;
    font-size: 0.875rem;
  }
  
  /* Encaisse Dialog specific styles */
  .encaisse-dialog {
    max-width: 32rem;
  }
  
  .encaisse-warning {
    background: #fef3c7;
    border-left: 4px solid #f59e0b;
    border-radius: 0.75rem;
    padding: 0.75rem 1rem;
    margin: 1rem 0;
  }
  
  .reference-update-info {
    background: #eff6ff;
    border-radius: 0.5rem;
    padding: 0.5rem 0.75rem;
    font-size: 0.75rem;
    color: #1e40af;
    margin-top: 0.25rem;
  }
  
  /* Enhanced Delete Button */
  .check-btn-danger-enhanced {
    background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%);
    color: white;
    border: none;
    padding: 0.625rem 1.25rem;
    font-size: 0.875rem;
    font-weight: 600;
    border-radius: 0.75rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .check-btn-danger-enhanced:hover:not(:disabled) {
    background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(239, 68, 68, 0.3);
  }
  
  .check-btn-danger-enhanced:active:not(:disabled) {
    transform: translateY(0);
  }
  
  /* Delete button in table actions */
  .check-icon-btn.delete-action {
    color: #ef4444;
  }
  
  .check-icon-btn.delete-action:hover {
    background: #fef2f2;
    color: #dc2626;
  }
    /* Fix modal stacking order - ensure payment selection modal appears on top */
.check-dialog {
  z-index: 51;
}

.check-overlay {
  z-index: 50;
}

/* When a check dialog contains the payment selection title, give it higher z-index */
.check-dialog:has(.check-dialog-title .lucide-credit-card) {
  z-index: 201 !important;
}

.check-overlay:has(+ .check-dialog .lucide-credit-card) {
  z-index: 200 !important;
}

/* Also ensure the main modal doesn't block clicks */
.check-dialog:has(form) {
  z-index: 51;
}
`;

// Bank list with logo file names
const bankOptions = [
  { name: "Attijariwafa Bank", logo: "AttijariwafaBank.png" },
  { name: "Banque Centrale Populaire", logo: "bcp.png" },
  { name: "Bank of Africa", logo: "boa.png" },
  { name: "BMCI (Banque Marocaine pour le Commerce et l'Industrie)", logo: "BMCI.png" },
  { name: "CIH Bank", logo: "CIH.webp" },
  { name: "Crédit du Maroc", logo: "cdm.png" },
  { name: "Crédit Agricole du Maroc", logo: "cam.png" },
  { name: "CFG Bank", logo: "cfg.png" },
  { name: "Al Barid Bank", logo: "albarid.png" },
  { name: "Arab Bank PLC", logo: "arab.png" },
  { name: "Citibank Morocco", logo: "citi.png" },
  { name: "CaixaBank Morocco", logo: "caixa.png" },
  { name: "Saham Bank", logo: "saham.png" },
  { name: "Umnia Bank", logo: "umnia.svg" },
  { name: "Bank Assafa", logo: "assafa.png" },
  { name: "Bank Al Yousr", logo: "alyousr.png" },
  { name: "Bank Al-Tamweel wa Al-Inma", logo: "tamweel.svg" },
  { name: "Al Akhdar Bank", logo: "akhdar.png" }
];

const getBankLogo = (bankName) => {
  const bank = bankOptions.find(b => b.name === bankName);
  if (bank) {
    return `/${bank.logo}`;
  }
  return null;
};

// ==================== DATE HELPER FUNCTIONS ====================
const isDateApproachingWithin7Days = (dateString) => {
  if (!dateString) return false;
  const targetDate = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  targetDate.setHours(0, 0, 0, 0);
  const diffTime = targetDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= 7;
};

const getDaysUntilDate = (dateString) => {
  if (!dateString) return null;
  const targetDate = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  targetDate.setHours(0, 0, 0, 0);
  const diffTime = targetDate - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const getDateWarningStyle = (dateString) => {
  if (!dateString) return {};
  const daysUntil = getDaysUntilDate(dateString);
  if (daysUntil === 0) {
    return { backgroundColor: '#fef2f2', color: '#dc2626', fontWeight: 'bold' };
  } else if (daysUntil <= 3 && daysUntil > 0) {
    return { backgroundColor: '#fee2e2', color: '#dc2626' };
  } else if (daysUntil <= 7 && daysUntil > 3) {
    return { backgroundColor: '#fef3c7', color: '#d97706' };
  }
  return {};
};

const getStatusBadge = (dateString) => {
  if (!dateString) return 'normal';
  const daysUntil = getDaysUntilDate(dateString);
  if (daysUntil === 0) return 'today';
  if (daysUntil <= 3 && daysUntil > 0) return 'urgent';
  if (daysUntil <= 7 && daysUntil > 3) return 'approaching';
  return 'normal';
};

// ==================== TOAST COMPONENT ====================
const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(), 3000);
    return () => clearTimeout(timer);
  }, [onClose]);
  
  const Icon = type === 'success' ? CheckCircle : type === 'error' ? AlertTriangle : Info;
  
  return (
    <div className={`check-toast check-toast-${type}`}>
      <Icon size={20} />
      <span className="check-toast-message">{message}</span>
      <button className="check-toast-close" onClick={onClose}>
        <X size={16} />
      </button>
    </div>
  );
};

// ==================== STAT CARD COMPONENT ====================
const StatCard = ({ icon: Icon, label, value, color = 'primary' }) => (
  <div className={`check-summary-card check-summary-card-${color}`}>
    <div className={`check-summary-icon-wrapper check-summary-icon-${color}`}>
      <Icon size={24} />
    </div>
    <div className="check-summary-content">
      <div>
        <div className="check-summary-label">{label}</div>
        <div className="check-summary-value">{value}</div>
      </div>
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
    <div className="check-pagination-container">
      <button
        className="check-pagination-btn"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft size={16} />
        Précédent
      </button>
      
      {getPageNumbers().map((page, index) => (
        page === '...' ? (
          <span key={`ellipsis-${index}`} className="check-pagination-info">...</span>
        ) : (
          <button
            key={page}
            className={`check-pagination-btn ${currentPage === page ? 'check-pagination-active' : ''}`}
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        )
      ))}
      
      <button
        className="check-pagination-btn"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Suivant
        <ChevronRight size={16} />
      </button>
    </div>
  );
};

const renderClientOption = (option) => {
  const isActivation = option.source_type === 'activation';
  // Check both payment_type and also derive from source if needed
  let isRenewal = option.payment_type === 'renewal';
  
  // If payment_type is not set but this is an activation with source_reference, 
  // we need another way to determine if it's a renewal
  // For now, we'll rely on payment_type from backend
  
  const sourceLabel = isActivation ? 'Activation GPS' : 'Vente';
  const typeLabel = isRenewal ? '🔄 Renouvellement' : '✅ Activation';
  const typeColor = isRenewal ? '#3b82f6' : '#10b981';
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>
            {option.nom}
          </span>
          <span style={{ 
            fontSize: '0.65rem', 
            background: typeColor, 
            color: 'white', 
            padding: '2px 8px', 
            borderRadius: '12px',
            fontWeight: 'bold'
          }}>
            {typeLabel}
          </span>
        </div>
        <span style={{ 
          fontSize: '0.7rem', 
          background: '#e2e8f0', 
          padding: '2px 8px', 
          borderRadius: '12px', 
          color: '#475569',
          fontWeight: 'bold'
        }}>
          {sourceLabel} #{option.source_reference}
        </span>
      </div>
      
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 'bold' }}>
          💰 {formatCurrencyHelper(option.cheque_amount)}
        </span>
        {option.cheque_reference && (
          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
            📝 Chèque: {option.cheque_reference}
          </span>
        )}
        {option.bank_name && (
          <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>
            🏦 {option.bank_name}
          </span>
        )}
        <span style={{ fontSize: '0.7rem', color: '#3b82f6' }}>
          📅 {option.source_date}
        </span>
        <span style={{ fontSize: '0.7rem', color: '#8b5cf6' }}>
          💰 Total: {formatCurrencyHelper(option.source_total)}
        </span>
      </div>
      
      {option.activation_imei && (
        <div style={{ fontSize: '0.65rem', color: '#6b7280', fontFamily: 'monospace' }}>
          📱 IMEI: {option.activation_imei}
        </div>
      )}
      
      {option.payment_status === 'unpaid' && (
        <div style={{ fontSize: '0.65rem', color: '#dc2626' }}>
          ⚠️ Aucun paiement effectué
        </div>
      )}
      
      {option.cheque_status === 'remis' && (
        <div style={{ fontSize: '0.65rem', color: '#d97706' }}>
          📝 Déjà remis en banque
        </div>
      )}
    </div>
  );
};

// ==================== MAIN COMPONENT ====================
const Check = () => {
  const dispatch = useDispatch();
  const {
    list: checks,
    selected: selectedCheck,
    summary,
    filterOptions,
    loading,
    pagination
  } = useSelector((state) => state.checks);
  
  const { user } = useSelector((state) => state.auth);

  // Local state
  const [search, setSearch] = useState('');
  const [agencyFilter, setAgencyFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showFilesModal, setShowFilesModal] = useState(false);
  const [showFilePreview, setShowFilePreview] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(null);
  const [previewFileUrl, setPreviewFileUrl] = useState('');
  const [previewFileName, setPreviewFileName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filesToDelete, setFilesToDelete] = useState([]);
  const [selectedBank, setSelectedBank] = useState(bankOptions[2]);
  const [printCheck, setPrintCheck] = useState(null);
  const [printing, setPrinting] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  
  // State for pending cheque payments (both sales and activations)
  const [pendingPayments, setPendingPayments] = useState([]);
  const [selectedPendingPayment, setSelectedPendingPayment] = useState(null);
  const [showPendingPaymentsModal, setShowPendingPaymentsModal] = useState(false);
  const [autoLinkedPayment, setAutoLinkedPayment] = useState(null);
  const [showAutoLinkSuccess, setShowAutoLinkSuccess] = useState(false);
  
  // 🔧 NEW: Ref to track if modal was opened manually
  const modalOpenedManually = useRef(false);
  
  // ==================== ENCAISSE CONFIRMATION STATE ====================
  const [showEncaisseConfirm, setShowEncaisseConfirm] = useState(null);
  const [newReferenceInput, setNewReferenceInput] = useState('');
  const [encaisseProcessing, setEncaisseProcessing] = useState(false);
  
  // Clients with cheque payments (combined sales and activations)
  const [clientsWithChequePayments, setClientsWithChequePayments] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);
  
  // Company info for RIB
  const [companyInfo, setCompanyInfo] = useState(null);
  const [loadingCompanyInfo, setLoadingCompanyInfo] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  
  const [filters, setFilters] = useState({
    code_agence_remise: '',
    client_remettant: '',
    ville: '',
    date_debut: '',
    date_fin: '',
    type_remise: '',
    has_escompte: '',
    montant_min: '',
    montant_max: ''
  });
  
  const [formData, setFormData] = useState(() => {
    let ribValue = '';
    try {
      const saved = localStorage.getItem('company_info');
      if (saved) {
        const localInfo = JSON.parse(saved);
        ribValue = localInfo.rib || '';
      }
    } catch (e) {
      console.error('Error reading company info from localStorage:', e);
    }
    
    return {
      reference_remise: '',
      date_et_heure: new Date().toISOString().slice(0, 16),
      ville: '',
      code_agence_remise: '',
      nom_agence_remise: '',
      code_agence_compte: '',
      nom_agence_compte: '',
      rib_remettant: ribValue,
      client_remettant: '',
      nombre_de_valeurs: 1,
      montant_total_dh: '',
      type_remise: '',
      taux_escompte: 0,
      utilisateur: user?.name || '',
      status: 'pending',
      source_type: 'sale',
      sale_id: null,
      payment_id: null
    };
  });
  const [existingFiles, setExistingFiles] = useState([]);

  // Toast management
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

  // Load initial data
  useEffect(() => {
    dispatch(fetchChecks({ page: 1 }));
    dispatch(fetchCheckSummary());
    dispatch(fetchCheckFilterOptions());
    fetchClientsWithChequePayments();
    fetchCompanyInfo();
    return () => {
      dispatch(clearSelectedCheck());
      dispatch(clearCheckError());
    };
  }, [dispatch]);

  const [bankLogosBase64, setBankLogosBase64] = useState({});

  useEffect(() => {
    const loadBankLogos = async () => {
      const logos = {};
      for (const bank of bankOptions) {
        try {
          const response = await fetch(`/${bank.logo}`);
          if (response.ok) {
            const blob = await response.blob();
            const base64 = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.readAsDataURL(blob);
            });
            logos[bank.name] = base64;
          } else {
            console.warn(`Could not load logo for ${bank.name}`);
          }
        } catch (error) {
          console.error(`Error loading logo for ${bank.name}:`, error);
        }
      }
      setBankLogosBase64(logos);
    };
    
    loadBankLogos();
  }, []);

  const fetchClientsWithChequePayments = async () => {
  setLoadingClients(true);
  try {
    const token = localStorage.getItem('token');
    const API_URL = window.REACT_APP_API_URL || "https://amg-telecom-backd-production.up.railway.app/api";
    
    const response = await fetch(`${API_URL}/payments/cheque-clients-all`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      
      const formattedClients = (data.clients || []).map(client => ({
        id: client.id,
        nom: client.nom,
        email: client.email,
        telephone: client.telephone,
        ice_client: client.ice_client || '',
        adresse: client.adresse || '',
        source_type: client.source_type,
        source_reference: client.source_reference,
        source_date: client.source_date,
        source_total: client.source_total,
        source_status: client.source_status,
        payment_status: client.payment_status,
        cheque_amount: client.cheque_amount,
        cheque_reference: client.cheque_reference,
        cheque_status: client.cheque_status,
        payment_id: client.payment_id,
        remise_reference: client.remise_reference,
        activation_imei: client.activation_imei,
        payment_type: client.payment_type || 'activation', // ADD THIS LINE
        bank_name: client.bank_name, // ADD THIS LINE
        date: client.date, // ADD THIS LINE
        pending_payments: client.pending_payments || []
      }));
      
      // Log to debug
      console.log('Formatted clients with payment_type:', formattedClients.map(c => ({
        nom: c.nom,
        source_type: c.source_type,
        source_reference: c.source_reference,
        payment_type: c.payment_type,
        cheque_amount: c.cheque_amount
      })));
      
      setClientsWithChequePayments(formattedClients);
    } else {
      setClientsWithChequePayments([]);
    }
  } catch (error) {
    console.error('Error fetching cheque payments:', error);
    setClientsWithChequePayments([]);
  } finally {
    setLoadingClients(false);
  }
};

  // ==================== FETCH AND AUTO-LINK PENDING PAYMENTS ====================
  const fetchAndAutoLinkPendingPayments = async (clientName, clientData) => {
    if (!clientName) return [];

    try {
      // If we have clientData with pending_payments, use that
      if (clientData && clientData.pending_payments && clientData.pending_payments.length > 0) {
        const pending = clientData.pending_payments.map(payment => ({
          id: payment.id,
          amount: payment.amount,
          cheque_number: payment.reference || payment.cheque_number,
          bank_name: payment.bank_name,
          date: payment.date,
          source_type: clientData.source_type,
          source_reference: clientData.source_reference,
          source_total: clientData.source_total,
          source_status: clientData.source_status,
          payment_status: clientData.payment_status,
          payment_id: payment.id,
          client_name: clientData.nom,
          client_id: clientData.id
        }));

        setPendingPayments(pending);

        // AUTO-LINK: if exactly one payment
        if (pending.length === 1 && !editingId) {
          const autoPayment = pending[0];
          setSelectedPendingPayment(autoPayment);
          setAutoLinkedPayment(autoPayment);
          setShowAutoLinkSuccess(true);
          setTimeout(() => setShowAutoLinkSuccess(false), 5000);
          const sourceLabel = autoPayment.source_type === 'activation' ? 'Activation' : 'Vente';
          showToast(`✅ Paiement automatiquement lié - ${sourceLabel} #${autoPayment.source_reference} (${formatCurrencyHelper(autoPayment.amount)})`, 'success');
          setFormData(prev => ({
            ...prev,
            source_type: autoPayment.source_type,
            sale_id: autoPayment.source_reference,
            payment_id: autoPayment.payment_id
          }));
        }
        else if (pending.length > 1 && !editingId) {
          // 🔁 Open the selection modal and mark as manually opened
          modalOpenedManually.current = true;
          setShowPendingPaymentsModal(true);
        }
        return pending;
      }

      // Fallback: fetch from API
      const token = localStorage.getItem('token');
      const API_URL = window.REACT_APP_API_URL || "https://amg-telecom-backd-production.up.railway.app/api";
      const response = await fetch(`${API_URL}/payments/cheque-clients-all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) return [];

      const data = await response.json();
      const allClients = data.clients || [];
      const matchedClient = allClients.find(client =>
        client.nom === clientName ||
        client.nom?.toLowerCase().includes(clientName.toLowerCase())
      );

      if (matchedClient && matchedClient.pending_payments) {
        const pending = matchedClient.pending_payments.map(payment => ({
          id: payment.id,
          amount: payment.amount,
          cheque_number: payment.reference || payment.cheque_number,
          bank_name: payment.bank_name,
          date: payment.date,
          source_type: matchedClient.source_type,
          source_reference: matchedClient.source_reference,
          source_total: matchedClient.source_total,
          source_status: matchedClient.source_status,
          payment_status: matchedClient.payment_status,
          payment_id: payment.id,
          client_name: matchedClient.nom,
          client_id: matchedClient.id
        }));

        setPendingPayments(pending);

        if (pending.length === 1 && !editingId) {
          const autoPayment = pending[0];
          setSelectedPendingPayment(autoPayment);
          setAutoLinkedPayment(autoPayment);
          setShowAutoLinkSuccess(true);
          setTimeout(() => setShowAutoLinkSuccess(false), 5000);
          const sourceLabel = autoPayment.source_type === 'activation' ? 'Activation' : 'Vente';
          showToast(`✅ Paiement automatiquement lié - ${sourceLabel} #${autoPayment.source_reference} (${formatCurrencyHelper(autoPayment.amount)})`, 'success');
          setFormData(prev => ({
            ...prev,
            source_type: autoPayment.source_type,
            sale_id: autoPayment.source_reference,
            payment_id: autoPayment.payment_id
          }));
        }
        else if (pending.length > 1 && !editingId) {
          modalOpenedManually.current = true;
          setShowPendingPaymentsModal(true);
        }
        return pending;
      }

      return [];
    } catch (err) {
      console.error('Error fetching pending payments:', err);
      return [];
    }
  };

  // 🔧 Automatically open the selection modal when multiple pending payments are detected
  // but only if it hasn't been opened manually
  useEffect(() => {
    if (pendingPayments.length > 1 && !editingId && !showPendingPaymentsModal && !modalOpenedManually.current) {
      modalOpenedManually.current = true;
      setShowPendingPaymentsModal(true);
    }
  }, [pendingPayments, editingId]);

  // ==================== FETCH COMPANY INFO ====================
  const fetchCompanyInfo = async () => {
    setLoadingCompanyInfo(true);
    try {
      const token = localStorage.getItem('token');
      const API_URL = window.REACT_APP_API_URL || "https://amg-telecom-backd-production.up.railway.app/api";
      
      const response = await fetch(`${API_URL}/settings/company`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCompanyInfo(data.company_info);
        setFormData(prev => ({
          ...prev,
          rib_remettant: prev.rib_remettant || data.company_info?.rib || ''
        }));
      } else {
        const saved = localStorage.getItem('company_info');
        if (saved) {
          const localInfo = JSON.parse(saved);
          setCompanyInfo(localInfo);
          setFormData(prev => ({
            ...prev,
            rib_remettant: prev.rib_remettant || localInfo.rib || ''
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching company info:', error);
      const saved = localStorage.getItem('company_info');
      if (saved) {
        const localInfo = JSON.parse(saved);
        setCompanyInfo(localInfo);
        setFormData(prev => ({
          ...prev,
          rib_remettant: prev.rib_remettant || localInfo.rib || ''
        }));
      }
    } finally {
      setLoadingCompanyInfo(false);
    }
  };
  
  useEffect(() => {
    if (!editingId && companyInfo?.rib && !formData.rib_remettant) {
      setFormData(prev => ({ ...prev, rib_remettant: companyInfo.rib }));
    }
  }, [companyInfo, editingId, formData.rib_remettant]);
  
  useEffect(() => {
    setCurrentPage(1);
  }, [search, agencyFilter, typeFilter, statusFilter, filters]);

  useEffect(() => {
    const activeFilters = {};
    Object.keys(filters).forEach(key => {
      if (filters[key] && filters[key] !== '') {
        activeFilters[key] = filters[key];
      }
    });
    if (search) activeFilters.client_remettant = search;
    if (agencyFilter) activeFilters.code_agence_remise = agencyFilter;
    if (typeFilter) activeFilters.type_remise = typeFilter;
    
    dispatch(fetchChecks({ ...activeFilters, page: currentPage }));
    dispatch(fetchCheckSummary(activeFilters));
  }, [dispatch, filters, search, agencyFilter, typeFilter, currentPage]);

  // Alert calculations
  const approachingCount = checks.filter(c => 
    c.status !== 'encaisse' && 
    isDateApproachingWithin7Days(c.date_et_heure) && 
    getDaysUntilDate(c.date_et_heure) > 0
  ).length;
  
  const urgentCount = checks.filter(c => {
    if (c.status === 'encaisse') return false;
    const days = getDaysUntilDate(c.date_et_heure);
    return days > 0 && days <= 3;
  }).length;
  
  const todayCount = checks.filter(c => {
    if (c.status === 'encaisse') return false;
    return getDaysUntilDate(c.date_et_heure) === 0;
  }).length;

  const filteredByStatus = useMemo(() => {
    if (statusFilter === 'all') return checks;
    if (statusFilter === 'approaching') {
      return checks.filter(c => 
        c.status !== 'encaisse' && 
        isDateApproachingWithin7Days(c.date_et_heure) && 
        getDaysUntilDate(c.date_et_heure) > 3
      );
    }
    if (statusFilter === 'urgent') {
      return checks.filter(c => {
        if (c.status === 'encaisse') return false;
        const days = getDaysUntilDate(c.date_et_heure);
        return days > 0 && days <= 3;
      });
    }
    if (statusFilter === 'today') {
      return checks.filter(c => {
        if (c.status === 'encaisse') return false;
        return getDaysUntilDate(c.date_et_heure) === 0;
      });
    }
    if (statusFilter === 'pending') {
      return checks.filter(c => c.status === 'pending');
    }
    if (statusFilter === 'remis') {
      return checks.filter(c => c.status === 'remis');
    }
    if (statusFilter === 'encaisse') {
      return checks.filter(c => c.status === 'encaisse');
    }
    return checks;
  }, [checks, statusFilter]);

  const totalPages = Math.ceil(filteredByStatus.length / itemsPerPage);
  const paginatedChecks = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredByStatus.slice(start, start + itemsPerPage);
  }, [filteredByStatus, currentPage, itemsPerPage]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      code_agence_remise: '',
      client_remettant: '',
      ville: '',
      date_debut: '',
      date_fin: '',
      type_remise: '',
      has_escompte: '',
      montant_min: '',
      montant_max: ''
    });
    setSearch('');
    setAgencyFilter('');
    setTypeFilter('');
    setStatusFilter('all');
    setCurrentPage(1);
    setShowFilterModal(false);
    showToast('Filtres effacés', 'info');
  };

  const clearQuickFilters = () => {
    setSearch('');
    setAgencyFilter('');
    setTypeFilter('');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  const hasActiveFilters = search !== '' || agencyFilter !== '' || typeFilter !== '' || statusFilter !== 'all' || 
    Object.values(filters).some(v => v && v !== '');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleClientSelect = async (clientName, clientData) => {
  const sourceType = clientData?.source_type || 'sale';
  const paymentType = clientData?.payment_type || 'activation';
  
  console.log('Selected client payment_type:', paymentType, clientData);
  
  setFormData(prev => ({
    ...prev,
    client_remettant: clientName,
    ville: clientData?.ville || prev.ville,
    source_type: sourceType,
    sale_id: clientData?.source_reference || null,
    payment_id: clientData?.payment_id || null
  }));
  
  setSelectedPendingPayment(null);
  setAutoLinkedPayment(null);
  setShowAutoLinkSuccess(false);
  
  if (!editingId && clientName && clientData) {
    // If the client data already has payment info (single payment)
    if (clientData.payment_id && !clientData.pending_payments?.length) {
      const singlePayment = {
        id: clientData.payment_id,
        amount: clientData.cheque_amount,
        cheque_number: clientData.cheque_reference,
        bank_name: clientData.bank_name,
        date: clientData.source_date,
        source_type: clientData.source_type,
        source_reference: clientData.source_reference,
        source_total: clientData.source_total,
        source_status: clientData.source_status,
        payment_status: clientData.payment_status,
        payment_id: clientData.payment_id,
        client_name: clientData.nom,
        client_id: clientData.id,
        payment_type: clientData.payment_type || 'activation',
        cheque_status: clientData.cheque_status || 'pending'
      };
      
      setSelectedPendingPayment(singlePayment);
      setAutoLinkedPayment(singlePayment);
      setShowAutoLinkSuccess(true);
      setTimeout(() => setShowAutoLinkSuccess(false), 5000);
      const typeLabel = singlePayment.payment_type === 'renewal' ? 'Renouvellement' : 'Activation';
      showToast(`✅ ${typeLabel} automatiquement lié - ${formatCurrencyHelper(singlePayment.amount)}`, 'success');
      return;
    }
    
    // If we have pending_payments array
    if (clientData.pending_payments && clientData.pending_payments.length > 0) {
      const payments = clientData.pending_payments.map(payment => ({
        id: payment.id,
        amount: payment.amount,
        cheque_number: payment.reference || payment.cheque_number,
        bank_name: payment.bank_name,
        date: payment.date,
        source_type: clientData.source_type,
        source_reference: clientData.source_reference,
        source_total: clientData.source_total,
        source_status: clientData.source_status,
        payment_status: clientData.payment_status,
        payment_id: payment.id,
        client_name: clientData.nom,
        client_id: clientData.id,
        payment_type: payment.payment_type || 'activation',
        cheque_status: payment.remise_status || 'pending'
      }));
      
      setPendingPayments(payments);
      
      if (payments.length === 1) {
        const autoPayment = payments[0];
        setSelectedPendingPayment(autoPayment);
        setAutoLinkedPayment(autoPayment);
        setShowAutoLinkSuccess(true);
        setTimeout(() => setShowAutoLinkSuccess(false), 5000);
        const typeLabel = autoPayment.payment_type === 'renewal' ? 'Renouvellement' : 'Activation';
        showToast(`✅ ${typeLabel} automatiquement lié - ${formatCurrencyHelper(autoPayment.amount)}`, 'success');
        setFormData(prev => ({ 
          ...prev, 
          source_type: autoPayment.source_type,
          sale_id: autoPayment.source_reference,
          payment_id: autoPayment.payment_id
        }));
      } else if (payments.length > 1) {
        modalOpenedManually.current = true;
        setShowPendingPaymentsModal(true);
      }
    }
  }
};

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    
    const validFiles = files.filter(file => {
      const isValidType = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type);
      const isValidSize = file.size <= 10 * 1024 * 1024;
      if (!isValidType) showToast(`Format non supporté: ${file.name} (accepté: PDF, JPG, PNG, WebP)`, 'error');
      if (!isValidSize) showToast(`Fichier trop volumineux: ${file.name} (max 10MB)`, 'error');
      return isValidType && isValidSize;
    });
    
    if (validFiles.length === 0) return;
    
    setCompressing(true);
    
    try {
      const compressedFiles = [];
      for (const file of validFiles) {
        const compressedFile = await compressImage(file);
        compressedFiles.push(compressedFile);
      }
      setSelectedFiles(prev => [...prev, ...compressedFiles]);
      showToast(`✅ ${compressedFiles.length} fichier(s) compressé(s) et prêt(s)`, 'success');
    } catch (error) {
      console.error('Compression error:', error);
      setSelectedFiles(prev => [...prev, ...validFiles]);
      showToast(`⚠️ Compression impossible, fichiers ajoutés sans compression`, 'warning');
    } finally {
      setCompressing(false);
    }
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingFile = (fileName) => {
    setFilesToDelete(prev => [...prev, fileName]);
    setExistingFiles(prev => prev.filter(f => f !== fileName));
  };

  const handlePreviewFile = (fileName) => {
    const fileUrl = `${import.meta.env.VITE_API_URL || 'https://amg-telecom-backd-production.up.railway.app'}/api/files/${fileName}`;
    setPreviewFileUrl(fileUrl);
    setPreviewFileName(fileName);
    setShowFilePreview(true);
  };

  const generatePDF = async (check, bank) => {
    setPrinting(true);
    
    const printDiv = document.createElement('div');
    printDiv.style.position = 'absolute';
    printDiv.style.left = '-9999px';
    printDiv.style.top = '0';
    printDiv.style.width = '800px';
    printDiv.style.backgroundColor = 'white';
    printDiv.style.fontFamily = 'Arial, sans-serif';
    printDiv.style.padding = '15px';
    
    const bankLogoBase64 = bankLogosBase64[bank.name];
    
    let mainLogoBase64 = null;
    try {
      const mainLogoResponse = await fetch(logo);
      if (mainLogoResponse.ok) {
        const mainLogoBlob = await mainLogoResponse.blob();
        mainLogoBase64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(mainLogoBlob);
        });
      }
    } catch (error) {
      console.error('Error loading main logo:', error);
    }
    
    let bankHeaderHtml = '';
    if (bankLogoBase64) {
      bankHeaderHtml = `
        <div style="text-align: center; margin-bottom: 15px;">
          <img src="${bankLogoBase64}" alt="${bank.name} logo" style="height: 60px; width: auto; object-fit: contain; margin-bottom: 8px;" />
        </div>
      `;
    } else {
      bankHeaderHtml = `
        <div style="text-align: center; margin-bottom: 15px;">
          <div style="font-size: 14px; font-weight: bold; color: #1a3a5c;">${bank.name}</div>
        </div>
      `;
    }
    
    let filesHtml = '';
    
    if (check.files && check.files.length > 0) {
      const imageFiles = check.files.filter(file => file.match(/\.(jpg|jpeg|png|webp)$/i));
      const pdfFiles = check.files.filter(file => file.match(/\.pdf$/i));
      const otherFiles = check.files.filter(file => !file.match(/\.(jpg|jpeg|png|webp|pdf)$/i));
      
      filesHtml = `
        <div style="margin: 20px 0;">
          <div style="font-size: 12px; font-weight: bold; margin-bottom: 12px; color: #1a3a5c; border-bottom: 1px solid #ddd; padding-bottom: 5px;">
            📎 Documents attachés (${check.files.length} fichier(s))
          </div>
      `;
      
      if (imageFiles.length > 0) {
        filesHtml += `
          <div style="margin-bottom: 15px;">
            <div style="font-size: 11px; font-weight: bold; margin-bottom: 8px; color: #666;">Images (${imageFiles.length})</div>
            <div style="display: flex; flex-wrap: wrap; gap: 10px;">
        `;
        
        for (const imageFile of imageFiles) {
          const fileUrl = `${import.meta.env.VITE_API_URL || 'https://amg-telecom-backd-production.up.railway.app'}/api/files/${imageFile}`;
          filesHtml += `
            <div style="margin-bottom: 10px; border: 1px solid #e5e7eb; border-radius: 4px; overflow: hidden; max-width: 200px;">
              <img 
                src="${fileUrl}" 
                style="width: 100%; max-height: 150px; object-fit: cover;" 
                alt="${imageFile}"
                onerror="this.style.display='none'"
              />
              <div style="font-size: 9px; padding: 4px; text-align: center; background: #f9fafb; word-break: break-all;">${imageFile}</div>
            </div>
          `;
        }
        
        filesHtml += `
            </div>
          </div>
        `;
      }
      
      if (pdfFiles.length > 0) {
        filesHtml += `
          <div style="margin-bottom: 15px;">
            <div style="font-size: 11px; font-weight: bold; margin-bottom: 8px; color: #666;">Documents PDF (${pdfFiles.length})</div>
            <div style="border: 1px solid #e5e7eb; border-radius: 4px; padding: 8px;">
        `;
        
        for (const pdfFile of pdfFiles) {
          filesHtml += `
            <div style="padding: 6px 0; border-bottom: 1px solid #f3f4f6; display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 16px;">📄</span>
              <div style="flex: 1;">
                <div style="font-size: 10px; font-weight: 500; word-break: break-all;">${pdfFile}</div>
              </div>
            </div>
          `;
        }
        
        filesHtml += `
            </div>
          </div>
        `;
      }
      
      if (otherFiles.length > 0) {
        filesHtml += `
          <div style="margin-bottom: 15px;">
            <div style="font-size: 11px; font-weight: bold; margin-bottom: 8px; color: #666;">Autres fichiers (${otherFiles.length})</div>
            <div style="border: 1px solid #e5e7eb; border-radius: 4px; padding: 8px;">
        `;
        
        for (const otherFile of otherFiles) {
          filesHtml += `
            <div style="padding: 6px 0; border-bottom: 1px solid #f3f4f6; display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 16px;">📎</span>
              <div style="flex: 1;">
                <div style="font-size: 10px; word-break: break-all;">${otherFile}</div>
              </div>
            </div>
          `;
        }
        
        filesHtml += `
            </div>
          </div>
        `;
      }
      
      filesHtml += `</div>`;
    }
    
    const formatDateForPrint = (dateString) => {
      if (!dateString) return '-';
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };
    
    const formatTimeForPrint = (dateString) => {
      if (!dateString) return '-';
      const date = new Date(dateString);
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };
    
    const formatCurrency = (amount) => {
      if (amount === undefined || amount === null) return '0 MAD';
      const num = typeof amount === 'string' ? parseFloat(amount) : amount;
      if (isNaN(num)) return '0 MAD';
      return new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(num);
    };
    
    printDiv.innerHTML = `
      <div style="padding: 20px; max-width: 800px; margin: 0 auto; font-family: Arial, sans-serif; font-size: 11px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 2px solid #1a3a5c; padding-bottom: 10px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            ${mainLogoBase64 ? `<img src="${mainLogoBase64}" alt="GROUPE Logo" style="height: 120px; width: 120px;" />` : '<div style="height: 120px; width: 120px;"></div>'}
          </div>
          <div style="text-align: right;">
            ${bankHeaderHtml}
          </div>
        </div>

        <div style="text-align: right; margin-bottom: 12px;">
          <div style="font-size: 10px; color: #666;">BORDEREAU N°</div>
          <div style="font-size: 12px; font-weight: bold;">${check.reference_remise || 'N/A'}</div>
        </div>

        <div style="text-align: center; margin-bottom: 15px;">
          <div style="font-size: 16px; font-weight: bold; color: #1a3a5c;">BORDEREAU DE REMISE DE VALEUR</div>
          <div style="font-size: 11px; color: #666;">CHÈQUE(S)</div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 12px; border: 1px solid #e5e7eb; padding: 10px; background: #fafafa;">
          <div>
            <div style="font-size: 9px; color: #666; margin-bottom: 2px;">A (Ville)</div>
            <div style="font-size: 11px; font-weight: 500; padding: 3px 0; border-bottom: 1px solid #ddd;">${check.ville || 'Casablanca'}</div>
          </div>
          <div>
            <div style="font-size: 9px; color: #666; margin-bottom: 2px;">Le (Date et heure)</div>
            <div style="font-size: 11px; font-weight: 500; padding: 3px 0; border-bottom: 1px solid #ddd;">${formatDateForPrint(check.date_et_heure)} ${formatTimeForPrint(check.date_et_heure)}</div>
          </div>
          <div>
            <div style="font-size: 9px; color: #666; margin-bottom: 2px;">Code agence remise</div>
            <div style="font-size: 11px; font-weight: 500; padding: 3px 0; border-bottom: 1px solid #ddd;">${check.code_agence_remise || '78076'}</div>
          </div>
          <div>
            <div style="font-size: 9px; color: #666; margin-bottom: 2px;">Code agence compte</div>
            <div style="font-size: 11px; font-weight: 500; padding: 3px 0; border-bottom: 1px solid #ddd;">${check.code_agence_compte || '78076'}</div>
          </div>
          <div>
            <div style="font-size: 9px; color: #666; margin-bottom: 2px;">RIB Remettant</div>
            <div style="font-size: 10px; font-weight: 500; padding: 3px 0; border-bottom: 1px solid #ddd; word-break: break-all;">${check.rib_remettant || 'N/A'}</div>
          </div>
          <div>
            <div style="font-size: 9px; color: #666; margin-bottom: 2px;">Nb valeurs</div>
            <div style="font-size: 11px; font-weight: 500; padding: 3px 0; border-bottom: 1px solid #ddd;">${check.nombre_de_valeurs || 1}</div>
          </div>
          <div>
            <div style="font-size: 9px; color: #666; margin-bottom: 2px;">Type remise</div>
            <div style="font-size: 11px; font-weight: 500; padding: 3px 0; border-bottom: 1px solid #ddd;">${check.type_remise || 'ENCAISSEMENT'}</div>
          </div>
          <div>
            <div style="font-size: 9px; color: #666; margin-bottom: 2px;">Taux Escompte</div>
            <div style="font-size: 11px; font-weight: 500; padding: 3px 0; border-bottom: 1px solid #ddd;">${check.taux_escompte || 0} %</div>
          </div>
          <div>
            <div style="font-size: 9px; color: #666; margin-bottom: 2px;">Montant total</div>
            <div style="font-size: 11px; font-weight: bold; color: #16a34a; padding: 3px 0; border-bottom: 1px solid #ddd;">${formatCurrency(check.montant_total_dh)}</div>
          </div>
          <div style="grid-column: span 2;">
            <div style="font-size: 9px; color: #666; margin-bottom: 2px;">Nom agence remise</div>
            <div style="font-size: 11px; font-weight: 500; padding: 3px 0; border-bottom: 1px solid #ddd;">${check.nom_agence_remise || 'N/A'}</div>
          </div>
          <div>
            <div style="font-size: 9px; color: #666; margin-bottom: 2px;">Client Remettant</div>
            <div style="font-size: 11px; font-weight: bold; padding: 3px 0; border-bottom: 1px solid #ddd;">${check.client_remettant || 'N/A'}</div>
          </div>
          <div style="grid-column: span 2;">
            <div style="font-size: 9px; color: #666; margin-bottom: 2px;">Nom agence compte</div>
            <div style="font-size: 11px; font-weight: 500; padding: 3px 0; border-bottom: 1px solid #ddd;">${check.nom_agence_compte || 'N/A'}</div>
          </div>
          <div>
            <div style="font-size: 9px; color: #666; margin-bottom: 2px;">Utilisateur</div>
            <div style="font-size: 11px; font-weight: 500; padding: 3px 0; border-bottom: 1px solid #ddd;">${check.utilisateur || 'N/A'}</div>
          </div>
        </div>

        ${filesHtml}

        <div style="display: flex; justify-content: space-between; margin-top: 20px; padding-top: 12px; border-top: 1px dashed #ccc;">
          <div style="text-align: center; width: 45%;">
            <div style="font-size: 10px; color: #666; margin-bottom: 20px;">SIGNATURE CLIENT</div>
            <div style="border-top: 1px solid #000; width: 80%; margin: 0 auto;"></div>
          </div>
          <div style="text-align: center; width: 45%;">
            <div style="font-size: 10px; color: #666; margin-bottom: 20px;">SIGNATURE AGENCE</div>
            <div style="border-top: 1px solid #000; width: 80%; margin: 0 auto;"></div>
          </div>
        </div>

        <div style="margin-top: 15px; text-align: center; font-size: 8px; color: #999; border-top: 1px solid #eee; padding-top: 10px;">
          Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}
        </div>
      </div>
    `;
    
    document.body.appendChild(printDiv);
    
    try {
      const canvas = await html2canvas(printDiv, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        allowTaint: false
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let position = 0;
      const pageHeight = 297;

      if (imgHeight < pageHeight) {
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      } else {
        let heightLeft = imgHeight;
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
      }
      
      pdf.save(`bordereau_${check.reference_remise || 'remise'}.pdf`);
      showToast('PDF généré avec succès', 'success');
    } catch (error) {
      console.error('PDF generation error:', error);
      showToast('Erreur lors de la génération du PDF', 'error');
    } finally {
      document.body.removeChild(printDiv);
      setPrinting(false);
    }
  };
  
  const handlePrint = async (check) => {
    setPrintCheck(check);
    setShowPrintModal(true);
  };

  const confirmPrint = async () => {
    if (printCheck && selectedBank) {
      await generatePDF(printCheck, selectedBank);
      setShowPrintModal(false);
      setPrintCheck(null);
    }
  };

  // Mark cheque as remis
  const handleMarkAsRemis = async (check) => {
    if (updatingStatus) return;
    
    setUpdatingStatus(true);
    try {
      await dispatch(updateCheck({ 
        id: check.id, 
        mark_as_remis: true,
        status: 'remis'
      })).unwrap();
      
      showToast(`Chèque marqué comme remis (déposé en banque)`, 'success');
      
      dispatch(fetchChecks({ page: currentPage }));
      dispatch(fetchCheckSummary());
      
    } catch (err) {
      console.error('Error marking as remis:', err);
      showToast(err || 'Erreur lors de la mise à jour', 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // ==================== MARK CHEQUE AS ENCAISSE WITH REFERENCE UPDATE ====================
  const handleMarkAsEncaisse = (check) => {
    setShowEncaisseConfirm({ check, currentReference: check.reference_remise || '' });
    setNewReferenceInput(check.reference_remise || '');
  };

 const confirmEncaisse = async () => {
  if (!showEncaisseConfirm) return;
  
  const { check } = showEncaisseConfirm;
  const newReference = newReferenceInput.trim();
  
  if (encaisseProcessing) return;
  
  setEncaisseProcessing(true);
  
  try {
    const token = localStorage.getItem('token');
    const API_URL = window.REACT_APP_API_URL || "https://amg-telecom-backd-production.up.railway.app/api";
    
    // Log the request details for debugging
    console.log('Request URL:', `${API_URL}/checks/${check.id}/mark-encaisse`);
    console.log('Payload:', { 
      sale_id: check.sale_id, 
      payment_id: check.payment_id,
      new_reference: newReference !== check.reference_remise ? newReference : undefined
    });
    
    const payload = {
      sale_id: check.sale_id,
      payment_id: check.payment_id
    };
    
    if (newReference && newReference !== check.reference_remise) {
      payload.new_reference = newReference;
    }
    
    const response = await fetch(`${API_URL}/checks/${check.id}/mark-encaisse`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      let errorMessage;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorData.error || `Erreur ${response.status}`;
      } catch {
        errorMessage = errorText || `Erreur ${response.status}`;
      }
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    
    let message = `Chèque marqué comme encaissé - ${formatCurrencyHelper(check.montant_total_dh)} ajouté au montant payé`;
    if (newReference && newReference !== check.reference_remise) {
      message += `\nRéférence mise à jour: ${newReference}`;
    }
    
    showToast(message, 'success');
    
    setShowEncaisseConfirm(null);
    setNewReferenceInput('');
    
    // Build current filters to maintain the same view
    const activeFilters = {};
    Object.keys(filters).forEach(key => {
      if (filters[key] && filters[key] !== '') {
        activeFilters[key] = filters[key];
      }
    });
    if (search) activeFilters.client_remettant = search;
    if (agencyFilter) activeFilters.code_agence_remise = agencyFilter;
    if (typeFilter) activeFilters.type_remise = typeFilter;
    
    // Refresh the data with current page and filters
    await dispatch(fetchChecks({ ...activeFilters, page: currentPage }));
    await dispatch(fetchCheckSummary(activeFilters));
    
    // Also refresh clients list to update payment statuses
    await fetchClientsWithChequePayments();
    
  } catch (err) {
    console.error('Error marking as encaisse:', err);
    showToast(err.message || 'Erreur lors de la mise à jour', 'error');
  } finally {
    setEncaisseProcessing(false);
  }
};
// Add this function to reset the form after encaissement
const resetForNewRemise = () => {
  resetForm();
  // Clear any selected client or pending payment references
  setSelectedPendingPayment(null);
  setAutoLinkedPayment(null);
  setShowAutoLinkSuccess(false);
  setPendingPayments([]);
  modalOpenedManually.current = false;
};
  // ==================== HANDLE SUBMIT ====================
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.client_remettant) {
      showToast('Le client remettant est requis', 'error');
      return;
    }
    
    if (!formData.montant_total_dh || parseFloat(formData.montant_total_dh) <= 0) {
      showToast('Le montant total doit être supérieur à 0', 'error');
      return;
    }

    if (!editingId && pendingPayments.length > 0 && !selectedPendingPayment) {
      showToast('⚠️ Ce client a des paiements par chèque en attente. Veuillez sélectionner un paiement à lier.', 'warning');
      setShowPendingPaymentsModal(true);
      setUploading(false);
      return;
    }

    setUploading(true);
    try {
      let savedCheck;
      
      const submitData = { ...formData };
      submitData.montant_total_dh = parseFloat(submitData.montant_total_dh);
      
      if (selectedPendingPayment) {
        submitData.sale_id = selectedPendingPayment.source_reference;
        submitData.payment_id = selectedPendingPayment.payment_id;
        submitData.source_type = selectedPendingPayment.source_type;
      } else if (formData.sale_id && formData.payment_id) {
        submitData.sale_id = formData.sale_id;
        submitData.payment_id = formData.payment_id;
      }
      
      if (!submitData.source_type) {
        submitData.source_type = 'sale';
      }
      
      console.log('Submitting check with data:', {
        client_remettant: submitData.client_remettant,
        montant_total_dh: submitData.montant_total_dh,
        sale_id: submitData.sale_id,
        payment_id: submitData.payment_id,
        source_type: submitData.source_type
      });
      
      if (editingId) {
        const currentCheck = checks.find(c => c.id === editingId);
        const oldStatus = currentCheck?.status || 'pending';
        const newStatus = submitData.status;
        
        if (newStatus === 'encaisse' && oldStatus !== 'encaisse') {
          const hasSaleId = submitData.sale_id || currentCheck?.sale_id;
          const hasPaymentId = submitData.payment_id || currentCheck?.payment_id;
          
          if (!hasSaleId || !hasPaymentId) {
            showToast('Impossible de marquer comme encaissé: Cette remise n\'est liée à aucune vente ou activation.', 'error');
            setUploading(false);
            return;
          }
          
          submitData.mark_as_paid = true;
          submitData.status = 'encaisse';
        } else if (newStatus === 'remis' && oldStatus === 'pending') {
          const hasSaleId = submitData.sale_id || currentCheck?.sale_id;
          const hasPaymentId = submitData.payment_id || currentCheck?.payment_id;
          
          if (!hasSaleId || !hasPaymentId) {
            showToast('Impossible de marquer comme remis: Cette remise n\'est liée à aucune vente ou activation.', 'error');
            setUploading(false);
            return;
          }
          
          submitData.mark_as_remis = true;
          submitData.status = 'remis';
        }
        
        await dispatch(updateCheck({ id: editingId, ...submitData })).unwrap();
        
        for (const fileName of filesToDelete) {
          try {
            await dispatch(deleteCheckFile({ id: editingId, fileName })).unwrap();
          } catch (err) {
            console.error(`Failed to delete ${fileName}:`, err);
          }
        }
        
        if (selectedFiles.length > 0) {
          await dispatch(uploadCheckFiles({ id: editingId, files: selectedFiles })).unwrap();
        }
        
        showToast('Remise mise à jour avec succès', 'success');
      } else {
        submitData.status = 'pending';
        
        const result = await dispatch(createCheck(submitData)).unwrap();
        savedCheck = result;
        
        if (selectedFiles.length > 0 && savedCheck.id) {
          await dispatch(uploadCheckFiles({ id: savedCheck.id, files: selectedFiles })).unwrap();
        }
        
        if (selectedPendingPayment) {
          const sourceLabel = selectedPendingPayment.source_type === 'activation' ? 'Activation' : 'Vente';
          showToast(`✅ Paiement par chèque lié à la remise (${sourceLabel} #${selectedPendingPayment.source_reference})`, 'success');
          setSelectedPendingPayment(null);
          setAutoLinkedPayment(null);
          setShowAutoLinkSuccess(false);
        } else {
          showToast('Remise créée avec succès', 'success');
        }
      }
      
      setShowModal(false);
      resetForm();
      
      await dispatch(fetchChecks({ page: currentPage }));
      await dispatch(fetchCheckSummary());
      
    } catch (err) {
      console.error('Submit error:', err);
      showToast(err || 'Erreur lors de l\'enregistrement', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = async (id) => {
    try {
      const result = await dispatch(fetchCheckById(id)).unwrap();
      setFormData({
        reference_remise: result.reference_remise || '',
        date_et_heure: result.date_et_heure ? result.date_et_heure.slice(0, 16) : new Date().toISOString().slice(0, 16),
        ville: result.ville || '',
        code_agence_remise: result.code_agence_remise || '',
        nom_agence_remise: result.nom_agence_remise || '',
        code_agence_compte: result.code_agence_compte || '',
        nom_agence_compte: result.nom_agence_compte || '',
        rib_remettant: result.rib_remettant || companyInfo?.rib || '',
        client_remettant: result.client_remettant || '',
        nombre_de_valeurs: result.nombre_de_valeurs || 1,
        montant_total_dh: result.montant_total_dh || '',
        type_remise: result.type_remise || '',
        taux_escompte: result.taux_escompte || 0,
        utilisateur: result.utilisateur || user?.name || '',
        status: result.status || 'pending',
        source_type: result.source_type || 'sale'
      });
      setExistingFiles(result.files || []);
      setSelectedFiles([]);
      setFilesToDelete([]);
      setEditingId(id);
      setShowModal(true);
    } catch (err) {
      showToast('Erreur lors du chargement de la remise', 'error');
    }
  };

  const confirmDelete = (check) => {
    setShowDeleteDialog(check);
  };

  const handleDelete = async () => {
    if (!showDeleteDialog) return;
    
    setDeleting(true);
    try {
      await dispatch(deleteCheck(showDeleteDialog.id)).unwrap();
      showToast(`Remise supprimée avec succès`, 'success');
      setShowDeleteDialog(null);
      dispatch(fetchChecks({ page: currentPage }));
      dispatch(fetchCheckSummary());
    } catch (err) {
      showToast(err || 'Erreur lors de la suppression', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const resetForm = () => {
    let ribValue = '';
    try {
      const saved = localStorage.getItem('company_info');
      if (saved) {
        const localInfo = JSON.parse(saved);
        ribValue = localInfo.rib || '';
      }
    } catch (e) {
      console.error('Error reading company info from localStorage:', e);
    }
    
    setFormData({
      reference_remise: '',
      date_et_heure: new Date().toISOString().slice(0, 16),
      ville: '',
      code_agence_remise: '',
      nom_agence_remise: '',
      code_agence_compte: '',
      nom_agence_compte: '',
      rib_remettant: ribValue,
      client_remettant: '',
      nombre_de_valeurs: 1,
      montant_total_dh: '',
      type_remise: '',
      taux_escompte: 0,
      utilisateur: user?.name || '',
      status: 'pending',
      source_type: 'sale',
      sale_id: null,
      payment_id: null
    });
    setEditingId(null);
    setSelectedFiles([]);
    setExistingFiles([]);
    setFilesToDelete([]);
    setSelectedPendingPayment(null);
    setAutoLinkedPayment(null);
    setShowAutoLinkSuccess(false);
    setPendingPayments([]);
    // Reset manual modal flag
    modalOpenedManually.current = false;
  };

  const openFilesModal = async (check) => {
    await dispatch(fetchCheckById(check.id));
    setSelectedFiles([]);
    setShowFilesModal(true);
  };

  const handleFileUpload = async () => {
    if (!selectedCheck || selectedFiles.length === 0) return;
    
    setUploading(true);
    try {
      await dispatch(uploadCheckFiles({ id: selectedCheck.id, files: selectedFiles })).unwrap();
      showToast('Fichiers uploadés avec succès', 'success');
      setSelectedFiles([]);
      await dispatch(fetchCheckById(selectedCheck.id));
      dispatch(fetchChecks({ page: currentPage }));
    } catch (err) {
      showToast(err || 'Erreur lors de l\'upload', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (fileName) => {
    if (window.confirm(`Supprimer le fichier ${fileName} ?`)) {
      try {
        await dispatch(deleteCheckFile({ id: selectedCheck.id, fileName })).unwrap();
        showToast('Fichier supprimé avec succès', 'success');
        await dispatch(fetchCheckById(selectedCheck.id));
        dispatch(fetchChecks({ page: currentPage }));
      } catch (err) {
        showToast('Erreur lors de la suppression', 'error');
      }
    }
  };

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return '0 MAD';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '0 MAD';
    return new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(num);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadgeClass = (dateString, checkStatus) => {
    if (checkStatus === 'encaisse') return 'check-status-encaisse';
    
    const status = getStatusBadge(dateString);
    if (status === 'today') return 'check-status-today';
    if (status === 'urgent') return 'check-status-urgent';
    if (status === 'approaching') return 'check-status-approaching';
    return 'check-status-normal';
  };

  const getStatusLabel = (dateString, checkStatus) => {
    if (checkStatus === 'encaisse') return "✓ Encaissé";
    
    const status = getStatusBadge(dateString);
    if (status === 'today') return "🔥 Aujourd'hui!";
    if (status === 'urgent') return "⚠️ Urgent";
    if (status === 'approaching') return "📅 Proche";
    return "✓ Normal";
  };

  const getChequeStatusBadge = (status) => {
    const config = {
      pending: { label: 'En attente', variant: 'pending', icon: '⏳' },
      remis: { label: 'Remis en banque', variant: 'remis', icon: '📝' },
      encaisse: { label: 'Encaissé', variant: 'encaisse', icon: '✅' }
    };
    const c = config[status] || { label: status || 'N/A', variant: 'pending', icon: '❓' };
    return (
      <span className={`check-status-badge check-status-${c.variant}`}>
        <span style={{ marginRight: '4px' }}>{c.icon}</span> {c.label}
      </span>
    );
  };

  const exportColumns = [
    { header: 'Référence', accessor: c => c.reference_remise || '-' },
    { header: 'Date et heure', accessor: c => formatDate(c.date_et_heure) },
    { header: 'Client remettant', accessor: c => c.client_remettant || '-' },
    { header: 'Ville', accessor: c => c.ville || '-' },
    { header: 'Code agence remise', accessor: c => c.code_agence_remise || '-' },
    { header: 'Nom agence remise', accessor: c => c.nom_agence_remise || '-' },
    { header: 'Code agence compte', accessor: c => c.code_agence_compte || '-' },
    { header: 'Nom agence compte', accessor: c => c.nom_agence_compte || '-' },
    { header: 'RIB Remettant', accessor: c => c.rib_remettant || '-' },
    { header: 'Nombre de valeurs', accessor: c => c.nombre_de_valeurs || 0 },
    { header: 'Montant total (MAD)', accessor: c => parseFloat(c.montant_total_dh) || 0 },
    { header: 'Taux escompte (%)', accessor: c => c.taux_escompte || 0 },
    { header: 'Montant net (MAD)', accessor: c => (parseFloat(c.montant_total_dh) || 0) - ((parseFloat(c.montant_total_dh) || 0) * (c.taux_escompte || 0) / 100) },
    { header: 'Type remise', accessor: c => c.type_remise || '-' },
    { header: 'Statut chèque', accessor: c => c.status || 'pending' },
    { header: 'Source', accessor: c => c.source_type === 'activation' ? 'Activation GPS' : 'Vente' },
    { header: 'Nombre fichiers', accessor: c => c.files?.length || 0 },
  ];

  if (loading && checks.length === 0) {
    return (
      <div className="check-loading">
        <div className="check-loading-spinner" />
        <p style={{ marginTop: '1rem', color: '#64748b' }}>Chargement des remises...</p>
      </div>
    );
  }

  return (
    <div className="check-page-container">
      <style>{styles}</style>
      
      {compressing && (
        <div className="compression-progress">
          <div className="spinner"></div>
          <span>Compression des images en cours...</span>
        </div>
      )}
      
      {toasts.length > 0 && (
        <div className="check-toast-container">
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
      
      {/* Auto-Link Success Message */}
      {showAutoLinkSuccess && autoLinkedPayment && (
        <div className="auto-link-success">
          <CheckCircle size={20} />
          <div>
            <strong>✅ Paiement automatiquement lié!</strong><br />
            {autoLinkedPayment.source_type === 'activation' ? 'Activation' : 'Vente'} #{autoLinkedPayment.source_reference} - {formatCurrencyHelper(autoLinkedPayment.amount)}<br />
            <small>Le paiement sera automatiquement associé à cette remise.</small>
          </div>
        </div>
      )}
      
      {/* Pending Payments Modal */}
{showPendingPaymentsModal && pendingPayments.length > 1 && !editingId && (
  <>
    <div className="check-overlay" onClick={() => {
      setShowPendingPaymentsModal(false);
      setSelectedPendingPayment(null);
      modalOpenedManually.current = false;
    }} />
    <div className="check-dialog" style={{ maxWidth: '45rem' }}>
      <div className="check-dialog-header">
        <h2 className="check-dialog-title">
          <CreditCard size={20} />
          Sélectionnez un paiement par chèque
        </h2>
        <p className="check-dialog-description">
          Ce client a plusieurs paiements par chèque en attente.
          Veuillez sélectionner celui correspondant à cette remise.
        </p>
      </div>
      
      <div className="check-dialog-body">
        <div className="check-warning-message" style={{ marginBottom: '1rem' }}>
          <AlertTriangle size={16} />
          <div>Sélectionnez le paiement à lier à cette remise pour continuer.</div>
        </div>
        
        <div className="check-file-list" style={{ maxHeight: '400px' }}>
          {pendingPayments.map((payment, index) => {
            const isActivation = payment.source_type === 'activation';
            const isRenewal = payment.payment_type === 'renewal';
            const sourceLabel = isActivation ? 'Activation GPS' : 'Vente';
            const typeLabel = isRenewal ? '🔄 Renouvellement' : '✅ Activation';
            const typeColor = isRenewal ? '#3b82f6' : '#10b981';
            
            return (
              <div 
                key={index} 
                className={`check-file-item ${selectedPendingPayment?.payment_id === payment.payment_id ? 'payment-selected' : ''}`}
                style={{ 
                  cursor: 'pointer',
                  backgroundColor: selectedPendingPayment?.payment_id === payment.payment_id ? '#eff6ff' : '',
                  border: selectedPendingPayment?.payment_id === payment.payment_id ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                  borderRadius: '0.75rem',
                  marginBottom: '0.75rem',
                  padding: '1rem'
                }}
                onClick={() => setSelectedPendingPayment(payment)}
              >
                <div className="check-file-info" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ 
                        fontSize: '0.7rem', 
                        background: typeColor, 
                        color: 'white', 
                        padding: '0.25rem 0.75rem', 
                        borderRadius: '2rem',
                        fontWeight: 'bold'
                      }}>
                        {typeLabel}
                      </span>
                      <span style={{ 
                        fontSize: '0.7rem', 
                        background: isActivation ? '#f0fdf4' : '#eff6ff', 
                        padding: '0.25rem 0.75rem', 
                        borderRadius: '2rem',
                        fontWeight: '500'
                      }}>
                        {sourceLabel} #{payment.source_reference}
                      </span>
                    </div>
                    <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#059669' }}>
                      {formatCurrencyHelper(payment.amount)}
                    </span>
                  </div>
                  
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                    gap: '0.5rem', 
                    width: '100%',
                    fontSize: '0.75rem',
                    color: '#475569'
                  }}>
                    {payment.cheque_number && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span>📝 N° Chèque:</span>
                        <span style={{ fontWeight: '500', fontFamily: 'monospace' }}>{payment.cheque_number}</span>
                      </div>
                    )}
                    {payment.bank_name && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span>🏦 Banque:</span>
                        <span style={{ fontWeight: '500' }}>{payment.bank_name}</span>
                      </div>
                    )}
                    {payment.date && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span>📅 Date paiement:</span>
                        <span style={{ fontWeight: '500' }}>{new Date(payment.date).toLocaleDateString('fr-FR')}</span>
                      </div>
                    )}
                  </div>
                  
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
                    gap: '0.5rem', 
                    width: '100%',
                    fontSize: '0.7rem',
                    color: '#6b7280',
                    borderTop: '1px solid #e5e7eb',
                    paddingTop: '0.5rem',
                    marginTop: '0.25rem'
                  }}>
                    <div>
                      <span>💰 Total {isActivation ? 'activation' : 'vente'}:</span>
                      <span style={{ fontWeight: '500', marginLeft: '0.5rem', color: '#1e293b' }}>
                        {formatCurrencyHelper(payment.source_total)}
                      </span>
                    </div>
                    <div>
                      <span>📊 Statut paiement:</span>
                      <span style={{ 
                        marginLeft: '0.5rem',
                        padding: '0.125rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.65rem',
                        background: payment.payment_status === 'paid' ? '#d1fae5' : payment.payment_status === 'partial' ? '#fef3c7' : '#fee2e2',
                        color: payment.payment_status === 'paid' ? '#065f46' : payment.payment_status === 'partial' ? '#92400e' : '#991b1b'
                      }}>
                        {payment.payment_status === 'paid' ? 'Payé' : payment.payment_status === 'partial' ? 'Partiel' : 'Impayé'}
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ marginTop: '0.25rem' }}>
                    <span style={{ 
                      fontSize: '0.65rem', 
                      background: payment.cheque_status === 'remis' ? '#dbeafe' : '#fef3c7',
                      color: payment.cheque_status === 'remis' ? '#1e40af' : '#92400e',
                      padding: '0.125rem 0.5rem',
                      borderRadius: '0.25rem',
                      display: 'inline-block'
                    }}>
                      {payment.cheque_status === 'remis' ? '📝 Déjà remis en banque' : '⏳ En attente de remise'}
                    </span>
                  </div>
                </div>
                
                {selectedPendingPayment?.payment_id === payment.payment_id && (
                  <div style={{ marginLeft: '0.5rem' }}>
                    <CheckIcon size={20} style={{ color: '#3b82f6' }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="check-dialog-footer">
        <button 
          className="check-btn check-btn-outline"
          onClick={() => {
            setShowPendingPaymentsModal(false);
            setSelectedPendingPayment(null);
            modalOpenedManually.current = false;
          }}
        >
          Annuler
        </button>
        <button 
          className="check-btn check-btn-primary"
          onClick={() => {
            if (selectedPendingPayment) {
              setShowPendingPaymentsModal(false);
              const sourceLabel = selectedPendingPayment.source_type === 'activation' ? 'Activation' : 'Vente';
              const typeLabel = selectedPendingPayment.payment_type === 'renewal' ? 'Renouvellement' : 'Activation';
              showToast(`✅ Paiement sélectionné (${sourceLabel} #${selectedPendingPayment.source_reference} - ${typeLabel}) - ${formatCurrencyHelper(selectedPendingPayment.amount)}`, 'success');
              setFormData(prev => ({ 
                ...prev, 
                source_type: selectedPendingPayment.source_type,
                sale_id: selectedPendingPayment.source_reference,
                payment_id: selectedPendingPayment.payment_id
              }));
              modalOpenedManually.current = false;
            } else {
              showToast('Veuillez sélectionner un paiement', 'warning');
            }
          }}
          disabled={!selectedPendingPayment}
        >
          Confirmer la sélection
        </button>
      </div>
      
      <button 
        className="check-dialog-close" 
        onClick={() => {
          setShowPendingPaymentsModal(false);
          setSelectedPendingPayment(null);
          modalOpenedManually.current = false;
        }}
      >
        <X size={18} />
        <span className="sr-only">Fermer</span>
      </button>
    </div>
  </>
)}
      
      {/* Header */}
      <div className="check-page-header">
        <div className="check-title-section">
          <h1 className="check-title">Remises de Chèques</h1>
          <div className="check-subtitle">
            <span>Gérez vos bordereaux de remise de valeurs (Ventes & Activations)</span>
            <span className="check-subtitle-badge">
              <FileText size={12} style={{ display: 'inline', marginRight: '0.25rem' }} />
              {summary?.total_checks || 0} remises
            </span>
          </div>
        </div>
        <div className="check-actions">
          <button onClick={() => setShowFilterModal(true)} className="check-btn check-btn-outline">
            <Filter size={16} /> Filtres
          </button>
          <ExportMenu 
            title="Liste des remises de chèques" 
            rows={filteredByStatus} 
            columns={exportColumns}
            dateField="date_et_heure"
          />
          <button onClick={() => { resetForm(); setShowModal(true); }} className="check-btn check-btn-primary">
            <Plus size={16} /> Nouvelle Remise
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="check-summary-container">
        <StatCard icon={FileText} label="Total Remises" value={summary?.total_checks || 0} color="primary" />
        <StatCard icon={DollarSign} label="Montant Total" value={formatCurrency(summary?.total_amount || 0)} color="success" />
        <StatCard icon={Wallet} label="Escompte Total" value={formatCurrency(summary?.total_discount || 0)} color="warning" />
        <StatCard icon={Landmark} label="Montant Net" value={formatCurrency(summary?.net_amount || 0)} color="info" />
      </div>

      {/* Alert Cards */}
      {todayCount > 0 && (
        <div className="check-alert-card check-alert-danger">
          <div className="check-alert-content">
            <AlertCircle size={24} style={{ color: '#dc2626' }} />
            <div>
              <div className="check-alert-title check-alert-title-danger">🔥 {todayCount} remise(s) prévue(s) pour aujourd'hui!</div>
              <div className="check-alert-text check-alert-text-danger">Ces remises doivent être traitées immédiatement</div>
            </div>
          </div>
          <button className="check-btn check-btn-outline" style={{ backgroundColor: 'white', borderColor: '#fca5a5', color: '#dc2626' }} onClick={() => setStatusFilter('today')}>
            Voir les détails
          </button>
        </div>
      )}

      {urgentCount > 0 && todayCount === 0 && (
        <div className="check-alert-card check-alert-warning">
          <div className="check-alert-content">
            <AlertTriangle size={24} style={{ color: '#d97706' }} />
            <div>
              <div className="check-alert-title">⚠️ {urgentCount} remise(s) dans les 3 prochains jours</div>
              <div className="check-alert-text">Ces remises approchent de leur date limite</div>
            </div>
          </div>
          <button className="check-btn check-btn-outline" style={{ backgroundColor: 'white', borderColor: '#fde68a', color: '#d97706' }} onClick={() => setStatusFilter('urgent')}>
            Voir les détails
          </button>
        </div>
      )}

      {approachingCount > 0 && urgentCount === 0 && todayCount === 0 && (
        <div className="check-alert-card" style={{ background: '#fef3c7', borderLeft: '4px solid #eab308' }}>
          <div className="check-alert-content">
            <Bell size={24} style={{ color: '#ca8a04' }} />
            <div>
              <div className="check-alert-title" style={{ color: '#854d0e' }}>📅 {approachingCount} remise(s) dans les 7 prochains jours</div>
              <div className="check-alert-text" style={{ color: '#a16207' }}>Pensez à préparer ces remises</div>
            </div>
          </div>
          <button className="check-btn check-btn-outline" style={{ backgroundColor: 'white', borderColor: '#fde68a', color: '#854d0e' }} onClick={() => setStatusFilter('approaching')}>
            Voir les détails
          </button>
        </div>
      )}

      {/* Main Card */}
      <div className="check-card">
        <div className="check-filter-bar">
          <div className="check-filter-group">
            <div className="check-search-wrapper">
              <Search className="check-search-icon" />
              <input className="check-search-input" placeholder="Rechercher par client, référence, ville..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="check-filter-select">
              <Calendar className="check-filter-icon" />
              <select className="check-select-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">Tous les statuts</option>
                <option value="today">Aujourd'hui</option>
                <option value="urgent">Urgent (≤3 jours)</option>
                <option value="approaching">Proche (≤7 jours)</option>
                <option value="pending">En attente</option>
                <option value="remis">Remis en banque</option>
                <option value="encaisse">Encaissé</option>
              </select>
            </div>
          </div>
          {hasActiveFilters && (
            <button className="check-clear-filters" onClick={clearQuickFilters}>
              <X size={14} /> Effacer les filtres
            </button>
          )}
        </div>
        
        <div className="check-table-container">
          <table className="check-table">
            <thead>
              <tr>
                <th>Référence</th>
                <th>Date / Échéance</th>
                <th>Client</th>
                <th>Agence</th>
                <th>Ville</th>
                <th className="check-text-right">Montant</th>
                <th className="check-text-right">Escompte</th>
                <th className="check-text-right">Net</th>
                <th>Type</th>
                <th>Source</th>
                <th>Statut Remise</th>
                <th>Statut Chèque</th>
                <th>Fichiers</th>
                <th style={{ width: '140px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedChecks.length === 0 ? (
                <tr><td colSpan="14" className="check-empty"><div className="check-empty-icon"><FileText size={64} /></div><div className="check-empty-text">Aucune remise trouvée</div></td></tr>
              ) : (
                paginatedChecks.map((check) => {
                  const isApproaching = check.status !== 'encaisse' && isDateApproachingWithin7Days(check.date_et_heure);
                  const daysUntil = getDaysUntilDate(check.date_et_heure);
                  const dateWarningStyle = isApproaching ? getDateWarningStyle(check.date_et_heure) : {};
                  const statusClass = getStatusBadgeClass(check.date_et_heure, check.status);
                  const isLinked = check.sale_id && check.payment_id;
                  const sourceLabel = check.source_type === 'activation' ? '📡 Activation' : '🛒 Vente';
                  
                  return (
                    <tr key={check.id} style={isApproaching ? { ...dateWarningStyle, transition: 'all 0.2s ease' } : {}}>
                      <td className="check-font-medium">{check.reference_remise || '-'}</td>
                      <td style={isApproaching ? { fontWeight: 'bold' } : {}}>
                        {formatDate(check.date_et_heure)}
                        {isApproaching && daysUntil >= 0 && (
                          <div style={{ fontSize: '0.7rem', marginTop: '0.25rem', color: daysUntil === 0 ? '#dc2626' : daysUntil <= 3 ? '#ea580c' : '#ca8a04', fontWeight: 'bold' }}>
                            {daysUntil === 0 ? "🔥 Aujourd'hui!" : daysUntil === 1 ? "🔴 Demain!" : daysUntil <= 3 ? `⚠️ Dans ${daysUntil} jours` : `📅 Dans ${daysUntil} jours`}
                          </div>
                        )}
                      </td>
                      <td className="check-font-medium">{check.client_remettant || '-'}</td>
                      <td>{check.nom_agence_remise || check.code_agence_remise || '-'}</td>
                      <td>{check.ville || '-'}</td>
                      <td className="check-text-right check-font-semibold">{formatCurrency(check.montant_total_dh)}</td>
                      <td className="check-text-right">{check.taux_escompte > 0 ? <span className="check-badge">{check.taux_escompte}%</span> : '-'}</td>
                      <td className="check-text-right" style={{ fontWeight: '600', color: '#059669' }}>
                        {formatCurrency(check.montant_total_dh - (check.montant_total_dh * (check.taux_escompte || 0) / 100))}
                      </td>
                      <td>{check.type_remise || '-'}</td>
                      <td>
                        <span style={{ fontSize: '0.7rem', background: check.source_type === 'activation' ? '#f0fdf4' : '#eff6ff', padding: '2px 8px', borderRadius: '12px' }}>
                          {sourceLabel} #{check.sale_id}
                        </span>
                      </td>
                      <td>
                        {check.status === 'encaisse' ? (
                          <span className="check-status-badge check-status-encaisse">
                            <CheckCircle size={12} /> Encaissé
                          </span>
                        ) : isApproaching && daysUntil >= 0 ? (
                          <span className={`check-status-badge ${statusClass}`}>
                            {daysUntil === 0 ? <AlertCircle size={12} /> : daysUntil <= 3 ? <AlertTriangle size={12} /> : <Bell size={12} />}
                            {getStatusLabel(check.date_et_heure, check.status)}
                          </span>
                        ) : (
                          <span className="check-status-badge check-status-normal"><CheckCircle size={12} /> Normal</span>
                        )}
                      </td>
                      <td>
                        {getChequeStatusBadge(check.status)}
                        {!isLinked && check.status !== 'encaisse' && (
                          <div style={{ fontSize: '0.6rem', color: '#dc2626', marginTop: '4px' }}>Non lié</div>
                        )}
                      </td>
                      <td>
                        <button className="check-icon-btn" onClick={() => openFilesModal(check)} title="Gérer les fichiers">
                          <FileText size={16} />
                          <span style={{ marginLeft: '4px' }}>{check.files?.length || 0}</span>
                        </button>
                      </td>
                      <td>
                        <div className="check-actions-cell">
                          <button className="check-icon-btn" onClick={() => handlePrint(check)} title="Imprimer PDF" style={{ color: '#8b5cf6' }}>
                            <Printer size={16} />
                          </button>
                          {check.status === 'pending' && isLinked && (
                            <button className="check-icon-btn" onClick={() => handleMarkAsRemis(check)} title="Marquer comme remis" style={{ color: '#f59e0b' }} disabled={updatingStatus}>
                              <Banknote size={16} />
                            </button>
                          )}
                          {(check.status === 'pending' || check.status === 'remis') && isLinked && (
                            <button className="check-icon-btn" onClick={() => handleMarkAsEncaisse(check)} title="Marquer comme encaissé" style={{ color: '#10b981' }} disabled={updatingStatus}>
                              <CheckIcon size={16} />
                            </button>
                          )}
                          <button className="check-icon-btn" onClick={() => handleEdit(check.id)} title="Modifier"><Edit size={16} /></button>
                          <button className="check-icon-btn" onClick={() => confirmDelete(check)} title="Supprimer"><Trash2 size={16} className="text-destructive" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <>
          <div className="check-overlay" onClick={() => { setShowModal(false); resetForm(); }} />
          <div className="check-dialog">
            <div className="check-dialog-header">
              <h2 className="check-dialog-title">{editingId ? <Edit size={20} /> : <Plus size={20} />} {editingId ? 'Modifier la remise' : 'Nouvelle remise'}</h2>
              <p className="check-dialog-description">{editingId ? 'Modifiez les informations de la remise ci-dessous' : 'Remplissez les informations pour créer une nouvelle remise'}</p>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="check-dialog-body">
                <div className="check-form-grid">
                  <div className="check-form-group">
                    <label className="check-label">Référence</label>
                    <input type="text" name="reference_remise" value={formData.reference_remise} onChange={handleInputChange} className="check-input" placeholder={editingId ? "Modifier la référence" : "Auto-généré si vide"} />
                    {!editingId && <small style={{ fontSize: '0.7rem', color: '#64748b' }}>Laissez vide pour génération automatique</small>}
                  </div>
                  <div className="check-form-group">
                    <label className="check-label check-label-required">Date et Heure</label>
                    <input type="datetime-local" name="date_et_heure" value={formData.date_et_heure} onChange={handleInputChange} className="check-input" required />
                  </div>
                  
                  <div className="check-form-group">
                    <label className="check-label check-label-required">Client Remettant</label>
                    <SearchableSelect
                      options={clientsWithChequePayments}
                      value={formData.client_remettant}
                      onChange={(clientName, clientData) => handleClientSelect(clientName, clientData)}
                      placeholder="Rechercher un client (Ventes ou Activations)..."
                      disabled={editingId !== null}
                      renderOption={renderClientOption}
                    />
                    {autoLinkedPayment && !editingId && (
                      <div style={{ fontSize: '0.7rem', color: '#10b981', marginTop: '0.25rem' }}>
                        ✅ Paiement automatiquement lié: {autoLinkedPayment.source_type === 'activation' ? 'Activation' : 'Vente'} #{autoLinkedPayment.source_reference} - {formatCurrencyHelper(autoLinkedPayment.amount)}
                      </div>
                    )}
                    {pendingPayments.length > 1 && !editingId && (
                      <div style={{ fontSize: '0.7rem', color: '#f59e0b', marginTop: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>⚠️ {pendingPayments.length} paiements trouvés - Veuillez en sélectionner un</span>
                        <button
                          type="button"
                          className="check-btn check-btn-outline"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
                          onClick={() => {
                            modalOpenedManually.current = true;
                            setShowPendingPaymentsModal(true);
                          }}
                        >
                          Sélectionner
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="check-form-group"><label className="check-label">Ville</label><input type="text" name="ville" value={formData.ville} onChange={handleInputChange} className="check-input" /></div>
                  <div className="check-form-group"><label className="check-label">Code Agence Remise</label><input type="text" name="code_agence_remise" value={formData.code_agence_remise} onChange={handleInputChange} className="check-input" /></div>
                  <div className="check-form-group"><label className="check-label">Nom Agence Remise</label><input type="text" name="nom_agence_remise" value={formData.nom_agence_remise} onChange={handleInputChange} className="check-input" /></div>
                  <div className="check-form-group"><label className="check-label">Code Agence Compte</label><input type="text" name="code_agence_compte" value={formData.code_agence_compte} onChange={handleInputChange} className="check-input" /></div>
                  <div className="check-form-group"><label className="check-label">Nom Agence Compte</label><input type="text" name="nom_agence_compte" value={formData.nom_agence_compte} onChange={handleInputChange} className="check-input" /></div>
                  <div className="check-form-group"><label className="check-label">RIB Remettant</label><input type="text" name="rib_remettant" value={formData.rib_remettant} onChange={handleInputChange} className="check-input" readOnly style={{ backgroundColor: '#f8fafc' }} /></div>
                  <div className="check-form-group"><label className="check-label">Nombre de Valeurs</label><input type="number" name="nombre_de_valeurs" value={formData.nombre_de_valeurs} onChange={handleInputChange} className="check-input" min="1" /></div>
                  <div className="check-form-group"><label className="check-label check-label-required">Montant Total (MAD)</label><input type="number" step="0.01" name="montant_total_dh" value={formData.montant_total_dh} onChange={handleInputChange} className="check-input" required /></div>
                  <div className="check-form-group"><label className="check-label">Type Remise</label><input type="text" name="type_remise" value={formData.type_remise} onChange={handleInputChange} className="check-input" placeholder="Ex: Normal, Urgent" /></div>
                  <div className="check-form-group"><label className="check-label">Taux Escompte (%)</label><input type="number" step="0.01" name="taux_escompte" value={formData.taux_escompte} onChange={handleInputChange} className="check-input" min="0" max="100" /></div>
                  
                  {editingId && (
                    <>
                      <div className="check-form-group">
                        <label className="check-label">Statut Chèque</label>
                        <select name="status" value={formData.status} onChange={handleInputChange} className="check-input">
                          <option value="pending">⏳ En attente</option>
                          <option value="remis">📝 Remis en banque</option>
                          <option value="encaisse">✅ Encaissé</option>
                        </select>
                      </div>
                      <div className="check-form-group">
                        <label className="check-label">Source Type</label>
                        <select name="source_type" value={formData.source_type} onChange={handleInputChange} className="check-input">
                          <option value="sale">Vente</option>
                          <option value="activation">Activation GPS</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>

                <div className="check-section">
                  <div className="check-section-title"><FileText size={18} /> Fichiers attachés</div>
                  
                  {editingId && existingFiles.length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                      <label className="check-label">Fichiers existants</label>
                      <div className="check-file-list">
                        {existingFiles.map((file, index) => (
                          <div key={index} className="check-file-item">
                            <div className="check-file-info">
                              {file.match(/\.(jpg|jpeg|png|webp)$/i) ? <ImageIcon size={18} style={{ color: '#3b82f6' }} /> : <File size={18} style={{ color: '#64748b' }} />}
                              <span style={{ fontSize: '0.8125rem', wordBreak: 'break-all' }}>{file}</span>
                            </div>
                            <div className="check-file-actions">
                              <button type="button" className="check-icon-btn" onClick={() => handlePreviewFile(file)}><Eye size={16} /></button>
                              <button type="button" className="check-icon-btn" onClick={() => removeExistingFile(file)}><Trash2 size={16} style={{ color: '#ef4444' }} /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="check-upload-area">
                      <input type="file" multiple onChange={handleFileSelect} style={{ display: 'none' }} id="file-upload-form" accept=".pdf,.jpg,.jpeg,.png,.webp" disabled={compressing} />
                      <label htmlFor="file-upload-form" className="check-upload-label"><Upload size={18} /> {compressing ? 'Compression en cours...' : 'Sélectionner des fichiers'}</label>
                      <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>PDF, JPG, PNG, WebP (max 10MB - Images compressées automatiquement)</p>
                    </div>
                    
                    {selectedFiles.length > 0 && (
                      <div style={{ marginTop: '1rem' }}>
                        <label className="check-label">Fichiers sélectionnés ({selectedFiles.length})</label>
                        <div className="check-file-list">
                          {selectedFiles.map((file, index) => (
                            <div key={index} className="check-file-item">
                              <div className="check-file-info">
                                {file.type.startsWith('image/') ? <ImageIcon size={18} style={{ color: '#3b82f6' }} /> : <File size={18} style={{ color: '#64748b' }} />}
                                <span style={{ fontSize: '0.8125rem' }}>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                              </div>
                              <button type="button" className="check-icon-btn" onClick={() => removeSelectedFile(index)}><X size={14} style={{ color: '#ef4444' }} /></button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="check-dialog-footer">
                <button type="button" className="check-btn check-btn-outline" onClick={() => { setShowModal(false); resetForm(); }}>Annuler</button>
                <button type="submit" className="check-btn check-btn-primary" disabled={uploading || compressing}>
                  {(uploading || compressing) && <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite', marginRight: '0.5rem' }} />}
                  {editingId ? 'Mettre à jour' : 'Créer la remise'}
                </button>
              </div>
            </form>
            
            <button className="check-dialog-close" onClick={() => { setShowModal(false); resetForm(); }}><X size={18} /></button>
          </div>
        </>
      )}

      {/* ==================== ENCAISSE CONFIRMATION DIALOG ==================== */}
      {showEncaisseConfirm && (
        <>
          <div className="check-overlay" onClick={() => { setShowEncaisseConfirm(null); setNewReferenceInput(''); }} />
          <div className="check-dialog encaisse-dialog">
            <div className="check-dialog-header">
              <h2 className="check-dialog-title">
                <CheckIcon size={20} style={{ color: '#10b981' }} />
                Confirmer l'encaissement
              </h2>
              <p className="check-dialog-description">
                Veuillez confirmer l'encaissement de ce chèque.
                Vous pouvez également modifier la référence si nécessaire.
              </p>
            </div>
            
            <div className="check-dialog-body">
              <div className="encaisse-warning">
                <AlertTriangle size={16} style={{ color: '#d97706' }} />
                <div style={{ marginLeft: '8px' }}>
                  <strong>Attention:</strong> Cette action est irréversible et ajoutera le montant du chèque au montant payé.
                </div>
              </div>
              
              <div className="check-info-message" style={{ marginBottom: '0.5rem' }}>
                <Info size={16} />
                <div style={{ flex: 1 }}>
                  <strong>Détails de la remise :</strong><br />
                  <strong>Référence actuelle:</strong> {showEncaisseConfirm.check.reference_remise || 'N/A'}<br />
                  <strong>Client:</strong> {showEncaisseConfirm.check.client_remettant || 'N/A'}<br />
                  <strong>Montant:</strong> {formatCurrency(showEncaisseConfirm.check.montant_total_dh)}<br />
                  <strong>Source:</strong> {showEncaisseConfirm.check.source_type === 'activation' ? 'Activation GPS' : 'Vente'} #{showEncaisseConfirm.check.sale_id}
                </div>
              </div>
              
              <div className="check-form-group">
                <label className="check-label">
                  Nouvelle référence (optionnel)
                </label>
                <input
                  type="text"
                  className="check-input"
                  value={newReferenceInput}
                  onChange={(e) => setNewReferenceInput(e.target.value)}
                  placeholder="Entrez une nouvelle référence ou laissez vide pour conserver l'actuelle"
                />
                <div className="reference-update-info">
                  <Info size={12} style={{ marginRight: '4px' }} />
                  Si vous modifiez la référence, elle sera mise à jour dans le système.
                </div>
              </div>
            </div>
            
            <div className="check-dialog-footer">
              <button 
                className="check-btn check-btn-outline" 
                onClick={() => { setShowEncaisseConfirm(null); setNewReferenceInput(''); }}
                disabled={encaisseProcessing}
              >
                Annuler
              </button>
              <button 
                className="check-btn check-btn-success" 
                onClick={confirmEncaisse}
                disabled={encaisseProcessing}
              >
                {encaisseProcessing ? (
                  <>
                    <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite', marginRight: '0.5rem' }} />
                    Traitement...
                  </>
                ) : (
                  <>
                    <CheckIcon size={16} />
                    Confirmer l'encaissement
                  </>
                )}
              </button>
            </div>
            
            <button 
              className="check-dialog-close" 
              onClick={() => { setShowEncaisseConfirm(null); setNewReferenceInput(''); }}
              disabled={encaisseProcessing}
            >
              <X size={18} />
              <span className="sr-only">Fermer</span>
            </button>
          </div>
        </>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {showDeleteDialog && (
        <>
          <div className="check-overlay" onClick={() => !deleting && setShowDeleteDialog(null)} />
          <div className="check-dialog check-dialog-danger">
            <div className="check-dialog-header">
              <h2 className="check-dialog-title check-dialog-title-danger">
                <AlertTriangle size={24} />
                Confirmer la suppression
              </h2>
              <p className="check-dialog-description">
                Êtes-vous sûr de vouloir supprimer cette remise ? Cette action est irréversible.
              </p>
            </div>
            
            <div className="check-delete-warning">
              <div className="check-delete-warning-title">
                <AlertTriangle size={18} />
                Remise à supprimer :
              </div>
              <div className="check-delete-warning-text">
                <strong>{showDeleteDialog.reference_remise || 'Sans référence'}</strong>
                {showDeleteDialog.client_remettant && <div>👤 {showDeleteDialog.client_remettant}</div>}
                {showDeleteDialog.montant_total_dh && <div>💰 {formatCurrency(showDeleteDialog.montant_total_dh)}</div>}
                {showDeleteDialog.date_et_heure && <div>📅 {formatDate(showDeleteDialog.date_et_heure)}</div>}
                {showDeleteDialog.source_type && <div>📋 Source: {showDeleteDialog.source_type === 'activation' ? 'Activation GPS' : 'Vente'}</div>}
              </div>
            </div>
            
            {showDeleteDialog.files && showDeleteDialog.files.length > 0 && (
              <div className="check-error-message">
                <AlertTriangle size={16} />
                Attention : Cette remise a {showDeleteDialog.files.length} fichier(s) attaché(s). 
                La suppression de la remise supprimera également tous les fichiers associés.
              </div>
            )}
            
            <div className="check-dialog-footer">
              <button 
                className="check-btn check-btn-outline" 
                onClick={() => setShowDeleteDialog(null)}
                disabled={deleting}
              >
                Annuler
              </button>
              <button 
                className="check-btn check-btn-danger-enhanced" 
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <div className="check-loading-spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                    Suppression...
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
              className="check-dialog-close" 
              onClick={() => !deleting && setShowDeleteDialog(null)}
              disabled={deleting}
            >
              <X size={18} />
              <span className="sr-only">Fermer</span>
            </button>
          </div>
        </>
      )}

      {/* Print Modal with Bank Selection */}
      {showPrintModal && printCheck && (
        <>
          <div className="check-overlay" onClick={() => { setShowPrintModal(false); setPrintCheck(null); }} />
          <div className="check-dialog" style={{ maxWidth: '32rem' }}>
            <div className="check-dialog-header">
              <h2 className="check-dialog-title">
                <Printer size={20} />
                Imprimer le bordereau
              </h2>
              <p className="check-dialog-description">
                Sélectionnez la banque pour générer le PDF avec son logo
              </p>
            </div>
            
            <div className="check-dialog-body">
              <div className="check-form-group">
                <label className="check-label check-label-required">Banque</label>
                <select
                  value={selectedBank.name}
                  onChange={(e) => {
                    const bank = bankOptions.find(b => b.name === e.target.value);
                    if (bank) setSelectedBank(bank);
                  }}
                  className="check-input"
                  style={{ width: '100%' }}
                  required
                >
                  {bankOptions.map((bank) => (
                    <option key={bank.name} value={bank.name}>{bank.name}</option>
                  ))}
                </select>
              </div>
              
              <div style={{ textAlign: 'center', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '0.75rem', background: '#f8fafc' }}>
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '8px' }}>Aperçu :</p>
                {getBankLogo(selectedBank.name) && (
                  <img 
                    src={getBankLogo(selectedBank.name)} 
                    alt={selectedBank.name} 
                    style={{ height: '50px', width: 'auto', objectFit: 'contain', marginBottom: '8px' }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                )}
                <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1a3a5c' }}>{selectedBank.name}</div>
              </div>
              
              <div className="check-info-message">
                <Info size={16} />
                <div style={{ flex: 1 }}>
                  <strong>Récapitulatif :</strong><br />
                  Référence: {printCheck.reference_remise || 'N/A'}<br />
                  Client: {printCheck.client_remettant || 'N/A'}<br />
                  Montant: {formatCurrency(printCheck.montant_total_dh)}
                </div>
              </div>
            </div>
            
            <div className="check-dialog-footer">
              <button className="check-btn check-btn-outline" onClick={() => { setShowPrintModal(false); setPrintCheck(null); }}>
                Annuler
              </button>
              <button className="check-btn check-btn-primary" onClick={confirmPrint} disabled={printing}>
                {printing && <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite', marginRight: '0.5rem' }} />}
                Générer PDF
              </button>
            </div>
            
            <button className="check-dialog-close" onClick={() => { setShowPrintModal(false); setPrintCheck(null); }}>
              <X size={18} />
              <span className="sr-only">Fermer</span>
            </button>
          </div>
        </>
      )}

      {/* Files Modal */}
      {showFilesModal && selectedCheck && (
        <>
          <div className="check-overlay" onClick={() => { setShowFilesModal(false); setSelectedFiles([]); }} />
          <div className="check-dialog" style={{ maxWidth: '32rem' }}>
            <div className="check-dialog-header">
              <h2 className="check-dialog-title">
                <FileText size={20} />
                Fichiers - {selectedCheck.reference_remise || selectedCheck.client_remettant}
              </h2>
              <p className="check-dialog-description">
                Gérez les fichiers attachés à cette remise
              </p>
            </div>
            
            <div className="check-dialog-body">
              <div className="check-upload-area">
                <input 
                  type="file" 
                  multiple 
                  onChange={handleFileSelect} 
                  style={{ display: 'none' }} 
                  id="file-upload-modal" 
                  accept=".pdf,.jpg,.jpeg,.png,.webp" 
                  disabled={compressing}
                />
                <label htmlFor="file-upload-modal" className="check-upload-label">
                  <Upload size={18} />
                  {compressing ? 'Compression en cours...' : 'Sélectionner des fichiers'}
                </label>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                  PDF, JPG, PNG, WebP (max 10MB - Images compressées automatiquement)
                </p>
                
                {selectedFiles.length > 0 && (
                  <div style={{ marginTop: '1rem', textAlign: 'left' }}>
                    <p style={{ fontSize: '0.8125rem', marginBottom: '0.5rem' }}>
                      {selectedFiles.length} fichier(s) sélectionné(s) et compressé(s)
                    </p>
                    <button className="check-btn check-btn-success" onClick={handleFileUpload} disabled={uploading || compressing} style={{ fontSize: '0.75rem' }}>
                      {uploading ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <FileUp size={14} />}
                      <span style={{ marginLeft: '0.5rem' }}>Uploader</span>
                    </button>
                  </div>
                )}
              </div>

              {selectedCheck.files && selectedCheck.files.length > 0 ? (
                <div style={{ marginTop: '1rem' }}>
                  <label className="check-label">Fichiers existants ({selectedCheck.files.length})</label>
                  <div className="check-file-list">
                    {selectedCheck.files.map((file, index) => (
                      <div key={index} className="check-file-item">
                        <div className="check-file-info">
                          {file.match(/\.(jpg|jpeg|png|webp)$/i) ? 
                            <ImageIcon size={18} style={{ color: '#3b82f6' }} /> : 
                            <File size={18} style={{ color: '#64748b' }} />
                          }
                          <span style={{ fontSize: '0.8125rem', wordBreak: 'break-all' }}>{file}</span>
                        </div>
                        <div className="check-file-actions">
                          <button className="check-icon-btn" onClick={() => handlePreviewFile(file)} title="Aperçu">
                            <Eye size={16} />
                          </button>
                          <button className="check-icon-btn" onClick={() => handleDeleteFile(file)} title="Supprimer">
                            <Trash2 size={16} style={{ color: '#ef4444' }} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="check-empty" style={{ padding: '2rem 0' }}>
                  Aucun fichier attaché
                </div>
              )}
            </div>
            
            <div className="check-dialog-footer">
              <button className="check-btn check-btn-outline" onClick={() => { setShowFilesModal(false); setSelectedFiles([]); }}>
                Fermer
              </button>
            </div>
            
            <button className="check-dialog-close" onClick={() => { setShowFilesModal(false); setSelectedFiles([]); }}>
              <X size={18} />
              <span className="sr-only">Fermer</span>
            </button>
          </div>
        </>
      )}

      {/* File Preview Modal */}
      {showFilePreview && (
        <>
          <div className="check-overlay" onClick={() => setShowFilePreview(false)} />
          <div className="check-dialog" style={{ maxWidth: '90%', maxHeight: '90vh' }}>
            <div className="check-dialog-header">
              <h2 className="check-dialog-title" style={{ fontSize: '1rem' }}>
                <Eye size={18} />
                {previewFileName}
              </h2>
            </div>
            
            <div className="check-dialog-body" style={{ textAlign: 'center' }}>
              {previewFileName.match(/\.(jpg|jpeg|png|webp)$/i) ? (
                <img 
                  src={previewFileUrl} 
                  alt={previewFileName} 
                  style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }} 
                />
              ) : (
                <iframe 
                  src={previewFileUrl} 
                  title={previewFileName} 
                  style={{ width: '100%', height: '70vh', border: 'none' }} 
                />
              )}
            </div>
            
            <div className="check-dialog-footer">
              <button className="check-btn check-btn-outline" onClick={() => setShowFilePreview(false)}>
                Fermer
              </button>
            </div>
            
            <button className="check-dialog-close" onClick={() => setShowFilePreview(false)}>
              <X size={18} />
              <span className="sr-only">Fermer</span>
            </button>
          </div>
        </>
      )}

      {/* Filter Modal */}
      {showFilterModal && (
        <>
          <div className="check-overlay" onClick={() => setShowFilterModal(false)} />
          <div className="check-dialog" style={{ maxWidth: '40rem' }}>
            <div className="check-dialog-header">
              <h2 className="check-dialog-title">
                <Filter size={20} />
                Filtres avancés
              </h2>
              <p className="check-dialog-description">
                Affinez votre recherche avec des critères supplémentaires
              </p>
            </div>
            
            <div className="check-dialog-body">
              <div className="check-form-grid">
                <div className="check-form-group">
                  <label className="check-label">Agence Remise</label>
                  <select 
                    value={filters.code_agence_remise} 
                    onChange={(e) => handleFilterChange('code_agence_remise', e.target.value)} 
                    className="check-input"
                    style={{ width: '100%' }}
                  >
                    <option value="">Toutes</option>
                    {filterOptions?.codes_agence?.map(ag => (
                      <option key={ag} value={ag}>{ag}</option>
                    ))}
                  </select>
                </div>
                <div className="check-form-group">
                  <label className="check-label">Client</label>
                  <input 
                    type="text" 
                    value={filters.client_remettant} 
                    onChange={(e) => handleFilterChange('client_remettant', e.target.value)} 
                    className="check-input" 
                    placeholder="Rechercher..." 
                  />
                </div>
                <div className="check-form-group">
                  <label className="check-label">Ville</label>
                  <select 
                    value={filters.ville} 
                    onChange={(e) => handleFilterChange('ville', e.target.value)} 
                    className="check-input"
                    style={{ width: '100%' }}
                  >
                    <option value="">Toutes</option>
                    {filterOptions?.villes?.map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
                <div className="check-form-group">
                  <label className="check-label">Type Remise</label>
                  <input 
                    type="text" 
                    value={filters.type_remise} 
                    onChange={(e) => handleFilterChange('type_remise', e.target.value)} 
                    className="check-input" 
                    placeholder="Rechercher..." 
                  />
                </div>
                <div className="check-form-group">
                  <label className="check-label">Date début</label>
                  <input 
                    type="date" 
                    value={filters.date_debut} 
                    onChange={(e) => handleFilterChange('date_debut', e.target.value)} 
                    className="check-input" 
                  />
                </div>
                <div className="check-form-group">
                  <label className="check-label">Date fin</label>
                  <input 
                    type="date" 
                    value={filters.date_fin} 
                    onChange={(e) => handleFilterChange('date_fin', e.target.value)} 
                    className="check-input" 
                  />
                </div>
                <div className="check-form-group">
                  <label className="check-label">Escompte</label>
                  <select 
                    value={filters.has_escompte} 
                    onChange={(e) => handleFilterChange('has_escompte', e.target.value)} 
                    className="check-input"
                    style={{ width: '100%' }}
                  >
                    <option value="">Tous</option>
                    <option value="true">Avec escompte</option>
                    <option value="false">Sans escompte</option>
                  </select>
                </div>
                <div className="check-form-group">
                  <label className="check-label">Montant min (MAD)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={filters.montant_min} 
                    onChange={(e) => handleFilterChange('montant_min', e.target.value)} 
                    className="check-input" 
                  />
                </div>
                <div className="check-form-group">
                  <label className="check-label">Montant max (MAD)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={filters.montant_max} 
                    onChange={(e) => handleFilterChange('montant_max', e.target.value)} 
                    className="check-input" 
                  />
                </div>
              </div>
            </div>
            
            <div className="check-dialog-footer">
              <button className="check-btn check-btn-outline" onClick={clearFilters}>
                Effacer tout
              </button>
              <button className="check-btn check-btn-primary" onClick={() => setShowFilterModal(false)}>
                Appliquer les filtres
              </button>
            </div>
            
            <button className="check-dialog-close" onClick={() => setShowFilterModal(false)}>
              <X size={18} />
              <span className="sr-only">Fermer</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Check;