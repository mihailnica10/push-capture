import {
  faBell,
  faCheck,
  faDatabase,
  faEye,
  faEyeSlash,
  faFloppyDisk,
  faGear,
  faKey,
  faPalette,
  faRotate,
  faSliders,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../lib/api';
import { cn } from '../styles/theme';

type TabKey = 'general' | 'limits' | 'retention' | 'vapid' | 'appearance';

const tabs: Array<{ key: TabKey; label: string; icon: any }> = [
  { key: 'general', label: 'General', icon: faGear },
  { key: 'limits', label: 'Limits', icon: faSliders },
  { key: 'retention', label: 'Data Retention', icon: faDatabase },
  { key: 'vapid', label: 'VAPID Keys', icon: faKey },
  { key: 'appearance', label: 'Appearance', icon: faPalette },
];

export function Settings() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>('general');
  const [showVapid, setShowVapid] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.getSettingsGrouped(),
  });

  const settings = settingsData?.settings || {};

  const updateMutation = useMutation({
    mutationFn: async (updates: Array<{ key: string; value: unknown; category?: string }>) => {
      setSaveStatus('saving');
      await api.updateSettingsBatch(updates);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: () => {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    },
  });

  const getSettingValue = (key: string, defaultValue: unknown = ''): unknown => {
    for (const category of Object.keys(settings)) {
      if (settings[category]?.[key] !== undefined) {
        return settings[category][key];
      }
    }
    return defaultValue;
  };

  const updateSetting = (key: string, value: unknown, category?: string) => {
    const currentSettings = [];
    for (const cat of Object.keys(settings)) {
      for (const k of Object.keys(settings[cat])) {
        currentSettings.push({ key: k, value: settings[cat][k], category: cat });
      }
    }
    const index = currentSettings.findIndex((s) => s.key === key);
    if (index >= 0) {
      currentSettings[index] = { key, value, category };
    } else {
      currentSettings.push({ key, value, category });
    }
    updateMutation.mutate(currentSettings);
  };

  const saveStatusIcon = {
    idle: null,
    saving: <FontAwesomeIcon icon={faRotate} className="animate-spin" />,
    saved: <FontAwesomeIcon icon={faCheck} className="text-success-500" />,
    error: <FontAwesomeIcon icon={faTriangleExclamation} className="text-error-500" />,
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Settings</h1>
          <p className="text-sm text-neutral-500 mt-1">Configure your push notification system</p>
        </div>
        <div className="flex items-center gap-3">
          {saveStatus !== 'idle' && (
            <span className="flex items-center gap-2 text-sm">
              {saveStatusIcon[saveStatus]}
              {saveStatus === 'saved' && 'Changes saved'}
              {saveStatus === 'error' && 'Error saving changes'}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
            <nav className="flex lg:flex-col">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors w-full',
                    activeTab === tab.key
                      ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-600'
                      : 'text-neutral-600 hover:bg-neutral-50 border-l-4 border-transparent'
                  )}
                >
                  <FontAwesomeIcon icon={tab.icon} />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          {isLoading ? (
            <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center text-neutral-500">
              Loading settings...
            </div>
          ) : (
            <>
              {/* General Settings */}
              {activeTab === 'general' && (
                <div className="space-y-4">
                  <SettingCard
                    title="General Configuration"
                    description="Basic application settings"
                  >
                    <SettingInput
                      label="Application Name"
                      value={getSettingValue('app.name', 'Push Capture') as string}
                      onChange={(v) => updateSetting('app.name', v, 'general')}
                      description="The name of your application"
                    />
                    <SettingInput
                      label="Default Timezone"
                      type="select"
                      value={getSettingValue('app.timezone', 'UTC') as string}
                      onChange={(v) => updateSetting('app.timezone', v, 'general')}
                      description="Default timezone for scheduled campaigns"
                      options={[
                        { value: 'UTC', label: 'UTC' },
                        { value: 'America/New_York', label: 'Eastern Time' },
                        { value: 'America/Chicago', label: 'Central Time' },
                        { value: 'America/Denver', label: 'Mountain Time' },
                        { value: 'America/Los_Angeles', label: 'Pacific Time' },
                        { value: 'Europe/London', label: 'GMT (London)' },
                        { value: 'Europe/Paris', label: 'CET (Paris)' },
                        { value: 'Europe/Berlin', label: 'CET (Berlin)' },
                        { value: 'Asia/Tokyo', label: 'JST (Tokyo)' },
                        { value: 'Asia/Shanghai', label: 'CST (Shanghai)' },
                        { value: 'Asia/Kolkata', label: 'IST (India)' },
                        { value: 'Australia/Sydney', label: 'AEDT (Sydney)' },
                      ]}
                    />
                    <SettingInput
                      label="Default Language"
                      type="select"
                      value={getSettingValue('app.language', 'en') as string}
                      onChange={(v) => updateSetting('app.language', v, 'general')}
                      description="Default language for notifications"
                      options={[
                        { value: 'en', label: 'English' },
                        { value: 'es', label: 'Spanish' },
                        { value: 'fr', label: 'French' },
                        { value: 'de', label: 'German' },
                        { value: 'ja', label: 'Japanese' },
                        { value: 'zh', label: 'Chinese' },
                      ]}
                    />
                  </SettingCard>
                </div>
              )}

              {/* Limits Settings */}
              {activeTab === 'limits' && (
                <div className="space-y-4">
                  <SettingCard
                    title="Rate Limits"
                    description="Control the frequency of notifications"
                  >
                    <SettingInput
                      label="Max Daily Notifications"
                      type="number"
                      value={getSettingValue('limits.maxDailyNotifications', 10) as number}
                      onChange={(v) =>
                        updateSetting(
                          'limits.maxDailyNotifications',
                          parseInt(v, 10) || 10,
                          'limits'
                        )
                      }
                      description="Maximum notifications per subscriber per day"
                      min={1}
                      max={100}
                    />
                    <SettingInput
                      label="Max Hourly Notifications"
                      type="number"
                      value={getSettingValue('limits.maxHourlyNotifications', 3) as number}
                      onChange={(v) =>
                        updateSetting(
                          'limits.maxHourlyNotifications',
                          parseInt(v, 10) || 3,
                          'limits'
                        )
                      }
                      description="Maximum notifications per subscriber per hour"
                      min={1}
                      max={20}
                    />
                    <SettingInput
                      label="Max Campaign Sends Per Hour"
                      type="number"
                      value={getSettingValue('limits.maxCampaignPerHour', 1000) as number}
                      onChange={(v) =>
                        updateSetting(
                          'limits.maxCampaignPerHour',
                          parseInt(v, 10) || 1000,
                          'limits'
                        )
                      }
                      description="Maximum total campaign sends per hour across all subscribers"
                      min={100}
                      max={10000}
                    />
                  </SettingCard>

                  <InfoBox>
                    <FontAwesomeIcon icon={faBell} className="text-primary-500" />
                    <span>
                      These limits help prevent overwhelming your subscribers. Limits are applied
                      per-subscriber for daily/hourly caps, and globally for campaign sends.
                    </span>
                  </InfoBox>
                </div>
              )}

              {/* Retention Settings */}
              {activeTab === 'retention' && (
                <div className="space-y-4">
                  <SettingCard
                    title="Data Retention"
                    description="Configure how long to keep different types of data"
                  >
                    <SettingInput
                      label="Notification Events"
                      type="number"
                      value={getSettingValue('retention.eventsDays', 90) as number}
                      onChange={(v) =>
                        updateSetting('retention.eventsDays', parseInt(v, 10) || 90, 'retention')
                      }
                      description="Days to keep notification event history"
                      min={7}
                      max={365}
                    />
                    <SettingInput
                      label="Traffic Captures"
                      type="number"
                      value={getSettingValue('retention.trafficDays', 30) as number}
                      onChange={(v) =>
                        updateSetting('retention.trafficDays', parseInt(v, 10) || 30, 'retention')
                      }
                      description="Days to keep HTTP traffic captures"
                      min={1}
                      max={90}
                    />
                    <SettingInput
                      label="Analytics Data"
                      type="number"
                      value={getSettingValue('retention.analyticsDays', 365) as number}
                      onChange={(v) =>
                        updateSetting(
                          'retention.analyticsDays',
                          parseInt(v, 10) || 365,
                          'retention'
                        )
                      }
                      description="Days to keep aggregated analytics"
                      min={30}
                      max={730}
                    />
                  </SettingCard>

                  <InfoBox variant="warning">
                    <FontAwesomeIcon icon={faTriangleExclamation} className="text-warning-500" />
                    <span>
                      Longer retention periods require more database storage. Old data is
                      automatically cleaned up based on these settings.
                    </span>
                  </InfoBox>
                </div>
              )}

              {/* VAPID Keys */}
              {activeTab === 'vapid' && (
                <div className="space-y-4">
                  <SettingCard
                    title="VAPID Keys"
                    description="Voluntary Application Server Identification keys for push notifications"
                  >
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                          Public Key
                        </label>
                        <div className="font-mono text-xs bg-neutral-100 rounded-lg p-3 break-all">
                          {getSettingValue('vapid.publicKey', 'BM...') as string}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                          Private Key
                        </label>
                        <div className="flex items-center gap-2">
                          <div className="font-mono text-xs bg-neutral-100 rounded-lg p-3 flex-1 break-all">
                            {showVapid
                              ? (getSettingValue('vapid.privateKey', '***') as string)
                              : '•••••••••••••••••••••••••••••••••'}
                          </div>
                          <button
                            onClick={() => setShowVapid(!showVapid)}
                            className="p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-200 rounded-lg"
                          >
                            <FontAwesomeIcon icon={showVapid ? faEyeSlash : faEye} />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 pt-4 border-t border-neutral-200">
                        <button className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 rounded-lg">
                          <FontAwesomeIcon icon={faRotate} />
                          Rotate Keys
                        </button>
                        <div className="flex-1" />
                        <button className="flex items-center gap-2 px-4 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-lg">
                          <FontAwesomeIcon icon={faFloppyDisk} />
                          Generate New Keys
                        </button>
                      </div>
                    </div>
                  </SettingCard>

                  <InfoBox>
                    <FontAwesomeIcon icon={faKey} className="text-primary-500" />
                    <span>
                      VAPID keys are used to authenticate push notification sends. Keep your private
                      key secret and never share it. You should rotate keys periodically for
                      security.
                    </span>
                  </InfoBox>
                </div>
              )}

              {/* Appearance Settings */}
              {activeTab === 'appearance' && (
                <div className="space-y-4">
                  <SettingCard
                    title="Appearance"
                    description="Customize the admin dashboard appearance"
                  >
                    <SettingInput
                      label="Theme"
                      type="select"
                      value={getSettingValue('ui.theme', 'light') as string}
                      onChange={(v) => updateSetting('ui.theme', v, 'ui')}
                      description="Choose your preferred theme"
                      options={[
                        { value: 'light', label: 'Light' },
                        { value: 'dark', label: 'Dark' },
                        { value: 'system', label: 'System' },
                      ]}
                    />
                    <SettingInput
                      label="UI Timezone"
                      type="select"
                      value={getSettingValue('ui.timezone', 'UTC') as string}
                      onChange={(v) => updateSetting('ui.timezone', v, 'ui')}
                      description="Timezone for displaying timestamps"
                      options={[
                        { value: 'UTC', label: 'UTC' },
                        { value: 'America/New_York', label: 'Eastern Time' },
                        { value: 'America/Los_Angeles', label: 'Pacific Time' },
                        { value: 'Europe/London', label: 'London' },
                        { value: 'Asia/Tokyo', label: 'Tokyo' },
                      ]}
                    />
                    <SettingInput
                      label="Date Format"
                      type="select"
                      value={getSettingValue('ui.dateFormat', 'MM/DD/YYYY') as string}
                      onChange={(v) => updateSetting('ui.dateFormat', v, 'ui')}
                      description="Preferred date format"
                      options={[
                        { value: 'MM/DD/YYYY', label: '01/31/2024' },
                        { value: 'DD/MM/YYYY', label: '31/01/2024' },
                        { value: 'YYYY-MM-DD', label: '2024-01-31' },
                        { value: 'MMM D, YYYY', label: 'Jan 1, 2024' },
                      ]}
                    />
                  </SettingCard>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper Components
interface SettingCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

function SettingCard({ title, description, children }: SettingCardProps) {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
        {description && <p className="text-sm text-neutral-500 mt-1">{description}</p>}
      </div>
      <div className="space-y-6">{children}</div>
    </div>
  );
}

interface SettingInputProps {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  description?: string;
  type?: 'text' | 'number' | 'select';
  options?: Array<{ value: string; label: string }>;
  min?: number;
  max?: number;
}

function SettingInput({
  label,
  value,
  onChange,
  description,
  type = 'text',
  options,
  min,
  max,
}: SettingInputProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-2">{label}</label>
      {type === 'select' ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          {options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min={min}
          max={max}
          className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      )}
      {description && <p className="text-xs text-neutral-500 mt-1">{description}</p>}
    </div>
  );
}

interface InfoBoxProps {
  children: React.ReactNode;
  variant?: 'info' | 'warning';
}

function InfoBox({ children, variant = 'info' }: InfoBoxProps) {
  const colors = {
    info: 'bg-primary-50 text-primary-700 border-primary-200',
    warning: 'bg-warning-50 text-warning-700 border-warning-200',
  };

  return (
    <div className={cn('flex items-start gap-3 p-4 rounded-lg border', colors[variant])}>
      {children}
    </div>
  );
}
