// Profile.jsx - Styled like Users.jsx
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  User, Mail, Lock, Save, Key, AlertCircle, CheckCircle, 
  Shield, Calendar, LogOut, Smartphone, Globe, Bell, 
  ShieldCheck, UserCheck, Activity, Star, Settings, 
  Edit2, X, Eye, EyeOff, TrendingUp, Crown, Zap
} from 'lucide-react';
import { updateProfile, changePassword, updateAuthUser } from './Store/store';

// ==================== STYLES ====================
const styles = `
  /* Base Layout */
  .profile-page-container {
    padding: 1rem;
  }
  
  @media (min-width: 768px) {
    .profile-page-container {
      padding: 1.5rem;
    }
  }
  
  .profile-page-header {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 2rem;
  }
  
  @media (min-width: 768px) {
    .profile-page-header {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
    }
  }
  
  .profile-title-section {
    flex: 1;
  }
  
  .profile-title {
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
    .profile-title {
      font-size: 2rem;
    }
  }
  
  .profile-subtitle {
    font-size: 0.875rem;
    color: #64748b;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  
  .profile-subtitle-badge {
    background: #f1f5f9;
    padding: 0.25rem 0.75rem;
    border-radius: 2rem;
    font-size: 0.75rem;
    font-weight: 500;
    color: #475569;
  }
  
  .profile-stats-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  
  @media (min-width: 640px) {
    .profile-stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  
  @media (min-width: 1024px) {
    .profile-stats-grid {
      grid-template-columns: repeat(4, 1fr);
    }
  }
  
  .profile-stat-card {
    background: white;
    border-radius: 1rem;
    padding: 1.25rem;
    border: 1px solid #e2e8f0;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
  }
  
  .profile-stat-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  }
  
  .profile-stat-card-primary::before {
    background: linear-gradient(90deg, #3b82f6, #06b6d4);
  }
  
  .profile-stat-card-success::before {
    background: linear-gradient(90deg, #10b981, #34d399);
  }
  
  .profile-stat-card-warning::before {
    background: linear-gradient(90deg, #f59e0b, #fbbf24);
  }
  
  .profile-stat-card-info::before {
    background: linear-gradient(90deg, #8b5cf6, #a78bfa);
  }
  
  .profile-stat-icon-wrapper {
    width: 3rem;
    height: 3rem;
    border-radius: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
    margin-bottom: 1rem;
  }
  
  .profile-stat-icon-wrapper svg {
    width: 1.5rem;
    height: 1.5rem;
  }
  
  .profile-stat-icon-primary svg { color: #3b82f6; }
  .profile-stat-icon-success svg { color: #10b981; }
  .profile-stat-icon-warning svg { color: #f59e0b; }
  .profile-stat-icon-info svg { color: #8b5cf6; }
  
  .profile-stat-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }
  
  .profile-stat-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #64748b;
    margin-bottom: 0.5rem;
  }
  
  .profile-stat-value {
    font-size: 2rem;
    font-weight: 800;
    color: #0f172a;
    line-height: 1;
  }
  
  .profile-stat-trend {
    font-size: 0.75rem;
    color: #10b981;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }
  
  /* Cards */
  .profile-card {
    background: white;
    border-radius: 1rem;
    border: 1px solid #e2e8f0;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
    overflow: hidden;
  }
  
  .profile-card:hover {
    box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.08);
  }
  
  .profile-card-header {
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid #e2e8f0;
    background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
  }
  
  .profile-card-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: #0f172a;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .profile-card-description {
    font-size: 0.75rem;
    color: #64748b;
    margin-top: 0.25rem;
  }
  
  /* Form Styles */
  .profile-form-group {
    display: grid;
    gap: 0.5rem;
    margin-bottom: 1.25rem;
  }
  
  .profile-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #0f172a;
  }
  
  .profile-label-required::after {
    content: '*';
    color: #ef4444;
    margin-left: 0.25rem;
  }
  
  .profile-input-wrapper {
    position: relative;
  }
  
  .profile-input-icon {
    position: absolute;
    left: 0.875rem;
    top: 50%;
    transform: translateY(-50%);
    width: 1rem;
    height: 1rem;
    color: #94a3b8;
    pointer-events: none;
  }
  
  .profile-input {
    width: 100%;
    padding: 0.625rem 0.875rem 0.625rem 2.5rem;
    border: 1px solid #e2e8f0;
    border-radius: 0.75rem;
    font-size: 0.875rem;
    background: white;
    color: #0f172a;
    outline: none;
    transition: all 0.2s ease;
  }
  
  .profile-input:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  .profile-input-disabled {
    background-color: #f8fafc;
    color: #64748b;
    cursor: not-allowed;
  }
  
  /* Button Styles */
  .profile-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.625rem 1.25rem;
    border-radius: 0.75rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
    font-family: inherit;
  }
  
  .profile-btn-primary {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  }
  
  .profile-btn-primary:hover:not(:disabled) {
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }
  
  .profile-btn-success {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
  }
  
  .profile-btn-success:hover:not(:disabled) {
    background: linear-gradient(135deg, #059669 0%, #047857 100%);
    transform: translateY(-1px);
  }
  
  .profile-btn-outline {
    background: white;
    border: 1px solid #e2e8f0;
    color: #0f172a;
  }
  
  .profile-btn-outline:hover:not(:disabled) {
    background: #f8fafc;
    border-color: #cbd5e1;
  }
  
  .profile-btn-danger {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    color: white;
  }
  
  .profile-btn-danger:hover:not(:disabled) {
    background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  }
  
  .profile-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .profile-btn-icon {
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
  
  .profile-btn-icon:hover {
    background-color: #f1f5f9;
    color: #0f172a;
  }
  
  .profile-button-group {
    display: flex;
    gap: 0.75rem;
    margin-top: 0.5rem;
  }
  
  /* Badge Styles */
  .profile-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.25rem 0.75rem;
    border-radius: 2rem;
    font-size: 0.75rem;
    font-weight: 500;
    line-height: 1rem;
  }
  
  .profile-badge-success {
    background-color: #f0fdf4;
    color: #16a34a;
    border: 1px solid #86efac;
  }
  
  .profile-badge-destructive {
    background-color: #fef2f2;
    color: #dc2626;
    border: 1px solid #fca5a5;
  }
  
  .profile-badge-warning {
    background-color: #fffbeb;
    color: #d97706;
    border: 1px solid #fde68a;
  }
  
  .profile-badge-info {
    background: linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%);
    color: #2563eb;
    border: 1px solid #bfdbfe;
  }
  
  /* Info Row */
  .profile-info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 0;
    border-bottom: 1px solid #f1f5f9;
  }
  
  .profile-info-row:last-child {
    border-bottom: none;
  }
  
  .profile-info-label {
    font-size: 0.875rem;
    color: #64748b;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .profile-info-value {
    font-size: 0.875rem;
    font-weight: 500;
    color: #0f172a;
  }
  
  /* Avatar */
  .profile-avatar {
    width: 5rem;
    height: 5rem;
    border-radius: 1.5rem;
    background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 700;
    font-size: 1.5rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  }
  
  /* Toast Styles */
  .profile-toast-container {
    position: fixed;
    bottom: 1rem;
    right: 1rem;
    z-index: 100;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .profile-toast {
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
  
  .profile-toast-success {
    border-left-color: #10b981;
  }
  .profile-toast-success svg { color: #10b981; }
  
  .profile-toast-error {
    border-left-color: #ef4444;
  }
  .profile-toast-error svg { color: #ef4444; }
  
  .profile-toast-message {
    flex: 1;
    font-size: 0.875rem;
    color: #0f172a;
  }
  
  .profile-toast-close {
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0.25rem;
    color: #94a3b8;
  }
  
  /* Loading Spinner */
  .profile-loading-spinner {
    display: inline-block;
    width: 1rem;
    height: 1rem;
    border: 2px solid white;
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  /* Grid Layout */
  .profile-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  @media (min-width: 768px) {
    .profile-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  
  /* Session Card */
  .profile-session-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem;
    background: #f8fafc;
    border-radius: 0.75rem;
    margin-bottom: 0.5rem;
  }
  
  .profile-session-device {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  
  .profile-session-icon {
    width: 2rem;
    height: 2rem;
    background: white;
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #3b82f6;
  }
  
  /* Divider */
  .profile-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
    margin: 1rem 0;
  }
`;

