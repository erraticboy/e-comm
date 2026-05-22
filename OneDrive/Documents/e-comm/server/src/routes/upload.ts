import { Router, Response } from 'express';
import { uploadMiddleware, uploadToCloudinary } from '../upload.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

// POST /api/upload -> Upload product image (requires seller/admin clearance)
router.post(
  '/',
  authenticateToken,
  requireRole(['seller', 'admin']),
  uploadMiddleware.single('image'),
  async (req: any, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ error: "NO ASSET ATTACHMENT LOADED" });
    }

    try {
      const url = await uploadToCloudinary(req.file);
      res.status(200).json({
        message: "ASSET SUCCESSFULLY COMMITTED TO CLOUD VAULT",
        url
      });
    } catch (err) {
      console.error("Upload route error:", err);
      res.status(500).json({ error: "CDN UPLOAD TRANSACTION FAILURE" });
    }
  }
);

export default router;
