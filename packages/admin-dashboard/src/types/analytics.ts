/**
 * Analytics Type Definitions
 * Types matching the backend analytics schema
 */

// ==================== Core Types ====================

export type MetricRating = 'good' | 'needs-improvement' | 'poor';
export type MetricType = 'LCP' | 'FID' | 'CLS' | 'FCP' | 'TTFB' | 'INP';
export type Platform = 'ios' | 'android' | 'desktop' | 'tablet' | 'wearable';
export type DeviceType = 'mobile' | 'desktop' | 'tablet' | 'wearable';
export type BrowserName = 'Chrome' | 'Firefox' | 'Safari' | 'Edge' | 'Opera' | 'IE' | 'Other';
export type OSName = 'Windows' | 'macOS' | 'Linux' | 'Android' | 'iOS' | 'Other';

// ==================== User Sessions ====================

export interface UserSession {
  id: string;
  deviceFingerprint: string;
  subscriptionId: string | null;
  sessionId: string;
  referrer: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmTerm: string | null;
  utmContent: string | null;
  entryUrl: string | null;
  entryPageTitle: string | null;
  exitUrl: string | null;
  exitPageTitle: string | null;
  startedAt: string;
  endedAt: string | null;
  duration: number | null;
  pageViews: number;
  uniquePages: number;
  scrollDepth: number | null;
  mouseMoves: number | null;
  clicks: number | null;
  keyPresses: number | null;
  touchEvents: number | null;
  timezone: string | null;
  locale: string | null;
  screenResolution: string | null;
  viewportSize: string | null;
  networkType: string | null;
  metadata: Record<string, unknown> | null;
}

// ==================== Page Views ====================

export interface PageView {
  id: string;
  sessionId: string | null;
  deviceFingerprint: string;
  url: string;
  pageTitle: string | null;
  path: string;
  hash: string | null;
  referrer: string | null;
  referrerDomain: string | null;
  viewedAt: string;
  timeOnPage: number | null;
  exitedAt: string | null;
  viewportWidth: number | null;
  viewportHeight: number | null;
  scrollPercentage: number | null;
  scrolledPast50: boolean | null;
  scrolledPast75: boolean | null;
  scrolledPast90: boolean | null;
  reachedBottom: boolean | null;
  clicks: number;
  formInteractions: number;
  copyEvents: number;
  printAttempts: number;
  bookmarks: number;
  pageLoadTime: number | null;
  domContentLoaded: number | null;
  firstPaint: number | null;
  firstContentfulPaint: number | null;
  metadata: Record<string, unknown> | null;
}

// ==================== Web Vitals ====================

export interface WebVital {
  id: string;
  sessionId: string | null;
  pageViewId: string | null;
  deviceFingerprint: string;
  url: string;
  metricType: MetricType;
  value: number;
  rating: MetricRating;
  timestamp: string;
  navigationType: string | null;
  connectionType: string | null;
  metadata: Record<string, unknown> | null;
}

export interface WebVitalsSummary {
  metricType: MetricType;
  avgValue: number;
  p50: number;
  p75: number;
  p95: number;
  good: number;
  needsImprovement: number;
  poor: number;
  ratingDistribution: {
    good: number;
    needsImprovement: number;
    poor: number;
  };
}

// ==================== User Behavior Events ====================

export interface UserBehaviorEvent {
  id: string;
  sessionId: string | null;
  pageViewId: string | null;
  deviceFingerprint: string;
  eventType: string;
  eventCategory: string | null;
  targetSelector: string | null;
  targetTag: string | null;
  targetId: string | null;
  targetClass: string | null;
  targetText: string | null;
  targetAttributes: Record<string, unknown> | null;
  x: number | null;
  y: number | null;
  pageX: number | null;
  pageY: number | null;
  screenX: number | null;
  screenY: number | null;
  scrollX: number | null;
  scrollY: number | null;
  scrollPercentage: number | null;
  key: string | null;
  code: string | null;
  ctrlKey: boolean | null;
  shiftKey: boolean | null;
  altKey: boolean | null;
  metaKey: boolean | null;
  timestamp: string;
  timeSincePageLoad: number | null;
  url: string | null;
  pageTitle: string | null;
  metadata: Record<string, unknown> | null;
}

