/**
 * IP Geolocation Service
 * Fetches client IP and geolocation data using free APIs
 */

// ==================== Types ====================

export interface GeoData {
  ip: string;
  city: string;
  region: string;
  country: string;
  countryCode: string;
  lat: number;
  lon: number;
  timezone: string;
  isp: string;
  asn?: string;
}

export interface IPLocationResponse {
  ip: string;
  city: string;
  region: string;
  country: string;
  country_code: string;
  latitude: number;
  longitude: number;
  timezone?: string;
  org?: string;
  asn?: string;
}

// ==================== Constants ====================

const CACHE_KEY = 'visitor_geolocation';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

// ==================== Helper Functions ====================

function isCacheValid(timestamp: number): boolean {
  return Date.now() - timestamp < CACHE_DURATION;
}

function getCachedLocation(): GeoData | null {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    if (!isCacheValid(timestamp)) return null;

    return data;
  } catch {
    return null;
  }
}

function setCachedLocation(data: GeoData): void {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
  } catch {
    // Ignore session storage errors
  }
}

function normalizeGeoData(data: IPLocationResponse): GeoData {
  return {
    ip: data.ip,
    city: data.city || 'Unknown',
    region: data.region || 'Unknown',
    country: data.country || 'Unknown',
    countryCode: data.country_code || '',
    lat: data.latitude || 0,
    lon: data.longitude || 0,
    timezone: data.timezone || 'UTC',
    isp: data.org || data.asn || 'Unknown',
    asn: data.asn,
  };
}

// ==================== IP Detection ====================

/**
 * Fetch client IP address using multiple free API fallbacks
 */
async function fetchClientIP(): Promise<string> {
  const ipApis: Array<{ url: string; field: string }> = [
    { url: 'https://api.ipify.org?format=json', field: 'ip' },
    { url: 'https://ipapi.co/json/', field: 'ip' },
    { url: 'https://ifconfig.me/all.json', field: 'ip' },
  ];

  for (const api of ipApis) {
    try {
      const response = await fetch(api.url, {
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      if (!response.ok) continue;

      const data = await response.json();
      const ip = data[api.field];

      if (ip && typeof ip === 'string' && /^\d+\.\d+\.\d+\.\d+$/.test(ip)) {
        return ip;
      }
    } catch {}
  }

  // Fallback to local IP if all APIs fail
  return '127.0.0.1';
}

/**
 * Get client IP address with caching
 */
export async function getClientIP(): Promise<string> {
  const cached = getCachedLocation();
  if (cached?.ip) {
    return cached.ip;
  }

  return fetchClientIP();
}

// ==================== IP Geolocation ====================

/**
 * Geolocate IP using IP-API.com (45 req/min, rich data)
 */
async function geolocateWithIPAPI(ip: string): Promise<GeoData | null> {
  try {
    const response = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,city,lat,lon,timezone,isp,asn,query`,
      {
        signal: AbortSignal.timeout(5000),
      }
    );

    if (!response.ok) return null;

    const data = await response.json();

    if (data.status !== 'success') return null;

    return normalizeGeoData({
      ip: data.query,
      city: data.city,
      region: data.regionName,
      country: data.country,
      country_code: data.countryCode,
      latitude: data.lat,
      longitude: data.lon,
      timezone: data.timezone,
      org: data.isp,
      asn: data.asn,
    });
  } catch {
    return null;
  }
}

/**
 * Geolocate IP using ipapi.is (1000 requests/day)
 */
async function geolocateWithIpapiIs(ip: string): Promise<GeoData | null> {
  try {
    const response = await fetch(`https://ipapi.is/${ip}/json/`, {
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return null;

    const data = await response.json();

    return normalizeGeoData({
      ip: data.ip || ip,
      city: data.city,
      region: data.region,
      country: data.country,
      country_code: data.country_code,
      latitude: data.latitude,
      longitude: data.longitude,
      timezone: data.timezone,
      org: data.asn_org,
      asn: data.asn,
    });
  } catch {
    return null;
  }
}

/**
 * Geolocate IP using ipapi.co (1000/day free, no key)
 */
async function geolocateWithIpapiCo(ip: string): Promise<GeoData | null> {
  try {
    const response = await fetch(`https://ipapi.co/${ip}/json/`, {
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return null;

    const data = await response.json();

    if (data.error) return null;

    return normalizeGeoData({
      ip: data.ip || ip,
      city: data.city,
      region: data.region,
      country: data.country_name,
      country_code: data.country_code,
      latitude: data.latitude,
      longitude: data.longitude,
      timezone: data.timezone,
      org: data.org,
    });
  } catch {
    return null;
  }
}

/**
 * Geolocate an IP address with fallback chain
 */
export async function geolocateIP(ip: string): Promise<GeoData> {
  // Try each API in order
  const geolocationFunctions = [geolocateWithIPAPI, geolocateWithIpapiIs, geolocateWithIpapiCo];

  for (const geoFunc of geolocationFunctions) {
    const result = await geoFunc(ip);
    if (result) {
      return result;
    }
  }

  // Fallback to minimal data
  return {
    ip,
    city: 'Unknown',
    region: 'Unknown',
    country: 'Unknown',
    countryCode: '',
    lat: 0,
    lon: 0,
    timezone: 'UTC',
    isp: 'Unknown',
  };
}

// ==================== Visitor Location ====================

/**
 * Get complete visitor location (IP + geolocation) with caching
 */
export async function getVisitorLocation(): Promise<GeoData> {
  // Check cache first
  const cached = getCachedLocation();
  if (cached) {
    return cached;
  }

  // Fetch new location data
  const ip = await getClientIP();
  const location = await geolocateIP(ip);

  // Cache the result
  setCachedLocation(location);

  return location;
}

// ==================== Timezone Utilities ====================

/**
 * Get timezone from latitude/longitude using tz-lookup
 */
export async function getTimezoneFromCoords(lat: number, lon: number): Promise<string> {
  try {
    // Dynamic import to avoid SSR issues
    const tzlookup = (await import('tz-lookup')).default;
    return tzlookup(lat, lon);
  } catch {
    return 'UTC';
  }
}

/**
 * Format time for a given timezone
 */
export function formatTimeInTimezone(
  date: Date,
  timezone: string,
  format: 'full' | 'short' = 'short'
): string {
  try {
    if (format === 'full') {
      return new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        dateStyle: 'full',
        timeStyle: 'long',
      }).format(date);
    }
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  } catch {
    return date.toISOString();
  }
}

// ==================== Country Utilities ====================

/**
 * Get flag emoji for country code
 */
export function getCountryFlag(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '🌐';

  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));

  return String.fromCodePoint(...codePoints);
}

