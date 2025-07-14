import express from 'express';
import { createAdmin, getAllAdmins, getAdminById, updateAdmin, deleteAdmin } from '../controller/adminController.js';
import { protect } from '../middleware/authMiddleware.js';
import handleMulterError from '../middleware/multer.js';

const router = express.Router();

router.post('/create-admin', protect(['admin']), handleMulterError, createAdmin);
router.get('/admins', protect(['admin']), getAllAdmins);
router.get('/admins/:id', protect(['admin']), getAdminById);
router.put('/admins/:id', protect(['admin']), updateAdmin);
router.delete('/admins/:id', protect(['admin']), deleteAdmin);

export default router;