import React, { useEffect, useState } from 'react';
import { 
  X, User, BookOpen, CalendarCheck, CreditCard, Award, 
  Phone, Mail, MapPin, Shield, Printer, CheckCircle2, AlertTriangle, ShieldCheck,
  Trash2
} from 'lucide-react';
import { authFetch } from '../utils/api';

export default function StudentDetailModal({ 
  studentId, 
  userRole = 'admin',
  onClose, 
  onOpenIdCard, 
  onOpenReportCard,
  onOpenReceipt,
  onDeleted
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    fetchStudent();
  }, [studentId]);

  const fetchStudent = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/students/${studentId}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to permanently delete candidate ${data.first_name} ${data.last_name} (${data.roll_number})? This action cannot be undone.`)) return;
    try {
      const res = await authFetch(`/api/students/${data.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to delete student');
      alert('Candidate record permanently deleted.');
      if (onDeleted) onDeleted(data.id);
      onClose();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Loading Student Record">
        <div className="modal-content" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-main)' }}>
          Retrieving Academic Record Dossier...
        </div>
      </div>
    );
  }

  if (!data) return null;

  const isEligibleForExams = data.attendance_rate >= 75;

  return (
    <div 
      className="modal-overlay" 
      role="dialog"
      aria-modal="true"
      aria-label={`Student Dossier for ${data.first_name} ${data.last_name}`}
    >
      <button 
        type="button" 
        className="modal-backdrop-dismiss" 
        onClick={onClose} 
        aria-label="Dismiss student dossier dialog" 
      />
      <div 
        className="modal-content wide" 
        style={{ maxHeight: '92vh' }}
      >
        {/* Modal Top Banner */}
        <div style={{
          padding: '20px 24px',
          background: 'var(--bg-surface-elevated)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <img 
              src={data.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&crop=faces'} 
              alt={`Avatar of ${data.first_name} ${data.last_name}`}
              style={{
                width: '70px',
                height: '70px',
                borderRadius: 'var(--radius-md)',
                objectFit: 'cover',
                border: '2px solid var(--primary)'
              }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: '800' }}>
                  {data.first_name} {data.last_name}
                </h2>
                <span className={`badge-pill ${data.status === 'Active' ? 'success' : 'warning'}`}>
                  {data.status}
                </span>
              </div>
              <p style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)', fontWeight: '700', fontSize: '0.88rem', marginTop: '2px' }}>
                {data.roll_number} • {data.program} in {data.department_name} ({data.department_code})
              </p>
              <div style={{ display: 'flex', gap: '16px', marginTop: '4px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <span>Semester {data.semester}</span>
                <span>Batch {data.batch}</span>
                <span>Blood: <strong style={{ color: 'var(--danger)' }}>{data.blood_group}</strong></span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button 
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => onOpenIdCard(data)}
              aria-label="View Student Digital ID Badge"
            >
              <Shield size={14} /> ID Badge
            </button>
            <button 
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => onOpenReportCard(data.id, data.semester)}
              aria-label="View Official Academic Marksheet"
            >
              <Award size={14} /> Marksheet
            </button>
            {userRole === 'admin' && (
              <button 
                type="button"
                className="btn btn-sm"
                style={{ 
                  background: 'rgba(239, 68, 68, 0.15)', 
                  color: 'var(--danger)', 
                  border: '1px solid var(--danger)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onClick={handleDelete}
                aria-label="Permanently delete candidate record"
              >
                <Trash2 size={14} /> Delete
              </button>
            )}
            <button 
              type="button"
              className="btn-icon" 
              onClick={onClose}
              aria-label="Close student dossier dialog"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* SIGNATURE ELEMENT: University Registrar Compliance Banner */}
        <div style={{
          background: isEligibleForExams ? 'var(--success-light)' : 'var(--danger-light)',
          borderBottom: `1px solid ${isEligibleForExams ? 'var(--success-border)' : 'var(--danger-border)'}`,
          padding: '10px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.82rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isEligibleForExams ? 'var(--success)' : 'var(--danger)', fontWeight: '600' }}>
            {isEligibleForExams ? <ShieldCheck size={18} /> : <AlertTriangle size={18} />}
            <span>
              {isEligibleForExams 
                ? `Academic Regulation 14.2 Compliance: ${data.attendance_rate}% Attendance (Eligible for Hall Ticket & End-Term Exams)`
                : `Shortage Notice: ${data.attendance_rate}% Attendance is below the mandatory 75% minimum threshold.`}
            </span>
          </div>
          <span style={{ fontWeight: '700', color: isEligibleForExams ? 'var(--success)' : 'var(--danger)' }}>
            {isEligibleForExams ? 'CLEARED' : 'ACTION REQUIRED'}
          </span>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '0 24px',
          background: 'var(--bg-subtle)',
          gap: '20px'
        }}>
          {[
            { id: 'overview', label: 'Academic Profile', icon: User },
            { id: 'courses', label: `Courses (${data.courses?.length || 0})`, icon: BookOpen },
            { id: 'attendance', label: `Turnout (${data.attendance_rate}%)`, icon: CalendarCheck },
            { id: 'grades', label: `Transcript (${data.gpa})`, icon: Award },
            { id: 'fees', label: 'Financial Ledger', icon: CreditCard }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                aria-label={`Switch to ${tab.label} tab`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 2px',
                  background: 'none',
                  border: 'none',
                  borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent',
                  color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                  fontWeight: isActive ? '700' : '500',
                  cursor: 'pointer',
                  fontSize: '0.86rem',
                  transition: 'var(--transition)'
                }}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Modal Body Tabs */}
        <div className="modal-body" style={{ minHeight: '320px' }}>
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '14px'
              }}>
                <div className="card" style={{ padding: '14px' }}>
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: '700' }}>
                    Turnout Aggregate
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '800', marginTop: '3px', color: isEligibleForExams ? 'var(--success)' : 'var(--danger)' }}>
                    {data.attendance_rate}%
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {isEligibleForExams ? 'Compliant with regulations' : 'Examination debarment warning'}
                  </div>
                </div>

                <div className="card" style={{ padding: '14px' }}>
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: '700' }}>
                    Cumulative GPA (CGPA)
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '800', marginTop: '3px', color: 'var(--primary)' }}>
                    {data.gpa || '0.00'} / 10
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Official 10-Point Scale
                  </div>
                </div>

                <div className="card" style={{ padding: '14px' }}>
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: '700' }}>
                    Active Curriculum
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '800', marginTop: '3px', color: 'var(--text-main)' }}>
                    {data.courses?.length || 0} Subjects
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Assigned for Term {data.semester}
                  </div>
                </div>
              </div>

              {/* Bio & Contact Details */}
              <div className="card" style={{ padding: '18px' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '12px', color: 'var(--text-main)' }}>
                  Registrar Matriculation Details
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '12px',
                  fontSize: '0.84rem'
                }}>
                  <div>
                    <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.7rem' }}>INSTITUTIONAL EMAIL</span>
                    <strong>{data.email}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.7rem' }}>PRIMARY CONTACT</span>
                    <strong>{data.phone}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.7rem' }}>DATE OF BIRTH & GENDER</span>
                    <strong>{data.dob} ({data.gender})</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.7rem' }}>ADMISSION RECORD DATE</span>
                    <strong>{data.admission_date}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.7rem' }}>EMERGENCY GUARDIAN CONTACT</span>
                    <strong>{data.guardian_name} ({data.guardian_phone})</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.7rem' }}>RESIDENTIAL ADDRESS</span>
                    <strong>{data.address || 'Campus Hostel Block'}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: COURSES */}
          {activeTab === 'courses' && (
            <div>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Course Code</th>
                      <th>Curriculum Title</th>
                      <th>Format</th>
                      <th>Weight</th>
                      <th>Instructor In-Charge</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.courses && data.courses.length > 0 ? (
                      data.courses.map(c => (
                        <tr key={c.id}>
                          <td><strong style={{ fontFamily: 'var(--font-mono)' }}>{c.code}</strong></td>
                          <td>{c.name}</td>
                          <td>
                            <span className="badge-pill primary">{c.type}</span>
                          </td>
                          <td>{c.credits} Credits</td>
                          <td>{c.instructor}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                          No curriculum assigned for this semester.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: ATTENDANCE */}
          {activeTab === 'attendance' && (
            <div>
              <div style={{
                display: 'flex',
                gap: '12px',
                marginBottom: '14px',
                background: 'var(--bg-subtle)',
                padding: '10px 16px',
                borderRadius: 'var(--radius-md)',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Classes Conducted:</span>{' '}
                  <strong>{data.attendance_summary?.total_classes || 0}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Present:</span>{' '}
                  <strong style={{ color: 'var(--success)' }}>{data.attendance_summary?.present_count || 0}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Late:</span>{' '}
                  <strong style={{ color: 'var(--warning)' }}>{data.attendance_summary?.late_count || 0}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Absent:</span>{' '}
                  <strong style={{ color: 'var(--danger)' }}>{data.attendance_summary?.absent_count || 0}</strong>
                </div>
              </div>

              <div className="table-responsive" style={{ maxHeight: '260px', overflowY: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Lecture Date</th>
                      <th>Subject Code & Title</th>
                      <th>Presence Status</th>
                      <th>Instructor Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.attendance && data.attendance.length > 0 ? (
                      data.attendance.map(a => (
                        <tr key={a.id}>
                          <td>{a.date}</td>
                          <td><strong>{a.course_code}</strong> — {a.course_name}</td>
                          <td>
                            <span className={`badge-pill ${
                              a.status === 'Present' ? 'success' : (a.status === 'Late' ? 'warning' : 'danger')
                            }`}>
                              {a.status}
                            </span>
                          </td>
                          <td style={{ color: 'var(--text-dim)', fontSize: '0.78rem' }}>{a.remarks || '—'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>
                          No attendance entries recorded.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: GRADES */}
          {activeTab === 'grades' && (
            <div>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Assessment Term</th>
                      <th>Semester</th>
                      <th>Raw Score</th>
                      <th>Letter Grade</th>
                      <th>Points</th>
                      <th>Evaluation Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.grades && data.grades.length > 0 ? (
                      data.grades.map(g => (
                        <tr key={g.id}>
                          <td><strong>{g.course_code}</strong> — {g.course_name}</td>
                          <td>{g.exam_type}</td>
                          <td>Term {g.semester}</td>
                          <td><strong>{g.marks_obtained}</strong> / {g.max_marks}</td>
                          <td>
                            <span className={`badge-pill ${g.grade_letter.startsWith('A') ? 'success' : 'primary'}`}>
                              {g.grade_letter}
                            </span>
                          </td>
                          <td><strong>{g.grade_points}</strong></td>
                          <td style={{ color: 'var(--text-dim)', fontSize: '0.78rem' }}>{g.remarks || 'Standard'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>
                          No marks recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: FEES */}
          {activeTab === 'fees' && (
            <div>
              <h3 style={{ fontSize: '0.92rem', fontWeight: '700', marginBottom: '8px' }}>Tuition & Campus Amenity Invoices</h3>
              <div className="table-responsive" style={{ marginBottom: '18px' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Particulars</th>
                      <th>Semester</th>
                      <th>Total Assessed</th>
                      <th>Amount Paid</th>
                      <th>Balance Due</th>
                      <th>Due Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.fees && data.fees.length > 0 ? (
                      data.fees.map(f => {
                        const balance = f.total_amount - f.paid_amount;
                        return (
                          <tr key={f.id}>
                            <td><strong>{f.fee_type}</strong></td>
                            <td>Term {f.semester}</td>
                            <td>₹{Number(f.total_amount).toLocaleString()}</td>
                            <td style={{ color: 'var(--success)', fontWeight: '600' }}>₹{Number(f.paid_amount).toLocaleString()}</td>
                            <td style={{ color: balance > 0 ? 'var(--danger)' : 'var(--text-dim)', fontWeight: '700' }}>
                              ₹{Number(balance).toLocaleString()}
                            </td>
                            <td>{f.due_date}</td>
                            <td>
                              <span className={`badge-pill ${
                                f.status === 'Paid' ? 'success' : (f.status === 'Partial' ? 'warning' : 'danger')
                              }`}>
                                {f.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>No fee structures assigned.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <h3 style={{ fontSize: '0.92rem', fontWeight: '700', marginBottom: '8px' }}>Payment Vouchers</h3>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Voucher #</th>
                      <th>Payment Date</th>
                      <th>Amount Received</th>
                      <th>Payment Mode</th>
                      <th>Reference ID</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.payments && data.payments.length > 0 ? (
                      data.payments.map(p => (
                        <tr key={p.id}>
                          <td><strong style={{ fontFamily: 'var(--font-mono)' }}>{p.receipt_no}</strong></td>
                          <td>{p.payment_date}</td>
                          <td style={{ fontWeight: '700', color: 'var(--success)' }}>
                            ₹{Number(p.amount).toLocaleString()}
                          </td>
                          <td><span className="badge-pill primary">{p.payment_method}</span></td>
                          <td style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{p.transaction_ref}</td>
                          <td>
                            <button 
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => onOpenReceipt(p.receipt_no)}
                              aria-label={`Print fee receipt voucher ${p.receipt_no}`}
                            >
                              <Printer size={13} /> Voucher
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>No payment vouchers generated.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
