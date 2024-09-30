/*
  Warnings:

  - You are about to drop the `Events` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "public"."Events";

-- CreateTable
CREATE TABLE "public"."Event" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" TEXT NOT NULL,
    "tech_stack" TEXT[],
    "max_participants" INTEGER NOT NULL,
    "event_type" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "participant_ids" TEXT[],
    "description" TEXT,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);
