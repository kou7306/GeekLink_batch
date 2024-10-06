import prisma from "../config/prisma.js";

const JST_OFFSET = 9 * 60 * 60 * 1000; // JSTオフセット（ミリ秒）

interface RankedUser {
  userId: string;
  score: number;
}

// 各ランキングの更新関数
export const updateDailyGeekLinkActivityRanking = async (): Promise<
  RankedUser[]
> => {
  return updateGeekLinkActivityRankingService("daily", 24);
};

export const updateWeeklyGeekLinkActivityRanking = async (): Promise<
  RankedUser[]
> => {
  return updateGeekLinkActivityRankingService("weekly", 7 * 24); // 7日間
};

export const updateMonthlyGeekLinkActivityRanking = async (): Promise<
  RankedUser[]
> => {
  return updateGeekLinkActivityRankingService("monthly", 30 * 24); // 30日間
};

// ユーザーの投稿とイベントを取得
const getUserAppActivity = async (uuid: string | null, hoursBack: number) => {
  try {
    const time = new Date();
    time.setUTCHours(time.getUTCHours() - hoursBack);

    // タイムラインの投稿を取得
    const posts = await prisma.timeline.findMany({
      where: {
        user_id: uuid,
        created_at: {
          gte: time.toISOString(),
        },
      },
    });

    // イベントを取得
    const events = await prisma.event.findMany({
      where: uuid
        ? {
            owner_id: uuid,
            created_at: {
              gte: time.toISOString(),
            },
          }
        : undefined,
    });

    // 投稿とイベントを結合し、作成日時でソート
    const activity = [...posts, ...events].sort((a, b) => {
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });

    return { postCount: posts.length, eventCount: events.length };
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// スコアの計算: 投稿数 + (イベント作成数 * 5)
const calculateScore = (postCount: number, eventCount: number): number => {
  return postCount + eventCount * 5;
};

// ランキングをデータベースに保存
const saveRankingToDatabase = async (ranking: RankedUser[], period: string) => {
  const currentTime = new Date(Date.now() + JST_OFFSET); // 日本時間に合わせる

  for (const [index, user] of ranking.entries()) {
    await (prisma as any)[`${period}GeekLinkActivity`].create({
      data: {
        user_id: user.userId,
        activity_score: user.score,
        rank: index + 1, // ランキングは1から始まる
        updated_at: currentTime, // updated_atを日本時間で設定
      },
    });
  }
};

// GeekLink Activity Rankingの更新
const updateGeekLinkActivityRankingService = async (
  period: string,
  hoursBack: number
): Promise<RankedUser[]> => {
  const users = await prisma.users.findMany({
    select: {
      user_id: true,
    },
  });
  console.log(users);

  const userScores: RankedUser[] = [];

  for (const user of users) {
    console.log(`Processing user ${user.user_id}`);
    try {
      const { postCount, eventCount } = await getUserAppActivity(
        user.user_id,
        hoursBack
      );

      console.log(
        `User ${user.user_id} has ${postCount} posts and ${eventCount} events`
      );
      const totalScore = calculateScore(postCount, eventCount);

      userScores.push({
        userId: user.user_id,
        score: totalScore,
      });
    } catch (error) {
      console.error(`Error processing user ${user.user_id}`);
    }
  }

  // スコア順にソート
  userScores.sort((a, b) => b.score - a.score);
  console.log(userScores);

  // ランキングをデータベースに保存
  await saveRankingToDatabase(userScores, period);

  return userScores;
};

// Prismaクライアントをクリーンアップ
process.on("exit", async () => {
  await prisma.$disconnect();
});
