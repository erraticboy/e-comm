import { Router } from 'express';
import { DatabaseService, DbOrder, OrderItem } from '../database.js';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth.js';
import { sendOrderConfirmationEmail, sendShippingUpdateEmail, sendSellerOrderAlert } from '../mail.js';

const router = Router();

// 1. PLACE AN ORDER (Client only)
router.post('/', authenticateToken, requireRole(['client']), async (req: AuthenticatedRequest, res) => {
  if (!req.user) return res.status(401).json({ error: "UNAUTHORIZED ACCESS" });

  const { items } = req.body; // array of { productId, quantity }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "ORDER BASKET CANNOT BE EMPTY" });
  }

  try {
    const client = await DatabaseService.getUserById(req.user.id);
    if (!client) return res.status(404).json({ error: "CLIENT MATRIX PROFILE NOT FOUND" });

    let calculatedTotal = 0;
    const orderItems: OrderItem[] = [];

    // Verify stock and collect prices
    for (const item of items) {
      const prod = await DatabaseService.getProductById(item.productId);
      if (!prod) {
        return res.status(404).json({ error: `HARDWARE NODE '${item.productId}' UNSYNCED IN DIRECTORY` });
      }

      if (prod.stock < item.quantity) {
        return res.status(400).json({ error: `INSUFFICIENT STOCK CORE FOR: '${prod.name}'. REMAINING: ${prod.stock} U` });
      }

      calculatedTotal += prod.price * item.quantity;
      orderItems.push({
        productId: prod.id,
        name: prod.name,
        price: prod.price,
        quantity: item.quantity,
        sellerId: prod.sellerId
      });
    }

    const discount = calculatedTotal > 1000 ? Math.floor(calculatedTotal * 0.25) : 0;
    const tax = Math.floor((calculatedTotal - discount) * 0.10);
    const finalTotalCost = calculatedTotal - discount + tax;

    if (client.credits < finalTotalCost) {
      return res.status(400).json({ error: `INSUFFICIENT SHIELD BALANCE. TRANSACTION COST: ${finalTotalCost} CR, BALANCE: ${client.credits} CR` });
    }

    // Deduct credits from client
    client.credits -= finalTotalCost;
    await DatabaseService.saveUser(client);

    // Deduct stock levels and credit sellers
    for (const item of orderItems) {
      const prod = (await DatabaseService.getProductById(item.productId))!;
      prod.stock -= item.quantity;
      await DatabaseService.saveProduct(prod);

      // Add credits to seller ledger
      const seller = await DatabaseService.getUserById(item.sellerId);
      if (seller) {
        seller.credits += item.price * item.quantity;
        await DatabaseService.saveUser(seller);

        // Alert Seller via Nodemailer async
        sendSellerOrderAlert(seller.email, seller.name, `ORD-${Date.now()}`, item.price * item.quantity)
          .catch(e => console.error("Seller email notification error:", e));
      }
    }

    const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const trackingCode = `CYBER-${Math.floor(1000 + Math.random() * 9000)}-X`;

    const newOrder: DbOrder = {
      id: orderId,
      clientId: client.id,
      items: orderItems,
      totalAmount: finalTotalCost,
      status: 'Pending',
      trackingCode,
      paymentStatus: 'Paid',
      createdAt: new Date(),
      emailSent: true
    };

    await DatabaseService.saveOrder(newOrder);

    // Dispatch order confirmation email
    sendOrderConfirmationEmail(client.email, newOrder, client.name)
      .catch(e => console.error("Client email notification error:", e));

    res.status(201).json({
      message: "TRANSACTION ACQUIRED AND POSTED TO GRID REGISTER",
      order: newOrder,
      clientCredits: client.credits
    });
  } catch (err) {
    console.error("Place order error:", err);
    res.status(500).json({ error: "TRANSACTION FAILED TO COMMIT TO BLOCK LEDGER" });
  }
});

// 2. GET CLIENT PURCHASE LEDGER (Client only)
router.get('/my-orders', authenticateToken, requireRole(['client']), async (req: AuthenticatedRequest, res) => {
  if (!req.user) return res.status(401).json({ error: "UNAUTHORIZED" });

  try {
    const orders = await DatabaseService.getOrders();
    const clientOrders = orders.filter(o => o.clientId === req.user!.id);
    res.status(200).json(clientOrders);
  } catch (err) {
    res.status(500).json({ error: "QUERY EXCEPTION" });
  }
});

// 3. GET SELLER OUTSTANDING ORDERS (Seller only)
router.get('/seller-orders', authenticateToken, requireRole(['seller']), async (req: AuthenticatedRequest, res) => {
  if (!req.user) return res.status(401).json({ error: "UNAUTHORIZED" });

  try {
    const orders = await DatabaseService.getOrders();
    // Filter orders where at least one item belongs to the logged-in seller
    const sellerOrders = orders.filter(o =>
      o.items.some(item => item.sellerId === req.user!.id)
    ).map(o => {
      // Return order, filtering items list to only display this seller's products
      return {
        ...o,
        items: o.items.filter(item => item.sellerId === req.user!.id)
      };
    });

    res.status(200).json(sellerOrders);
  } catch (err) {
    res.status(500).json({ error: "QUERY EXCEPTION" });
  }
});

// 4. UPDATE ORDER TRANSIT STATUS (Seller or Admin)
router.put('/:id/status', authenticateToken, requireRole(['seller', 'admin']), async (req: AuthenticatedRequest, res) => {
  if (!req.user) return res.status(401).json({ error: "UNAUTHORIZED" });

  const { status } = req.body;
  if (!status || !['Pending', 'Accepted', 'Shipped', 'Delivered', 'Cancelled'].includes(status)) {
    return res.status(400).json({ error: "INVALID STATUS VALUE" });
  }

  try {
    const order = await DatabaseService.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ error: "ORDER RECORD KEY NOT FOUND" });

    // Verify permission: Must be Admin, or the seller who owns at least one item in the order
    const isSellerMatch = order.items.some(item => item.sellerId === req.user!.id);
    if (!isSellerMatch && req.user!.role !== 'admin') {
      return res.status(403).json({ error: "INSUFFICIENT SECURITY CREDENTIALS TO ACCESS THIS REGISTRY NODE" });
    }

    // If status transition matches, update status
    order.status = status as 'Pending' | 'Accepted' | 'Shipped' | 'Delivered' | 'Cancelled';
    await DatabaseService.saveOrder(order);

    // Retrieve client details to dispatch status email
    const client = await DatabaseService.getUserById(order.clientId);
    if (client) {
      sendShippingUpdateEmail(client.email, order, client.name)
        .catch(e => console.error("Client update email notification error:", e));
    }

    res.status(200).json({ message: "ORDER LEDGER STATUS CONVERGED SUCCESSFULLY", order });
  } catch (err) {
    res.status(500).json({ error: "GRID UPDATE TRANSACTION EXCEPTION" });
  }
});

// 5. GET ORDER BY TRACKING CODE
router.get('/track/:code', async (req, res) => {
  try {
    const orders = await DatabaseService.getOrders();
    const order = orders.find(o => o.trackingCode.toUpperCase() === req.params.code.toUpperCase());
    if (!order) {
      return res.status(404).json({ error: "TRACKING CODE NOT FOUND IN ACTIVE FLYWAY REGISTRY" });
    }
    res.status(200).json(order);
  } catch (err) {
    res.status(500).json({ error: "QUERY EXCEPTION" });
  }
});

export default router;
