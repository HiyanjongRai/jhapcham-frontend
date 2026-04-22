import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, Alert, Spinner, Row, Col, Modal, Form } from 'react-bootstrap';
import { toast } from 'sonner';
import disputesApi from '../../api/disputesApi';

const AdminDisputesPanel = () => {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [resolution, setResolution] = useState('');
  const [stats, setStats] = useState({ total: 0, opened: 0, underReview: 0, resolved: 0 });

  useEffect(() => {
    loadDisputes();
  }, []);

  const loadDisputes = async () => {
    try {
      setLoading(true);
      const data = await disputesApi.getPendingDisputes();
      setDisputes(data);
      
      const statsData = {
        total: data.length,
        opened: data.filter(d => d.status === 'OPENED').length,
        underReview: data.filter(d => d.status === 'UNDER_REVIEW').length,
        resolved: data.filter(d => d.status === 'RESOLVED').length
      };
      setStats(statsData);
    } catch (error) {
      toast.error('Failed to load disputes');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveClick = (dispute) => {
    setSelectedDispute(dispute);
    setShowModal(true);
  };

  const handleResolve = async () => {
    if (!resolution.trim()) {
      toast.error('Please enter resolution details');
      return;
    }

    try {
      await disputesApi.resolveDispute(selectedDispute.id, { resolution });
      toast.success('Dispute resolved!');
      setShowModal(false);
      setResolution('');
      loadDisputes();
    } catch (error) {
      toast.error('Failed to resolve dispute');
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      OPENED: 'danger',
      UNDER_REVIEW: 'warning',
      EVIDENCE_REQUIRED: 'info',
      IN_DISCUSSION: 'secondary',
      RESOLVED: 'success',
      CANCELLED: 'danger'
    };
    return <Badge bg={variants[status]}>{status.replace(/_/g, ' ')}</Badge>;
  };

  return (
    <>
      <h5 className="mb-3">⚖️ Dispute Management</h5>
      
      {/* Stats */}
      <Row className="mb-3">
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h3>{stats.total}</h3>
              <small>Total Disputes</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-danger">{stats.opened}</h3>
              <small>Opened</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-warning">{stats.underReview}</h3>
              <small>Under Review</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-success">{stats.resolved}</h3>
              <small>Resolved</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {loading ? (
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      ) : (
        <Card>
          <Card.Body className="table-responsive">
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Evidence</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {disputes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center">No pending disputes</td>
                  </tr>
                ) : (
                  disputes.map(dispute => (
                    <tr key={dispute.id}>
                      <td>{dispute.orderId}</td>
                      <td>{dispute.title}</td>
                      <td>{getStatusBadge(dispute.status)}</td>
                      <td>{new Date(dispute.createdAt).toLocaleDateString()}</td>
                      <td>
                        <Badge bg="info">{dispute.evidence?.length || 0} files</Badge>
                      </td>
                      <td>
                        {dispute.status !== 'RESOLVED' && (
                          <Button 
                            size="sm" 
                            variant="primary" 
                            onClick={() => handleResolveClick(dispute)}
                          >
                            Resolve
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      {/* Resolution Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Resolve Dispute</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedDispute && (
            <>
              <p><strong>Order:</strong> {selectedDispute.orderId}</p>
              <p><strong>Title:</strong> {selectedDispute.title}</p>
              <Form.Group>
                <Form.Label>Resolution Details</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="Enter resolution details..."
                />
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleResolve}>
            Resolve
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default AdminDisputesPanel;
