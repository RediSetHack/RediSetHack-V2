import type {
  BadgeAward,
  Character,
  DailyEventResponse,
  ExecuteCodeResponse,
  CodingActivityResponse,
  CodingAttemptResponse,
  CtfArtifactResponse,
  CtfAttemptResponse,
  CtfChallengeResponse,
  CtfChallengeSummary,
  Language,
  LeaderboardResponse,
  LessonResponse,
  ProfileResponse,
  Quest,
  QuestResponse,
  QuestResultReviewResponse,
  QuestSessionResponse,
  SideQuestResponse,
  SideQuestSummary,
  Region,
  Stage,
  StageCompletionResponse,
  SubmitQuestResponse,
  Zone,
} from "@repo/contracts";
export type {
  BadgeAward,
  LeaderboardEntry,
  LessonBlock,
} from "@repo/contracts";
import {
  ExecuteCodeResponseSchema,
  CodingActivityResponseSchema,
  CodingAttemptResponseSchema,
  CtfArtifactResponseSchema,
  SideQuestListResponseSchema,
  SideQuestResponseSchema,
  CtfAttemptResponseSchema,
  CtfChallengeListResponseSchema,
  CtfChallengeResponseSchema,
  QuestListResponseSchema,
  QuestResultReviewResponseSchema,
  QuestSessionResponseSchema,
  SubmitQuestResponseSchema,
} from "@repo/contracts";

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
export type CodingActivity = CodingActivityResponse;
export type CodingAttempt = CodingAttemptResponse;
export type CtfChallenge = CtfChallengeResponse;
export type CtfSummary = CtfChallengeSummary;
export type CtfArtifact = CtfArtifactResponse;
export type CtfAttempt = CtfAttemptResponse;
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
  return fetchPublicJson<CharacterOption[]>(
    endpoint,
    "character catalog",
    fetchFn,
  );
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
  userData?: { name?: string | null },
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
  return QuestListResponseSchema.parse(
    await fetchAuthedJson<unknown>(endpoint, token, fetchFn),
  );
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
  return QuestSessionResponseSchema.parse(
    await postAuthedJson<unknown>(endpoint, token, {}, fetchFn),
  );
}

/** Submits a Quest Session's answers for server-side scoring. */
export async function submitQuest(
  apiBaseUrl: string,
  token: string,
  questId: number,
  sessionId: number,
  responses: QuestSubmission[],
  fetchFn: typeof fetch = fetch,
): Promise<QuestSubmitResult> {
  const endpoint = `${apiBaseUrl.replace(/\/$/, "")}/v1/api/quests/${questId}/submit`;
  return SubmitQuestResponseSchema.parse(
    await postAuthedJson<unknown>(
      endpoint,
      token,
      { sessionId, responses },
      fetchFn,
    ),
  );
}

/** Reviews a submitted Result against the correct answers. */
export async function getQuestResult(
  apiBaseUrl: string,
  token: string,
  resultId: number,
  fetchFn: typeof fetch = fetch,
): Promise<QuestResultReview> {
  const endpoint = `${apiBaseUrl.replace(/\/$/, "")}/v1/api/quests/results/${resultId}`;
  return QuestResultReviewResponseSchema.parse(
    await fetchAuthedJson<unknown>(endpoint, token, fetchFn),
  );
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
  return ExecuteCodeResponseSchema.parse(
    await postAuthedJson<unknown>(endpoint, token, input, fetchFn),
  );
}

/** Evaluates and awards pending or missed Badges for the learner, `POST /v1/api/badges/evaluate`. */
export async function evaluateBadges(
  apiBaseUrl: string,
  token: string,
  fetchFn: typeof fetch = fetch,
): Promise<BadgeAward[]> {
  const endpoint = `${apiBaseUrl.replace(/\/$/, "")}/v1/api/badges/evaluate`;
  return postAuthedJson<BadgeAward[]>(endpoint, token, {}, fetchFn);
}

