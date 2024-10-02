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

export const updateContributionRankingService = async (): Promise<{
  daily: RankedUser[];
  weekly: RankedUser[];
  monthly: RankedUser[];
}> => {
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
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

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
          username: user.github, // usernameフィールドをgithubに変更
          from: oneMonthAgo.toISOString(),
          to: now.toISOString(),
        }
      );

      const contributions =
        githubUser.contributionsCollection.contributionCalendar.weeks.flatMap(
          (week) => week.contributionDays
        );

      return {
        user: {
          user_id: user.user_id,
          github: user.github ?? "", // githubフィールドを保持
        },
        contributions,
      };
    });

    const allContributions = await Promise.all(contributionPromises);

    const dailyRanking = rankUsers(allContributions, now, 1);
    const weeklyRanking = rankUsers(allContributions, now, 7);
    const monthlyRanking = rankUsers(allContributions, now, 30);

    await updateRankingsInDatabase(dailyRanking, weeklyRanking, monthlyRanking);

    return {
      daily: dailyRanking.slice(0, 5),
      weekly: weeklyRanking.slice(0, 5),
      monthly: monthlyRanking.slice(0, 5),
    };
  } catch (error) {
    console.error("Error updating contribution ranking:", error);
    throw error;
  }
};

function rankUsers(
  allContributions: Array<{
    user: { user_id: string; github: string }; // githubフィールドを使用
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

async function updateRankingsInDatabase(
  daily: RankedUser[],
  weekly: RankedUser[],
  monthly: RankedUser[]
) {
  // DailyGithubContributionRankingに格納
  await prisma.dailyGithubContributionRanking.deleteMany({});
  await prisma.dailyGithubContributionRanking.createMany({
    data: daily.map((user, index) => ({
      user_id: user.user_id,
      contribution_count: user.contribution_count,
      rank: index + 1,
      created_at: new Date(),
      updated_at: new Date(),
    })),
  });

  // WeeklyGithubContributionRankingに格納
  await prisma.weeklyGithubContributionRanking.deleteMany({});
  await prisma.weeklyGithubContributionRanking.createMany({
    data: weekly.map((user, index) => ({
      user_id: user.user_id,
      contribution_count: user.contribution_count,
      rank: index + 1,
      created_at: new Date(),
      updated_at: new Date(),
    })),
  });

  // MonthlyGithubContributionRankingに格納
  await prisma.monthlyGithubContributionRanking.deleteMany({});
  await prisma.monthlyGithubContributionRanking.createMany({
    data: monthly.map((user, index) => ({
      user_id: user.user_id,
      contribution_count: user.contribution_count,
      rank: index + 1,
      created_at: new Date(),
      updated_at: new Date(),
    })),
  });
}

// 8時間おきに実行するデイリーランキング更新サービス
export const updateDailyContributionRankingService =
  async (): Promise<void> => {
    try {
      const users = await prisma.users.findMany({
        where: { github_access_token: { not: null } },
        select: {
          user_id: true,
          github_access_token: true,
          github: true,
        },
      });

      const now = new Date();
      const todayStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

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
            from: todayStart.toISOString(),
            to: todayEnd.toISOString(),
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
      const dailyRanking = rankUsers(allContributions, now, 1); // 1日のランキングを取得

      await updateRankingsInDatabase(dailyRanking, [], []); // デイリーのみ更新
    } catch (error) {
      console.error("Error updating daily contribution ranking:", error);
      throw error;
    }
  };
