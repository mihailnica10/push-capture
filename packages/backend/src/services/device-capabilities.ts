import type { PushPayload } from './payload-builder.js';

export interface BrowserCapability {
  browserName: string;
  minVersion: string;
  features: {
    maxTitleLength: number;
    maxBodyLength: number;
    maxActions: number;
    supportsImage: boolean;
    supportsActions: boolean;
    supportsSilent: boolean;
    supportsVibrate: boolean;
    supportsBadge: boolean;
    supportsTag: boolean;
    supportsData: boolean;
    maxDataSize: number;
    maxImageSize: number;
    supportsRenotify: boolean;
    supportsRequireInteraction: boolean;
    supportsTimestamp: boolean;
    supportsDirection: boolean; // dir: auto/ltr/rtl
    supportsReply: boolean; // Inline replies
  };
}

/**
 * Comprehensive capability matrix for web push browsers
 */
const BROWSER_CAPABILITIES: Record<string, BrowserCapability> = {
  Chrome: {
    browserName: 'Chrome',
    minVersion: '42',
    features: {
      maxTitleLength: 50,
      maxBodyLength: 120,
      maxActions: 2,
      supportsImage: true,
      supportsActions: true,
      supportsSilent: false, // Not supported in any browser yet
      supportsVibrate: true,
      supportsBadge: true,
      supportsTag: true,
      supportsData: true,
      maxDataSize: 4096,
      maxImageSize: 512 * 1024, // 512KB
      supportsRenotify: true,
      supportsRequireInteraction: true,
      supportsTimestamp: true,
      supportsDirection: true,
      supportsReply: false, // Chrome doesn't support inline reply actions
    },
  },
  'Chrome Mobile': {
    browserName: 'Chrome Mobile',
    minVersion: '42',
    features: {
      maxTitleLength: 50,
      maxBodyLength: 120,
      maxActions: 2,
      supportsImage: true,
      supportsActions: true,
      supportsSilent: false,
      supportsVibrate: true,
      supportsBadge: true,
      supportsTag: true,
      supportsData: true,
      maxDataSize: 4096,
      maxImageSize: 512 * 1024,
      supportsRenotify: true,
      supportsRequireInteraction: true,
      supportsTimestamp: true,
      supportsDirection: true,
      supportsReply: false,
    },
  },
  Firefox: {
    browserName: 'Firefox',
    minVersion: '44',
    features: {
      maxTitleLength: 50,
      maxBodyLength: 120,
      maxActions: 2,
      supportsImage: true,
      supportsActions: true,
      supportsSilent: false,
      supportsVibrate: false, // Firefox doesn't support vibrate
      supportsBadge: true,
      supportsTag: true,
      supportsData: true,
      maxDataSize: 4096,
      maxImageSize: 512 * 1024,
      supportsRenotify: true,
      supportsRequireInteraction: true,
      supportsTimestamp: true,
      supportsDirection: true,
      supportsReply: false,
    },
  },
  'Firefox Mobile': {
    browserName: 'Firefox Mobile',
    minVersion: '48',
    features: {
      maxTitleLength: 50,
      maxBodyLength: 120,
      maxActions: 2,
      supportsImage: true,
      supportsActions: true,
      supportsSilent: false,
      supportsVibrate: false,
      supportsBadge: true,
      supportsTag: true,
      supportsData: true,
      maxDataSize: 4096,
      maxImageSize: 512 * 1024,
      supportsRenotify: true,
      supportsRequireInteraction: true,
      supportsTimestamp: true,
      supportsDirection: true,
      supportsReply: false,
    },
  },
  Safari: {
    browserName: 'Safari',
    minVersion: '16',
    features: {
      maxTitleLength: 30, // Safari has stricter limits
      maxBodyLength: 100,
      maxActions: 1, // Safari limits to 1 action
      supportsImage: false, // Safari doesn't support images
      supportsActions: true,
      supportsSilent: false,
      supportsVibrate: false,
      supportsBadge: true,
      supportsTag: true,
      supportsData: true,
      maxDataSize: 4096,
      maxImageSize: 0,
      supportsRenotify: false,
      supportsRequireInteraction: false,
      supportsTimestamp: false,
      supportsDirection: true,
      supportsReply: true, // Safari 16.4+ supports inline replies
    },
  },
  'Mobile Safari': {
    browserName: 'Mobile Safari',
    minVersion: '16',
    features: {
      maxTitleLength: 30,
      maxBodyLength: 100,
      maxActions: 1,
      supportsImage: false,
      supportsActions: true,
      supportsSilent: false,
      supportsVibrate: false,
      supportsBadge: true,
      supportsTag: true,
      supportsData: true,
      maxDataSize: 4096,
      maxImageSize: 0,
      supportsRenotify: false,
      supportsRequireInteraction: false,
      supportsTimestamp: false,
      supportsDirection: true,
      supportsReply: true,
    },
  },
  Edge: {
    browserName: 'Edge',
    minVersion: '17',
    features: {
      maxTitleLength: 50,
      maxBodyLength: 120,
      maxActions: 2,
      supportsImage: true,
      supportsActions: true,
      supportsSilent: false,
      supportsVibrate: true,
      supportsBadge: true,
      supportsTag: true,
      supportsData: true,
      maxDataSize: 4096,
      maxImageSize: 512 * 1024,
      supportsRenotify: true,
      supportsRequireInteraction: true,
      supportsTimestamp: true,
      supportsDirection: true,
      supportsReply: false,
    },
  },
  Opera: {
    browserName: 'Opera',
    minVersion: '30',
    features: {
      maxTitleLength: 50,
      maxBodyLength: 120,
      maxActions: 2,
      supportsImage: true,
      supportsActions: true,
      supportsSilent: false,
      supportsVibrate: true,
      supportsBadge: true,
      supportsTag: true,
      supportsData: true,
      maxDataSize: 4096,
      maxImageSize: 512 * 1024,
      supportsRenotify: true,
      supportsRequireInteraction: true,
      supportsTimestamp: true,
      supportsDirection: true,
      supportsReply: false,
    },
  },
  Samsung: {
    browserName: 'Samsung Internet',
    minVersion: '4',
    features: {
      maxTitleLength: 50,
      maxBodyLength: 120,
      maxActions: 2,
      supportsImage: true,
      supportsActions: true,
      supportsSilent: false,
      supportsVibrate: true,
      supportsBadge: true,
      supportsTag: true,
      supportsData: true,
      maxDataSize: 4096,
      maxImageSize: 512 * 1024,
      supportsRenotify: true,
      supportsRequireInteraction: true,
      supportsTimestamp: true,
      supportsDirection: true,
      supportsReply: false,
    },
  },
};

