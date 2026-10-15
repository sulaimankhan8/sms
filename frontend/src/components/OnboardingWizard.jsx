import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, BookOpen, Shield, CheckCircle2, 
  ArrowRight, ArrowLeft, Sparkles, UserCheck, LogOut 
} from 'lucide-react';
import confetti from 'canvas-confetti';

const AVATAR_OPTIONS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&h=200&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=faces'
];

export default function OnboardingWizard({ user, token, departments = [], onOnboardingComplete, onSignOut }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deptList, setDeptList] = useState(departments || []);

  // Form payload
  const [formData, setFormData] = useState({
    department_id: departments[0]?.id || '',
    program: 'B.Tech',
    semester: 1,
    phone: '+91 98765 11223',
    dob: '2005-04-12',
    gender: 'Female',
    blood_group: 'B+',
    guardian_name: 'M. K. Nair',
    guardian_phone: '+91 98765 99887',
    address: 'Campus Hostel Block C, Room 302',
    avatar_url: AVATAR_OPTIONS[0]
  });

  useEffect(() => {
    if (deptList.length === 0) {
      fetch('/api/departments', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(json => {
          if (json.success && json.data && json.data.length > 0) {
            setDeptList(json.data);
            setFormData(prev => ({
              ...prev,
              department_id: prev.department_id || json.data[0].id
            }));
          }
        })
        .catch(console.error);
    } else if (!formData.department_id && deptList.length > 0) {
      setFormData(prev => ({ ...prev, department_id: deptList[0].id }));
    }
  }, [token, deptList.length, formData.department_id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFinishOnboarding = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/auth/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to complete onboarding');
      }

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      onOnboardingComplete(json.token, json.user, json.student);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedDept = deptList.find(d => String(d.id) === String(formData.department_id)) || deptList[0];

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'radial-gradient(circle at 50% 15%, #111d38 0%, #070d18 100%)',
      color: 'var(--text-main)'
    }}>
      <div style={{
        maxWidth: '680px',
        width: '100%',
        background: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden'
      }}>
        {/* Wizard Header */}
        <div style={{
          padding: '24px',
          background: 'var(--bg-surface-elevated)',
          borderBottom: '1px solid var(--border-subtle)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff'
              }}>
                <GraduationCap size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '800' }}>
                  Matriculation & Onboarding Wizard
                </h2>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Welcome, <strong>{user.name}</strong> • Setting up your academic record identity
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge-pill primary" style={{ fontSize: '0.78rem' }}>
                Step {step} of 3
              </span>
              {onSignOut && (
                <button
                  type="button"
                  onClick={onSignOut}
                  title="Sign out / Return to login"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 10px',
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#f87171',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  <LogOut size={12} />
                  Sign Out
                </button>
              )}
            </div>
          </div>

          {/* Stepper progress indicator */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {[1, 2, 3].map(s => (
              <div
                key={s}
                style={{
                  flex: 1,
                  height: '4px',
                  borderRadius: '2px',
                  background: s <= step ? 'var(--primary)' : 'var(--border-subtle)',
                  transition: 'background 0.3s'
                }}
              />
            ))}
          </div>
        </div>

        {/* Wizard Form Body */}
        <div style={{ padding: '28px' }}>
          {error && (
            <div style={{
              background: 'var(--danger-light)',
              border: '1px solid var(--danger-border)',
              color: 'var(--danger)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '18px',
              fontSize: '0.84rem'
            }}>
              {error}
            </div>
          )}

          {/* STEP 1: ACADEMIC PLACEMENT */}
          {step === 1 && (
            <div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>
                1. Academic School & Program Enrollment
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '18px' }}>
                Select your assigned degree program and departmental division.
              </p>

              <div className="form-grid">
                <div className="form-group full">
                  <label htmlFor="onb-dept">Academic Department / Division *</label>
                  <select
                    id="onb-dept"
                    name="department_id"
                    value={formData.department_id}
                    onChange={handleChange}
                  >
                    {deptList.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.code} — {d.name} (HOD: {d.hod})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="onb-program">Degree Program *</label>
                  <select
                    id="onb-program"
                    name="program"
                    value={formData.program}
                    onChange={handleChange}
                  >
                    <option value="B.Tech">B.Tech (Bachelor of Technology)</option>
                    <option value="B.Sc">B.Sc (Bachelor of Science)</option>
                    <option value="BCA">BCA (Bachelor of Computer Apps)</option>
                    <option value="BBA">BBA (Bachelor of Business Admin)</option>
                    <option value="M.Tech">M.Tech (Master of Technology)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="onb-semester">Admitted Semester *</label>
                  <select
                    id="onb-semester"
                    name="semester"
                    value={formData.semester}
                    onChange={handleChange}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Department preview summary */}
              <div style={{
                marginTop: '18px',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px',
                fontSize: '0.8rem'
              }}>
                <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.7rem' }}>DIVISION OVERVIEW</span>
                <strong>{selectedDept?.name} ({selectedDept?.code})</strong>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px' }}>
                  {selectedDept?.description || 'Autonomous engineering and science discipline.'}
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: PERSONAL & EMERGENCY RECORD */}
          {step === 2 && (
            <div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>
                2. Contact & Emergency Guardian Record
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '18px' }}>
                Required for university medical emergency contacts and registrar communication.
              </p>

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="onb-phone">Student Mobile Contact *</label>
                  <input
                    id="onb-phone"
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="onb-dob">Date of Birth *</label>
                  <input
                    id="onb-dob"
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="onb-gender">Gender</label>
                  <select id="onb-gender" name="gender" value={formData.gender} onChange={handleChange}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="onb-bg">Blood Group</label>
                  <select id="onb-bg" name="blood_group" value={formData.blood_group} onChange={handleChange}>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="onb-gname">Guardian / Parent Name *</label>
                  <input
                    id="onb-gname"
                    type="text"
                    name="guardian_name"
                    value={formData.guardian_name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="onb-gphone">Emergency Guardian Phone *</label>
                  <input
                    id="onb-gphone"
                    type="text"
                    name="guardian_phone"
                    value={formData.guardian_phone}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group full">
                  <label htmlFor="onb-addr">Permanent / Campus Address</label>
                  <textarea
                    id="onb-addr"
                    rows="2"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: IDENTITY & MATRICULATION */}
          {step === 3 && (
            <div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>
                3. Student Identity Badge & Matriculation
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '18px' }}>
                Select your official badge portrait and review institutional fee structure assignment.
              </p>

              {/* Avatar chooser */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                  Choose ID Card Badge Portrait:
                </label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <img
                    src={formData.avatar_url}
                    alt="Active ID Portrait"
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: 'var(--radius-sm)',
                      objectFit: 'cover',
                      border: '2px solid var(--primary)'
                    }}
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {AVATAR_OPTIONS.map((url, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, avatar_url: url }))}
                        aria-label={`Select avatar portrait ${i + 1}`}
                        style={{
                          padding: 0,
                          background: 'none',
                          border: formData.avatar_url === url ? '2px solid var(--primary)' : '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                          overflow: 'hidden',
                          opacity: formData.avatar_url === url ? 1 : 0.65
                        }}
                      >
                        <img src={url} alt="" style={{ width: '42px', height: '42px', objectFit: 'cover', display: 'block' }} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Matriculation Confirmation Summary Card */}
              <div style={{
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-active)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '12px',
                fontSize: '0.82rem'
              }}>
                <div>
                  <span style={{ color: 'var(--text-dim)', fontSize: '0.7rem', display: 'block' }}>CANDIDATE</span>
                  <strong>{user.name}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-dim)', fontSize: '0.7rem', display: 'block' }}>ACADEMIC DIVISION</span>
                  <strong>{selectedDept?.code} — {formData.program}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-dim)', fontSize: '0.7rem', display: 'block' }}>ENROLLED SEMESTER</span>
                  <strong>Semester {formData.semester}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-dim)', fontSize: '0.7rem', display: 'block' }}>TUITION STRUCTURE ASSIGNED</span>
                  <strong style={{ color: 'var(--academic-gold)' }}>₹45,000 / Term</strong>
                </div>
              </div>
            </div>
          )}

          {/* Stepper Actions Footer */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '28px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-subtle)'
          }}>
            {step > 1 ? (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setStep(step - 1)}
                aria-label="Go to previous step"
              >
                <ArrowLeft size={15} /> Previous
              </button>
            ) : <div />}

            {step < 3 ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setStep(step + 1)}
                aria-label="Proceed to next step"
              >
                Continue to Step {step + 1} <ArrowRight size={15} />
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-success"
                onClick={handleFinishOnboarding}
                disabled={loading}
                aria-label="Finalize matriculation enrollment"
                style={{ background: 'var(--success)', color: '#fff' }}
              >
                <CheckCircle2 size={16} />
                {loading ? 'Finalizing Record...' : 'Complete Matriculation & Generate ID'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
