import { useEffect, useState } from 'react';
import { getTriggerZone } from '../../services/cameraZoneService';
import { CAMERA_COORD_SPACE, cornersToBox, type FractionBox } from './triggerZoneMath';

interface TriggerZoneOverlayProps {
  gateId: string;
}

// Passive, read-only echo of the saved trigger zone on the always-visible
// live stream tile (as opposed to TriggerZoneEditor, which is the
// draggable/resizable editor shown inside its own modal). Fails silently —
// a gate with no camera_ip or an unreachable camera shouldn't clutter the
// live view with an error banner; it should just show no box.
export default function TriggerZoneOverlay({ gateId }: TriggerZoneOverlayProps) {
  const [box, setBox] = useState<FractionBox | null>(null);

  useEffect(() => {
    let cancelled = false;
    setBox(null);
    getTriggerZone(gateId)
      .then((corners) => {
        if (!cancelled) setBox(cornersToBox(corners, CAMERA_COORD_SPACE));
      })
      .catch(() => {
        // Silently skip.
      });
    return () => {
      cancelled = true;
    };
  }, [gateId]);

  if (!box) return null;

  return (
    <div
      className="pointer-events-none absolute box-border border-2 border-blue-400/90 bg-blue-400/10"
      style={{
        left: `${box.left * 100}%`,
        top: `${box.top * 100}%`,
        width: `${(box.right - box.left) * 100}%`,
        height: `${(box.bottom - box.top) * 100}%`,
      }}
    />
  );
}
