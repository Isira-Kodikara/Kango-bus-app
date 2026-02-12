import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Mail, Lock, ShieldCheck, Loader2 } from 'lucide-react';
import { adminApi } from '@/lib/api';

export function AdminAuth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    otp: '',
    confirmCode: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await adminApi.login({
        email: formData.email,
        password: formData.password
      });

      if (response.success && response.data?.token) {
        // Store token and navigate to dashboard
        localStorage.setItem('auth_token', response.data.token);
        localStorage.setItem('user_type', 'admin');
        navigate('/admin-dashboard');
      } else {
        // Show specific error messages
        if (response.message?.includes('Invalid')) {
          setError('Invalid email or password. Please check your credentials.');
        } else if (response.message?.includes('not found')) {
          setError('Admin account not found. Please contact system administrator.');
        } else {
          setError(response.message || 'Login failed. Please try again.');
        }
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('fetch')) {
        setError('Cannot connect to server. Please check your network connection.');
      } else {
        setError('Connection error. Please check your internet connection and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-700 flex flex-col">
      {/* Header */}
      <div className="p-6 flex items-center">
        <button
          onClick={() => navigate('/')}
          className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-white text-xl font-semibold ml-4">Admin {isLogin ? 'Login' : 'Sign Up'}</h1>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-md mx-auto">
          {/* Error Alert - Moved outside card */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-xl">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-semibold text-red-800">
                    {error.includes('Invalid') || error.includes('password') ? 'Invalid Credentials' :
                      error.includes('connect') ? 'Connection Error' :
                        error.includes('not found') ? 'Account Not Found' : 'Login Error'}
                  </h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                  {(error.includes('Invalid') || error.includes('password')) && (
                    <div className="mt-2 p-2 bg-purple-50 rounded-lg">
                      <p className="text-xs text-purple-800 font-medium">💡 Admin credentials:</p>
                      <p className="text-xs text-purple-600 mt-1">Email: admin@kango.com</p>
                      <p className="text-xs text-purple-600">Password: password</p>
                    </div>
                  )}
                  {error.includes('connect') && (
                    <div className="mt-2 p-2 bg-yellow-50 rounded-lg">
                      <p className="text-xs text-yellow-800">Please check your internet connection and try again.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              {isLogin ? 'Admin Login' : 'Admin Registration'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="admin@kango.com"
                    className="w-full pl-11 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 rounded-xl transition-colors shadow-lg disabled:opacity-50 flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  isLogin ? 'Log In' : 'Sign Up'
                )}
              </button>
            </form>

            {!isLogin && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => setIsLogin(true)}
                  className="text-gray-600"
                >
                  Already have an account?{' '}
                  <span className="text-purple-600 font-semibold">Log In</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
