-- CreateTable
CREATE TABLE "User" (
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT,
    "sex" TEXT,
    "age" TEXT,
    "place" TEXT,
    "top_teches" TEXT[],
    "teches" TEXT[],
    "hobby" TEXT,
    "occupation" TEXT,
    "affiliation" TEXT,
    "qualification" TEXT[],
    "editor" TEXT,
    "github" TEXT,
    "twitter" TEXT,
    "qiita" TEXT,
    "zenn" TEXT,
    "atcoder" TEXT,
    "message" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "portfolio" TEXT,
    "graduate" TEXT,
    "desiredOccupation" TEXT,
    "faculty" TEXT,
    "experience" TEXT[],
    "image_url" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sender_id" TEXT NOT NULL,
    "receiver_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user1_id" TEXT NOT NULL,
    "user2_id" TEXT NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Like" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "liked_user_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "Like_pkey" PRIMARY KEY ("id")
);
