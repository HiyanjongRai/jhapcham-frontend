// Data Export Utility
import api from "../api/axios";

export const exportOrderHistoryCSV = async (userId) => {
  try {
    const response = await api.get(
      `/api/export/orders/${userId}?format=csv`,
      { responseType: "blob" }
    );

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `order-history-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);

    return { success: true, message: "Order history exported successfully" };
  } catch (error) {
    console.error("CSV export error:", error);
    return { success: false, message: "Failed to export CSV", error };
  }
};

export const exportOrderHistoryPDF = async (userId) => {
  try {
    const response = await api.get(
      `/api/export/orders/${userId}?format=pdf`,
      { responseType: "blob" }
    );

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `order-history-${new Date().toISOString().split('T')[0]}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);

    return { success: true, message: "Order history exported successfully" };
  } catch (error) {
    console.error("PDF export error:", error);
    return { success: false, message: "Failed to export PDF", error };
  }
};

export const exportPersonalData = async (userId) => {
  try {
    const response = await api.get(
      `/api/export/personal-data/${userId}?format=json`,
      { responseType: "blob" }
    );

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `personal-data-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);

    return { success: true, message: "Personal data exported successfully" };
  } catch (error) {
    console.error("Personal data export error:", error);
    return { success: false, message: "Failed to export data", error };
  }
};

export const exportAccountSummary = async (userId) => {
  try {
    const response = await api.get(`/api/export/account-summary/${userId}`);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error("Account summary error:", error);
    return { success: false, error };
  }
};

export const requestDataDeletion = async (userId, password) => {
  try {
    const response = await api.post(`/api/export/request-deletion`, {
      userId,
      password
    });
    return { success: true, message: "Data deletion request submitted. You will receive a confirmation email." };
  } catch (error) {
    console.error("Deletion request error:", error);
    return { success: false, error };
  }
};

export const downloadPersonalDataArchive = async (userId) => {
  try {
    const response = await api.get(
      `/api/export/data-archive/${userId}`,
      { responseType: "blob" }
    );

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `personal-data-archive-${new Date().toISOString().split('T')[0]}.zip`);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);

    return { success: true, message: "Data archive downloaded successfully" };
  } catch (error) {
    console.error("Data archive error:", error);
    return { success: false, error };
  }
};
