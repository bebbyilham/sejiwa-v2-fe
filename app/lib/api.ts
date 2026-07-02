export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

export function getApiKey(): string {
  if (typeof window !== "undefined") {
    return localStorage.getItem("sejiwa_api_key") || "simrsj_api_secret_key_12345";
  }
  return "simrsj_api_secret_key_12345";
}

export function getJwtToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("sejiwa_jwt_token");
  }
  return null;
}

export function getUser(): { username: string; name: string; role: string } | null {
  if (typeof window !== "undefined") {
    const user = localStorage.getItem("sejiwa_user");
    return user ? JSON.parse(user) : null;
  }
  return null;
}

export function setSession(token: string, user: { username: string; name: string; role: string }) {
  if (typeof window !== "undefined") {
    localStorage.setItem("sejiwa_jwt_token", token);
    localStorage.setItem("sejiwa_user", JSON.stringify(user));
  }
}

export function clearSession() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("sejiwa_jwt_token");
    localStorage.removeItem("sejiwa_user");
  }
}

export async function loginGateway(username: string, password: string) {
  const gatewayUrl = API_BASE_URL.replace(/\/api\/v1$/, "");
  const response = await fetch(`${gatewayUrl}/users/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ username, password })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Login error: ${response.status}`);
  }

  return response.json();
}

export async function registerGateway(userData: { name: string; username: string; password?: string; role: string }) {
  const token = getJwtToken();
  const gatewayUrl = API_BASE_URL.replace(/\/api\/v1$/, "");
  const response = await fetch(`${gatewayUrl}/users/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    },
    body: JSON.stringify(userData)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Registration error: ${response.status}`);
  }

  return response.json();
}

export async function updateProfileGateway(updateData: { name?: string; currentPassword?: string; newPassword?: string }) {
  const token = getJwtToken();
  const gatewayUrl = API_BASE_URL.replace(/\/api\/v1$/, "");
  const response = await fetch(`${gatewayUrl}/users/update`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    },
    body: JSON.stringify(updateData)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Update error: ${response.status}`);
  }

  return response.json();
}

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const apiKey = getApiKey();
  const token = getJwtToken();
  
  const headers = {
    "Content-Type": "application/json",
    "X-API-KEY": apiKey,
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  } as Record<string, string>;

  const response = await fetch(`${API_BASE_URL}/${endpoint.replace(/^\//, "")}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API error: ${response.status}`);
  }

  return response.json();
}
