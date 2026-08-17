// Maps the backend's UnauthorizedAttempt.reason codes (see vehicle_service.py's
// process_vehicle_event) to a human-readable label for display.
const UNAUTHORIZED_REASON_LABELS: Record<string, string> = {
  blacklisted: 'Blacklisted',
  inactive: 'Deactivated',
  not_on_whitelist: 'Not Authorized (not on whitelist)',
  visitor_pass_not_valid_now: 'Visitor Pass Expired or Not Yet Valid',
  visitor_compliance_expired: 'Visitor Compliance Expired',
};

export function formatUnauthorizedReason(reason: string | null): string {
  if (!reason) return 'Unauthorized';
  return UNAUTHORIZED_REASON_LABELS[reason] ?? reason;
}
