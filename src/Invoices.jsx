import { useMemo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Printer, Download, FileText } from 'lucide-react';
import { ExportMenu } from './ExportMenu';
import {
  selectSales,
  selectSalesLoading,
  fetchSales
} from './Store/store';

// ==================== STYLES ====================
const styles = `
  .invoices-page-header {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  
  @media (min-width: 768px) {
    .invoices-page-header {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
    }
  }
  
  .invoices-title {
    font-size: 1.5rem;
    font-weight: 700;
    letter-spacing: -0.025em;
    line-height: 1.25;
    color: #111827;
  }
  
  @media (min-width: 768px) {
    .invoices-title {
      font-size: 1.875rem;
    }
  }
  
  .invoices-subtitle {
    font-size: 0.875rem;
    color: #6b7280;
    margin-top: 0.25rem;
  }
  
  .invoices-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .invoices-card {
    background: white;
    border-radius: 0.5rem;
    border: 1px solid #e5e7eb;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  }
  
  .invoices-table-container {
    position: relative;
    width: 100%;
    overflow: auto;
  }
  
  .invoices-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
  }
  
  .invoices-table thead tr {
    border-bottom: 1px solid #e5e7eb;
  }
  
  .invoices-table th {
    height: 3rem;
    padding: 0 1rem;
    text-align: left;
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: uppercase;
    color: #9ca3af;
    vertical-align: middle;
  }
  
  .invoices-table tbody tr {
    border-bottom: 1px solid #f3f4f6;
    transition: background-color 0.15s ease;
  }
  
  .invoices-table tbody tr:hover {
    background-color: #f9fafb;
  }
  
  .invoices-table tbody tr:last-child {
    border-bottom: 0;
  }
  
  .invoices-table td {
    padding: 1rem;
    vertical-align: middle;
  }
  
  .invoices-table .font-mono {
    font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
    font-size: 0.75rem;
  }
  
  .invoices-table .font-semibold {
    font-weight: 600;
  }
  
  .invoices-table .text-right {
    text-align: right;
  }
  
  .invoices-table .w-32 {
    width: 8rem;
  }
  
  .invoices-actions-cell {
    display: flex;
    gap: 0.25rem;
    justify-content: flex-end;
  }
  
  .invoices-empty {
    text-align: center;
    color: #9ca3af;
    padding: 3rem 0;
    font-size: 0.875rem;
  }
  
  .invoices-empty-icon {
    width: 2rem;
    height: 2rem;
    margin: 0 auto 0.5rem;
    opacity: 0.5;
  }
  
  .invoices-btn-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.375rem;
    border-radius: 0.5rem;
    background: transparent;
    border: none;
    cursor: pointer;
    color: #111827;
    transition: background-color 0.15s ease;
  }
  
  .invoices-btn-icon:hover {
    background-color: #f3f4f6;
  }
  
  .invoices-btn-icon:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px white, 0 0 0 4px #3b82f6;
  }
  
  .invoices-btn-icon svg {
    width: 1rem;
    height: 1rem;
  }
  
  .invoices-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.125rem 0.5rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 500;
    line-height: 1rem;
  }
  
  .invoices-badge-success {
    background-color: #f0fdf4;
    color: #16a34a;
    border: 1px solid #86efac;
  }
  
  .invoices-badge-warning {
    background-color: #fefce8;
    color: #ca8a04;
    border: 1px solid #fde047;
  }
  
  .invoices-badge-secondary {
    background-color: #f3f4f6;
    color: #4b5563;
    border: 1px solid #e5e7eb;
  }
  
  .invoices-loading {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 3rem;
  }
  
  .invoices-spinner {
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
`;

// ==================== COMPONENTS ====================
const PageHeader = ({ title, subtitle, actions }) => (
  <div className="invoices-page-header">
    <div>
      <h1 className="invoices-title">{title}</h1>
      {subtitle && <p className="invoices-subtitle">{subtitle}</p>}
    </div>
    {actions && <div className="invoices-actions">{actions}</div>}
  </div>
);

