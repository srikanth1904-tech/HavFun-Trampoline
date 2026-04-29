import { useEffect, useState, useCallback } from 'react';

const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

declare global {
    interface Window {
        Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
    }
}

export interface RazorpayOptions {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description: string;
    order_id: string;
    prefill?: {
        name?: string;
        email?: string;
        contact?: string;
    };
    theme?: {
        color?: string;
    };
    modal?: {
        confirm_close?: boolean;
        ondismiss?: () => void;
    };
    handler: (response: RazorpaySuccessResponse) => void;
}

export interface RazorpaySuccessResponse {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
}

export interface RazorpayInstance {
    open: () => void;
    on: (event: string, handler: (response: { error: { code: string; description: string } }) => void) => void;
}

function loadScript(src: string): Promise<boolean> {
    return new Promise((resolve) => {
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve(true);
            return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
}

export function useRazorpay() {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setIsLoading(true);
        loadScript(RAZORPAY_SCRIPT_URL).then((loaded) => {
            setIsLoaded(loaded);
            setIsLoading(false);
            if (!loaded) console.error('[Razorpay] Failed to load checkout script');
        });
    }, []);

    const openRazorpay = useCallback(
        (options: RazorpayOptions): RazorpayInstance | null => {
            if (!isLoaded || !window.Razorpay) {
                console.error('[Razorpay] SDK not ready');
                return null;
            }
            const rzp = new window.Razorpay(options);
            rzp.open();
            return rzp;
        },
        [isLoaded]
    );

    return { openRazorpay, isLoaded, isLoading };
}
