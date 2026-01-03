import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Box, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  Loader2,
  AlertCircle,
  FlaskConical,
  Rocket,
  TrendingUp,
  Archive,
  X
} from 'lucide-react';
import { useModels } from '../hooks/useApi';
import type { Model, Framework, DeploymentStatus } from '../types';

const statusConfig: Record<DeploymentStatus, { icon: React.ElementType; color: string; bg: string }> = {
  development: { icon: FlaskConical, color: 'text-amber-600', bg: 'bg-amber-50' },
  staging: { icon: Rocket, color: 'text-blue-600', bg: 'bg-blue-50' },
  production: { icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  archived: { icon: Archive, color: 'text-slate-500', bg: 'bg-slate-100' },
};

const frameworkColors: Record<string, string> = {
  sklearn: 'bg-orange-100 text-orange-800',
  tensorflow: 'bg-yellow-100 text-yellow-800',
  pytorch: 'bg-red-100 text-red-800',
  xgboost: 'bg-green-100 text-green-800',
  lightgbm: 'bg-purple-100 text-purple-800',
  onnx: 'bg-blue-100 text-blue-800',
  other: 'bg-slate-100 text-slate-800',
};

const frameworks: Framework[] = ['sklearn', 'tensorflow', 'pytorch', 'xgboost', 'lightgbm', 'onnx', 'other'];
const statuses: DeploymentStatus[] = ['development', 'staging', 'production', 'archived'];

function ModelRow({ model }: { model: Model }) {
  const config = statusConfig[model.status];
  const StatusIcon = config.icon;
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Link
      to={`/models/${model.id}`}
      className="block bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md hover:border-primary-300 transition-all"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-slate-900 truncate">{model.name}</h3>
            <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${frameworkColors[model.framework]}`}>
              {model.framework}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1 line-clamp-1">
            {model.description || 'No description'}
          </p>
        </div>
        <div className="flex items-center gap-4 ml-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-slate-900">v{model.current_version}</p>
            <p className="text-xs text-slate-500">{formatDate(model.updated_at)}</p>
          </div>
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
            <StatusIcon className="h-3 w-3" />
            {model.status}
          </span>
        </div>
      </div>
      {model.tags && model.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {model.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded">
              {tag}
            </span>
          ))}
          {model.tags.length > 3 && (
            <span className="px-2 py-0.5 text-slate-400 text-xs">
              +{model.tags.length - 3} more
            </span>
          )}
        </div>
      )}
    </Link>
  );
}

export default function ModelList() {
  const [searchInput, setSearchInput] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  const { data, loading, error, filters, updateFilters } = useModels({
    limit: 10,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: searchInput, skip: 0 });
  };

  const clearFilters = () => {
    setSearchInput('');
    updateFilters({ search: undefined, framework: undefined, status: undefined, skip: 0 });
  };

  const hasActiveFilters = filters.search || filters.framework || filters.status;

  const totalPages = data ? Math.ceil(data.total / (filters.limit || 10)) : 0;
  const currentPage = data ? Math.floor((filters.skip || 0) / (filters.limit || 10)) + 1 : 1;

  const goToPage = (page: number) => {
    updateFilters({ skip: (page - 1) * (filters.limit || 10) });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Models</h1>
          <p className="mt-1 text-slate-500">
            {data ? `${data.total} models registered` : 'Loading...'}
          </p>
        </div>
        <Link
          to="/models/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Register Model
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search models..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors"
            >
              Search
            </button>
          </form>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
              hasActiveFilters
                ? 'border-primary-300 bg-primary-50 text-primary-700'
                : 'border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Filter className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <span className="ml-1 px-1.5 py-0.5 bg-primary-600 text-white text-xs rounded-full">
                {[filters.framework, filters.status, filters.search].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Framework</label>
                <select
                  value={filters.framework || ''}
                  onChange={(e) => updateFilters({ framework: e.target.value as Framework || undefined, skip: 0 })}
                  className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">All Frameworks</option>
                  {frameworks.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => updateFilters({ status: e.target.value as DeploymentStatus || undefined, skip: 0 })}
                  className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">All Statuses</option>
                  {statuses.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              {hasActiveFilters && (
                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center gap-1 px-3 py-2 text-sm text-slate-600 hover:text-slate-900"
                  >
                    <X className="h-4 w-4" />
                    Clear filters
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Model List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <p className="text-red-700">{error}</p>
        </div>
      ) : data && data.items.length > 0 ? (
        <>
          <div className="space-y-3">
            {data.items.map((model) => (
              <ModelRow key={model.id} model={model} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-4 py-3">
              <p className="text-sm text-slate-500">
                Showing {(filters.skip || 0) + 1} to {Math.min((filters.skip || 0) + (filters.limit || 10), data.total)} of {data.total} models
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 border border-slate-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm text-slate-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-slate-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <Box className="h-12 w-12 mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-900">No models found</h3>
          <p className="mt-1 text-slate-500">
            {hasActiveFilters
              ? 'Try adjusting your filters'
              : 'Get started by registering your first model'}
          </p>
          {!hasActiveFilters && (
            <Link
              to="/models/new"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Register Model
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
