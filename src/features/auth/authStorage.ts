const KEY = "sosbike_admin_access_token_v1";

export function getAccessToken(): string | null {
  return localStorage.getItem(KEY);
}

export function setAccessToken(token: string) {
  localStorage.setItem(KEY, token);
}

export function clearAccessToken() {
  localStorage.removeItem(KEY);
}

