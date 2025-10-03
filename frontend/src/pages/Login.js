import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      await login(formData);
      navigate(from, { replace: true });
    } catch (error) {
      console.error('Login error:', error);
      setErrors({
        submit: error.detail || error.message || 'Invalid credentials'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="floating-shape"></div>
      <div className="floating-shape"></div>
      <div className="floating-shape"></div>

      <div className="login-container">
        <div className="login-card">
          <div className="login-logo">
            <span>🚛</span>
          </div>

          <h1 className="login-title">Welcome Back</h1>
          <p className="login-subtitle">Sign in to your Trucking Logistics account</p>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username" className="form-label">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className={`form-input ${errors.username ? 'error' : ''}`}
                placeholder="Enter your username"
                value={formData.username}
                onChange={handleChange}
              />
              {errors.username && (
                <p className="error-message">{errors.username}</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className={`form-input ${errors.password ? 'error' : ''}`}
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
              />
              {errors.password && (
                <p className="error-message">{errors.password}</p>
              )}
            </div>

            {errors.submit && (
              <div className="error-message" style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#FEE2E2', borderRadius: '8px', border: '1px solid #FCA5A5' }}>
                {errors.submit}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="submit-button"
            >
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>

            <div className="auth-link">
              Don't have an account? <Link to="/register">Create one now</Link>
            </div>
          </form>

          <div className="demo-credentials">
            <h3 className="demo-credentials-title">Demo Credentials</h3>
            <div className="demo-credentials-list">
              <p><strong>Admin:</strong> admin1 / admin123</p>
              <p><strong>Truck Owner:</strong> truck_owner1 / user123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
