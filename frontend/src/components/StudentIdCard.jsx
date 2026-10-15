import React, { useState, useEffect } from 'react';
import { X, Printer, RotateCw } from 'lucide-react';

export default function StudentIdCard({ student, onClose }) {
  const [showBack, setShowBack] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!student) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div 
      className="modal-overlay" 
      role="dialog"
      aria-modal="true"
      aria-label="Student Identity Card Modal"
    >
      <button 
        type="button" 
        className="modal-backdrop-dismiss" 
        onClick={onClose} 
        aria-label="Dismiss identity card dialog" 
      />
      <div 
        className="modal-content" 
        style={{ maxWidth: '440px', background: 'transparent', border: 'none', boxShadow: 'none' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setShowBack(!showBack)}
              aria-label={`Flip badge to ${showBack ? 'Front' : 'Back'}`}
            >
              <RotateCw size={14} /> Flip to {showBack ? 'Front' : 'Back'}
            </button>
            <button 
              type="button"
              className="btn btn-primary btn-sm" 
              onClick={handlePrint}
              aria-label="Print Identity Card"
            >
              <Printer size={14} /> Print ID
            </button>
          </div>
          <button 
            type="button"
            className="btn-icon" 
            onClick={onClose}
            aria-label="Close identity card dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Physical Badge Container */}
        <div 
          id="printable-id-card"
          style={{
            width: '380px',
            margin: '0 auto',
            minHeight: '520px',
            borderRadius: '16px',
            background: showBack ? '#0b162c' : '#091326',
            border: '2px solid rgba(255, 255, 255, 0.18)',
            boxShadow: 'var(--shadow-lg)',
            color: '#fff',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Lanyard Slot */}
          <div style={{
            width: '40px',
            height: '8px',
            background: 'rgba(0,0,0,0.6)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '8px',
            margin: '12px auto 6px'
          }} />

          {!showBack ? (
            /* FRONT OF ID CARD */
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '14px 20px 20px', textAlign: 'center' }}>
              {/* College Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '8px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  background: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '800',
                  fontSize: '0.95rem'
                }}>
                  🎓
                </div>
                <div style={{ textAlign: 'left' }}>
                  <h4 style={{ fontSize: '0.84rem', fontWeight: '800', letterSpacing: '0.03em', color: '#fff', margin: 0 }}>
                    APEX INSTITUTE OF TECH
                  </h4>
                  <p style={{ fontSize: '0.62rem', color: '#94a3b8', margin: 0, letterSpacing: '0.05em' }}>
                    AUTONOMOUS • NAAC A++
                  </p>
                </div>
              </div>

              <div style={{ height: '1px', background: 'rgba(255,255,255,0.15)', margin: '4px 0 16px' }} />

              {/* Photo with frame */}
              <div style={{ position: 'relative', width: '104px', height: '104px', margin: '0 auto 12px' }}>
                <img 
                  src={student.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&crop=faces'} 
                  alt={`Photograph of ${student.first_name} ${student.last_name}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '12px',
                    border: '2px solid var(--primary)',
                    boxShadow: 'var(--shadow-md)'
                  }}
                />
                <span style={{
                  position: 'absolute',
                  bottom: '-8px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'var(--primary)',
                  color: '#fff',
                  fontSize: '0.62rem',
                  fontWeight: '700',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase'
                }}>
                  STUDENT
                </span>
              </div>

              {/* Student Name & Roll */}
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#fff', marginBottom: '2px' }}>
                {student.first_name} {student.last_name}
              </h3>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.88rem', color: '#93c5fd', fontWeight: '700', marginBottom: '12px' }}>
                {student.roll_number}
              </p>

              {/* Quick Details Table */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                padding: '10px 12px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                textAlign: 'left',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                fontSize: '0.74rem'
              }}>
                <div>
                  <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.65rem' }}>PROGRAM</span>
                  <strong style={{ color: '#fff' }}>{student.program || 'B.Tech'}</strong>
                </div>
                <div>
                  <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.65rem' }}>DEPARTMENT</span>
                  <strong style={{ color: '#fff' }}>{student.department_code || student.department_name || 'CSE'}</strong>
                </div>
                <div>
                  <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.65rem' }}>BATCH</span>
                  <strong style={{ color: '#fff' }}>{student.batch || '2023-2027'}</strong>
                </div>
                <div>
                  <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.65rem' }}>BLOOD GROUP</span>
                  <strong style={{ color: '#f87171' }}>{student.blood_group || 'O+'}</strong>
                </div>
              </div>

              {/* Barcode bottom */}
              <div style={{ marginTop: 'auto', paddingTop: '12px' }}>
                <div style={{
                  height: '24px',
                  background: 'repeating-linear-gradient(90deg, #fff 0, #fff 2px, transparent 2px, transparent 4px, #fff 4px, #fff 6px, transparent 6px, transparent 9px)',
                  opacity: 0.8
                }} />
                <p style={{ fontSize: '0.58rem', color: '#94a3b8', letterSpacing: '0.12em', marginTop: '4px' }}>
                  VALID THRU 06/2027 • OFFICIAL CAMPUS CREDENTIAL
                </p>
              </div>
            </div>
          ) : (
            /* BACK OF ID CARD */
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '18px', textAlign: 'left' }}>
              <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '0.82rem', fontWeight: '700', color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Emergency & Campus Directives
                </h4>
              </div>

              <div style={{ fontSize: '0.74rem', display: 'flex', flexDirection: 'column', gap: '8px', color: '#cbd5e1' }}>
                <div>
                  <span style={{ color: '#94a3b8', fontSize: '0.66rem', display: 'block' }}>GUARDIAN CONTACT</span>
                  <strong>{student.guardian_name || 'Parent'} ({student.guardian_phone || student.phone})</strong>
                </div>
                <div>
                  <span style={{ color: '#94a3b8', fontSize: '0.66rem', display: 'block' }}>PERMANENT ADDRESS</span>
                  <span>{student.address || 'Campus Hostel Block 3, Room 214'}</span>
                </div>
                <div>
                  <span style={{ color: '#94a3b8', fontSize: '0.66rem', display: 'block' }}>CAMPUS HELPLINE</span>
                  <span>+91 (0) 80 4123 4599 | security@apextech.edu</span>
                </div>
              </div>

              {/* QR Code and Terms */}
              <div style={{
                marginTop: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: 'rgba(255,255,255,0.04)',
                padding: '10px',
                borderRadius: '8px'
              }}>
                <div style={{
                  background: '#fff',
                  padding: '4px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div style={{
                    width: '54px',
                    height: '54px',
                    background: 'radial-gradient(circle, #000 65%, transparent 66%) 0 0/8px 8px',
                    border: '1px solid #000'
                  }} />
                </div>
                <div style={{ fontSize: '0.64rem', color: '#94a3b8', lineHeight: 1.4 }}>
                  Official property of Apex Institute of Technology. Return to Registrar Office if found.
                </div>
              </div>

              {/* Signatures */}
              <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '16px' }}>
                <div>
                  <div style={{ fontFamily: 'cursive', fontSize: '0.9rem', color: '#cbd5e1' }}>
                    Sulaiman K.
                  </div>
                  <span style={{ fontSize: '0.6rem', color: '#64748b', textTransform: 'uppercase' }}>Cardholder</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'cursive', fontSize: '0.95rem', color: '#93c5fd' }}>
                    Dr. A. Thorne
                  </div>
                  <span style={{ fontSize: '0.6rem', color: '#64748b', textTransform: 'uppercase' }}>Registrar</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
