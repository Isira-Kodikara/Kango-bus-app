import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import {
  ArrowLeft,
  Bus,
  MapPin,
  Clock,
  AlertCircle,
  QrCode,
  CreditCard,
  CheckCircle,
  Users,
  Timer
} from 'lucide-react';

export function TripActive() {
  const navigate = useNavigate();
  const location = useLocation();
  const { bus, destination } = location.state || {};

  const [tripStage, setTripStage] = useState<'scan' | 'payment' | 'onboard' | 'completed'>('scan');
  const [waitRequestSent, setWaitRequestSent] = useState(false);
  const [waitTimer, setWaitTimer] = useState(0);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);

  useEffect(() => {
    if (waitRequestSent && waitTimer > 0) {
      const interval = setInterval(() => {
        setWaitTimer(prev => {
          if (prev <= 1) {
            setWaitRequestSent(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [waitRequestSent, waitTimer]);

  const handleScanComplete = () => {
    setTripStage('payment');
  };

  const handlePaymentComplete = () => {
    setTripStage('onboard');
    // Simulate arrival at destination after 10 seconds
    setTimeout(() => {
      setTripStage('completed');
      setShowRating(true);
    }, 10000);
  };

  const handleWaitRequest = () => {
    setWaitRequestSent(true);
    setWaitTimer(10);
  };

  const handleRatingSubmit = () => {
    navigate('/user-home');
  };

  if (!bus) {
    navigate('/user-home');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-md p-4 flex items-center">
        <button
          onClick={() => navigate('/user-home')}
          className="p-2 hover:bg-gray-100 rounded-full mr-3"
        >
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-gray-800">{bus.id} - {bus.route}</h1>
          <p className="text-sm text-gray-600">To: {destination || 'Your destination'}</p>
        </div>
      </div>

      {/* QR Scan Stage */}
      {tripStage === 'scan' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <QrCode className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">Scan QR Code</h2>
            <p className="text-gray-600 mb-6">
              Scan the QR code on the bus to begin boarding
            </p>

            {/* Mock QR Code */}
            <div className="bg-gray-100 rounded-2xl p-8 mb-6">
              <div className="w-48 h-48 mx-auto bg-white rounded-xl flex items-center justify-center border-4 border-gray-300">
                <div className="grid grid-cols-8 gap-1">
                  {Array.from({ length: 64 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-3 h-3 ${Math.random() > 0.5 ? 'bg-black' : 'bg-white'}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handleScanComplete}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl transition-colors"
            >
              Simulate Scan Complete
            </button>
          </div>
        </div>
      )}

      {/* Payment Stage */}
      {tripStage === 'payment' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CreditCard className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3 text-center">Payment</h2>
            <p className="text-gray-600 mb-6 text-center">
              Complete payment to board the bus
            </p>

            {/* Fare details */}
            <div className="bg-gray-50 rounded-2xl p-4 mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Base Fare</span>
                <span className="font-semibold">Rs. 50.00</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Distance Fee</span>
                <span className="font-semibold">Rs. 30.00</span>
              </div>
              <div className="border-t border-gray-300 my-2" />
              <div className="flex justify-between">
                <span className="font-bold text-gray-800">Total</span>
                <span className="font-bold text-blue-600 text-xl">Rs. 80.00</span>
              </div>
            </div>

            {/* Payment method */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <div className="border-2 border-gray-300 rounded-xl p-4 flex items-center">
                <CreditCard className="w-6 h-6 text-gray-600 mr-3" />
                <div className="flex-1">
                  <div className="font-semibold">Visa •••• 4242</div>
                  <div className="text-sm text-gray-500">Expires 12/25</div>
                </div>
              </div>
            </div>

            <button
              onClick={handlePaymentComplete}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 rounded-xl transition-colors"
            >
              Pay Rs. 80.00
            </button>
          </div>
        </div>
      )}

      {/* Onboard Stage */}
      {tripStage === 'onboard' && (
        <div className="flex-1 flex flex-col">
          {/* Success message */}
          <div className="bg-green-500 text-white p-6 text-center">
            <CheckCircle className="w-12 h-12 mx-auto mb-2" />
            <h2 className="text-xl font-bold">Payment Successful!</h2>
            <p className="text-green-100">You are now onboard</p>
          </div>

          {/* Trip info */}
          <div className="p-6 space-y-4">
            <div className="bg-white rounded-2xl shadow-lg p-5">
              <h3 className="font-semibold text-gray-700 mb-3">Current Trip</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Bus className="w-5 h-5 text-blue-600 mr-3" />
                  <div className="flex-1">
                    <div className="text-sm text-gray-600">Bus Number</div>
                    <div className="font-semibold">{bus.id}</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 text-green-600 mr-3" />
                  <div className="flex-1">
                    <div className="text-sm text-gray-600">Destination</div>
                    <div className="font-semibold">{destination || 'Your destination'}</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-orange-600 mr-3" />
                  <div className="flex-1">
                    <div className="text-sm text-gray-600">Estimated Arrival</div>
                    <div className="font-semibold">15 minutes</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Next stop instruction */}
            <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded-lg">
              <div className="font-semibold text-blue-900 mb-1">Next Stop</div>
              <div className="text-blue-700">Get off at Main Street</div>
              <div className="text-sm text-blue-600 mt-1">3 stops away • 8 minutes</div>
            </div>

            {/* Wait request (if near stop) */}
            {!waitRequestSent && (
              <div className="bg-white rounded-2xl shadow-lg p-5">
                <h3 className="font-semibold text-gray-700 mb-2">Running Late?</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Request the driver to wait for you (minimum 10 seconds)
                </p>
                <button
                  onClick={handleWaitRequest}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center"
                >
                  <Timer className="w-5 h-5 mr-2" />
                  Request Bus to Wait
                </button>
              </div>
            )}

            {/* Wait timer */}
            {waitRequestSent && waitTimer > 0 && (
              <div className="bg-orange-50 border-2 border-orange-400 rounded-2xl p-5 text-center">
                <Timer className="w-12 h-12 text-orange-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-orange-600 mb-1">{waitTimer}s</div>
                <div className="text-orange-700 font-semibold">Bus waiting for you...</div>
              </div>
            )}

            {/* Emergency button */}
            <button
              onClick={() => navigate('/emergency', { state: { bus, destination } })}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-4 rounded-xl transition-colors flex items-center justify-center"
            >
              <AlertCircle className="w-5 h-5 mr-2" />
              Emergency Alert
            </button>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {showRating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Trip Completed!</h2>
              <p className="text-gray-600">How was your experience?</p>
            </div>

            {/* Star rating */}
            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110"
                >
                  <div className={`w-12 h-12 ${rating >= star ? 'text-yellow-400' : 'text-gray-300'}`}>
                    <svg fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>

            {/* Feedback */}
            <textarea
              placeholder="Optional feedback..."
              className="w-full border-2 border-gray-300 rounded-xl p-3 mb-4 focus:border-blue-500 focus:outline-none resize-none"
              rows={3}
            />

            <button
              onClick={handleRatingSubmit}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl transition-colors"
            >
              Submit & Return Home
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
