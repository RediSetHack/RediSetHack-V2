import { auth } from "@clerk/nextjs/server";
import { LeaderboardView } from "@/components/leaderboard-view";
import { getLeaderboard, type Leaderboard } from "@/lib/api-client";
import { getPageInfo, parsePageParam } from "@/lib/pagination";

const PAGE_SIZE = 20;

export default async function LeaderboardPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ page?: string | string[] }>;
}>) {
  const { page: pageParam } = await searchParams;
  const requestedPage = parsePageParam(pageParam);

  const { userId, getToken } = await auth();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const token = await getToken();

  let leaderboard: Leaderboard | null = null;
  let error = false;
  try {
    if (token) {
      leaderboard = await getLeaderboard(apiUrl, token, requestedPage, PAGE_SIZE);
      const { page: clampedPage } = getPageInfo(requestedPage, PAGE_SIZE, leaderboard.total);
      if (clampedPage !== requestedPage) {
        leaderboard = await getLeaderboard(apiUrl, token, clampedPage, PAGE_SIZE);
      }
    } else {
      error = true;
    }
  } catch {
    error = true;
  }

  return (
    <div className="flex-1 mx-auto w-full max-w-5xl p-6 sm:p-10">
      <LeaderboardView
        leaderboard={leaderboard}
        error={error}
        currentUserId={userId}
      />
    </div>
  );
}
