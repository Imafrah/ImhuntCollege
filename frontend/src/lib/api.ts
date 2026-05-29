const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

type ErrorResponse = {
  error?: string;
  message?: string;
  errors?: Record<string, string>;
};

async function getErrorMessage(response: Response): Promise<string> {
  const fallback = `Request failed with status ${response.status}`;

  try {
    const body = (await response.json()) as ErrorResponse;

    if (body.error) {
      return body.error;
    }

    if (body.message) {
      return body.message;
    }

    if (body.errors) {
      return Object.values(body.errors).join(", ");
    }

    return fallback;
  } catch {
    return fallback;
  }
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }

  const url = new URL(path, API_BASE_URL);
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json() as Promise<T>;
}
