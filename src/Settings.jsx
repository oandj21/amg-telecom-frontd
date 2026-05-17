// Settings.jsx - Simplified Version
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchCompanyInfo, 
  updateCompanyInfo,
  selectCompanyInfo,
  selectSettingsLoading,
  selectSettingsError,
  selectSettingsSuccess,
  clearSettingsSuccess,
  clearSettingsError
} from './Store/store';

// ==================== SIMPLE STYLES ====================
const styles = `
  .settings-simple-container {
    padding: 1.5rem;
    max-width: 800px;
    margin: 0 auto;
  }
  
  .settings-simple-header {
    margin-bottom: 1.5rem;
  }
  
  .settings-simple-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0;
  }
  
  .settings-simple-subtitle {
    font-size: 0.875rem;
    color: #6b7280;
    margin-top: 0.25rem;
  }
  
  .settings-simple-card {
    background: white;
    border-radius: 0.5rem;
    border: 1px solid #e5e7eb;
    margin-bottom: 1rem;
  }
  
  .settings-simple-card-header {
    padding: 1rem 1.25rem;
    border-bottom: 1px solid #e5e7eb;
    background: #f9fafb;
  }
  
  .settings-simple-card-title {
    font-size: 1rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0;
  }
  
  .settings-simple-card-body {
    padding: 1.25rem;
  }
  
  .settings-simple-field {
    margin-bottom: 1rem;
  }
  
  .settings-simple-label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
    margin-bottom: 0.25rem;
  }
  
  .settings-simple-input {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    background: white;
  }
  
  .settings-simple-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }
  
  .settings-simple-input:disabled {
    background: #f9fafb;
    color: #6b7280;
  }
  
  .settings-simple-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }
  
  .settings-simple-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
    margin-top: 1.5rem;
    padding-top: 1rem;
    border-top: 1px solid #e5e7eb;
  }
  
  .settings-simple-btn {
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    border: none;
    transition: all 0.2s;
  }
  
  .settings-simple-btn-primary {
    background: #3b82f6;
    color: white;
  }
  
  .settings-simple-btn-primary:hover {
    background: #2563eb;
  }
  
  .settings-simple-btn-secondary {
    background: #e5e7eb;
    color: #374151;
  }
  
  .settings-simple-btn-secondary:hover {
    background: #d1d5db;
  }
  
  .settings-simple-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .settings-simple-alert {
    padding: 0.75rem;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    margin-bottom: 1rem;
  }
  
  .settings-simple-alert-success {
    background: #d1fae5;
    color: #065f46;
    border: 1px solid #a7f3d0;
  }
  
  .settings-simple-alert-error {
    background: #fee2e2;
    color: #991b1b;
    border: 1px solid #fecaca;
  }
  
  .settings-simple-alert-info {
    background: #dbeafe;
    color: #1e40af;
    border: 1px solid #bfdbfe;
  }
  
  .settings-simple-hint {
    font-size: 0.7rem;
    color: #6b7280;
    margin-top: 0.25rem;
  }
  
  @media (max-width: 640px) {
    .settings-simple-container {
      padding: 1rem;
    }
    .settings-simple-row {
      grid-template-columns: 1fr;
      gap: 0.75rem;
    }
  }
`;

