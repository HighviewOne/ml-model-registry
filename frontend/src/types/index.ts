/**
 * TypeScript types matching the OpenAPI specification.
 */

export type DeploymentStatus = 'development' | 'staging' | 'production' | 'archived';

export type Framework = 
  | 'sklearn'
  | 'tensorflow'
  | 'pytorch'
  | 'xgboost'
  | 'lightgbm'
  | 'onnx'
  | 'other';

export interface Metrics {
  [key: string]: number;
}

export interface Model {
  id: string;
  name: string;
  description?: string;
  framework: Framework;
  status: DeploymentStatus;
  current_version?: string;
  metrics?: Metrics;
  tags?: string[];
  author?: string;
  created_at: string;
  updated_at: string;
}

export interface ModelCreate {
  name: string;
  description?: string;
  framework: Framework;
  version?: string;
  metrics?: Metrics;
  tags?: string[];
  author?: string;
}

export interface ModelUpdate {
  name?: string;
  description?: string;
  tags?: string[];
}

export interface ModelListResponse {
  items: Model[];
  total: number;
  skip: number;
  limit: number;
}

export interface ModelVersion {
  id: string;
  model_id: string;
  version: string;
  metrics?: Metrics;
  changelog?: string;
  created_at: string;
}

export interface ModelVersionCreate {
  version: string;
  metrics?: Metrics;
  changelog?: string;
}

export interface DeploymentRequest {
  status: DeploymentStatus;
}

export interface DashboardStats {
  total_models: number;
  models_by_status: Record<string, number>;
  models_by_framework: Record<string, number>;
  recent_models: Model[];
}

export interface ApiError {
  detail: string;
}

export interface ModelFilters {
  skip?: number;
  limit?: number;
  framework?: Framework;
  status?: DeploymentStatus;
  search?: string;
}
