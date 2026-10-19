import React from 'react';
import { Truck, Banknote, ShieldCheck, Award } from 'lucide-react';

export const HeroBanner: React.FC = () => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-amber-950 via-amber-900 to-stone-900 text-amber-50 py-10 md:py-14 px-4 sm:px-6 mb-8 border-b border-amber-800/30">
      {/* Subtle traditional Indian geometric motif background overlay */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fde68a_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-semibold mb-4">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>Preserving Indian Heritage & Artisanship</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight mb-4">
            Authentic Indian Crafts & Textiles, Delivered Across 29,000+ PIN Codes
          </h1>

          <p className="text-sm sm:text-base text-amber-200/80 leading-relaxed mb-8 max-w-2xl font-light">
            Directly from master weavers of Varanasi and Chanderi, bell-metal sculptors of Bastar, and Kashmiri craftsmen. Fully integrated with Shiprocket courier fulfillment and Razorpay checkout.
          </p>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <Truck className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-white">All-India Shipping</p>
                <p className="text-[11px] text-amber-200/70">Shiprocket Couriers</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <Banknote className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-white">Cash on Delivery</p>
                <p className="text-[11px] text-amber-200/70">Pay on Handover</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <ShieldCheck className="w-5 h-5 text-sky-400 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-white">Razorpay Secure</p>
                <p className="text-[11px] text-amber-200/70">UPI, Cards, Netbanking</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <Award className="w-5 h-5 text-yellow-400 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-white">GI-Tagged Origins</p>
                <p className="text-[11px] text-amber-200/70">100% Genuine Art</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
