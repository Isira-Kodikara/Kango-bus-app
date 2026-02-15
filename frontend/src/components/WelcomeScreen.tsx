import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Bus, Users, ShieldCheck } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-3xl shadow-2xl mb-6">
            <Bus className="w-12 h-12 text-blue-600" strokeWidth={2.5} />
          </div>
          <h1 className="text-5xl font-bold text-white mb-2">KANGO</h1>
          <p className="text-blue-100 text-lg">Smart Bus Navigation</p>
        </div>

        {/* Role Selection Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Select Your Role</h2>

          <div className="space-y-3">
            {/* User Role */}
            <label
              className={`flex items-center p-4 rounded-2xl border-2 cursor-pointer transition-all ${selectedRole === 'user'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300'
                }`}
            >
              <input
                type="radio"
                name="role"
                value="user"
                checked={selectedRole === 'user'}
                onChange={() => setSelectedRole('user')}
                className="w-5 h-5 text-blue-600"
              />
              <Users className="w-6 h-6 text-blue-600 ml-3 mr-3" />
              <div className="flex-1">
                <div className="font-semibold text-gray-800">User</div>
                <div className="text-sm text-gray-500">Find and board buses</div>
              </div>
            </label>

            {/* Bus Crew Role */}
            <label
              className={`flex items-center p-4 rounded-2xl border-2 cursor-pointer transition-all ${selectedRole === 'crew'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300'
                }`}
            >
              <input
                type="radio"
                name="role"
                value="crew"
                checked={selectedRole === 'crew'}
                onChange={() => setSelectedRole('crew')}
                className="w-5 h-5 text-blue-600"
              />
              <Bus className="w-6 h-6 text-blue-600 ml-3 mr-3" />
              <div className="flex-1">
                <div className="font-semibold text-gray-800">Bus Crew</div>
                <div className="text-sm text-gray-500">Manage bus operations</div>
              </div>
            </label>

            {/* Admin Role */}
            <label
              className={`flex items-center p-4 rounded-2xl border-2 cursor-pointer transition-all ${selectedRole === 'admin'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300'
                }`}
            >
              <input
                type="radio"
                name="role"
                value="admin"
                checked={selectedRole === 'admin'}
                onChange={() => setSelectedRole('admin')}
                className="w-5 h-5 text-blue-600"
              />
              <ShieldCheck className="w-6 h-6 text-blue-600 ml-3 mr-3" />
              <div className="flex-1">
                <div className="font-semibold text-gray-800">Admin</div>
                <div className="text-sm text-gray-500">System management</div>
              </div>
            </label>
          </div>

          {/* Continue Button */}
          <button
            onClick={handleContinue}
            className="w-full mt-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-2xl transition-colors shadow-lg"
          >
            Continue
          </button>
        </div>

        <p className="text-center text-blue-100 text-sm mt-6">
          Version 1.3 • © 2026 KANGO
        </p>
      </div>
    </div>
  );
}
