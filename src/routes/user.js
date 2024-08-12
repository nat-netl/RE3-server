const express = require('express');
const userController = require('../controllers/userController');

const router = express.Router();

router.get('/:telegramId/balance', userController.getBalance);
router.post('/:telegramId/balance', userController.updateBalance);
router.get('/:telegramId/referral-code', userController.getReferralCode);
router.get('/:telegramId/referrals', userController.getReferrals);

module.exports = router;