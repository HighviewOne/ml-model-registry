import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Loader2, 
  AlertCircle,
  FlaskConical,
  Rocket,
  TrendingUp,
  Archive,
  Clock,
  User,
  Tag,
  GitBranch,
  ChevronRight
} from 'lucide-react';
import { useModel, useModelMutations } from '../hooks/useApi';
import { api } from '../services/api';
import type { DeploymentStatus, ModelVersion } from '../types';

const statusConfig: Record<DeploymentStatus, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  development: { icon: FlaskConical, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Development' },
  staging: { icon: Rocket, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Staging' },
  production: { icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Production' },
  archived: { icon: Archive, color: 'text-slate-500', bg: 'bg-slate-100', label: 'Archived' },
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

const statusTransitions: Record<DeploymentStatus, DeploymentStatus[]> = {
  development: ['staging', 'archived'],
  staging: ['production', 'development', 'archived'],
  production: ['staging', 'archived'],
  archived: ['development'],
};

export default function ModelDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: model, loading, error, refetch } = useModel(id);
  const { deleteModel, deployModel, loading: mutating, error: mutationError } = useModelMutations();
  
  const [versions, setVersions] = useState<ModelVersion[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (id) {
      setVersionsLoading(true);
      api.versions.list(id)
        .then(setVersions)
        .catch(console.error)
        .finally(() => setVersionsLoading(false));
    }
  }, [id]);

  const handleDelete = async () => {
    if (!id) return;
    const success = await deleteModel(id);
    if (success) {
      navigate('/models');
    }
  };

  const handleStatusChange = async (newStatus: DeploymentStatus) => {
    if (!id) return;
    const updated = await deployModel(id, newStatus);
    if (updated) {
      refetch();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error || !model) {
    return (
      <div className="space-y-4">
        <Link
          to="/models"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Models
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <p className="text-red-700">{error || 'Model not found'}</p>
        </div>
      </div>
    );
  }

  const config = statusConfig[model.status];
  const StatusIcon = config.icon;
  const availableTransitions = statusTransitions[model.status];

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        to="/models"
        className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Models
      </Link>

      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{model.name}</h1>
              <span className={`px-3 py-1 rounded-lg text-sm font-medium ${frameworkColors[model.framework]}`}>
                {model.framework}
              </span>
            </div>
            <p className="mt-2 text-slate-500 max-w-2xl">
              {model.description || 'No description provided'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to={`/models/${model.id}/edit`}
              className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Edit className="h-4 w-4" />
              Edit
            </Link>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 font-medium rounded-lg hover:bg-red-50 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        </div>

        {/* Meta Info */}
        <div className="mt-6 flex flex-wrap gap-6 text-sm">
          <div className="flex items-center gap-2 text-slate-500">
            <GitBranch className="h-4 w-4" />
            <span>Version {model.current_version}</span>
          </div>
          {model.author && (
            <div className="flex items-center gap-2 text-slate-500">
              <User className="h-4 w-4" />
              <span>{model.author}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-slate-500">
            <Clock className="h-4 w-4" />
            <span>Updated {formatDate(model.updated_at)}</span>
          </div>
        </div>

        {/* Tags */}
        {model.tags && model.tags.length > 0 && (
          <div className="mt-4 flex items-center gap-2">
            <Tag className="h-4 w-4 text-slate-400" />
            <div className="flex flex-wrap gap-1">
              {model.tags.map((tag) => (
                <span key={tag} className="px-2 py-1 bg-slate-100 text-slate-600 text-sm rounded">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {mutationError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <p className="text-red-700">{mutationError}</p>
        </div>
      )}

      {/* Status & Deployment */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Deployment Status</h2>
        
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${config.bg}`}>
            <StatusIcon className={`h-5 w-5 ${config.color}`} />
            <span className={`font-medium ${config.color}`}>{config.label}</span>
          </div>
          
          {availableTransitions.length > 0 && (
            <>
              <ChevronRight className="h-5 w-5 text-slate-300" />
              <div className="flex gap-2">
                {availableTransitions.map((status) => {
                  const targetConfig = statusConfig[status];
                  const TargetIcon = targetConfig.icon;
                  return (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(status)}
                      disabled={mutating}
                      className={`inline-flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors disabled:opacity-50 ${
                        status === 'production'
                          ? 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                          : status === 'archived'
                          ? 'border-slate-300 text-slate-600 hover:bg-slate-50'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <TargetIcon className="h-4 w-4" />
                      Move to {targetConfig.label}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Metrics */}
      {model.metrics && Object.keys(model.metrics).length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Performance Metrics</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.entries(model.metrics).map(([key, value]) => (
              <div key={key} className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm text-slate-500 capitalize">{key.replace(/_/g, ' ')}</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {typeof value === 'number' ? value.toFixed(4) : value}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Version History */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Version History</h2>
        
        {versionsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
          </div>
        ) : versions.length > 0 ? (
          <div className="space-y-3">
            {versions.map((version, index) => (
              <div
                key={version.id}
                className={`flex items-start gap-4 p-4 rounded-lg ${
                  index === 0 ? 'bg-primary-50 border border-primary-200' : 'bg-slate-50'
                }`}
              >
                <div className={`px-2 py-1 rounded font-mono text-sm ${
                  index === 0 ? 'bg-primary-600 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  v{version.version}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-700">
                    {version.changelog || 'No changelog provided'}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatDate(version.created_at)}
                  </p>
                  {version.metrics && Object.keys(version.metrics).length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {Object.entries(version.metrics).slice(0, 3).map(([key, value]) => (
                        <span key={key} className="text-xs bg-white px-2 py-1 rounded border border-slate-200">
                          {key}: {typeof value === 'number' ? value.toFixed(3) : value}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {index === 0 && (
                  <span className="px-2 py-1 bg-primary-600 text-white text-xs font-medium rounded">
                    Current
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-center py-8">No version history available</p>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">Delete Model</h3>
            <p className="mt-2 text-slate-500">
              Are you sure you want to delete <strong>{model.name}</strong>? This action cannot be undone and will remove all version history.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={mutating}
                className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {mutating ? 'Deleting...' : 'Delete Model'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
