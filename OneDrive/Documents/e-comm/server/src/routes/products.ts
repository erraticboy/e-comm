import { Router } from 'express';
import { DatabaseService, DbProduct } from '../database.js';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

const DEFAULT_SEEDED_SELLER = "USR-SYS-SEED-SELLER";

const defaultSeedProducts: DbProduct[] = [
  {
    id: "PROD-1",
    name: "Nova Visor V4",
    price: 1299,
    rating: 4.8,
    image: "visor",
    category: "Augmentations",
    description: "Experience the Net with real-time neural mapping, ultra-frequency HUD, and dual plasma light shields. Includes fully integrated AI-assisted targeting overlays and quantum encryption protocols.",
    stock: 14,
    maxStock: 25,
    specs: {
      "Display": "16K Micro-OLED Holographic HUD",
      "Neural Sync": "Direct Cortex-V2 Synapse",
      "Latency": "0.02ms Quantum Sync",
      "Battery": "Solid-State Fusion Core (48hr)"
    },
    modelType: "visor",
    sellerId: DEFAULT_SEEDED_SELLER,
    createdAt: new Date()
  },
  {
    id: "PROD-2",
    name: "Aether-Run Drone",
    price: 3400,
    rating: 4.9,
    image: "drone",
    category: "Robotics",
    description: "Silent, stealth quadcopter delivery unit. Capable of carrying up to 10kg with active visual cloaking, obstacle-dodging AI, and laser-grid defense fields.",
    stock: 5,
    maxStock: 10,
    specs: {
      "Propulsion": "Magnetic Levitation (MagLev)",
      "Range": "Unlimited Quantum Power Share",
      "Defense": "Laser Deflector Shield v1",
      "Cargo": "Anti-Gravity Stabilized Vault"
    },
    modelType: "drone",
    sellerId: DEFAULT_SEEDED_SELLER,
    createdAt: new Date()
  },
  {
    id: "PROD-3",
    name: "Quantum Deck S9",
    price: 899,
    rating: 4.7,
    image: "deck",
    category: "Hacking",
    description: "The premier deck for netrunning. Features liquid-nitrogen cooling, dual-core bio-chips, and hardware-level icebreakers designed to breach corporate firewalls in seconds.",
    stock: 22,
    maxStock: 30,
    specs: {
      "Core Processor": "Bio-Organic Octa-Core 4.2THz",
      "Cooling System": "Cryo-Fluid Loop",
      "ICE Breakers": "T-Spherical Deconstruction Suite",
      "Interface": "Wireless Neuronal Connect"
    },
    modelType: "deck",
    sellerId: DEFAULT_SEEDED_SELLER,
    createdAt: new Date()
  },
  {
    id: "PROD-4",
    name: "Apex HyperCar Token",
    price: 85000,
    rating: 5.0,
    image: "car",
    category: "Vehicles",
    description: "A holographic ownership registry for the Apex Plasma HyperCar. Features jet propulsion vectors, soundless supersonic glide modes, and self-repairing nanoshield plating.",
    stock: 2,
    maxStock: 5,
    specs: {
      "Engine": "Plasma Jet Vector Reactor",
      "Top Speed": "Mach 2.2 (Atmospheric)",
      "Plating": "Self-Repairing Nanoshield (Grade A)",
      "AI Drive": "Autopilot Core 'Aegis'"
    },
    modelType: "car",
    sellerId: DEFAULT_SEEDED_SELLER,
    createdAt: new Date()
  },
  {
    id: "PROD-5",
    name: "Sentinel Bio-Patch",
    price: 299,
    rating: 4.6,
    image: "patch",
    category: "Bio-Tech",
    description: "Keep your vitals at peak performance. This sub-dermal patch releases micro-nanobots to repair tissue damage, filter poisons, and boost cognitive adrenaline on demand.",
    stock: 45,
    maxStock: 50,
    specs: {
      "Nanobot Gen": "Generation-3 Cellular Repairers",
      "Delivery System": "Adrenaline-Reactive Osmosis",
      "Diagnostics": "Continuous Electro-Cardiac Feed",
      "Dosage": "AI-Monitored Self-Regulating"
    },
    modelType: "patch",
    sellerId: DEFAULT_SEEDED_SELLER,
    createdAt: new Date()
  },
  {
    id: "PROD-6",
    name: "Chronos Wrist-Comm",
    price: 1599,
    rating: 4.8,
    image: "watch",
    category: "Wearables",
    description: "Futuristic wrist-mounted terminal. Generates a physical laser dial interface, displays real-time solar solar-radiation maps, and allows communication across deep space relay nodes.",
    stock: 9,
    maxStock: 15,
    specs: {
      "Interface": "Laser Projected Dial (Holo)",
      "Relay Band": "Deep Space Neutrino Vector",
      "Housing": "Vibranium-Titanium Composite",
      "Features": "Gravity Sensor, Chronos Map"
    },
    modelType: "watch",
    sellerId: DEFAULT_SEEDED_SELLER,
    createdAt: new Date()
  }
];

