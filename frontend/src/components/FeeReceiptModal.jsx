import React, { useEffect, useState } from 'react';
import { X, Printer, CheckCircle2 } from 'lucide-react';

export default function FeeReceiptModal({ receiptNo, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    fetchReceipt();
  }, [receiptNo]);

  const fetchReceipt = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/fees/receipt/${receiptNo}`);
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

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Loading Payment Voucher">
        <div className="modal-content" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-main)' }}>
          Retrieving official bursar receipt...
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { receipt, institution } = data;

  return (
    <div 
      className="modal-overlay" 
      role="dialog"
      aria-modal="true"
      aria-label={`Official Payment Receipt ${receipt.receipt_no}`}
    >
      <button 
        type="button" 
        className="modal-backdrop-dismiss" 
        onClick={onClose} 
        aria-label="Dismiss payment receipt dialog" 
      />
      <div 
        className="modal-content" 
        style={{
          background: '#ffffff',
          color: '#0f172a',
          maxWidth: '680px',
          border: '1px solid #cbd5e1'
        }}
      >
        <div className="no-print" style={{
          padding: '12px 20px',
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669', fontWeight: '700' }}>
            <CheckCircle2 size={18} />
            <span>Official Bursar Payment Voucher</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              type="button"
              className="btn btn-primary btn-sm" 
              onClick={handlePrint}
              aria-label="Print official fee receipt"
            >
              <Printer size={14} /> Print Voucher
            </button>
            <button 
              type="button"
              className="btn-icon" 
              onClick={onClose}
              aria-label="Close payment voucher dialog"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Voucher Content */}
        <div id="printable-fee-receipt" style={{ padding: '28px 34px' }}>
          <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '14px', marginBottom: '18px' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: '900', color: '#0f172a', margin: 0 }}>
              {institution.name}
            </h2>
            <p style={{ fontSize: '0.74rem', color: '#475569', margin: '2px 0 0' }}>
              {institution.address} • {institution.phone}
            </p>
            <div style={{
              display: 'inline-block',
              background: '#f1f5f9',
              border: '1px solid #cbd5e1',
              padding: '2px 14px',
              borderRadius: 'var(--radius-sm)',
              fontWeight: '700',
              fontSize: '0.72rem',
              color: '#334155',
              marginTop: '6px'
            }}>
              ACADEMIC FEE PAYMENT VOUCHER
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '0.82rem' }}>
            <div>
              <span style={{ color: '#475569' }}>Receipt Number:</span>{' '}
              <strong style={{ fontFamily: 'var(--font-mono)', color: '#1d4ed8' }}>{receipt.receipt_no}</strong>
            </div>
            <div>
              <span style={{ color: '#475569' }}>Date of Issue:</span>{' '}
              <strong>{receipt.payment_date}</strong>
            </div>
          </div>

          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            fontSize: '0.82rem',
            marginBottom: '18px'
          }}>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.7rem' }}>CANDIDATE NAME</span>
              <strong>{receipt.first_name} {receipt.last_name}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.7rem' }}>ENROLLMENT NO</span>
              <strong style={{ fontFamily: 'var(--font-mono)' }}>{receipt.roll_number}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.7rem' }}>PROGRAM & DEPT</span>
              <strong>{receipt.program} — {receipt.department_code}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.7rem' }}>SEMESTER & YEAR</span>
              <strong>Semester {receipt.semester} ({receipt.academic_year})</strong>
            </div>
          </div>

          {/* Payment Particulars Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginBottom: '18px' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', borderTop: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>
                <th style={{ padding: '8px 10px', textAlign: 'left', color: '#1e293b' }}>Fee Description</th>
                <th style={{ padding: '8px 10px', textAlign: 'center', color: '#1e293b' }}>Payment Mode</th>
                <th style={{ padding: '8px 10px', textAlign: 'right', color: '#1e293b' }}>Amount Paid</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '10px' }}>
                  <strong>{receipt.fee_type}</strong>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>Txn Ref: {receipt.transaction_ref}</div>
                </td>
                <td style={{ padding: '10px', textAlign: 'center' }}>
                  <span style={{ background: '#e0e7ff', color: '#1d4ed8', padding: '2px 8px', borderRadius: '4px', fontWeight: '600', fontSize: '0.74rem' }}>
                    {receipt.payment_method}
                  </span>
                </td>
                <td style={{ padding: '10px', textAlign: 'right', fontWeight: '700', fontSize: '1rem', color: '#0f172a' }}>
                  ₹{Number(receipt.amount).toLocaleString()}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="2" style={{ padding: '10px', textAlign: 'right', fontWeight: '700', color: '#0f172a' }}>Total Amount Received:</td>
                <td style={{ padding: '10px', textAlign: 'right', fontWeight: '900', fontSize: '1.15rem', color: '#059669' }}>
                  ₹{Number(receipt.amount).toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>

          <div style={{
            fontSize: '0.76rem',
            color: '#475569',
            background: '#f8fafc',
            border: '1px dashed #cbd5e1',
            padding: '10px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '24px'
          }}>
            <strong>Remarks:</strong> {receipt.remarks || 'Electronic receipt acknowledged by University Bursar.'}
          </div>

          {/* Stamp and cashier signature */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '10px' }}>
            <div style={{
              width: '84px',
              height: '84px',
              borderRadius: 'var(--radius-full)',
              border: '2px dashed #059669',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#059669',
              fontSize: '0.58rem',
              fontWeight: '800',
              textAlign: 'center',
              transform: 'rotate(6deg)'
            }}>
              PAID<br />ACCOUNTS<br />VERIFIED
            </div>

            <div style={{ textAlign: 'center', width: '180px' }}>
              <div style={{ fontFamily: 'cursive', fontSize: '1.2rem', color: '#334155' }}>
                K. V. Sundaram
              </div>
              <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '4px', fontSize: '0.72rem', fontWeight: '700', color: '#475569' }}>
                CHIEF ACCOUNTS OFFICER
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
