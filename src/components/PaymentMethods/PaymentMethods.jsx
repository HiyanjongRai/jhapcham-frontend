// Payment Methods Management Component
import React, { useState, useEffect } from 'react';
import {
  getSavedPaymentMethods,
  addPaymentMethod,
  setDefaultPaymentMethod,
  deletePaymentMethod
} from '../../api/paymentMethodsApi';
import { CreditCard, Plus, Trash2, Check } from 'lucide-react';
import './PaymentMethods.css';

export default function PaymentMethods({ userId, onSuccess }) {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    cardName: '',
    cardNumber: '',
    expiryDate: '',
    cvv: ''
  });

  useEffect(() => {
    loadPaymentMethods();
  }, [userId]);

  const loadPaymentMethods = async () => {
    setLoading(true);
    try {
      const data = await getSavedPaymentMethods(userId);
      setMethods(data || []);
    } catch (error) {
      console.error('Payment methods load error:', error);
    }
    setLoading(false);
  };

  const handleAddMethod = async (e) => {
    e.preventDefault();
    const result = await addPaymentMethod(userId, formData);
    if (result.success) {
      setFormData({ cardName: '', cardNumber: '', expiryDate: '', cvv: '' });
      setShowForm(false);
      loadPaymentMethods();
      onSuccess?.('Payment method added successfully');
    }
  };

  const handleSetDefault = async (methodId) => {
    const result = await setDefaultPaymentMethod(methodId);
    if (result.success) {
      loadPaymentMethods();
      onSuccess?.('Default payment method updated');
    }
  };

  const handleDelete = async (methodId) => {
    if (window.confirm('Are you sure you want to delete this payment method?')) {
      const result = await deletePaymentMethod(methodId);
      if (result.success) {
        loadPaymentMethods();
        onSuccess?.('Payment method deleted');
      }
    }
  };

  return (
    <div className="payment-methods-container">
      <div className="payment-methods-header">
        <h2 className="gt-h2">Payment Methods</h2>
        <button 
          className="add-method-btn"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus size={18} />
          <span>Add Payment Method</span>
        </button>
      </div>

      {showForm && (
        <div className="payment-form">
          <h3>Add New Payment Method</h3>
          <form onSubmit={handleAddMethod}>
            <input
              type="text"
              placeholder="Card Name (e.g., Personal Card)"
              value={formData.cardName}
              onChange={(e) => setFormData({ ...formData, cardName: e.target.value })}
              required
            />
            <input
              type="text"
              placeholder="Card Number"
              value={formData.cardNumber}
              onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
              required
            />
            <input
              type="text"
              placeholder="MM/YY"
              value={formData.expiryDate}
              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              required
            />
            <input
              type="text"
              placeholder="CVV"
              value={formData.cvv}
              onChange={(e) => setFormData({ ...formData, cvv: e.target.value })}
              required
            />
            <div className="form-actions">
              <button type="submit" className="btn-primary">Add Method</button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="payment-methods-list">
        {loading ? (
          <p>Loading payment methods...</p>
        ) : methods.length === 0 ? (
          <p className="empty-state">No payment methods saved yet</p>
        ) : (
          methods.map((method) => (
            <div key={method.id} className="payment-method-card">
              <div className="method-icon">
                <CreditCard size={24} />
              </div>
              <div className="method-details">
                <p className="method-name">{method.cardName}</p>
                <p className="method-number">•••• •••• •••• {method.cardNumber?.slice(-4)}</p>
                <p className="method-expiry">{method.expiryDate}</p>
              </div>
              <div className="method-actions">
                {method.isDefault ? (
                  <span className="default-badge">
                    <Check size={16} />
                    Default
                  </span>
                ) : (
                  <button
                    className="set-default-btn"
                    onClick={() => handleSetDefault(method.id)}
                  >
                    Set Default
                  </button>
                )}
                <button
                  className="delete-btn"
                  onClick={() => handleDelete(method.id)}
                  title="Delete payment method"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
