/*
  Warnings:

  - Made the column `name` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `sex` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `age` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `place` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `occupation` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "User" ALTER COLUMN "name" SET NOT NULL,
ALTER COLUMN "sex" SET NOT NULL,
ALTER COLUMN "age" SET NOT NULL,
ALTER COLUMN "place" SET NOT NULL,
ALTER COLUMN "occupation" SET NOT NULL;
