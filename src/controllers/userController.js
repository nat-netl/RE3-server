const { PrismaClient } = require('@prisma/client');
const referralService = require('../services/referralService');

const prisma = new PrismaClient();

exports.getBalance = async (req, res) => {
  const { telegramId } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { telegramId },
      select: { balance: true },
    });
    if (!user) {
      return res.status(404).json({ success: false, error: 'Пользователь не найден' });
    }
    res.json({ success: true, balance: user.balance });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateBalance = async (req, res) => {
  const { telegramId } = req.params;
  const { amount, operation } = req.query;
  try {
    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) {
      return res.status(404).json({ success: false, error: 'Пользователь не найден' });
    }
    let updatedUser;
    if (operation === 'add') {
      updatedUser = await prisma.user.update({
        where: { telegramId },
        data: { balance: { increment: amount } },
      });
    } else if (operation === 'subtract') {
      if (user.balance < amount) {
        return res.status(400).json({ success: false, error: 'Недостаточно средств' });
      }
      updatedUser = await prisma.user.update({
        where: { telegramId },
        data: { balance: { decrement: amount } },
      });
    } else {
      return res.status(400).json({ success: false, error: 'Неверная операция' });
    }
    res.json({ success: true, balance: updatedUser.balance });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getReferralCode = async (req, res) => {
  const { telegramId } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { telegramId },
      select: { referralCode: true }
    });
    if (!user) {
      return res.status(404).json({ success: false, error: 'Пользователь не найден' });
    }
    res.json({ success: true, referralCode: user.referralCode });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getReferrals = async (req, res) => {
  const { telegramId } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { telegramId },
      select: { id: true }
    });
    if (!user) {
      return res.status(404).json({ success: false, error: 'Пользователь не найден' });
    }

    const referralsByLevels = await referralService.getReferralsByLevels(user.id);
    
    const formattedReferrals = referralsByLevels.map(level => ({
      level: level.level,
      count: level.referrals.length,
      referrals: level.referrals
    }));

    res.json({ success: true, referralsByLevels: formattedReferrals });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};