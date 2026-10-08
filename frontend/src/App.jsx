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
import ProfileModal from './components/ProfileModal';
import { api } from './services/api';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [activeTab, setActiveTab] = useState('courses'); // 'courses', 'tutor', 'certificates', 'leaderboard'
  const [adminTab, setAdminTab] = useState('overview'); // 'overview', 'courses', 'users', 'settings'
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.is_staff);

  // Multi-Theme State (Default: 'light')
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('eduplay_theme') || 'light';
  });

  // Course & Lesson view states
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [selectedLessonId, setSelectedLessonId] = useState(null);

  // Preselected context for AI tutor
  const [tutorContextCourse, setTutorContextCourse] = useState(null);
  const [tutorContextLesson, setTutorContextLesson] = useState(null);

  // Direct certificate claim course ID
  const [claimCourseId, setClaimCourseId] = useState(null);

  // Apply theme to DOM
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('eduplay_theme', currentTheme);
  }, [currentTheme]);

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

  // Handle explicit login success with role-based dashboard loading
  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    refreshUser();
    if (user.role === 'admin') {
      setAdminTab('overview');
    } else {
      setActiveTab('courses');
    }
  };

  const handleLogout = () => {
    api.auth.logout();
    setCurrentUser(null);
    setUserStats(null);
    setSelectedLessonId(null);
    setSelectedCourseId(null);
    setActiveTab('courses');
    setAdminTab('overview');
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
      {/* Top Navbar with Multi-Theme Switcher */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          // If navigating away from lesson viewer, clear selected lesson
          if (tab !== 'courses') {
            setSelectedLessonId(null);
          }
        }}
        adminTab={adminTab}
        setAdminTab={setAdminTab}
        currentUser={currentUser}
        userStats={userStats}
        currentTheme={currentTheme}
        onSelectTheme={setCurrentTheme}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
        onOpenTutor={() => setActiveTab('tutor')}
        onOpenProfile={() => setProfileModalOpen(true)}
      />

      {/* Main Content Area */}
      <main style={{ flex: 1 }}>
        {isAdmin ? (
          <AdminDashboard
            currentUser={currentUser}
            activeTab={adminTab}
            onTabChange={setAdminTab}
            onRefreshUser={refreshUser}
          />
        ) : (
          <>
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
          </>
        )}
      </main>

      {/* Course Detail Modal (Student Only) */}
      {!isAdmin && selectedCourseId && (
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

      {/* Auth Modal with credential entry form and role-based redirect */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* User Profile Customization Modal */}
      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        currentUser={currentUser}
        onUpdateUser={(updated) => {
          setCurrentUser(updated);
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
        background: 'var(--bg-surface)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 8, flexWrap: 'wrap' }}>
          <span>⚡ EduPlay AI — Intelligent Gamified E-Learning Platform</span>
          <span>•</span>
          <span>🤖 LangChain AI Tutor (Ollama & Gemini)</span>
          <span>•</span>
          <span>🎓 Verified Credentials</span>
        </div>
        <div>
          {isAdmin ? '🛡️ Administrator Control Console • EduPlay AI Platform Management' : 'Role-Based Access: User & Administrator'}
        </div>
      </footer>
    </div>
  );
}
