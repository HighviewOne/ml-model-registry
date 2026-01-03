/**
 * Custom React hooks for data fetching and state management.
 */

import { useState, useEffect, useCallback } from 'react';
import { api, ApiException } from '../services/api';
import type {
  Model,
  ModelListResponse,
  DashboardStats,
  ModelFilters,
  ModelCreate,
  ModelUpdate,
  DeploymentStatus,
} from '../types';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook for fetching dashboard statistics.
 */
export function useStats() {
  const [state, setState] = useState<UseApiState<DashboardStats>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchStats = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const data = await api.stats.get();
      setState({ data, loading: false, error: null });
    } catch (err) {
      const message = err instanceof ApiException ? err.detail : 'Failed to fetch stats';
      setState({ data: null, loading: false, error: message });
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { ...state, refetch: fetchStats };
}

/**
 * Hook for fetching and managing models list.
 */
export function useModels(initialFilters: ModelFilters = {}) {
  const [state, setState] = useState<UseApiState<ModelListResponse>>({
    data: null,
    loading: true,
    error: null,
  });
  const [filters, setFilters] = useState<ModelFilters>(initialFilters);

  const fetchModels = useCallback(async (currentFilters: ModelFilters) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const data = await api.models.list(currentFilters);
      setState({ data, loading: false, error: null });
    } catch (err) {
      const message = err instanceof ApiException ? err.detail : 'Failed to fetch models';
      setState({ data: null, loading: false, error: message });
    }
  }, []);

  useEffect(() => {
    fetchModels(filters);
  }, [filters, fetchModels]);

  const updateFilters = useCallback((newFilters: Partial<ModelFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const refetch = useCallback(() => {
    fetchModels(filters);
  }, [filters, fetchModels]);

  return { ...state, filters, updateFilters, refetch };
}

/**
 * Hook for fetching a single model.
 */
export function useModel(id: string | undefined) {
  const [state, setState] = useState<UseApiState<Model>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchModel = useCallback(async () => {
    if (!id) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const data = await api.models.get(id);
      setState({ data, loading: false, error: null });
    } catch (err) {
      const message = err instanceof ApiException ? err.detail : 'Failed to fetch model';
      setState({ data: null, loading: false, error: message });
    }
  }, [id]);

  useEffect(() => {
    fetchModel();
  }, [fetchModel]);

  return { ...state, refetch: fetchModel };
}

/**
 * Hook for model mutations (create, update, delete).
 */
export function useModelMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createModel = useCallback(async (data: ModelCreate): Promise<Model | null> => {
    setLoading(true);
    setError(null);
    try {
      const model = await api.models.create(data);
      setLoading(false);
      return model;
    } catch (err) {
      const message = err instanceof ApiException ? err.detail : 'Failed to create model';
      setError(message);
      setLoading(false);
      return null;
    }
  }, []);

  const updateModel = useCallback(async (id: string, data: ModelUpdate): Promise<Model | null> => {
    setLoading(true);
    setError(null);
    try {
      const model = await api.models.update(id, data);
      setLoading(false);
      return model;
    } catch (err) {
      const message = err instanceof ApiException ? err.detail : 'Failed to update model';
      setError(message);
      setLoading(false);
      return null;
    }
  }, []);

  const deleteModel = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await api.models.delete(id);
      setLoading(false);
      return true;
    } catch (err) {
      const message = err instanceof ApiException ? err.detail : 'Failed to delete model';
      setError(message);
      setLoading(false);
      return false;
    }
  }, []);

  const deployModel = useCallback(async (id: string, status: DeploymentStatus): Promise<Model | null> => {
    setLoading(true);
    setError(null);
    try {
      const model = await api.models.deploy(id, { status });
      setLoading(false);
      return model;
    } catch (err) {
      const message = err instanceof ApiException ? err.detail : 'Failed to update deployment status';
      setError(message);
      setLoading(false);
      return null;
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    loading,
    error,
    createModel,
    updateModel,
    deleteModel,
    deployModel,
    clearError,
  };
}
