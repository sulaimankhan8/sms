import React, { useEffect, useState } from 'react';
import { X, Printer, Award, CheckCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function ReportCardModal({ studentId, semester, onClose }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    fetchReport();
  }, [studentId, semester]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const semParam = semester ? `?semester=${semester}` : '';
      const res = await fetch(`/api/students/${studentId}/report-card${semParam}`);
      const json = await res.json();
      if (json.success) {
        setReport(json.data);
        if (json.data.summary.sgpa >= 8.5) {
          confetti({
            particleCount: 70,
            spread: 60,
            origin: { y: 0.6 }
          });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!report && loading) {
    return (
      <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Generating Grade Sheet">
        <div className="modal-content" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-main)' }}>
          Compiling Official Semester Grade Sheet...
        </div>
      </div>
    );
  }

  if (!report) return null;

  const { student, grades, summary, institution } = report;

  return (
    <div 
      className="modal-overlay" 
      role="dialog"
      aria-modal="true"
      aria-label={`Official Grade Report for ${student.first_name} ${student.last_name}`}
    >
      <button 
        type="button" 
        className="modal-backdrop-dismiss" 
        onClick={onClose} 
        aria-label="Dismiss grade report dialog" 
      />
      <div 
        className="modal-content wide" 
        style={{
          background: '#ffffff',
          color: '#0f172a',
          border: '1px solid #cbd5e1',
          maxWidth: '850px'
        }}
      >
        <div className="no-print" style={{ 
          padding: '12px 22px', 
          borderBottom: '1px solid #e2e8f0', 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#f8fafc'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={18} color="#1d4ed8" />
            <strong style={{ color: '#0f172a' }}>Official Academic Transcript Preview</strong>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              type="button"
              className="btn btn-primary btn-sm" 
              onClick={handlePrint}
              aria-label="Print official marksheet"
            >
              <Printer size={14} /> Print Marksheet / Save PDF
            </button>
            <button 
              type="button"
              className="btn-icon" 
              onClick={onClose}
              aria-label="Close grade report dialog"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Printable Marksheet Sheet */}
        <div id="printable-marksheet" style={{ padding: '32px 36px', position: 'relative' }}>
          
          {/* Institutional Header */}
          <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '16px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '14px', marginBottom: '6px' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-full)',
                background: '#1d4ed8',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.3rem',
                fontWeight: '800'
              }}>
                🎓
              </div>
              <div>
                <h1 style={{ fontSize: '1.45rem', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '0.03em' }}>
                  {institution.name.toUpperCase()}
                </h1>
                <p style={{ fontSize: '0.76rem', color: '#475569', fontWeight: '600', margin: 0 }}>
                  {institution.subHeading} • {institution.affiliatedTo}
                </p>
              </div>
            </div>
            
            <div style={{
              display: 'inline-block',
              background: '#0f172a',
              color: '#fff',
              fontSize: '0.76rem',
              fontWeight: '700',
              padding: '3px 14px',
              borderRadius: 'var(--radius-sm)',
              marginTop: '6px',
              letterSpacing: '0.04em'
            }}>
              SEMESTER GRADE REPORT • {institution.session}
            </div>
          </div>

          {/* Student Meta Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '10px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            fontSize: '0.8rem',
            marginBottom: '20px'
          }}>
            <div>
              <span style={{ color: '#64748b', fontSize: '0.7rem', display: 'block' }}>CANDIDATE NAME</span>
              <strong>{student.first_name} {student.last_name}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', fontSize: '0.7rem', display: 'block' }}>ENROLLMENT / ROLL NO</span>
              <strong style={{ fontFamily: 'var(--font-mono)', color: '#1d4ed8' }}>{student.roll_number}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', fontSize: '0.7rem', display: 'block' }}>PROGRAM & BRANCH</span>
              <strong>{student.program} ({student.department_code})</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', fontSize: '0.7rem', display: 'block' }}>EVALUATION SEMESTER</span>
              <strong>Semester {student.semester}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', fontSize: '0.7rem', display: 'block' }}>ACADEMIC BATCH</span>
              <strong>{student.batch}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', fontSize: '0.7rem', display: 'block' }}>ENROLLMENT STATUS</span>
              <span style={{ color: '#059669', fontWeight: '700' }}>{student.status.toUpperCase()}</span>
            </div>
          </div>

          {/* Marks Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem', marginBottom: '20px' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', borderTop: '1px solid #cbd5e1', borderBottom: '2px solid #cbd5e1' }}>
                <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: '700', color: '#0f172a' }}>Code</th>
                <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: '700', color: '#0f172a' }}>Curriculum Title</th>
                <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: '700', color: '#0f172a' }}>Type</th>
                <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: '700', color: '#0f172a' }}>Credits</th>
                <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: '700', color: '#0f172a' }}>Marks</th>
                <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: '700', color: '#0f172a' }}>Grade</th>
                <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: '700', color: '#0f172a' }}>Points</th>
                <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: '700', color: '#0f172a' }}>Quality Pts</th>
              </tr>
            </thead>
            <tbody>
              {grades && grades.length > 0 ? (
                grades.map((g, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #e2e8f0', background: i % 2 === 0 ? '#fff' : '#fcfcfd' }}>
                    <td style={{ padding: '8px 10px', fontWeight: '600', color: '#334155', fontFamily: 'var(--font-mono)' }}>{g.course_code}</td>
                    <td style={{ padding: '8px 10px', fontWeight: '600' }}>{g.course_name}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center', color: '#64748b' }}>{g.type || 'Core'}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>{g.credits}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: '600' }}>{g.marks_obtained}/{g.max_marks}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '1px 6px',
                        borderRadius: '3px',
                        fontWeight: '700',
                        fontSize: '0.75rem',
                        background: g.grade_letter.startsWith('A') ? '#dcfce7' : '#f1f5f9',
                        color: g.grade_letter.startsWith('A') ? '#15803d' : '#334155'
                      }}>
                        {g.grade_letter}
                      </span>
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>{g.grade_points}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: '700' }}>
                      {(g.credits * g.grade_points).toFixed(1)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                    No recorded exam grades found for this semester.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Academic Performance Summary */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: '14px',
            marginBottom: '28px'
          }}>
            <div style={{
              border: '1px solid #e2e8f0',
              borderRadius: 'var(--radius-sm)',
              padding: '12px',
              fontSize: '0.78rem',
              color: '#475569',
              lineHeight: 1.5
            }}>
              <strong>Evaluation Standard:</strong> A+ (10 pts, &ge;90%), A (9 pts, 80-89%), B+ (8 pts, 70-79%), B (7 pts, 60-69%), C (6 pts, 50-59%), D (4 pts, 40-49%), F (0 pts, Fail).
              <div style={{ marginTop: '5px', color: '#0f172a' }}>
                Classification: <strong>{summary.classification}</strong>
              </div>
            </div>

            <div style={{
              background: '#f8fafc',
              border: '2px solid #1d4ed8',
              borderRadius: 'var(--radius-md)',
              padding: '12px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#64748b' }}>SEMESTER GPA (SGPA)</div>
              <div style={{ fontSize: '1.85rem', fontWeight: '900', color: '#1d4ed8', margin: '2px 0' }}>
                {summary.sgpa}
              </div>
              <div style={{ fontSize: '0.74rem', fontWeight: '600', color: '#0f172a' }}>
                Cumulative CGPA: <strong style={{ color: '#059669' }}>{summary.cgpa}</strong>
              </div>
            </div>
          </div>

          {/* Official Signatures & Seal */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            paddingTop: '24px',
            borderTop: '1px dashed #cbd5e1'
          }}>
            <div style={{ textAlign: 'center', width: '180px' }}>
              <div style={{ fontFamily: 'cursive', fontSize: '1.2rem', color: '#334155', minHeight: '28px' }}>
                R. K. Sharma
              </div>
              <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '4px', fontSize: '0.7rem', fontWeight: '700', color: '#475569' }}>
                CONTROLLER OF EXAMS
              </div>
            </div>

            {/* University Seal Stamp */}
            <div style={{
              width: '74px',
              height: '74px',
              borderRadius: 'var(--radius-full)',
              border: '2px dashed #1d4ed8',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#1d4ed8',
              fontSize: '0.52rem',
              fontWeight: '800',
              textAlign: 'center',
              transform: 'rotate(-8deg)',
              padding: '4px'
            }}>
              ★ APEX TECH ★<br />OFFICIAL SEAL<br />ACCREDITED
            </div>

            <div style={{ textAlign: 'center', width: '180px' }}>
              <div style={{ fontFamily: 'cursive', fontSize: '1.2rem', color: '#334155', minHeight: '28px' }}>
                Dr. Aris Thorne
              </div>
              <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '4px', fontSize: '0.7rem', fontWeight: '700', color: '#475569' }}>
                DEAN OF ACADEMICS
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.62rem', color: '#94a3b8' }}>
            System-generated authentic grade sheet. Issued on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.
          </div>
        </div>
      </div>
    </div>
  );
}
