import React, { useState } from 'react';
import { X, Search, Truck, CheckCircle2, Clock, AlertTriangle, ExternalLink, Package } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const OrderTrackingModal: React.FC = () => {
  const { isTrackingOpen, setIsTrackingOpen, formatINR } = useStore();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [trackedOrder, setTrackedOrder] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isTrackingOpen) return null;

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/track/${encodeURIComponent(query.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setTrackedOrder(data);
      } else {
        setError('Order not found. Please verify the order number (e.g. VV-2026-xxxxx)');
        setTrackedOrder(null);
      }
    } catch (err: any) {
      setError('Network error tracking order');
    } finally {
      setLoading(false);
    }
  };

  const stages = ['PLACED', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];
  const currentStageIndex = trackedOrder ? stages.indexOf(trackedOrder.orderStatus) : -1;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-amber-900/10 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-amber-900/10 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-amber-900" />
            <h2 className="font-serif font-bold text-lg text-slate-900">Track Consignment & Shipment</h2>
          </div>
          <button
            onClick={() => setIsTrackingOpen(false)}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-6">
          <form onSubmit={handleTrack} className="flex gap-2 mb-6">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter Order Number (e.g. VV-2026-10492)"
              className="flex-1 px-4 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-800/30 focus:outline-hidden"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-amber-900 text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-amber-950 flex items-center gap-1.5 cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>{loading ? 'Searching...' : 'Track'}</span>
            </button>
          </form>

          {error && (
            <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              {error}
            </div>
          )}

          {trackedOrder && (
            <div className="space-y-6">
              {/* Order Header Summary */}
              <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-900/10 flex flex-wrap justify-between items-center gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Order ID</span>
                  <p className="font-mono font-bold text-slate-900 text-base">{trackedOrder.orderNumber}</p>
                  <p className="text-[11px] text-slate-500">Destination: {trackedOrder.city}, {trackedOrder.state}</p>
                </div>

                <div className="flex gap-2">
                  <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-200 text-amber-900">
                    Payment: {trackedOrder.paymentStatus}
                  </span>
                  <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-sky-100 text-sky-800">
                    Shipment: {trackedOrder.shipmentStatus}
                  </span>
                </div>
              </div>

              {/* Visual Lifecycle Stepper */}
              <div>
                <p className="text-xs font-bold text-slate-800 mb-3">Consignment Lifecycle Progress</p>
                <div className="relative flex justify-between items-center">
                  <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-1 bg-slate-200 z-0"></div>
                  <div
                    className="absolute top-1/2 left-0 -translate-y-1/2 h-1 bg-amber-700 transition-all duration-500 z-0"
                    style={{
                      width: `${Math.max(0, (currentStageIndex / (stages.length - 1)) * 100)}%`,
                    }}
                  ></div>

                  {stages.map((stg, idx) => {
                    const isDone = idx <= currentStageIndex;
                    const isCurrent = idx === currentStageIndex;
                    return (
                      <div key={stg} className="relative z-10 flex flex-col items-center">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            isDone ? 'bg-amber-900 text-white' : 'bg-slate-200 text-slate-500'
                          } ${isCurrent ? 'ring-4 ring-amber-300' : ''}`}
                        >
                          {isDone ? '✓' : idx + 1}
                        </div>
                        <span className="text-[9px] font-medium text-slate-600 mt-1 whitespace-nowrap hidden sm:block">
                          {stg.replace(/_/g, ' ')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Courier & AWB Details */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Assigned Logistics Partner:</span>
                  <span className="font-bold text-slate-800">
                    {trackedOrder.courierName || 'Shiprocket Express Network'}
                  </span>
                </div>

                {trackedOrder.awbCode && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Waybill / AWB Code:</span>
                    <span className="font-mono font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-sm">
                      {trackedOrder.awbCode}
                    </span>
                  </div>
                )}

                {trackedOrder.trackingUrl && (
                  <div className="flex justify-end pt-1">
                    <a
                      href={trackedOrder.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-850 hover:underline flex items-center gap-1 font-semibold text-xs"
                    >
                      <span>Live Shiprocket Web Tracking</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>

              {/* Items List */}
              <div>
                <p className="text-xs font-bold text-slate-800 mb-2">Package Contents</p>
                <div className="space-y-2">
                  {trackedOrder.items?.map((it: any, i: number) => (
                    <div key={i} className="flex justify-between text-xs p-2 bg-stone-50 rounded-lg">
                      <span className="text-slate-700">
                        {it.name} (Qty: {it.quantity})
                      </span>
                      <span className="font-semibold text-slate-900">{formatINR(it.price * it.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
