const { PrismaClient } = require('@prisma/client');
const referralService = require('./src/services/referralService');

const prisma = new PrismaClient();

async function getOrCreateUser(data) {
  let user = await prisma.user.findUnique({
    where: { telegramId: data.telegramId },
  });

  if (!user) {
    user = await prisma.user.create({ data });
    console.log(`User created: ${user.username}`);
  } else {
    console.log(`User already exists: ${user.username}`);
  }

  return user;
}

async function main() {
  try {
    // Создаем или получаем цепочку пользователей
    const users = [];
    for (let i = 1; i <= 6; i++) {
      const userData = {
        telegramId: `100${i}`,
        username: `user${i}`,
        firstName: `User`,
        lastName: `${i}`,
        referralCode: `REF100${i}`,
        balance: 0,
      };

      if (i > 1) {
        userData.referredById = users[i-2].id;
      }

      const user = await getOrCreateUser(userData);
      users.push(user);
    }

    // Симулируем выполнение задания последним пользователем
    const taskReward = 1000;
    await prisma.user.update({
      where: { id: users[5].id },
      data: { balance: { increment: taskReward } },
    });
    console.log(`User 6 completed a task and earned ${taskReward}`);

    // Обрабатываем реферальные вознаграждения
    await referralService.processReferralRewards(users[5], taskReward);

    // Получаем обновленную информацию о пользователях
    const updatedUsers = await prisma.user.findMany({
      where: { telegramId: { in: users.map(u => u.telegramId) } },
    });

    console.log('Updated user information:');
    updatedUsers.forEach(user => {
      console.log(`User ${user.username}:`);
      console.log(`  Balance: ${user.balance}`);
    });

    // Получаем информацию о рефералах по уровням для первого пользователя
    const referralsByLevels = await referralService.getReferralsByLevels(users[0].id);
    console.log('Referrals by levels for User 1:', JSON.stringify(referralsByLevels, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();