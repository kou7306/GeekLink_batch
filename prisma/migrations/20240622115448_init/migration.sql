/*
  Warnings:

  - You are about to drop the column `desiredOccupation` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "desiredOccupation",
ADD COLUMN     "desired_occupation" TEXT;
