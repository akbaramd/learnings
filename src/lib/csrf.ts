import { NextRequest, NextResponse } from 'next/server';
import { randomBytes, createHmac } from 'crypto';

const CSRF_COOKIE = '_csrf';
const CSRF_HEADER = 'x-csrf-token';

function base64url(input: Buffer): string {
  return input.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function sign(value: string, secret: string): string {
  const mac = createHmac('sha256', secret).update(value).digest();
  return base64url(mac);
}

function pack(value: string, secret: string): string {
  const sig = sign(value, secret);
  return `${value}.${sig}`;
}

function unpackAndVerify(packed: string, secret: string): string | null {
  const idx = packed.lastIndexOf('.');
  if (idx < 0) return null;
  const value = packed.slice(0, idx);
  const sig = packed.slice(idx + 1);
  const expected = sign(value, secret);
  if (sig !== expected) return null;
  return value;
}

export function ensureCsrfCookie(req: NextRequest, res: NextResponse): void {
  const secret = process.env.CSRF_SECRET;
  if (!secret) return;

  const existing = req.cookies.get(CSRF_COOKIE)?.value;
  if (existing && unpackAndVerify(existing, secret)) return;

  const raw = base64url(randomBytes(32));
  const packed = pack(raw, secret);

  res.cookies.set(CSRF_COOKIE, packed, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24, // 1d
  });
}

export function getIncomingCsrfToken(req: NextRequest): string | null {
  const fromHeader = req.headers.get(CSRF_HEADER);
  if (fromHeader) return fromHeader;
  return null;
}

export function verifyCsrfFromRequest(req: NextRequest, bodyToken?: string | null): boolean {
  const secret = process.env.CSRF_SECRET;
  if (!secret) return true; // اگر تنظیم نشده، عبور (ولی برای Production باید ست شود)

  const cookiePacked = req.cookies.get(CSRF_COOKIE)?.value;
  if (!cookiePacked) return false;

  const cookieRaw = unpackAndVerify(cookiePacked, secret);
  if (!cookieRaw) return false;

  const incoming = getIncomingCsrfToken(req) || bodyToken || '';
  if (!incoming) return false;

  // incoming باید بدون امضا باشد و با raw برابر شود
  const [valFromIncoming] = incoming.split('.', 1); // در کلاینت فقط raw ارسال کنید
  return valFromIncoming === cookieRaw;
}

