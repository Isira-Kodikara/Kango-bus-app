import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Lock, Eye, Share2, Trash2 } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

export function PrivacySettings() {
  const navigate = useNavigate();
  const toast = useToast();
  const [privacy, setPrivacy] = useState({
    shareLocation: false,
    showProfile: true,
    allowMessaging: true,
    dataCollection: true,
  });
  const [showDataInfo, setShowDataInfo] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('privacySettings');
    if (saved) {
      setPrivacy(JSON.parse(saved));
    }
  }, []);

  const handleToggle = (key: keyof typeof privacy) => {
    const updated = { ...privacy, [key]: !privacy[key] };
    setPrivacy(updated);
    localStorage.setItem('privacySettings', JSON.stringify(updated));
    toast.success('Privacy settings updated');
  };

  const handleDeleteData = () => {
    if (confirm('Are you sure you want to delete all your personal data? This cannot be undone.')) {
      // Clear user data
      localStorage.removeItem('privacySettings');
      toast.success('Your data has been scheduled for deletion');
    }
  };

  const handleDownloadData = () => {
    const userData = {
      privacySettings: privacy,
      timestamp: new Date().toISOString(),
    };
    const dataStr = JSON.stringify(userData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `personal-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Your data has been downloaded');
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
        <h1 className="text-xl font-bold text-gray-800">Privacy & Security</h1>
      </div>

      <div className="flex-1 p-4 space-y-4">
        {/* Privacy Controls */}
        <div className="mb-6">
          <h2 className="text-sm font-bold uppercase text-gray-600 mb-3">Sharing</h2>

          {/* Share Location */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200 mb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                  <Share2 className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-800">Share Location</div>
                  <div className="text-xs text-gray-500">Allow contacts to track you</div>
                </div>
              </div>
              <button
                onClick={() => handleToggle('shareLocation')}
                className={`w-14 h-7 rounded-full transition-colors cursor-pointer ${
                  privacy.shareLocation ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`w-6 h-6 bg-white rounded-full transition-transform ${
                    privacy.shareLocation ? 'translate-x-7' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Show Profile */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <Eye className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-800">Visible Profile</div>
                  <div className="text-xs text-gray-500">Let others see your profile</div>
                </div>
              </div>
              <button
                onClick={() => handleToggle('showProfile')}
                className={`w-14 h-7 rounded-full transition-colors cursor-pointer ${
                  privacy.showProfile ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`w-6 h-6 bg-white rounded-full transition-transform ${
                    privacy.showProfile ? 'translate-x-7' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Security & Data */}
        <div>
          <h2 className="text-sm font-bold uppercase text-gray-600 mb-3">Data & Security</h2>

          {/* Allow Messaging */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200 mb-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-gray-800">Allow Messaging</div>
                <div className="text-xs text-gray-500">Others can message you</div>
              </div>
              <button
                onClick={() => handleToggle('allowMessaging')}
                className={`w-14 h-7 rounded-full transition-colors cursor-pointer ${
                  privacy.allowMessaging ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`w-6 h-6 bg-white rounded-full transition-transform ${
                    privacy.allowMessaging ? 'translate-x-7' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Data Collection */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-gray-800">Anonymous Analytics</div>
                <div className="text-xs text-gray-500">Help us improve the app</div>
              </div>
              <button
                onClick={() => handleToggle('dataCollection')}
                className={`w-14 h-7 rounded-full transition-colors cursor-pointer ${
                  privacy.dataCollection ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`w-6 h-6 bg-white rounded-full transition-transform ${
                    privacy.dataCollection ? 'translate-x-7' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="mt-8">
          <h2 className="text-sm font-bold uppercase text-gray-600 mb-3">Data Management</h2>

          <button
            onClick={() => setShowDataInfo(!showDataInfo)}
            className="w-full bg-white rounded-2xl p-4 border border-gray-200 hover:border-blue-300 transition-all text-left"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                  <Lock className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-800">Your Data</div>
                  <div className="text-xs text-gray-500">Download or manage your data</div>
                </div>
              </div>
            </div>
          </button>

          {showDataInfo && (
            <div className="mt-3 bg-blue-50 border border-blue-200 rounded-2xl p-4">
              <p className="text-sm font-semibold text-blue-900 mb-2">Your Personal Data</p>
              <p className="text-xs text-blue-800 mb-4">
                You can request to download or delete all your personal data stored in our system.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleDownloadData}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg text-sm transition-colors"
                >
                  Download Data
                </button>
                <button
                  onClick={handleDeleteData}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg text-sm flex items-center justify-center"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Data
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
