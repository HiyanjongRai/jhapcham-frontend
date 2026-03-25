import React, { useState, useEffect } from "react";
import { 
  Truck, 
  Search, 
  MapPin, 
  Calendar, 
  Package,
  ExternalLink,
  Printer,
} from "lucide-react";
import "./seller.css";
import { API_BASE } from "../config/config";
import { getCurrentUserId } from "../../utils/authUtils";

export default function SellerShipments() {
    const [shipments, setShipments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("ALL");
    const [searchQuery, setSearchQuery] = useState("");
    const sellerId = getCurrentUserId();

    useEffect(() => {
        const mockShipments = [
            { 
                id: "SHP-9021", 
                orderId: "ORD-8821", 
                customer: "Hiyan Jong Rai", 
                status: "IN_TRANSIT", 
                carrier: "Porto Express", 
                trackingNo: "PX774421098",
                date: "2024-03-15",
                dest: "Lalitpur, Nepal"
            },
            { 
                id: "SHP-8954", 
                orderId: "ORD-8711", 
                customer: "Anita Sharma", 
                status: "DELIVERED", 
                carrier: "GHT Logistics", 
                trackingNo: "GHT0021334",
                date: "2024-03-12",
                dest: "Kathmandu, Nepal"
            },
            { 
                id: "SHP-9102", 
                orderId: "ORD-8902", 
                customer: "Bikash Gurung", 
                status: "LABEL_CREATED", 
                carrier: "Porto Express", 
                trackingNo: "PENDING",
                date: "2024-03-17",
                dest: "Pokhara, Nepal"
            }
        ];
        
        setTimeout(() => {
            setShipments(mockShipments);
            setLoading(false);
        }, 600);
    }, []);

    const statusFilters = ["ALL", "IN_TRANSIT", "LABEL_CREATED", "DELIVERED"];

    const filtered = shipments.filter(s => {
        const matchesFilter = filter === "ALL" || s.status === filter;
        const matchesSearch = !searchQuery || 
            s.trackingNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.customer.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const getStatusClass = (status) => {
        const map = {
            IN_TRANSIT:    "in_transit",
            DELIVERED:     "delivered",
            LABEL_CREATED: "label_created",
        };
        return map[status] || "pending";
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                <div className="so-spinner"></div>
            </div>
        );
    }

    return (
        <div className="dashboard-content-inner fade-in">
            {/* ── Page Header ── */}
            <div className="dash-header-row">
                <div>
                    <h2 className="gt-h3" style={{ textTransform: 'uppercase', margin: 0 }}>
                        Logistics &amp; Shipments
                    </h2>
                    <p className="text-gray gt-note" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '3px' }}>
                        Track your outbound parcels and courier status
                    </p>
                </div>
                <button className="btn-secondary-outline">
                    <Printer size={14} style={{ marginRight: '6px' }} /> Bulk Print Labels
                </button>
            </div>

            {/* ── Stats Cards ── */}
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '20px' }}>
                <div className="stat-card">
                    <div className="stat-info">
                        <div className="stat-label-row">
                            <div className="stat-icon-wrap" style={{ background: '#e0f2fe', color: '#0369a1' }}>
                                <Truck size={18} />
                            </div>
                            <span className="stat-label gt-note">In Transit</span>
                        </div>
                        <h3 className="stat-value gt-h3">{shipments.filter(s => s.status === 'IN_TRANSIT').length}</h3>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-info">
                        <div className="stat-label-row">
                            <div className="stat-icon-wrap" style={{ background: '#fef3c7', color: '#92400e' }}>
                                <Package size={18} />
                            </div>
                            <span className="stat-label gt-note">Labels to Print</span>
                        </div>
                        <h3 className="stat-value gt-h3">{shipments.filter(s => s.status === 'LABEL_CREATED').length}</h3>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-info">
                        <div className="stat-label-row">
                            <div className="stat-icon-wrap" style={{ background: 'var(--dash-success-fade)', color: 'var(--dash-success)' }}>
                                <Calendar size={18} />
                            </div>
                            <span className="stat-label gt-note">Delivered (30d)</span>
                        </div>
                        <h3 className="stat-value gt-h3">{shipments.filter(s => s.status === 'DELIVERED').length}</h3>
                    </div>
                </div>
            </div>

            {/* ── Main Panel ── */}
            <div className="dashboard-panel">
                {/* Filters + Search Row */}
                <div className="panel-header" style={{ borderBottom: '1px solid var(--dash-border)', paddingBottom: '14px', marginBottom: '0' }}>
                    {/* Filter Tabs */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {statusFilters.map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                style={{
                                    background: filter === f ? 'var(--dash-text)' : 'transparent',
                                    color: filter === f ? '#fff' : 'var(--dash-text-muted)',
                                    border: '1px solid',
                                    borderColor: filter === f ? 'var(--dash-text)' : 'var(--dash-border)',
                                    padding: '5px 12px',
                                    fontSize: '0.62rem',
                                    fontWeight: '700',
                                    fontFamily: 'var(--font-open)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.04em',
                                    cursor: 'pointer',
                                    borderRadius: 'var(--dash-radius-sm)',
                                    transition: 'all 0.2s',
                                }}
                            >
                                {f.replace(/_/g, ' ')}
                            </button>
                        ))}
                    </div>

                    {/* Search Box */}
                    <div className="dash-search-box" style={{ width: '220px' }}>
                        <Search size={14} color="#94a3b8" />
                        <input
                            type="text"
                            placeholder="Tracking No, Order..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            style={{ fontSize: '0.78rem' }}
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="recent-orders-table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
                    <table className="simple-table">
                        <thead>
                            <tr style={{ background: 'transparent' }}>
                                <th className="gt-note">Shipment ID</th>
                                <th className="gt-note">Order</th>
                                <th className="gt-note">Carrier / Tracking</th>
                                <th className="gt-note">Destination</th>
                                <th className="gt-note">Status</th>
                                <th className="gt-note" style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length > 0 ? filtered.map(shp => (
                                <tr key={shp.id}>
                                    <td className="ad-id gt-caption">{shp.id}</td>
                                    <td>
                                        <div className="gt-caption" style={{ fontWeight: 700, color: 'var(--dash-text)' }}>{shp.orderId}</div>
                                        <div className="gt-note" style={{ color: 'var(--dash-text-muted)', marginTop: '2px' }}>{shp.customer}</div>
                                    </td>
                                    <td>
                                        <div className="gt-caption" style={{ fontWeight: 700, color: 'var(--dash-text)' }}>{shp.carrier}</div>
                                        <div className="gt-note" style={{ color: 'var(--dash-primary)', fontWeight: 700, marginTop: '2px' }}>
                                            {shp.trackingNo}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--dash-text-muted)', fontSize: '0.78rem' }}>
                                            <MapPin size={11} /> {shp.dest}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${getStatusClass(shp.status)}`}>
                                            {shp.status.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'inline-flex', gap: '4px' }}>
                                            <button
                                                style={{
                                                    width: '30px', height: '30px', border: '1px solid var(--dash-border)',
                                                    background: '#fff', cursor: 'pointer', borderRadius: 'var(--dash-radius-sm)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    transition: 'all 0.2s', color: 'var(--dash-text-muted)'
                                                }}
                                                title="View Tracking"
                                                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--dash-primary)'; e.currentTarget.style.color = 'var(--dash-primary)'; }}
                                                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--dash-border)'; e.currentTarget.style.color = 'var(--dash-text-muted)'; }}
                                            >
                                                <ExternalLink size={13} />
                                            </button>
                                            <button
                                                style={{
                                                    width: '30px', height: '30px', border: '1px solid var(--dash-border)',
                                                    background: '#fff', cursor: 'pointer', borderRadius: 'var(--dash-radius-sm)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    transition: 'all 0.2s', color: 'var(--dash-text-muted)'
                                                }}
                                                title="Print Label"
                                                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--dash-primary)'; e.currentTarget.style.color = 'var(--dash-primary)'; }}
                                                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--dash-border)'; e.currentTarget.style.color = 'var(--dash-text-muted)'; }}
                                            >
                                                <Printer size={13} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="6" className="empty-text">
                                        No shipments found for this filter.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