// ==================== TOAST COMPONENT ====================
const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(), 3000);
    return () => clearTimeout(timer);
  }, [onClose]);
  
  const Icon = type === 'success' ? CheckCircle : AlertCircle;
  
  return (
    <div className={`profile-toast profile-toast-${type}`}>
      <Icon size={20} />
      <span className="profile-toast-message">{message}</span>
      <button className="profile-toast-close" onClick={onClose}>
        <X size={16} />
      </button>
    </div>
  );
};

// ==================== STAT CARD COMPONENT ====================
const StatCard = ({ icon: Icon, label, value, trend, color = 'primary' }) => (
  <div className={`profile-stat-card profile-stat-card-${color}`}>
    <div className={`profile-stat-icon-wrapper profile-stat-icon-${color}`}>
      <Icon size={24} />
    </div>
    <div className="profile-stat-content">
      <div>
        <div className="profile-stat-label">{label}</div>
        <div className="profile-stat-value">{value}</div>
      </div>
      {trend && (
        <div className="profile-stat-trend">
          <TrendingUp size={12} />
          <span>{trend}</span>
        </div>
      )}
    </div>
  </div>
);

// ==================== MAIN COMPONENT ====================
const Profile = () => {
  const dispatch = useDispatch();
  const { user: currentUser } = useSelector((state) => state.auth);
  
  // Profile form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [originalName, setOriginalName] = useState('');
  const [originalEmail, setOriginalEmail] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  
  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Toasts state
  const [toasts, setToasts] = useState([]);
  
  // Load user data
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setEmail(currentUser.email || '');
      setOriginalName(currentUser.name || '');
      setOriginalEmail(currentUser.email || '');
    }
  }, [currentUser]);
  
  // Toast management
  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };
  
  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };
  
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (name === originalName && email === originalEmail) {
      showToast('Aucune modification détectée', 'error');
      return;
    }
    
    setProfileLoading(true);
    
    try {
      const result = await dispatch(updateProfile({ name, email })).unwrap();
      showToast(result.message || 'Profil mis à jour avec succès', 'success');
      
      setOriginalName(name);
      setOriginalEmail(email);
      setIsEditingProfile(false);
      
      if (result.user) {
        dispatch(updateAuthUser(result.user));
      }
    } catch (err) {
      showToast(err || 'Erreur lors de la mise à jour du profil', 'error');
    } finally {
      setProfileLoading(false);
    }
  };
  
  const handleEditClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsEditingProfile(true);
  };
  
  const handleCancelClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsEditingProfile(false);
    setName(originalName);
    setEmail(originalEmail);
  };
  
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (newPassword !== confirmPassword) {
      showToast('Les nouveaux mots de passe ne correspondent pas', 'error');
      return;
    }
    
    if (newPassword.length < 6) {
      showToast('Le mot de passe doit contenir au moins 6 caractères', 'error');
      return;
    }
    
    setPasswordLoading(true);
    
    try {
      const result = await dispatch(changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword
      })).unwrap();
      
      showToast(result.message || 'Mot de passe modifié avec succès', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      showToast(err || 'Erreur lors du changement de mot de passe', 'error');
    } finally {
      setPasswordLoading(false);
    }
  };
  
  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };
  
  const getRoleLabel = (role) => {
    if (role === 'superadmin') return 'Super Administrateur';
    if (role === 'admin') return 'Administrateur';
    return 'Utilisateur';
  };
  
  const getRoleIcon = (role) => {
    if (role === 'superadmin') return <Crown size={14} />;
    if (role === 'admin') return <ShieldCheck size={14} />;
    return <User size={14} />;
  };
  
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };
  
  // Calculate account age
  const getAccountAge = () => {
    if (!currentUser?.created_at) return 'N/A';
    const created = new Date(currentUser.created_at);
    const now = new Date();
    const diffTime = Math.abs(now - created);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 30) return `${diffDays} jours`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} mois`;
    return `${Math.floor(diffDays / 365)} an${Math.floor(diffDays / 365) > 1 ? 's' : ''}`;
  };
  
  // Mock security score (based on password strength and account age)
  const getSecurityScore = () => {
    // This would be calculated based on actual security metrics
    return 85;
  };

  return (
    <div className="profile-page-container">
      <style>{styles}</style>
      
      {/* Toast Container */}
      {toasts.length > 0 && (
        <div className="profile-toast-container">
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
      <div className="profile-page-header">
        <div className="profile-title-section">
          <h1 className="profile-title">
            Mon Profil
          </h1>
          <div className="profile-subtitle">
            <span>Gérez vos informations personnelles et votre sécurité</span>
            <span className="profile-subtitle-badge">
              <User size={12} style={{ display: 'inline', marginRight: '0.25rem' }} />
              {getRoleLabel(currentUser?.role)}
            </span>
          </div>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="profile-stats-grid">
        <StatCard 
          icon={UserCheck} 
          label="Statut du compte" 
          value={currentUser?.statut === 'actif' ? 'Actif' : 'Inactif'} 
          color={currentUser?.statut === 'actif' ? 'success' : 'warning'}
          trend={currentUser?.statut === 'actif' ? 'Compte actif' : 'Compte désactivé'}
        />
        <StatCard 
          icon={Calendar} 
          label="Membre depuis" 
          value={getAccountAge()} 
          color="primary"
          trend={currentUser?.created_at ? formatDate(currentUser.created_at) : 'N/A'}
        />
        <StatCard 
          icon={Shield} 
          label="Niveau de sécurité" 
          value={`${getSecurityScore()}%`} 
          color="info"
          trend="Protégé"
        />
        <StatCard 
          icon={Activity} 
          label="ID Utilisateur" 
          value={`#${currentUser?.id || 'N/A'}`} 
          color="warning"
        />
      </div>
      
      {/* Main Grid */}
      <div className="profile-grid">
        {/* Profile Information Card */}
        <div className="profile-card">
          <div className="profile-card-header">
            <h2 className="profile-card-title">
              <User size={20} className="text-blue-600" />
              Informations personnelles
            </h2>
            <p className="profile-card-description">
              Modifiez vos informations de base
            </p>
          </div>
          
          <div style={{ padding: '1.5rem' }}>
            {/* Avatar Section */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <div className="profile-avatar">
                {getInitials(name)}
              </div>
            </div>
            
            <form onSubmit={handleProfileUpdate}>
              <div className="profile-form-group">
                <label className="profile-label">Nom complet</label>
                <div className="profile-input-wrapper">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={!isEditingProfile}
                    className={`profile-input ${!isEditingProfile ? 'profile-input-disabled' : ''}`}
                    placeholder="Votre nom"
                  />
                </div>
              </div>
              
              <div className="profile-form-group">
                <label className="profile-label">Adresse email</label>
                <div className="profile-input-wrapper">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={!isEditingProfile}
                    className={`profile-input ${!isEditingProfile ? 'profile-input-disabled' : ''}`}
                    placeholder="votre@email.com"
                  />
                </div>
              </div>
              
              <div className="profile-button-group">
                {!isEditingProfile ? (
                  <button
                    type="button"
                    onClick={handleEditClick}
                    className="profile-btn profile-btn-primary"
                    style={{ width: '100%' }}
                  >
                    <Edit2 size={16} />
                    Modifier le profil
                  </button>
                ) : (
                  <>
                    <button
                      type="submit"
                      disabled={profileLoading}
                      className="profile-btn profile-btn-success"
                      style={{ flex: 1 }}
                    >
                      {profileLoading ? (
                        <>
                          <div className="profile-loading-spinner" />
                          Enregistrement...
                        </>
                      ) : (
                        <>
                          <Save size={16} />
                          Enregistrer
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelClick}
                      className="profile-btn profile-btn-outline"
                    >
                      <X size={16} />
                      Annuler
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
        
        {/* Change Password Card */}
        <div className="profile-card">
          <div className="profile-card-header">
            <h2 className="profile-card-title">
              <Lock size={20} className="text-blue-600" />
              Sécurité du compte
            </h2>
            <p className="profile-card-description">
              Mettez à jour votre mot de passe
            </p>
          </div>
          
          <div style={{ padding: '1.5rem' }}>
            <form onSubmit={handlePasswordChange}>
              <div className="profile-form-group">
                <label className="profile-label profile-label-required">
                  Mot de passe actuel
                </label>
                <div className="profile-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="profile-input"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#94a3b8'
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              
              <div className="profile-form-group">
                <label className="profile-label profile-label-required">
                  Nouveau mot de passe
                </label>
                <div className="profile-input-wrapper">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    className="profile-input"
                    placeholder="•••••••• (min. 6 caractères)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#94a3b8'
                    }}
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              
              <div className="profile-form-group">
                <label className="profile-label profile-label-required">
                  Confirmer le nouveau mot de passe
                </label>
                <div className="profile-input-wrapper">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="profile-input"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#94a3b8'
                    }}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              
              <button
                type="submit"
                disabled={passwordLoading}
                className="profile-btn profile-btn-primary"
                style={{ width: '100%' }}
              >
                {passwordLoading ? (
                  <>
                    <div className="profile-loading-spinner" />
                    Changement en cours...
                  </>
                ) : (
                  <>
                    <Key size={16} />
                    Changer le mot de passe
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
      
      {/* Account Details Card */}
      <div className="profile-card" style={{ marginTop: '1.5rem' }}>
        <div className="profile-card-header">
          <h2 className="profile-card-title">
            <ShieldCheck size={20} className="text-blue-600" />
            Détails du compte
          </h2>
          <p className="profile-card-description">
            Informations complémentaires sur votre compte
          </p>
        </div>
        
        <div style={{ padding: '1.5rem' }}>
          <div className="profile-info-row">
            <div className="profile-info-label">
              <Shield size={16} />
              Rôle
            </div>
            <div className="profile-info-value">
              <span className={`profile-badge ${
                currentUser?.role === 'superadmin' ? 'profile-badge-info' :
                currentUser?.role === 'admin' ? 'profile-badge-warning' :
                'profile-badge-success'
              }`}>
                {getRoleIcon(currentUser?.role)}
                {getRoleLabel(currentUser?.role)}
              </span>
            </div>
          </div>
          
          <div className="profile-info-row">
            <div className="profile-info-label">
              <Activity size={16} />
              Statut
            </div>
            <div className="profile-info-value">
              <span className={`profile-badge ${currentUser?.statut === 'actif' ? 'profile-badge-success' : 'profile-badge-destructive'}`}>
                {currentUser?.statut === 'actif' ? (
                  <CheckCircle size={12} />
                ) : (
                  <X size={12} />
                )}
                {currentUser?.statut === 'actif' ? 'Actif' : 'Inactif'}
              </span>
            </div>
          </div>
          
          <div className="profile-info-row">
            <div className="profile-info-label">
              <Calendar size={16} />
              Date d'inscription
            </div>
            <div className="profile-info-value">
              {currentUser?.created_at ? formatDate(currentUser.created_at) : 'N/A'}
            </div>
          </div>
          
          <div className="profile-info-row">
            <div className="profile-info-label">
              <Globe size={16} />
              ID Utilisateur
            </div>
            <div className="profile-info-value">
              #{currentUser?.id || 'N/A'}
            </div>
          </div>
        </div>
      </div>
      
      {/* Security Tips Card */}
      <div className="profile-card" style={{ marginTop: '1.5rem' }}>
        <div className="profile-card-header">
          <h2 className="profile-card-title">
            <Zap size={20} className="text-blue-600" />
            Conseils de sécurité
          </h2>
          <p className="profile-card-description">
            Recommandations pour protéger votre compte
          </p>
        </div>
        
        <div style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '2rem', height: '2rem', background: '#eff6ff', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Star size={16} style={{ color: '#3b82f6' }} />
              </div>
              <div>
                <div style={{ fontWeight: 500, color: '#0f172a', fontSize: '0.875rem' }}>
                  Utilisez un mot de passe unique
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  N'utilisez pas le même mot de passe sur plusieurs sites
                </div>
              </div>
            </div>
            
            <div className="profile-divider" />
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '2rem', height: '2rem', background: '#eff6ff', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={16} style={{ color: '#3b82f6' }} />
              </div>
              <div>
                <div style={{ fontWeight: 500, color: '#0f172a', fontSize: '0.875rem' }}>
                  Activez l'authentification à deux facteurs
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Une couche de sécurité supplémentaire pour votre compte
                </div>
              </div>
            </div>
            
            <div className="profile-divider" />
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '2rem', height: '2rem', background: '#eff6ff', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Smartphone size={16} style={{ color: '#3b82f6' }} />
              </div>
              <div>
                <div style={{ fontWeight: 500, color: '#0f172a', fontSize: '0.875rem' }}>
                  Déconnectez-vous des appareils inutilisés
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Vérifiez régulièrement vos sessions actives
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;