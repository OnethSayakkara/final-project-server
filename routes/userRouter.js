import express from 'express';
import { register, getAllUsers, getUserById, updateUser, deleteUser } from '../controller/userController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/registeruser', register);
router.post('/getallusers', getAllUsers);
router.post('/getuserbyid/:id', authMiddleware, getUserById);
router.post('/updateuser/:id', authMiddleware, updateUser);
router.post('/deleteUser/:id', authMiddleware, deleteUser);

export default router;