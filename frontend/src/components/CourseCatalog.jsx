import React, { useState, useEffect } from 'react';
import { Search, BookOpen, Clock, Award, CheckCircle2, Play, ChevronRight, Sparkles, Filter, SlidersHorizontal, Compass, X, RotateCcw } from 'lucide-react';
import { api } from '../services/api';

export default function CourseCatalog({ currentUser, onSelectCourse, onSelectLesson, onEnrollSuccess }) {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('discover'); // 'discover', 'enrolled', or 'completed'
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [catsRes, allCoursesRes, myCoursesRes] = await Promise.all([
        api.courses.categories(),
        api.courses.list({
          category: selectedCategory,
          level: selectedLevel,
          search: searchQuery,
        }),
        currentUser ? api.courses.myCourses() : Promise.resolve([]),
      ]);

      setCategories(catsRes);

      // Extract set of enrolled course IDs (covers both in-progress and completed courses)
      const enrolledCourseIds = new Set(myCoursesRes.map(e => e.course.id));

      if (viewMode === 'discover') {
        // DISCOVER: Only courses that the user is NOT enrolled in and has NOT completed
        let discoverList;
        if (currentUser) {
          discoverList = allCoursesRes.filter(c => !enrolledCourseIds.has(c.id));
        } else {
          discoverList = allCoursesRes;
        }
        setCourses(discoverList);

      } else if (viewMode === 'enrolled') {
        // CURRENTLY ENROLLED: Active in-progress courses (not yet completed)
        let list = myCoursesRes
          .filter(e => !e.is_completed && e.progress_percentage < 100)
          .map(e => ({
            ...e.course,
            progress_percentage: e.progress_percentage,
            is_completed: false,
            is_enrolled: true,
          }));

        if (selectedCategory) {
          list = list.filter(c => c.category?.slug === selectedCategory);
        }
        if (selectedLevel) {
          list = list.filter(c => c.level === selectedLevel);
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          list = list.filter(c => c.title?.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q));
        }
        setCourses(list);

      } else if (viewMode === 'completed') {
        // COMPLETED COURSES: Courses with 100% progress or marked completed
        let list = myCoursesRes
          .filter(e => e.is_completed || e.progress_percentage >= 100)
          .map(e => ({
            ...e.course,
            progress_percentage: 100,
            is_completed: true,
            is_enrolled: true,
          }));

        if (selectedCategory) {
          list = list.filter(c => c.category?.slug === selectedCategory);
        }
        if (selectedLevel) {
          list = list.filter(c => c.level === selectedLevel);
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          list = list.filter(c => c.title?.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q));
        }
        setCourses(list);
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCategory, selectedLevel, searchQuery, viewMode, currentUser]);

  const activeFiltersCount = (selectedCategory ? 1 : 0) + (selectedLevel ? 1 : 0);

  const handleClearFilters = () => {
    setSelectedCategory('');
    setSelectedLevel('');
  };

  const getActiveCategoryName = () => {
    const cat = categories.find(c => c.slug === selectedCategory);
    return cat ? `${cat.icon || '📘'} ${cat.name}` : selectedCategory;
  };

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
            Explore industry-crafted curriculums with interactive lessons. Ask your Personal AI Tutor anytime for analogies, explanations, and step-by-step guidance, and earn verified certificates on completion!
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
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>AI Mentoring</span>
              <span className="badge badge-cyan">24/7 Guidance</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Study Support</span>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--secondary)' }}>Personalized</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Credentials</span>
              <span className="badge badge-xp">Verified PDF</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs and Search / Filter Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Mode Switcher: Discover vs Currently Enrolled vs Completed Courses */}
          <div style={{
            display: 'flex',
            gap: 6,
            background: 'var(--bg-surface-elevated)',
            padding: 4,
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            flexWrap: 'wrap'
          }}>
            <button
              className={`btn ${viewMode === 'discover' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => setViewMode('discover')}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Compass size={15} />
              <span>Discover</span>
            </button>
            {currentUser && (
              <>
                <button
                  className={`btn ${viewMode === 'enrolled' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                  onClick={() => setViewMode('enrolled')}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Clock size={15} />
                  <span>Currently Enrolled</span>
                </button>
                <button
                  className={`btn ${viewMode === 'completed' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                  onClick={() => setViewMode('completed')}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <CheckCircle2 size={15} color="#10b981" />
                  <span>Completed Courses</span>
                </button>
              </>
            )}
          </div>

          {/* Right Side: Search & Filter Button */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flex: 1, justifyContent: 'flex-end', minWidth: 320 }}>
            {/* Search Box */}
            <div style={{ position: 'relative', flex: 1, maxWidth: 380 }}>
              <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: 12 }} />
              <input
                type="text"
                className="input-control"
                style={{ paddingLeft: 42 }}
                placeholder="Search courses by title or topic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filter Modal Trigger Button */}
            <button
              className={`btn ${activeFiltersCount > 0 ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => setIsFilterModalOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', whiteSpace: 'nowrap' }}
              title="Filter by Category or Level"
            >
              <SlidersHorizontal size={15} />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span style={{
                  background: 'var(--accent-gold)',
                  color: '#000',
                  borderRadius: 10,
                  padding: '1px 6px',
                  fontSize: '0.7rem',
                  fontWeight: 800
                }}>
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Active Filter Chips */}
        {activeFiltersCount > 0 && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', paddingTop: 4 }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Active Filters:</span>
            {selectedCategory && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-glow)',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: '0.8rem',
                  color: 'var(--text-primary)'
                }}
              >
                Category: <strong>{getActiveCategoryName()}</strong>
                <X
                  size={14}
                  style={{ cursor: 'pointer', color: 'var(--text-muted)' }}
                  onClick={() => setSelectedCategory('')}
                />
              </span>
            )}
            {selectedLevel && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-glow)',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: '0.8rem',
                  color: 'var(--text-primary)'
                }}
              >
                Level: <strong>{selectedLevel}</strong>
                <X
                  size={14}
                  style={{ cursor: 'pointer', color: 'var(--text-muted)' }}
                  onClick={() => setSelectedLevel('')}
                />
              </span>
            )}
            <button
              onClick={handleClearFilters}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '0.75rem',
                cursor: 'pointer',
                textDecoration: 'underline',
                marginLeft: 4
              }}
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Filter Modal */}
      {isFilterModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 16,
        }}>
          <div className="glass-panel animate-slide-in" style={{
            width: '100%',
            maxWidth: 500,
            padding: 28,
            position: 'relative',
            border: '1px solid var(--border-glow)',
          }}>
            {/* Close Button */}
            <button
              onClick={() => setIsFilterModalOpen(false)}
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

            {/* Modal Title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff'
              }}>
                <Filter size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Filter Curriculums</h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Refine courses by subject category and experience level
                </p>
              </div>
            </div>

            {/* Category Filter */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                Curriculum Category
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setSelectedCategory('')}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid',
                    borderColor: selectedCategory === '' ? 'var(--primary)' : 'var(--border-subtle)',
                    background: selectedCategory === '' ? 'var(--primary)' : 'var(--bg-surface-elevated)',
                    color: selectedCategory === '' ? '#fff' : 'var(--text-primary)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.15s ease',
                  }}
                >
                  🌐 All Categories
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCategory(c.slug)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid',
                      borderColor: selectedCategory === c.slug ? 'var(--primary)' : 'var(--border-subtle)',
                      background: selectedCategory === c.slug ? 'var(--primary)' : 'var(--bg-surface-elevated)',
                      color: selectedCategory === c.slug ? '#fff' : 'var(--text-primary)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {c.icon || '📘'} {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty Level Filter */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                Difficulty Level
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {['', 'Beginner', 'Intermediate', 'Advanced'].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setSelectedLevel(lvl)}
                    style={{
                      padding: '10px 8px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid',
                      borderColor: selectedLevel === lvl ? 'var(--secondary)' : 'var(--border-subtle)',
                      background: selectedLevel === lvl ? 'var(--secondary)' : 'var(--bg-surface-elevated)',
                      color: selectedLevel === lvl ? '#fff' : 'var(--text-primary)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {lvl || 'All'}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', borderTop: '1px solid var(--border-subtle)', paddingTop: 16 }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleClearFilters}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <RotateCcw size={14} />
                <span>Reset</span>
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setIsFilterModalOpen(false)}
                style={{ minWidth: 100 }}
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Courses Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>⚡</div>
          Loading EduPlay AI curriculum...
        </div>
      ) : courses.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '50px 20px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>
            {viewMode === 'discover' && currentUser ? '🎉' : '🔍'}
          </div>
          <h3>
            {viewMode === 'discover' && currentUser ? 'All Courses Enrolled!' : 'No courses found'}
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: 6, maxWidth: 540, margin: '6px auto 0 auto', lineHeight: 1.5 }}>
            {viewMode === 'discover' 
              ? (currentUser 
                  ? "You have already enrolled in or completed all available courses on the platform! Check your Currently Enrolled or Completed Courses tabs above to continue learning." 
                  : "No open courses match your active search or filters.")
              : viewMode === 'enrolled' 
              ? "You don't have any in-progress enrolled courses right now. Go to the Discover tab to pick a new curriculum and start earning XP!" 
              : viewMode === 'completed' 
              ? "You haven't completed any courses yet. Finish 100% of the lessons in an enrolled course to see it here and unlock your verified certificate!" 
              : "Try adjusting your search or category filters."}
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
                    {course.is_enrolled ? (course.progress_percentage >= 100 ? 'View Certificate' : 'Resume') : 'Enroll / Explore'}
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
