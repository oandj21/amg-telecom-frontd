// TechnicianReport.jsx
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Plus, Trash2, Save, Printer, X, RefreshCw,
  Loader, AlertTriangle, CheckCircle, Info, FolderOpen,
  Eye, Download, Calendar, User, Hash, LogOut, Smartphone,
  Search, Filter, Database, Cloud, ExternalLink, Zap, Edit
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { logout, fetchClients } from './Store/store';

// ==================== API CONFIGURATION ====================
const API_URL = window.REACT_APP_API_URL || "https://amg-telecom-backd-production.up.railway.app/api";

// ==================== STYLES (No horizontal scroll on mobile) ====================
const styles = `
  .tech-report-container {
    min-height: 100vh;
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    padding: 12px;
  }
  @media (min-width: 640px) {
    .tech-report-container {
      padding: 20px 24px;
    }
  }

  .tech-report-header {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 24px;
    padding: 16px;
    margin-bottom: 20px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.3);
  }
  @media (min-width: 640px) {
    .tech-report-header {
      padding: 20px 24px;
      margin-bottom: 24px;
    }
  }

  .tech-report-title {
    font-size: 1.25rem;
    font-weight: 800;
    background: linear-gradient(135deg, #1e3a8a, #3b82f6);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    margin-bottom: 4px;
  }
  @media (min-width: 640px) {
    .tech-report-title {
      font-size: 1.75rem;
    }
  }

  .tech-report-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: linear-gradient(135deg, #dbeafe, #eff6ff);
    padding: 4px 12px;
    border-radius: 40px;
    font-size: 0.7rem;
    font-weight: 600;
    color: #1e40af;
  }
  @media (min-width: 640px) {
    .tech-report-badge {
      padding: 6px 16px;
      font-size: 0.75rem;
    }
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 8px 14px;
    border-radius: 40px;
    font-size: 0.7rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
    font-family: inherit;
    white-space: nowrap;
  }
  @media (min-width: 640px) {
    .btn {
      padding: 10px 20px;
      font-size: 0.7rem;
    }
  }

  .btn-primary {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
  }
  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(37, 99, 235, 0.4);
  }
  .btn-outline {
    background: white;
    border: 1px solid #e2e8f0;
    color: #475569;
  }
  .btn-outline:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
  }
  .btn-danger {
    background: linear-gradient(135deg, #ef4444, #dc2626);
    color: white;
  }
  .btn-danger:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
  }
  .btn-success {
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
  }
  .btn-secondary {
    background: linear-gradient(135deg, #8b5cf6, #7c3aed);
    color: white;
  }

  /* Table container - no horizontal scroll forced */
  .report-table-container {
    background: white;
    border-radius: 20px;
    overflow-x: auto;
    overflow-y: visible;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    border: 1px solid #eef2f6;
    margin-bottom: 24px;
    -webkit-overflow-scrolling: touch;
  }
  /* Table itself: no fixed min-width, full width, allow wrapping */
  .report-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: auto;
  }
  .report-table th,
  .report-table td {
    padding: 8px 6px;
    border-bottom: 1px solid #f1f5f9;
    font-size: 0.7rem;
    vertical-align: middle;
    word-break: break-word;
  }
  @media (min-width: 640px) {
    .report-table th,
    .report-table td {
      padding: 12px 16px;
      font-size: 0.813rem;
    }
  }
  .report-table th {
    background: #f8fafc;
    text-align: left;
    font-weight: 700;
    color: #1e293b;
    border-bottom: 1px solid #e2e8f0;
  }

  /* Inputs inside cells take full width */
  .report-input {
    width: 100%;
    padding: 6px 8px;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    font-size: 0.6rem;
    transition: all 0.2s;
    background: white;
    box-sizing: border-box;
  }
  @media (min-width: 640px) {
    .report-input {
      padding: 10px 12px;
      font-size: 0.813rem;
    }
  }
  .report-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  /* Quantity input narrower */
  .quantity-input {
    width: 70px;
    text-align: center;
  }
  @media (min-width: 640px) {
    .quantity-input {
      width: 100px;
    }
  }

  /* Client input flexible */
  .client-name-input {
    min-width: 120px;
  }
  @media (max-width: 480px) {
    .client-name-input {
      min-width: 100px;
    }
  }

  /* Action buttons */
  .action-btn {
    background: transparent;
    border: none;
    padding: 6px;
    border-radius: 8px;
    cursor: pointer;
    color: #64748b;
    transition: all 0.2s;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .action-btn:hover {
    background: #f1f5f9;
  }
  .action-btn.download:hover { color: #10b981; }
  .action-btn.delete:hover { color: #ef4444; }
  .action-btn.view:hover { color: #3b82f6; }
  .action-btn.edit:hover { color: #8b5cf6; }

  /* Summary card */
  .summary-card {
    background: white;
    border-radius: 20px;
    padding: 16px;
    margin-bottom: 24px;
    border: 1px solid #eef2f6;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
  }
  @media (min-width: 640px) {
    .summary-card {
      padding: 20px;
    }
  }

  .total-quantity {
    background: linear-gradient(135deg, #dbeafe, #eff6ff);
    padding: 6px 12px;
    border-radius: 60px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  @media (min-width: 640px) {
    .total-quantity {
      padding: 12px 24px;
      gap: 12px;
    }
  }
  .total-quantity span:first-child {
    font-size: 0.65rem;
    color: #475569;
  }
  @media (min-width: 640px) {
    .total-quantity span:first-child {
      font-size: 0.75rem;
    }
  }
  .total-quantity span:last-child {
    font-size: 1rem;
    font-weight: 800;
    color: #2563eb;
  }
  @media (min-width: 640px) {
    .total-quantity span:last-child {
      font-size: 1.5rem;
    }
  }

  /* Saved reports grid */
  .saved-reports-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
    margin-top: 20px;
  }
  @media (min-width: 480px) {
    .saved-reports-grid {
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
    }
  }

  .saved-report-card {
    background: white;
    border-radius: 16px;
    padding: 14px;
    border: 1px solid #eef2f6;
    transition: all 0.2s ease;
    cursor: pointer;
  }
  .saved-report-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px -4px rgba(0, 0, 0, 0.1);
    border-color: #3b82f6;
  }
  .saved-report-title {
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.75rem;
    flex-wrap: wrap;
    gap: 8px;
  }
  @media (min-width: 640px) {
    .saved-report-title {
      font-size: 0.7rem;
    }
  }
  .saved-report-meta {
    font-size: 0.6rem;
    color: #64748b;
    display: flex;
    gap: 12px;
    margin-top: 8px;
    flex-wrap: wrap;
  }
  @media (min-width: 640px) {
    .saved-report-meta {
      font-size: 0.7rem;
    }
  }

  /* Modals - responsive */
  .pdf-modal-overlay, .delete-confirm-overlay, .edit-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(8px);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    animation: fadeIn 0.2s ease-out;
  }
  .pdf-modal-container, .edit-modal-container {
    background: white;
    border-radius: 28px;
    width: 100%;
    max-width: 1000px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    animation: slideInUp 0.3s ease-out;
    overflow: hidden;
  }
  @media (max-width: 640px) {
    .pdf-modal-container, .edit-modal-container {
      max-width: 100%;
      border-radius: 20px;
    }
  }
  .pdf-modal-header, .edit-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
    border-bottom: 1px solid #e2e8f0;
    flex-wrap: wrap;
    gap: 8px;
  }
  .pdf-modal-body, .edit-modal-body {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
  }
  .pdf-iframe {
    width: 100%;
    height: 65vh;
    border: none;
  }
  @media (max-width: 640px) {
    .pdf-iframe {
      height: 55vh;
    }
  }
  .pdf-modal-footer, .edit-modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 16px 20px;
    border-top: 1px solid #e2e8f0;
    background: #f8fafc;
    flex-wrap: wrap;
  }

  /* Delete confirm modal */
  .delete-confirm-container {
    background: white;
    border-radius: 24px;
    width: 100%;
    max-width: 400px;
    overflow: hidden;
  }
  .delete-confirm-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 20px;
    background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
    border-bottom: 1px solid #fecaca;
  }
  .delete-confirm-icon {
    width: 40px;
    height: 40px;
    background: #ef4444;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }
  .delete-confirm-title {
    font-size: 1.125rem;
    font-weight: 700;
    color: #991b1b;
  }
  .delete-confirm-body {
    padding: 20px;
  }
  .delete-warning-box {
    background: #fef3c7;
    border-radius: 12px;
    padding: 12px;
    display: flex;
    align-items: center;
    gap: 10px;
    border-left: 3px solid #f59e0b;
  }
  .delete-confirm-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 16px 20px;
    border-top: 1px solid #e2e8f0;
    background: #f8fafc;
  }
  .delete-confirm-btn {
    padding: 8px 20px;
    border-radius: 40px;
    font-size: 0.813rem;
    font-weight: 600;
    cursor: pointer;
    border: none;
  }
  .delete-confirm-btn-cancel {
    background: white;
    border: 1px solid #e2e8f0;
    color: #475569;
  }
  .delete-confirm-btn-danger {
    background: linear-gradient(135deg, #ef4444, #dc2626);
    color: white;
  }

  /* Toast */
  .toast-container {
    position: fixed;
    bottom: 20px;
    left: 20px;
    right: 20px;
    z-index: 200;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  @media (min-width: 640px) {
    .toast-container {
      left: auto;
      right: 20px;
      min-width: 320px;
    }
  }
  .toast {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    background: white;
    border-radius: 16px;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
    border-left: 4px solid;
    animation: toastSlide 0.3s ease;
  }
  .toast-success { border-left-color: #10b981; }
  .toast-error { border-left-color: #ef4444; }
  .toast-info { border-left-color: #3b82f6; }

  /* Animations */
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes slideInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes toastSlide {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  .spinner {
    width: 20px;
    height: 20px;
    border: 2px solid #e2e8f0;
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .loading-state {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 300px;
  }
  .empty-state {
    text-align: center;
    padding: 32px 16px;
    background: white;
    border-radius: 24px;
    border: 1px solid #eef2f6;
  }
  .section-title {
    font-size: 1rem;
    font-weight: 700;
    color: #0f172a;
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }
  @media (min-width: 640px) {
    .section-title {
      font-size: 1.125rem;
      margin-bottom: 20px;
    }
  }
  .header-actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  @media (min-width: 640px) {
    .header-actions {
      flex-direction: row;
      align-items: center;
    }
  }
  .sync-status {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.65rem;
    padding: 4px 10px;
    border-radius: 40px;
    background: #d1fae5;
    color: #065f46;
  }
  .bulk-create-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px;
    background: #f8fafc;
    border-radius: 16px;
    flex-wrap: wrap;
    margin-bottom: 8px;
  }
  .bulk-create-input {
    width: 70px;
    padding: 8px 8px;
    border: 1px solid #cbd5e1;
    border-radius: 12px;
    font-size: 0.75rem;
    text-align: center;
  }
  .row-count-badge {
    font-size: 0.65rem;
    color: #64748b;
    margin-left: auto;
  }
  .client-autocomplete-list {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    max-height: 200px;
    overflow-y: auto;
    z-index: 10;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }
  .client-autocomplete-item {
    padding: 8px 12px;
    cursor: pointer;
    border-bottom: 1px solid #f1f5f9;
    font-size: 0.75rem;
    transition: background 0.2s;
  }
  .client-autocomplete-item:hover {
    background: #f8fafc;
  }
  .client-autocomplete-phone {
    color: #64748b;
    margin-left: 8px;
    font-size: 0.7rem;
  }
`;

