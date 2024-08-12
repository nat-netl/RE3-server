const TelegramBot = require('node-telegram-bot-api');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

bot.onText(/\/start(?:\s+(\w+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const user = msg.from;
  const referralCode = match[1];

  try {
    let existingUser = await prisma.user.findUnique({
      where: { telegramId: user.id.toString() },
    });

    if (existingUser) {
      bot.sendMessage(chatId, 'Вы уже зарегистрированы!');
    } else {
      let referredBy = null;
      if (referralCode) {
        referredBy = await prisma.user.findUnique({
          where: { referralCode: referralCode },
        });
      }

      const newUser = await prisma.user.create({
        data: {
          telegramId: user.id.toString(),
          username: user.username,
          firstName: user.first_name,
          lastName: user.last_name,
          referralCode: generateReferralCode(),
          referredById: referredBy ? referredBy.id : null,
        },
      });

      let message = `Добро пожаловать, ${user.first_name}! Вы успешно зарегистрированы.`;
      if (referredBy) {
        message += ` Вы были приглашены пользователем ${referredBy.username || referredBy.firstName}.`;
      }
      message += `\nВаш реферальный код: ${newUser.referralCode}`;

      bot.sendMessage(chatId, message);
    }
  } catch (error) {
    console.error('Error registering user:', error);
    bot.sendMessage(chatId, 'Произошла ошибка при регистрации. Пожалуйста, попробуйте позже.');
  }
});

function generateReferralCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

async function checkChannelSubscription(userId, channelUsername) {
  try {
    const chatMember = await bot.getChatMember(`@${channelUsername}`, userId);
    return ['member', 'administrator', 'creator'].includes(chatMember.status);
  } catch (error) {
    console.error('Error checking channel subscription:', error);
    return false;
  }
}

module.exports = {
  bot,
  checkChannelSubscription,
};