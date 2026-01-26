import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ArrowRight, Tag } from 'lucide-react';
import { API_BASE } from '../config/config';
import axios from 'axios';
import './CampaignsPage.css';

const CampaignsPage = () => {
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCampaigns = async () => {
            try {
                // Using the public endpoint /api/campaigns
                const res = await axios.get(`${API_BASE}/api/campaigns`); 
                setCampaigns(Array.isArray(res.data) ? res.data : []);
            } catch (err) {
                console.error("Failed to fetch campaigns", err);
            } finally {
                setLoading(false);
            }
        };

        fetchCampaigns();
    }, []);

    if (loading) {
        return (
            <div className="campaigns-loading">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="campaigns-page">
            <div className="campaigns-header">
                <h1>Exclusive Campaigns</h1>
                <p>Discover our special events and limited-time offers.</p>
            </div>

            <div className="campaigns-grid">
                {campaigns.length > 0 ? (
                    campaigns.map(campaign => (
                        <div key={campaign.id} className="campaign-card" onClick={() => navigate(`/products?campaign=${campaign.id}`)}>
                            <div className="campaign-content">
                                <span className="campaign-type-label">{campaign.type?.replace(/_/g, ' ')}</span>
                                <h2>{campaign.name}</h2>
                                <p className="campaign-date">Ends: {new Date(campaign.endTime).toLocaleDateString()}</p>
                                
                                <button className="view-campaign-btn">
                                    VIEW DEALS <ArrowRight size={14} />
                                </button>
                            </div>

                            <div className="campaign-image-wrapper">
                                {campaign.imagePath ? (
                                    <img 
                                        src={campaign.imagePath.startsWith('http') ? campaign.imagePath : `${API_BASE}/${campaign.imagePath}`} 
                                        alt={campaign.name} 
                                    />
                                ) : (
                                    <div className="campaign-placeholder">
                                         <Tag size={48} color="#cbd5e1" />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="no-campaigns">
                        <Tag size={64} className="no-camp-icon" />
                        <h3>No Active Campaigns</h3>
                        <p>Stay tuned for our upcoming sales events!</p>
                        <button className="back-btn" onClick={() => navigate('/')}>Back to Shop</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CampaignsPage;
