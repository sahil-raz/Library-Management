import { Router, Response } from 'express';
import { uploadImage } from '../middleware/upload.js';
import { authenticate } from '../middleware/auth.js';
import { AuthenticatedRequest } from '../types/index.js';
import { uploadToImgbb } from '../services/imgbbService.js';

const router = Router();

// Upload image endpoint (protected by authentication)
router.post(
  '/image',
  authenticate,
  uploadImage.single('file'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.file) {
      res.status(400).json({ success: false, code: 'FILE_MISSING', message: 'No image file uploaded' });
      return;
    }

    try {
      const imgbbResult = await uploadToImgbb(req.file.buffer, req.file.originalname);
      res.json({
        success: true,
        url: imgbbResult.url,
        displayUrl: imgbbResult.displayUrl,
        deleteUrl: imgbbResult.deleteUrl,
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      });
    } catch (err: any) {
      const statusCode = err.status || (err.code === 'IMGBB_NOT_CONFIGURED' ? 400 : 500);
      res.status(statusCode).json({
        success: false,
        code: err.code || 'UPLOAD_FAILED',
        message: err.message || 'Image upload to ImgBB failed',
      });
    }
  }
);

export default router;
