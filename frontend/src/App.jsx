import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import CourseCatalog from './components/CourseCatalog';
import CourseDetailModal from './components/CourseDetailModal';
import LessonViewer from './components/LessonViewer';
import AITutorWorkspace from './components/AITutorWorkspace';
import CertificateHub from './components/CertificateHub';
import LeaderboardView from './components/LeaderboardView';
import AdminDashboard from './components/AdminDashboard';
import { api } from './services/api';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [activeTab, setActiveTab] = useState('courses'); // 'courses', 'tutor', 'certificates', 'leaderboard', 'admin'
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Course & Lesson view states
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [selectedLessonId, setSelectedLessonId] = useState(null);

  // Preselected context for AI tutor
  const [tutorContextCourse, setTutorContextCourse] = useState(null);
  const [tutorContextLesson, setTutorContextLesson] = useState(null);

  // Direct certificate claim course ID
  const [claimCourseId, setClaimCourseId] = useState(null);

  // Load user from storage and refresh profile/stats
  const refreshUser = async () => {
    const cachedUser = api.auth.getCurrentUser();
    if (!cachedUser) {
      setCurrentUser(null);
      setUserStats(null);
      return;
    }
    setCurrentUser(cachedUser);

    try {
      const [profile, stats] = await Promise.all([
        api.auth.getProfile(),
        api.auth.getStats(),
      ]);
      setCurrentUser(profile);
      setUserStats(stats);
      localStorage.setItem('eduplay_user', JSON.stringify(profile));
    } catch (err) {
      console.warn('Could not refresh profile or token expired:', err);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const handleLogout = () => {
    api.auth.logout();
    setCurrentUser(null);
    setUserStats(null);
    setSelectedLessonId(null);
    setSelectedCourseId(null);
  };

  const handleOpenTutorWithCourse = (course) => {
    setTutorContextCourse(course);
    setTutorContextLesson(null);
    setActiveTab('tutor');
  };

  const handleOpenTutorWithLesson = (lesson) => {
    setTutorContextLesson(lesson);
    setActiveTab('tutor');
  };

  const handleOpenCertificate = (courseId) => {
    setClaimCourseId(courseId);
    setActiveTab('certificates');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          // If navigating away from lesson viewer, clear selected lesson
          if (tab !== 'courses') {
            setSelectedLessonId(null);
          }
        }}
        currentUser={currentUser}
        userStats={userStats}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
        onOpenTutor={() => setActiveTab('tutor')}
      />

      {/* Main Content Area */}
      <main style={{ flex: 1 }}>
        {activeTab === 'courses' && (
          selectedLessonId ? (
            <LessonViewer
              lessonId={selectedLessonId}
              onBack={() => setSelectedLessonId(null)}
              onSelectLesson={(id) => setSelectedLessonId(id)}
              onOpenTutorForLesson={handleOpenTutorWithLesson}
              onOpenCertificate={handleOpenCertificate}
              onRefreshUser={refreshUser}
            />
          ) : (
            <CourseCatalog
              currentUser={currentUser}
              onSelectCourse={(id) => setSelectedCourseId(id)}
              onSelectLesson={(lessonId) => setSelectedLessonId(lessonId)}
              onEnrollSuccess={refreshUser}
            />
          )
        )}

        {activeTab === 'tutor' && (
          <AITutorWorkspace
            currentUser={currentUser}
            initialCourse={tutorContextCourse}
            initialLesson={tutorContextLesson}
            onRefreshUser={refreshUser}
          />
        )}

        {activeTab === 'certificates' && (
          <CertificateHub
            currentUser={currentUser}
            onRefreshUser={refreshUser}
            initialClaimCourseId={claimCourseId}
          />
        )}

        {activeTab === 'leaderboard' && (
          <LeaderboardView
            currentUser={currentUser}
          />
        )}

        {activeTab === 'admin' && (
          <AdminDashboard
            currentUser={currentUser}
            onRefreshUser={refreshUser}
          />
        )}
      </main>

      {/* Course Detail Modal */}
      {selectedCourseId && (
        <CourseDetailModal
          courseId={selectedCourseId}
          currentUser={currentUser}
          onClose={() => setSelectedCourseId(null)}
          onSelectLesson={(lessonId) => {
            setSelectedCourseId(null);
            setSelectedLessonId(lessonId);
          }}
          onOpenTutorForCourse={handleOpenTutorWithCourse}
          onOpenCertificate={handleOpenCertificate}
          onRefreshUser={refreshUser}
        />
      )}

      {/* Auth / Demo Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          refreshUser();
        }}
      />

      {/* Footer */}
      <footer style={{
        marginTop: 'auto',
        borderTop: '1px solid var(--border-subtle)',
        padding: '24px 20px',
        textAlign: 'center',
        fontSize: '0.8rem',
        color: 'var(--text-muted)',
        background: 'rgba(9, 13, 22, 0.8)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 8, flexWrap: 'wrap' }}>
          <span>⚡ EduPlay AI — Intelligent Gamified E-Learning Platform</span>
          <span>•</span>
          <span>🤖 LangChain AI Tutor (Ollama Qwen 2.5: 3B & Gemini API)</span>
          <span>•</span>
          <span>🎓 Verified Credentials</span>
        </div>
        <div>
          5 Core Modules: User Management • Course Management • AI Personal Tutor • Certificate Management • Administration
        </div>
      </footer>
    </div>
  );
}
