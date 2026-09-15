import type {
  Character,
  DailyEventResponse,
  ProfileResponse,
  Region,
  Stage,
  Zone,
} from "@repo/contracts";

export type CharacterOption = Character;
export type Profile = ProfileResponse;
export type DailyEvent = DailyEventResponse;
export type { Region, Zone, Stage };

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

export async function getCharacters(
  apiBaseUrl: string,
  fetchFn: typeof fetch = fetch,
): Promise<CharacterOption[]> {
  const endpoint = `${apiBaseUrl.replace(/\/$/, "")}/v1/api/characters`;
  const response = await fetchFn(endpoint);

  if (!response.ok) {
    throw new ApiError(
      response.status,
      `Failed to load character catalog (status ${response.status})`,
    );
  }

  return (await response.json()) as CharacterOption[];
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
  if (!token) {
    throw new ApiError(401, "Authentication token is required");
  }

  const endpoint = `${apiBaseUrl.replace(/\/$/, "")}/v1/api/users/profile`;
  const response = await fetchFn(endpoint, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    await throwOnError(response);
  }

  return (await response.json()) as Profile;
}

export async function getTodayEvent(
  apiBaseUrl: string,
  fetchFn: typeof fetch = fetch,
): Promise<DailyEvent> {
  const endpoint = `${apiBaseUrl.replace(/\/$/, "")}/v1/api/events/today`;
  const response = await fetchFn(endpoint);

  if (!response.ok) {
    throw new ApiError(
      response.status,
      `Failed to load today's event (status ${response.status})`,
    );
  }

  return (await response.json()) as DailyEvent;
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
  const response = await fetchFn(endpoint);

  if (!response.ok) {
    throw new ApiError(
      response.status,
      `Failed to load Regions (status ${response.status})`,
    );
  }

  return (await response.json()) as Region[];
}

export async function getZones(
  apiBaseUrl: string,
  regionId: number,
  fetchFn: typeof fetch = fetch,
): Promise<Zone[]> {
  const endpoint = `${apiBaseUrl.replace(/\/$/, "")}/v1/api/regions/${regionId}/zones`;
  const response = await fetchFn(endpoint);

  if (!response.ok) {
    throw new ApiError(
      response.status,
      `Failed to load Zones (status ${response.status})`,
    );
  }

  return (await response.json()) as Zone[];
}

export async function getStages(
  apiBaseUrl: string,
  token: string,
  zoneId: number,
  fetchFn: typeof fetch = fetch,
): Promise<Stage[]> {
  if (!token) {
    throw new ApiError(401, "Authentication token is required");
  }

  const endpoint = `${apiBaseUrl.replace(/\/$/, "")}/v1/api/zones/${zoneId}/stages`;
  const response = await fetchFn(endpoint, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    await throwOnError(response);
  }

  return (await response.json()) as Stage[];
}
