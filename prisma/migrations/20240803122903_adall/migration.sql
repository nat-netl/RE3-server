/*
  Warnings:

  - You are about to drop the column `referredBy` on the `User` table. All the data in the column will be lost.
  - Made the column `referralCode` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `earnedAmount` to the `UserTaskCompletion` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "referredBy",
ADD COLUMN     "referredById" INTEGER,
ALTER COLUMN "referralCode" SET NOT NULL;

-- AlterTable
ALTER TABLE "UserTaskCompletion" ADD COLUMN     "earnedAmount" DOUBLE PRECISION NOT NULL;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
