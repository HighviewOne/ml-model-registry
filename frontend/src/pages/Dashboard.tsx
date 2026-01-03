import { Link } from 'react-router-dom';
import { 
  Box, 
  Rocket, 
  FlaskConical, 
  Archive, 
  TrendingUp,
  ArrowRight,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useStats } from '../hooks/useApi';
import type { Model } from '../types';

const statusConfig = {
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

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  color 
}: { 
  title: string; 
  value: number; 
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

function ModelCard({ model }: { model: Model }) {
  const config = statusConfig[model.status];
  const StatusIcon = config.icon;
  
  return (
    <Link
      to={`/models/${model.id}`}
      className="block bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md hover:border-primary-300 transition-all"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 truncate">{model.name}</h3>
          <p className="text-sm text-slate-500 mt-1 line-clamp-1">
            {model.description || 'No description'}
          </p>
        </div>
        <span className={`ml-4 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
          <StatusIcon className="h-3 w-3" />
          {model.status}
        </span>
      </div>
      <div className="mt-3 flex items-center gap-3 text-sm">
        <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${frameworkColors[model.framework] || frameworkColors.other}`}>
          {model.framework}
        </span>
        <span className="text-slate-400">v{model.current_version}</span>
        {model.author && (
          <span className="text-slate-400">by {model.author}</span>
        )}
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const { data: stats, loading, error } = useStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
        <AlertCircle className="h-5 w-5 text-red-500" />
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (!stats) return null;

  const statusStats = [
    { 
      title: 'Development', 
      value: stats.models_by_status.development || 0, 
      icon: FlaskConical,
      color: 'bg-amber-50 text-amber-600'
    },
    { 
      title: 'Staging', 
      value: stats.models_by_status.staging || 0, 
      icon: Rocket,
      color: 'bg-blue-50 text-blue-600'
    },
    { 
      title: 'Production', 
      value: stats.models_by_status.production || 0, 
      icon: TrendingUp,
      color: 'bg-emerald-50 text-emerald-600'
    },
    { 
      title: 'Archived', 
      value: stats.models_by_status.archived || 0, 
      icon: Archive,
      color: 'bg-slate-100 text-slate-600'
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-slate-500">
          Overview of your ML model registry
        </p>
      </div>

      {/* Total Models Card */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-primary-100">Total Registered Models</p>
            <p className="mt-2 text-5xl font-bold">{stats.total_models}</p>
          </div>
          <Box className="h-16 w-16 text-primary-300" />
        </div>
      </div>

      {/* Status Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statusStats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Framework Distribution */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900">Models by Framework</h2>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.entries(stats.models_by_framework).map(([framework, count]) => (
            <div
              key={framework}
              className={`p-3 rounded-lg text-center ${frameworkColors[framework] || frameworkColors.other}`}
            >
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-sm font-medium">{framework}</p>
            </div>
          ))}
          {Object.keys(stats.models_by_framework).length === 0 && (
            <p className="col-span-full text-center text-slate-500 py-4">
              No models registered yet
            </p>
          )}
        </div>
      </div>

      {/* Recent Models */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Recent Models</h2>
          <Link
            to="/models"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            View all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="space-y-3">
          {stats.recent_models.length > 0 ? (
            stats.recent_models.map((model) => (
              <ModelCard key={model.id} model={model} />
            ))
          ) : (
            <div className="text-center py-8 text-slate-500">
              <Box className="h-12 w-12 mx-auto text-slate-300 mb-3" />
              <p>No models registered yet</p>
              <Link
                to="/models/new"
                className="mt-2 inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
              >
                Register your first model
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
