import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { modelsApi, versionsApi, statsApi, ApiException } from '../src/services/api';

// Mock fetch globally
const mockFetch = vi.fn();
(globalThis as unknown as { fetch: typeof fetch }).fetch = mockFetch;

describe('API Service', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('modelsApi', () => {
    describe('list', () => {
      it('should fetch models with default parameters', async () => {
        const mockResponse = {
          items: [],
          total: 0,
          skip: 0,
          limit: 20,
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await modelsApi.list();

        expect(mockFetch).toHaveBeenCalledWith(
          '/api/v1/models',
          expect.objectContaining({
            headers: { 'Content-Type': 'application/json' },
          })
        );
        expect(result).toEqual(mockResponse);
      });

      it('should include query parameters when provided', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ items: [], total: 0, skip: 0, limit: 10 }),
        });

        await modelsApi.list({ framework: 'sklearn', status: 'production', limit: 10 });

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('framework=sklearn'),
          expect.any(Object)
        );
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('status=production'),
          expect.any(Object)
        );
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('limit=10'),
          expect.any(Object)
        );
      });
    });

    describe('get', () => {
      it('should fetch a single model by ID', async () => {
        const mockModel = {
          id: '123',
          name: 'test-model',
          framework: 'sklearn',
          status: 'development',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockModel,
        });

        const result = await modelsApi.get('123');

        expect(mockFetch).toHaveBeenCalledWith(
          '/api/v1/models/123',
          expect.any(Object)
        );
        expect(result).toEqual(mockModel);
      });

      it('should throw ApiException on 404', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
          json: async () => ({ detail: 'Model not found' }),
        });

        await expect(modelsApi.get('nonexistent')).rejects.toThrow(ApiException);
      });
    });

    describe('create', () => {
      it('should create a new model', async () => {
        const newModel = {
          name: 'new-model',
          framework: 'pytorch' as const,
          description: 'A new model',
        };

        const createdModel = {
          ...newModel,
          id: '456',
          status: 'development',
          current_version: '1.0.0',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => createdModel,
        });

        const result = await modelsApi.create(newModel);

        expect(mockFetch).toHaveBeenCalledWith(
          '/api/v1/models',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify(newModel),
          })
        );
        expect(result).toEqual(createdModel);
      });

      it('should throw ApiException on duplicate name', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 409,
          json: async () => ({ detail: "Model with name 'existing' already exists" }),
        });

        await expect(
          modelsApi.create({ name: 'existing', framework: 'sklearn' })
        ).rejects.toThrow(ApiException);
      });
    });

    describe('update', () => {
      it('should update an existing model', async () => {
        const updateData = {
          name: 'updated-name',
          description: 'Updated description',
        };

        const updatedModel = {
          id: '123',
          ...updateData,
          framework: 'sklearn',
          status: 'development',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => updatedModel,
        });

        const result = await modelsApi.update('123', updateData);

        expect(mockFetch).toHaveBeenCalledWith(
          '/api/v1/models/123',
          expect.objectContaining({
            method: 'PUT',
            body: JSON.stringify(updateData),
          })
        );
        expect(result).toEqual(updatedModel);
      });
    });

    describe('delete', () => {
      it('should delete a model', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 204,
        });

        await modelsApi.delete('123');

        expect(mockFetch).toHaveBeenCalledWith(
          '/api/v1/models/123',
          expect.objectContaining({
            method: 'DELETE',
          })
        );
      });
    });

    describe('deploy', () => {
      it('should update deployment status', async () => {
        const updatedModel = {
          id: '123',
          name: 'test-model',
          framework: 'sklearn',
          status: 'staging',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => updatedModel,
        });

        const result = await modelsApi.deploy('123', { status: 'staging' });

        expect(mockFetch).toHaveBeenCalledWith(
          '/api/v1/models/123/deploy',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ status: 'staging' }),
          })
        );
        expect(result.status).toBe('staging');
      });
    });
  });

  describe('versionsApi', () => {
    describe('list', () => {
      it('should fetch versions for a model', async () => {
        const mockVersions = [
          { id: 'v1', model_id: '123', version: '1.0.0', created_at: '2024-01-01T00:00:00Z' },
          { id: 'v2', model_id: '123', version: '1.1.0', created_at: '2024-01-02T00:00:00Z' },
        ];

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockVersions,
        });

        const result = await versionsApi.list('123');

        expect(mockFetch).toHaveBeenCalledWith(
          '/api/v1/models/123/versions',
          expect.any(Object)
        );
        expect(result).toEqual(mockVersions);
      });
    });

    describe('create', () => {
      it('should create a new version', async () => {
        const newVersion = {
          version: '2.0.0',
          metrics: { accuracy: 0.98 },
          changelog: 'Major update',
        };

        const createdVersion = {
          ...newVersion,
          id: 'v3',
          model_id: '123',
          created_at: '2024-01-03T00:00:00Z',
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => createdVersion,
        });

        const result = await versionsApi.create('123', newVersion);

        expect(mockFetch).toHaveBeenCalledWith(
          '/api/v1/models/123/versions',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify(newVersion),
          })
        );
        expect(result).toEqual(createdVersion);
      });
    });
  });

  describe('statsApi', () => {
    describe('get', () => {
      it('should fetch dashboard statistics', async () => {
        const mockStats = {
          total_models: 10,
          models_by_status: { development: 5, staging: 3, production: 2 },
          models_by_framework: { sklearn: 6, pytorch: 4 },
          recent_models: [],
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockStats,
        });

        const result = await statsApi.get();

        expect(mockFetch).toHaveBeenCalledWith(
          '/api/v1/stats',
          expect.any(Object)
        );
        expect(result).toEqual(mockStats);
      });
    });
  });
});
