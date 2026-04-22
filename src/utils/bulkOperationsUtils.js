// Bulk Operations Utility
import api from "../api/axios";

export const bulkAddToCart = async (userId, items) => {
  try {
    const response = await api.post(`/api/cart/bulk-add`, {
      userId,
      items
    });
    return { success: true, data: response.data, message: `${items.length} items added to cart` };
  } catch (error) {
    console.error("Bulk add error:", error);
    return { success: false, error };
  }
};

export const bulkRemoveFromWishlist = async (userId, productIds) => {
  try {
    const response = await api.post(`/api/wishlist/bulk-remove`, {
      userId,
      productIds
    });
    return { success: true, message: `${productIds.length} items removed` };
  } catch (error) {
    console.error("Bulk remove error:", error);
    return { success: false, error };
  }
};

export const bulkCancelOrders = async (userId, orderIds) => {
  try {
    const response = await api.post(`/api/orders/bulk-cancel`, {
      userId,
      orderIds
    });
    return { success: true, data: response.data, message: `${orderIds.length} orders cancelled` };
  } catch (error) {
    console.error("Bulk cancel error:", error);
    return { success: false, error };
  }
};

export const bulkMarkAsReviewed = async (userId, orderIds) => {
  try {
    const response = await api.post(`/api/orders/bulk-reviewed`, {
      userId,
      orderIds
    });
    return { success: true, message: "Orders marked as reviewed" };
  } catch (error) {
    console.error("Bulk mark reviewed error:", error);
    return { success: false, error };
  }
};

export const bulkDownloadInvoices = async (userId, orderIds) => {
  try {
    const response = await api.post(
      `/api/invoices/bulk-download`,
      { userId, orderIds },
      { responseType: "blob" }
    );

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `invoices-${new Date().getTime()}.zip`);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);

    return { success: true, message: "Invoices downloaded" };
  } catch (error) {
    console.error("Bulk download error:", error);
    return { success: false, error };
  }
};

export const bulkApplyTag = async (userId, orderIds, tag) => {
  try {
    const response = await api.post(`/api/orders/bulk-tag`, {
      userId,
      orderIds,
      tag
    });
    return { success: true, message: `Tag applied to ${orderIds.length} orders` };
  } catch (error) {
    console.error("Bulk tag error:", error);
    return { success: false, error };
  }
};

export const bulkApplyFilters = async (userId, filters) => {
  try {
    const response = await api.post(`/api/orders/bulk-filter`, {
      userId,
      filters
    });
    return response.data;
  } catch (error) {
    console.error("Bulk filter error:", error);
    return [];
  }
};

export const bulkMoveWishlistToCart = async (userId, productIds) => {
  try {
    const response = await api.post(`/api/cart/wishlist-bulk-move`, {
      userId,
      productIds
    });
    return { success: true, data: response.data, message: `${productIds.length} items moved to cart` };
  } catch (error) {
    console.error("Bulk move error:", error);
    return { success: false, error };
  }
};

export const bulkExportOrders = async (userId, orderIds, format = "csv") => {
  try {
    const response = await api.post(
      `/api/orders/bulk-export?format=${format}`,
      { userId, orderIds },
      { responseType: "blob" }
    );

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    const ext = format === "pdf" ? "pdf" : "csv";
    link.setAttribute("download", `orders-export-${new Date().getTime()}.${ext}`);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);

    return { success: true, message: "Orders exported" };
  } catch (error) {
    console.error("Bulk export error:", error);
    return { success: false, error };
  }
};
