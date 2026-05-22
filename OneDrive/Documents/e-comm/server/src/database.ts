import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';

// Ensure the local database location is defined
const LOCAL_DB_PATH = path.resolve('./local-db.json');

// Interface Declarations
export interface DbUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'seller' | 'client';
  credits: number;
  approved: boolean;
  otpCode?: string;
  otpExpires?: Date;
  isVerified: boolean;
  createdAt: Date;
}

export interface DbProduct {
  id: string;
  name: string;
  price: number;
  rating: number;
  image: string; // URL or archetype identifier
  category: string;
  description: string;
  stock: number;
  maxStock: number;
  specs: Record<string, string>;
  modelType: 'visor' | 'drone' | 'deck' | 'car' | 'patch' | 'watch';
  sellerId: string;
  videoUrl?: string;
  createdAt: Date;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  sellerId: string;
}

export interface DbOrder {
  id: string;
  clientId: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'Pending' | 'Accepted' | 'Shipped' | 'Delivered' | 'Cancelled';
  trackingCode: string;
  paymentStatus: 'Pending' | 'Paid' | 'Failed';
  createdAt: Date;
  emailSent: boolean;
}

export interface ChatMessage {
  sender: 'client' | 'seller';
  text: string;
  timestamp: Date;
}

export interface DbChat {
  id: string;
  clientId: string;
  sellerId: string;
  messages: ChatMessage[];
  updatedAt: Date;
}

// -------------------------------------------------------------
// LOCAL JSON DATABASE IMPLEMENTATION
// -------------------------------------------------------------

interface LocalSchema {
  users: DbUser[];
  products: DbProduct[];
  orders: DbOrder[];
  chats: DbChat[];
}

class LocalDatabase {
  private data: LocalSchema = { users: [], products: [], orders: [], chats: [] };

  constructor() {
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(LOCAL_DB_PATH)) {
        const raw = fs.readFileSync(LOCAL_DB_PATH, 'utf-8');
        this.data = JSON.parse(raw);
        // Correct date deserialization
        this.data.users.forEach(u => {
          if (u.otpExpires) u.otpExpires = new Date(u.otpExpires);
          u.createdAt = new Date(u.createdAt);
        });
        this.data.products.forEach(p => p.createdAt = new Date(p.createdAt));
        this.data.orders.forEach(o => o.createdAt = new Date(o.createdAt));
        this.data.chats.forEach(c => {
          c.updatedAt = new Date(c.updatedAt);
          c.messages.forEach(m => m.timestamp = new Date(m.timestamp));
        });
      } else {
        this.save();
      }
    } catch (e) {
      console.error("Local database read error. Initializing empty:", e);
      this.data = { users: [], products: [], orders: [], chats: [] };
      this.save();
    }
  }

  private save() {
    try {
      fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error("Local database write error:", e);
    }
  }

  // Users CRUD
  async getUsers(): Promise<DbUser[]> { return this.data.users; }
  async getUserById(id: string): Promise<DbUser | null> {
    return this.data.users.find(u => u.id === id) || null;
  }
  async getUserByEmail(email: string): Promise<DbUser | null> {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  }
  async saveUser(user: DbUser): Promise<DbUser> {
    const idx = this.data.users.findIndex(u => u.id === user.id);
    if (idx !== -1) this.data.users[idx] = user;
    else this.data.users.push(user);
    this.save();
    return user;
  }
  async deleteUser(id: string): Promise<boolean> {
    const orig = this.data.users.length;
    this.data.users = this.data.users.filter(u => u.id !== id);
    this.save();
    return this.data.users.length < orig;
  }

  // Products CRUD
  async getProducts(): Promise<DbProduct[]> { return this.data.products; }
  async getProductById(id: string): Promise<DbProduct | null> {
    return this.data.products.find(p => p.id === id) || null;
  }
  async saveProduct(product: DbProduct): Promise<DbProduct> {
    const idx = this.data.products.findIndex(p => p.id === product.id);
    if (idx !== -1) this.data.products[idx] = product;
    else this.data.products.push(product);
    this.save();
    return product;
  }
  async deleteProduct(id: string): Promise<boolean> {
    const orig = this.data.products.length;
    this.data.products = this.data.products.filter(p => p.id !== id);
    this.save();
    return this.data.products.length < orig;
  }

  // Orders CRUD
  async getOrders(): Promise<DbOrder[]> { return this.data.orders; }
  async getOrderById(id: string): Promise<DbOrder | null> {
    return this.data.orders.find(o => o.id === id) || null;
  }
  async saveOrder(order: DbOrder): Promise<DbOrder> {
    const idx = this.data.orders.findIndex(o => o.id === order.id);
    if (idx !== -1) this.data.orders[idx] = order;
    else this.data.orders.push(order);
    this.save();
    return order;
  }

  // Chats CRUD
  async getChats(): Promise<DbChat[]> { return this.data.chats; }
  async getChatById(id: string): Promise<DbChat | null> {
    return this.data.chats.find(c => c.id === id) || null;
  }
  async saveChat(chat: DbChat): Promise<DbChat> {
    const idx = this.data.chats.findIndex(c => c.id === chat.id);
    if (idx !== -1) this.data.chats[idx] = chat;
    else this.data.chats.push(chat);
    this.save();
    return chat;
  }
}

