/**
 * Request Information Utility
 * Extracts client information from NextRequest for server-side API routes
 */

import { NextRequest } from 'next/server';
import * as dns from 'dns';
import { promisify } from 'util';

// Promisify DNS reverse lookup for async/await usage
// Used to validate IP addresses by attempting reverse DNS lookup
const dnsReverse = promisify(dns.reverse);

/**
 * Extract client IP address from NextRequest
 * Handles various proxy headers (x-forwarded-for, x-real-ip, etc.)
 * Returns the first valid IP found, or null if none found
 */
export function getClientIp(req: NextRequest): string | null {
  // Try various headers in order of preference
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    const ips = forwardedFor.split(',').map(ip => ip.trim());
    const firstIp = ips[0];
    if (firstIp && isValidIpAddressSync(firstIp)) {
      return firstIp;
    }
  }

  const realIp = req.headers.get('x-real-ip');
  if (realIp && isValidIpAddressSync(realIp)) {
    return realIp;
  }

  // Fallback to cf-connecting-ip (Cloudflare)
  const cfIp = req.headers.get('cf-connecting-ip');
  if (cfIp && isValidIpAddressSync(cfIp)) {
    return cfIp;
  }

  // Fallback to remote address (if available)
  const remoteAddr = req.headers.get('remote-addr');
  if (remoteAddr && isValidIpAddressSync(remoteAddr)) {
    return remoteAddr;
  }

  return null;
}

/**
 * Validate IP address using DNS reverse lookup
 * Uses Node.js dns module to verify IP is valid by attempting reverse DNS
 * This is more reliable than regex but slower
 */
export async function validateIpWithDns(ip: string): Promise<boolean> {
  if (!ip || typeof ip !== 'string') return false;
  
  // First do basic format check (fast)
  if (!isValidIpAddressSync(ip)) {
    return false;
  }
  
  // Remove IPv6 prefix if present
  const cleanIp = ip.replace(/^::ffff:/i, '').trim();
  
  try {
    // Use DNS reverse lookup to validate IP
    // If reverse lookup succeeds or fails with ENOTFOUND (IP exists but no PTR record),
    // the IP is valid. If it fails with other errors, IP might be invalid.
    await dnsReverse(cleanIp);
    // Reverse lookup succeeded - IP is valid
    return true;
  } catch (error: unknown) {
    // Check error code
    const err = error as NodeJS.ErrnoException;
    
    // ENOTFOUND means IP exists but has no PTR record (still valid)
    // EINVAL means invalid IP format (invalid)
    // Other errors might be network issues, but we'll assume IP is valid if format is correct
    if (err.code === 'ENOTFOUND' || err.code === 'EINVAL') {
      // EINVAL = invalid IP format
      if (err.code === 'EINVAL') {
        return false;
      }
      // ENOTFOUND = IP exists but no reverse DNS record (valid IP)
      return true;
    }
    
    // For other errors (network issues, etc.), trust format validation
    // This prevents DNS failures from blocking valid IPs
    return isValidIpAddressSync(ip);
  }
}


/**
 * Synchronous IP validation (for quick checks)
 * Uses regex only, no DNS lookup
 */
function isValidIpAddressSync(ip: string): boolean {
  if (!ip || typeof ip !== 'string') return false;
  
  const cleanIp = ip.replace(/^::ffff:/i, '').trim();
  
  // IPv4 validation
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Regex.test(cleanIp)) {
    const parts = cleanIp.split('.');
    return parts.every(part => {
      const num = parseInt(part, 10);
      return num >= 0 && num <= 255;
    });
  }
  
  // IPv6 validation (simplified)
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$|^::1$|^::$/;
  if (ipv6Regex.test(ip) || ip.includes('::')) {
    return true;
  }
  
  return false;
}

/**
 * Get client IP address using external service as fallback
 * This is useful when headers don't provide the IP (e.g., localhost development)
 */
export async function getClientIpWithFallback(req: NextRequest): Promise<string | null> {
  // First, try to get IP from request headers (fastest, most reliable)
  const headerIp = getClientIp(req);
  if (headerIp && !isLocalhostIp(headerIp)) {
    return headerIp;
  }

  // If header IP is localhost or null, try external service
  // This is useful in development or when behind certain proxies
  try {
    const externalIp = await fetchExternalIp();
    if (externalIp) {
      return externalIp;
    }
  } catch (error) {
    console.warn('[RequestInfo] Failed to fetch external IP:', error);
  }

  // Return header IP even if localhost (better than null)
  return headerIp;
}

/**
 * Check if IP address is localhost/private
 */
