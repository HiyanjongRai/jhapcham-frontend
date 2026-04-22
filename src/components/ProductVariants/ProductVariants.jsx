import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Alert, Modal, Container, Row, Col } from 'react-bootstrap';
import { toast } from 'sonner';
import productVariantsApi from '../../api/productVariantsApi';
import './ProductVariants.css';

const ProductVariants = ({ productId, onVariantAdded }) => {
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    sku: '',
    size: '',
    color: '',
    capacity: '',
    description: '',
    stockQuantity: 0,
    priceModifier: 0,
    active: true
  });

  useEffect(() => {
    loadVariants();
  }, [productId]);

  const loadVariants = async () => {
    try {
      setLoading(true);
      const data = await productVariantsApi.getProductVariants(productId);
      setVariants(data);
    } catch (error) {
      toast.error('Failed to load variants');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : name === 'stockQuantity' || name === 'priceModifier' ? parseFloat(value) : value
    }));
  };

  const handleAddVariant = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const newVariant = await productVariantsApi.createVariant(productId, formData);
      setVariants([...variants, newVariant]);
      setFormData({
        sku: '',
        size: '',
        color: '',
        capacity: '',
        description: '',
        stockQuantity: 0,
        priceModifier: 0,
        active: true
      });
      setShowModal(false);
      toast.success('Variant added successfully!');
      if (onVariantAdded) onVariantAdded(newVariant);
    } catch (error) {
      toast.error('Failed to add variant');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container fluid className="product-variants-container">
      <div className="variants-header">
        <h3>Product Variants</h3>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowModal(true)}
        >
          + Add Variant
        </Button>
      </div>

      {loading && !variants.length ? (
        <Alert variant="info">Loading variants...</Alert>
      ) : variants.length === 0 ? (
        <Alert variant="warning">No variants yet. Add one to get started!</Alert>
      ) : (
        <Row xs={1} md={2} lg={3} className="g-3">
          {variants.map(variant => (
            <Col key={variant.id}>
              <Card className="variant-card">
                <Card.Body>
                  <div className="variant-sku">{variant.sku}</div>
                  <div className="variant-attributes">
                    {variant.size && <span className="badge bg-info">Size: {variant.size}</span>}
                    {variant.color && <span className="badge bg-warning">Color: {variant.color}</span>}
                    {variant.capacity && <span className="badge bg-success">Capacity: {variant.capacity}</span>}
                  </div>
                  <div className="variant-stock">
                    Stock: <strong>{variant.stockQuantity}</strong>
                  </div>
                  {variant.priceModifier && (
                    <div className="variant-modifier">
                      Price Modifier: +Rs. {variant.priceModifier}
                    </div>
                  )}
                  <div className="variant-status">
                    Status: <span className={`badge ${variant.active ? 'bg-success' : 'bg-danger'}`}>
                      {variant.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Add Variant Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add Product Variant</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleAddVariant}>
            <Form.Group className="mb-3">
              <Form.Label>SKU (Unique)</Form.Label>
              <Form.Control
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleInputChange}
                required
                placeholder="e.g., PROD-S-RED"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Size</Form.Label>
              <Form.Control
                type="text"
                name="size"
                value={formData.size}
                onChange={handleInputChange}
                placeholder="e.g., S, M, L, XL"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Color</Form.Label>
              <Form.Control
                type="text"
                name="color"
                value={formData.color}
                onChange={handleInputChange}
                placeholder="e.g., Red, Blue, Black"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Capacity</Form.Label>
              <Form.Control
                type="text"
                name="capacity"
                value={formData.capacity}
                onChange={handleInputChange}
                placeholder="e.g., 500ml, 1L, 2GB"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Optional description"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Stock Quantity</Form.Label>
              <Form.Control
                type="number"
                name="stockQuantity"
                value={formData.stockQuantity}
                onChange={handleInputChange}
                required
                min="0"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Price Modifier (Rs.)</Form.Label>
              <Form.Control
                type="number"
                name="priceModifier"
                value={formData.priceModifier}
                onChange={handleInputChange}
                step="0.01"
                placeholder="0"
              />
              <Form.Text className="text-muted">
                Additional charge for this variant
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                name="active"
                label="Active"
                checked={formData.active}
                onChange={handleInputChange}
              />
            </Form.Group>

            <div className="d-flex gap-2">
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? 'Adding...' : 'Add Variant'}
              </Button>
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default ProductVariants;