// ==================== Error Tracking ====================

export interface ErrorEvent {
  id: string;
  sessionId: string | null;
  pageViewId: string | null;
  deviceFingerprint: string;
  errorType: string;
  errorCategory: string;
  severity: string;
  message: string;
  name: string | null;
  stack: string | null;
  fileName: string | null;
  lineNumber: number | null;
  columnNumber: number | null;
  source: string | null;
  url: string | null;
  userAgent: string | null;
  urlPath: string | null;
  pageTitle: string | null;
  timestamp: string;
  timeSincePageLoad: number | null;
  userImpact: string | null;
  affectedFeatures: string[] | null;
  count: number;
  firstSeen: string;
  lastSeen: string;
  metadata: Record<string, unknown> | null;
}

export interface ErrorGroup {
  message: string;
  errorType: string;
  errorCategory: string;
  severity: string;
  count: number;
  uniqueUsers: number;
  firstSeen: string;
  lastSeen: string;
  sampleError: ErrorEvent;
}

// ==================== Device ====================

export interface Device {
  id: string;
  subscriptionId: string | null;
  userAgent: string;
  platform: Platform;
  deviceType: DeviceType;
  browserName: BrowserName | null;
  browserVersion: string | null;
  osName: OSName | null;
  osVersion: string | null;
  deviceModel: string | null;
  deviceVendor: string | null;
  screenResolution: string | null;
  viewportWidth: number | null;
  viewportHeight: number | null;
  pixelRatio: string | null;
  colorDepth: number | null;
  screenOrientation: string | null;
  networkType: string | null;
  connectionDownlink: string | null;
  connectionRtt: number | null;
  saveData: boolean | null;
  deviceMemory: string | null;
  cpuCores: number | null;
  gpuVendor: string | null;
  gpuRenderer: string | null;
  supportsWebP: boolean | null;
  supportsAVIF: boolean | null;
  supportsWebGL: boolean | null;
  supportsWebGL2: boolean | null;
  supportsWebGPU: boolean | null;
  supportsWebRTC: boolean | null;
  supportsWebSockets: boolean | null;
  supportsServiceWorker: boolean | null;
  supportsBackgroundSync: boolean | null;
  supportsNotifications: boolean | null;
  supportsPushManager: boolean | null;
  timezone: string | null;
  timezoneOffset: number | null;
  locale: string | null;
  languages: string[] | null;
  deviceFingerprint: string | null;
  firstSeen: string;
  lastSeen: string;
}

export interface DeviceBreakdown {
  browserName: string;
  browserVersion: string | null;
  osName: string;
  osVersion: string | null;
  deviceType: string;
  platform: string;
  count: number;
  percentage: number;
  trend: number; // percentage change
}

// ==================== Geolocation ====================

export interface GeolocationEvent {
  id: string;
  deviceFingerprint: string;
  sessionId: string | null;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  altitude: number | null;
  altitudeAccuracy: number | null;
  heading: number | null;
  speed: number | null;
  countryCode: string | null;
  countryName: string | null;
  region: string | null;
  city: string | null;
  postalCode: string | null;
  timeZone: string | null;
  source: string | null;
  permissionStatus: string | null;
  timestamp: string;
  url: string | null;
  metadata: Record<string, unknown> | null;
}

export interface GeoDistribution {
  country: string;
  countryCode: string;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  sessions: number;
  pageViews: number;
  uniqueVisitors: number;
  avgDuration: number | null;
}

// ==================== Form Interactions ====================

