import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Initialize configurations
dotenv.config();

import { DatabaseService, DbChat, ChatMessage } from './database.js';
import { seedProductsIfEmpty } from './routes/products.js';

import authRouter from './routes/auth.js';
import productsRouter from './routes/products.js';
import ordersRouter from './routes/orders.js';
import paymentsRouter from './routes/payments.js';
import uploadRouter from './routes/upload.js';
import adminRouter from './routes/admin.js';

const app = express();
const server = http.createServer(app);

// Enable Cross-Origin requests for local frontend dev server
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));

app.use(express.json());

// Serve local upload fallbacks statically
const uploadsDir = path.resolve('../public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Connect database and seed items
DatabaseService.initialize().then(async () => {
  await seedProductsIfEmpty();
});

// API Route mounts
app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/admin', adminRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: "GRID_ONLINE", timestamp: new Date() });
});

// -------------------------------------------------------------
// SOCKET.IO REAL-TIME CHAT SERVICE
// -------------------------------------------------------------
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

io.on('connection', (socket) => {
  console.log(`🔌 [SOCKET] RUNNER GRID LINK ESTABLISHED: ${socket.id}`);

  // Join client-seller private chat room
  socket.on('join_chat', async ({ clientId, sellerId }) => {
    const roomId = `chat_${clientId}_${sellerId}`;
    socket.join(roomId);
    console.log(`🔒 [SOCKET] Node ${socket.id} joined room ${roomId}`);

    try {
      // Load history and dispatch it
      const chat = await DatabaseService.getChatById(roomId);
      socket.emit('chat_history', chat ? chat.messages : []);
    } catch (err) {
      console.error("Socket join history fetch error:", err);
      socket.emit('chat_history', []);
    }
  });

  // Receive message and broadcast to room
  socket.on('send_message', async ({ sender, text, clientId, sellerId }) => {
    const roomId = `chat_${clientId}_${sellerId}`;
    const newMessage: ChatMessage = {
      sender: sender as 'client' | 'seller',
      text,
      timestamp: new Date()
    };

    try {
      let chat = await DatabaseService.getChatById(roomId);
      if (!chat) {
        chat = {
          id: roomId,
          clientId,
          sellerId,
          messages: [],
          updatedAt: new Date()
        };
      }

      chat.messages.push(newMessage);
      chat.updatedAt = new Date();
      await DatabaseService.saveChat(chat);

      // Emit to everyone in the room (client and seller)
      io.to(roomId).emit('receive_message', newMessage);

      // Notify seller of new query alert if they have seller list open
      io.emit(`new_message_alert_${sellerId}`, { clientId, lastText: text });
    } catch (err) {
      console.error("Socket message processing error:", err);
    }
  });

  // Load active seller queries lists
  socket.on('seller_load_chats', async ({ sellerId }) => {
    try {
      const chats = await DatabaseService.getChats();
      const sellerConversations = chats.filter(c => c.sellerId === sellerId);
      
      const list = [];
      for (const conv of sellerConversations) {
        const client = await DatabaseService.getUserById(conv.clientId);
        list.push({
          clientId: conv.clientId,
          clientName: client?.name || "Anonymous Runner",
          lastMessage: conv.messages[conv.messages.length - 1],
          updatedAt: conv.updatedAt
        });
      }
      
      socket.emit(`seller_chats_list_${sellerId}`, list);
    } catch (err) {
      console.error("Seller chats list load error:", err);
    }
  });

  socket.on('disconnect', () => {
    console.log(`🔌 [SOCKET] RUNNER GRID LINK BROKEN: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 [SERVER] BOOTING SUCCESS. PORT VECTOR: http://localhost:${PORT}`);
});
