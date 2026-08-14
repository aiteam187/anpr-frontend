import { Bell, BellOff } from 'lucide-react';
import Panel from '../../components/ui/Panel';
import { usePushNotifications } from '../../hooks/usePushNotifications';

export default function NotificationsPanel() {
  const { support, subscribed, permission, loading, error, enable, disable } =
    usePushNotifications();

  if (support === 'checking') return null;

  return (
    <Panel title="Push Notifications" className="max-w-md">
      {support === 'unsupported' ? (
        <p className="text-sm text-slate-500">
          This browser doesn&apos;t support push notifications.
        </p>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                subscribed ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {subscribed ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">
                {subscribed ? 'Notifications enabled' : 'Notifications disabled'}
              </p>
              <p className="text-xs text-slate-500">
                Get alerted on this device for unauthorized attempts, overstays, and camera
                faults, even when the dashboard isn&apos;t open.
              </p>
            </div>
          </div>

          {permission === 'denied' && (
            <p className="text-xs text-red-600">
              Notifications are blocked for this site in your browser settings — enable them
              there first.
            </p>
          )}
          {error && <p className="text-xs text-red-600">{error}</p>}

          <button
            type="button"
            onClick={subscribed ? disable : enable}
            disabled={loading || permission === 'denied'}
            className={`rounded-md px-3 py-1.5 text-sm font-medium disabled:opacity-60 ${
              subscribed
                ? 'border border-slate-300 text-slate-600 hover:bg-slate-50'
                : 'bg-blue-600 text-white hover:bg-blue-500'
            }`}
          >
            {loading ? 'Working…' : subscribed ? 'Turn Off' : 'Turn On'}
          </button>
        </div>
      )}
    </Panel>
  );
}
