import React, { useState, useRef, useEffect } from 'react';
import { BookOpen, Bot, Award, Shield, Trophy, User, LogOut, Sun, Moon, Palette, ChevronDown } from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  adminTab = 'overview',
  setAdminTab,
  currentUser,
  userStats,
  currentTheme = 'light',
  onSelectTheme,
  onOpenAuth,
  onLogout,
  onOpenTutor,
  onOpenProfile,
}) {
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);

  const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.is_staff);

  const themes = [
    { id: 'light', name: 'Light (Default)', icon: '☀️', color: '#f59e0b' },
    { id: 'dark', name: 'Dark Obsidian', icon: '🌙', color: '#6366f1' },
    { id: 'cyber', name: 'Cyberpunk Neon', icon: '⚡', color: '#ec4899' },
    { id: 'emerald', name: 'Emerald Sage', icon: '🌿', color: '#10b981' },
    { id: 'sunset', name: 'Solar Sunset', icon: '🌅', color: '#f43f5e' },
  ];

  const currentThemeObj = themes.find(t => t.id === currentTheme) || themes[0];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setThemeDropdownOpen(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="glass-panel" style={{
      position: 'sticky',
      top: 12,
      zIndex: 100,
      margin: '0 16px 24px 16px',
      borderRadius: 'var(--radius-lg)',
      padding: '12px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      border: isAdmin ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid var(--border-subtle)',
    }}>
      {/* Brand */}
      {isAdmin ? (
        <div 
          onClick={() => setAdminTab && setAdminTab('overview')} 
          style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
        >
          <div style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(239, 68, 68, 0.4)',
            fontSize: '1.4rem',
            color: '#ffffff'
          }}>
            🛡️
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
                EduPlay <span style={{ color: '#ef4444' }}>Admin</span>
              </span>
              <span className="badge badge-role" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>Portal</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1 }}>
              Administration Console
            </p>
          </div>
        </div>
      ) : (
        <div 
          onClick={() => setActiveTab('courses')} 
          style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
        >
          <div style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px var(--primary-glow)',
            fontSize: '1.4rem',
            color: '#ffffff'
          }}>
            ⚡
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
                EduPlay <span style={{ color: 'var(--secondary)' }}>AI</span>
              </span>
              <span className="badge badge-cyan" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>v1.0</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1 }}>
              Gamified Learning & AI Tutor
            </p>
          </div>
        </div>
      )}

      {/* Nav Tabs */}
      {isAdmin ? (
        <nav style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            className={`btn ${adminTab === 'overview' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setAdminTab && setAdminTab('overview')}
          >
            <span>📊 Overview</span>
          </button>
          <button
            className={`btn ${adminTab === 'courses' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setAdminTab && setAdminTab('courses')}
          >
            <span>📚 Courses & Curriculum</span>
          </button>
          <button
            className={`btn ${adminTab === 'users' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setAdminTab && setAdminTab('users')}
          >
            <span>👥 Users</span>
          </button>
          <button
            className={`btn ${adminTab === 'settings' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setAdminTab && setAdminTab('settings')}
          >
            <span>⚙️ Settings & AI</span>
          </button>
        </nav>
      ) : (
        <nav style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            className={`btn ${activeTab === 'courses' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setActiveTab('courses')}
          >
            <BookOpen size={16} />
            <span>Courses</span>
          </button>

          <button
            className={`btn ${activeTab === 'tutor' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setActiveTab('tutor')}
            style={activeTab === 'tutor' ? {} : { borderColor: 'var(--border-glow)' }}
          >
            <Bot size={16} color={activeTab === 'tutor' ? '#fff' : 'var(--primary)'} />
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              AI Tutor <span style={{ fontSize: '0.65rem', background: 'rgba(99, 102, 241, 0.15)', padding: '1px 5px', borderRadius: 4 }}>LangChain</span>
            </span>
          </button>

          <button
            className={`btn ${activeTab === 'certificates' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setActiveTab('certificates')}
          >
            <Award size={16} color={activeTab === 'certificates' ? '#fff' : 'var(--accent-gold)'} />
            <span>Certificates</span>
          </button>

          <button
            className={`btn ${activeTab === 'leaderboard' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setActiveTab('leaderboard')}
          >
            <Trophy size={16} color={activeTab === 'leaderboard' ? '#fff' : 'var(--accent-gold)'} />
            <span>Leaderboard</span>
          </button>
        </nav>
      )}

      {/* Right Controls: Theme Toggle & User Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Theme Selector Dropdown */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
            style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}
            title="Change Platform Theme"
          >
            <span style={{ fontSize: '1rem' }}>{currentThemeObj.icon}</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{currentThemeObj.name.split(' ')[0]}</span>
            <ChevronDown size={14} color="var(--text-muted)" />
          </button>

          {themeDropdownOpen && (
            <div className="glass-panel animate-slide-in" style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: 190,
              padding: 6,
              zIndex: 200,
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              boxShadow: 'var(--shadow-card-hover)',
            }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, padding: '4px 8px', textTransform: 'uppercase' }}>
                Select Theme
              </div>
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    onSelectTheme(t.id);
                    setThemeDropdownOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: currentTheme === t.id ? 'var(--primary)' : 'transparent',
                    color: currentTheme === t.id ? '#ffffff' : 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: '0.825rem',
                    fontWeight: 600,
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>{t.icon}</span>
                    <span>{t.name}</span>
                  </span>
                  {currentTheme === t.id && <span>✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User / Auth Pill */}
        {isAdmin ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-pill)',
              padding: '5px 14px',
            }}>
              <span style={{ fontSize: '1.1rem' }}>🛡️</span>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f87171' }}>
                  {currentUser.username}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  Administrator
                </div>
              </div>
            </div>

            <button
              className="btn btn-secondary btn-sm"
              onClick={onLogout}
              style={{
                borderColor: 'rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                padding: '6px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
              title="Sign out of Administrator Console"
            >
              <LogOut size={15} />
              <span>Logout</span>
            </button>
          </div>
        ) : currentUser ? (
          <>
            {/* Gamified XP Indicator */}

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(217, 119, 6, 0.1)',
              border: '1px solid var(--border-gold)',
              borderRadius: 'var(--radius-pill)',
              padding: '4px 12px',
            }}>
              <span style={{ fontSize: '1.1rem' }}>⭐</span>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-gold)' }}>
                  {currentUser.points} XP
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  Level {currentUser.level}
                </div>
              </div>
            </div>

            {/* User Profile Pill with Interactive Dropdown */}
            <div ref={profileDropdownRef} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-pill)',
                  padding: '4px 12px 4px 6px',
                  cursor: 'pointer',
                  color: 'inherit',
                  transition: 'all 0.15s ease',
                  boxShadow: profileDropdownOpen ? '0 0 0 2px var(--primary)' : 'none',
                }}
              >
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.1rem',
                  color: '#fff',
                  overflow: 'hidden',
                  flexShrink: 0
                }}>
                  {currentUser.avatar_image_url || currentUser.avatar_image ? (
                    <img 
                      src={currentUser.avatar_image_url || currentUser.avatar_image} 
                      alt="Avatar" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  ) : (
                    currentUser.avatar || '⚡'
                  )}
                </div>
                <div style={{ lineHeight: 1.2, textAlign: 'left' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                    {currentUser.first_name ? `${currentUser.first_name} ${currentUser.last_name || ''}`.trim() : currentUser.username}
                  </div>
                  <span className="badge badge-role" style={{ fontSize: '0.6rem', padding: '1px 5px' }}>
                    {currentUser.role}
                  </span>
                </div>
                <ChevronDown size={14} color="var(--text-muted)" style={{ transform: profileDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>

              {/* Profile Dropdown Menu */}
              {profileDropdownOpen && (
                <div className="glass-panel animate-slide-in" style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  width: 250,
                  padding: 12,
                  zIndex: 200,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  boxShadow: 'var(--shadow-card-hover)',
                  border: '1px solid var(--border-glow)'
                }}>
                  {/* User Profile Card Header */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '8px 6px 12px 6px',
                    borderBottom: '1px solid var(--border-subtle)'
                  }}>
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.4rem',
                      color: '#fff',
                      overflow: 'hidden',
                      flexShrink: 0
                    }}>
                      {currentUser.avatar_image_url || currentUser.avatar_image ? (
                        <img 
                          src={currentUser.avatar_image_url || currentUser.avatar_image} 
                          alt="Avatar" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                      ) : (
                        currentUser.avatar || '⚡'
                      )}
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {currentUser.first_name ? `${currentUser.first_name} ${currentUser.last_name || ''}`.trim() : currentUser.username}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        @{currentUser.username}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--secondary)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {currentUser.email}
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      onOpenProfile();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      textAlign: 'left',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-surface-elevated)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <User size={16} color="var(--primary)" />
                    <span>My Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      setActiveTab('certificates');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      textAlign: 'left',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-surface-elevated)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <Award size={16} color="var(--accent-gold)" />
                    <span>My Certificates</span>
                  </button>

                  {(currentUser.role === 'admin' || currentUser.is_staff) && (
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        setActiveTab('admin');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-sm)',
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        textAlign: 'left',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-surface-elevated)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <Shield size={16} color="#f87171" />
                      <span>Admin Console</span>
                    </button>
                  )}

                  <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 0' }} />

                  {/* Log Out Button inside dropdown */}
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      onLogout();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--danger)',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      textAlign: 'left',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <LogOut size={16} color="var(--danger)" />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <button className="btn btn-primary btn-sm" onClick={onOpenAuth}>
            <User size={16} />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
}
