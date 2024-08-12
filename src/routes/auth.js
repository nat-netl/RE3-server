const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/register', authController.register);
router.post('/connect-wallet', authController.connectWallet);
router.get('/user/:telegramId', authController.getUserInfo);
router.get('/user-by-address/:address', authController.getUserInfoByAddress);


module.exports = router;