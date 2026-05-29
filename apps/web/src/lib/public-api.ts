import axios from 'axios';

/** Unauthenticated client for public marketing analytics endpoints. */
export const publicApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:4000',
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});
