import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUserId } from "../AddCart/cartUtils";
import { Star, Upload, X, CheckCircle } from "lucide-react";
import "./ReviewForm.css";

const API = "http://localhost:8080/api/reviews";

export default function ReviewForm() {
  const orderId = localStorage.getItem("reviewOrderId");
  const mode = localStorage.getItem("reviewMode") || "create";
  const reviewDataStr = localStorage.getItem("reviewData");
  
  const userId = getCurrentUserId();
  const navigate = useNavigate();

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // 'success' or 'error'
  const [submitting, setSubmitting] = useState(false);
  const [reviewId, setReviewId] = useState(null);

  const ratingLabels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

  useEffect(() => {
    if (mode === "edit" && reviewDataStr) {
      try {
        const data = JSON.parse(reviewDataStr);
        setReviewId(data.id || data.reviewId);
        setRating(data.rating || 0);
        setComment(data.comment || "");
        if (data.images && Array.isArray(data.images)) {
          setExistingImages(data.images);
        }
      } catch (e) {
        console.error("Failed to parse review data", e);
      }
    }
  }, [mode, reviewDataStr]);

  const handleStarClick = (value) => {
    setRating(value);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(prev => [...prev, ...files]);
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };
  
  const removeExistingImage = (index) => {
    // For now, we just remove it from the UI list. 
    // Ideally, we might want to track deleted images to send to backend if backend supports it.
    // But since the backend replaces the list or appends, we'll see.
    // The current backend logic for edit replaces images if new ones are sent. 
    // To keep existing ones, we might need to handle it differently or re-upload.
    // Assuming backend logic: "if (req.getImages() != null && !req.getImages().isEmpty()) imageUrls = validateAndProcessImages(req.getImages());"
    // This means if we send new images, old ones are replaced. 
    // If we don't send new images, old ones are kept.
    // This is a limitation of the current backend code provided. 
    // We will just hide it from UI for now.
    setExistingImages(existingImages.filter((_, i) => i !== index));
  };

  async function submitReview() {
    if (!rating) {
      setMessage("Please select a rating");
      setMessageType("error");
      return;
    }

    if (!comment.trim()) {
      setMessage("Please write a comment");
      setMessageType("error");
      return;
    }

    const form = new FormData();
    form.append("userId", userId);
    
    if (mode === "create") {
      form.append("orderId", orderId);
    }
    
    form.append("rating", rating);
    form.append("comment", comment);

    images.forEach((img) => form.append("images", img));

    try {
      setSubmitting(true);
      setMessage("");
      
      let url = API;
      let method = "POST";
      
      if (mode === "edit" && reviewId) {
        url = `${API}/${reviewId}`;
        method = "PUT";
      }
      
      const res = await fetch(url, {
        method: method,
        body: form,
      });

      const out = await res.json();

      if (out.error) {
        setMessage(out.error);
        setMessageType("error");
        return;
      }

      setMessage(mode === "edit" ? "Review updated successfully!" : "Review submitted successfully!");
      setMessageType("success");
      
      // Clear form
      if (mode === "create") {
        setRating(0);
        setComment("");
        setImages([]);
      }

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate("/customer/dashboard");
      }, 2000);

    } catch (err) {
      setMessage("Error submitting review. Please try again.");
      setMessageType("error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="review-form-page">
      <div className="review-form-container">
        <div className="review-form-header">
          <h2>{mode === "edit" ? "Edit Your Review" : "Write Your Review"}</h2>
          <p>Share your experience with this product</p>
          {orderId && (
            <div className="review-order-id">
              Order ID: <strong>#{orderId}</strong>
            </div>
          )}
        </div>

        {/* Star Rating */}
        <div className="review-form-group">
          <label className="review-form-label required">Your Rating</label>
          <div className="review-star-rating">
            <div className="review-stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`review-star ${
                    star <= (hoverRating || rating) ? "active" : ""
                  }`}
                  fill={star <= (hoverRating || rating) ? "#000" : "none"}
                  onClick={() => handleStarClick(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                />
              ))}
            </div>
            {(hoverRating || rating) > 0 && (
              <span className="review-rating-text">
                {ratingLabels[hoverRating || rating]}
              </span>
            )}
          </div>
        </div>

        {/* Comment */}
        <div className="review-form-group">
          <label className="review-form-label required">Your Review</label>
          <textarea
            className="review-textarea"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us about your experience with this product. What did you like or dislike?"
            maxLength={500}
          />
          <div className="review-char-count">
            {comment.length}/500 characters
          </div>
        </div>

        {/* Image Upload */}
        <div className="review-form-group">
          <label className="review-form-label">Add Photos (Optional)</label>
          
          {/* Existing Images (Edit Mode) */}
          {existingImages.length > 0 && (
             <div className="review-selected-files" style={{ marginBottom: '1rem' }}>
                {existingImages.map((img, index) => (
                  <div key={index} className="review-file-tag" style={{ background: '#f0f0f0' }}>
                    <span style={{ fontSize: '0.8rem', color: '#666' }}>Existing Image {index + 1}</span>
                    {/* We can't easily remove existing images with current backend logic without re-uploading all, so hiding remove for now or just visual */}
                  </div>
                ))}
             </div>
          )}
          
          <div className="review-file-upload">
            <input
              type="file"
              id="review-images"
              className="review-file-input"
              multiple
              accept="image/*"
              onChange={handleFileChange}
            />
            <label htmlFor="review-images" className="review-file-label">
              <Upload />
              <div className="review-file-text">
                <p>Click to upload new images</p>
                <span>PNG, JPG up to 5MB</span>
              </div>
            </label>

            {images.length > 0 && (
              <div className="review-selected-files">
                {images.map((file, index) => (
                  <div key={index} className="review-file-tag">
                    <span>{file.name}</span>
                    <X
                      size={16}
                      style={{ cursor: "pointer" }}
                      onClick={() => removeImage(index)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
          {mode === "edit" && images.length > 0 && (
            <p style={{ fontSize: '0.8rem', color: '#f59e0b', marginTop: '0.5rem' }}>
              Note: Uploading new images will replace existing ones.
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          className="review-submit-btn"
          onClick={submitReview}
          disabled={submitting}
        >
          {submitting ? "Submitting..." : (mode === "edit" ? "Update Review" : "Submit Review")}
        </button>

        {/* Message */}
        {message && (
          <div className={`review-message ${messageType}`}>
            {messageType === "success" && <CheckCircle size={18} style={{ display: "inline", marginRight: "0.5rem" }} />}
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