function isLocalhostIp(ip: string): boolean {
  if (!ip) return true;
  
  const cleanIp = ip.replace(/^::ffff:/i, '').trim();
  
  // Check for localhost variants
  return (
    cleanIp === '127.0.0.1' ||
    cleanIp === 'localhost' ||
    cleanIp === '::1' ||
    cleanIp.startsWith('192.168.') ||
    cleanIp.startsWith('10.') ||
    cleanIp.startsWith('172.16.') ||
    cleanIp.startsWith('172.17.') ||
    cleanIp.startsWith('172.18.') ||
    cleanIp.startsWith('172.19.') ||
    cleanIp.startsWith('172.20.') ||
    cleanIp.startsWith('172.21.') ||
    cleanIp.startsWith('172.22.') ||
    cleanIp.startsWith('172.23.') ||
    cleanIp.startsWith('172.24.') ||
    cleanIp.startsWith('172.25.') ||
    cleanIp.startsWith('172.26.') ||
    cleanIp.startsWith('172.27.') ||
    cleanIp.startsWith('172.28.') ||
    cleanIp.startsWith('172.29.') ||
    cleanIp.startsWith('172.30.') ||
    cleanIp.startsWith('172.31.')
  );
}

/**
 * Fetch client's public IP address from external service
 * Uses free IP detection services as fallback
 * Optionally validates IP using DNS reverse lookup
 */
async function fetchExternalIp(validateWithDns = false): Promise<string | null> {
  // List of free IP detection services (in order of preference)
  const ipServices = [
    'https://api.ipify.org?format=json', // Simple, fast, reliable
    'https://api64.ipify.org?format=json', // IPv6 support
    'https://ipapi.co/ip/', // Returns plain text IP
    'https://icanhazip.com', // Returns plain text IP
  ];

  for (const serviceUrl of ipServices) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

      const response = await fetch(serviceUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json, text/plain, */*',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) continue;

      let ip: string | null = null;

      // Handle JSON response (ipify)
      if (serviceUrl.includes('ipify')) {
        const data = await response.json() as { ip?: string };
        ip = data.ip || null;
      } 
      // Handle plain text response (ipapi.co, icanhazip.com)
      else {
        const text = await response.text();
        ip = text.trim() || null;
      }

      if (ip && isValidIpAddressSync(ip) && !isLocalhostIp(ip)) {
        // Optional: Validate with DNS reverse lookup for extra security
        if (validateWithDns) {
          const isValid = await validateIpWithDns(ip);
          if (!isValid) {
            console.warn('[RequestInfo] IP failed DNS validation:', ip);
            continue; // Try next service
          }
        }
        
        return ip;
      }
    } catch {
      // Try next service if this one fails
      continue;
    }
  }

  return null;
}

/**
 * Get user agent from NextRequest
 */
export function getRequestUserAgent(req: NextRequest): string | null {
  return req.headers.get('user-agent');
}

/**
 * Resolve hostname to IP address using DNS lookup
 * Useful for validating or resolving domain names
 * 
 * @param hostname - Domain name to resolve (e.g., 'example.com')
 * @returns Promise resolving to IP address or null if resolution fails
 */
export async function resolveHostname(hostname: string): Promise<string | null> {
  if (!hostname || typeof hostname !== 'string') {
    return null;
  }

  try {
    const dnsLookup = promisify(dns.lookup);
    const result = await dnsLookup(hostname, { family: 4 }); // Prefer IPv4
    return result.address || null;
  } catch (error) {
    console.warn('[RequestInfo] Failed to resolve hostname:', hostname, error);
    return null;
  }
}

/**
 * Get reverse DNS (PTR record) for an IP address
 * Returns hostname(s) associated with the IP
 * 
 * @param ip - IP address to lookup
 * @returns Promise resolving to array of hostnames or empty array
 */
export async function getReverseDns(ip: string): Promise<string[]> {
  if (!ip || typeof ip !== 'string') {
    return [];
  }

  try {
    const cleanIp = ip.replace(/^::ffff:/i, '').trim();
    const hostnames = await dnsReverse(cleanIp);
    return Array.isArray(hostnames) ? hostnames : [];
  } catch (error) {
    // ENOTFOUND is normal - many IPs don't have reverse DNS
    const err = error as NodeJS.ErrnoException;
    if (err.code !== 'ENOTFOUND') {
      console.warn('[RequestInfo] Reverse DNS lookup failed:', ip, err.code);
    }
    return [];
  }
}

/**
 * Get complete request information
 * Priority: Request body > Request headers
 * 
 * Returns deviceId, userAgent, and ipAddress
 * - deviceId: From request body first, then null (must be sent from client)
 * - userAgent: From request body first, then request headers
 * - ipAddress: From request body first, then request headers
 */
export function getRequestInfo(req: NextRequest, body?: Record<string, unknown>): {
  deviceId: string | null;
  userAgent: string | null;
  ipAddress: string | null;
} {
  // Priority: body > headers
  // Device ID must come from body (client sends it)
  const deviceId = (body?.deviceId as string | null | undefined) || null;
  
  // User Agent: body first, then headers
  const userAgent = (body?.userAgent as string | null | undefined) || getRequestUserAgent(req);
  
  // IP Address: body first, then headers
  const ipAddress = (body?.ipAddress as string | null | undefined) || getClientIp(req);
  
  return {
    deviceId,
    userAgent,
    ipAddress,
  };
}

