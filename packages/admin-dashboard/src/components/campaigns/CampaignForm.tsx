import {
  faAndroid as faAndroidBrand,
  faApple as faAppleBrand,
} from '@fortawesome/free-brands-svg-icons';
import {
  faBell,
  faBullseye,
  faCalendar,
  faClock,
  faCog,
  faDesktop,
  faEye,
  faImage,
  faLayerGroup,
  faLink,
  faPaperPlane,
  faSave,
  faTag,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';
import { ActionButtonsEditor, NotificationAction } from './ActionButtonsEditor';
import { DeviceTargetPicker } from './DeviceTargetPicker';
import { NotificationPreview } from './NotificationPreview';

interface CampaignFormProps {
  campaign?: {
    id?: string;
    name: string;
    description?: string;
    titleTemplate: string;
    bodyTemplate?: string;
    iconUrl?: string;
    imageUrl?: string;
    badgeUrl?: string;
    clickUrl?: string;
    tag?: string;
    actions?: NotificationAction[];
    targetSegment?: {
      platforms?: string[];
      browsers?: string[];
      deviceTypes?: string[];
    };
    scheduledAt?: string;
    timezone?: string;
    priority?: 'low' | 'normal' | 'high';
    urgency?: 'very-low' | 'low' | 'normal' | 'high';
    ttlSeconds?: number;
  };
  onSave: (campaign: Record<string, unknown>) => Promise<void>;
  onCancel?: () => void;
  isSaving?: boolean;
  mode?: 'create' | 'edit';
}

const COMMON_TIMEZONES = [
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
];

const PREDEFINED_TEMPLATES = [
  {
    name: 'New Announcement',
    title: '📢 {{title}}',
    body: 'Tap to view the full announcement.',
    category: 'announcement',
  },
  {
    name: 'Promotion',
    title: '🎉 {{offer}} - Limited Time!',
    body: "Don't miss out on this exclusive offer. Tap to claim now!",
    category: 'promotion',
  },
  {
    name: 'Update Available',
    title: '🔄 Update Available',
    body: 'A new version is ready to install. Tap to update.',
    category: 'update',
  },
  {
    name: 'Reminder',
    title: '⏰ Reminder: {{event}}',
    body: 'This is a reminder about your upcoming event. Tap for details.',
    category: 'reminder',
  },
];

export function CampaignForm({
  campaign,
  onSave,
  onCancel,
  isSaving = false,
  mode = 'create',
}: CampaignFormProps) {
  // Form state
  const [name, setName] = useState(campaign?.name || '');
  const [description, setDescription] = useState(campaign?.description || '');
  const [titleTemplate, setTitleTemplate] = useState(campaign?.titleTemplate || '');
  const [bodyTemplate, setBodyTemplate] = useState(campaign?.bodyTemplate || '');
  const [iconUrl, setIconUrl] = useState(campaign?.iconUrl || '');
  const [imageUrl, setImageUrl] = useState(campaign?.imageUrl || '');
  const [badgeUrl, setBadgeUrl] = useState(campaign?.badgeUrl || '');
  const [clickUrl, setClickUrl] = useState(campaign?.clickUrl || '');
  const [tag, setTag] = useState(campaign?.tag || '');
  const [actions, setActions] = useState<NotificationAction[]>(campaign?.actions || []);
  const [scheduledAt, setScheduledAt] = useState(campaign?.scheduledAt || '');
  const [timezone, setTimezone] = useState(
    campaign?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
  );
  const [priority, setPriority] = useState<'low' | 'normal' | 'high'>(
    campaign?.priority || 'normal'
  );
  const [urgency, setUrgency] = useState<'very-low' | 'low' | 'normal' | 'high'>(
    campaign?.urgency || 'normal'
  );
  const [ttlSeconds, setTtlSeconds] = useState(campaign?.ttlSeconds || 86400);

  // Targeting state
  const [targetPlatforms, setTargetPlatforms] = useState<string[]>(
    campaign?.targetSegment?.platforms || []
  );
  const [targetBrowsers, setTargetBrowsers] = useState<string[]>(
    campaign?.targetSegment?.browsers || []
  );
  const [targetDeviceTypes, setTargetDeviceTypes] = useState<string[]>(
    campaign?.targetSegment?.deviceTypes || []
  );

  // UI state
  const [showPreview, setShowPreview] = useState(true);
  const [activeTab, setActiveTab] = useState<'content' | 'targeting' | 'scheduling' | 'actions'>(
    'content'
  );

  // Validate form
  const isValid = name.trim() && titleTemplate.trim();

  const getPreviewPlatform = (): 'ios' | 'android' | 'desktop' | 'tablet' => {
    if (targetPlatforms.includes('ios')) return 'ios';
    if (targetPlatforms.includes('android')) return 'android';
    if (targetPlatforms.includes('tablet')) return 'tablet';
    return 'desktop';
  };

  const getPreviewDeviceType = (): 'mobile' | 'desktop' | 'tablet' => {
    if (targetDeviceTypes.includes('mobile')) return 'mobile';
    if (targetDeviceTypes.includes('tablet')) return 'tablet';
    return 'desktop';
  };

  const handleSubmit = async (e: React.FormEvent, scheduleCampaign = false) => {
    e.preventDefault();
    if (!isValid) return;

    const data = {
      name: name.trim(),
      description: description.trim() || undefined,
      titleTemplate: titleTemplate.trim(),
      bodyTemplate: bodyTemplate.trim() || undefined,
      iconUrl: iconUrl.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
      badgeUrl: badgeUrl.trim() || undefined,
      clickUrl: clickUrl.trim() || undefined,
      tag: tag.trim() || undefined,
      actions: actions.length > 0 ? actions : undefined,
      targetSegment:
        targetPlatforms.length > 0 || targetBrowsers.length > 0 || targetDeviceTypes.length > 0
          ? {
              platforms: targetPlatforms.length > 0 ? targetPlatforms : undefined,
              browsers: targetBrowsers.length > 0 ? targetBrowsers : undefined,
              deviceTypes: targetDeviceTypes.length > 0 ? targetDeviceTypes : undefined,
            }
          : undefined,
      scheduledAt: scheduleCampaign && scheduledAt ? scheduledAt : undefined,
      timezone,
      priority,
      urgency,
      ttlSeconds,
    };

    await onSave(data);
  };

  const applyTemplate = (template: (typeof PREDEFINED_TEMPLATES)[0]) => {
    setTitleTemplate(template.title);
    setBodyTemplate(template.body);
  };

  return (
    <div className="flex gap-6">
      {/* Main Form */}
      <div className="flex-1 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {mode === 'create' ? 'Create New Campaign' : 'Edit Campaign'}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {mode === 'create'
                ? 'Create and send push notifications to your subscribers.'
                : 'Update your campaign settings.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="p-2 text-gray-400 hover:text-gray-600"
            title="Toggle preview"
          >
            <FontAwesomeIcon icon={faEye} />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex gap-1 -mb-px">
            {[
              { key: 'content', label: 'Content', icon: faBell },
              { key: 'targeting', label: 'Targeting', icon: faBullseye },
              { key: 'actions', label: 'Actions', icon: faLayerGroup },
              { key: 'scheduling', label: 'Schedule', icon: faClock },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as 'content' | 'targeting' | 'scheduling' | 'actions')}
                className={`
                  flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors
                  ${
                    activeTab === tab.key
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <FontAwesomeIcon icon={tab.icon} className="text-xs" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <form id="campaign-form" onSubmit={(e) => handleSubmit(e, false)}>
          {/* Content Tab */}
          {activeTab === 'content' && (
            <div className="space-y-4">
              {/* Campaign Name & Description */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="campaign-name" className="block text-sm font-medium text-gray-700 mb-1">
                    Campaign Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="campaign-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Summer Sale 2024"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="campaign-description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description (internal)
                  </label>
                  <input
                    id="campaign-description"
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Internal notes about this campaign"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Quick Templates */}
              <div>
                <span className="block text-sm font-medium text-gray-700 mb-2">
                  Quick Templates
                </span>
                <div className="flex flex-wrap gap-2">
                  {PREDEFINED_TEMPLATES.map((template) => (
                    <button
                      key={template.name}
                      type="button"
                      onClick={() => applyTemplate(template)}
                      className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
                    >
                      {template.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title & Body */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="campaign-title" className="block text-sm font-medium text-gray-700 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="campaign-title"
                    type="text"
                    value={titleTemplate}
                    onChange={(e) => setTitleTemplate(e.target.value)}
                    placeholder="Your notification title"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="campaign-body" className="block text-sm font-medium text-gray-700 mb-1">
                    Body Message
                  </label>
                  <textarea
                    id="campaign-body"
                    value={bodyTemplate}
                    onChange={(e) => setBodyTemplate(e.target.value)}
                    placeholder="Your notification message body..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Media URLs */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label htmlFor="campaign-icon" className="block text-sm font-medium text-gray-700 mb-1">
                    <FontAwesomeIcon icon={faImage} className="text-gray-400 mr-1" />
                    Icon URL
                  </label>
                  <input
                    id="campaign-icon"
                    type="url"
                    value={iconUrl}
                    onChange={(e) => setIconUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="campaign-image" className="block text-sm font-medium text-gray-700 mb-1">
                    <FontAwesomeIcon icon={faImage} className="text-gray-400 mr-1" />
                    Image URL
                  </label>
                  <input
                    id="campaign-image"
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="campaign-badge" className="block text-sm font-medium text-gray-700 mb-1">
                    <FontAwesomeIcon icon={faTag} className="text-gray-400 mr-1" />
                    Badge URL
                  </label>
                  <input
                    id="campaign-badge"
                    type="url"
                    value={badgeUrl}
                    onChange={(e) => setBadgeUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
              </div>

              {/* Click URL */}
              <div>
                <label htmlFor="campaign-click-url" className="block text-sm font-medium text-gray-700 mb-1">
                  <FontAwesomeIcon icon={faLink} className="text-gray-400 mr-1" />
                  Click / Deep Link URL
                </label>
                <input
                  id="campaign-click-url"
                  type="url"
                  value={clickUrl}
                  onChange={(e) => setClickUrl(e.target.value)}
                  placeholder="https://yoursite.com/offer"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Tag */}
              <div>
                <label htmlFor="campaign-tag" className="block text-sm font-medium text-gray-700 mb-1">
                  <FontAwesomeIcon icon={faTag} className="text-gray-400 mr-1" />
                  Notification Tag (prevents duplicates)
                </label>
                <input
                  id="campaign-tag"
                  type="text"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  placeholder="e.g., summer-sale-2024"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {/* Targeting Tab */}
          {activeTab === 'targeting' && (
            <div className="space-y-4">
              <DeviceTargetPicker
                platforms={targetPlatforms}
                browsers={targetBrowsers}
                deviceTypes={targetDeviceTypes}
                onChange={({ platforms, browsers, deviceTypes }) => {
                  setTargetPlatforms(platforms || []);
                  setTargetBrowsers(browsers || []);
                  setTargetDeviceTypes(deviceTypes || []);
                }}
              />

              {(targetPlatforms.length > 0 ||
                targetBrowsers.length > 0 ||
                targetDeviceTypes.length > 0) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <FontAwesomeIcon icon={faBullseye} className="text-blue-500 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium">Targeting Active</p>
                      <p className="text-blue-600 mt-1">
                        This campaign will only be sent to devices matching your criteria.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions Tab */}
          {activeTab === 'actions' && (
            <div className="space-y-4">
              <ActionButtonsEditor
                actions={actions}
                onChange={setActions}
                platform={getPreviewPlatform()}
              />
            </div>
          )}

          {/* Scheduling Tab */}
          {activeTab === 'scheduling' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="schedule-for" className="block text-sm font-medium text-gray-700 mb-1">
                    <FontAwesomeIcon icon={faCalendar} className="text-gray-400 mr-1" />
                    Schedule For
                  </label>
                  <input
                    id="schedule-for"
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-1">
                    Timezone
                  </label>
                  <select
                    id="timezone"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {COMMON_TIMEZONES.map((tz) => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    id="priority"
                    value={priority}
                    // biome-ignore lint/suspicious/noExplicitAny: Select value requires type assertion
                    onChange={(e) => setPriority(e.target.value as 'low' | 'normal' | 'high')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="urgency" className="block text-sm font-medium text-gray-700 mb-1">
                    Urgency
                  </label>
                  <select
                    id="urgency"
                    value={urgency}
                    // biome-ignore lint/suspicious/noExplicitAny: Select value requires type assertion
                    onChange={(e) =>
                      setUrgency(e.target.value as 'very-low' | 'low' | 'normal' | 'high')
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="very-low">Very Low</option>
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="ttl" className="block text-sm font-medium text-gray-700 mb-1">
                    TTL (seconds)
                  </label>
                  <input
                    id="ttl"
                    type="number"
                    value={ttlSeconds}
                    onChange={(e) => setTtlSeconds(Number(e.target.value))}
                    min={60}
                    max={2419200}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Delivery Settings Info */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <FontAwesomeIcon icon={faCog} className="text-gray-400 mt-0.5" />
                  <div className="text-sm text-gray-600">
                    <p className="font-medium">Delivery Settings</p>
                    <ul className="mt-2 space-y-1 text-xs">
                      <li>
                        • <strong>TTL:</strong> How long the push service should retain the message
                        if the device is offline
                      </li>
                      <li>
                        • <strong>Priority/Urgency:</strong> Higher priority messages may be
                        delivered faster
                      </li>
                      <li>
                        • <strong>Scheduling:</strong> Campaign will be sent automatically at the
                        specified time
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            )}

            {scheduledAt && (
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                disabled={isSaving || !isValid}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FontAwesomeIcon icon={faClock} />
                {isSaving ? 'Scheduling...' : 'Schedule Campaign'}
              </button>
            )}

            <button
              type="submit"
              disabled={isSaving || !isValid}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FontAwesomeIcon icon={scheduledAt ? faSave : faPaperPlane} />
              {isSaving ? 'Saving...' : scheduledAt ? 'Save as Draft' : 'Send Now'}
            </button>
          </div>
        </form>
      </div>

      {/* Preview Sidebar */}
      {showPreview && (
        <div className="w-96">
          <div className="sticky top-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Preview</h3>
              <div className="flex gap-1">
                {[
                  { value: 'ios', label: 'iOS', icon: faAppleBrand },
                  { value: 'android', label: 'Android', icon: faAndroidBrand },
                  { value: 'desktop', label: 'Desktop', icon: faDesktop },
                ].map((platform) => (
                  <button
                    key={platform.value}
                    type="button"
                    onClick={() => {
                      if (platform.value === 'ios') setTargetPlatforms(['ios']);
                      else if (platform.value === 'android') setTargetPlatforms(['android']);
                      else setTargetPlatforms([]);
                    }}
                    className={`
                      p-1.5 rounded transition-colors
                      ${
                        targetPlatforms.includes(platform.value)
                          ? 'bg-blue-100 text-blue-600'
                          : 'text-gray-400 hover:bg-gray-100'
                      }
                    `}
                    title={`Preview on ${platform.label}`}
                  >
                    <FontAwesomeIcon icon={platform.icon} />
                  </button>
                ))}
              </div>
            </div>

            <NotificationPreview
              title={titleTemplate}
              body={bodyTemplate}
              icon={iconUrl}
              image={imageUrl}
              badge={badgeUrl}
              actions={actions}
              platform={getPreviewPlatform()}
              deviceType={getPreviewDeviceType()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
