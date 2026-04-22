
import React, { useState } from 'react';
import { 
  Mail, Phone, MapPin, Send, 
  CheckCircle, Facebook, Instagram, Twitter, 
  Linkedin, Youtube, MessageSquare, Globe
} from 'lucide-react';
import './ContactUs.css';

const ContactUs = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
    });
    const [status, setStatus] = useState('idle');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setStatus('submitting');
        setTimeout(() => {
            setStatus('success');
            setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
            setTimeout(() => setStatus('idle'), 5000);
        }, 1200);
    };

    return (
        <div className="contact-page-wrapper">
            <section className="contact-hero">
                <div className="contact-hero-content">
                    <span className="contact-badge">GET IN TOUCH</span>
                    <h1>Let's Start a <span>Conversation</span></h1>
                    <p>Experience the future of e-commerce support. Our team of experts is ready to assist you with a premium, personalized approach.</p>
                </div>
            </section>

            <div className="contact-main-grid">
                <aside className="contact-sidebar">
                    <div className="glass-info-card" style={{ borderLeft: '4px solid #00b4d8' }}>
                         <h3>About Jhapcham</h3>
                         <p style={{ fontSize: '0.9rem', lineHeight: '1.6', color: '#64748b' }}>
                            Jhapcham is Nepal's premier curated marketplace, dedicated to bringing premium global brands and 
                            high-quality local craftsmanship to your doorstep. We believe in high-speed, secure, and 
                            personalized shopping experiences that redefine the modern standard of e-commerce.
                         </p>
                    </div>

                    <div className="glass-info-card">
                        <div className="info-card-icon" style={{ color: '#00b4d8' }}>
                            <MapPin size={22} />
                        </div>
                        <h3>Flagship Office</h3>
                        <p>Jhapcham Tower, 4th Floor</p>
                        <p>Plaza Road, Kathmandu</p>
                        <p>Nepal, 44600</p>
                    </div>

                    <div className="glass-info-card">
                        <div className="info-card-icon" style={{ color: '#22c55e' }}>
                            <Phone size={22} />
                        </div>
                        <h3>Concierge Line</h3>
                        <p>+977 1 4423567</p>
                        <p>+977 980 123 4567</p>
                        <p style={{marginTop: '8px', opacity: 0.6, fontSize: '0.8rem'}}>Toll Free: 1800-JHAPCHAM</p>
                    </div>

                    <div className="glass-info-card">
                        <div className="info-card-icon" style={{ color: '#f59e0b' }}>
                            <Mail size={22} />
                        </div>
                        <h3>Digital Support</h3>
                        <p>hello@jhapcham.com</p>
                        <p>concierge@jhapcham.com</p>
                    </div>

                    <div className="glass-info-card" style={{ background: '#0f172a', color: '#fff' }}>
                        <div className="info-card-icon" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}>
                            <Globe size={22} />
                        </div>
                        <h3 style={{ color: '#fff' }}>Global Presence</h3>
                        <p style={{ color: '#94a3b8' }}>London · New York · Dubai</p>
                        <p style={{ color: '#94a3b8' }}>Expansion 2026</p>
                    </div>
                </aside>

                <div className="contact-form-premium-card">
                    {status === 'success' ? (
                        <div style={{ textAlign: 'center', padding: '60px 0' }}>
                            <div style={{ background: '#f0fdf4', width: '100px', height: '100px', borderRadius: '50%', margin: '0 auto 30px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22c55e' }}>
                                <CheckCircle size={50} />
                            </div>
                            <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '15px' }}>Inquiry Received</h2>
                            <p style={{ color: '#64748b', fontSize: '1.1rem', maxWidth: '400px', margin: '0 auto' }}>Your message has been assigned to our concierge team. We will reach out within the hour.</p>
                            <button className="premium-submit-btn" style={{ maxWidth: '250px', margin: '40px auto 0' }} onClick={() => setStatus('idle')}>
                                Return to Forms
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <h2 className="premium-title">Send a Request</h2>
                            <p className="premium-sub">Fill out the details below and experience our priority response system.</p>

                            <div className="premium-form-row">
                                <div className="premium-input-group">
                                    <label className="premium-label">Full Name</label>
                                    <input 
                                        type="text" 
                                        name="name" 
                                        className="premium-input" 
                                        placeholder="Enter your name" 
                                        required 
                                        value={formData.name}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="premium-input-group">
                                    <label className="premium-label">Email Context</label>
                                    <input 
                                        type="email" 
                                        name="email" 
                                        className="premium-input" 
                                        placeholder="email@example.com" 
                                        required 
                                        value={formData.email}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="premium-form-row">
                                <div className="premium-input-group">
                                    <label className="premium-label">Phone Support</label>
                                    <input 
                                        type="text" 
                                        name="phone" 
                                        className="premium-input" 
                                        placeholder="+977 98..." 
                                        value={formData.phone}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="premium-input-group">
                                    <label className="premium-label">Interest Topic</label>
                                    <select className="premium-input" name="subject" value={formData.subject} onChange={handleChange} required>
                                        <option value="">Select Topic</option>
                                        <option value="Sales">General Sales</option>
                                        <option value="Partnership">Business Partnership</option>
                                        <option value="Seller">Selling on Jhapcham</option>
                                        <option value="Legal">Legal & Privacy</option>
                                        <option value="Other">Other Inquiry</option>
                                    </select>
                                </div>
                            </div>

                            <div className="premium-input-group" style={{ marginTop: '25px' }}>
                                <label className="premium-label">How can we assist you?</label>
                                <textarea 
                                    name="message" 
                                    className="premium-input premium-textarea" 
                                    placeholder="Briefly describe your request..." 
                                    required
                                    value={formData.message}
                                    onChange={handleChange}
                                ></textarea>
                            </div>

                            <button type="submit" className="premium-submit-btn" disabled={status === 'submitting'}>
                                {status === 'submitting' ? 'Synthesizing...' : (
                                    <>
                                        Submit Request <Send size={20} />
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    <div className="contact-social-bar">
                        <h4>Connect with us</h4>
                        <div className="social-icons-flex">
                            <div className="social-circle-btn"><Facebook size={20} /></div>
                            <div className="social-circle-btn"><Instagram size={20} /></div>
                            <div className="social-circle-btn"><Twitter size={20} /></div>
                            <div className="social-circle-btn"><Linkedin size={20} /></div>
                            <div className="social-circle-btn"><Youtube size={20} /></div>
                            <div className="social-circle-btn"><MessageSquare size={20} /></div>
                        </div>
                    </div>
                </div>
            </div>

            <section className="contact-map-premium">
                <iframe 
                    title="Jhapcham HQ"
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d56516.31625951306!2d85.2911132!3d27.7089559!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39eb198a307baabf%3A0xb5137c1bf18db1ea!2sKathmandu!5e0!3m2!1sen!2snp!4v1711860000000!5m2!1sen!2snp" 
                    width="100%" 
                    height="100%" 
                    style={{ border: 0 }} 
                    allowFullScreen="" 
                    loading="lazy" 
                ></iframe>
            </section>
        </div>
    );
};

export default ContactUs;
