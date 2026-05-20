import { Check, Clock, Package, Truck, HandshakeIcon, XCircle, AlertTriangle } from 'lucide-react';

type OrderStatus = 'pending' | 'paid' | 'confirmed' | 'ready' | 'completed' | 'cancelled' | 'disputed';

const STEPS: { key: OrderStatus; label: string; icon: any }[] = [
  { key: 'pending', label: 'Pending', icon: Clock },
  { key: 'paid', label: 'Paid', icon: Check },
  { key: 'confirmed', label: 'Confirmed', icon: Package },
  { key: 'ready', label: 'Ready', icon: Truck },
  { key: 'completed', label: 'Completed', icon: HandshakeIcon },
];

interface OrderTimelineProps {
  status: OrderStatus;
  className?: string;
}

export default function OrderTimeline({ status, className = '' }: OrderTimelineProps) {
  const isCancelled = status === 'cancelled';
  const isDisputed = status === 'disputed';
  const currentIdx = STEPS.findIndex(s => s.key === status);

  if (isCancelled || isDisputed) {
    return (
      <div className={`flex items-center gap-3 p-4 border-2 border-[var(--bulletin-border)] ${isCancelled ? 'bg-red-50 dark:bg-red-900/20' : 'bg-orange-50 dark:bg-orange-900/20'} ${className}`}>
        {isCancelled ? <XCircle className="h-6 w-6 text-red-500" /> : <AlertTriangle className="h-6 w-6 text-orange-500" />}
        <div>
          <p className="text-[12px] font-black uppercase tracking-widest text-[var(--bulletin-text)]">
            {isCancelled ? 'Order Cancelled' : 'Under Dispute'}
          </p>
          <p className="text-[11px] opacity-60 text-[var(--bulletin-text)]">
            {isCancelled ? 'This order has been cancelled.' : 'This order is under review by our team.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between relative">
        {/* Progress line */}
        <div className="absolute top-5 left-6 right-6 h-0.5 bg-[var(--bulletin-border)] opacity-20" />
        <div
          className="absolute top-5 left-6 h-0.5 bg-[#ff6b6b] transition-all duration-500"
          style={{ width: `${Math.max(0, (currentIdx / (STEPS.length - 1)) * (100 - 8))}%` }}
        />

        {STEPS.map((step, i) => {
          const Icon = step.icon;
          const isComplete = i <= currentIdx;
          const isCurrent = i === currentIdx;

          return (
            <div key={step.key} className="flex flex-col items-center relative z-10" style={{ flex: 1 }}>
              <div
                className={`w-10 h-10 flex items-center justify-center border-2 transition-all ${
                  isComplete
                    ? 'border-[#ff6b6b] bg-[#ff6b6b] text-white'
                    : 'border-[var(--bulletin-border)] bg-[var(--bulletin-card)] text-[var(--bulletin-text)] opacity-30'
                } ${isCurrent ? 'scale-110 shadow-[3px_3px_0_0_var(--bulletin-shadow)]' : ''}`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span className={`mt-2 text-[9px] font-black uppercase tracking-widest text-center ${
                isComplete ? 'text-[var(--bulletin-text)]' : 'text-[var(--bulletin-text)] opacity-30'
              }`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
