'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import {
  Activity,
  AlertTriangle,
  Battery,
  BatteryCharging,
  CircleHelp,
  Cloud,
  CloudUpload,
  Database,
  FileCheck2,
  FolderSearch,
  HardDrive,
  KeyRound,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Wifi,
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type GuardState = 'unknown' | 'monitoring' | 'warning' | 'pause_not_configured' | 'pause_failed' | 'pause_requested' | 'resume_required';
type OverallState =
  | 'setup_required'
  | 'storage_guard_attention'
  | 'storage_pause_requested'
  | 'storage_warning'
  | 'ingestion_error'
  | 'incoming_files_detected'
  | 'missing_local_files'
  | 'awaiting_cloud_confirmation'
  | 'cleanup_review_available'
  | 'idle_unverified';

interface MediaItem {
  id: number;
  relative_path: string;
  size_bytes: number;
  sha256: string | null;
  state: string;
  first_seen_at: string;
  verified_at: string | null;
  cloud_attested_at: string | null;
  failure_reason: string | null;
}

interface StatusData {
  generatedAt: string;
  status: OverallState;
  battery: {
    available: boolean;
    percentage: number | null;
    status: string;
    isCharging: boolean | null;
    checkedAt: string | null;
    error: string | null;
  };
  storage: {
    available: boolean;
    usedGB: number | null;
    totalGB: number | null;
    freeGB: number | null;
    usagePercent: number | null;
    checkedAt: string | null;
    path: string;
    error: string | null;
  };
  resilio: { status: 'unknown'; details: string };
  cloudBackup: { status: 'unverified'; details: string };
  ingestion: {
    enabled: boolean;
    status: string;
    counts: { observed: number; locally_verified: number; cleanup_candidate: number; missing: number; total: number };
    scannedFiles: number;
    hashedFiles: number;
    hashedBytes: number;
    deferredHashes: number;
    lastScanAt: string | null;
    error: string | null;
    recentItems: MediaItem[];
  };
  storageGuard: {
    state: GuardState;
    warningGB: number;
    pauseGB: number;
    resumeBelowGB: number;
    webhookConfigured: boolean;
    webhookAcknowledged: boolean;
    requiresManualResume: boolean;
    lastActionAt: string | null;
    details: string;
  };
  diagnostics: { lastPollAt: string | null; polling: boolean; error: string | null };
}

const stateLabels: Record<OverallState, string> = {
  setup_required: 'Setup required',
  storage_guard_attention: 'Storage guard needs attention',
  storage_pause_requested: 'Storage pause requested',
  storage_warning: 'Storage warning',
  ingestion_error: 'Ingestion scanner error',
  incoming_files_detected: 'Incoming files detected',
  missing_local_files: 'Local files missing',
  awaiting_cloud_confirmation: 'Awaiting cloud confirmation',
  cleanup_review_available: 'Cleanup review available',
  idle_unverified: 'Idle · backup unverified',
};

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes < 0) return '—';
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

function formatTime(value: string | null | undefined) {
  if (!value) return 'Not available';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not available' : date.toLocaleString();
}

function stateTone(state: string) {
  if (['storage_guard_attention', 'ingestion_error', 'missing_local_files'].includes(state)) return 'danger';
  if (['storage_warning', 'storage_pause_requested', 'incoming_files_detected', 'awaiting_cloud_confirmation', 'cleanup_review_available'].includes(state)) return 'warning';
  return 'neutral';
}

function MetricCard({ icon: Icon, label, value, detail, tone = 'neutral' }: {
  icon: typeof HardDrive;
  label: string;
  value: string;
  detail: string;
  tone?: 'neutral' | 'warning' | 'danger';
}) {
  return (
    <section className="glow-card p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-400"><Icon className="h-4 w-4" />{label}</div>
        {tone === 'danger' ? <AlertTriangle className="h-4 w-4 text-accent-red" /> : tone === 'warning' ? <AlertTriangle className="h-4 w-4 text-accent-yellow" /> : null}
      </div>
      <div>
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
        <p className="mt-1 text-xs text-gray-500">{detail}</p>
      </div>
    </section>
  );
}

function StatusPill({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'warning' | 'danger' | 'success' }) {
  const toneClass = {
    neutral: 'border-surface-border bg-surface-base text-gray-300',
    warning: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
    danger: 'border-red-500/30 bg-red-500/10 text-red-300',
    success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  }[tone];
  return <span className={cn('inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium', toneClass)}>{label}</span>;
}

