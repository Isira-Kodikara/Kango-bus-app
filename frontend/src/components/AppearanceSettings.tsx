import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Moon, Sun, Smartphone } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

export function AppearanceSettings() {
  const navigate = useNavigate();
  const toast = useToast();
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light');

  useEffect(() => {
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null;
    if (saved) {
      setTheme(saved);
    }
  }, []);

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Apply theme
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    toast.success('Theme updated');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center sticky top-0 z-10">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-full mr-3"
        >
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
        <h1 className="text-xl font-bold text-gray-800">Appearance</h1>
      </div>

      <div className="flex-1 p-4">
        <h2 className="text-sm font-bold uppercase text-gray-600 mb-3">Theme</h2>

        <div className="space-y-3">
          {/* Light Mode */}
          <button
            onClick={() => handleThemeChange('light')}
            className={`w-full flex items-center p-4 rounded-2xl border-2 transition-all ${
              theme === 'light'
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-blue-300'
            }`}
          >
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mr-4">
              <Sun className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold text-gray-800">Light Mode</div>
              <div className="text-xs text-gray-500">Bright and comfortable</div>
            </div>
            {theme === 'light' && (
              <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
            )}
          </button>

          {/* Dark Mode */}
          <button
            onClick={() => handleThemeChange('dark')}
            className={`w-full flex items-center p-4 rounded-2xl border-2 transition-all ${
              theme === 'dark'
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-blue-300'
            }`}
          >
            <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mr-4">
              <Moon className="w-6 h-6 text-gray-200" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold text-gray-800">Dark Mode</div>
              <div className="text-xs text-gray-500">Easy on the eyes</div>
            </div>
            {theme === 'dark' && (
              <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
            )}
          </button>

          {/* System Mode */}
          <button
            onClick={() => handleThemeChange('system')}
            className={`w-full flex items-center p-4 rounded-2xl border-2 transition-all ${
              theme === 'system'
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-blue-300'
            }`}
          >
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
              <Smartphone className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold text-gray-800">System Default</div>
              <div className="text-xs text-gray-500">Match device settings</div>
            </div>
            {theme === 'system' && (
              <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
            )}
          </button>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <div className="text-sm text-blue-900">
            <p className="font-semibold mb-1">💡 Dark mode reduces eye strain</p>
            <p className="text-xs text-blue-800">Use dark mode during night hours for a more comfortable experience.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
