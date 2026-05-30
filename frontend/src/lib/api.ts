const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "https://imhuntcollege.onrender.com";

type ErrorResponse = {
  error?: string;
  message?: string;
  errors?: Record<string, string>;
  details?: {
    fieldErrors?: Record<string, string[]>;
    formErrors?: string[];
  };
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

    if (body.details?.fieldErrors) {
      return Object.values(body.details.fieldErrors).flat().join(", ");
    }

    if (body.details?.formErrors?.length) {
      return body.details.formErrors.join(", ");
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
  const url = new URL(path, API_BASE_URL);
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 30_000);

  const response = await fetch(url, {
    ...options,
    signal: options?.signal ?? controller.signal,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  }).finally(() => window.clearTimeout(timeout));

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json() as Promise<T>;
}
