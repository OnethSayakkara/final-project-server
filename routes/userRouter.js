const express = require('express');
const router = express.Router();
const { register, getAllUsers, getUserById, updateUser, deleteUser } = require('../controller/userController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.post('/registeruser', register);
router.post('/getallusers',authMiddleware, getAllUsers);
router.post('/getuserbyid/:id',authMiddleware, getUserById);
router.post('/updateuser/:id',authMiddleware, updateUser);
router.post('/deleteUser/:id',authMiddleware, deleteUser);


module.exports = router;