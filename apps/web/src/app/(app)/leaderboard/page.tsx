import { auth } from "@clerk/nextjs/server";
import { LeaderboardView } from "@/components/leaderboard-view";
import { getLeaderboard, type Leaderboard } from "@/lib/api-client";
import { parsePageParam } from "@/lib/pagination";

const PAGE_SIZE = 20;

export default async function LeaderboardPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ page?: string | string[] }>;
}>) {
  const { page: pageParam } = await searchParams;
  const page = parsePageParam(pageParam);

  const { userId, getToken } = await auth();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const token = await getToken();

  let leaderboard: Leaderboard | null = null;
  let error = false;
  try {
    leaderboard = token ? await getLeaderboard(apiUrl, token, page, PAGE_SIZE) : null;
    if (!leaderboard) {
      error = true;
    }
  } catch {
    error = true;
  }

  return <LeaderboardView leaderboard={leaderboard} error={error} currentUserId={userId} />;
}
