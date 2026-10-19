import express, { Request, Response } from 'express';
import cors from 'cors';
import { dbService } from './db';
import { checkCourierServiceability, createShiprocketOrder, cancelShiprocketOrder, isShiprocketConfigured } from './shiprocket';
import { createRazorpayOrder, verifyPaymentSignature, processRazorpayRefund, isRazorpayConfigured, getRazorpayKeyId } from './razorpay';
import { Order, OrderStatus, PaymentMethod, PaymentStatus, ShipmentStatus } from '../src/types';

export const apiRouter = express.Router();

apiRouter.use(cors());
apiRouter.use(express.json());

// -----------------------------------------------------------------------------
// 1. INTEGRATION STATUS & DIAGNOSTICS
// -----------------------------------------------------------------------------
apiRouter.get('/status', (_req: Request, res: Response) => {
  const razorpayConfigured = isRazorpayConfigured();
  const shiprocketConfigured = isShiprocketConfigured();

  res.json({
    razorpay: {
      isConfigured: razorpayConfigured,
      keyId: getRazorpayKeyId(),
      mode: razorpayConfigured ? 'live_test' : 'sandbox_preview',
      webhookConfigured: Boolean(process.env.RAZORPAY_WEBHOOK_SECRET),
    },
    shiprocket: {
      isConfigured: shiprocketConfigured,
      email: process.env.SHIPROCKET_EMAIL ? `${process.env.SHIPROCKET_EMAIL.slice(0, 3)}***` : null,
      pickupLocation: process.env.SHIPROCKET_PICKUP_LOCATION || 'Primary Warehouse',
      pickupPincode: process.env.SHIPROCKET_PICKUP_PINCODE || '110001',
      mode: shiprocketConfigured ? 'api' : 'fallback',
      webhookConfigured: Boolean(process.env.SHIPROCKET_WEBHOOK_TOKEN),
    },
    serverTime: new Date().toISOString(),
  });
});

// -----------------------------------------------------------------------------
// 2. PRODUCTS
// -----------------------------------------------------------------------------
apiRouter.get('/products', (_req: Request, res: Response) => {
  const products = dbService.getAllProducts();
  res.json(products);
});

