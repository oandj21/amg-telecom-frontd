// Settings.jsx
import { useState, useEffect } from 'react';

// ==================== STYLES ====================
const styles = `
  .settings-page-header {
    margin-bottom: 1.5rem;
  }
  
  .settings-title {
    font-size: 1.5rem;
    font-weight: 700;
    letter-spacing: -0.025em;
    line-height: 1.25;
    color: #111827;
  }
  
  @media (min-width: 768px) {
    .settings-title {
      font-size: 1.875rem;
    }
  }
  
  .settings-subtitle {
    font-size: 0.875rem;
    color: #6b7280;
    margin-top: 0.25rem;
  }
  
  .settings-card {
    background: white;
    border-radius: 0.5rem;
    border: 1px solid #e5e7eb;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    max-width: 42rem;
    margin-bottom: 1.5rem;
  }
  
  .settings-card-header {
    padding: 1rem 1.25rem;
    border-bottom: 1px solid #f3f4f6;
  }
  
  .settings-card-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: #111827;
    margin: 0;
  }
  
  .settings-card-body {
    padding: 1.25rem;
    display: grid;
    gap: 1rem;
  }
  
  .settings-form-group {
    display: grid;
    gap: 0.25rem;
  }
  
  .settings-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #111827;
  }
  
  .settings-input {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    background: white;
    color: #111827;
    outline: none;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }
  
  .settings-input:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
  }
  
  .settings-input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background-color: #f9fafb;
  }
  
  .settings-grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }
  
  .settings-hint {
    font-size: 0.75rem;
    color: #6b7280;
  }
  
  .settings-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 0.875rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
    border: none;
    font-family: inherit;
  }
  
  .settings-btn-primary {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
  }
  
  .settings-btn-primary:hover {
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  }
  
  .settings-success {
    background-color: #d1fae5;
    color: #059669;
    padding: 0.5rem;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    text-align: center;
  }
  
  .settings-error {
    background-color: #fee2e2;
    color: #dc2626;
    padding: 0.5rem;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    text-align: center;
  }
`;

const API_URL = window.REACT_APP_API_URL || "http://amg-telecom-backd-production.up.railway.app/api";

