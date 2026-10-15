import React, { useState } from 'react';
import { 
  Lock, Mail, User, Shield, GraduationCap, 
  ArrowRight, CheckCircle2, AlertCircle, KeyRound, Sparkles 
} from 'lucide-react';

export default function AuthScreen({ onAuthSuccess }) {
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('student');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Authentication failed');
      }
      onAuthSuccess(json.token, json.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          password: regPassword,
          role: regRole
        })
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Registration failed');
      }
      onAuthSuccess(json.token, json.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo Login helper
  const quickDemoLogin = (email, password) => {
    setLoginEmail(email);
    setLoginPassword(password);
    setTab('login');
    setError('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'radial-gradient(circle at 50% 20%, #111d38 0%, #070d18 100%)',
      color: 'var(--text-main)'
    }}>
      <div style={{
        maxWidth: '520px',
        width: '100%',
        background: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden'
      }}>
        {/* Header Institution Banner */}
        <div style={{
          padding: '28px 24px 20px',
          textAlign: 'center',
          background: 'var(--bg-surface-elevated)',
          borderBottom: '1px solid var(--border-subtle)'
        }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--primary)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <GraduationCap size={28} />
          </div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: '800', letterSpacing: '0.02em' }}>
            APEX CAMPUS PORTAL
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '2px' }}>
            Autonomous Academic Information & Examination System
          </p>
        </div>

        {/* Tab Toggle: Login vs Register */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-subtle)'
        }}>
          <button
            type="button"
            onClick={() => { setTab('login'); setError(''); }}
            aria-label="Switch to Login Tab"
            style={{
              flex: 1,
              padding: '12px',
              background: 'none',
              border: 'none',
              borderBottom: tab === 'login' ? '2px solid var(--primary)' : '2px solid transparent',
              color: tab === 'login' ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: tab === 'login' ? '700' : '500',
              cursor: 'pointer',
              fontSize: '0.88rem',
              transition: 'var(--transition)'
            }}
          >
            Institutional Login
          </button>
          <button
            type="button"
            onClick={() => { setTab('register'); setError(''); }}
            aria-label="Switch to Register Tab"
            style={{
              flex: 1,
              padding: '12px',
              background: 'none',
              border: 'none',
              borderBottom: tab === 'register' ? '2px solid var(--primary)' : '2px solid transparent',
              color: tab === 'register' ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: tab === 'register' ? '700' : '500',
              cursor: 'pointer',
              fontSize: '0.88rem',
              transition: 'var(--transition)'
            }}
          >
            New Registration
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          {error && (
            <div style={{
              background: 'var(--danger-light)',
              border: '1px solid var(--danger-border)',
              color: 'var(--danger)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '16px',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {tab === 'login' ? (
            /* LOGIN FORM */
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label htmlFor="login-email">Campus Email Address *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="login-email"
                    type="email"
                    placeholder="e.g. admin@apex.edu or student@apex.edu"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    required
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="login-password">Password *</label>
                <input
                  id="login-password"
                  type="password"
                  placeholder="Enter your security password"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                aria-label="Sign in to campus portal"
                style={{ width: '100%', padding: '10px', marginTop: '6px' }}
              >
                {loading ? 'Authenticating...' : 'Sign In to Campus Portal'}
              </button>
            </form>
          ) : (
            /* REGISTRATION FORM */
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label htmlFor="reg-name">Full Candidate Name *</label>
                <input
                  id="reg-name"
                  type="text"
                  placeholder="e.g. Priya Nair"
                  value={regName}
                  onChange={e => setRegName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="reg-email">Official Email Address *</label>
                <input
                  id="reg-email"
                  type="email"
                  placeholder="e.g. priya.nair@apex.edu"
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="reg-password">Create Security Password *</label>
                <input
                  id="reg-password"
                  type="password"
                  placeholder="At least 6 characters"
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <div className="form-group">
                <label htmlFor="reg-role">Portal Registration Role *</label>
                <select
                  id="reg-role"
                  value={regRole}
                  onChange={e => setRegRole(e.target.value)}
                >
                  <option value="student">Student Candidate (Self-Service)</option>
                  <option value="faculty">Faculty Member (Professor / Instructor)</option>
                </select>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                aria-label="Create account and launch onboarding"
                style={{ width: '100%', padding: '10px', marginTop: '6px' }}
              >
                {loading ? 'Creating Credentials...' : 'Register & Start Onboarding'}
              </button>
            </form>
          )}

          {/* Quick Demo Credentials Bar for Viva & Evaluators */}
          <div style={{
            marginTop: '22px',
            paddingTop: '16px',
            borderTop: '1px dashed var(--border-subtle)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px'
            }}>
              <span style={{ fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-dim)', letterSpacing: '0.06em' }}>
                Instant Evaluator Demo Profiles
              </span>
              <span style={{ fontSize: '0.68rem', color: 'var(--academic-gold)', fontWeight: '600' }}>
                1-Click Sign In
              </span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '8px'
            }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => quickDemoLogin('admin@apex.edu', 'Admin@123')}
                aria-label="Load Administrator profile"
                style={{ justifyContent: 'flex-start', padding: '6px 10px', fontSize: '0.76rem' }}
              >
                <span>👑</span>
                <div style={{ textAlign: 'left', minWidth: 0 }}>
                  <strong style={{ display: 'block', fontSize: '0.78rem' }}>Admin</strong>
                  <span style={{ fontSize: '0.66rem', color: 'var(--text-dim)' }}>Full Control</span>
                </div>
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => quickDemoLogin('faculty@apex.edu', 'Faculty@123')}
                aria-label="Load Faculty profile"
                style={{ justifyContent: 'flex-start', padding: '6px 10px', fontSize: '0.76rem' }}
              >
                <span>👨‍🏫</span>
                <div style={{ textAlign: 'left', minWidth: 0 }}>
                  <strong style={{ display: 'block', fontSize: '0.78rem' }}>Faculty</strong>
                  <span style={{ fontSize: '0.66rem', color: 'var(--text-dim)' }}>Grading & Attendance</span>
                </div>
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => quickDemoLogin('student@apex.edu', 'Student@123')}
                aria-label="Load Active Student profile"
                style={{ justifyContent: 'flex-start', padding: '6px 10px', fontSize: '0.76rem' }}
              >
                <span>🎓</span>
                <div style={{ textAlign: 'left', minWidth: 0 }}>
                  <strong style={{ display: 'block', fontSize: '0.78rem' }}>Student</strong>
                  <span style={{ fontSize: '0.66rem', color: 'var(--text-dim)' }}>Aarav Sharma</span>
                </div>
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => quickDemoLogin('fresh@apex.edu', 'Fresh@123')}
                aria-label="Load Fresh Student to test Onboarding flow"
                style={{ justifyContent: 'flex-start', padding: '6px 10px', fontSize: '0.76rem', borderColor: 'var(--primary-border)' }}
              >
                <span>✨</span>
                <div style={{ textAlign: 'left', minWidth: 0 }}>
                  <strong style={{ display: 'block', fontSize: '0.78rem', color: 'var(--primary)' }}>Onboarding</strong>
                  <span style={{ fontSize: '0.66rem', color: 'var(--text-dim)' }}>Fresh Setup</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
