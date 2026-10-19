import crypto from 'crypto';
import Razorpay from 'razorpay';

export function isRazorpayConfigured(): boolean {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

export function getRazorpayKeyId(): string | null {
  return process.env.RAZORPAY_KEY_ID || null;
}

export function getRazorpayInstance(): Razorpay | null {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) return null;

  try {
    return new Razorpay({ key_id, key_secret });
  } catch (err) {
    console.error('Error creating Razorpay client:', err);
    return null;
  }
}

/**
 * Create Razorpay Order server-side
 */
export async function createRazorpayOrder(options: {
  amountPaise: number;
  orderNumber: string;
  notes?: Record<string, string>;
}): Promise<{
  success: boolean;
  orderId: string;
  amount: number;
  currency: string;
  keyId: string | null;
  mode: 'live_api' | 'sandbox_mode';
  message?: string;
}> {
  const razorpay = getRazorpayInstance();

  if (razorpay) {
    try {
      const order = await razorpay.orders.create({
        amount: options.amountPaise,
        currency: 'INR',
        receipt: options.orderNumber,
        notes: options.notes || {},
      });

      return {
        success: true,
        orderId: order.id,
        amount: Number(order.amount),
        currency: order.currency,
        keyId: getRazorpayKeyId(),
        mode: 'live_api',
      };
    } catch (err: any) {
      console.error('Razorpay order creation error:', err);
      return {
        success: false,
        orderId: '',
        amount: options.amountPaise,
        currency: 'INR',
        keyId: null,
        mode: 'live_api',
        message: err.error?.description || err.message || 'Razorpay order creation failed',
      };
    }
  }

  // Sandbox fallback for development / test preview when API keys are not supplied in .env
  const mockOrderId = `order_${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
  return {
    success: true,
    orderId: mockOrderId,
    amount: options.amountPaise,
    currency: 'INR',
    keyId: 'rzp_test_placeholder_key',
    mode: 'sandbox_mode',
    message: 'Sandbox order generated. To enable live Razorpay Checkout, add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env',
  };
}

/**
 * Verify Razorpay payment signature
 */
export function verifyPaymentSignature(options: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    // If running in sandbox preview mode with simulated checkout
    if (options.razorpayOrderId.startsWith('order_') && options.razorpaySignature.startsWith('simulated_sig_')) {
      return true;
    }
    return false;
  }

  const generatedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${options.razorpayOrderId}|${options.razorpayPaymentId}`)
    .digest('hex');

  return generatedSignature === options.razorpaySignature;
}

/**
 * Verify Razorpay Webhook signature
 */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) return false;

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  return expectedSignature === signature;
}

/**
 * Process Razorpay Refund
 */
export async function processRazorpayRefund(options: {
  paymentId: string;
  amountPaise: number;
  notes?: Record<string, string>;
}): Promise<{
  success: boolean;
  refundId: string;
  message: string;
}> {
  const razorpay = getRazorpayInstance();

  if (razorpay) {
    try {
      const refund = await razorpay.payments.refund(options.paymentId, {
        amount: options.amountPaise,
        notes: options.notes,
      });

      return {
        success: true,
        refundId: refund.id,
        message: 'Refund successfully initiated via Razorpay',
      };
    } catch (err: any) {
      console.error('Razorpay refund error:', err);
      return {
        success: false,
        refundId: '',
        message: err.error?.description || err.message || 'Refund failed on Razorpay API',
      };
    }
  }

  // Sandbox refund fallback
  const simulatedRefundId = `rfnd_${Date.now().toString(36)}`;
  return {
    success: true,
    refundId: simulatedRefundId,
    message: 'Sandbox refund processed successfully (No live API keys configured)',
  };
}
