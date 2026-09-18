import type {
  Character,
  DailyEventResponse,
  ExecuteCodeResponse,
  Language,
  LeaderboardResponse,
  LessonResponse,
  ProfileResponse,
  Quest,
  QuestResponse,
  QuestResultReviewResponse,
  QuestSessionResponse,
  Region,
  Stage,
  StageCompletionResponse,
  SubmitQuestResponse,
  Zone,
} from "@repo/contracts";
export type { LeaderboardEntry, LessonBlock } from "@repo/contracts";

export type CharacterOption = Character;
export type Profile = ProfileResponse;
export type DailyEvent = DailyEventResponse;
export type Leaderboard = LeaderboardResponse;
export type Lesson = LessonResponse;
export type QuestSession = QuestSessionResponse;
export type QuestSubmission = QuestResponse;
export type QuestSubmitResult = SubmitQuestResponse;
export type QuestResultReview = QuestResultReviewResponse;
export type StageCompletion = StageCompletionResponse;
export type CodeExecutionResult = ExecuteCodeResponse;
export type { Region, Stage, Zone, Quest };

export interface UpdatedUserResponse {
  id: string;
  email: string;
  name: string | null;
  characterId: number | null;
  totalXp: number;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Throws an `ApiError` carrying the response's `message` body field, if present. */
async function throwOnError(response: Response): Promise<never> {
  const errorBody = await response.json().catch(() => ({}));
  const message =
    typeof errorBody === "object" && errorBody && "message" in errorBody
      ? String(errorBody.message)
      : `Request failed with status ${response.status}`;
  throw new ApiError(response.status, message);
}

/** Fetches a public (unauthenticated) JSON resource, throwing `ApiError` on a non-2xx response. */
async function fetchPublicJson<T>(
  endpoint: string,
  resourceLabel: string,
  fetchFn: typeof fetch,
): Promise<T> {
  const response = await fetchFn(endpoint);

  if (!response.ok) {
    throw new ApiError(
      response.status,
      `Failed to load ${resourceLabel} (status ${response.status})`,
    );
  }

  return (await response.json()) as T;
}

/** Fetches a JSON resource with a required Bearer token, throwing on a missing token or failed response. */
async function fetchAuthedJson<T>(
  endpoint: string,
  token: string,
  fetchFn: typeof fetch,
): Promise<T> {
  if (!token) {
    throw new ApiError(401, "Authentication token is required");
  }

  const response = await fetchFn(endpoint, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    await throwOnError(response);
  }

  return (await response.json()) as T;
}

export async function getCharacters(
  apiBaseUrl: string,
  fetchFn: typeof fetch = fetch,
): Promise<CharacterOption[]> {
  const endpoint = `${apiBaseUrl.replace(/\/$/, "")}/v1/api/characters`;
  return fetchPublicJson<CharacterOption[]>(endpoint, "character catalog", fetchFn);
}

export async function selectUserCharacter(
  apiBaseUrl: string,
  token: string,
  characterId: number,
  fetchFn: typeof fetch = fetch,
): Promise<UpdatedUserResponse> {
  if (!token) {
    throw new ApiError(401, "Authentication token is required");
  }

  const endpoint = `${apiBaseUrl.replace(/\/$/, "")}/v1/api/user/character`;
  const response = await fetchFn(endpoint, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ characterId }),
  });

  if (!response.ok) {
    await throwOnError(response);
  }

  return (await response.json()) as UpdatedUserResponse;
}

export async function syncUser(
  apiBaseUrl: string,
  token: string,
  userData?: { email?: string | null; name?: string | null },
  fetchFn: typeof fetch = fetch,
): Promise<UpdatedUserResponse> {
  if (!token) {
    throw new ApiError(401, "Authentication token is required");
  }

  const endpoint = `${apiBaseUrl.replace(/\/$/, "")}/v1/api/user/sync`;
  const response = await fetchFn(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(userData ?? {}),
  });

  if (!response.ok) {
    await throwOnError(response);
  }

  return (await response.json()) as UpdatedUserResponse;
}

export async function getProfile(
  apiBaseUrl: string,
  token: string,
  fetchFn: typeof fetch = fetch,
): Promise<Profile> {
  const endpoint = `${apiBaseUrl.replace(/\/$/, "")}/v1/api/users/profile`;
  return fetchAuthedJson<Profile>(endpoint, token, fetchFn);
}

export async function getTodayEvent(
  apiBaseUrl: string,
  fetchFn: typeof fetch = fetch,
): Promise<DailyEvent> {
  const endpoint = `${apiBaseUrl.replace(/\/$/, "")}/v1/api/events/today`;
  return fetchPublicJson<DailyEvent>(endpoint, "today's event", fetchFn);
}

export async function getLeaderboard(
  apiBaseUrl: string,
  token: string,
  page: number,
  limit: number,
  fetchFn: typeof fetch = fetch,
): Promise<Leaderboard> {
  const endpoint = `${apiBaseUrl.replace(/\/$/, "")}/v1/api/leaderboard?page=${page}&limit=${limit}`;
  return fetchAuthedJson<Leaderboard>(endpoint, token, fetchFn);
}