export default function Dashboard() {
  const [data, setData] = useState<StatusData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState('');
  const [tokenDraft, setTokenDraft] = useState('');
  const [authRequired, setAuthRequired] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const inFlight = useRef(false);

  const refresh = useCallback(async () => {
    if (inFlight.current || document.visibilityState === 'hidden') return;
    inFlight.current = true;
    setRefreshing(true);
    try {
      const response = await fetch('/api/status', {
        cache: 'no-store',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (response.status === 401) {
        setAuthRequired(true);
        throw new Error('Dashboard authentication is required.');
      }
      if (!response.ok) throw new Error(`Status request failed (${response.status}).`);
      const payload = await response.json() as StatusData;
      setData(payload);
      setError(null);
      setAuthRequired(false);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to reach Pixel-NAS.');
    } finally {
      inFlight.current = false;
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    const initialTimer = window.setTimeout(() => void refresh(), 0);
    const timer = window.setInterval(() => void refresh(), 5000);
    const onVisibility = () => { if (document.visibilityState === 'visible') void refresh(); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [refresh]);

  const storagePercent = useMemo(() => {
    if (!data?.storage.available || data.storage.usagePercent === null) return 0;
    return Math.max(0, Math.min(100, data.storage.usagePercent));
  }, [data]);

  const saveToken = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanToken = tokenDraft.trim();
    setToken(cleanToken);
    setTokenDraft('');
  };

  const acknowledgeResume = async () => {
    const confirmed = window.confirm('Only continue after checking the Pixel storage level and manually restarting Resilio Sync. Pixel-NAS will not start Resilio for you. Have you done that?');
    if (!confirmed) return;
    try {
      const response = await fetch('/api/storage-guard/acknowledge-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ confirmation: 'I restarted Resilio manually' }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to acknowledge resume.');
      await refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to acknowledge resume.');
    }
  };

  if (authRequired) {
    return (
      <main className="min-h-screen bg-background px-5 py-12 text-foreground">
        <div className="glow-card mx-auto max-w-md space-y-5 p-6">
          <KeyRound className="h-8 w-8 text-gray-300" />
          <div><h1 className="text-xl font-semibold">Connect to Pixel-NAS</h1><p className="mt-1 text-sm text-gray-400">Enter the bearer token configured in dashboard/.env.</p></div>
          <form onSubmit={saveToken} className="space-y-3">
            <input className="w-full rounded-xl border border-surface-border bg-black/30 px-3 py-3 text-sm outline-none focus:border-gray-500" type="password" autoComplete="current-password" value={tokenDraft} onChange={(event) => setTokenDraft(event.target.value)} placeholder="Dashboard token" required />
            <button className="w-full rounded-xl bg-foreground px-4 py-3 text-sm font-semibold text-background" type="submit">Connect</button>
          </form>
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          <p className="text-xs text-gray-500">The token stays in this page&apos;s memory. Re-enter it after a page reload.</p>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
        <div className="glow-card flex w-full max-w-md flex-col items-center gap-3 p-8 text-center">
          <Activity className="h-8 w-8 animate-pulse text-gray-400" />
          <h1 className="text-lg font-semibold">Connecting to Pixel-NAS</h1>
          <p className="text-sm text-gray-500">{error || 'Waiting for the first telemetry response.'}</p>
          <button onClick={() => void refresh()} className="rounded-lg border border-surface-border px-3 py-2 text-sm">Retry</button>
        </div>
      </main>
    );
  }

  const currentTone = stateTone(data.status);
  const batteryValue = data.battery.available && data.battery.percentage !== null ? `${data.battery.percentage}%` : 'Unavailable';
  const storageValue = data.storage.available && data.storage.usedGB !== null && data.storage.totalGB !== null
    ? `${data.storage.usedGB.toFixed(1)} / ${data.storage.totalGB.toFixed(1)} GB`
    : 'Unavailable';

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-surface-border pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-surface-border bg-surface-base"><Cloud className="h-5 w-5" /></div>
            <div><h1 className="text-xl font-semibold tracking-tight">Pixel-NAS</h1><p className="text-sm text-gray-500">Backup operations and integrity monitor</p></div>
          </div>
          <div className="flex items-center gap-2">
            <StatusPill label={stateLabels[data.status] || data.status} tone={currentTone} />
            <button onClick={() => void refresh()} disabled={refreshing} aria-label="Refresh telemetry" className="rounded-lg border border-surface-border p-2 text-gray-300 hover:bg-surface-hover disabled:opacity-50"><RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} /></button>
          </div>
        </header>

        {error ? <div role="status" className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">Telemetry refresh issue: {error}. Displayed values may be stale.</div> : null}
        {['unknown', 'pause_failed', 'pause_not_configured'].includes(data.storageGuard.state) ? (
          <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
            <div className="flex items-center gap-2 font-semibold text-red-200"><ShieldAlert className="h-5 w-5" /> Storage protection needs attention</div>
            <p className="mt-2 text-sm text-red-100">{data.storageGuard.details}</p>
          </div>
        ) : null}

        <section className="glow-card space-y-4 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><p className="text-sm text-gray-400">Current operating state</p><h2 className="mt-1 text-2xl font-semibold">{stateLabels[data.status] || data.status}</h2></div>
            <div className="text-right text-xs text-gray-500"><div>Last poll</div><div className="mt-1">{formatTime(data.diagnostics.lastPollAt)}</div></div>
          </div>
          <p className="text-sm text-gray-400">Pixel-NAS separates transfer activity, local file verification and cloud-backup confirmation. Unknown or unavailable signals are shown explicitly instead of being interpreted as success.</p>
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          <MetricCard icon={HardDrive} label="Pixel storage buffer" value={storageValue} detail={data.storage.available && data.storage.freeGB !== null ? `${data.storage.freeGB.toFixed(1)} GB available · ${storagePercent}% used` : (data.storage.error || 'Filesystem telemetry unavailable')} tone={['unknown', 'pause_failed', 'pause_not_configured'].includes(data.storageGuard.state) ? 'danger' : data.storageGuard.state === 'warning' ? 'warning' : 'neutral'} />
          <MetricCard icon={data.battery.isCharging ? BatteryCharging : Battery} label="Battery" value={batteryValue} detail={data.battery.available ? `${data.battery.status}${data.battery.checkedAt ? ` · ${formatTime(data.battery.checkedAt)}` : ''}` : (data.battery.error || 'Battery telemetry unavailable')} />
        </section>

        <section className="glow-card space-y-4 p-5">
          <div className="flex items-center justify-between gap-3"><h2 className="font-semibold">Storage protection</h2><StatusPill label={data.storageGuard.state.replaceAll('_', ' ')} tone={['unknown', 'pause_failed', 'pause_not_configured'].includes(data.storageGuard.state) ? 'danger' : data.storageGuard.state === 'warning' ? 'warning' : data.storageGuard.state === 'pause_requested' || data.storageGuard.state === 'resume_required' ? 'warning' : 'neutral'} /></div>
          {data.storage.available && data.storage.usagePercent !== null ? <div className="space-y-2"><div className="h-2 overflow-hidden rounded-full bg-surface-border"><div className={cn('h-full rounded-full transition-all', (data.storage.usedGB ?? 0) >= data.storageGuard.pauseGB ? 'bg-accent-red' : data.storage.usagePercent >= 75 ? 'bg-accent-yellow' : 'bg-foreground')} style={{ width: `${storagePercent}%` }} /></div><div className="flex flex-wrap justify-between gap-2 text-xs text-gray-500"><span>Warning: {data.storageGuard.warningGB} GB used</span><span>Pause request: {data.storageGuard.pauseGB} GB</span></div></div> : <p className="text-sm text-gray-500">Storage usage is unknown. The conservative policy requests a stop and blocks manual resume until storage can be measured again.</p>}
          <p className="text-sm text-gray-400">{data.storageGuard.details}</p>
          {data.storageGuard.requiresManualResume ? <button onClick={() => void acknowledgeResume()} disabled={!data.storage.available || (data.storage.usedGB ?? Number.POSITIVE_INFINITY) >= data.storageGuard.resumeBelowGB} className="rounded-lg border border-surface-border px-3 py-2 text-sm hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-40">Acknowledge manual Resilio restart</button> : null}
          <p className="text-xs text-gray-500">A webhook acknowledgement is not proof that Resilio stopped. Restart is manual; this dashboard never starts or kills applications directly.</p>
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          <div className="glow-card space-y-3 p-5">
            <div className="flex items-center gap-2"><Wifi className="h-4 w-4 text-gray-400" /><h2 className="font-semibold">Resilio transfer</h2></div>
            <StatusPill label="Unknown" />
            <p className="text-sm text-gray-400">{data.resilio.details}</p>
          </div>
          <div className="glow-card space-y-3 p-5">
            <div className="flex items-center gap-2"><CloudUpload className="h-4 w-4 text-gray-400" /><h2 className="font-semibold">Google Photos backup</h2></div>
            <StatusPill label="Unverified" tone="warning" />
            <p className="text-sm text-gray-400">{data.cloudBackup.details}</p>
          </div>
        </section>

        <section className="glow-card space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><Database className="h-4 w-4 text-gray-400" /><h2 className="font-semibold">Ingestion ledger</h2></div><StatusPill label={data.ingestion.enabled ? 'Enabled' : 'Not configured'} tone={data.ingestion.enabled ? 'success' : 'neutral'} /></div>
          {data.ingestion.enabled ? (
            <>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <MetricCard icon={FolderSearch} label="Observed" value={String(data.ingestion.counts.observed)} detail="Waiting for stable file size" />
                <MetricCard icon={FileCheck2} label="Locally verified" value={String(data.ingestion.counts.locally_verified)} detail="SHA-256 recorded" />
                <MetricCard icon={ShieldCheck} label="Review candidates" value={String(data.ingestion.counts.cleanup_candidate)} detail="Operator-attested" />
                <MetricCard icon={AlertTriangle} label="Missing" value={String(data.ingestion.counts.missing)} detail="Not proof of cloud backup" tone={data.ingestion.counts.missing > 0 ? 'danger' : 'neutral'} />
              </div>
              <p className="text-xs text-gray-500">Last scan: {formatTime(data.ingestion.lastScanAt)} · {data.ingestion.scannedFiles} files scanned · {data.ingestion.hashedFiles} hashed ({formatBytes(data.ingestion.hashedBytes)}) · {data.ingestion.deferredHashes} hashes deferred by the per-scan budget</p>
              {data.ingestion.error ? <p className="text-sm text-red-300">Scanner error: {data.ingestion.error}</p> : null}
              <div className="divide-y divide-surface-border">
                {data.ingestion.recentItems.length ? data.ingestion.recentItems.map((item) => (
                  <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                    <div className="min-w-0"><p className="truncate text-sm font-medium">{item.relative_path}</p><p className="mt-1 text-xs text-gray-500">#{item.id} · {formatBytes(item.size_bytes)} · {item.sha256 ? `${item.sha256.slice(0, 12)}…` : 'Checksum pending'}</p></div>
                    <StatusPill label={item.state.replaceAll('_', ' ')} tone={item.state === 'missing' ? 'danger' : item.state === 'cleanup_candidate' ? 'success' : item.state === 'locally_verified' ? 'warning' : 'neutral'} />
                  </div>
                )) : <p className="py-4 text-sm text-gray-500">No indexed files yet.</p>}
              </div>
              <p className="text-xs text-gray-500">No media is deleted by Pixel-NAS. A cleanup candidate is only a review record after a manual cloud check.</p>
            </>
          ) : (
            <div className="space-y-2 text-sm text-gray-400"><p>Set <code className="rounded bg-black/30 px-1.5 py-0.5">PIXEL_NAS_INBOX_DIR</code> to the actual Resilio receive folder in <code className="rounded bg-black/30 px-1.5 py-0.5">dashboard/.env</code>, then restart the server.</p><p>The patch intentionally does not guess your Pixel&apos;s storage path.</p></div>
          )}
        </section>

        <section className="rounded-xl border border-surface-border p-4">
          <div className="flex items-start gap-3"><CircleHelp className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" /><div><h2 className="text-sm font-medium">How to interpret the dashboard</h2><p className="mt-1 text-xs leading-5 text-gray-500">Local verification means a file remained stable while its SHA-256 was calculated. Cloud backup remains unverified until you independently check the item and record an operator attestation. Cleanup candidates are not deleted automatically. A missing local file is recorded as missing, never assumed to be safely backed up.</p></div></div>
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-600"><span>Pixel-NAS · local operations dashboard</span><span>Updated {formatTime(data.generatedAt)}</span></footer>
      </div>
    </main>
  );
}
