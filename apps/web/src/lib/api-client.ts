export interface CharacterOption {
  id: number;
  name: string;
  slug: string;
  description: string;
  avatarIcon: string;
}

export interface UpdatedUserResponse {
  id: string;
  email: string;
  name: string | null;
  characterId: number | null;
  totalXp: number;
}

export const DEFAULT_CHARACTERS: readonly CharacterOption[] = [
  {
    id: 1,
    name: "Binary Knight",
    slug: "binary-knight",
    description: "Resilient defender of algorithms and clean code.",
    avatarIcon: "🛡️",
  },
  {
    id: 2,
    name: "Code Wizard",
    slug: "code-wizard",
    description: "Master of abstractions, functional spells, and recursion.",
    avatarIcon: "🧙",
  },
  {
    id: 3,
    name: "Cyber Rogue",
    slug: "cyber-rogue",
    description: "Stealthy bug hunter and security operative.",
    avatarIcon: "🗡️",
  },
  {
    id: 4,
    name: "DevOps Alchemist",
    slug: "devops-alchemist",
    description: "Transmuter of code into scalable cloud infrastructure.",
    avatarIcon: "⚡",
  },
  {
    id: 5,
    name: "Script Samurai",
    slug: "script-samurai",
    description: "Swift executor of clean syntax and precision tests.",
    avatarIcon: "⚔️",
  },
];

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
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
    const errorBody = await response.json().catch(() => ({}));
    const message =
      typeof errorBody === "object" && errorBody && "message" in errorBody
        ? String(errorBody.message)
        : `Request failed with status ${response.status}`;
    throw new ApiError(response.status, message);
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
    const errorBody = await response.json().catch(() => ({}));
    const message =
      typeof errorBody === "object" && errorBody && "message" in errorBody
        ? String(errorBody.message)
        : `Request failed with status ${response.status}`;
    throw new ApiError(response.status, message);
  }

  return (await response.json()) as UpdatedUserResponse;
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
    const errorBody = await response.json().catch(() => ({}));
    const message =
      typeof errorBody === "object" && errorBody && "message" in errorBody
        ? String(errorBody.message)
        : `Request failed with status ${response.status}`;
    throw new ApiError(response.status, message);
  }

  return (await response.json()) as UpdatedUserResponse;
}
