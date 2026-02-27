import { useState } from 'react';

interface NotificationPreferencesProps {
  subscriptionId?: string;
}

export function NotificationPreferences({ subscriptionId }: NotificationPreferencesProps) {
  const [preferences, setPreferences] = useState({
    enableSound: true,
    enableVibration: true,
    quietHours: false,
    quietStart: '22:00',
    quietEnd: '08:00',
    maxPerDay: 10,
    categories: [] as string[],
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const availableCategories = [
    { id: 'news', label: 'News Updates' },
    { id: 'promotions', label: 'Promotions' },
    { id: 'updates', label: 'Product Updates' },
    { id: 'alerts', label: 'Important Alerts' },
  ];

  const handleSave = async () => {
    if (!subscriptionId) return;

    setIsSaving(true);
    setSaveStatus('idle');

    try {
      const response = await fetch(`/api/preferences/subscription/${subscriptionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enableSound: preferences.enableSound,
          enableVibration: preferences.enableVibration,
          quietHoursEnabled: preferences.quietHours,
          quietHoursStart: preferences.quietStart,
          quietHoursEnd: preferences.quietEnd,
          maxPerDay: preferences.maxPerDay,
          categoriesEnabled: preferences.categories,
        }),
      });

      if (response.ok) {
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setSaveStatus('error');
      }
    } catch {
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setPreferences((prev) => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter((c) => c !== categoryId)
        : [...prev.categories, categoryId],
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Notification Preferences</h2>

      {/* Sound & Vibration */}
      <div className="space-y-3 mb-6">
        <label className="flex items-center justify-between">
          <span className="text-gray-700">Sound</span>
          <input
            type="checkbox"
            checked={preferences.enableSound}
            onChange={(e) => setPreferences({ ...preferences, enableSound: e.target.checked })}
            className="w-5 h-5 text-blue-600 rounded"
          />
        </label>

        <label className="flex items-center justify-between">
          <span className="text-gray-700">Vibration</span>
          <input
            type="checkbox"
            checked={preferences.enableVibration}
            onChange={(e) => setPreferences({ ...preferences, enableVibration: e.target.checked })}
            className="w-5 h-5 text-blue-600 rounded"
          />
        </label>
      </div>

      {/* Quiet Hours */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-700 font-medium">Quiet Hours</span>
          <input
            type="checkbox"
            checked={preferences.quietHours}
            onChange={(e) => setPreferences({ ...preferences, quietHours: e.target.checked })}
            className="w-5 h-5 text-blue-600 rounded"
          />
        </div>

        {preferences.quietHours && (
          <div className="flex items-center gap-2 mt-2">
            <input
              type="time"
              value={preferences.quietStart}
              onChange={(e) => setPreferences({ ...preferences, quietStart: e.target.value })}
              className="border rounded px-2 py-1"
            />
            <span className="text-gray-500">to</span>
            <input
              type="time"
              value={preferences.quietEnd}
              onChange={(e) => setPreferences({ ...preferences, quietEnd: e.target.value })}
              className="border rounded px-2 py-1"
            />
          </div>
        )}
      </div>

      {/* Daily Limit */}
      <div className="mb-6">
        <label className="block text-gray-700 font-medium mb-2">
          Maximum notifications per day
        </label>
        <input
          type="number"
          min={1}
          max={50}
          value={preferences.maxPerDay}
          onChange={(e) =>
            setPreferences({ ...preferences, maxPerDay: parseInt(e.target.value, 10) || 1 })
          }
          className="w-full border rounded px-3 py-2"
        />
      </div>

      {/* Categories */}
      <div className="mb-6">
        <label className="block text-gray-700 font-medium mb-2">
          Categories you're interested in
        </label>
        <div className="space-y-2">
          {availableCategories.map((category) => (
            <label key={category.id} className="flex items-center">
              <input
                type="checkbox"
                checked={preferences.categories.includes(category.id)}
                onChange={() => toggleCategory(category.id)}
                className="w-4 h-4 text-blue-600 rounded mr-2"
              />
              <span className="text-gray-700">{category.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleSave}
          disabled={isSaving || !subscriptionId}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving...' : 'Save Preferences'}
        </button>

        {saveStatus === 'success' && <span className="text-green-600 text-sm">Saved!</span>}
        {saveStatus === 'error' && <span className="text-red-600 text-sm">Failed to save</span>}
      </div>
    </div>
  );
}