/**
 * Get continent from country code
 */
export function getContinent(countryCode: string): string {
  const continents: Record<string, string> = {
    // North America
    US: 'North America',
    CA: 'North America',
    MX: 'North America',
    GT: 'North America',
    CU: 'North America',
    HT: 'North America',
    DO: 'North America',
    HN: 'North America',
    JM: 'North America',
    CR: 'North America',
    PA: 'North America',
    NI: 'North America',
    SV: 'North America',
    // South America
    BR: 'South America',
    AR: 'South America',
    CO: 'South America',
    CL: 'South America',
    PE: 'South America',
    VE: 'South America',
    EC: 'South America',
    BO: 'South America',
    PY: 'South America',
    UY: 'South America',
    GY: 'South America',
    SR: 'South America',
    GF: 'South America',
    // Europe
    GB: 'Europe',
    DE: 'Europe',
    FR: 'Europe',
    IT: 'Europe',
    ES: 'Europe',
    PL: 'Europe',
    UA: 'Europe',
    RO: 'Europe',
    NL: 'Europe',
    BE: 'Europe',
    CZ: 'Europe',
    GR: 'Europe',
    PT: 'Europe',
    SE: 'Europe',
    HU: 'Europe',
    AT: 'Europe',
    CH: 'Europe',
    BG: 'Europe',
    DK: 'Europe',
    FI: 'Europe',
    SK: 'Europe',
    NO: 'Europe',
    IE: 'Europe',
    HR: 'Europe',
    RS: 'Europe',
    SI: 'Europe',
    LT: 'Europe',
    LV: 'Europe',
    EE: 'Europe',
    IS: 'Europe',
    MC: 'Europe',
    LU: 'Europe',
    MT: 'Europe',
    AD: 'Europe',
    // Asia
    CN: 'Asia',
    IN: 'Asia',
    ID: 'Asia',
    PK: 'Asia',
    BD: 'Asia',
    JP: 'Asia',
    PH: 'Asia',
    VN: 'Asia',
    TR: 'Asia',
    IR: 'Asia',
    TH: 'Asia',
    MM: 'Asia',
    KR: 'Asia',
    AE: 'Asia',
    SA: 'Asia',
    KZ: 'Asia',
    MY: 'Asia',
    AF: 'Asia',
    NP: 'Asia',
    LK: 'Asia',
    KW: 'Asia',
    SG: 'Asia',
    IL: 'Asia',
    HK: 'Asia',
    TW: 'Asia',
    // Africa
    NG: 'Africa',
    ET: 'Africa',
    EG: 'Africa',
    CD: 'Africa',
    ZA: 'Africa',
    TZ: 'Africa',
    KE: 'Africa',
    MA: 'Africa',
    DZ: 'Africa',
    MO: 'Africa',
    SN: 'Africa',
    ZW: 'Africa',
    ML: 'Africa',
    UG: 'Africa',
    AO: 'Africa',
    GH: 'Africa',
    MZ: 'Africa',
    CM: 'Africa',
    CI: 'Africa',
    LY: 'Africa',
    SD: 'Africa',
    TN: 'Africa',
    // Oceania
    AU: 'Oceania',
    NZ: 'Oceania',
    PG: 'Oceania',
    FJ: 'Oceania',
    // Antarctica
    AQ: 'Antarctica',
  };

  return continents[countryCode.toUpperCase()] || 'Unknown';
}
