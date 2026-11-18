export type AuthSession = { signedIn: false } | { signedIn: true; email: string | null };

// Same-origin: locally, Vite proxies /auth/* to the auth dev server
export async function getSession(signal?: AbortSignal): Promise<AuthSession> {
  const response = await fetch("/auth/session", { signal });
  if (!response.ok) {
    throw new Error(`Session request failed with status ${response.status}`);
  }

  return response.json();
}
