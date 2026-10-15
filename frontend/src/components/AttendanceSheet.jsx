import React, { useState, useEffect } from 'react';
import { Check, X, Clock, HelpCircle, Save, CheckCheck } from 'lucide-react';
import { authFetch } from '../utils/api';

export default function AttendanceSheet({ courses, userRole = 'faculty', onAttendanceSaved }) {
  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.id || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (selectedCourseId && date) {
      fetchClassRoster();
    }
  }, [selectedCourseId, date]);

  const fetchClassRoster = async () => {
    try {
      setLoading(true);
      setMessage('');
      const res = await fetch(`/api/attendance?course_id=${selectedCourseId}&date=${date}`);
      const json = await res.json();
      if (json.success) {
        setRoster(json.data.map(item => ({
          student_id: item.student_id,
          roll_number: item.roll_number,
          first_name: item.first_name,
          last_name: item.last_name,
          avatar_url: item.avatar_url,
          status: item.status || 'Present',
          remarks: item.remarks || ''
        })));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId, status) => {
    setRoster(prev => prev.map(s => s.student_id === studentId ? { ...s, status } : s));
  };

  const handleRemarksChange = (studentId, remarks) => {
    setRoster(prev => prev.map(s => s.student_id === studentId ? { ...s, remarks } : s));
  };

  const handleMarkAll = (status) => {
    setRoster(prev => prev.map(s => ({ ...s, status })));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage('');
      const res = await authFetch('/api/attendance/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: Number(selectedCourseId),
          date,
          records: roster
        })
      });
      const json = await res.json();
      if (json.success) {
        setMessage('Attendance successfully logged and synced with database!');
        if (onAttendanceSaved) onAttendanceSaved();
      }
    } catch (err) {
      setMessage('Failed to save attendance: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const total = roster.length;
  const present = roster.filter(r => r.status === 'Present').length;
  const late = roster.filter(r => r.status === 'Late').length;
  const absent = roster.filter(r => r.status === 'Absent').length;
  const rate = total > 0 ? Math.round(((present + late * 0.5) / total) * 100) : 0;

  return (
    <div className="card" style={{ padding: '22px' }}>
      {/* Top Filter Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px',
        marginBottom: '18px'
      }}>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <label htmlFor="attendance-course-select" style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: '600' }}>
              Select Course / Lecture
            </label>
            <select 
              id="attendance-course-select"
              value={selectedCourseId} 
              onChange={e => setSelectedCourseId(e.target.value)}
              style={{
                padding: '7px 12px',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-main)',
                minWidth: '280px'
              }}
            >
              {courses.map(c => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.name} (Sem {c.semester})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="attendance-date-input" style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: '600' }}>
              Attendance Date
            </label>
            <input 
              id="attendance-date-input"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              style={{
                padding: '7px 12px',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-main)'
              }}
            />
          </div>
        </div>

        {/* Action Shortcuts */}
        {userRole !== 'student' ? (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleMarkAll('Present')}
              aria-label="Mark all students present"
            >
              <CheckCheck size={14} /> Mark All Present
            </button>
            <button 
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleSave}
              disabled={saving || roster.length === 0}
              aria-label="Save class attendance roster"
            >
              <Save size={14} /> {saving ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span className="badge-pill info" style={{ fontSize: '0.8rem' }}>
              Candidate Read-Only Attendance View
            </span>
          </div>
        )}
      </div>

      {message && (
        <div style={{
          background: message.includes('Failed') ? 'var(--danger-light)' : 'var(--success-light)',
          color: message.includes('Failed') ? 'var(--danger)' : 'var(--success)',
          padding: '10px 14px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '16px',
          fontSize: '0.84rem',
          fontWeight: '600'
        }}>
          {message}
        </div>
      )}

      {/* Real-time stats bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '10px',
        background: 'var(--bg-subtle)',
        padding: '12px',
        borderRadius: 'var(--radius-md)',
        marginBottom: '18px',
        textAlign: 'center'
      }}>
        <div>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', display: 'block' }}>ENROLLED</span>
          <strong style={{ fontSize: '1.15rem' }}>{total}</strong>
        </div>
        <div>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', display: 'block' }}>PRESENT</span>
          <strong style={{ fontSize: '1.15rem', color: 'var(--success)' }}>{present}</strong>
        </div>
        <div>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', display: 'block' }}>LATE</span>
          <strong style={{ fontSize: '1.15rem', color: 'var(--warning)' }}>{late}</strong>
        </div>
        <div>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', display: 'block' }}>ABSENT</span>
          <strong style={{ fontSize: '1.15rem', color: 'var(--danger)' }}>{absent}</strong>
        </div>
        <div>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', display: 'block' }}>TURNOUT RATE</span>
          <strong style={{ fontSize: '1.15rem', color: 'var(--primary)' }}>{rate}%</strong>
        </div>
      </div>

      {/* Roster Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
          Loading class roster...
        </div>
      ) : roster.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          No active students found in this course department/semester.
        </div>
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student Candidate</th>
                <th>Roll Number</th>
                <th>Presence Status Toggle</th>
                <th>Remarks / Notes</th>
              </tr>
            </thead>
            <tbody>
              {roster.map(student => (
                <tr key={student.student_id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img 
                        src={student.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&crop=faces'} 
                        alt=""
                        style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
                      />
                      <strong>{student.first_name} {student.last_name}</strong>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '600', color: 'var(--primary)' }}>
                      {student.roll_number}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {[
                        { label: 'Present', val: 'Present', color: 'var(--success)' },
                        { label: 'Late', val: 'Late', color: 'var(--warning)' },
                        { label: 'Absent', val: 'Absent', color: 'var(--danger)' },
                        { label: 'Excused', val: 'Excused', color: 'var(--info)' }
                      ].map(s => {
                        const isSelected = student.status === s.val;
                        return (
                          <button
                            key={s.val}
                            type="button"
                            onClick={() => userRole !== 'student' && handleStatusChange(student.student_id, s.val)}
                            disabled={userRole === 'student'}
                            aria-label={`${userRole === 'student' ? 'Status' : 'Mark'} ${student.first_name} ${student.last_name} ${s.label}`}
                            style={{
                              padding: '4px 10px',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.76rem',
                              fontWeight: '700',
                              cursor: userRole === 'student' ? 'default' : 'pointer',
                              opacity: userRole === 'student' && !isSelected ? 0.35 : 1,
                              border: isSelected ? `2px solid ${s.color}` : '1px solid var(--border-subtle)',
                              background: isSelected ? s.color : 'transparent',
                              color: isSelected ? '#fff' : 'var(--text-muted)',
                              transition: 'var(--transition)'
                            }}
                          >
                            {s.label}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                  <td>
                    <input 
                      type="text"
                      placeholder={userRole === 'student' ? 'No remarks' : 'e.g. excused with certificate'}
                      value={student.remarks || ''}
                      onChange={e => handleRemarksChange(student.student_id, e.target.value)}
                      disabled={userRole === 'student'}
                      aria-label={`Remarks for ${student.first_name} ${student.last_name}`}
                      style={{
                        padding: '6px 10px',
                        background: 'var(--bg-subtle)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-main)',
                        fontSize: '0.8rem',
                        width: '100%',
                        maxWidth: '220px',
                        opacity: userRole === 'student' ? 0.7 : 1
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
