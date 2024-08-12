const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const REFERRAL_LEVELS = [
  { level: 1, percentage: 0.10 },
  { level: 2, percentage: 0.05 },
  { level: 3, percentage: 0.04 },
  { level: 4, percentage: 0.03 },
  { level: 5, percentage: 0.03 },
];

async function processReferralRewards(user, rewardAmount) {
  let currentUser = user;
  let currentLevel = 1;

  while (currentUser.referredById && currentLevel <= REFERRAL_LEVELS.length) {
    const referrer = await prisma.user.findUnique({ 
      where: { id: currentUser.referredById },
      include: { referredBy: true }
    });

    if (!referrer) break;

    const levelReward = rewardAmount * REFERRAL_LEVELS[currentLevel - 1].percentage;

    await prisma.user.update({
      where: { id: referrer.id },
      data: { balance: { increment: levelReward } },
    });

    console.log(`Referral reward processed: User ${referrer.id} received ${levelReward} for level ${currentLevel}`);

    currentUser = referrer;
    currentLevel++;
  }
}

async function getReferralsByLevels(userId, maxLevels = 5) {
  const referralsByLevel = [];

  async function getNextLevelReferrals(parentIds, level) {
    if (level > maxLevels || parentIds.length === 0) return;

    const referrals = await prisma.user.findMany({
      where: { referredById: { in: parentIds } },
      select: { id: true, telegramId: true, username: true, firstName: true, lastName: true }
    });

    referralsByLevel.push({ level, referrals });

    await getNextLevelReferrals(referrals.map(r => r.id), level + 1);
  }

  await getNextLevelReferrals([userId], 1);

  return referralsByLevel;
}

module.exports = {
  processReferralRewards,
  getReferralsByLevels,
};