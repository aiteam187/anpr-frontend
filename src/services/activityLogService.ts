import { apiGet } from './api';
import type { ActivityLogQuery, ActivityLogResponse } from '../types/activityLog';

export function getActivityLog(query: ActivityLogQuery) {
  const params = new URLSearchParams();
  if (query.category) params.set('category', query.category);
  if (query.start_date) params.set('start_date', query.start_date);
  if (query.end_date) params.set('end_date', query.end_date);
  if (query.target) params.set('target', query.target);
  params.set('limit', String(query.limit ?? 25));
  params.set('offset', String(query.offset ?? 0));
  return apiGet<ActivityLogResponse>(`/activity-log?${params.toString()}`);
}
