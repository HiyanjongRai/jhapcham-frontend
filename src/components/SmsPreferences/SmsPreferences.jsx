import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import smsApi from '../../api/smsApi';
import './SmsPreferences.css';
import { 
  MessageSquare, BellRing, PackageCheck, Truck, 
  Box, RotateCw, AlertTriangle, Tag, Save, ZapOff, CheckCircle 
} from 'lucide-react';

const SmsPreferences = () => {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const data = await smsApi.getPreferences();
      setPreferences(data);
    } catch (error) {
      toast.error('Failed to load SMS preferences');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreferenceChange = (key) => {
    // If master switch is off, do not allow changing individual items visually
    if (!preferences?.allSmsEnabled && key !== 'allSmsEnabled') {
      toast.info('Enable Master SMS Switch first');
      return;
    }
    
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSavePreferences = async () => {
    try {
      setSaving(true);
      await smsApi.updatePreferences(preferences);
      toast.success('SMS preferences updated successfully!');
    } catch (error) {
      toast.error('Failed to save preferences');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleEnableAll = async () => {
    try {
      setSaving(true);
      const data = await smsApi.enableAllSms();
      setPreferences(data);
      toast.success('All SMS notifications enabled!');
    } catch (error) {
      toast.error('Failed to enable all SMS');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleDisableAll = async () => {
    try {
      setSaving(true);
      const data = await smsApi.disableAllSms();
      setPreferences(data);
      toast.success('All SMS notifications disabled!');
    } catch (error) {
      toast.error('Failed to disable all SMS');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="sms-pref-wrap" style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!preferences) return null;

  const isGlobalDisabled = !preferences.allSmsEnabled;

  return (
    <div className="sms-pref-wrap">
      {/* Hero Header */}
      <div className="sms-pref-hero">
        <div className="sms-pref-header-content">
          <div className="sms-icon-wrap">
            <MessageSquare size={28} />
          </div>
          <div className="sms-header-text">
            <h1>SMS Preferences</h1>
            <p>Control exactly what hits your inbox.</p>
          </div>
        </div>

        <div className="sms-master-switch">
          <label className="lux-toggle">
            <span className="sms-master-lbl">Master Switch</span>
            <input 
              type="checkbox" 
              checked={preferences.allSmsEnabled} 
              onChange={() => handlePreferenceChange('allSmsEnabled')}
            />
            <div className="toggle-track"><div className="toggle-thumb" /></div>
          </label>
        </div>
      </div>

      {/* Grid Container */}
      <div className="sms-grid-card">
        <div className="sms-grid" style={{ opacity: isGlobalDisabled ? 0.6 : 1, transition: 'opacity 0.3s' }}>
          
          <div className={`sms-item-card ${preferences.orderConfirmation && !isGlobalDisabled ? 'active' : ''}`}>
             <div className="sms-item-info">
                <div className="sms-item-icon"><PackageCheck size={20} /></div>
                <div className="sms-item-text">
                   <h4>Order Confirmations</h4>
                   <p>Get SMS when your order is backed by an OTP</p>
                </div>
             </div>
             <label className="light-toggle">
               <input type="checkbox" checked={preferences.orderConfirmation} disabled={isGlobalDisabled} onChange={() => handlePreferenceChange('orderConfirmation')} />
               <div className="toggle-track"><div className="toggle-thumb" /></div>
             </label>
          </div>

          <div className={`sms-item-card ${preferences.shipmentUpdates && !isGlobalDisabled ? 'active' : ''}`}>
             <div className="sms-item-info">
                <div className="sms-item-icon"><Truck size={20} /></div>
                <div className="sms-item-text">
                   <h4>Shipment Updates</h4>
                   <p>Track your shipment status in real-time</p>
                </div>
             </div>
             <label className="light-toggle">
               <input type="checkbox" checked={preferences.shipmentUpdates} disabled={isGlobalDisabled} onChange={() => handlePreferenceChange('shipmentUpdates')} />
               <div className="toggle-track"><div className="toggle-thumb" /></div>
             </label>
          </div>

          <div className={`sms-item-card ${preferences.deliveryNotifications && !isGlobalDisabled ? 'active' : ''}`}>
             <div className="sms-item-info">
                <div className="sms-item-icon"><Box size={20} /></div>
                <div className="sms-item-text">
                   <h4>Delivery Alerts</h4>
                   <p>Receive delivery OTP and confirmation</p>
                </div>
             </div>
             <label className="light-toggle">
               <input type="checkbox" checked={preferences.deliveryNotifications} disabled={isGlobalDisabled} onChange={() => handlePreferenceChange('deliveryNotifications')} />
               <div className="toggle-track"><div className="toggle-thumb" /></div>
             </label>
          </div>

          <div className={`sms-item-card ${preferences.refundAlerts && !isGlobalDisabled ? 'active' : ''}`}>
             <div className="sms-item-info">
                <div className="sms-item-icon"><RotateCw size={20} /></div>
                <div className="sms-item-text">
                   <h4>Refund Alerts</h4>
                   <p>Instant SMS when your money is returned</p>
                </div>
             </div>
             <label className="light-toggle">
               <input type="checkbox" checked={preferences.refundAlerts} disabled={isGlobalDisabled} onChange={() => handlePreferenceChange('refundAlerts')} />
               <div className="toggle-track"><div className="toggle-thumb" /></div>
             </label>
          </div>

          <div className={`sms-item-card ${preferences.disputeAlerts && !isGlobalDisabled ? 'active' : ''}`}>
             <div className="sms-item-info">
                <div className="sms-item-icon"><AlertTriangle size={20} /></div>
                <div className="sms-item-text">
                   <h4>Dispute Alerts</h4>
                   <p>Stay informed about resolution status</p>
                </div>
             </div>
             <label className="light-toggle">
               <input type="checkbox" checked={preferences.disputeAlerts} disabled={isGlobalDisabled} onChange={() => handlePreferenceChange('disputeAlerts')} />
               <div className="toggle-track"><div className="toggle-thumb" /></div>
             </label>
          </div>

          <div className={`sms-item-card ${preferences.promotionalSms && !isGlobalDisabled ? 'active' : ''}`}>
             <div className="sms-item-info">
                <div className="sms-item-icon"><Tag size={20} /></div>
                <div className="sms-item-text">
                   <h4>Promotions</h4>
                   <p>Special VIP offers and holiday deals</p>
                </div>
             </div>
             <label className="light-toggle">
               <input type="checkbox" checked={preferences.promotionalSms} disabled={isGlobalDisabled} onChange={() => handlePreferenceChange('promotionalSms')} />
               <div className="toggle-track"><div className="toggle-thumb" /></div>
             </label>
          </div>
          
          {preferences.inventoryAlerts !== undefined && preferences.inventoryAlerts !== null && (
            <div className={`sms-item-card ${preferences.inventoryAlerts && !isGlobalDisabled ? 'active' : ''}`}>
               <div className="sms-item-info">
                  <div className="sms-item-icon"><BellRing size={20} /></div>
                  <div className="sms-item-text">
                     <h4>Inventory Alerts</h4>
                     <p>Stock notifications for your products</p>
                  </div>
               </div>
               <label className="light-toggle">
                 <input type="checkbox" checked={preferences.inventoryAlerts} disabled={isGlobalDisabled} onChange={() => handlePreferenceChange('inventoryAlerts')} />
                 <div className="toggle-track"><div className="toggle-thumb" /></div>
               </label>
            </div>
          )}

        </div>

        <div className="sms-actions-footer">
           <button className="sms-btn sms-btn-danger" onClick={handleDisableAll} disabled={saving || isGlobalDisabled}>
             <ZapOff size={16} /> Block All
           </button>
           <button className="sms-btn sms-btn-success" onClick={handleEnableAll} disabled={saving || (!isGlobalDisabled && preferences.orderConfirmation && preferences.promotionalSms)}>
             <CheckCircle size={16} /> Opt In All
           </button>
           <button className="sms-btn sms-btn-save" onClick={handleSavePreferences} disabled={saving}>
             <Save size={16} /> {saving ? 'Saving...' : 'Save Settings'}
           </button>
        </div>
      </div>
    </div>
  );
};

export default SmsPreferences;
