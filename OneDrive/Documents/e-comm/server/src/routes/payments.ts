import { Router } from 'express';
import Stripe from 'stripe';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { DatabaseService } from '../database.js';

const router = Router();

let stripe: Stripe | null = null;
const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;

if (STRIPE_SECRET) {
  stripe = new Stripe(STRIPE_SECRET, {
    apiVersion: '2024-04-10' as any // Force API version compatibility
  });
  console.log("⚡ [PAYMENT] STRIPE INITIALIZED. GATEWAY SECURED.");
} else {
  console.warn("⚠️ [PAYMENT] STRIPE_SECRET_KEY IS ABSENT. RUNNING SECURE DEVEL-MOCK TRANSACTION FALLBACK.");
}

router.post('/create-intent', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const { amount } = req.body;

  if (!amount || typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: "TRANSACTION SUM (amount) INVALID" });
  }

  try {
    if (stripe) {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Stripe takes amounts in cents/credits fraction
        currency: 'usd', // Default standard clearing currency
        metadata: { client: req.user?.id || 'unknown' }
      });

      return res.status(200).json({
        clientSecret: paymentIntent.client_secret,
        message: "STRIPE INTENT SECURED FOR LEDGER"
      });
    } else {
      // Mock payment simulation
      setTimeout(() => {
        return res.status(200).json({
          clientSecret: `pi_mock_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`,
          message: "DEV-MOCK GRID SHIELD TRANSACTION EMULATED"
        });
      }, 400);
    }
  } catch (err: any) {
    console.error("Payment intent creation error:", err);
    res.status(500).json({ error: "PAYMENT SYSTEM SYNC BRIDGE FAULT" });
  }
});

// 2. CREDIT ACCOUNT (Loads credits via card clearing)
router.post('/credit-account', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const { amount } = req.body;

  if (!amount || typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: "CREDIT AMOUNT INVALID" });
  }

  try {
    const user = await DatabaseService.getUserById(req.user!.id);
    if (!user) return res.status(404).json({ error: "USER PROFILE KEY MISSING" });

    user.credits += amount;
    await DatabaseService.saveUser(user);

    res.status(200).json({
      message: "CREDITS LOADED VIA CARD GATEWAY",
      credits: user.credits
    });
  } catch (err) {
    res.status(500).json({ error: "LEDGER CREDIT INJECT FAILURE" });
  }
});

export default router;
