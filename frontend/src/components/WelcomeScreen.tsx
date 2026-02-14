import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Bus, Users, ShieldCheck } from 'lucide-react';
import { Button } from './ui/button';

export function WelcomeScreen() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<'user' | 'crew' | 'admin'>('user');

  const handleContinue = () => {
    if (selectedRole === 'user') {
      navigate('/user-auth');
    } else if (selectedRole === 'crew') {
      navigate('/crew-auth');
    } else {
      navigate('/admin-auth');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md animate-fadeIn">
        {/* Logo & Header */}
        <div className="text-center mb-10 sm:mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-2xl shadow-2xl mb-6 animate-fadeIn">
            <Bus className="w-12 h-12 text-blue-600" strokeWidth={2.5} />
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-white mb-2">KANGO</h1>
          <p className="text-blue-100 text-base sm:text-lg">Smart Bus Navigation</p>
        </div>

        {/* Role Selection Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 sm:p-8 animate-slideInUp">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-8">
            Select Your Role
          </h2>

          <div className="space-y-3">
            {/* User Role */}
            <label
              className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                selectedRole === 'user'
                  ? 'border-blue-600 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500'
              }`}
            >
              <input
                type="radio"
                name="role"
                value="user"
                checked={selectedRole === 'user'}
                onChange={() => setSelectedRole('user')}
                className="w-5 h-5 text-blue-600 dark:accent-blue-500 cursor-pointer"
              />
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400 ml-3 mr-3" />
              <div className="flex-1">
                <div className="font-semibold text-gray-900 dark:text-white text-sm">
                  User
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Find and board buses
                </div>
              </div>
            </label>

            {/* Bus Crew Role */}
            <label
              className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                selectedRole === 'crew'
                  ? 'border-blue-600 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500'
              }`}
            >
              <input
                type="radio"
                name="role"
                value="crew"
                checked={selectedRole === 'crew'}
                onChange={() => setSelectedRole('crew')}
                className="w-5 h-5 text-blue-600 dark:accent-blue-500 cursor-pointer"
              />
              <Bus className="w-5 h-5 text-blue-600 dark:text-blue-400 ml-3 mr-3" />
              <div className="flex-1">
                <div className="font-semibold text-gray-900 dark:text-white text-sm">
                  Bus Crew
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Manage bus operations
                </div>
              </div>
            </label>

            {/* Admin Role */}
            <label
              className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                selectedRole === 'admin'
                  ? 'border-blue-600 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500'
              }`}
            >
              <input
                type="radio"
                name="role"
                value="admin"
                checked={selectedRole === 'admin'}
                onChange={() => setSelectedRole('admin')}
                className="w-5 h-5 text-blue-600 dark:accent-blue-500 cursor-pointer"
              />
              <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 ml-3 mr-3" />
              <div className="flex-1">
                <div className="font-semibold text-gray-900 dark:text-white text-sm">
                  Admin
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  System management
                </div>
              </div>
            </label>
          </div>

          {/* Continue Button */}
          <Button
            onClick={handleContinue}
            variant="primary"
            size="lg"
            className="w-full mt-8 shadow-lg"
          >
            Continue
          </Button>
        </div>

        {/* Footer */}
        <p className="text-center text-blue-100 text-xs sm:text-sm mt-6">
          Version 1.3 • © 2026 KANGO
        </p>
      </div>
    </div>
  );
}
