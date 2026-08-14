import { useEffect, useRef, useState, type ReactNode } from 'react';
import { RefreshCw, Video, VideoOff } from 'lucide-react';
import { useWhepStream } from '../../hooks/useWhepStream';
import { computeCoverContentRect, FULL_CONTENT_RECT, type ContentRect } from '../../utils/videoFrame';

interface LiveCameraViewProps {
  streamPath: string;
  className?: string;
  overlay?: ReactNode;
  zoneOverlay?: ReactNode;
  onContentRect?: (rect: ContentRect) => void;
}

const STATUS_LABEL: Record<string, string> = {
  connecting: 'Connecting…',
  retrying: 'Reconnecting…',
  error: 'Live view unavailable',
};

export default function LiveCameraView({
  streamPath,
  className,
  overlay,
  zoneOverlay,
  onContentRect,
}: LiveCameraViewProps) {
  const { videoRef, status, reconnect } = useWhepStream(streamPath);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [contentRect, setContentRect] = useState<ContentRect>(FULL_CONTENT_RECT);

  useEffect(() => {
    const videoEl = videoRef.current;
    const containerEl = containerRef.current;
    if (!videoEl || !containerEl) return;

    const recompute = () => {
      const vw = videoEl.videoWidth;
      const vh = videoEl.videoHeight;
      const cw = containerEl.clientWidth;
      const ch = containerEl.clientHeight;
      if (!vw || !vh || !cw || !ch) return;
      const rect = computeCoverContentRect(vw / vh, cw / ch);
      setContentRect(rect);
      onContentRect?.(rect);
    };

    recompute();
    videoEl.addEventListener('loadedmetadata', recompute);
    videoEl.addEventListener('resize', recompute);
    const ro = new ResizeObserver(recompute);
    ro.observe(containerEl);
    return () => {
      videoEl.removeEventListener('loadedmetadata', recompute);
      videoEl.removeEventListener('resize', recompute);
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamPath]);

  return (
    <div
      ref={containerRef}
      className={`group relative overflow-hidden rounded-lg border border-slate-200 bg-slate-950 ${className ?? ''}`}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`h-full w-full object-cover ${status === 'live' ? '' : 'hidden'}`}
      />
      {status !== 'live' && (
        <div className="flex h-full min-h-48 flex-col items-center justify-center gap-2 text-slate-600">
          {status === 'error' ? (
            <VideoOff className="h-8 w-8" />
          ) : (
            <Video className="h-8 w-8 animate-pulse" />
          )}
          <p className="text-xs text-slate-500">{STATUS_LABEL[status]}</p>
        </div>
      )}
      {status === 'live' && (
        <span className="absolute left-2 top-2 flex items-center gap-1.5 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          LIVE
        </span>
      )}

      {overlay && <div className="absolute right-2 top-2">{overlay}</div>}
      {status === 'live' && zoneOverlay && (
        <div
          className="pointer-events-none absolute"
          style={{
            left: `${contentRect.left * 100}%`,
            top: `${contentRect.top * 100}%`,
            width: `${contentRect.width * 100}%`,
            height: `${contentRect.height * 100}%`,
          }}
        >
          {zoneOverlay}
        </div>
      )}

      <div className="absolute bottom-2 right-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={reconnect}
          className="rounded-md bg-black/60 p-1.5 text-slate-300 hover:text-white"
          title="Reconnect"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