const Card = ({ children, className = '' }) => (
  <div className={`invoices-card ${className}`}>{children}</div>
);

const Badge = ({ children, variant = 'default' }) => {
  const variantClass = variant === 'success' ? 'invoices-badge-success' :
                       variant === 'warning' ? 'invoices-badge-warning' :
                       'invoices-badge-secondary';
  return <span className={`invoices-badge ${variantClass}`}>{children}</span>;
};

const LoadingSpinner = () => (
  <div className="invoices-loading">
    <div className="invoices-spinner"></div>
  </div>
);

// ==================== MAIN COMPONENT ====================
const Invoices = () => {
  const dispatch = useDispatch();
  const sales = useSelector(selectSales);
  const salesLoading = useSelector(selectSalesLoading);

  useEffect(() => {
    dispatch(fetchSales());
  }, [dispatch]);

  // Format sale data for invoice display
  const formattedSales = useMemo(() => {
    if (!sales || !Array.isArray(sales)) return [];
    return sales.map(sale => ({
      ...sale,
      invoiceNumber: `INV-${sale.id}`,
      clientName: sale.client?.nom || sale.clientName || 'Client inconnu',
      items: sale.items || sale.produits || [],
      subtotal: sale.subtotal || (sale.total / 1.2) || 0,
      tva: sale.tva || (sale.total - (sale.total / 1.2)) || 0,
      total: sale.total || 0,
      paymentStatus: sale.status === 'confirmed' ? 'Payé' : sale.status === 'pending' ? 'En attente' : sale.status || 'Inconnu',
      date: sale.created_at || sale.date || new Date().toISOString()
    }));
  }, [sales]);

  const printInvoice = (sale) => {
    const win = window.open();
    const companyName = "GPS Entreprise";
    const companyAddress = "Votre adresse ici";
    const companyPhone = "Votre téléphone";
    
    const formatPrice = (value) => {
      const num = typeof value === 'number' ? value : parseFloat(value) || 0;
      return num.toFixed(2);
    };
    
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Facture ${sale.invoiceNumber}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              font-size: 14px;
            }
            .invoice-header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #333;
            }
            .company-name {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .invoice-title {
              font-size: 18px;
              margin-top: 20px;
            }
            .invoice-info {
              display: flex;
              justify-content: space-between;
              margin-bottom: 30px;
            }
            .client-info {
              margin-bottom: 20px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f2f2f2;
            }
            .text-right {
              text-align: right;
            }
            .totals {
              width: 300px;
              margin-left: auto;
            }
            .totals table {
              width: 100%;
            }
            .totals td {
              border: none;
              padding: 4px;
            }
            .footer {
              text-align: center;
              margin-top: 50px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="invoice-header">
            <div class="company-name">${companyName}</div>
            <div>${companyAddress}</div>
            <div>${companyPhone}</div>
            <div class="invoice-title">FACTURE ${sale.invoiceNumber}</div>
          </div>
          
          <div class="invoice-info">
            <div>
              <strong>Date:</strong> ${new Date(sale.date).toLocaleString('fr-FR')}
            </div>
            <div>
              <strong>Statut:</strong> ${sale.paymentStatus}
            </div>
          </div>
          
          <div class="client-info">
            <strong>Client:</strong><br>
            ${sale.clientName}
          </div>
          
          <table>
            <thead>
              <tr><th>Produit</th><th>Quantité</th><th>Prix unitaire</th><th>Total</th></tr>
            </thead>
            <tbody>
              ${(sale.items || []).map(item => {
                const qty = item.quantity || item.pivot?.quantite || item.quantite || 0;
                const price = item.unitPrice || item.prix || item.pivot?.prix || 0;
                const total = (parseFloat(price) || 0) * (parseFloat(qty) || 0);
                return `
                  <tr>
                    <td>${item.name || item.nom || 'Produit'}</td>
                    <td>${qty}</td>
                    <td>${formatPrice(price)} MAD</td>
                    <td class="text-right">${formatPrice(total)} MAD</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          
          <div class="totals">
            <table>
              <tr><td>Sous-total</td><td class="text-right">${formatPrice(sale.subtotal)} MAD</td></tr>
              <tr><td>TVA 20%</td><td class="text-right">${formatPrice(sale.tva)} MAD</td></tr>
              <tr style="font-weight: bold;"><td>TOTAL</td><td class="text-right">${formatPrice(sale.total)} MAD</td></tr>
            </table>
          </div>
          
          <div class="footer">
            Merci de votre confiance<br>
            ${companyName} - GPS Tracking Solutions
          </div>
        </body>
      </html>
    `);
    win.document.close();
    win.print();
  };

  const statusBadgeVariant = (status) => {
    if (status === 'Payé') return 'success';
    if (status === 'En attente') return 'warning';
    return 'secondary';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR');
    } catch {
      return '-';
    }
  };

  const getTotalRevenue = () => {
    if (!formattedSales || !Array.isArray(formattedSales)) return 0;
    return formattedSales.reduce((sum, sale) => sum + (parseFloat(sale.total) || 0), 0);
  };

  if (salesLoading && formattedSales.length === 0) {
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
      
      <PageHeader
        title="Factures"
        subtitle={`${formattedSales.length} facture${formattedSales.length > 1 ? 's' : ''} · ${getTotalRevenue().toFixed(0)} MAD total`}
        actions={
          <ExportMenu 
            title="Liste des factures" 
            rows={formattedSales} 
            columns={[
              { header: 'N° Facture', accessor: s => s.invoiceNumber },
              { header: 'Date', accessor: s => formatDate(s.date) },
              { header: 'Client', accessor: s => s.clientName },
              { header: 'Articles', accessor: s => s.items?.length || 0 },
              { header: 'Sous-total (MAD)', accessor: s => (parseFloat(s.subtotal) || 0).toFixed(2) },
              { header: 'TVA (MAD)', accessor: s => (parseFloat(s.tva) || 0).toFixed(2) },
              { header: 'Total (MAD)', accessor: s => (parseFloat(s.total) || 0).toFixed(2) },
              { header: 'Statut', accessor: s => s.paymentStatus },
            ]} 
          />
        }
      />
      
      <Card>
        <div className="invoices-table-container">
          <table className="invoices-table">
            <thead>
              <tr>
                <th>N° Facture</th>
                <th>Date</th>
                <th>Client</th>
                <th className="text-right">Total</th>
                <th>Statut</th>
                <th className="w-32"></th>
              </tr>
            </thead>
            <tbody>
              {formattedSales.map((sale) => (
                <tr key={sale.id}>
                  <td className="font-mono">{sale.invoiceNumber}</td>
                  <td>{formatDate(sale.date)}</td>
                  <td>{sale.clientName}</td>
                  <td className="text-right font-semibold">
                    {(typeof sale.total === 'number' ? sale.total : parseFloat(sale.total) || 0).toFixed(2)} MAD
                  </td>
                  <td>
                    <Badge variant={statusBadgeVariant(sale.paymentStatus)}>
                      {sale.paymentStatus}
                    </Badge>
                  </td>
                  <td>
                    <div className="invoices-actions-cell">
                      <button onClick={() => printInvoice(sale)} className="invoices-btn-icon" title="Imprimer">
                        <Printer size={16} />
                      </button>
                      <button onClick={() => printInvoice(sale)} className="invoices-btn-icon" title="Télécharger PDF">
                        <Download size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {formattedSales.length === 0 && (
                <tr>
                  <td colSpan={6} className="invoices-empty">
                    <FileText className="invoices-empty-icon" />
                    Aucune facture — créez une vente
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
};

export default Invoices;