const { PrismaClient } = require('@prisma/client');
const Buffer = require('buffer/').Buffer 
const tonService = require('../services/tonService');

const prisma = new PrismaClient();

function generateReferralCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

exports.register = async (req, res) => {
  const { telegramId, username, firstName, lastName, referralCode, walletAddress } = req.query;

  try {
    let referredBy = null;
    if (referralCode) {
      referredBy = await prisma.user.findUnique({
        where: { referralCode: referralCode },
      });
    }

    const newUser = await prisma.user.create({
      data: {
        telegramId,
        username,
        firstName,
        lastName,
        walletAddress,
        referralCode: generateReferralCode(),
        referredById: referredBy ? referredBy.id : null,
      },
    });

    res.json({ success: true, user: newUser });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message});
  }
};

exports.connectWallet = async (req, res) => {
  const { telegramId, walletAddress } = req.query;

  try {
    const user = await prisma.user.findUnique({
      where: { telegramId },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'Пользователь не найден' });
    }

    const validatedAddress = await tonService.validateAddress(walletAddress);

    const updatedUser = await prisma.user.update({
      where: { telegramId },
      data: { walletAddress: validatedAddress },
    });

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getUserInfo = async (req, res) => {
  const { telegramId } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { telegramId },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'Пользователь не найден' });
    }

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getUserInfoByAddress = async (req, res) => {
  const { address } = req.params;
  try {
    console.log('Searching for user with address:', address);
    const user = await prisma.user.findFirst({
      where: { walletAddress: address },
    });
    console.log('User found:', user);
    if (!user) {
      // Вместо отправки ошибки, отправьте специальный статус
      return res.json({ success: false, status: 'USER_NOT_FOUND' });
    }
    res.json({ success: true, user });
  } catch (error) {
    console.error('Error in getUserInfoByAddress:', error);
    res.status(500).json({ success: false, error: error.message, stack: error.stack });
  }
};