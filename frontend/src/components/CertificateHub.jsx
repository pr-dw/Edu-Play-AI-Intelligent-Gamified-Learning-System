import React, { useState, useEffect } from 'react';
import { Award, Download, CheckCircle, Search, ShieldCheck, Sparkles, ExternalLink, Calendar, BookOpen, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';

export default function CertificateHub({ currentUser, onRefreshUser, initialClaimCourseId = null }) {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCert, setSelectedCert] = useState(null);
  const [verifyInput, setVerifyInput] = useState('');
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [activeTab, setActiveTab] = useState('my'); // 'my' or 'verify'
  const [claimableCourses, setClaimableCourses] = useState([]);
  const [claiming, setClaiming] = useState(false);
  const [claimMessage, setClaimMessage] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPdf = async (certId) => {
    if (!certId || downloading) return;
    try {
      setDownloading(true);
      await api.certificates.downloadPdf(certId);
    } catch (err) {
      console.error('Download error:', err);
      // Fallback: try direct window open
      window.open(api.certificates.getPdfDownloadUrl(certId), '_blank');
    } finally {
      setDownloading(false);
    }
  };

  const loadCertificates = async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [certs, myCourses] = await Promise.all([
        api.certificates.myCertificates(),
        api.courses.myCourses(),
      ]);
      setCertificates(certs);

      // Find completed courses that don't have a certificate yet
      const earnedCourseIds = certs.map(c => c.course);
      const claimable = myCourses.filter(e => 
        (e.is_completed || e.progress_percentage >= 100) && !earnedCourseIds.includes(e.course.id)
      );
      setClaimableCourses(claimable);

      // Auto open if initial course specified
      if (certs.length > 0 && !selectedCert) {
        setSelectedCert(certs[0]);
      }
    } catch (err) {
      console.error('Error fetching certificates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCertificates();
  }, [currentUser]);

  // Handle direct claim if course id was passed
  useEffect(() => {
    if (initialClaimCourseId) {
      handleClaim(initialClaimCourseId);
    }
  }, [initialClaimCourseId]);

  const handleClaim = async (courseId) => {
    setClaiming(true);
    setClaimMessage(null);
    try {
      const res = await api.certificates.claim(courseId);
      setClaimMessage(`🎉 ${res.message} Awarded +${res.xp_awarded} Achievement XP!`);
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 }
      });
      await loadCertificates();
      if (res.certificate) {
        setSelectedCert(res.certificate);
      }
      if (onRefreshUser) onRefreshUser();
    } catch (err) {
      setClaimMessage(err.message || 'Could not claim certificate.');
    } finally {
      setClaiming(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!verifyInput.trim()) return;
    setVerifying(true);
    setVerifyResult(null);
    try {
      const res = await api.certificates.verify(verifyInput.trim());
      setVerifyResult(res);
    } catch (err) {
      setVerifyResult({
        valid: false,
        message: 'No certificate found matching the provided ID or verification code.',
      });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px 50px 16px' }}>
      {/* Header Banner */}
      <div className="glass-panel" style={{
        padding: '28px 32px',
        marginBottom: 28,
        borderRadius: 'var(--radius-xl)',
        background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.8) 0%, rgba(15, 23, 42, 0.95) 100%)',
        border: '1px solid var(--border-gold)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
      }}>
        <div style={{ maxWidth: 600 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <span className="badge badge-xp">Official Credentialing</span>
            <span className="badge badge-cyan">Cryptographically Verified</span>
          </div>
          <h1 style={{ fontSize: '2rem', marginBottom: 8 }}>
            Certificate Management & Verification
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5 }}>
            Demonstrate subject mastery upon completing 100% of your course requirements. Each credential features a permanent verification code and downloadable high-res PDF.
          </p>
        </div>

        {/* Tab switch */}
        <div style={{ display: 'flex', gap: 8, background: 'rgba(15, 23, 42, 0.8)', padding: 6, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <button
            className={`btn ${activeTab === 'my' ? 'btn-gold' : 'btn-secondary'} btn-sm`}
            onClick={() => setActiveTab('my')}
          >
            <Award size={15} />
            <span>My Certificates ({certificates.length})</span>
          </button>
          <button
            className={`btn ${activeTab === 'verify' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setActiveTab('verify')}
          >
            <ShieldCheck size={15} />
            <span>Public Verification</span>
          </button>
        </div>
      </div>

      {/* Claimable notification banner */}
      {claimableCourses.length > 0 && (
        <div className="glass-panel animate-slide-in" style={{
          padding: '20px 28px',
          marginBottom: 28,
          background: 'rgba(245, 158, 11, 0.12)',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 14,
        }}>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={20} /> Certificate Ready to Claim!
            </div>
            <div style={{ fontSize: '0.875rem', color: '#cbd5e1', marginTop: 4 }}>
              You have completed 100% of <strong>{claimableCourses[0].course.title}</strong>!
            </div>
          </div>

          <button
            className="btn btn-gold"
            onClick={() => handleClaim(claimableCourses[0].course.id)}
            disabled={claiming}
          >
            <Award size={18} />
            <span>{claiming ? 'Generating Certificate...' : 'Claim Certificate (+200 XP)'}</span>
          </button>
        </div>
      )}

      {claimMessage && (
        <div className="glass-panel animate-slide-in" style={{
          padding: '14px 20px',
          marginBottom: 24,
          background: 'rgba(99, 102, 241, 0.15)',
          border: '1px solid var(--border-glow)',
          fontSize: '0.9rem',
          color: '#cbd5e1',
        }}>
          {claimMessage}
        </div>
      )}

      {activeTab === 'my' ? (
        <div>
          {!currentUser ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '50px 20px' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🔒</div>
              <h3>Sign In to View Your Certificates</h3>
              <p style={{ color: 'var(--text-muted)', marginTop: 6 }}>
                Log in as Prabhat or create an account to view and download your earned certificates.
              </p>
            </div>
          ) : loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              Loading credentials...
            </div>
          ) : certificates.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '50px 20px' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🎓</div>
              <h3>No certificates earned yet</h3>
              <p style={{ color: 'var(--text-muted)', marginTop: 6, maxWidth: 500, margin: '6px auto' }}>
                Complete all lessons in a course to achieve 100% mastery and automatically unlock your verified certificate!
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24, alignItems: 'start' }}>
              {/* Left: Certificate List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: 4 }}>Earned Credentials</h3>
                {certificates.map((c) => {
                  const isSelected = selectedCert?.id === c.id;
                  return (
                    <div
                      key={c.id}
                      className="glass-panel"
                      style={{
                        padding: '16px 20px',
                        cursor: 'pointer',
                        border: '1px solid',
                        borderColor: isSelected ? 'var(--accent-gold)' : 'var(--border-subtle)',
                        background: isSelected ? 'rgba(245, 158, 11, 0.1)' : 'var(--bg-card)',
                      }}
                      onClick={() => setSelectedCert(c)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span className="badge badge-xp" style={{ fontSize: '0.7rem' }}>{c.certificate_id}</span>
                        <CheckCircle size={15} color="#10b981" />
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4 }}>
                        {c.course_title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Issued on {new Date(c.issue_date).toLocaleDateString()}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right: Interactive Certificate Canvas Renderer */}
              {selectedCert && (
                <div className="glass-panel animate-slide-in" style={{
                  padding: '36px 40px',
                  background: 'linear-gradient(145deg, #0b1120 0%, #171f38 100%)',
                  border: '3px solid #f59e0b',
                  borderRadius: 'var(--radius-xl)',
                  position: 'relative',
                  boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(245, 158, 11, 0.2)',
                }}>
                  {/* Inner Frame */}
                  <div style={{
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    padding: '32px 28px',
                    borderRadius: 'var(--radius-lg)',
                    textAlign: 'center',
                    background: 'radial-gradient(circle at center, rgba(30, 41, 59, 0.5) 0%, rgba(15, 23, 42, 0.9) 100%)',
                  }}>
                    {/* Header */}
                    <div style={{
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      letterSpacing: '0.15em',
                      color: '#38bdf8',
                      marginBottom: 12,
                      textTransform: 'uppercase',
                    }}>
                      EDUPLAY AI  •  OFFICIAL VERIFIED CREDENTIAL
                    </div>

                    <h2 style={{
                      fontSize: '2rem',
                      fontFamily: 'var(--font-heading)',
                      color: '#ffffff',
                      marginBottom: 8,
                      letterSpacing: '-0.02em',
                    }}>
                      CERTIFICATE OF COMPLETION
                    </h2>

                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: 16 }}>
                      This is proudly presented to
                    </p>

                    {/* Student Name */}
                    <div style={{
                      fontSize: '2.2rem',
                      fontWeight: 800,
                      color: '#fbbf24',
                      fontFamily: 'var(--font-heading)',
                      marginBottom: 14,
                      textShadow: '0 2px 10px rgba(245, 158, 11, 0.3)',
                    }}>
                      {selectedCert.student_name}
                    </div>

                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: 520, margin: '0 auto 20px auto', lineHeight: 1.5 }}>
                      for successfully demonstrating 100% course mastery and completing all requirements for
                    </p>

                    {/* Course Title */}
                    <div style={{
                      fontSize: '1.4rem',
                      fontWeight: 700,
                      color: '#ffffff',
                      marginBottom: 24,
                    }}>
                      {selectedCert.course_title}
                    </div>

                    {/* Divider */}
                    <div style={{ height: 1, background: 'rgba(255, 255, 255, 0.1)', margin: '20px auto', maxWidth: 460 }} />

                    {/* Details row */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-end',
                      textAlign: 'left',
                      padding: '0 20px',
                      fontSize: '0.8rem',
                      color: 'var(--text-muted)',
                      flexWrap: 'wrap',
                      gap: 16,
                    }}>
                      <div>
                        <div><strong>ID:</strong> {selectedCert.certificate_id}</div>
                        <div><strong>Date:</strong> {new Date(selectedCert.issue_date).toLocaleDateString()}</div>
                        <div><strong>Code:</strong> {String(selectedCert.verification_code).substring(0, 14)}...</div>
                      </div>

                      <div style={{ textAlign: 'center' }}>
                        <div style={{
                          width: 54,
                          height: 54,
                          borderRadius: '50%',
                          border: '2px dashed #f59e0b',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.4rem',
                          margin: '0 auto 6px auto',
                        }}>
                          🎖️
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#fbbf24', fontWeight: 600 }}>VERIFIED SEAL</div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div><strong>Instructor:</strong> {selectedCert.instructor_name}</div>
                        <div>EduPlay AI Academic Board</div>
                        <div style={{ color: '#10b981', fontWeight: 600 }}>Status: Authenticated</div>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Download PDF */}
                  <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center', gap: 14 }}>
                    <button
                      type="button"
                      onClick={() => handleDownloadPdf(selectedCert.certificate_id)}
                      disabled={downloading}
                      className="btn btn-gold"
                      style={{ cursor: downloading ? 'wait' : 'pointer' }}
                    >
                      <Download size={16} />
                      <span>{downloading ? 'Downloading PDF...' : 'Download Official PDF Certificate'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Public Verification Tab */
        <div className="glass-panel" style={{ padding: '36px', maxWidth: 680, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{
              width: 50,
              height: 50,
              borderRadius: 14,
              background: 'rgba(99, 102, 241, 0.15)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
            }}>
              <ShieldCheck size={28} color="var(--primary)" />
            </div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: 6 }}>Verify Certificate Authenticity</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Enter any EduPlay AI Certificate ID (e.g. <code>EDU-2026-XXXX</code>) or Verification Hash to check credential integrity.
            </p>
          </div>

          <form onSubmit={handleVerify} style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
            <input
              type="text"
              className="input-control"
              placeholder="e.g. EDU-2026-A1B2C3D4 or UUID"
              value={verifyInput}
              onChange={(e) => setVerifyInput(e.target.value)}
              required
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={verifying}
            >
              {verifying ? 'Checking...' : 'Verify'}
            </button>
          </form>

          {verifyResult && (
            <div className="animate-slide-in" style={{
              padding: 20,
              borderRadius: 'var(--radius-md)',
              background: verifyResult.valid ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
              border: '1px solid',
              borderColor: verifyResult.valid ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                {verifyResult.valid ? (
                  <CheckCircle size={22} color="#10b981" />
                ) : (
                  <AlertCircle size={22} color="#ef4444" />
                )}
                <div style={{ fontWeight: 700, fontSize: '1rem', color: verifyResult.valid ? '#34d399' : '#f87171' }}>
                  {verifyResult.message}
                </div>
              </div>

              {verifyResult.valid && verifyResult.certificate && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: '0.85rem', color: '#cbd5e1', paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <div><strong>Recipient:</strong> {verifyResult.certificate.student_name}</div>
                  <div><strong>Course:</strong> {verifyResult.certificate.course_title}</div>
                  <div><strong>Instructor:</strong> {verifyResult.certificate.instructor_name}</div>
                  <div><strong>Date Issued:</strong> {new Date(verifyResult.certificate.issue_date).toLocaleDateString()}</div>
                  <div><strong>Certificate ID:</strong> {verifyResult.certificate.certificate_id}</div>
                  <div><strong>Integrity:</strong> 100% Cryptographically Valid</div>
                </div>
              )}

              {verifyResult.valid && verifyResult.certificate && (
                <div style={{ marginTop: 16, textAlign: 'center' }}>
                  <button
                    type="button"
                    onClick={() => handleDownloadPdf(verifyResult.certificate.certificate_id)}
                    disabled={downloading}
                    className="btn btn-gold btn-sm"
                  >
                    <Download size={14} />
                    <span>{downloading ? 'Downloading...' : 'Download Verified PDF Certificate'}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
