export type VisitorStatus = 'upcoming' | 'active' | 'expired' | 'revoked';

export function getVisitorStatus(
  isActive: boolean,
  validFrom: string | null,
  validUntil: string | null,
): VisitorStatus {
  if (!isActive) return 'revoked';

  const now = Date.now();
  const from = validFrom ? new Date(validFrom).getTime() : null;
  const until = validUntil ? new Date(validUntil).getTime() : null;

  if (until !== null && now > until) return 'expired';
  if (from !== null && now < from) return 'upcoming';
  return 'active';
}

export const VISITOR_STATUS_STYLES: Record<VisitorStatus, string> = {
  upcoming: 'bg-blue-50 text-blue-700',
  active: 'bg-emerald-50 text-emerald-700',
  expired: 'bg-slate-100 text-slate-600',
  revoked: 'bg-red-50 text-red-700',
};

export const VISITOR_STATUS_LABELS: Record<VisitorStatus, string> = {
  upcoming: 'Upcoming',
  active: 'Active',
  expired: 'Expired',
  revoked: 'Revoked',
};