export async function getCurrentUser(
  apiBaseUrl: string,
  token: string,
  fetchFn: typeof fetch = fetch,
): Promise<UpdatedUserResponse | null> {
  if (!token) {
    throw new ApiError(401, "Authentication token is required");
  }

  const endpoint = `${apiBaseUrl.replace(/\/$/, "")}/v1/api/user/me`;
  const response = await fetchFn(endpoint, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    await throwOnError(response);
  }

  return (await response.json()) as UpdatedUserResponse;
}

export async function getRegions(
  apiBaseUrl: string,
  fetchFn: typeof fetch = fetch,
): Promise<Region[]> {
  const endpoint = `${apiBaseUrl.replace(/\/$/, "")}/v1/api/regions`;
  return fetchPublicJson<Region[]>(endpoint, "Regions", fetchFn);
}

export async function getZones(
  apiBaseUrl: string,
  regionId: number,
  fetchFn: typeof fetch = fetch,
): Promise<Zone[]> {
  const endpoint = `${apiBaseUrl.replace(/\/$/, "")}/v1/api/regions/${regionId}/zones`;
  return fetchPublicJson<Zone[]>(endpoint, "Zones", fetchFn);
}

export async function getStages(
  apiBaseUrl: string,
  token: string,
  zoneId: number,
  fetchFn: typeof fetch = fetch,
): Promise<Stage[]> {
  const endpoint = `${apiBaseUrl.replace(/\/$/, "")}/v1/api/zones/${zoneId}/stages`;
  return fetchAuthedJson<Stage[]>(endpoint, token, fetchFn);
}

export async function getLesson(
  apiBaseUrl: string,
  token: string,
  stageId: number,
  fetchFn: typeof fetch = fetch,
): Promise<Lesson> {
  const endpoint = `${apiBaseUrl.replace(/\/$/, "")}/v1/api/stages/${stageId}/lesson`;
  return fetchAuthedJson<Lesson>(endpoint, token, fetchFn);
}

export async function getQuests(
  apiBaseUrl: string,
  token: string,
  fetchFn: typeof fetch = fetch,
): Promise<Quest[]> {
  const endpoint = `${apiBaseUrl.replace(/\/$/, "")}/v1/api/quests`;
  return fetchAuthedJson<Quest[]>(endpoint, token, fetchFn);
}

/** Fetches an authed JSON resource with a POST body, throwing on a missing token or failed response. */
async function postAuthedJson<T>(
  endpoint: string,
  token: string,
  body: unknown,
  fetchFn: typeof fetch,
): Promise<T> {
  if (!token) {
    throw new ApiError(401, "Authentication token is required");
  }

  const response = await fetchFn(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    await throwOnError(response);
  }

  return (await response.json()) as T;
}

/** Starts a Quest Session: the questions and options, correct answers withheld, plus the deadline. */
export async function startQuestSession(
  apiBaseUrl: string,
  token: string,
  questId: number,
  fetchFn: typeof fetch = fetch,
): Promise<QuestSession> {
  const endpoint = `${apiBaseUrl.replace(/\/$/, "")}/v1/api/quests/${questId}/start`;
  return postAuthedJson<QuestSession>(endpoint, token, {}, fetchFn);
}

/** Submits a Quest Session's answers for server-side scoring. */
export async function submitQuest(
  apiBaseUrl: string,
  token: string,
  questId: number,
  responses: QuestSubmission[],
  fetchFn: typeof fetch = fetch,
): Promise<QuestSubmitResult> {
  const endpoint = `${apiBaseUrl.replace(/\/$/, "")}/v1/api/quests/${questId}/submit`;
  return postAuthedJson<QuestSubmitResult>(endpoint, token, { responses }, fetchFn);
}

/** Reviews a submitted Result against the correct answers. */
export async function getQuestResult(
  apiBaseUrl: string,
  token: string,
  resultId: number,
  fetchFn: typeof fetch = fetch,
): Promise<QuestResultReview> {
  const endpoint = `${apiBaseUrl.replace(/\/$/, "")}/v1/api/quests/results/${resultId}`;
  return fetchAuthedJson<QuestResultReview>(endpoint, token, fetchFn);
}

/** Marks a Stage complete, `POST /v1/api/stages/:stageId/complete`. */
export async function markStageComplete(
  apiBaseUrl: string,
  token: string,
  stageId: number,
  fetchFn: typeof fetch = fetch,
): Promise<StageCompletion> {
  const endpoint = `${apiBaseUrl.replace(/\/$/, "")}/v1/api/stages/${stageId}/complete`;
  return postAuthedJson<StageCompletion>(endpoint, token, {}, fetchFn);
}

/** Executes code in the Codelab, `POST /v1/api/codelab/execute`. */
export async function executeCode(
  apiBaseUrl: string,
  token: string,
  input: { language: Language; code: string; stdin: string },
  fetchFn: typeof fetch = fetch,
): Promise<CodeExecutionResult> {
  const endpoint = `${apiBaseUrl.replace(/\/$/, "")}/v1/api/codelab/execute`;
  return postAuthedJson<CodeExecutionResult>(endpoint, token, input, fetchFn);
}
