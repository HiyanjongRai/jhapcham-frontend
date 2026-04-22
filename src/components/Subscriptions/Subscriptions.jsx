// Auto-Reorder Subscriptions Component
import React, { useState, useEffect } from 'react';
import {
  getActiveSubscriptions,
  createSubscription,
  pauseSubscription,
  resumeSubscription,
  cancelSubscription,
  quickReorder
} from '../../api/subscriptionApi';
import { RotateCw, Pause, Play, Trash2, Plus } from 'lucide-react';
import './Subscriptions.css';

export default function Subscriptions({ userId, onSuccess }) {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    loadSubscriptions();
  }, [userId]);

  const loadSubscriptions = async () => {
    setLoading(true);
    try {
      const data = await getActiveSubscriptions(userId);
      setSubscriptions(data || []);
    } catch (error) {
      console.error('Subscriptions load error:', error);
    }
    setLoading(false);
  };

  const handlePause = async (subId) => {
    const result = await pauseSubscription(subId);
    if (result.success) {
      loadSubscriptions();
      onSuccess?.('Subscription paused');
    }
  };

  const handleResume = async (subId) => {
    const result = await resumeSubscription(subId);
    if (result.success) {
      loadSubscriptions();
      onSuccess?.('Subscription resumed');
    }
  };

  const handleCancel = async (subId) => {
    if (window.confirm('Are you sure you want to cancel this subscription?')) {
      const result = await cancelSubscription(subId);
      if (result.success) {
        loadSubscriptions();
        onSuccess?.('Subscription cancelled');
      }
    }
  };

  return (
    <div className="subscriptions-container">
      <div className="subscriptions-header">
        <h2 className="gt-h2">Auto-Reorder Subscriptions</h2>
        <button 
          className="create-sub-btn"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          <Plus size={18} />
          <span>Create Subscription</span>
        </button>
      </div>

      {showCreateForm && (
        <div className="create-subscription-form">
          <h3>Create Auto-Reorder Subscription</h3>
          <p className="form-info">
            Set up automatic delivery of your favorite products on a recurring schedule
          </p>
          <form>
            <input type="text" placeholder="Select Product" />
            <select>
              <option>Frequency - Select</option>
              <option>Weekly</option>
              <option>Bi-weekly</option>
              <option>Monthly</option>
              <option>Every 2 Months</option>
              <option>Every 3 Months</option>
            </select>
            <input type="number" placeholder="Quantity" min="1" />
            <div className="form-actions">
              <button type="submit" className="btn-primary">Create Subscription</button>
              <button type="button" className="btn-secondary" onClick={() => setShowCreateForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="subscriptions-list">
        {loading ? (
          <p>Loading subscriptions...</p>
        ) : subscriptions.length === 0 ? (
          <p className="empty-state">No active subscriptions. Create one to auto-reorder your favorite products!</p>
        ) : (
          subscriptions.map((sub) => (
            <div key={sub.id} className="subscription-card">
              <div className="subscription-icon">
                <RotateCw size={24} />
              </div>
              <div className="subscription-details">
                <p className="product-name">{sub.productName}</p>
                <p className="subscription-schedule">
                  {sub.frequency} • Qty: {sub.quantity} • Next delivery: {sub.nextDeliveryDate}
                </p>
                <div className="subscription-meta">
                  <span className={`status ${sub.status?.toLowerCase()}`}>
                    {sub.status}
                  </span>
                  <span className="price">Rs. {sub.totalPrice}</span>
                </div>
              </div>
              <div className="subscription-actions">
                {sub.status === 'ACTIVE' ? (
                  <button
                    className="action-btn pause"
                    onClick={() => handlePause(sub.id)}
                    title="Pause subscription"
                  >
                    <Pause size={18} />
                  </button>
                ) : (
                  <button
                    className="action-btn resume"
                    onClick={() => handleResume(sub.id)}
                    title="Resume subscription"
                  >
                    <Play size={18} />
                  </button>
                )}
                <button
                  className="action-btn cancel"
                  onClick={() => handleCancel(sub.id)}
                  title="Cancel subscription"
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