// -------------------------------------------------------------
// MONGOOSE SCHEMAS & MODELS
// -------------------------------------------------------------

const UserSchema = new mongoose.Schema<DbUser>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['admin', 'seller', 'client'], required: true },
  credits: { type: Number, default: 10000 },
  approved: { type: Boolean, default: false },
  otpCode: { type: String },
  otpExpires: { type: Date },
  isVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const ProductSchema = new mongoose.Schema<DbProduct>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  rating: { type: Number, default: 4.5 },
  image: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  stock: { type: Number, required: true },
  maxStock: { type: Number, required: true },
  specs: { type: Map, of: String, default: {} },
  modelType: { type: String, required: true },
  sellerId: { type: String, required: true },
  videoUrl: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const OrderSchema = new mongoose.Schema<DbOrder>({
  id: { type: String, required: true, unique: true },
  clientId: { type: String, required: true },
  items: [{
    productId: String,
    name: String,
    price: Number,
    quantity: Number,
    sellerId: String
  }],
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ['Pending', 'Accepted', 'Shipped', 'Delivered', 'Cancelled'], default: 'Pending' },
  trackingCode: { type: String, required: true },
  paymentStatus: { type: String, enum: ['Pending', 'Paid', 'Failed'], default: 'Pending' },
  createdAt: { type: Date, default: Date.now },
  emailSent: { type: Boolean, default: false }
});

const ChatSchema = new mongoose.Schema<DbChat>({
  id: { type: String, required: true, unique: true },
  clientId: { type: String, required: true },
  sellerId: { type: String, required: true },
  messages: [{
    sender: { type: String, enum: ['client', 'seller'] },
    text: String,
    timestamp: { type: Date, default: Date.now }
  }],
  updatedAt: { type: Date, default: Date.now }
});

const MongoUserModel = mongoose.model('User', UserSchema);
const MongoProductModel = mongoose.model('Product', ProductSchema);
const MongoOrderModel = mongoose.model('Order', OrderSchema);
const MongoChatModel = mongoose.model('Chat', ChatSchema);

// -------------------------------------------------------------
// DUAL-MODE REPOSITORY WRAPPER
// -------------------------------------------------------------

export class DatabaseService {
  private static localDb: LocalDatabase;
  private static isMongo = false;

