import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { CheckCircle, XCircle } from 'lucide-react';

const PaymentStatusPage = ({ provider, status }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const verifyPayment = async () => {
      if (status === 'failure') {
        setVerifying(false);
        setResult({ success: false, message: 'Payment failed or cancelled by user.' });
        return;
      }

      // eSewa V2 returns ?data=BASE64_STRING
      const dataParam = searchParams.get('data');

      if (dataParam) {
          try {
            await api.post('/api/payment/verify/esewa', { data: dataParam });
            setResult({ success: true, message: 'Payment verification successful!' });
            
            // Auto Redirect
            setTimeout(() => {
               navigate('/order-success');
            }, 3000);
          } catch (err) {
            setResult({ 
                success: false, 
                message: err.response?.data?.message || 'Payment verification failed on server.' 
            });
          } finally {
            setVerifying(false);
          }
          return;
      }

      // Khalti returns ?pidx=...&transaction_id=...
      const pidx = searchParams.get('pidx');
      const transactionId = searchParams.get('transaction_id');

      if (pidx) {
          try {
             // Validate with Backend
             await api.post('/api/payment/verify/khalti', { pidx: pidx });
             setResult({ success: true, message: 'Khalti Payment Verified Successfully!' });
             
             // Auto Redirect
             setTimeout(() => {
                navigate('/order-success');
             }, 3000);
          } catch (err) {
             setResult({ 
                 success: false, 
                 message: 'Khalti Verification Failed. ' + (err.response?.data?.message || '') 
             });
          } finally {
             setVerifying(false);
          }
          return;
      }

      // Legacy or Error fallback
      setVerifying(false); // only if neither data (esewa) nor pidx (khalti) found
      if (!dataParam) {
        setResult({ success: false, message: 'Invalid callback parameters.' });
      }
    };

    if (provider === 'esewa' || provider === 'khalti') {
        // We can ignore 'provider' usage actually, just check params.
        // But if routing is strictly /payment/esewa_success etc. we might need care.
        // For now, simple check logic works for both on same component.
        verifyPayment();
    }
  }, [provider, status, searchParams, navigate]);

  return (
    <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '80vh', 
        flexDirection: 'column', 
        textAlign: 'center', 
        padding: '20px' 
    }}>
      {verifying ? (
        <div style={{textAlign: 'center'}}>
            <div className="spinner-border text-primary" role="status" style={{width: '3rem', height: '3rem', marginBottom: '20px'}}></div>
            <h2>Verifying Payment...</h2>
            <p>Please do not close this window.</p>
        </div>
      ) : result?.success ? (
         <div className="fade-in">
            <CheckCircle size={64} color="#10b981" style={{marginBottom: '20px'}} />
            <h2 style={{color: '#10b981'}}>Payment Successful!</h2>
            <p>{result.message}</p>
            <p className="text-muted">Redirecting to order summary...</p>
         </div>
      ) : (
         <div className="fade-in">
            <XCircle size={64} color="#ef4444" style={{marginBottom: '20px'}} />
            <h2 style={{color: '#ef4444'}}>Payment Failed</h2>
            <p>{result?.message || 'Transaction could not be completed.'}</p>
            <button 
                onClick={() => navigate('/checkout')} 
                style={{
                    padding: '12px 24px', 
                    marginTop: '20px', 
                    background: '#0f172a', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '50px', 
                    fontWeight: 'bold',
                    cursor: 'pointer'
                }}
            >
                Return to Checkout
            </button>
         </div>
      )}
    </div>
  );
};

export default PaymentStatusPage;
