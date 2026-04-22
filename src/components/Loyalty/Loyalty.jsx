import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import loyaltyApi from '../../api/loyaltyApi';
import './Loyalty.css';
import { 
  Award, Shield, Zap, Info, ChevronRight, TrendingUp 
} from 'lucide-react';

const TIERS = {
  BRONZE: { points: 0, benefits: 'Start your journey', color: '#cd7f32', icon: <Shield size={20} /> },
  SILVER: { points: 500, benefits: '5% continuous discount', color: '#94a3b8', icon: <Shield size={20} /> },
  GOLD: { points: 2000, benefits: '10% discount + Free shipping', color: '#fbbf24', icon: <Award size={20} /> },
  PLATINUM: { points: 5000, benefits: '15% discount + VIP support', color: '#818cf8', icon: <Award size={20} /> }
};

const Loyalty = () => {
  const [loyalty, setLoyalty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);
  const [redeemAmount, setRedeemAmount] = useState('');

  useEffect(() => {
    loadLoyaltyPoints();
  }, []);

  const loadLoyaltyPoints = async () => {
    try {
      setLoading(true);
      const data = await loyaltyApi.getMyPoints();
      setLoyalty(data);
    } catch (error) {
      toast.error('Failed to load loyalty points');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeemPoints = async (e) => {
    e.preventDefault();
    const amount = Number(redeemAmount);
    if (amount <= 0 || amount > (loyalty?.availablePoints || 0)) {
      toast.error('Invalid redemption amount');
      return;
    }

    try {
      setRedeeming(true);
      await loyaltyApi.redeemPoints({ points: amount });
      toast.success(`${amount} points redeemed successfully!`);
      setRedeemAmount('');
      loadLoyaltyPoints();
    } catch (error) {
      toast.error('Failed to redeem points');
      console.error(error);
    } finally {
      setRedeeming(false);
    }
  };

  if (loading) {
    return (
      <div className="loyal-page-wrap" style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const currentTier = loyalty?.tier || 'BRONZE';
  const nextTierName = loyalty?.nextTier || 'SILVER';
  const currentTierInfo = TIERS[currentTier];
  
  const pointsToNext = loyalty?.pointsToNextTier || 0;
  const currentTotal = loyalty?.totalPoints || 0;
  
  const target = currentTotal + pointsToNext;
  const progressPercent = target > 0 ? ((currentTotal / target) * 100) : 0;
  const displayProgress = Math.min(Math.max(progressPercent, 0), 100);

  return (
    <div className="loyal-page-wrap">
      {/* Hero Card */}
      <div className="loyal-hero-card">
        <div className="loyal-hero-tier">
          <div className={`loyal-shield-wrap ${currentTier}`}>
             {currentTierInfo.icon}
          </div>
          <div className="loyal-hero-text">
            <h1>{currentTier} MEMBER</h1>
            <p><Zap size={14} fill="currentColor" /> {currentTotal.toLocaleString()} Lifetime Points</p>
          </div>
        </div>
        <div className="loyal-hero-stats">
          <div className="loyal-stat-box">
             <span className="sb-val">{loyalty?.availablePoints?.toLocaleString() || 0}</span>
             <span className="sb-lbl">Available</span>
          </div>
          <div className="loyal-stat-box">
             <span className="sb-val">{loyalty?.redeemedPoints?.toLocaleString() || 0}</span>
             <span className="sb-lbl">Redeemed</span>
          </div>
        </div>
      </div>

      {/* Progress Card */}
      {currentTier !== 'PLATINUM' && (
        <div className="loyal-progress-card">
          <div className="loyal-prog-header">
            <h4>Journey to {nextTierName}</h4>
            <span>{pointsToNext.toLocaleString()} more needed</span>
          </div>
          <div className="loyal-prog-bar-wrap">
            <div className="loyal-prog-fill" style={{ width: `${displayProgress}%` }} />
          </div>
        </div>
      )}

      <div className="loyal-grid">
        {/* Tier Benefits List */}
        <div className="loyal-box">
           <h3 className="loyal-box-title"><Award size={18} /> Membership Tiers</h3>
           <div className="loyal-tier-list">
             {Object.entries(TIERS).map(([tierKey, info]) => (
               <div key={tierKey} className={`loyal-tier-item ${currentTier === tierKey ? 'active' : ''}`}>
                 <div className="loyal-tier-icon" style={{ color: info.color }}>
                   {info.icon}
                 </div>
                 <div className="loyal-tier-info">
                   <h5>{tierKey} {currentTier === tierKey && '(Current)'}</h5>
                   <p>{info.points}+ Points <span style={{margin: '0 4px'}}>•</span> {info.benefits}</p>
                 </div>
               </div>
             ))}
           </div>
        </div>

        {/* Redemption Area */}
        <div className="loyal-box">
           <h3 className="loyal-box-title"><TrendingUp size={18} /> Redeem Points</h3>
           <div className="loyal-redeem-area">
              <div className="loyal-redeem-tip">
                 <Info size={16} />
                 1 Point = Rs. 1 off your next purchase!
              </div>
              <form onSubmit={handleRedeemPoints} className="mt-2">
                 <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
                   Amount to Redeem
                 </label>
                 <div className="loyal-redeem-input-wrap">
                   <input
                     type="number"
                     placeholder="Enter points..."
                     value={redeemAmount}
                     onChange={(e) => setRedeemAmount(e.target.value)}
                     min="1"
                     max={loyalty?.availablePoints || 0}
                     required
                   />
                   <button type="submit" className="loyal-btn" disabled={redeeming || (loyalty?.availablePoints === 0)}>
                     {redeeming ? 'Processing...' : 'Redeem'} <ChevronRight size={16} />
                   </button>
                 </div>
                 <p style={{ marginTop: '10px', fontSize: '0.8rem', color: '#94a3b8' }}>
                   Maximum available: {loyalty?.availablePoints || 0} PTS
                 </p>
                 {loyalty?.lastRedeemedAt && (
                   <p style={{ marginTop: '5px', fontSize: '0.75rem', color: '#cbd5e1' }}>
                     Last redeemed: {new Date(loyalty.lastRedeemedAt).toLocaleDateString()}
                   </p>
                 )}
              </form>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Loyalty;
