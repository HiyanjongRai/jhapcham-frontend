// Invoice Generation Utility
import api from "../api/axios";

export const generateInvoicePDF = async (order) => {
  try {
    const response = await api.post(
      `/api/invoices/generate`,
      {
        orderId: order.orderId || order.id,
        userId: localStorage.getItem("userId")
      },
      { responseType: "blob" }
    );

    // Create blob URL and download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Invoice-${order.orderId || order.id}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);

    return { success: true, message: "Invoice downloaded successfully" };
  } catch (error) {
    console.error("Invoice generation error:", error);
    return { success: false, message: "Failed to generate invoice", error };
  }
};

export const requestInvoiceEmail = async (orderId, email) => {
  try {
    const response = await api.post(`/api/invoices/email`, {
      orderId,
      email
    });
    return { success: true, message: "Invoice sent to your email", data: response.data };
  } catch (error) {
    console.error("Email invoice error:", error);
    return { success: false, message: "Failed to send invoice", error };
  }
};

export const getInvoiceHistory = async (userId) => {
  try {
    const response = await api.get(`/api/invoices/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Invoice history error:", error);
    return [];
  }
};

export const redownloadInvoice = async (invoiceId) => {
  try {
    const response = await api.get(
      `/api/invoices/${invoiceId}/download`,
      { responseType: "blob" }
    );

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Invoice-${invoiceId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);

    return { success: true };
  } catch (error) {
    console.error("Download invoice error:", error);
    return { success: false, error };
  }
};