const Settings = () => {
  const dispatch = useDispatch();
  const companyInfoFromRedux = useSelector(selectCompanyInfo);
  const loading = useSelector(selectSettingsLoading);
  const error = useSelector(selectSettingsError);
  const success = useSelector(selectSettingsSuccess);
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    ice: '',
    rc: '',
    patente: '',
    tax_number: '',
    bank_name: '',
    rib: '',
    cnss: ''
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!companyInfoFromRedux) {
      dispatch(fetchCompanyInfo());
    }
  }, [dispatch, companyInfoFromRedux]);

  useEffect(() => {
    if (companyInfoFromRedux) {
      setFormData(companyInfoFromRedux);
    }
  }, [companyInfoFromRedux]);

  useEffect(() => {
    if (success) {
      setTimeout(() => dispatch(clearSettingsSuccess()), 3000);
    }
  }, [success, dispatch]);

  useEffect(() => {
    if (error) {
      setTimeout(() => dispatch(clearSettingsError()), 5000);
    }
  }, [error, dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!formData.name?.trim()) {
      return;
    }
    try {
      await dispatch(updateCompanyInfo(formData)).unwrap();
      setIsEditing(false);
    } catch (err) {
      console.error('Save failed:', err);
    }
  };

  const handleCancel = () => {
    setFormData(companyInfoFromRedux || {});
    setIsEditing(false);
  };

  if (!companyInfoFromRedux && loading) {
    return (
      <>
        <style>{styles}</style>
        <div className="settings-simple-container">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div>Chargement...</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      
      <div className="settings-simple-container">
        <div className="settings-simple-header">
          <h1 className="settings-simple-title">Paramètres</h1>
          <p className="settings-simple-subtitle">Informations de l'entreprise</p>
        </div>
        
        <div className="settings-simple-card">
          <div className="settings-simple-card-header">
            <h3 className="settings-simple-card-title">Informations générales</h3>
          </div>
          
          <div className="settings-simple-card-body">
            {success && (
              <div className="settings-simple-alert settings-simple-alert-success">
                ✓ Informations sauvegardées
              </div>
            )}
            
            {error && (
              <div className="settings-simple-alert settings-simple-alert-error">
                ⚠️ {error}
              </div>
            )}
            
            {!isEditing && !success && (
              <div className="settings-simple-alert settings-simple-alert-info">
                ℹ️ Cliquez sur "Modifier" pour changer les informations
              </div>
            )}
            
            <div className="settings-simple-field">
              <label className="settings-simple-label">Nom de l'entreprise *</label>
              <input
                type="text"
                name="name"
                value={formData.name || ''}
                onChange={handleChange}
                disabled={!isEditing}
                className="settings-simple-input"
              />
            </div>
            
            <div className="settings-simple-field">
              <label className="settings-simple-label">Adresse</label>
              <input
                type="text"
                name="address"
                value={formData.address || ''}
                onChange={handleChange}
                disabled={!isEditing}
                className="settings-simple-input"
              />
            </div>
            
            <div className="settings-simple-row">
              <div className="settings-simple-field">
                <label className="settings-simple-label">Téléphone</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="settings-simple-input"
                />
              </div>
              <div className="settings-simple-field">
                <label className="settings-simple-label">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="settings-simple-input"
                />
              </div>
            </div>
            
            <div className="settings-simple-row">
              <div className="settings-simple-field">
                <label className="settings-simple-label">ICE</label>
                <input
                  type="text"
                  name="ice"
                  value={formData.ice || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="settings-simple-input"
                />
              </div>
              <div className="settings-simple-field">
                <label className="settings-simple-label">RC</label>
                <input
                  type="text"
                  name="rc"
                  value={formData.rc || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="settings-simple-input"
                />
              </div>
            </div>
            
            <div className="settings-simple-row">
              <div className="settings-simple-field">
                <label className="settings-simple-label">Patente</label>
                <input
                  type="text"
                  name="patente"
                  value={formData.patente || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="settings-simple-input"
                />
              </div>
              <div className="settings-simple-field">
                <label className="settings-simple-label">Identifiant Fiscal</label>
                <input
                  type="text"
                  name="tax_number"
                  value={formData.tax_number || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="settings-simple-input"
                />
              </div>
            </div>
            
            <div className="settings-simple-row">
              <div className="settings-simple-field">
                <label className="settings-simple-label">Banque</label>
                <input
                  type="text"
                  name="bank_name"
                  value={formData.bank_name || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="settings-simple-input"
                  placeholder="Nom de la banque"
                />
              </div>
              <div className="settings-simple-field">
                <label className="settings-simple-label">RIB</label>
                <input
                  type="text"
                  name="rib"
                  value={formData.rib || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="settings-simple-input"
                  placeholder="Numéro RIB"
                />
              </div>
            </div>
            
            <div className="settings-simple-field">
              <label className="settings-simple-label">CNSS</label>
              <input
                type="text"
                name="cnss"
                value={formData.cnss || ''}
                onChange={handleChange}
                disabled={!isEditing}
                className="settings-simple-input"
                placeholder="Numéro CNSS"
              />
            </div>
            
            <div className="settings-simple-actions">
              {!isEditing ? (
                <button onClick={() => setIsEditing(true)} className="settings-simple-btn settings-simple-btn-primary">
                  ✏️ Modifier
                </button>
              ) : (
                <>
                  <button onClick={handleCancel} className="settings-simple-btn settings-simple-btn-secondary">
                    Annuler
                  </button>
                  <button onClick={handleSave} disabled={loading} className="settings-simple-btn settings-simple-btn-primary">
                    {loading ? 'Sauvegarde...' : '✓ Sauvegarder'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Settings;