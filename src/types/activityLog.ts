export interface ActivityLogEntry {
  timestamp: string;
  category: string;
  action: string;
  target: string;
  details: string | null;
  changed_by: string;
}

export interface ActivityLogResponse {
  total_count: number;
  limit: number;
  offset: number;
  categories: string[];
  items: ActivityLogEntry[];
}

export interface ActivityLogQuery {
  category?: string;
  start_date?: string;
  end_date?: string;
  target?: string;
  limit?: number;
  offset?: number;
}
