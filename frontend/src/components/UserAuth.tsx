import { useState, FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Mail, Lock, User, Loader2 } from 'lucide-react';
import { authApi, User as ApiUser } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

export function UserAuth() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showOTP, setShowOTP] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    otp: ''
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (showOTP) {
        // Verify OTP
        const response = await authApi.verifyOTP({
          email: formData.email,
          otp: formData.otp
        });

        if (response.success && response.data) {
          login(response.data.token, response.data.user);
          navigate('/user-home');
        } else {
          setError(response.message || 'OTP verification failed');
        }
      } else if (!isLogin) {
        // Register new user
        const response = await authApi.register({
          username: formData.username,
          email: formData.email,
          password: formData.password
        });

        if (response.success && response.data) {
          // DEV MODE: Check if token is returned directly (OTP disabled)
          const data = response.data as { user_id: number; email: string; token?: string; user?: ApiUser; requires_verification?: boolean };
          if (data.token && data.user) {
            login(data.token, data.user);
            navigate('/user-home');
          } else if (data.requires_verification) {
            setShowOTP(true);
          } else {
            // Fallback - just navigate
            navigate('/user-home');
          }
        } else {
          // Show specific error message for registration
          const errorMsg = response.message || 'Registration failed';
          if (errorMsg.includes('Email already') || errorMsg.includes('registered')) {
            setError('This email is already registered. Please login or use a different email.');
          } else if (errorMsg.includes('Username already') || errorMsg.includes('taken')) {
            setError('This username is already taken. Please choose a different username.');
          } else if (errorMsg.includes('Validation') || errorMsg.includes('required')) {
            setError('Please fill in all required fields correctly.');
          } else {
            setError(errorMsg);
          }
        }
      } else {
        // Login existing user
        const response = await authApi.login({
          email: formData.email,
          password: formData.password
        });

        if (response.success && response.data) {
          login(response.data.token, response.data.user);
          navigate('/user-home');
        } else {
          // Show specific error message
          let errorMsg: string = response.message || 'Login failed';
          if (response.errors) {
            const errorValues = Object.values(response.errors).flat();
            if (errorValues.length > 0) {
              errorMsg = errorValues[0];
            }
          }
          if (errorMsg.includes('Invalid') || errorMsg.includes('incorrect')) {
            setError('Invalid email or password. Please check your credentials and try again.');
          } else if (errorMsg.includes('not found')) {
            setError('Account not found. Please check your email or register a new account.');
          } else {
            setError(errorMsg);
          }
        }
      }
    } catch (err) {
      let errorMessage = 'An unexpected error occurred. Please try again.';

      if (err instanceof Error) {
        // Parse common error scenarios
        if (err.message.includes('Cannot connect') || err.message.includes('fetch') || err.message.includes('Failed to fetch')) {
          errorMessage = 'Cannot connect to server. Please check your internet connection and try again.';
        }
        else if (err.message.includes('Network')) {
          errorMessage = 'Network error. Please check your internet connection.';
        } else if (err.message.includes('JSON')) {
          errorMessage = 'Server returned an invalid response. Please try again.';
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
      console.error('Auth error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await authApi.resendOTP(formData.email);
      if (!response.success) {
        setError(response.message || 'Failed to resend OTP');
      }
    } catch (err) {
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-600 flex flex-col">
      {/* Header */}
      <div className="p-6 flex items-center">
        <button
          onClick={() => navigate('/')}
          className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-white text-xl font-semibold ml-4">User {isLogin ? 'Login' : 'Sign Up'}</h1>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-md mx-auto">
          {/* Error Alert */}
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
                    {error.includes('connect') || error.includes('server') ? 'Connection Error' :
                      error.includes('not found') ? 'Account Not Found' :
                        error.includes('already') || error.includes('taken') ? 'Account Exists' :
                          error.includes('required') || error.includes('fill') ? 'Validation Error' :
                            isLogin ? 'Login Error' : 'Registration Error'}
                  </h3>
                  <p className="mt-1 text-sm text-red-700">{error}</p>
                  {(error.includes('required') || error.includes('fill')) && !isLogin && (
                    <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-800">Please ensure:</p>
                      <ul className="text-xs text-blue-600 mt-1 list-disc ml-4">
                        <li>Username is at least 3 characters</li>
                        <li>Email is valid</li>
                        <li>Password is at least 6 characters</li>
                      </ul>
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

          {showOTP ? (
            // OTP Verification Screen
            <div className="bg-white rounded-3xl shadow-2xl p-8">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  <Mail className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Verify Your Email</h2>
                <p className="text-gray-600">
                  We've sent a code to <span className="font-semibold">{formData.email}</span>
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter OTP
                  </label>
                  <input
                    type="text"
                    name="otp"
                    value={formData.otp}
                    onChange={handleChange}
                    placeholder="000000"
                    maxLength={6}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none text-center text-2xl tracking-widest"
                    disabled={isLoading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify & Continue'
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={isLoading}
                  className="w-full text-blue-600 font-medium disabled:opacity-50"
                >
                  Resend Code
                </button>
              </form>
            </div>
          ) : (
            // Login/Signup Form
            <div className="bg-white rounded-3xl shadow-2xl p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                {!isLogin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Username
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        placeholder="johndoe"
                        className="w-full pl-11 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>
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
                      placeholder="you@example.com"
                      className="w-full pl-11 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
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
                      className="w-full pl-11 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {isLogin && (
                  <div className="text-right">
                    <button type="button" className="text-sm text-blue-600 hover:underline">
                      Forgot Password?
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {isLogin ? 'Logging in...' : 'Signing up...'}
                    </>
                  ) : (
                    isLogin ? 'Log In' : 'Sign Up'
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError(null);
                  }}
                  className="text-gray-600"
                  disabled={isLoading}
                >
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                  <span className="text-blue-600 font-semibold">
                    {isLogin ? 'Sign Up' : 'Log In'}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
