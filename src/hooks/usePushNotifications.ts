import { useCallback, useEffect, useState } from 'react';
import { getVapidPublicKey, subscribePush, unsubscribePush } from '../services/pushService';
import { subscriptionToPayload, urlBase64ToUint8Array } from '../utils/push';
import { useAuth } from '../context/AuthContext';

export type PushSupportState = 'checking' | 'supported' | 'unsupported';

export function usePushNotifications() {
  const { token } = useAuth();
  const [support, setSupport] = useState<PushSupportState>('checking');
  const [subscribed, setSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const isSupported =
      'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setSupport(isSupported ? 'supported' : 'unsupported');
    if (!isSupported) return;

    setPermission(Notification.permission);

    navigator.serviceWorker
      .getRegistration()
      .then((reg) => reg?.pushManager.getSubscription())
      .then((sub) => setSubscribed(!!sub))
      .catch(() => setSubscribed(false));
  }, []);

  const enable = useCallback(async () => {
    if (support !== 'supported' || !token) return;
    setLoading(true);
    setError(null);
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== 'granted') {
        throw new Error('Notification permission was not granted');
      }

      const { public_key } = await getVapidPublicKey();
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(public_key) as BufferSource,
      });

      await subscribePush(token, subscriptionToPayload(subscription));
      setSubscribed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enable notifications');
    } finally {
      setLoading(false);
    }
  }, [support, token]);

  const disable = useCallback(async () => {
    if (support !== 'supported' || !token) return;
    setLoading(true);
    setError(null);
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await unsubscribePush(token, { endpoint: subscription.endpoint });
        await subscription.unsubscribe();
      }
      setSubscribed(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disable notifications');
    } finally {
      setLoading(false);
    }
  }, [support, token]);

  return { support, subscribed, permission, loading, error, enable, disable };
}
