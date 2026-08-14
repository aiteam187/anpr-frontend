import { apiGet, apiPost } from './api';

export interface AlgoZoneCorners {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  x3: number;
  y3: number;
}

function isValidCorners(v: unknown): v is AlgoZoneCorners {
  if (!v || typeof v !== 'object') return false;
  const c = v as Record<string, unknown>;
  return ['x0', 'y0', 'x1', 'y1', 'x2', 'y2', 'x3', 'y3'].every((k) => typeof c[k] === 'number');
}

export async function getTriggerZone(gateId: string): Promise<AlgoZoneCorners> {
  const res = await apiGet<unknown>(`/gates/${gateId}/trigger-zone`);
  if (!isValidCorners(res)) {
    throw new Error('Backend response did not include a valid trigger zone.');
  }
  return res;
}

export async function setTriggerZone(
  gateId: string,
  corners: AlgoZoneCorners,
  changedBy?: string,
): Promise<void> {
  await apiPost(
    `/gates/${gateId}/trigger-zone`,
    corners,
    changedBy ? { 'x-changed-by': changedBy } : undefined,
  );
}
