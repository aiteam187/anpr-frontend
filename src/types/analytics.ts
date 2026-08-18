export interface AnalyticsPeriod {
  start_date: string;
  end_date: string;
}

export interface AnalyticsTotals {
  entries: number;
  exits: number;
  currently_inside: number;
  unauthorized_attempts: number;
  blacklisted_attempts: number;
  visitor_entries: number;
}

export interface TrafficByDay {
  date: string;
  entries: number;
  exits: number;
}

export interface TrafficByHour {
  hour: number;
  entries: number;
}

export interface PeakHour {
  hour: number;
  count: number;
}

export interface VehicleTypeCount {
  vehicle_type: string;
  count: number;
}

export interface AnalyticsSummary {
  period: AnalyticsPeriod;
  totals: AnalyticsTotals;
  traffic_by_day: TrafficByDay[];
  traffic_by_hour: TrafficByHour[];
  peak_hour: PeakHour | null;
  vehicle_type_distribution: VehicleTypeCount[];
  avg_recognition_confidence_pct: number | null;
}

export interface AnalyticsQuery {
  start_date?: string;
  end_date?: string;
  cam_id?: string;
}
