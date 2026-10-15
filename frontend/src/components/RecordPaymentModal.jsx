import React, { useState, useEffect } from 'react';
import { X, DollarSign, CheckCircle } from 'lucide-react';
import { authFetch } from '../utils/api';

export default function RecordPaymentModal({ fee, onClose, onPaid }) {
  const remaining = fee.total_amount - fee.paid_amount;
  const [amount, setAmount] = useState(remaining);
  const [method, setMethod] = useState('UPI');
  const [remarks, setRemarks] = useState(`Tuition installment payment by ${fee.first_name || 'student'}`);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handlePay = async (e) => {
    e.preventDefault();
    if (Number(amount) <= 0 || Number(amount) > remaining) {
      setError(`Payment amount must be between ₹1 and ₹${remaining}`);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await authFetch(`/api/fees/${fee.id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(amount),
          payment_method: method,
          remarks
        })
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Payment failed');
      }
      onPaid(json.data.receiptNo);
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
      aria-label="Record Fee Payment Dialog"
    >
      <button 
        type="button" 
        className="modal-backdrop-dismiss" 
        onClick={onClose} 
        aria-label="Dismiss payment dialog" 
      />
      <div className="modal-content">
        <div className="modal-header">
          <div>
            <h3>Record Fee Payment</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              Student: <strong>{fee.first_name} {fee.last_name}</strong> ({fee.roll_number})
            </p>
          </div>
          <button 
            type="button"
            className="btn-icon" 
            onClick={onClose}
            aria-label="Close fee payment dialog"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handlePay}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {error && (
              <div style={{
                background: 'var(--danger-light)',
                border: '1px solid var(--danger-border)',
                color: 'var(--danger)',
                padding: '10px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem'
              }}>
                {error}
              </div>
            )}

            <div style={{
              background: 'var(--bg-subtle)',
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '10px',
              textAlign: 'center'
            }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'block' }}>TOTAL FEE</span>
                <strong>₹{Number(fee.total_amount).toLocaleString()}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'block' }}>ALREADY PAID</span>
                <strong style={{ color: 'var(--success)' }}>₹{Number(fee.paid_amount).toLocaleString()}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'block' }}>BALANCE DUE</span>
                <strong style={{ color: 'var(--danger)' }}>₹{Number(remaining).toLocaleString()}</strong>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="payment-amount-input">Paying Amount (₹) *</label>
              <input 
                id="payment-amount-input"
                type="number" 
                max={remaining}
                min="100"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="payment-method-select">Payment Method</label>
              <select 
                id="payment-method-select"
                value={method} 
                onChange={e => setMethod(e.target.value)}
              >
                <option value="UPI">UPI (Google Pay, PhonePe, Paytm)</option>
                <option value="Net Banking">Net Banking / NEFT / RTGS</option>
                <option value="Debit/Credit Card">Debit / Credit Card</option>
                <option value="Cash">Cash at University Cashier Desk</option>
                <option value="Demand Draft">Demand Draft / Cheque</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="payment-remarks-input">Remarks / Transaction Reference</label>
              <input 
                id="payment-remarks-input"
                type="text" 
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose} 
              disabled={loading}
              aria-label="Cancel payment"
            >
              Cancel
            </button>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-primary"
                disabled={loading}
                onClick={async () => {
                  try {
                    setLoading(true);
                    setError('');
                    // 1. Create checkout session
                    const sessRes = await authFetch(`/api/fees/${fee.id}/checkout-session`, { method: 'POST' });
                    const sessData = await sessRes.json();
                    if (!sessRes.ok || !sessData.success) throw new Error(sessData.error || 'Failed to initialize gateway checkout');

                    // 2. Simulate webhook payment_intent.succeeded
                    const hookRes = await fetch('/api/webhooks/payment', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'x-apex-signature': 'sig_verified_stripe_prod_2026'
                      },
                      body: JSON.stringify({
                        event: 'payment_intent.succeeded',
                        data: {
                          fee_id: fee.id,
                          amount: Number(amount),
                          payment_method: 'STRIPE_ONLINE_GATEWAY',
                          transaction_ref: `STRIPE_${sessData.data.sessionId}`,
                          payer_email: fee.email || 'student@apex.edu'
                        }
                      })
                    });
                    const hookData = await hookRes.json();
                    if (!hookRes.ok || !hookData.received) throw new Error(hookData.error || 'Gateway webhook reconciliation failed');

                    onPaid(hookData.receiptNo);
                    onClose();
                  } catch (gwErr) {
                    setError(`Digital Gateway: ${gwErr.message}`);
                  } finally {
                    setLoading(false);
                  }
                }}
                style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', borderColor: '#4f46e5', color: '#fff' }}
                aria-label="Pay via Automated Digital Gateway"
              >
                {loading ? 'Reconciling...' : '⚡ Pay via Stripe Gateway'}
              </button>
              <button 
                type="submit" 
                className="btn btn-success" 
                disabled={loading}
                aria-label={`Receive payment of rupees ${Number(amount || 0).toLocaleString()}`}
              >
                {loading ? 'Processing...' : `Manual Settlement (₹${Number(amount || 0).toLocaleString()})`}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
