export class DatabaseConfigurationError extends Error {
  constructor() {
    super('Supabase database credentials are not configured.');
    this.name = 'DatabaseConfigurationError';
  }
}

export class DatabaseRequestError extends Error {
  constructor(status: number) {
    super(`Supabase database request failed with status ${status}.`);
    this.name = 'DatabaseRequestError';
  }
}

export function isDatabaseConfigured() {
  return Boolean(
    process.env.SUPABASE_URL
    && (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY),
  );
}

export function databaseErrorResponse(error: unknown) {
  console.error(
    'Database request failed.',
    error instanceof Error ? error.message : 'Unknown database error.',
  );

  const isConfigurationError = error instanceof DatabaseConfigurationError;
  return {
    status: isConfigurationError ? 503 : 500,
    message: isConfigurationError
      ? 'The database is not configured yet. Please try again later or contact us directly.'
      : 'We could not save or load this information. Please try again or contact us.',
  };
}

export async function databaseRequest<T>(
  table: string,
  query: URLSearchParams,
  options: RequestInit = {},
): Promise<T> {
  const projectUrl = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!projectUrl || !secretKey) throw new DatabaseConfigurationError();

  const baseUrl = projectUrl.replace(/\/+$/, '');
  const search = query.toString();
  const url = `${baseUrl}/rest/v1/${table}${search ? `?${search}` : ''}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      cache: 'no-store',
      headers: {
        apikey: secretKey,
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  } catch {
    throw new DatabaseRequestError(503);
  }

  if (!response.ok) throw new DatabaseRequestError(response.status);

  try {
    return await response.json() as T;
  } catch {
    throw new DatabaseRequestError(response.status);
  }
}
