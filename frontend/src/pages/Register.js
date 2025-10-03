import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Register.css';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
    role: 'user',
    phone_number: '',
    address: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

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

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.password_confirm) {
      newErrors.password_confirm = 'Passwords do not match';
    }

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      await register(formData);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      console.error('Registration error:', error);
      if (typeof error === 'object') {
        setErrors(error);
      } else {
        setErrors({
          submit: error.message || 'Registration failed'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="success-container">
        <div className="success-card">
          <div className="success-icon">
            <span>✓</span>
          </div>
          <h2 className="success-title">Registration Successful!</h2>
          <p className="success-message">
            Your account has been created successfully. You will be redirected to the login page shortly.
          </p>
          <Link to="/login" className="success-link">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-card">
          <div className="register-logo">
            <span>🚛</span>
          </div>

          <h1 className="register-title">Create Account</h1>
          <p className="register-subtitle">Join Trucking Logistics Management System</p>

          <form className="register-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="first_name" className="form-label">
                  First Name
                </label>
                <input
                  id="first_name"
                  name="first_name"
                  type="text"
                  required
                  className={`form-input ${errors.first_name ? 'error' : ''}`}
                  placeholder="First name"
                  value={formData.first_name}
                  onChange={handleChange}
                />
                {errors.first_name && (
                  <p className="error-message">{errors.first_name}</p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="last_name" className="form-label">
                  Last Name
                </label>
                <input
                  id="last_name"
                  name="last_name"
                  type="text"
                  required
                  className={`form-input ${errors.last_name ? 'error' : ''}`}
                  placeholder="Last name"
                  value={formData.last_name}
                  onChange={handleChange}
                />
                {errors.last_name && (
                  <p className="error-message">{errors.last_name}</p>
                )}
              </div>

              <div className="form-group form-grid-full">
                <label htmlFor="username" className="form-label">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className={`form-input ${errors.username ? 'error' : ''}`}
                  placeholder="Choose a username"
                  value={formData.username}
                  onChange={handleChange}
                />
                {errors.username && (
                  <p className="error-message">{errors.username}</p>
                )}
              </div>

              <div className="form-group form-grid-full">
                <label htmlFor="email" className="form-label">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className={`form-input ${errors.email ? 'error' : ''}`}
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={handleChange}
                />
                {errors.email && (
                  <p className="error-message">{errors.email}</p>
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
                  placeholder="Min. 8 characters"
                  value={formData.password}
                  onChange={handleChange}
                />
                {errors.password && (
                  <p className="error-message">{errors.password}</p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="password_confirm" className="form-label">
                  Confirm Password
                </label>
                <input
                  id="password_confirm"
                  name="password_confirm"
                  type="password"
                  required
                  className={`form-input ${errors.password_confirm ? 'error' : ''}`}
                  placeholder="Confirm password"
                  value={formData.password_confirm}
                  onChange={handleChange}
                />
                {errors.password_confirm && (
                  <p className="error-message">{errors.password_confirm}</p>
                )}
              </div>

              <div className="form-group form-grid-full">
                <label htmlFor="role" className="form-label">
                  Account Type
                </label>
                <select
                  id="role"
                  name="role"
                  className="form-input"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="user">Truck Owner</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="form-group form-grid-full">
                <label htmlFor="phone_number" className="form-label">
                  Phone Number (Optional)
                </label>
                <input
                  id="phone_number"
                  name="phone_number"
                  type="tel"
                  className="form-input"
                  placeholder="+1 (555) 000-0000"
                  value={formData.phone_number}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group form-grid-full">
                <label htmlFor="address" className="form-label">
                  Address (Optional)
                </label>
                <textarea
                  id="address"
                  name="address"
                  rows={2}
                  className="form-input"
                  placeholder="Your address"
                  value={formData.address}
                  onChange={handleChange}
                  style={{ resize: 'vertical' }}
                />
              </div>
            </div>

            {errors.submit && (
              <div className="error-message" style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#FEE2E2', borderRadius: '8px', border: '1px solid #FCA5A5' }}>
                {errors.submit}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="register-submit-button"
            >
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>

            <div className="auth-link">
              Already have an account? <Link to="/login">Sign in</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
