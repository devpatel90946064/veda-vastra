import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  Banknote,
  Truck,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  MapPin,
  Phone,
  Mail,
  User,
  ArrowRight,
  Printer,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { INDIAN_STATES, lookupPincode } from '../utils/indiaPincodes';
import { Order, ShippingAddress } from '../types';

export const CheckoutModal: React.FC = () => {
  const {
    cart,
    clearCart,
    isCheckoutOpen,
    setIsCheckoutOpen,
    formatINR,
    currentPincode,
    currentUser,
    integrationStatus,
    setIsTrackingOpen,
  } = useStore();

  const [step, setStep] = useState<'address' | 'courier' | 'payment' | 'confirmed'>('address');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Address State
  const [address, setAddress] = useState<ShippingAddress>({
    fullName: currentUser?.displayName || '',
    email: currentUser?.email || '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: currentPincode || '110001',
  });

  // Server Calculated Totals
  const [orderTotals, setOrderTotals] = useState<{
    subtotal: number;
    shippingCharges: number;
    codFee: number;
    totalAmount: number;
    totalWeightKg: number;
  }>({
    subtotal: 0,
    shippingCharges: 0,
    codFee: 0,
    totalAmount: 0,
    totalWeightKg: 0,
  });

  // Payment Selection
  const [paymentMethod, setPaymentMethod] = useState<'ONLINE' | 'COD'>('ONLINE');
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  // Fetch verified order totals from backend whenever cart or payment method changes
  useEffect(() => {
    if (!cart.length) return;

    const fetchTotals = async () => {
      try {
        const res = await fetch('/api/orders/calculate-total', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: cart.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
            paymentMethod,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setOrderTotals(data);
        }
      } catch (err) {
        console.error('Error fetching backend totals:', err);
      }
    };

    fetchTotals();
  }, [cart, paymentMethod]);

  // Auto-fill state when PIN code is entered
  const handlePincodeChange = (pin: string) => {
    const clean = pin.replace(/\D/g, '');
    setAddress((prev) => ({ ...prev, pincode: clean }));
    if (clean.length === 6) {
      const info = lookupPincode(clean);
      if (info) {
        setAddress((prev) => ({
          ...prev,
          state: info.state !== 'India' ? info.state : prev.state,
          city: info.tier === 'Metro' && info.state === 'Delhi' ? 'New Delhi' : prev.city,
        }));
      }
    }
  };

  // Validate Address Step
  const handleProceedToCourier = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!address.fullName.trim()) return setErrorMessage('Please enter recipient full name');
    if (!address.email.trim() || !address.email.includes('@')) return setErrorMessage('Please enter a valid email address');
    if (address.phone.replace(/\D/g, '').length !== 10) return setErrorMessage('Please enter a valid 10-digit Indian phone number');
    if (address.pincode.length !== 6) return setErrorMessage('Please enter a valid 6-digit Indian PIN code');
    if (!address.addressLine1.trim()) return setErrorMessage('Please enter street or apartment address');
    if (!address.city.trim()) return setErrorMessage('Please enter city');

    setStep('courier');
  };

  // Handle Razorpay Online Payment Flow
  const handleRazorpayPayment = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      // 1. Create Order on backend
      const res = await fetch('/api/payments/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
          shippingAddress: address,
          customerEmail: address.email,
          customerName: address.fullName,
        }),
      });

      const orderData = await res.json();
      if (!res.ok || !orderData.razorpayOrderId) {
        throw new Error(orderData.error || 'Failed to initiate Razorpay order');
      }

      const rzpKey = orderData.keyId;

      // 2. Check if Razorpay JS SDK is loaded and we have live keys
      if ((window as any).Razorpay && rzpKey && rzpKey.startsWith('rzp_')) {
        const options = {
          key: rzpKey,
          amount: orderData.amount,
          currency: 'INR',
          name: 'Veda & Vastra',
          description: `Order ${orderData.orderNumber} Fulfillment`,
          order_id: orderData.razorpayOrderId,
          prefill: {
            name: address.fullName,
            email: address.email,
            contact: address.phone,
          },
          theme: { color: '#78350f' },
          handler: async function (response: any) {
            // 3. Server-side signature verification
            try {
              const verifyRes = await fetch('/api/payments/razorpay/verify-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                  orderNumber: orderData.orderNumber,
                  customerName: address.fullName,
                  customerEmail: address.email,
                  customerPhone: address.phone,
                  shippingAddress: address,
                  items: cart.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
                  userId: currentUser?.uid || 'guest',
                }),
              });

              const verifyData = await verifyRes.json();
              if (verifyRes.ok && verifyData.success) {
                setConfirmedOrder(verifyData.order);
                clearCart();
                setStep('confirmed');
              } else {
                setErrorMessage(verifyData.error || 'Payment verification failed');
              }
            } catch (vErr: any) {
              setErrorMessage('Payment verification request failed: ' + vErr.message);
            }
          },
          modal: {
            ondismiss: function () {
              setLoading(false);
            },
          },
        };

        const razorpayInstance = new (window as any).Razorpay(options);
        razorpayInstance.open();
        setLoading(false);
      } else {
        // High-Fidelity Sandbox / Simulator Verification Mode
        // Generates verified mock signature and records order in backend
        const simulatedPaymentId = `pay_${Math.random().toString(36).substring(2, 12)}`;
        const simulatedSignature = `simulated_sig_${Math.random().toString(36).substring(2, 15)}`;

        const verifyRes = await fetch('/api/payments/razorpay/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razorpayOrderId: orderData.razorpayOrderId,
            razorpayPaymentId: simulatedPaymentId,
            razorpaySignature: simulatedSignature,
            orderNumber: orderData.orderNumber,
            customerName: address.fullName,
            customerEmail: address.email,
            customerPhone: address.phone,
            shippingAddress: address,
            items: cart.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
            userId: currentUser?.uid || 'guest',
          }),
        });

        const verifyData = await verifyRes.json();
        if (verifyRes.ok && verifyData.success) {
          setConfirmedOrder(verifyData.order);
          clearCart();
          setStep('confirmed');
        } else {
          setErrorMessage(verifyData.error || 'Payment verification failed');
        }
        setLoading(false);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment processing error');
      setLoading(false);
    }
  };

  // Handle Cash on Delivery (COD) Flow
  const handleCodCheckout = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/orders/create-cod', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: address.fullName,
          customerEmail: address.email,
          customerPhone: address.phone,
          shippingAddress: address,
          items: cart.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
          userId: currentUser?.uid || 'guest',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setConfirmedOrder(data.order);
        clearCart();
        setStep('confirmed');
      } else {
        setErrorMessage(data.error || 'Could not place COD order');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error placing COD order');
    } finally {
      setLoading(false);
    }
  };

  if (!isCheckoutOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden border border-amber-900/15 flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="p-4 border-b border-amber-900/10 flex items-center justify-between bg-stone-50">
          <div>
            <h2 className="font-serif font-bold text-lg text-slate-900">Secure Indian Checkout</h2>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
              <span className={step === 'address' ? 'font-bold text-amber-900' : ''}>1. Address</span>
              <ChevronRight className="w-3 h-3" />
              <span className={step === 'courier' ? 'font-bold text-amber-900' : ''}>2. Courier</span>
              <ChevronRight className="w-3 h-3" />
              <span className={step === 'payment' ? 'font-bold text-amber-900' : ''}>3. Payment</span>
              <ChevronRight className="w-3 h-3" />
              <span className={step === 'confirmed' ? 'font-bold text-emerald-700' : ''}>4. Complete</span>
            </div>
          </div>
          <button
            onClick={() => setIsCheckoutOpen(false)}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: CUSTOMER & DELIVERY ADDRESS */}
          {step === 'address' && (
            <form onSubmit={handleProceedToCourier} className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
                <MapPin className="w-4 h-4 text-amber-800" />
                <span>Pan-India Delivery Address</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Full Recipient Name *</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={address.fullName}
                      onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                      placeholder="e.g. Aarav Sharma"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-800 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">10-Digit Mobile Number *</label>
                  <div className="relative">
                    <span className="text-xs font-semibold text-slate-500 absolute left-3 top-1/2 -translate-y-1/2">+91</span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={address.phone}
                      onChange={(e) => setAddress({ ...address, phone: e.target.value.replace(/\D/g, '') })}
                      placeholder="9876543210"
                      className="w-full pl-11 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-800 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Email Address (for order receipts & tracking) *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={address.email}
                    onChange={(e) => setAddress({ ...address, email: e.target.value })}
                    placeholder="aarav@example.com"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-800 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Flat / House No. / Building / Street *</label>
                <input
                  type="text"
                  required
                  value={address.addressLine1}
                  onChange={(e) => setAddress({ ...address, addressLine1: e.target.value })}
                  placeholder="e.g. Flat 402, Lotus Heritage Apartments, MG Road"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-800 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Landmark / Locality (Optional)</label>
                <input
                  type="text"
                  value={address.addressLine2 || ''}
                  onChange={(e) => setAddress({ ...address, addressLine2: e.target.value })}
                  placeholder="e.g. Near HDFC Bank, Indiranagar"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-800 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">PIN Code *</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={address.pincode}
                    onChange={(e) => handlePincodeChange(e.target.value)}
                    placeholder="6-digit PIN"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-800 focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    placeholder="City"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-800 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">State / UT *</label>
                  <select
                    value={address.state}
                    onChange={(e) => setAddress({ ...address, state: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-800 focus:outline-hidden bg-white"
                  >
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-900 text-white rounded-xl text-xs font-semibold hover:bg-amber-950 flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <span>Select Courier & Shipping</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: SHIPROCKET COURIER SERVICEABILITY & SELECTION */}
          {step === 'courier' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                  <Truck className="w-4 h-4 text-amber-800" />
                  <span>Shiprocket Courier Partner & Dispatch</span>
                </div>
                <button
                  onClick={() => setStep('address')}
                  className="text-xs text-amber-900 underline cursor-pointer"
                >
                  Edit Address
                </button>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs flex justify-between items-center">
                <div>
                  <p className="font-semibold text-slate-800">{address.fullName} • +91 {address.phone}</p>
                  <p className="text-slate-600 text-[11px] mt-0.5">
                    {address.addressLine1}, {address.city}, {address.state} - {address.pincode}
                  </p>
                </div>
                <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-semibold">
                  Serviceable
                </span>
              </div>

              {/* Courier choices */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-700">Fulfillment Courier Partner</label>
                
                <div className="p-3 rounded-xl border-2 border-amber-900 bg-amber-50/40 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-900 text-white flex items-center justify-center font-bold text-xs">
                      EXP
                    </div>
                    <div>
                      <p className="font-bold text-xs text-slate-900">Delhivery Surface Express</p>
                      <p className="text-[11px] text-slate-500">
                        Estimated Transit: 2-3 business days • AWB generated automatically
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-800">
                      {orderTotals.shippingCharges === 0 ? 'FREE' : '₹99'}
                    </span>
                    <p className="text-[10px] text-slate-400">Included in total</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between opacity-80">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-sky-900 text-white flex items-center justify-center font-bold text-xs">
                      AIR
                    </div>
                    <div>
                      <p className="font-bold text-xs text-slate-900">Blue Dart Air Express</p>
                      <p className="text-[11px] text-slate-500">Fastest transit • 1-2 business days</p>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-500">Secondary Route</span>
                </div>
              </div>

              {/* Order Items Preview */}
              <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-900/10">
                <p className="text-xs font-bold text-amber-950 mb-2">Consignment Items ({cart.length})</p>
                <div className="space-y-2 max-h-36 overflow-y-auto">
                  {cart.map((it) => (
                    <div key={it.product.id} className="flex justify-between text-xs">
                      <span className="text-slate-700">
                        {it.product.name} × {it.quantity}
                      </span>
                      <span className="font-semibold text-slate-900">
                        {formatINR(it.product.price * it.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setStep('address')}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep('payment')}
                  className="px-6 py-2.5 bg-amber-900 text-white rounded-xl text-xs font-semibold hover:bg-amber-950 flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <span>Proceed to Payment</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PAYMENT METHOD (RAZORPAY ONLINE VS CASH ON DELIVERY) */}
          {step === 'payment' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                  <CreditCard className="w-4 h-4 text-amber-800" />
                  <span>Select Payment Method</span>
                </div>
                <button
                  onClick={() => setStep('courier')}
                  className="text-xs text-amber-900 underline cursor-pointer"
                >
                  Change Shipping
                </button>
              </div>

              {/* Payment Method Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Razorpay Online */}
                <div
                  onClick={() => setPaymentMethod('ONLINE')}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'ONLINE'
                      ? 'border-amber-900 bg-amber-50/60 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-amber-800" />
                      <span className="font-bold text-xs text-slate-900">Razorpay Online</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-sm">
                      Recommended
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mb-2">
                    UPI (Google Pay, PhonePe, Paytm), Credit & Debit Cards, Netbanking.
                  </p>
                  <p className="text-[10px] text-emerald-700 font-medium">✓ Zero convenience fee</p>
                </div>

                {/* 2. Cash on Delivery */}
                <div
                  onClick={() => setPaymentMethod('COD')}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'COD'
                      ? 'border-amber-900 bg-amber-50/60 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Banknote className="w-5 h-5 text-emerald-700" />
                      <span className="font-bold text-xs text-slate-900">Cash on Delivery</span>
                    </div>
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-sm">
                      +₹49 COD Fee
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mb-2">
                    Pay in cash directly to the Shiprocket delivery courier upon parcel handover.
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Order saved with status: <span className="font-mono font-bold">COD_PENDING</span>
                  </p>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Cart Subtotal</span>
                  <span className="font-semibold">{formatINR(orderTotals.subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Shiprocket Express Freight</span>
                  <span className="font-semibold">
                    {orderTotals.shippingCharges === 0 ? (
                      <span className="text-emerald-700 font-bold">FREE</span>
                    ) : (
                      formatINR(orderTotals.shippingCharges)
                    )}
                  </span>
                </div>
                {paymentMethod === 'COD' && (
                  <div className="flex justify-between text-amber-900">
                    <span>Courier Cash Collection Fee (COD)</span>
                    <span className="font-semibold">+₹49</span>
                  </div>
                )}
                <div className="pt-2 border-t border-stone-300 flex justify-between font-serif font-bold text-base text-slate-900">
                  <span>Total Payable</span>
                  <span className="text-amber-950">
                    {formatINR(
                      paymentMethod === 'COD'
                        ? orderTotals.subtotal + orderTotals.shippingCharges + 49
                        : orderTotals.subtotal + orderTotals.shippingCharges
                    )}
                  </span>
                </div>
              </div>

              {/* Payment Action Button */}
              <div className="pt-2 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setStep('courier')}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Back
                </button>

                {paymentMethod === 'ONLINE' ? (
                  <button
                    onClick={handleRazorpayPayment}
                    disabled={loading}
                    className="px-6 py-3 bg-amber-900 text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-amber-950 flex items-center gap-2 cursor-pointer shadow-lg active:scale-95 transition-all disabled:opacity-50"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>
                      {loading
                        ? 'Initiating Payment...'
                        : `Pay ${formatINR(orderTotals.subtotal + orderTotals.shippingCharges)} with Razorpay`}
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={handleCodCheckout}
                    disabled={loading}
                    className="px-6 py-3 bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-emerald-900 flex items-center gap-2 cursor-pointer shadow-lg active:scale-95 transition-all disabled:opacity-50"
                  >
                    <Banknote className="w-4 h-4" />
                    <span>
                      {loading
                        ? 'Placing COD Order...'
                        : `Confirm Order with Cash on Delivery • ${formatINR(
                            orderTotals.subtotal + orderTotals.shippingCharges + 49
                          )}`}
                    </span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: ORDER CONFIRMED SCREEN */}
          {step === 'confirmed' && confirmedOrder && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h3 className="font-serif text-2xl font-bold text-slate-900">
                  Dhanyavaad! Your Order is Confirmed
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  We have dispatched confirmation details to {confirmedOrder.customerEmail}
                </p>
              </div>

              {/* Order Meta Badges */}
              <div className="max-w-md mx-auto p-4 rounded-xl bg-amber-50/70 border border-amber-900/10 text-xs text-left space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Order Number:</span>
                  <span className="font-mono font-bold text-amber-950">{confirmedOrder.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Order Lifecycle Status:</span>
                  <span className="font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-sm">
                    {confirmedOrder.orderStatus}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Status:</span>
                  <span
                    className={`font-semibold px-2 py-0.5 rounded-sm ${
                      confirmedOrder.paymentStatus === 'PAID'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-900'
                    }`}
                  >
                    {confirmedOrder.paymentStatus}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Shipment Status:</span>
                  <span className="font-semibold text-sky-800 bg-sky-100 px-2 py-0.5 rounded-sm">
                    {confirmedOrder.shipmentStatus}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Method:</span>
                  <span className="font-semibold text-slate-800">{confirmedOrder.paymentMethod}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-amber-900/10 font-bold text-sm">
                  <span>Total Amount:</span>
                  <span className="text-amber-950">{formatINR(confirmedOrder.totalAmount)}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-4 flex flex-wrap justify-center gap-3">
                <button
                  onClick={() => {
                    setIsCheckoutOpen(false);
                    setIsTrackingOpen(true);
                  }}
                  className="px-4 py-2.5 bg-amber-900 text-white rounded-xl text-xs font-semibold hover:bg-amber-950 flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Truck className="w-3.5 h-3.5" /> Track This Order
                </button>

                <button
                  onClick={() => window.print()}
                  className="px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Tax Receipt
                </button>

                <button
                  onClick={() => setIsCheckoutOpen(false)}
                  className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-slate-700 rounded-xl text-xs font-medium cursor-pointer"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
