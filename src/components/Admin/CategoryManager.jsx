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
        <div className="adm-categories-manager">
            <div className="adm-header">
                <div>
                    <h1 className="adm-page-title">Category Manager</h1>
                    <p className="adm-page-sub">Manage product hierarchy and descriptions</p>
                </div>
                {!isAdding && (
                    <button className="adm-panel-btn primary" onClick={() => setIsAdding(true)}>
                        <Plus size={18} /> Add Category
                    </button>
                )}
            </div>

            {isAdding && (
                <div className="adm-chart-card" style={{ marginBottom: '24px' }}>
                    <div className="adm-chart-header">
                        <h3>{editingId ? "Edit Category" : "New Category"}</h3>
                        <button className="adm-close-btn" onClick={resetForm}><X size={18}/></button>
                    </div>
                    
                    <div className="adm-panel-actions" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                            <label className="adm-form-label">Category Name</label>
                            <input 
                                className="adm-select" 
                                style={{ width: '100%', boxSizing: 'border-box' }}
                                value={formData.name} 
                                onChange={e => setFormData({...formData, name: e.target.value})} 
                                placeholder="e.g. Electronics"
                            />
                        </div>
                        <div>
                            <label className="adm-form-label">Description</label>
                            <input 
                                className="adm-select" 
                                style={{ width: '100%', boxSizing: 'border-box' }}
                                value={formData.description} 
                                onChange={e => setFormData({...formData, description: e.target.value})} 
                                placeholder="Short description..."
                            />
                        </div>
                    </div>
                    
                    <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
                        <button className="adm-submit-btn" style={{ width: 'auto', padding: '10px 24px' }} onClick={handleSave}>
                            {editingId ? "Update Category" : "Create Category"}
                        </button>
                        <button className="adm-panel-btn warn" style={{ width: 'auto', padding: '10px 24px' }} onClick={resetForm}>
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            <div className="adm-table-card">
                <div className="adm-table-filters">
                    <span>{categories.length} Categories Total</span>
                </div>
                
                {loading ? (
                    <div className="adm-loader">
                        <Plus size={32} className="spinning" />
                        <p>Synchronizing Categories...</p>
                    </div>
                ) : (
                    <div className="adm-table-body">
                        {categories.map(cat => (
                            <div key={cat.id} className="adm-row">
                                <div className="adm-row-avatar">
                                    {cat.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="adm-row-info">
                                    <h4 className="adm-row-title">{cat.name}</h4>
                                    <p className="adm-row-sub">{cat.description || "No description provided."}</p>
                                    <div style={{ marginTop: '6px' }}>
                                        <span className="adm-report-type-badge">ID: #{cat.id}</span>
                                    </div>
                                </div>
                                <div className="adm-row-actions">
                                    <button className="adm-icon-btn" onClick={() => startEdit(cat)} title="Edit">
                                        <Edit2 size={16} />
                                    </button>
                                    <button className="adm-icon-btn danger" onClick={() => handleDelete(cat.id)} title="Delete">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {categories.length === 0 && (
                            <div className="adm-empty-state">
                                <h3>No Categories Found</h3>
                                <p>Get started by creates your first product category.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CategoryManager;
