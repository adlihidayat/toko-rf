// lib/utils/auth.ts

export function getUserIdFromCookies(): string | null {
  if (typeof document === 'undefined') return null;

  const cookies = document.cookie.split(';');
  const userIdCookie = cookies.find((cookie) =>
    cookie.trim().startsWith('user-id=')
  );

  if (!userIdCookie) return null;

  return userIdCookie.split('=')[1];
}

export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const userId = getUserIdFromCookies();

  if (!userId) {
    throw new Error('User not authenticated - user-id cookie not found');
  }

  const headers = {
    'Content-Type': 'application/json',
    'x-user-id': userId,
    ...(options.headers || {}),
  };

  return fetch(url, {
    ...options,
    headers,
  });
}