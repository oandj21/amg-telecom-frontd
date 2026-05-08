// ExportMenu.jsx - Updated version with conditional total row

import { useState } from 'react';
import { Download, FileSpreadsheet, FileText, Filter } from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import html2pdf from 'html2pdf.js';
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

const cn = (...inputs) => {
  return inputs.filter(Boolean).join(' ');
};

// =============================================================================
// INLINE UI COMPONENTS
// =============================================================================

const DropdownMenu = DropdownMenuPrimitive.Root;
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
const DropdownMenuPortal = DropdownMenuPrimitive.Portal;

const DropdownMenuContent = ({ className, sideOffset = 4, align = 'end', children, ...props }) => {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        sideOffset={sideOffset}
        align={align}
        className={cn(
          "z-50 min-w-[12rem] overflow-hidden rounded-xl border border-gray-200 bg-white p-1.5 text-gray-700 shadow-lg",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          className
        )}
        {...props}
      >
        {children}
      </DropdownMenuPrimitive.Content>
    </DropdownMenuPrimitive.Portal>
  );
};

const DropdownMenuLabel = ({ className, inset, children, ...props }) => (
  <DropdownMenuPrimitive.Label
    className={cn("px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500", inset && "pl-8", className)}
    {...props}
  >
    {children}
  </DropdownMenuPrimitive.Label>
);

const DropdownMenuSeparator = ({ className, ...props }) => (
  <DropdownMenuPrimitive.Separator
    className={cn("-mx-1.5 my-1.5 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent", className)}
    {...props}
  />
);

const Button = ({ children, variant = 'default', size = 'default', className = '', ...props }) => {
  const baseStyles = 'inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    default: 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg',
    outline: 'border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400',
    ghost: 'hover:bg-gray-100 text-gray-700',
  };

  const sizes = {
    default: 'px-4 py-2',
    sm: 'px-3 py-1.5 text-xs',
    icon: 'p-2',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant] || variants.default} ${sizes[size] || sizes.default} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

const Dialog = ({ open, onOpenChange, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-all" onClick={() => onOpenChange(false)} />
      <div className="relative z-50 w-full max-w-md mx-4 animate-in zoom-in-95 fade-in-0 duration-200">
        {children}
      </div>
    </div>
  );
};

const DialogContent = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl shadow-2xl p-6 border border-gray-100 ${className}`}>
    {children}
  </div>
);

const DialogHeader = ({ children }) => <div className="mb-4">{children}</div>;
const DialogTitle = ({ children, className = '' }) => (
  <h2 className={`text-lg font-semibold text-gray-900 flex items-center gap-2 ${className}`}>
    {children}
  </h2>
);
const DialogFooter = ({ children }) => <div className="flex justify-end gap-3 mt-6">{children}</div>;
const Input = ({ className = '', ...props }) => (
  <input
    className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${className}`}
    {...props}
  />
);
const Label = ({ children, className = '' }) => (
  <label className={`block text-sm font-medium text-gray-700 mb-1.5 ${className}`}>{children}</label>
);