apiRouter.get('/products/:id', (req: Request, res: Response) => {
  const product = dbService.getProductById(req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json(product);
});

// -----------------------------------------------------------------------------
// 3. SHIPPING & SERVICEABILITY (SHIPROCKET)
// -----------------------------------------------------------------------------
apiRouter.post('/shipping/serviceability', async (req: Request, res: Response) => {
  try {
    const { pincode, weightKg = 0.5, isCod = false } = req.body;
    if (!pincode || typeof pincode !== 'string') {
      return res.status(400).json({ error: 'Invalid pincode provided' });
    }

    const result = await checkCourierServiceability(pincode, weightKg, isCod);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error checking serviceability' });
  }
});

// -----------------------------------------------------------------------------
// 4. ORDER TOTAL CALCULATION (SECURITY: NEVER TRUST CLIENT AMOUNTS)
// -----------------------------------------------------------------------------
apiRouter.post('/orders/calculate-total', (req: Request, res: Response) => {
  try {
    const { items, paymentMethod = 'ONLINE' } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    let subtotal = 0;
    let totalWeightKg = 0;
    const validatedItems = [];

    for (const item of items) {
      const prod = dbService.getProductById(item.productId);
      if (!prod) {
        return res.status(400).json({ error: `Product not found: ${item.productId}` });
      }

      if (prod.stock < item.quantity) {
        return res.status(400).json({
          error: `Insufficient stock for ${prod.name}. Available: ${prod.stock}`,
        });
      }

      const verifiedPrice = prod.price;
      subtotal += verifiedPrice * item.quantity;
      totalWeightKg += (prod.weightKg || 0.5) * item.quantity;

      validatedItems.push({
        productId: prod.id,
        name: prod.name,
        sku: prod.sku,
        price: verifiedPrice,
        quantity: item.quantity,
        weightKg: prod.weightKg,
        hsnCode: prod.hsnCode,
        image: prod.images[0],
      });
    }

    // Indian shipping rules: Free shipping for orders >= ₹1,999, else flat ₹99
    const shippingCharges = subtotal >= 1999 ? 0 : 99;
    
    // COD fee: ₹49 convenience fee for COD (to offset courier cash collection charge)
    const codFee = paymentMethod === 'COD' ? 49 : 0;
    const discount = 0;
    const totalAmount = subtotal + shippingCharges + codFee - discount;

    res.json({
      subtotal,
      shippingCharges,
      codFee,
      discount,
      totalAmount,
      totalWeightKg,
      items: validatedItems,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error calculating order totals' });
  }
});

// -----------------------------------------------------------------------------
// 5. RAZORPAY PAYMENT INITIATION
// -----------------------------------------------------------------------------
apiRouter.post('/payments/razorpay/create-order', async (req: Request, res: Response) => {
  try {
    const { items, shippingAddress, customerEmail, customerName } = req.body;
    if (!items || !items.length) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Server-side recalculation of total
    let subtotal = 0;
    for (const item of items) {
      const prod = dbService.getProductById(item.productId);
      if (!prod) return res.status(400).json({ error: `Item not found: ${item.productId}` });
      if (prod.stock < item.quantity) {
        return res.status(400).json({ error: `Out of stock: ${prod.name}` });
      }
      subtotal += prod.price * item.quantity;
    }

    const shippingCharges = subtotal >= 1999 ? 0 : 99;
    const totalAmount = subtotal + shippingCharges;
    const amountPaise = totalAmount * 100;

    const orderNumber = `VV-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    const rzpOrder = await createRazorpayOrder({
      amountPaise,
      orderNumber,
      notes: {
        customerEmail: customerEmail || 'guest@vedaandvastra.com',
        customerName: customerName || 'Customer',
        city: shippingAddress?.city || '',
      },
    });

    if (!rzpOrder.success) {
      return res.status(500).json({ error: rzpOrder.message });
    }

    res.json({
      orderNumber,
      razorpayOrderId: rzpOrder.orderId,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      keyId: rzpOrder.keyId,
      mode: rzpOrder.mode,
      calculatedTotal: totalAmount,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to initialize payment' });
  }
});

// -----------------------------------------------------------------------------
// 6. RAZORPAY PAYMENT VERIFICATION & ORDER RECORDING
// -----------------------------------------------------------------------------
apiRouter.post('/payments/razorpay/verify-payment', (req: Request, res: Response) => {
  try {
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      orderNumber,
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      items,
      userId = 'guest',
    } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ error: 'Incomplete payment credentials' });
    }

    const isValid = verifyPaymentSignature({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    if (!isValid) {
      dbService.addAuditLog({
        action: 'PAYMENT_SIGNATURE_FAILED',
        performedBy: customerEmail || 'unknown',
        targetEntity: 'payment',
        targetId: razorpayOrderId,
        details: { razorpayPaymentId, reason: 'HMAC signature mismatch' },
      });
      return res.status(400).json({ error: 'Invalid payment signature. Payment rejected.' });
    }

    // Calculate verified totals
    let subtotal = 0;
    const validatedItems = [];
    for (const item of items) {
      const prod = dbService.getProductById(item.productId);
      if (prod) {
        subtotal += prod.price * item.quantity;
        validatedItems.push({
          productId: prod.id,
          name: prod.name,
          sku: prod.sku,
          price: prod.price,
          quantity: item.quantity,
          weightKg: prod.weightKg,
          hsnCode: prod.hsnCode,
          image: prod.images[0],
        });
      }
    }

    const shippingCharges = subtotal >= 1999 ? 0 : 99;
    const totalAmount = subtotal + shippingCharges;

    const newOrder: Order = {
      id: `order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      orderNumber: orderNumber || `VV-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
      userId,
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      items: validatedItems,
      subtotal,
      shippingCharges,
      codFee: 0,
      discount: 0,
      totalAmount,
      paymentMethod: 'ONLINE',
      orderStatus: 'CONFIRMED',
      paymentStatus: 'PAID',
      shipmentStatus: 'NOT_CREATED',
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      paymentVerifiedAt: new Date().toISOString(),
    };

    const saved = dbService.createOrder(newOrder);
    res.json({ success: true, order: saved });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Payment verification processing failed' });
  }
});

// -----------------------------------------------------------------------------
// 7. CASH ON DELIVERY (COD) ORDER CREATION
// -----------------------------------------------------------------------------
apiRouter.post('/orders/create-cod', (req: Request, res: Response) => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      items,
      userId = 'guest',
    } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Verify stock and check COD eligibility
    let subtotal = 0;
    const validatedItems = [];
    for (const item of items) {
      const prod = dbService.getProductById(item.productId);
      if (!prod) return res.status(400).json({ error: `Product not found: ${item.productId}` });
      if (prod.stock < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for ${prod.name}` });
      }
      if (!prod.isCodEligible) {
        return res.status(400).json({ error: `${prod.name} is not eligible for Cash on Delivery` });
      }
      subtotal += prod.price * item.quantity;
      validatedItems.push({
        productId: prod.id,
        name: prod.name,
        sku: prod.sku,
        price: prod.price,
        quantity: item.quantity,
        weightKg: prod.weightKg,
        hsnCode: prod.hsnCode,
        image: prod.images[0],
      });
    }

    const shippingCharges = subtotal >= 1999 ? 0 : 99;
    const codFee = 49;
    const totalAmount = subtotal + shippingCharges + codFee;

    const orderNumber = `VV-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    const newOrder: Order = {
      id: `order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      orderNumber,
      userId,
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      items: validatedItems,
      subtotal,
      shippingCharges,
      codFee,
      discount: 0,
      totalAmount,
      paymentMethod: 'COD',
      orderStatus: 'PLACED',
      paymentStatus: 'COD_PENDING', // CRITICAL: Never marked paid before cash collection
      shipmentStatus: 'NOT_CREATED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = dbService.createOrder(newOrder);
    res.json({ success: true, order: saved });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to place COD order' });
  }
});

