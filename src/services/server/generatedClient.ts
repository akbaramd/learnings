// src/services/server/generatedClient.ts (Server-only)
import { NextRequest } from 'next/server';
import { AxiosInstance } from 'axios';
import { Api } from '@/src/services/Api'; // مسیر Api.ts تولیدشده
import { createServerHttp } from './http';

const UPSTREAM = process.env.UPSTREAM_API_BASE_URL 
  ?? 'https://auth.wa-nezam.org'; // یا gateway شما

export function createApiForRequest(req: NextRequest) {
  const http = createServerHttp(UPSTREAM);

  // پاس‌دادن هدرهای هویتی درخواست کلاینت به بک‌اند
  http.interceptors.request.use((config) => {
    const cookie = req.headers.get('cookie');
    const auth   = req.headers.get('authorization');

    config.headers = config.headers ?? {};
    if (cookie) config.headers['cookie'] = cookie;         // refresh cookie
    if (auth)   config.headers['authorization'] = auth;     // در صورت داشتن bearer از کلاینت

    // Forward tracing headers if any
    const traceHeaders = ['x-request-id','x-correlation-id','x-forwarded-for','x-real-ip'];
    traceHeaders.forEach(h => {
      const v = req.headers.get(h);
      if (v) config.headers![h] = v;
    });

    return config;
  });

  const api = new Api({});
  (api as unknown as { instance: AxiosInstance }).instance = http;
  return api;
}
