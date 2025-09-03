import express from 'express';
import { register, getAllUsers, getUserById, updateUser, deleteUser } from '../controller/userController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/registeruser', register);
router.get('/getallusers', getAllUsers);
router.get('/getuserbyid/:id', getUserById);
router.put('/updateuser/:id', updateUser);
router.delete('/deleteUser/:id', authMiddleware, deleteUser);

export default router;