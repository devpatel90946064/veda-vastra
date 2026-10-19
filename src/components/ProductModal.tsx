import React, { useState } from 'react';
import { X, Star, MapPin, Truck, CheckCircle2, ShieldCheck, ShoppingBag, Package } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { lookupPincode } from '../utils/indiaPincodes';

export const ProductModal: React.FC = () => {
  const {
    selectedProduct,
    setSelectedProduct,
    addToCart,
    formatINR,
    currentPincode,
    checkPincode,
    serviceability,
    checkingServiceability,
  } = useStore();

  const [quantity, setQuantity] = useState(1);
  const [testPin, setTestPin] = useState(currentPincode);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  if (!selectedProduct) return null;

  const pinDetails = lookupPincode(testPin);

  const handlePinCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (testPin.length === 6) {
      checkPincode(testPin);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden border border-amber-900/10 flex flex-col md:flex-row max-h-[90vh]">
        {/* Left: Images */}
        <div className="w-full md:w-1/2 p-6 bg-stone-50 flex flex-col justify-between border-b md:border-b-0 md:border-r border-amber-900/10">
          <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-white shadow-inner mb-4">
            <img
              src={selectedProduct.images[activeImageIndex] || selectedProduct.images[0]}
              alt={selectedProduct.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 left-3 bg-amber-950/80 backdrop-blur-md text-amber-200 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
              <MapPin className="w-3 h-3 text-amber-400" />
              <span>{selectedProduct.originState}</span>
            </div>
          </div>

          {selectedProduct.images.length > 1 && (
            <div className="flex gap-2">
              {selectedProduct.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                    activeImageIndex === idx ? 'border-amber-900 shadow-md' : 'border-transparent opacity-70'
                  }`}
                >
                  <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Logistics Specs Badge */}
          <div className="mt-4 p-3 bg-white rounded-xl border border-amber-900/10 text-xs space-y-1.5 text-slate-600">
            <div className="flex justify-between">
              <span className="text-slate-400">Parcel Dimensions:</span>
              <span className="font-medium text-slate-800">
                {selectedProduct.lengthCm} × {selectedProduct.breadthCm} × {selectedProduct.heightCm} cm
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Dead Weight:</span>
              <span className="font-medium text-slate-800">{selectedProduct.weightKg} kg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">HSN Code (GST):</span>
              <span className="font-medium text-slate-800">{selectedProduct.hsnCode}</span>
            </div>
          </div>
        </div>

        {/* Right: Product Details & Shipping Serviceability */}
        <div className="w-full md:w-1/2 p-6 overflow-y-auto flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">
                {selectedProduct.category}
              </span>
              <button
                onClick={() => setSelectedProduct(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h2 className="font-serif text-xl sm:text-2xl font-bold text-slate-900 mb-2 leading-snug">
              {selectedProduct.name}
            </h2>

            <div className="flex items-center gap-3 text-xs mb-4">
              <div className="flex items-center gap-1 text-amber-600 font-bold bg-amber-50 px-2.5 py-1 rounded-md">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>{selectedProduct.rating} Rating</span>
              </div>
              <span className="text-slate-400">•</span>
              <span className="text-slate-600">SKU: {selectedProduct.sku}</span>
              <span className="text-slate-400">•</span>
              <span className="text-emerald-700 font-medium">
                {selectedProduct.stock > 0 ? `In Stock (${selectedProduct.stock})` : 'Out of Stock'}
              </span>
            </div>

            {/* Price section */}
            <div className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-900/10 mb-5">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-serif text-2xl font-bold text-amber-950">
                  {formatINR(selectedProduct.price)}
                </span>
                <span className="text-sm text-slate-400 line-through">
                  {formatINR(selectedProduct.mrp)}
                </span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-sm">
                  Save {formatINR(selectedProduct.mrp - selectedProduct.price)}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Taxes included. Free All-India courier delivery on orders over ₹1,999.
              </p>
            </div>

            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mb-6">
              {selectedProduct.description}
            </p>

            {/* Shiprocket Delivery & COD Estimator */}
            <div className="mb-6 p-4 rounded-xl border border-amber-900/15 bg-white shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Truck className="w-4 h-4 text-amber-700" />
                  <span>Delivery & COD Serviceability Check</span>
                </div>
                {pinDetails && (
                  <span className="text-[11px] text-slate-500">
                    {pinDetails.state} ({pinDetails.tier})
                  </span>
                )}
              </div>

              <form onSubmit={handlePinCheck} className="flex gap-2 mb-3">
                <input
                  type="text"
                  maxLength={6}
                  value={testPin}
                  onChange={(e) => setTestPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6-digit Indian PIN"
                  className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-700"
                />
                <button
                  type="submit"
                  disabled={checkingServiceability}
                  className="px-3.5 py-1.5 bg-amber-900 text-amber-100 text-xs font-medium rounded-lg hover:bg-amber-950 transition-colors"
                >
                  {checkingServiceability ? 'Checking...' : 'Check'}
                </button>
              </form>

              {serviceability && (
                <div className="text-xs space-y-1.5 bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                  <div className="flex items-center justify-between font-medium">
                    <span className="text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Courier Serviceable to PIN {serviceability.pincode}
                    </span>
                    <span className="text-slate-600 text-[11px]">
                      Est. {serviceability.couriers[0]?.estimatedDeliveryDays || 3} Days
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Available couriers: {serviceability.couriers.map((c) => c.courierName).join(', ')}
                  </p>
                  <p className="text-[11px] font-semibold text-amber-950">
                    {selectedProduct.isCodEligible && serviceability.codAvailable
                      ? '💵 Cash on Delivery (COD) available for this product & location'
                      : '💳 Prepaid payment only for this destination'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Add to Cart Actions */}
          <div className="pt-4 border-t border-amber-900/10 flex items-center gap-3">
            <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-2 text-slate-600 hover:bg-slate-100"
              >
                -
              </button>
              <span className="px-3 py-2 text-xs font-bold text-slate-800">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(selectedProduct.stock, quantity + 1))}
                className="px-3 py-2 text-slate-600 hover:bg-slate-100"
              >
                +
              </button>
            </div>

            <button
              onClick={() => {
                addToCart(selectedProduct, quantity);
                setSelectedProduct(null);
              }}
              disabled={selectedProduct.stock <= 0}
              className={`flex-1 py-3 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 cursor-pointer ${
                selectedProduct.stock > 0
                  ? 'bg-amber-900 hover:bg-amber-950 text-white'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Add to Cart • {formatINR(selectedProduct.price * quantity)}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
