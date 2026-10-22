import type {
  BadgeAward,
  BadgeDefinition,
  Character,
  ContributorReview,
  DailyEventResponse,
  ExecuteCodeResponse,
  CodingActivityResponse,
  CodingAttemptResponse,
  CtfArtifactResponse,
  CtfAttemptResponse,
  CtfChallengeResponse,
  CtfChallengeSummary,
  ContributorDraft,
  CreateContributorDraft,
  UpdateContributorDraft,
  Language,
  LeaderboardResponse,
  LearningStreakResponse,
  LessonResponse,
  ProfileResponse,
  Quest,
  QuestQuestionAuthoring,
  QuestResponse,
  QuestResultReviewResponse,
  QuestSessionResponse,
  SharedProfileResponse,
  SideQuestResponse,
  SideQuestSummary,
  Region,
  Stage,
  StageCompletionResponse,
  SubmitQuestResponse,
  Zone,
  DiscoveryResponse,
} from "@repo/contracts";
export type {
  BadgeAward,
  LeaderboardEntry,
  LessonBlock,
} from "@repo/contracts";
import {
  ContributorDraftListResponseSchema,
  ContributorDraftSchema,
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
  DiscoveryResponseSchema,
} from "@repo/contracts";

export type CharacterOption = Character;
export type Profile = ProfileResponse;
export type SharedProfile = SharedProfileResponse;
export type LearningStreak = LearningStreakResponse;
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
export type { Region, Stage, Zone, Quest, Character, BadgeDefinition };

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

export async function getLearningStreak(
  apiBaseUrl: string,
  token: string,
  fetchFn: typeof fetch = fetch,
): Promise<LearningStreak> {
  const endpoint = `${apiBaseUrl.replace(/\/$/, "")}/v1/api/users/learning-streak`;
  return fetchAuthedJson<LearningStreak>(endpoint, token, fetchFn);
}

/** Turns the shareable profile on (returns its share id) or off (revokes it, returns null). */
export async function setProfileSharing(
  apiBaseUrl: string,
  token: string,
  enabled: boolean,
  fetchFn: typeof fetch = fetch,
): Promise<string | null> {
  if (!token) {
    throw new ApiError(401, "Authentication token is required");
  }

  const response = await fetchFn(`${apiBaseUrl.replace(/\/$/, "")}/v1/api/users/profile/sharing`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ enabled }),
  });
  if (!response.ok) {
    await throwOnError(response);
  }
  return ((await response.json()) as { shareId: string | null }).shareId;
}

