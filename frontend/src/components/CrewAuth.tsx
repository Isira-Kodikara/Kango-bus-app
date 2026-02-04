import { useState } from 'react';
import { useNavigate } from 'react-router';
import { authApi, API_BASE_URL } from '../lib/api';
import { ArrowLeft, Mail, Lock, User, CreditCard, Bus } from 'lucide-react';

// Direct API call to avoid TypeScript caching issues
const API_BASE = API_BASE_URL;

export function CrewAuth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    nic: '',
    busId: '',
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const endpoint = isLogin ? '/auth/crew/login' : '/auth/crew/register';
      const body = isLogin
        ? { email: formData.email, password: formData.password }
        : {
          full_name: formData.fullName,
          email: formData.email,
          password: formData.password,
          nic: formData.nic,
          bus_id: formData.busId
        };

      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success && data.data?.token) {
        localStorage.setItem('auth_token', data.data.token);
        localStorage.setItem('user_type', 'crew');
        navigate('/crew-dashboard');
      } else {
        // Show specific error message
        const errorMsg = data.message || data.error || 'Authentication failed';
        if (errorMsg.includes('Invalid') || errorMsg.includes('password') || errorMsg.includes('incorrect')) {
          setError('Invalid email or password. Please check your credentials.');
        } else if (errorMsg.includes('not found')) {
          setError('Crew account not found. Please register or contact admin.');
        } else {
          setError(errorMsg);
        }
      }
    } catch (err) {
      // Provide more specific error messages
      let errorMessage = 'Cannot connect to server.';
      if (err instanceof Error) {
        if (err.message.includes('fetch') || err.message.includes('Failed to fetch')) {
          errorMessage = 'Cannot connect to server. Please check your network connection.';
        } else if (err.message.includes('JSON')) {
          errorMessage = 'Server returned an invalid response. Please try again.';
        }
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 to-orange-600 flex flex-col">
      <div className="p-6 flex items-center">
        <button
          onClick={() => navigate('/')}
          className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-white text-xl font-semibold ml-4">Bus Crew {isLogin ? 'Login' : 'Sign Up'}</h1>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              {isLogin ? 'Crew Login' : 'Register as Crew'}
            </h2>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl">
                <div className="flex items-start">
                  <svg className="h-5 w-5 text-red-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div className="ml-3 flex-1">
                    <h3 className="text-sm font-semibold text-red-800">
                      {error.includes('Invalid') || error.includes('password') ? 'Invalid Credentials' :
                        error.includes('connect') ? 'Connection Error' :
                          error.includes('not found') ? 'Account Not Found' : 'Login Error'}
                    </h3>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                    {(error.includes('Invalid') || error.includes('password')) && (
                      <div className="mt-2 p-2 bg-orange-50 rounded-lg">
                        <p className="text-xs text-orange-800 font-medium">💡 Test credentials:</p>
                        <p className="text-xs text-orange-600 mt-1">Email: john.smith@kango.com</p>
                        <p className="text-xs text-orange-600">Password: password</p>
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

            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        placeholder="John Doe"
                        className="w-full pl-11 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:outline-none"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      NIC Number
                    </label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        name="nic"
                        value={formData.nic}
                        onChange={handleChange}
                        placeholder="123456789V"
                        className="w-full pl-11 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:outline-none"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assigned Bus ID
                    </label>
                    <div className="relative">
                      <Bus className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        name="busId"
                        value={formData.busId}
                        onChange={handleChange}
                        placeholder="BUS-001"
                        className="w-full pl-11 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:outline-none"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="crew@kango.com"
                    className="w-full pl-11 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:outline-none"
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
                    className="w-full pl-11 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:outline-none"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-4 rounded-xl transition-colors shadow-lg disabled:opacity-50"
              >
                {isLoading ? 'Please wait...' : (isLogin ? 'Log In' : 'Sign Up')}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-gray-600"
              >
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <span className="text-orange-600 font-semibold">
                  {isLogin ? 'Sign Up' : 'Log In'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
