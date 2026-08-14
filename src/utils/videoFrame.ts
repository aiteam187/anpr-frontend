export interface ContentRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface FractionBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export const FULL_CONTENT_RECT: ContentRect = { left: 0, top: 0, width: 1, height: 1 };

// A trigger-zone box's corners are fractions of the camera's full source
// frame. When that frame is displayed inside `rect` (a sub-region of the
// container, per computeCoverContentRect), this maps the box into
// container-relative fractions for rendering.
export function sourceBoxToContainer(box: FractionBox, rect: ContentRect): FractionBox {
  return {
    left: rect.left + box.left * rect.width,
    top: rect.top + box.top * rect.height,
    right: rect.left + box.right * rect.width,
    bottom: rect.top + box.bottom * rect.height,
  };
}

// Inverse of sourceBoxToContainer, for a single point — used to convert a
// pointer position (0..1 of the full container) back into source-frame
// fractions during drag/resize.
export function containerPointToSource(
  x: number,
  y: number,
  rect: ContentRect,
): { x: number; y: number } {
  const sx = rect.width === 0 ? 0 : (x - rect.left) / rect.width;
  const sy = rect.height === 0 ? 0 : (y - rect.top) / rect.height;
  return { x: Math.min(1, Math.max(0, sx)), y: Math.min(1, Math.max(0, sy)) };
}

// Where the camera's actual source frame is visible within its display
// container when rendered with CSS `object-fit: cover`. Cover scales the
// source to fill the container and crops whatever overflows — if the
// source's aspect ratio doesn't exactly match the container's, part of the
// frame is cropped off. Trigger-zone corners are fractions of the camera's
// full source frame, so any overlay drawn on top of a cropped display must
// account for this or it will be consistently misaligned.
export function computeCoverContentRect(
  videoAspect: number,
  containerAspect: number,
): ContentRect {
  if (
    !videoAspect ||
    !containerAspect ||
    !Number.isFinite(videoAspect) ||
    !Number.isFinite(containerAspect)
  ) {
    return FULL_CONTENT_RECT;
  }
  if (videoAspect > containerAspect) {
    // Source is proportionally wider than the container — height fills
    // exactly, width overflows and is cropped equally from both sides.
    const visibleWidth = containerAspect / videoAspect;
    return { left: (1 - visibleWidth) / 2, top: 0, width: visibleWidth, height: 1 };
  }
  if (videoAspect < containerAspect) {
    // Source is proportionally taller — width fills exactly, height
    // overflows and is cropped equally from top and bottom.
    const visibleHeight = videoAspect / containerAspect;
    return { left: 0, top: (1 - visibleHeight) / 2, width: 1, height: visibleHeight };
  }
  return FULL_CONTENT_RECT;
}
