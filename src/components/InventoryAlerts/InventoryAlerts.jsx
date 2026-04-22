import React, { useState, useEffect } from 'react';
import { Container, Alert, ListGroup, Badge, Card, Spinner, Row, Col } from 'react-bootstrap';
import { toast } from 'sonner';
import inventoryAlertsApi from '../../api/inventoryAlertsApi';
import './InventoryAlerts.css';

const InventoryAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadAlerts();
    // Refresh every 30 seconds
    const interval = setInterval(loadAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const data = await inventoryAlertsApi.getMyAlerts();
      setAlerts(data);
      const unread = data.filter(alert => !alert.acknowledged).length;
      setUnreadCount(unread);
    } catch (error) {
      toast.error('Failed to load inventory alerts');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (alertId) => {
    try {
      await inventoryAlertsApi.acknowledgeAlert(alertId);
      setAlerts(alerts.map(alert =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
      toast.success('Alert acknowledged');
    } catch (error) {
      toast.error('Failed to acknowledge alert');
      console.error(error);
    }
  };

  const getAlertTypeColor = (type) => {
    const colors = {
      LOW_STOCK: 'warning',
      RESTOCK_REMINDER: 'info',
      OUT_OF_STOCK: 'danger',
      OVERSTOCK: 'success'
    };
    return colors[type] || 'secondary';
  };

  const getAlertTypeIcon = (type) => {
    const icons = {
      LOW_STOCK: '⚠️',
      RESTOCK_REMINDER: '🔔',
      OUT_OF_STOCK: '❌',
      OVERSTOCK: '📦'
    };
    return icons[type] || '📌';
  };

  return (
    <Container fluid className="inventory-alerts-container">
      <div className="alerts-header">
        <h3>Inventory Alerts</h3>
        {unreadCount > 0 && (
          <Badge bg="danger" className="ms-2">{unreadCount} Unread</Badge>
        )}
      </div>

      {loading ? (
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      ) : alerts.length === 0 ? (
        <Alert variant="success">✅ No alerts. Your inventory is healthy!</Alert>
      ) : (
        <div className="alerts-list">
          {alerts.map(alert => (
            <Card key={alert.id} className={`alert-card ${alert.acknowledged ? 'acknowledged' : 'unread'}`}>
              <Card.Body>
                <Row>
                  <Col md={1} className="alert-icon">
                    {getAlertTypeIcon(alert.alertType)}
                  </Col>
                  <Col md={7}>
                    <div className="alert-content">
                      <div className="alert-type">
                        <Badge bg={getAlertTypeColor(alert.alertType)}>
                          {alert.alertType.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <div className="alert-message">{alert.message}</div>
                      <div className="alert-details">
                        <small className="text-muted">
                          Current Stock: {alert.currentStock} | Threshold: {alert.thresholdStock}
                        </small>
                      </div>
                      <small className="text-muted">
                        {new Date(alert.createdAt).toLocaleDateString()} at{' '}
                        {new Date(alert.createdAt).toLocaleTimeString()}
                      </small>
                    </div>
                  </Col>
                  <Col md={4} className="text-end">
                    {alert.acknowledged ? (
                      <Badge bg="success">✓ Acknowledged</Badge>
                    ) : (
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => handleAcknowledge(alert.id)}
                      >
                        Mark as Read
                      </button>
                    )}
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          ))}
        </div>
      )}
    </Container>
  );
};

export default InventoryAlerts;
