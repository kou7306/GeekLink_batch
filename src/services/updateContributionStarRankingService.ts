import prisma from "../config/prisma.js";
import { graphql } from "@octokit/graphql";

interface ContributionRepo {
  repo_name: string;
  stargazers_count: number;
}

interface RankedUser {
  user_id: string;
  total_stars: number;
}

export const updateDailyContributionStarRanking = async (): Promise<
  RankedUser[]
> => {
  return updateContributionStarRankingService("daily");
};

export const updateWeeklyContributionStarRanking = async (): Promise<
  RankedUser[]
> => {
  return updateContributionStarRankingService("weekly");
};

export const updateMonthlyContributionStarRanking = async (): Promise<
  RankedUser[]
> => {
  return updateContributionStarRankingService("monthly");
};

async function updateContributionStarRankingService(
  period: "daily" | "weekly" | "monthly"
): Promise<RankedUser[]> {
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
    let startDate: Date;

    // 日、週、月ごとに期間を設定
    switch (period) {
      case "daily":
        startDate = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000); // 過去1日
        break;
      case "weekly":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 過去1週間
        break;
      case "monthly":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 過去1ヶ月
        break;
    }

    const contributionPromises = users.map(async (user) => {
      const graphqlWithAuth = graphql.defaults({
        headers: {
          authorization: `token ${user.github_access_token}`,
        },
      });

      // ユーザーがコントリビュートしたリポジトリを取得
      const { user: githubUser } = await graphqlWithAuth<{
        user: {
          repositoriesContributedTo: {
            nodes: {
              name: string;
              stargazers: { totalCount: number };
            }[];
          };
        };
      }>(
        `
        query($username: String!, $from: DateTime!) {
          user(login: $username) {
            repositoriesContributedTo(first: 100, from: $from) {
              nodes {
                name
                stargazers {
                  totalCount
                }
              }
            }
          }
        }
      `,
        {
          username: user.github,
          from: startDate.toISOString(), // 指定期間内のコントリビュートを取得
        }
      );

      const contributions = githubUser.repositoriesContributedTo.nodes.map(
        (repo) => ({
          repo_name: repo.name,
          stargazers_count: repo.stargazers.totalCount,
        })
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

    const ranking = rankReposByStars(allContributions, now, startDate);

    await updateRankingInDatabase(ranking, period);

    return ranking.slice(0, 5); // トップ5を返す
  } catch (error) {
    console.error(`Error updating ${period} contribution star ranking:`, error);
    throw error;
  }
}

function rankReposByStars(
  allContributions: Array<{
    user: { user_id: string; github: string };
    contributions: ContributionRepo[];
  }>,
  endDate: Date,
  startDate: Date
): RankedUser[] {
  const rankedUsers = allContributions.map(({ user, contributions }) => {
    const uniqueRepos = new Set(
      contributions
        .filter((contribution) => {
          const contributionDate = new Date(contribution.repo_name);
          return contributionDate >= startDate && contributionDate <= endDate;
        })
        .map((contribution) => contribution.repo_name)
    );

    const totalStars = Array.from(uniqueRepos).reduce((sum, repo) => {
      const repoContributions = contributions.find(
        (contribution) => contribution.repo_name === repo
      );
      return sum + (repoContributions?.stargazers_count || 0);
    }, 0);

    return {
      user_id: user.user_id,
      total_stars: totalStars,
    };
  });

  return rankedUsers.sort((a, b) => b.total_stars - a.total_stars);
}

async function updateRankingInDatabase(
  ranking: RankedUser[],
  period: "daily" | "weekly" | "monthly"
) {
  const now = new Date();
  const jstDate = new Date(now.getTime() + 9 * 60 * 60 * 1000); // 日本時間に変換

  switch (period) {
    case "daily":
      await prisma.dailyGithubContributionStarRanking.deleteMany({});
      await prisma.dailyGithubContributionStarRanking.createMany({
        data: ranking.map((user, index) => ({
          user_id: user.user_id,
          total_stars: user.total_stars,
          rank: index + 1,
          updated_at: jstDate,
        })),
      });
      break;
    case "weekly":
      await prisma.weeklyGithubContributionStarRanking.deleteMany({});
      await prisma.weeklyGithubContributionStarRanking.createMany({
        data: ranking.map((user, index) => ({
          user_id: user.user_id,
          total_stars: user.total_stars,
          rank: index + 1,
          updated_at: jstDate,
        })),
      });
      break;
    case "monthly":
      await prisma.monthlyGithubContributionStarRanking.deleteMany({});
      await prisma.monthlyGithubContributionStarRanking.createMany({
        data: ranking.map((user, index) => ({
          user_id: user.user_id,
          total_stars: user.total_stars,
          rank: index + 1,
          updated_at: jstDate,
        })),
      });
      break;
  }
}
