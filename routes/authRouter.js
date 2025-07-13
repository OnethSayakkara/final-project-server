
const express = require('express');
const router = express.Router();
const { login, refreshToken } = require('../controller/authController');


router.post('/login', login);
router.post('/refresh', refreshToken);

module.exports = router;