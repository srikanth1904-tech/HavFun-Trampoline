const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'payments.db');

let db;

function getDb() {
    if (!db) {
        db = new Database(DB_PATH);
        db.pragma('journal_mode = WAL'); // Better concurrency
        db.pragma('foreign_keys = ON');
        initSchema();
    }
    return db;
}

function initSchema() {
    db.exec(`
        CREATE TABLE IF NOT EXISTS payments (
            id                  INTEGER PRIMARY KEY AUTOINCREMENT,
            booking_id          TEXT    UNIQUE NOT NULL,
            razorpay_order_id   TEXT,
            razorpay_payment_id TEXT,
            razorpay_signature  TEXT,
            name                TEXT,
            email               TEXT,
            phone               TEXT,
            duration            INTEGER,
            date                TEXT,
            time                TEXT,
            amount_paise        INTEGER,
            status              TEXT    NOT NULL DEFAULT 'pending',
            webhook_confirmed   INTEGER NOT NULL DEFAULT 0,
            email_sent          INTEGER NOT NULL DEFAULT 0,
            created_at          TEXT    NOT NULL DEFAULT (datetime('now')),
            updated_at          TEXT    NOT NULL DEFAULT (datetime('now'))
        );

        CREATE INDEX IF NOT EXISTS idx_payments_order_id
            ON payments (razorpay_order_id);

        CREATE INDEX IF NOT EXISTS idx_payments_payment_id
            ON payments (razorpay_payment_id);

        CREATE INDEX IF NOT EXISTS idx_payments_status
            ON payments (status);
    `);
    console.log('[DB] SQLite initialised →', DB_PATH);
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Insert a new pending payment record when an order is created.
 */
function insertPendingPayment({ bookingId, razorpayOrderId, name, email, phone, duration, date, time, amountPaise }) {
    const stmt = getDb().prepare(`
        INSERT INTO payments
            (booking_id, razorpay_order_id, name, email, phone, duration, date, time, amount_paise, status)
        VALUES
            (@bookingId, @razorpayOrderId, @name, @email, @phone, @duration, @date, @time, @amountPaise, 'pending')
    `);
    return stmt.run({ bookingId, razorpayOrderId, name, email, phone, duration, date, time, amountPaise });
}

/**
 * Mark a payment as paid after signature verification.
 */
function markPaymentPaid({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
    const stmt = getDb().prepare(`
        UPDATE payments
        SET status              = 'paid',
            razorpay_payment_id = @razorpayPaymentId,
            razorpay_signature  = @razorpaySignature,
            updated_at          = datetime('now')
        WHERE razorpay_order_id = @razorpayOrderId
    `);
    return stmt.run({ razorpayOrderId, razorpayPaymentId, razorpaySignature });
}

/**
 * Mark a payment as failed.
 */
function markPaymentFailed({ razorpayOrderId }) {
    const stmt = getDb().prepare(`
        UPDATE payments
        SET status     = 'failed',
            updated_at = datetime('now')
        WHERE razorpay_order_id = @razorpayOrderId
    `);
    return stmt.run({ razorpayOrderId });
}

/**
 * Confirm via webhook (idempotent).
 */
function confirmWebhookPayment({ razorpayPaymentId, razorpayOrderId }) {
    const stmt = getDb().prepare(`
        UPDATE payments
        SET webhook_confirmed = 1,
            status            = 'paid',
            razorpay_payment_id = COALESCE(razorpay_payment_id, @razorpayPaymentId),
            updated_at        = datetime('now')
        WHERE razorpay_order_id = @razorpayOrderId
    `);
    return stmt.run({ razorpayPaymentId, razorpayOrderId });
}

/**
 * Get all payments (for admin / debugging).
 */
function getAllPayments() {
    return getDb().prepare('SELECT * FROM payments ORDER BY created_at DESC').all();
}

/**
 * Get a single payment by booking ID.
 */
function getPaymentByBookingId(bookingId) {
    return getDb().prepare('SELECT * FROM payments WHERE booking_id = ?').get(bookingId);
}

/**
 * Mark email as sent for a booking.
 */
function markEmailSent(bookingId) {
    const stmt = getDb().prepare(`
        UPDATE payments
        SET email_sent = 1,
            updated_at = datetime('now')
        WHERE booking_id = ?
    `);
    return stmt.run(bookingId);
}

module.exports = {
    getDb,
    insertPendingPayment,
    markPaymentPaid,
    markPaymentFailed,
    confirmWebhookPayment,
    markEmailSent,
    getAllPayments,
    getPaymentByBookingId,
};
