import { useEffect, useState } from 'react';
import { Copy, Link2, Check } from 'lucide-react';
import Panel from '../../components/ui/Panel';
import { getCameraWebhookUrl } from '../../services/settingsService';

export default function CameraWebhookUrlPanel() {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getCameraWebhookUrl()
      .then((res) => setUrl(res.url))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'));
  }, []);

  const handleCopy = async () => {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Panel title="Camera Webhook URL">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Link2 className="h-4 w-4" />
          </div>
          <p className="text-xs text-slate-500">
            Paste this into each camera's own HTTP Post / Alarm Push / Platform Access settings —
            it's how a camera reports detections and its online status to this server. Unique to
            this install; the same URL works for every camera on this machine.
          </p>
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}

        {url && (
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700">
              {url}
            </code>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        )}
      </div>
    </Panel>
  );
}
