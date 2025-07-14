import express from 'express';
import { login, refreshToken } from '../controller/authController.js';

const router = express.Router();

router.post('/login', login);
router.post('/refresh', refreshToken);

export default router;