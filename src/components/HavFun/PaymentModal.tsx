import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  CreditCard, 
  ShieldCheck, 
  Clock, 
  Calendar, 
  User, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import PremiumButton from '@/components/ui/PremiumButton';
import { PRICING_CONFIG } from '@/lib/pricing-config';
import { useRazorpay } from '@/hooks/useRazorpay';
import { createOrder, verifyPayment } from '@/lib/payment-api';
import { toast } from 'sonner';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingDetails: {
    name: string;
    email: string;
    phone: string;
    duration: 30 | 60;
    date: Date;
    time: string;
    basePrice: number;
  };
  onSuccess: (bookingId: string) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, bookingDetails, onSuccess }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { openRazorpay, isLoaded } = useRazorpay();

  if (!isOpen) return null;

  const gstAmount = Math.round(bookingDetails.basePrice * PRICING_CONFIG.gst);
  const gripSocksPrice = PRICING_CONFIG.gripSocks;
  const totalAmount = bookingDetails.basePrice + gstAmount + gripSocksPrice;
  const totalAmountPaise = totalAmount * 100;

  const handlePayment = async () => {
    if (!isLoaded) {
      toast.error("Payment system is still loading. Please try again in a moment.");
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Create Order on Backend
      const orderData = await createOrder({
        name: bookingDetails.name,
        email: bookingDetails.email,
        phone: bookingDetails.phone,
        duration: bookingDetails.duration,
        date: format(bookingDetails.date, 'yyyy-MM-dd'),
        time: bookingDetails.time,
        amountPaise: totalAmountPaise
      });

      // 2. Open Razorpay Checkout
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "HavFun Trampoline Park",
        description: `${bookingDetails.duration} Min Session - ${bookingDetails.time}`,
        order_id: orderData.orderId,
        prefill: {
          name: bookingDetails.name,
          email: bookingDetails.email,
          contact: bookingDetails.phone,
        },
        theme: {
          color: "#CCFF00", // Neon Lime
        },
        handler: async (response: any) => {
          try {
            // 3. Verify Payment on Backend
            const verification = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingId: orderData.bookingId
            });

            if (verification.success) {
              toast.success("Payment successful!");
              onSuccess(orderData.bookingId);
            } else {
              toast.error("Payment verification failed. Please contact support.");
            }
          } catch (error: any) {
            console.error("Verification error:", error);
            toast.error("Error verifying payment: " + error.message);
          } finally {
            setIsProcessing(false);
          }
        },
        modal: {
          confirm_close: true,
          ondismiss: () => {
            setIsProcessing(false);
          }
        }
      };

      const rzp = openRazorpay(options);
      if (!rzp) {
        setIsProcessing(false);
        toast.error("Could not initialize payment window.");
      }
    } catch (error: any) {
      console.error("Order creation error:", error);
      toast.error("Error creating order: " + error.message);
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg glass-premium rounded-[2.5rem] border border-primary/20 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-border/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary border border-primary/20">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Secure Checkout</h2>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-black">Powered by Razorpay</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full transition-colors"
            disabled={isProcessing}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card/40 p-4 rounded-2xl border border-border/40">
              <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span className="text-[10px] uppercase tracking-widest font-bold">Session</span>
              </div>
              <span className="text-sm font-bold">{bookingDetails.duration} Minutes</span>
            </div>
            <div className="bg-card/40 p-4 rounded-2xl border border-border/40">
              <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                <Calendar className="w-3 h-3" />
                <span className="text-[10px] uppercase tracking-widest font-bold">Date & Time</span>
              </div>
              <span className="text-sm font-bold">{format(bookingDetails.date, "MMM dd")} • {bookingDetails.time}</span>
            </div>
            <div className="bg-card/40 p-4 rounded-2xl border border-border/40 col-span-2">
              <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                <User className="w-3 h-3" />
                <span className="text-[10px] uppercase tracking-widest font-bold">Guest Details</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold">{bookingDetails.name}</span>
                <span className="text-[10px] text-muted-foreground">{bookingDetails.email}</span>
              </div>
            </div>
          </div>

          {/* Pricing Table */}
          <div className="space-y-3">
            <h3 className="text-[10px] uppercase tracking-[0.2em] font-black text-primary">Price Breakdown</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Base Fare ({bookingDetails.duration}m)</span>
                <span>₹{bookingDetails.basePrice}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mandatory Grip Socks</span>
                <span>₹{gripSocksPrice}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">GST ({PRICING_CONFIG.gst * 100}%)</span>
                <span>₹{gstAmount}</span>
              </div>
              <div className="h-px bg-border/40 my-2" />
              <div className="flex justify-between text-lg font-bold text-primary">
                <span>Total Amount</span>
                <span className="shadow-neon-text">₹{totalAmount}</span>
              </div>
            </div>
          </div>

          {/* Action */}
          <div className="space-y-4">
            <PremiumButton 
              className="w-full h-14 text-lg"
              onClick={handlePayment}
              disabled={isProcessing || !isLoaded}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Pay Now <ChevronRight className="w-5 h-5 ml-2" />
                </>
              )}
            </PremiumButton>
            
            <div className="flex items-center justify-center gap-4 opacity-50">
              <div className="flex items-center gap-1 text-[8px] uppercase tracking-widest font-black">
                <ShieldCheck className="w-3 h-3" /> Secure Payment
              </div>
              <div className="w-px h-3 bg-border" />
              <div className="text-[8px] uppercase tracking-widest font-black">100% Data Encrypted</div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentModal;
