import React, { useState, useRef } from 'react';
import { X, User, Mail, Upload, Camera, Trash2, CheckCircle2, Shield, Sparkles, Award } from 'lucide-react';
import { api } from '../services/api';

export default function ProfileModal({ isOpen, onClose, currentUser, onUpdateUser }) {
  if (!isOpen || !currentUser) return null;

  const [formData, setFormData] = useState({
    first_name: currentUser.first_name || '',
    last_name: currentUser.last_name || '',
    email: currentUser.email || '',
    bio: currentUser.bio || '',
    avatar: currentUser.avatar || '⚡',
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(currentUser.avatar_image_url || currentUser.avatar_image || null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);
  const avatarPresets = ['⚡', '🚀', '🧠', '🔬', '🎓', '👑', '🧙‍♂️', '💻', '🌟', '🦄', '🦁', '🛡️'];

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file (PNG, JPG, WebP).');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Image file is too large. Maximum size is 5MB.');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      let updated;
      if (imageFile) {
        const data = new FormData();
        data.append('first_name', formData.first_name.trim());
        data.append('last_name', formData.last_name.trim());
        data.append('email', formData.email.trim());
        data.append('bio', formData.bio.trim());
        data.append('avatar', formData.avatar);
        data.append('avatar_image', imageFile);
        updated = await api.auth.updateProfile(data);
      } else {
        const payload = {
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          email: formData.email.trim(),
          bio: formData.bio.trim(),
          avatar: formData.avatar,
        };
        // If image was cleared
        if (!imagePreview && (currentUser.avatar_image || currentUser.avatar_image_url)) {
          payload.avatar_image = null;
        }
        updated = await api.auth.updateProfile(payload);
      }

      setMessage('Profile updated successfully!');
      if (onUpdateUser) {
        onUpdateUser(updated);
      }
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError(err.message || 'Failed to update profile. Please verify your data.');
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
      background: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 16,
    }}>
      <div className="glass-panel animate-slide-in" style={{
        width: '100%',
        maxWidth: 520,
        maxHeight: '90vh',
        overflowY: 'auto',
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

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '1.4rem'
          }}>
            👤
          </div>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>My Profile</h2>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Manage your credentials, bio, and personalized avatar
            </p>
          </div>
        </div>

        {/* Feedback Messages */}
        {message && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 14px',
            color: 'var(--success)',
            fontSize: '0.85rem',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <CheckCircle2 size={16} />
            <span>{message}</span>
          </div>
        )}

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

        {/* Gamification Badge Pill */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          marginBottom: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1.3rem' }}>⭐</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--accent-gold)' }}>
                {currentUser.points} XP Earned
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Level {currentUser.level} Explorer
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span className="badge badge-role" style={{ textTransform: 'capitalize' }}>
              {currentUser.role === 'admin' ? '🛡️ Administrator' : '👤 Learner'}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Avatar & Photo Section */}
          <div style={{
            background: 'var(--bg-surface-elevated)',
            padding: 16,
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)'
          }}>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>
              Profile Picture / Avatar
            </label>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
              {/* Avatar Preview */}
              <div style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                overflow: 'hidden',
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '3px solid var(--border-glow)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                flexShrink: 0,
              }}>
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Profile Preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <span style={{ fontSize: '2.2rem' }}>{formData.avatar || '⚡'}</span>
                )}
              </div>

              {/* Upload Controls */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}
                >
                  <Camera size={14} />
                  <span>Upload Custom Picture</span>
                </button>
                {imagePreview && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--danger)',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Trash2 size={13} />
                    <span>Reset to Emoji Avatar</span>
                  </button>
                )}
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  PNG, JPG, or WebP up to 5MB
                </span>
              </div>
            </div>

            {/* Emoji Presets (if no uploaded image or as alternate) */}
            <div>
              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                Or select an Emoji Avatar:
              </span>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {avatarPresets.map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, avatar: av });
                      if (!imageFile) setImagePreview(null);
                    }}
                    style={{
                      fontSize: '1.1rem',
                      padding: '4px 8px',
                      borderRadius: 8,
                      background: (!imagePreview && formData.avatar === av) ? 'var(--primary)' : 'var(--bg-surface)',
                      border: '1px solid',
                      borderColor: (!imagePreview && formData.avatar === av) ? 'var(--primary)' : 'var(--border-subtle)',
                      cursor: 'pointer',
                    }}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Name Fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>
                First Name
              </label>
              <input
                type="text"
                className="input-control"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                placeholder="Your first name"
                required
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
                placeholder="Your last name"
              />
            </div>
          </div>

          {/* Username & Email */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>
                Username (Immutable)
              </label>
              <input
                type="text"
                className="input-control"
                value={`@${currentUser.username}`}
                disabled
                style={{ opacity: 0.7, cursor: 'not-allowed' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>
                Email Address
              </label>
              <input
                type="email"
                className="input-control"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Your email address"
                required
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>
              Bio & Learning Goals
            </label>
            <textarea
              className="input-control"
              rows={3}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Your personal bio and learning goals"
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              style={{ flex: 1 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ flex: 2 }}
            >
              {loading ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
