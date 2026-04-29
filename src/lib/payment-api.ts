/**
 * Payment API client for HavFun Trampoline Park.
 * All calls go to the Express backend via Vite proxy in dev, or direct URL in prod.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CreateOrderPayload {
    name: string;
    email: string;
    phone: string;
    duration: 30 | 60;
    date: string;       // ISO date string e.g. "2026-04-28"
    time: string;       // e.g. "14:00"
    amountPaise: number; // Total in paise (INR × 100)
}

export interface CreateOrderResponse {
    success: boolean;
    orderId: string;       // Razorpay order_id (e.g. "order_XXXXXXXX")
    bookingId: string;     // Our internal booking ID (e.g. "HF-XXXXXXXXX")
    amount: number;        // Amount in paise
    currency: string;      // "INR"
    keyId: string;         // Razorpay publishable key (safe for frontend)
}

export interface VerifyPaymentPayload {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    bookingId: string;
}

export interface VerifyPaymentResponse {
    success: boolean;
    bookingId: string;
    message: string;
}

// ─── API Calls ───────────────────────────────────────────────────────────────

async function handleResponse<T>(res: Response): Promise<T> {
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.message || `HTTP ${res.status}`);
    }
    return data as T;
}

/**
 * Create a Razorpay order on the backend.
 * Returns the order ID and booking ID needed to open the Razorpay modal.
 */
export async function createOrder(payload: CreateOrderPayload): Promise<CreateOrderResponse> {
    const res = await fetch(`${API_BASE}/api/payment/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    return handleResponse<CreateOrderResponse>(res);
}

/**
 * Verify payment signature after Razorpay success callback.
 * This is the critical security step — backend validates the HMAC.
 */
export async function verifyPayment(payload: VerifyPaymentPayload): Promise<VerifyPaymentResponse> {
    const res = await fetch(`${API_BASE}/api/payment/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    return handleResponse<VerifyPaymentResponse>(res);
}
