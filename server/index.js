const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const db = require('./db');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Transporter configuration
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

// Contact API
app.post('/api/contact', async (req, res) => {
    const { name, email, phone, message } = req.body;

    const mailOptions = {
        from: `"${name}" <${process.env.SMTP_USER}>`,
        to: 'havfuntrampolinepark@gmail.com',
        subject: `New Contact Message from ${name}`,
        text: `
            Name: ${name}
            Email: ${email}
            Phone: ${phone}
            Message: ${message}
        `,
        html: `
            <h3>New Contact Message</h3>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone}</p>
            <p><strong>Message:</strong> ${message}</p>
        `,
        replyTo: email
    };

    try {
        if (process.env.SMTP_PASS === 'your_app_password_here') {
            console.warn('Contact message received but email could not be sent: SMTP_PASS is still the placeholder.');
            return res.status(200).json({ 
                success: true, 
                message: 'Message received! (Note: Email not sent because SMTP is not configured in .env)' 
            });
        }
        await transporter.sendMail(mailOptions);
        res.status(200).json({ success: true, message: 'Message sent successfully!' });
    } catch (error) {
        console.error('Error sending contact mail:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to send email. Check server logs or .env configuration.',
            error: error.message 
        });
    }
});

// Waiver API
app.post('/api/waiver', async (req, res) => {
    const { name, email, phone, participants, signed } = req.body;

    const participantsList = participants.map(p => `<li>${p.name} (DOB: ${p.dob})</li>`).join('');

    const mailOptions = {
        from: `"HavFun Booking" <${process.env.SMTP_USER}>`,
        to: 'havfuntrampolinepark@gmail.com',
        subject: `New Ticket Booking & Waiver Signed by ${name}`,
        text: `
            Main Signatory: ${name}
            Email: ${email}
            Phone: ${phone}
            Participants: ${participants.map(p => `${p.name} (${p.dob})`).join(', ')}
            Status: Sealed/Signed
        `,
        html: `
            <h3>New Ticket Booking & Waiver Signed</h3>
            <p><strong>Main Signatory:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone}</p>
            <h4>Participants:</h4>
            <ul>${participantsList}</ul>
            <p><strong>Status:</strong> Sealed and Signed</p>
        `,
        replyTo: email
    };

    try {
        if (process.env.SMTP_PASS === 'your_app_password_here') {
            console.warn('Waiver signed but email could not be sent: SMTP_PASS is still the placeholder.');
            return res.status(200).json({ 
                success: true, 
                message: 'Waiver signed! (Note: Email not sent because SMTP is not configured in .env)' 
            });
        }
        await transporter.sendMail(mailOptions);
        res.status(200).json({ success: true, message: 'Waiver archived successfully!' });
    } catch (error) {
        console.error('Error sending waiver mail:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to send email. Check server logs or .env configuration.',
            error: error.message 
        });
    }
});