const Select = ({ children, onValueChange, value, className = '' }) => {
  return (
    <select
      value={value}
      onChange={(e) => onValueChange?.(e.target.value)}
      className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200 ${className}`}
    >
      {children}
    </select>
  );
};

const SelectItem = ({ children, value }) => <option value={value}>{children}</option>;

// =============================================================================
// COMPANY INFO
// =============================================================================

const getCompanyInfo = () => {
  const saved = localStorage.getItem('company_info');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      // Safe boundary fallback loop
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
  };
};

// =============================================================================
// HELPER: Check if columns contain monetary values
// =============================================================================

const hasMonetaryColumns = (columns) => {
  const monetaryKeywords = ['Total', 'Montant', 'Prix', 'TTC', 'HT', 'MAD', 'Payé', 'Reste', 'Sous-total'];
  return columns.some(col => 
    monetaryKeywords.some(keyword => 
      col.header.toLowerCase().includes(keyword.toLowerCase())
    )
  );
};

// =============================================================================
// FILTERS
// =============================================================================

const applyDateFilter = (rows, filter, dateField = 'date') => {
  if (!rows || rows.length === 0) return [];
  if (!filter || filter.mode === 'all') return rows;

  return rows.filter(row => {
    const dateStr = row[dateField];
    if (!dateStr) return true;

    const rowDate = new Date(dateStr);
    const rowDateStr = rowDate.toISOString().slice(0, 10);

    switch (filter.mode) {
      case 'day':
        return rowDateStr === filter.day;
      case 'month': {
        const rowMonth = rowDateStr.slice(0, 7);
        return rowMonth === filter.month;
      }
      case 'range': {
        if (filter.from && rowDateStr < filter.from) return false;
        if (filter.to && rowDateStr > filter.to) return false;
        return true;
      }
      default:
        return true;
    }
  });
};

// =============================================================================
// PROFESSIONAL EXCEL EXPORT (EXCELJS) - WITH CONDITIONAL TOTAL ROW
// =============================================================================

const exportToStyledExcel = async (title, rows, columns) => {
  try {
    if (!rows || rows.length === 0) {
      alert('Aucune donnée à exporter');
      return;
    }
    
    const companyInfo = getCompanyInfo();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(title.slice(0, 31));
    const showTotalRow = hasMonetaryColumns(columns);
    
    // Gridlines configuration layout alignment settings
    worksheet.views = [{ showGridLines: true }];
    worksheet.properties.defaultRowHeight = 22;
    
    // 1. EMBED LOGO IMAGE FILE VIA BASE64 AT TOP LEFT DATA REGION
    try {
      const response = await fetch('/logo.png');
      if (response.ok) {
        const blob = await response.blob();
        const reader = new FileReader();
        const base64Logo = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result.split(',')[1]);
          reader.readAsDataURL(blob);
        });
        
        const imageId = workbook.addImage({
          base64: base64Logo,
          extension: 'png',
        });
        
        worksheet.addImage(imageId, {
          tl: { col: 0, row: 0 },
          ext: { width: 110, height: 80 },
        });
      }
    } catch (e) {
      console.warn('Excel logo formatting dynamically skipped.');
    }
    
    // Pad layout rows safely underneath corporate assets metadata coordinates
    worksheet.addRow([]);
    worksheet.addRow([]);
    worksheet.addRow([]);
    
    // 2. COMPANY HEADER INFORMATION LAYOUT BLOCK
    const nameRow = worksheet.addRow([companyInfo.name]);
    nameRow.getCell(1).font = { bold: true, size: 14, color: { argb: 'FF0F172A' } };
    
    const addressRow = worksheet.addRow([companyInfo.address]);
    addressRow.getCell(1).font = { size: 9, color: { argb: 'FF475569' } };
    
    const contactRow = worksheet.addRow([`Tél: ${companyInfo.phone}  |  Email: ${companyInfo.email}`]);
    contactRow.getCell(1).font = { size: 9, color: { argb: 'FF475569' } };
    
    const metaRow = worksheet.addRow([`ICE: ${companyInfo.ice}  •  RC: ${companyInfo.rc}  •  Patente: ${companyInfo.patente}`]);
    metaRow.getCell(1).font = { size: 8, color: { argb: 'FF94A3B8' } };
    
    worksheet.addRow([]); // Spacer
    
    // 3. DOCUMENT TITLE DATA BAR METRICS LAYOUT
    const docTitleRow = worksheet.addRow([title.toUpperCase()]);
    docTitleRow.getCell(1).font = { bold: true, size: 16, color: { argb: 'FF0F172A' } };
    docTitleRow.height = 28;
    
    const timestampText = `Généré le: ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}  |  Total: ${rows.length} enregistrements`;
    const reportMetaRow = worksheet.addRow([timestampText]);
    reportMetaRow.getCell(1).font = { size: 9, italic: true, color: { argb: 'FF64748B' } };
    
    worksheet.addRow([]); // Grid buffer divider spacer
    
    // 4. COLUMN DATA HEADERS FIELD GRID ASSEMBLY STYLE
    const headerRow = worksheet.addRow(columns.map(col => col.header));
    headerRow.height = 26;
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0F172A' } // Dark Slate Corporate Primary
      };
      cell.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF0F172A' } },
        bottom: { style: 'medium', color: { argb: 'FF1E293B' } },
        left: { style: 'thin', color: { argb: 'FF334155' } },
        right: { style: 'thin', color: { argb: 'FF334155' } }
      };
    });
    
    let totalGlobalAmountValue = 0;
    
    // 5. INJECT GRID MATRIX RECORD ROWS DATA POPULATION
    rows.forEach((row, rowIndex) => {
      let numericRowSumValue = 0;
      const dataRowValues = columns.map(col => {
        let val = typeof col.accessor === 'function' ? col.accessor(row) : row[col.accessor];
        
        // Status updates standard translations maps filtering
        if (col.header === 'Statut vente' && val) {
          const map = { 'pending': 'En attente', 'confirmed': 'Confirmée', 'cancelled': 'Annulée', 'paid': 'Payé' };
          val = map[val] || val;
        }
        if (col.header === 'Statut paiement' && val) {
          const map = { 'paid': 'Payé', 'partial': 'Partiel', 'unpaid': 'Impayé' };
          val = map[val] || val;
        }
        
        if (showTotalRow && ['Total (MAD)', 'Montant', 'TOTAL TTC', 'Total', 'Payé (MAD)'].includes(col.header)) {
          numericRowSumValue += parseFloat(val) || 0;
        }
        return val !== undefined && val !== null ? val : '-';
      });
      
      totalGlobalAmountValue += numericRowSumValue;
      const currentGridRow = worksheet.addRow(dataRowValues);
      currentGridRow.height = 22;
      
      // Zebra striping layout shading definitions matrix mapping
      const isEvenRowIndex = rowIndex % 2 === 0;
      const rowFillBgColorHex = isEvenRowIndex ? 'FFFFFFFF' : 'FFF8FAFC';
      
      currentGridRow.eachCell((cell, colNumber) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: rowFillBgColorHex }
        };
        cell.font = { size: 10, color: { argb: 'FF334155' } };
        cell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
        cell.border = {
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };
        
        // Format values as numeric decimals when applicable
        const associatedHeaderTitle = columns[colNumber - 1]?.header;
        if (typeof cell.value === 'number' || (!isNaN(Number(cell.value)) && cell.value !== '-' && String(cell.value).trim() !== '')) {
          const parsingFloatValue = parseFloat(cell.value);
          if (!isNaN(parsingFloatValue)) {
            cell.value = parsingFloatValue;
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
            cell.numFmt = '#,##0.00';
          }
        }
      });
    });
    
    worksheet.addRow([]); // Bottom buffer gap section
    
    // 6. TOTAL ACCOUNT SUMMARY GRID FIELD ROW DESIGN (ONLY FOR MONETARY DATA)
    if (showTotalRow && totalGlobalAmountValue > 0) {
      const summaryLabelRowValues = new Array(columns.length).fill('');
      summaryLabelRowValues[columns.length - 2] = 'TOTAL GENERAL :';
      summaryLabelRowValues[columns.length - 1] = totalGlobalAmountValue;
      
      const finalReportTotalRow = worksheet.addRow(summaryLabelRowValues);
      finalReportTotalRow.height = 26;
      
      const labelColumnCell = finalReportTotalRow.getCell(columns.length - 1);
      labelColumnCell.font = { bold: true, size: 10, color: { argb: 'FF0F172A' } };
      labelColumnCell.alignment = { horizontal: 'right', vertical: 'middle' };
      
      const numericalTotalSumCell = finalReportTotalRow.getCell(columns.length);
      numericalTotalSumCell.font = { bold: true, size: 11, color: { argb: 'FF0F172A' } };
      numericalTotalSumCell.alignment = { horizontal: 'right', vertical: 'middle' };
      numericalTotalSumCell.numFmt = '#,##0.00 "MAD"';
      numericalTotalSumCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF1F5F9' }
      };
      numericalTotalSumCell.border = {
        top: { style: 'thin', color: { argb: 'FF0F172A' } },
        bottom: { style: 'double', color: { argb: 'FF0F172A' } },
        left: { style: 'thin', color: { argb: 'CBD5E1' } },
        right: { style: 'thin', color: { argb: 'CBD5E1' } }
      };
    }
    
    // 7. AUTO-FIT COLUMN EXTENTS AND BUFFER SETTING VALUES MATRIX
    worksheet.columns.forEach((column) => {
      let evaluatedMaximumCharacterLength = 12;
      column.eachCell({ includeEmpty: true }, (cell) => {
        if (cell.row > 8) { // Only evaluate metrics below layout metadata scopes
          const derivedStringLength = cell.value ? String(cell.value).length : 0;
          if (derivedStringLength > evaluatedMaximumCharacterLength) {
            evaluatedMaximumCharacterLength = derivedStringLength;
          }
        }
      });
      column.width = Math.min(evaluatedMaximumCharacterLength + 5, 32);
    });
    
    // Write and download generated document stream parameters
    const documentBufferPayload = await workbook.xlsx.writeBuffer();
    const cleanOutputFileNameString = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    saveAs(new Blob([documentBufferPayload]), cleanOutputFileNameString);
    
    return true;
  } catch (error) {
    console.error('Excel layout compilation processing failure structural report:', error);
    throw error;
  }
};

// =============================================================================
// PROFESSIONAL PDF EXPORT - WITH CONDITIONAL TOTAL ROW
// =============================================================================

const exportToStyledPDF = async (title, rows, columns) => {
  if (!rows || rows.length === 0) {
    alert('Aucune donnée à exporter');
    return;
  }
  
  const companyInfo = getCompanyInfo();
  const showTotalRow = hasMonetaryColumns(columns);
  let logoBase64 = null;

  try {
    const logoResponse = await fetch('/logo.png');
    if (logoResponse.ok) {
      const imageBlob = await logoResponse.blob();
      logoBase64 = await new Promise((resolve) => {
        const fileReader = new FileReader();
        fileReader.onloadend = () => resolve(fileReader.result);
        fileReader.readAsDataURL(imageBlob);
      });
    }
  } catch (error) {
    console.warn("Logo path resolution passed to structural fallback layout logic.");
  }

  const translateStatus = (value, header) => {
    if (!value) return value;
    if (header === 'Statut vente') {
      const statusMap = { 'pending': 'En attente', 'confirmed': 'Confirmée', 'cancelled': 'Annulée' };
      return statusMap[value] || value;
    }
    if (header === 'Statut paiement') {
      const paymentMap = { 'paid': 'Payé', 'partial': 'Partiel', 'unpaid': 'Impayé' };
      return paymentMap[value] || value;
    }
    return value;
  };

  const totalAmount = rows.reduce((sum, row) => {
    let totalVal = 0;
    columns.forEach(col => {
      if (showTotalRow && ['Total (MAD)', 'Montant', 'TOTAL TTC', 'Total'].includes(col.header)) {
        const value = typeof col.accessor === 'function' ? col.accessor(row) : row[col.accessor];
        totalVal += parseFloat(value) || 0;
      }
    });
    return sum + totalVal;
  }, 0);

  const tableHeaders = columns.map(col => 
    `<th style="padding: 10px 12px; background: #0f172a; color: #ffffff; font-weight: 600; font-size: 11px; text-align: left; text-transform: uppercase; border-bottom: 2px solid #1e293b;">${col.header}</th>`
  ).join('');

  const tableRows = rows.map((row, idx) => {
    const bgStyle = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
    return `<tr style="background-color: ${bgStyle}; border-bottom: 1px solid #f1f5f9;">
      ${columns.map(col => {
        let value = typeof col.accessor === 'function' ? col.accessor(row) : row[col.accessor];
        value = translateStatus(value, col.header);
        
        let alignStyle = 'text-align: left;';
        if (typeof value === 'number' || (!isNaN(parseFloat(value)) && col.header.includes('MAD'))) {
          const num = parseFloat(value);
          if (!isNaN(num)) {
            value = num.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' MAD';
            alignStyle = 'text-align: right; font-variant-numeric: tabular-nums;';
          }
        }
        return `<td style="padding: 10px 12px; font-size: 11px; color: #334155; ${alignStyle}">${value !== undefined && value !== null ? value : '-'}</td>`;
      }).join('')}
    </tr>`;
  }).join('');

  // Build total section HTML only if we have monetary columns and total amount
  const totalSectionHtml = (showTotalRow && totalAmount > 0) ? `
    <div style="display: flex; justify-content: flex-end; margin-top: 20px;">
      <table style="width: 280px; border-collapse: collapse; font-size: 12px;">
        <tr style="border-top: 2px solid #0f172a;">
          <td style="padding: 12px 0; color: #0f172a; font-weight: 700; font-size: 13px;">TOTAL GENERAL</td>
          <td style="padding: 12px 0; text-align: right; color: #0f172a; font-weight: 700; font-size: 15px; font-variant-numeric: tabular-nums;">${totalAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD</td>
        </tr>
      </table>
    </div>
  ` : '';

  const element = document.createElement('div');
  element.innerHTML = `
    <div style="font-family: 'Helvetica Neue', 'Arial', sans-serif; background: #ffffff; padding: 40px; min-height: 100%;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #f1f5f9; padding-bottom: 24px; margin-bottom: 30px;">
        <div>
          ${logoBase64 ? `<img src="${logoBase64}" style="max-height: 155px; margin-bottom: 14px; display: block;" alt="Logo" />` : ''}
          <div style="font-size: 18px; font-weight: 700; color: #0f172a; letter-spacing: -0.5px; margin-bottom: 4px;">${companyInfo.name}</div>
          <div style="font-size: 11px; color: #64748b; line-height: 1.5; max-width: 320px;">${companyInfo.address}</div>
        </div>
        <div style="text-align: right; font-size: 11px; color: #64748b; line-height: 1.6; padding-top: 5px;">
          <div><strong style="color: #334155;">Tél:</strong> ${companyInfo.phone}</div>
          <div><strong style="color: #334155;">Email:</strong> ${companyInfo.email}</div>
          <div style="margin-top: 6px; padding-top: 6px; border-top: 1px dashed #e2e8f0; font-size: 10px; color: #94a3b8;">
            ICE: ${companyInfo.ice} &bull; RC: ${companyInfo.rc} &bull; Pat.: ${companyInfo.patente}
          </div>
        </div>
      </div>
      
      <div style="margin-bottom: 26px;">
        <h1 style="font-size: 22px; font-weight: 700; color: #0f172a; margin: 0 0 6px 0; letter-spacing: -0.5px;">${title}</h1>
        <div style="font-size: 11px; color: #64748b;">
          Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')} &bull; ${rows.length} entrées trouvées
        </div>
      </div>
      
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
        <thead>
          <tr>${tableHeaders}</tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
      
      ${totalSectionHtml}

      <div style="margin-top: 60px; padding-top: 16px; border-top: 1px solid #f1f5f9; text-align: center; font-size: 10px; color: #94a3b8;">
        Page 1 / 1 &bull; Document officiel de ${companyInfo.name}
      </div>
    </div>
  `;

  const opt = {
    margin: [0.4, 0.4, 0.4, 0.4],
    filename: `${title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`,
    image: { type: 'jpeg', quality: 0.99 },
    html2canvas: { scale: 2, letterRendering: true, useCORS: true },
    jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }
  };

  try {
    await html2pdf().set(opt).from(element).save();
  } catch (error) {
    console.error('PDF export error:', error);
    alert('Erreur lors de l\'export PDF.');
    throw error;
  }
};

// =============================================================================
// EXPORT MENU COMPONENT
// =============================================================================

export function ExportMenu({ title, rows, columns, dateField = 'date' }) {
  const [format, setFormat] = useState('pdf');
  const [filter, setFilter] = useState({ mode: 'all' });
  const [exporting, setExporting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const launch = (fmt) => {
    setFormat(fmt);
    setDialogOpen(true);
  };

  const doExport = async () => {
    setExporting(true);
    try {
      const filtered = applyDateFilter(rows, filter, dateField);
      if (filtered.length === 0) {
        alert('Aucune donnée à exporter après application du filtre');
        setExporting(false);
        setDialogOpen(false);
        return;
      }
      
      if (format === 'pdf') {
        await exportToStyledPDF(title, filtered, columns);
      } else {
        await exportToStyledExcel(title, filtered, columns);
      }
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setExporting(false);
      setDialogOpen(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200">
            <Download className="h-4 w-4" />
            Exporter
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuPortal>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="text-gray-500 font-semibold">
              <span className="flex items-center gap-2">
                <Download className="h-3 w-3" />
                Choisir le format
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {/* PDF Option */}
            <DropdownMenuPrimitive.Item
              onSelect={() => launch('pdf')}
              className={cn(
                "relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2.5 text-sm font-medium outline-none transition-all duration-200",
                "text-blue-700 hover:bg-blue-50 hover:text-blue-800 group"
              )}
            >
              <div className="flex items-center gap-3 w-full">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 text-blue-600 group-hover:bg-blue-200 group-hover:text-blue-700 transition-all duration-200">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="flex flex-col flex-1">
                  <span>PDF Document</span>
                  <span className="text-xs text-blue-500/70 group-hover:text-blue-600">Export PDF</span>
                </div>
              </div>
            </DropdownMenuPrimitive.Item>
            
            {/* Excel Option */}
            <DropdownMenuPrimitive.Item
              onSelect={() => launch('excel')}
              className={cn(
                "relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2.5 text-sm font-medium outline-none transition-all duration-200",
                "text-green-700 hover:bg-green-50 hover:text-green-800 group mt-1"
              )}
            >
              <div className="flex items-center gap-3 w-full">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-100 text-green-600 group-hover:bg-green-200 group-hover:text-green-700 transition-all duration-200">
                  <FileSpreadsheet className="h-4 w-4" />
                </div>
                <div className="flex flex-col flex-1">
                  <span>Excel Document</span>
                  <span className="text-xs text-green-500/70 group-hover:text-green-600">Export Excel / XLSX</span>
                </div>
              </div>
            </DropdownMenuPrimitive.Item>
          </DropdownMenuContent>
        </DropdownMenuPortal>
      </DropdownMenu>

      {/* Filter Dialog Container */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-800">
              <div className="p-1.5 rounded-lg bg-blue-100 text-blue-600">
                <Filter className="h-4 w-4" />
              </div>
              Filtrer la période
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Type de filtre</Label>
              <Select value={filter.mode} onValueChange={(v) => setFilter({ ...filter, mode: v })}>
                <SelectItem value="all">Toutes les données</SelectItem>
                <SelectItem value="day">Un jour précis</SelectItem>
                <SelectItem value="month">Un mois</SelectItem>
                <SelectItem value="range">Plage de dates</SelectItem>
              </Select>
            </div>

            {filter.mode === 'day' && (
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={filter.day || ''} onChange={(e) => setFilter({ ...filter, day: e.target.value })} />
              </div>
            )}

            {filter.mode === 'month' && (
              <div className="space-y-2">
                <Label>Mois</Label>
                <Input type="month" value={filter.month || ''} onChange={(e) => setFilter({ ...filter, month: e.target.value })} />
              </div>
            )}

            {filter.mode === 'range' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Du</Label>
                  <Input type="date" value={filter.from || ''} onChange={(e) => setFilter({ ...filter, from: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Au</Label>
                  <Input type="date" value={filter.to || ''} onChange={(e) => setFilter({ ...filter, to: e.target.value })} />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={exporting} className="border-gray-300 hover:bg-gray-50">
              Annuler
            </Button>
            <Button 
              onClick={doExport} 
              disabled={exporting}
              className={format === 'pdf' 
                ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800" 
                : "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
              }
            >
              {exporting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Export...
                </div>
              ) : (
                `Télécharger en ${format.toUpperCase()}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

import React from 'react';
export { applyDateFilter, exportToStyledExcel, exportToStyledPDF };