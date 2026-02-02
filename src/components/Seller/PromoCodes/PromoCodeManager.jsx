import React, { useState, useEffect } from 'react';
import api from '../../../api/axios';
import { getCurrentUserId } from '../../AddCart/cartUtils'; // Assuming utilities are shareable or duplicated
import { Trash2, AlertCircle, CheckCircle, Tag, Copy, Calendar, DollarSign, Percent, Plus } from 'lucide-react';
import './PromoCodeManager.css';

const PromoCodeManager = () => {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPromo, setNewPromo] = useState({
    code: '',
    discountType: 'PERCENTAGE', // PERCENTAGE, FIXED
    discountValue: '',
    minOrderValue: '',
    startDate: '',
    endDate: '',
    usageLimit: ''
  });

  const userId = getCurrentUserId();

  useEffect(() => {
    fetchPromos();
  }, []);

  const fetchPromos = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/promos/seller/${userId}`); // Updated path
      setPromos(res.data);
      setLoading(false);
    } catch (err) {
      setError("Failed to load promo codes.");
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newPromo.code || !newPromo.discountValue || !newPromo.startDate || !newPromo.endDate) {
      alert("Please fill all required fields");
      return;
    }

    try {
      const payload = {
        ...newPromo,
        sellerId: userId,
        code: newPromo.code.toUpperCase(),
        discountValue: parseFloat(newPromo.discountValue),
        minOrderValue: parseFloat(newPromo.minOrderValue || 0),
        usageLimit: parseInt(newPromo.usageLimit || 1000000), // Default high limit
        startDate: new Date(newPromo.startDate).toISOString(),
        endDate: new Date(newPromo.endDate).toISOString()
      };

      await api.post('/api/promos', payload); // Updated path
      setShowCreateModal(false);
      fetchPromos();
      // Reset form
      setNewPromo({
        code: '',
        discountType: 'PERCENTAGE',
        discountValue: '',
        minOrderValue: '',
        startDate: '',
        endDate: '',
        usageLimit: ''
      });
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create promo code");
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // Could add toast here
  };

  return (
    <div className="promo-manager-container">
      <div className="promo-header">
        <div>
          <h2>Promo Codes</h2>
          <p>Manage your discount coupons</p>
        </div>
        <button className="create-btn" onClick={() => setShowCreateModal(true)}>
          <Plus size={18} /> Create New
        </button>
      </div>

      {loading ? (
        <div className="loading-state">Loading...</div>
      ) : error ? (
        <div className="error-state">{error}</div>
      ) : (
        <div className="promo-grid">
          {promos.map(promo => (
            <div key={promo.id} className={`promo-card ${!promo.isActive ? 'expired' : ''}`}>
              <div className="card-top">
                <div className="promo-type-badge">
                   {promo.discountType === 'PERCENTAGE' ? <Percent size={14} /> : <DollarSign size={14} />}
                   {promo.discountType === 'PERCENTAGE' ? `${promo.discountValue}% OFF` : `Rs. ${promo.discountValue} OFF`}
                </div>
                <div className={`status-pill ${promo.isActive ? 'active' : 'inactive'}`}>
                  {promo.isActive ? 'Active' : 'Inactive'}
                </div>
              </div>
              
              <div className="code-display" onClick={() => copyToClipboard(promo.code)}>
                <span className="code-text">{promo.code}</span>
                <Copy size={14} className="copy-icon" />
              </div>

              <div className="card-details">
                <div className="detail-row">
                  <Calendar size={14} />
                  <span>Ends: {new Date(promo.endDate).toLocaleDateString()}</span>
                </div>
                <div className="detail-row">
                  <Tag size={14} />
                  <span>Min Order: Rs. {promo.minOrderValue}</span>
                </div>
                <div className="usage-bar-wrapper">
                  <div className="usage-text">
                    <span>Used: {promo.usedCount}</span>
                    <span>Limit: {promo.usageLimit}</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${Math.min((promo.usedCount / promo.usageLimit) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {promos.length === 0 && (
             <div className="empty-state">
                <Tag size={48} />
                <p>No active promo codes found.</p>
             </div>
          )}
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Create Promo Code</h3>
            
            <div className="form-group">
              <label>Promo Code (Unique)</label>
              <input 
                type="text" 
                placeholder="e.g. SUMMER25" 
                value={newPromo.code}
                onChange={e => setNewPromo({...newPromo, code: e.target.value.toUpperCase()})}
              />
            </div>

            <div className="row">
               <div className="form-group">
                  <label>Type</label>
                  <select 
                    value={newPromo.discountType}
                    onChange={e => setNewPromo({...newPromo, discountType: e.target.value})}
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount (Rs.)</option>
                  </select>
               </div>
               <div className="form-group">
                  <label>Value</label>
                  <input 
                    type="number" 
                    placeholder="10" 
                    value={newPromo.discountValue}
                    onChange={e => setNewPromo({...newPromo, discountValue: e.target.value})}
                  />
               </div>
            </div>

            <div className="form-group">
              <label>Minimum Order Value (Rs.)</label>
              <input 
                type="number" 
                placeholder="500" 
                value={newPromo.minOrderValue}
                onChange={e => setNewPromo({...newPromo, minOrderValue: e.target.value})}
              />
            </div>

            <div className="row">
                <div className="form-group">
                  <label>Start Date</label>
                  <input 
                    type="datetime-local" 
                    value={newPromo.startDate}
                    onChange={e => setNewPromo({...newPromo, startDate: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input 
                    type="datetime-local" 
                    value={newPromo.endDate}
                    onChange={e => setNewPromo({...newPromo, endDate: e.target.value})}
                  />
                </div>
            </div>

            <div className="form-group">
              <label>Usage Limit</label>
              <input 
                type="number" 
                placeholder="100" 
                value={newPromo.usageLimit}
                onChange={e => setNewPromo({...newPromo, usageLimit: e.target.value})}
              />
            </div>

            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowCreateModal(false)}>Cancel</button>
              <button className="submit-btn" onClick={handleCreate}>Create Code</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromoCodeManager;
