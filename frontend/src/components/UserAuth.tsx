import { useState, FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Mail, Lock, User, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { authApi, User as ApiUser } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';

export function UserAuth() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const toast = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [showOTP, setShowOTP] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetStep, setResetStep] = useState(0); // 0: Email, 1: OTP & New Password
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
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
          full_name: formData.full_name,
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
          } else if (errorMsg.includes('Name already') || errorMsg.includes('taken')) {
            setError('This name is already in use. Please choose a different name.');

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
      } else {
        toast.success('OTP sent successfully');
      }
    } catch (err) {
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await authApi.forgotPassword(formData.email);
      if (response.success) {
        setResetStep(1);
        toast.success('Reset code sent to your email');
      } else {
        setError(response.message || 'Failed to send reset code');
      }
    } catch (err) {
      setError('Failed to send reset code. Please check your email.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await authApi.resetPassword(formData.email, formData.otp, formData.password);
      if (response.success) {
        toast.success('Password reset successful! Please login.');
        setShowForgotPassword(false);
        setResetStep(0);
        setIsLogin(true);
      } else {
        setError(response.message || 'Failed to reset password');
      }
    } catch (err) {
      setError('Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-700 dark:from-gray-900 dark:to-blue-900 flex flex-col">
      {/* Header */}
      <div className="p-4 sm:p-6 flex items-center border-b border-blue-500/50 dark:border-gray-700">
        <button
          onClick={() => navigate('/')}
          className="text-white hover:bg-white/20 dark:hover:bg-white/10 rounded-lg p-2 transition-colors duration-fast"
          aria-label="Go back"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-white text-2xl sm:text-3xl font-bold ml-4">
          {showForgotPassword ? 'Reset Password' : (isLogin ? 'Login' : 'Sign Up')}
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
                    {error.includes('connect') || error.includes('server') ? 'Connection Error' :
                      error.includes('not found') ? 'Account Not Found' :
                        error.includes('already') || error.includes('taken') ? 'Account Exists' :
                          error.includes('required') || error.includes('fill') ? 'Validation Error' :
                            showForgotPassword ? 'Reset Error' :
                              isLogin ? 'Login Error' : 'Registration Error'}
                  </h3>
                  <p className="mt-1 text-sm text-red-800 dark:text-red-300">{error}</p>
                </div>
              </div>
            </div>
          )}
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
                            showForgotPassword ? 'Reset Error' :
                              isLogin ? 'Login Error' : 'Registration Error'}
                  </h3>
                  <p className="mt-1 text-sm text-red-700">{error}</p>
                  {(error.includes('required') || error.includes('fill')) && !isLogin && (
                    <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-800">Please ensure:</p>
                      <ul className="text-xs text-blue-600 mt-1 list-disc ml-4">
                        <li>Full Name is at least 3 characters</li>

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
            <Card className="animate-slideInUp">
              <CardHeader>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
                    <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle className="text-2xl">Verify Your Email</CardTitle>
                  <CardDescription className="mt-2">
                    We've sent a code to <span className="font-semibold text-gray-900 dark:text-white">{formData.email}</span>
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="otp">Enter OTP</Label>
                    <Input
                      id="otp"
                      type="text"
                      name="otp"
                      value={formData.otp}
                      onChange={handleChange}
                      placeholder="000000"
                      maxLength={6}
                      disabled={isLoading}
                      className="text-center text-2xl tracking-widest font-mono mt-2"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    variant="primary"
                    size="lg"
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Verify & Continue'
                    )}
                  </Button>

                  <Button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={isLoading}
                    variant="ghost"
                    size="lg"
                    className="w-full"
                  >
                    Resend Code
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : showForgotPassword ? (
            // Forgot Password Screen
            <Card className="animate-slideInUp">
              <CardHeader>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full mb-4">
                    <Lock className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                  </div>
                  <CardTitle className="text-2xl">Reset Password</CardTitle>
                  <CardDescription className="mt-2">
                    {resetStep === 0
                      ? "Enter your email to receive a reset code"
                      : "Enter the code sent to your email and your new password"}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={resetStep === 0 ? handleForgotPassword : handleResetPasswordSubmit} className="space-y-6">
                  {resetStep === 0 ? (
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="you@example.com"
                        required
                        disabled={isLoading}
                        className="mt-2"
                      />
                    </div>
                  ) : (
                    <>
                      <div>
                        <Label htmlFor="reset-otp">Reset Code (OTP)</Label>
                        <Input
                          id="reset-otp"
                          type="text"
                          name="otp"
                          value={formData.otp}
                          onChange={handleChange}
                          placeholder="000000"
                          maxLength={6}
                          required
                          disabled={isLoading}
                          className="text-center text-2xl tracking-widest font-mono mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="new-password">New Password</Label>
                        <Input
                          id="new-password"
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="New secure password"
                          required
                          disabled={isLoading}
                          minLength={6}
                          className="mt-2"
                        />
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1.5">
                          At least 6 characters
                        </p>
                      </div>
                    </>
                  )}

                  <Button
                    type="submit"
                    disabled={isLoading}
                    variant="primary"
                    size="lg"
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      resetStep === 0 ? 'Send Reset Code' : 'Reset Password'
                    )}
                  </Button>

                  <Button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setResetStep(0);
                      setError(null);
                    }}
                    disabled={isLoading}
                    variant="ghost"
                    size="lg"
                    className="w-full"
                  >
                    Back to Login
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            // Login/Signup Form
            <Card className="animate-slideInUp">
              <CardHeader>
                <CardTitle className="text-2xl">
                  {isLogin ? 'Welcome Back' : 'Create Account'}
                </CardTitle>
                <CardDescription>
                  {isLogin 
                    ? 'Sign in to continue to KANGO' 
                    : 'Join KANGO to start your journey'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                  {!isLogin && (
                    <div>
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        type="text"
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleChange}
                        placeholder="John Doe"
                        required
                        disabled={isLoading}
                        className="mt-2"
                      />
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1.5">
                        At least 3 characters
                      </p>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
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

                  {isLogin && (
                    <div className="text-right -mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowForgotPassword(true);
                          setError(null);
                        }}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline transition-colors duration-fast"
                      >
                        Forgot Password?
                      </button>
                    </div>
                  )}

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
                        {isLogin ? 'Logging in...' : 'Signing up...'}
                      </>
                    ) : (
                      isLogin ? 'Log In' : 'Sign Up'
                    )}
                  </Button>

                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => {
                        setIsLogin(!isLogin);
                        setError(null);
                      }}
                      className="w-full text-center text-gray-700 dark:text-gray-300 transition-colors duration-fast hover:text-gray-900 dark:hover:text-white"
                      disabled={isLoading}
                    >
                      {isLogin ? "Don't have an account? " : "Already have an account? "}
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        {isLogin ? 'Sign Up' : 'Log In'}
                      </span>
                    </button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
