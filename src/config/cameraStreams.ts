/**
 * FALLBACK ONLY. GateConfig now has its own `stream_path` field (set via the
 * Add/Edit Gate form) — that's the real source of truth, and callers should
 * prefer `gate.stream_path` directly. This hardcoded map only exists for
 * gates configured before that field existed, so an old gate with no
 * stream_path set doesn't silently break. Don't add new entries here — set
 * the Stream Path field on the gate itself instead.
 */
const CAMERA_STREAM_PATHS: Record<string, string> = {
  '1803001cce65': 'stream1',
  '1803001cce17': 'stream2',
};

const DEFAULT_STREAM_PATH = 'stream1';

export function getStreamPathForCamera(cameraId: string): string {
  return CAMERA_STREAM_PATHS[cameraId.toLowerCase()] ?? DEFAULT_STREAM_PATH;
}
