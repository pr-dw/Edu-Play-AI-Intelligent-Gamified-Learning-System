import React from 'react';
import { BookOpen, Bot, Award, Shield, Trophy, User, LogOut, Sparkles, Layers } from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  currentUser,
  userStats,
  onOpenAuth,
  onLogout,
  onOpenTutor
}) {
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
      border: '1px solid var(--border-subtle)',
    }}>
      {/* Brand */}
      <div 
        onClick={() => setActiveTab('courses')} 
        style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
      >
        <div style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 20px var(--primary-glow)',
          fontSize: '1.4rem'
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

      {/* Nav Tabs */}
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
          style={activeTab === 'tutor' ? {} : { borderColor: 'rgba(99, 102, 241, 0.4)' }}
        >
          <Bot size={16} color={activeTab === 'tutor' ? '#fff' : '#818cf8'} />
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            AI Tutor <span style={{ fontSize: '0.65rem', background: 'rgba(99, 102, 241, 0.3)', padding: '1px 5px', borderRadius: 4 }}>LangChain</span>
          </span>
        </button>

        <button
          className={`btn ${activeTab === 'certificates' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setActiveTab('certificates')}
        >
          <Award size={16} color={activeTab === 'certificates' ? '#fff' : '#f59e0b'} />
          <span>Certificates</span>
        </button>

        <button
          className={`btn ${activeTab === 'leaderboard' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setActiveTab('leaderboard')}
        >
          <Trophy size={16} color={activeTab === 'leaderboard' ? '#fff' : '#fbbf24'} />
          <span>Leaderboard</span>
        </button>

        {currentUser && (currentUser.role === 'admin' || currentUser.is_staff) && (
          <button
            className={`btn ${activeTab === 'admin' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setActiveTab('admin')}
            style={activeTab === 'admin' ? {} : { borderColor: 'rgba(239, 68, 68, 0.3)' }}
          >
            <Shield size={16} color="#f87171" />
            <span>Admin</span>
          </button>
        )}
      </nav>

      {/* User / Gamification Pill */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {currentUser ? (
          <>
            {/* Gamified XP Indicator */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: 'var(--radius-pill)',
              padding: '4px 12px',
            }}>
              <span style={{ fontSize: '1.1rem' }}>⭐</span>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fbbf24' }}>
                  {currentUser.points} XP
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  Level {currentUser.level}
                </div>
              </div>
            </div>

            {/* User Profile Pill */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-pill)',
              padding: '4px 12px 4px 6px',
            }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.1rem'
              }}>
                {currentUser.avatar || '🎓'}
              </div>
              <div style={{ lineHeight: 1.2 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{currentUser.username}</div>
                <span className="badge badge-role" style={{ fontSize: '0.6rem', padding: '1px 5px' }}>
                  {currentUser.role}
                </span>
              </div>
              <button
                onClick={onLogout}
                title="Log out"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  marginLeft: 4,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <LogOut size={16} />
              </button>
            </div>
          </>
        ) : (
          <button className="btn btn-primary btn-sm" onClick={onOpenAuth}>
            <User size={16} />
            <span>Sign In / Demo</span>
          </button>
        )}
      </div>
    </header>
  );
}
