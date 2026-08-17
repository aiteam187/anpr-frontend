import { useState } from 'react';
import { Copy, Check, Database, Eye, EyeOff } from 'lucide-react';
import Panel from '../../components/ui/Panel';
import { inputClass } from '../../components/ui/FormField';
import { revealDbCredentials, type DbCredentials } from '../../services/settingsService';

export default function DbCredentialsPanel() {
  const [code, setCode] = useState('');
  const [creds, setCreds] = useState<DbCredentials | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleReveal = async () => {
    if (!code || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await revealDbCredentials(code);
      setCreds(res);
    } catch {
      setError('Incorrect code');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (field: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleHide = () => {
    setCreds(null);
    setCode('');
  };

  return (
    <Panel title="Database Credentials" className="max-w-md">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Database className="h-4 w-4" />
          </div>
          <p className="text-xs text-slate-500">
            For connecting a tool like pgAdmin directly to this install's database. Enter the
            support code to reveal.
          </p>
        </div>

        {!creds ? (
          <div className="flex items-center gap-2">
            <input
              type="password"
              className={`${inputClass} flex-1 py-1.5 text-sm`}
              placeholder="Enter code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleReveal()}
            />
            <button
              type="button"
              onClick={handleReveal}
              disabled={loading || !code}
              className="flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50"
            >
              <Eye className="h-3.5 w-3.5" />
              Reveal
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {(
              [
                ['Host', creds.host],
                ['Port', creds.port],
                ['Database', creds.database],
                ['Username', creds.username],
                ['Password', creds.password],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="flex items-center gap-2">
                <span className="w-20 shrink-0 text-xs font-medium text-slate-500">{label}</span>
                <code className="flex-1 truncate rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700">
                  {value}
                </code>
                <button
                  type="button"
                  onClick={() => handleCopy(label, value)}
                  className="flex items-center rounded-md border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50"
                >
                  {copiedField === label ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={handleHide}
              className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700"
            >
              <EyeOff className="h-3.5 w-3.5" />
              Hide
            </button>
          </div>
        )}

        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    </Panel>
  );
}
