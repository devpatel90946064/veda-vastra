import { DEFAULT_PRODUCTS } from '../src/data/defaultCatalog';
import { AuditLog, Order, Product } from '../src/types';

// In-memory data store synchronized with Firestore operations
class DatabaseService {
  private products: Map<string, Product> = new Map();
  private orders: Map<string, Order> = new Map();
  private auditLogs: AuditLog[] = [];
  private admins: Set<string> = new Set(['dev90946064@gmail.com']);

  constructor() {
    this.seedDefaults();
  }

  private seedDefaults() {
    DEFAULT_PRODUCTS.forEach((prod) => {
      this.products.set(prod.id, { ...prod });
    });
  }

  // --- PRODUCTS ---
  public getAllProducts(): Product[] {
    return Array.from(this.products.values());
  }

  public getProductById(id: string): Product | undefined {
    return this.products.get(id);
  }

  public updateProduct(id: string, updates: Partial<Product>): Product | null {
    const existing = this.products.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    this.products.set(id, updated);
    return updated;
  }

  public addProduct(product: Product): Product {
    this.products.set(product.id, {
      ...product,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return product;
  }

  public adjustStock(productId: string, quantityDelta: number): boolean {
    const p = this.products.get(productId);
    if (!p) return false;
    const newStock = Math.max(0, p.stock + quantityDelta);
    p.stock = newStock;
    p.updatedAt = new Date().toISOString();
    return true;
  }

  // --- ORDERS ---
  public getAllOrders(): Order[] {
    return Array.from(this.orders.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getOrderById(id: string): Order | undefined {
    return this.orders.get(id);
  }

  public getOrderByNumber(orderNumber: string): Order | undefined {
    return Array.from(this.orders.values()).find(
      (o) => o.orderNumber.toUpperCase() === orderNumber.toUpperCase()
    );
  }

  public createOrder(order: Order): Order {
    this.orders.set(order.id, { ...order });

    // Deduct stock for order items
    order.items.forEach((item) => {
      this.adjustStock(item.productId, -item.quantity);
    });

    this.addAuditLog({
      action: 'ORDER_CREATED',
      performedBy: order.customerEmail || 'customer',
      targetEntity: 'order',
      targetId: order.id,
      details: {
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
      },
    });

    return order;
  }

  public updateOrder(id: string, updates: Partial<Order>, performedBy: string = 'system'): Order | null {
    const existing = this.orders.get(id);
    if (!existing) return null;

    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.orders.set(id, updated);

    this.addAuditLog({
      action: 'ORDER_UPDATED',
      performedBy,
      targetEntity: 'order',
      targetId: id,
      details: updates,
    });

    return updated;
  }

  // --- AUDIT LOGS ---
  public addAuditLog(log: Omit<AuditLog, 'id' | 'createdAt'>): AuditLog {
    const newLog: AuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      ...log,
    };
    this.auditLogs.unshift(newLog);
    // Keep max 500 logs in memory
    if (this.auditLogs.length > 500) {
      this.auditLogs.pop();
    }
    return newLog;
  }

  public getAuditLogs(): AuditLog[] {
    return this.auditLogs;
  }

  // --- ADMINS ---
  public isAdminEmail(email?: string): boolean {
    if (!email) return false;
    return this.admins.has(email.toLowerCase()) || email.toLowerCase() === 'dev90946064@gmail.com';
  }
}

export const dbService = new DatabaseService();
