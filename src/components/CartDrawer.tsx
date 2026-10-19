import React from 'react';
import { X, Trash2, ArrowRight, ShoppingBag, Truck, ShieldCheck } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    cartSubtotal,
    formatINR,
    setIsCheckoutOpen,
  } = useStore();

  if (!isCartOpen) return null;

  const freeShippingThreshold = 1999;
  const amountNeeded = Math.max(0, freeShippingThreshold - cartSubtotal);
  const freeShippingProgress = Math.min(100, Math.round((cartSubtotal / freeShippingThreshold) * 100));

  const totalWeightKg = cart.reduce(
    (sum, item) => sum + (item.product.weightKg || 0.5) * item.quantity,
    0
  );

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-4 border-b border-amber-900/10 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-amber-900" />
            <h2 className="font-serif font-bold text-lg text-slate-900">Your Craft Cart</h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
              {cart.reduce((s, i) => s + i.quantity, 0)} items
            </span>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Shipping Progress Bar */}
        <div className="p-3 bg-amber-50/70 border-b border-amber-900/10 text-xs">
          <div className="flex items-center justify-between font-medium text-amber-950 mb-1.5">
            <span className="flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-amber-700" />
              {amountNeeded > 0 ? (
                <>Add <span className="font-bold">{formatINR(amountNeeded)}</span> more for Free Delivery</>
              ) : (
                <span className="text-emerald-700 font-bold">🎉 You have unlocked Free All-India Shipping!</span>
              )}
            </span>
            <span className="text-[11px] text-amber-800 font-bold">{freeShippingProgress}%</span>
          </div>
          <div className="w-full h-1.5 bg-amber-200/70 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-700 transition-all duration-300 rounded-full"
              style={{ width: `${freeShippingProgress}%` }}
            ></div>
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <ShoppingBag className="w-12 h-12 stroke-1 text-slate-300 mb-3" />
              <p className="font-medium text-slate-600 text-sm">Your cart is empty</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Explore our handwoven textiles, brass sculptures, and GI-certified Indian crafts.
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product.id}
                className="flex gap-3 p-3 rounded-xl border border-amber-900/10 bg-white hover:border-amber-900/20 transition-all shadow-2xs"
              >
                <img
                  src={item.product.images[0]}
                  alt={item.product.name}
                  className="w-18 h-18 rounded-lg object-cover bg-stone-100 shrink-0"
                />
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="font-serif font-bold text-xs text-slate-900 line-clamp-1">
                      {item.product.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {item.product.originState} • {item.product.weightKg} kg
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <span className="font-serif font-bold text-xs text-amber-950">
                      {formatINR(item.product.price * item.quantity)}
                    </span>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-200 cursor-pointer"
                        >
                          -
                        </button>
                        <span className="px-2 py-0.5 text-[11px] font-bold text-slate-800">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-200 cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer & Checkout Action */}
        {cart.length > 0 && (
          <div className="p-4 border-t border-amber-900/10 bg-stone-50 space-y-3">
            <div className="space-y-1 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} items)</span>
                <span className="font-semibold text-slate-800">{formatINR(cartSubtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Shiprocket Freight</span>
                <span className="font-semibold text-slate-800">
                  {cartSubtotal >= freeShippingThreshold ? (
                    <span className="text-emerald-700 font-bold">FREE</span>
                  ) : (
                    '₹99 (Calculated at Checkout)'
                  )}
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Total Consignment Weight</span>
                <span>{totalWeightKg.toFixed(2)} kg</span>
              </div>
            </div>

            <div className="pt-2 border-t border-amber-900/10 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Estimated Total</p>
                <p className="font-serif font-bold text-xl text-slate-900">
                  {formatINR(cartSubtotal >= freeShippingThreshold ? cartSubtotal : cartSubtotal + 99)}
                </p>
              </div>

              <button
                onClick={() => {
                  setIsCartOpen(false);
                  setIsCheckoutOpen(true);
                }}
                className="px-5 py-3 rounded-xl bg-amber-900 hover:bg-amber-950 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-amber-950/20 active:scale-95 transition-all cursor-pointer"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Razorpay Verified • COD Available • Pan-India Courier</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
