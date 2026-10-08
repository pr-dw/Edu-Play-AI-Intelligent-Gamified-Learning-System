import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Sparkles, Award } from 'lucide-react';
import { api } from '../services/api';

export default function LeaderboardView({ currentUser }) {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.auth.getLeaderboard().then(data => {
      setLeaders(data);
    }).catch(err => console.error(err)).finally(() => setLoading(false));
  }, []);

  const getRankBadge = (rank) => {
    if (rank === 1) return { icon: '👑', color: '#fbbf24', label: '1st Gold' };
    if (rank === 2) return { icon: '🥈', color: '#94a3b8', label: '2nd Silver' };
    if (rank === 3) return { icon: '🥉', color: '#d97706', label: '3rd Bronze' };
    return { icon: `#${rank}`, color: '#64748b', label: `#${rank}` };
  };

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 16px 50px 16px' }}>
      {/* Header */}
      <div className="glass-panel" style={{
        padding: '28px 32px',
        marginBottom: 28,
        borderRadius: 'var(--radius-xl)',
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(15, 23, 42, 0.95) 100%)',
        border: '1px solid var(--border-gold)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
      }}>
        <div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <span className="badge badge-xp">Community Rankings</span>
          </div>
          <h1 style={{ fontSize: '2rem', marginBottom: 6 }}>
            Learner Leaderboard
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Earn XP by completing lessons, interacting with your AI Tutor, and mastering courses!
          </p>
        </div>

        <div style={{
          width: 60,
          height: 60,
          borderRadius: 20,
          background: 'rgba(245, 158, 11, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2rem',
          border: '1px solid rgba(245, 158, 11, 0.4)'
        }}>
          🏆
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          Loading leaderboard rankings...
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {leaders.filter(u => u.role !== 'admin').map((user) => {
              const badge = getRankBadge(user.rank);
              const isCurrentUser = currentUser?.id === user.id;

              return (
                <div
                  key={user.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 20px',
                    borderRadius: 'var(--radius-md)',
                    background: isCurrentUser ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid',
                    borderColor: isCurrentUser ? 'var(--border-glow)' : 'var(--border-subtle)',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    {/* Rank */}
                    <div style={{
                      width: 36,
                      fontSize: '1.2rem',
                      fontWeight: 800,
                      textAlign: 'center',
                      color: badge.color
                    }}>
                      {badge.icon}
                    </div>

                    {/* Avatar */}
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.3rem',
                      border: '1px solid var(--border-subtle)',
                      overflow: 'hidden'
                    }}>
                      {user.avatar_image_url ? (
                        <img src={user.avatar_image_url} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        user.avatar || '⚡'
                      )}
                    </div>

                    {/* User info */}
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                        {user.name}
                        {isCurrentUser && (
                          <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>You</span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        @{user.username}
                      </div>
                    </div>
                  </div>

                  {/* Level & Points */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span className="badge badge-level">
                      Level {user.level}
                    </span>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fbbf24' }}>
                        {user.points} XP
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