// ─── Razorpay Payment API ────────────────────────────────────────────────────

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Helper to send booking confirmation email
async function sendBookingEmail(bookingId) {
    const payment = db.getPaymentByBookingId(bookingId);
    if (!payment || payment.email_sent) return;

    const amount = (payment.amount_paise / 100).toFixed(2);
    
    const mailOptions = {
        from: `"HavFun Trampoline Park" <${process.env.SMTP_USER}>`,
        to: payment.email,
        subject: `Booking Confirmed! 🚀 - ${bookingId}`,
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #CCFF00; background: #12161f; display: inline-block; padding: 10px 20px; border-radius: 5px;">HavFun</h1>
                    <h2 style="color: #333;">Booking Confirmed!</h2>
                </div>
                
                <p>Hi <strong>${payment.name}</strong>,</p>
                <p>Your session at HavFun Trampoline Park is officially booked! Get ready for an experience beyond boundaries.</p>
                
                <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #555; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Booking Details</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; color: #777;">Booking ID:</td>
                            <td style="padding: 8px 0; text-align: right; font-weight: bold;">${payment.booking_id}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #777;">Date:</td>
                            <td style="padding: 8px 0; text-align: right; font-weight: bold;">${payment.date}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #777;">Time Slot:</td>
                            <td style="padding: 8px 0; text-align: right; font-weight: bold;">${payment.time}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #777;">Duration:</td>
                            <td style="padding: 8px 0; text-align: right; font-weight: bold;">${payment.duration} Minutes</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #777;">Amount Paid:</td>
                            <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #CCFF00; background: #12161f; padding-right: 5px;">₹${amount}</td>
                        </tr>
                    </table>
                </div>
                
                <div style="font-size: 12px; color: #888; line-height: 1.6;">
                    <p><strong>Please arrive 15 minutes before your slot.</strong></p>
                    <p>Mandatory grip socks are included in your booking and will be provided at the counter.</p>
                    <p>If you haven't signed the waiver yet, please do so at our website before arriving.</p>
                </div>
                
                <div style="text-align: center; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
                    <p style="font-size: 14px; color: #333;">HavFun Trampoline Park</p>
                    <p style="font-size: 12px; color: #999;">Safety • Joy • Legacy</p>
                </div>
            </div>
        `
    };

    try {
        if (process.env.SMTP_PASS === 'your_app_password_here') {
            console.warn('[Email] Booking confirmation skipped: SMTP_PASS is still the placeholder.');
            return;
        }
        await transporter.sendMail(mailOptions);
        db.markEmailSent(bookingId);
        console.log(`[Email] Confirmation sent to ${payment.email} for ${bookingId}`);
    } catch (error) {
        console.error('[Email] Failed to send booking confirmation:', error);
    }
}

// Create Order
app.post('/api/payment/create-order', async (req, res) => {
    try {
        const { name, email, phone, duration, date, time, amountPaise } = req.body;

        const options = {
            amount: amountPaise,
            currency: 'INR',
            receipt: `receipt_${Date.now()}`,
        };

        const order = await razorpay.orders.create(options);
        const bookingId = 'HF-' + Math.random().toString(36).substr(2, 9).toUpperCase();

        // Save pending payment to DB
        db.insertPendingPayment({
            bookingId,
            razorpayOrderId: order.id,
            name,
            email,
            phone,
            duration,
            date,
            time,
            amountPaise
        });

        res.status(200).json({
            success: true,
            orderId: order.id,
            bookingId,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.RAZORPAY_KEY_ID
        });
    } catch (error) {
        console.error('[Razorpay] Create Order Error:', error);
        res.status(500).json({ success: false, message: 'Failed to create payment order' });
    }
});

// Verify Signature
app.post('/api/payment/verify', async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;

    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(sign.toString())
        .digest('hex');

    if (razorpay_signature === expectedSign) {
        // Mark as paid in DB
        db.markPaymentPaid({
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature
        });

        // Send confirmation email
        await sendBookingEmail(bookingId);

        res.status(200).json({ success: true, bookingId, message: 'Payment verified successfully' });
    } else {
        db.markPaymentFailed({ razorpayOrderId: razorpay_order_id });
        res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }
});

// Webhook
app.post('/api/payment/webhook', async (req, res) => {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    const shasum = crypto.createHmac('sha256', secret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest('hex');

    if (digest === req.headers['x-razorpay-signature']) {
        const event = req.body.event;
        const payload = req.body.payload.payment.entity;

        if (event === 'payment.captured' || event === 'order.paid') {
            db.confirmWebhookPayment({
                razorpayPaymentId: payload.id,
                razorpayOrderId: payload.order_id
            });

            // Find booking ID by order ID to send email
            const payment = db.getDb().prepare('SELECT booking_id FROM payments WHERE razorpay_order_id = ?').get(payload.order_id);
            if (payment) {
                await sendBookingEmail(payment.booking_id);
            }
        }
        res.status(200).json({ status: 'ok' });
    } else {
        res.status(403).json({ status: 'invalid signature' });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