// -----------------------------------------------------------------------------
// 8. ORDER TRACKING LOOKUP (PUBLIC)
// -----------------------------------------------------------------------------
apiRouter.get('/orders/track/:orderNumber', (req: Request, res: Response) => {
  const order = dbService.getOrderByNumber(req.params.orderNumber);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  // Redact sensitive billing and signature fields for public view
  const safeOrder = {
    orderNumber: order.orderNumber,
    orderStatus: order.orderStatus,
    paymentStatus: order.paymentStatus,
    shipmentStatus: order.shipmentStatus,
    paymentMethod: order.paymentMethod,
    courierName: order.courierName,
    awbCode: order.awbCode,
    trackingUrl: order.trackingUrl,
    estimatedDeliveryDate: order.estimatedDeliveryDate,
    items: order.items,
    totalAmount: order.totalAmount,
    createdAt: order.createdAt,
    city: order.shippingAddress.city,
    state: order.shippingAddress.state,
  };

  res.json(safeOrder);
});

// -----------------------------------------------------------------------------
// 9. ADMIN: ORDERS MANAGEMENT
// -----------------------------------------------------------------------------
apiRouter.get('/admin/orders', (_req: Request, res: Response) => {
  const orders = dbService.getAllOrders();
  res.json(orders);
});

apiRouter.get('/admin/audit-logs', (_req: Request, res: Response) => {
  const logs = dbService.getAuditLogs();
  res.json(logs);
});

