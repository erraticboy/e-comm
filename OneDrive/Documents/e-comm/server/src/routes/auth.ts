import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { DatabaseService, DbUser } from '../database.js';
import { sendOtpEmail } from '../mail.js';
import { AuthenticatedRequest, authenticateToken } from '../middleware/auth.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'cyber-secret-key-2035';

// Helper to generate OTP
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// 1. SIGNUP ROUTE
router.post('/signup', async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: "ALL PARAMETERS (name, email, password, role) REQUIRED" });
  }

  if (!['client', 'seller', 'admin'].includes(role)) {
    return res.status(400).json({ error: "INVALID ACCOUNT ARCHETYPE" });
  }

  try {
    const existingUser = await DatabaseService.getUserByEmail(email);
    if (existingUser) {
      if (existingUser.isVerified) {
        return res.status(400).json({ error: "COGNITIVE EMAIL REGISTRY KEY ALREADY OCCUPIED" });
      }

      existingUser.name = name;
      existingUser.passwordHash = passwordHash;
      existingUser.role = role as 'client' | 'seller' | 'admin';
      existingUser.approved = true;
      existingUser.isVerified = true;
      existingUser.otpCode = undefined;
      existingUser.otpExpires = undefined;

      await DatabaseService.saveUser(existingUser);

      return res.status(201).json({
        message: "REGISTRY RECORD UPDATED. YOU MAY LOG IN.",
        email: existingUser.email,
        role: existingUser.role
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser: DbUser = {
      id: `USR-${Date.now()}-${Math.floor(Math.random()*1000)}`,
      name,
      email,
      passwordHash,
      role: role as 'client' | 'seller' | 'admin',
      credits: role === 'client' ? 25000 : 0,
      approved: true,
      isVerified: true,
      createdAt: new Date()
    };

    await DatabaseService.saveUser(newUser);

    res.status(201).json({
      message: "REGISTRY RECORD INSTANTIATED. YOU MAY LOG IN.",
      email: newUser.email,
      role: newUser.role
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "INTERNAL GRID SYNC FAULT" });
  }
});

// 2. VERIFY OTP ROUTE
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: "EMAIL AND OTP KEY REQUIRED" });
  }

  try {
    const user = await DatabaseService.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: "NODE REGISTRY RECORD NOT FOUND" });
    }

    if (user.isVerified) {
      return res.status(400).json({ error: "ACCOUNT NODE ALREADY SIGNATURE VERIFIED" });
    }

    if (!user.otpCode || !user.otpExpires || user.otpCode !== otp || new Date(user.otpExpires) < new Date()) {
      return res.status(400).json({ error: "INVALID OR EXPIRED VERIFICATION CODE" });
    }

    // Update verification
    user.isVerified = true;
    user.otpCode = undefined;
    user.otpExpires = undefined;

    await DatabaseService.saveUser(user);

    res.status(200).json({ message: "GRID SECURITY KEY SIGNED. ACCESS VERIFIED." });
  } catch (err) {
    console.error("OTP verification error:", err);
    res.status(500).json({ error: "INTERNAL GRID SYNC FAULT" });
  }
});

// 3. LOGIN ROUTE
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "CREDENTIAL MATRIX INCOMPLETE" });
  }

  try {
    const user = await DatabaseService.getUserByEmail(email);
    if (!user) {
      return res.status(400).json({ error: "GRID ADDRESS CREDENTIALS INVALID" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: "GRID ADDRESS CREDENTIALS INVALID" });
    }

    // We removed isVerified and approved checks here to make login easier and bypass the OTP flow.

    // Issue JWT Token
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({
      message: "SYNAPSE LINK COMPATIBLE. LOGGED IN.",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        credits: user.credits,
        approved: user.approved
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "INTERNAL GRID SYNC FAULT" });
  }
});

// 4. FORGOT PASSWORD
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "EMAIL KEY IS REQUIRED" });

  try {
    const user = await DatabaseService.getUserByEmail(email);
    if (!user) return res.status(404).json({ error: "NODE REGISTRY RECORD NOT FOUND" });

    const resetOtp = generateOtp();
    user.otpCode = resetOtp;
    user.otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
    await DatabaseService.saveUser(user);

    // Send reset OTP email in the background
    sendOtpEmail(email, resetOtp).catch(err => {
      console.error("Async sendOtpEmail during forgot-password error:", err);
    });

    res.status(200).json({
      message: "PASSWORD RESET CODE TRANSFERRED TO REGISTERED COORDINATES.",
      devOtp: process.env.NODE_ENV !== 'production' ? resetOtp : undefined
    });
  } catch (err) {
    res.status(500).json({ error: "INTERNAL SYSTEM FAULT" });
  }
});

// 5. RESET PASSWORD
router.post('/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) return res.status(400).json({ error: "ALL MATRIX NODES REQUIRED" });

  try {
    const user = await DatabaseService.getUserByEmail(email);
    if (!user) return res.status(404).json({ error: "NODE NOT FOUND" });

    if (!user.otpCode || user.otpCode !== otp || !user.otpExpires || new Date(user.otpExpires) < new Date()) {
      return res.status(400).json({ error: "EXPIRED OR INCORRECT TELEMETRY RESET CODE" });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    user.otpCode = undefined;
    user.otpExpires = undefined;
    await DatabaseService.saveUser(user);

    res.status(200).json({ message: "CREDENTIAL MATRIX KEY RESET COMPLETED" });
  } catch (err) {
    res.status(500).json({ error: "INTERNAL GRID FAULT" });
  }
});

// 6. GET ACTIVE PROFILE
router.get('/profile', authenticateToken, async (req: AuthenticatedRequest, res) => {
  if (!req.user) return res.status(401).json({ error: "UNAUTHORIZED ACCESS" });
  try {
    const user = await DatabaseService.getUserById(req.user.id);
    if (!user) return res.status(404).json({ error: "PROFILE CORRUPTED" });
    res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        credits: user.credits,
        approved: user.approved
      }
    });
  } catch (err) {
    res.status(500).json({ error: "INTERNAL FAULT" });
  }
});

// 7. GET PUBLIC PROFILE BY ID
router.get('/public-profile/:id', async (req, res) => {
  try {
    const user = await DatabaseService.getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: "USER NOT FOUND" });
    res.status(200).json({
      id: user.id,
      name: user.name,
      role: user.role
    });
  } catch (err) {
    res.status(500).json({ error: "QUERY ERROR" });
  }
});

export default router;
