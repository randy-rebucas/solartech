import { proxyAuthPost } from '@/lib/auth/proxy-auth';

export async function POST(req: Request) {
  const body = await req.json();
  return proxyAuthPost('/api/v1/auth/login', body, {
    setCookies: (result) => !result.requiresMfa,
  });
}
