// Invoice Download Component
import React from 'react';
import { Download, Mail, Eye } from 'lucide-react';
import { generateInvoicePDF, requestInvoiceEmail } from '../../utils/invoiceUtils';
import './InvoiceActions.css';

export default function InvoiceActions({ order, onSuccess }) {
  const [loading, setLoading] = React.useState(false);

  const handleDownloadInvoice = async () => {
    setLoading(true);
    const result = await generateInvoicePDF(order);
    setLoading(false);
    if (result.success && onSuccess) {
      onSuccess(result.message);
    }
  };

  const handleEmailInvoice = async () => {
    const email = localStorage.getItem('userEmail');
    if (!email) {
      alert('Email not found');
      return;
    }
    setLoading(true);
    const result = await requestInvoiceEmail(order.orderId || order.id, email);
    setLoading(false);
    if (result.success && onSuccess) {
      onSuccess(result.message);
    }
  };

  return (
    <div className="invoice-actions-container">
      <button
        className="invoice-action-btn download"
        onClick={handleDownloadInvoice}
        disabled={loading}
        title="Download invoice as PDF"
      >
        <Download size={18} />
        <span>Download Invoice</span>
      </button>

      <button
        className="invoice-action-btn email"
        onClick={handleEmailInvoice}
        disabled={loading}
        title="Send invoice to your email"
      >
        <Mail size={18} />
        <span>Email Invoice</span>
      </button>

      <button
        className="invoice-action-btn view"
        title="Preview invoice"
      >
        <Eye size={18} />
        <span>Preview</span>
      </button>
    </div>
  );
}
