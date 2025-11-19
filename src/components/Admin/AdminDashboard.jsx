import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE } from "../config/config";
import "./AdminDashboard.css";

export default function AdminDashboard() {
const [pendingUsers, setPendingUsers] = useState([]);
const [loading, setLoading] = useState(true);

const fetchPendingUsers = async () => {
try {
const res = await axios.get(`${API_BASE}/api/admin/sellers/applications/pending`);
const data = res.data.map(app => ({ ...app, note: "" }));
setPendingUsers(data);
} catch (err) {
console.error("Error fetching pending users:", err);
} finally {
setLoading(false);
}
};

useEffect(() => {
fetchPendingUsers();
}, []);

const updateNote = (index, value) => {
const list = [...pendingUsers];
list[index].note = value;
setPendingUsers(list);
};

const handleAction = async (userId, action, note) => {
try {
const url = `${API_BASE}/api/admin/sellers/applications/${userId}/${action}`;
const res = await axios.post(url, { note: note });
alert(res.data.message);
fetchPendingUsers();
} catch (err) {
console.error("Error performing action:", err);
alert("Action failed. See console.");
}
};

return (
<div className="layout">

  <aside className="sidebar">
    <div className="sidebar-top">Admin Panel</div>
    <nav className="sidebar-menu">
      {["Dashboard", "Users", "Products", "Orders", "Categories", "Reports", "Settings"].map((item) => (
        <p key={item}>{item}</p>
      ))}
    </nav>
  </aside>

  <main className="main">
    <h2>Pending Sellers</h2>

    {loading ? (
      <p>Loading...</p>
    ) : pendingUsers.length === 0 ? (
      <p>No pending users</p>
    ) : (
      <table className="table">
        <thead>
          <tr>
            <th>Application ID</th>
            <th>User</th>
            <th>Store</th>
            <th>Status</th>
            <th>Note</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {pendingUsers.map((app, index) => (
            <tr key={app.id}>
              <td>{app.id}</td>
              <td>{app.user?.username || "N/A"}</td>
              <td>{app.storeName}</td>
              <td>{app.status}</td>

              <td>
                <input
                  type="text"
                  placeholder="Write note"
                  value={app.note}
                  onChange={(e) => updateNote(index, e.target.value)}
                  style={{ width: "140px" }}
                />
              </td>

              <td>
                <button onClick={() => handleAction(app.id, "approve", app.note)}>
                  Approve
                </button>

                <button onClick={() => handleAction(app.id, "reject", app.note)}>
                  Reject
                </button>
              </td>

            </tr>
          ))}
        </tbody>
      </table>
    )}

  </main>
</div>


);
}