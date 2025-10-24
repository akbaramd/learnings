// src/services/server/http.ts (Server-only)
import axios, { AxiosInstance } from 'axios';
import http from 'node:http';
import https from 'node:https';

export function createServerHttp(baseURL: string): AxiosInstance {
  return axios.create({
    baseURL,
    // ما کوکی‌ها را دستی پاس می‌دهیم، نه cookie-jar
    withCredentials: true,
    timeout: 20000,
    httpAgent: new http.Agent({ keepAlive: true, maxSockets: 50 }),
    httpsAgent: new https.Agent({ keepAlive: true, maxSockets: 50 }),
    validateStatus: () => true, // کنترل خطا در BFF
  });
}
