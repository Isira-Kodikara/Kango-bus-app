import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Bell, MessageSquare, Mail, Phone } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

export function NotificationSettings() {
  const navigate = useNavigate();
  const toast = useToast();
  const [notifications, setNotifications] = useState({
    push: true,
    sms: false,
    email: true,
    busArrival: true,
    promotions: false,
    tripReminders: true,
  });

  useEffect(() => {
    const saved = localStorage.getItem('notificationSettings');
    if (saved) {
      setNotifications(JSON.parse(saved));
    }
  }, []);

  const handleToggle = (key: keyof typeof notifications) => {
    const updated = { ...notifications, [key]: !notifications[key] };
    setNotifications(updated);
    localStorage.setItem('notificationSettings', JSON.stringify(updated));
    toast.success('Settings updated');
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
        <h1 className="text-xl font-bold text-gray-800">Notifications</h1>
      </div>

      <div className="flex-1 p-4 space-y-4">
        {/* Push Notifications */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                <Bell className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <div className="font-semibold text-gray-800">Push Notifications</div>
                <div className="text-xs text-gray-500">On-screen alerts</div>
              </div>
            </div>
            <button
              onClick={() => handleToggle('push')}
              className={`w-14 h-7 rounded-full transition-colors cursor-pointer ${
                notifications.push ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <div
                className={`w-6 h-6 bg-white rounded-full transition-transform ${
                  notifications.push ? 'translate-x-7' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>

        {/* SMS Notifications */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <MessageSquare className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="font-semibold text-gray-800">SMS Alerts</div>
                <div className="text-xs text-gray-500">Text messages</div>
              </div>
            </div>
            <button
              onClick={() => handleToggle('sms')}
              className={`w-14 h-7 rounded-full transition-colors cursor-pointer ${
                notifications.sms ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <div
                className={`w-6 h-6 bg-white rounded-full transition-transform ${
                  notifications.sms ? 'translate-x-7' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Email Notifications */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="font-semibold text-gray-800">Email Notifications</div>
                <div className="text-xs text-gray-500">Delivery updates</div>
              </div>
            </div>
            <button
              onClick={() => handleToggle('email')}
              className={`w-14 h-7 rounded-full transition-colors cursor-pointer ${
                notifications.email ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <div
                className={`w-6 h-6 bg-white rounded-full transition-transform ${
                  notifications.email ? 'translate-x-7' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Notification Types */}
        <div className="mt-6">
          <h2 className="text-sm font-bold uppercase text-gray-600 mb-3">Notification Types</h2>

          <div className="bg-white rounded-2xl p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="font-semibold text-gray-800">Bus Arrival Alerts</div>
                <div className="text-xs text-gray-500">When buses are near</div>
              </div>
              <button
                onClick={() => handleToggle('busArrival')}
                className={`w-14 h-7 rounded-full transition-colors cursor-pointer ${
                  notifications.busArrival ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`w-6 h-6 bg-white rounded-full transition-transform ${
                    notifications.busArrival ? 'translate-x-7' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            <div className="border-t pt-4 flex items-center justify-between">
              <div>
                <div className="font-semibold text-gray-800">Trip Reminders</div>
                <div className="text-xs text-gray-500">Upcoming scheduled trips</div>
              </div>
              <button
                onClick={() => handleToggle('tripReminders')}
                className={`w-14 h-7 rounded-full transition-colors cursor-pointer ${
                  notifications.tripReminders ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`w-6 h-6 bg-white rounded-full transition-transform ${
                    notifications.tripReminders ? 'translate-x-7' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            <div className="border-t mt-4 pt-4 flex items-center justify-between">
              <div>
                <div className="font-semibold text-gray-800">Promotions & Offers</div>
                <div className="text-xs text-gray-500">Special deals and discounts</div>
              </div>
              <button
                onClick={() => handleToggle('promotions')}
                className={`w-14 h-7 rounded-full transition-colors cursor-pointer ${
                  notifications.promotions ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`w-6 h-6 bg-white rounded-full transition-transform ${
                    notifications.promotions ? 'translate-x-7' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
