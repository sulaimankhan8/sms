import React, { useState, useEffect } from 'react';
import { X, Upload, Check } from 'lucide-react';
import { authFetch } from '../utils/api';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&h=200&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces'
];

export default function AddStudentModal({ departments, onClose, onCreated }) {
  const [formData, setFormData] = useState({
    roll_number: `2024CS${Math.floor(Math.random() * 900 + 100)}`,
    first_name: '',
    last_name: '',
    email: '',
    phone: '+91 98765 00000',
    dob: '2005-06-15',
    gender: 'Male',
    blood_group: 'O+',
    department_id: departments[0]?.id || 1,
    semester: 1,
    batch: '2024-2028',
    program: 'B.Tech',
    admission_date: new Date().toISOString().split('T')[0],
    address: 'Campus Hostel Block B, Room 104',
    guardian_name: '',
    guardian_phone: '',
    avatar_url: AVATAR_PRESETS[0],
    status: 'Active'
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.first_name || !formData.last_name || !formData.email || !formData.roll_number) {
      setError('Please fill in First Name, Last Name, Email and Roll Number.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      const res = await authFetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to enroll student');
      }
      onCreated(json.data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div 
      className="modal-overlay" 
      role="dialog"
      aria-modal="true"
      aria-label="Student Enrollment Dialog"
    >
      <button 
        type="button" 
        className="modal-backdrop-dismiss" 
        onClick={onClose} 
        aria-label="Dismiss student enrollment dialog" 
      />
      <div className="modal-content wide">
        <div className="modal-header">
          <div>
            <h3>Enroll New Student</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '2px' }}>
              Create permanent academic identity and allocate tuition structure
            </p>
          </div>
          <button 
            type="button"
            className="btn-icon" 
            onClick={onClose}
            aria-label="Close student enrollment dialog"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {error && (
              <div style={{
                background: 'var(--danger-light)',
                border: '1px solid var(--danger)',
                color: 'var(--danger)',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem'
              }}>
                {error}
              </div>
            )}

            {/* Avatar picker */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                Profile Photo Avatar
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                <img 
                  src={formData.avatar_url} 
                  alt="Selected Student Avatar"
                  style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: 'var(--radius-md)',
                    objectFit: 'cover',
                    border: '2px solid var(--primary)'
                  }}
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  {AVATAR_PRESETS.map((url, i) => (
                    <button 
                      key={i} 
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, avatar_url: url }))}
                      aria-label={`Select avatar preset option ${i + 1}`}
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
                      <img 
                        src={url} 
                        alt=""
                        style={{
                          width: '38px',
                          height: '38px',
                          objectFit: 'cover',
                          display: 'block'
                        }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Form Fields Grid */}
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="student-roll-input">Roll Number / Enrollment ID *</label>
                <input 
                  id="student-roll-input"
                  type="text" 
                  name="roll_number"
                  value={formData.roll_number}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="student-prog-select">Academic Program</label>
                <select id="student-prog-select" name="program" value={formData.program} onChange={handleChange}>
                  <option value="B.Tech">B.Tech (Bachelor of Technology)</option>
                  <option value="B.Sc">B.Sc (Bachelor of Science)</option>
                  <option value="BCA">BCA (Bachelor of Computer Apps)</option>
                  <option value="BBA">BBA (Bachelor of Business Admin)</option>
                  <option value="M.Tech">M.Tech (Master of Technology)</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="student-first-name">First Name *</label>
                <input 
                  id="student-first-name"
                  type="text" 
                  name="first_name"
                  placeholder="e.g. Rahul"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="student-last-name">Last Name *</label>
                <input 
                  id="student-last-name"
                  type="text" 
                  name="last_name"
                  placeholder="e.g. Verma"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="student-email">Email Address *</label>
                <input 
                  id="student-email"
                  type="email" 
                  name="email"
                  placeholder="student@campus.edu"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="student-phone">Phone Number</label>
                <input 
                  id="student-phone"
                  type="text" 
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="student-dept">Department / School</label>
                <select id="student-dept" name="department_id" value={formData.department_id} onChange={handleChange}>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.code} — {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="student-sem">Initial Semester</label>
                <select id="student-sem" name="semester" value={formData.semester} onChange={handleChange}>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="student-batch">Batch / Academic Period</label>
                <input 
                  id="student-batch"
                  type="text" 
                  name="batch"
                  value={formData.batch}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="student-dob">Date of Birth</label>
                <input 
                  id="student-dob"
                  type="date" 
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="student-gender">Gender</label>
                <select id="student-gender" name="gender" value={formData.gender} onChange={handleChange}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="student-bg">Blood Group</label>
                <select id="student-bg" name="blood_group" value={formData.blood_group} onChange={handleChange}>
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
                <label htmlFor="student-gname">Guardian / Parent Name</label>
                <input 
                  id="student-gname"
                  type="text" 
                  name="guardian_name"
                  placeholder="e.g. Ramesh Verma"
                  value={formData.guardian_name}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="student-gphone">Guardian Phone Number</label>
                <input 
                  id="student-gphone"
                  type="text" 
                  name="guardian_phone"
                  placeholder="+91 98765 00000"
                  value={formData.guardian_phone}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group full">
                <label htmlFor="student-address">Residential / Permanent Address</label>
                <textarea 
                  id="student-address"
                  name="address"
                  rows="2"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose} 
              disabled={saving}
              aria-label="Cancel enrollment"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={saving}
              aria-label="Submit student enrollment"
            >
              {saving ? 'Enrolling...' : 'Enroll Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
