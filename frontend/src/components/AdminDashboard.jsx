import React, { useState, useEffect } from 'react';
import { Shield, Users, BookOpen, Award, Bot, Settings, Plus, Check, RefreshCw, AlertCircle, ToggleLeft, ToggleRight } from 'lucide-react';
import { api } from '../services/api';

export default function AdminDashboard({ currentUser, onRefreshUser }) {
  const [overview, setOverview] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'users', 'courses', 'settings'
  const [usersList, setUsersList] = useState([]);
  const [coursesList, setCoursesList] = useState([]);
  const [settingsData, setSettingsData] = useState({
    DEFAULT_AI_PROVIDER: 'ollama',
    SITE_TITLE: 'EduPlay AI',
    ANNOUNCEMENT: '',
  });

  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState(null);

  // New course form
  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    category: 'Artificial Intelligence',
    level: 'Beginner',
    xp_reward: 500,
  });
  const [showCourseForm, setShowCourseForm] = useState(false);

  const loadAllAdminData = async () => {
    setLoading(true);
    setActionMessage(null);
    try {
      const [ov, uList, cList, sets] = await Promise.all([
        api.admin.getOverview(),
        api.admin.getUsers(),
        api.admin.getCourses(),
        api.admin.getSettings(),
      ]);
      setOverview(ov);
      setUsersList(uList);
      setCoursesList(cList);
      setSettingsData(sets);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllAdminData();
  }, []);

  const handleUpdateUserRole = async (userId, newRole) => {
    try {
      await api.admin.updateUser({ user_id: userId, role: newRole });
      setActionMessage(`Updated user role to ${newRole}`);
      loadAllAdminData();
    } catch (err) {
      setActionMessage(err.message || 'Failed to update user');
    }
  };

  const handleToggleUserActive = async (userId, currentActive) => {
    try {
      await api.admin.updateUser({ user_id: userId, is_active: !currentActive });
      setActionMessage(`Toggled user active status`);
      loadAllAdminData();
    } catch (err) {
      setActionMessage(err.message || 'Failed to update user status');
    }
  };

  const handleToggleCoursePublish = async (courseId, currentPublished) => {
    try {
      await api.admin.updateCourse({ course_id: courseId, is_published: !currentPublished });
      setActionMessage(`Updated course publication state`);
      loadAllAdminData();
    } catch (err) {
      setActionMessage(err.message || 'Failed to update course');
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      await api.admin.createCourse(newCourse);
      setActionMessage(`Course "${newCourse.title}" successfully created!`);
      setShowCourseForm(false);
      setNewCourse({
        title: '',
        description: '',
        category: 'Artificial Intelligence',
        level: 'Beginner',
        xp_reward: 500,
      });
      loadAllAdminData();
    } catch (err) {
      setActionMessage(err.message || 'Failed to create course');
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await api.admin.updateSettings(settingsData);
      setActionMessage('Platform and AI configurations updated successfully!');
    } catch (err) {
      setActionMessage(err.message || 'Failed to save settings');
    }
  };

  const handleSeedData = async () => {
    setLoading(true);
    try {
      const res = await api.admin.seedData();
      setActionMessage(res.message);
      await loadAllAdminData();
      if (onRefreshUser) onRefreshUser();
    } catch (err) {
      setActionMessage(err.message || 'Failed to seed data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 1150, margin: '0 auto', padding: '0 16px 50px 16px' }}>
      {/* Admin Header */}
      <div className="glass-panel" style={{
        padding: '24px 32px',
        marginBottom: 24,
        borderRadius: 'var(--radius-xl)',
        background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.7) 0%, rgba(15, 23, 42, 0.95) 100%)',
        border: '1px solid rgba(239, 68, 68, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.6rem',
            boxShadow: '0 4px 16px rgba(239, 68, 68, 0.4)'
          }}>
            🛡️
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ fontSize: '1.4rem' }}>Administration Console</h2>
              <span className="badge badge-role">Admin Control Panel</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Manage users, courses, certificates, and configure LangChain AI Tutor defaults
            </p>
          </div>
        </div>

        {/* Sub tabs */}
        <div style={{ display: 'flex', gap: 8, background: 'rgba(15, 23, 42, 0.8)', padding: 4, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <button
            className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setActiveTab('users')}
          >
            Users ({usersList.length})
          </button>
          <button
            className={`btn ${activeTab === 'courses' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setActiveTab('courses')}
          >
            Courses ({coursesList.length})
          </button>
          <button
            className={`btn ${activeTab === 'settings' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setActiveTab('settings')}
          >
            Settings & AI
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="glass-panel animate-slide-in" style={{
          padding: '12px 18px',
          marginBottom: 20,
          background: 'rgba(99, 102, 241, 0.15)',
          border: '1px solid var(--border-glow)',
          fontSize: '0.875rem',
          color: '#cbd5e1',
        }}>
          {actionMessage}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          Loading administrative metrics...
        </div>
      ) : activeTab === 'overview' && overview ? (
        <div>
          {/* KPI Cards Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: 16,
            marginBottom: 24,
          }}>
            <div className="glass-panel" style={{ padding: '20px 22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: 6 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Total Users</span>
                <Users size={16} />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc' }}>
                {overview.overview.total_users}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                {overview.overview.users_count} Users • {overview.overview.admins_count} Administrators
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '20px 22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: 6 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Courses & Lessons</span>
                <BookOpen size={16} />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#38bdf8' }}>
                {overview.overview.total_courses}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                {overview.overview.total_lessons} Lessons Published
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '20px 22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: 6 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Completion Rate</span>
                <Award size={16} />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#34d399' }}>
                {overview.overview.completion_rate}%
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                {overview.overview.completed_enrollments} of {overview.overview.total_enrollments} Enrollments
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '20px 22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: 6 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Certificates Issued</span>
                <Award size={16} color="#fbbf24" />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fbbf24' }}>
                {overview.overview.certificates_issued}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                100% Mastery Verified
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '20px 22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: 6 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>AI Tutor Queries</span>
                <Bot size={16} color="#818cf8" />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#818cf8' }}>
                {overview.overview.total_tutor_messages}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                Ollama: {overview.overview.ollama_messages} • Gemini: {overview.overview.gemini_messages}
              </div>
            </div>
          </div>

          {/* Quick Tables: Recent Users & Recent Certificates */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Recent Users */}
            <div className="glass-panel" style={{ padding: 22 }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: 14 }}>Recently Joined Users</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {overview.recent_users.map(u => (
                  <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{u.username}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.date_joined}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span className="badge badge-role" style={{ fontSize: '0.65rem' }}>{u.role}</span>
                      <span style={{ fontWeight: 700, color: '#fbbf24', fontSize: '0.85rem' }}>{u.points} XP</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Certificates */}
            <div className="glass-panel" style={{ padding: 22 }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: 14 }}>Recently Issued Certificates</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {overview.recent_certificates.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No certificates issued yet. Complete a course to generate one!</div>
                ) : overview.recent_certificates.map((c, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{c.user_name || c.student_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.course_title}</div>
                    </div>
                    <span className="badge badge-xp" style={{ fontSize: '0.65rem' }}>{c.certificate_id}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'users' ? (
        /* User Management Table */
        <div className="glass-panel" style={{ padding: 24, overflowX: 'auto' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: 16 }}>Registered Users & Role Management</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px 14px' }}>User</th>
                <th style={{ padding: '12px 14px' }}>Email</th>
                <th style={{ padding: '12px 14px' }}>Current Role</th>
                <th style={{ padding: '12px 14px' }}>Gamification</th>
                <th style={{ padding: '12px 14px' }}>Status</th>
                <th style={{ padding: '12px 14px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {usersList.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 600 }}>
                    {u.name || u.username} <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>({u.username})</span>
                  </td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>{u.email}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <select
                      className="input-control"
                      style={{ padding: '4px 8px', fontSize: '0.8rem', width: 'auto' }}
                      value={u.role}
                      onChange={(e) => handleUpdateUserRole(u.id, e.target.value)}
                    >
                      <option value="user">User</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ color: '#fbbf24', fontWeight: 700 }}>{u.points} XP</span> (Lvl {u.level})
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span className={u.is_active ? 'badge badge-success' : 'badge badge-role'}>
                      {u.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                      onClick={() => handleToggleUserActive(u.id, u.is_active)}
                    >
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : activeTab === 'courses' ? (
        /* Course Management Table */
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: '1.2rem' }}>Platform Courses & Curriculum Control</h3>
            <button className="btn btn-primary btn-sm" onClick={() => setShowCourseForm(!showCourseForm)}>
              <Plus size={16} />
              <span>{showCourseForm ? 'Cancel' : 'Create New Course'}</span>
            </button>
          </div>

          {/* New Course Form Modal */}
          {showCourseForm && (
            <div className="glass-panel animate-slide-in" style={{ padding: 24, marginBottom: 20 }}>
              <h4 style={{ marginBottom: 14 }}>Add New Course</h4>
              <form onSubmit={handleCreateCourse} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input
                  type="text"
                  className="input-control"
                  placeholder="Course Title"
                  required
                  value={newCourse.title}
                  onChange={e => setNewCourse({ ...newCourse, title: e.target.value })}
                />
                <textarea
                  className="input-control"
                  placeholder="Course Description & Learning Outcomes"
                  rows={3}
                  value={newCourse.description}
                  onChange={e => setNewCourse({ ...newCourse, description: e.target.value })}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  <input
                    type="text"
                    className="input-control"
                    placeholder="Category (e.g. Artificial Intelligence)"
                    value={newCourse.category}
                    onChange={e => setNewCourse({ ...newCourse, category: e.target.value })}
                  />
                  <select
                    className="input-control"
                    value={newCourse.level}
                    onChange={e => setNewCourse({ ...newCourse, level: e.target.value })}
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                  <input
                    type="number"
                    className="input-control"
                    placeholder="Completion XP Reward"
                    value={newCourse.xp_reward}
                    onChange={e => setNewCourse({ ...newCourse, xp_reward: parseInt(e.target.value) || 500 })}
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
                  Save and Publish Course
                </button>
              </form>
            </div>
          )}

          <div className="glass-panel" style={{ padding: 24, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px 14px' }}>Course Title</th>
                  <th style={{ padding: '12px 14px' }}>Category</th>
                  <th style={{ padding: '12px 14px' }}>Author</th>
                  <th style={{ padding: '12px 14px' }}>Lessons</th>
                  <th style={{ padding: '12px 14px' }}>Enrolled</th>
                  <th style={{ padding: '12px 14px' }}>Status</th>
                  <th style={{ padding: '12px 14px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {coursesList.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 600 }}>{c.title}</td>
                    <td style={{ padding: '12px 14px' }}>{c.category}</td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>{c.author || c.instructor}</td>
                    <td style={{ padding: '12px 14px' }}>{c.total_lessons}</td>
                    <td style={{ padding: '12px 14px' }}>{c.enrollments_count}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span className={c.is_published ? 'badge badge-success' : 'badge badge-role'}>
                        {c.is_published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                        onClick={() => handleToggleCoursePublish(c.id, c.is_published)}
                      >
                        {c.is_published ? 'Unpublish' : 'Publish'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Settings & AI configuration Tab */
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
          <div className="glass-panel" style={{ padding: 28 }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: 16 }}>Platform & AI Engine Configurations</h3>
            <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Default AI Tutor Engine
                </label>
                <select
                  className="input-control"
                  value={settingsData.DEFAULT_AI_PROVIDER}
                  onChange={e => setSettingsData({ ...settingsData, DEFAULT_AI_PROVIDER: e.target.value })}
                >
                  <option value="ollama">Ollama (Qwen 2.5: 3B) - Local / Free</option>
                  <option value="gemini">Google Gemini API - Cloud Frontier</option>
                </select>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  Controls the pre-selected engine for students in the AI Tutor workspace.
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Platform Site Title
                </label>
                <input
                  type="text"
                  className="input-control"
                  value={settingsData.SITE_TITLE}
                  onChange={e => setSettingsData({ ...settingsData, SITE_TITLE: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Platform Announcement Banner
                </label>
                <input
                  type="text"
                  className="input-control"
                  value={settingsData.ANNOUNCEMENT}
                  onChange={e => setSettingsData({ ...settingsData, ANNOUNCEMENT: e.target.value })}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
                Save System Settings
              </button>
            </form>
          </div>

          {/* Quick Database Seed Box */}
          <div className="glass-panel" style={{ padding: 24, height: 'fit-content' }}>
            <h4 style={{ fontSize: '1.05rem', marginBottom: 10 }}>Database Seeding & Reset</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 16 }}>
              Quickly seed or refresh demo courses, lessons, and demo accounts (User Prabhat, User Alex, Platform Admin).
            </p>
            <button
              className="btn btn-secondary"
              style={{ width: '100%', borderColor: 'rgba(245, 158, 11, 0.4)' }}
              onClick={handleSeedData}
            >
              <RefreshCw size={15} color="#fbbf24" />
              <span>Seed / Reset Demo Data</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
