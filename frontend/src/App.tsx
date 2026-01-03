import { BrowserRouter, Routes, Route, Link, NavLink } from 'react-router-dom';
import { Box, Database, Home, Plus } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import ModelList from './pages/ModelList';
import ModelDetail from './pages/ModelDetail';
import ModelForm from './pages/ModelForm';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50">
        {/* Navigation */}
        <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link to="/" className="flex items-center gap-2">
                  <Database className="h-8 w-8 text-primary-600" />
                  <span className="font-semibold text-xl text-slate-900">
                    ML Registry
                  </span>
                </Link>
                <div className="hidden sm:ml-8 sm:flex sm:space-x-4">
                  <NavLink
                    to="/"
                    className={({ isActive }) =>
                      `inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        isActive
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`
                    }
                  >
                    <Home className="h-4 w-4" />
                    Dashboard
                  </NavLink>
                  <NavLink
                    to="/models"
                    className={({ isActive }) =>
                      `inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        isActive
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`
                    }
                  >
                    <Box className="h-4 w-4" />
                    Models
                  </NavLink>
                </div>
              </div>
              <div className="flex items-center">
                <Link
                  to="/models/new"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Register Model
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/models" element={<ModelList />} />
            <Route path="/models/new" element={<ModelForm />} />
            <Route path="/models/:id" element={<ModelDetail />} />
            <Route path="/models/:id/edit" element={<ModelForm />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <p className="text-center text-sm text-slate-500">
              ML Model Registry &mdash; AI Dev Tools Zoomcamp 2025
            </p>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
