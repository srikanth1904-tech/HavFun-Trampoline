const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// In-memory bookings store (replace with DB later)
const bookings = {};

// ── Create Order ──────────────────────────────────────────────
app.post('/api/payment/create-order', async (req, res) => {
  const { name, email, phone, duration, date, time, amountPaise } = req.body;

  if (!name || !email || !phone || !amountPaise) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: `hf_${Date.now()}`,
      notes: { name, email, phone, duration, date, time }
    });

    const bookingId = `HF-${Date.now()}`;

    // Store booking
    bookings[bookingId] = {
      bookingId,
      orderId: order.id,
      name, email, phone, duration, date, time,
      amount: amountPaise,
      status: 'pending'
    };

    res.json({
      success: true,
      orderId: order.id,
      bookingId,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID
    });

  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ── Verify Payment ────────────────────────────────────────────
app.post('/api/payment/verify', (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;

  const sign = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expectedSign = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(sign)
    .digest('hex');

  if (expectedSign === razorpay_signature) {
    // Update booking status
    if (bookings[bookingId]) {
      bookings[bookingId].status = 'paid';
      bookings[bookingId].paymentId = razorpay_payment_id;
    }

    res.json({
      success: true,
      bookingId,
      message: 'Payment verified successfully'
    });
  } else {
    res.status(400).json({
      success: false,
      bookingId,
      message: 'Invalid payment signature'
    });
  }
});

// ── Health Check ──────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', razorpay: !!process.env.RAZORPAY_KEY_ID });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
