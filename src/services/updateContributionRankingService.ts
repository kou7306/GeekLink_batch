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

type RankingPeriod = "daily" | "weekly" | "monthly";

export const updateDailyContributionRanking = (): Promise<RankedUser[]> => {
  return updateContributionRankingService("daily");
};

export const updateWeeklyContributionRanking = (): Promise<RankedUser[]> => {
  return updateContributionRankingService("weekly");
};

export const updateMonthlyContributionRanking = (): Promise<RankedUser[]> => {
  return updateContributionRankingService("monthly");
};

export const updateContributionRankingService = async (
  period: RankingPeriod
): Promise<RankedUser[]> => {
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
    const timeRange = getTimeRange(period, now);

    const contributionPromises = users.map((user) =>
      fetchUserContributions(user, timeRange)
    );

    const allContributions = await Promise.all(contributionPromises);
    const ranking = rankUsers(allContributions, timeRange.to, timeRange.days);

    await updateRankingInDatabase(ranking, period);

    return ranking.slice(0, 5); // Return top 5 users
  } catch (error) {
    console.error(`Error updating ${period} contribution ranking:`, error);
    throw error;
  }
};

function getTimeRange(period: RankingPeriod, now: Date) {
  const to = now;
  let from: Date;
  let days: number;

  switch (period) {
    case "daily":
      from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
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
  }

  return { from, to, days };
}

async function fetchUserContributions(
  user: {
    user_id: string;
    github_access_token: string | null;
    github: string | null;
  },
  timeRange: { from: Date; to: Date }
): Promise<{
  user: { user_id: string; github: string };
  contributions: ContributionDay[];
}> {
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
      username: user.github!,
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
}

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
      total_stars: user.contribution_count,
      rank: index + 1,
      updated_at: jstDate,
    })),
  });
}
