import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  AlertCircle,
  Plus,
  X
} from 'lucide-react';
import { useModel, useModelMutations } from '../hooks/useApi';
import type { Framework, ModelCreate, ModelUpdate } from '../types';

const frameworks: { value: Framework; label: string }[] = [
  { value: 'sklearn', label: 'Scikit-learn' },
  { value: 'tensorflow', label: 'TensorFlow' },
  { value: 'pytorch', label: 'PyTorch' },
  { value: 'xgboost', label: 'XGBoost' },
  { value: 'lightgbm', label: 'LightGBM' },
  { value: 'onnx', label: 'ONNX' },
  { value: 'other', label: 'Other' },
];

interface FormData {
  name: string;
  description: string;
  framework: Framework;
  version: string;
  author: string;
  tags: string[];
  metrics: { key: string; value: string }[];
}

const initialFormData: FormData = {
  name: '',
  description: '',
  framework: 'sklearn',
  version: '1.0.0',
  author: '',
  tags: [],
  metrics: [],
};

export default function ModelForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  
  const { data: existingModel, loading: loadingModel } = useModel(isEdit ? id : undefined);
  const { createModel, updateModel, loading: mutating, error } = useModelMutations();

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [tagInput, setTagInput] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (existingModel && isEdit) {
      setFormData({
        name: existingModel.name,
        description: existingModel.description || '',
        framework: existingModel.framework,
        version: existingModel.current_version || '1.0.0',
        author: existingModel.author || '',
        tags: existingModel.tags || [],
        metrics: existingModel.metrics
          ? Object.entries(existingModel.metrics).map(([key, value]) => ({
              key,
              value: String(value),
            }))
          : [],
      });
    }
  }, [existingModel, isEdit]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !formData.tags.includes(tag)) {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tagToRemove),
    }));
  };

  const addMetric = () => {
    setFormData((prev) => ({
      ...prev,
      metrics: [...prev.metrics, { key: '', value: '' }],
    }));
  };

  const updateMetric = (index: number, field: 'key' | 'value', value: string) => {
    setFormData((prev) => ({
      ...prev,
      metrics: prev.metrics.map((m, i) =>
        i === index ? { ...m, [field]: value } : m
      ),
    }));
  };

  const removeMetric = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      metrics: prev.metrics.filter((_, i) => i !== index),
    }));
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Model name is required';
    } else if (!/^[a-zA-Z0-9-_\s]+$/.test(formData.name)) {
      errors.name = 'Name can only contain letters, numbers, hyphens, underscores, and spaces';
    }

    if (!formData.framework) {
      errors.framework = 'Framework is required';
    }

    if (!isEdit && formData.version && !/^\d+\.\d+\.\d+$/.test(formData.version)) {
      errors.version = 'Version must follow semantic versioning (e.g., 1.0.0)';
    }

    formData.metrics.forEach((m, i) => {
      if (m.key && m.value && isNaN(parseFloat(m.value))) {
        errors[`metric_${i}`] = 'Metric value must be a number';
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const metricsObj: Record<string, number> = {};
    formData.metrics.forEach((m) => {
      if (m.key.trim() && m.value.trim()) {
        metricsObj[m.key.trim()] = parseFloat(m.value);
      }
    });

    if (isEdit && id) {
      const updateData: ModelUpdate = {
        name: formData.name,
        description: formData.description || undefined,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
      };

      const result = await updateModel(id, updateData);
      if (result) {
        navigate(`/models/${id}`);
      }
    } else {
      const createData: ModelCreate = {
        name: formData.name,
        description: formData.description || undefined,
        framework: formData.framework,
        version: formData.version || '1.0.0',
        author: formData.author || undefined,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
        metrics: Object.keys(metricsObj).length > 0 ? metricsObj : undefined,
      };

      const result = await createModel(createData);
      if (result) {
        navigate(`/models/${result.id}`);
      }
    }
  };

  if (isEdit && loadingModel) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        to={isEdit ? `/models/${id}` : '/models'}
        className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        {isEdit ? 'Back to Model' : 'Back to Models'}
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {isEdit ? 'Edit Model' : 'Register New Model'}
        </h1>
        <p className="mt-1 text-slate-500">
          {isEdit ? 'Update model information' : 'Add a new ML model to the registry'}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
            Model Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., customer-churn-predictor"
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              validationErrors.name ? 'border-red-300' : 'border-slate-200'
            }`}
          />
          {validationErrors.name && (
            <p className="mt-1 text-sm text-red-500">{validationErrors.name}</p>
          )}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            placeholder="Describe what this model does..."
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {!isEdit && (
          <div>
            <label htmlFor="framework" className="block text-sm font-medium text-slate-700 mb-1">
              Framework <span className="text-red-500">*</span>
            </label>
            <select
              id="framework"
              name="framework"
              value={formData.framework}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {frameworks.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>
        )}

        {!isEdit && (
          <div>
            <label htmlFor="version" className="block text-sm font-medium text-slate-700 mb-1">
              Initial Version
            </label>
            <input
              type="text"
              id="version"
              name="version"
              value={formData.version}
              onChange={handleChange}
              placeholder="1.0.0"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                validationErrors.version ? 'border-red-300' : 'border-slate-200'
              }`}
            />
            {validationErrors.version && (
              <p className="mt-1 text-sm text-red-500">{validationErrors.version}</p>
            )}
            <p className="mt-1 text-xs text-slate-500">Semantic version format (major.minor.patch)</p>
          </div>
        )}

        {!isEdit && (
          <div>
            <label htmlFor="author" className="block text-sm font-medium text-slate-700 mb-1">
              Author
            </label>
            <input
              type="text"
              id="author"
              name="author"
              value={formData.author}
              onChange={handleChange}
              placeholder="Your name"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Tags</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTag();
                }
              }}
              placeholder="Add a tag..."
              className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button
              type="button"
              onClick={addTag}
              className="px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200"
            >
              Add
            </button>
          </div>
          {formData.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-primary-50 text-primary-700 text-sm rounded"
                >
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="hover:text-primary-900">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {!isEdit && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-slate-700">Performance Metrics</label>
              <button
                type="button"
                onClick={addMetric}
                className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
              >
                <Plus className="h-4 w-4" />
                Add Metric
              </button>
            </div>
            {formData.metrics.length > 0 ? (
              <div className="space-y-2">
                {formData.metrics.map((metric, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={metric.key}
                      onChange={(e) => updateMetric(index, 'key', e.target.value)}
                      placeholder="Metric name (e.g., accuracy)"
                      className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <input
                      type="text"
                      value={metric.value}
                      onChange={(e) => updateMetric(index, 'value', e.target.value)}
                      placeholder="Value (e.g., 0.95)"
                      className={`w-32 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                        validationErrors[`metric_${index}`] ? 'border-red-300' : 'border-slate-200'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => removeMetric(index)}
                      className="p-2 text-slate-400 hover:text-red-500"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No metrics added yet</p>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
          <Link
            to={isEdit ? `/models/${id}` : '/models'}
            className="px-4 py-2 border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={mutating}
            className="inline-flex items-center gap-2 px-6 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {mutating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {isEdit ? 'Saving...' : 'Creating...'}
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {isEdit ? 'Save Changes' : 'Register Model'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