/**
 * Platform-specific defaults (when browser detection fails)
 */
const PLATFORM_DEFAULTS: Record<string, BrowserCapability> = {
  ios: {
    browserName: 'iOS Webview',
    minVersion: '16',
    features: {
      maxTitleLength: 30,
      maxBodyLength: 100,
      maxActions: 1,
      supportsImage: false,
      supportsActions: true,
      supportsSilent: false,
      supportsVibrate: false,
      supportsBadge: true,
      supportsTag: true,
      supportsData: true,
      maxDataSize: 4096,
      maxImageSize: 0,
      supportsRenotify: false,
      supportsRequireInteraction: false,
      supportsTimestamp: false,
      supportsDirection: true,
      supportsReply: true,
    },
  },
  android: {
    browserName: 'Android Browser',
    minVersion: '4',
    features: {
      maxTitleLength: 50,
      maxBodyLength: 120,
      maxActions: 2,
      supportsImage: true,
      supportsActions: true,
      supportsSilent: false,
      supportsVibrate: true,
      supportsBadge: true,
      supportsTag: true,
      supportsData: true,
      maxDataSize: 4096,
      maxImageSize: 512 * 1024,
      supportsRenotify: true,
      supportsRequireInteraction: true,
      supportsTimestamp: true,
      supportsDirection: true,
      supportsReply: false,
    },
  },
  desktop: {
    browserName: 'Desktop Browser',
    minVersion: '1',
    features: {
      maxTitleLength: 50,
      maxBodyLength: 120,
      maxActions: 2,
      supportsImage: true,
      supportsActions: true,
      supportsSilent: false,
      supportsVibrate: false,
      supportsBadge: true,
      supportsTag: true,
      supportsData: true,
      maxDataSize: 4096,
      maxImageSize: 512 * 1024,
      supportsRenotify: true,
      supportsRequireInteraction: true,
      supportsTimestamp: true,
      supportsDirection: true,
      supportsReply: false,
    },
  },
  tablet: {
    browserName: 'Tablet Browser',
    minVersion: '1',
    features: {
      maxTitleLength: 50,
      maxBodyLength: 120,
      maxActions: 2,
      supportsImage: true,
      supportsActions: true,
      supportsSilent: false,
      supportsVibrate: true,
      supportsBadge: true,
      supportsTag: true,
      supportsData: true,
      maxDataSize: 4096,
      maxImageSize: 512 * 1024,
      supportsRenotify: true,
      supportsRequireInteraction: true,
      supportsTimestamp: true,
      supportsDirection: true,
      supportsReply: false,
    },
  },
};

