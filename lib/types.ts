export type Application = {
  id: string;
  name: string;
  description: string | null;
  public_url: string;
  health_check_url: string | null;
  icon: string | null;
  category_id: string | null;
  tags: string[];
  notes: string | null;
  docker_label: string | null;
  public_monitoring_enabled: boolean;
  internal_monitoring_enabled: boolean;
  failure_threshold: number;
  last_public_status: string | null;
  last_public_checked_at: string | null;
  last_public_response_ms: number | null;
  last_public_http_status: number | null;
  last_internal_status: string | null;
  last_internal_checked_at: string | null;
  last_internal_response_ms: number | null;
  last_internal_http_status: number | null;
  consecutive_failures: number;
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  created_at: string;
};

export type CheckResult = {
  id: string;
  application_id: string;
  application_name?: string;
  check_type: 'public' | 'internal';
  status: 'up' | 'down';
  http_status_code: number | null;
  response_time_ms: number | null;
  error_message: string | null;
  checked_at: string;
};

export type AppSettings = {
  id: number;
  monitoring_interval_seconds: number;
  retention_days: number;
  check_timeout_ms: number;
  updated_at: string;
};