/** Public: a 404 `ApiError` means the link is unknown or has been revoked. */
export async function getSharedProfile(
  apiBaseUrl: string,
  shareId: string,
  fetchFn: typeof fetch = fetch,
): Promise<SharedProfile> {
  const endpoint = `${apiBaseUrl.replace(/\/$/, "")}/v1/api/shared-profiles/${encodeURIComponent(shareId)}`;
  return fetchPublicJson<SharedProfile>(endpoint, "shared profile", fetchFn);
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

/** Discovers approved catalog content, optionally filtered by search, competency, and difficulty. */
export async function getDiscover(
  apiBaseUrl: string,
  token: string,
  params: Readonly<{
    q?: string;
    competency?: string;
    difficulty?: string;
    limit?: number;
  }>,
  fetchFn: typeof fetch = fetch,
): Promise<DiscoveryResponse> {
  const url = new URL(`${apiBaseUrl.replace(/\/$/, "")}/v1/api/discover`);
  if (params.q) url.searchParams.set("q", params.q);
  if (params.competency) url.searchParams.set("competency", params.competency);
  if (params.difficulty) url.searchParams.set("difficulty", params.difficulty);
  if (params.limit !== undefined) url.searchParams.set("limit", String(params.limit));
  return DiscoveryResponseSchema.parse(
    await fetchAuthedJson<unknown>(url.toString(), token, fetchFn),
  );
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

export type ContributorDraftItem = ContributorDraft;

const contributorEndpoint = (apiBaseUrl: string, path = "") => `${apiBaseUrl.replace(/\/$/, "")}/v1/api/contributor/drafts${path}`;

/** Sends a contributor draft request; a 400 surfaces every `path: message` validation issue in the error. */
async function contributorRequest(method: string, endpoint: string, token: string, body: unknown, fetchFn: typeof fetch): Promise<unknown> {
  if (!token) throw new ApiError(401, "Authentication token is required");
  const response = await fetchFn(endpoint, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (response.ok) return response.json();
  const error = await response.json().catch(() => ({}));
  const issues: { path: string; message: string }[] = Array.isArray(error?.issues) ? error.issues : [];
  if (issues.length > 0) throw new ApiError(response.status, issues.map((i) => (i.path ? `${i.path}: ${i.message}` : i.message)).join("; "));
  throw new ApiError(response.status, typeof error?.message === "string" ? error.message : `Request failed with status ${response.status}`);
}

/** Lists the caller's drafts, `GET /v1/api/contributor/drafts`. */
export async function getContributorDrafts(apiBaseUrl: string, token: string, fetchFn: typeof fetch = fetch): Promise<ContributorDraftItem[]> {
  return ContributorDraftListResponseSchema.parse(await contributorRequest("GET", contributorEndpoint(apiBaseUrl), token, undefined, fetchFn));
}

/** Creates a draft, `POST /v1/api/contributor/drafts`. */
export async function createContributorDraft(apiBaseUrl: string, token: string, input: CreateContributorDraft, fetchFn: typeof fetch = fetch): Promise<ContributorDraftItem> {
  return ContributorDraftSchema.parse(await contributorRequest("POST", contributorEndpoint(apiBaseUrl), token, input, fetchFn));
}

/** Revises a draft against the revision being edited, `PUT /v1/api/contributor/drafts/:id`. */
export async function updateContributorDraft(apiBaseUrl: string, token: string, id: number, input: UpdateContributorDraft, fetchFn: typeof fetch = fetch): Promise<ContributorDraftItem> {
  return ContributorDraftSchema.parse(await contributorRequest("PUT", contributorEndpoint(apiBaseUrl, `/${id}`), token, input, fetchFn));
}

/** Submits one revision for review, `POST /v1/api/contributor/drafts/:id/submit`. */
export async function submitContributorDraft(apiBaseUrl: string, token: string, id: number, revision: number, fetchFn: typeof fetch = fetch): Promise<ContributorDraftItem> {
  return ContributorDraftSchema.parse(await contributorRequest("POST", contributorEndpoint(apiBaseUrl, `/${id}/submit`), token, { revision }, fetchFn));
}

/* ── Admin content CRUD ─────────────────────────────────────────── */

/** `GET /v1/api/admin/stages/:id` has no server-computed learner status. */
export type AdminStageRecord = Omit<Stage, "status" | "lockReason">;
/** `GET /v1/api/admin/quests/:id` answers the learner-completion fields with the authoring payload. */
export type AdminQuestRecord = Omit<Quest, "completed" | "lockReason" | "bestResult"> & {
  questions: QuestQuestionAuthoring[];
};
export type AdminInput = Record<string, unknown>;

/** Every admin content mutation/read: Bearer token required, 400 bodies with per-field `issues` or a `message` array collapse into one `ApiError`; 204 responses resolve to `undefined`. */
async function adminRequest(method: string, endpoint: string, token: string, body?: unknown, fetchFn: typeof fetch = fetch): Promise<unknown> {
  if (!token) {
    throw new ApiError(401, "Authentication token is required");
  }

  const response = await fetchFn(endpoint, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (response.status === 204) return undefined;
  if (response.ok) return response.json();

  const error = await response.json().catch(() => ({}));
  const issues: { path: string; message: string }[] = Array.isArray(error?.issues) ? error.issues : [];
  if (issues.length > 0) {
    throw new ApiError(response.status, issues.map((i) => (i.path ? `${i.path}: ${i.message}` : i.message)).join("; "));
  }
  if (Array.isArray(error?.message)) {
    throw new ApiError(response.status, (error.message as unknown[]).map(String).join("; "));
  }
  throw new ApiError(response.status, typeof error?.message === "string" ? error.message : `Request failed with status ${response.status}`);
}

/** The four admin verbs shared by every content resource, `POST`/`GET`/`PATCH`/`DELETE /v1/api/admin/{resource}[/:id]`. */
function adminCrud<T>(resource: "regions" | "zones" | "stages" | "quests" | "badges" | "characters") {
  const endpoint = (apiBaseUrl: string, id?: number | string) => {
    const suffix = id === undefined ? "" : "/" + id;
    return `${apiBaseUrl.replace(/\/$/, "")}/v1/api/admin/${resource}${suffix}`;
  };
  return {
    create: (apiBaseUrl: string, token: string, input: AdminInput, fetchFn: typeof fetch = fetch): Promise<T> =>
      adminRequest("POST", endpoint(apiBaseUrl), token, input, fetchFn) as Promise<T>,
    get: (apiBaseUrl: string, token: string, id: number | string, fetchFn: typeof fetch = fetch): Promise<T> =>
      adminRequest("GET", endpoint(apiBaseUrl, id), token, undefined, fetchFn) as Promise<T>,
    update: (apiBaseUrl: string, token: string, id: number | string, input: AdminInput, fetchFn: typeof fetch = fetch): Promise<T> =>
      adminRequest("PATCH", endpoint(apiBaseUrl, id), token, input, fetchFn) as Promise<T>,
    remove: (apiBaseUrl: string, token: string, id: number | string, fetchFn: typeof fetch = fetch): Promise<void> =>
      adminRequest("DELETE", endpoint(apiBaseUrl, id), token, undefined, fetchFn) as Promise<void>,
  };
}

const regionsAdmin = adminCrud<Region>("regions");
export const { create: createAdminRegion, get: getAdminRegion, update: updateAdminRegion, remove: deleteAdminRegion } = regionsAdmin;

const zonesAdmin = adminCrud<Zone>("zones");
export const { create: createAdminZone, get: getAdminZone, update: updateAdminZone, remove: deleteAdminZone } = zonesAdmin;

const stagesAdmin = adminCrud<AdminStageRecord>("stages");
export const { create: createAdminStage, get: getAdminStage, update: updateAdminStage, remove: deleteAdminStage } = stagesAdmin;

const questsAdmin = adminCrud<AdminQuestRecord>("quests");
export const { create: createAdminQuest, get: getAdminQuest, update: updateAdminQuest, remove: deleteAdminQuest } = questsAdmin;
export async function getAdminQuests(
  apiBaseUrl: string,
  token: string,
  fetchFn: typeof fetch = fetch,
): Promise<AdminQuestRecord[]> {
  return adminRequest(
    'GET',
    `${apiBaseUrl.replace(/\/$/, '')}/v1/api/admin/quests`,
    token,
    undefined,
    fetchFn,
  ) as Promise<AdminQuestRecord[]>;
}

const badgesAdmin = adminCrud<BadgeDefinition>("badges");
export const { create: createAdminBadge, get: getAdminBadge, update: updateAdminBadge, remove: deleteAdminBadge } = badgesAdmin;

const charactersAdmin = adminCrud<Character>("characters");
export const { create: createAdminCharacter, get: getAdminCharacter, update: updateAdminCharacter, remove: deleteAdminCharacter } = charactersAdmin;

/** Public Badge definition catalog, `GET /v1/api/badges` — the only listing endpoint for badge definitions. */
export async function getBadgeDefinitions(apiBaseUrl: string, fetchFn: typeof fetch = fetch): Promise<BadgeDefinition[]> {
  const endpoint = `${apiBaseUrl.replace(/\/$/, "")}/v1/api/badges`;
  return fetchPublicJson<BadgeDefinition[]>(endpoint, "Badge catalog", fetchFn);
}

/* ── Admin contributor review ───────────────────────────────────── */

const reviewEndpoint = (apiBaseUrl: string, path = "") => `${apiBaseUrl.replace(/\/$/, "")}/v1/api/admin/contributor-drafts${path}`;

export type ReviewQueueItem = ContributorReview;
export type ReviewDecisionInput = { decision: "approved" | "rejected" | "revision-needed"; reason: string };
export type ReviewDecisionRecord = {
  id: number;
  draftId: number;
  revision: number;
  title: string;
  decision: "approved" | "rejected" | "revision-needed" | "unpublished";
  lessonContent: ContributorReview["lessonContent"];
  reviewerId: string | null;
  reason: string;
  reviewedAt: string;
  publishedStageId: number | null;
};

/** Submitted revisions awaiting moderation, `GET /v1/api/admin/contributor-drafts/queue`. */
export async function getReviewQueue(apiBaseUrl: string, token: string, fetchFn: typeof fetch = fetch): Promise<ReviewQueueItem[]> {
  return adminRequest("GET", reviewEndpoint(apiBaseUrl, "/queue"), token, undefined, fetchFn) as Promise<ReviewQueueItem[]>;
}

/** A draft's immutable moderation history, `GET /v1/api/admin/contributor-drafts/:draftId/reviews`. */
export async function getReviewHistory(apiBaseUrl: string, token: string, id: number, fetchFn: typeof fetch = fetch): Promise<ReviewDecisionRecord[]> {
  return adminRequest("GET", reviewEndpoint(apiBaseUrl, `/${id}/reviews`), token, undefined, fetchFn) as Promise<ReviewDecisionRecord[]>;
}

/** Approve / reject / request revision with a note, `POST /v1/api/admin/contributor-drafts/:draftId/review`. */
export async function reviewRevision(apiBaseUrl: string, token: string, id: number, input: ReviewDecisionInput, fetchFn: typeof fetch = fetch): Promise<ReviewDecisionRecord> {
  return adminRequest("POST", reviewEndpoint(apiBaseUrl, `/${id}/review`), token, input, fetchFn) as Promise<ReviewDecisionRecord>;
}

/** Unpublish a published Lesson (reason required), `POST /v1/api/admin/contributor-drafts/:draftId/unpublish`. */
export async function unpublishRevision(apiBaseUrl: string, token: string, id: number, reason: string, fetchFn: typeof fetch = fetch): Promise<ReviewDecisionRecord> {
  return adminRequest("POST", reviewEndpoint(apiBaseUrl, `/${id}/unpublish`), token, { reason }, fetchFn) as Promise<ReviewDecisionRecord>;
}
