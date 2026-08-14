/**
 * Draggable/resizable rectangle overlay for a camera's live video feed,
 * matching the detection-zone editor in the camera's own admin UI
 * (Algorithm Parameter → Basic Parameter). Reads/writes go through our own
 * backend's /gates/{gate_id}/trigger-zone proxy (see
 * services/cameraZoneService.ts), which forwards to the camera's cgi-bin
 * API server-side and audit-logs writes.
 *
 * Coordinate space: the camera's x0..x3/y0..y3 fields are NOT raw video
 * pixels — they're in the camera's own internal reference grid, assumed to
 * be 176x144 (QCIF) based on observed value ranges (width side confirmed
 * live against the camera's own admin UI). Y is bottom-origin on the
 * camera (also confirmed live) — see triggerZoneMath.ts for the flip.
 * This component works entirely in 0..1 fractions of the camera's full
 * source frame internally, and converts to/from that coordinate space only
 * at the load/save boundary, so fixing CAMERA_COORD_SPACE later is the only
 * change needed once verified.
 *
 * Display accuracy: the video element uses `object-fit: cover`, which crops
 * the source frame if its aspect ratio doesn't exactly match the display
 * box. `contentRect` (from utils/videoFrame.ts, computed by LiveCameraView
 * from the video's real width/height) tells us exactly which sub-region of
 * the container is actually showing the source frame, so the box —
 * rendering and drag math both — is mapped through that instead of assuming
 * the full container always shows the uncropped frame edge-to-edge.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getTriggerZone, setTriggerZone } from '../../services/cameraZoneService';
import {
  containerPointToSource,
  FULL_CONTENT_RECT,
  sourceBoxToContainer,
  type ContentRect,
} from '../../utils/videoFrame';
import {
  CAMERA_COORD_SPACE,
  DEFAULT_BOX,
  boxToCorners,
  cornersToBox,
  type FractionBox,
} from './triggerZoneMath';

const HANDLES = ['nw', 'ne', 'se', 'sw'] as const;
type Handle = (typeof HANDLES)[number];
const MIN_SIZE_FRACTION = 0.05;

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

interface TriggerZoneEditorProps {
  gateId: string;
  children: React.ReactNode;
  onSaved?: () => void;
  contentRect?: ContentRect;
}

export default function TriggerZoneEditor({
  gateId,
  children,
  onSaved,
  contentRect = FULL_CONTENT_RECT,
}: TriggerZoneEditorProps) {
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const moveStartRef = useRef<{ grabX: number; grabY: number; box: FractionBox } | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [box, setBox] = useState<FractionBox | null>(null);
  const [savedBox, setSavedBox] = useState<FractionBox | null>(null);
  const [dragging, setDragging] = useState<Handle | 'move' | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    getTriggerZone(gateId)
      .then((corners) => {
        if (cancelled) return;
        const fractionBox = cornersToBox(corners, CAMERA_COORD_SPACE);
        setBox(fractionBox);
        setSavedBox(fractionBox);
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : 'Failed to load trigger zone');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [gateId]);

  const getFractionFromEvent = useCallback(
    (e: { clientX: number; clientY: number }) => {
      const rect = containerRef.current!.getBoundingClientRect();
      const containerX = clamp01((e.clientX - rect.left) / rect.width);
      const containerY = clamp01((e.clientY - rect.top) / rect.height);
      return containerPointToSource(containerX, containerY, contentRect);
    },
    [contentRect],
  );

  const onHandlePointerDown = (handle: Handle) => (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setDragging(handle);
  };

  const onBoxPointerDown = (e: React.PointerEvent) => {
    if (!box) return;
    e.preventDefault();
    const { x, y } = getFractionFromEvent(e);
    moveStartRef.current = { grabX: x, grabY: y, box };
    setDragging('move');
  };

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      const { x, y } = getFractionFromEvent(e);

      setBox((prev) => {
        if (!prev) return prev;
        if (dragging === 'move') {
          const start = moveStartRef.current;
          if (!start) return prev;
          const dx = x - start.grabX;
          const dy = y - start.grabY;
          const w = start.box.right - start.box.left;
          const h = start.box.bottom - start.box.top;
          let left = clamp01(start.box.left + dx);
          let top = clamp01(start.box.top + dy);
          left = Math.min(left, 1 - w);
          top = Math.min(top, 1 - h);
          return { left, top, right: left + w, bottom: top + h };
        }

        const next = { ...prev };
        if (dragging.includes('n')) next.top = Math.min(y, prev.bottom - MIN_SIZE_FRACTION);
        if (dragging.includes('s')) next.bottom = Math.max(y, prev.top + MIN_SIZE_FRACTION);
        if (dragging.includes('w')) next.left = Math.min(x, prev.right - MIN_SIZE_FRACTION);
        if (dragging.includes('e')) next.right = Math.max(x, prev.left + MIN_SIZE_FRACTION);
        return next;
      });
    },
    [dragging, getFractionFromEvent],
  );

  const onPointerUp = useCallback(() => {
    setDragging(null);
    moveStartRef.current = null;
  }, []);

  const handleReset = () => {
    setSaveError(null);
    setSaveSuccess(false);
    if (savedBox) setBox(savedBox);
  };

  const handleResetToDefault = () => {
    setSaveError(null);
    setSaveSuccess(false);
    setBox(DEFAULT_BOX);
  };

  const handleSave = async () => {
    if (!box) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      const corners = boxToCorners(box, CAMERA_COORD_SPACE);
      await setTriggerZone(gateId, corners, user?.username);
      setSavedBox(box);
      setSaveSuccess(true);
      setTimeout(() => onSaved?.(), 1000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save trigger zone');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        This box's position has been cross-checked live against the camera's own admin page
        (aspect-ratio cropping and the camera's bottom-origin Y axis are both accounted for) —
        the only remaining assumption is the exact grid size used to convert to the numbers
        actually saved, based on observed value ranges rather than a confirmed spec.
      </div>

      <div
        ref={containerRef}
        className="relative aspect-video w-full select-none overflow-hidden rounded-lg bg-black"
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        {children}

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-sm text-white">
            Loading trigger zone…
          </div>
        )}

        {!loading && loadError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 px-4 text-center text-sm text-white">
            <AlertCircle className="h-5 w-5 text-red-400" />
            {loadError}
          </div>
        )}

        {!loading && !loadError && box && (
          <div
            onPointerDown={onBoxPointerDown}
            className="absolute box-border border-2 border-blue-500 bg-blue-500/15"
            style={(() => {
              const c = sourceBoxToContainer(box, contentRect);
              return {
                left: `${c.left * 100}%`,
                top: `${c.top * 100}%`,
                width: `${(c.right - c.left) * 100}%`,
                height: `${(c.bottom - c.top) * 100}%`,
                cursor: dragging === 'move' ? 'grabbing' : 'grab',
              };
            })()}
          >
            {HANDLES.map((h) => (
              <div
                key={h}
                onPointerDown={onHandlePointerDown(h)}
                className="absolute h-3.5 w-3.5 rounded-sm border-2 border-blue-500 bg-white"
                style={{
                  cursor: `${h}-resize`,
                  top: h.includes('n') ? -7 : undefined,
                  bottom: h.includes('s') ? -7 : undefined,
                  left: h.includes('w') ? -7 : undefined,
                  right: h.includes('e') ? -7 : undefined,
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <p className="mr-auto text-xs text-slate-500">
          Drag corners to resize, drag the box to move it.
        </p>
        <button
          type="button"
          onClick={handleResetToDefault}
          disabled={loading || !!loadError || saving}
          title="Reset to the default centered box, discarding unsaved changes"
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-60"
        >
          Reset to Default
        </button>
        <button
          type="button"
          onClick={handleReset}
          disabled={loading || !!loadError || saving}
          title="Revert to the last saved zone"
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-60"
        >
          Undo Changes
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={loading || !!loadError || saving}
          className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save trigger zone'}
        </button>
      </div>

      {saveError && (
        <div className="mt-2 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {saveError}
        </div>
      )}
      {saveSuccess && (
        <div className="mt-2 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Trigger zone saved to the camera.
        </div>
      )}
    </div>
  );
}
