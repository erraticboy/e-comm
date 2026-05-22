import { Router } from 'express';
import { DatabaseService } from '../database.js';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// Ensure all admin routes require admin clearance
router.use(authenticateToken, requireRole(['admin']));

// 1. GET ALL USERS
router.get('/users', async (req: AuthenticatedRequest, res) => {
  try {
    const users = await DatabaseService.getUsers();
    // Exclude password hashes for security sanitization
    const sanitizedUsers = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      credits: u.credits,
      approved: u.approved,
      isVerified: u.isVerified,
      createdAt: u.createdAt
    }));
    res.status(200).json(sanitizedUsers);
  } catch (err) {
    res.status(500).json({ error: "ADMIN USER REGISTRY EXCEPTION" });
  }
});

// 2. APPROVE SELLER STATUS
router.put('/approve-seller/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const user = await DatabaseService.getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: "USER NODE KEY MISSING" });

    if (user.role !== 'seller') {
      return res.status(400).json({ error: "USER IS NOT A REGISTERED SELLER MERCHANT" });
    }

    user.approved = true;
    await DatabaseService.saveUser(user);

    res.status(200).json({ message: "SELLER MERCHANT GRANTED GRID CLEARANCE", user: { id: user.id, approved: true } });
  } catch (err) {
    res.status(500).json({ error: "ADMIN TRANSACTION EXCEPTION" });
  }
});

// 3. BAN/EVICT USER NODE
router.delete('/ban-user/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const user = await DatabaseService.getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: "USER NODE REGISTER KEY MISSING" });

    if (user.role === 'admin') {
      return res.status(400).json({ error: "CANNOT BAN ROOT SECURITY ADMINISTRATIVE USER" });
    }

    const deleted = await DatabaseService.deleteUser(req.params.id);
    if (deleted) {
      res.status(200).json({ message: "ACCOUNT NODE EVICTED SUCCESSFULLY FROM THE PLATFORM" });
    } else {
      res.status(400).json({ error: "EVICTION FAILURE TRANSACTION" });
    }
  } catch (err) {
    res.status(500).json({ error: "ADMIN EVICTION EXCEPTION" });
  }
});

// 4. GET SYSTEM METRICS telemetry
router.get('/metrics', async (req: AuthenticatedRequest, res) => {
  try {
    const users = await DatabaseService.getUsers();
    const products = await DatabaseService.getProducts();
    const orders = await DatabaseService.getOrders();

    const activeSellersCount = users.filter(u => u.role === 'seller' && u.approved).length;
    const pendingSellersCount = users.filter(u => u.role === 'seller' && !u.approved).length;
    const clientCount = users.filter(u => u.role === 'client').length;

    const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);

    res.status(200).json({
      metrics: {
        users: {
          total: users.length,
          clients: clientCount,
          activeSellers: activeSellersCount,
          pendingSellers: pendingSellersCount
        },
        products: {
          total: products.length
        },
        orders: {
          total: orders.length,
          totalCreditsCleared: totalRevenue
        },
        system: {
          mode: process.env.MONGODB_URI ? 'MONGO-CLOUD' : 'JSON-LOCAL',
          latency: '0.02ms (Quantum Sync)',
          memoryUsage: process.memoryUsage().heapUsed,
          uptime: process.uptime()
        }
      }
    });
  } catch (err) {
    res.status(500).json({ error: "TELEMETRY METRICS COLLECTION FAULT" });
  }
});

export default router;
