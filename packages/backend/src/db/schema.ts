import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  time,
  timestamp,
} from 'drizzle-orm/pg-core';

// Subscription status enum
export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'active',
  'inactive',
  'failed',
]);

// Subscriptions table - stores web push subscriptions
export const subscriptions = pgTable('subscriptions', {
  id: text('id').primaryKey(),
  endpoint: text('endpoint').notNull().unique(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  userAgent: text('user_agent'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  status: subscriptionStatusEnum('status').notNull().default('active'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Traffic events table - stores captured HTTP traffic
export const trafficEvents = pgTable('traffic_events', {
  id: text('id').primaryKey(),
  url: text('url').notNull(),
  method: text('method').notNull(),
  headers: jsonb('headers').$type<Record<string, string>>(),
  body: jsonb('body').$type<unknown>(),
  source: text('source').notNull(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// VAPID config table - stores VAPID keys (singleton pattern)
export const vapidConfig = pgTable('vapid_config', {
  id: text('id').primaryKey().default('default'),
  publicKey: text('public_key').notNull(),
  privateKey: text('private_key').notNull(),
  subject: text('subject').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Devices table - stores device information for analytics
export const devices = pgTable(
  'devices',
  {
    id: text('id').primaryKey(),
    subscriptionId: text('subscription_id').references(() => subscriptions.id, {
      onDelete: 'set null',
    }),

    // User Agent Parsing Results
    userAgent: text('user_agent').notNull(),
    platform: text('platform').notNull(), // 'ios', 'android', 'desktop', 'tablet'
    deviceType: text('device_type').notNull(), // 'mobile', 'desktop', 'tablet', 'wearable'
    browserName: text('browser_name'),
    browserVersion: text('browser_version'),
    osName: text('os_name'),
    osVersion: text('os_version'),
    deviceModel: text('device_model'),
    deviceVendor: text('device_vendor'),

    // Screen & Viewport
    screenResolution: text('screen_resolution'),
    viewportWidth: integer('viewport_width'),
    viewportHeight: integer('viewport_height'),
    pixelRatio: text('pixel_ratio'),
    colorDepth: integer('color_depth'),
    screenOrientation: text('screen_orientation'), // 'portrait', 'landscape'

    // Network Conditions
    networkType: text('network_type'), // '4g', '5g', 'wifi', 'slow-2g', '3g', 'offline'
    connectionDownlink: text('connection_downlink'), // Mbps as string
    connectionRtt: integer('connection_rtt'), // Round-trip time in ms
    saveData: boolean('save_data'),
    effectiveType: text('effective_type'),

    // Device Capabilities
    deviceMemory: text('device_memory'), // GB as string
    cpuCores: integer('cpu_cores'),
    gpuVendor: text('gpu_vendor'),
    gpuRenderer: text('gpu_renderer'),

    // Battery Status
    batteryLevel: text('battery_level'), // 0-1 as string
    isCharging: boolean('is_charging'),
    chargingTime: integer('charging_time'), // seconds until full

    // Timezone & Locale
    timezone: text('timezone'),
    timezoneOffset: integer('timezone_offset'), // UTC offset in minutes
    locale: text('locale'), // 'en-US', 'fr-FR', etc.
    languages: jsonb('languages'), // ['en-US', 'en']

    // Push Capabilities
    supportsActions: boolean('supports_actions').default(false),
    supportsImages: boolean('supports_images').default(false),
    supportsSilent: boolean('supports_silent').default(false),
    supportsVibrate: boolean('supports_vibrate').default(false),
    supportsBadge: boolean('supports_badge').default(false),
    supportsData: boolean('supports_data').default(false),
    maxActionButtons: integer('max_action_buttons'),

    // Feature Detection
    supportsWebP: boolean('supports_webp'),
    supportsAVIF: boolean('supports_avif'),
    supportsWebGL: boolean('supports_webgl'),
    supportsWebGL2: boolean('supports_webgl2'),
    supportsWebGPU: boolean('supports_webgpu'),
    supportsWebRTC: boolean('supports_webrtc'),
    supportsWebSockets: boolean('supports_websockets'),
    supportsServiceWorker: boolean('supports_service_worker'),
    supportsBackgroundSync: boolean('supports_background_sync'),
    supportsPeriodicSync: boolean('supports_periodic_sync'),
    supportsNotifications: boolean('supports_notifications'),
    supportsPushManager: boolean('supports_push_manager'),
    supportsBluetooth: boolean('supports_bluetooth'),
    supportsUSB: boolean('supports_usb'),
    supportsSerial: boolean('supports_serial'),
    supportsHID: boolean('supports_hid'),

    // Storage & Quota
    storageEstimate: jsonb('storage_estimate'), // {usage, quota, usageDetails, quotaManaged}
    storagePersisted: boolean('storage_persisted'),

    // Media Capabilities
    hasCamera: boolean('has_camera'),
    hasMicrophone: boolean('has_microphone'),
    hasSpeakers: boolean('has_speakers'),
    mediaDevices: jsonb('media_devices'), // [{kind, label, deviceId}]

    // Fingerprints for deduplication
    deviceFingerprint: text('device_fingerprint'),
    sessionFingerprint: text('session_fingerprint'),

    // Metadata
    firstSeen: timestamp('first_seen').notNull().defaultNow(),
    lastSeen: timestamp('last_seen').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    subscriptionIdx: index('idx_devices_subscription').on(table.subscriptionId),
    platformIdx: index('idx_devices_platform').on(table.platform),
    browserIdx: index('idx_devices_browser').on(table.browserName),
    fingerprintIdx: index('idx_devices_fingerprint').on(table.deviceFingerprint),
  })
);

// Campaign status enum
export const campaignStatusEnum = pgEnum('campaign_status', [
  'draft',
  'scheduled',
  'sending',
  'completed',
  'paused',
]);

// Campaigns table - stores push notification campaigns
export const campaigns = pgTable('campaigns', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),

  // Campaign Settings
  status: campaignStatusEnum('status').notNull().default('draft'),
  campaignType: text('campaign_type'), // 'broadcast', 'segmented', 'transactional', 'ab_test'

  // Content Template
  titleTemplate: text('title_template').notNull(),
  bodyTemplate: text('body_template'),
  iconUrl: text('icon_url'),
  imageUrl: text('image_url'),
  badgeUrl: text('badge_url'),
  soundUrl: text('sound_url'),
  vibratePattern: jsonb('vibrate_pattern'), // [200, 100, 200]

  // Advanced Options
  dir: text('dir'), // 'auto', 'ltr', 'rtl'
  lang: text('lang'),
  tag: text('tag'),
  renotify: boolean('renotify'),
  requireInteraction: boolean('require_interaction'),
  silent: boolean('silent'),

  // Actions/Buttons
  actions: jsonb('actions'), // [{action: 'reply', title: 'Reply', icon: '/reply.png'}]

  // Deep Link
  clickUrl: text('click_url'),

  // Targeting
  targetSegment: jsonb('target_segment'), // {platform: ['ios', 'android'], browser: ['chrome']}
  targetExpression: text('target_expression'), // SQL-like expression for complex targeting

  // Scheduling
  scheduledAt: timestamp('scheduled_at'),
  timezone: text('timezone'),

  // Rate Limiting
  maxPerHour: integer('max_per_hour').default(1000),
  maxPerDay: integer('max_per_day').default(5000),

  // TTL and Priority
  ttlSeconds: integer('ttl_seconds').default(86400), // 24 hours
  priority: text('priority').default('normal'), // 'low', 'normal', 'high'
  urgency: text('urgency').default('normal'), // 'very-low', 'low', 'normal', 'high'

  // A/B Test Settings
  abTestParentId: text('ab_test_parent_id'),
  isAbTestMaster: boolean('is_ab_test_master').default(false),
  abTestVariants: jsonb('ab_test_variants'), // {A: {...}, B: {...}}

  // Metadata
  createdBy: text('created_by'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

// Delivery status enum
export const deliveryStatusEnum = pgEnum('delivery_status', [
  'pending',
  'sent',
  'delivered',
  'opened',
  'clicked',
  'failed',
  'bounced',
]);

// Campaign deliveries table - tracks delivery of campaigns
export const campaignDeliveries = pgTable(
  'campaign_deliveries',
  {
    id: text('id').primaryKey(),
    campaignId: text('campaign_id').references(() => campaigns.id, { onDelete: 'cascade' }),
    subscriptionId: text('subscription_id').references(() => subscriptions.id, {
      onDelete: 'set null',
    }),
    deviceId: text('device_id').references(() => devices.id, { onDelete: 'set null' }),

    // Delivery Status
    status: deliveryStatusEnum('status').notNull(),

    // Content Sent
    title: text('title'),
    body: text('body'),
    payload: jsonb('payload'),

    // A/B Test Variant
    abTestVariant: text('ab_test_variant'), // 'A', 'B', 'control'

    // Timing
    createdAt: timestamp('created_at').notNull().defaultNow(),
    sentAt: timestamp('sent_at'),
    deliveredAt: timestamp('delivered_at'),
    openedAt: timestamp('opened_at'),
    clickedAt: timestamp('clicked_at'),
    failedAt: timestamp('failed_at'),

    // Error Tracking
    errorCode: text('error_code'),
    errorMessage: text('error_message'),

    // Provider Info
    providerMessageId: text('provider_message_id'), // FCM message ID, etc
    providerResponse: jsonb('provider_response'),

    // Metadata
    retryCount: integer('retry_count').default(0),
    ttlExpired: boolean('ttl_expired').default(false),
  },
  (table) => ({
    campaignIdx: index('idx_campaign_deliveries_campaign').on(table.campaignId),
    statusIdx: index('idx_campaign_deliveries_status').on(table.status),
    subscriptionIdx: index('idx_campaign_deliveries_subscription').on(table.subscriptionId),
  })
);

// Notification preferences table - stores user preferences
export const notificationPreferences = pgTable(
  'notification_preferences',
  {
    id: text('id').primaryKey(),
    subscriptionId: text('subscription_id')
      .unique()
      .references(() => subscriptions.id, { onDelete: 'cascade' }),
    deviceFingerprint: text('device_fingerprint').unique(),

    // Opt-in Status
    optInStatus: boolean('opt_in_status').notNull().default(true),
    optInChangedAt: timestamp('opt_in_changed_at'),

    // Preferred Send Times (user's timezone)
    preferredTimezones: jsonb('preferred_timezones'), // ["America/New_York", "Europe/London"]
    preferredHours: jsonb('preferred_hours'), // [9, 10, 11, 12, 13, 14, 15, 16, 17, 18]
    preferredDays: jsonb('preferred_days'), // [1, 2, 3, 4, 5] -- Monday=1, Friday=5

    // Quiet Hours
    quietHoursEnabled: boolean('quiet_hours_enabled').default(false),
    quietHoursStart: time('quiet_hours_start'), // '22:00'
    quietHoursEnd: time('quiet_hours_end'), // '08:00'
    quietHoursTimezone: text('quiet_hours_timezone'),

    // Frequency Capping
    maxPerHour: integer('max_per_hour').default(3),
    maxPerDay: integer('max_per_day').default(10),
    maxPerWeek: integer('max_per_week').default(50),

    // Content Categories (what they want to receive)
    categoriesEnabled: jsonb('categories_enabled').default('[]'), // ['news', 'updates', 'promotions']
    categoriesDisabled: jsonb('categories_disabled').default('[]'),

    // Format Preferences
    enableSound: boolean('enable_sound').default(true),
    enableVibration: boolean('enable_vibration').default(true),
    enableBadge: boolean('enable_badge').default(true),
    enableImages: boolean('enable_images').default(true),

    // DPI (Do Not Interrupt) Status
    dndUntil: timestamp('dnd_until'),
    dndReason: text('dnd_reason'), // 'meeting', 'vacation', 'focus'

    // Engagement-based Auto-Optimization
    autoOptimize: boolean('auto_optimize').default(false),
    lastOptimizedAt: timestamp('last_optimized_at'),

    // Metadata
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    subscriptionIdx: index('idx_preferences_subscription').on(table.subscriptionId),
    fingerprintIdx: index('idx_preferences_fingerprint').on(table.deviceFingerprint),
  })
);

// Notification events table - comprehensive event tracking
export const notificationEvents = pgTable(
  'notification_events',
  {
    id: text('id').primaryKey(),

    // Event Type
    eventType: text('event_type').notNull(), // 'delivered', 'opened', 'clicked', 'dismissed', 'bounced', 'opted_out', 'opted_in'

    // References
    campaignId: text('campaign_id').references(() => campaigns.id, { onDelete: 'set null' }),
    subscriptionId: text('subscription_id').references(() => subscriptions.id, {
      onDelete: 'set null',
    }),
    deviceId: text('device_id').references(() => devices.id, { onDelete: 'set null' }),
    deliveryId: text('delivery_id').references(() => campaignDeliveries.id, {
      onDelete: 'set null',
    }),

    // Notification Content (for analytics)
    title: text('title'),
    bodyHash: text('body_hash'), // For grouping similar notifications
    category: text('category'),

    // User Context
    userSegment: text('user_segment'),
    abTestGroup: text('ab_test_group'),

    // Timing
    timezone: text('timezone'),
    localHour: integer('local_hour'), // Hour in user's timezone
    dayOfWeek: integer('day_of_week'), // 1-7

    // Device Context
    platform: text('platform'),
    browser: text('browser'),
    networkType: text('network_type'),
    batteryLevel: text('battery_level'),

    // Performance Metrics
    timeToClick: integer('time_to_click'), // Milliseconds from display to click
    timeToDismiss: integer('time_to_dismiss'),

    // A/B Test Data
    experimentId: text('experiment_id'),
    variantId: text('variant_id'),

    // Attribution
    attributionSource: text('attribution_source'),
    attributionMedium: text('attribution_medium'),
    attributionCampaign: text('attribution_campaign'),

    // Metadata
    createdAt: timestamp('created_at').notNull().defaultNow(),
    metadata: jsonb('metadata'),
  },
  (table) => ({
    typeDateIdx: index('idx_events_type_date').on(table.eventType, table.createdAt),
    campaignIdx: index('idx_events_campaign').on(table.campaignId),
    abTestIdx: index('idx_events_ab_test').on(table.experimentId, table.variantId),
  })
);

// Failed deliveries table - dead letter queue for tracking failed deliveries
export const failedDeliveries = pgTable(
  'failed_deliveries',
  {
    id: text('id').primaryKey(),
    deliveryId: text('delivery_id')
      .notNull()
      .references(() => campaignDeliveries.id, { onDelete: 'cascade' }),
    campaignId: text('campaign_id'),
    subscriptionId: text('subscription_id'),
    errorCode: text('error_code').notNull(),
    errorMessage: text('error_message'),
    errorCategory: text('error_category'), // 'expired', 'rate_limit', 'network', 'invalid_payload'
    attempt: integer('attempt').notNull(),
    maxAttempts: integer('max_attempts').default(3),
    willRetry: boolean('will_retry').default(true),
    nextRetryAt: timestamp('next_retry_at'),
    lastAttemptAt: timestamp('last_attempt_at').defaultNow(),
    resolvedAt: timestamp('resolved_at'),
    metadata: jsonb('metadata'),
  },
  (table) => ({
    retryIdx: index('idx_failed_retries').on(table.willRetry, table.nextRetryAt),
    deliveryIdx: index('idx_failed_delivery').on(table.deliveryId),
    errorCategoryIdx: index('idx_failed_error_category').on(table.errorCategory),
  })
);

// Subscription health checks table
export const subscriptionHealthChecks = pgTable(
  'subscription_health_checks',
  {
    id: text('id').primaryKey(),
    subscriptionId: text('subscription_id').references(() => subscriptions.id, {
      onDelete: 'cascade',
    }),
    status: text('status').notNull(), // 'healthy', 'unhealthy', 'expired', 'unknown'
    statusCode: integer('status_code'),
    errorMessage: text('error_message'),
    responseTime: integer('response_time'), // ms
    checkedAt: timestamp('checked_at').notNull().defaultNow(),
  },
  (table) => ({
    subscriptionIdx: index('idx_health_subscription').on(table.subscriptionId),
    statusIdx: index('idx_health_status').on(table.status),
    checkedAtIdx: index('idx_health_checked_at').on(table.checkedAt),
  })
);

// System settings table - stores application-wide configuration
export const systemSettings = pgTable(
  'system_settings',
  {
    key: text('key').primaryKey(),
    value: jsonb('value').notNull(),
    category: text('category').notNull(), // 'general', 'vapid', 'limits', 'ui', 'analytics'
    description: text('description'),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    categoryIdx: index('idx_settings_category').on(table.category),
  })
);

// ========== NEW TABLES FOR ENHANCED TRACKING ==========

// User sessions table - track user sessions across the site
export const userSessions = pgTable(
  'user_sessions',
  {
    id: text('id').primaryKey(),
    deviceFingerprint: text('device_fingerprint').notNull(),
    subscriptionId: text('subscription_id').references(() => subscriptions.id, {
      onDelete: 'set null',
    }),

    // Session tracking
    sessionId: text('session_id').notNull(), // UUID for the session
    referrer: text('referrer'),
    utmSource: text('utm_source'),
    utmMedium: text('utm_medium'),
    utmCampaign: text('utm_campaign'),
    utmTerm: text('utm_term'),
    utmContent: text('utm_content'),

    // Entry & Exit
    entryUrl: text('entry_url'),
    entryPageTitle: text('entry_page_title'),
    exitUrl: text('exit_url'),
    exitPageTitle: text('exit_page_title'),

    // Timing
    startedAt: timestamp('started_at').notNull().defaultNow(),
    endedAt: timestamp('ended_at'),
    duration: integer('duration'), // seconds

    // Page views
    pageViews: integer('page_views').default(0),
    uniquePages: integer('unique_pages').default(0),

    // Engagement
    scrollDepth: integer('scroll_depth'), // max percentage scrolled
    mouseMoves: integer('mouse_moves'), // count of mouse move events
    clicks: integer('clicks'), // count of clicks
    keyPresses: integer('key_presses'), // count of key presses
    touchEvents: integer('touch_events'), // count of touch events

    // Device context at session start
    timezone: text('timezone'),
    locale: text('locale'),
    screenResolution: text('screen_resolution'),
    viewportSize: text('viewport_size'),
    networkType: text('network_type'),

    // Metadata
    metadata: jsonb('metadata'),
  },
  (table) => ({
    deviceFingerprintIdx: index('idx_sessions_device_fingerprint').on(table.deviceFingerprint),
    subscriptionIdx: index('idx_sessions_subscription').on(table.subscriptionId),
    startedAtIdx: index('idx_sessions_started_at').on(table.startedAt),
  })
);

// Page view events table - detailed page tracking
export const pageViews = pgTable(
  'page_views',
  {
    id: text('id').primaryKey(),
    sessionId: text('session_id').references(() => userSessions.id, { onDelete: 'set null' }),
    deviceFingerprint: text('device_fingerprint').notNull(),

    // Page info
    url: text('url').notNull(),
    pageTitle: text('page_title'),
    path: text('path').notNull(),
    hash: text('hash'),

    // Referrer
    referrer: text('referrer'),
    referrerDomain: text('referrer_domain'),

    // Timing
    viewedAt: timestamp('viewed_at').notNull().defaultNow(),
    timeOnPage: integer('time_on_page'), // milliseconds
    exitedAt: timestamp('exited_at'),

    // Viewport info
    viewportWidth: integer('viewport_width'),
    viewportHeight: integer('viewport_height'),

    // Engagement
    scrollPercentage: integer('scroll_percentage'), // max scroll depth
    scrolledPast50: boolean('scrolled_past_50'),
    scrolledPast75: boolean('scrolled_past_75'),
    scrolledPast90: boolean('scrolled_past_90'),
    reachedBottom: boolean('reached_bottom'),

    // Interactions
    clicks: integer('clicks').default(0),
    formInteractions: integer('form_interactions').default(0),
    copyEvents: integer('copy_events').default(0),
    printAttempts: integer('print_attempts').default(0),
    bookmarks: integer('bookmarks').default(0),

    // Performance
    pageLoadTime: integer('page_load_time'), // ms
    domContentLoaded: integer('dom_content_loaded'), // ms
    firstPaint: integer('first_paint'), // ms
    firstContentfulPaint: integer('first_contentful_paint'), // ms

    // Metadata
    metadata: jsonb('metadata'),
  },
  (table) => ({
    sessionIdx: index('idx_page_views_session').on(table.sessionId),
    deviceFingerprintIdx: index('idx_page_views_device').on(table.deviceFingerprint),
    pathIdx: index('idx_page_views_path').on(table.path),
    viewedAtIdx: index('idx_page_views_viewed_at').on(table.viewedAt),
  })
);

// Web Vitals table - Core Web Vitals tracking
export const webVitals = pgTable(
  'web_vitals',
  {
    id: text('id').primaryKey(),
    sessionId: text('session_id').references(() => userSessions.id, { onDelete: 'set null' }),
    pageViewId: text('page_view_id').references(() => pageViews.id, { onDelete: 'set null' }),
    deviceFingerprint: text('device_fingerprint').notNull(),
    url: text('url').notNull(),

    // Core Web Vitals
    metricType: text('metric_type').notNull(), // 'LCP', 'FID', 'CLS', 'FCP', 'TTFB', 'INP'
    value: real('value').notNull(), // actual metric value
    rating: text('rating').notNull(), // 'good', 'needs-improvement', 'poor'

    // Additional context
    timestamp: timestamp('timestamp').notNull().defaultNow(),
    navigationType: text('navigation_type'), // 'navigate', 'reload', 'back_forward'
    connectionType: text('connection_type'), // '4g', '3g', etc.

    // Debug info
    metadata: jsonb('metadata'), // {id, name, value, delta, entries: [...]}
  },
  (table) => ({
    sessionIdx: index('idx_web_vitals_session').on(table.sessionId),
    pageViewIdx: index('idx_web_vitals_page_view').on(table.pageViewId),
    metricTypeIdx: index('idx_web_vitals_metric').on(table.metricType),
    ratingIdx: index('idx_web_vitals_rating').on(table.rating),
  })
);

// Resource timing table - track resource loading performance
export const resourceTiming = pgTable(
  'resource_timing',
  {
    id: text('id').primaryKey(),
    pageViewId: text('page_view_id').references(() => pageViews.id, { onDelete: 'set null' }),
    deviceFingerprint: text('device_fingerprint').notNull(),

    // Resource identification
    name: text('name').notNull(), // URL
    resourceType: text('resource_type').notNull(), // 'script', 'stylesheet', 'image', 'font', 'fetch', 'xmlhttprequest', 'other'

    // Timing data (in milliseconds)
    startTime: real('start_time'),
    duration: real('duration'),
    transferSize: text('transfer_size'), // bytes as string for compatibility
    encodedBodySize: text('encoded_body_size'),
    decodedBodySize: text('decoded_body_size'),

    // Performance
    responseTime: real('response_time'), // duration - startTime
    tcpTime: real('tcp_time'),
    tlsTime: real('tls_time'),
    ttfb: real('ttfb'), // time to first byte
    downloadTime: real('download_time'),

    // Cache info
    cached: boolean('cached'),
    cacheHit: boolean('cache_hit'),

    // Context
    timestamp: timestamp('timestamp').notNull().defaultNow(),
    initiatorType: text('initiator_type'), // 'link', 'script', 'img', 'css', etc

    metadata: jsonb('metadata'),
  },
  (table) => ({
    pageViewIdx: index('idx_resource_timing_page_view').on(table.pageViewId),
    resourceTypeIdx: index('idx_resource_timing_type').on(table.resourceType),
  })
);

// User behavior events table - granular user actions
export const userBehaviorEvents = pgTable(
  'user_behavior_events',
  {
    id: text('id').primaryKey(),
    sessionId: text('session_id').references(() => userSessions.id, { onDelete: 'set null' }),
    pageViewId: text('page_view_id').references(() => pageViews.id, { onDelete: 'set null' }),
    deviceFingerprint: text('device_fingerprint').notNull(),

    // Event classification
    eventType: text('event_type').notNull(), // 'click', 'scroll', 'resize', 'focus', 'blur', 'visibility_change', 'copy', 'paste', 'context_menu', etc.
    eventCategory: text('event_category'), // 'engagement', 'navigation', 'interaction', 'system', 'media'

    // Target info
    targetSelector: text('target_selector'), // CSS selector of target element
    targetTag: text('target_tag'), // button, a, div, etc
    targetId: text('target_id'),
    targetClass: text('target_class'),
    targetText: text('target_text'), // text content of target
    targetAttributes: jsonb('target_attributes'), // {href, data-*, etc}

    // Position info
    x: integer('x'), // clientX
    y: integer('y'), // clientY
    pageX: integer('page_x'),
    pageY: integer('page_y'),
    screenX: integer('screen_x'),
    screenY: integer('screen_y'),

    // Scroll info (for scroll events)
    scrollX: integer('scroll_x'),
    scrollY: integer('scroll_y'),
    scrollPercentage: integer('scroll_percentage'),

    // Key info (for keyboard events)
    key: text('key'),
    code: text('code'),
    ctrlKey: boolean('ctrl_key'),
    shiftKey: boolean('shift_key'),
    altKey: boolean('alt_key'),
    metaKey: boolean('meta_key'),

    // Form info (for form interactions)
    formId: text('form_id'),
    formAction: text('form_action'),
    formMethod: text('form_method'),
    inputName: text('input_name'),
    inputType: text('input_type'),
    inputValue: text('input_value'), // be careful with sensitive data

    // Media info (for media events)
    mediaType: text('media_type'), // 'video', 'audio'
    mediaAction: text('media_action'), // 'play', 'pause', 'seek', 'volume_change'
    mediaCurrentTime: real('media_current_time'),
    mediaDuration: real('media_duration'),
    mediaVolume: real('media_volume'),

    // Timing
    timestamp: timestamp('timestamp').notNull().defaultNow(),
    timeSincePageLoad: integer('time_since_page_load'), // ms

    // Context
    url: text('url'),
    pageTitle: text('page_title'),

    metadata: jsonb('metadata'),
  },
  (table) => ({
    sessionIdx: index('idx_behavior_session').on(table.sessionId),
    pageViewIdx: index('idx_behavior_page_view').on(table.pageViewId),
    eventTypeIdx: index('idx_behavior_type').on(table.eventType),
    timestampIdx: index('idx_behavior_timestamp').on(table.timestamp),
  })
);

// Error tracking table - capture JavaScript errors and crashes
export const errorTracking = pgTable(
  'error_tracking',
  {
    id: text('id').primaryKey(),
    sessionId: text('session_id').references(() => userSessions.id, { onDelete: 'set null' }),
    pageViewId: text('page_view_id').references(() => pageViews.id, { onDelete: 'set null' }),
    deviceFingerprint: text('device_fingerprint').notNull(),

    // Error classification
    errorType: text('error_type').notNull(), // 'javascript', 'resource', 'network', 'promise', 'console', 'custom'
    errorCategory: text('error_category'), // 'unhandled', 'handled', 'warning', 'info'
    severity: text('severity').notNull(), // 'critical', 'error', 'warning', 'info', 'debug'

    // Error details
    message: text('message').notNull(),
    name: text('name'), // Error name (e.g., 'TypeError', 'ReferenceError')
    stack: text('stack'), // Stack trace
    fileName: text('file_name'),
    lineNumber: integer('line_number'),
    columnNumber: integer('column_number'),

    // Source info
    source: text('source'), // 'script', 'stylesheet', 'image', 'fetch', 'websocket'
    url: text('url'), // URL that caused the error (for resource errors)

    // Context
    userAgent: text('user_agent'),
    urlPath: text('url_path'),
    pageTitle: text('page_title'),

    // Timing
    timestamp: timestamp('timestamp').notNull().defaultNow(),
    timeSincePageLoad: integer('time_since_page_load'),

    // User impact
    userImpact: text('user_impact'), // 'blocking', 'degraded', 'cosmetic', 'none'
    affectedFeatures: jsonb('affected_features'), // ['notifications', 'messaging']

    // Occurrence count
    count: integer('count').default(1),
    firstSeen: timestamp('first_seen').defaultNow(),
    lastSeen: timestamp('last_seen').defaultNow(),

    metadata: jsonb('metadata'),
  },
  (table) => ({
    sessionIdx: index('idx_errors_session').on(table.sessionId),
    pageViewIdx: index('idx_errors_page_view').on(table.pageViewId),
    errorTypeIdx: index('idx_errors_type').on(table.errorType),
    severityIdx: index('idx_errors_severity').on(table.severity),
    timestampIdx: index('idx_errors_timestamp').on(table.timestamp),
  })
);

// Feature usage table - track which browser features are being used
export const featureUsage = pgTable(
  'feature_usage',
  {
    id: text('id').primaryKey(),
    deviceFingerprint: text('device_fingerprint').notNull(),
    sessionId: text('session_id').references(() => userSessions.id, { onDelete: 'set null' }),

    // Feature identification
    featureName: text('feature_name').notNull(), // 'webgl', 'webrtc', 'bluetooth', 'usb', 'geolocation', etc.
    featureCategory: text('feature_category'), // 'media', 'network', 'hardware', 'storage', 'privacy'

    // Usage details
    accessType: text('access_type'), // 'granted', 'denied', 'prompt', 'supported', 'unsupported'
    usageDuration: integer('usage_duration'), // ms used
    usageCount: integer('usage_count').default(1),

    // Permission status
    permissionStatus: text('permission_status'), // 'granted', 'denied', 'prompt', 'unsupported'

    // Context
    url: text('url'),
    timestamp: timestamp('timestamp').notNull().defaultNow(),

    metadata: jsonb('metadata'),
  },
  (table) => ({
    deviceFingerprintIdx: index('idx_feature_device').on(table.deviceFingerprint),
    sessionIdx: index('idx_feature_session').on(table.sessionId),
    featureNameIdx: index('idx_feature_name').on(table.featureName),
    timestampIdx: index('idx_feature_timestamp').on(table.timestamp),
  })
);

// Clipboard events table - track copy/paste/cut operations
export const clipboardEvents = pgTable(
  'clipboard_events',
  {
    id: text('id').primaryKey(),
    deviceFingerprint: text('device_fingerprint').notNull(),
    sessionId: text('session_id').references(() => userSessions.id, { onDelete: 'set null' }),
    pageViewId: text('page_view_id').references(() => pageViews.id, { onDelete: 'set null' }),

    // Event details
    action: text('action').notNull(), // 'copy', 'cut', 'paste'
    dataType: text('data_type'), // 'text', 'image', 'html', 'file', 'unknown'

    // Content info (sanitized)
    dataLength: integer('data_length'), // length of copied/pasted content
    dataPreview: text('data_preview'), // first 100 chars
    hasSensitiveData: boolean('has_sensitive_data'), // detected credit card, email, etc

    // Context
    targetTag: text('target_tag'), // input, textarea, or other
    targetId: text('target_id'),
    targetName: text('target_name'),
    isPasswordField: boolean('is_password_field'),

    // Timing
    timestamp: timestamp('timestamp').notNull().defaultNow(),
    timeOnPage: integer('time_on_page'),

    url: text('url'),
    metadata: jsonb('metadata'),
  },
  (table) => ({
    deviceFingerprintIdx: index('idx_clipboard_device').on(table.deviceFingerprint),
    sessionIdx: index('idx_clipboard_session').on(table.sessionId),
    actionIdx: index('idx_clipboard_action').on(table.action),
    timestampIdx: index('idx_clipboard_timestamp').on(table.timestamp),
  })
);

// Print events table - track print attempts
export const printEvents = pgTable(
  'print_events',
  {
    id: text('id').primaryKey(),
    deviceFingerprint: text('device_fingerprint').notNull(),
    sessionId: text('session_id').references(() => userSessions.id, { onDelete: 'set null' }),
    pageViewId: text('page_view_id').references(() => pageViews.id, { onDelete: 'set null' }),

    // Print details
    printType: text('print_type').notNull(), // 'page', 'selection', 'pdf'
    wasSuccessful: boolean('was_successful'), // whether print dialog completed

    // Context
    pageTitle: text('page_title'),
    url: text('url'),
    timestamp: timestamp('timestamp').notNull().defaultNow(),

    metadata: jsonb('metadata'),
  },
  (table) => ({
    deviceFingerprintIdx: index('idx_print_device').on(table.deviceFingerprint),
    sessionIdx: index('idx_print_session').on(table.sessionId),
    timestampIdx: index('idx_print_timestamp').on(table.timestamp),
  })
);

// Storage events table - track localStorage/sessionStorage usage
export const storageEvents = pgTable(
  'storage_events',
  {
    id: text('id').primaryKey(),
    deviceFingerprint: text('device_fingerprint').notNull(),
    sessionId: text('session_id').references(() => userSessions.id, { onDelete: 'set null' }),

    // Event details
    storageType: text('storage_type').notNull(), // 'local', 'session', 'indexeddb', 'cache'
    action: text('action').notNull(), // 'set', 'remove', 'clear', 'quota_exceeded'

    // Key info
    key: text('key'),
    keyLength: integer('key_length'),

    // Value info (sanitized)
    valueLength: integer('value_length'),
    valueType: text('value_type'), // 'string', 'object', 'number', 'boolean', 'null'

    // Storage stats (periodic snapshots)
    totalKeys: integer('total_keys'),
    estimatedSize: integer('estimated_size'), // bytes
    remainingQuota: integer('remaining_quota'), // bytes

    // Timing
    timestamp: timestamp('timestamp').notNull().defaultNow(),

    url: text('url'),
    metadata: jsonb('metadata'),
  },
  (table) => ({
    deviceFingerprintIdx: index('idx_storage_device').on(table.deviceFingerprint),
    sessionIdx: index('idx_storage_session').on(table.sessionId),
    storageTypeIdx: index('idx_storage_type').on(table.storageType),
    timestampIdx: index('idx_storage_timestamp').on(table.timestamp),
  })
);

// Visibility events table - track tab visibility changes
export const visibilityEvents = pgTable(
  'visibility_events',
  {
    id: text('id').primaryKey(),
    deviceFingerprint: text('device_fingerprint').notNull(),
    sessionId: text('session_id').references(() => userSessions.id, { onDelete: 'set null' }),
    pageViewId: text('page_view_id').references(() => pageViews.id, { onDelete: 'set null' }),

    // Event details
    fromState: text('from_state'), // 'visible', 'hidden'
    toState: text('to_state').notNull(), // 'visible', 'hidden'
    visibilityState: text('visibility_state').notNull(), // 'visible', 'hidden', 'prerender'

    // Duration tracking
    hiddenDuration: integer('hidden_duration'), // ms since hidden
    visibleDuration: integer('visible_duration'), // ms since visible

    // Timing
    timestamp: timestamp('timestamp').notNull().defaultNow(),
    timeSincePageLoad: integer('time_since_page_load'),

    url: text('url'),
    pageTitle: text('page_title'),

    metadata: jsonb('metadata'),
  },
  (table) => ({
    deviceFingerprintIdx: index('idx_visibility_device').on(table.deviceFingerprint),
    sessionIdx: index('idx_visibility_session').on(table.sessionId),
    toStateIdx: index('idx_visibility_to_state').on(table.toState),
    timestampIdx: index('idx_visibility_timestamp').on(table.timestamp),
  })
);

// Form interactions table - detailed form tracking
export const formInteractions = pgTable(
  'form_interactions',
  {
    id: text('id').primaryKey(),
    deviceFingerprint: text('device_fingerprint').notNull(),
    sessionId: text('session_id').references(() => userSessions.id, { onDelete: 'set null' }),
    pageViewId: text('page_view_id').references(() => pageViews.id, { onDelete: 'set null' }),

    // Form identification
    formId: text('form_id'),
    formAction: text('form_action'),
    formMethod: text('form_method'),
    formName: text('form_name'),
    formClass: text('form_class'),

    // Interaction type
    interactionType: text('interaction_type').notNull(), // 'focus', 'blur', 'input', 'change', 'submit', 'reset', 'validation'

    // Field info
    fieldName: text('field_name'),
    fieldId: text('field_id'),
    fieldType: text('field_type'), // 'text', 'email', 'password', 'checkbox', etc
    fieldClass: text('field_class'),

    // Value info (sanitized)
    valueLength: integer('value_length'),
    hasValue: boolean('has_value'),
    isPasswordField: boolean('is_password_field'),
    isCreditCardField: boolean('is_credit_card_field'),
    isEmailField: boolean('is_email_field'),

    // Validation
    isValid: boolean('is_valid'),
    validationMessage: text('validation_message'),
    required: boolean('required'),
    pattern: text('pattern'),

    // Timing
    timestamp: timestamp('timestamp').notNull().defaultNow(),
    timeSinceFieldFocus: integer('time_since_field_focus'), // ms

    // Form progress
    fieldsFilled: integer('fields_filled'),
    totalFields: integer('total_fields'),
    completionPercentage: integer('completion_percentage'),

    url: text('url'),
    metadata: jsonb('metadata'),
  },
  (table) => ({
    deviceFingerprintIdx: index('idx_form_device').on(table.deviceFingerprint),
    sessionIdx: index('idx_form_session').on(table.sessionId),
    pageViewIdx: index('idx_form_page_view').on(table.pageViewId),
    formIdIdx: index('idx_form_id').on(table.formId),
    interactionTypeIdx: index('idx_form_interaction').on(table.interactionType),
  })
);

// Network events table - track fetch/XMLHttpRequest activity
export const networkEvents = pgTable(
  'network_events',
  {
    id: text('id').primaryKey(),
    deviceFingerprint: text('device_fingerprint').notNull(),
    sessionId: text('session_id').references(() => userSessions.id, { onDelete: 'set null' }),
    pageViewId: text('page_view_id').references(() => pageViews.id, { onDelete: 'set null' }),

    // Request details
    requestId: text('request_id').notNull(), // unique ID for the request
    requestType: text('request_type').notNull(), // 'fetch', 'xhr', 'websocket', 'eventsource'
    method: text('method').notNull(), // 'GET', 'POST', 'PUT', 'DELETE', etc
    url: text('url').notNull(),
    domain: text('domain'),
    path: text('path'),

    // Request headers (selective, sanitized)
    initiator: text('initiator'), // what triggered the request
    requestContentType: text('request_content_type'),
    requestBodySize: integer('request_body_size'),

    // Response details
    status: integer('status'), // HTTP status code
    statusText: text('status_text'),
    responseContentType: text('response_content_type'),
    responseBodySize: integer('response_body_size'),
    responseHeaders: jsonb('response_headers'),

    // Timing (in ms)
    startTime: real('start_time'),
    duration: real('duration'),
    responseTime: real('response_time'), // time to first byte

    // Outcome
    success: boolean('success'),
    errorType: text('error_type'), // 'network', 'abort', 'timeout', 'cors'
    errorMessage: text('error_message'),

    // Caching
    fromCache: boolean('from_cache'),
    cacheHit: boolean('cache_hit'),

    // Timing
    timestamp: timestamp('timestamp').notNull().defaultNow(),

    metadata: jsonb('metadata'),
  },
  (table) => ({
    deviceFingerprintIdx: index('idx_network_device').on(table.deviceFingerprint),
    sessionIdx: index('idx_network_session').on(table.sessionId),
    pageViewIdx: index('idx_network_page_view').on(table.pageViewId),
    domainIdx: index('idx_network_domain').on(table.domain),
    statusIdx: index('idx_network_status').on(table.status),
    timestampIdx: index('idx_network_timestamp').on(table.timestamp),
  })
);

// Geolocation events table - track location data (with permission)
export const geolocationEvents = pgTable(
  'geolocation_events',
  {
    id: text('id').primaryKey(),
    deviceFingerprint: text('device_fingerprint').notNull(),
    sessionId: text('session_id').references(() => userSessions.id, { onDelete: 'set null' }),

    // Coordinates (with privacy considerations)
    latitude: real('latitude'),
    longitude: real('longitude'),
    accuracy: real('accuracy'), // meters
    altitude: real('altitude'),
    altitudeAccuracy: real('altitude_accuracy'),
    heading: real('heading'), // degrees
    speed: real('speed'), // m/s

    // Location metadata
    countryCode: text('country_code'), // from reverse geocoding
    countryName: text('country_name'),
    region: text('region'),
    city: text('city'),
    postalCode: text('postal_code'),
    timeZone: text('time_zone'),

    // Source
    source: text('source'), // 'gps', 'ip', 'wifi', 'cell', 'manual'

    // Permission
    permissionStatus: text('permission_status'), // 'granted', 'denied', 'prompt'

    // Timing
    timestamp: timestamp('timestamp').notNull().defaultNow(),

    // Context
    url: text('url'),
    metadata: jsonb('metadata'),
  },
  (table) => ({
    deviceFingerprintIdx: index('idx_geolocation_device').on(table.deviceFingerprint),
    sessionIdx: index('idx_geolocation_session').on(table.sessionId),
    timestampIdx: index('idx_geolocation_timestamp').on(table.timestamp),
  })
);

// Device orientation & motion events table
export const deviceOrientationEvents = pgTable(
  'device_orientation_events',
  {
    id: text('id').primaryKey(),
    deviceFingerprint: text('device_fingerprint').notNull(),
    sessionId: text('session_id').references(() => userSessions.id, { onDelete: 'set null' }),

    // Orientation data
    eventType: text('event_type').notNull(), // 'orientation', 'motion', 'devicemotion'
    alpha: real('alpha'), // device orientation (z-axis rotation)
    beta: real('beta'), // device orientation (x-axis rotation)
    gamma: real('gamma'), // device orientation (y-axis rotation)
    absolute: boolean('absolute'), // whether orientation is absolute

    // Motion data (acceleration)
    accelX: real('accel_x'),
    accelY: real('accel_y'),
    accelZ: real('accel_z'),
    accelIncludingGravityX: real('accel_including_gravity_x'),
    accelIncludingGravityY: real('accel_including_gravity_y'),
    accelIncludingGravityZ: real('accel_including_gravity_z'),

    // Rotation rate
    rotationRateAlpha: real('rotation_rate_alpha'),
    rotationRateBeta: real('rotation_rate_beta'),
    rotationRateGamma: real('rotation_rate_gamma'),

    // Interval
    interval: integer('interval'), // ms since last event

    // Screen orientation
    screenOrientation: text('screen_orientation'), // 'portrait-primary', 'landscape-primary', etc

    // Timing
    timestamp: timestamp('timestamp').notNull().defaultNow(),

    url: text('url'),
    metadata: jsonb('metadata'),
  },
  (table) => ({
    deviceFingerprintIdx: index('idx_orientation_device').on(table.deviceFingerprint),
    sessionIdx: index('idx_orientation_session').on(table.sessionId),
    eventTypeIdx: index('idx_orientation_type').on(table.eventType),
    timestampIdx: index('idx_orientation_timestamp').on(table.timestamp),
  })
);

// Type exports for use in services
export type Subscription = typeof subscriptions.$inferSelect;
export type FailedDelivery = typeof failedDeliveries.$inferSelect;
export type NewFailedDelivery = typeof failedDeliveries.$inferInsert;
export type SubscriptionHealthCheck = typeof subscriptionHealthChecks.$inferSelect;
export type NewSubscriptionHealthCheck = typeof subscriptionHealthChecks.$inferInsert;
export type NewSubscription = typeof subscriptions.$inferInsert;
export type TrafficEvent = typeof trafficEvents.$inferSelect;
export type NewTrafficEvent = typeof trafficEvents.$inferInsert;
export type VapidConfig = typeof vapidConfig.$inferSelect;
export type NewVapidConfig = typeof vapidConfig.$inferInsert;
export type Device = typeof devices.$inferSelect;
export type NewDevice = typeof devices.$inferInsert;
export type Campaign = typeof campaigns.$inferSelect;
export type NewCampaign = typeof campaigns.$inferInsert;
export type CampaignDelivery = typeof campaignDeliveries.$inferSelect;
export type NewCampaignDelivery = typeof campaignDeliveries.$inferInsert;
export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type NewNotificationPreference = typeof notificationPreferences.$inferInsert;
export type NotificationEvent = typeof notificationEvents.$inferSelect;
export type NewNotificationEvent = typeof notificationEvents.$inferInsert;
export type SystemSetting = typeof systemSettings.$inferSelect;
export type NewSystemSetting = typeof systemSettings.$inferInsert;
export type UserSession = typeof userSessions.$inferSelect;
export type NewUserSession = typeof userSessions.$inferInsert;
export type PageView = typeof pageViews.$inferSelect;
export type NewPageView = typeof pageViews.$inferInsert;
export type WebVital = typeof webVitals.$inferSelect;
export type NewWebVital = typeof webVitals.$inferInsert;
export type ResourceTiming = typeof resourceTiming.$inferSelect;
export type NewResourceTiming = typeof resourceTiming.$inferInsert;
export type UserBehaviorEvent = typeof userBehaviorEvents.$inferSelect;
export type NewUserBehaviorEvent = typeof userBehaviorEvents.$inferInsert;
export type ErrorTracking = typeof errorTracking.$inferSelect;
export type NewErrorTracking = typeof errorTracking.$inferInsert;
export type FeatureUsage = typeof featureUsage.$inferSelect;
export type NewFeatureUsage = typeof featureUsage.$inferInsert;
export type ClipboardEvent = typeof clipboardEvents.$inferSelect;
export type NewClipboardEvent = typeof clipboardEvents.$inferInsert;
export type PrintEvent = typeof printEvents.$inferSelect;
export type NewPrintEvent = typeof printEvents.$inferInsert;
export type StorageEvent = typeof storageEvents.$inferSelect;
export type NewStorageEvent = typeof storageEvents.$inferInsert;
export type VisibilityEvent = typeof visibilityEvents.$inferSelect;
export type NewVisibilityEvent = typeof visibilityEvents.$inferInsert;
export type FormInteraction = typeof formInteractions.$inferSelect;
export type NewFormInteraction = typeof formInteractions.$inferInsert;
export type NetworkEvent = typeof networkEvents.$inferSelect;
export type NewNetworkEvent = typeof networkEvents.$inferInsert;
export type GeolocationEvent = typeof geolocationEvents.$inferSelect;
export type NewGeolocationEvent = typeof geolocationEvents.$inferInsert;
export type DeviceOrientationEvent = typeof deviceOrientationEvents.$inferSelect;
export type NewDeviceOrientationEvent = typeof deviceOrientationEvents.$inferInsert;
