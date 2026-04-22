import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Card, Alert, Modal, Badge, ListGroup, Spinner, Row, Col, File } from 'react-bootstrap';
import { toast } from 'sonner';
import disputesApi from '../../api/disputesApi';
import './Disputes.css';

const Disputes = ({ userRole = 'customer' }) => {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [formData, setFormData] = useState({
    orderId: '',
    title: '',
    description: ''
  });
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [evidenceDescription, setEvidenceDescription] = useState('');

  useEffect(() => {
    loadDisputes();
  }, []);

  const loadDisputes = async () => {
    try {
      setLoading(true);
      let data;
      if (userRole === 'admin') {
        data = await disputesApi.getPendingDisputes();
      } else {
        data = await disputesApi.getMyDisputes();
      }
      setDisputes(data);
    } catch (error) {
      toast.error('Failed to load disputes');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitDispute = async (e) => {
    e.preventDefault();
    if (!formData.orderId || !formData.title) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const newDispute = await disputesApi.initiateDispute(formData);
      setDisputes([newDispute, ...disputes]);
      setFormData({ orderId: '', title: '', description: '' });
      setShowModal(false);
      toast.success('Dispute initiated successfully!');
    } catch (error) {
      toast.error('Failed to initiate dispute');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadEvidence = async (e) => {
    e.preventDefault();
    if (!evidenceFile) {
      toast.error('Please select a file');
      return;
    }

    try {
      setLoading(true);
      await disputesApi.uploadEvidence(selectedDispute.id, evidenceFile, evidenceDescription);
      setDisputes(disputes.map(d => 
        d.id === selectedDispute.id 
          ? { ...d, evidence: [...(d.evidence || []), { description: evidenceDescription, fileName: evidenceFile.name }] }
          : d
      ));
      setEvidenceFile(null);
      setEvidenceDescription('');
      setShowEvidenceModal(false);
      toast.success('Evidence uploaded successfully!');
    } catch (error) {
      toast.error('Failed to upload evidence');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveDispute = async (disputeId) => {
    const resolution = prompt('Enter resolution details:');
    if (resolution === null) return;

    try {
      await disputesApi.resolveDispute(disputeId, { resolution });
      setDisputes(disputes.map(d => d.id === disputeId ? { ...d, status: 'RESOLVED' } : d));
      toast.success('Dispute resolved!');
    } catch (error) {
      toast.error('Failed to resolve dispute');
      console.error(error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      OPENED: 'warning',
      UNDER_REVIEW: 'info',
      EVIDENCE_REQUIRED: 'danger',
      IN_DISCUSSION: 'secondary',
      RESOLVED: 'success',
      CANCELLED: 'danger'
    };
    return colors[status] || 'secondary';
  };

  return (
    <Container fluid className="disputes-container">
      <div className="disputes-header">
        <h3>⚖️ Dispute Resolution</h3>
        {userRole !== 'admin' && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowModal(true)}
          >
            + Initiate Dispute
          </Button>
        )}
      </div>

      {loading && !disputes.length ? (
        <div className="text-center py-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      ) : disputes.length === 0 ? (
        <Alert variant="success">✅ No disputes</Alert>
      ) : (
        <div className="disputes-list">
          {disputes.map(dispute => (
            <Card key={dispute.id} className="dispute-card mb-3">
              <Card.Body>
                <Row className="align-items-start">
                  <Col md={8}>
                    <div className="dispute-header">
                      <h5 className="mb-2">{dispute.title}</h5>
                      <Badge bg={getStatusColor(dispute.status)} className="mb-2">
                        {dispute.status.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <p className="text-muted mb-2">{dispute.description}</p>
                    <div className="dispute-meta">
                      <small className="text-muted">
                        Order ID: <strong>{dispute.orderId}</strong>
                      </small>
                      <br />
                      <small className="text-muted">
                        Initiated: {new Date(dispute.createdAt).toLocaleDateString()}
                      </small>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="dispute-actions text-end">
                      <Button
                        size="sm"
                        variant="outline-primary"
                        className="me-2 mb-2"
                        onClick={() => {
                          setSelectedDispute(dispute);
                          setShowEvidenceModal(true);
                        }}
                      >
                        📎 Add Evidence
                      </Button>
                      {userRole === 'admin' && dispute.status !== 'RESOLVED' && (
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => handleResolveDispute(dispute.id)}
                        >
                          ✓ Resolve
                        </Button>
                      )}
                    </div>
                  </Col>
                </Row>

                {/* Evidence */}
                {dispute.evidence && dispute.evidence.length > 0 && (
                  <div className="dispute-evidence mt-3 pt-3 border-top">
                    <h6>📎 Evidence</h6>
                    <ListGroup variant="flush">
                      {dispute.evidence.map((evidence, idx) => (
                        <ListGroup.Item key={idx} className="px-0 py-2">
                          <small className="text-muted">{evidence.fileName}</small>
                          <br />
                          <small>{evidence.description}</small>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  </div>
                )}

                {dispute.resolution && (
                  <div className="dispute-resolution mt-3 p-2 bg-light rounded">
                    <strong>Resolution:</strong>
                    <p className="mb-0 mt-1">{dispute.resolution}</p>
                  </div>
                )}
              </Card.Body>
            </Card>
          ))}
        </div>
      )}

      {/* Initiate Dispute Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Initiate Dispute</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmitDispute}>
            <Form.Group className="mb-3">
              <Form.Label>Order ID *</Form.Label>
              <Form.Control
                type="text"
                name="orderId"
                value={formData.orderId}
                onChange={handleInputChange}
                required
                placeholder="Enter order ID"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Dispute Title *</Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                placeholder="Brief title of the dispute"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Detailed description of the issue"
              />
            </Form.Group>

            <div className="d-flex gap-2">
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? 'Initiating...' : 'Initiate Dispute'}
              </Button>
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Upload Evidence Modal */}
      <Modal show={showEvidenceModal} onHide={() => setShowEvidenceModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add Evidence</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleUploadEvidence}>
            <Form.Group className="mb-3">
              <Form.Label>File *</Form.Label>
              <Form.Control
                type="file"
                onChange={(e) => setEvidenceFile(e.target.files?.[0])}
                required
              />
              <Form.Text className="text-muted">
                Upload images, documents, or screenshots
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={evidenceDescription}
                onChange={(e) => setEvidenceDescription(e.target.value)}
                placeholder="Explain this piece of evidence"
              />
            </Form.Group>

            <div className="d-flex gap-2">
              <Button variant="primary" type="submit" disabled={loading || !evidenceFile}>
                {loading ? 'Uploading...' : 'Upload Evidence'}
              </Button>
              <Button variant="secondary" onClick={() => setShowEvidenceModal(false)}>
                Cancel
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default Disputes;
