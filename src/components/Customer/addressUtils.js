import api from "../../api/axios";

// Helper for error handling
const handleApiError = (error, path) => {
  const response = error.response;
  if (response) {
    return {
      status: response.status,
      message: response.data.message || 'An error occurred',
      details: response.data.details || response.statusText,
    };
  }
  return {
    status: 500,
    message: 'Network error',
    details: 'Unable to connect to server'
  };
};

export async function apiGetAddresses(userId) {
    const path = `/api/addresses/${userId}`;
    try {
        const res = await api.get(path);
        return res.data;
    } catch(err) {
        throw handleApiError(err, path);
    }
}

export async function apiAddAddress(userId, addressData) {
    const path = `/api/addresses/${userId}`;
    try {
        const res = await api.post(path, addressData);
        return res.data;
    } catch(err) {
        throw handleApiError(err, path);
    }
}

export async function apiUpdateAddress(addressId, addressData) {
    const path = `/api/addresses/${addressId}`;
    try {
        const res = await api.put(path, addressData);
        return res.data;
    } catch(err) {
        throw handleApiError(err, path);
    }
}

export async function apiDeleteAddress(addressId) {
    const path = `/api/addresses/${addressId}`;
    try {
        await api.delete(path);
        return true;
    } catch(err) {
        throw handleApiError(err, path);
    }
}