export const capabilityService = {
  /**
   * Get capabilities for a specific browser
   */
  getCapabilities(browserName: string, browserVersion?: string): BrowserCapability | null {
    // Try to find exact match
    const exactKey = Object.keys(BROWSER_CAPABILITIES).find(
      (key) => key.toLowerCase() === browserName.toLowerCase()
    );

    if (exactKey) {
      const capabilities = BROWSER_CAPABILITIES[exactKey];
      if (browserVersion) {
        return this.adjustByVersion(capabilities, browserVersion);
      }
      return capabilities;
    }

    // Try partial match
    const partialKey = Object.keys(BROWSER_CAPABILITIES).find(
      (key) =>
        browserName.toLowerCase().includes(key.toLowerCase()) ||
        key.toLowerCase().includes(browserName.toLowerCase())
    );

    if (partialKey) {
      const capabilities = BROWSER_CAPABILITIES[partialKey];
      if (browserVersion) {
        return this.adjustByVersion(capabilities, browserVersion);
      }
      return capabilities;
    }

    return null;
  },

  /**
   * Get capabilities for a platform (fallback)
   */
  getPlatformDefaults(platform: string): BrowserCapability {
    return PLATFORM_DEFAULTS[platform] || PLATFORM_DEFAULTS.desktop;
  },

  /**
   * Adjust capabilities based on browser version
   */
  adjustByVersion(capabilities: BrowserCapability, version: string): BrowserCapability {
    const [major] = version.split('.').map(Number);

    if (!major) return capabilities;

    // Reduce features for very old versions
    if (major < 50) {
      return {
        ...capabilities,
        features: {
          ...capabilities.features,
          supportsImage: false,
          supportsActions: major >= 44,
        },
      };
    }

    return capabilities;
  },

  /**
   * Check if a payload can be sent to a browser with given capabilities
   */
  canSendPayload(
    payload: PushPayload,
    capabilities: BrowserCapability
  ): {
    canSend: boolean;
    issues: string[];
    warnings: string[];
  } {
    const issues: string[] = [];
    const warnings: string[] = [];

    // Check title length
    if (payload.title?.length > capabilities.features.maxTitleLength) {
      issues.push(
        `Title too long (${payload.title.length} > ${capabilities.features.maxTitleLength})`
      );
    }

    // Check body length
    if (payload.body && payload.body.length > capabilities.features.maxBodyLength) {
      issues.push(
        `Body too long (${payload.body.length} > ${capabilities.features.maxBodyLength})`
      );
    }

    // Check actions count
    if (payload.actions && payload.actions.length > capabilities.features.maxActions) {
      issues.push(
        `Too many actions (${payload.actions.length} > ${capabilities.features.maxActions})`
      );
    }

    // Check image support
    if (payload.image && !capabilities.features.supportsImage) {
      issues.push(`Images not supported on ${capabilities.browserName}`);
    }

    // Check silent support
    if (payload.silent && !capabilities.features.supportsSilent) {
      warnings.push(`Silent notifications not supported on ${capabilities.browserName}`);
    }

    // Check vibrate support
    if (payload.vibrate && !capabilities.features.supportsVibrate) {
      warnings.push(`Vibration not supported on ${capabilities.browserName}`);
    }

    // Check renotify support
    if (payload.renotify && !capabilities.features.supportsRenotify) {
      warnings.push(`Renotify not supported on ${capabilities.browserName}`);
    }

    // Check requireInteraction support
    if (payload.requireInteraction && !capabilities.features.supportsRequireInteraction) {
      warnings.push(`requireInteraction not supported on ${capabilities.browserName}`);
    }

    // Check timestamp support
    if (payload.timestamp && !capabilities.features.supportsTimestamp) {
      warnings.push(`Custom timestamp not supported on ${capabilities.browserName}`);
    }

    // Check data size
    const dataSize = JSON.stringify(payload.data || {}).length;
    if (dataSize > capabilities.features.maxDataSize) {
      issues.push(`Data too large (${dataSize} > ${capabilities.features.maxDataSize} bytes)`);
    }

    return {
      canSend: issues.length === 0,
      issues,
      warnings,
    };
  },

  /**
   * Get all supported browsers
   */
  getSupportedBrowsers(): string[] {
    return Object.keys(BROWSER_CAPABILITIES);
  },

  /**
   * Get capabilities summary for UI display
   */
  getCapabilitiesSummary(
    browserName: string,
    browserVersion?: string
  ): {
    browser: string;
    features: string[];
    limitations: string[];
  } {
    const capabilities = this.getCapabilities(browserName, browserVersion);

    if (!capabilities) {
      return {
        browser: browserName,
        features: [],
        limitations: ['Unknown browser - using defaults'],
      };
    }

    const features: string[] = [];
    const limitations: string[] = [];

    const f = capabilities.features;

    if (f.supportsImage) features.push('Images');
    if (f.supportsActions) features.push(`Actions (max ${f.maxActions})`);
    if (f.supportsVibrate) features.push('Vibration');
    if (f.supportsBadge) features.push('Badge');
    if (f.supportsTag) features.push('Tag-based deduplication');
    if (f.supportsRenotify) features.push('Renotify');
    if (f.supportsRequireInteraction) features.push('Require interaction');
    if (f.supportsTimestamp) features.push('Custom timestamp');
    if (f.supportsDirection) features.push('Text direction');
    if (f.supportsReply) features.push('Inline replies');

    if (!f.supportsImage) limitations.push('No image support');
    if (!f.supportsActions) limitations.push('No action buttons');
    if (!f.supportsVibrate) limitations.push('No vibration');
    if (!f.supportsSilent && limitations.includes('Silent mode'))
      limitations.push('No silent mode');
    if (f.maxTitleLength < 50) limitations.push(`Short title limit (${f.maxTitleLength})`);
    if (f.maxBodyLength < 120) limitations.push(`Short body limit (${f.maxBodyLength})`);

    return {
      browser: `${capabilities.browserName} ${browserVersion || ''}+`,
      features,
      limitations,
    };
  },
};

export default capabilityService;