// Create Shipment via Shiprocket
apiRouter.post('/admin/shipping/create-shipment', async (req: Request, res: Response) => {
  try {
    const { orderId, courierName } = req.body;
    const order = dbService.getOrderById(orderId);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.shipmentStatus !== 'NOT_CREATED' && order.shipmentStatus !== 'EXCEPTION') {
      return res.status(400).json({ error: `Shipment already in state: ${order.shipmentStatus}` });
    }

    const shipResult = await createShiprocketOrder(order);

    if (shipResult.success) {
      const updated = dbService.updateOrder(
        orderId,
        {
          shipmentStatus: 'BOOKED',
          orderStatus: 'PROCESSING',
          shiprocketOrderId: shipResult.shiprocketOrderId,
          shiprocketShipmentId: shipResult.shipmentId,
          awbCode: shipResult.awbCode,
          courierName: courierName || shipResult.courierName || 'Delhivery Express',
          trackingUrl: shipResult.trackingUrl,
          shippingLabelUrl: shipResult.labelUrl || `https://apiv2.shiprocket.in/labels/${shipResult.awbCode}.pdf`,
          estimatedDeliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        },
        'admin@vedaandvastra.com'
      );

      return res.json({ success: true, order: updated, message: shipResult.message });
    } else {
      return res.status(500).json({ error: shipResult.message || 'Failed to create shipment' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Shipping creation error' });
  }
});

// Manual Shipping Fallback Dispatch
apiRouter.post('/admin/shipping/manual-dispatch', (req: Request, res: Response) => {
  try {
    const { orderId, courierName, awbCode, trackingUrl } = req.body;
    if (!orderId || !courierName || !awbCode) {
      return res.status(400).json({ error: 'Order ID, courier name, and AWB are required' });
    }

    const updated = dbService.updateOrder(
      orderId,
      {
        shipmentStatus: 'BOOKED',
        orderStatus: 'PROCESSING',
        courierName,
        awbCode,
        trackingUrl: trackingUrl || `https://www.google.com/search?q=${encodeURIComponent(courierName + ' ' + awbCode)}`,
        isManualShipping: true,
      },
      'admin@vedaandvastra.com'
    );

    if (!updated) return res.status(404).json({ error: 'Order not found' });
    res.json({ success: true, order: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update Shipment Status (Dispatched, Out for Delivery, Delivered)
apiRouter.post('/admin/shipping/update-status', (req: Request, res: Response) => {
  try {
    const { orderId, shipmentStatus, orderStatus } = req.body;
    const updates: Partial<Order> = {};
    if (shipmentStatus) updates.shipmentStatus = shipmentStatus;
    if (orderStatus) updates.orderStatus = orderStatus;

    const updated = dbService.updateOrder(orderId, updates, 'admin@vedaandvastra.com');
    if (!updated) return res.status(404).json({ error: 'Order not found' });
    res.json({ success: true, order: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Cancel Shipment
apiRouter.post('/admin/shipping/cancel-shipment', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.body;
    const order = dbService.getOrderById(orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (order.shiprocketOrderId) {
      await cancelShiprocketOrder(order.shiprocketOrderId);
    }

    const updated = dbService.updateOrder(
      orderId,
      {
        shipmentStatus: 'NOT_CREATED',
        awbCode: undefined,
        trackingUrl: undefined,
      },
      'admin@vedaandvastra.com'
    );

    res.json({ success: true, order: updated, message: 'Shipment booking cancelled' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Reconcile Cash on Delivery (Admin Confirms Cash Collected)
apiRouter.post('/admin/orders/reconcile-cod', (req: Request, res: Response) => {
  try {
    const { orderId, collectedAmount, notes } = req.body;
    const order = dbService.getOrderById(orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (order.paymentMethod !== 'COD') {
      return res.status(400).json({ error: 'Order is not Cash on Delivery' });
    }

    const updated = dbService.updateOrder(
      orderId,
      {
        paymentStatus: 'PAID',
        codCollectedAt: new Date().toISOString(),
        notes: notes ? `${order.notes || ''} [COD Settled: ₹${collectedAmount || order.totalAmount} - ${notes}]` : order.notes,
      },
      'admin@vedaandvastra.com'
    );

    res.json({ success: true, order: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Razorpay Refund
apiRouter.post('/admin/payments/refund', async (req: Request, res: Response) => {
  try {
    const { orderId, reason } = req.body;
    const order = dbService.getOrderById(orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (order.paymentStatus !== 'PAID') {
      return res.status(400).json({ error: 'Only PAID orders can be refunded' });
    }

    const amountPaise = order.totalAmount * 100;
    const refundResult = await processRazorpayRefund({
      paymentId: order.razorpayPaymentId || 'pay_placeholder',
      amountPaise,
      notes: { reason: reason || 'Customer requested return' },
    });

    if (refundResult.success) {
      // Restore inventory stock
      order.items.forEach((item) => {
        dbService.adjustStock(item.productId, item.quantity);
      });

      const updated = dbService.updateOrder(
        orderId,
        {
          paymentStatus: 'REFUNDED',
          orderStatus: 'CANCELLED',
          refundId: refundResult.refundId,
          refundAmount: order.totalAmount,
          refundReason: reason,
        },
        'admin@vedaandvastra.com'
      );

      return res.json({ success: true, order: updated, refundId: refundResult.refundId });
    } else {
      return res.status(500).json({ error: refundResult.message });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Inventory stock adjustment
apiRouter.post('/admin/inventory/adjust', (req: Request, res: Response) => {
  try {
    const { productId, delta, reason } = req.body;
    const success = dbService.adjustStock(productId, delta);
    if (!success) return res.status(404).json({ error: 'Product not found' });

    dbService.addAuditLog({
      action: 'INVENTORY_ADJUSTED',
      performedBy: 'admin@vedaandvastra.com',
      targetEntity: 'product',
      targetId: productId,
      details: { delta, reason },
    });

    res.json({ success: true, product: dbService.getProductById(productId) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 10. WEBHOOKS (RAZORPAY & SHIPROCKET)
// -----------------------------------------------------------------------------
apiRouter.post('/webhooks/razorpay', (req: Request, res: Response) => {
  const event = req.body?.event;
  const payload = req.body?.payload;

  dbService.addAuditLog({
    action: 'RAZORPAY_WEBHOOK_RECEIVED',
    performedBy: 'razorpay_system',
    targetEntity: 'payment',
    targetId: payload?.payment?.entity?.id || 'unknown',
    details: { event },
  });

  if (event === 'payment.captured') {
    const payment = payload?.payment?.entity;
    if (payment?.order_id) {
      const allOrders = dbService.getAllOrders();
      const matched = allOrders.find((o) => o.razorpayOrderId === payment.order_id);
      if (matched && matched.paymentStatus !== 'PAID') {
        dbService.updateOrder(
          matched.id,
          {
            paymentStatus: 'PAID',
            orderStatus: 'CONFIRMED',
            paymentVerifiedAt: new Date().toISOString(),
          },
          'razorpay_webhook'
        );
      }
    }
  }

  res.status(200).json({ status: 'ok' });
});

apiRouter.post('/webhooks/shiprocket', (req: Request, res: Response) => {
  const { awb, current_status, shipment_status } = req.body;

  dbService.addAuditLog({
    action: 'SHIPROCKET_WEBHOOK_RECEIVED',
    performedBy: 'shiprocket_system',
    targetEntity: 'shipment',
    targetId: awb || 'unknown',
    details: { current_status, shipment_status },
  });

  if (awb) {
    const allOrders = dbService.getAllOrders();
    const matched = allOrders.find((o) => o.awbCode === awb);
    if (matched) {
      const statusMap: Record<string, { shipment: ShipmentStatus; order: OrderStatus }> = {
        'PICKED UP': { shipment: 'PICKED_UP', order: 'PROCESSING' },
        'IN TRANSIT': { shipment: 'IN_TRANSIT', order: 'SHIPPED' },
        'OUT FOR DELIVERY': { shipment: 'IN_TRANSIT', order: 'OUT_FOR_DELIVERY' },
        'DELIVERED': { shipment: 'DELIVERED', order: 'DELIVERED' },
        'RTO INITIATED': { shipment: 'RTO', order: 'RTO' },
      };

      const mapped = statusMap[current_status?.toUpperCase()] || statusMap[shipment_status?.toUpperCase()];
      if (mapped) {
        dbService.updateOrder(
          matched.id,
          {
            shipmentStatus: mapped.shipment,
            orderStatus: mapped.order,
          },
          'shiprocket_webhook'
        );
      }
    }
  }

  res.status(200).json({ status: 'ok' });
});

export const app = express();
app.use('/api', apiRouter);