// Helper to seed products if database is empty
export const seedProductsIfEmpty = async () => {
  try {
    const prods = await DatabaseService.getProducts();
    if (prods.length === 0) {
      console.log("⚡ [PRODUCT SEED] DATABASE INVENTORY IS VACANT. SEEDING CYBERWARE NODES...");
      for (const p of defaultSeedProducts) {
        await DatabaseService.saveProduct(p);
      }
      console.log(`⚡ [PRODUCT SEED] SEEDED ${defaultSeedProducts.length} SYSTEM ARCHE-NODES.`);
    }
  } catch (err) {
    console.error("Seeding error:", err);
  }
};

// 1. GET ALL PRODUCTS (supports category & search filter)
router.get('/', async (req, res) => {
  try {
    let prods = await DatabaseService.getProducts();
    const { category, search, sellerId } = req.query;

    if (category && category !== 'All') {
      prods = prods.filter(p => p.category.toLowerCase() === category.toString().toLowerCase());
    }

    if (search) {
      const q = search.toString().toLowerCase();
      prods = prods.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }

    if (sellerId) {
      prods = prods.filter(p => p.sellerId === sellerId.toString());
    }

    res.status(200).json(prods);
  } catch (err) {
    console.error("Fetch products error:", err);
    res.status(500).json({ error: "INTERNAL GRID QUERY EXCEPTION" });
  }
});

// 2. GET SINGLE PRODUCT BY ID
router.get('/:id', async (req, res) => {
  try {
    const prod = await DatabaseService.getProductById(req.params.id);
    if (!prod) {
      return res.status(404).json({ error: "PRODUCT NODE REGISTER NOT FOUND" });
    }
    res.status(200).json(prod);
  } catch (err) {
    res.status(500).json({ error: "INTERNAL QUERY EXCEPTION" });
  }
});

// 3. INJECT NEW PRODUCT (Sellers only)
router.post('/', authenticateToken, requireRole(['seller']), async (req: AuthenticatedRequest, res) => {
  if (!req.user) return res.status(401).json({ error: "AUTHORIZATION INVALID" });

  const { name, price, category, description, stock, maxStock, specs, modelType, image, videoUrl } = req.body;

  if (!name || !price || !category || !description || !stock || !maxStock || !modelType || !image) {
    return res.status(400).json({ error: "TELEMETRY SPECS INCOMPLETE FOR INJECTION" });
  }

  try {
    const newProduct: DbProduct = {
      id: `PROD-${Date.now()}-${Math.floor(Math.random()*1000)}`,
      name,
      price: parseFloat(price),
      rating: 4.0 + +(Math.random().toFixed(1)),
      image,
      category,
      description,
      stock: parseInt(stock),
      maxStock: parseInt(maxStock),
      specs: specs || {},
      modelType,
      sellerId: req.user.id,
      videoUrl,
      createdAt: new Date()
    };

    await DatabaseService.saveProduct(newProduct);
    res.status(201).json({ message: "HARDWARE NODE REGISTERED IN LEDGER", product: newProduct });
  } catch (err) {
    console.error("Create product error:", err);
    res.status(500).json({ error: "GRID LEDGER TRANSACTION ERROR" });
  }
});

// 4. MODIFY HARDWARE NODE (Sellers only)
router.put('/:id', authenticateToken, requireRole(['seller']), async (req: AuthenticatedRequest, res) => {
  if (!req.user) return res.status(401).json({ error: "UNAUTHORIZED" });

  try {
    const product = await DatabaseService.getProductById(req.params.id);
    if (!product) return res.status(404).json({ error: "PRODUCT REGISTRY KEY MISSING" });

    // Enforce ownership
    if (product.sellerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: "INSUFFICIENT CREDENTIAL DECK PRIVILEGES" });
    }

    const updateFields = req.body;
    const updatedProduct = {
      ...product,
      ...updateFields,
      price: updateFields.price ? parseFloat(updateFields.price) : product.price,
      stock: updateFields.stock ? parseInt(updateFields.stock) : product.stock,
      maxStock: updateFields.maxStock ? parseInt(updateFields.maxStock) : product.maxStock,
    };

    await DatabaseService.saveProduct(updatedProduct);
    res.status(200).json({ message: "HARDWARE REGISTRY UPDATED", product: updatedProduct });
  } catch (err) {
    res.status(500).json({ error: "LEGER UPDATE FAILED" });
  }
});

// 5. DELETE PRODUCT REGISTER
router.delete('/:id', authenticateToken, requireRole(['seller', 'admin']), async (req: AuthenticatedRequest, res) => {
  if (!req.user) return res.status(401).json({ error: "UNAUTHORIZED" });

  try {
    const product = await DatabaseService.getProductById(req.params.id);
    if (!product) return res.status(404).json({ error: "PRODUCT REGISTRY KEY MISSING" });

    if (product.sellerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: "INSUFFICIENT SECURITY CLEARANCE" });
    }

    await DatabaseService.deleteProduct(req.params.id);
    res.status(200).json({ message: "PRODUCT REGISTER EVICTED SUCCESSFULLY" });
  } catch (err) {
    res.status(500).json({ error: "INTERNAL LEDGER EVICTION FAULT" });
  }
});

export default router;
