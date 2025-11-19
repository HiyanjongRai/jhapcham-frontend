export function getCurrentUserId() {
  try {
    const encoded = localStorage.getItem("userId");
    if (!encoded) return null;
    const decoded = window.atob(encoded); // "MQ==" -> "1"
    const idNum = Number(decoded);
    if (Number.isNaN(idNum)) return null;
    return idNum;
  } catch (e) {
    console.error("Error decoding userId:", e);
    return null;
  }
}