/** Opens a graded coding activity, `GET /v1/api/codelab/activities/:activityId`. */
export async function getCodingActivity(
  apiBaseUrl: string,
  token: string,
  activityId: number,
  fetchFn: typeof fetch = fetch,
): Promise<CodingActivity> {
  const endpoint = `${apiBaseUrl.replace(/\/$/, "")}/v1/api/codelab/activities/${activityId}`;
  return CodingActivityResponseSchema.parse(
    await fetchAuthedJson<unknown>(endpoint, token, fetchFn),
  );
}

/** Submits code for grading, `POST /v1/api/codelab/activities/:activityId/attempts`. */
export async function submitCodingAttempt(
  apiBaseUrl: string,
  token: string,
  activityId: number,
  code: string,
  fetchFn: typeof fetch = fetch,
): Promise<CodingAttempt> {
  const endpoint = `${apiBaseUrl.replace(/\/$/, "")}/v1/api/codelab/activities/${activityId}/attempts`;
  return CodingAttemptResponseSchema.parse(
    await postAuthedJson<unknown>(endpoint, token, { code }, fetchFn),
  );
}

const ctfEndpoint = (apiBaseUrl: string, path: string) => `${apiBaseUrl.replace(/\/$/, "")}/v1/api/ctf/${path}`;

/** Lists eligible CTF challenges, `GET /v1/api/ctf/challenges`. */
export async function getCtfChallenges(apiBaseUrl: string, token: string, fetchFn: typeof fetch = fetch): Promise<CtfSummary[]> {
  return CtfChallengeListResponseSchema.parse(await fetchAuthedJson<unknown>(ctfEndpoint(apiBaseUrl, "challenges"), token, fetchFn));
}

/** Opens a challenge brief, `GET /v1/api/ctf/challenges/:id`. */
export async function getCtfChallenge(apiBaseUrl: string, token: string, id: number, fetchFn: typeof fetch = fetch): Promise<CtfChallenge> {
  return CtfChallengeResponseSchema.parse(await fetchAuthedJson<unknown>(ctfEndpoint(apiBaseUrl, `challenges/${id}`), token, fetchFn));
}

/** Fetches the challenge artifact, `GET /v1/api/ctf/challenges/:id/artifact`. */
export async function getCtfArtifact(apiBaseUrl: string, token: string, id: number, fetchFn: typeof fetch = fetch): Promise<CtfArtifact> {
  return CtfArtifactResponseSchema.parse(await fetchAuthedJson<unknown>(ctfEndpoint(apiBaseUrl, `challenges/${id}/artifact`), token, fetchFn));
}

/** Submits a flag, `POST /v1/api/ctf/challenges/:id/attempts`. */
export async function submitCtfFlag(apiBaseUrl: string, token: string, id: number, flag: string, fetchFn: typeof fetch = fetch): Promise<CtfAttempt> {
  return CtfAttemptResponseSchema.parse(await postAuthedJson<unknown>(ctfEndpoint(apiBaseUrl, `challenges/${id}/attempts`), token, { flag }, fetchFn));
}

export type SideQuest = SideQuestResponse;
export type SideQuestListItem = SideQuestSummary;

const sideQuestEndpoint = (apiBaseUrl: string, path = "") => `${apiBaseUrl.replace(/\/$/, "")}/v1/api/side-quests${path}`;

/** Lists optional Side Quests with status and lock reasons, `GET /v1/api/side-quests`. */
export async function getSideQuests(apiBaseUrl: string, token: string, fetchFn: typeof fetch = fetch): Promise<SideQuestListItem[]> {
  return SideQuestListResponseSchema.parse(await fetchAuthedJson<unknown>(sideQuestEndpoint(apiBaseUrl), token, fetchFn));
}

/** Opens a Side Quest, `GET /v1/api/side-quests/:id`. */
export async function getSideQuest(apiBaseUrl: string, token: string, id: number, fetchFn: typeof fetch = fetch): Promise<SideQuest> {
  return SideQuestResponseSchema.parse(await fetchAuthedJson<unknown>(sideQuestEndpoint(apiBaseUrl, `/${id}`), token, fetchFn));
}
