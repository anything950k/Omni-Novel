import { Buffer } from 'buffer';

export interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string | FormData;
  timeout?: number;
  cookie?: string;
}

const DEFAULT_USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36',
];

export async function smartFetch(url: string, options: RequestOptions = {}): Promise<Response> {
  const timeoutMs = options.timeout || 15000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const defaultHeaders: Record<string, string> = {
    'User-Agent': DEFAULT_USER_AGENTS[0],
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Sec-Fetch-Dest': 'document',
    'Upgrade-Insecure-Requests': '1',
  };

  if (options.cookie) {
    defaultHeaders['Cookie'] = options.cookie;
  }

  const mergedHeaders = {
    ...defaultHeaders,
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers: mergedHeaders,
      body: options.body,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout (${timeoutMs}ms) connecting to ${url}`);
    }
    throw error;
  }
}

export async function fetchText(url: string, options: RequestOptions = {}): Promise<string> {
  const res = await smartFetch(url, options);
  
  if (res.status === 403 || res.status === 503) {
    const preview = await res.text();
    if (preview.includes('challenge-platform') || preview.includes('cf-browser-verification') || preview.includes('Just a moment')) {
      throw new Error(`Cloudflare protection detected (HTTP ${res.status}) on ${url}. Needs cookie or FlareSolverr.`);
    }
    throw new Error(`HTTP ${res.status} Forbidden while accessing ${url}`);
  }

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText} from ${url}`);
  }

  return await res.text();
}

export async function fetchJson<T = any>(url: string, options: RequestOptions = {}): Promise<T> {
  const mergedHeaders = {
    'Accept': 'application/json',
    ...(options.headers || {}),
  };

  const res = await smartFetch(url, { ...options, headers: mergedHeaders });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText} from ${url}`);
  }
  return (await res.json()) as T;
}
