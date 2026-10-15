import React, { useState, useEffect } from 'react';
import { 
  Users, BookOpen, CalendarCheck, Award, CreditCard, 
  Building2, Bell, LayoutDashboard, Plus, Search, Filter, 
  Download, Printer, RefreshCw, Sun, Moon, Shield, Eye,
  CheckCircle2, AlertCircle, TrendingUp, Sparkles, UserCheck,
  ChevronRight, ArrowUpRight, GraduationCap, LogOut, KeyRound, UserPlus
} from 'lucide-react';

import StudentDetailModal from './components/StudentDetailModal';
import StudentIdCard from './components/StudentIdCard';
import ReportCardModal from './components/ReportCardModal';
import FeeReceiptModal from './components/FeeReceiptModal';
import AddStudentModal from './components/AddStudentModal';
import RecordPaymentModal from './components/RecordPaymentModal';
import AddGradeModal from './components/AddGradeModal';
import AttendanceSheet from './components/AttendanceSheet';
import AuthScreen from './components/AuthScreen';
import OnboardingWizard from './components/OnboardingWizard';
import { authFetch, getAuthToken, getCurrentUser } from './utils/api';

export default function App() {
  // Theme state
  const [theme, setTheme] = useState('dark');

  // Real JWT Authentication State
  const [token, setToken] = useState(() => getAuthToken());
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());
  const [currentRole, setCurrentRole] = useState(() => getCurrentUser()?.role || 'admin');
  
  // Navigation
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Global Data
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [fees, setFees] = useState([]);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterSem, setFilterSem] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Modals state
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [idCardStudent, setIdCardStudent] = useState(null);
  const [reportCardData, setReportCardData] = useState(null); // { studentId, semester }
  const [receiptNumber, setReceiptNumber] = useState(null);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [payingFee, setPayingFee] = useState(null);
  const [isAddGradeOpen, setIsAddGradeOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // Notice form modal
  const [isNewNoticeOpen, setIsNewNoticeOpen] = useState(false);
  const [noticeForm, setNoticeForm] = useState({ title: '', category: 'Academic', content: '', priority: 'Normal' });

  // Load everything
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (token && currentUser) {
      fetchAllData();
    }
  }, [token, currentUser?.id]);

  const handleAuthSuccess = (newToken, userPayload) => {
    localStorage.setItem('apex_token', newToken);
    localStorage.setItem('apex_user', JSON.stringify(userPayload));
    setToken(newToken);
    setCurrentUser(userPayload);
    setCurrentRole(userPayload.role);
    fetchAllData();
  };

  const handleSignOut = () => {
    localStorage.removeItem('apex_token');
    localStorage.removeItem('apex_user');
    setToken('');
    setCurrentUser(null);
    setCurrentRole('admin');
  };

  const handleOnboardingComplete = (newToken, updatedUser, studentRecord) => {
    localStorage.setItem('apex_token', newToken);
    localStorage.setItem('apex_user', JSON.stringify(updatedUser));
    setToken(newToken);
    setCurrentUser(updatedUser);
    setCurrentRole(updatedUser.role);
    fetchAllData();
  };

  const handleSwitchPersona = async (targetRole) => {
    const credentials = {
      admin: { email: 'admin@apex.edu', password: 'Admin@123' },
      faculty: { email: 'faculty@apex.edu', password: 'Faculty@123' },
      student: { email: 'student@apex.edu', password: 'Student@123' },
      fresh: { email: 'fresh@apex.edu', password: 'Fresh@123' }
    };
    const cred = credentials[targetRole];
    if (!cred) return;
    try {
      setLoading(true);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cred)
      });
      const json = await res.json();
      if (json.success) {
        handleAuthSuccess(json.token, json.user);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [statsRes, studentsRes, deptsRes, coursesRes, feesRes, noticesRes] = await Promise.all([
        authFetch('/api/stats/overview'),
        authFetch('/api/students'),
        authFetch('/api/departments'),
        authFetch('/api/courses'),
        authFetch('/api/fees'),
        authFetch('/api/notices')
      ]);

      const [sData, stData, dData, cData, fData, nData] = await Promise.all([
        statsRes.json(),
        studentsRes.json(),
        deptsRes.json(),
        coursesRes.json(),
        feesRes.json(),
        noticesRes.json()
      ]);

      if (sData.success) setStats(sData.data);
      if (stData.success) setStudents(stData.data);
      if (dData.success) setDepartments(dData.data);
      if (cData.success) setCourses(cData.data);
      if (fData.success) setFees(fData.data);
      if (nData.success) setNotices(nData.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetSeed = async () => {
    if (!window.confirm('Reset database to demo dataset with 12+ students, attendance logs, and marks?')) return;
    try {
      setSeeding(true);
      const res = await authFetch('/api/seed', { method: 'POST' });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to reset database');
      }
      await fetchAllData();
      alert('Database successfully reset and re-seeded!');
    } catch (err) {
      alert('Error resetting data: ' + err.message);
    } finally {
      setSeeding(false);
    }
  };

  const handlePostNotice = async (e) => {
    e.preventDefault();
    try {
      const res = await authFetch('/api/notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noticeForm)
      });
      const json = await res.json();
      if (json.success) {
        setNotices(prev => [json.data, ...prev]);
        setIsNewNoticeOpen(false);
        setNoticeForm({ title: '', category: 'Academic', content: '', priority: 'Normal' });
      } else {
        alert(json.error || 'Failed to publish notice');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Export Students to CSV
  const handleExportCSV = () => {
    if (students.length === 0) return;
    const headers = ['Roll Number', 'Name', 'Email', 'Phone', 'Department', 'Semester', 'Batch', 'Attendance %', 'GPA', 'Status'];
    const rows = students.map(s => [
      s.roll_number,
      `"${s.first_name} ${s.last_name}"`,
      s.email,
      s.phone,
      s.department_code || s.department_name,
      s.semester,
      s.batch,
      s.attendance_percentage,
      s.gpa,
      s.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Student_Directory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered Students List
  const filteredStudents = students.filter(s => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || 
      s.first_name.toLowerCase().includes(q) || 
      s.last_name.toLowerCase().includes(q) || 
      s.roll_number.toLowerCase().includes(q) || 
      s.email.toLowerCase().includes(q);
    const matchesDept = !filterDept || String(s.department_id) === String(filterDept);
    const matchesSem = !filterSem || String(s.semester) === String(filterSem);
    const matchesStatus = !filterStatus || s.status === filterStatus;
    return matchesSearch && matchesDept && matchesSem && matchesStatus;
  });

  // Demo Student for Student Portal (Aarav Sharma or Logged-in Candidate)
  const loggedInStudent = (currentUser && currentUser.role === 'student')
    ? (students.find(s => s.id === currentUser.student_id || s.email?.toLowerCase() === currentUser.email?.toLowerCase()) || students.find(s => s.roll_number === '2023CS101') || students[0])
    : (students.find(s => s.roll_number === '2023CS101') || students[0]);

  // Student specific fee calculations for personalized ledger
  const studentFeeItems = fees.filter(f => f.student_id === loggedInStudent?.id || f.roll_number === loggedInStudent?.roll_number);
  const studentTotalFee = studentFeeItems.reduce((acc, f) => acc + (Number(f.total_amount) || 0), 0);
  const studentPaidFee = studentFeeItems.reduce((acc, f) => acc + (Number(f.paid_amount) || 0), 0);
  const studentDueFee = Math.max(0, studentTotalFee - studentPaidFee);

  // Gated Auth Render: If unauthenticated, show real AuthScreen (Login/Register)
  if (!token || !currentUser) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  // Gated Onboarding Render: If student hasn't completed onboarding, render 3-step enrollment wizard
  if (currentUser.role === 'student' && currentUser.is_onboarded === 0) {
    return (
      <OnboardingWizard 
        user={currentUser} 
        token={token} 
        departments={departments} 
        onOnboardingComplete={handleOnboardingComplete} 
        onSignOut={handleSignOut}
      />
    );
  }

  return (
    <div className="app-layout">
      {/* SIDEBAR NAVIGATION (Semantic buttons for WCAG keyboard accessibility) */}
      <aside className="app-sidebar no-print">
        <div className="sidebar-brand">
          <div className="brand-icon-wrapper">
            <GraduationCap size={22} />
          </div>
          <div className="brand-text">
            <h1>APEX CAMPUS</h1>
            <p>EduTrack Pro v2.4</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title">
            {currentRole === 'student' ? 'Student Workspace' : 'Core Administration'}
          </div>
          
          <button 
            type="button"
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
            aria-label="Navigate to Dashboard & Insights"
          >
            <LayoutDashboard size={18} />
            <span>{currentRole === 'student' ? 'My Overview' : 'Dashboard & Insights'}</span>
          </button>

          {currentRole !== 'student' && (
            <button 
              type="button"
              className={`nav-item ${activeTab === 'students' ? 'active' : ''}`}
              onClick={() => setActiveTab('students')}
              aria-label="Navigate to Student Enrollment Directory"
            >
              <Users size={18} />
              <span>Students Directory</span>
              <span className="badge">{students.length}</span>
            </button>
          )}

          {currentRole === 'student' && loggedInStudent && (
            <button 
              type="button"
              className="nav-item"
              onClick={() => setIdCardStudent(loggedInStudent)}
              aria-label="Open 3D Holographic Student ID Card"
            >
              <Shield size={18} />
              <span>Digital ID Card</span>
            </button>
          )}

          {currentRole !== 'student' && (
            <button 
              type="button"
              className={`nav-item ${activeTab === 'departments' ? 'active' : ''}`}
              onClick={() => setActiveTab('departments')}
              aria-label="Navigate to Academic Departments"
            >
              <Building2 size={18} />
              <span>Departments</span>
            </button>
          )}

          <button 
            type="button"
            className={`nav-item ${activeTab === 'courses' ? 'active' : ''}`}
            onClick={() => setActiveTab('courses')}
            aria-label="Navigate to Courses & Curriculum Catalog"
          >
            <BookOpen size={18} />
            <span>Courses & Syllabi</span>
          </button>

          <div className="nav-section-title">
            {currentRole === 'student' ? 'Academic Records' : 'Academic Operations'}
          </div>

          <button 
            type="button"
            className={`nav-item ${activeTab === 'attendance' ? 'active' : ''}`}
            onClick={() => setActiveTab('attendance')}
            aria-label="Navigate to Daily Lecture Attendance"
          >
            <CalendarCheck size={18} />
            <span>{currentRole === 'student' ? 'My Attendance Log' : 'Daily Attendance'}</span>
          </button>

          <button 
            type="button"
            className={`nav-item ${activeTab === 'grades' ? 'active' : ''}`}
            onClick={() => setActiveTab('grades')}
            aria-label="Navigate to Examinations & Transcripts"
          >
            <Award size={18} />
            <span>{currentRole === 'student' ? 'My Marksheet & SGPA' : 'Examinations & GPA'}</span>
          </button>

          {currentRole !== 'faculty' && (
            <button 
              type="button"
              className={`nav-item ${activeTab === 'fees' ? 'active' : ''}`}
              onClick={() => setActiveTab('fees')}
              aria-label="Navigate to Fee Ledger & Invoices"
            >
              <CreditCard size={18} />
              <span>{currentRole === 'student' ? 'My Fee Dues & Receipts' : 'Fee Ledger & Invoices'}</span>
            </button>
          )}

          <button 
            type="button"
            className={`nav-item ${activeTab === 'notices' ? 'active' : ''}`}
            onClick={() => setActiveTab('notices')}
            aria-label="Navigate to Campus Bulletins"
          >
            <Bell size={18} />
            <span>Campus Bulletins</span>
            {notices.length > 0 && <span className="badge" style={{ background: 'var(--danger)' }}>{notices.length}</span>}
          </button>
        </nav>

        {/* Sidebar Footer User Info */}
        <div className="sidebar-footer">
          <div className="user-role-card">
            <img 
              src={currentUser?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&crop=faces'} 
              alt=""
              className="user-avatar-sm"
            />
            <div className="user-role-info">
              <div className="name">
                {currentUser?.name || 'Authorized User'}
              </div>
              <div className="role">
                {currentRole === 'admin' ? 'Chief Administrator' : (currentRole === 'faculty' ? 'Associate Professor' : `Enrolled (${loggedInStudent?.roll_number || '2023CS101'})`)}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <div className="app-main">
        {/* TOP HEADER */}
        <header className="app-header no-print">
          <div className="header-search">
            <Search className="search-icon" size={16} />
            <input 
              type="text" 
              placeholder="Search candidate by name, roll no, email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              aria-label="Search students by name, roll number, or email"
            />
          </div>

          <div className="header-actions">
            {/* Authenticated User Session Badge */}
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '4px 12px 4px 6px',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-full)'
              }}
            >
              <img 
                src={currentUser?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&crop=faces'} 
                alt="" 
                style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)' }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
                <span style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)' }}>
                  {currentUser?.name || 'User'}
                </span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                  {currentRole === 'admin' ? 'Administrator' : (currentRole === 'faculty' ? 'Faculty Professor' : `${loggedInStudent?.roll_number || 'Candidate'}`)}
                </span>
              </div>
              <span 
                className={`badge-pill ${currentRole === 'admin' ? 'danger' : (currentRole === 'faculty' ? 'primary' : 'success')}`}
                style={{ textTransform: 'uppercase', fontSize: '0.62rem', padding: '2px 8px' }}
              >
                {currentRole}
              </span>
            </div>

            {/* Quick Re-seed / Demo Reset (Admin Only) */}
            {currentRole === 'admin' && (
              <button 
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleResetSeed}
                disabled={seeding}
                aria-label="Reset demo dataset with sample records"
              >
                <RefreshCw size={13} className={seeding ? 'spin' : ''} />
                {seeding ? 'Resetting...' : 'Reset Demo'}
              </button>
            )}

            {/* Theme Toggle */}
            <button 
              type="button"
              className="btn-icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} visual theme`}
            >
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {/* Sign Out Button */}
            <button 
              type="button" 
              className="btn btn-secondary btn-sm"
              onClick={handleSignOut}
              aria-label="Sign out of current account"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        {/* PAGE CONTENT CONTAINER */}
        <main className="page-container">
          
          {/* STUDENT ROLE VIEW BANNER (Only on sub-tabs) */}
          {currentRole === 'student' && loggedInStudent && activeTab !== 'dashboard' && (
            <div className="card" style={{
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-active)',
              marginBottom: '24px',
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <img 
                  src={loggedInStudent.avatar_url} 
                  alt=""
                  style={{ width: '60px', height: '60px', borderRadius: 'var(--radius-sm)', border: '2px solid var(--primary)', objectFit: 'cover' }}
                />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h2 style={{ fontSize: '1.3rem' }}>
                      Candidate Session: {loggedInStudent.first_name} {loggedInStudent.last_name}
                    </h2>
                    <span className="badge-pill success">STUDENT SELF-SERVICE</span>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', marginTop: '2px' }}>
                    Enrollment: <strong style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>{loggedInStudent.roll_number}</strong> • {loggedInStudent.program} in {loggedInStudent.department_name} • Semester {loggedInStudent.semester}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIdCardStudent(loggedInStudent)}
                  aria-label="View Digital ID Card"
                >
                  <Shield size={14} /> My Digital ID Card
                </button>
                <button 
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setReportCardData({ studentId: loggedInStudent.id, semester: loggedInStudent.semester })}
                  aria-label="View Semester Grade Sheet"
                >
                  <Award size={14} /> My Marksheet & GPA
                </button>
              </div>
            </div>
          )}

          {/* TAB 1: DASHBOARD & INSIGHTS */}
          {activeTab === 'dashboard' && (
            currentRole === 'student' && loggedInStudent ? (
              /* STUDENT PERSONAL ACADEMIC WORKSPACE */
              <div>
                <div className="page-header">
                  <div className="page-title-group">
                    <h2>Candidate Academic Workspace</h2>
                    <p>
                      Welcome, <strong>{loggedInStudent.first_name} {loggedInStudent.last_name}</strong> • Enrollment: <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>{loggedInStudent.roll_number}</strong> • {loggedInStudent.program} in {loggedInStudent.department_name}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setIdCardStudent(loggedInStudent)}
                      aria-label="View Digital ID Card"
                    >
                      <Shield size={14} /> My Digital ID Card
                    </button>
                    <button 
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => setReportCardData({ studentId: loggedInStudent.id, semester: loggedInStudent.semester })}
                      aria-label="View Semester Grade Sheet"
                    >
                      <Award size={14} /> View Marksheet & GPA
                    </button>
                  </div>
                </div>

                {/* Student Academic KPI Grid */}
                <div className="stat-grid" style={{ marginBottom: '24px' }}>
                  <div className="stat-card primary">
                    <div className="stat-info">
                      <div className="label">Class Attendance</div>
                      <div className="value">{loggedInStudent.attendance_percentage}%</div>
                      <div className="subtext" style={{ color: Number(loggedInStudent.attendance_percentage) >= 75 ? 'var(--success)' : 'var(--danger)' }}>
                        {Number(loggedInStudent.attendance_percentage) >= 75 ? '✓ Exam Clearance Active (>75%)' : '⚠ Attendance Shortage'}
                      </div>
                    </div>
                    <div className="stat-icon primary">
                      <UserCheck size={22} />
                    </div>
                  </div>

                  <div className="stat-card success">
                    <div className="stat-info">
                      <div className="label">Cumulative GPA</div>
                      <div className="value">{loggedInStudent.gpa} / 10</div>
                      <div className="subtext">Term Standing: First Class Honors</div>
                    </div>
                    <div className="stat-icon success">
                      <Award size={22} />
                    </div>
                  </div>

                  <div className="stat-card info">
                    <div className="stat-info">
                      <div className="label">Active Courses</div>
                      <div className="value">
                        {courses.filter(c => c.semester === loggedInStudent.semester && (!loggedInStudent.department_id || c.department_id === loggedInStudent.department_id)).length || 5} Subjects
                      </div>
                      <div className="subtext">Semester {loggedInStudent.semester} Curriculum Load</div>
                    </div>
                    <div className="stat-icon info">
                      <BookOpen size={22} />
                    </div>
                  </div>

                  <div className="stat-card warning">
                    <div className="stat-info">
                      <div className="label">Tuition Clearance</div>
                      <div className="value" style={{
                        color: fees.filter(f => f.student_id === loggedInStudent.id).reduce((acc, f) => acc + (f.total_amount - f.paid_amount), 0) > 0 ? 'var(--danger)' : 'var(--success)'
                      }}>
                        {fees.filter(f => f.student_id === loggedInStudent.id).reduce((acc, f) => acc + (f.total_amount - f.paid_amount), 0) > 0
                          ? `₹${fees.filter(f => f.student_id === loggedInStudent.id).reduce((acc, f) => acc + (f.total_amount - f.paid_amount), 0).toLocaleString()} Due`
                          : 'Cleared ✓'}
                      </div>
                      <div className="subtext">
                        {fees.filter(f => f.student_id === loggedInStudent.id).reduce((acc, f) => acc + (f.total_amount - f.paid_amount), 0) > 0
                          ? 'Outstanding installment payment'
                          : 'All term receipts issued'}
                      </div>
                    </div>
                    <div className="stat-icon warning">
                      <CreditCard size={22} />
                    </div>
                  </div>
                </div>

                {/* Registered Courses & Bulletins */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                  gap: '20px',
                  marginBottom: '24px'
                }}>
                  {/* Course Roster */}
                  <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <h3 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BookOpen size={17} color="var(--primary)" /> Registered Curriculum (Semester {loggedInStudent.semester})
                      </h3>
                      <span className="badge-pill primary">{loggedInStudent.department_code || 'CSE'}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {courses
                        .filter(c => c.semester === loggedInStudent.semester && (!loggedInStudent.department_id || c.department_id === loggedInStudent.department_id))
                        .map(c => (
                          <div key={c.id} style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 14px',
                            background: 'var(--bg-subtle)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-subtle)'
                          }}>
                            <div>
                              <strong style={{ fontSize: '0.88rem', color: 'var(--text-main)', display: 'block' }}>{c.name}</strong>
                              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Instructor: {c.instructor} • {c.credits} Credits • {c.type}</span>
                            </div>
                            <span className="badge-pill info" style={{ fontSize: '0.7rem' }}>{c.code}</span>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Academic Bulletins for Students */}
                  <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <h3 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Bell size={17} color="var(--danger)" /> Academic Bulletins & Notices
                      </h3>
                      <span className="badge-pill danger">CAMPUS NOTICES</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {notices.slice(0, 3).map(n => (
                        <div key={n.id} style={{
                          padding: '12px 14px',
                          background: 'var(--bg-subtle)',
                          borderRadius: 'var(--radius-md)',
                          borderLeft: `3px solid ${n.priority === 'High' ? 'var(--danger)' : 'var(--primary)'}`
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <strong style={{ fontSize: '0.86rem', color: 'var(--text-main)' }}>{n.title}</strong>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{n.date}</span>
                          </div>
                          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{n.content}</p>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                            Issued by {n.posted_by}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              stats && (
                <div>
              {/* Header Title */}
              <div className="page-header">
                <div className="page-title-group">
                  <h2>Institutional Analytics & Executive Dashboard</h2>
                  <p>Comprehensive overview of student demographics, academic attendance, GPA metrics and financial records</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    type="button"
                    className="btn btn-secondary btn-sm" 
                    onClick={handleExportCSV}
                    aria-label="Export student directory to CSV"
                  >
                    <Download size={14} /> Export CSV
                  </button>
                  {currentRole === 'admin' && (
                    <button 
                      type="button"
                      className="btn btn-primary btn-sm" 
                      onClick={() => setIsAddStudentOpen(true)}
                      aria-label="Enroll a new student candidate"
                    >
                      <Plus size={15} /> Enroll Student
                    </button>
                  )}
                </div>
              </div>

              {/* KPI Cards Grid */}
              <div className="stat-grid">
                <div className="stat-card primary">
                  <div className="stat-info">
                    <div className="label">Total Enrolled</div>
                    <div className="value">{stats.totalStudents}</div>
                    <div className="subtext">Across {stats.totalDepartments} departments</div>
                  </div>
                  <div className="stat-icon primary">
                    <Users size={22} />
                  </div>
                </div>

                <div className="stat-card success">
                  <div className="stat-info">
                    <div className="label">Overall Attendance</div>
                    <div className="value">{stats.avgAttendance}%</div>
                    <div className="subtext">Campus-wide turnout rate</div>
                  </div>
                  <div className="stat-icon success">
                    <UserCheck size={22} />
                  </div>
                </div>

                <div className="stat-card info">
                  <div className="stat-info">
                    <div className="label">Active Courses</div>
                    <div className="value">{stats.totalCourses}</div>
                    <div className="subtext">Taught this semester</div>
                  </div>
                  <div className="stat-icon info">
                    <BookOpen size={22} />
                  </div>
                </div>

                <div className="stat-card warning">
                  <div className="stat-info">
                    <div className="label">Fee Realized</div>
                    <div className="value">₹{(stats.feeOverview.paid / 1000).toFixed(0)}k</div>
                    <div className="subtext">Pending: ₹{(stats.feeOverview.pending / 1000).toFixed(0)}k</div>
                  </div>
                  <div className="stat-icon warning">
                    <CreditCard size={22} />
                  </div>
                </div>
              </div>

              {/* Visual Breakdown Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                gap: '20px',
                marginBottom: '24px'
              }}>
                {/* Department Enrollment Distribution */}
                <div className="card">
                  <h3 style={{ fontSize: '1.05rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Building2 size={17} color="var(--primary)" /> Department Enrollment Distribution
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {stats.deptStats.map(dept => {
                      const pct = stats.totalStudents > 0 ? Math.round((dept.student_count / stats.totalStudents) * 100) : 0;
                      return (
                        <div key={dept.id}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                            <span style={{ fontWeight: '600' }}>{dept.name} ({dept.code})</span>
                            <span style={{ color: 'var(--text-muted)' }}>{dept.student_count} students ({pct}%)</span>
                          </div>
                          <div style={{ height: '7px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                            <div style={{
                              width: `${pct}%`,
                              height: '100%',
                              background: 'var(--primary)',
                              borderRadius: 'var(--radius-sm)'
                            }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Daily Attendance Trend */}
                <div className="card">
                  <h3 style={{ fontSize: '1.05rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TrendingUp size={17} color="var(--success)" /> Recent Lecture Turnout Trend
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '14px', height: '170px', padding: '10px 0' }}>
                    {stats.recentAttDates.map((item, idx) => (
                      <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px' }}>
                          {item.percentage}%
                        </div>
                        <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end' }}>
                          <div style={{
                            width: '100%',
                            height: `${item.percentage}%`,
                            background: item.percentage >= 75 ? 'var(--success)' : 'var(--warning)',
                            borderRadius: '4px 4px 0 0'
                          }} />
                        </div>
                        <div style={{ fontSize: '0.66rem', color: 'var(--text-dim)', marginTop: '6px', whiteSpace: 'nowrap' }}>
                          {item.date.slice(5)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Row: Top Performers & Recent Notices */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                gap: '20px'
              }}>
                {/* Honor Roll / Top Performers */}
                <div className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h3 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Sparkles size={17} color="#d97706" /> Academic Honor Roll (Top GPAs)
                    </h3>
                    <span className="badge-pill success">TERM MERIT</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {stats.topPerformers.map((student, rank) => (
                      <button 
                        key={student.id}
                        type="button"
                        onClick={() => setSelectedStudentId(student.id)}
                        aria-label={`View academic record of ${student.first_name} ${student.last_name}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 12px',
                          background: 'var(--bg-subtle)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-subtle)',
                          cursor: 'pointer',
                          width: '100%',
                          textAlign: 'left',
                          color: 'var(--text-main)',
                          transition: 'var(--transition)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: 'var(--radius-sm)',
                            background: rank === 0 ? '#d97706' : (rank === 1 ? '#64748b' : '#b45309'),
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.72rem',
                            fontWeight: '800'
                          }}>
                            {rank + 1}
                          </div>
                          <img 
                            src={student.avatar_url} 
                            alt=""
                            style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
                          />
                          <div>
                            <strong style={{ fontSize: '0.88rem' }}>{student.first_name} {student.last_name}</strong>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              <span style={{ fontFamily: 'var(--font-mono)' }}>{student.roll_number}</span> • {student.department_code}
                            </div>
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--primary)' }}>
                            {student.gpa}
                          </span>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', display: 'block' }}>CGPA</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Campus Notices */}
                <div className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h3 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Bell size={17} color="var(--primary)" /> Campus Bulletin & Announcements
                    </h3>
                    <button 
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setIsNewNoticeOpen(true)}
                      aria-label="Publish a new campus notice"
                    >
                      <Plus size={13} /> Post Notice
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {stats.recentNotices.map(notice => (
                      <div 
                        key={notice.id}
                        style={{
                          padding: '12px 14px',
                          background: 'var(--bg-subtle)',
                          borderRadius: 'var(--radius-md)',
                          borderLeft: `3px solid ${notice.priority === 'High' ? 'var(--danger)' : 'var(--primary)'}`
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <strong style={{ fontSize: '0.86rem', color: 'var(--text-main)' }}>{notice.title}</strong>
                          <span className={`badge-pill ${notice.priority === 'High' ? 'danger' : 'primary'}`} style={{ fontSize: '0.65rem' }}>
                            {notice.category}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                          {notice.content}
                        </p>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                          Issued by {notice.posted_by} • {notice.date}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) )
          )}

          {/* TAB 2: STUDENTS DIRECTORY */}
          {activeTab === 'students' && (
            <div>
              <div className="page-header">
                <div className="page-title-group">
                  <h2>Student Enrollment Directory</h2>
                  <p>Manage official student dossiers, generate photo ID badges, view transcripts, and track academic standing</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    type="button"
                    className="btn btn-secondary btn-sm" 
                    onClick={handleExportCSV}
                    aria-label="Export student directory to CSV"
                  >
                    <Download size={14} /> Export CSV
                  </button>
                  {currentRole === 'admin' && (
                    <button 
                      type="button"
                      className="btn btn-primary btn-sm" 
                      onClick={() => setIsAddStudentOpen(true)}
                      aria-label="Enroll a new student candidate"
                    >
                      <Plus size={15} /> Enroll New Student
                    </button>
                  )}
                </div>
              </div>

              {/* Filters Bar */}
              <div className="card" style={{ padding: '14px 18px', marginBottom: '18px' }}>
                <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                    <Filter size={14} /> Filter Record:
                  </div>

                  <select 
                    value={filterDept} 
                    onChange={e => setFilterDept(e.target.value)}
                    aria-label="Filter by academic department"
                    style={{ padding: '6px 12px', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-main)', fontSize: '0.8rem' }}
                  >
                    <option value="">All Departments</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.code} — {d.name}</option>
                    ))}
                  </select>

                  <select 
                    value={filterSem} 
                    onChange={e => setFilterSem(e.target.value)}
                    aria-label="Filter by semester"
                    style={{ padding: '6px 12px', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-main)', fontSize: '0.8rem' }}
                  >
                    <option value="">All Semesters</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>

                  <select 
                    value={filterStatus} 
                    onChange={e => setFilterStatus(e.target.value)}
                    aria-label="Filter by enrollment status"
                    style={{ padding: '6px 12px', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-main)', fontSize: '0.8rem' }}
                  >
                    <option value="">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Suspended">Suspended</option>
                  </select>

                  {(filterDept || filterSem || filterStatus || searchQuery) && (
                    <button 
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => { setFilterDept(''); setFilterSem(''); setFilterStatus(''); setSearchQuery(''); }}
                      aria-label="Reset all search filters"
                      style={{ padding: '4px 10px', fontSize: '0.76rem' }}
                    >
                      Clear Filters
                    </button>
                  )}

                  <div style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Displaying <strong>{filteredStudents.length}</strong> of {students.length} matriculated students
                  </div>
                </div>
              </div>

              {/* Students Table */}
              <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Candidate Profile</th>
                        <th>Enrollment Roll</th>
                        <th>Program & Dept</th>
                        <th>Term</th>
                        <th>Turnout %</th>
                        <th>CGPA</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Dossier Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.length > 0 ? (
                        filteredStudents.map(student => (
                          <tr key={student.id}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <img 
                                  src={student.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&crop=faces'} 
                                  alt=""
                                  style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', objectFit: 'cover', border: '1px solid var(--border-subtle)' }}
                                />
                                <div>
                                  <strong style={{ display: 'block', fontSize: '0.88rem' }}>
                                    {student.first_name} {student.last_name}
                                  </strong>
                                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                    {student.email}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--primary)' }}>
                                {student.roll_number}
                              </span>
                            </td>
                            <td>
                              <div><strong>{student.department_code}</strong></div>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{student.program}</span>
                            </td>
                            <td>Term {student.semester}</td>
                            <td>
                              <span style={{
                                fontWeight: '700',
                                color: student.attendance_percentage >= 75 ? 'var(--success)' : 'var(--danger)'
                              }}>
                                {student.attendance_percentage}%
                              </span>
                            </td>
                            <td>
                              <strong style={{ color: 'var(--primary)', fontSize: '0.92rem' }}>
                                {student.gpa || '0.00'}
                              </strong>
                            </td>
                            <td>
                              <span className={`badge-pill ${student.status === 'Active' ? 'success' : 'warning'}`}>
                                {student.status}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', gap: '6px' }}>
                                <button 
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => setSelectedStudentId(student.id)}
                                  aria-label={`View full dossier of ${student.first_name} ${student.last_name}`}
                                >
                                  <Eye size={13} /> View
                                </button>
                                <button 
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => setIdCardStudent(student)}
                                  aria-label={`Generate ID Card for ${student.first_name} ${student.last_name}`}
                                >
                                  <Shield size={13} /> ID
                                </button>
                                <button 
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => setReportCardData({ studentId: student.id, semester: student.semester })}
                                  aria-label={`View Marksheet for ${student.first_name} ${student.last_name}`}
                                >
                                  <Award size={13} /> Marks
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                            No student records match the active filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DEPARTMENTS */}
          {activeTab === 'departments' && (
            <div>
              <div className="page-header">
                <div className="page-title-group">
                  <h2>Academic Departments & Faculties</h2>
                  <p>Overview of institutional schools, department heads, student intake capacity, and curriculum distribution</p>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '18px'
              }}>
                {departments.map(dept => (
                  <div key={dept.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <span className="badge-pill primary">{dept.code}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Capacity: {dept.intake} seats</span>
                    </div>

                    <h3 style={{ fontSize: '1.15rem', marginBottom: '4px' }}>{dept.name}</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px', flex: 1 }}>
                      {dept.description || 'Core engineering and academic division.'}
                    </p>

                    <div style={{
                      background: 'var(--bg-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '10px',
                      border: '1px solid var(--border-subtle)',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '8px',
                      textAlign: 'center',
                      marginBottom: '12px'
                    }}>
                      <div>
                        <span style={{ fontSize: '0.66rem', color: 'var(--text-dim)', display: 'block' }}>STUDENTS</span>
                        <strong style={{ fontSize: '1.05rem', color: 'var(--primary)' }}>{dept.student_count || 0}</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.66rem', color: 'var(--text-dim)', display: 'block' }}>COURSES</span>
                        <strong style={{ fontSize: '1.05rem' }}>{dept.course_count || 0}</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.66rem', color: 'var(--text-dim)', display: 'block' }}>HOD</span>
                        <strong style={{ fontSize: '0.74rem', color: 'var(--text-main)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {dept.hod}
                        </strong>
                      </div>
                    </div>

                    <button 
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setFilterDept(dept.id);
                        setActiveTab('students');
                      }}
                      aria-label={`View enrolled students in ${dept.name}`}
                    >
                      View Enrolled Students <ChevronRight size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: COURSES & SYLLABI */}
          {activeTab === 'courses' && (
            <div>
              <div className="page-header">
                <div className="page-title-group">
                  <h2>Course Curriculum & Subject Catalog</h2>
                  <p>Comprehensive syllabi, credit weighting, faculty assignments, and enrolled student strengths</p>
                </div>
              </div>

              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Course Title</th>
                        <th>Department</th>
                        <th>Semester</th>
                        <th>Credits</th>
                        <th>Type</th>
                        <th>Assigned Faculty</th>
                        <th>Enrolled Strength</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courses.map(course => (
                        <tr key={course.id}>
                          <td>
                            <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>{course.code}</strong>
                          </td>
                          <td>
                            <strong>{course.name}</strong>
                          </td>
                          <td>{course.department_name} ({course.department_code})</td>
                          <td>Term {course.semester}</td>
                          <td>{course.credits} Credits</td>
                          <td>
                            <span className="badge-pill primary">
                              {course.type}
                            </span>
                          </td>
                          <td>{course.instructor}</td>
                          <td>
                            <span style={{ fontWeight: '600' }}>{course.enrolled_students || 0} students</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: DAILY ATTENDANCE */}
          {activeTab === 'attendance' && (
            <div>
              <div className="page-header">
                <div className="page-title-group">
                  <h2>Attendance Manager & Lecture Turnout</h2>
                  <p>Select subject and date to mark daily attendance, bulk update, and review shortage alerts</p>
                </div>
              </div>

              <AttendanceSheet 
                courses={courses} 
                userRole={currentRole}
                onAttendanceSaved={fetchAllData} 
              />
            </div>
          )}

          {/* TAB 6: EXAMINATIONS & GRADES */}
          {activeTab === 'grades' && (
            <div>
              <div className="page-header">
                <div className="page-title-group">
                  <h2>Examinations, Grades & Academic Transcripts</h2>
                  <p>Continuous internal assessments, semester exams, automatic SGPA / CGPA computation, and print-ready transcripts</p>
                </div>
                {currentRole !== 'student' && (
                  <button 
                    type="button"
                    className="btn btn-primary btn-sm" 
                    onClick={() => setIsAddGradeOpen(true)}
                    aria-label="Record a new examination grade"
                  >
                    <Plus size={15} /> Record Student Grade
                  </button>
                )}
              </div>

              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Roll Number</th>
                        <th>Candidate Name</th>
                        <th>Department</th>
                        <th>Evaluation Stage</th>
                        <th>Cumulative GPA</th>
                        <th>Standing</th>
                        <th>Official Transcript</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(currentRole === 'student' ? [loggedInStudent].filter(Boolean) : students).map(student => (
                        <tr key={student.id}>
                          <td>
                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--primary)' }}>
                              {student.roll_number}
                            </span>
                          </td>
                          <td>
                            <strong>{student.first_name} {student.last_name}</strong>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{student.department_code} • Term {student.semester}</div>
                          </td>
                          <td>{student.department_name}</td>
                          <td>Continuous Evaluation</td>
                          <td>
                            <strong style={{ color: 'var(--primary)' }}>{student.gpa} / 10</strong>
                          </td>
                          <td>
                            <span className="badge-pill success">PASS</span>
                          </td>
                          <td>
                            <button 
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={() => setReportCardData({ studentId: student.id, semester: student.semester })}
                              aria-label={`View transcript for ${student.first_name} ${student.last_name}`}
                            >
                              <Award size={13} /> View Marksheet
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: FEES & INVOICES */}
          {activeTab === 'fees' && (
            <div>
              <div className="page-header">
                <div className="page-title-group">
                  <h2>{currentRole === 'student' ? 'My Fee Dues & Tuition Receipts' : 'Fee Management & Student Billing Ledger'}</h2>
                  <p>
                    {currentRole === 'student' 
                      ? 'Official semester fee assessment, installment payments, and verified bursar vouchers' 
                      : 'Tuition records, installment collections, overdue tracking, and university payment vouchers'}
                  </p>
                </div>
              </div>

              {/* Fee Financial Summary Cards */}
              <div className="stat-grid" style={{ marginBottom: '22px' }}>
                <div className="stat-card primary">
                  <div className="stat-info">
                    <div className="label">{currentRole === 'student' ? 'Assessed Tuition' : 'Total Fee Assessed'}</div>
                    <div className="value">
                      ₹{currentRole === 'student'
                        ? Number(studentTotalFee).toLocaleString()
                        : Number(stats?.feeOverview.total || 0).toLocaleString()}
                    </div>
                    <div className="subtext">{currentRole === 'student' ? 'Enrolled Academic Year' : 'Academic Year 2026-2027'}</div>
                  </div>
                  <div className="stat-icon primary">
                    <CreditCard size={22} />
                  </div>
                </div>

                <div className="stat-card success">
                  <div className="stat-info">
                    <div className="label">{currentRole === 'student' ? 'Tuition Paid' : 'Total Collected'}</div>
                    <div className="value">
                      ₹{currentRole === 'student'
                        ? Number(studentPaidFee).toLocaleString()
                        : Number(stats?.feeOverview.paid || 0).toLocaleString()}
                    </div>
                    <div className="subtext">{currentRole === 'student' ? 'Cleared installments' : 'Realized institutional revenue'}</div>
                  </div>
                  <div className="stat-icon success">
                    <CheckCircle2 size={22} />
                  </div>
                </div>

                <div className="stat-card danger">
                  <div className="stat-info">
                    <div className="label">{currentRole === 'student' ? 'Balance Outstanding' : 'Outstanding Dues'}</div>
                    <div className="value" style={{ color: 'var(--danger)' }}>
                      ₹{currentRole === 'student'
                        ? Number(studentDueFee).toLocaleString()
                        : Number(stats?.feeOverview.pending || 0).toLocaleString()}
                    </div>
                    <div className="subtext">
                      {currentRole === 'student' 
                        ? (studentDueFee === 0 ? 'All fees settled' : 'Payment due before exams')
                        : 'Pending student clearance'}
                    </div>
                  </div>
                  <div className="stat-icon warning">
                    <AlertCircle size={22} />
                  </div>
                </div>
              </div>

              {/* Fees Table */}
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Candidate</th>
                        <th>Enrollment Roll</th>
                        <th>Particulars</th>
                        <th>Term</th>
                        <th>Total Assessed</th>
                        <th>Paid Amount</th>
                        <th>Balance Due</th>
                        <th>Due Date</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(currentRole === 'student' ? fees.filter(f => f.student_id === loggedInStudent?.id || f.roll_number === loggedInStudent?.roll_number) : fees).map(fee => {
                        const balance = fee.total_amount - fee.paid_amount;
                        return (
                          <tr key={fee.id}>
                            <td>
                              <strong>{fee.first_name} {fee.last_name}</strong>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{fee.department_code}</div>
                            </td>
                            <td>
                              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--primary)' }}>
                                {fee.roll_number}
                              </span>
                            </td>
                            <td>{fee.fee_type}</td>
                            <td>Term {fee.semester}</td>
                            <td>₹{Number(fee.total_amount).toLocaleString()}</td>
                            <td style={{ color: 'var(--success)', fontWeight: '700' }}>
                              ₹{Number(fee.paid_amount).toLocaleString()}
                            </td>
                            <td style={{ color: balance > 0 ? 'var(--danger)' : 'var(--text-dim)', fontWeight: '700' }}>
                              ₹{Number(balance).toLocaleString()}
                            </td>
                            <td>{fee.due_date}</td>
                            <td>
                              <span className={`badge-pill ${
                                fee.status === 'Paid' ? 'success' : (fee.status === 'Partial' ? 'warning' : 'danger')
                              }`}>
                                {fee.status}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              {balance > 0 ? (
                                <button 
                                  type="button"
                                  className="btn btn-success btn-sm"
                                  onClick={() => setPayingFee(fee)}
                                  aria-label={`Collect fee for ${fee.first_name} ${fee.last_name}`}
                                >
                                  Collect Fee
                                </button>
                              ) : (
                                <span className="badge-pill success">Cleared</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: NOTICES & BULLETINS */}
          {activeTab === 'notices' && (
            <div>
              <div className="page-header">
                <div className="page-title-group">
                  <h2>Official University Bulletins & Notices</h2>
                  <p>Broadcasting academic schedules, examination timetables, holiday updates, and campus events</p>
                </div>
                {currentRole !== 'student' && (
                  <button 
                    type="button"
                    className="btn btn-primary btn-sm" 
                    onClick={() => setIsNewNoticeOpen(true)}
                    aria-label="Publish a new campus notice"
                  >
                    <Plus size={15} /> Publish New Notice
                  </button>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '18px' }}>
                {notices.map(notice => (
                  <div key={notice.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span className={`badge-pill ${notice.priority === 'High' ? 'danger' : 'primary'}`}>
                        {notice.category}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{notice.date}</span>
                    </div>

                    <h3 style={{ fontSize: '1.1rem', marginBottom: '6px' }}>{notice.title}</h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.45, flex: 1, marginBottom: '14px' }}>
                      {notice.content}
                    </p>

                    <div style={{
                      paddingTop: '10px',
                      borderTop: '1px solid var(--border-subtle)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.72rem',
                      color: 'var(--text-dim)'
                    }}>
                      <span>Issued by: <strong>{notice.posted_by}</strong></span>
                      <span>Target: <strong>{notice.target_role}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ALL MODAL DIALOGS */}
      {selectedStudentId && (
        <StudentDetailModal 
          studentId={selectedStudentId}
          userRole={currentRole}
          onClose={() => setSelectedStudentId(null)}
          onOpenIdCard={(student) => setIdCardStudent(student)}
          onOpenReportCard={(studentId, semester) => setReportCardData({ studentId, semester })}
          onOpenReceipt={(rcpNo) => setReceiptNumber(rcpNo)}
          onDeleted={() => {
            fetchAllData();
            setSelectedStudentId(null);
          }}
        />
      )}

      {idCardStudent && (
        <StudentIdCard 
          student={idCardStudent}
          onClose={() => setIdCardStudent(null)}
        />
      )}

      {reportCardData && (
        <ReportCardModal 
          studentId={reportCardData.studentId}
          semester={reportCardData.semester}
          onClose={() => setReportCardData(null)}
        />
      )}

      {receiptNumber && (
        <FeeReceiptModal 
          receiptNo={receiptNumber}
          onClose={() => setReceiptNumber(null)}
        />
      )}

      {isAddStudentOpen && (
        <AddStudentModal 
          departments={departments}
          onClose={() => setIsAddStudentOpen(false)}
          onCreated={() => {
            fetchAllData();
            setActiveTab('students');
          }}
        />
      )}

      {payingFee && (
        <RecordPaymentModal 
          fee={payingFee}
          onClose={() => setPayingFee(null)}
          onPaid={(receiptNo) => {
            fetchAllData();
            setReceiptNumber(receiptNo);
          }}
        />
      )}

      {isAddGradeOpen && (
        <AddGradeModal 
          students={students}
          courses={courses}
          onClose={() => setIsAddGradeOpen(false)}
          onAdded={fetchAllData}
        />
      )}

      {/* New Notice Modal */}
      {isNewNoticeOpen && (
        <div 
          className="modal-overlay" 
          role="dialog"
          aria-modal="true"
          aria-label="Publish Campus Announcement Dialog"
        >
          <button 
            type="button" 
            className="modal-backdrop-dismiss" 
            onClick={() => setIsNewNoticeOpen(false)} 
            aria-label="Dismiss campus announcement dialog" 
          />
          <div className="modal-content">
            <div className="modal-header">
              <h3>Publish Campus Announcement</h3>
              <button 
                type="button"
                className="btn-icon" 
                onClick={() => setIsNewNoticeOpen(false)}
                aria-label="Close campus announcement dialog"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handlePostNotice}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label htmlFor="notice-title">Notice Title *</label>
                  <input 
                    id="notice-title"
                    type="text" 
                    placeholder="e.g. Mid-Term Examination Schedule Release"
                    value={noticeForm.title}
                    onChange={e => setNoticeForm(p => ({ ...p, title: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="notice-category">Category</label>
                    <select 
                      id="notice-category"
                      value={noticeForm.category}
                      onChange={e => setNoticeForm(p => ({ ...p, category: e.target.value }))}
                    >
                      <option value="Academic">Academic</option>
                      <option value="Exam">Exam Schedule</option>
                      <option value="Sports">Sports & Clubs</option>
                      <option value="Event">Fest / Event</option>
                      <option value="General">General</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="notice-priority">Priority</label>
                    <select 
                      id="notice-priority"
                      value={noticeForm.priority}
                      onChange={e => setNoticeForm(p => ({ ...p, priority: e.target.value }))}
                    >
                      <option value="Normal">Normal</option>
                      <option value="High">High / Urgent</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="notice-content">Announcement Content *</label>
                  <textarea 
                    id="notice-content"
                    rows="3"
                    placeholder="Enter detailed notice message..."
                    value={noticeForm.content}
                    onChange={e => setNoticeForm(p => ({ ...p, content: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setIsNewNoticeOpen(false)}
                  aria-label="Cancel announcement"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  aria-label="Publish announcement notice"
                >
                  Publish Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
