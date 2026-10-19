export type OrderStatus =
  | 'PLACED'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RTO';

export type PaymentStatus =
  | 'PENDING'
  | 'PAID'
  | 'COD_PENDING'
  | 'REFUNDED'
  | 'FAILED';

export type ShipmentStatus =
  | 'NOT_CREATED'
  | 'BOOKED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'EXCEPTION'
  | 'RTO';

export type PaymentMethod = 'ONLINE' | 'COD';

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number; // in INR (₹)
  mrp: number; // in INR (₹)
  stock: number;
  description: string;
  images: string[];
  weightKg: number; // e.g. 0.5 kg
  lengthCm: number; // dimensions for Shiprocket volumetric calculation
  breadthCm: number;
  heightCm: number;
  hsnCode: string;
  isCodEligible: boolean;
  rating: number;
  reviewsCount?: number;
  originState: string; // e.g. 'Madhya Pradesh', 'Rajasthan'
  material?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface ShippingAddress {
  fullName: string;
  phone: string; // 10-digit Indian mobile
  email: string;
  addressLine1: string; // House/Flat, Street
  addressLine2?: string; // Landmark, Area
  city: string;
  state: string; // Indian State/UT
  pincode: string; // 6-digit Indian PIN code
}

export interface OrderItem {
  productId: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  weightKg: number;
  hsnCode?: string;
  image?: string;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. VV-2026-10492
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: ShippingAddress;
  items: OrderItem[];
  subtotal: number;
  shippingCharges: number;
  codFee: number;
  discount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  shipmentStatus: ShipmentStatus;
  
  // Razorpay attributes
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  refundId?: string;
  refundAmount?: number;
  refundReason?: string;
  
  // Shiprocket attributes
  shiprocketOrderId?: string;
  shiprocketShipmentId?: string;
  awbCode?: string;
  courierName?: string;
  courierCompanyId?: number;
  trackingUrl?: string;
  shippingLabelUrl?: string;
  pickupTokenNumber?: string;
  estimatedDeliveryDate?: string;
  isManualShipping?: boolean;
  
  // Notes and history
  notes?: string;
  createdAt: string;
  updatedAt: string;
  paymentVerifiedAt?: string;
  codCollectedAt?: string;
}

export interface CourierOption {
  courierCompanyId: number;
  courierName: string;
  rate: number;
  estimatedDeliveryDays: number;
  codAvailable: boolean;
  etdDate?: string;
  isRecommended?: boolean;
}

export interface ServiceabilityResult {
  pincode: string;
  isServiceable: boolean;
  codAvailable: boolean;
  city?: string;
  state?: string;
  couriers: CourierOption[];
  source: 'shiprocket_api' | 'simulated_fallback';
  message?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  performedBy: string;
  targetEntity: 'order' | 'product' | 'shipment' | 'setting' | 'payment';
  targetId: string;
  details: Record<string, any>;
  createdAt: string;
}

export interface IntegrationStatus {
  razorpay: {
    isConfigured: boolean;
    keyId: string | null;
    mode: 'test' | 'live' | 'unconfigured';
    webhookConfigured: boolean;
  };
  shiprocket: {
    isConfigured: boolean;
    email: string | null;
    pickupLocation: string;
    pickupPincode: string;
    mode: 'api' | 'fallback';
    webhookConfigured: boolean;
  };
  serverTime: string;
}
