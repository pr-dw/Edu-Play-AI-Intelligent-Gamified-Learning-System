import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft, ArrowRight, CheckCircle2, Sparkles, Bot, Clock, Award,
  BookOpen, Send, RefreshCw, Layers, Check, HelpCircle, Code, Lightbulb,
  FileText, ChevronRight, Play, Settings
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import MarkdownRenderer from './MarkdownRenderer';

export default function LessonViewer({
  lessonId,
  onBack,
  onSelectLesson,
  onOpenCertificate,
  onRefreshUser
}) {
  const [lesson, setLesson] = useState(null);
  const [courseData, setCourseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [completionResult, setCompletionResult] = useState(null);

  // Embedded AI Tutor states
  const [provider, setProvider] = useState(() => localStorage.getItem('eduplay_preferred_provider') || 'ollama');
  const [geminiApiKey, setGeminiApiKey] = useState(() => localStorage.getItem('eduplay_gemini_key') || '');
  const [tutorMessages, setTutorMessages] = useState([]);
  const [tutorInput, setTutorInput] = useState('');
  const [tutorLoading, setTutorLoading] = useState(false);
  const [tutorSessionId, setTutorSessionId] = useState(null);
  const [tutorMode, setTutorMode] = useState('explain');
  const [showKeyInput, setShowKeyInput] = useState(false);

  const tutorMessagesEndRef = useRef(null);

  const fetchLessonAndCourse = async () => {
    setLoading(true);
    setCompletionResult(null);
    try {
      const lessonRes = await api.courses.getLesson(lessonId);
      setLesson(lessonRes);

      // Fetch course details to populate left sidebar course tree
      if (lessonRes.course) {
        const courseRes = await api.courses.detail(lessonRes.course);
        setCourseData(courseRes);
      }

      // Initialize Tutor greeting grounded in this lesson
      setTutorMessages([
        {
          role: 'assistant',
          content: `Hello! I'm your **EduPlay AI Tutor** for **Lesson #${lessonRes.sequence_order}: ${lessonRes.title}** in *${lessonRes.course_title}*.\n\nAsk me anything about this lesson — I can explain concepts with analogies, provide code snippets, or test your understanding!`,
          provider_used: provider,
          created_at: new Date().toISOString()
        }
      ]);
      setTutorSessionId(null);
    } catch (err) {
      console.error('Error fetching lesson:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (lessonId) {
      fetchLessonAndCourse();
    }
  }, [lessonId]);

  useEffect(() => {
    tutorMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [tutorMessages, tutorLoading]);

  const handleComplete = async () => {
    if (completing || lesson?.is_completed) return;
    setCompleting(true);
    try {
      const res = await api.courses.completeLesson(lessonId);
      setCompletionResult(res);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      // Update local lesson and course progress states
      setLesson(prev => ({ ...prev, is_completed: true }));
      if (courseData) {
        setCourseData(prev => ({
          ...prev,
          progress_percentage: res.course_progress,
          lessons: prev.lessons?.map(l => l.id === lessonId ? { ...l, is_completed: true } : l)
        }));
      }

      if (onRefreshUser) onRefreshUser();
    } catch (err) {
      console.error('Error completing lesson:', err);
    } finally {
      setCompleting(false);
    }
  };

  const handleSendTutorMessage = async (customText = null, forcedMode = null) => {
    const textToSend = customText || tutorInput;
    if (!textToSend.trim() || tutorLoading || !lesson) return;

    const activeMode = forcedMode || tutorMode;

    const userMsg = {
      role: 'user',
      content: textToSend,
      provider_used: provider,
      mode: activeMode,
      created_at: new Date().toISOString(),
    };

    setTutorMessages(prev => [...prev, userMsg]);
    setTutorInput('');
    setTutorLoading(true);

    try {
      const payload = {
        message: textToSend,
        provider: provider,
        mode: activeMode,
        session_id: tutorSessionId,
        course_id: lesson.course,
        lesson_id: lesson.id,
        gemini_api_key: geminiApiKey || undefined,
      };

      const res = await api.tutor.chat(payload);

      if (res.session_id) {
        setTutorSessionId(res.session_id);
      }

      setTutorMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: res.message.content,
          provider_used: res.provider,
          model_name: res.model_name,
          mode: res.mode,
          created_at: res.message.created_at,
        }
      ]);

      if (onRefreshUser) onRefreshUser();
    } catch (err) {
      console.error('Tutor chat error:', err);
      let errMsg = err.message || 'Error communicating with AI Tutor.';
      if (provider === 'gemini' && !geminiApiKey) {
        errMsg = 'Cloud API Key is required. Please set your key above or switch to Standard AI.';
      }
      setTutorMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ **Error**: ${errMsg}`,
          provider_used: provider,
        }
      ]);
    } finally {
      setTutorLoading(false);
    }
  };

  // Markdown renderer for lesson content and tutor responses
  const renderMarkdown = (text, isUser = false) => {
    if (!text) return null;
    return <MarkdownRenderer content={text} isUser={isUser} />;
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 900, margin: '60px auto', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '2rem', marginBottom: 12 }}>⚡</div>
        Loading interactive lesson workspace...
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
    <div style={{ maxWidth: '100%', margin: '0 auto', padding: '0 20px 40px 20px' }}>
      {/* 3-Column Split Workspace */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '300px minmax(500px, 1fr) 380px',
        gap: 20,
        alignItems: 'start',
      }}>

        {/* LEFT COLUMN: Course Tree & Curriculum Sidebar */}
        <aside className="glass-panel" style={{
          position: 'sticky',
          top: 80,
          height: 'calc(100vh - 100px)',
          padding: 20,
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
        }}>
          {/* Back button */}
          <button
            className="btn btn-secondary btn-sm"
            onClick={onBack}
            style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', marginBottom: 14 }}
          >
            <ArrowLeft size={15} />
            <span>Back to Curriculums</span>
          </button>

          {/* Course Details Header */}
          {courseData && (
            <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 14, marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: '1.4rem' }}>{courseData.thumbnail || '🎯'}</span>
                <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>
                  {courseData.category_name}
                </span>
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 8px 0', lineHeight: 1.3 }}>
                {courseData.title}
              </h3>

              {/* Progress Bar */}
              <div style={{ marginTop: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: 4 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Curriculum Progress</span>
                  <span style={{ fontWeight: 700, color: courseData.progress_percentage >= 100 ? '#10b981' : '#6366f1' }}>
                    {courseData.progress_percentage || 0}%
                  </span>
                </div>
                <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    width: `${courseData.progress_percentage || 0}%`,
                    height: '100%',
                    background: courseData.progress_percentage >= 100
                      ? 'linear-gradient(90deg, #10b981 0%, #34d399 100%)'
                      : 'linear-gradient(90deg, #6366f1 0%, #06b6d4 100%)',
                    transition: 'width 0.3s ease',
                  }} />
                </div>
              </div>
            </div>
          )}

          {/* Lessons List Tree Header */}
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>
            Course Syllabus ({courseData?.lessons?.length || 0} Lessons)
          </div>

          {/* Lessons List Tree - Stretches and scrolls internally */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            flex: 1,
            overflowY: 'auto',
            minHeight: 0,
            paddingRight: 4,
          }}>
            {courseData?.lessons && courseData.lessons.map((l) => {
              const isActive = l.id === lesson.id;
              return (
                <div
                  key={l.id}
                  onClick={() => onSelectLesson(l.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: isActive
                      ? 'var(--primary)'
                      : l.is_completed
                      ? 'rgba(16, 185, 129, 0.08)'
                      : 'var(--bg-surface-elevated)',
                    border: '1px solid',
                    borderColor: isActive
                      ? 'var(--primary)'
                      : l.is_completed
                      ? 'rgba(16, 185, 129, 0.25)'
                      : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    color: isActive ? '#fff' : 'var(--text-primary)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
                    {l.is_completed ? (
                      <CheckCircle2 size={16} color={isActive ? '#fff' : '#10b981'} style={{ flexShrink: 0 }} />
                    ) : (
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        opacity: 0.7,
                        width: 16,
                        textAlign: 'center',
                        flexShrink: 0
                      }}>
                        {l.sequence_order}
                      </span>
                    )}
                    <span style={{
                      fontSize: '0.8rem',
                      fontWeight: isActive ? 700 : 500,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {l.title}
                    </span>
                  </div>

                  <span style={{ fontSize: '0.65rem', opacity: 0.75, flexShrink: 0, marginLeft: 6 }}>
                    {l.duration_minutes}m
                  </span>
                </div>
              );
            })}
          </div>

          {/* Certificate shortcut if finished */}
          {courseData?.progress_percentage >= 100 && (
            <button
              className="btn btn-gold btn-sm"
              onClick={() => onOpenCertificate(lesson.course)}
              style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%' }}
            >
              <Award size={15} />
              <span>View Certificate</span>
            </button>
          )}
        </aside>

        {/* CENTER COLUMN: Main Lesson Reading Workspace */}
        <main style={{ minWidth: 0, minHeight: 'calc(100vh - 100px)' }}>
          {/* Header Banner */}
          <div className="glass-panel" style={{
            padding: '24px 28px',
            marginBottom: 20,
            border: '1px solid var(--border-glow)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 8 }}>
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

            <h1 style={{ fontSize: '1.8rem', margin: '4px 0 8px 0' }}>{lesson.title}</h1>
            {lesson.description && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>
                {lesson.description}
              </p>
            )}
          </div>

          {/* Completion Celebration Notice */}
          {completionResult && (
            <div className="glass-panel animate-slide-in" style={{
              padding: '18px 22px',
              marginBottom: 20,
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
            }}>
              <div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#34d399', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sparkles size={18} /> {completionResult.message}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: 2 }}>
                  Awarded +{completionResult.xp_earned} XP! Course Progress: {completionResult.course_progress}%
                </div>
              </div>

              {completionResult.is_course_completed && (
                <button
                  className="btn btn-gold btn-sm"
                  onClick={() => onOpenCertificate(lesson.course)}
                >
                  <Award size={15} />
                  <span>View Course Certificate</span>
                </button>
              )}
            </div>
          )}

          {/* Lesson Content Area */}
          <div className="glass-panel" style={{ padding: '32px 36px', marginBottom: 20, minHeight: 400 }}>
            <div className="markdown-body">
              {renderMarkdown(lesson.content)}
            </div>
          </div>

          {/* Bottom Lesson Footer Navigation */}
          <div className="glass-panel" style={{
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}>
            <div>
              {lesson.prev_lesson_id ? (
                <button className="btn btn-secondary btn-sm" onClick={() => onSelectLesson(lesson.prev_lesson_id)}>
                  <ArrowLeft size={15} />
                  <span>Previous</span>
                </button>
              ) : <div />}
            </div>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              {/* Completed Status (No Claim Again button!) */}
              {lesson.is_completed ? (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 14px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  borderRadius: 'var(--radius-pill)',
                  color: '#34d399',
                  fontWeight: 700,
                  fontSize: '0.825rem'
                }}>
                  <CheckCircle2 size={16} color="#10b981" />
                  <span>Lesson Completed (+{lesson.xp_reward} XP)</span>
                </span>
              ) : (
                <button
                  className="btn btn-success btn-sm"
                  onClick={handleComplete}
                  disabled={completing}
                >
                  <CheckCircle2 size={16} />
                  <span>{completing ? 'Saving...' : `Mark Completed (+${lesson.xp_reward} XP)`}</span>
                </button>
              )}

              {lesson.next_lesson_id && (
                <button className="btn btn-primary btn-sm" onClick={() => onSelectLesson(lesson.next_lesson_id)}>
                  <span>Next Lesson</span>
                  <ArrowRight size={15} />
                </button>
              )}
            </div>
          </div>
        </main>

        {/* RIGHT COLUMN: Live Embedded AI Personal Tutor */}
        <aside className="glass-panel" style={{
          position: 'sticky',
          top: 80,
          height: 'calc(100vh - 100px)',
          display: 'flex',
          flexDirection: 'column',
          padding: 16,
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-glow)',
          boxSizing: 'border-box',
        }}>
          {/* Tutor Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: 12,
            marginBottom: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '1rem'
              }}>
                🤖
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>AI Personal Tutor</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Grounded in Lesson #{lesson.sequence_order}</div>
              </div>
            </div>

            {/* Provider Selector Switch */}
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                type="button"
                className={`btn btn-xs ${provider === 'ollama' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '3px 8px', fontSize: '0.7rem' }}
                onClick={() => {
                  setProvider('ollama');
                  localStorage.setItem('eduplay_preferred_provider', 'ollama');
                }}
                title="Standard AI Assistant (Fast & Private)"
              >
                ⚡ Standard AI
              </button>
              <button
                type="button"
                className={`btn btn-xs ${provider === 'gemini' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '3px 8px', fontSize: '0.7rem' }}
                onClick={() => {
                  setProvider('gemini');
                  localStorage.setItem('eduplay_preferred_provider', 'gemini');
                }}
                title="Advanced Cloud AI Assistant"
              >
                ✨ Cloud AI
              </button>
              {provider === 'gemini' && (
                <button
                  type="button"
                  className="btn btn-secondary btn-xs"
                  onClick={() => setShowKeyInput(!showKeyInput)}
                  style={{ padding: '3px 6px' }}
                  title="Configure Cloud API Key"
                >
                  <Settings size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Gemini Key Config Drawer */}
          {showKeyInput && provider === 'gemini' && (
            <div className="animate-slide-in" style={{
              background: 'var(--bg-surface-elevated)',
              padding: 10,
              borderRadius: 6,
              marginBottom: 10,
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              gap: 6
            }}>
              <input
                type="password"
                className="input-control"
                style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                placeholder="Enter Cloud API Key"
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
              />
              <button
                className="btn btn-primary btn-sm"
                style={{ fontSize: '0.7rem', padding: '4px 8px' }}
                onClick={() => {
                  localStorage.setItem('eduplay_gemini_key', geminiApiKey);
                  setShowKeyInput(false);
                }}
              >
                Save
              </button>
            </div>
          )}

          {/* Quick Prompts Bar */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
            {[
              { label: '💡 Analogy', prompt: `Explain ${lesson.title} using an intuitive real-world analogy.`, mode: 'explain' },
              { label: '📝 Summary', prompt: `Summarize key takeaways of this lesson in 3 bullets.`, mode: 'summarize' },
              { label: '💻 Code', prompt: `Show a practical code example illustrating ${lesson.title}.`, mode: 'examples' },
              { label: '🎯 Quiz Me', prompt: `Quiz me on this lesson with a guiding hint.`, mode: 'quiz_hint' },
            ].map((qp, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendTutorMessage(qp.prompt, qp.mode)}
                disabled={tutorLoading}
                style={{
                  fontSize: '0.7rem',
                  padding: '3px 7px',
                  borderRadius: 'var(--radius-pill)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-surface-elevated)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                {qp.label}
              </button>
            ))}
          </div>

          {/* Live Chat Messages Stream */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            paddingRight: 4,
            marginBottom: 10,
            minHeight: 0,
          }}>
            {tutorMessages.map((msg, i) => (
              <div
                key={i}
                style={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '92%',
                  padding: '10px 12px',
                  borderRadius: 10,
                  fontSize: '0.8rem',
                  lineHeight: 1.45,
                  background: msg.role === 'user'
                    ? 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)'
                    : 'var(--bg-surface-elevated)',
                  color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
                  border: msg.role === 'user' ? 'none' : '1px solid var(--border-subtle)',
                }}
              >
                {renderMarkdown(msg.content, msg.role === 'user')}
              </div>
            ))}

            {tutorLoading && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                padding: '6px 10px',
              }}>
                <RefreshCw size={14} className="animate-spin" color="var(--primary)" />
                <span>Thinking...</span>
              </div>
            )}
            <div ref={tutorMessagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <div style={{
            display: 'flex',
            gap: 6,
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: 8,
          }}>
            <input
              type="text"
              className="input-control"
              style={{ fontSize: '0.8rem', padding: '6px 10px', flex: 1 }}
              placeholder="Ask a question about this lesson..."
              value={tutorInput}
              onChange={(e) => setTutorInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendTutorMessage();
              }}
              disabled={tutorLoading}
            />
            <button
              className="btn btn-primary btn-sm"
              style={{ padding: '6px 12px' }}
              onClick={() => handleSendTutorMessage()}
              disabled={tutorLoading || !tutorInput.trim()}
            >
              <Send size={14} />
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
