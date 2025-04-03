import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaGoogle, FaGithub } from 'react-icons/fa';
import './Login.css';
import axios from '../utils/axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login, user, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user && !loading) {
      navigate('/products');
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login(email, password);
      toast.success('Login successful!');
      navigate('/products');
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      // Open Google login popup
      const width = 500;
      const height = 600;
      const left = (window.innerWidth - width) / 2;
      const top = (window.innerHeight - height) / 2;
      
      const popup = window.open(
        `${process.env.REACT_APP_API_URL}/api/auth/google`,
        'Google Login',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Listen for message from popup
      window.addEventListener('message', async (event) => {
        if (event.origin !== process.env.REACT_APP_API_URL) return;
        
        if (event.data.token) {
          localStorage.setItem('token', event.data.token);
          await login(event.data.email, null, true); // Pass true to indicate Google login
          popup.close();
          navigate('/products');
        }
      });
    } catch (error) {
      console.error('Google login error:', error);
      toast.error('Google login failed. Please try again.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2 className="login-title">Sign in to your account</h2>
        
        <form className="login-form" onSubmit={handleSubmit}>
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="form-input"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="form-input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <input
                type="checkbox"
                id="remember-me"
                name="remember-me"
                className="mr-2"
              />
              Remember me
            </label>
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="loading-spinner"></span>
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        <div className="social-login">
          <div className="social-divider">
            <span>Or continue with</span>
          </div>

          <div className="social-buttons">
            <button 
              type="button" 
              className="social-button"
              onClick={handleGoogleLogin}
            >
              <FaGoogle className="social-icon google-icon" />
              <span>Google</span>
            </button>

            <button type="button" className="social-button">
              <FaGithub className="social-icon github-icon" />
              <span>GitHub</span>
            </button>
          </div>
        </div>

        <div className="register-link">
          Don't have an account?{' '}
          <Link to="/register">Create one</Link>
        </div>
      </div>
    </div>
  );
};

export default Login; 