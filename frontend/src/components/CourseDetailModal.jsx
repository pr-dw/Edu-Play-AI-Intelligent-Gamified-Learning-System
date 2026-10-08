import React, { useState, useEffect } from 'react';
import { X, BookOpen, Clock, Award, CheckCircle2, Play, Sparkles, Bot, User, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';

export default function CourseDetailModal({
  courseId,
  currentUser,
  onClose,
  onSelectLesson,
  onOpenTutorForCourse,
  onOpenCertificate,
  onRefreshUser
}) {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  const fetchCourse = async () => {
    try {
      const data = await api.courses.detail(courseId);
      setCourse(data);
    } catch (err) {
      console.error('Error loading course details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) {
      fetchCourse();
    }
  }, [courseId]);

  const handleEnroll = async () => {
    if (!currentUser) {
      setActionMessage('Please sign in or select a quick demo account to enroll.');
      return;
    }
    setEnrolling(true);
    setActionMessage(null);
    try {
      const res = await api.courses.enroll(courseId);
      setActionMessage(res.message);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
      await fetchCourse();
      if (onRefreshUser) onRefreshUser();
    } catch (err) {
      setActionMessage(err.message || 'Enrollment failed.');
    } finally {
      setEnrolling(false);
    }
  };

  if (!courseId) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 16,
    }}>
      <div className="glass-panel animate-slide-in" style={{
        width: '100%',
        maxWidth: 780,
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
          <X size={22} />
        </button>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-muted)' }}>
            Loading course curriculum...
          </div>
        ) : !course ? (
          <div>Failed to load course details.</div>
        ) : (
          <div>
            {/* Header info */}
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16 }}>
              <div style={{
                fontSize: '2.5rem',
                width: 64,
                height: 64,
                borderRadius: 'var(--radius-md)',
                background: 'rgba(99, 102, 241, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--border-subtle)',
              }}>
                {course.thumbnail || '🎯'}
              </div>
              <div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                  <span className="badge badge-cyan">{course.category_name}</span>
                  <span className="badge badge-role">{course.level}</span>
                  <span className="badge badge-xp">+{course.xp_reward} Completion XP</span>
                </div>
                <h2 style={{ fontSize: '1.6rem', lineHeight: 1.25 }}>{course.title}</h2>
              </div>
            </div>

            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
              {course.description}
            </p>

            {/* Instructor and Action Bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(15, 23, 42, 0.6)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 18px',
              marginBottom: 24,
              border: '1px solid var(--border-subtle)',
              flexWrap: 'wrap',
              gap: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  🎓
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{course.author_name || course.instructor_name || 'EduPlay AI'}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Curated Course Author</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    onClose();
                    onOpenTutorForCourse(course);
                  }}
                  title="Ask LangChain AI Tutor about this syllabus"
                >
                  <Bot size={15} color="#818cf8" />
                  <span>Ask AI Tutor</span>
                </button>

                {course.is_enrolled ? (
                  course.progress_percentage >= 100 ? (
                    <button
                      className="btn btn-gold btn-sm"
                      onClick={() => {
                        onClose();
                        onOpenCertificate(course.id);
                      }}
                    >
                      <Award size={15} />
                      <span>Claim Certificate</span>
                    </button>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="badge badge-success">Enrolled</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8' }}>
                        {course.progress_percentage}% Done
                      </span>
                    </div>
                  )
                ) : (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleEnroll}
                    disabled={enrolling}
                  >
                    <Sparkles size={15} />
                    <span>{enrolling ? 'Enrolling...' : 'Enroll (+25 XP)'}</span>
                  </button>
                )}
              </div>
            </div>

            {actionMessage && (
              <div style={{
                background: 'rgba(99, 102, 241, 0.15)',
                border: '1px solid var(--border-glow)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
                fontSize: '0.85rem',
                color: '#a5b4fc',
                marginBottom: 20,
              }}>
                {actionMessage}
              </div>
            )}

            {/* Curriculum Lessons Section */}
            <h3 style={{ fontSize: '1.2rem', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <BookOpen size={18} color="var(--secondary)" /> Course Curriculum ({course.lessons?.length || 0} Lessons)
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {course.lessons && course.lessons.map((lesson) => (
                <div
                  key={lesson.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 18px',
                    borderRadius: 'var(--radius-md)',
                    background: lesson.is_completed ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid',
                    borderColor: lesson.is_completed ? 'rgba(16, 185, 129, 0.25)' : 'var(--border-subtle)',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: lesson.is_completed ? 'var(--success)' : 'rgba(255, 255, 255, 0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      color: lesson.is_completed ? '#fff' : 'var(--text-secondary)'
                    }}>
                      {lesson.is_completed ? <Check size={18} /> : `#${lesson.sequence_order}`}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {lesson.title}
                      </div>
                      <div style={{ display: 'flex', gap: 12, fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        <span>⏱️ {lesson.duration_minutes} mins</span>
                        <span>⭐ +{lesson.xp_reward} XP</span>
                      </div>
                    </div>
                  </div>

                  <button
                    className={`btn ${lesson.is_completed ? 'btn-secondary' : 'btn-primary'} btn-sm`}
                    onClick={() => {
                      onClose();
                      onSelectLesson(lesson.id);
                    }}
                  >
                    <Play size={13} />
                    <span>{lesson.is_completed ? 'Review' : 'Study Lesson'}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
