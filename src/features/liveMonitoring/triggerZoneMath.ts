import type { AlgoZoneCorners } from '../../services/cameraZoneService';
import type { FractionBox } from '../../utils/videoFrame';

// Grid size still an assumption (see TriggerZoneEditor.tsx header comment)
// based on observed value ranges (x topped out ≈157, y ≈115), but the width
// side of it has now been cross-checked live against the camera's own admin
// UI across multiple boxes and holds up well.
export const CAMERA_COORD_SPACE = { width: 176, height: 144 };

// CONFIRMED live against the camera's own admin UI (compared two different
// boxes — one symmetric, which couldn't distinguish this, and one
// asymmetric, which did): the camera's y-axis is bottom-origin (y increases
// upward), not the usual top-origin screen convention. A box we render at
// on-screen fraction [top, bottom] must therefore flip through
// `1 - value` when converting to/from the camera's raw y values, unlike x
// which is a direct left-origin scale with no flip.

export type { FractionBox };

export const DEFAULT_BOX: FractionBox = { left: 0.2, top: 0.2, right: 0.8, bottom: 0.8 };

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

export function cornersToBox(
  corners: AlgoZoneCorners | null,
  coordSpace: { width: number; height: number },
): FractionBox {
  if (!corners) return DEFAULT_BOX;
  const xs = [corners.x0, corners.x1, corners.x2, corners.x3];
  const ys = [corners.y0, corners.y1, corners.y2, corners.y3];
  return {
    left: clamp01(Math.min(...xs) / coordSpace.width),
    right: clamp01(Math.max(...xs) / coordSpace.width),
    // y is bottom-origin on the camera — flip to top-origin screen fractions.
    top: clamp01(1 - Math.max(...ys) / coordSpace.height),
    bottom: clamp01(1 - Math.min(...ys) / coordSpace.height),
  };
}

export function boxToCorners(
  box: FractionBox,
  coordSpace: { width: number; height: number },
): AlgoZoneCorners {
  const xLeft = Math.round(box.left * coordSpace.width);
  const xRight = Math.round(box.right * coordSpace.width);
  // y is bottom-origin on the camera — flip screen fractions back to it.
  const yForScreenTop = Math.round((1 - box.top) * coordSpace.height);
  const yForScreenBottom = Math.round((1 - box.bottom) * coordSpace.height);
  // Field order matches what was observed from the camera: x0,y0 bottom-left;
  // x1,y1 bottom-right; x2,y2 top-right; x3,y3 top-left.
  return {
    x0: xLeft,
    y0: yForScreenBottom,
    x1: xRight,
    y1: yForScreenBottom,
    x2: xRight,
    y2: yForScreenTop,
    x3: xLeft,
    y3: yForScreenTop,
  };
}
