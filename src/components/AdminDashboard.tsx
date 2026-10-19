import React, { useState, useEffect } from 'react';
import {
  X,
  Package,
  Truck,
  CreditCard,
  Banknote,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Copy,
  ExternalLink,
  Plus,
  Minus,
  Settings,
  History,
  Search,
  Filter,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Order, OrderStatus, PaymentStatus, ShipmentStatus, AuditLog, Product } from '../types';

export const AdminDashboard: React.FC = () => {
  const {
    isAdminOpen,
    setIsAdminOpen,
    formatINR,
    integrationStatus,
    refreshStatus,
    currentUser,
  } = useStore();

  const [activeTab, setActiveTab] = useState<
    'orders' | 'inventory' | 'logistics' | 'finance' | 'audit' | 'setup'
  >('orders');

  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterOrderStatus, setFilterOrderStatus] = useState<string>('ALL');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>('ALL');
  const [filterShipmentStatus, setFilterShipmentStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Order for Action Modal
  const [actionOrder, setActionOrder] = useState<Order | null>(null);
  const [actionType, setActionType] = useState<
    'manual_ship' | 'refund' | 'cod_reconcile' | 'label' | null
  >(null);

  // Manual Dispatch Form State
  const [manualCourier, setManualCourier] = useState('Delhivery Surface');
  const [manualAwb, setManualAwb] = useState('');
  const [manualTrackingUrl, setManualTrackingUrl] = useState('');

  // Refund Form State
  const [refundReason, setRefundReason] = useState('Customer return / cancellation');

  // COD Reconcile Notes
  const [codNotes, setCodNotes] = useState('Cash handover verified by courier branch');

  // Copy feedback
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/admin/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error('Error fetching admin orders:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error('Error fetching admin products:', err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch('/api/admin/audit-logs');
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    }
  };

  useEffect(() => {
    if (isAdminOpen) {
      fetchOrders();
      fetchProducts();
      fetchAuditLogs();
      refreshStatus();
    }
  }, [isAdminOpen]);

  if (!isAdminOpen) return null;

  // Actions
  const handleCreateShiprocketShipment = async (orderId: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/shipping/create-shipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (res.ok) {
        fetchOrders();
        fetchAuditLogs();
      } else {
        alert(data.error || 'Failed to create shipment');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleManualDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionOrder) return;
    setLoading(true);

    try {
      const res = await fetch('/api/admin/shipping/manual-dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: actionOrder.id,
          courierName: manualCourier,
          awbCode: manualAwb,
          trackingUrl: manualTrackingUrl,
        }),
      });
      if (res.ok) {
        fetchOrders();
        fetchAuditLogs();
        setActionType(null);
        setActionOrder(null);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelShipment = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this shipment booking?')) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/shipping/cancel-shipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      if (res.ok) {
        fetchOrders();
        fetchAuditLogs();
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReconcileCod = async () => {
    if (!actionOrder) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/orders/reconcile-cod', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: actionOrder.id,
          collectedAmount: actionOrder.totalAmount,
          notes: codNotes,
        }),
      });
      if (res.ok) {
        fetchOrders();
        fetchAuditLogs();
        setActionType(null);
        setActionOrder(null);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessRefund = async () => {
    if (!actionOrder) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/payments/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: actionOrder.id,
          reason: refundReason,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        fetchOrders();
        fetchProducts();
        fetchAuditLogs();
        setActionType(null);
        setActionOrder(null);
      } else {
        alert(data.error || 'Refund failed');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustStock = async (productId: string, delta: number) => {
    try {
      const res = await fetch('/api/admin/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          delta,
          reason: 'Manual adjustment from admin dashboard',
        }),
      });
      if (res.ok) {
        fetchProducts();
        fetchAuditLogs();
      }
    } catch (err) {
      console.error('Error adjusting stock:', err);
    }
  };

  const handleUpdateShipmentState = async (orderId: string, shipmentStatus: ShipmentStatus, orderStatus?: OrderStatus) => {
    try {
      const res = await fetch('/api/admin/shipping/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, shipmentStatus, orderStatus }),
      });
      if (res.ok) {
        fetchOrders();
        fetchAuditLogs();
      }
    } catch (err) {
      console.error('Status update failed:', err);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2500);
  };

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    const matchesOrder = filterOrderStatus === 'ALL' || o.orderStatus === filterOrderStatus;
    const matchesPayment = filterPaymentStatus === 'ALL' || o.paymentStatus === filterPaymentStatus;
    const matchesShipment = filterShipmentStatus === 'ALL' || o.shipmentStatus === filterShipmentStatus;
    const matchesQuery =
      !searchQuery ||
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.awbCode && o.awbCode.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesOrder && matchesPayment && matchesShipment && matchesQuery;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-[#FAF8F5] w-full max-w-6xl rounded-2xl shadow-2xl overflow-hidden border border-amber-900/20 flex flex-col h-[94vh]">
        {/* Top Header */}
        <div className="p-4 bg-amber-950 text-white flex flex-wrap items-center justify-between gap-3 border-b border-amber-900">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-800 text-amber-200 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif font-bold text-base text-white">Veda & Vastra Fulfillment Console</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white uppercase tracking-wider">
                  Admin: dev90946064@gmail.com
                </span>
              </div>
              <p className="text-xs text-amber-300/80">
                Pan-India Shiprocket Courier API • Razorpay Payment Gateway • COD Reconciliation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Health indicators */}
            <div className="hidden md:flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/30 border border-white/10">
                <span
                  className={`w-2 h-2 rounded-full ${
                    integrationStatus?.razorpay.isConfigured ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                ></span>
                <span>Razorpay: {integrationStatus?.razorpay.mode || 'preview'}</span>
              </span>

              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/30 border border-white/10">
                <span
                  className={`w-2 h-2 rounded-full ${
                    integrationStatus?.shiprocket.isConfigured ? 'bg-emerald-400' : 'bg-sky-400'
                  }`}
                ></span>
                <span>Shiprocket: {integrationStatus?.shiprocket.mode || 'fallback'}</span>
              </span>
            </div>

            <button
              onClick={() => setIsAdminOpen(false)}
              className="p-1.5 rounded-lg text-amber-200 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-white border-b border-amber-900/10 px-4 overflow-x-auto">
          {[
            { id: 'orders', label: 'Order Management', count: orders.length, icon: Package },
            { id: 'inventory', label: 'Inventory & Stock', count: products.length, icon: Settings },
            { id: 'logistics', label: 'Shiprocket Fulfillment', icon: Truck },
            { id: 'finance', label: 'Razorpay & Finance', icon: CreditCard },
            { id: 'audit', label: 'Audit Trail', count: auditLogs.length, icon: History },
            { id: 'setup', label: 'API Configuration Guide', icon: FileText },
          ].map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`flex items-center gap-2 py-3 px-3.5 border-b-2 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'border-amber-900 text-amber-950 bg-amber-50/50'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{t.label}</span>
                {t.count !== undefined && (
                  <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded-full">
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Dashboard Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* TAB 1: ORDER MANAGEMENT */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              {/* Filter controls */}
              <div className="bg-white p-3.5 rounded-xl border border-amber-900/10 flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs">
                <div className="flex items-center gap-2 flex-1 min-w-[220px]">
                  <Search className="w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by Order #, Customer, AWB..."
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-800"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={filterOrderStatus}
                    onChange={(e) => setFilterOrderStatus(e.target.value)}
                    className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="ALL">All Order Statuses</option>
                    <option value="PLACED">PLACED</option>
                    <option value="CONFIRMED">CONFIRMED</option>
                    <option value="PROCESSING">PROCESSING</option>
                    <option value="SHIPPED">SHIPPED</option>
                    <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY</option>
                    <option value="DELIVERED">DELIVERED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>

                  <select
                    value={filterPaymentStatus}
                    onChange={(e) => setFilterPaymentStatus(e.target.value)}
                    className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="ALL">All Payment Statuses</option>
                    <option value="PAID">PAID</option>
                    <option value="COD_PENDING">COD PENDING</option>
                    <option value="REFUNDED">REFUNDED</option>
                    <option value="FAILED">FAILED</option>
                  </select>

                  <select
                    value={filterShipmentStatus}
                    onChange={(e) => setFilterShipmentStatus(e.target.value)}
                    className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="ALL">All Shipment Statuses</option>
                    <option value="NOT_CREATED">NOT CREATED</option>
                    <option value="BOOKED">BOOKED</option>
                    <option value="PICKED_UP">PICKED UP</option>
                    <option value="IN_TRANSIT">IN TRANSIT</option>
                    <option value="DELIVERED">DELIVERED</option>
                  </select>
                </div>
              </div>

              {/* Orders Table */}
              <div className="bg-white rounded-xl border border-amber-900/10 overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-50 border-b border-amber-900/10 text-slate-500 font-semibold">
                      <tr>
                        <th className="p-3">Order Details</th>
                        <th className="p-3">Customer & Location</th>
                        <th className="p-3">Amount & Method</th>
                        <th className="p-3">Payment Status</th>
                        <th className="p-3">Shipment Status</th>
                        <th className="p-3">Logistics & AWB</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredOrders.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-400">
                            No orders found matching the filter criteria. Place an order on the storefront to test!
                          </td>
                        </tr>
                      ) : (
                        filteredOrders.map((order) => (
                          <tr key={order.id} className="hover:bg-amber-50/30 transition-colors">
                            <td className="p-3 font-mono">
                              <span className="font-bold text-slate-900 block">{order.orderNumber}</span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </td>

                            <td className="p-3">
                              <p className="font-medium text-slate-800">{order.customerName}</p>
                              <p className="text-[11px] text-slate-500">
                                {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
                              </p>
                            </td>

                            <td className="p-3">
                              <span className="font-serif font-bold text-slate-900 block">
                                {formatINR(order.totalAmount)}
                              </span>
                              <span className="text-[10px] text-slate-500">{order.paymentMethod}</span>
                            </td>

                            <td className="p-3">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                  order.paymentStatus === 'PAID'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : order.paymentStatus === 'COD_PENDING'
                                    ? 'bg-amber-100 text-amber-900'
                                    : order.paymentStatus === 'REFUNDED'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {order.paymentStatus}
                              </span>
                            </td>

                            <td className="p-3">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                  order.shipmentStatus === 'BOOKED'
                                    ? 'bg-sky-100 text-sky-800'
                                    : order.shipmentStatus === 'DELIVERED'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : order.shipmentStatus === 'IN_TRANSIT'
                                    ? 'bg-purple-100 text-purple-800'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {order.shipmentStatus}
                              </span>
                            </td>

                            <td className="p-3">
                              {order.awbCode ? (
                                <div>
                                  <span className="font-mono text-[11px] font-bold text-amber-950 block">
                                    {order.awbCode}
                                  </span>
                                  <span className="text-[10px] text-slate-500">
                                    {order.courierName || 'Shiprocket'}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-400 italic">Unassigned</span>
                              )}
                            </td>

                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Shiprocket Booking */}
                                {order.shipmentStatus === 'NOT_CREATED' && (
                                  <>
                                    <button
                                      onClick={() => handleCreateShiprocketShipment(order.id)}
                                      disabled={loading}
                                      className="px-2.5 py-1 bg-amber-900 text-white rounded-lg text-[11px] font-semibold hover:bg-amber-950 cursor-pointer"
                                      title="Generate Shiprocket Order & AWB"
                                    >
                                      Ship (Shiprocket)
                                    </button>
                                    <button
                                      onClick={() => {
                                        setActionOrder(order);
                                        setActionType('manual_ship');
                                      }}
                                      className="px-2 py-1 border border-slate-300 rounded-lg text-[11px] hover:bg-slate-50 cursor-pointer"
                                      title="Manual Shipping Fallback"
                                    >
                                      Manual
                                    </button>
                                  </>
                                )}

                                {/* Status Progressions */}
                                {order.shipmentStatus === 'BOOKED' && (
                                  <button
                                    onClick={() => handleUpdateShipmentState(order.id, 'IN_TRANSIT', 'SHIPPED')}
                                    className="px-2 py-1 bg-sky-800 text-white rounded-lg text-[11px] cursor-pointer"
                                  >
                                    Mark In-Transit
                                  </button>
                                )}

                                {order.shipmentStatus === 'IN_TRANSIT' && (
                                  <button
                                    onClick={() => handleUpdateShipmentState(order.id, 'DELIVERED', 'DELIVERED')}
                                    className="px-2 py-1 bg-emerald-800 text-white rounded-lg text-[11px] cursor-pointer"
                                  >
                                    Mark Delivered
                                  </button>
                                )}

                                {/* COD Reconciliation */}
                                {order.paymentMethod === 'COD' && order.paymentStatus === 'COD_PENDING' && (
                                  <button
                                    onClick={() => {
                                      setActionOrder(order);
                                      setActionType('cod_reconcile');
                                    }}
                                    className="px-2 py-1 bg-emerald-700 text-white rounded-lg text-[11px] font-semibold cursor-pointer"
                                    title="Confirm Cash Handover"
                                  >
                                    Reconcile COD
                                  </button>
                                )}

                                {/* Razorpay Refund */}
                                {order.paymentStatus === 'PAID' && order.paymentMethod === 'ONLINE' && (
                                  <button
                                    onClick={() => {
                                      setActionOrder(order);
                                      setActionType('refund');
                                    }}
                                    className="px-2 py-1 border border-rose-300 text-rose-700 rounded-lg text-[11px] hover:bg-rose-50 cursor-pointer"
                                    title="Initiate Razorpay Refund"
                                  >
                                    Refund
                                  </button>
                                )}

                                {/* Cancel Shipment */}
                                {order.shipmentStatus === 'BOOKED' && (
                                  <button
                                    onClick={() => handleCancelShipment(order.id)}
                                    className="px-2 py-1 text-slate-400 hover:text-rose-600 text-[11px] cursor-pointer"
                                    title="Cancel Shipment"
                                  >
                                    Cancel
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INVENTORY & PRODUCTS */}
          {activeTab === 'inventory' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-xs font-semibold text-slate-700">
                  Real-time Stock Inventory & Physical Dimensions (Essential for Shiprocket Consignment Sizing)
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {products.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 bg-white rounded-xl border border-amber-900/10 shadow-2xs flex gap-3"
                  >
                    <img
                      src={p.images[0]}
                      alt={p.name}
                      className="w-20 h-20 rounded-lg object-cover bg-stone-100 shrink-0"
                    />
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          <h4 className="font-serif font-bold text-xs text-slate-900 line-clamp-1">{p.name}</h4>
                          <span className="font-mono text-[10px] text-slate-400">{p.sku}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {p.originState} • HSN: {p.hsnCode} • {p.weightKg} kg
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Box: {p.lengthCm} × {p.breadthCm} × {p.heightCm} cm
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <div>
                          <span className="font-serif font-bold text-xs text-amber-950">
                            {formatINR(p.price)}
                          </span>
                        </div>

                        {/* Stock Adjustment Controls */}
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-slate-700">Stock:</span>
                          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                            <button
                              onClick={() => handleAdjustStock(p.id, -1)}
                              disabled={p.stock <= 0}
                              className="px-2 py-0.5 hover:bg-slate-100 text-slate-600 disabled:opacity-30 cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2 py-0.5 text-xs font-bold text-slate-900 min-w-[28px] text-center">
                              {p.stock}
                            </span>
                            <button
                              onClick={() => handleAdjustStock(p.id, 1)}
                              className="px-2 py-0.5 hover:bg-slate-100 text-slate-600 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: SHIPROCKET LOGISTICS CONSOLE */}
          {activeTab === 'logistics' && (
            <div className="space-y-6">
              <div className="p-4 bg-white rounded-xl border border-amber-900/10 shadow-2xs">
                <h3 className="font-serif font-bold text-sm text-slate-900 mb-2 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-amber-800" />
                  <span>Shiprocket All-India Logistics Configuration</span>
                </h3>
                <p className="text-xs text-slate-600 mb-4">
                  Orders are dispatched via Shiprocket API with Delhivery, Blue Dart, Shadowfax, or DTDC couriers. AWB numbers, barcodes, and live tracking links are synchronized on booking.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mb-4">
                  <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Registered Pickup Warehouse</span>
                    <p className="font-bold text-slate-800 mt-1">
                      {integrationStatus?.shiprocket.pickupLocation || 'Primary Warehouse'}
                    </p>
                  </div>
                  <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Pickup Pincode</span>
                    <p className="font-mono font-bold text-slate-800 mt-1">
                      {integrationStatus?.shiprocket.pickupPincode || '110001'} (New Delhi)
                    </p>
                  </div>
                  <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                    <span className="text-slate-400 text-[10px] uppercase font-bold">API Mode</span>
                    <p className="font-bold text-emerald-700 mt-1">
                      {integrationStatus?.shiprocket.isConfigured ? 'Live Shiprocket API' : 'Simulated Standard Fallback'}
                    </p>
                  </div>
                </div>

                {/* Webhook Configuration for Shiprocket */}
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-900/10 text-xs">
                  <p className="font-bold text-amber-950 mb-1">Shiprocket Tracking Webhook URL</p>
                  <p className="text-slate-600 text-[11px] mb-2">
                    Add this endpoint in Shiprocket Console: Settings → API → Webhooks (listen to status events like OUT FOR DELIVERY, DELIVERED, RTO):
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-2 bg-white rounded-lg border border-amber-900/15 font-mono text-xs text-slate-800 select-all">
                      {window.location.origin}/api/webhooks/shiprocket
                    </code>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `${window.location.origin}/api/webhooks/shiprocket`,
                          'shiprocket_webhook'
                        )
                      }
                      className="px-3 py-2 bg-amber-900 text-white rounded-lg font-medium hover:bg-amber-950 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedText === 'shiprocket_webhook' ? 'Copied!' : 'Copy URL'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: RAZORPAY & FINANCE */}
          {activeTab === 'finance' && (
            <div className="space-y-6">
              {/* Financial Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-white rounded-xl border border-amber-900/10 shadow-2xs">
                  <span className="text-xs text-slate-500 font-medium">Prepaid Revenue (Razorpay)</span>
                  <p className="font-serif font-bold text-2xl text-emerald-800 mt-1">
                    {formatINR(
                      orders
                        .filter((o) => o.paymentMethod === 'ONLINE' && o.paymentStatus === 'PAID')
                        .reduce((sum, o) => sum + o.totalAmount, 0)
                    )}
                  </p>
                  <span className="text-[10px] text-emerald-600 font-medium">
                    Verified through HMAC SHA-256 signatures
                  </span>
                </div>

                <div className="p-4 bg-white rounded-xl border border-amber-900/10 shadow-2xs">
                  <span className="text-xs text-slate-500 font-medium">Pending Cash on Delivery (COD)</span>
                  <p className="font-serif font-bold text-2xl text-amber-900 mt-1">
                    {formatINR(
                      orders
                        .filter((o) => o.paymentMethod === 'COD' && o.paymentStatus === 'COD_PENDING')
                        .reduce((sum, o) => sum + o.totalAmount, 0)
                    )}
                  </p>
                  <span className="text-[10px] text-amber-700 font-medium">
                    To be collected on courier parcel handover
                  </span>
                </div>

                <div className="p-4 bg-white rounded-xl border border-amber-900/10 shadow-2xs">
                  <span className="text-xs text-slate-500 font-medium">Total Refunded</span>
                  <p className="font-serif font-bold text-2xl text-rose-800 mt-1">
                    {formatINR(
                      orders
                        .filter((o) => o.paymentStatus === 'REFUNDED')
                        .reduce((sum, o) => sum + (o.refundAmount || o.totalAmount), 0)
                    )}
                  </p>
                  <span className="text-[10px] text-rose-600 font-medium">
                    Authorized admin refunds processed
                  </span>
                </div>
              </div>

              {/* Webhook Configuration for Razorpay */}
              <div className="p-4 bg-white rounded-xl border border-amber-900/10 shadow-2xs space-y-3 text-xs">
                <h4 className="font-serif font-bold text-sm text-slate-900">
                  Razorpay Webhook Endpoint
                </h4>
                <p className="text-slate-600">
                  Configure this webhook on the Razorpay Dashboard (Settings → Webhooks) to automatically confirm asynchronous UPI payments, card captures, and refunds:
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 bg-stone-50 rounded-lg border border-slate-200 font-mono text-xs text-slate-800 select-all">
                    {window.location.origin}/api/webhooks/razorpay
                  </code>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `${window.location.origin}/api/webhooks/razorpay`,
                        'razorpay_webhook'
                      )
                    }
                    className="px-3 py-2 bg-amber-900 text-white rounded-lg font-medium hover:bg-amber-950 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedText === 'razorpay_webhook' ? 'Copied!' : 'Copy URL'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: AUDIT LOGS */}
          {activeTab === 'audit' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                Immutable record of administrative operations, stock adjustments, refunds, and signature validations:
              </p>

              <div className="bg-white rounded-xl border border-amber-900/10 overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-50 border-b border-amber-900/10 text-slate-500 font-semibold">
                      <tr>
                        <th className="p-3">Timestamp</th>
                        <th className="p-3">Action</th>
                        <th className="p-3">Performed By</th>
                        <th className="p-3">Target Entity</th>
                        <th className="p-3">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {auditLogs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-slate-400">
                            No audit events logged yet.
                          </td>
                        </tr>
                      ) : (
                        auditLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-amber-50/20">
                            <td className="p-3 text-slate-500">
                              {new Date(log.createdAt).toLocaleTimeString()}
                            </td>
                            <td className="p-3 font-bold text-amber-950">{log.action}</td>
                            <td className="p-3 text-slate-600">{log.performedBy}</td>
                            <td className="p-3">
                              {log.targetEntity}: {log.targetId}
                            </td>
                            <td className="p-3 text-slate-700 max-w-xs truncate">
                              {JSON.stringify(log.details)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: SETUP & ENVIRONMENT CONFIGURATION GUIDE */}
          {activeTab === 'setup' && (
            <div className="space-y-6 text-xs text-slate-700">
              <div className="p-5 bg-white rounded-xl border border-amber-900/10 shadow-2xs space-y-4">
                <h3 className="font-serif font-bold text-base text-slate-900">
                  Production Integration Setup & Environment Keys
                </h3>
                <p className="leading-relaxed">
                  To switch from development test mode to live operations, add the following credentials to your server environment secrets (or `.env` file):
                </p>

                {/* Razorpay Setup Box */}
                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                  <h4 className="font-bold text-amber-950 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-amber-800" />
                    <span>1. Razorpay Payment Gateway</span>
                  </h4>
                  <ul className="list-disc pl-5 space-y-1 text-slate-600">
                    <li>
                      Log in to{' '}
                      <a
                        href="https://dashboard.razorpay.com/"
                        target="_blank"
                        rel="noreferrer"
                        className="text-amber-850 underline font-semibold"
                      >
                        Razorpay Dashboard
                      </a>
                    </li>
                    <li>Navigate to <strong>Settings → API Keys</strong> and generate your Key ID & Secret.</li>
                    <li>
                      Set environment variable: <code>RAZORPAY_KEY_ID="rzp_test_..."</code>
                    </li>
                    <li>
                      Set environment variable: <code>RAZORPAY_KEY_SECRET="..."</code>
                    </li>
                    <li>
                      Navigate to <strong>Settings → Webhooks</strong>, point webhook to{' '}
                      <code>{window.location.origin}/api/webhooks/razorpay</code>, and set{' '}
                      <code>RAZORPAY_WEBHOOK_SECRET="..."</code>
                    </li>
                  </ul>
                </div>

                {/* Shiprocket Setup Box */}
                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                  <h4 className="font-bold text-amber-950 flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-amber-800" />
                    <span>2. Shiprocket Courier Logistics</span>
                  </h4>
                  <ul className="list-disc pl-5 space-y-1 text-slate-600">
                    <li>
                      Register on{' '}
                      <a
                        href="https://app.shiprocket.in/"
                        target="_blank"
                        rel="noreferrer"
                        className="text-amber-850 underline font-semibold"
                      >
                        Shiprocket
                      </a>
                    </li>
                    <li>Go to <strong>Settings → API → Configure</strong> to view or create API users.</li>
                    <li>
                      Set environment variable: <code>SHIPROCKET_EMAIL="your_shiprocket_email"</code>
                    </li>
                    <li>
                      Set environment variable: <code>SHIPROCKET_PASSWORD="your_password"</code>
                    </li>
                    <li>
                      Go to <strong>Settings → Pickup Addresses</strong> and register warehouse:
                      set <code>SHIPROCKET_PICKUP_LOCATION="Primary Warehouse"</code> and{' '}
                      <code>SHIPROCKET_PICKUP_PINCODE="110001"</code>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ACTION MODALS */}
        {/* 1. Manual Dispatch Modal */}
        {actionType === 'manual_ship' && actionOrder && (
          <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-amber-900/20">
              <h3 className="font-serif font-bold text-base text-slate-900 mb-1">
                Manual Shipping Dispatch Fallback
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Record external courier consignment details for order {actionOrder.orderNumber}:
              </p>

              <form onSubmit={handleManualDispatch} className="space-y-3 text-xs">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Courier Service</label>
                  <input
                    type="text"
                    required
                    value={manualCourier}
                    onChange={(e) => setManualCourier(e.target.value)}
                    placeholder="e.g. Delhivery, Blue Dart, India Post Speed Post"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Air Waybill / AWB Code</label>
                  <input
                    type="text"
                    required
                    value={manualAwb}
                    onChange={(e) => setManualAwb(e.target.value)}
                    placeholder="e.g. DEL1082937128"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Tracking URL (Optional)</label>
                  <input
                    type="url"
                    value={manualTrackingUrl}
                    onChange={(e) => setManualTrackingUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="pt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setActionType(null)}
                    className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-1.5 bg-amber-900 text-white rounded-lg font-medium hover:bg-amber-950 cursor-pointer"
                  >
                    Confirm Dispatch
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 2. Razorpay Refund Modal */}
        {actionType === 'refund' && actionOrder && (
          <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-rose-200">
              <h3 className="font-serif font-bold text-base text-slate-900 mb-1">
                Authorize Razorpay Refund
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Refund <span className="font-bold text-slate-900">{formatINR(actionOrder.totalAmount)}</span> for order {actionOrder.orderNumber}:
              </p>

              <div className="space-y-3 text-xs mb-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Reason for Refund</label>
                  <textarea
                    rows={2}
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-900/10 text-[11px] text-amber-900">
                  ℹ️ Inventory stock will be automatically restored back to the catalog.
                </div>
              </div>

              <div className="flex justify-end gap-2 text-xs">
                <button
                  onClick={() => setActionType(null)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProcessRefund}
                  disabled={loading}
                  className="px-4 py-1.5 bg-rose-700 text-white rounded-lg font-medium hover:bg-rose-800 cursor-pointer"
                >
                  Confirm & Process Refund
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3. COD Reconcile Modal */}
        {actionType === 'cod_reconcile' && actionOrder && (
          <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-emerald-200">
              <h3 className="font-serif font-bold text-base text-slate-900 mb-1">
                Confirm Cash on Delivery Collection
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Confirm settlement of <span className="font-bold text-slate-900">{formatINR(actionOrder.totalAmount)}</span> from courier handover:
              </p>

              <div className="space-y-3 text-xs mb-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Settlement Notes</label>
                  <input
                    type="text"
                    value={codNotes}
                    onChange={(e) => setCodNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-[11px] text-emerald-900">
                  ✓ This will update <code>paymentStatus</code> from <code>COD_PENDING</code> to <code>PAID</code>.
                </div>
              </div>

              <div className="flex justify-end gap-2 text-xs">
                <button
                  onClick={() => setActionType(null)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReconcileCod}
                  disabled={loading}
                  className="px-4 py-1.5 bg-emerald-800 text-white rounded-lg font-medium hover:bg-emerald-900 cursor-pointer"
                >
                  Confirm Collection
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
