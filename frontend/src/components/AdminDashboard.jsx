import React, { useState, useEffect } from 'react';
import {
  Shield, Users, BookOpen, Award, Bot, Settings, Plus, Check, RefreshCw,
  AlertCircle, ToggleLeft, ToggleRight, Trash2, List, FileText, ChevronRight,
  Search, Filter, X, Sparkles, Clock, Layers
} from 'lucide-react';
import { api } from '../services/api';

export default function AdminDashboard({
  currentUser,
  activeTab = 'overview',
  onTabChange,
  onRefreshUser,
}) {
  const [overview, setOverview] = useState(null);
  const [currentTab, setCurrentTab] = useState(activeTab || 'overview');
  const [usersList, setUsersList] = useState([]);
  const [coursesList, setCoursesList] = useState([]);
  const [settingsData, setSettingsData] = useState({
    DEFAULT_AI_PROVIDER: 'ollama',
    SITE_TITLE: 'EduPlay AI',
    ANNOUNCEMENT: '',
  });

  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState(null);

  // Search and filter for courses
  const [courseSearch, setCourseSearch] = useState('');
  const [courseCategoryFilter, setCourseCategoryFilter] = useState('ALL');

  // New course form modal state
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    category: 'Artificial Intelligence',
    level: 'Beginner',
    xp_reward: 500,
  });

  // Multiple initial lessons inside course creation form
  const [initialLessons, setInitialLessons] = useState([
    {
      title: 'Introduction & Core Concepts',
      description: 'Foundations and primary principles.',
      content: '## Overview\n\nWelcome to this lesson. Here we cover the essential principles and real-world intuition.\n\n### Key Concepts\n- Core definition\n- Key mechanics\n- Best practices',
      duration_minutes: 15,
      xp_reward: 50,
    }
  ]);

  // Add Lesson to existing course modal state
  const [activeCourseForNewLesson, setActiveCourseForNewLesson] = useState(null);
  const [newLessonData, setNewLessonData] = useState({
    title: '',
    description: '',
    content: '',
    duration_minutes: 15,
    xp_reward: 50,
  });

  // Manage / View Lessons modal state
  const [activeCourseLessonsModal, setActiveCourseLessonsModal] = useState(null);
  const [courseLessonsLoading, setCourseLessonsLoading] = useState(false);

  // Synchronize tab with parent (e.g. from standalone admin navbar)
  useEffect(() => {
    if (activeTab) {
      setCurrentTab(activeTab);
    }
  }, [activeTab]);

  const handleSelectTab = (tab) => {
    setCurrentTab(tab);
    if (onTabChange) onTabChange(tab);
  };

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

  const handleDeleteCourse = async (courseId, title) => {
    if (!window.confirm(`Are you sure you want to delete course "${title}"? This will delete all its lessons and data.`)) {
      return;
    }
    try {
      await api.admin.deleteCourse(courseId);
      setActionMessage(`Course "${title}" was successfully deleted.`);
      loadAllAdminData();
    } catch (err) {
      setActionMessage(err.message || 'Failed to delete course');
    }
  };

  // Add lesson row to course creation form
  const handleAddInitialLessonRow = () => {
    setInitialLessons(prev => [
      ...prev,
      {
        title: `Lesson ${prev.length + 1}`,
        description: '',
        content: `## Lesson ${prev.length + 1}\n\nDetailed educational content for this topic.`,
        duration_minutes: 15,
        xp_reward: 50,
      }
    ]);
  };

  const handleRemoveInitialLessonRow = (index) => {
    if (initialLessons.length <= 1) return;
    setInitialLessons(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateInitialLesson = (index, field, value) => {
    setInitialLessons(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Submit new course with all initial lessons
  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...newCourse,
        lessons: initialLessons.filter(l => l.title.trim().length > 0),
      };
      const res = await api.admin.createCourse(payload);
      setActionMessage(res.message || `Course "${newCourse.title}" successfully created!`);
      setShowCourseForm(false);
      setNewCourse({
        title: '',
        description: '',
        category: 'Artificial Intelligence',
        level: 'Beginner',
        xp_reward: 500,
      });
      setInitialLessons([
        {
          title: 'Introduction & Core Concepts',
          description: 'Foundations and primary principles.',
          content: '## Overview\n\nWelcome to this lesson. Here we cover the essential principles and real-world intuition.\n\n### Key Concepts\n- Core definition\n- Key mechanics\n- Best practices',
          duration_minutes: 15,
          xp_reward: 50,
        }
      ]);
      await loadAllAdminData();
    } catch (err) {
      setActionMessage(err.message || 'Failed to create course');
    }
  };

  // Open "Manage Lessons" modal for a specific course
  const handleOpenLessonsModal = async (course) => {
    setActiveCourseLessonsModal(course);
    setCourseLessonsLoading(true);
    try {
      const detail = await api.admin.getCourseDetail(course.id);
      setActiveCourseLessonsModal(detail);
    } catch (err) {
      console.error('Failed to load course lessons:', err);
    } finally {
      setCourseLessonsLoading(false);
    }
  };

  // Delete a lesson from an existing course
  const handleDeleteLesson = async (lessonId, lessonTitle) => {
    if (!window.confirm(`Delete lesson "${lessonTitle}"?`)) return;
    try {
      await api.admin.deleteLesson(lessonId);
      setActionMessage(`Lesson "${lessonTitle}" deleted.`);
      if (activeCourseLessonsModal) {
        const detail = await api.admin.getCourseDetail(activeCourseLessonsModal.id);
        setActiveCourseLessonsModal(detail);
      }
      loadAllAdminData();
    } catch (err) {
      setActionMessage(err.message || 'Failed to delete lesson');
    }
  };

  // Submit adding a single lesson to an existing course
  const handleCreateLessonSubmit = async (e) => {
    e.preventDefault();
    if (!activeCourseForNewLesson) return;
    try {
      await api.admin.createLesson(activeCourseForNewLesson.id, newLessonData);
      setActionMessage(`Lesson "${newLessonData.title}" added to "${activeCourseForNewLesson.title}"!`);
      setActiveCourseForNewLesson(null);
      setNewLessonData({
        title: '',
        description: '',
        content: '',
        duration_minutes: 15,
        xp_reward: 50,
      });
      loadAllAdminData();
      if (activeCourseLessonsModal && activeCourseLessonsModal.id === activeCourseForNewLesson.id) {
        const detail = await api.admin.getCourseDetail(activeCourseForNewLesson.id);
        setActiveCourseLessonsModal(detail);
      }
    } catch (err) {
      setActionMessage(err.message || 'Failed to add lesson');
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

  // Compute categories for course filter
  const uniqueCategories = ['ALL', ...Array.from(new Set(coursesList.map(c => c.category).filter(Boolean)))];

  const filteredCourses = coursesList.filter(c => {
    const matchesCategory = courseCategoryFilter === 'ALL' || c.category === courseCategoryFilter;
    const matchesSearch = !courseSearch ||
      c.title.toLowerCase().includes(courseSearch.toLowerCase()) ||
      (c.author && c.author.toLowerCase().includes(courseSearch.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px 50px 16px' }}>
      {/* Top Banner Navigation & Status */}
      <div className="glass-panel" style={{
        padding: '24px 32px',
        marginBottom: 24,
        borderRadius: 'var(--radius-xl)',
        background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.75) 0%, rgba(15, 23, 42, 0.95) 100%)',
        border: '1px solid rgba(239, 68, 68, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 50,
            height: 50,
            borderRadius: 14,
            background: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.7rem',
            boxShadow: '0 4px 16px rgba(239, 68, 68, 0.4)',
            color: '#fff',
          }}>
            🛡️
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800 }}>Admin Portal</h2>
              <span className="badge badge-role" style={{ fontSize: '0.7rem' }}>Administrator Console</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Dedicated control console — Create & manage courses, curriculum lessons, users, and AI defaults.
            </p>
          </div>
        </div>

        {/* Console Subtabs */}
        <div style={{
          display: 'flex',
          gap: 6,
          background: 'rgba(15, 23, 42, 0.85)',
          padding: 5,
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          flexWrap: 'wrap',
        }}>
          <button
            className={`btn ${currentTab === 'overview' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => handleSelectTab('overview')}
          >
            📊 Overview
          </button>
          <button
            className={`btn ${currentTab === 'courses' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => handleSelectTab('courses')}
          >
            📚 Courses & Curriculum ({coursesList.length})
          </button>
          <button
            className={`btn ${currentTab === 'users' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => handleSelectTab('users')}
          >
            👥 Users ({usersList.length})
          </button>
          <button
            className={`btn ${currentTab === 'settings' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => handleSelectTab('settings')}
          >
            ⚙️ Settings & AI
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
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span>{actionMessage}</span>
          <button
            onClick={() => setActionMessage(null)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px' }} />
          Loading administrative metrics & courses...
        </div>
      ) : currentTab === 'overview' && overview ? (
        /* Overview KPI & Metrics Tab */
        <div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
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
                {overview.overview.users_count} Learners • {overview.overview.admins_count} Administrators
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
                {overview.overview.total_lessons} Total Lessons Published
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '20px 22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: 6 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Student Enrollments</span>
                <Award size={16} color="var(--accent-gold)" />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-gold)' }}>
                {overview.overview.total_enrollments}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                {overview.overview.completed_enrollments} Completed ({overview.overview.completion_rate}%)
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '20px 22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: 6 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>AI Tutor Queries</span>
                <Bot size={16} color="var(--primary)" />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#a855f7' }}>
                {overview.overview.total_tutor_messages}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                {overview.overview.ollama_messages} Standard AI • {overview.overview.gemini_messages} Cloud AI
              </div>
            </div>
          </div>

          {/* Quick Actions & Recent Activity */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div className="glass-panel" style={{ padding: 24 }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: 14 }}>🚀 Quick Management Actions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    handleSelectTab('courses');
                    setShowCourseForm(true);
                  }}
                  style={{ justifyContent: 'flex-start' }}
                >
                  <Plus size={16} />
                  <span>Create New Course with Lessons</span>
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => handleSelectTab('courses')}
                  style={{ justifyContent: 'flex-start' }}
                >
                  <BookOpen size={16} />
                  <span>Manage Platform Curriculum ({coursesList.length} courses)</span>
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => handleSelectTab('users')}
                  style={{ justifyContent: 'flex-start' }}
                >
                  <Users size={16} />
                  <span>Review Registered Learners ({usersList.length} accounts)</span>
                </button>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: 24 }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: 14 }}>🎓 Recently Issued Certificates</h3>
              {overview.recent_certificates && overview.recent_certificates.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {overview.recent_certificates.map((rc, idx) => (
                    <div key={idx} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.8rem',
                      padding: '8px 10px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: 6,
                    }}>
                      <div>
                        <strong>{rc.user_name}</strong> — {rc.course_title}
                      </div>
                      <span style={{ color: 'var(--text-muted)' }}>{rc.issue_date}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No certificates issued yet.</div>
              )}
            </div>
          </div>
        </div>
      ) : currentTab === 'courses' ? (
        /* Standalone Course & Curriculum Control Tab */
        <div>
          {/* Action Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
            flexWrap: 'wrap',
            gap: 12,
          }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Curriculum & Course Management</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Add new courses, configure lessons, and control publication status.
              </p>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => setShowCourseForm(!showCourseForm)}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <Plus size={16} />
              <span>{showCourseForm ? 'Cancel Course Creation' : '➕ Add New Course'}</span>
            </button>
          </div>

          {/* Search and Category Filters */}
          <div className="glass-panel" style={{
            padding: '14px 18px',
            marginBottom: 20,
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}>
            <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="input-control"
                placeholder="Search courses by title or author..."
                value={courseSearch}
                onChange={e => setCourseSearch(e.target.value)}
                style={{ paddingLeft: 36 }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Filter size={15} color="var(--text-muted)" />
              <select
                className="input-control"
                value={courseCategoryFilter}
                onChange={e => setCourseCategoryFilter(e.target.value)}
                style={{ width: 'auto', minWidth: 180 }}
              >
                {uniqueCategories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'ALL' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* CREATE NEW COURSE FORM */}
          {showCourseForm && (
            <div className="glass-panel animate-slide-in" style={{
              padding: 28,
              marginBottom: 24,
              border: '1px solid var(--border-glow)',
              background: 'var(--bg-surface-elevated)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h4 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Add New Course to Curriculum</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Fill in course metadata and build its initial lessons.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCourseForm(false)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateCourse} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Course Metadata Fields */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>
                      Course Title *
                    </label>
                    <input
                      type="text"
                      className="input-control"
                      placeholder="Course title"
                      required
                      value={newCourse.title}
                      onChange={e => setNewCourse({ ...newCourse, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>
                      Category
                    </label>
                    <input
                      type="text"
                      className="input-control"
                      placeholder="Course category or topic"
                      value={newCourse.category}
                      onChange={e => setNewCourse({ ...newCourse, category: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>
                    Course Description & Learning Outcomes
                  </label>
                  <textarea
                    className="input-control"
                    placeholder="Course overview and learning objectives"
                    rows={3}
                    value={newCourse.description}
                    onChange={e => setNewCourse({ ...newCourse, description: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>
                      Difficulty Level
                    </label>
                    <select
                      className="input-control"
                      value={newCourse.level}
                      onChange={e => setNewCourse({ ...newCourse, level: e.target.value })}
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>
                      Completion XP Awarded to Learners
                    </label>
                    <input
                      type="number"
                      className="input-control"
                      placeholder="Completion XP reward"
                      value={newCourse.xp_reward}
                      onChange={e => setNewCourse({ ...newCourse, xp_reward: parseInt(e.target.value) || 500 })}
                    />
                  </div>
                </div>

                {/* LESSONS BUILDER SECTION */}
                <div style={{
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: 18,
                  marginTop: 6,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div>
                      <h5 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>📖 Course Lessons ({initialLessons.length})</span>
                        <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>Sequential Syllabus</span>
                      </h5>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Add multiple lessons so learners have a complete course journey and the AI Tutor has a full curriculum.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={handleAddInitialLessonRow}
                    >
                      <Plus size={14} />
                      <span>Add Another Lesson</span>
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {initialLessons.map((lesson, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-md)',
                          padding: 16,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>
                            Lesson #{idx + 1}
                          </span>
                          {initialLessons.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveInitialLessonRow(idx)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#f87171',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              <Trash2 size={13} />
                              <span>Remove</span>
                            </button>
                          )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
                          <div>
                            <input
                              type="text"
                              className="input-control"
                              placeholder={`Lesson ${idx + 1} title`}
                              required
                              value={lesson.title}
                              onChange={e => handleUpdateInitialLesson(idx, 'title', e.target.value)}
                            />
                          </div>
                          <div>
                            <input
                              type="number"
                              className="input-control"
                              placeholder="Duration in minutes"
                              value={lesson.duration_minutes}
                              onChange={e => handleUpdateInitialLesson(idx, 'duration_minutes', parseInt(e.target.value) || 15)}
                            />
                          </div>
                          <div>
                            <input
                              type="number"
                              className="input-control"
                              placeholder="Lesson XP reward"
                              value={lesson.xp_reward}
                              onChange={e => handleUpdateInitialLesson(idx, 'xp_reward', parseInt(e.target.value) || 50)}
                            />
                          </div>
                        </div>

                        <div style={{ marginBottom: 10 }}>
                          <input
                            type="text"
                            className="input-control"
                            placeholder="Brief lesson summary"
                            value={lesson.description}
                            onChange={e => handleUpdateInitialLesson(idx, 'description', e.target.value)}
                          />
                        </div>

                        <div>
                          <textarea
                            className="input-control"
                            placeholder="Lesson content and learning materials (Markdown)"
                            rows={4}
                            value={lesson.content}
                            onChange={e => handleUpdateInitialLesson(idx, 'content', e.target.value)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                  <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px' }}>
                    <Check size={16} />
                    <span>Create Course & Publish</span>
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowCourseForm(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* COURSES TABLE */}
          <div className="glass-panel" style={{ padding: 24, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px 14px' }}>Course Title</th>
                  <th style={{ padding: '12px 14px' }}>Category</th>
                  <th style={{ padding: '12px 14px' }}>Level</th>
                  <th style={{ padding: '12px 14px' }}>Lessons</th>
                  <th style={{ padding: '12px 14px' }}>Learners Enrolled</th>
                  <th style={{ padding: '12px 14px' }}>Status</th>
                  <th style={{ padding: '12px 14px' }}>Curriculum Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCourses.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No courses found matching filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredCourses.map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{c.title}</div>
                        <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                          Created by {c.author} • {c.xp_reward} completion XP
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span className="badge badge-cyan" style={{ fontSize: '0.75rem' }}>
                          {c.category}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{c.level}</span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          fontWeight: 700,
                          color: c.total_lessons > 1 ? '#38bdf8' : '#fbbf24',
                          fontSize: '0.85rem'
                        }}>
                          {c.total_lessons} {c.total_lessons === 1 ? 'lesson' : 'lessons'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{c.enrollments_count}</span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span className={c.is_published ? 'badge badge-success' : 'badge badge-role'}>
                          {c.is_published ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {/* Manage / View Lessons */}
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                            onClick={() => handleOpenLessonsModal(c)}
                            title="View and manage lessons in this course"
                          >
                            <List size={13} />
                            <span>Lessons ({c.total_lessons})</span>
                          </button>

                          {/* Add Lesson */}
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 8px', fontSize: '0.75rem', borderColor: 'var(--border-glow)' }}
                            onClick={() => {
                              setActiveCourseForNewLesson(c);
                              setNewLessonData({
                                title: '',
                                description: '',
                                content: '',
                                duration_minutes: 15,
                                xp_reward: 50,
                              });
                            }}
                            title="Add a new lesson to this course"
                          >
                            <Plus size={13} color="var(--primary)" />
                            <span>Add Lesson</span>
                          </button>

                          {/* Toggle Publication */}
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                            onClick={() => handleToggleCoursePublish(c.id, c.is_published)}
                          >
                            {c.is_published ? 'Unpublish' : 'Publish'}
                          </button>

                          {/* Delete Course */}
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 8px', fontSize: '0.75rem', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                            onClick={() => handleDeleteCourse(c.id, c.title)}
                            title="Delete course"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* MODAL: ADD LESSON TO EXISTING COURSE */}
          {activeCourseForNewLesson && (
            <div className="modal-backdrop animate-fade-in" style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.75)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 300,
              padding: 16,
            }}>
              <div className="glass-panel" style={{
                maxWidth: 620,
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: 28,
                background: 'var(--bg-surface-elevated)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <h4 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Add Lesson</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Adding to course: <strong>{activeCourseForNewLesson.title}</strong>
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveCourseForNewLesson(null)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleCreateLessonSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>
                      Lesson Title *
                    </label>
                    <input
                      type="text"
                      className="input-control"
                      placeholder="Lesson title"
                      required
                      value={newLessonData.title}
                      onChange={e => setNewLessonData({ ...newLessonData, title: e.target.value })}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>
                        Estimated Duration (mins)
                      </label>
                      <input
                        type="number"
                        className="input-control"
                        value={newLessonData.duration_minutes}
                        onChange={e => setNewLessonData({ ...newLessonData, duration_minutes: parseInt(e.target.value) || 15 })}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>
                        XP Awarded
                      </label>
                      <input
                        type="number"
                        className="input-control"
                        value={newLessonData.xp_reward}
                        onChange={e => setNewLessonData({ ...newLessonData, xp_reward: parseInt(e.target.value) || 50 })}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>
                      Brief Syllabus Description
                    </label>
                    <input
                      type="text"
                      className="input-control"
                      placeholder="Brief lesson summary"
                      value={newLessonData.description}
                      onChange={e => setNewLessonData({ ...newLessonData, description: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>
                      Lesson Material & Content (Markdown)
                    </label>
                    <textarea
                      className="input-control"
                      placeholder="Full lesson content and study material (Markdown)"
                      rows={6}
                      value={newLessonData.content}
                      onChange={e => setNewLessonData({ ...newLessonData, content: e.target.value })}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                      Add Lesson to Course
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={() => setActiveCourseForNewLesson(null)}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* MODAL: MANAGE LESSONS IN COURSE */}
          {activeCourseLessonsModal && (
            <div className="modal-backdrop animate-fade-in" style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.75)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 300,
              padding: 16,
            }}>
              <div className="glass-panel" style={{
                maxWidth: 700,
                width: '100%',
                maxHeight: '85vh',
                display: 'flex',
                flexDirection: 'column',
                padding: 24,
                background: 'var(--bg-surface-elevated)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <h4 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                      Syllabus Lessons: {activeCourseLessonsModal.title}
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Total {activeCourseLessonsModal.lessons?.length || 0} sequential lessons.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveCourseLessonsModal(null)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    <X size={20} />
                  </button>
                </div>

                <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                  {courseLessonsLoading ? (
                    <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
                      Loading lesson list...
                    </div>
                  ) : !activeCourseLessonsModal.lessons || activeCourseLessonsModal.lessons.length === 0 ? (
                    <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
                      No lessons added to this course yet.
                    </div>
                  ) : (
                    activeCourseLessonsModal.lessons.map(l => (
                      <div
                        key={l.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 16px',
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-md)',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                            <span style={{ color: 'var(--primary)', marginRight: 8 }}>#{l.sequence_order}</span>
                            {l.title}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                            {l.duration_minutes} mins • +{l.xp_reward} XP • {l.description || 'No description'}
                          </div>
                        </div>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ color: '#f87171', padding: '4px 8px', fontSize: '0.75rem' }}
                          onClick={() => handleDeleteLesson(l.id, l.title)}
                          title="Delete this lesson"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: 14 }}>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      setActiveCourseForNewLesson(activeCourseLessonsModal);
                    }}
                  >
                    <Plus size={14} />
                    <span>Append New Lesson</span>
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setActiveCourseLessonsModal(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : currentTab === 'users' ? (
        /* User Accounts Management Tab */
        <div className="glass-panel" style={{ padding: 24, overflowX: 'auto' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: 16 }}>Learner & Administrator Accounts</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px 14px' }}>Username</th>
                <th style={{ padding: '12px 14px' }}>Role</th>
                <th style={{ padding: '12px 14px' }}>Earned XP</th>
                <th style={{ padding: '12px 14px' }}>Status</th>
                <th style={{ padding: '12px 14px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {usersList.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ fontWeight: 600 }}>{u.username}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</div>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <select
                      className="input-control"
                      style={{ padding: '4px 8px', fontSize: '0.8rem', width: 'auto' }}
                      value={u.role}
                      onChange={e => handleUpdateUserRole(u.id, e.target.value)}
                    >
                      <option value="user">User (Learner)</option>
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
                  <option value="ollama">Standard AI Engine (Fast & Private)</option>
                  <option value="gemini">Cloud AI Engine (Advanced Cloud Model)</option>
                </select>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  Controls the default engine for students in the AI Tutor workspace.
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

          {/* Sample Data Reset Box */}
          <div className="glass-panel" style={{ padding: 24, height: 'fit-content' }}>
            <h4 style={{ fontSize: '1.05rem', marginBottom: 10 }}>Platform Content Reset</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 16 }}>
              Reset or restore default courses, curriculum lessons, and sample accounts to the initial platform state.
            </p>
            <button
              className="btn btn-secondary"
              style={{ width: '100%', borderColor: 'rgba(245, 158, 11, 0.4)' }}
              onClick={handleSeedData}
            >
              <RefreshCw size={15} color="#fbbf24" />
              <span>Restore Default Content</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
