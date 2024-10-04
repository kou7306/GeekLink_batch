import prisma from "../config/prisma.js";
import { graphql } from "@octokit/graphql";

interface ContributionRepo {
  name: string;
  stargazerCount: number;
}

interface RankedUser {
  user_id: string;
  total_stars: number;
}

type RankingPeriod = "daily" | "weekly" | "monthly";

export const updateDailyContributionStarRanking = (): Promise<RankedUser[]> => {
  return updateContributionStarRankingService("daily");
};

export const updateWeeklyContributionStarRanking = (): Promise<
  RankedUser[]
> => {
  return updateContributionStarRankingService("weekly");
};

export const updateMonthlyContributionStarRanking = (): Promise<
  RankedUser[]
> => {
  return updateContributionStarRankingService("monthly");
};

async function updateContributionStarRankingService(
  period: RankingPeriod
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

    const { startDate, endDate } = getPeriodDates(period);

    const contributionPromises = users.map((user) =>
      fetchUserContributions(user, startDate, endDate)
    );

    const allContributions = await Promise.all(contributionPromises);

    const ranking = rankReposByStars(allContributions);

    await updateRankingInDatabase(ranking, period);

    return ranking.slice(0, 5); // Return top 5
  } catch (error) {
    console.error(`Error updating ${period} contribution star ranking:`, error);
    throw error;
  }
}

function getPeriodDates(period: RankingPeriod): {
  startDate: Date;
  endDate: Date;
} {
  const now = new Date();
  let startDate: Date;

  switch (period) {
    case "daily":
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case "weekly":
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "monthly":
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
  }

  return { startDate, endDate: now };
}

async function fetchUserContributions(
  user: {
    user_id: string;
    github_access_token: string | null;
    github: string | null;
  },
  startDate: Date,
  endDate: Date
): Promise<{
  user: { user_id: string; github: string };
  contributions: ContributionRepo[];
}> {
  const graphqlWithAuth = graphql.defaults({
    headers: {
      authorization: `token ${user.github_access_token}`,
    },
  });

  const { user: githubUser } = await graphqlWithAuth<{
    user: {
      contributionsCollection: {
        commitContributionsByRepository: {
          repository: {
            name: string;
            stargazerCount: number;
          };
        }[];
      };
    };
  }>(
    `
    query($username: String!, $from: DateTime!, $to: DateTime!) {
      user(login: $username) {
        contributionsCollection(from: $from, to: $to) {
          commitContributionsByRepository {
            repository {
              name
              stargazerCount
            }
          }
        }
      }
    }
  `,
    {
      username: user.github!,
      from: startDate.toISOString(),
      to: endDate.toISOString(),
    }
  );

  const contributions =
    githubUser.contributionsCollection.commitContributionsByRepository.map(
      (contribution) => ({
        name: contribution.repository.name,
        stargazerCount: contribution.repository.stargazerCount,
      })
    );

  return {
    user: {
      user_id: user.user_id,
      github: user.github ?? "",
    },
    contributions,
  };
}

function rankReposByStars(
  allContributions: Array<{
    user: { user_id: string; github: string };
    contributions: ContributionRepo[];
  }>
): RankedUser[] {
  const rankedUsers = allContributions.map(({ user, contributions }) => {
    const uniqueRepos = new Set(
      contributions.map((contribution) => contribution.name)
    );

    const totalStars = Array.from(uniqueRepos).reduce((sum, repoName) => {
      const repo = contributions.find(
        (contribution) => contribution.name === repoName
      );
      return sum + (repo?.stargazerCount || 0);
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
  period: RankingPeriod
) {
  const now = new Date();
  const jstDate = new Date(now.getTime() + 9 * 60 * 60 * 1000); // Convert to JST

  const tableName = `${period}GithubContributionStarRanking` as const;

  if (period === "daily") {
    await prisma.dailyGithubContributionStarRanking.deleteMany({});
  } else if (period === "weekly") {
    await prisma.weeklyGithubContributionStarRanking.deleteMany({});
  } else if (period === "monthly") {
    await prisma.monthlyGithubContributionStarRanking.deleteMany({});
  }
  await prisma[tableName].createMany({
    data: ranking.map((user, index) => ({
      user_id: user.user_id,
      total_stars: user.total_stars,
      rank: index + 1,
      updated_at: jstDate,
    })),
  });
}
