import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

// Multer memory configuration
const storage = multer.memoryStorage();
export const uploadMiddleware = multer({ storage });

let isCloudinaryConfigured = false;

// Initialize Cloudinary
const initCloudinary = () => {
  const name = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;

  if (name && key && secret) {
    cloudinary.config({
      cloud_name: name,
      api_key: key,
      api_secret: secret
    });
    isCloudinaryConfigured = true;
    console.log("⚡ [UPLOAD] CLOUDINARY AUTHENTICATED. CDN REGISTRY ONLINE.");
  } else {
    console.warn("⚠️ [UPLOAD] CLOUDINARY API KEYS INCOMPLETE. MOCK STORAGE ADAPTER ACTIVATED.");
    isCloudinaryConfigured = false;
  }
};

// Initialize configuration
initCloudinary();

export const uploadToCloudinary = async (file: Express.Multer.File): Promise<string> => {
  if (isCloudinaryConfigured) {
    try {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'cybernetix' },
          (error, result) => {
            if (error) {
              console.error("Cloudinary upload failure, triggering local fallback:", error);
              resolve(localFallbackUpload(file));
            } else {
              resolve(result?.secure_url || '');
            }
          }
        );
        uploadStream.end(file.buffer);
      });
    } catch (err) {
      return localFallbackUpload(file);
    }
  } else {
    return localFallbackUpload(file);
  }
};

// Write files to local public workspace to ensure client can access them directly!
const localFallbackUpload = async (file: Express.Multer.File): Promise<string> => {
  try {
    // We can write to client's public/uploads directory if it exists, or just root public folder
    const publicFolder = path.resolve('../public/uploads');
    
    if (!fs.existsSync(publicFolder)) {
      fs.mkdirSync(publicFolder, { recursive: true });
    }

    const ext = path.extname(file.originalname) || '.jpg';
    const filename = `${Date.now()}-${Math.floor(Math.random() * 100000)}${ext}`;
    const filePath = path.join(publicFolder, filename);

    fs.writeFileSync(filePath, file.buffer);
    console.log(`📁 [UPLOAD LOCAL] Stored asset: ${filePath}`);
    
    // Return relative URL that the client web app can load via localhost:5173/uploads/...
    return `/uploads/${filename}`;
  } catch (err) {
    console.error("Local file upload fallback failed:", err);
    // If everything fails, return a data URI representation of the file
    const base64 = file.buffer.toString('base64');
    return `data:${file.mimetype};base64,${base64}`;
  }
};
