export function getCurrentUserId() {
  try {
    const value = localStorage.getItem("userId");
    if (!value) return null;

    // Try treating it as Base64 first (standard flow)
    try {
        const decoded = window.atob(value);
        const idNum = Number(decoded);
        if (!Number.isNaN(idNum) && idNum > 0) return idNum;
    } catch (e) {
        // Not base64 or failed to decode
    }

    // Fallback: Try treating as raw number
    const rawNum = Number(value);
    return (!Number.isNaN(rawNum) && rawNum > 0) ? rawNum : null;
  } catch {
    return null;
  }
}
