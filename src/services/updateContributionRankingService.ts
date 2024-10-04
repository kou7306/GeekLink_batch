import prisma from "../config/prisma.js";
import { graphql } from "@octokit/graphql";

interface ContributionDay {
  date: string;
  contributionCount: number;
}

interface RankedUser {
  user_id: string;
  contribution_count: number;
}

// ランキングの種類に基づいて更新処理を実行する関数
export const updateContributionRankingService = async (
  type: "daily" | "weekly" | "monthly"
): Promise<RankedUser[]> => {
  try {
    const users = await prisma.users.findMany({
      where: { github_access_token: { not: null } },
      select: {
        user_id: true,
        github_access_token: true,
        github: true, // usernameをgithubに変更
      },
    });

    const now = new Date();
    const timeRange = getTimeRange(type, now);

    const contributionPromises = users.map(async (user) => {
      const graphqlWithAuth = graphql.defaults({
        headers: {
          authorization: `token ${user.github_access_token}`,
        },
      });

      const { user: githubUser } = await graphqlWithAuth<{
        user: {
          contributionsCollection: {
            contributionCalendar: {
              weeks: { contributionDays: ContributionDay[] }[];
            };
          };
        };
      }>(
        `
        query($username: String!, $from: DateTime!, $to: DateTime!) {
          user(login: $username) {
            contributionsCollection(from: $from, to: $to) {
              contributionCalendar {
                weeks {
                  contributionDays {
                    date
                    contributionCount
                  }
                }
              }
            }
          }
        }
      `,
        {
          username: user.github,
          from: timeRange.from.toISOString(),
          to: timeRange.to.toISOString(),
        }
      );

      const contributions =
        githubUser.contributionsCollection.contributionCalendar.weeks.flatMap(
          (week) => week.contributionDays
        );

      return {
        user: {
          user_id: user.user_id,
          github: user.github ?? "",
        },
        contributions,
      };
    });

    const allContributions = await Promise.all(contributionPromises);
    const ranking = rankUsers(allContributions, timeRange.to, timeRange.days);

    await updateRankingInDatabase(type, ranking);

    return ranking.slice(0, 5); // 上位5人のユーザーを返す
  } catch (error) {
    console.error("Error updating contribution ranking:", error);
    throw error;
  }
};

// デイリーランキングの更新
export const updateDailyContributionRanking = async (): Promise<
  RankedUser[]
> => {
  return updateContributionRankingService("daily");
};

// ウィークリーランキングの更新
export const updateWeeklyContributionRanking = async (): Promise<
  RankedUser[]
> => {
  return updateContributionRankingService("weekly");
};

// マンスリーランキングの更新
export const updateMonthlyContributionRanking = async (): Promise<
  RankedUser[]
> => {
  return updateContributionRankingService("monthly");
};

// タイプに応じて時間範囲を計算する関数
function getTimeRange(type: "daily" | "weekly" | "monthly", now: Date) {
  const to = now;
  let from: Date;
  let days: number;

  switch (type) {
    case "daily":
      from = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
      days = 1;
      break;
    case "weekly":
      from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      days = 7;
      break;
    case "monthly":
      from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      days = 30;
      break;
    default:
      throw new Error("Invalid ranking type");
  }

  return { from, to, days };
}

// ユーザーのランキングを計算する関数
function rankUsers(
  allContributions: Array<{
    user: { user_id: string; github: string };
    contributions: ContributionDay[];
  }>,
  endDate: Date,
  days: number
): RankedUser[] {
  const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

  const rankedUsers = allContributions.map(({ user, contributions }) => {
    const filteredContributions = contributions.filter(
      (day) => new Date(day.date) >= startDate && new Date(day.date) <= endDate
    );
    const totalContributions = filteredContributions.reduce(
      (sum, day) => sum + day.contributionCount,
      0
    );

    return {
      user_id: user.user_id,
      contribution_count: totalContributions,
    };
  });

  return rankedUsers.sort(
    (a, b) => b.contribution_count - a.contribution_count
  );
}

// ランキングをデータベースに保存する関数
async function updateRankingInDatabase(
  type: "daily" | "weekly" | "monthly",
  ranking: RankedUser[]
) {
  const now = new Date();
  const jstDate = new Date(now.getTime() + 9 * 60 * 60 * 1000); // 日本時間

  let tableName;

  switch (type) {
    case "daily":
      tableName = "dailyGithubContributionRanking";
      break;
    case "weekly":
      tableName = "weeklyGithubContributionRanking";
      break;
    case "monthly":
      tableName = "monthlyGithubContributionRanking";
      break;
    default:
      throw new Error("Invalid ranking type");
  }

  // ランキングを削除し、新しいデータを挿入
  await (prisma[tableName as keyof typeof prisma] as any).deleteMany({});
  await prisma[tableName as keyof typeof prisma as any].createMany({
    data: ranking.map((user, index) => ({
      user_id: user.user_id,
      contribution_count: user.contribution_count,
      rank: index + 1,
      updated_at: jstDate, // 日本時間
    })),
  });
}
