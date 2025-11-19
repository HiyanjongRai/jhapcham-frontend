import React, { useState } from "react"
import { getCurrentUserId } from "../AddCart/cartUtils"

const API = "http://localhost:8080/api/reviews"

export default function ReviewForm() {

  const orderId = localStorage.getItem("reviewOrderId")
  const userId = getCurrentUserId()

  const [rating, setRating] = useState("")
  const [comment, setComment] = useState("")
  const [images, setImages] = useState([])
  const [message, setMessage] = useState("")

  async function submitReview() {
    const form = new FormData()
    form.append("userId", userId)
    form.append("orderId", orderId)
    form.append("rating", rating)
    form.append("comment", comment)

    images.forEach(img => form.append("images", img))

    try {
      const res = await fetch(API, {
        method: "POST",
        body: form
      })

      const out = await res.json()

      if (out.error) {
        setMessage(out.error)
        return
      }

      setMessage("Review submitted")

    } catch (err) {
      setMessage("Error submitting review")
    }
  }

  return (
    <div style={{ padding: 20, maxWidth: 500, margin: "0 auto" }}>
      <h2>Write Review</h2>

      <p>Order ID: {orderId}</p>

      <label>Rating</label>
      <input
        type="number"
        min="1"
        max="5"
        value={rating}
        onChange={e => setRating(e.target.value)}
        style={{ width: "100%", marginBottom: 10 }}
      />

      <label>Comment</label>
      <textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        style={{ width: "100%", height: 80, marginBottom: 10 }}
      />

      <label>Upload Images</label>
      <input
        type="file"
        multiple
        onChange={e => setImages([...e.target.files])}
        style={{ marginBottom: 15 }}
      />

      <button
        onClick={submitReview}
        style={{
          padding: "10px 18px",
          background: "#0a74da",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          cursor: "pointer"
        }}
      >
        Submit Review
      </button>

      {message && (
        <p style={{ marginTop: 15 }}>{message}</p>
      )}
    </div>
  )
}
