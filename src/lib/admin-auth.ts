export type AdminUser = {
  id?: string;
  userId?: string;
  sub?: string;
  email: string;
  role?: string;
  name?: string;
};

type LoginResponse = {
  accessToken?: string;
  token?: string;
  data?: {
    accessToken?: string;
    token?: string;
    user?: AdminUser;
  };
  user?: AdminUser;
  message?: string;
};

type AuthMeResponse = {
  message?: string;
  user?: AdminUser;
  data?: {
    user?: AdminUser;
  };
};

type RegisterPayload = {
  email: string;
  password: string;
  name: string;
  countryCode: string;
  phoneNumber: string;
  emailType: "PERSONAL" | "WORK";
  userSubType: "CUSTOMER" | "ADMIN";
};

function getApiRootUrl() {
  const rawUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL || "/api/proxy";

  let cleanUrl = rawUrl.trim().replace(/\/$/, "");

  if (cleanUrl.endsWith("/admin/catalog")) {
    cleanUrl = cleanUrl.replace(/\/admin\/catalog$/, "");
  }

  if (cleanUrl.startsWith("http://") || cleanUrl.startsWith("https://")) {
    return cleanUrl;
  }

  if (typeof window !== "undefined") {
    const normalizedPath = cleanUrl.startsWith("/")
      ? cleanUrl
      : `/${cleanUrl}`;

    return `${window.location.origin}${normalizedPath}`.replace(/\/$/, "");
  }

  return cleanUrl;
}

function findTokenDeep(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;

  const tokenKeys = [
    "accessToken",
    "access_token",
    "token",
    "jwt",
    "jwtToken",
    "authToken",
    "bearerToken",
  ];

  for (const key of tokenKeys) {
    const tokenValue = record[key];

    if (typeof tokenValue === "string" && tokenValue.trim().length > 20) {
      return tokenValue.replace(/^Bearer\s+/i, "").trim();
    }
  }

  for (const nestedValue of Object.values(record)) {
    if (nestedValue && typeof nestedValue === "object") {
      const nestedToken = findTokenDeep(nestedValue);
      if (nestedToken) return nestedToken;
    }
  }

  return null;
}

function getTokenFromResponse(response: LoginResponse) {
  return findTokenDeep(response);
}

export function getAdminToken() {
  if (typeof window === "undefined") return null;

  const token =
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("access_token");

  return token?.replace(/^Bearer\s+/i, "").trim() || null;
}

export function saveAdminAuth(token: string, user?: AdminUser) {
  localStorage.setItem("accessToken", token);
  localStorage.setItem("token", token);

  if (user) {
    localStorage.setItem("adminUser", JSON.stringify(user));
  }
}

export function clearAdminAuth() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("token");
  localStorage.removeItem("authToken");
  localStorage.removeItem("access_token");
  localStorage.removeItem("adminUser");
}

export async function adminLogin(payload: {
  email: string;
  password: string;
}) {
  const response = await fetch(`${getApiRootUrl()}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();

  let data: LoginResponse;

  try {
    data = JSON.parse(text) as LoginResponse;
  } catch {
    throw new Error(`Login API JSON response nahi de rahi. Body: ${text}`);
  }

  console.log("ADMIN_LOGIN_RESPONSE:", data);

  if (!response.ok) {
    throw new Error(data.message || "Login failed.");
  }

  const token = getTokenFromResponse(data);

  if (!token) {
    throw new Error(
      "Login response me token nahi mila. Console me ADMIN_LOGIN_RESPONSE expand karke token key check karo."
    );
  }

  const user =
    data.user ||
    data.data?.user ||
    ((data as Record<string, unknown>).profile as AdminUser | undefined);

  saveAdminAuth(token, user);

  return {
    token,
    user,
  };
}

export async function adminRegister(payload: RegisterPayload) {
  const response = await fetch(`${getApiRootUrl()}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "Signup failed.");
  }

  return data;
}

export async function getCurrentAdminUser() {
  const token = getAdminToken();

  if (!token) {
    throw new Error("Admin token missing hai.");
  }

  const response = await fetch(`${getApiRootUrl()}/auth/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = (await response.json()) as AuthMeResponse;

  if (!response.ok) {
    throw new Error(data.message || "Current user fetch failed.");
  }

  return data.user || data.data?.user || null;
}

export async function verifyAdminAccess() {
  const token = getAdminToken();

  if (!token) {
    throw new Error("Admin token missing hai.");
  }

  const response = await fetch(`${getApiRootUrl()}/auth/admin`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = (await response.json()) as AuthMeResponse;

  if (!response.ok) {
    throw new Error(data.message || "Admin access denied.");
  }

  return data.user || data.data?.user || null;
}