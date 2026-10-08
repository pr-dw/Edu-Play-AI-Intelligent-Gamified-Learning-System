import React, { useState } from 'react';
import { X, LogIn, UserPlus, User, Lock, Mail, Eye, EyeOff } from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const avatars = ['⚡', '🚀', '🧠', '🔬', '🎓', '👑', '🧙‍♂️', '💻'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'login') {
        const res = await api.auth.login(formData.username.trim(), formData.password);
        onAuthSuccess(res.user);
        onClose();
      } else {
        const res = await api.auth.register(formData);
        onAuthSuccess(res.user);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
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
      background: 'rgba(0, 0, 0, 0.65)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 20,
    }}>
      <div className="glass-panel animate-slide-in" style={{
        width: '100%',
        maxWidth: 460,
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
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 52,
            height: 52,
            borderRadius: 16,
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
            fontSize: '1.8rem',
            marginBottom: 12,
            boxShadow: '0 8px 24px var(--primary-glow)',
            color: '#fff'
          }}>
            ⚡
          </div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: 4 }}>
            {mode === 'login' ? 'Sign In to EduPlay AI' : 'Create an Account'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {mode === 'login' 
              ? 'Enter your credentials to load your personalized dashboard.' 
              : 'Register to start learning and earning XP.'}
          </p>
        </div>

        {/* Tab Switch */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button
            className={`btn ${mode === 'login' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            style={{ flex: 1 }}
            onClick={() => { setMode('login'); setError(null); }}
          >
            <LogIn size={15} />
            <span>Sign In</span>
          </button>
          <button
            className={`btn ${mode === 'register' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            style={{ flex: 1 }}
            onClick={() => { setMode('register'); setError(null); }}
          >
            <UserPlus size={15} />
            <span>Register (+100 XP)</span>
          </button>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 14px',
            color: 'var(--danger)',
            fontSize: '0.85rem',
            marginBottom: 16,
          }}>
            {error}
          </div>
        )}

        {/* Real Authentication Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>
              Username or Email
            </label>
            <div style={{ position: 'relative' }}>
              <User size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: 13 }} />
              <input
                type="text"
                className="input-control"
                style={{ paddingLeft: 40 }}
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder={mode === 'login' ? 'Enter username or email' : 'Choose a unique username'}
              />
            </div>
          </div>

          {mode === 'register' && (
            <>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: 13 }} />
                  <input
                    type="email"
                    className="input-control"
                    style={{ paddingLeft: 40 }}
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="user@example.com"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>
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
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>
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
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>
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
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Choose Avatar Emoji
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
                        background: formData.avatar === av ? 'var(--primary)' : 'var(--bg-surface-elevated)',
                        border: '1px solid',
                        borderColor: formData.avatar === av ? 'var(--primary)' : 'var(--border-subtle)',
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
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: 13 }} />
              <input
                type={showPassword ? 'text' : 'password'}
                className="input-control"
                style={{ paddingLeft: 40, paddingRight: 40 }}
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: 11,
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 8, padding: '12px 18px' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : mode === 'login' ? 'Sign In' : 'Create Account & Claim 100 XP'}
          </button>
        </form>
      </div>
    </div>
  );
}