// ==================== TOAST COMPONENT ====================
const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);
  const Icon = type === 'success' ? CheckCircle : type === 'error' ? AlertTriangle : Info;
  return (
    <div className={`toast toast-${type}`}>
      <Icon size={18} />
      <span className="toast-message">{message}</span>
      <button className="action-btn" onClick={onClose} style={{ padding: 4 }}><X size={14} /></button>
    </div>
  );
};

// ==================== DELETE CONFIRM MODAL ====================
const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, title, message, deleting = false }) => {
  if (!isOpen) return null;
  return (
    <div className="delete-confirm-overlay" onClick={onClose}>
      <div className="delete-confirm-container" onClick={e => e.stopPropagation()}>
        <div className="delete-confirm-header">
          <div className="delete-confirm-icon"><AlertTriangle size={20} /></div>
          <div className="delete-confirm-title">{title || 'Supprimer le rapport'}</div>
        </div>
        <div className="delete-confirm-body">
          <div className="delete-confirm-message">
            {message || 'Êtes-vous sûr de vouloir supprimer ce rapport ? Cette action est irréversible.'}
          </div>
          <div className="delete-warning-box">
            <AlertTriangle size={14} />
            <span className="delete-warning-text">⚠️ Attention : Cette action est irréversible et supprimera définitivement le fichier PDF.</span>
          </div>
        </div>
        <div className="delete-confirm-footer">
          <button className="delete-confirm-btn delete-confirm-btn-cancel" onClick={onClose} disabled={deleting}>Annuler</button>
          <button className="delete-confirm-btn delete-confirm-btn-danger" onClick={onConfirm} disabled={deleting}>
            {deleting ? <Loader size={14} className="spinner" /> : 'Supprimer'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================== PDF VIEW MODAL ====================
const PdfViewModal = ({ pdfUrl, pdfName, onClose, onDownload }) => {
  const openInNewTab = () => window.open(pdfUrl, '_blank');
  return (
    <div className="pdf-modal-overlay" onClick={onClose}>
      <div className="pdf-modal-container" onClick={e => e.stopPropagation()}>
        <div className="pdf-modal-header">
          <div className="pdf-modal-title">
            <FileText size={20} style={{ color: '#3b82f6' }} />
            <span>Aperçu - {pdfName?.length > 40 ? pdfName.slice(0, 37) + '...' : pdfName}</span>
          </div>
          <button className="pdf-modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="pdf-modal-body">
          <iframe src={pdfUrl} className="pdf-iframe" title="PDF Preview" />
        </div>
        <div className="pdf-modal-footer">
          <button onClick={onClose} className="btn btn-outline">Fermer</button>
          <button onClick={openInNewTab} className="btn btn-secondary"><ExternalLink size={16} /> Ouvrir</button>
          <button onClick={onDownload} className="btn btn-primary"><Download size={16} /> Télécharger</button>
        </div>
      </div>
    </div>
  );
};

// ==================== EDIT MODAL COMPONENT (with responsive fix & editable quantity) ====================
const EditReportModal = ({ isOpen, onClose, report, onSave, clients, user }) => {
  const [rows, setRows] = useState([]);
  const [saving, setSaving] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [filteredClients, setFilteredClients] = useState([]);
  const [numberOfLines, setNumberOfLines] = useState(1);

  useEffect(() => {
    if (report && report.rows) {
      const parsedRows = typeof report.rows === 'string' ? JSON.parse(report.rows) : report.rows;
      setRows(parsedRows.map(row => ({
        id: Date.now() + Math.random(),
        date: row.date || new Date().toISOString().slice(0, 10),
        clientName: row.clientName || '',
        quantity: row.quantity || 1
      })));
    }
  }, [report]);

  useEffect(() => {
    if (clientSearch && clients) {
      const filtered = clients.filter(c => c.nom?.toLowerCase().includes(clientSearch.toLowerCase()));
      setFilteredClients(filtered.slice(0, 10));
    } else {
      setFilteredClients([]);
    }
  }, [clientSearch, clients]);

  const addRow = () => setRows([...rows, { id: Date.now(), date: new Date().toISOString().slice(0, 10), clientName: '', quantity: 1 }]);
  const updateRow = (id, field, value) => {
    setRows(rows.map(row => row.id === id ? { ...row, [field]: value } : row));
    if (field === 'clientName') setClientSearch(value);
  };
  const selectClientFromList = (rowId, clientName) => {
    updateRow(rowId, 'clientName', clientName);
    setClientSearch('');
    setFilteredClients([]);
  };
  const removeRow = (id) => { if (rows.length > 1) setRows(rows.filter(row => row.id !== id)); };
  const createMultipleRows = () => {
    const num = parseInt(numberOfLines);
    if (isNaN(num) || num <= 0) return;
    const newRows = [];
    for (let i = 0; i < num; i++) newRows.push({ id: Date.now() + i, date: new Date().toISOString().slice(0, 10), clientName: '', quantity: 1 });
    setRows([...rows, ...newRows]);
  };
  const calculateTotalQuantity = () => rows.reduce((sum, row) => sum + (Number(row.quantity) || 0), 0);
  
  // Handle quantity change - allow empty string temporarily
  const handleQuantityChange = (id, value) => {
    if (value === '') {
      updateRow(id, 'quantity', '');
    } else {
      const num = parseInt(value, 10);
      if (!isNaN(num)) updateRow(id, 'quantity', num);
    }
  };
  const handleQuantityBlur = (id, currentValue) => {
    let val = currentValue === '' ? 1 : Number(currentValue);
    if (isNaN(val) || val < 1) val = 1;
    updateRow(id, 'quantity', val);
  };

  const getCompanyInfo = () => {
    const saved = localStorage.getItem('company_info');
    if (saved) try { return JSON.parse(saved); } catch(e) {}
    return { name: 'AMG TELECOM Sarl', address: '82 Angle Abdelmounem et Rue Soumaya ETG 2 N°4, CASABLANCA', phone: '+212 661 685 758', email: 'contact@amgtelecom.ma', ice: '003272997000058', rc: '577849', patente: '34779711', tax_number: '53711710', cnss: '4767398', rib: '011 780 0000762100016378 22', tp_number: '34779711', bank_name: 'Banque Populaire' };
  };
  const blobToBase64 = (blob) => new Promise((resolve, reject) => { const reader = new FileReader(); reader.onloadend = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(blob); });

  const handleSave = async () => {
    const validRows = rows.filter(row => row.clientName && row.clientName.trim() && row.quantity > 0);
    if (validRows.length === 0) { alert('Veuillez ajouter au moins une ligne valide'); return; }
    setSaving(true);
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const companyInfo = getCompanyInfo();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      let yPos = 20;
      let logoBase64 = null;
      try { const response = await fetch('/logo.png'); if (response.ok) { const blob = await response.blob(); logoBase64 = await blobToBase64(blob); } } catch(e) {}
      if (logoBase64) doc.addImage(logoBase64, 'PNG', margin, yPos - 2, 40, 25);
      else { doc.setFillColor(15, 23, 42); doc.rect(margin, yPos, 8, 8, 'F'); doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(15, 23, 42); doc.text(companyInfo.name.substring(0, 3).toUpperCase(), margin + 11, yPos + 6.5); }
      doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.setTextColor(30, 58, 138); doc.text("RAPPORT D'ACTIVITÉ", pageWidth - margin, yPos + 4, { align: 'right' });
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(100, 116, 139); doc.text(`Date d'édition: ${new Date().toLocaleDateString('fr-FR')}`, pageWidth - margin, yPos + 10, { align: 'right' });
      yPos += 24;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(30, 58, 138); doc.text("ÉMETTEUR", margin, yPos);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(15, 23, 42); doc.text(companyInfo.name, margin, yPos + 5.5);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(71, 85, 105);
      let companyY = yPos + 11;
      const splitAddress = doc.splitTextToSize(companyInfo.address, pageWidth * 0.45);
      splitAddress.forEach(line => { doc.text(line, margin, companyY); companyY += 4.5; });
      doc.text(`Tél: ${companyInfo.phone}`, margin, companyY); doc.text(`Email: ${companyInfo.email}`, margin, companyY + 4.5);
      const rightColX = pageWidth * 0.55;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(30, 58, 138); doc.text("TECHNICIEN", rightColX, yPos);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(71, 85, 105); doc.text(`Nom: ${user?.name || 'Technicien'}`, rightColX, yPos + 5.5); doc.text(`ID: ${user?.id || '-'}`, rightColX, yPos + 10); doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, rightColX, yPos + 14.5);
      yPos = Math.max(companyY + 12, yPos + 22);
      const tableRows = validRows.map(row => [new Date(row.date).toLocaleDateString('fr-FR'), row.clientName, row.quantity.toString()]);
      const totalQuantity = validRows.reduce((sum, row) => sum + (Number(row.quantity) || 0), 0);
      autoTable(doc, { startY: yPos, theme: 'plain', head: [['Date', 'Nom du client', 'Quantité']], body: tableRows, margin: { left: margin, right: margin }, styles: { font: 'helvetica', fontSize: 10, cellPadding: 6, textColor: [30, 41, 59] }, headStyles: { textColor: [30, 58, 138], fontStyle: 'bold', lineWidth: { bottom: 1 }, drawColor: [30, 58, 138] }, columnStyles: { 0: { halign: 'left', cellWidth: 40 }, 1: { halign: 'left' }, 2: { halign: 'center', cellWidth: 35 } }, didParseCell: (data) => { if (data.section === 'body') { data.cell.styles.lineWidth = { bottom: 0.2 }; data.cell.styles.drawColor = [241, 245, 249]; } } });
      let finalY = doc.lastAutoTable.finalY + 10;
      if (finalY + 30 < pageHeight) { doc.setFillColor(248, 250, 252); doc.roundedRect(pageWidth - margin - 70, finalY, 70, 20, 5, 5, 'FD'); doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(30, 58, 138); doc.text("QUANTITÉ TOTALE", pageWidth - margin - 65, finalY + 7); doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor(16, 185, 129); doc.text(`${totalQuantity}`, pageWidth - margin - 5, finalY + 16, { align: 'right' }); }
      else { doc.addPage(); doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(30, 58, 138); doc.text("RÉSUMÉ", margin, margin + 10); doc.setFont('helvetica', 'normal'); doc.setFontSize(11); doc.setTextColor(16, 185, 129); doc.text(`Quantité totale: ${totalQuantity}`, margin, margin + 20); }
      const footerY = pageHeight - 10; doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(164, 175, 190); doc.text(`${companyInfo.name} — Document généré par ${user?.name || 'Technicien'}`, margin, footerY);
      const fileName = `Rapport_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.pdf`;
      const pdfBlob = doc.output('blob');
      const pdfBase64 = await blobToBase64(pdfBlob);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/technician-reports/${report.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ file_name: fileName, pdf_data: pdfBase64, rows: validRows, total_quantity: totalQuantity }) });
      if (response.ok) { onSave(); onClose(); } else alert('Erreur lors de la sauvegarde');
    } catch (err) { console.error(err); alert('Erreur lors de la sauvegarde'); } finally { setSaving(false); }
  };
  if (!isOpen) return null;
  return (
    <div className="edit-modal-overlay" onClick={onClose}>
      <div className="edit-modal-container" onClick={e => e.stopPropagation()}>
        <div className="edit-modal-header">
          <div className="edit-modal-title"><Edit size={20} style={{ color: '#8b5cf6' }} /><span>Modifier - {report?.file_name?.slice(0, 40)}</span></div>
          <button className="pdf-modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="edit-modal-body">
          <div className="bulk-create-bar">
            <span className="bulk-create-label">📝 Création rapide:</span>
            <input type="number" min="1" max="50" value={numberOfLines} onChange={(e) => setNumberOfLines(e.target.value)} className="bulk-create-input" />
            <button onClick={createMultipleRows} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.75rem' }}><Zap size={14} /> Créer {numberOfLines} ligne{parseInt(numberOfLines) > 1 ? 's' : ''}</button>
            <button onClick={addRow} className="btn btn-outline" style={{ padding: '8px 16px', fontSize: '0.75rem' }}><Plus size={14} /> Ajouter 1 ligne</button>
            <div className="row-count-badge">📋 {rows.length} ligne(s)</div>
          </div>
          <div className="report-table-container" style={{ marginBottom: 0 }}>
            <table className="report-table">
              <thead><tr><th>Date</th><th>Nom du client</th><th>Qté</th><th></th></tr></thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.id}>
                    <td><input type="date" className="report-input" value={row.date} onChange={e => updateRow(row.id, 'date', e.target.value)} /></td>
                    <td><div style={{ position: 'relative' }}><input type="text" className="report-input client-name-input" value={row.clientName} onChange={e => updateRow(row.id, 'clientName', e.target.value)} placeholder={`Client ${index + 1}`} autoComplete="off" />
                      {clientSearch && filteredClients.length > 0 && (<div className="client-autocomplete-list">{filteredClients.map(client => (<div key={client.id} onClick={() => selectClientFromList(row.id, client.nom)} className="client-autocomplete-item">{client.nom}{client.telephone && <span className="client-autocomplete-phone">{client.telephone}</span>}</div>))}</div>)}</div></td>
                    <td>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        className="report-input quantity-input"
                        value={row.quantity === '' ? '' : row.quantity}
                        onChange={e => handleQuantityChange(row.id, e.target.value)}
                        onBlur={e => handleQuantityBlur(row.id, e.target.value)}
                        style={{ textAlign: 'center' }}
                      />
                    </td>
                    <td style={{ textAlign: 'center' }}><button onClick={() => removeRow(row.id)} className="action-btn" disabled={rows.length === 1}><Trash2 size={16} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="summary-card" style={{ marginTop: '16px', marginBottom: 0 }}>
            <div><span style={{ fontSize: '0.75rem', color: '#64748b' }}>Total lignes: </span><strong>{rows.filter(r => r.clientName?.trim()).length}</strong></div>
            <div className="total-quantity"><span>Quantité totale:</span><span>{calculateTotalQuantity()}</span></div>
          </div>
        </div>
        <div className="edit-modal-footer">
          <button onClick={onClose} className="btn btn-outline" disabled={saving}>Annuler</button>
          <button onClick={handleSave} className="btn btn-primary" disabled={saving}>{saving ? <Loader size={16} className="spinner" /> : <Save size={16} />}{saving ? 'Sauvegarde...' : 'Sauvegarder'}</button>
        </div>
      </div>
    </div>
  );
};

