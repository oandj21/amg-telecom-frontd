// Login.jsx
import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { login, clearAuthError } from './Store/store';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, loading, user } = useSelector((state) => state.auth);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    dispatch(clearAuthError());
  }, [email, password, dispatch]);

  if (isAuthenticated && user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(login({ email, password }));
    
    if (login.fulfilled.match(result)) {
      window.toast?.('Connexion réussie', 'success');
      navigate('/dashboard');
    } else {
      window.toast?.(result.payload || 'Identifiants incorrects', 'error');
    }
  };

  return (
    <div className="login-page-wrapper">
      <style>{`
        .login-page-wrapper {
          min-height: 100vh;
          display: flex;
          font-family: 'Inter', system-ui, sans-serif;
          position: relative;
        }

        /* Footer bottom left */
        .login-footer {
          position: fixed;
          bottom: 1rem;
          left: 1rem;
          z-index: 50;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(8px);
          padding: 0.5rem 1rem;
          border-radius: 2rem;
          font-size: 0.75rem;
          color: #475569;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          border: 1px solid rgba(203, 213, 225, 0.5);
          transition: all 0.2s ease;
          cursor: pointer;
          text-decoration: none;
          font-weight: 500;
        }

        .login-footer:hover {
          background: rgba(255, 255, 255, 0.95);
          border-color: #cbd5e1;
          color: #0f172a;
        }

        .footer-icon {
          width: 20px;
          height: 20px;
          object-fit: contain;
          border-radius: 50%;
        }

        /* --- Section Gauche (Hero avec Ancien Background) --- */
        .login-hero {
          display: none;
          flex: 1.4;
          position: relative;
          background: linear-gradient(rgba(15, 23, 42, 0.75), rgba(15, 23, 42, 0.75)), 
                      url('https://images.unsplash.com/photo-1519003722824-194d4455a60c?q=80&w=2000&auto=format&fit=crop');
          background-size: cover;
          background-position: center;
          padding: 4rem;
          color: white;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
        }

        @media (min-width: 1024px) {
          .login-hero { display: flex; }
        }

        .hero-logo-big {
          width: 160px;
          height: 160px;
          object-fit: cover;
          border-radius: 2rem; /* Border radius ajouté au logo */
          margin-bottom: 2rem;
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
          border: 4px solid rgba(255, 255, 255, 0.1);
        }

        .hero-title {
          font-size: 3rem;
          font-weight: 900;
          letter-spacing: -0.05em;
          margin-bottom: 1rem;
          color: #ffffff;
        }

        /* --- Section Droite (Formulaire) --- */
        .login-form-section {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          background: radial-gradient(circle at top right, #f1f5f9, #ffffff);
        }

        .login-card {
          width: 100%;
          max-width: 440px;
          background: white;
          padding: 3rem 2.5rem;
          border-radius: 2rem;
          border: 1px solid #e2e8f0;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.08);
        }

        /* Logo Mobile */
        .mobile-logo-container {
          display: flex;
          justify-content: center;
          margin-bottom: 2rem;
        }
        @media (min-width: 1024px) {
          .mobile-logo-container { display: none; }
        }

        .mobile-logo {
          height: 80px;
          width: 80px;
          border-radius: 1.25rem;
          object-fit: cover;
        }

        .login-header {
          text-align: center;
          margin-bottom: 2.5rem;
        }

        .login-header h1 {
          font-size: 1.85rem;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 0.5rem;
        }

        .login-header p {
          color: #64748b;
        }

        /* Inputs */
        .login-field {
          margin-bottom: 1.5rem;
        }

        .login-label {
          display: block;
          font-size: 0.875rem;
          font-weight: 600;
          color: #475569;
          margin-bottom: 0.5rem;
        }

        .login-input {
          width: 100%;
          padding: 1rem 1.25rem;
          border: 2px solid #f1f5f9;
          border-radius: 1rem;
          font-size: 1rem;
          transition: all 0.2s ease;
          background: #f8fafc;
        }

        .login-input:focus {
          outline: none;
          border-color: #3b82f6;
          background: white;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
        }

        .password-wrapper {
          position: relative;
        }

        .login-pw-toggle {
          position: absolute;
          right: 1.25rem;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          background: none;
          border: none;
          cursor: pointer;
        }

        /* Button */
        .login-submit-btn {
          width: 100%;
          padding: 1rem;
          background: #0f172a;
          color: white;
          border: none;
          border-radius: 1rem;
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          margin-top: 2rem;
        }

        .login-submit-btn:hover:not(:disabled) {
          background: #1e293b;
          transform: translateY(-2px);
        }

        .spinner {
          width: 20px;
          height: 20px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Footer bottom left */}
      <a 
        href="https://www.instagram.com/motawirinn/" 
        target="_blank" 
        rel="noopener noreferrer"
        className="login-footer"
      >
        <img src="/devo.png" alt="dev" className="footer-icon" />
        <span>© 2026 développé par motawirin</span>
      </a>

      {/* Hero Section - Ancien Fond Restauré */}
      <div className="login-hero">
        <img src="/logo.png" alt="AMG TELECOM" className="hero-logo-big" />
        <h2 className="hero-title">AMG TELECOM</h2>
        <p className="text-slate-300 text-xl max-w-md leading-relaxed">
          Expertise en géolocalisation et solutions de communication avancées pour votre flotte.
        </p>
      </div>

      {/* Form Section */}
      <div className="login-form-section">
        <div className="login-card">
          <div className="mobile-logo-container">
            <img src="/logo.png" alt="Logo" className="mobile-logo" />
          </div>

          <div className="login-header">
            <h1>AMG TELECOM</h1>
            <p>Espace de gestion sécurisé</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="login-field">
              <label className="login-label">Email</label>
              <input
                type="email"
                className="login-input"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="login-field">
              <label className="login-label">Mot de passe</label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  className="login-input"
                  placeholder="Mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="login-pw-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button type="submit" className="login-submit-btn" disabled={loading}>
              {loading ? (
                <div className="spinner" />
              ) : (
                <>
                  Se connecter
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;