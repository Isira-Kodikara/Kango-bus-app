import { useState } from 'react';
import { useNavigate } from 'react-router';
import { authApi, API_BASE_URL } from '../lib/api';
import { ArrowLeft, Mail, Lock, User, CreditCard, Bus, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

// Direct API call to avoid TypeScript caching issues
const API_BASE = API_BASE_URL;

export function CrewAuth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
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
    setSuccessMessage('');

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

      if (data.success) {
        if (data.data?.token) {
          localStorage.setItem('auth_token', data.data.token);
          localStorage.setItem('user_type', 'crew');
          if (data.data.crew?.bus) {
            localStorage.setItem('bus_id', data.data.crew.bus.id);
            localStorage.setItem('bus_plate', data.data.crew.bus.plate_number);
            localStorage.setItem('route_name', data.data.crew.bus.route_name || '');
            localStorage.setItem('route_id', data.data.crew.bus.route_id || '');
          }
          navigate('/crew-dashboard');
        } else if (data.data?.requires_approval) {
          setSuccessMessage(data.message || 'Registration request sent! Please wait for admin approval.');
          setIsLogin(true); // Switch back to login view
          setFormData({ ...formData, password: '' }); // Clear password
        }
      } else {
        // Show specific error message
        const errorMsg = data.message || data.error || 'Authentication failed';

        if (isLogin) {
          if (errorMsg.toLowerCase().includes('email') || errorMsg.toLowerCase().includes('password') || errorMsg.toLowerCase().includes('incorrect')) {
            setError('Invalid email or password. Please check your credentials.');
          } else if (errorMsg.includes('pending') || errorMsg.includes('deactivated')) {
            setError(errorMsg);
          } else if (errorMsg.includes('not found')) {
            setError('Crew account not found. Please register or contact admin.');
          } else {
            setError(errorMsg);
          }
        } else {
          // Registration specific errors
          if (errorMsg.includes('Email already registered')) {
            setError('This email is already registered. Try logging in instead.');
          } else if (errorMsg.includes('NIC already registered')) {
            setError('This NIC number is already registered.');
          } else if (errorMsg.includes('Invalid bus ID')) {
            setError('The Bus ID provided was not found in our system. Please check and try again.');
          } else {
            setError(errorMsg);
          }
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
    <div className="min-h-screen bg-gradient-to-br from-orange-600 to-orange-700 dark:from-gray-900 dark:to-orange-900 flex flex-col">
      {/* Header */}
      <div className="p-4 sm:p-6 flex items-center border-b border-orange-500/50 dark:border-gray-700">
        <button
          onClick={() => navigate('/')}
          className="text-white hover:bg-white/20 dark:hover:bg-white/10 rounded-lg p-2 transition-colors duration-fast"
          aria-label="Go back"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-white text-2xl sm:text-3xl font-bold ml-4">
          Bus Crew {isLogin ? 'Login' : 'Registration'}
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
                        error.includes('not found') ? 'Account Not Found' : 'Error'}
                  </h3>
                  <p className="mt-1 text-sm text-red-800 dark:text-red-300">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Success Alert */}
          {successMessage && (
            <div className="mb-6 p-4 sm:p-5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg shadow-md">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-green-900 dark:text-green-300">
                    Request Sent Successfully
                  </h3>
                  <p className="mt-1 text-sm text-green-800 dark:text-green-300">{successMessage}</p>
                </div>
              </div>
            </div>
          )}

          {/* Form Card */}
          <Card className="animate-slideInUp">
            <CardHeader>
              <CardTitle className="text-2xl">
                {isLogin ? 'Crew Login' : 'Register as Crew'}
              </CardTitle>
              <CardDescription>
                {isLogin 
                  ? 'Sign in to manage your bus operations' 
                  : 'Apply to join as a bus crew member'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {!isLogin && (
                  <>
                    <div>
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        placeholder="John Doe"
                        required
                        disabled={isLoading}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="nic">NIC Number</Label>
                      <Input
                        id="nic"
                        type="text"
                        name="nic"
                        value={formData.nic}
                        onChange={handleChange}
                        placeholder="123456789V"
                        required
                        disabled={isLoading}
                        className="mt-2"
                      />
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1.5">
                        Your national identification number
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="busId">Assigned Bus ID</Label>
                      <Input
                        id="busId"
                        type="text"
                        name="busId"
                        value={formData.busId}
                        onChange={handleChange}
                        placeholder="BUS-001"
                        required
                        disabled={isLoading}
                        className="mt-2"
                      />
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1.5">
                        The bus you will be operating
                      </p>
                    </div>
                  </>
                )}

                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="crew@kango.com"
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
                      Processing...
                    </>
                  ) : (
                    isLogin ? 'Log In' : 'Request Signup'
                  )}
                </Button>

                {!isLogin && (
                  <p className="text-xs text-center text-gray-600 dark:text-gray-400 px-2">
                    New registrations require approval from a system administrator.
                  </p>
                )}

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setIsLogin(!isLogin)}
                    className="w-full text-center text-gray-700 dark:text-gray-300 transition-colors duration-fast hover:text-gray-900 dark:hover:text-white"
                    disabled={isLoading}
                  >
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <span className="font-semibold text-orange-600 dark:text-orange-400">
                      {isLogin ? 'Sign Up' : 'Log In'}
                    </span>
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
