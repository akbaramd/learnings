// src/services/http.ts
import axios, { AxiosInstance } from 'axios';

export const http: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000',
  withCredentials: true,
  timeout: 20000,
});

// Bearer injection (wire this to your token store)
let accessToken: string | null = null;
export function setAccessToken(token: string | null) {
  accessToken = token;
}

http.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});
