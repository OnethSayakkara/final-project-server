// routes/authRouter.js
const express = require('express');
const router = express.Router();
const { createAdmin, getAllAdmins, getAdminById, updateAdmin, deleteAdmin } = require('../controller/adminController');
const { protect } = require('../middleware/authMiddleware');



router.post('/create-admin', protect(['admin']), createAdmin);
router.get('/admins', protect(['admin']), getAllAdmins);
router.get('/admins/:id', protect(['admin']), getAdminById);
router.put('/admins/:id', protect(['admin']), updateAdmin);
router.delete('/admins/:id', protect(['admin']), deleteAdmin);

module.exports = router;