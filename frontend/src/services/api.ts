/**
 * Centralized API service for all backend communication.
 * This module handles all HTTP requests to the backend API.
 */

import type {
  Model,
  ModelCreate,
  ModelUpdate,
  ModelListResponse,
  ModelVersion,
  ModelVersionCreate,
  DeploymentRequest,
  DashboardStats,
  ModelFilters,
  ApiError,
} from '../types';

const API_BASE_URL = '/api/v1';

/**
 * Custom error class for API errors.
 */
export class ApiException extends Error {
  constructor(
    public status: number,
    public detail: string
  ) {
    super(detail);
    this.name = 'ApiException';
  }
}

/**
 * Generic fetch wrapper with error handling.
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    let detail = 'An error occurred';
    try {
      const errorData: ApiError = await response.json();
      detail = errorData.detail;
    } catch {
      detail = response.statusText;
    }
    throw new ApiException(response.status, detail);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

/**
 * Build query string from filters object.
 */
function buildQueryString(filters: Record<string, unknown>): string {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}

// ============== Models API ==============

export const modelsApi = {
  /**
   * List all models with optional filtering and pagination.
   */
  list: (filters: ModelFilters = {}): Promise<ModelListResponse> => {
    const query = buildQueryString(filters as Record<string, unknown>);
    return apiRequest<ModelListResponse>(`/models${query}`);
  },

  /**
   * Get a single model by ID.
   */
  get: (id: string): Promise<Model> => {
    return apiRequest<Model>(`/models/${id}`);
  },

  /**
   * Create a new model.
   */
  create: (data: ModelCreate): Promise<Model> => {
    return apiRequest<Model>('/models', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update an existing model.
   */
  update: (id: string, data: ModelUpdate): Promise<Model> => {
    return apiRequest<Model>(`/models/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete a model.
   */
  delete: (id: string): Promise<void> => {
    return apiRequest<void>(`/models/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Update model deployment status.
   */
  deploy: (id: string, data: DeploymentRequest): Promise<Model> => {
    return apiRequest<Model>(`/models/${id}/deploy`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// ============== Versions API ==============

export const versionsApi = {
  /**
   * List all versions for a model.
   */
  list: (modelId: string): Promise<ModelVersion[]> => {
    return apiRequest<ModelVersion[]>(`/models/${modelId}/versions`);
  },

  /**
   * Create a new version for a model.
   */
  create: (modelId: string, data: ModelVersionCreate): Promise<ModelVersion> => {
    return apiRequest<ModelVersion>(`/models/${modelId}/versions`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// ============== Stats API ==============

export const statsApi = {
  /**
   * Get dashboard statistics.
   */
  get: (): Promise<DashboardStats> => {
    return apiRequest<DashboardStats>('/stats');
  },
};

// ============== Health API ==============

export const healthApi = {
  /**
   * Check API health.
   */
  check: async (): Promise<{ status: string; version: string }> => {
    const response = await fetch('/health');
    return response.json();
  },
};

// Export all APIs as a single object for convenience
export const api = {
  models: modelsApi,
  versions: versionsApi,
  stats: statsApi,
  health: healthApi,
};

export default api;
