import { PrismaClient } from "@prisma/client";
import fetch from "node-fetch";

const prisma = new PrismaClient();
const JST_OFFSET = 9 * 60 * 60 * 1000; // JSTオフセット（ミリ秒）

interface Article {
  likes_count: number;
  page_views_count: number;
}

interface RankedUser {
  userId: string;
  username: string;
  score: number;
}

// 各ランキングの更新関数
export const updateDailyQiitaRanking = async (): Promise<RankedUser[]> => {
  return updateQiitaRankingService("daily");
};

export const updateWeeklyQiitaRanking = async (): Promise<RankedUser[]> => {
  return updateQiitaRankingService("weekly");
};

export const updateMonthlyQiitaRanking = async (): Promise<RankedUser[]> => {
  return updateQiitaRankingService("monthly");
};

const fetchQiitaUserData = async (
  accessToken: string,
  period: string
): Promise<Article[]> => {
  const baseUrl = `https://qiita.com/api/v2/items`;
  const dateFilter =
    period === "daily"
      ? `created:>=${new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()}`
      : period === "weekly"
      ? `created:>=${new Date(
          Date.now() - 7 * 24 * 60 * 60 * 1000
        ).toISOString()}`
      : `created:>=${new Date(
          Date.now() - 30 * 24 * 60 * 60 * 1000
        ).toISOString()}`;

  const url = `${baseUrl}?query=${dateFilter}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) throw new Error("Failed to fetch data from Qiita API");

  const responseData: any = await response.json();

  // Articleインターフェースのインスタンスを生成
  const articles: Article[] = responseData.map((item: any) => ({
    likes_count: item.likes_count,
    page_views_count: item.page_views_count,
  }));

  return articles;
};

const calculateScore = (article: Article): number => {
  return article.likes_count * 10 + article.page_views_count; // 得点計算
};

const saveRankingToDatabase = async (ranking: RankedUser[], period: string) => {
  const currentTime = new Date(Date.now() + JST_OFFSET); // 日本時間に合わせる

  for (const [index, user] of ranking.entries()) {
    await (prisma as any)[`${period}QiitaRanking`].create({
      data: {
        user_id: user.userId,
        score: user.score,
        rank: index + 1, // ランキングは1から始まる
        updated_at: currentTime, // updated_atを日本時間で設定
      },
    });
  }
};

const updateQiitaRankingService = async (
  period: string
): Promise<RankedUser[]> => {
  const users = await prisma.users.findMany({
    select: {
      user_id: true,
      qiita_access_token: true,
    },
  });

  const userScores: RankedUser[] = [];

  for (const user of users) {
    if (!user.qiita_access_token) continue; // アクセストークンがないユーザーをスキップ

    try {
      const articles = await fetchQiitaUserData(
        user.qiita_access_token,
        period
      );
      const totalScore = articles.reduce(
        (acc, article) => acc + calculateScore(article),
        0
      );
      userScores.push({
        userId: user.user_id,
        username: user.user_id,
        score: totalScore,
      }); // usernameは仮でuser_idを設定
    } catch (error) {
      console.error(`Error processing user ${user.user_id}`);
    }
  }

  userScores.sort((a, b) => b.score - a.score); // スコアでソート
  await saveRankingToDatabase(userScores, period); // データベースにランキングを保存

  return userScores;
};

// Prismaクライアントをクリーンアップ
process.on("exit", async () => {
  await prisma.$disconnect();
});
