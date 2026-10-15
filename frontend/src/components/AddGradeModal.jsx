import React, { useState, useEffect } from 'react';
import { X, Award } from 'lucide-react';
import { authFetch } from '../utils/api';

export default function AddGradeModal({ students, courses, onClose, onAdded }) {
  const [studentId, setStudentId] = useState(students[0]?.id || '');
  const [courseId, setCourseId] = useState(courses[0]?.id || '');
  const [examType, setExamType] = useState('Midterm Exam');
  const [semester, setSemester] = useState(3);
  const [marks, setMarks] = useState(85);
  const [maxMarks, setMaxMarks] = useState(100);
  const [remarks, setRemarks] = useState('Satisfactory conceptual understanding');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Live calculation preview
  const percentage = maxMarks > 0 ? (marks / maxMarks) * 100 : 0;
  let letter = 'F';
  let points = 0;
  if (percentage >= 90) { letter = 'A+'; points = 10; }
  else if (percentage >= 80) { letter = 'A'; points = 9; }
  else if (percentage >= 70) { letter = 'B+'; points = 8; }
  else if (percentage >= 60) { letter = 'B'; points = 7; }
  else if (percentage >= 50) { letter = 'C'; points = 6; }
  else if (percentage >= 40) { letter = 'D'; points = 4; }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!studentId || !courseId) {
      setError('Please select both a student and a course.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await authFetch('/api/grades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: Number(studentId),
          course_id: Number(courseId),
          exam_type: examType,
          semester: Number(semester),
          marks_obtained: Number(marks),
          max_marks: Number(maxMarks),
          remarks
        })
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to record grade');
      }
      onAdded();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="modal-overlay" 
      role="dialog"
      aria-modal="true"
      aria-label="Record Examination Grade Dialog"
    >
      <button 
        type="button" 
        className="modal-backdrop-dismiss" 
        onClick={onClose} 
        aria-label="Dismiss grade dialog" 
      />
      <div className="modal-content">
        <div className="modal-header">
          <div>
            <h3>Record Examination Grade</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              Enter marks with automatic letter grade & GPA point mapping
            </p>
          </div>
          <button 
            type="button"
            className="btn-icon" 
            onClick={onClose}
            aria-label="Close grade entry dialog"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {error && (
              <div style={{
                background: 'var(--danger-light)',
                border: '1px solid var(--danger)',
                color: 'var(--danger)',
                padding: '10px',
                borderRadius: '8px',
                fontSize: '0.85rem'
              }}>
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="grade-student-select">Select Student *</label>
              <select 
                id="grade-student-select"
                value={studentId} 
                onChange={e => setStudentId(e.target.value)}
              >
                {students.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.roll_number} — {s.first_name} {s.last_name} ({s.department_code || 'CSE'})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="grade-course-select">Select Course / Subject *</label>
              <select 
                id="grade-course-select"
                value={courseId} 
                onChange={e => setCourseId(e.target.value)}
              >
                {courses.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.name} ({c.credits} Credits)
                  </option>
                ))}
              </select>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="grade-exam-type">Examination Term</label>
                <select 
                  id="grade-exam-type"
                  value={examType} 
                  onChange={e => setExamType(e.target.value)}
                >
                  <option value="Midterm Exam">Midterm Exam</option>
                  <option value="Internal Assessment">Internal Assessment</option>
                  <option value="Final Semester Exam">Final Semester Exam</option>
                  <option value="Laboratory / Practical">Laboratory / Practical</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="grade-semester">Semester</label>
                <select 
                  id="grade-semester"
                  value={semester} 
                  onChange={e => setSemester(e.target.value)}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="grade-marks">Marks Obtained</label>
                <input 
                  id="grade-marks"
                  type="number"
                  min="0"
                  max={maxMarks}
                  value={marks}
                  onChange={e => setMarks(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="grade-max-marks">Maximum Marks</label>
                <input 
                  id="grade-max-marks"
                  type="number"
                  min="10"
                  max="500"
                  value={maxMarks}
                  onChange={e => setMaxMarks(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Auto Grade Calculation Preview */}
            <div style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-active)',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Computed Performance:</span>
                <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)' }}>
                  {percentage.toFixed(1)}% Score
                </div>
              </div>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', display: 'block' }}>GRADE</span>
                  <span className={`badge-pill ${letter.startsWith('A') ? 'success' : 'primary'}`} style={{ fontSize: '0.82rem' }}>
                    {letter}
                  </span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', display: 'block' }}>POINTS</span>
                  <strong style={{ fontSize: '1.05rem', color: 'var(--primary)' }}>{points} / 10</strong>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="grade-remarks">Faculty Remarks</label>
              <input 
                id="grade-remarks"
                type="text" 
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose} 
              disabled={loading}
              aria-label="Cancel grade entry"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading}
              aria-label="Save Examination Grade Entry"
            >
              {loading ? 'Submitting...' : 'Save Grade Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
