import express from 'express';
import { login, refreshToken, forgotPassword, resetPassword  } from '../controller/authController.js';

const router = express.Router();

router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:userId/:token', resetPassword);

export default router;