  static async initialize() {
    this.localDb = new LocalDatabase();
    const uri = process.env.MONGODB_URI;
    if (uri) {
      try {
        console.log("⚡ [GRID] CONNECTING TO MONGO NETWORK: " + uri);
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 4000 });
        this.isMongo = true;
        console.log("⚡ [GRID] MONGO CONNECTION ACQUIRED. REGISTRY ONLINE.");
      } catch (err) {
        console.warn("⚠️ [GRID] MONGO FAILURE. DROPPING TO ZERO-CONFIG SECURE JSON LOCAL MAIN FRAME.");
        this.isMongo = false;
      }
    } else {
      console.log("⚡ [GRID] NO MONGO_URI SPECIFIED. BOOTING ZERO-CONFIG LOCAL FILESYSTEM DATABASE.");
    }
  }

  // Users
  static async getUsers(): Promise<DbUser[]> {
    if (this.isMongo) {
      return (await MongoUserModel.find().lean()) as unknown as DbUser[];
    }
    return this.localDb.getUsers();
  }

  static async getUserById(id: string): Promise<DbUser | null> {
    if (this.isMongo) {
      return (await MongoUserModel.findOne({ id }).lean()) as unknown as DbUser | null;
    }
    return this.localDb.getUserById(id);
  }

  static async getUserByEmail(email: string): Promise<DbUser | null> {
    if (this.isMongo) {
      return (await MongoUserModel.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } }).lean()) as unknown as DbUser | null;
    }
    return this.localDb.getUserByEmail(email);
  }

  static async saveUser(user: DbUser): Promise<DbUser> {
    if (this.isMongo) {
      await MongoUserModel.findOneAndUpdate({ id: user.id }, user, { upsert: true, new: true });
      return user;
    }
    return this.localDb.saveUser(user);
  }

  static async deleteUser(id: string): Promise<boolean> {
    if (this.isMongo) {
      const res = await MongoUserModel.deleteOne({ id });
      return (res.deletedCount || 0) > 0;
    }
    return this.localDb.deleteUser(id);
  }

  // Products
  static async getProducts(): Promise<DbProduct[]> {
    if (this.isMongo) {
      const prods = await MongoProductModel.find().lean();
      return prods.map(p => ({
        ...p,
        specs: Object.fromEntries((p.specs as any) || new Map())
      })) as unknown as DbProduct[];
    }
    return this.localDb.getProducts();
  }

  static async getProductById(id: string): Promise<DbProduct | null> {
    if (this.isMongo) {
      const p = await MongoProductModel.findOne({ id }).lean();
      if (!p) return null;
      return {
        ...p,
        specs: Object.fromEntries((p.specs as any) || new Map())
      } as unknown as DbProduct;
    }
    return this.localDb.getProductById(id);
  }

  static async saveProduct(product: DbProduct): Promise<DbProduct> {
    if (this.isMongo) {
      await MongoProductModel.findOneAndUpdate({ id: product.id }, product, { upsert: true, new: true });
      return product;
    }
    return this.localDb.saveProduct(product);
  }

  static async deleteProduct(id: string): Promise<boolean> {
    if (this.isMongo) {
      const res = await MongoProductModel.deleteOne({ id });
      return (res.deletedCount || 0) > 0;
    }
    return this.localDb.deleteProduct(id);
  }

  // Orders
  static async getOrders(): Promise<DbOrder[]> {
    if (this.isMongo) {
      return (await MongoOrderModel.find().lean()) as unknown as DbOrder[];
    }
    return this.localDb.getOrders();
  }

  static async getOrderById(id: string): Promise<DbOrder | null> {
    if (this.isMongo) {
      return (await MongoOrderModel.findOne({ id }).lean()) as unknown as DbOrder | null;
    }
    return this.localDb.getOrderById(id);
  }

  static async saveOrder(order: DbOrder): Promise<DbOrder> {
    if (this.isMongo) {
      await MongoOrderModel.findOneAndUpdate({ id: order.id }, order, { upsert: true, new: true });
      return order;
    }
    return this.localDb.saveOrder(order);
  }

  // Chats
  static async getChats(): Promise<DbChat[]> {
    if (this.isMongo) {
      return (await MongoChatModel.find().lean()) as unknown as DbChat[];
    }
    return this.localDb.getChats();
  }

  static async getChatById(id: string): Promise<DbChat | null> {
    if (this.isMongo) {
      return (await MongoChatModel.findOne({ id }).lean()) as unknown as DbChat | null;
    }
    return this.localDb.getChatById(id);
  }

  static async saveChat(chat: DbChat): Promise<DbChat> {
    if (this.isMongo) {
      await MongoChatModel.findOneAndUpdate({ id: chat.id }, chat, { upsert: true, new: true });
      return chat;
    }
    return this.localDb.saveChat(chat);
  }
}
