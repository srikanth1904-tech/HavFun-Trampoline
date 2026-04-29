import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { format, addDays, isSameDay, isBefore, startOfDay } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import PremiumButton from '@/components/ui/PremiumButton';
import { calculateBasePrice } from '@/lib/pricing-config';
import PaymentModal from './PaymentModal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface BookingSlot {
  time: string;
  capacity: number;
  booked: number;
}

const DURATIONS = [
  { label: '30 Minutes', value: 30 },
  { label: '1 Hour', value: 60 },
];

const GENERATED_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", 
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", 
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", 
  "18:00", "18:30", "19:00", "19:30", "20:00"
];

const BookingAssistant = () => {
  const [duration, setDuration] = useState<number | null>(null);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [bookingId, setBookingId] = useState('');
  const [slots, setSlots] = useState<BookingSlot[]>([]);
  
  // Payment States
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [userDetails, setUserDetails] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [showDetailsForm, setShowDetailsForm] = useState(false);

  // Mock slot data generation based on date
  useEffect(() => {
    if (date) {
      const newSlots = GENERATED_SLOTS.map(time => ({
        time,
        capacity: 30,
        // Randomly fill some slots for demonstration
        booked: Math.floor(Math.random() * 35) > 25 ? 30 : Math.floor(Math.random() * 25)
      }));
      setSlots(newSlots);
      setSelectedTime(null); // Reset time when date changes
    }
  }, [date]);

  const handleBooking = (id: string) => {
    setBookingId(id);
    setBookingConfirmed(true);
    setIsPaymentModalOpen(false);
  };

  const getNextAvailableSlot = () => {
    return slots.find(s => s.booked < s.capacity);
  };

  const renderDurationSelection = () => (
    <div className="space-y-6">
      <h3 className="text-sm font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2">
        <Clock className="w-4 h-4" /> Select Duration
      </h3>
      <div className="grid grid-cols-2 gap-4">
        {DURATIONS.map((d) => (
          <motion.button
            key={d.value}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setDuration(d.value)}
            className={cn(
              "p-6 rounded-3xl border-2 transition-all text-center group",
              duration === d.value 
                ? "border-primary bg-primary/10 text-primary shadow-neon" 
                : "border-border/40 hover:border-primary/30 bg-card/40"
            )}
          >
            <span className={cn(
              "text-xl font-bold block mb-1",
              duration === d.value ? "text-primary" : "text-foreground"
            )}>{d.label}</span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground group-hover:text-primary/70 transition-colors">
              {d.value === 30 ? "Quick Energy" : "Full Experience"}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );

  const renderDateSelection = () => (
    <div className="space-y-6">
      <h3 className="text-sm font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2">
        <CalendarIcon className="w-4 h-4" /> Select Date
      </h3>
      <Popover>
        <PopoverTrigger asChild>
          <motion.button 
            whileHover={{ scale: 1.01 }}
            className={cn(
              "w-full p-6 rounded-3xl border-2 transition-all text-left flex items-center justify-between group",
              date ? "border-primary bg-primary/10" : "border-border/40 bg-card/40"
            )}
          >
            <div className="flex items-center gap-4">
              <div className={cn(
                "p-3 rounded-2xl transition-colors",
                date ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                <CalendarIcon className="w-6 h-6" />
              </div>
              <div>
                <span className="text-lg font-bold block">
                  {date ? format(date, "PPP") : "Choose a Date"}
                </span>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Available Tomorrow & Beyond
                </span>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-all" />
          </motion.button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 rounded-[2rem] border-primary/20 bg-card/90 backdrop-blur-xl" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            disabled={(d) => isBefore(d, startOfDay(new Date()))}
            initialFocus
            className="p-4"
          />
        </PopoverContent>
      </Popover>
    </div>
  );

  const renderTimeSelection = () => {
    if (!date) return null;

    const nextAvailable = getNextAvailableSlot();

    const allFull = slots.length > 0 && slots.every(s => s.booked >= s.capacity);
    if (allFull) {
      return (
        <div className="p-6 rounded-3xl bg-secondary/10 border border-secondary/20 space-y-4">
          <div className="flex items-center gap-3 text-secondary">
            <AlertCircle className="w-6 h-6" />
            <h4 className="font-bold">Date Fully Booked</h4>
          </div>
          <p className="text-sm text-foreground/70">
            Apologies, but this date is currently at peak capacity. Would you like to try <strong>{format(addDays(date, 1), "PPP")}</strong> instead?
          </p>
          <PremiumButton 
            variant="secondary" 
            className="w-full"
            onClick={() => setDate(addDays(date, 1))}
          >
            Check Next Day <ChevronRight className="w-4 h-4 ml-2" />
          </PremiumButton>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <h3 className="text-sm font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2">
          <Clock className="w-4 h-4" /> Select Time
        </h3>
        
        <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
          {slots.map((slot) => {
            const isFull = slot.booked >= slot.capacity;
            const isSelected = selectedTime === slot.time;
            
            return (
              <motion.button
                key={slot.time}
                disabled={isFull}
                whileHover={!isFull ? { scale: 1.05 } : {}}
                whileTap={!isFull ? { scale: 0.95 } : {}}
                onClick={() => setSelectedTime(slot.time)}
                className={cn(
                  "p-3 rounded-2xl border transition-all text-center relative overflow-hidden",
                  isSelected 
                    ? "border-primary bg-primary text-primary-foreground shadow-neon" 
                    : isFull 
                      ? "border-muted-foreground/10 bg-muted/20 opacity-50 cursor-not-allowed" 
                      : "border-border/40 hover:border-primary/40 bg-card/40"
                )}
              >
                <span className="text-sm font-bold block">{slot.time}</span>
                <span className={cn(
                  "text-[8px] uppercase tracking-tighter opacity-70",
                  isSelected ? "text-primary-foreground" : isFull ? "text-destructive" : "text-muted-foreground"
                )}>
                  {isFull ? "Full" : `${slot.capacity - slot.booked} spots`}
                </span>
              </motion.button>
            );
          })}
        </div>

        {selectedTime && slots.find(s => s.time === selectedTime)?.booked === slots.find(s => s.time === selectedTime)?.capacity && (
            <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-destructive" />
                <p className="text-sm text-destructive font-medium">This slot just became full. Try {nextAvailable?.time}?</p>
            </div>
        )}
      </div>
    );
  };

  const renderDetailsForm = () => (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <h3 className="text-sm font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2">
        <Users className="w-4 h-4" /> Guest Details
      </h3>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-[10px] uppercase tracking-widest ml-1">Full Name</Label>
          <Input 
            id="name" 
            placeholder="John Doe" 
            className="rounded-2xl border-border/40 bg-card/40 h-12 focus:border-primary/50"
            value={userDetails.name}
            onChange={(e) => setUserDetails(prev => ({ ...prev, name: e.target.value }))}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-[10px] uppercase tracking-widest ml-1">Email Address</Label>
            <Input 
              id="email" 
              type="email"
              placeholder="john@example.com" 
              className="rounded-2xl border-border/40 bg-card/40 h-12 focus:border-primary/50"
              value={userDetails.email}
              onChange={(e) => setUserDetails(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-[10px] uppercase tracking-widest ml-1">Phone Number</Label>
            <Input 
              id="phone" 
              placeholder="+91 98765 43210" 
              className="rounded-2xl border-border/40 bg-card/40 h-12 focus:border-primary/50"
              value={userDetails.phone}
              onChange={(e) => setUserDetails(prev => ({ ...prev, phone: e.target.value }))}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );

  const handleBookingClick = () => {
    if (duration && date && selectedTime) {
      if (!showDetailsForm) {
        setShowDetailsForm(true);
        // Scroll to form
        setTimeout(() => {
          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }, 100);
        return;
      }

      if (!userDetails.name || !userDetails.email || !userDetails.phone) {
        // We can use the toast from the main file if it's imported, but let's assume it is or use simple alert for now
        // Actually, 'sonner' toast is likely available globally or imported in this project.
        // Let's use a simple check for now or ensure toast is available.
        return;
      }

      setIsPaymentModalOpen(true);
    }
  };

  if (bookingConfirmed) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-premium p-10 rounded-[2.5rem] border border-primary/30 text-center space-y-8"
      >
        <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto shadow-neon">
          <CheckCircle2 className="w-12 h-12 text-primary" />
        </div>
        
        <div>
          <h2 className="text-3xl font-bold mb-2">Booking Confirmed!</h2>
          <p className="text-muted-foreground">Your adventure at HavFun starts soon.</p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-left">
          <div className="bg-card/40 p-4 rounded-2xl border border-border/40">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">Duration</span>
            <span className="font-bold">{duration === 30 ? '30 Minutes' : '1 Hour'}</span>
          </div>
          <div className="bg-card/40 p-4 rounded-2xl border border-border/40">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">Date</span>
            <span className="font-bold">{date && format(date, "MMM dd, yyyy")}</span>
          </div>
          <div className="bg-card/40 p-4 rounded-2xl border border-border/40">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">Time</span>
            <span className="font-bold">{selectedTime}</span>
          </div>
          <div className="bg-card/40 p-4 rounded-2xl border border-border/40">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">Booking ID</span>
            <span className="font-bold text-primary">{bookingId}</span>
          </div>
        </div>

        <PremiumButton 
          className="w-full"
          onClick={() => setBookingConfirmed(false)}
        >
          Book Another Session
        </PremiumButton>
      </motion.div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-10">
      <div className="text-center space-y-4">
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em]"
        >
          <Sparkles className="w-3 h-3" /> Smart Assistant
        </motion.div>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Reserve Your <span className="text-primary italic">Flight</span></h2>
        <p className="text-muted-foreground text-sm">Quick, clear, and frustration-free booking experience.</p>
      </div>

      <div className="glass-premium p-8 md:p-10 rounded-[2.5rem] border border-border/40 space-y-10">
        {renderDurationSelection()}
        
        <AnimatePresence>
          {duration && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-10"
            >
              <div className="h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
              {renderDateSelection()}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {date && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-10"
            >
              <div className="h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
              {renderTimeSelection()}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {selectedTime && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-10"
            >
              <div className="h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
              {renderDetailsForm()}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="pt-4">
            <PremiumButton 
                className="w-full h-16 text-lg group"
                disabled={!duration || !date || !selectedTime}
                onClick={handleBookingClick}
            >
                {showDetailsForm ? "Proceed to Payment" : "Confirm Availability & Book"} <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </PremiumButton>
            <p className="text-center text-[10px] text-muted-foreground mt-4 uppercase tracking-[0.2em]">
                Max Capacity: 30 Explorers Per Slot
            </p>
        </div>
      </div>

      {duration && date && selectedTime && (
        <PaymentModal 
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          bookingDetails={{
            name: userDetails.name,
            email: userDetails.email,
            phone: userDetails.phone,
            duration: duration as 30 | 60,
            date: date,
            time: selectedTime,
            basePrice: calculateBasePrice(duration as 30 | 60, date, parseInt(selectedTime.split(':')[0]))
          }}
          onSuccess={handleBooking}
        />
      )}
    </div>
  );
};

export default BookingAssistant;
