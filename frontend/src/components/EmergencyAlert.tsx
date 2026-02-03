import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { AlertTriangle, MapPin, Phone, Clock, CheckCircle, X } from 'lucide-react';

export function EmergencyAlert() {
  const navigate = useNavigate();
  const location = useLocation();
  const { bus, destination } = location.state || {};
  const [alertSent, setAlertSent] = useState(false);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!alertSent && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !alertSent) {
      setAlertSent(true);
    }
  }, [countdown, alertSent]);

  return (
    <div className="min-h-screen bg-red-50 flex flex-col">
      {/* Header */}
      <div className="bg-red-600 text-white p-6 text-center">
        <AlertTriangle className="w-16 h-16 mx-auto mb-3" />
        <h1 className="text-2xl font-bold">Emergency Alert</h1>
        <p className="text-red-100 mt-2">Your safety is our priority</p>
      </div>

      <div className="flex-1 p-6">
        {!alertSent ? (
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
              <div className="text-6xl font-bold text-red-600 mb-4">{countdown}</div>
              <p className="text-gray-600 mb-6">
                Sending emergency alert to your saved contacts...
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
                <div 
                  className="bg-red-600 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${((3 - countdown) / 3) * 100}%` }}
                />
              </div>
              <button
                onClick={() => navigate(-1)}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-md mx-auto space-y-4">
            {/* Success message */}
            <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Alert Sent!</h2>
              <p className="text-gray-600">
                Your emergency contact has been notified with your location and trip details.
              </p>
            </div>

            {/* Alert details */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="font-semibold text-gray-700 mb-4">Alert Information</h3>
              
              <div className="space-y-3">
                <div className="flex items-start">
                  <MapPin className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm text-gray-600">Live Location</div>
                    <div className="font-medium">Shared in real-time</div>
                  </div>
                </div>

                {bus && (
                  <div className="flex items-start">
                    <div className="w-5 h-5 bg-blue-600 rounded mr-3 mt-0.5 flex items-center justify-center text-white text-xs font-bold">
                      B
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-gray-600">Bus Number</div>
                      <div className="font-medium">{bus.id} - {bus.route}</div>
                    </div>
                  </div>
                )}

                <div className="flex items-start">
                  <Clock className="w-5 h-5 text-orange-600 mr-3 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm text-gray-600">Alert Time</div>
                    <div className="font-medium">{new Date().toLocaleTimeString()}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency contacts notified */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="font-semibold text-gray-700 mb-4">Contacts Notified</h3>
              
              <div className="space-y-3">
                <div className="flex items-center p-3 bg-green-50 rounded-xl">
                  <Phone className="w-5 h-5 text-green-600 mr-3" />
                  <div className="flex-1">
                    <div className="font-medium">Emergency Contact 1</div>
                    <div className="text-sm text-gray-600">+1 (555) 123-4567</div>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={() => window.location.href = 'tel:911'}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-4 rounded-xl transition-colors flex items-center justify-center"
              >
                <Phone className="w-5 h-5 mr-2" />
                Call Emergency Services (911)
              </button>

              <button
                onClick={() => navigate('/trip-active', { state: { bus, destination } })}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-4 rounded-xl transition-colors"
              >
                Return to Trip
              </button>
            </div>

            {/* Safety tips */}
            <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded-lg">
              <div className="font-semibold text-blue-900 mb-2">Safety Tips</div>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Stay calm and aware of your surroundings</li>
                <li>• Move to a well-lit, public area if possible</li>
                <li>• Keep your phone charged and accessible</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