// ==================== MAIN TECHNICIAN REPORT COMPONENT ====================
const TechnicianReport = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { list: clients } = useSelector((state) => state.clients);

  const [rows, setRows] = useState([{ id: Date.now(), date: new Date().toISOString().slice(0, 10), clientName: '', quantity: 1 }]);
  const [savedReports, setSavedReports] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [loadingReports, setLoadingReports] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [previewPdf, setPreviewPdf] = useState(null);
  const [clientSearch, setClientSearch] = useState('');
  const [filteredClients, setFilteredClients] = useState([]);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, reportId: null, reportName: '' });
  const [deleting, setDeleting] = useState(false);
  const [downloading, setDownloading] = useState(null);
  const [numberOfLines, setNumberOfLines] = useState(1);
  const [editModal, setEditModal] = useState({ isOpen: false, report: null });

  const loadReportsFromServer = async () => {
    setLoadingReports(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/technician-reports`, { headers: { Authorization: `Bearer ${token}` } });
      if (response.ok) { const data = await response.json(); setSavedReports(data.reports || []); }
    } catch (error) { console.error(error); showToast('Erreur de chargement des rapports', 'error'); } finally { setLoadingReports(false); }
  };

  useEffect(() => { dispatch(fetchClients()); loadReportsFromServer(); }, [dispatch]);
  useEffect(() => {
    if (clientSearch && clients) setFilteredClients(clients.filter(c => c.nom?.toLowerCase().includes(clientSearch.toLowerCase())).slice(0, 10));
    else setFilteredClients([]);
  }, [clientSearch, clients]);

  const showToast = (message, type = 'success') => { const id = Date.now(); setToasts(prev => [...prev, { id, message, type }]); setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000); };
  const addRow = () => setRows([...rows, { id: Date.now(), date: new Date().toISOString().slice(0, 10), clientName: '', quantity: 1 }]);
  const updateRow = (id, field, value) => { setRows(rows.map(row => row.id === id ? { ...row, [field]: value } : row)); if (field === 'clientName') setClientSearch(value); };
  const selectClientFromList = (rowId, clientName) => { updateRow(rowId, 'clientName', clientName); setClientSearch(''); setFilteredClients([]); };
  const removeRow = (id) => { if (rows.length > 1) setRows(rows.filter(row => row.id !== id)); else showToast('Gardez au moins une ligne', 'error'); };
  const calculateTotalQuantity = () => rows.reduce((sum, row) => sum + (Number(row.quantity) || 0), 0);
  
  // Handle quantity change - allow empty string temporarily
  const handleQuantityChange = (id, value) => {
    if (value === '') {
      updateRow(id, 'quantity', '');
    } else {
      const num = parseInt(value, 10);
      if (!isNaN(num)) updateRow(id, 'quantity', num);
    }
  };
  const handleQuantityBlur = (id, currentValue) => {
    let val = currentValue === '' ? 1 : Number(currentValue);
    if (isNaN(val) || val < 1) val = 1;
    updateRow(id, 'quantity', val);
  };

  const getCompanyInfo = () => {
    const saved = localStorage.getItem('company_info');
    if (saved) try { return JSON.parse(saved); } catch(e) {}
    return { name: 'AMG TELECOM Sarl', address: '82 Angle Abdelmounem et Rue Soumaya ETG 2 N°4, CASABLANCA', phone: '+212 661 685 758', email: 'contact@amgtelecom.ma', ice: '003272997000058', rc: '577849', patente: '34779711', tax_number: '53711710', cnss: '4767398', rib: '011 780 0000762100016378 22', tp_number: '34779711', bank_name: 'Banque Populaire' };
  };
  const blobToBase64 = (blob) => new Promise((resolve, reject) => { const reader = new FileReader(); reader.onloadend = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(blob); });

  const generatePDF = async (saveToServer = true) => {
    const validRows = rows.filter(row => row.clientName && row.clientName.trim() && row.quantity > 0);
    if (validRows.length === 0) { showToast('Veuillez ajouter au moins une ligne valide (nom et quantité requis)', 'error'); return; }
    setGenerating(true);
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const companyInfo = getCompanyInfo();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      let yPos = 20;
      let logoBase64 = null;
      try { const response = await fetch('/logo.png'); if (response.ok) { const blob = await response.blob(); logoBase64 = await blobToBase64(blob); } } catch(e) {}
      if (logoBase64) doc.addImage(logoBase64, 'PNG', margin, yPos - 2, 40, 25);
      else { doc.setFillColor(15, 23, 42); doc.rect(margin, yPos, 8, 8, 'F'); doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(15, 23, 42); doc.text(companyInfo.name.substring(0, 3).toUpperCase(), margin + 11, yPos + 6.5); }
      doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.setTextColor(30, 58, 138); doc.text("RAPPORT D'ACTIVITÉ", pageWidth - margin, yPos + 4, { align: 'right' });
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(100, 116, 139); doc.text(`Date d'édition: ${new Date().toLocaleDateString('fr-FR')}`, pageWidth - margin, yPos + 10, { align: 'right' });
      yPos += 24;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(30, 58, 138); doc.text("ÉMETTEUR", margin, yPos);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(15, 23, 42); doc.text(companyInfo.name, margin, yPos + 5.5);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(71, 85, 105);
      let companyY = yPos + 11;
      const splitAddress = doc.splitTextToSize(companyInfo.address, pageWidth * 0.45);
      splitAddress.forEach(line => { doc.text(line, margin, companyY); companyY += 4.5; });
      doc.text(`Tél: ${companyInfo.phone}`, margin, companyY); doc.text(`Email: ${companyInfo.email}`, margin, companyY + 4.5);
      const rightColX = pageWidth * 0.55;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(30, 58, 138); doc.text("TECHNICIEN", rightColX, yPos);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(71, 85, 105); doc.text(`Nom: ${user?.name || 'Technicien'}`, rightColX, yPos + 5.5); doc.text(`ID: ${user?.id || '-'}`, rightColX, yPos + 10); doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, rightColX, yPos + 14.5);
      yPos = Math.max(companyY + 12, yPos + 22);
      const tableRows = validRows.map(row => [new Date(row.date).toLocaleDateString('fr-FR'), row.clientName, row.quantity.toString()]);
      const totalQuantity = validRows.reduce((sum, row) => sum + (Number(row.quantity) || 0), 0);
      autoTable(doc, { startY: yPos, theme: 'plain', head: [['Date', 'Nom du client', 'Quantité']], body: tableRows, margin: { left: margin, right: margin }, styles: { font: 'helvetica', fontSize: 10, cellPadding: 6, textColor: [30, 41, 59] }, headStyles: { textColor: [30, 58, 138], fontStyle: 'bold', lineWidth: { bottom: 1 }, drawColor: [30, 58, 138] }, columnStyles: { 0: { halign: 'left', cellWidth: 40 }, 1: { halign: 'left' }, 2: { halign: 'center', cellWidth: 35 } }, didParseCell: (data) => { if (data.section === 'body') { data.cell.styles.lineWidth = { bottom: 0.2 }; data.cell.styles.drawColor = [241, 245, 249]; } } });
      let finalY = doc.lastAutoTable.finalY + 10;
      if (finalY + 30 < pageHeight) { doc.setFillColor(248, 250, 252); doc.roundedRect(pageWidth - margin - 70, finalY, 70, 20, 5, 5, 'FD'); doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(30, 58, 138); doc.text("QUANTITÉ TOTALE", pageWidth - margin - 65, finalY + 7); doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor(16, 185, 129); doc.text(`${totalQuantity}`, pageWidth - margin - 5, finalY + 16, { align: 'right' }); }
      else { doc.addPage(); doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(30, 58, 138); doc.text("RÉSUMÉ", margin, margin + 10); doc.setFont('helvetica', 'normal'); doc.setFontSize(11); doc.setTextColor(16, 185, 129); doc.text(`Quantité totale: ${totalQuantity}`, margin, margin + 20); }
      const footerY = pageHeight - 10; doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(164, 175, 190); doc.text(`${companyInfo.name} — Document généré par ${user?.name || 'Technicien'}`, margin, footerY);
      const fileName = `Rapport_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.pdf`;
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      if (saveToServer) {
        const pdfBase64 = await blobToBase64(pdfBlob);
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/technician-reports`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ file_name: fileName, pdf_data: pdfBase64, rows: validRows, total_quantity: totalQuantity }) });
        if (response.ok) { showToast('Rapport sauvegardé avec succès', 'success'); await loadReportsFromServer(); setRows([{ id: Date.now(), date: new Date().toISOString().slice(0, 10), clientName: '', quantity: 1 }]); } else { const error = await response.json(); showToast(error.message || 'Erreur lors de la sauvegarde', 'error'); }
      }
      setPreviewPdf({ url: pdfUrl, name: fileName });
    } catch (err) { console.error(err); showToast('Erreur lors de la génération du PDF', 'error'); } finally { setGenerating(false); }
  };

  const viewSavedReport = (report) => { if (report.file_url) setPreviewPdf({ url: report.file_url, name: report.file_name }); else showToast('Impossible d\'afficher ce rapport', 'error'); };
  const openEditModal = (report, e) => { e.stopPropagation(); setEditModal({ isOpen: true, report }); };
  const downloadReport = async (report, e) => { e.stopPropagation(); setDownloading(report.id); try { const token = localStorage.getItem('token'); const response = await fetch(`${API_URL}/technician-reports/${report.id}/download`, { headers: { 'Authorization': `Bearer ${token}` } }); if (!response.ok) throw new Error('Download failed'); const blob = await response.blob(); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = report.file_name; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url); showToast('Téléchargement démarré', 'success'); } catch (error) { console.error(error); showToast('Erreur lors du téléchargement', 'error'); } finally { setDownloading(null); } };
  const openDeleteConfirm = (reportId, reportName, e) => { e.stopPropagation(); setDeleteModal({ isOpen: true, reportId, reportName }); };
  const handleDeleteReport = async () => { const { reportId } = deleteModal; if (!reportId) return; setDeleting(true); try { const token = localStorage.getItem('token'); const response = await fetch(`${API_URL}/technician-reports/${reportId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } }); if (response.ok) { showToast('Rapport supprimé avec succès', 'success'); await loadReportsFromServer(); } else showToast('Erreur lors de la suppression', 'error'); } catch (error) { console.error(error); showToast('Erreur lors de la suppression', 'error'); } finally { setDeleting(false); setDeleteModal({ isOpen: false, reportId: null, reportName: '' }); } };
  const handleLogout = async () => { await dispatch(logout()); navigate('/login'); };
  const downloadCurrentPDF = () => { if (previewPdf?.url) { const link = document.createElement('a'); link.href = previewPdf.url; link.download = previewPdf.name; document.body.appendChild(link); link.click(); document.body.removeChild(link); showToast('Téléchargement démarré', 'success'); } };
  const createMultipleRows = () => { const num = parseInt(numberOfLines); if (isNaN(num) || num <= 0) { showToast('Veuillez entrer un nombre valide', 'error'); return; } const newRows = []; for (let i = 0; i < num; i++) newRows.push({ id: Date.now() + i, date: new Date().toISOString().slice(0, 10), clientName: '', quantity: 1 }); setRows(newRows); showToast(`${num} ligne(s) créée(s)`, 'success'); };

  return (
    <div className="tech-report-container">
      <style>{styles}</style>
      {toasts.length > 0 && (<div className="toast-container">{toasts.map(t => <Toast key={t.id} message={t.message} type={t.type} onClose={() => setToasts(prev => prev.filter(to => to.id !== t.id))} />)}</div>)}
      <DeleteConfirmModal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ isOpen: false, reportId: null, reportName: '' })} onConfirm={handleDeleteReport} title="Supprimer le rapport" message={`Supprimer "${deleteModal.reportName?.length > 50 ? deleteModal.reportName.slice(0, 47) + '...' : deleteModal.reportName}" ?`} deleting={deleting} />
      <EditReportModal isOpen={editModal.isOpen} onClose={() => setEditModal({ isOpen: false, report: null })} report={editModal.report} onSave={() => { loadReportsFromServer(); showToast('Rapport modifié', 'success'); }} clients={clients} user={user} />
      {previewPdf && <PdfViewModal pdfUrl={previewPdf.url} pdfName={previewPdf.name} onClose={() => setPreviewPdf(null)} onDownload={downloadCurrentPDF} />}
      <div className="tech-report-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
          <div><h1 className="tech-report-title">📋 Rapports d'Activité</h1><div className="tech-report-badge"><Smartphone size={14} /> Mode Technicien - {user?.name || 'Technicien'}</div></div>
          <div className="header-actions"><button onClick={loadReportsFromServer} className="btn btn-outline" disabled={loadingReports}><RefreshCw size={16} className={loadingReports ? 'spinner' : ''} /> Actualiser</button><button onClick={handleLogout} className="btn btn-danger"><LogOut size={16} /> Déconnexion</button></div>
        </div>
        <div className="sync-status"><Database size={12} /> Rapports sauvegardés sur le serveur</div>
      </div>
      <div className="report-table-container">
        <div style={{ padding: '16px', borderBottom: '1px solid #eef2f6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            <div><h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>Nouveau rapport</h3><p style={{ fontSize: '0.7rem', color: '#64748b' }}>Ajoutez les lignes d'activité avec nom client et quantité</p></div>
            <button onClick={addRow} className="btn btn-outline"><Plus size={16} /> Ajouter 1 ligne</button>
          </div>
          <div className="bulk-create-bar"><span className="bulk-create-label">📝 Création rapide:</span><input type="number" min="1" max="50" value={numberOfLines} onChange={(e) => setNumberOfLines(e.target.value)} className="bulk-create-input" /><button onClick={createMultipleRows} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.75rem' }}><Zap size={14} /> Créer {numberOfLines} ligne{parseInt(numberOfLines) > 1 ? 's' : ''}</button><div className="row-count-badge">📋 {rows.length} ligne(s) actuelle(s)</div></div>
        </div>
        <table className="report-table">
          <thead><tr><th>Date</th><th>Nom du client</th><th>Qté</th><th></th></tr></thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.id}>
                <td><input type="date" className="report-input" value={row.date} onChange={e => updateRow(row.id, 'date', e.target.value)} /></td>
                <td><div style={{ position: 'relative' }}><input type="text" className="report-input client-name-input" value={row.clientName} onChange={e => updateRow(row.id, 'clientName', e.target.value)} placeholder={`Client ${index + 1}`} autoComplete="off" />{clientSearch && filteredClients.length > 0 && (<div className="client-autocomplete-list">{filteredClients.map(client => (<div key={client.id} onClick={() => selectClientFromList(row.id, client.nom)} className="client-autocomplete-item">{client.nom}{client.telephone && <span className="client-autocomplete-phone">{client.telephone}</span>}</div>))}</div>)}</div></td>
                <td>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="report-input quantity-input"
                    value={row.quantity === '' ? '' : row.quantity}
                    onChange={e => handleQuantityChange(row.id, e.target.value)}
                    onBlur={e => handleQuantityBlur(row.id, e.target.value)}
                    style={{ textAlign: 'center' }}
                  />
                </td>
                <td style={{ textAlign: 'center' }}><button onClick={() => removeRow(row.id)} className="action-btn" disabled={rows.length === 1}><Trash2 size={16} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="summary-card" style={{ margin: 0, borderRadius: 0, borderTop: '1px solid #eef2f6' }}>
          <div><span style={{ fontSize: '0.75rem', color: '#64748b' }}>Total lignes: </span><strong style={{ color: '#1e293b' }}>{rows.filter(r => r.clientName?.trim()).length}</strong></div>
          <div className="total-quantity"><span>Quantité totale:</span><span>{calculateTotalQuantity()}</span></div>
          <button onClick={() => generatePDF(true)} className="btn btn-primary" disabled={generating || rows.filter(r => r.clientName?.trim()).length === 0}>{generating ? <Loader size={16} className="spinner" /> : <Save size={16} />}{generating ? 'Génération...' : 'Générer & Sauvegarder'}</button>
        </div>
      </div>
      <div style={{ marginTop: '32px' }}>
        <div className="section-title"><FolderOpen size={20} style={{ color: '#3b82f6' }} />Rapports sauvegardés<span className="tech-report-badge" style={{ background: '#f1f5f9', color: '#475569', marginLeft: 'auto' }}>{savedReports.length} rapport(s)</span></div>
        {loadingReports ? (<div className="loading-state"><div className="spinner" /></div>) : savedReports.length === 0 ? (<div className="empty-state"><FileText size={48} /><p>Aucun rapport sauvegardé</p><p style={{ fontSize: '0.7rem', marginTop: '8px' }}>Générez votre premier rapport ci-dessus</p></div>) : (<div className="saved-reports-grid">{savedReports.map((report) => (<div key={report.id} className="saved-report-card" onClick={() => viewSavedReport(report)}><div className="saved-report-title"><span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FileText size={14} style={{ color: '#3b82f6' }} />{report.file_name.length > 30 ? report.file_name.slice(0, 27) + '...' : report.file_name}</span><div style={{ display: 'flex', gap: '4px' }}><button className="action-btn edit" onClick={(e) => openEditModal(report, e)} title="Modifier"><Edit size={14} /></button><button className="action-btn download" onClick={(e) => downloadReport(report, e)} disabled={downloading === report.id} title="Télécharger">{downloading === report.id ? <Loader size={14} className="spinner" /> : <Download size={14} />}</button><button className="action-btn delete" onClick={(e) => openDeleteConfirm(report.id, report.file_name, e)} title="Supprimer"><Trash2 size={14} /></button></div></div><div style={{ fontSize: '0.7rem', color: '#334155' }}><div>👤 {user?.name || 'Technicien'}</div><div>📦 Quantité totale: <strong>{report.total_quantity}</strong></div><div>📋 {report.rows?.length || 0} ligne(s)</div></div><div className="saved-report-meta"><span><Calendar size={10} /> {new Date(report.created_at).toLocaleDateString('fr-FR')}</span><span><Eye size={10} /> Cliquer pour voir</span><span><Edit size={10} /> Modifier</span></div></div>))}</div>)}
      </div>
    </div>
  );
};

export default TechnicianReport;