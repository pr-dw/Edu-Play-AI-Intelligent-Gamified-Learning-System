import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, Sparkles, BookOpen, Settings, Check, AlertCircle, RefreshCw, Layers, Lightbulb, FileText, Code, HelpCircle, MessageSquare } from 'lucide-react';
import { api } from '../services/api';

export default function AITutorWorkspace({
  currentUser,
  initialCourse = null,
  initialLesson = null,
  onRefreshUser
}) {
  const [provider, setProvider] = useState('ollama'); // 'ollama' or 'gemini'
  const [geminiApiKey, setGeminiApiKey] = useState(() => localStorage.getItem('eduplay_gemini_key') || '');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [providerStatus, setProviderStatus] = useState(null);

  // Tutoring mode
  const [mode, setMode] = useState('general');
  // 'general', 'explain', 'summarize', 'examples', 'quiz_hint'

  // Context grounding
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(initialCourse ? initialCourse.id : '');
  const [selectedLessonId, setSelectedLessonId] = useState(initialLesson ? initialLesson.id : '');
  const [courseLessons, setCourseLessons] = useState([]);

  // Chat state
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I'm your **EduPlay AI Personal Tutor**, powered by **LangChain**. I'm here to clarify difficult concepts, generate practical examples, summarize lessons, or solve doubts. How can I help your learning today?",
      provider_used: 'system',
      created_at: new Date().toISOString(),
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [xpEarnedNotice, setXpEarnedNotice] = useState(null);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Check providers status
  const checkStatus = async () => {
    try {
      const status = await api.tutor.getProvidersStatus();
      setProviderStatus(status);
      if (status.default_provider && !localStorage.getItem('eduplay_preferred_provider')) {
        setProvider(status.default_provider);
      }
    } catch (err) {
      console.error('Error checking tutor providers:', err);
    }
  };

  // Load courses for context selector
  const loadCourses = async () => {
    try {
      const data = await api.courses.list();
      setCourses(data);
    } catch (err) {
      console.error('Error loading courses for tutor:', err);
    }
  };

  useEffect(() => {
    checkStatus();
    loadCourses();
  }, []);

  // Update lessons when selected course changes
  useEffect(() => {
    if (selectedCourseId) {
      api.courses.detail(selectedCourseId).then(data => {
        setCourseLessons(data.lessons || []);
      }).catch(err => console.error(err));
    } else {
      setCourseLessons([]);
      setSelectedLessonId('');
    }
  }, [selectedCourseId]);

  const handleSaveGeminiKey = (key) => {
    setGeminiApiKey(key);
    localStorage.setItem('eduplay_gemini_key', key);
    setShowKeyInput(false);
  };

  const handleSendMessage = async (customText = null) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim() || loading) return;

    if (!currentUser) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: '⚠️ Please sign in or use one of the 1-Click Demo accounts (Student/Teacher/Admin) at the top to chat with the AI Tutor.',
          provider_used: 'system'
        }
      ]);
      return;
    }

    // Add user message to UI immediately
    const userMsg = {
      role: 'user',
      content: textToSend,
      provider_used: provider,
      mode: mode,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);
    setXpEarnedNotice(null);

    try {
      const payload = {
        message: textToSend,
        provider: provider,
        mode: mode,
        session_id: sessionId,
        course_id: selectedCourseId || undefined,
        lesson_id: selectedLessonId || undefined,
        gemini_api_key: geminiApiKey || undefined,
      };

      const res = await api.tutor.chat(payload);

      if (res.session_id) {
        setSessionId(res.session_id);
      }

      setMessages(prev => [
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

      setXpEarnedNotice('+5 Curiosity XP earned!');
      if (onRefreshUser) onRefreshUser();

    } catch (err) {
      console.error('Tutor chat error:', err);
      let errMsg = err.message || 'An error occurred while contacting the AI Tutor.';
      if (provider === 'gemini' && !geminiApiKey) {
        errMsg = 'Google Gemini API Key is required. Please click "Configure Gemini Key" above to provide your key, or toggle to "Ollama (Qwen 2.5: 3B)" for local offline inference.';
      }
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ **Error**: ${errMsg}`,
          provider_used: provider,
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    { label: '💡 Analogy Explanation', prompt: 'Explain the core concept here using a fun real-world analogy.', mode: 'explain' },
    { label: '📝 Bullet Summary', prompt: 'Summarize the most important takeaways in 3-4 bullet points.', mode: 'summarize' },
    { label: '💻 Practical Code Example', prompt: 'Give me a concise practical code example demonstrating this.', mode: 'examples' },
    { label: '🎯 Practice Quiz & Clue', prompt: 'Give me an interactive question based on this topic to test my knowledge, with a hint.', mode: 'quiz_hint' },
  ];

  const modesConfig = [
    { id: 'general', label: 'General Q&A', icon: MessageSquare },
    { id: 'explain', label: 'Explain Concept', icon: Lightbulb },
    { id: 'summarize', label: 'Summarize', icon: FileText },
    { id: 'examples', label: 'Code & Examples', icon: Code },
    { id: 'quiz_hint', label: 'Quiz & Hints', icon: HelpCircle },
  ];

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px 40px 16px' }}>
      {/* Top Banner / Provider Selection Panel */}
      <div className="glass-panel" style={{
        padding: '20px 28px',
        marginBottom: 20,
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border-glow)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          {/* Title & LangChain Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.6rem',
              boxShadow: '0 4px 16px var(--primary-glow)'
            }}>
              🤖
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ fontSize: '1.35rem' }}>AI Personal Tutor</h2>
                <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>LangChain Engine</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Intelligent pedagogical assistance with dynamic LLM switching
              </p>
            </div>
          </div>

          {/* Provider Toggle Pill (Ollama vs Gemini) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              display: 'flex',
              background: 'var(--bg-surface)',
              padding: 4,
              borderRadius: 'var(--radius-pill)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-card)',
            }}>
              {/* Ollama Button */}
              <button
                type="button"
                className={`btn btn-sm ${provider === 'ollama' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ borderRadius: 'var(--radius-pill)', padding: '6px 14px' }}
                onClick={() => {
                  setProvider('ollama');
                  localStorage.setItem('eduplay_preferred_provider', 'ollama');
                }}
              >
                <span>🦙 Ollama (Qwen 2.5: 3B)</span>
                <span style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: providerStatus?.ollama?.available ? '#10b981' : '#f59e0b',
                  display: 'inline-block'
                }} />
              </button>

              {/* Gemini Button */}
              <button
                type="button"
                className={`btn btn-sm ${provider === 'gemini' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ borderRadius: 'var(--radius-pill)', padding: '6px 14px' }}
                onClick={() => {
                  setProvider('gemini');
                  localStorage.setItem('eduplay_preferred_provider', 'gemini');
                }}
              >
                <span>✨ Google Gemini API</span>
                <span style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: (geminiApiKey || providerStatus?.gemini?.key_configured) ? '#10b981' : '#ef4444',
                  display: 'inline-block'
                }} />
              </button>
            </div>

            {/* Provider Configuration / Key button */}
            {provider === 'gemini' && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setShowKeyInput(!showKeyInput)}
                title="Configure Gemini API Key"
              >
                <Settings size={14} />
                <span>{geminiApiKey ? 'API Key Set' : 'Add API Key'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Gemini API Key input drawer */}
        {showKeyInput && (
          <div className="animate-slide-in" style={{
            marginTop: 16,
            padding: 16,
            background: 'var(--bg-surface-elevated)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            gap: 10,
            alignItems: 'center',
          }}>
            <input
              type="password"
              className="input-control"
              placeholder="Paste Google Gemini API Key (e.g. AIzaSy...)"
              value={geminiApiKey}
              onChange={(e) => setGeminiApiKey(e.target.value)}
            />
            <button
              className="btn btn-primary btn-sm"
              onClick={() => handleSaveGeminiKey(geminiApiKey)}
            >
              Save Key
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowKeyInput(false)}
            >
              Cancel
            </button>
          </div>
        )}

        {/* Context Selector Bar (Grounding) */}
        <div style={{
          marginTop: 16,
          paddingTop: 16,
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <BookOpen size={14} /> Ground Tutor in:
            </span>

            {/* Course Selector */}
            <select
              className="input-control"
              style={{ width: 'auto', minWidth: 200, padding: '6px 12px', fontSize: '0.85rem' }}
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
            >
              <option value="">General Knowledge (No Course)</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>
                  {c.thumbnail} {c.title}
                </option>
              ))}
            </select>

            {/* Lesson Selector */}
            {courseLessons.length > 0 && (
              <select
                className="input-control"
                style={{ width: 'auto', minWidth: 200, padding: '6px 12px', fontSize: '0.85rem' }}
                value={selectedLessonId}
                onChange={(e) => setSelectedLessonId(e.target.value)}
              >
                <option value="">All Course Lessons</option>
                {courseLessons.map(l => (
                  <option key={l.id} value={l.id}>
                    Lesson #{l.sequence_order}: {l.title}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Active Model Pill */}
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Active Engine: <strong style={{ color: provider === 'ollama' ? '#38bdf8' : '#a855f7' }}>
              {provider === 'ollama' ? 'Local Qwen 2.5 (3B)' : 'Google Gemini API'}
            </strong>
          </div>
        </div>
      </div>

      {/* Modes bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
        {modesConfig.map((m) => {
          const Icon = m.icon;
          const isActive = mode === m.id;
          return (
            <button
              key={m.id}
              className={`btn ${isActive ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              style={{ borderRadius: 'var(--radius-pill)', whiteSpace: 'nowrap' }}
              onClick={() => setMode(m.id)}
            >
              <Icon size={14} />
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* Chat Messages Container */}
      <div className="glass-panel" style={{
        padding: '24px',
        minHeight: 460,
        maxHeight: '58vh',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        marginBottom: 16,
      }}>
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={idx}
              className="animate-slide-in"
              style={{
                display: 'flex',
                justifyContent: isUser ? 'flex-end' : 'flex-start',
                gap: 12,
              }}
            >
              {!isUser && (
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  flexShrink: 0,
                }}>
                  🤖
                </div>
              )}

              <div style={{
                maxWidth: '80%',
                padding: '14px 18px',
                borderRadius: 'var(--radius-lg)',
                background: isUser ? 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)' : 'var(--bg-surface-elevated)',
                border: '1px solid',
                borderColor: isUser ? 'var(--border-glow)' : 'var(--border-subtle)',
                color: isUser ? '#ffffff' : 'var(--text-primary)',
                boxShadow: isUser ? '0 4px 14px var(--primary-glow)' : 'var(--shadow-card)',
              }}>
                <div style={{
                  fontSize: '0.725rem',
                  color: isUser ? 'rgba(255, 255, 255, 0.85)' : 'var(--text-muted)',
                  marginBottom: 6,
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                }}>
                  <span>{isUser ? 'You' : 'EduPlay AI Tutor'}</span>
                  {!isUser && msg.model_name && (
                    <span style={{ color: '#38bdf8' }}>{msg.model_name}</span>
                  )}
                </div>

                <div className="markdown-body" style={{ fontSize: '0.925rem', lineHeight: 1.6 }}>
                  {msg.content.split('\n').map((line, lIdx) => (
                    <p key={lIdx} style={{ margin: '0 0 6px 0' }}>{line}</p>
                  ))}
                </div>
              </div>

              {isUser && (
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  flexShrink: 0,
                }}>
                  {currentUser?.avatar || '🎓'}
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <RefreshCw size={18} className="animate-spin" color="#fff" />
            </div>
            <div>
              <span>Thinking using {provider === 'ollama' ? 'local Qwen 2.5: 3B' : 'Google Gemini'}...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompt Chips */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {quickPrompts.map((qp, idx) => (
          <button
            key={idx}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.775rem', padding: '5px 10px', borderRadius: 'var(--radius-pill)' }}
            onClick={() => {
              setMode(qp.mode);
              handleSendMessage(qp.prompt);
            }}
            disabled={loading}
          >
            {qp.label}
          </button>
        ))}
      </div>

      {/* Input bar */}
      <div className="glass-panel" style={{
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        borderRadius: 'var(--radius-lg)',
      }}>
        <input
          type="text"
          className="input-control"
          style={{ border: 'none', background: 'transparent', boxShadow: 'none', padding: '8px 4px' }}
          placeholder={`Ask about this lesson, or request code, analogies, or hints (${provider === 'ollama' ? 'Qwen2.5:3B' : 'Gemini'})...`}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSendMessage();
          }}
          disabled={loading}
        />

        <button
          className="btn btn-primary"
          style={{ padding: '10px 18px', borderRadius: 'var(--radius-md)' }}
          onClick={() => handleSendMessage()}
          disabled={loading || !inputMessage.trim()}
        >
          <Send size={16} />
          <span>Send</span>
        </button>
      </div>

      {xpEarnedNotice && (
        <div className="animate-slide-in" style={{
          marginTop: 10,
          textAlign: 'center',
          fontSize: '0.8rem',
          color: '#fbbf24',
          fontWeight: 600,
        }}>
          ⭐ {xpEarnedNotice}
        </div>
      )}
    </div>
  );
}
