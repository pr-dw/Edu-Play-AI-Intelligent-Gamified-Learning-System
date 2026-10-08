import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Sparkles, Bot, Clock, Award, BookOpen } from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';

export default function LessonViewer({
  lessonId,
  onBack,
  onSelectLesson,
  onOpenTutorForLesson,
  onOpenCertificate,
  onRefreshUser
}) {
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [completionResult, setCompletionResult] = useState(null);

  const fetchLesson = async () => {
    setLoading(true);
    setCompletionResult(null);
    try {
      const data = await api.courses.getLesson(lessonId);
      setLesson(data);
    } catch (err) {
      console.error('Error fetching lesson:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (lessonId) {
      fetchLesson();
    }
  }, [lessonId]);

  const handleComplete = async () => {
    setCompleting(true);
    try {
      const res = await api.courses.completeLesson(lessonId);
      setCompletionResult(res);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
      // Refresh local lesson state
      setLesson(prev => ({ ...prev, is_completed: true }));
      if (onRefreshUser) onRefreshUser();
    } catch (err) {
      console.error('Error completing lesson:', err);
    } finally {
      setCompleting(false);
    }
  };

  // Simple markdown-to-html renderer for lesson content
  const renderMarkdown = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    const elements = [];
    let inCodeBlock = false;
    let codeBuffer = [];

    lines.forEach((line, idx) => {
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          elements.push(
            <pre key={`code-${idx}`}><code>{codeBuffer.join('\n')}</code></pre>
          );
          codeBuffer = [];
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
        }
        return;
      }

      if (inCodeBlock) {
        codeBuffer.push(line);
        return;
      }

      if (line.startsWith('# ')) {
        elements.push(<h1 key={idx}>{line.substring(2)}</h1>);
      } else if (line.startsWith('## ')) {
        elements.push(<h2 key={idx}>{line.substring(3)}</h2>);
      } else if (line.startsWith('### ')) {
        elements.push(<h3 key={idx}>{line.substring(4)}</h3>);
      } else if (line.startsWith('- ')) {
        elements.push(<li key={idx} style={{ marginLeft: 20 }}>{line.substring(2)}</li>);
      } else if (line.trim() === '') {
        elements.push(<div key={idx} style={{ height: 12 }} />);
      } else {
        elements.push(<p key={idx}>{line}</p>);
      }
    });

    return elements;
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 900, margin: '60px auto', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '2rem', marginBottom: 12 }}>⚡</div>
        Loading lesson content...
      </div>
    );
  }

  if (!lesson) {
    return (
      <div style={{ maxWidth: 800, margin: '40px auto', textAlign: 'center' }}>
        <h3>Lesson not found.</h3>
        <button className="btn btn-secondary" onClick={onBack} style={{ marginTop: 14 }}>
          Back to Courses
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 16px 60px 16px' }}>
      {/* Top Navigation bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <button className="btn btn-secondary btn-sm" onClick={onBack}>
          <ArrowLeft size={16} />
          <span>Back to Curriculum</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            className="btn btn-primary btn-sm"
            style={{ background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)' }}
            onClick={() => onOpenTutorForLesson(lesson)}
          >
            <Bot size={16} />
            <span>Ask AI Tutor about this Lesson</span>
          </button>
        </div>
      </div>

      {/* Lesson Header Banner */}
      <div className="glass-panel" style={{
        padding: '24px 28px',
        marginBottom: 24,
        border: '1px solid var(--border-glow)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="badge badge-cyan">{lesson.course_title}</span>
            <span className="badge badge-level">Lesson #{lesson.sequence_order}</span>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <Clock size={14} /> {lesson.duration_minutes} mins
            </span>
            <span className="badge badge-xp">+{lesson.xp_reward} XP</span>
          </div>
        </div>

        <h1 style={{ fontSize: '1.9rem', marginBottom: 8 }}>{lesson.title}</h1>
        {lesson.description && (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            {lesson.description}
          </p>
        )}
      </div>

      {/* Completion alert if triggered */}
      {completionResult && (
        <div className="glass-panel animate-slide-in" style={{
          padding: '20px 24px',
          marginBottom: 24,
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 14,
        }}>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#34d399', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={20} /> {completionResult.message}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#cbd5e1', marginTop: 4 }}>
              Awarded +{completionResult.xp_earned} XP! Course Progress: {completionResult.course_progress}%
            </div>
          </div>

          {completionResult.is_course_completed && (
            <button
              className="btn btn-gold btn-sm"
              onClick={() => onOpenCertificate(lesson.course)}
            >
              <Award size={16} />
              <span>Claim Course Certificate!</span>
            </button>
          )}
        </div>
      )}

      {/* Lesson Body Content */}
      <div className="glass-panel" style={{ padding: '36px 40px', marginBottom: 28 }}>
        <div className="markdown-body">
          {renderMarkdown(lesson.content)}
        </div>
      </div>

      {/* Action Footer */}
      <div className="glass-panel" style={{
        padding: '20px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 14,
      }}>
        <div>
          {lesson.prev_lesson_id ? (
            <button className="btn btn-secondary btn-sm" onClick={() => onSelectLesson(lesson.prev_lesson_id)}>
              <ArrowLeft size={16} />
              <span>Previous Lesson</span>
            </button>
          ) : (
            <div />
          )}
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            className={`btn ${lesson.is_completed ? 'btn-secondary' : 'btn-success'}`}
            onClick={handleComplete}
            disabled={completing}
          >
            <CheckCircle2 size={18} />
            <span>
              {lesson.is_completed ? 'Completed (Claim Again)' : completing ? 'Saving...' : `Complete & Claim +${lesson.xp_reward} XP`}
            </span>
          </button>

          {lesson.next_lesson_id && (
            <button className="btn btn-primary" onClick={() => onSelectLesson(lesson.next_lesson_id)}>
              <span>Next Lesson</span>
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
