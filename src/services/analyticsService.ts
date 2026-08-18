import { apiGet } from './api';
import type { AnalyticsQuery, AnalyticsSummary } from '../types/analytics';

export function getAnalyticsSummary(query: AnalyticsQuery) {
  const params = new URLSearchParams();
  if (query.start_date) params.set('start_date', query.start_date);
  if (query.end_date) params.set('end_date', query.end_date);
  if (query.cam_id) params.set('cam_id', query.cam_id);
  const qs = params.toString();
  return apiGet<AnalyticsSummary>(`/analytics/summary${qs ? `?${qs}` : ''}`);
}
