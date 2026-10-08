import React, { useState, useEffect } from 'react';
import { Search, BookOpen, Clock, Award, CheckCircle2, Play, ChevronRight, Sparkles, Filter } from 'lucide-react';
import { api } from '../services/api';

export default function CourseCatalog({ currentUser, onSelectCourse, onSelectLesson, onEnrollSuccess }) {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('all'); // 'all' or 'my'

  const loadData = async () => {
    setLoading(true);
    try {
      const [catsRes, coursesRes] = await Promise.all([
        api.courses.categories(),
        viewMode === 'my' && currentUser ? api.courses.myCourses() : api.courses.list({
          category: selectedCategory,
          level: selectedLevel,
          search: searchQuery,
        }),
      ]);
      setCategories(catsRes);

      if (viewMode === 'my') {
        // Normalize myCourses response
        setCourses(coursesRes.map(e => ({
          ...e.course,
          progress_percentage: e.progress_percentage,
          is_completed: e.is_completed,
          is_enrolled: true,
        })));
      } else {
        setCourses(coursesRes);
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCategory, selectedLevel, searchQuery, viewMode]);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px 40px 16px' }}>
      {/* Hero Banner */}
      <div className="glass-panel" style={{
        padding: '32px 36px',
        marginBottom: 32,
        borderRadius: 'var(--radius-xl)',
        background: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-surface-elevated) 100%)',
        border: '1px solid var(--border-glow)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 20,
      }}>
        <div style={{ maxWidth: 650 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span className="badge badge-xp">🎮 Interactive Gamified Learning</span>
            <span className="badge badge-cyan">🤖 AI Personal Tutor Integrated</span>
          </div>
          <h1 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: 12, lineHeight: 1.15 }}>
            Master Skills. Earn XP. <br />
            <span style={{
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Powered by EduPlay AI Tutor.
            </span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.6 }}>
            Explore industry-crafted curriculums with live lesson grounding. Ask the LangChain AI Tutor anytime for analogies, step-by-step doubt solving, and earn verified certificates on completion!
          </p>
        </div>

        {/* Floating Quick Stats Card */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px 24px',
          minWidth: 240,
          boxShadow: 'var(--shadow-card)',
        }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', fontWeight: 600 }}>
            Curriculum Highlights
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>AI Grounding</span>
              <span className="badge badge-cyan">LangChain</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>AI Models</span>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--secondary)' }}>Qwen 2.5 & Gemini</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Credentials</span>
              <span className="badge badge-xp">Verified PDF</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Mode Switcher: All Courses vs My Enrolled */}
          <div style={{ display: 'flex', gap: 8, background: 'var(--bg-surface-elevated)', padding: 4, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <button
              className={`btn ${viewMode === 'all' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => setViewMode('all')}
            >
              All Courses ({courses.length})
            </button>
            {currentUser && (
              <button
                className={`btn ${viewMode === 'my' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                onClick={() => setViewMode('my')}
              >
                My Enrolled Courses
              </button>
            )}
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', minWidth: 280, flex: 1, maxWidth: 450 }}>
            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: 12 }} />
            <input
              type="text"
              className="input-control"
              style={{ paddingLeft: 42 }}
              placeholder="Search topics, LLMs, React..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Difficulty Level Dropdown */}
          <select
            className="input-control"
            style={{ width: 'auto', minWidth: 140 }}
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
          >
            <option value="">All Levels</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            className={`btn ${selectedCategory === '' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setSelectedCategory('')}
          >
            All Categories
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              className={`btn ${selectedCategory === c.slug ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => setSelectedCategory(c.slug)}
            >
              <span>{c.icon || '📘'}</span>
              <span>{c.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Courses Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>⚡</div>
          Loading EduPlay AI curriculum...
        </div>
      ) : courses.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '50px 20px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🔍</div>
          <h3>No courses found</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: 6 }}>
            {viewMode === 'my' ? "You haven't enrolled in any courses yet. Browse all courses above!" : "Try adjusting your search or category filters."}
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: 24,
        }}>
          {courses.map((course) => (
            <div
              key={course.id}
              className="glass-panel glass-panel-interactive"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: 24,
                cursor: 'pointer',
              }}
              onClick={() => onSelectCourse(course.id)}
            >
              <div>
                {/* Header row with icon and badges */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div style={{
                    width: 50,
                    height: 50,
                    borderRadius: 14,
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.7rem',
                  }}>
                    {course.thumbnail || '🎯'}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <span className="badge badge-cyan">{course.level}</span>
                    <span className="badge badge-xp">+{course.xp_reward} XP</span>
                  </div>
                </div>

                {/* Category & Title */}
                <div style={{ fontSize: '0.8rem', color: 'var(--secondary)', fontWeight: 600, marginBottom: 4 }}>
                  {course.category_icon} {course.category_name}
                </div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: 8, lineHeight: 1.3 }}>
                  {course.title}
                </h3>
                <p style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.875rem',
                  lineHeight: 1.5,
                  marginBottom: 18,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}>
                  {course.description}
                </p>
              </div>

              {/* Footer info & Progress */}
              <div>
                {course.is_enrolled && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.775rem', marginBottom: 4 }}>
                      <span style={{ color: 'var(--text-muted)' }}>Progress</span>
                      <span style={{ fontWeight: 700, color: course.progress_percentage >= 100 ? '#34d399' : '#818cf8' }}>
                        {course.progress_percentage}% {course.progress_percentage >= 100 ? 'Completed 🎉' : ''}
                      </span>
                    </div>
                    <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{
                        width: `${course.progress_percentage}%`,
                        height: '100%',
                        background: course.progress_percentage >= 100
                          ? 'linear-gradient(90deg, #10b981 0%, #34d399 100%)'
                          : 'linear-gradient(90deg, #6366f1 0%, #06b6d4 100%)',
                        transition: 'width 0.4s ease',
                      }} />
                    </div>
                  </div>
                )}

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: 14,
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                }}>
                  <div style={{ display: 'flex', gap: 14 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <BookOpen size={14} /> {course.total_lessons} Lessons
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={14} /> {course.total_duration}m
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--primary)', fontWeight: 600 }}>
                    {course.is_enrolled ? (course.progress_percentage >= 100 ? 'View Certificate' : 'Resume') : 'Explore'}
                    <ChevronRight size={14} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
