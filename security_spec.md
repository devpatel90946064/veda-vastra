# Security Specification: Indian E-Commerce Platform

## 1. Data Invariants
1. **Product Invariant**: Products are publicly viewable by customers to allow browsing and catalog discovery. Only authenticated store administrators can write, update, or delete products and inventory.
2. **Order Invariant**: Customers may create orders for their own account (`userId == request.auth.uid`), or guest orders where payment status starts as `PENDING` or `COD_PENDING`. Customers can only read orders that belong to them (`userId == request.auth.uid`). Administrators can read and update all orders.
3. **Payment State Transition Invariant**: Customers CANNOT self-mark an order as `PAID` or `REFUNDED`. Status changes to `PAID` or `REFUNDED` must only be performed through authorized backend verification or verified admin operations.
4. **Shipment Invariant**: Shipment tracking codes (AWB), shipping labels, and shipment status changes can only be written by authenticated administrators or the verified backend webhook service.
5. **Admin Access Invariant**: Admin privileges are strictly derived from document presence in the `/admins/$(request.auth.uid)` collection with verified emails. Self-assignment of administrative roles is forbidden.
6. **Audit Log Invariant**: Audit logs are append-only by administrators and can never be modified or deleted.

## 2. The "Dirty Dozen" Threat Payloads (Must Return PERMISSION_DENIED)
1. **Unauthenticated Product Deletion**: Anonymous attacker attempting to delete a product.
2. **Customer Price Manipulation**: Customer attempting to overwrite a product's price or stock directly.
3. **Unauthorized Order Snooping**: Customer B attempting to read customer A's private order details (address, phone).
4. **Unauthenticated Order Listing**: Anonymous visitor attempting to query the entire `/orders` collection.
5. **Self-Marking Order as Paid**: Customer attempting to flip `paymentStatus` from `PENDING` to `PAID` without Razorpay backend signature.
6. **Self-Marking COD as Collected**: Customer attempting to flip `paymentStatus` from `COD_PENDING` to `PAID`.
7. **Fake AWB Injection**: Unauthenticated user attempting to inject an AWB number or tracking URL into an order.
8. **Admin Privilege Escalation**: Regular user attempting to write a document with their UID into `/admins/{uid}`.
9. **Tampering with Audit Logs**: Attacker or rogue operator attempting to edit an existing `/audit_logs/{logId}` document.
10. **Deleting Store Settings**: Non-admin attempting to delete or overwrite store pickup coordinates and credentials.
11. **Malicious Long String Injection**: Payload with a 500KB string in customer notes to exhaust storage.
12. **PII Harvesting via Blanket Read**: Attacker running an unbounded collection query on `/admins`.
