import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Mail, Lock, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

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
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-700 dark:from-gray-900 dark:to-purple-900 flex flex-col">
      {/* Header */}
      <div className="p-4 sm:p-6 flex items-center border-b border-purple-500/50 dark:border-gray-700">
        <button
          onClick={() => navigate('/')}
          className="text-white hover:bg-white/20 dark:hover:bg-white/10 rounded-lg p-2 transition-colors duration-fast"
          aria-label="Go back"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-white text-2xl sm:text-3xl font-bold ml-4">
          Admin {isLogin ? 'Login' : 'Sign Up'}
        </h1>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
        <div className="max-w-md mx-auto animate-fadeIn">
          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 sm:p-5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg shadow-md">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-red-900 dark:text-red-300">
                    {error.includes('Invalid') || error.includes('password') ? 'Invalid Credentials' :
                      error.includes('connect') ? 'Connection Error' :
                        error.includes('not found') ? 'Account Not Found' : 'Login Error'}
                  </h3>
                  <p className="mt-1 text-sm text-red-800 dark:text-red-300">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Form Card */}
          <Card className="animate-slideInUp">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                {isLogin ? 'Admin Login' : 'Admin Registration'}
              </CardTitle>
              <CardDescription>
                {isLogin 
                  ? 'Sign in to access the administration panel' 
                  : 'Create an admin account for system management'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <Label htmlFor="email">Admin Email</Label>
                  <Input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="admin@kango.com"
                    required
                    disabled={isLoading}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                    disabled={isLoading}
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1.5">
                    At least 6 characters
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  variant="primary"
                  size="lg"
                  className="w-full mt-6"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    isLogin ? 'Log In' : 'Sign Up'
                  )}
                </Button>

                {!isLogin && (
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => setIsLogin(true)}
                      className="w-full text-center text-gray-700 dark:text-gray-300 transition-colors duration-fast hover:text-gray-900 dark:hover:text-white"
                    >
                      Already have an account?{' '}
                      <span className="font-semibold text-purple-600 dark:text-purple-400">
                        Log In
                      </span>
                    </button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
