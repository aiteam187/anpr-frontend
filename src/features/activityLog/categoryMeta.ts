export const CATEGORY_LABELS: Record<string, string> = {
  authorized_vehicle: 'Authorized Vehicle',
  settings: 'Settings',
  gate_config: 'Gate Config',
  vehicle_entry: 'Vehicle Entry',
  vehicle_exit: 'Vehicle Exit',
  unauthorized_attempt: 'Unauthorized Attempt',
  user_account: 'User Account',
  manual_gate_control: 'Manual Gate Control',
  trigger_zone: 'Trigger Zone',
  camera_relay_signal: 'Camera Relay Signal',
  compliance_warning: 'Compliance Warning',
  overstay: 'Overstay',
};

export const CATEGORY_STYLES: Record<string, string> = {
  authorized_vehicle: 'bg-emerald-50 text-emerald-700',
  settings: 'bg-slate-100 text-slate-600',
  gate_config: 'bg-blue-50 text-blue-700',
  vehicle_entry: 'bg-emerald-50 text-emerald-700',
  vehicle_exit: 'bg-blue-50 text-blue-700',
  unauthorized_attempt: 'bg-red-50 text-red-700',
  user_account: 'bg-violet-50 text-violet-700',
  manual_gate_control: 'bg-amber-50 text-amber-700',
  trigger_zone: 'bg-blue-50 text-blue-700',
  camera_relay_signal: 'bg-indigo-50 text-indigo-700',
  compliance_warning: 'bg-amber-50 text-amber-700',
  overstay: 'bg-red-50 text-red-700',
};

export function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}

export function categoryStyle(category: string): string {
  return CATEGORY_STYLES[category] ?? 'bg-slate-100 text-slate-600';
}