export interface FormInteraction {
  id: string;
  sessionId: string | null;
  pageViewId: string | null;
  deviceFingerprint: string;
  formId: string | null;
  formAction: string | null;
  formMethod: string | null;
  formName: string | null;
  formClass: string | null;
  interactionType: string;
  fieldName: string | null;
  fieldId: string | null;
  fieldType: string | null;
  fieldClass: string | null;
  valueLength: number | null;
  hasValue: boolean | null;
  isPasswordField: boolean | null;
  isCreditCardField: boolean | null;
  isEmailField: boolean | null;
  isValid: boolean | null;
  validationMessage: string | null;
  required: boolean | null;
  pattern: string | null;
  timestamp: string;
  timeSinceFieldFocus: number | null;
  fieldsFilled: number | null;
  totalFields: number | null;
  completionPercentage: number | null;
  url: string | null;
  metadata: Record<string, unknown> | null;
}

export interface FormStats {
  formId: string;
  formAction: string | null;
  starts: number;
  completions: number;
  abandonments: number;
  completionRate: number;
  avgTimeToComplete: number | null;
  fields: FormFieldStats[];
}

export interface FormFieldStats {
  fieldName: string;
  fieldType: string;
  errorRate: number;
  avgTimeToComplete: number | null;
  dropOffRate: number;
}

// ==================== Campaign Analytics ====================

export interface CampaignStats {
  id: string;
  name: string;
  status: string;
  totalSent: number;
  delivered: number;
  failed: number;
  opened: number;
  clicked: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  createdAt: string;
  scheduledAt: string | null;
  sentAt: string | null;
}

// ==================== Overview Stats ====================

export interface OverviewStats {
  period: {
    start: string;
    end: string;
    days: number;
  };
  sessions: {
    total: number;
    unique: number;
    change: number;
  };
  pageViews: {
    total: number;
    unique: number;
    change: number;
  };
  users: {
    activeNow: number;
    unique: number;
    returning: number;
    new: number;
  };
  engagement: {
    avgSessionDuration: number;
    avgPageViewsPerSession: number;
    bounceRate: number;
    avgScrollDepth: number;
  };
  performance: {
    avgPageLoadTime: number;
    avgLCP: number;
    avgFID: number;
    avgCLS: number;
  };
  byPlatform: {
    platform: string;
    sessions: number;
    pageViews: number;
    percentage: number;
  }[];
  byBrowser: {
    browserName: string;
    sessions: number;
    pageViews: number;
    percentage: number;
  }[];
  byDevice: {
    deviceType: string;
    sessions: number;
    pageViews: number;
    percentage: number;
  }[];
}

// ==================== Time Series Data ====================

export interface TimeSeriesDataPoint {
  timestamp: string;
  value: number;
  label?: string;
}

export interface TimeSeriesData {
  metric: string;
  period: string;
  interval: 'hour' | 'day' | 'week' | 'month';
  data: TimeSeriesDataPoint[];
  previous?: TimeSeriesDataPoint[];
}

// ==================== Real-time Stats ====================

export interface RealtimeStats {
  activeUsers: number;
  activeSessions: RealtimeSession[];
  lastUpdated: string;
}

export interface RealtimeSession {
  sessionId: string;
  deviceFingerprint: string;
  currentPage: string;
  pageTitle: string | null;
  startedAt: string;
  lastActivity: string;
  platform: Platform;
  browser: BrowserName;
  country: string | null;
  city: string | null;
}

// ==================== Heatmap Data ====================

export interface HeatmapData {
  url: string;
  totalClicks: number;
  clicks: ClickDataPoint[];
}

export interface ClickDataPoint {
  x: number;
  y: number;
  targetSelector: string | null;
  targetTag: string | null;
  targetId: string | null;
  count: number;
  uniqueClickers: number;
}

export interface HourlyActivity {
  hour: number;
  day: string;
  sessions: number;
  pageViews: number;
  avgDuration: number;
}

// ==================== Filter Options ====================

export interface AnalyticsFilters {
  dateRange: {
    start: string;
    end: string;
  };
  platform?: Platform[];
  browser?: BrowserName[];
  deviceType?: DeviceType[];
  country?: string[];
  path?: string;
}

// ==================== API Response Types ====================

export interface AnalyticsApiResponse<T> {
  data: T;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface AnalyticsError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}
