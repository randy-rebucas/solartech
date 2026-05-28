/** Base URL for server-side calls to the Nest API (Server Actions, RSC). */
export function getServerApiUrl(): string {
  return (
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    'http://127.0.0.1:4000'
  );
}

export function apiUnreachableMessage(): string {
  return (
    'Cannot reach the SolarTech API. From the repo root, run `npm run dev` (API on port 4000) ' +
    'and ensure Docker services are up: `docker compose -f docker-compose.dev.yml up -d`.'
  );
}
