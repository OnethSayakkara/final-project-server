const express = require('express');
const router = express.Router();
const { register } = require('../controller/userController');


router.post('/registeruser', register);

module.exports = router;