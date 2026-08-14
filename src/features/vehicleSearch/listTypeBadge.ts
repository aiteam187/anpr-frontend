import type { ListType } from '../../types/authorizedVehicle';

export const LIST_TYPE_LABELS: Record<ListType, string> = {
  whitelist: 'Allowlist',
  blacklist: 'Blacklist',
  visitor: 'Visitor',
};

export const LIST_TYPE_STYLES: Record<ListType, string> = {
  whitelist: 'bg-emerald-50 text-emerald-700',
  blacklist: 'bg-red-50 text-red-700',
  visitor: 'bg-blue-50 text-blue-700',
};
