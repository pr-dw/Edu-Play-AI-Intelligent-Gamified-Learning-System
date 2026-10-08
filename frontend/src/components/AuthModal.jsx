import React, { useState } from 'react';
import { X, LogIn, UserPlus, Sparkles, Shield, User, Award } from 'lucide-react';
import { api } from '../services/api';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  if (!isOpen) return null;

  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'user',
    avatar: '⚡',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const avatars = ['⚡', '🚀', '🧠', '🔬', '🎓', '👑', '🧙‍♂️', '💻'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'login') {
        const res = await api.auth.login(formData.username, formData.password);
        onAuthSuccess(res.user);
        onClose();
      } else {
        const res = await api.auth.register(formData);
        onAuthSuccess(res.user);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (accountType) => {
    setLoading(true);
    setError(null);
    let username = '';
    let password = '';

    if (accountType === 'user_sam') {
      username = 'sam';
      password = 'user123';
    } else if (accountType === 'user_alex') {
      username = 'alex';
      password = 'user123';
    } else if (accountType === 'admin') {
      username = 'admin';
      password = 'admin123';
    }

    try {
      const res = await api.auth.login(username, password);
      onAuthSuccess(res.user);
      onClose();
    } catch (err) {
      try {
        await api.admin.seedData();
        const res = await api.auth.login(username, password);
        onAuthSuccess(res.user);
        onClose();
      } catch (innerErr) {
        setError(innerErr.message || 'Demo login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 20,
    }}>
      <div className="glass-panel animate-slide-in" style={{
        width: '100%',
        maxWidth: 480,
        padding: 32,
        position: 'relative',
        border: '1px solid var(--border-glow)',
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
          }}
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 52,
            height: 52,
            borderRadius: 16,
            background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
            fontSize: '1.8rem',
            marginBottom: 12,
            boxShadow: '0 8px 24px var(--primary-glow)',
          }}>
            ⚡
          </div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: 4 }}>
            {mode === 'login' ? 'Welcome to EduPlay AI' : 'Create an Account'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {mode === 'login' ? 'Sign in to access your courses, AI tutor, and certificates.' : 'Register to begin earning XP and learning with the AI Tutor.'}
          </p>
        </div>

        {/* 1-Click Demo Accounts */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: 14,
          marginBottom: 20,
        }}>
          <div style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={14} color="#fbbf24" /> Instant 1-Click Demo Access
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            <button
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.775rem', padding: '6px 8px' }}
              onClick={() => handleQuickDemo('user_sam')}
              disabled={loading}
            >
              <span>⚡ User (Sam)</span>
            </button>
            <button
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.775rem', padding: '6px 8px' }}
              onClick={() => handleQuickDemo('user_alex')}
              disabled={loading}
            >
              <span>🧠 User (Alex)</span>
            </button>
            <button
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.775rem', padding: '6px 8px', borderColor: 'rgba(239, 68, 68, 0.4)' }}
              onClick={() => handleQuickDemo('admin')}
              disabled={loading}
            >
              <span>👑 Admin</span>
            </button>
          </div>
        </div>

        {/* Tab switch */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button
            className={`btn ${mode === 'login' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            style={{ flex: 1 }}
            onClick={() => { setMode('login'); setError(null); }}
          >
            Sign In
          </button>
          <button
            className={`btn ${mode === 'register' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            style={{ flex: 1 }}
            onClick={() => { setMode('register'); setError(null); }}
          >
            Register (+100 XP)
          </button>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 14px',
            color: '#f87171',
            fontSize: '0.85rem',
            marginBottom: 16,
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
              Username
            </label>
            <input
              type="text"
              className="input-control"
              required
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder={mode === 'login' ? 'e.g. sam or admin' : 'Choose a username'}
            />
          </div>

          {mode === 'register' && (
            <>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Email Address
                </label>
                <input
                  type="email"
                  className="input-control"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="user@example.com"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                    First Name
                  </label>
                  <input
                    type="text"
                    className="input-control"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    placeholder="First"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                    Last Name
                  </label>
                  <input
                    type="text"
                    className="input-control"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    placeholder="Last"
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Account Role
                </label>
                <select
                  className="input-control"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="user">User</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Choose Avatar
                </label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {avatars.map((av) => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => setFormData({ ...formData, avatar: av })}
                      style={{
                        fontSize: '1.2rem',
                        padding: '6px 10px',
                        borderRadius: 'var(--radius-sm)',
                        background: formData.avatar === av ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                        border: '1px solid',
                        borderColor: formData.avatar === av ? '#fff' : 'var(--border-subtle)',
                        cursor: 'pointer',
                      }}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
              Password
            </label>
            <input
              type="password"
              className="input-control"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 8 }}
            disabled={loading}
          >
            {loading ? 'Processing...' : mode === 'login' ? 'Sign In' : 'Create Account & Claim 100 XP'}
          </button>
        </form>
      </div>
    </div>
  );
}