// Helper to get company info from localStorage
const getCompanyInfo = () => {
  const saved = localStorage.getItem('company_info');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      return {
        name: 'GPS Entreprise',
        address: '123 Avenue Mohammed V, Casablanca, Maroc',
        phone: '+212 5XX XXX XXX',
        email: 'contact@gpsentreprise.ma',
        ice: '123456789012345',
        rc: '123456',
        patente: '12345678',
        tax_number: '12345678',
        bank_name: 'Banque Populaire',  // NEW
        rib: '011 780 0000762100016378 22'  // NEW
      };
    }
  }
  return {
    name: 'GPS Entreprise',
    address: '123 Avenue Mohammed V, Casablanca, Maroc',
    phone: '+212 5XX XXX XXX',
    email: 'contact@gpsentreprise.ma',
    ice: '123456789012345',
    rc: '123456',
    patente: '12345678',
    tax_number: '12345678',
    bank_name: 'Banque Populaire',  // NEW
    rib: '011 780 0000762100016378 22'  // NEW
  };
};
// Hook to use company info
export const useCompanyInfo = () => {
  const [companyInfo, setCompanyInfo] = useState(getCompanyInfo());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

 const saveCompanyInfo = async (data) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/settings/company`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            // If API fails, still save to localStorage as fallback
            console.warn('API save failed, saving to localStorage only');
            localStorage.setItem('company_info', JSON.stringify(data));
            setCompanyInfo(data);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
            return data;
        }
        
        const result = await response.json();
        const updatedInfo = result.company_info || data;
        setCompanyInfo(updatedInfo);
        localStorage.setItem('company_info', JSON.stringify(updatedInfo));
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        return updatedInfo;
    } catch (err) {
        // Fallback: save to localStorage even if API fails
        console.error('Error saving to API:', err);
        localStorage.setItem('company_info', JSON.stringify(data));
        setCompanyInfo(data);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        return data;
    } finally {
        setLoading(false);
    }
};

  const updateCompanyInfo = (updates) => {
    const newInfo = { ...companyInfo, ...updates };
    setCompanyInfo(newInfo);
    localStorage.setItem('company_info', JSON.stringify(newInfo));
    return newInfo;
  };

  return {
    companyInfo,
    setCompanyInfo: updateCompanyInfo,
    saveCompanyInfo,
    loading,
    error,
    success
  };
};

const PageHeader = ({ title, subtitle }) => (
  <div className="settings-page-header">
    <h1 className="settings-title">{title}</h1>
    {subtitle && <p className="settings-subtitle">{subtitle}</p>}
  </div>
);

const Card = ({ children, className = '' }) => (
  <div className={`settings-card ${className}`}>{children}</div>
);

const Settings = () => {
  const { companyInfo, setCompanyInfo, saveCompanyInfo, loading, error, success } = useCompanyInfo();
  const [formData, setFormData] = useState(companyInfo);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setFormData(companyInfo);
  }, [companyInfo]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    const result = await saveCompanyInfo(formData);
    if (result) {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setFormData(companyInfo);
    setIsEditing(false);
  };

  return (
    <>
      <style>{styles}</style>
      
      <PageHeader title="Paramètres" subtitle="Informations de l'entreprise pour les factures" />
      
      <Card>
        <div className="settings-card-header">
          <h3 className="settings-card-title">Informations de la société</h3>
        </div>
        <div className="settings-card-body">
          {success && (
            <div className="settings-success">
              ✓ Informations sauvegardées avec succès
            </div>
          )}
          {error && (
            <div className="settings-error">
              ⚠️ {error}
            </div>
          )}
          
          <div className="settings-form-group">
            <label className="settings-label">Nom de l'entreprise</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={!isEditing}
              className="settings-input"
            />
          </div>
          
          <div className="settings-form-group">
            <label className="settings-label">Adresse</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              disabled={!isEditing}
              className="settings-input"
            />
          </div>
          
          <div className="settings-grid-2">
            <div className="settings-form-group">
              <label className="settings-label">Téléphone</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={!isEditing}
                className="settings-input"
              />
            </div>
            <div className="settings-form-group">
              <label className="settings-label">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={!isEditing}
                className="settings-input"
              />
            </div>
          </div>
          
          <div className="settings-grid-2">
            <div className="settings-form-group">
              <label className="settings-label">ICE</label>
              <input
                type="text"
                name="ice"
                value={formData.ice}
                onChange={handleChange}
                disabled={!isEditing}
                className="settings-input"
              />
            </div>
            <div className="settings-form-group">
              <label className="settings-label">RC</label>
              <input
                type="text"
                name="rc"
                value={formData.rc}
                onChange={handleChange}
                disabled={!isEditing}
                className="settings-input"
              />
            </div>
          </div>
          
          <div className="settings-grid-2">
            <div className="settings-form-group">
              <label className="settings-label">Patente</label>
              <input
                type="text"
                name="patente"
                value={formData.patente}
                onChange={handleChange}
                disabled={!isEditing}
                className="settings-input"
              />
            </div>
            <div className="settings-form-group">
              <label className="settings-label">Identifiant Fiscal</label>
              <input
                type="text"
                name="tax_number"
                value={formData.tax_number}
                onChange={handleChange}
                disabled={!isEditing}
                className="settings-input"
              />
            </div>
          </div>
          <div className="settings-grid-2">
  <div className="settings-form-group">
    <label className="settings-label">Nom de la banque</label>
    <input
      type="text"
      name="bank_name"
      value={formData.bank_name || ''}
      onChange={handleChange}
      disabled={!isEditing}
      className="settings-input"
      placeholder="Ex: Banque Populaire, BMCE, Attijari..."
    />
  </div>
  <div className="settings-form-group">
    <label className="settings-label">RIB</label>
    <input
      type="text"
      name="rib"
      value={formData.rib || ''}
      onChange={handleChange}
      disabled={!isEditing}
      className="settings-input"
      placeholder="RIB: 011 780 0000762100016378 22"
    />
  </div>
</div>

          <p className="settings-hint">
            Ces informations apparaissent sur les factures PDF et les impressions.
          </p>
          
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            {!isEditing ? (
              <button onClick={() => setIsEditing(true)} className="settings-btn settings-btn-primary">
                ✏️ Modifier
              </button>
            ) : (
              <>
                <button onClick={handleCancel} className="settings-btn" style={{ background: '#e5e7eb', color: '#111827' }}>
                  Annuler
                </button>
                <button onClick={handleSave} disabled={loading} className="settings-btn settings-btn-primary">
                  {loading ? 'Sauvegarde...' : '✓ Sauvegarder'}
                </button>
              </>
            )}
          </div>
        </div>
      </Card>
    </>
  );
};

export default Settings;
