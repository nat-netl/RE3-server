const { PrismaClient } = require('@prisma/client');
const tonService = require('../services/tonService');
const telegramService = require('../services/telegramService');
const referralService = require('../services/referralService');

const prisma = new PrismaClient();

exports.createTask = async (req, res) => {
  const { type, title, description, reward, channelUsername, tokenAddress, tokenAmount, maxParticipants } = req.query;
  const rewardIsFloat = parseFloat(reward)
  const tokenAmountIsFloat = parseFloat(tokenAmount)
  const maxParticipantsIsInt = Number(maxParticipants)

  try {
    const task = await prisma.task.create({
      data: { 
        type, 
        title, 
        description, 
        reward: rewardIsFloat, 
        channelUsername, 
        tokenAddress, 
        tokenAmount: tokenAmountIsFloat, 
        maxParticipants: maxParticipantsIsInt
      },
    });
    res.json({ success: true, task });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getTasks = async (req, res) => {
  const { type } = req.query;
  
  try {
    const tasks = await prisma.task.findMany({
      where: type ? { type } : {},
    });
    res.json({ success: true, tasks });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.completeTask = async (req, res) => {
  const { taskId } = req.params;
  const { telegramId } = req.query;

  console.log(`Attempting to complete task ${taskId} for user ${telegramId}`);

  try {
    const user = await prisma.user.findUnique({ 
      where: { telegramId },
      include: { referredBy: true }
    });
    if (!user) {
      console.log(`User with telegramId ${telegramId} not found`);
      return res.status(404).json({ success: false, error: 'Пользователь не найден' });
    }

    const task = await prisma.task.findUnique({ where: { id: parseInt(taskId) } });
    if (!task) {
      console.log(`Task with id ${taskId} not found`);
      return res.status(404).json({ success: false, error: 'Задание не найдено' });
    }

    console.log(`Task found:`, task);

    if (task.type === 'CHANNEL') {
      console.log(`Checking channel subscription for user ${telegramId} to channel ${task.channelUsername}`);
      const isSubscribed = await telegramService.checkChannelSubscription(user.telegramId, task.channelUsername);
      console.log(`Subscription check result: ${isSubscribed}`);
      if (!isSubscribed) {
        return res.status(400).json({ success: false, error: 'Вы не подписаны на канал' });
      }
    } else if (task.type === 'TOKEN') {
      const balance = await tonService.getBalance(user.walletAddress);
      if (parseFloat(balance) < task.tokenAmount) {
        return res.status(400).json({ success: false, error: 'Недостаточно токенов для выполнения задания' });
      }

      if (task.currentParticipants >= task.maxParticipants) {
        return res.status(400).json({ success: false, error: 'Достигнуто максимальное количество участников' });
      }
    }

    const completion = await prisma.userTaskCompletion.create({
      data: {
        userId: user.id,
        taskId: task.id,
        completed: true,
        completedAt: new Date(),
        earnedAmount: task.reward
      },
    });

    if (task.type === 'TOKEN') {
      await prisma.task.update({
        where: { id: task.id },
        data: { currentParticipants: { increment: 1 } },
      });
    }

    // Обновляем баланс пользователя
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { balance: { increment: task.reward } },
    });

    // Обрабатываем реферальные вознаграждения
    await referralService.processReferralRewards(user, task.reward);

    res.json({ success: true, completion, newBalance: updatedUser.balance });
  } catch (error) {
    console.error('Error in completeTask:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};