import { faGripVertical, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
  placeholder?: string;
}

interface ActionButtonsEditorProps {
  actions: NotificationAction[];
  onChange: (actions: NotificationAction[]) => void;
  maxActions?: number;
  platform?: 'ios' | 'android' | 'desktop' | 'tablet';
}

export function ActionButtonsEditor({
  actions,
  onChange,
  maxActions = 2,
  platform,
}: ActionButtonsEditorProps) {
  const addAction = () => {
    if (actions.length >= maxActions) return;
    const newAction: NotificationAction = {
      action: `action-${actions.length + 1}`,
      title: '',
    };
    onChange([...actions, newAction]);
  };

  const updateAction = (index: number, updates: Partial<NotificationAction>) => {
    const newActions = [...actions];
    newActions[index] = { ...newActions[index], ...updates };
    onChange(newActions);
  };

  const removeAction = (index: number) => {
    onChange(actions.filter((_, i) => i !== index));
  };

  const isIOS = platform === 'ios';
  const effectiveMax = isIOS ? 1 : maxActions;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Action Buttons</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {actions.length}/{effectiveMax} {actions.length === 1 ? 'button' : 'buttons'}
          </span>
          {actions.length < effectiveMax && (
            <button
              type="button"
              onClick={addAction}
              className="text-xs flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <FontAwesomeIcon icon={faPlus} className="text-[10px]" />
              Add
            </button>
          )}
        </div>
      </div>

      {actions.length === 0 ? (
        <div className="text-center py-4 text-sm text-gray-500">
          No action buttons. Add buttons to let users take quick actions.
        </div>
      ) : (
        <div className="space-y-2">
          {actions.map((action, index) => (
            <div
              key={`action-${index}-${action.action}`}
              className="flex items-start gap-2 p-3 bg-gray-50 rounded-md border border-gray-200 group"
            >
              <button
                type="button"
                className="mt-2 text-gray-400 hover:text-gray-600 cursor-grab"
                title="Drag to reorder"
              >
                <FontAwesomeIcon icon={faGripVertical} />
              </button>

              <div className="flex-1 grid grid-cols-2 gap-2">
                <div>
                  <label
                    htmlFor={`action-title-${index}`}
                    className="block text-xs font-medium text-gray-700 mb-1"
                  >
                    Button Text
                  </label>
                  <input
                    id={`action-title-${index}`}
                    type="text"
                    value={action.title}
                    onChange={(e) => updateAction(index, { title: e.target.value })}
                    placeholder="e.g., View Details"
                    maxLength={isIOS ? 20 : 30}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <div className="text-[10px] text-gray-500 mt-0.5">
                    {action.title.length}/{isIOS ? 20 : 30} chars
                  </div>
                </div>

                <div>
                  <label
                    htmlFor={`action-id-${index}`}
                    className="block text-xs font-medium text-gray-700 mb-1"
                  >
                    Action ID
                  </label>
                  <input
                    id={`action-id-${index}`}
                    type="text"
                    value={action.action}
                    onChange={(e) => updateAction(index, { action: e.target.value })}
                    placeholder="view-details"
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-xs"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => removeAction(index)}
                className="mt-2 text-gray-400 hover:text-red-500 transition-colors"
                title="Remove button"
              >
                <FontAwesomeIcon icon={faTrash} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Info Box */}
      <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-md">
        <div className="flex items-start gap-2">
          <svg
            className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <div className="text-xs text-blue-700">
            <p className="font-medium">
              Action buttons let users respond directly from the notification.
            </p>
            {isIOS && (
              <p className="mt-1">
                iOS Safari supports only 1 action button with up to 20 characters.
              </p>
            )}
            {!isIOS && (
              <p className="mt-1">
                Chrome, Firefox, and Edge support up to 2 action buttons with up to 30 characters.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
