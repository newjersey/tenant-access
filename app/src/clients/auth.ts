export type AuthSession = { signedIn: false } | { signedIn: true; email: string };

// Unset locally, so these are same-origin and Vite proxies /auth/* to the auth dev server
export const authUrl = (path: string) => `${import.meta.env.VITE_AUTH_BASE_URL ?? ""}${path}`;

export async function getSession(signal?: AbortSignal): Promise<AuthSession> {
  const response = await fetch(authUrl("/auth/session"), { credentials: "include", signal });
  if (!response.ok) {
    throw new Error(`Session request failed with status ${response.status}`);
  }

  return response.json();
}
