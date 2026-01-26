import React, { useState, useEffect } from "react";
import "./AdminDashboard.css";
import { API_BASE } from "../config/config";
import axios from "../../api/axios";
import { Plus, Trash2, Edit2, Save, X } from "lucide-react";

const CategoryManager = ({ showToast }) => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ name: "", description: "" });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE}/api/categories`);
            setCategories(res.data);
        } catch (err) {
            console.error("Failed to load categories", err);
            showToast("Failed to load categories", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.name) return showToast("Category Name is required", "error");
        
        try {
            if (editingId) {
                const res = await axios.put(`${API_BASE}/api/categories/${editingId}`, formData);
                setCategories(categories.map(c => c.id === editingId ? res.data : c));
                showToast("Category updated", "success");
            } else {
                const res = await axios.post(`${API_BASE}/api/categories`, formData);
                setCategories([...categories, res.data]);
                showToast("Category created", "success");
            }
            resetForm();
        } catch (err) {
            showToast(err.response?.data?.message || "Operation failed", "error");
        }
    };

    const handleDelete = async (id) => {
        if (!id) {
             console.error("Attempted to delete category with valid ID");
             return;
        }
        if (!window.confirm("Delete this category?")) return;
        try {
            await axios.delete(`${API_BASE}/api/categories/${id}`);
            setCategories(categories.filter(c => c.id !== id));
            showToast("Category deleted", "success");
        } catch (err) {
            showToast("Failed to delete category", "error");
        }
    };

    const startEdit = (cat) => {
        setFormData({ name: cat.name, description: cat.description || "" });
        setEditingId(cat.id);
        setIsAdding(true);
    };

    const resetForm = () => {
        setIsAdding(false);
        setEditingId(null);
        setFormData({ name: "", description: "" });
    };

    return (
        <div className="ad-table-container">
            <div className="ad-table-header">
                <h2>Product Categories</h2>
                {!isAdding && (
                    <button className="ad-btn-primary" onClick={() => setIsAdding(true)}>
                        <Plus size={16} /> Add New
                    </button>
                )}
            </div>

            {isAdding && (
                <div className="ad-form-panel">
                    <div className="ad-form-grid">
                        <div className="ad-input-group">
                            <label>Category Name</label>
                            <input 
                                className="ad-input" 
                                value={formData.name} 
                                onChange={e => setFormData({...formData, name: e.target.value})} 
                                placeholder="e.g. Electronics"
                            />
                        </div>
                        <div className="ad-input-group">
                            <label>Description</label>
                            <input 
                                className="ad-input" 
                                value={formData.description} 
                                onChange={e => setFormData({...formData, description: e.target.value})} 
                                placeholder="Short description..."
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button className="ad-btn-primary" onClick={handleSave}>
                                <Save size={16} /> Save
                            </button>
                            <button className="ad-btn-secondary" onClick={resetForm}>
                                <X size={16} /> Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <table className="ad-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Description</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {categories.map(cat => (
                        <tr key={cat.id}>
                            <td className="ad-id">#{cat.id}</td>
                            <td style={{ fontWeight: '600', textTransform: 'capitalize' }}>{cat.name}</td>
                            <td style={{ color: '#666', fontSize: '0.9rem' }}>{cat.description || '-'}</td>
                            <td>
                                <div className="ad-action-buttons">
                                    <button className="ad-action-btn" onClick={() => startEdit(cat)} title="Edit">
                                        <Edit2 size={16} />
                                    </button>
                                    <button className="ad-action-btn action-reject" onClick={() => handleDelete(cat.id)} title="Delete">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {categories.length === 0 && !loading && (
                        <tr><td colSpan="4" style={{ textAlign: 'center', padding: '3rem', color: '#999' }}>No categories found. Start by adding one.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default CategoryManager;
