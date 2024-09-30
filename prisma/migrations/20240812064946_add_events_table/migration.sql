/*
  Warnings:

  - You are about to drop the column `conversation_id` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `room_id` to the `Message` table without a default value. This is not possible if the table is not empty.

*/
-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "auth";

-- AlterTable
ALTER TABLE "public"."Match" ADD COLUMN     "room_id" TEXT NOT NULL DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "public"."Message" DROP COLUMN "conversation_id",
ADD COLUMN     "room_id" TEXT NOT NULL;

-- DropTable
DROP TABLE "public"."User";

-- CreateTable
CREATE TABLE "public"."users" (
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "sex" TEXT NOT NULL,
    "age" TEXT NOT NULL,
    "place" TEXT NOT NULL,
    "top_tech" TEXT NOT NULL,
    "top_teches" TEXT[],
    "teches" TEXT[],
    "hobby" TEXT,
    "occupation" TEXT NOT NULL,
    "affiliation" TEXT,
    "qualification" TEXT[],
    "editor" TEXT,
    "github" TEXT,
    "twitter" TEXT,
    "qiita" TEXT,
    "zenn" TEXT,
    "atcoder" TEXT,
    "message" TEXT,
    "updated_at" TIMESTAMP(3),
    "portfolio" TEXT,
    "graduate" TEXT,
    "desired_occupation" TEXT,
    "faculty" TEXT,
    "experience" TEXT[],
    "image_url" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "public"."UserGroups" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "member_ids" TEXT[],
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "UserGroups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Events" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" TEXT NOT NULL,
    "tech_stack" TEXT[],
    "max_participants" INTEGER NOT NULL,
    "event_type" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Events_pkey" PRIMARY KEY ("id")
);
